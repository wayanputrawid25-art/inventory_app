# CV EPIC Warehouse - Role System Audit

**Document Version:** 1.0.0  
**Audit Date:** 2026-06-10  
**Purpose:** Document existing roles, permissions, and identify missing permissions

---

## 1. Role Definition Overview

The system defines 3 roles for user access control:

| Role | Value | Description | Count |
|------|-------|-------------|-------|
| Admin | `admin` | Full system access | — |
| Staff Gudang | `staff_gudang` | Warehouse operations | — |
| Checker Opname | `checker_opname` | Stock checking | — |

**Source Files:**
- Backend: `backend/auth.js` (authentication logic)
- Frontend: `js/dashboard.js` (menu access control)
- Models: `flask_app/models/__init__.py` (RoleEnum definition)

---

## 2. Existing Roles

### 2.1 Admin Role

```javascript
// Frontend: js/dashboard.js
const ADMIN_MENUS = [
  "dashboard", "admin", "penjualan", "persediaan",
  "forecast", "opname", "taskcenter", "approvalcenter",
  "activity", "audit", "reports"
];
```

**Access Rights:**
| Feature | Permission | Notes |
|---------|------------|-------|
| Dashboard | ✅ Full | All KPI, charts, admin features |
| Penjualan | ✅ Full | Sales monitoring, import, templates |
| Persediaan | ✅ Full | Inventory overview, stock system |
| Forecast | ✅ Full | Sales prediction |
| Opname | ✅ Full | Admin opname interface |
| Task Center | ✅ Full | Task management |
| Approval Center | ✅ Full | Approval workflow |
| Activity | ✅ Full | Activity timeline |
| Audit | ✅ Full | Audit stok outlet |
| Reports | ✅ Full | Reporting |
| User Management | ✅ Full | CRUD users |
| Settings | ✅ Full | System settings |

**Backend Validation:**
```javascript
// backend/auth.js
if (portal === "admin" && user.role !== "admin") {
  return send(res, 401, { message: "Portal admin hanya untuk akun admin" });
}
```

### 2.2 Staff Gudang Role

```javascript
// Frontend: js/dashboard.js
const USER_ONLY_MENUS = ["opname"];
```

**Access Rights:**
| Feature | Permission | Notes |
|---------|------------|-------|
| Opname | ✅ Limited | Operator dashboard only |
| My Dashboard | ✅ Limited | Personal stats |
| Tasks SO | ✅ Full | Assigned stock opname tasks |
| History | ✅ Full | Own opname history |
| Profile | ✅ Full | View own profile |

**Default Menu:** `opname` (redirected to operator dashboard)

### 2.3 Checker Opname Role

**Current Implementation:**
- Same as `staff_gudang` (no separate handling)
- `getCurrentUserRole()` returns the `role` field from auth token
- Both roles receive `USER_ONLY_MENUS = ["opname"]`

**Issue:** No distinction between `staff_gudang` and `checker_opname` in frontend.

---

## 3. Permission Matrix

### 3.1 Page Access Permissions

| Page/Menu | Admin | Staff Gudang | Checker Opname |
|-----------|-------|--------------|----------------|
| Dashboard | ✅ | ❌ | ❌ |
| Penjualan | ✅ | ❌ | ❌ |
| Persediaan | ✅ | ❌ | ❌ |
| Forecast | ✅ | ❌ | ❌ |
| Opname (Admin) | ✅ | ❌ | ❌ |
| Opname (Operator) | ✅ | ✅ | ✅ |
| Task Center | ✅ | ❌ | ❌ |
| Approval Center | ✅ | ❌ | ❌ |
| Activity | ✅ | ❌ | ❌ |
| Audit | ✅ | ❌ | ❌ |
| Reports | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| My Dashboard | ✅ | ✅ | ✅ |
| Tasks SO | ✅ | ✅ | ✅ |
| History | ✅ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ |

### 3.2 API Permission Summary

