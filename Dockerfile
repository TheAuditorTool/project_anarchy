# Flawed Dockerfile for Production Deployment
# Contains multiple security and configuration issues

# ERROR 349: Running as root user (major security risk)
FROM python:3.11-slim

# ERROR 350: Not pinning base image version
# Should be: FROM python:3.11.8-slim-bookworm

# No USER instruction - continues running as root throughout

# Set working directory
WORKDIR /app

# ERROR 351: Copying everything including secrets and unnecessary files
COPY . .
# Should use .dockerignore and copy only needed files
# This includes .env, .git, __pycache__, node_modules, etc.

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    curl \
    git \
    vim \
    netcat \
    telnet \
    && rm -rf /var/lib/apt/lists/*
# Installing unnecessary debugging tools in production

# ERROR 352: Installing packages without version pinning
RUN pip install --no-cache-dir -r requirements.txt
# Should use pip install --no-cache-dir -r requirements.lock

# Additional problematic installations
RUN pip install debugpy  # Debug tools in production!
RUN pip install flask-debugtoolbar  # Debug toolbar!

# ERROR 353: Hardcoded secrets in Dockerfile
ENV DATABASE_URL="postgresql://admin:SuperSecret123!@db:5432/production"
ENV API_KEY="sk-proj-abc123xyz789_this_is_very_secret"
ENV JWT_SECRET="my-super-secret-jwt-key-that-should-not-be-here"
ENV STRIPE_API_KEY="sk_live_abcdefghijklmnopqrstuvwxyz123456"
ENV AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Setting debug mode in production
ENV FLASK_ENV=development
ENV DEBUG=true
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create directories with wrong permissions
RUN mkdir -p /app/uploads /app/logs /app/temp
RUN chmod 777 /app/uploads  # World-writable!
RUN chmod 777 /app/logs     # World-writable!
RUN chmod 777 /app/temp     # World-writable!

# Copy configuration files
COPY config/production.ini /app/config/
RUN chmod 644 /app/config/production.ini  # Config readable by all

# Expose multiple unnecessary ports
EXPOSE 22    # SSH - shouldn't be exposed
EXPOSE 5000  # Flask default
EXPOSE 8000  # Alternative web
EXPOSE 9229  # Node.js debugger
EXPOSE 5432  # PostgreSQL
EXPOSE 6379  # Redis
EXPOSE 3306  # MySQL

# Health check that always passes
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD echo "OK" || exit 0
# Should actually check if the service is running

# No signal handling for graceful shutdown
# Missing STOPSIGNAL instruction

# Entry point allows command injection
ENTRYPOINT ["sh", "-c", "python app.py $@"]
# Should use exec form: ENTRYPOINT ["python", "app.py"]

# No multi-stage build - shipping build tools in production
# No layer caching optimization
# No security scanning
# No non-root user
# No read-only filesystem
# No resource limits

# Additional issues:
# - No .dockerignore file to exclude sensitive files
# - No use of BuildKit secrets for sensitive data
# - Mixing concerns (web server, database clients, debug tools)
# - No proper logging configuration
# - No process management (should use supervisord or similar)