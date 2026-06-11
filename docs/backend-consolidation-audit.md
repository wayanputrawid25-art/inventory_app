# Backend Consolidation Audit Report

**Date:** 2026-06-10  
**Auditor:** Senior Software Architect  
**Scope:** backend/ and api/index.js  
**Status:** Audit Complete

---

## Executive Summary

This audit analyzes the backend architecture after Phase E implementation. The system has evolved from a monolithic approach to a modular API handler pattern. Several areas of duplication and technical debt have been identified.

**Recommendation:** Current architecture is **ACCEPTABLE** for Phase E completion. Consolidation should be planned for Phase F (Dashboard) but is not blocking.

---

## 1. API Inventory

### 1.1 Auth Module (auth.js)

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| `/v1/auth/login` | POST | login() | Active |
| `/v1/auth/login/admin` | POST | login() | Active |
| `/v1/auth/login/user` | POST | login() | Active |
| `/v1/auth/logout` | POST | logout | Active |

### 1.2 Users Module (users-api.js)

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| `/v1/users` | GET | listUsers() | Active |
| `/v1/users` | POST | createUser() | Active |
| `/v1/users/stats` | GET | getUserStats() | Active |
| `/v1/users/roles` | GET | getRoles() | Active |
| `/v1/users/:id` | GET | getUser() | Active |
| `/v1/users/:id` | PUT | updateUser() | Active |
| `/v1/users/:id` | DELETE | deleteUser() | Active |
| `/v1/users/:id/enable` | POST | enableUser() | Active |
| `/v1/users/:id/disable` | POST | disableUser() | Active |
| `/v1/users/:id/reset-password` | POST | resetPassword() | Active |

### 1.3 Approval Module (approval-api.js)

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| `/v1/approvals` | GET | listApprovals() | Active |
| `/v1/approvals/stats` | GET | getApprovalStats() | Active |
| `/v1/approvals/:id` | GET | getApproval() | Active |
| `/v1/approvals/:id/approve` | POST | approveApproval() | Active |
| `/v1/approvals/:id/reject` | POST | rejectApproval() | Active |
| `/v1/approvals/:id/recount` | POST | requestRecount() | Active |

### 1.4 Settings Module (settings-api.js)

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| `/v1/auth/me` | GET | getProfile() | Active |
| `/v1/users/profile` | PUT | updateProfile() | Active |
| `/v1/auth/change-password` | POST | changePassword() | Active |
| `/v1/settings/system` | GET | getSystemSettings() | Active |
| `/v1/settings/database` | GET | getDatabaseStatus() | Active |
| `/v1/audit/logs` | GET | getAuditLogs() | Active |

### 1.5 Legacy Modules (v3-*.js)

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| `/v3-opname` | GET | handleGet() | Active |
| `/v3-opname` | POST | handlePost() | Active |
| `/v3-opname` | PUT | handlePut() | Active |

### 1.6 Summary Statistics

| Category | Count |
|----------|-------|
| Total API endpoints | 30+ |
| Auth-related | 4 |
| Users-related | 10 |
| Approval-related | 6 |
| Settings-related | 6 |
| Legacy/Other | 10+ |

---

## 2. Duplicate Logic Analysis

### 2.1 Token Parsing Logic

**Location:** auth.js, users-api.js, approval-api.js, settings-api.js

All four handlers have identical token parsing logic:

```javascript
// auth.js (lines 40-50)
function buildToken(user, portal) { ... }

// users-api.js (lines 68-82)
async function getCurrentUser(req) { ... }

// approval-api.js (lines 28-42)
async function getCurrentUser(req) { ... }

// settings-api.js (lines 29-43)
async function getCurrentUser(req) { ... }
```

**Duplication Level:** HIGH  
**Impact:** If token format changes, all four files must be updated.

### 2.2 Authorization Helpers

**Location:** users-api.js, approval-api.js

Both have similar but slightly different authorization patterns:

```javascript
// users-api.js (lines 51-66)
async function isAdminUser(req) { ... }
async function getCurrentUser(req) { ... }

// approval-api.js (lines 28-56)
async function getCurrentUser(req) { ... }
async function requireAdmin(req, res) { ... }
```

**Duplication Level:** MEDIUM  
**Impact:** Slightly different implementations may cause inconsistent behavior.

### 2.3 Password Verification

**Location:** auth.js, settings-api.js

Both verify passwords but with different approaches:

```javascript
// auth.js (lines 8-38)
function verifyWerkzeug(password, storedHash) { ... }
function verifySha256(password, storedHash) { ... }
function verifyPassword(password, storedHash) { ... }

// settings-api.js (lines 135-176)
async function changePassword(req, res) {
  // Uses crypto.pbkdf2Sync directly
  const derived = crypto.pbkdf2Sync(...);
}
```

**Duplication Level:** MEDIUM  
**Impact:** Inconsistent password hashing support.

### 2.4 Route Parsing

**Location:** All API handlers

All handlers have similar route parsing:

```javascript
function getRoutePath(req) {
  if (req.query?.route) {
    return "/" + String(req.query.route).replace(/^\/+/, "");
  }
  const url = new URL(req.url, "http://localhost");
  return url.pathname.replace(/^\/api/, "") || "/";
}
```

