"""
Python Taint Flow Endpoints

These endpoints demonstrate various Python-specific vulnerabilities
for cross-boundary taint analysis from Vite frontend.

TAINT FLOWS:
1. /api/pickle/load - Pickle deserialization RCE
2. /api/yaml/parse - YAML deserialization
3. /api/regex/match - ReDoS
4. /api/eval - Code injection
5. /api/jinja/render - SSTI
6. /api/shell/exec - Command injection
7. /api/ldap/search - LDAP injection
8. /api/xpath/query - XPath injection
"""

import os
import re
import pickle
import base64
import subprocess
from typing import Any, Dict, Optional

# FastAPI imports
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

# Unsafe imports (intentional)
import yaml  # Using unsafe yaml.load
from jinja2 import Template  # Unsafe template rendering

# Try to import lxml for XPath (may not be installed)
try:
    from lxml import etree
    HAS_LXML = True
except ImportError:
    HAS_LXML = False
    import xml.etree.ElementTree as etree

router = APIRouter(prefix="/api", tags=["taint-flows-python"])


# -----------------------------------------------------------------------------
# Request Models
# -----------------------------------------------------------------------------

class PickleRequest(BaseModel):
    data: str  # Base64 encoded pickle data


class YamlRequest(BaseModel):
    content: str


class RegexRequest(BaseModel):
    pattern: str
    text: str


class EvalRequest(BaseModel):
    expression: str


class JinjaRequest(BaseModel):
    template: str
    context: Dict[str, Any] = {}


class ShellRequest(BaseModel):
    command: str


class XPathRequest(BaseModel):
    xpath: str
    xml: str


