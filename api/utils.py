# Fake Errors: 5
# 1. xgraph_builder.py: Circular dependency with db.py creating a god object pattern.
# 2. ast_verify.py: Deeply nested code (>4 levels) violating complexity rules.
# 3. universal_detector.py: Using global mutable state that can cause race conditions.
# 4. flow_analyzer.py: Exception raised but never caught, causing unhandled errors.
# 5. lint.py: Using exec() with user input, creating code injection vulnerability.

# FLAW 1: Circular import creating god object pattern
from . import db

# ADDED FOR FLAW: Create a circular import dependency. app imports utils, and utils now imports app.
from . import app

# FLAW 3: Global mutable state
cache = {}

def sanitize_input(user_input):
    # FLAW 2: Deeply nested code (>4 levels)
    if user_input:
        if isinstance(user_input, str):
            if len(user_input) > 0:
                if user_input[0] != ' ':
                    if user_input[-1] != ' ':
                        return user_input.strip()
    return ""

def execute_custom_query(query_string):
    # FLAW 5: Using exec() with potentially user-controlled input
    exec(f"result = {query_string}")
    return locals().get('result')

def validate_user(username):
    # Uses the circular import
    user = db.get_user_by_username(username)
    if not user:
        # FLAW 4: Raises exception without proper handling
        raise ValueError(f"User {username} not found")
    # Modifies global state
    cache[username] = user
    return user