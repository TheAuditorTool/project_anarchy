# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Anarchy is a **test repository for code auditing tools** (specifically TheAuditor). It contains **403 intentional errors** across multiple connected services with **real cross-boundary data flows**.

### Architecture Options

1. **Unified Root System** (RECOMMENDED) - The main connected architecture using `gateway/`, `api/`, `python_pipeline/`, `rust_backend/`, `frontend/`
2. **`anarchy_commerce/`** - A separate polyglot e-commerce monorepo (alternative taint analysis testing)
3. **Isolated demos** - Framework-specific tests in `frameworks/`, `graph_nightmares/`, etc.

---

## Unified Root System (Primary Architecture)

The root project is now a **connected polyglot system** with real data flows:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        project_anarchy/                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  frontend/services/api_service.js                                    │
│       │                                                              │
│       │ fetch()                                                      │
│       ▼                                                              │
│  ┌─────────────┐                                                     │
│  │   gateway/  │  :4000 (Node.js/Express)                           │
│  │  src/index.js                                                     │
│  └──────┬──────┘                                                     │
│         │                                                            │
│    ┌────┴─────┬─────────────┬─────────────┐                         │
│    │          │             │             │                         │
│    ▼          ▼             ▼             ▼                         │
│ ┌──────┐  ┌────────────┐  ┌─────────────────┐  ┌───────────────┐   │
│ │ api/ │  │python_     │  │ rust_backend/   │  │ (future svc)  │   │
│ │:8000 │  │pipeline/   │  │ :8080           │  │               │   │
│ │      │  │:8001       │  │                 │  │               │   │
│ └──────┘  └────────────┘  └─────────────────┘  └───────────────┘   │
│                                                                      │
│  Connected: ~90 errors with real taint flows                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flows (Real Cross-Boundary Taint)

| Flow | Source | Path | Sink |
|------|--------|------|------|
| SQL Injection | `searchUsers(term)` | frontend → gateway → api/app.py | db.py:18 |
| Command Injection | `executeCommand(cmd)` | frontend → gateway → rust_backend | main.rs:109 |
| Path Traversal | `readFile(path)` | frontend → gateway → rust_backend | main.rs:143 |
| Code Injection | `importCSV(path)` | frontend → gateway → python_pipeline | data_ingestion.py:33 |
| SSRF | `fetchExternalUrl(url)` | frontend → gateway → rust_backend | main.rs:240 |

### Running the Unified System

```bash
# Terminal 1: Gateway
cd gateway && npm install && npm start     # :4000

# Terminal 2: Python API
cd api && uvicorn app:app --port 8000      # :8000

# Terminal 3: Python Pipeline
cd python_pipeline && uvicorn api.fastapi_endpoint:app --port 8001  # :8001

# Terminal 4: Rust Backend
cd rust_backend && cargo run               # :8080
```

### Test Commands
```bash
# SQL Injection
curl "http://localhost:4000/api/users/search?username=admin'%20OR%20'1'='1"

# Path Traversal
curl "http://localhost:4000/api/files/read?path=../../../etc/passwd"

# Command Injection
curl -X POST http://localhost:4000/api/exec -H "Content-Type: application/json" \
  -d '{"command": "whoami", "args": []}'
```

---

## Alternative: anarchy_commerce/

This is a properly structured polyglot monorepo that your manifest detection can parse:

```
anarchy_commerce/
├── package.json              # Node workspace root (workspaces: [web, services/gateway, shared/types])
├── Cargo.toml                # Rust workspace root (members: [services/payments, services/search])
├── pyproject.toml            # Python workspace root (packages: [services/users, services/recommendations])
├── web/                      # React frontend (THE frontend)
├── services/
│   ├── gateway/              # Node.js API Gateway (BFF) - port 4000
│   ├── users/                # Python/FastAPI - port 4001
│   ├── payments/             # Rust/Actix - port 4002
│   └── search/               # Rust/Actix - port 4003
└── shared/
    └── types/                # TypeScript shared types (@anarchy/types)
```

### How Manifest Detection Should Work

