# CV EPIC Warehouse - Implementation Roadmap V4

**Document Version:** 1.0.0  
**Date:** 2026-06-10  
**Purpose:** Phased implementation plan for V4 features

---

## Document Overview

This roadmap outlines the implementation phases for V4, based on findings from:
- project-audit.md (technical debt)
- ui-ux-audit.md (UI issues)
- role-system-audit.md (security gaps)
- business-flow-v4.md (workflow design)
- navigation-v4.md (navigation structure)
- ui-wireframe-v4.md (wireframes)

---

## Implementation Summary

| Phase | Focus | Duration | Priority |
|-------|-------|----------|----------|
| Phase A | Navigation | 1 week | Critical |
| Phase B | Dashboard | 1 week | High |
| Phase C | Users | 1 week | High |
| Phase D | Approval Center | 1 week | High |
| Phase E | Settings | 1 week | Medium |
| Phase F | Role Security | 1 week | Critical |

**Total Estimated Time:** 6 weeks

---

## Phase A: Navigation

### A.1 Objectives

- Fix broken navigation (6 missing pages)
- Implement new sidebar structure
- Add mobile bottom navigation
- Create breadcrumbs system

### A.2 Deliverables

| # | Item | Description | Status |
|---|------|-------------|--------|
| A.1 | Sidebar Component | New sidebar with 8 main menus | TODO |
| A.2 | Admin Sidebar | Full menu with submenus | TODO |
| A.3 | User Sidebar | Limited menu for non-admin | TODO |
| A.4 | Mobile Bottom Nav | 5-item bottom navigation | TODO |
| A.5 | Sidebar Drawer | Slide-in drawer for mobile | TODO |
| A.6 | Breadcrumbs | Navigation trail component | TODO |
| A.7 | Page Header | Consistent page header | TODO |

### A.3 Technical Tasks

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE A TECHNICAL TASKS                                    │
└─────────────────────────────────────────────────────────────┘

A.1 Sidebar Component
├── Create /components/sidebar/
│   ├── Sidebar.js (main component)
│   ├── SidebarItem.js (menu item)
│   ├── SidebarSubmenu.js (dropdown)
│   └── SidebarContext.js (state management)
├── Define menu structure in config
├── Implement role-based visibility
└── Add expand/collapse functionality

A.2 Admin Sidebar
├── 8 main menu items with icons
├── Submenu dropdowns for complex items
├── Active state highlighting
├── Badge support for counts
└── Integration with routing

A.3 User Sidebar
├── 5 main menu items
├── Limited to user-accessible pages
├── Clear visual distinction from admin
└── Profile section at bottom

A.4 Mobile Bottom Navigation
├── 5 key items: Home, Tasks, Opname, Approval, Settings
├── Active state with color change
├── Badge counts for notifications
└── Safe area padding for iOS

A.5 Sidebar Drawer
├── Slide-in animation
├── Backdrop overlay
├── Close on outside click
├── Swipe gesture support
└── Hamburger menu trigger

A.6 Breadcrumbs
├── Auto-generate from route
├── Clickable parent links
├── Current page non-clickable
├── Max 4 levels displayed
└── Responsive truncation

