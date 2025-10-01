"""
Security Vulnerabilities
Phase 17: High-Impact Security Flaws
Contains exploitable security vulnerabilities for TheAuditor validation
Errors 266-270
"""

import os
import pickle
import base64
import subprocess
from typing import Any
import sqlite3
import tempfile

# Try to import lxml for XXE vulnerability
try:
    from lxml import etree
except ImportError:
    etree = None
    print("Warning: lxml not installed, XXE test will be limited")

# ERROR 266: SQL Injection vulnerability
def sql_injection(user_input: str) -> list:
    """Direct user input in SQL query - vulnerable to injection."""
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Create test table
    cursor.execute('CREATE TABLE users (id INTEGER, username TEXT, password TEXT)')
    cursor.execute("INSERT INTO users VALUES (1, 'admin', 'secret123')")
    cursor.execute("INSERT INTO users VALUES (2, 'user', 'pass456')")
    
    # VULNERABLE: Direct string interpolation in SQL
    query = f"SELECT * FROM users WHERE username = '{user_input}'"
    print(f"Executing query: {query}")
    
    try:
        cursor.execute(query)
        results = cursor.fetchall()
    except Exception as e:
        results = [f"Error: {e}"]
    
    conn.close()
    return results

# ERROR 267: XXE (XML External Entity) vulnerability
def xxe_vulnerability(xml_string: str) -> str:
    """Parse XML with entities enabled - vulnerable to XXE."""
    if etree is None:
        return "lxml not available for XXE test"
    
    # VULNERABLE: resolve_entities=True allows XXE attacks
    parser = etree.XMLParser(
        resolve_entities=True,  # Dangerous!
        no_network=False,       # Allows network access
        dtd_validation=True,    # Allows DTD processing
        load_dtd=True          # Loads external DTDs
    )
    
    try:
        # Parse potentially malicious XML
        root = etree.fromstring(xml_string.encode(), parser)
        return etree.tostring(root, encoding='unicode')
    except Exception as e:
        return f"XML parsing error: {e}"

# ERROR 268: Path Traversal vulnerability  
def path_traversal(user_filename: str) -> str:
    """Concatenate user input to file path - vulnerable to path traversal."""
    # VULNERABLE: No sanitization of user input
    base_path = "/var/www/uploads/"
    
    # Direct concatenation allows ../../ attacks
    file_path = base_path + user_filename
    print(f"Accessing file: {file_path}")
    
    try:
        # This could read any file on the system!
        with open(file_path, 'r') as f:
            content = f.read()
        return content
    except Exception as e:
        return f"File access error: {e}"

# ERROR 269: Command Injection vulnerability
def command_injection(user_input: str) -> str:
    """Execute shell command with user input - vulnerable to injection."""
    # VULNERABLE: User input directly in shell command
    command = f"echo Hello {user_input}"
    print(f"Executing command: {command}")
    
    try:
        # os.system is dangerous with user input!
        result = os.system(command)
        
        # Also vulnerable: subprocess with shell=True
        output = subprocess.check_output(
            f"echo Processing: {user_input}",
            shell=True,  # Dangerous!
            text=True
        )
        
        return f"Command result: {result}, Output: {output}"
    except Exception as e:
        return f"Command error: {e}"

# ERROR 270: Insecure Deserialization vulnerability
def insecure_deserialization(serialized_data: str) -> Any:
    """Deserialize untrusted data - vulnerable to code execution."""
    try:
        # Decode base64
        decoded = base64.b64decode(serialized_data)
        
        # VULNERABLE: pickle.loads on untrusted data!
        # This can execute arbitrary code!
        obj = pickle.loads(decoded)
        
        return f"Deserialized object: {obj}"
    except Exception as e:
        return f"Deserialization error: {e}"

# Additional security vulnerabilities

def weak_random_token() -> str:
    """Generate predictable random token."""
    import random  # Not cryptographically secure!
    
    # Vulnerable: predictable random
    token = ''.join(str(random.randint(0, 9)) for _ in range(16))
    return token

