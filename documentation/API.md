# API Documentation
# INTENTIONAL ERRORS: #280-282 for TheAuditor testing

## Overview

This document describes the Project Anarchy API.

---

## ERROR #280: Outdated endpoint documentation

The following endpoints are documented but NO LONGER EXIST:

### GET /api/v1/users (DEPRECATED - REMOVED)
```
Returns list of users.
Response: { users: [...] }
```
**ACTUAL**: This endpoint was removed in v2.0. Use `/api/v2/users` instead.

### POST /api/v1/auth/login (DEPRECATED - REMOVED)
```
Authenticates user.
Body: { username, password }
Response: { token }
```
**ACTUAL**: Replaced with `/api/v2/auth/oauth` but documentation not updated.

---

## ERROR #281: Missing documentation for new endpoints

The following endpoints EXIST but are NOT documented:

- `POST /api/v2/users/bulk-create` - Bulk user creation
- `DELETE /api/v2/users/purge` - Mass delete users
- `GET /api/v2/admin/audit-log` - Security audit logs
- `POST /api/v2/payments/refund` - Process refunds
- `GET /api/v2/search/advanced` - Advanced search with filters

---

## ERROR #282: Incorrect parameter types documented

### POST /api/users
**DOCUMENTED:**
```json
{
  "age": "string",      // WRONG: actually number
  "active": "string",   // WRONG: actually boolean
  "roles": "string"     // WRONG: actually array
}
```

**ACTUAL:**
```json
{
  "age": 25,
  "active": true,
  "roles": ["user", "admin"]
}
```

---

## Current Endpoints (Correct)

### Gateway Routes (port 4000)

| Method | Path | Backend | Description |
|--------|------|---------|-------------|
| GET | /api/users/search | api:8000 | Search users |
| POST | /api/exec | rust:8080 | Execute command |
| GET | /api/files/read | rust:8080 | Read file |
| POST | /api/data/import | pipeline:8001 | Import CSV |
| GET | /api/fetch | rust:8080 | Fetch URL |

### Python API (port 8000)

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | User login |
| GET | /users/{id} | Get user by ID |
| POST | /users | Create user |
| GET | /users/search | Search users (VULNERABLE) |

### Rust Backend (port 8080)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/exec | Command execution (VULNERABLE) |
| GET | /api/files/read | File read (VULNERABLE) |
| GET | /api/fetch | URL fetch (VULNERABLE) |
| POST | /api/buffer/allocate | Buffer allocation (VULNERABLE) |

---

## Authentication

**DOCUMENTED:** API key in header
```
Authorization: Bearer <api_key>
```

**ACTUAL:** Mixed - some endpoints use API key, some use JWT, some use session cookies. No consistent auth scheme.

---

## Rate Limiting

**DOCUMENTED:** 100 requests per minute

**ACTUAL:** No rate limiting implemented (see gateway/src/index.js)