```
1. Find root: anarchy_commerce/
2. Detect workspaces:
   - package.json → workspaces: ["web", "services/gateway", "shared/types"]
   - Cargo.toml → members: ["services/payments", "services/search"]
   - pyproject.toml → packages: ["services/users", ...]
3. Index each workspace member
4. Trace cross-boundary calls via shared types
```

### Build & Run

```bash
cd anarchy_commerce

# Install all
npm install                    # Node workspaces
poetry install                 # Python services
cargo build                    # Rust services

# Run services
npm run dev -w web                              # Frontend :3000
npm run dev -w @anarchy/gateway                 # Gateway :4000
cd services/users && uvicorn main:app --port 4001
cd services/payments && cargo run               # :4002
cd services/search && cargo run                 # :4003
```

### Data Flow (Real Cross-Boundary Taint)

```
Browser Input
      │
      ▼
┌─────────────┐
│ web (React) │  :3000
└──────┬──────┘
       │ fetch() via client.ts
       ▼
┌─────────────┐
│   gateway   │  :4000 (Node.js)
│    (BFF)    │
└──────┬──────┘
       │ axios.post() to internal services
       ▼
┌──────┴───────┬────────────────┐
│              │                │
▼              ▼                ▼
┌───────┐  ┌────────┐  ┌────────────┐
│ users │  │payments│  │   search   │
│(Python)│  │ (Rust) │  │   (Rust)   │
└───────┘  └────────┘  └────────────┘
```

**Taint path example:**
```
SearchPage.tsx: query state
  → client.ts: searchProducts(query)
    → gateway/index.ts: axios.get(SERVICES.search, {params: req.query})
      → search/main.rs: format!("match: {}", search_term)  // VULN: ES injection
```

### Vulnerabilities in anarchy_commerce (Intentional)

| Service | Language | Vulnerabilities |
|---------|----------|-----------------|
| users | Python | MD5 passwords, IDOR, stored XSS in bio, timing attack |
| payments | Rust | Hardcoded API key, no auth check, log injection |
| search | Rust | Elasticsearch injection, user input in format! |
| gateway | Node.js | Forwards unvalidated input to internal services |
| web | React | Stores token in localStorage, no CSRF |

---

## Legacy Chaos (Original Structure)

The `frameworks/`, `api/`, `rust_backend/`, etc. are the original isolated demos:

```bash
# These are SEPARATE projects, not a monorepo
frameworks/react_project/     # Isolated React demo
frameworks/vue_project/       # Isolated Vue demo
frameworks/angular_project/   # Isolated Angular demo
frameworks/django_project/    # Isolated Django demo
frameworks/fastapi_project/   # Isolated FastAPI demo
rust_backend/                 # Isolated Rust demo
```

Use these for:
- "Can we parse chaotic multi-framework repos without crashing?"
- Framework detection testing (you should find 13+ frameworks)
- Linter integration testing

Do NOT use for:
- Cross-boundary taint analysis (no real data flows between them)

---

## Quick Reference

| What you're testing | Use |
|---------------------|-----|
| Cross-boundary taint analysis | **Root system** (`gateway/` + `api/` + `rust_backend/` + `python_pipeline/`) |
| Alternative polyglot monorepo | `anarchy_commerce/` |
| Manifest/workspace detection | `anarchy_commerce/` |
| Polyglot indexing | Root or `anarchy_commerce/` |
| Framework detection | Root (all frameworks) |
| Parser stress testing | Root (all the chaos) |
| Individual vuln patterns | `frameworks/*/`, `api/`, `rust_backend/` |

## Key Files for Connected System

| Component | Key File | Purpose |
|-----------|----------|---------|
| Gateway | `gateway/src/index.js` | Routes all requests |
| Frontend | `frontend/services/api_service.js` | Client-side API calls |
| Python API | `api/app.py` | User operations, auth |
| Python Pipeline | `python_pipeline/api/fastapi_endpoint.py` | Data processing |
| Rust Backend | `rust_backend/src/main.rs` | Performance-critical ops |
| Architecture Doc | `ARCHITECTURE.md` | Full system documentation |
