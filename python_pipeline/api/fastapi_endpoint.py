"""
FastAPI Endpoints
Contains security vulnerabilities and poor error handling
"""

from fastapi import FastAPI, Depends, HTTPException, Query, Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import logging

from ..db.database import get_db
from ..db.sqlalchemy_models import User, UserProfile, Transaction, Post
from ..processing.tasks import enrich_user_data, batch_process_users
from ..services.data_ingestion import process_csv

app = FastAPI(title="Vulnerable Data Pipeline API")
security = HTTPBearer()
logger = logging.getLogger(__name__)

class UserEnrichRequest(BaseModel):
    user_id: int
    force_refresh: bool = False

class TransactionRequest(BaseModel):
    user_id: int
    amount: float
    transaction_type: str
    description: Optional[str] = None

@app.post("/users/{user_id}/process")
def process_user(
    user_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Process user data with multiple vulnerabilities
    """
    try:
        # Check if user exists (preliminary check)
        user = db.query(User).filter_by(id=user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check for active status (might fail with DB error)
        if not user.is_active:
            raise ValueError("User account is deactivated")
        
        # ERROR 332: Not capturing task_id - makes task impossible to track
        # Should be: task = enrich_user_data.delay(user_id)
        # task_id = task.id
        enrich_user_data.delay(user_id)  # Fire and forget - no way to track!
        
        return {
            "status": "processing",
            "user_id": user_id,
            # Missing: "task_id": task_id
            "message": "User processing started"
        }
        
    except IntegrityError as e:
        # ERROR 331: Leaking internal SQLAlchemy error details
        # Exposes database schema and internal implementation
        raise HTTPException(
            status_code=400,
            detail=f"Database integrity error: {str(e.orig)}"  # Leaking internal details!
        )
    
    except OperationalError as e:
        # ERROR 331 (continued): More internal detail leakage
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}"  # Exposes connection details
        )
    
    except ValueError as e:
        # This one is slightly better but still leaks some info
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        # Generic exception also leaks information
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {type(e).__name__}: {str(e)}"
        )


@app.post("/batch/process")
def batch_process(
    user_ids: List[int],
    db: Session = Depends(get_db)
):
    """
    Batch process users without proper validation
    """
    # No limit on batch size - could cause DoS
    if len(user_ids) > 10000:
        # Still processes even though it's too many
        logger.warning(f"Large batch size: {len(user_ids)}")
    
    # Fire and forget batch job
    batch_process_users.delay(user_ids)  # No task tracking again
    
    return {
        "status": "processing",
        "count": len(user_ids),
        "message": "Batch processing started"
    }


@app.post("/import/csv")
async def import_csv(
    file_path: str,  # Taking file path as string - security risk
    db: Session = Depends(get_db)
):
    """
    Import CSV with path traversal vulnerability
    """
    # No validation on file_path - path traversal possible
    # User could provide: "../../../etc/passwd"
    
    try:
        # Process CSV with eval vulnerability
        data = process_csv(file_path)
        
        # Bulk insert without validation
        for record in data:
            user = User(
                username=record.get('username'),
                email=record.get('email'),
                password_hash=record.get('password', 'default'),  # Terrible default
                is_active=True
            )
            db.add(user)
        
        db.commit()
        
        return {
            "status": "success",
            "imported": len(data),
            "file": file_path  # Leaking file path
        }
        
    except Exception as e:
        db.rollback()
        # Leaking exception details again
        raise HTTPException(
            status_code=400,
            detail=f"Import failed: {str(e)}"
        )


@app.get("/transactions/{user_id}")
def get_user_transactions(
    user_id: int,
    limit: int = Query(100, le=10000),  # Allows huge limits
    db: Session = Depends(get_db)
):
    """
    Get transactions without proper authorization
    """
    # No check if requesting user owns these transactions
    transactions = db.query(Transaction).filter_by(
        user_id=user_id
    ).limit(limit).all()
    
    # Expose all transaction details
    return {
        "user_id": user_id,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "balance_after": t.balance_after,  # Exposing balance
                "type": t.transaction_type,
                "created_at": t.created_at,
                "description": t.description
            }
            for t in transactions
        ]
    }


@app.post("/admin/reset-user/{user_id}")
def reset_user(
    user_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Admin endpoint with weak authorization
    """
    # Weak authorization check
    if credentials.credentials != "admin-token-123":  # Hardcoded token
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Dangerous: Delete all user data without confirmation
        db.query(Transaction).filter_by(user_id=user_id).delete()
        db.query(Post).filter_by(author_id=user_id).delete()
        db.query(UserProfile).filter_by(user_id=user_id).delete()
        
        # Reset user
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            user.is_active = False
            user.email = f"deleted_{user_id}@example.com"
        
        db.commit()
        
        return {"status": "user_reset", "user_id": user_id}
        
    except Exception as e:
        db.rollback()
        # Leaking error details
        raise HTTPException(
            status_code=500,
            detail=f"Reset failed: {str(e)}"
        )


@app.get("/debug/state")
def get_debug_state():
    """
    Debug endpoint that should not exist in production
    """
    from ..processing.tasks import PROCESSED_IDS, FAILED_TASKS, CACHE_DATA
    
    # Exposing internal state
    return {
        "processed_ids": PROCESSED_IDS,
        "failed_tasks": FAILED_TASKS,
        "cache_size": len(CACHE_DATA),
        "cache_keys": list(CACHE_DATA.keys()),
        "server_time": datetime.utcnow()
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check that leaks information
    """
    try:
        # Test database connection
        user_count = db.query(User).count()
        
        return {
            "status": "healthy",
            "database": "connected",
            "user_count": user_count,  # Leaking business metrics
            "version": "1.0.0",
            "environment": "production"  # Should not expose environment
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)  # Leaking error details
        }