A.7 Page Header
├── Page title (H1)
├── Optional description
├── Action buttons area
├── Back button (if nested)
└── Consistent padding
```

### A.4 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `/components/sidebar/` | Create | New sidebar components |
| `/components/breadcrumb/` | Create | Breadcrumb component |
| `/components/page-header/` | Create | Page header component |
| `/components/bottom-nav/` | Create | Mobile bottom nav |
| `/config/menu.js` | Create | Menu configuration |
| `/config/roles.js` | Create | Role permissions |
| `/styles/sidebar.css` | Create | Sidebar styles |
| `/styles/bottom-nav.css` | Create | Bottom nav styles |
| `/js/router.js` | Modify | Update routing |
| `/index.html` | Modify | Integrate new nav |

### A.5 Success Criteria

- [ ] Admin can access all 8 menu items
- [ ] User sees only allowed menu items
- [ ] All menu items navigate to valid pages
- [ ] Mobile shows bottom navigation
- [ ] Sidebar drawer works on mobile
- [ ] Breadcrumbs appear on all pages

---

## Phase B: Dashboard

### B.1 Objectives

- Create Admin Dashboard with widgets
- Create User Dashboard with limited view
- Fix empty operator dashboard (UX-04)
- Add KPI cards, charts, activity feed

### B.2 Deliverables

| # | Item | Description | Status |
|---|------|-------------|--------|
| B.1 | Admin Dashboard | Full dashboard with widgets | TODO |
| B.2 | User Dashboard | Limited dashboard for non-admin | TODO |
| B.3 | KPI Cards | Sales, Stock, Opname, Approval KPIs | TODO |
| B.4 | Activity Feed | Recent activity list | TODO |
| B.5 | Quick Actions | Action buttons on dashboard | TODO |
| B.6 | Stock Alerts Widget | Minimum stock warnings | TODO |
| B.7 | Pending Approvals Widget | Approval count and links | TODO |

### B.3 Technical Tasks

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE B TECHNICAL TASKS                                    │
└─────────────────────────────────────────────────────────────┘

B.1 Admin Dashboard
├── Page layout with 2-column grid
├── Header with title and actions
├── Import dashboard components
├── Connect to API endpoints
└── Handle loading/error states

B.2 User Dashboard
├── Simplified layout for non-admin
├── My Stats section
├── My Tasks list
├── My History preview
├── Profile summary card
└── Role-specific widgets

B.3 KPI Cards
├── Sales KPI (today/month/year)
├── Stock count widget
├── Opname pending count
├── Approval pending count
├── Trend indicators (↑↓)
└── Click to detail navigation

B.4 Activity Feed
├── Recent 10 activities
├── User avatar + name
├── Activity description
├── Timestamp (relative)
├── Click to detail
└── "View All" link

B.5 Quick Actions
├── Create Opname button
├── Input Penjualan button
├── Add Product button
├── Generate Report button
├── Role-based visibility
└── Icon + label format

B.6 Stock Alerts Widget
├── Minimum stock count
├── Over stock count
├── Need restock count
├── Click to Persediaan page
└── Color-coded indicators

B.7 Pending Approvals Widget
├── List top 3 pending
├── Type, submitter, date
├── Quick approve/reject buttons
├── "View All" link to Approval Center
└── Empty state if none
```

### B.4 Dashboard Widget API Mapping

| Widget | API Endpoint | Refresh |
|--------|--------------|--------|
| KPI Cards | GET /kpi | 5 min |
| Activity Feed | GET /activity?limit=10 | Real-time |
| Stock Alerts | GET /v3-persediaan?alert=true | 15 min |
| Pending Approvals | GET /approvals?status=pending | Real-time |
| Top Products | GET /top-products | Daily |
| My Tasks | GET /opname-perintah?assigned={user} | Real-time |
| My Stats | GET /opname-history?user={id} | Real-time |

### B.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `/pages/admin-dashboard.html` | Create | Admin dashboard page |
| `/pages/user-dashboard.html` | Create | User dashboard page |
| `/components/dashboard/kpi-card.html` | Create | KPI card component |
| `/components/dashboard/activity-feed.html` | Create | Activity feed |
| `/components/dashboard/quick-actions.html` | Create | Quick action buttons |
| `/components/dashboard/stock-alerts.html` | Create | Stock alerts widget |
| `/components/dashboard/pending-approvals.html` | Create | Approval widget |
| `/js/dashboard-widgets.js` | Create | Widget data loading |
| `/backend/v3-dashboard.js` | Modify | Add new endpoints |

### B.6 Success Criteria

- [ ] Admin dashboard shows all widgets
- [ ] User dashboard shows role-appropriate content
- [ ] KPI cards display real data
- [ ] Activity feed updates in real-time
- [ ] Quick actions navigate correctly
- [ ] Operator dashboard (operatorTab) shows content

---

## Phase C: Users

### C.1 Objectives

- Fix broken user management (UX-19, UX-20)
- Create user list page
- Create user form modal
- Add registration workflow
- Integrate with user management JS

### C.2 Deliverables

