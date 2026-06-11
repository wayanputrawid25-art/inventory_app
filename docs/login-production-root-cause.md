# Login Production Root Cause Analysis

**Date:** 2026-06-10  
**Version:** 1.0  
**Purpose:** Identify exact cause of "Gagal memproses login" error in production

---

## Error Reproduction

```bash
$ curl -X POST https://inventory-app-it4u.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

{"success":false,"message":"Gagal memproses login"}
```

---

## Root Cause Identified

### EXACT FAILING FILE
**File:** `backend/auth.js`  
**Line:** 113  
**Error Message:** `"Gagal memproses login"`

```javascript
} catch (error) {
  console.error("auth login error", error);
  return send(res, 500, { success: false, message: "Gagal memproses login" });
}
```

### EXACT EXCEPTION SOURCE

The error is thrown at **line 61** when executing the database query:

```javascript
try {
  const result = await pool.query(
    `SELECT id, username, email, password_hash, nama_lengkap, role, outlet_id, is_active
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [normalizedUsername]
  );
  // ...
} catch (error) {
  console.error("auth login error", error);  // Line 112 - logs the error
  return send(res, 500, { ... });            // Line 113 - throws "Gagal memproses login"
}
```

### ROOT CAUSE: DATABASE_URL NOT CONFIGURED

**File:** `services/db.js`  
**Lines:** 3-7

```javascript
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL belum di-set. API database akan gagal sampai env tersedia.");
}
```

The `pool.query()` call at `backend/auth.js:61` fails because:

1. **DATABASE_URL is not set** in Vercel environment variables
2. The PostgreSQL Pool is created with `connectionString = undefined`
3. Any query to the database fails immediately with a connection error

---

## Complete Login Flow Trace

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (index.html)                                                     │
│    Line: 2638                                                                │
│    Endpoint: /api/v1/auth/login (user) or /api/v1/auth/login/admin           │
│    Method: POST with { username, password }                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. API ROUTER (api/index.js)                                                 │
│    Line: 44-46                                                               │
│    Route: POST /v1/auth/login → authHandler                                  │
│    Route: POST /v1/auth/login/admin → authHandler                            │
│    Route: POST /v1/auth/login/user → authHandler                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. AUTH HANDLER (backend/auth.js)                                            │
│    Line: 52-115                                                              │
│                                                                             │
│    3.1 Validate input (line 56-58)                                          │
│    3.2 Query database (line 61-67) ⚠️ THROWS ERROR HERE                     │
│    3.3 Verify password (line 70)                                           │
│    3.4 Check is_active (line 80-82)                                        │
│    3.5 Check portal role (line 84-89)                                      │
│    3.6 Update last_login (line 91-94)                                       │
│    3.7 Build token (line 96-108)                                           │
│    3.8 Return success (line 110)                                           │
│                                                                             │
│    CATCH BLOCK (line 111-114):                                              │
│        console.error("auth login error", error);                           │
│        return send(res, 500, { message: "Gagal memproses login" });        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (ERROR THROWN)
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. DATABASE CONNECTION (services/db.js)                                     │
│    Lines: 1-25                                                              │
│                                                                             │
│    const connectionString = process.env.DATABASE_URL;  ← UNDEFINED!        │
│                                                                             │
│    const pool = new Pool({                          ← CREATED WITH          │
│      connectionString,                               ← UNDEFINED URL        │
│      ssl: connectionString ? {...} : false,                                 │
│      max: 3,                                                                │
│      idleTimeoutMillis: 10000,                                             │
│      connectionTimeoutMillis: 10000                                         │
│    });                                                                      │
│                                                                             │
│    When pool.query() is called:                                            │
│    → PostgreSQL driver fails to connect                                     │
│    → Exception thrown                                                      │
│    → Caught by auth.js catch block                                         │
│    → Returns "Gagal memproses login"                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exact SQL Query

**File:** `backend/auth.js`  
**Lines:** 61-67

```sql
SELECT id, username, email, password_hash, nama_lengkap, role, outlet_id, is_active
FROM users
WHERE username = $1
LIMIT 1
```

**Parameters:**
- `$1` = normalizedUsername (trimmed username from request)

---

## Verification Checklist

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| DATABASE_URL exists | YES | NO | ❌ FAIL |
| Neon connection works | YES | NO | ❌ FAIL |
| users table exists | YES | UNKNOWN | ⚠️ |
| username column exists | YES | UNKNOWN | ⚠️ |
| password_hash column exists | YES | UNKNOWN | ⚠️ |
| role column exists | YES | UNKNOWN | ⚠️ |
| nama_lengkap column exists | YES | UNKNOWN | ⚠️ |
| is_active column exists | YES | UNKNOWN | ⚠️ |

---

## Comparison: auth.js vs users-api.js vs settings-api.js

### auth.js (Login Handler)
```javascript
// services/db.js
import pool from "../services/db.js";

