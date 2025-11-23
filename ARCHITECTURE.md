# Project Anarchy - Unified Architecture

This document describes the connected architecture of Project Anarchy, a test repository for code auditing tools containing **403 intentional errors** across multiple services with **real cross-boundary data flows**.

## Manifest Detection Entry Points

The root directory contains workspace manifests for all three language ecosystems:

```
project_anarchy/
├── package.json        # Node.js workspace root
│   └── workspaces: ["gateway", "frontend", "full_stack_node/*"]
│
├── pyproject.toml      # Python workspace root (Poetry)
│   └── packages: ["api", "python_pipeline", "scripts", "security", ...]
│
├── Cargo.toml          # Rust workspace root
│   └── members: ["rust_backend", "anarchy_commerce/services/*"]
│
└── requirements.txt    # Python dependencies with editable installs
    └── -e ./api, -e ./python_pipeline, -e ./scripts
```

### How Manifest Detection Should Work

```
1. Find root: project_anarchy/
2. Detect workspaces:
   - package.json    → workspaces: ["gateway", "frontend", ...]
   - pyproject.toml  → packages: ["api", "python_pipeline", ...]
   - Cargo.toml      → members: ["rust_backend", ...]
3. Index each workspace member
4. Build cross-language dependency graph
5. Trace taint flows across language boundaries
```

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT ANARCHY                                        │
│                    Unified Polyglot Test Repository                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    ┌──────────────────┐                                                          │
│    │   frontend/      │  Browser/Client                                          │
│    │   (JavaScript)   │  Port: 3000                                              │
│    │   5 errors       │                                                          │
│    └────────┬─────────┘                                                          │
│             │                                                                    │
│             │ HTTP (fetch)                                                       │
│             ▼                                                                    │
│    ┌──────────────────┐                                                          │
│    │    gateway/      │  API Gateway (Node.js/Express)                           │
│    │    Port: 4000    │  Routes requests to backend services                     │
│    │    10+ vulns     │                                                          │
│    └────────┬─────────┘                                                          │
│             │                                                                    │
│    ┌────────┼────────────────────┬─────────────────────┐                        │
│    │        │                    │                     │                        │
│    ▼        ▼                    ▼                     ▼                        │
│ ┌─────────────────┐  ┌─────────────────────┐  ┌──────────────────┐             │
│ │     api/        │  │  python_pipeline/   │  │  rust_backend/   │             │
│ │  (FastAPI)      │  │     (FastAPI)       │  │    (Actix)       │             │
│ │  Port: 8000     │  │    Port: 8001       │  │   Port: 8080     │             │
│ │  ~50 errors     │  │    ~11 errors       │  │   ~15 errors     │             │
│ └─────────────────┘  └─────────────────────┘  └──────────────────┘             │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ISOLATED TEST SCENARIOS (Not connected - for specific testing)                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐     │
│  │ frameworks/          │ graph_nightmares/  │ flow_analysis/             │     │
│  │  - django_project    │  - god_object.py   │  - deadlock.py             │     │
│  │  - fastapi_project   │  - spaghetti/      │  - race_condition.py       │     │
│  │  - react_project     │  - layer_violations│  - resource_leak.py        │     │
│  │  - angular_project   │                    │                            │     │
│  │  - vue_project       │ performance/       │ security/                  │     │
│  │  - vite_project      │  - bottlenecks.py  │  - security_holes.py       │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐     │
│  │ full_stack_node/     │ dependencies/      │ tests/                     │     │
│  │  - backend/          │  - python_project/ │  - test_rca_scenarios.py   │     │
│  │  - frontend/         │  - node_project/   │  - test_flaky.py           │     │
│  │  - shared/           │  - monorepo/       │  - e2e/                    │     │
│  │  (~50 errors)        │  (~15 errors)      │  (~20 errors)              │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Connected Services

### 1. Frontend (`frontend/`)
**Technology:** JavaScript
**Port:** 3000 (when served)
**Key File:** `frontend/services/api_service.js`

| Function | Gateway Route | Backend Service | Vulnerability |
|----------|---------------|-----------------|---------------|
| `fetchUserData()` | `/api/users/:id/status` | api/ | Null dereference |
| `searchUsers()` | `/api/users/search` | api/ → db.py | SQL Injection |
| `searchUsersRust()` | `/api/search/users` | rust_backend/ | SQL Injection |
| `readFile()` | `/api/files/read` | rust_backend/ | Path Traversal |
| `executeCommand()` | `/api/exec` | rust_backend/ | Command Injection |
| `processUser()` | `/api/pipeline/users/:id/process` | python_pipeline/ | Task tracking |
| `importCSV()` | `/api/pipeline/import/csv` | python_pipeline/ | eval() injection |
| `calculate()` | `/api/calc` | rust_backend/ | Integer Overflow |
| `fetchExternalUrl()` | `/api/fetch` | rust_backend/ | SSRF |
| `login()` | `/api/auth/login` | api/ | Race condition |

