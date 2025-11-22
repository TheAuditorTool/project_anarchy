"""
FastAPI Taint Flow Routes

These routes demonstrate cross-boundary taint flows from Vue frontend.
Each route has a clear Source → Sink path for taint analysis testing.

TAINT FLOWS:
1. /items/search - SQL Injection (query → SQL)
2. /upload/ - Path Traversal (file_path → open())
3. /items/import-xml - XXE (xml_data → lxml parser)
4. /items/{id}/email-preview - SSTI (template → Jinja2)
5. /eval - Code Injection (code → eval)
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Any
import os
import subprocess
from xml.etree import ElementTree as ET

# Intentionally using vulnerable XML parser
try:
    from lxml import etree
    HAS_LXML = True
except ImportError:
    HAS_LXML = False

router = APIRouter()


class FileUpload(BaseModel):
    file_path: str
    content: str


class TemplateRequest(BaseModel):
    template: str


class EvalRequest(BaseModel):
    code: str
    context: Optional[dict] = None


class CommandRequest(BaseModel):
    command: str
    args: Optional[list] = None


# -----------------------------------------------------------------------------
# TAINT FLOW #1: SQL Injection
# Source: query parameter
# Sink: SQL query execution
# -----------------------------------------------------------------------------
@router.get("/items/search-vulnerable")
async def search_items_vulnerable(query: str, sort_by: str = "name"):
    """
    Vulnerable search endpoint with SQL injection.
    Vue frontend: ProductSearch.vue → productApi.searchProducts()
    """
    # TAINT: User input directly concatenated into SQL
    sql_query = f"SELECT * FROM items WHERE name LIKE '%{query}%' ORDER BY {sort_by}"

    return {
        "query": sql_query,  # Leaking the query
        "message": "Query would be executed (simulated)",
        "injection_point": f"query='{query}', sort_by='{sort_by}'"
    }


# -----------------------------------------------------------------------------
# TAINT FLOW #2: Path Traversal / Arbitrary File Write
# Source: file_path in request body
# Sink: open(file_path, 'w')
# -----------------------------------------------------------------------------
@router.post("/upload-vulnerable/")
async def upload_vulnerable(upload: FileUpload):
    """
    Vulnerable file upload with path traversal.
    Vue frontend: FileUploader.vue → productApi.uploadProductImage()
    """
    # TAINT: User controlled file path without sanitization
    # Attacker payload: "../../../etc/cron.d/malicious"
    file_path = upload.file_path

    # No validation that path is within allowed directory
    try:
        # This would write to arbitrary locations
        with open(file_path, 'w') as f:
            f.write(upload.content)

        return {
            "success": True,
            "message": f"File written to {file_path}",
            "path": file_path,
            "size": len(upload.content)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "attempted_path": file_path
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #3: XXE (XML External Entity)
# Source: XML body
# Sink: lxml.etree.parse() with resolve_entities=True
# -----------------------------------------------------------------------------
@router.post("/items/import-xml")
async def import_xml(request: Request):
    """
    Vulnerable XML import with XXE.
    Vue frontend: FileUploader.vue → productApi.importProductsXml()
    """
    xml_body = await request.body()

    # TAINT: Parsing XML with external entities enabled
    # Attacker payload:
    # <?xml version="1.0"?>
    # <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    # <products><name>&xxe;</name></products>

    if HAS_LXML:
        # Vulnerable: resolve_entities=True allows XXE
        parser = etree.XMLParser(resolve_entities=True, no_network=False)
        try:
            tree = etree.fromstring(xml_body, parser)
            return {
                "success": True,
                "parsed": etree.tostring(tree, encoding='unicode'),
                "warning": "XXE vulnerability - external entities resolved"
            }
        except Exception as e:
            return {"error": str(e)}
    else:
        # Fallback to stdlib (also vulnerable in older Python)
        try:
            tree = ET.fromstring(xml_body)
            return {
                "success": True,
                "parsed": ET.tostring(tree, encoding='unicode')
            }
        except Exception as e:
            return {"error": str(e)}


# -----------------------------------------------------------------------------
# TAINT FLOW #4: SSTI (Server-Side Template Injection)
# Source: template in request body
# Sink: Jinja2 Template().render()
# -----------------------------------------------------------------------------
@router.post("/items/{item_id}/email-preview")
async def email_preview(item_id: str, template_req: TemplateRequest):
    """
    Vulnerable template rendering with SSTI.
    Vue frontend: TemplateEditor.vue → productApi.renderProductEmail()
    """
    from jinja2 import Template

    # Simulated product data
    product = {
        "id": item_id,
        "name": "Test Product",
        "price": 29.99,
        "description": "A great product"
    }

    shop = {
        "name": "Anarchy Shop",
        "url": "http://localhost:8000"
    }

    # TAINT: User controlled template string rendered by Jinja2
    # Attacker payload: {{ config.items() }} or {{ self.__init__.__globals__ }}
    try:
        template = Template(template_req.template)
        rendered = template.render(product=product, shop=shop)

        return {
            "success": True,
            "rendered": rendered,
            "template_length": len(template_req.template)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "template": template_req.template  # Leaking template on error
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #5: Code Injection via eval()
# Source: code in request body
# Sink: eval()
# -----------------------------------------------------------------------------
@router.post("/eval")
async def dangerous_eval(eval_req: EvalRequest):
    """
    Extremely dangerous eval endpoint.
    """
    # TAINT: Directly executing user controlled code
    try:
        result = eval(eval_req.code, {"__builtins__": __builtins__}, eval_req.context or {})
        return {
            "success": True,
            "result": str(result),
            "code": eval_req.code
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "code": eval_req.code
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #6: Command Injection
# Source: command in request body
# Sink: subprocess.run() with shell=True
# -----------------------------------------------------------------------------
@router.post("/system/exec")
async def exec_command(cmd_req: CommandRequest):
    """
    Vulnerable command execution endpoint.
    """
    # TAINT: User controlled command executed in shell
    # Attacker payload: "ls; cat /etc/passwd"
    command = cmd_req.command
    if cmd_req.args:
        command = f"{command} {' '.join(cmd_req.args)}"

    try:
        result = subprocess.run(
            command,
            shell=True,  # Vulnerable: shell=True allows command injection
            capture_output=True,
            text=True,
            timeout=30
        )

        return {
            "success": True,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "command": command
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "command": command
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #7: SSRF
# Source: url in query parameter
# Sink: requests.get()
# -----------------------------------------------------------------------------
@router.get("/fetch-url")
async def fetch_url(url: str):
    """
    Vulnerable URL fetcher - SSRF.
    """
    import httpx

    # TAINT: User controlled URL for server-side request
    # Attacker payload: http://169.254.169.254/latest/meta-data/
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)

        return {
            "success": True,
            "status_code": response.status_code,
            "content": response.text[:1000],  # First 1000 chars
            "url": url
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "url": url
        }


# -----------------------------------------------------------------------------
# TAINT FLOW #8: Arbitrary File Read
# Source: filename in path parameter
# Sink: open().read()
# -----------------------------------------------------------------------------
@router.get("/files/{filename:path}")
async def read_file(filename: str):
    """
    Vulnerable file read endpoint.
    """
    # TAINT: User controlled filename
    # Attacker payload: ../../etc/passwd
    try:
        with open(filename, 'r') as f:
            content = f.read()

        return {
            "success": True,
            "filename": filename,
            "content": content,
            "size": len(content)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "filename": filename
        }