**Duplication Level:** HIGH  
**Impact:** Maintenance burden, potential for inconsistencies.

### 2.5 Response Helpers

**Location:** All API handlers

All have identical send() helper:

```javascript
function send(res, status, payload) {
  return res.status(status).json(payload);
}
```

**Duplication Level:** HIGH  
**Impact:** Low risk, but unnecessary duplication.

---

## 3. Duplicate Database Access

### 3.1 Users Table Queries

**auth.js (lines 61-67)**
```sql
SELECT id, username, email, password_hash, nama_lengkap, role, outlet_id, is_active
FROM users WHERE username = $1
```

**users-api.js (line 85+)**
```sql
SELECT id, username, email, nama_lengkap, role, is_active, created_at
FROM users WHERE 1=1 ...
```

**settings-api.js (lines 61-66)**
```sql
SELECT id, username, email, nama_lengkap, role, outlet_id, is_active, 
       created_at, last_login, failed_login_count
FROM users WHERE id = $1
```

**Duplication Level:** HIGH  
**Pattern:** Different SELECT columns for same table.

### 3.2 stok_opname_perintah Table Queries

**v3-opname.js (lines 119-122)**
```sql
SELECT * FROM stok_opname_perintah WHERE id = $1
```

**approval-api.js (line 240+)**
```sql
SELECT sop.id, sop.kode_so, sop.tanggal_perintah, sop.bulan, sop.tahun,
       sop.svp_nama, sop.lokasi, sop.keterangan, sop.status, sop.checker,
       sop.kategori_targets, sop.opname_id, sop.created_at, sop.started_at,
       sop.completed_at, ...
FROM stok_opname_perintah sop WHERE ...
```

**Duplication Level:** MEDIUM  
**Pattern:** Same table, different queries for different purposes.

### 3.3 Status Update Queries

**v3-opname.js (lines 179-183)**
```sql
UPDATE stok_opname_perintah SET status = 'selesai' WHERE id = $1
UPDATE stok_opname SET disesuaikan_at = NOW() WHERE id = $1
```

**approval-api.js (lines 230-267)**
```sql
UPDATE stok_opname_perintah SET status = 'selesai' WHERE id = $1
UPDATE stok_opname SET disesuaikan_at = NOW() WHERE id = $1
```

**Duplication Level:** HIGH  
**Impact:** Code duplication in business logic.

---

## 4. Consolidation Opportunities

### 4.1 SAFE TO CONSOLIDATE

| Item | Current State | Target State | Risk |
|------|--------------|--------------|------|
| `send()` helper | Duplicated in all handlers | Extract to `backend/utils/response.js` | LOW |
| `getRoutePath()` | Duplicated in all handlers | Extract to `backend/utils/route.js` | LOW |
| Token parsing | Duplicated in 4 handlers | Extract to `backend/utils/auth.js` | MEDIUM |
| Users query | Different queries in 3 handlers | Create `backend/services/users.js` | MEDIUM |

### 4.2 LEAVE AS IS (Current Phase)

| Item | Reason |
|------|--------|
| Approval logic in v3-opname.js | Legacy workflow, different use case |
| Password verification in auth.js | Works correctly, changes risky |
| Status update logic | Would require significant refactoring |

### 4.3 Future Consolidation (Phase F+)

| Item | Description |
|------|-------------|
| Central auth middleware | Create `requireAuth()` and `requireAdmin()` middleware |
| User service layer | Extract user-related queries to dedicated service |
| Database connection pooling | Already handled by `services/db.js` |
| API response standardization | Create consistent error response format |

---

## 5. Technical Debt Assessment

### 5.1 Critical (Must Address Before Production)

| Item | Description | Location | Impact |
|------|-------------|----------|--------|
| Inconsistent password hashing | auth.js supports PBKDF2, users-api.js only SHA256 | users-api.js:15-17 | Users created via API cannot login via legacy portal |
| Status validation mismatch | approval-api.js accepts 'menunggu', v3-opname requires 'menunggu_approval' | approval-api.js vs v3-opname.js | Inconsistent workflow behavior |

### 5.2 High Priority (Address in Next Sprint)

| Item | Description | Location | Impact |
|------|-------------|----------|--------|
| Approval logic duplication | approve/reject exists in both v3-opname.js and approval-api.js | v3-opname.js:174-205, approval-api.js:230-303 | Maintenance burden, potential divergence |
| Missing authorization in v3-opname.js | No admin role check for approve action | v3-opname.js:174-195 | Security gap |
| Token refresh not implemented | Only access_token issued, no refresh mechanism | auth.js | Session management incomplete |

### 5.3 Medium Priority (Address in Future Sprint)

| Item | Description | Location | Impact |
|------|-------------|----------|--------|
| Code duplication in helpers | send(), getRoutePath(), getCurrentUser() repeated | All handlers | Maintenance burden |
| Inconsistent error messages | Mix of Indonesian and English | All handlers | UX inconsistency |
| No request validation middleware | Manual validation in each handler | All handlers | Code duplication |

