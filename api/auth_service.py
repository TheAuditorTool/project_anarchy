# Fake Errors: 5
# 1. flow_analyzer.py: A classic race condition where a check-then-act operation is not atomic.
# 2. flow_analyzer.py: A thread safety violation using a shared global dictionary without a lock.
# 3. ast_verify.py: A function is missing required type annotations.
# 4. evidence_checker.py: Fails the "claim of encryption" by storing passwords in plaintext.
# 5. ml.py: Demonstrates an evolving bug pattern. A "fixed" function exists alongside a vulnerable legacy one.

import threading

# FLAW 2: Shared state modified without a lock, creating a thread safety violation.
SESSION_TOKENS = {}

# FLAW 3: Missing type annotations for parameters and return value.
def is_token_valid(token, user_id):
    return SESSION_TOKENS.get(user_id) == token

# FLAW 4: Stores password in plaintext, violating any "claim of encryption".
def store_password(username: str, password: str):
    # In a real app, this would be a database. We simulate it here.
    print(f"Storing plaintext password for {username}")

# FLAW 5: An "evolving bug pattern" for ML detection. The new function is better, but the old one remains.
def legacy_change_password(user, new_pass): # Vulnerable version
    store_password(user, new_pass)

def change_password_v2(user: str, new_pass: str): # "Fixed" version
    # Some hashing logic would go here
    store_password(user, "hashed_"+new_pass)

# FLAW 1: Race condition. Two requests can check credits, both see >0, then both decrement, resulting in negative credits.
USER_CREDITS = {"test_user": 1}
def use_credit(username: str):
    if USER_CREDITS.get(username, 0) > 0:
        # In a concurrent environment, another thread can execute up to here.
        USER_CREDITS[username] -= 1
        return True
    return False