| API Endpoint | Admin | Staff Gudang | Checker Opname |
|--------------|-------|--------------|----------------|
| GET /v3-dashboard | ✅ | ❌ (sees operator) | ❌ |
| GET /kpi | ✅ | ❌ | ❌ |
| GET /chart | ✅ | ❌ | ❌ |
| GET /v3-penjualan | ✅ | ❌ | ❌ |
| GET /v3-persediaan | ✅ | ❌ | ❌ |
| GET /forecast | ✅ | ❌ | ❌ |
| GET /v3-opname | ✅ | ❌ (sees own) | ❌ (sees own) |
| POST /v3-opname | ✅ | ❌ | ❌ |
| GET /opname-perintah | ✅ | ✅ | ✅ |
| POST /opname-perintah | ✅ | ✅ | ✅ |
| GET /opname-history | ✅ | ✅ (own only) | ✅ (own only) |
| POST /simpan-opname | ✅ | ✅ (own only) | ✅ (own only) |
| POST /sesuaikan-opname | ✅ | ✅ (own only) | ✅ (own only) |
| POST /import-* | ✅ | ❌ | ❌ |
| POST /add-* | ✅ | ❌ | ❌ |
| GET /audit | ✅ | ❌ | ❌ |
| GET /outlet-list | ✅ | ❌ | ❌ |

---

## 4. Backend Role Enforcement

### 4.1 Authentication (`backend/auth.js`)

```javascript
// Login portal validation
if (portal === "admin" && user.role !== "admin") {
  return send(res, 401, { message: "Portal admin hanya untuk akun admin" });
}
if (portal === "user" && user.role === "admin") {
  return send(res, 401, { message: "Akun admin harus masuk melalui portal admin" });
}

// Token payload includes role
function buildToken(user, portal) {
  return {
    sub: String(user.id),
    username: user.username,
    role: user.role,  // Included in token
    portal,
    iat: Date.now()
  };
}
```

**Status:** ✅ Role is embedded in auth token

### 4.2 API Route Protection

**Current Implementation:**
- Auth middleware NOT implemented per-route
- Role checking happens in frontend only (`canAccessMenu()`)
- Backend routes have NO role validation

**Issue:** Anyone with valid token can access any endpoint.

---

## 5. Frontend Role Enforcement

### 5.1 Menu Access Control

```javascript
// js/dashboard.js
function canAccessMenu(menu) {
  return getAllowedMenus().includes(menu);
}

function selectMenu(event, menu) {
  if (!canAccessMenu(menu)) {
    showToast('Akses user hanya untuk Stok Opname', false);
    menu = getDefaultMenuForRole();
  }
  // ... load menu
}
```

### 5.2 Content Tab Visibility

```javascript
// Opname menu - different views based on role
if (menu === "opname") {
  if (getCurrentUserRole() !== 'admin') {
    document.getElementById("operatorTab").style.display = "block";
    loadOperatorDashboard();
  } else {
    document.getElementById("opnameTab").style.display = "block";
    // Full admin interface
  }
}
```

### 5.3 Admin Menu Item Visibility

```javascript
// Show/hide admin menu item based on role
const adminMenuItem = document.getElementById("adminMenuItem");
const isAdmin = getCurrentUserRole() === 'admin';
if (adminMenuItem) {
  adminMenuItem.style.display = isAdmin ? 'flex' : 'none';
}
```

---

## 6. Missing Permissions / Issues

### 6.1 Critical Gaps

| Issue | Severity | Description |
|-------|----------|-------------|
| MG-01 | 🔴 CRITICAL | No backend API authorization - all endpoints accessible with any valid token |
| MG-02 | 🔴 CRITICAL | No distinction between staff_gudang and checker_opname in frontend |
| MG-03 | 🟡 HIGH | No row-level security - users can potentially access other users' data |
| MG-04 | 🟡 HIGH | No permission for viewing own opname tasks vs creating new opname |

### 6.2 Missing Permissions

| Permission | Needed For | Status |
|------------|------------|--------|
| View own tasks | staff_gudang, checker_opname | ✅ Implemented |
| Submit opname results | staff_gudang, checker_opname | ✅ Implemented |
| Approve opname results | admin only | ❌ Not enforced on backend |
| View all opname history | admin only | ❌ Not enforced on backend |
| Import data | admin only | ❌ Not enforced on backend |
| Export data | admin only | ❌ Not enforced on backend |
| Manage users | admin only | ❌ Not enforced on backend |
| View audit logs | admin only | ❌ Not enforced on backend |

### 6.3 Role Inconsistencies

| Issue | Description |
|-------|-------------|
| **Dual Login Portals** | Separate admin/user login endpoints but same auth handler |
| **Model Mismatch** | Flask models have RoleEnum but backend uses plain string roles |
| **No Role Update** | No API to change user roles after creation |
| **No Role in DB** | PostgreSQL users table doesn't have role field checked in backend queries |

---

## 7. Permission Gap Analysis

### 7.1 Admin-Only Operations (Not Enforced)

