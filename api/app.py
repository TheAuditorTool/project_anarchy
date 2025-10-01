# Fake Errors: 5
# 1. lint.py: Hardcoded API key exposed directly in the source code.
# 2. ast_verify.py: Function `get_user_details` has >7 parameters, violating complexity rules.
# 3. flow_analyzer.py: `process_data_async` calls an async function `notify_system` without the 'await' keyword.
# 4. universal_detector.py: A file is opened for logging but never closed, creating a resource leak.
# 5. rca.py: A null pointer dereference will occur if a user is not found in `get_user_status`.

from fastapi import FastAPI
import asyncio

app = FastAPI()
API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxx_very_secret_key" # FLAW 1

async def notify_system(user_id: int):
    await asyncio.sleep(1)
    print(f"Notified for user {user_id}")

@app.get("/status/{user_id}")
async def get_user_status(user_id: int):
    user = {"id": user_id, "status": None} # Assume db lookup returns this
    # FLAW 5: Null pointer dereference. If status is None, .lower() raises an exception.
    return {"status": user.get("status").lower()}

@app.post("/process")
async def process_data_async(user_id: int):
    # FLAW 3: Missing await keyword for an async function call.
    notify_system(user_id)
    # FLAW 4: Resource leak. File is opened but never explicitly closed.
    log_file = open("activity.log", "a")
    log_file.write(f"Processed user {user_id}\n")
    return {"message": "processing"}

# FLAW 2: Function with excessive parameters.
def get_user_details(id, name, email, role, last_login, created_at, profile_pic, timezone):
    # ... logic ...
    return {"id": id, "name": name}

# ADDED FOR FLAW 125 & 126
import time

@app.post("/sync-in-async")
async def sync_in_async_route():
    # FLAW 125: Performing a synchronous, blocking I/O operation in an async context.
    time.sleep(5) 
    return {"status": "done"}
    # FLAW 126: This code is unreachable after the return statement.
    print("This message will never be printed.")