| # | Item | Description | Status |
|---|------|-------------|--------|
| C.1 | User List Page | Table with all users | TODO |
| C.2 | User Form Modal | Add/Edit user form | TODO |
| C.3 | User Filters | Role, Status, Outlet filters | TODO |
| C.4 | User Actions | Edit, Deactivate, Delete | TODO |
| C.5 | Registration Flow | Register → Pending → Active | TODO |
| C.6 | User Profile Page | View/Edit own profile | TODO |

### C.3 Technical Tasks

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE C TECHNICAL TASKS                                    │
└─────────────────────────────────────────────────────────────┘

C.1 User List Page
├── Table with columns: Name, Username, Role, Outlet, Status, Actions
├── Pagination (20 per page)
├── Sort by any column
├── Row click to view details
└── Mobile: Card view

C.2 User Form Modal
├── Fields: Name, Username, Email, Password, Role, Outlet
├── Validation (required, unique)
├── Password strength indicator
├── Role selection dropdown
├── Outlet assignment (optional)
└── Save/Cancel buttons

C.3 User Filters
├── Role filter (Admin, Staff, Checker)
├── Status filter (Active, Pending, Inactive)
├── Outlet filter (All outlets)
├── Search by name/username
└── Clear filters button

C.4 User Actions
├── Edit: Open form modal with data
├── Deactivate: Confirm → Set is_active=false
├── Delete: Confirm → Remove user
├── View: Show user details
└── Reset Password: Generate new temp password

C.5 Registration Flow
├── Registration form (public)
├── Submit → Create user with status=pending
├── Admin notification
├── Approval workflow in Approval Center
├── Approved → Send activation email
└── User activates account

C.6 User Profile Page
├── Display user info
├── Edit name, email, phone
├── Change password
├── View activity history
├── Role-specific permissions display
└── Avatar upload (optional)
```

### C.4 User States

```
┌─────────┐   Register   ┌─────────┐   Approve   ┌─────────┐  Activate  ┌────────┐
│  NEW    │─────────────▶│ PENDING │─────────────▶│APPROVED │───────────▶│ ACTIVE │
└─────────┘              └─────────┘              └─────────┘             └────────┘
                            │                        │
                            │ Reject                  │ First Login
                            ▼                        ▼
                      ┌───────────┐           ┌───────────┐
                      │ REJECTED  │           │ INACTIVE  │
                      └───────────┘           └───────────┘
```

### C.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `/pages/settings/users.html` | Create | User management page |
| `/components/users/user-table.html` | Create | User list component |
| `/components/users/user-form-modal.html` | Create | Add/Edit form modal |
| `/components/users/user-filters.html` | Create | Filter bar |
| `/components/users/profile-card.html` | Create | User profile card |
| `/pages/profile.html` | Create | User profile page |
| `/pages/register.html` | Create | Registration page |
| `/api/v1/users/` | Modify | User CRUD endpoints |
| `/api/v1/auth/register` | Create | Registration endpoint |
| `/js/user-management.js` | Modify | Connect to UI |

### C.6 Success Criteria

- [ ] User list shows all users with correct data
- [ ] Add User button opens form modal
- [ ] Edit user opens form with existing data
- [ ] Filters work correctly
- [ ] Deactivate/Activate toggles status
- [ ] Registration creates pending user
- [ ] Profile page shows user info

---

## Phase D: Approval Center

### D.1 Objectives

- Make hidden Approval Center accessible (UX-07)
- Create approval list page
- Create approval detail page
- Implement approve/reject/request-changes actions

### D.2 Deliverables

| # | Item | Description | Status |
|---|------|-------------|--------|
| D.1 | Approval List Page | Pending/Approved/Rejected tabs | TODO |
| D.2 | Approval Detail Page | Full approval information | TODO |
| D.3 | Approval Actions | Approve, Reject, Request Changes | TODO |
| D.4 | Approval Badges | Count in sidebar | TODO |
| D.5 | Notification Integration | Notify on new approval | TODO |

### D.3 Technical Tasks

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE D TECHNICAL TASKS                                    │
└─────────────────────────────────────────────────────────────┘

D.1 Approval List Page
├── Tabs: Pending, Approved, Rejected, All
├── Table columns: ID, Type, Submitted By, Date, Status, Actions
├── Filter by type (Opname, Import, Adjustment, etc.)
├── Sort by date (newest first)
├── Pagination (20 per page)
└── Mobile: Card view with actions

D.2 Approval Detail Page
├── Header: Approval ID, Type, Status
├── Summary section (items count, match rate)
├── Discrepancies table (SKU, System Qty, Actual Qty, Diff)
├── Submitted by info (name, date, notes)
├── Reviewer notes (textarea)
├── Attachments (photos, documents)
├── Action buttons (Approve, Reject, Request Changes)
└── History timeline

D.3 Approval Actions
├── Approve:
│   ├── Review complete check
│   ├── Add approval note
│   ├── POST /approvals/{id}/approve
│   ├── Apply changes to system
│   └── Notify submitter
├── Reject:
│   ├── Select rejection reason
│   ├── Add rejection notes
│   ├── POST /approvals/{id}/reject
│   └── Notify submitter with reason
└── Request Changes:
    ├── Select items to change
    ├── Add change instructions
    ├── POST /approvals/{id}/request-changes
    └── Notify submitter

D.4 Approval Badges
├── Sidebar shows count: "Approval (3)"
├── Badge updates in real-time
├── Click navigates to Pending tab
└── Color: Primary for count > 0

D.5 Notification Integration
├── In-app notification on new approval
├── Email notification to admin
├── Notification on approval/rejection
├── Mark as read functionality
└── Notification badge in header
```

