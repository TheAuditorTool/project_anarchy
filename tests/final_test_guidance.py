# Fake Errors: 4 (Scenario: aud test-guidance)
# 1. aud test-guidance: Missing edge case tests (e.g., divide by zero, empty inputs).
# 2. aud test-guidance: An untested integration point with an external service.
# 3. aud test-guidance: A slow function that lacks a performance test.
# 4. aud test-guidance: An uncovered error path in a try/except block.

import time
from api import external_service

def divide(a, b):
    return a / b

# FLAW 155: Test for divide() is missing edge cases for b=0 or non-numeric inputs.

def process_with_external_api(data):
    # FLAW 156: This function calls an external service, but no test asserts the outcome
    # or mocks the service, making it an untested integration point.
    response = external_service.post(data)
    return response.status_code == 200

def very_slow_function():
    # FLAW 157: This function is computationally expensive but has no performance test to benchmark it.
    time.sleep(2)
    return True

def handle_data(data):
    try:
        return complex_parsing(data)
    except TypeError:
        # FLAW 158: This error path is never triggered by any test case.
        return "default"