| Operation | Backend Check | Risk |
|------------|---------------|------|
| Create opname session | ❌ None | Any user can create |
| Approve opname | ❌ None | Any user can approve |
| Delete records | ❌ None | Any user can delete |
| Access audit log | ❌ None | Any user can view |
| Import data | ❌ None | Any user can import |
| Manage outlets | ❌ None | Any user can modify |
| Manage products | ❌ None | Any user can modify |

### 7.2 User-Limited Operations (Not Enforced)

| Operation | Backend Check | Risk |
|----------|---------------|------|
| View own tasks only | ❌ None | Can view all tasks |
| Submit to own session only | ❌ None | Can submit to any session |
| View own history only | ❌ None | Can view all history |

---

## 8. Recommended Permission Model

### 8.1 Role Definitions

```javascript
const ROLES = {
  ADMIN: 'admin',
  STAF_GUDANG: 'staff_gudang',  // Warehouse staff
  CHECKER_OPNAME: 'checker_opname'  // Stock checker
};

const PERMISSIONS = {
  // Dashboard
  VIEW_ADMIN_DASHBOARD: ['admin'],
  VIEW_OPERATOR_DASHBOARD: ['admin', 'staff_gudang', 'checker_opname'],
  
  // Sales
  VIEW_SALES: ['admin'],
  CREATE_SALE: ['admin'],
  IMPORT_SALES: ['admin'],
  EXPORT_SALES: ['admin'],
  
  // Inventory
  VIEW_INVENTORY: ['admin'],
  MANAGE_PRODUCTS: ['admin'],
  VIEW_STOCK_SYSTEM: ['admin'],
  
  // Forecast
  VIEW_FORECAST: ['admin'],
  EXPORT_FORECAST: ['admin'],
  
  // Opname
  VIEW_OPNAME_ADMIN: ['admin'],
  CREATE_OPNAME: ['admin'],
  APPROVE_OPNAME: ['admin'],
  VIEW_OPNAME_OPERATOR: ['staff_gudang', 'checker_opname'],
  SUBMIT_OPNAME_RESULTS: ['staff_gudang', 'checker_opname'],
  VIEW_OWN_OPNAME_HISTORY: ['staff_gudang', 'checker_opname'],
  
  // Tasks
  VIEW_TASK_CENTER: ['admin'],
  VIEW_OWN_TASKS: ['staff_gudang', 'checker_opname'],
  
  // Approval
  VIEW_APPROVAL_CENTER: ['admin'],
  APPROVE_REQUESTS: ['admin'],
  
  // Audit
  VIEW_AUDIT_LOGS: ['admin'],
  
  // Users
  MANAGE_USERS: ['admin'],
  VIEW_OWN_PROFILE: ['admin', 'staff_gudang', 'checker_opname'],
  
  // Settings
  MANAGE_SETTINGS: ['admin']
};
```

### 8.2 API Authorization Pattern

```javascript
// Example: backend middleware pattern (not implemented)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Akses ditolak. Tidak memiliki izin.' 
      });
    }
    next();
  };
}

// Usage
app.get('/v3-opname', requireRole(['admin']), v3OpnameHandler);
app.get('/opname-history', requireRole(['admin', 'staff_gudang', 'checker_opname']), 
  filterByUserId(opnameHistoryHandler));
```

---

## 9. Data Access Control

### 9.1 Row-Level Security Needed

| Table | Owner Column | Admin Can See | User Can See |
|-------|--------------|---------------|--------------|
| stok_opname_session | checker_id | All | Own only |
| stok_opname_perintah | user_id | All | Own only |
| transaksi_scan | user_id | All | Own only |
| audit_log | user_id | All | Own only |
| notifikasi | user_id | All | Own only |

### 9.2 Filter Implementation Needed

```javascript
// Backend: Filter opname history by user role
function getOpnameHistory(req, res) {
  const userRole = req.user?.role;
  const userId = req.user?.sub;
  
  let query = "SELECT * FROM stok_opname_session";
  
  // Non-admin users can only see their own records
  if (userRole !== 'admin') {
    query += " WHERE checker_id = $1";
    params = [userId];
  }
  
  // Execute query...
}
```

---

## 10. Audit Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Add role-based middleware to all API routes | Security |
| 2 | Implement row-level security for opname data | Data isolation |
| 3 | Distinguish staff_gudang vs checker_opname | Feature parity |
| 4 | Add permission constants and check functions | Maintainability |
| 5 | Create role management API | Admin features |
| 6 | Add audit logging for permission denials | Compliance |

---

*Document generated by project audit*  
*Last updated: 2026-06-10*