### D.4 Approval Types

| Type | Source | Action on Approve |
|------|--------|-------------------|
| User Registration | New signup | Activate user account |
| Opname Results | Checker submitted | Apply stock adjustments |
| Stock Adjustment | Manual adjustment | Update inventory |
| Data Import | Bulk import preview | Commit import data |
| Opname Recount | Discrepancy review | Reset session for recount |

### D.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `/pages/approval/index.html` | Create | Approval list page |
| `/pages/approval/detail.html` | Create | Approval detail page |
| `/components/approval/approval-card.html` | Create | List item component |
| `/components/approval/approval-summary.html` | Create | Summary section |
| `/components/approval/approval-actions.html` | Create | Action buttons |
| `/components/approval/discrepancy-table.html` | Create | Discrepancy list |
| `/api/v1/approvals/` | Create | Approval endpoints |
| `/backend/approval-handler.js` | Create | Approval logic |
| `/services/notification.js` | Modify | Add approval notifications |

### D.6 Success Criteria

- [ ] Approval Center accessible from sidebar
- [ ] Pending tab shows pending approvals
- [ ] Click approval shows detail page
- [ ] Approve action works and applies changes
- [ ] Reject action works with reason
- [ ] Request Changes action works with instructions
- [ ] Badge shows correct count

---

## Phase E: Settings

### E.1 Objectives

- Fix broken Settings page (UX-22, UX-23)
- Create Settings menu with sections
- Implement Company Profile editing
- Create Role & Permission configuration

### E.2 Deliverables

| # | Item | Description | Status |
|---|------|-------------|--------|
| E.1 | Settings Menu | Left nav with sections | TODO |
| E.2 | Company Profile | Edit company information | TODO |
| E.3 | Roles & Permissions | Role management table | TODO |
| E.4 | Security Settings | Password policy, session config | TODO |
| E.5 | Database Status | Connection status, backup info | TODO |
| E.6 | Audit Logs | Activity log viewer | TODO |

### E.3 Technical Tasks

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE E TECHNICAL TASKS                                    │
└─────────────────────────────────────────────────────────────┘

E.1 Settings Menu
├── Left sidebar with sections:
│   ├── Company Profile
│   ├── Roles & Permissions
│   ├── Security
│   ├── Database Status
│   └── Audit Logs
├── Active section highlighting
├── Collapsible sections
└── Mobile: Accordion style

E.2 Company Profile
├── Fields: Name, Address, City, Phone, Email, Tax ID
├── Logo upload with preview
├── Save button with confirmation
├── Form validation
└── Success/error notifications

E.3 Roles & Permissions
├── Role list table: Name, Users Count, Permissions
├── Permission matrix view
├── Add/Edit role modal
├── Permission checkboxes by section
├── User count per role
└── Delete role (if no users)

