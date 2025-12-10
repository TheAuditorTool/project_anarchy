# Project Anarchy - Glossary

## A

### Auditor (TheAuditor)
A code auditing tool that this repository is designed to test. It performs static analysis, taint tracking, and vulnerability detection across multiple languages.

### any (TypeScript)
TypeScript's escape hatch that disables type checking. Overuse is an error pattern tested in `full_stack_node/`.

## B

### Barrel Export
A pattern where an `index.ts` file re-exports from other files, allowing imports like `@/stores` instead of `@/stores/productStore`. Tested in Vue module resolution.

### BFF (Backend For Frontend)
The gateway pattern where a single entry point (gateway/) routes requests to appropriate backend services.

## C

### Circular Import
When module A imports module B, and module B imports module A (directly or transitively). Tested in `graph_nightmares/spaghetti/`.

### Command Injection
A vulnerability where user input is passed to shell commands without sanitization. Example: `exec(user_input)`.

### Cross-Boundary Taint
When tainted data flows across service boundaries (e.g., frontend → gateway → backend). The primary test pattern in this repository.

### CVE (Common Vulnerabilities and Exposures)
Publicly disclosed security vulnerabilities. Tested via intentionally vulnerable dependencies in `dependencies/`.

## D

### Data Contract Drift
When frontend types don't match backend API responses. Tested in `full_stack_node/frontend/`.

### Deadlock
When two or more processes wait indefinitely for resources held by each other. Tested in `flow_analysis/deadlock.py`.

### Dependency Conflict
When two packages require incompatible versions of the same dependency. Tested in `dependencies/`.

## E

### Eval Injection
Using `eval()` with user input. Allows arbitrary code execution. Tested in `python_pipeline/services/data_ingestion.py`.

## F

### Flaky Test
A test that sometimes passes and sometimes fails without code changes. Tested in `tests/flaky_tests.py`.

## G

### Gateway
The central routing service (`gateway/src/index.js`) that forwards requests to backend services.

### God Object
A class that knows too much or does too much. Tested in `graph_nightmares/god_object.py` with 27 imports.

## H

### Hardcoded Secret
Credentials or API keys embedded directly in source code. Tested in deployment configs.

## I

### IDOR (Insecure Direct Object Reference)
When users can access objects by manipulating IDs without authorization checks. Tested in `anarchy_commerce/services/users/`.

### Index Resolution
Resolving `import X from '@/stores'` to `src/stores/index.ts`. Critical for cross-file taint analysis.

## L

### Layer Violation
When a module in one architectural layer directly imports from an inappropriate layer (e.g., UI importing from database). Tested in `graph_nightmares/layer_violations/`.

### Lock File Mismatch
When `package-lock.json` or `poetry.lock` doesn't match its manifest file. Tested in `dependencies/`.

## M

### Module Resolution
The process of converting import paths to actual file locations. Key test area in `frameworks/vue_project/`.

### Monorepo
A repository containing multiple projects/packages. Tested in `anarchy_commerce/` with Node, Python, and Rust workspaces.

## O

### OWASP Top 10
The most critical web application security risks. All 10 are represented in this repository.

## P

### Path Alias
A shortcut in module resolution (e.g., `@/` → `src/`). Configured in `tsconfig.json` and `vite.config.js`.

### Path Traversal
A vulnerability allowing access to files outside intended directories using `../`. Tested in Rust backend.

### Polyglot
A project using multiple programming languages. This repository uses Python, JavaScript, TypeScript, Rust, Go, Ruby, R, WASM, and Bash.

## R

### Race Condition
When program behavior depends on timing of uncontrolled events. Tested in `flow_analysis/race_condition.py`.

### Resource Leak
Failing to release resources (files, connections, etc.) after use. Tested in `flow_analysis/resource_leak.py`.

## S

### Scoped Package
An npm package with an organization prefix (e.g., `@vueuse/core`). Tests module resolution of `@org/package`.

### SQL Injection
A vulnerability where user input is concatenated into SQL queries. Tested throughout `api/` and `rust_backend/`.

### SSRF (Server-Side Request Forgery)
A vulnerability where the server can be tricked into making requests to unintended locations. Tested in Rust backend.

### SSTI (Server-Side Template Injection)
Injecting code into server-side templates. Tested in Vue `TemplateRenderer.vue`.

## T

### Taint Analysis
Tracking "tainted" (user-controlled) data through code to find where it reaches dangerous operations (sinks).

### Taint Flow
The path tainted data takes from source (user input) through transformations to sink (dangerous operation).

### Taint Sink
A dangerous operation where tainted data should not reach without sanitization (e.g., `exec()`, SQL query).

### Taint Source
Where user-controlled data enters the system (e.g., form input, URL parameter).

### TheAuditor
See: Auditor

### Type Abuse
Overusing `any`, `as any`, or similar patterns that defeat TypeScript's type system. Tested in `full_stack_node/`.

## V

### Verification Agent
An automated process that confirms documented errors exist at specified locations. 12 agents verified this repository.

### Vulnerability Endpoint
An API endpoint intentionally designed with a security flaw for testing purposes.

## W

### Workspace
A monorepo feature grouping related packages. Tested in `anarchy_commerce/` with npm workspaces, Cargo workspaces, and Python packages.

## X

### XSS (Cross-Site Scripting)
A vulnerability where malicious scripts are injected into web pages. Tested in frontend components.

### XXE (XML External Entity)
A vulnerability in XML parsers allowing external entity injection. Tested in `security/security_holes.py`.

---

## Error Number Ranges

| Range | Category |
|-------|----------|
| #1-5 | Root dependency issues |
| #6-20 | API core vulnerabilities |
| #21-54 | Frontend and configuration |
| #55-69 | Dependency version issues |
| #70-99 | Auth and security |
| #100-130 | API edge cases |
| #131-175 | Full Stack Node |
| #176-214 | Linter violations |
| #215-234 | Dependency conflicts |
| #235-247 | Framework issues |
| #248-270 | Graph/Flow/Security |
| #271-295 | Test and documentation |
| #296-332 | Python pipeline |
| #333-361 | Deployment |
| #362-403 | Rust backend |

---

## File Extensions

| Extension | Language/Type |
|-----------|---------------|
| `.py` | Python |
| `.js` | JavaScript |
| `.ts` | TypeScript |
| `.tsx` | TypeScript + JSX (React) |
| `.vue` | Vue Single-File Component |
| `.rs` | Rust |
| `.go` | Go |
| `.rb` | Ruby |
| `.r` | R |
| `.wasm` | WebAssembly |
| `.sh` | Bash/Shell |
| `.sql` | SQL |
| `.yml`/`.yaml` | YAML configuration |
| `.toml` | TOML configuration |
| `.json` | JSON configuration |
