---
name: Code Audit
description: Run comprehensive audit on target path (file, directory, or root).
---

ultrathink Run a comprehensive code audit on the specified target.

**MANDATORY READS FIRST:**
1. Read `teamsop.md` - understand Prime Directive and verification protocol
2. Read `CLAUDE.md` - understand forbidden things (especially ZERO FALLBACK policy)
3. Read `docs/docs_writer/code_audit.md` - understand audit protocol

**Target**: $ARGUMENTS (if empty, audit entire project root)

**Scope Resolution:**
- Single file (`theauditor/fce.py`): Deep analysis - all functions, all callers/callees
- Directory (`theauditor/taint/*`): Module-level with cross-file relationships
- Root (`.` or empty): Architecture-level with sampling

**POLYGLOT SYSTEM REMINDER:**
- **Python**: Full support
- **Node.js/TypeScript**: Full support
- **Rust**: Basic support

When auditing, CHECK:
1. If auditing Python code, does equivalent Node code exist? Audit both.
2. Is there an orchestrator coordinating language-specific modules?
3. Missing orchestrator = architectural smell. FLAG IT.

---

**PHASE 1: Index and Structure**

```bash
aud full --offline              # Fresh index (skip if recent)
aud blueprint --structure       # Get module boundaries
```

**PHASE 2: Automated Security Analysis**

```bash
aud detect-patterns             # Run all security rules
aud taint-analyze               # Trace data flow source->sink
```

**PHASE 3: Manual Review Categories**

For each category, document findings with file:line references:

1. **ARCHITECTURAL INTEGRITY**
   - Monolithic files (>500 lines)
   - Tight coupling / circular dependencies
   - Separation of concerns violations

2. **DEAD CODE & ORPHANS**
   - Unused functions (no callers from aud query)
   - Orphaned files
   - Commented-out code

3. **DISCONNECTED WIRING**
   - Functions defined but never called
   - Event handlers never triggered
   - Config that affects nothing

4. **ERROR HANDLING (CRITICAL)**
   - ZERO FALLBACK violations (try/except returning empty)
   - Silent error swallowing
   - Missing null checks

5. **SECURITY**
   - Hardcoded secrets
   - SQL injection vectors
   - XSS vulnerabilities
   - Missing auth checks

6. **PERFORMANCE**
   - N+1 queries
   - Missing pagination
   - Sync operations that should be async

**PHASE 4: Report**

Write report to: `AUDIT_[target]_[YYYY-MM-DD].md` at project root.

**Report Structure:**

```markdown
# Audit Report: [Target]

**Date**: [Date]
**Scope**: [What was audited]
**Index**: [aud full timestamp or "fresh"]

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | X |
| High | X |
| Medium | X |
| Low | X |

**Top Issues:**
1. [file:line] - [Issue]
2. [file:line] - [Issue]
3. [file:line] - [Issue]

## Critical Issues

### [Issue Title]
- **Location**: `file.py:123`
- **Problem**: [What's wrong]
- **Evidence**: [Code snippet or aud output]
- **Fix**: [Specific action]
- **Risk if unfixed**: [Impact]

## High Issues
[Same format]

## Medium Issues
[Same format]

## Low Issues
[Same format]

## Quick Wins
[Issues fixable in <30 min]

## Commands Run
```bash
[All aud commands executed]
```
```

**Rules:**
- NEVER audit without reading actual code first
- ALWAYS include file:line references
- ALWAYS show evidence (code snippet or command output)
- Every issue needs a specific fix recommendation
- Prioritize by impact: Critical > High > Medium > Low
- Be brutal but fair - this is about production-readiness, not blame
