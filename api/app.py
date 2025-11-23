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


# =============================================================================
# GATEWAY INTEGRATION ENDPOINTS
# These endpoints wire the gateway to existing vulnerable code in this module
# Creating real cross-boundary taint flows for SAST testing
# =============================================================================

from fastapi import Query, Header, HTTPException
from typing import Optional

# Import existing vulnerable modules to create data flows
from . import db
from . import auth_service
from . import secure_routes

@app.get("/users/search")
async def search_users(username: str = Query(..., description="Username to search")):
    """
    TAINT FLOW: Gateway → This endpoint → db.py SQL Injection

    The username parameter flows directly to db.get_user_by_username()
    which has a SQL injection vulnerability (Error #11 in README.md)

    Attack: GET /users/search?username=admin' OR '1'='1' --
    """
    # TAINT: User input flows to SQL injection vulnerability in db.py:18
    result = db.get_user_by_username(username)
    return {"user": result, "search_term": username}


@app.get("/users/active")
async def get_active_users():
    """
    TAINT FLOW: Gateway → This endpoint → db.py N+1 Query

    Calls db.get_all_active_users() which has N+1 query problem (Error #14)
    """
    # TAINT: Triggers N+1 query vulnerability in db.py:23-30
    users = db.get_all_active_users()
    return {"users": users, "count": len(users) if users else 0}


@app.put("/users/{user_id}/preferences")
async def update_preferences(user_id: int, theme: str = "light", notifications: bool = True):
    """
    TAINT FLOW: Gateway → This endpoint → db.py Missing Transaction

    Calls db.update_user_prefs() which lacks transaction boundary (Error #15)
    """
    prefs = {"theme": theme, "notifications": notifications}
    # TAINT: Flows to missing transaction vulnerability in db.py:32-39
    db.update_user_prefs(user_id, prefs)
    return {"updated": True, "user_id": user_id, "prefs": prefs}


@app.post("/auth/login")
async def login(username: str, password: str):
    """
    TAINT FLOW: Gateway → This endpoint → auth_service.py vulnerabilities

    Connects to auth_service which has:
    - Race condition on USER_CREDITS (Error #70)
    - Thread safety issues (Error #71)
    - Plaintext password storage (Error #73)
    """
    # TAINT: Credentials flow to auth_service.py vulnerabilities
    token = auth_service.create_session(username)
    is_valid = auth_service.is_token_valid(token)
    return {"token": token, "valid": is_valid, "username": username}


@app.post("/auth/credit-check")
async def credit_check(user_id: str, amount: int):
    """
    TAINT FLOW: Gateway → auth_service.py race condition

    Calls deduct_credits() which has check-then-act race condition (Error #70)
    """
    # TAINT: Flows to race condition vulnerability in auth_service.py:33-38
    success = auth_service.deduct_credits(user_id, amount)
    return {"success": success, "user_id": user_id, "amount": amount}


@app.get("/admin/dashboard")
async def admin_dashboard(authorization: Optional[str] = Header(None)):
    """
    TAINT FLOW: Gateway → secure_routes.py auth bypass

    Connects to secure_routes which has:
    - JWT validation skip (Error #95)
    - Insecure cookie (Error #96)
    - CORS misconfiguration (Error #97)
    """
    # TAINT: Authorization header flows to JWT bypass in secure_routes.py:28-31
    if not authorization:
        # VULN: Returning data without proper auth check
        return {"message": "Admin dashboard", "warning": "No auth provided but returning anyway"}

    return {
        "message": "Admin dashboard accessed",
        "auth_header": authorization[:20] + "..." if len(authorization) > 20 else authorization,
        "cors_policy": "*",  # VULN: Exposing misconfiguration
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for gateway connectivity"""
    return {
        "status": "healthy",
        "service": "python-api",
        "endpoints": [
            "/status/{user_id}",
            "/process",
            "/users/search",
            "/users/active",
            "/auth/login",
            "/admin/dashboard",
        ],
        "vulnerabilities_active": True,
    }