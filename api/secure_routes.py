# Fake Errors: 5 (Scenario: Authentication Bypass)
# 1. Auth Bypass RCA: JWT validation is skipped for a critical admin route.
# 2. Auth Bypass RCA: A cookie is set without the 'Secure' or 'HttpOnly' flags.
# 3. Auth Bypass RCA: CORS is misconfigured to allow any origin.
# 4. Auth Bypass RCA: Rate limiting is not applied to the login endpoint.
# 5. aud suggest-fixes: The response is missing CORS headers, which `suggest-fixes` should identify.

from fastapi import FastAPI, Response

app = FastAPI()

# FLAW 3 & 5: CORS misconfiguration and missing headers.
@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    # This allows any origin, a major security flaw.
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.post("/login")
def login(response: Response):
    # FLAW 4: This critical auth endpoint has no rate limiting.
    # FLAW 2: Cookie is not HttpOnly or Secure.
    response.set_cookie(key="session_id", value="insecure_session_123")
    return {"message": "Logged in"}

@app.get("/admin/dashboard")
def get_admin_dashboard(token: str = None):
    # FLAW 1: Critical endpoint should require and validate a JWT, but proceeds if token is missing.
    if token is None:
        return {"data": "Welcome, anonymous admin!"}
    # JWT validation logic would go here...
    return {"data": "Admin data"}