def hardcoded_credentials() -> dict:
    """Hardcoded credentials in source code."""
    # Security issue: credentials in code
    credentials = {
        'admin_password': 'admin123',
        'api_key': 'sk_live_4242424242424242',
        'database_password': 'root',
        'jwt_secret': 'my-secret-key'
    }
    return credentials

def unsafe_eval(user_expression: str) -> Any:
    """Use eval on user input - code execution vulnerability."""
    try:
        # DANGEROUS: eval executes any Python code!
        result = eval(user_expression)
        return result
    except Exception as e:
        return f"Eval error: {e}"

def unsafe_file_upload(file_content: bytes, filename: str) -> str:
    """Upload file without validation - multiple vulnerabilities."""
    # No file type validation
    # No file size validation
    # No filename sanitization
    
    upload_dir = "/uploads/"
    file_path = upload_dir + filename  # Path traversal possible
    
    try:
        # Write file without any checks
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Execute if it's a script (VERY DANGEROUS!)
        if filename.endswith('.py'):
            exec(open(file_path).read())  # Code execution!
        
        return f"File uploaded: {file_path}"
    except Exception as e:
        return f"Upload error: {e}"

def insecure_redirect(user_url: str) -> str:
    """Open redirect vulnerability."""
    # No validation of redirect URL
    # Could redirect to malicious site
    return f"Redirecting to: {user_url}"

def timing_attack_vulnerable(user_password: str, stored_password: str) -> bool:
    """Password comparison vulnerable to timing attacks."""
    # Vulnerable: early return reveals password length
    if len(user_password) != len(stored_password):
        return False
    
    # Vulnerable: character-by-character comparison
    for i in range(len(user_password)):
        if user_password[i] != stored_password[i]:
            return False  # Early return leaks information
    
    return True

def ssrf_vulnerability(user_url: str) -> str:
    """Server-Side Request Forgery vulnerability."""
    import urllib.request
    
    # No validation of URL - could access internal resources
    try:
        # Vulnerable: fetching arbitrary URLs
        response = urllib.request.urlopen(user_url)
        content = response.read()
        return content.decode()
    except Exception as e:
        return f"SSRF error: {e}"

def demonstrate_vulnerabilities():
    """Demonstrate the security vulnerabilities."""
    print("Demonstrating security vulnerabilities...")
    print("WARNING: These are intentional vulnerabilities for testing!")
    print("=" * 60)
    
    # SQL Injection example
    print("\n1. SQL Injection:")
    safe_input = "admin"
    unsafe_input = "admin' OR '1'='1"
    print(f"   Safe: {sql_injection(safe_input)}")
    print(f"   Unsafe: {sql_injection(unsafe_input)}")
    
    # XXE example
    print("\n2. XXE Vulnerability:")
    safe_xml = "<root><data>Hello</data></root>"
    unsafe_xml = """<?xml version="1.0"?>
    <!DOCTYPE root [
        <!ENTITY xxe SYSTEM "file:///etc/passwd">
    ]>
    <root><data>&xxe;</data></root>"""
    print(f"   Safe: {xxe_vulnerability(safe_xml)}")
    # print(f"   Unsafe: {xxe_vulnerability(unsafe_xml)}")  # Commented for safety
    
    # Path Traversal example
    print("\n3. Path Traversal:")
    safe_file = "document.txt"
    unsafe_file = "../../etc/passwd"
    print(f"   Safe path: {safe_file}")
    print(f"   Unsafe path: {unsafe_file}")
    
    # Command Injection example
    print("\n4. Command Injection:")
    safe_cmd = "World"
    unsafe_cmd = "World; cat /etc/passwd"
    print(f"   Safe: {command_injection(safe_cmd)}")
    # print(f"   Unsafe: {command_injection(unsafe_cmd)}")  # Commented for safety
    
    # Insecure Deserialization example
    print("\n5. Insecure Deserialization:")
    safe_data = base64.b64encode(pickle.dumps("Hello")).decode()
    print(f"   Safe: {insecure_deserialization(safe_data)}")
    
    print("\n" + "=" * 60)
    print("Security vulnerability demonstration complete!")
    print("These vulnerabilities are intentional for TheAuditor testing.")

if __name__ == "__main__":
    demonstrate_vulnerabilities()