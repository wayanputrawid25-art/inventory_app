# CV EPIC Warehouse - Project Audit Report

**Document Version:** 1.0.0  
**Audit Date:** 2026-06-10  
**Project:** CV EPIC Warehouse Inventory Control Suite V3  
**Repository:** inventory_app

---

## Executive Summary

This project audit provides a comprehensive analysis of the CV EPIC Warehouse inventory management system. The system is currently in Version 3 (V3) and exhibits significant architectural complexity due to mixed technology stacks and accumulated legacy code.

**Overall Architecture Score:** 5/10 (Medium Risk)

---

## 1. Folder Structure

```
inventory_app/
├── api/
│   └── index.js                 # API router (Node.js Express)
├── assets/
│   └── logo.png
├── alembic/                     # Flask database migrations (LEGACY)
│   └── versions/
├── backend/                     # Node.js route handlers (37 files)
│   ├── auth.js
│   ├── chart.js
│   ├── v3-*.js                  # V3 versions of modules
│   ├── opname-*.js              # Stock opname handlers
│   ├── import-*.js             # Import handlers
│   ├── template-*.js           # Template handlers
│   └── [other handlers]
├── css/                         # Root CSS (ACTIVE)
│   ├── design-system.css
│   ├── style.css
│   ├── layout.css
│   ├── sidebar.css
│   └── table.css
├── flask_app/                   # Flask Blueprint API (LEGACY)
│   ├── __init__.py
│   ├── blueprints/
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── opname.py
│   │   ├── produk.py
│   │   ├──rak.py
│   │   ├── scan.py
│   │   ├── stok.py
│   │   ├── users.py
│   │   ├── barcode.py
│   │   └── report.py
│   ├── models/
│   │   └── __init__.py         # SQLAlchemy models
│   ├── services/
│   └── utils/
├── js/                          # Root JavaScript (ACTIVE)
│   ├── dashboard.js
│   ├── router.js
│   ├── sidebar-ui.js
│   ├── dashboard-opname-perintah.js
│   └── user-management.js
├── migrations/                  # SQL migration files
│   ├── migration_v3_users.sql
│   ├── migration_auth_login.sql
│   ├── migration_neon_safe.sql
│   ├── migration_opname_kategori.sql
│   ├── migration_opname_perintah.sql
│   └── migration_opname_sesuaikan.sql
├── public/                      # Duplicate static files
│   ├── index.html              # DUPLICATE of root index.html
│   ├── css/                     # DUPLICATE of /css/
│   │   ├── layout.css
│   │   ├── sidebar.css
│   │   ├── style.css
│   │   └── table.css
│   ├── js/                      # DUPLICATE of /js/
│   │   ├── dashboard.js
│   │   ├── sidebar-ui.js
│   │   └── dashboard-opname-perintah.js
│   ├── static/icons/
│   └── assets/
├── scripts/                     # Utility scripts
│   ├── audit-db.js
│   ├── migrate_postgres_to_mysql.js
│   ├── analyze-users.js
│   ├── analyze-products.js
│   └── [other scripts]
├── services/
│   └── db.js                   # PostgreSQL connection pool
├── static/                      # Static assets
│   └── icons/
├── docs/                        # Documentation (22 files)
│   ├── api-audit.md
│   ├── database-audit.md
│   ├── repository-audit.md
│   └── [other docs]
├── index.html                  # MAIN entry point (V3)
├── index-v3.html               # DUPLICATE entry point
├── index-refactored.html       # DUPLICATE entry point
├── server.js                   # Express server entry point
├── app.py                      # Flask app entry point (LEGACY)
├── config.py                   # Flask configuration
├── package.json                # Node.js dependencies
├── requirements.txt           # LEGACY (says no Python deps needed)
├── vercel.json                 # Vercel deployment config
└── [config files, SQL schemas]
```

---

## 2. Active Modules

### 2.1 Primary Backend (Node.js/Express)

