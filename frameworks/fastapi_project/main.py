"""
FastAPI main application file
Phase 13: Framework Misconfigurations
Errors 241-242: No CORS middleware, No rate limiting
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

# ERROR 241: No CORS middleware configured
# Should have: from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(
    title="FastAPI Misconfigured Project",
    version="1.0.0",
    debug=True,  # Debug mode enabled in production
    docs_url="/docs",  # Swagger UI exposed
    redoc_url="/redoc",  # ReDoc exposed
)

# ERROR 242: No rate limiting implemented
# Should have rate limiting middleware or decorator

# Database models without validation
class User(BaseModel):
    id: Optional[int] = None
    username: str
    password: str  # Storing password in plain text
    email: str
    is_admin: bool = False

class Item(BaseModel):
    id: Optional[int] = None
    name: str
    price: float
    owner_id: int

# In-memory storage (not thread-safe)
users_db = []
items_db = []

# Root endpoint exposing system information
@app.get("/")
async def root():
    """Root endpoint with sensitive information exposed."""
    return {
        "message": "FastAPI Misconfigured App",
        "version": "1.0.0",
        "python_version": "3.9.7",
        "server": "uvicorn",
        "database": "postgresql://localhost/prod_db",
        "environment": "production"
    }

# User endpoints without authentication
@app.post("/users/")
async def create_user(user: User):
    """Create user without any validation or authentication."""
    user.id = len(users_db) + 1
    users_db.append(user)
    return user  # Returns password in response

@app.get("/users/")
async def get_users():
    """Get all users including passwords."""
    return users_db

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    """Get user by ID without authorization check."""
    for user in users_db:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404, detail="User not found")

# Admin endpoint without proper authorization
@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """Delete user without authorization."""
    global users_db
    users_db = [u for u in users_db if u.id != user_id]
    return {"message": "User deleted"}

# Item endpoints with SQL-injection-like patterns
@app.get("/items/search")
async def search_items(query: str):
    """Search items with unsafe query parameter."""
    # Simulating unsafe query construction
    sql_query = f"SELECT * FROM items WHERE name LIKE '%{query}%'"
    return {
        "query": sql_query,
        "results": [item for item in items_db if query.lower() in item.name.lower()]
    }

@app.post("/items/")
async def create_item(item: Item):
    """Create item without validation."""
    item.id = len(items_db) + 1
    items_db.append(item)
    return item

# File upload without validation
@app.post("/upload/")
async def upload_file(file_path: str, content: str):
    """Unsafe file upload allowing arbitrary paths."""
    # This would write to arbitrary locations
    with open(file_path, 'w') as f:
        f.write(content)
    return {"message": f"File saved to {file_path}"}

# Debug endpoint exposing internal state
@app.get("/debug/")
async def debug_info():
    """Debug endpoint that should not exist in production."""
    return {
        "users_count": len(users_db),
        "items_count": len(items_db),
        "memory_address": hex(id(app)),
        "all_endpoints": [route.path for route in app.routes],
    }

# Health check exposing too much information
@app.get("/health/")
async def health_check():
    """Health check with excessive information."""
    import os
    import sys
    return {
        "status": "healthy",
        "pid": os.getpid(),
        "python_path": sys.path,
        "environment_variables": dict(os.environ),
    }

# Exception handler that leaks stack traces
@app.exception_handler(Exception)
async def exception_handler(request, exc):
    """Exception handler that exposes full stack trace."""
    import traceback
    return {
        "error": str(exc),
        "traceback": traceback.format_exc(),
        "request_url": str(request.url),
        "request_headers": dict(request.headers),
    }

if __name__ == "__main__":
    # Running with reload in production
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Listening on all interfaces
        port=8000,
        reload=True,  # Auto-reload in production
        log_level="debug",  # Debug logging in production
    )