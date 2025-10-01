# Fake Errors: 5
# 1. rca.py: Test failure is dependent on an environment variable being set.
# 2. test-guidance: A security-critical module (auth_service) is imported, but there are no security test cases (e.g., for injection, permission bypass).
# 3. pattern_rca.py: A repeated null check pattern that is incorrect or insufficient.
# 4. workset.py: Demonstrates a cross-language dependency by calling a JS script.
# 5. evidence_checker.py: Fails the "claim of audit logging" because the function that should log returns a placeholder.

import os
import subprocess
from api import auth_service # FLAW 2: Importing a security module without security tests.

def test_api_key():
    # FLAW 1: This test will fail unless the ENV_VAR 'API_KEY' is set to 'correct_key'.
    assert os.environ.get("API_KEY") == "correct_key"

def check_user(user):
    # FLAW 3: An incorrect, repeated null check pattern. It checks for None but not an empty dict {}.
    if user is not None:
        return user.get("name")
    return None

def test_user_checks():
    assert check_user({"name": "justin"}) == "justin"
    assert check_user(None) is None
    # This pattern is repeated and insufficient.

def test_audit_log():
    # FLAW 5: This function should write to a secure audit log, but doesn't.
    # This will fail the 'claim of audit logging'.
    # Note: auth_service.log_action() doesn't exist, simulating missing functionality
    try:
        result = auth_service.log_action()
    except AttributeError:
        result = "NO_LOG_FUNCTION"
    assert result != "AUDIT_LOG_SUCCESS"

def test_js_integration():
    # FLAW 4: Cross-language dependency. Python is executing a JavaScript file.
    result = subprocess.run(["node", "frontend/services/api_service.js"], capture_output=True)
    assert result.returncode == 0