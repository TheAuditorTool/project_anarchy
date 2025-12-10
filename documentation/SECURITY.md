# Security Documentation
# INTENTIONAL ERRORS: #283-285 for TheAuditor testing

## Security Posture

This document describes Project Anarchy's security measures.

---

## ERROR #283: Documented security controls not implemented

### Input Validation
**DOCUMENTED:**
> All user input is validated using Zod schemas before processing.
> SQL queries use parameterized statements.
> File paths are sanitized against traversal attacks.

**ACTUAL:**
- No Zod validation in `api/app.py` (string concatenation in SQL)
- No parameterized queries in `api/db.py:18`
- No path sanitization in `rust_backend/src/main.rs:143`

### Authentication
**DOCUMENTED:**
> All endpoints require authentication via JWT tokens.
> Tokens expire after 15 minutes.
> Refresh tokens are rotated on each use.

**ACTUAL:**
- `/api/users/search` has no auth check
- Tokens never expire (no `exp` claim validated)
- No refresh token rotation implemented

### Rate Limiting
**DOCUMENTED:**
> API is protected by rate limiting: 100 requests/minute/IP

**ACTUAL:**
- No rate limiting in `gateway/src/index.js`
- Comment says "TODO: implement rate limiting"

---

## ERROR #284: False security claims

### Encryption
**DOCUMENTED:**
> All data at rest is encrypted with AES-256.
> All data in transit uses TLS 1.3.

**ACTUAL:**
- SQLite database is unencrypted
- Development server runs on HTTP
- Passwords stored as MD5 hash (not bcrypt/argon2)

### Audit Logging
**DOCUMENTED:**
> All security-relevant actions are logged to immutable audit log.

**ACTUAL:**
- No audit logging implemented
- `console.log()` statements only
- Logs contain sensitive data (passwords, tokens)

---

## ERROR #285: Missing vulnerability disclosures

The following known vulnerabilities are NOT documented:

| Vulnerability | Location | CVE/Type |
|--------------|----------|----------|
| SQL Injection | api/db.py:18 | CWE-89 |
| Command Injection | rust_backend/main.rs:109 | CWE-78 |
| Path Traversal | rust_backend/main.rs:143 | CWE-22 |
| SSRF | rust_backend/main.rs:240 | CWE-918 |
| Code Injection | python_pipeline/data_ingestion.py:33 | CWE-94 |
| XXE | security/security_holes.py | CWE-611 |
| Insecure Deserialization | security/security_holes.py | CWE-502 |
| Hardcoded Credentials | deployment/docker-compose.yml | CWE-798 |

### Dependencies with Known CVEs

| Package | Version | CVE |
|---------|---------|-----|
| lodash | 4.17.15 | CVE-2020-8203 |
| axios | 0.21.1 | CVE-2021-3749 |
| node-fetch | 2.6.0 | CVE-2022-0235 |

---

## Threat Model (Outdated)

**DOCUMENTED THREATS:**
1. External attackers
2. Malicious users
3. Network eavesdroppers

**MISSING THREATS:**
1. Insider threats (no access controls)
2. Supply chain attacks (no dependency verification)
3. Container escapes (runs as root)
4. API abuse (no rate limiting)

---

## Incident Response

**DOCUMENTED:**
> Security incidents are handled within 24 hours.
> Contact: security@example.com

**ACTUAL:**
- No incident response plan
- No security contact configured
- No SECURITY.md in repository root

---

## Compliance

**DOCUMENTED:**
> System is compliant with SOC2, PCI-DSS, and GDPR.

**ACTUAL:**
- No compliance certifications
- Logs contain PII
- No data retention policy
- No right-to-deletion implementation