E.4 Security Settings
├── Password Policy:
│   ├── Min length (6-20)
│   ├── Require uppercase (yes/no)
│   ├── Require number (yes/no)
│   ├── Expiry days (30-365)
│   └── History count (1-10)
├── Session Settings:
│   ├── Timeout (15-120 min)
│   ├── Max login attempts (3-10)
│   └── Lockout duration (5-60 min)
└── Save with validation

E.5 Database Status
├── Connection status indicator (green/red)
├── Last sync timestamp
├── Table record counts
├── Backup status
├── Manual backup button
├── Migration history list
└── Health check endpoint

E.6 Audit Logs
├── Log table: Timestamp, User, Action, Module, Details
├── Filters: Date range, User, Action type, Module
├── Search by keyword
├── Export to CSV
├── Pagination (50 per page)
└── Detail expandable
```

### E.4 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `/pages/settings/index.html` | Create | Settings main page |
| `/pages/settings/company.html` | Create | Company profile |
| `/pages/settings/roles.html` | Create | Roles & permissions |
| `/pages/settings/security.html` | Create | Security settings |
| `/pages/settings/database.html` | Create | Database status |
| `/pages/settings/audit-logs.html` | Create | Audit log viewer |
| `/components/settings/setting-section.html` | Create | Section component |
| `/components/settings/permission-matrix.html` | Create | Permission grid |
| `/components/settings/db-status.html` | Create | DB status widget |
| `/components/settings/log-table.html` | Create | Log viewer |
| `/api/v1/settings/` | Create | Settings endpoints |
| `/api/v1/audit-logs/` | Create | Audit log endpoints |

### E.5 Success Criteria

- [ ] Settings accessible from sidebar (Admin only)
- [ ] Company profile shows current data
- [ ] Edit company profile saves correctly
- [ ] Roles table shows all roles
- [ ] Permission matrix is editable
- [ ] Security settings save correctly
- [ ] Database status shows live info
- [ ] Audit logs filter and export work

---

## Phase F: Role Security

### F.1 Objectives

- Fix security gaps (MG-01, MG-02)
- Add backend API authorization
- Implement row-level security
- Add permission middleware

### F.2 Deliverables

| # | Item | Description | Status |
|---|------|-------------|--------|
| F.1 | Permission Middleware | Role-based API protection | TODO |
| F.2 | Row-Level Security | Filter data by user role | TODO |
| F.3 | Role Distinction | Differentiate staff_gudang vs checker | TODO |
| F.4 | Login Portal Fix | Proper admin/user login separation | TODO |
| F.5 | API Rate Limiting | Protect auth endpoints | TODO |

### F.3 Technical Tasks

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE F TECHNICAL TASKS                                    │
└─────────────────────────────────────────────────────────────┘

F.1 Permission Middleware
├── Create middleware/auth.js
│   ├── verifyToken(req, res, next)
│   ├── requireRole(allowedRoles)
│   └── requirePermission(permission)
├── Apply to all protected routes
├── Return 401 for missing token
├── Return 403 for insufficient role
└── Log unauthorized access attempts

F.2 Row-Level Security
├── Filter opname by checker_id
├── Filter tasks by assigned_to
├── Filter history by user_id
├── Admin sees all, user sees own
├── Add userId filter to queries
└── Document filter rules

F.3 Role Distinction
├── Differentiate staff_gudang from checker_opname
├── staff_gudang: Can manage inventory, view all
├── checker_opname: Execute opname only
├── Update frontend getAllowedMenus()
├── Update backend permission checks
└── Add role-specific features

F.4 Login Portal Fix
├── Separate login for admin vs user
├── Admin portal: /login/admin
├── User portal: /login/user
├── Show appropriate dashboard after login
├── Prevent admin login via user portal
├── Prevent user login via admin portal
└── Clear error messages

F.5 API Rate Limiting
├── Limit login attempts (5 per minute)
├── Limit registration (3 per hour)
├── Limit bulk operations (10 per minute)
├── Return 429 when exceeded
├── Track attempts in database
└── Auto-unlock after timeout
```

### F.4 Permission Matrix

