# Fake Errors: 5
# 1. universal_detector.py: Retry logic is implemented with a simple loop, lacking any backoff strategy.
# 2. universal_detector.py: Simulates missing database connection pooling.
# 3. pattern_rca.py: Shows a pattern of missing error propagation. The exception is caught and ignored.
# 4. aud index --exclude-self: Contains git merge conflict markers that should have been resolved.
# 5. risk_scorer.py: This file represents a dependency on a package with no clear alternatives (e.g., a proprietary protocol library).

import time
# FLAW 5: Imaginary proprietary library with no alternative.
import acme_corp_protocol

def connect_to_db():
    # FLAW 2: Simulates creating a new connection every time, no pooling.
    print("Creating new DB connection...")
    return True

def process_data(data):
    for i in range(3): # FLAW 1: Retry logic without any exponential backoff or delay.
        try:
            connection = connect_to_db()
            acme_corp_protocol.send(data)
            return True
        except Exception as e:
            # FLAW 3: Missing error propagation. The error is caught but never raised or returned.
            print(f"Attempt {i+1} failed.")
    return False

# FLAW 4: Git merge conflict markers below.
<<<<<<< HEAD
def calculate_metrics(data):
    return len(data) * 10
=======
def calculate_metrics(data, factor):
    return len(data) * factor
>>>>>>> feature-branch