# -----------------------------------------------------------------------------
# TAINT FLOW #1: Pickle Deserialization RCE
# Source: request.data (base64 pickle)
# Sink: pickle.loads()
# -----------------------------------------------------------------------------
@router.post("/pickle/load")
async def load_pickle(request: PickleRequest):
    """
    CRITICAL: Pickle deserialization allows arbitrary code execution.
    Attacker payload: Base64 encoded pickle with __reduce__ method
    """
    try:
        # TAINT SINK: Deserializing untrusted pickle data
        decoded = base64.b64decode(request.data)
        result = pickle.loads(decoded)  # CRITICAL VULNERABILITY

        return {
            "success": True,
            "result": str(result),
            "type": type(result).__name__
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data_preview": request.data[:50]
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #2: YAML Deserialization
# Source: request.content (YAML string)
# Sink: yaml.load() with unsafe Loader
# -----------------------------------------------------------------------------
@router.post("/yaml/parse")
async def parse_yaml(request: YamlRequest):
    """
    CRITICAL: yaml.load with Loader allows arbitrary code execution.
    Attacker payload: !!python/object/apply:os.system ['id']
    """
    try:
        # TAINT SINK: Using unsafe yaml.Loader
        result = yaml.load(request.content, Loader=yaml.Loader)  # UNSAFE!

        return {
            "success": True,
            "result": result,
            "type": type(result).__name__
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #3: ReDoS (Regular Expression Denial of Service)
# Source: request.pattern (regex pattern)
# Sink: re.compile().match() with catastrophic backtracking
# -----------------------------------------------------------------------------
@router.post("/regex/match")
async def match_regex(request: RegexRequest):
    """
    Vulnerable to ReDoS with patterns like (a+)+$ and input "aaaaaaaaaaaaaaaaaaa!"
    """
    try:
        # TAINT SINK: User controlled regex pattern
        pattern = re.compile(request.pattern)  # Can cause catastrophic backtracking
        match = pattern.match(request.text)

        return {
            "success": True,
            "matched": match is not None,
            "groups": match.groups() if match else None,
            "pattern": request.pattern
        }
    except re.error as e:
        return {
            "success": False,
            "error": f"Invalid regex: {e}",
            "pattern": request.pattern
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #4: Code Injection via eval()
# Source: request.expression (Python code)
# Sink: eval()
# -----------------------------------------------------------------------------
@router.post("/eval")
async def evaluate_expression(request: EvalRequest):
    """
    CRITICAL: Direct code execution via eval().
    Attacker payload: __import__('os').system('id')
    """
    try:
        # TAINT SINK: Evaluating user controlled code
        result = eval(request.expression)  # CRITICAL VULNERABILITY

        return {
            "success": True,
            "result": str(result),
            "expression": request.expression
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "expression": request.expression
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #5: SSTI (Server-Side Template Injection)
# Source: request.template (Jinja2 template)
# Sink: Template().render()
# -----------------------------------------------------------------------------
@router.post("/jinja/render")
async def render_jinja(request: JinjaRequest):
    """
    CRITICAL: Jinja2 template injection.
    Attacker payload: {{ config.__class__.__init__.__globals__['os'].popen('id').read() }}
    """
    try:
        # TAINT SINK: Rendering user controlled template
        template = Template(request.template)  # SSTI vulnerability
        rendered = template.render(**request.context)

        return {
            "success": True,
            "rendered": rendered,
            "template": request.template
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "template": request.template
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #6: Command Injection via subprocess
# Source: request.command (shell command)
# Sink: subprocess.Popen(shell=True)
# -----------------------------------------------------------------------------
@router.post("/shell/exec")
async def execute_shell(request: ShellRequest):
    """
    CRITICAL: Shell command injection.
    Attacker payload: ls; cat /etc/passwd
    """
    try:
        # TAINT SINK: Shell command execution
        process = subprocess.Popen(
            request.command,
            shell=True,  # CRITICAL: shell=True allows command injection
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(timeout=30)

        return {
            "success": True,
            "stdout": stdout,
            "stderr": stderr,
            "returncode": process.returncode,
            "command": request.command
        }
    except subprocess.TimeoutExpired:
        process.kill()
        return {
            "success": False,
            "error": "Command timed out",
            "command": request.command
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "command": request.command
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #7: LDAP Injection
# Source: user query parameter
# Sink: LDAP search filter (simulated)
# -----------------------------------------------------------------------------
@router.get("/ldap/search")
async def ldap_search(user: str = Query(...)):
    """
    LDAP injection via string formatting.
    Attacker payload: user=*)(uid=*))(|(uid=*
    """
    # TAINT SINK: User input in LDAP filter
    ldap_filter = f"(&(objectClass=person)(uid={user}))"  # LDAP injection

    # Simulated LDAP search (real implementation would use python-ldap)
    return {
        "success": True,
        "filter": ldap_filter,
        "message": "LDAP search would be executed with this filter",
        "injection_point": user
    }


# -----------------------------------------------------------------------------
# TAINT FLOW #8: XPath Injection
# Source: request.xpath (XPath expression)
# Sink: etree.xpath()
# -----------------------------------------------------------------------------
@router.post("/xpath/query")
async def xpath_query(request: XPathRequest):
    """
    XPath injection via user controlled query.
    Attacker payload: xpath=' or '1'='1
    """
    try:
        # Parse XML
        if HAS_LXML:
            tree = etree.fromstring(request.xml.encode())
        else:
            tree = etree.fromstring(request.xml)

        # TAINT SINK: User controlled XPath expression
        if HAS_LXML:
            results = tree.xpath(request.xpath)  # XPath injection
        else:
            results = tree.findall(request.xpath)

        return {
            "success": True,
            "results": [etree.tostring(r, encoding='unicode') if hasattr(r, 'tag') else str(r) for r in results],
            "xpath": request.xpath,
            "count": len(results)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "xpath": request.xpath
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #9: os.path.join path traversal
# Source: filename query parameter
# Sink: os.path.join() + open()
# -----------------------------------------------------------------------------
@router.get("/files/read")
async def read_file(filename: str = Query(...)):
    """
    Path traversal via os.path.join.
    Note: os.path.join ignores previous parts if a component is absolute!
    Attacker payload: filename=/etc/passwd
    """
    base_dir = "/var/uploads"

    # TAINT SINK: os.path.join with user input
    # If filename starts with /, it becomes absolute!
    file_path = os.path.join(base_dir, filename)

    try:
        with open(file_path, 'r') as f:
            content = f.read()

        return {
            "success": True,
            "content": content,
            "path": file_path,
            "size": len(content)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "attempted_path": file_path
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #10: SQL Injection via string formatting
# Source: various query parameters
# Sink: cursor.execute() with f-string
# -----------------------------------------------------------------------------
@router.get("/sql/query")
async def sql_query(
    table: str = Query(...),
    column: str = Query(...),
    value: str = Query(...)
):
    """
    SQL injection via string formatting.
    Attacker payload: value=' OR '1'='1
    """
    # TAINT SINK: SQL query with string interpolation
    query = f"SELECT * FROM {table} WHERE {column} = '{value}'"

    return {
        "success": True,
        "query": query,
        "message": "Query would be executed (simulated)",
        "injection_points": {
            "table": table,
            "column": column,
            "value": value
        }
    }