| Permission | Admin | Staff Gudang | Checker Opname |
|------------|-------|--------------|----------------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create Opname | ✅ | ❌ | ❌ |
| Execute Opname | ✅ | ✅ | ✅ |
| Approve Opname | ✅ | ❌ | ❌ |
| View All Opname | ✅ | ❌ | ❌ |
| View Own Opname | ✅ | ✅ | ✅ |
| Manage Inventory | ✅ | ⚠️ View | ❌ |
| Manage Products | ✅ | ❌ | ❌ |
| View Reports | ✅ | ⚠️ Own | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

### F.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `/middleware/auth.js` | Create | Auth middleware |
| `/middleware/permission.js` | Create | Permission middleware |
| `/backend/auth.js` | Modify | Enhanced auth |
| `/backend/opname-*.js` | Modify | Add permission checks |
| `/backend/approval-*.js` | Create | Approval handlers |
| `/services/rate-limiter.js` | Create | Rate limiting |
| `/js/dashboard.js` | Modify | Update role handling |
| `/config/permissions.js` | Create | Permission definitions |

### F.6 Success Criteria

- [ ] Unauthenticated API calls return 401
- [ ] Wrong role API calls return 403
- [ ] User sees only own opname tasks
- [ ] Admin sees all data
- [ ] Staff Gudang vs Checker differentiated
- [ ] Login portal properly separates admin/user
- [ ] Rate limiting protects auth endpoints

---

## Implementation Timeline

```
Week 1: Phase A - Navigation
├── Day 1-2: Sidebar component, admin sidebar
├── Day 3: User sidebar, mobile bottom nav
├── Day 4: Sidebar drawer, breadcrumbs
├── Day 5: Testing, bug fixes, documentation

Week 2: Phase B - Dashboard
├── Day 1-2: Admin dashboard layout, KPI cards
├── Day 3: User dashboard, operator fix
├── Day 4: Widgets (Activity, Alerts, Approvals)
├── Day 5: Testing, bug fixes, documentation

Week 3: Phase C - Users
├── Day 1-2: User list page, user form modal
├── Day 3: User filters, user actions
├── Day 4: Registration flow, profile page
├── Day 5: Testing, bug fixes, documentation

Week 4: Phase D - Approval Center
├── Day 1-2: Approval list page, tabs
├── Day 3: Approval detail page
├── Day 4: Approval actions (Approve/Reject/Changes)
├── Day 5: Testing, bug fixes, documentation

Week 5: Phase E - Settings
├── Day 1-2: Settings menu, Company Profile
├── Day 3: Roles & Permissions
├── Day 4: Security, Database Status, Audit Logs
├── Day 5: Testing, bug fixes, documentation

Week 6: Phase F - Role Security
├── Day 1-2: Permission middleware
├── Day 3: Row-level security
├── Day 4: Login portal fix, rate limiting
├── Day 5: Testing, security audit, documentation
```

---

## Dependencies

| Phase | Depends On | Blocked By |
|-------|------------|------------|
| Phase A | None | None |
| Phase B | Phase A | Phase A |
| Phase C | Phase A | Phase A |
| Phase D | Phase A, Phase C | Phase C |
| Phase E | Phase A | Phase A |
| Phase F | Phase C, Phase D | Phase D |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | Medium | High | Strict scope definition, defer non-critical |
| Integration issues | Medium | Medium | Early testing, mock data fallback |
| Performance issues | Low | Medium | Lazy loading, pagination, caching |
| Security vulnerabilities | Low | High | Security audit, penetration testing |
| User adoption | Medium | Medium | Training, documentation, UX testing |

---

## Definition of Done

Each phase is complete when:
- [ ] All TODO items implemented
- [ ] Code follows style guide
- [ ] Unit tests written (if applicable)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Approved by reviewer

---

## Future Phases (Not in Scope)

| Phase | Description | Priority |
|-------|-------------|----------|
| Phase G | Forecasting improvements | Medium |
| Phase H | Mobile app | Medium |
| Phase I | Advanced Analytics | Low |
| Phase J | API Documentation | Medium |

---

*Document generated for V4 implementation planning*  
*Last updated: 2026-06-10*