**Intentional Errors (5):**
- Error #21: `eval()` with user input
- Error #22: Empty catch block
- Error #23: `console.log` in production
- Error #24: Unhandled promise rejection
- Error #25: `==` instead of `===`

---

### 2. Gateway (`gateway/`)
**Technology:** Node.js/Express
**Port:** 4000
**Key File:** `gateway/src/index.js`

Routes requests to appropriate backend services based on URL pattern:

| Route Pattern | Target Service | Port |
|---------------|----------------|------|
| `/api/users/*` | api/ (Python) | 8000 |
| `/api/auth/*` | api/ (Python) | 8000 |
| `/api/admin/*` | api/ (Python) | 8000 |
| `/api/pipeline/*` | python_pipeline/ | 8001 |
| `/api/search/*` | rust_backend/ | 8080 |
| `/api/files/*` | rust_backend/ | 8080 |
| `/api/exec` | rust_backend/ | 8080 |
| `/api/calc` | rust_backend/ | 8080 |
| `/api/fetch` | rust_backend/ | 8080 |

**Intentional Vulnerabilities:**
- Forwards unvalidated user input to backends
- No rate limiting
- Permissive CORS
- Logs sensitive data (auth headers)
- Leaks internal error details

---

### 3. Python API (`api/`)
**Technology:** Python/FastAPI
**Port:** 8000
**Key Files:**

| File | Errors | Vulnerabilities |
|------|--------|-----------------|
| `app.py` | 6 | Hardcoded API key, excessive params, missing await, resource leak, null deref |
| `db.py` | 5 | SQL injection, N+1 queries, missing transactions |
| `auth_service.py` | 5 | Race condition, thread safety, plaintext passwords |
| `secure_routes.py` | 5 | JWT bypass, insecure cookie, CORS misconfig |
| `utils.py` | 6 | Circular import, deep nesting, code injection |

**Key Endpoints:**
```
GET  /status/{user_id}        → Null dereference (Error #10)
GET  /users/search            → SQL injection via db.py (Error #11)
POST /auth/login              → Race condition (Error #70)
GET  /admin/dashboard         → JWT bypass (Error #95)
```

---

### 4. Python Pipeline (`python_pipeline/`)
**Technology:** Python/FastAPI + Celery
**Port:** 8001
**Key Files:**

| File | Errors | Vulnerabilities |
|------|--------|-----------------|
| `api/fastapi_endpoint.py` | 2 | Info leakage, task tracking |
| `services/data_ingestion.py` | 3 | `eval()` injection, poor typing, empty except |
| `processing/tasks.py` | 3 | Race condition, logic bug, memory leak |
| `db/sqlalchemy_models.py` | 3 | Missing index, relationship issues |

**Key Endpoints:**
```
POST /users/{id}/process      → Task tracking failure (Error #332)
POST /import/csv              → eval() injection (Error #325)
GET  /transactions/{id}       → IDOR, no auth check
POST /admin/reset-user/{id}   → Hardcoded admin token
GET  /debug/state             → Internal state exposure
```

---

### 5. Rust Backend (`rust_backend/`)
**Technology:** Rust/Actix-web
**Port:** 8080
**Key File:** `src/main.rs`

| Endpoint | Vulnerability | Error # |
|----------|---------------|---------|
| `GET /api/users/search` | SQL Injection | - |
| `POST /api/exec` | Command Injection | - |
| `GET /api/files/read` | Path Traversal | - |
| `POST /api/buffer/allocate` | Buffer Overflow | - |
| `GET /api/fetch` | SSRF | - |
| `GET /api/calc` | Integer Overflow | - |
| `POST /api/deserialize` | Insecure Deserialization | - |

---

## Cross-Boundary Taint Flows

### Flow 1: SQL Injection Chain
```
User Input (search term)
    │
    ▼
frontend/api_service.js:searchUsers()
    │ fetch("/api/users/search?username=...")
    ▼
gateway/src/index.js
    │ axios.get(pythonApi + "/users/search")
    ▼
api/app.py:search_users()
    │ db.get_user_by_username(username)
    ▼
api/db.py:17-18  ← SQL INJECTION SINK
    │ f"SELECT * FROM users WHERE username = '{username}'"
    ▼
DATABASE
```

**Attack Payload:** `admin' OR '1'='1' --`

### Flow 2: Command Injection Chain
```
User Input (command + args)
    │
    ▼
frontend/api_service.js:executeCommand()
    │ fetch("/api/exec", {body: {command, args}})
    ▼
gateway/src/index.js
    │ axios.post(rustBackend + "/api/exec")
    ▼
rust_backend/src/main.rs:execute_command()  ← COMMAND INJECTION SINK
    │ Command::new(&req.command).args(&req.args)
    ▼
OPERATING SYSTEM
```

**Attack Payload:** `{command: "sh", args: ["-c", "cat /etc/passwd"]}`

