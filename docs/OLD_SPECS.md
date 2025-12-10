# Old Specifications
# INTENTIONAL ERROR: #124 - Outdated specification document

## WARNING: THIS DOCUMENT IS OUTDATED

This specification was written for version 0.1.0 and has NOT been updated.
Many features described here no longer exist or work differently.

---

## ERROR #124: Specification-Code Mismatch

### User Authentication (OUTDATED)

**SPECIFIED (v0.1.0):**
```
Authentication uses HTTP Basic Auth.
Credentials: username:password in Authorization header
Format: Basic base64(username:password)
```

**ACTUAL (current):**
- Mixed authentication: JWT, API keys, session cookies
- No Basic Auth support
- OAuth2 partially implemented but incomplete

### API Endpoints (OUTDATED)

**SPECIFIED (v0.1.0):**
```
GET  /api/v1/users       → List users
POST /api/v1/users       → Create user
GET  /api/v1/users/:id   → Get user
PUT  /api/v1/users/:id   → Update user
DELETE /api/v1/users/:id → Delete user
```

**ACTUAL (current):**
- v1 endpoints removed
- v2 endpoints exist but different structure
- Some endpoints undocumented
- Breaking changes not versioned

### Database Schema (OUTDATED)

**SPECIFIED (v0.1.0):**
```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(100),
    created_at TIMESTAMP
);
```

**ACTUAL (current):**
```sql
-- Schema has evolved significantly:
-- - Added email, phone, bio, avatar columns
-- - Added roles, permissions tables
-- - Password column renamed to password_hash
-- - Added soft delete (deleted_at)
-- - Foreign keys to 5 additional tables
```

### Error Codes (OUTDATED)

**SPECIFIED (v0.1.0):**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 500 | Server Error |

**ACTUAL (current):**
- Returns non-standard codes (422, 418, 451)
- Error bodies don't match spec
- Some errors return 200 with error in body
- Stack traces in production errors

### Configuration (OUTDATED)

**SPECIFIED (v0.1.0):**
```yaml
# config.yml
database:
  host: localhost
  port: 5432
  name: app_db
server:
  port: 8000
```

**ACTUAL (current):**
- Uses environment variables
- Config file format changed to JSON
- New required fields not documented
- Default values changed

---

## Specification Violations

| Section | Specified | Actual | Impact |
|---------|-----------|--------|--------|
| Auth | Basic Auth | JWT/OAuth | Breaking |
| API Version | v1 | v2 | Breaking |
| Responses | JSON | Mixed | Confusing |
| Errors | Standard codes | Custom codes | Breaking |
| Config | YAML | JSON + env | Breaking |

---

## Recommendation

This specification should be:
1. Updated to reflect current implementation
2. Versioned to match code versions
3. Auto-generated from code where possible
4. Reviewed during each release

**Current Status:** ABANDONED - No updates since initial release