// Query at line 61
const result = await pool.query(
  `SELECT id, username, email, password_hash, nama_lengkap, role, outlet_id, is_active
   FROM users WHERE username = $1 LIMIT 1`,
  [normalizedUsername]
);
```
**Dependencies:** `services/db.js`, `migration_auth_login.sql`

### users-api.js (User Management)
```javascript
// services/db.js
import pool from "../services/db.js";

// Query at line 119
const countResult = await pool.query(
  `SELECT COUNT(*) as total FROM users ${whereClause}`,
  params
);
```
**Dependencies:** `services/db.js`, `migration_auth_login.sql`

### settings-api.js (Profile/Settings)
```javascript
// services/db.js
import pool from "../services/db.js";

// Query at line 61
const result = await pool.query(`
  SELECT id, username, email, nama_lengkap, role, outlet_id, is_active, 
         created_at, last_login, failed_login_count
  FROM users WHERE id = $1
`, [user.sub]);
```
**Dependencies:** `services/db.js`, `migration_auth_login.sql`

**ALL THREE FILES** use the same `services/db.js` and will fail if DATABASE_URL is not set.

---

## Password Hashing Compatibility Analysis

### Current Implementation (auth.js)

```javascript
function verifyPassword(password, storedHash) {
  const hash = String(storedHash || "");
  if (hash.startsWith("pbkdf2:sha256")) return verifyWerkzeug(password, hash);  // Werkzeug format
  if (/^[a-f0-9]{64}$/i.test(hash)) return verifySha256(password, hash);        // Raw SHA256
  return false;
}
```

### migration_auth_login.sql Password Format

```sql
INSERT INTO users (username, password_hash, ...) VALUES
  ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', ...);
```

The hash `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9` is:
- 64 characters (matches `/^[a-f0-9]{64}$/i.test()`)
- Lowercase hex (matches `/^[a-f0-9]{64}$/i.test()`)
- Would be verified by `verifySha256()` function

**VERDICT:** Password hashing is compatible IF database connection works.

---

## Every Location That Can Throw "Gagal memproses login"

| File | Line | Condition |
|------|------|-----------|
| `backend/auth.js` | 113 | Any exception in login() function |
| `backend/auth.js` | 113 | pool.query() fails (no DATABASE_URL) |
| `backend/auth.js` | 113 | Database connection timeout |
| `backend/auth.js` | 113 | users table doesn't exist |
| `backend/auth.js` | 113 | Network error to PostgreSQL |

---

## Error Flow Summary

```
1. User clicks "Masuk" on frontend
2. Frontend sends POST to /api/v1/auth/login
3. API routes to backend/auth.js (authHandler)
4. authHandler routes to login() function
5. login() calls pool.query() at line 61
6. pool.query() fails because DATABASE_URL is undefined
7. Exception caught at line 111
8. Error logged at line 112
9. "Gagal memproses login" returned at line 113
```

---

## Fix Applied

### Changes Made (Commit: d2781e6)

1. **backend/auth.js** - Added better error handling:
   - Line 117-122: Detect DATABASE_URL not set → return specific error
   - Line 125-130: Detect connection refused → return specific error
   - Line 133-138: Detect authentication failure → return specific error

2. **services/db.js** - Added diagnostic helpers:
   - Line 11-13: `isDatabaseConfigured()` function
   - Line 16-28: `checkDatabaseHealth()` function

3. **api/index.js** - Added health check endpoints:
   - Line 63-64: `GET /v1/health` and `GET /health` routes

### Current Response (After Fix)

```json
{
  "success": false,
  "message": "Konfigurasi database belum lengkap. DATABASE_URL belum diset.",
  "error": "DATABASE_URL_NOT_SET"
}
```

This is much more helpful than the generic "Gagal memproses login" error!

---

## Fix Recommendations

### PRIMARY FIX: Set DATABASE_URL in Vercel

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select project: `inventory-app-it4u`
3. Go to Settings → Environment Variables
4. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon PostgreSQL connection string
   - **Environments:** Production, Preview, Development
5. Redeploy the project

### SECONDARY FIX: Run Migration

After DATABASE_URL is set, run the migration to create users:

```bash
psql $DATABASE_URL -f migration_auth_login.sql
```

---

## Expected Response After Fix

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "username": "admin",
    "email": "admin@warehouse.local",
    "nama_lengkap": "Administrator",
    "role": "admin",
    "outlet_id": null,
    "login_as": "admin",
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 86400
  }
}
```

---

## Files Involved in Login

| File | Purpose | Critical |
|------|---------|----------|
| `services/db.js` | Database connection | ⚠️ ROOT CAUSE |
| `backend/auth.js` | Login handler | ✅ |
| `api/index.js` | Route dispatcher | ✅ |
| `server.js` | Express server | ✅ |
| `vercel.json` | Vercel config | ✅ |
| `migration_auth_login.sql` | Users schema & data | ✅ |

---

*Generated: 2026-06-10*
*Root Cause: DATABASE_URL not configured*
*Status: IDENTIFIED*