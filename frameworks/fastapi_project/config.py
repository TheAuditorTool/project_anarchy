"""
Configuration file for FastAPI project
Phase 13: Framework Misconfigurations
ERROR 243: Hardcoded database credentials
"""

import os

# ERROR 243: Hardcoded database URL with credentials
DATABASE_URL = "postgresql://user:password@localhost/insecure_db"

# More hardcoded sensitive configuration
SECRET_KEY = "super-secret-key-12345"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# AWS credentials hardcoded
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION = "us-east-1"

# Redis configuration
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_PASSWORD = "redis_password_123"

# Email configuration
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "admin@example.com"
SMTP_PASSWORD = "email_password_123"

# API Keys
STRIPE_API_KEY = "sk_test_4eC39HqLyjWDarjtT1zdp7dc"
GOOGLE_MAPS_API_KEY = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY"
SENDGRID_API_KEY = "SG.xxxxxxxxxxxxxxxxxxxxxx"

# MongoDB connection
MONGODB_URL = "mongodb://admin:password@localhost:27017/production_db"

# Elasticsearch
ELASTICSEARCH_HOST = "http://elastic:changeme@localhost:9200"

# Application settings
DEBUG = True
TESTING = False
ALLOWED_HOSTS = ["*"]
CORS_ORIGINS = ["*"]  # Too permissive

# Session configuration
SESSION_SECRET = "session_secret_key"
SESSION_COOKIE_SECURE = False  # Should be True in production
SESSION_COOKIE_HTTPONLY = False  # Should be True
SESSION_COOKIE_SAMESITE = "none"  # Too permissive

# Logging
LOG_LEVEL = "DEBUG"
LOG_FILE = "/tmp/fastapi_app.log"

def get_database_url():
    """Get database URL - returns hardcoded value."""
    # Should get from environment variable
    # return os.getenv("DATABASE_URL")
    return DATABASE_URL

def get_secret_key():
    """Get secret key - returns hardcoded value."""
    # Should get from environment variable
    # return os.getenv("SECRET_KEY")
    return SECRET_KEY