| Module | Files | Status | Purpose |
|--------|-------|--------|---------|
| API Router | api/index.js | ✅ Active | Main routing hub |
| Auth | backend/auth.js | ✅ Active | Login/logout with PBKDF2/SHA256 |
| Dashboard | backend/v3-dashboard.js | ✅ Active | V3 dashboard data |
| Chart | backend/v3-chart.js | ✅ Active | V3 chart data |
| Penjualan | backend/v3-penjualan.js | ✅ Active | V3 sales module |
| Persediaan | backend/v3-persediaan.js | ✅ Active | V3 inventory |
| Opname | backend/v3-opname.js | ✅ Active | V3 stock opname |
| Opname Detail | backend/v3-opname-detail.js | ✅ Active | V3 opname detail |
| Import Handlers | backend/import-*.js | ✅ Active | Excel/CSV import |
| Add Handlers | backend/add-*.js | ✅ Active | CRUD operations |
| KPI | backend/kpi.js | ✅ Active | KPI calculations |
| Forecast | backend/forecast.js | ✅ Active | Sales forecasting |
| Audit | backend/audit.js | ✅ Active | Audit trail |
| Outlet Management | backend/outlet-*.js | ✅ Active | Outlet operations |

**Total Active Backend Files:** 37

### 2.2 Frontend (Vanilla JavaScript SPA)

| Module | Files | Status | Purpose |
|--------|-------|--------|---------|
| Router | js/router.js | ✅ Active | Client-side routing |
| Dashboard | js/dashboard.js | ✅ Active | Dashboard UI logic |
| Sidebar | js/sidebar-ui.js | ✅ Active | Sidebar interactions |
| Opname Perintah | js/dashboard-opname-perintah.js | ✅ Active | Opname task UI |
| User Management | js/user-management.js | ✅ Active | User CRUD UI |

### 2.3 Database Layer

| Service | Technology | Status |
|---------|------------|--------|
| Connection Pool | PostgreSQL (pg) | ✅ Active |
| ORM | SQLAlchemy (Flask legacy) | ⚠️ Partial |
| Migrations | Alembic + SQL scripts | ⚠️ Mixed |

---

## 3. Legacy Modules

### 3.1 Flask Backend (DEPRECATED)

