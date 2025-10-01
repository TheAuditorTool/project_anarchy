"""
Database Configuration
Basic database setup for the pipeline
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os

# Hardcoded database URL (security issue)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://admin:password123@localhost:5432/pipeline_db"
)

# Create engine with poor configuration
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,  # Too small for production
    max_overflow=0,  # No overflow connections
    pool_timeout=30,
    pool_recycle=1800,
    echo=True  # Logs all SQL queries (performance issue)
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """
    Get database session for FastAPI dependency injection
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_session() -> Session:
    """
    Get database session for Celery tasks
    """
    return SessionLocal()

# Initialize database
def init_db():
    """
    Initialize database tables
    """
    from .sqlalchemy_models import Base
    Base.metadata.create_all(bind=engine)