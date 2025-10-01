# Fake Errors: 5
# 1. universal_detector.py: Test that doesn't actually test anything (no assertions).
# 2. risk_scorer.py: Test modifies global state without cleanup.
# 3. lint.py: Hardcoded file paths that won't work in different environments.
# 4. flow_analyzer.py: Test depends on external network service without mocking.
# 5. ast_verify.py: Test function with duplicate name overwriting previous test.

import os
import sys
import requests

# FLAW 3: Hardcoded absolute path that won't work in different environments
sys.path.append('/home/user/projects/anarchy')

# FLAW 2: Global state modification without cleanup
test_counter = 0

def test_user_creation():
    # FLAW 1: Test without any assertions - doesn't actually test anything
    user = {"name": "test", "id": 1}
    print("User created")

def test_api_call():
    # FLAW 4: Test depends on external network service without mocking
    response = requests.get("https://api.github.com/users/test")
    assert response.status_code == 200
    global test_counter
    test_counter += 1

# FLAW 5: Duplicate test name overwrites the previous function
def test_user_creation():
    # This overwrites the first test_user_creation function
    assert True == True