| Module | Status | Notes |
|--------|--------|-------|
| app.py | ⚠️ Legacy | Flask entry point, not used by Vercel |
| flask_app/blueprints/* | ⚠️ Legacy | 10 blueprints, no active consumers |
| flask_app/models/ | ⚠️ Legacy | SQLAlchemy models defined but not connected |
| config.py | ⚠️ Legacy | Flask configuration, unused |

**Reason for Legacy:** The system migrated from Flask to Node.js/Express. Flask app.py is never executed in production (Vercel uses server.js).

### 3.2 Database Migration Scripts

| File | Status | Purpose |
|------|--------|---------|
| alembic/versions/* | ⚠️ Legacy | Alembic migrations for Flask |
| migrations/*.sql | ⚠️ Legacy | SQL migrations for Postgres→MySQL |
| schema.sql | ⚠️ Legacy | Original schema |
| database_schema_mysql_complete.sql | ⚠️ Legacy | MySQL schema |

### 3.3 Legacy Static Files

| Path | Status | Issue |
|------|--------|-------|
| public/ | ⚠️ Duplicate | Entire folder mirrors root static files |
| index-v3.html | ⚠️ Duplicate | Alternative entry point |
| index-refactored.html | ⚠️ Duplicate | Alternative entry point |

---

## 4. Duplicate Analysis

### 4.1 Duplicate Pages (Entry Points)

| File | Purpose | Usage |
|------|---------|-------|
| index.html | ✅ **PRIMARY** | Main entry point with auth gate, sidebar, header |
| index-v3.html | ⚠️ Duplicate | Alternative V3 layout (not used) |
| index-refactored.html | ⚠️ Duplicate | Alternative refactored layout (not used) |
| public/index.html | ⚠️ Duplicate | Mirrors root index.html |

**Issue:** 4 entry point HTML files cause confusion about which is the canonical source.

### 4.2 Duplicate CSS Files

| Root Path | Duplicate Path | Status |
|-----------|---------------|--------|
| /css/style.css | /public/css/style.css | ⚠️ Identical |
| /css/layout.css | /public/css/layout.css | ⚠️ Identical |
| /css/sidebar.css | /public/css/sidebar.css | ⚠️ Identical |
| /css/table.css | /public/css/table.css | ⚠️ Identical |
| /css/design-system.css | — | ✅ Unique |

**Issue:** 4 CSS files are duplicated in public/ folder, serving no purpose.

### 4.3 Duplicate JavaScript Files

| Root Path | Duplicate Path | Status |
|-----------|---------------|--------|
| /js/dashboard.js | /public/js/dashboard.js | ⚠️ Identical |
| /js/sidebar-ui.js | /public/js/sidebar-ui.js | ⚠️ Identical |
| /js/dashboard-opname-perintah.js | /public/js/dashboard-opname-perintah.js | ⚠️ Identical |

**Issue:** 3 JS files are duplicated in public/ folder.

### 4.4 Duplicate API Endpoints

| V1 Route | V3 Route | Status |
|----------|----------|--------|
| /api/kpi | — | ✅ Active |
| /api/chart | /api/v3-chart | ⚠️ Duplicates |
| /api/outlet-list | — | ✅ Active |
| /api/persediaan | /api/v3-persediaan | ⚠️ Duplicates |
| /api/audit | — | ✅ Active |

**Issue:** V3 routes coexist with V1 routes, creating parallel functionality.

---

## 5. Duplicate APIs

### 5.1 API Route Duplication (Node.js Backend)

| V1 API | V3 API | Purpose |
|--------|--------|---------|
| GET /chart | GET /v3-chart | Chart data |
| GET /persediaan | GET /v3-persediaan | Inventory |
| GET /opname-history | GET /v3-opname | Stock opname |
| GET /opname-perintah | — | Opname commands |
| GET /stok-sistem | — | System stock |
| POST /simpan-opname | POST /v3-opname | Save opname |
| POST /sesuaikan-opname | — | Adjust opname |

**Issue:** V3 routes were added alongside V1 routes without deprecation.

### 5.2 Authentication Duplication

| Backend | Auth Endpoint | Status |
|---------|---------------|--------|
| Node.js | POST /api/v1/auth/login | ✅ Active |
| Node.js | POST /api/v1/auth/login/admin | ✅ Active |
| Node.js | POST /api/v1/auth/login/user | ✅ Active |
| Flask | /api/v1/auth/* | ⚠️ Legacy (unused) |

**Issue:** Flask auth endpoints never get called (server.js routes to api/index.js).

---

## 6. Dead Code Identification

### 6.1 Completely Unused Files

| File | Type | Reason |
|------|------|--------|
| flask_app/ | Directory | Flask app never executed |
| alembic/ | Directory | Alembic migrations unused |
| public/ | Directory | Mirrors root static files |
| index-v3.html | HTML | Alternative, never served |
| index-refactored.html | HTML | Alternative, never served |
| requirements.txt | Config | Says "no Python deps needed" |
| migrations/*.sql | SQL | MySQL migrations, using Postgres |

**Estimated Dead Code:** ~15 files (~2.5 MB)

### 6.2 Partially Used Code

| Module | Usage | Issue |
|--------|-------|-------|
| flask_app/blueprints/ | 0 requests | All blueprints registered but never called |
| flask_app/models/ | 0 queries | Models defined but queries go to Node.js |
| config.py | 0 imports | Flask config never loaded |

### 6.3 Obsolete Patterns

| Pattern | Status | Issue |
|---------|--------|-------|
| PostgreSQL + MySQL mixed | ⚠️ Legacy | MySQL schema exists but Postgres used |
| generate_series for charts | ⚠️ Postgres | Only works on Postgres, not MySQL |
| Werkzeug password hash | ⚠️ Legacy | Code supports old hash format |

---

## 7. Framework Usage Analysis

### 7.1 Current Framework Stack

| Layer | Technology | Version | Status |
|-------|------------|---------|--------|
| Frontend Runtime | Vanilla JS (ES6) | — | ✅ Active |
| Backend Runtime | Node.js | >=18.0.0 | ✅ Active |
| HTTP Framework | Express.js | 4.18.2 | ✅ Active |
| Database | PostgreSQL | — | ✅ Active |
| Secondary Backend | Flask | — | ⚠️ Legacy |
| ORM | SQLAlchemy | — | ⚠️ Legacy |
| CSS Framework | Custom CSS | — | ✅ Active |
| Icons | Lucide | — | ✅ Active |
| Build Tool | None | — | ✅ Static |
| Deployment | Vercel | — | ✅ Active |

### 7.2 Frontend Architecture

**Pattern:** Single Page Application (SPA) with vanilla JavaScript

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Header (Auth, Theme, User Info)                  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌────────────┬──────────────────────────────────────┐  │
│  │            │                                      │  │
│  │  Sidebar   │         Content Area                 │  │
│  │  (Admin/   │  (Dynamic based on route)            │  │
│  │   User)    │                                      │  │
│  │            │                                      │  │
│  └────────────┴──────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Login Modal (Auth Gate)                          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   js/router.js  │  ← Client-side routing
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   Route Handlers                        │
│  ├── dashboard.js (206KB) - Main UI logic              │
│  ├── sidebar-ui.js - Sidebar interactions              │
│  ├── dashboard-opname-perintah.js - Opname tasks      │
│  └── user-management.js - User CRUD                   │
└─────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- No frontend framework (React, Vue, Angular)
- Large monolithic dashboard.js (206KB)
- Client-side routing via custom router
- CSS loaded from multiple files (design-system.css, style.css)
- Lucide icons for UI elements

### 7.3 Backend Architecture

**Pattern:** Express.js REST API with PostgreSQL

```
┌─────────────────────────────────────────────────────────┐
│                    server.js                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Express App (Static files, API routing)          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                  api/index.js                           │
│  Route Dispatcher (38 routes)                           │
└─────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬──────┬──────┬──────┬──────┬──────┐
    ▼         ▼      ▼      ▼      ▼      ▼      ▼
┌───────┐ ┌───────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Auth  │ │Chart  │ │KPI   │ │Opname│ │Import│ │Sales │
│       │ │       │ │      │ │      │ │      │ │      │
└───────┘ └───────┘ └──────┘ └──────┘ └──────┘ └──────┘
    │         │       │       │       │       │
    └─────────┴───────┴───────┴───────┴───────┘
                     │
                     ▼
          ┌─────────────────┐
          │  services/db.js  │
          │  PostgreSQL Pool │
          └─────────────────┘
```

**Key Characteristics:**
- ES Modules (import/export)
- PostgreSQL connection pool (max 3 connections)
- Route-based handler pattern
- JWT token authentication (custom implementation)
- No middleware framework (Express only)

### 7.4 Deployment Architecture

**Platform:** Vercel Serverless Functions

```yaml
vercel.json:
  - Build: @vercel/node
  - Entry: server.js
  - Routes:
    - /api/* → server.js
    - /* → server.js
```

**Deployment Flow:**
1. Vercel receives request
2. Routes to server.js
3. Express handles static files or API routes
4. API routes dispatch to api/index.js
5. Handlers query PostgreSQL
6. Response returns JSON or static files

---

## 8. Technical Debt

### 8.1 High Priority Technical Debt

| ID | Item | Impact | Effort |
|----|------|--------|--------|
| TD-01 | Delete duplicate public/ folder | Confusion, maintenance | Low |
| TD-02 | Remove legacy Flask code | Reduced complexity | Medium |
| TD-03 | Consolidate index.html variants | Code clarity | Low |
| TD-04 | Split monolithic dashboard.js | Maintainability | High |
| TD-05 | Remove MySQL migration files | Reduced confusion | Low |

### 8.2 Medium Priority Technical Debt

| ID | Item | Impact | Effort |
|----|------|--------|--------|
| TD-06 | Add API documentation (OpenAPI/Swagger) | Developer experience | Medium |
| TD-07 | Implement centralized error handling | Reliability | Medium |
| TD-08 | Add request validation (Joi/Zod) | Security | Medium |
| TD-09 | Split CSS into components | Maintainability | Medium |
| TD-10 | Add integration tests | Quality | High |

### 8.3 Low Priority Technical Debt

| ID | Item | Impact | Effort |
|----|------|--------|--------|
| TD-11 | Document environment variables | Developer onboarding | Low |
| TD-12 | Clean up old migration scripts | Code hygiene | Low |
| TD-13 | Update requirements.txt | Accuracy | Low |
| TD-14 | Add database query logging | Debugging | Low |

---

## 9. Risk Assessment

### 9.1 Security Risks

| Risk | Severity | Description |
|------|----------|-------------|
| R-01 | 🔴 HIGH | Custom JWT implementation (no library) |
| R-02 | 🟡 MEDIUM | No rate limiting on auth endpoints |
| R-03 | 🟡 MEDIUM | Password stored with legacy PBKDF2/SHA256 support |
| R-04 | 🟡 MEDIUM | No CSRF protection (SPA uses localStorage) |
| R-05 | 🟢 LOW | No input validation on all endpoints |

### 9.2 Operational Risks

| Risk | Severity | Description |
|------|----------|-------------|
| R-06 | 🔴 HIGH | No database connection pooling monitoring |
| R-07 | 🟡 MEDIUM | No error tracking/logging service |
| R-08 | 🟡 MEDIUM | PostgreSQL connection pool limited to 3 |
| R-09 | 🟢 LOW | No health check endpoint for load balancers |
| R-10 | 🟢 LOW | No automated backups configured |

### 9.3 Technical Risks

| Risk | Severity | Description |
|------|----------|-------------|
| R-11 | 🔴 HIGH | Duplicate code creates sync issues |
| R-12 | 🟡 MEDIUM | Large dashboard.js (206KB) affects load time |
| R-13 | 🟡 MEDIUM | No frontend build process (no minification) |
| R-14 | 🟡 MEDIUM | Mixed framework stack (Node + Flask remnants) |
| R-15 | 🟢 LOW | No CDN configured for static assets |

### 9.4 Risk Summary

| Category | High | Medium | Low | Total |
|----------|------|--------|-----|-------|
| Security | 1 | 3 | 1 | 5 |
| Operational | 1 | 2 | 2 | 5 |
| Technical | 1 | 3 | 2 | 6 |
| **Total** | 3 | 8 | 5 | **16** |

---

## 10. Architecture Score

### Scoring Matrix

| Dimension | Weight | Score | Max | Weighted |
|-----------|--------|-------|-----|----------|
| Code Organization | 20% | 4 | 10 | 0.8 |
| Framework Consistency | 20% | 3 | 10 | 0.6 |
| Duplicate Code | 15% | 2 | 10 | 0.3 |
| Documentation | 10% | 7 | 10 | 0.7 |
| Testing Coverage | 15% | 1 | 10 | 0.15 |
| Security Posture | 10% | 5 | 10 | 0.5 |
| Maintainability | 10% | 4 | 10 | 0.4 |
| **Total** | 100% | — | — | **3.95** |

### Score Interpretation

| Score | Grade | Description |
|-------|-------|-------------|
| 8-10 | A | Excellent architecture |
| 6-7.9 | B | Good architecture, minor issues |
| 4-5.9 | C | Average, needs improvement |
| 2-3.9 | D | Poor architecture, significant issues |
| 0-1.9 | F | Critical issues |

**Final Score: 3.95/10 (Grade: D - Poor Architecture)**

### Key Issues Affecting Score

1. **Duplicate Code (2/10):** Public folder duplication, multiple index.html variants
2. **Framework Consistency (3/10):** Mixed Node.js/Flask stack with no clear primary
3. **Testing Coverage (1/10):** No tests configured
4. **Code Organization (4/10):** Monolithic files, inconsistent patterns
5. **Security Posture (5/10):** Custom auth, no rate limiting, no input validation

---

## 11. Recommendations

### 11.1 Immediate Actions (1-2 weeks)

1. **Delete public/ folder** - It mirrors root static files
2. **Delete index-v3.html and index-refactored.html** - Not used
3. **Update README** - Document actual entry point (index.html)
4. **Add health check endpoint** - GET /api/health for monitoring

### 11.2 Short-term Actions (1-2 months)

1. **Remove Flask code** - Delete flask_app/, app.py, config.py, alembic/
2. **Update requirements.txt** - Either remove or document Python scripts
3. **Clean up migrations/** - Remove MySQL migration files
4. **Add error logging** - Integrate error tracking service
5. **Implement rate limiting** - Protect auth endpoints

### 11.3 Medium-term Actions (3-6 months)

1. **Split dashboard.js** - Separate into modules by feature
2. **Add frontend build** - Minify CSS/JS, add CDN
3. **Implement API documentation** - OpenAPI/Swagger
4. **Add integration tests** - Test critical paths
5. **Add request validation** - Joi or Zod schemas

### 11.4 Long-term Actions (6+ months)

1. **Consider frontend framework** - React or Vue for better maintainability
2. **Implement proper auth** - OAuth2 or proper JWT library
3. **Add monitoring** - Database metrics, API performance
4. **Code review process** - Prevent duplication

---

## 12. Appendix

### A. File Count Summary

| Category | Count | Est. Size |
|----------|-------|-----------|
| Total Files | 200+ | ~15 MB |
| Active Backend | 37 | ~1 MB |
| Active Frontend | 5 | ~300 KB |
| CSS Files | 5 | ~200 KB |
| Legacy Files | 50+ | ~5 MB |
| Documentation | 22 | ~500 KB |

### B. Dependencies

**Node.js (package.json):**
- express: ^4.18.2
- cors: ^2.8.5
- dotenv: ^16.3.1
- mysql2: ^3.22.3
- pg: ^8.11.0

**Python (requirements.txt):**
- None (file says "no Python deps needed")

### C. API Routes Summary

| Method | Route | Handler | Status |
|--------|-------|---------|--------|
| POST | /api/v1/auth/login | auth.js | ✅ |
| POST | /api/v1/auth/login/admin | auth.js | ✅ |
| POST | /api/v1/auth/login/user | auth.js | ✅ |
| GET | /api/kpi | kpi.js | ✅ |
| GET | /api/chart | chart.js | ✅ |
| GET | /api/v3-dashboard | v3-dashboard.js | ✅ |
| GET | /api/v3-opname | v3-opname.js | ✅ |
| POST | /api/v3-opname | v3-opname.js | ✅ |
| PUT | /api/v3-opname | v3-opname.js | ✅ |
| GET | /api/v3-chart | v3-chart.js | ✅ |
| GET | /api/v3-persediaan | v3-persediaan.js | ✅ |
| GET | /api/v3-penjualan | v3-penjualan.js | ✅ |
| POST | /api/import-penjualan | import-penjualan.js | ✅ |
| POST | /api/add-penjualan | add-penjualan.js | ✅ |
| GET | /api/outlet-list | outlet-list.js | ✅ |
| GET | /api/opname-perintah | opname-perintah.js | ✅ |
| POST | /api/opname-perintah | opname-perintah.js | ✅ |
| POST | /api/simpan-opname | simpan-opname.js | ✅ |
| + 20 more routes... | | | |

**Total API Routes: 44**

---

*Document generated by project audit script*  
*Last updated: 2026-06-10*