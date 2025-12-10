# Project Anarchy - Frequently Asked Questions

## General Questions

### What is Project Anarchy?

Project Anarchy is a **test repository for code auditing tools**, specifically designed for testing TheAuditor. It contains **403 intentional errors** across multiple languages and frameworks with real cross-boundary data flows.

### Why would I want a repository full of bugs?

To test code auditing, security scanning, and static analysis tools. A controlled repository with known errors lets you:
- Verify tools detect specific vulnerability types
- Test cross-file taint analysis
- Benchmark detection rates
- Validate error reporting accuracy

### How do I know the errors are real?

Each error is:
1. Documented in README.md with file path and line number
2. Verifiable by reading the source code
3. Tested by 12 verification agents (see VERIFICATION_REPORT.md)
4. Part of traceable data flows

---

## Architecture Questions

### What's the difference between the root system and anarchy_commerce?

| Aspect | Root System | anarchy_commerce |
|--------|-------------|------------------|
| Structure | Loosely connected services | Proper monorepo |
| Purpose | Chaos testing, parser stress | Workspace detection |
| Manifest | Mixed/chaotic | Clean package.json/Cargo.toml |
| Use for | General auditing | Manifest parsing |

### Which system should I test first?

Start with the **root system** (`gateway/` + `api/` + `rust_backend/` + `python_pipeline/`). It has the most comprehensive cross-boundary taint flows.

### How do the services communicate?

```
Frontend → Gateway (:4000) → Backend Services
                ├── api/ (:8000) - Python/FastAPI
                ├── python_pipeline/ (:8001) - Python/FastAPI
                └── rust_backend/ (:8080) - Rust/Actix
```

All requests flow through the gateway, which forwards to appropriate backends.

---

## Error Questions

### How are errors numbered?

Errors are numbered sequentially (#1-403) across 31 phases:
- Phase 1-5: Dependencies (#1-69)
- Phase 6-10: API/Frontend (#70-130)
- Phase 11-15: Full Stack Node (#131-175)
- Phase 16-20: Linter/Framework (#176-247)
- Phase 21-25: Graph/Flow/Security (#248-295)
- Phase 26-31: Pipeline/Deployment (#296-403)

### What types of errors are included?

| Category | Examples |
|----------|----------|
| Security | SQL injection, XSS, command injection, path traversal |
| Dependencies | Version conflicts, CVEs, lock mismatches |
| Code Quality | Type abuse, dead code, complexity |
| Architecture | Circular imports, layer violations, god objects |
| Testing | Flaky tests, mock abuse, tautological assertions |
| Deployment | Hardcoded secrets, root containers, resource limits |

### Why are some errors marked as "discrepancy"?

Verification found ~10 errors where:
- Files don't exist at documented paths
- Versions don't match documentation
- Line numbers have shifted

See VERIFICATION_REPORT.md for details.

---

## Testing Questions

### How do I run the connected system?

```bash
# Terminal 1: Gateway
cd gateway && npm install && npm start

# Terminal 2: Python API
cd api && uvicorn app:app --port 8000

# Terminal 3: Python Pipeline
cd python_pipeline && uvicorn api.fastapi_endpoint:app --port 8001

# Terminal 4: Rust Backend
cd rust_backend && cargo run
```

### How do I test a specific vulnerability?

**SQL Injection:**
```bash
curl "http://localhost:4000/api/users/search?username=admin'%20OR%20'1'='1"
```

**Path Traversal:**
```bash
curl "http://localhost:4000/api/files/read?path=../../../etc/passwd"
```

**Command Injection:**
```bash
curl -X POST http://localhost:4000/api/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "whoami", "args": []}'
```

### What should my tool detect?

A comprehensive auditor should find:
- 90%+ of documented errors
- Cross-file taint flows (frontend → backend)
- Dependency vulnerabilities
- Framework-specific issues
- Multi-language patterns

---

## Module Resolution Questions

### What is the Vue module resolution test?

The `frameworks/vue_project/` tests whether auditing tools can resolve:
- Path aliases (`@/` → `src/`)
- Index files (`@/stores` → `src/stores/index.ts`)
- Relative imports (`./validation` → `src/utils/validation.ts`)
- Scoped packages (`@vueuse/core`)

### Why does module resolution matter?

Without proper module resolution, cross-file taint analysis breaks:
```
Bad:  @/stores → "stores" (basename only, can't find file)
Good: @/stores → src/stores/index.ts → tracks taint through store
```

### What's the expected resolution rate?

- Without proper resolution: 40-60%
- With proper resolution: 80%+

---

## Framework Questions

### What frameworks are included?

| Framework | Directory | Version |
|-----------|-----------|---------|
| Django | `frameworks/django_project/` | 4.x |
| React | `frameworks/react_project/` | 18.x |
| FastAPI | `frameworks/fastapi_project/` | 0.100+ |
| Angular | `frameworks/angular_project/` | 17.x |
| Vue | `frameworks/vue_project/` | 3.4.x |
| Vite | `frameworks/vite_project/` | 5.x |

### Are the framework projects connected?

No, the `frameworks/` projects are **isolated demos** for framework-specific testing. Use the root system for connected testing.

---

## Troubleshooting

### Tool reports fewer errors than expected

1. Check if tool supports all languages (Python, JS, TS, Rust, Go, etc.)
2. Verify cross-file analysis is enabled
3. Check module resolution is working (see Vue tests)
4. Some errors require specific linter rules

### Can't find documented file

Check VERIFICATION_REPORT.md - some files were identified as missing:
- `.github/workflows/deploy.yml`
- `documentation/` directory
- `docs/OLD_SPECS.md`
- `symlink_to_root`

### Line numbers don't match

Code may have shifted since documentation. The error pattern should still be present near the documented line.

---

## Contributing

### How do I add a new error?

1. Add the vulnerability to appropriate file
2. Document in README.md with:
   - Error number (next sequential)
   - File path and line number
   - Description of the issue
3. Update error counts in README.md
4. If cross-file, document the taint path

### How do I report a discrepancy?

1. Check VERIFICATION_REPORT.md first
2. If new, create issue or PR with:
   - Error number
   - Expected vs actual
   - Verification method