### Flow 3: Path Traversal Chain
```
User Input (file path)
    │
    ▼
frontend/api_service.js:readFile()
    │ fetch("/api/files/read?path=...")
    ▼
gateway/src/index.js
    │ axios.get(rustBackend + "/api/files/read")
    ▼
rust_backend/src/main.rs:read_file()  ← PATH TRAVERSAL SINK
    │ fs::read_to_string(file_path)
    ▼
FILE SYSTEM
```

**Attack Payload:** `../../../etc/passwd`

### Flow 4: Multi-Service Enrichment Chain
```
User Input (userId)
    │
    ▼
frontend/api_service.js:fullUserEnrichment()
    │ fetch("/api/users/:id/full-enrich")
    ▼
gateway/src/index.js:/api/users/:id/full-enrich
    │
    ├──▶ Step 1: api/ (Python)
    │    GET /status/{userId}  ← Null deref vulnerability
    │
    ├──▶ Step 2: rust_backend/
    │    GET /api/users/search?q={username}  ← SQL injection
    │
    └──▶ Step 3: python_pipeline/
         POST /users/{userId}/process  ← Task tracking failure
```

---

## Running the System

### Prerequisites
```bash
# Node.js 18+, Python 3.10+, Rust 1.70+
```

### Start All Services
```bash
# Terminal 1: Gateway
cd gateway && npm install && npm start
# Listens on :4000

# Terminal 2: Python API
cd api && uvicorn app:app --port 8000
# Listens on :8000

# Terminal 3: Python Pipeline
cd python_pipeline && uvicorn api.fastapi_endpoint:app --port 8001
# Listens on :8001

# Terminal 4: Rust Backend
cd rust_backend && cargo run
# Listens on :8080

# Terminal 5: Frontend (optional - can use curl)
cd frontend && npx serve -p 3000
# Listens on :3000
```

### Test Taint Flows
```bash
# SQL Injection through gateway
curl "http://localhost:4000/api/users/search?username=admin'%20OR%20'1'='1"

# Path Traversal through gateway
curl "http://localhost:4000/api/files/read?path=../../../etc/passwd"

# Command Injection through gateway
curl -X POST http://localhost:4000/api/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "whoami", "args": []}'

# SSRF through gateway
curl "http://localhost:4000/api/fetch?url=http://169.254.169.254/latest/meta-data/"

# Full enrichment (multi-service flow)
curl -X POST http://localhost:4000/api/users/123/full-enrich
```

---

## Error Distribution

| Component | Error Count | Key Categories |
|-----------|-------------|----------------|
| api/ | ~50 | SQL injection, auth bypass, race conditions |
| frontend/ | ~15 | eval(), XSS, type coercion |
| rust_backend/ | ~15 | Memory safety, command injection, SSRF |
| python_pipeline/ | ~11 | Code injection, info leakage |
| full_stack_node/ | ~50 | TypeScript any abuse, security misconfig |
| frameworks/ | ~13 | Framework misconfigurations |
| tests/ | ~20 | Flaky tests, ineffective coverage |
| dependencies/ | ~15 | Version conflicts, CVEs |
| graph_nightmares/ | ~12 | Circular imports, god objects |
| Other | ~200+ | Various patterns |
| **TOTAL** | **403** | |

---

## For TheAuditor Testing

### Recommended Test Commands
```bash
# Index the connected system
aud index --root . --print-stats

# Trace cross-boundary taint flows
aud flow-analyze --entry frontend/services/api_service.js

# Find SQL injection sinks
aud detect-patterns --pattern sql-injection

# Build dependency graph
aud graph build --include gateway api python_pipeline rust_backend

# Full audit
aud report --output audit_report.html
```

### Expected Detections
1. **Cross-boundary SQL injection**: frontend → gateway → api → db.py
2. **Command injection chain**: frontend → gateway → rust_backend
3. **Multi-language taint flow**: JavaScript → Node.js → Python → Rust
4. **Circular dependencies**: api/db.py ↔ api/utils.py
5. **Framework mixing**: Multiple frameworks in same repo

---

## Architecture Decisions

### Why a Gateway?
- Creates a single entry point for all backend services
- Enables cross-boundary taint flow detection
- Simulates real microservices architecture
- Allows testing of service-to-service communication vulnerabilities

### Why Not Unify Everything?
The isolated components (`frameworks/`, `graph_nightmares/`, etc.) remain separate because:
1. They use incompatible frameworks (Django vs FastAPI vs React vs Angular)
2. They're designed to test specific isolated scenarios
3. Forcing them together would create an unrealistic architecture

### Connected vs Isolated
| Connected (Real Flows) | Isolated (Specific Testing) |
|------------------------|----------------------------|
| frontend/ | frameworks/django_project |
| gateway/ | frameworks/react_project |
| api/ | graph_nightmares/ |
| python_pipeline/ | flow_analysis/ |
| rust_backend/ | performance/ |
| | security/ |
| | dependencies/ |
