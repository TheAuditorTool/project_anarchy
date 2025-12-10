# Project Anarchy - Navigation Index

> A comprehensive test repository for code auditing tools with **403 intentional errors**

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Main documentation - all 403 errors catalogued |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and data flows |
| [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) | Verification status of all errors |
| [FAQ.md](FAQ.md) | Frequently asked questions |
| [GLOSSARY.md](GLOSSARY.md) | Terminology and definitions |
| [CLAUDE.md](CLAUDE.md) | Claude Code integration guide |

---

## Directory Structure

### Core Connected System (Primary)

```
project_anarchy/
├── gateway/                 # API Gateway (Node.js :4000)
├── api/                     # Python API (FastAPI :8000)
├── python_pipeline/         # Data Processing (FastAPI :8001)
├── rust_backend/            # Performance Services (Actix :8080)
└── frontend/                # Client Services
```

| Directory | Language | Errors | Purpose |
|-----------|----------|--------|---------|
| [`gateway/`](gateway/) | Node.js | ~5 | Request routing, CORS, rate limiting |
| [`api/`](api/) | Python | #6-42, #70-74, #95-99, #125-126 | User auth, CRUD operations |
| [`python_pipeline/`](python_pipeline/) | Python | #322-332 | Data ingestion, ETL |
| [`rust_backend/`](rust_backend/) | Rust | 18+ vulns | High-performance operations |
| [`frontend/`](frontend/) | JavaScript | #21-25, #112-116, #131-135, #159-162 | Client-side services |

### Alternative Polyglot System

| Directory | Purpose |
|-----------|---------|
| [`anarchy_commerce/`](anarchy_commerce/) | Structured e-commerce monorepo for workspace detection testing |

### Framework-Specific Tests

| Directory | Framework | Errors |
|-----------|-----------|--------|
| [`frameworks/django_project/`](frameworks/django_project/) | Django | #235-237 |
| [`frameworks/react_project/`](frameworks/react_project/) | React | #238-240 |
| [`frameworks/fastapi_project/`](frameworks/fastapi_project/) | FastAPI | #241-244 |
| [`frameworks/angular_project/`](frameworks/angular_project/) | Angular | #245-247 |
| [`frameworks/vue_project/`](frameworks/vue_project/) | Vue 3 | Module resolution tests |
| [`frameworks/vite_project/`](frameworks/vite_project/) | Vite | Cross-boundary tests |

### Specialized Test Directories

| Directory | Category | Errors |
|-----------|----------|--------|
| [`graph_nightmares/`](graph_nightmares/) | Dependency graphs | #248-259 |
| [`flow_analysis/`](flow_analysis/) | Concurrency issues | #260-262 |
| [`performance/`](performance/) | Bottlenecks | #263-265 |
| [`security/`](security/) | OWASP vulns | #266-270 |
| [`linter_violations/`](linter_violations/) | Linter tests | #181-214 |
| [`tests/`](tests/) | Test anti-patterns | #271-279 |
| [`polyglot_project/`](polyglot_project/) | 9-language project | Multi-language |

### Configuration & Deployment

| Directory/File | Purpose | Errors |
|----------------|---------|--------|
| [`deployment/`](deployment/) | Docker, compose | #349-356 |
| [`migrations/`](migrations/) | SQL migrations | #360-361 |
| [`dependencies/`](dependencies/) | Dependency conflicts | #215-229 |
| [`.github/workflows/`](.github/workflows/) | CI/CD | #357-359 |

---

## Error Categories Quick Reference

| Category | Error Range | Files |
|----------|-------------|-------|
| Dependency Issues | #1-5, #55-69 | Root package files |
| API Vulnerabilities | #6-42 | `api/*.py` |
| Frontend Issues | #21-25, #112-162 | `frontend/**/*.js` |
| Full Stack Node | #136-158 | `full_stack_node/**/*` |
| Linter Violations | #181-214 | `linter_violations/*` |
| Framework Issues | #235-247 | `frameworks/*` |
| Graph Nightmares | #248-259 | `graph_nightmares/**` |
| Flow Analysis | #260-265 | `flow_analysis/*`, `performance/*` |
| Security Holes | #266-270 | `security/*` |
| Test Anti-patterns | #271-279 | `tests/*` |
| Documentation | #280-295 | `docs/*`, `documentation/*` |
| Python Pipeline | #322-332 | `python_pipeline/**` |
| Deployment | #349-361 | `deployment/*`, `migrations/*` |
| Rust Backend | 18+ vulns | `rust_backend/**` |

---

## Data Flow Paths

### SQL Injection Path
```
frontend/services/api_service.js → gateway/src/index.js → api/app.py → api/db.py:18
```

### Command Injection Path
```
frontend/services/api_service.js → gateway/src/index.js → rust_backend/src/main.rs:109
```

### Path Traversal Path
```
frontend/services/api_service.js → gateway/src/index.js → rust_backend/src/main.rs:143
```

### Code Injection Path
```
frontend/services/api_service.js → gateway/src/index.js → python_pipeline/services/data_ingestion.py:33
```

---

## Testing Commands

### Run Connected System
```bash
# Gateway
cd gateway && npm start

# Python API
cd api && uvicorn app:app --port 8000

# Python Pipeline
cd python_pipeline && uvicorn api.fastapi_endpoint:app --port 8001

# Rust Backend
cd rust_backend && cargo run
```

### Test Vulnerabilities
```bash
# SQL Injection
curl "http://localhost:4000/api/users/search?username=admin'%20OR%20'1'='1"

# Path Traversal
curl "http://localhost:4000/api/files/read?path=../../../etc/passwd"

# Command Injection
curl -X POST http://localhost:4000/api/exec -d '{"command":"whoami"}'
```

---

## Verification Status

See [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) for detailed status.

| Status | Count |
|--------|-------|
| Verified | 393/403 (97.5%) |
| Discrepancies | 10 |
| Missing Files | 4 |

---

## Contributing

1. Each error should be documented in README.md
2. Errors should be verifiable at the documented line numbers
3. Cross-file taint flows should be testable
4. New errors should follow existing numbering scheme
