# Fake Errors: 5
# 1. lint.py: Clear SQL injection vulnerability using f-string formatting in a query.
# 2. xgraph_builder.py: This file represents a "God Object" by importing from utils, creating a tight coupling.
# 3. risk_scorer.py: `get_user_by_username` is a critical path (auth) but has zero associated tests.
# 4. universal_detector.py: `get_all_active_users` simulates an N+1 query problem, a major performance anti-pattern.
# 5. universal_detector.py: `update_user_prefs` lacks a transaction, risking data corruption on partial failure.

import sqlite3
# FLAW 2: Tightly coupled to utils, contributing to a "God Object" pattern and potential circular dependency.
from . import utils

DATABASE = "anarchy.db"

def get_user_by_username(username):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    # FLAW 1: Classic SQL Injection. User input is directly formatted into the query.
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    # FLAW 3: This critical function is completely untested.
    return cursor.fetchone()

def get_all_active_users():
    # FLAW 4: N+1 query problem. Gets all users, then looks up details one-by-one.
    users = [{"id": 1}, {"id": 2}] # Pretend this is a DB call
    user_details = []
    for user in users:
        # In a real app, this would be another DB call inside a loop.
        user_details.append(get_user_by_username(f"user_{user['id']}"))
    return user_details

def update_user_prefs(user_id, prefs):
    # FLAW 5: Missing transaction. If the second update fails, the first one is not rolled back.
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET theme = ? WHERE id = ?", (prefs['theme'], user_id))
    cursor.execute("UPDATE user_settings SET notifications = ? WHERE user_id = ?", (prefs['notifications'], user_id))
    conn.commit()
    conn.close()