# Fake Errors: 5 (Scenario: Data Corruption & Performance Degradation)
# 1. Performance Degradation RCA: A database query is performed against a column with no index.
# 2. Data Corruption RCA: The database transaction uses an incorrect isolation level (READ UNCOMMITTED).
# 3. Data Corruption RCA: A critical 'email' column is missing a UNIQUE constraint in its definition.
# 4. Performance Degradation RCA: API endpoint serves a large payload without pagination.
# 5. aud workset --diff: This file introduces a change that breaks backward compatibility (e.g., changes a key name).

import sqlite3

def setup_database(conn):
    # FLAW 109 (Data Corruption): 'email' column should have a UNIQUE constraint.
    conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, name TEXT)")
    # FLAW 107 (Performance Degradation): The 'name' column is frequently searched but has no index.
    # An explicit CREATE INDEX statement is missing.

def get_all_users():
    # FLAW 110 (Performance Degradation): Returns all records at once with no pagination.
    return "a_very_large_json_payload_of_all_users"

def get_user_and_update(conn, user_id):
    # FLAW 108 (Data Corruption): READ UNCOMMITTED allows reading dirty data from other transactions.
    conn.isolation_level = 'READ UNCOMMITTED'
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    # ... logic that is vulnerable to dirty reads ...

def get_user_data_v1(user_id):
    # FLAW 111 (Backward Compatibility): A later change might rename 'user_name' to 'fullName', breaking clients.
    return {"user_id": user_id, "user_name": "test"}