### 5.4 Low Priority (Nice to Have)

| Item | Description | Location | Impact |
|------|-------------|----------|--------|
| No API versioning strategy | Mixed v1 and legacy routes | api/index.js | Future migration difficulty |
| No rate limiting | All endpoints unprotected | All handlers | DoS vulnerability |
| No request logging | Audit trail incomplete | All handlers | Debugging difficulty |

---

## 6. Architecture Recommendations

### 6.1 Current State Assessment

```
┌─────────────────────────────────────────────────────────────────┐
│                      api/index.js (Router)                       │
├─────────────┬─────────────┬─────────────┬─────────────┬──────────┤
│  auth.js    │ users-api.js│approval-api │settings-api│ v3-*.js  │
│  (Legacy)   │ (New)       │ (New)       │ (New)       │(Legacy)  │
├─────────────┼─────────────┼─────────────┼─────────────┼──────────┤
│ Login/Logout│ CRUD Users  │ List Approve│ Get Profile │ Opname   │
│ Token Build │ Roles/Stats │ Approve     │ Update Prof │ Workflow │
│ Password Vfy│ Enable/Disc │ Reject      │ Change Pass │ Detail   │
│             │ Reset Pass  │ Recount     │ System Info │ Chart    │
└─────────────┴─────────────┴─────────────┴─────────────┴──────────┘
                              │
                    ┌─────────┴─────────┐
                    │   services/db.js   │
                    │  (Connection Pool) │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Neon PostgreSQL  │
                    └──────────────────┘
```

### 6.2 Recommendation: ACCEPTABLE for Current Phase

**Rationale:**
1. All phases (B, C, D, E) are functional
2. No critical bugs reported
3. API endpoints are consistent (RESTful)
4. Database schema unchanged
5. Vercel deployment working

**Proceed to Dashboard Phase** with awareness of technical debt.

### 6.3 Recommended Actions Before Phase F

| Priority | Action | Effort |
|----------|--------|--------|
| HIGH | Align password hashing in users-api.js with auth.js | 2 hours |
| HIGH | Add admin authorization check in v3-opname.js approve | 1 hour |
| MEDIUM | Extract shared helpers (send, getRoutePath) to utils | 4 hours |
| MEDIUM | Document status validation rules | 1 hour |

### 6.4 Long-term Architecture (Post-Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│                      api/index.js (Router)                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │  middleware/          │
                    │  - requireAuth.js     │
                    │  - requireAdmin.js    │
                    │  - validateRequest.js │
                    │  - errorHandler.js    │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────┴───────┐   ┌───────────┴───────────┐   ┌───────┴───────┐
│  services/    │   │  controllers/         │   │  legacy/      │
│  - db.js      │   │  - authController.js │   │  (v3-*.js)    │
│  - users.js   │   │  - usersController.js│   │               │
│  - opname.js  │   │  - approvalController │   │  To be        │
│               │   │  - settingsController │   │  deprecated   │
└───────────────┘   └───────────────────────┘   └───────────────┘
```

---

## 7. Summary

### 7.1 Findings Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| Total API endpoints | 30+ | - |
| Duplicated helpers | 4 | MEDIUM |
| Duplicated business logic | 2 | HIGH |
| Duplicate queries | 3 | MEDIUM |
| Critical technical debt | 2 | CRITICAL |
| High priority debt | 3 | HIGH |

### 7.2 Verdict

```
═══════════════════════════════════════════════════════════════════
                         ACCEPTABLE
         Current architecture is sufficient for Phase E.
         Proceed to Dashboard phase with awareness of debt.
═══════════════════════════════════════════════════════════════════

BEFORE PHASE F, address:
1. Password hashing consistency (users-api.js)
2. Authorization in v3-opname.js
3. Document status validation rules
```

### 7.3 Files Analyzed

| File | Lines | Purpose |
|------|-------|---------|
| backend/auth.js | 127 | Authentication |
| backend/users-api.js | 400+ | User management |
| backend/approval-api.js | 520+ | Approval workflow |
| backend/settings-api.js | 300+ | Settings & profile |
| backend/v3-opname.js | 241 | Stock opname legacy |
| api/index.js | 159 | API router |

---

## 8. Appendices

### A. Duplicate Helper Functions

| Function | Files | Lines |
|----------|-------|-------|
| send() | All 5 handlers | ~5 each |
| getRoutePath() | users-api, approval-api, settings-api | ~8 each |
| getCurrentUser() | users-api, approval-api, settings-api | ~15 each |

### B. Shared Database Tables

| Table | Queries | Handlers |
|-------|---------|----------|
| users | 4 | auth, users-api, settings-api |
| stok_opname_perintah | 2 | v3-opname, approval-api |
| stok_opname | 2 | v3-opname, approval-api |

### C. Inconsistent Patterns

| Pattern | In auth.js | In users-api.js |
|---------|------------|-----------------|
| Password hash | PBKDF2 & SHA256 | SHA256 only |
| Token format | base64url + random | base64url + random |
| Response format | {success, message, data} | {success, data} |

---

*Audit completed by Senior Software Architect*  
*Date: 2026-06-10*