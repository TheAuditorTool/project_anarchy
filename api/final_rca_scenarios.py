# Fake Errors: 8 (Completing all 5 RCA Scenarios)
# 1. Data Corruption RCA: A race condition in a concurrent write operation.
# 2. Data Corruption RCA: A partial write occurs without a rollback mechanism.
# 3. Performance Degradation RCA: A synchronous operation (time.sleep) blocks an async handler.
# 4. Performance Degradation RCA: A critical data path is missing a caching layer.
# 5. Auth Bypass RCA: A session fixation vulnerability where a user can specify their own session ID.
# 6. DB Connection Exhaustion RCA: A connection is acquired from a pool but never released.
# 7. Memory Leak RCA: A direct circular reference between two objects that can foil basic garbage collectors.
# 8. Memory Leak RCA: A placeholder for where a weak reference should have been used.

import time
import threading

# FLAW 147: Race Condition. If two threads call this simultaneously, they can overwrite the balance.
BALANCE = {'amount': 100}
def concurrent_unsafe_write(amount):
    current = BALANCE['amount']
    time.sleep(0.01) # Yield control to another thread
    BALANCE['amount'] = current - amount

# FLAW 151: Session Fixation. The client can dictate their session ID.
def login_with_session_fixation(request, provided_id):
    request.session_id = provided_id # Vulnerable: Should generate a new ID on login.

# FLAW 152: Connection not released.
def get_connection_and_forget():
    conn = get_connection_from_pool()
    # conn.release() is never called, exhausting the pool.

# FLAW 153 & 154: Memory Leak via Circular Reference & missing Weak Reference
class NodeA:
    def __init__(self):
        self.child = None # Should be a weakref.ref(self.child)
class NodeB:
    pass
node_a = NodeA()
node_b = NodeB()
node_a.child = node_b
node_b.parent = node_a # Creates a permanent circular reference.

class Operations:
    # FLAW 148: Partial write without rollback.
    def do_partial_write(db_conn):
        db_conn.execute("UPDATE accounts SET status = 'pending'")
        # If an error happens here, the status remains 'pending' incorrectly.
        raise ValueError("Something went wrong mid-transaction!")
        # No try/except/finally block to rollback the change.

    # FLAW 149: Sync operation in async context.
    async def get_report(self):
        # This blocks the entire event loop.
        time.sleep(10) 
        return "Report data"

    # FLAW 150: Missing caching layer.
    def get_user_permissions(user_id):
        # This makes a slow DB call every single time. A cache is needed.
        return "permissions_from_db"