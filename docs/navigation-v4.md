# CV EPIC Warehouse - Navigation V4

**Document Version:** 1.0.0  
**Date:** 2026-06-10  
**Purpose:** Final navigation structure for V4 implementation

---

## Document Overview

This document defines the final navigation structure for V4, based on findings from:
- navigation-v2.md (previous design)
- ui-ux-audit.md (issues found)
- role-system-audit.md (permissions)
- business-flow-v4.md (workflows)

---

## 1. Navigation Principles

### 1.1 Core Principles

1. **Task-Oriented**: Menu grouped by work tasks, not file structure
2. **Role-Aware**: Menus adapt based on user role
3. **Consistent**: Same patterns across all pages
4. **Accessible**: Clear labels, obvious actions
5. **Scalable**: Easy to add new items without breaking structure

### 1.2 Information Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER BAR                             │
│  Logo | Search | Notifications | User Menu | Theme      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐  ┌─────────────────────────────────┐   │
│  │           │  │                                 │   │
│  │  SIDEBAR  │  │       MAIN CONTENT AREA          │   │
│  │           │  │                                 │   │
│  │  8 Main   │  │   Page Title + Actions           │   │
│  │  Menus    │  │   ─────────────────────          │   │
│  │           │  │                                 │   │
│  │  +        │  │   Content Cards / Tables / Forms │   │
│  │  Submenus │  │                                 │   │
│  │           │  │                                 │   │
│  └───────────┘  └─────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Menu Structure V4

### 2.1 Main Navigation Items

| # | Menu | Icon | Description | Admin | Staff | Checker |
|---|------|------|-------------|-------|-------|---------|
| 1 | Dashboard | 📊 | Overview and KPIs | ✅ Full | ✅ Limited | ✅ Limited |
| 2 | Task Center | 📋 | Daily tasks and assignments | ✅ Full | ✅ Own | ✅ Own |
| 3 | Warehouse | 📦 | Inventory and master data | ✅ Full | ⚠️ View | ❌ |
| 4 | Stock Opname | 🔢 | Opname workflow | ✅ Full | ✅ Execute | ✅ Execute |
| 5 | Approval | ✓ | Approval workflows | ✅ Full | ❌ | ❌ |
| 6 | Reports | 📊 | Reports and exports | ✅ Full | ⚠️ Own | ⚠️ Own |
| 7 | Audit | 🔍 | Audit and logs | ✅ Full | ❌ | ❌ |
| 8 | Settings | ⚙ | System configuration | ✅ Full | ❌ | ❌ |

### 2.2 Admin Sidebar Structure

```
┌─────────────────────────────────────────┐
│ [Logo] CV EPIC Warehouse                │
│        Inventory Control Suite V4       │
├─────────────────────────────────────────┤
│                                         │
│ 📊 DASBOR                               │
│    └─ Click: Go to Dashboard            │
│                                         │
├─────────────────────────────────────────┤
│ 📋 TASK CENTER                          │
│    ├─ Tugas Saya                        │
│    ├─ Antrian Tugas                     │
│    └─ Riwayat                           │
│                                         │
├─────────────────────────────────────────┤
│ 📦 WAREHOUSE                            │
│    ├─ Persediaan                        │
│    ├─ Produk                            │
│    ├─ Outlet                            │
│    ├─ Penjualan                         │
│    └─ Pembelian                         │
│                                         │
├─────────────────────────────────────────┤
│ 🔢 STOCK OPNAME                         │
│    ├─ Perintah Opname                   │
│    ├─ Input / Scan                      │
│    ├─ Hasil                             │
│    ├─ History                           │
│    └─ Export                            │
│                                         │
├─────────────────────────────────────────┤
│ ✓ APPROVAL CENTER                       │
│    ├─ Pending (3)                       │
│    ├─ Approved                          │
│    └─ Rejected                          │
│                                         │
├─────────────────────────────────────────┤
│ 📊 REPORTS                              │
│    ├─ Laporan Stok                       │
│    ├─ Laporan Penjualan                  │
│    ├─ Laporan Opname                    │
│    └─ Export Data                        │
│                                         │
├─────────────────────────────────────────┤
│ 🔍 AUDIT                                │
│    ├─ Log Aktivitas                     │
│    ├─ Audit Stok                         │
│    └─ Data Integrity                     │
│                                         │
├─────────────────────────────────────────┤
│ ⚙ PENGATURAN                           │
│    ├─ Profil Perusahaan                 │
│    ├─ Manajemen User                    │
│    ├─ Roles & Permission                │
│    ├─ Keamanan                          │
│    ├─ Status Database                    │
│    └─ Log Audit                          │
│                                         │
└─────────────────────────────────────────┘
```

### 2.3 User Sidebar Structure (Staff Gudang / Checker Opname)

```
┌─────────────────────────────────────────┐
│ [Logo] CV EPIC Warehouse                │
│        Inventory Control Suite V4       │
├─────────────────────────────────────────┤
│                                         │
│ 📊 MY DASHBOARD                         │
│    └─ Click: Go to User Dashboard       │
│                                         │
├─────────────────────────────────────────┤
│ 📋 MY TASKS                             │
│    ├─ Tugas Aktif                       │
│    ├─ Tugas Selesai                     │
│    └─ Riwayat                           │
│                                         │
├─────────────────────────────────────────┤
│ 🔢 STOCK OPNAME                        │
│    ├─ Tugas Opname                      │
│    ├─ Scan & Input                      │
│    └─ Riwayat Saya                      │
│                                         │
├─────────────────────────────────────────┤
│ 📊 MY REPORTS                           │
│    └─ Laporan Saya                       │
│                                         │
├─────────────────────────────────────────┤
│ 👤 PROFILE                              │
│    └─ View/Edit Profile                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 3. Navigation Mapping

### 3.1 URL Structure

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Login | Public | Login page |
| `/dashboard` | Admin Dashboard | Admin | Main admin dashboard |
| `/mydashboard` | User Dashboard | All | Role-specific dashboard |
| `/tasks` | Task Center | Admin | All tasks view |
| `/mytasks` | My Tasks | User | User's assigned tasks |
| `/warehouse` | Warehouse Menu | Admin | Warehouse section |
| `/warehouse/inventory` | Persediaan | Admin | Inventory overview |
| `/warehouse/products` | Produk | Admin | Product management |
| `/warehouse/outlets` | Outlet | Admin | Outlet management |
| `/warehouse/sales` | Penjualan | Admin | Sales module |
| `/warehouse/purchases` | Pembelian | Admin | Purchase module |
| `/opname` | Opname Menu | Admin | Opname section |
| `/opname/commands` | Perintah Opname | Admin | Create/manage commands |
| `/opname/scan` | Scan & Input | Admin, User | Execute opname |
| `/opname/results` | Hasil Opname | Admin | Review results |
| `/opname/history` | History | All | Opname history |
| `/approval` | Approval Center | Admin | Approval list |
| `/approval/{id}` | Approval Detail | Admin | Review approval |
| `/reports` | Reports Menu | Admin | Reports section |
| `/reports/stock` | Laporan Stok | Admin | Stock reports |
| `/reports/sales` | Laporan Penjualan | Admin | Sales reports |
| `/reports/opname` | Laporan Opname | Admin | Opname reports |
| `/audit` | Audit Menu | Admin | Audit section |
| `/audit/activity` | Log Aktivitas | Admin | Activity logs |
| `/audit/stock` | Audit Stok | Admin | Stock audit |
| `/settings` | Settings Menu | Admin | Settings section |
| `/settings/company` | Profil Perusahaan | Admin | Company profile |
| `/settings/users` | Manajemen User | Admin | User management |
| `/settings/roles` | Roles & Permission | Admin | Role configuration |
| `/settings/security` | Keamanan | Admin | Security settings |
| `/settings/database` | Status Database | Admin | DB status |
| `/settings/audit-logs` | Log Audit | Admin | Audit logs |
| `/profile` | My Profile | User | User profile |

### 3.2 Sidebar to Page Mapping

| Sidebar Item | Target Page | Role |
|--------------|-------------|------|
| Dasbor | /dashboard | Admin |
| My Dashboard | /mydashboard | User |
| Task Center → Tugas Saya | /tasks?filter=mine | Admin |
| My Tasks → Tugas Aktif | /mytasks?filter=active | User |
| Warehouse → Persediaan | /warehouse/inventory | Admin |
| Warehouse → Produk | /warehouse/products | Admin |
| Warehouse → Outlet | /warehouse/outlets | Admin |
| Warehouse → Penjualan | /warehouse/sales | Admin |
| Warehouse → Pembelian | /warehouse/purchases | Admin |
| Opname → Perintah | /opname/commands | Admin |
| Opname → Scan & Input | /opname/scan | Admin, User |
| Opname → Hasil | /opname/results | Admin |
| Opname → History | /opname/history | All |
| Approval → Pending | /approval?status=pending | Admin |
| Approval → Approved | /approval?status=approved | Admin |
| Approval → Rejected | /approval?status=rejected | Admin |
| Reports → Laporan Stok | /reports/stock | Admin |
| Reports → Laporan Penjualan | /reports/sales | Admin |
| Reports → Laporan Opname | /reports/opname | Admin |
| Reports → Export Data | /reports/export | Admin |
| Audit → Log Aktivitas | /audit/activity | Admin |
| Audit → Audit Stok | /audit/stock | Admin |
| Audit → Data Integrity | /audit/integrity | Admin |
| Settings → Profil Perusahaan | /settings/company | Admin |
| Settings → Manajemen User | /settings/users | Admin |
| Settings → Roles & Permission | /settings/roles | Admin |
| Settings → Keamanan | /settings/security | Admin |
| Settings → Status Database | /settings/database | Admin |
| Settings → Log Audit | /settings/audit-logs | Admin |
| Profile → Profile | /profile | User |

---

## 4. Navigation States

### 4.1 Menu Item States

| State | Visual | Description |
|-------|--------|-------------|
| Default | Gray icon + text | Normal appearance |
| Hover | Lighter background | Mouse over |
| Active | Primary color + left border | Currently on page |
| Disabled | Gray text, no interaction | No permission |
| Has Badge | Red badge with count | Notification/action needed |

### 4.2 Sidebar States

| State | Trigger | Behavior |
|-------|---------|----------|
| Expanded | Desktop > 1024px | Show full labels |
| Collapsed | Tablet 640-1024px | Icons only with tooltips |
| Drawer | Mobile < 640px | Slide-in from left |
| Mini | User preference | 64px width icons |

### 4.3 Breadcrumb Pattern

```
Dasbor / Warehouse / Persediaan
     │           │          └─ Current page (not clickable)
     │           └─ Parent page (clickable)
     └─ Root page (clickable)
```

---

## 5. Mobile Navigation

### 5.1 Bottom Navigation Bar

For mobile devices (< 640px), use bottom navigation with 5 key items:

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| 🏠 | Home | /mydashboard | — |
| 📋 | Tasks | /mytasks | ⚠️3 |
| 🔢 | Opname | /opname/scan | — |
| ✓ | Approval | /approval | 🔴3 |
| ⚙ | Settings | /profile | — |

### 5.2 Mobile Navigation Flow

```
┌─────────────────────────┐
│ [≡] Logo    [🔔][👤]   │  ← Header with hamburger
├─────────────────────────┤
│                         │
│    MAIN CONTENT        │
│                         │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ [🏠] [📋] [🔢] [✓] [⚙]│  ← Bottom nav
└─────────────────────────┘

Tap hamburger → Sidebar drawer slides in
```

### 5.3 Sidebar Drawer (Mobile)

```
┌─────────────────────────┐
│ [×] CLOSE               │
├─────────────────────────┤
│                         │
│ 👤 John Doe             │
│ Checker Opname          │
│                         │
├─────────────────────────┤
│ 🏠 My Dashboard         │
├─────────────────────────┤
│ 📋 My Tasks             │
│   └─ Tugas Aktif (3)    │
│   └─ Riwayat            │
├─────────────────────────┤
│ 🔢 Stock Opname         │
│   └─ Tugas Opname       │
│   └─ Scan & Input        │
│   └─ Riwayat Saya       │
├─────────────────────────┤
│ 📊 My Reports           │
├─────────────────────────┤
│ 👤 Profile              │
├─────────────────────────┤
│ 🚪 Logout               │
└─────────────────────────┘
```

---

## 6. Quick Actions

### 6.1 Floating Action Button (FAB)

For quick actions, use a floating action button:

```
Desktop: [+] button in page header
Mobile:  Floating button bottom-right
```

### 6.2 Quick Action Menu

| Action | Icon | Location | Admin | User |
|--------|------|----------|-------|------|
| Create Opname | 📋 | Dashboard | ✅ | ❌ |
| Input Penjualan | 💰 | Dashboard | ✅ | ❌ |
| Add Product | 📦 | Dashboard | ✅ | ❌ |
| Start Scanning | 📷 | Opname | ✅ | ✅ |
| Export Report | 📥 | Reports | ✅ | ❌ |
| Add User | 👤 | Settings | ✅ | ❌ |

---

## 7. Navigation Implementation Notes

### 7.1 Routing Configuration

```javascript
// Recommended route structure
const routes = {
  // Public
  '/': 'Login',
  '/login': 'Login',
  
  // Admin routes
  '/dashboard': 'AdminDashboard',
  '/tasks': 'TaskCenter',
  '/warehouse/*': 'Warehouse',
  '/opname/*': 'Opname',
  '/approval/*': 'Approval',
  '/reports/*': 'Reports',
  '/audit/*': 'Audit',
  '/settings/*': 'Settings',
  
  // User routes
  '/mydashboard': 'UserDashboard',
  '/mytasks': 'MyTasks',
  '/opname/scan': 'OpnameScan',
  '/profile': 'Profile'
};
```

### 7.2 Navigation Guards

```javascript
// Role-based access control
const navigationGuards = {
  beforeEnter: (to, from, next) => {
    const userRole = getUserRole();
    const requiredRole = to.meta?.role;
    
    if (requiredRole && !allowedRoles(userRole).includes(requiredRole)) {
      next('/mydashboard'); // Redirect to user dashboard
    } else {
      next();
    }
  }
};
```

### 7.3 Sidebar State Management

```javascript
// Sidebar state
const sidebarState = {
  expanded: true,      // Desktop expanded
  collapsed: false,    // Tablet collapsed
  drawerOpen: false,   // Mobile drawer
  activeMenu: 'dashboard',
  activeSubmenu: null
};
```

---

## 8. Navigation Fixes from V2

Based on ui-ux-audit.md findings, V4 navigation fixes:

| Issue | V2 Problem | V4 Solution |
|-------|------------|-------------|
| UX-07 | #usersTab missing | Add Settings → Manajemen User |
| UX-08 | #settingsTab missing | Add dedicated Settings section |
| UX-11 | User sidebar tabs missing | Add My Dashboard, My Tasks, Profile |
| UX-19 | User management code without UI | Create full user management page |
| UX-22 | Settings code without UI | Create full settings pages |

### 8.1 Navigation Validation Checklist

- [ ] Admin sidebar has all 8 main menus
- [ ] User sidebar has My Dashboard, Tasks, Opname, Profile
- [ ] All sidebar items have corresponding pages
- [ ] Role-based menu filtering works
- [ ] Mobile bottom navigation has all essential items
- [ ] Sidebar drawer works on mobile
- [ ] Breadcrumbs show current location
- [ ] Active menu is highlighted
- [ ] Badge counts show on relevant items

---

## 9. Future Navigation Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Search | High | Global search across all pages |
| Bookmarks | Medium | Save frequently visited pages |
| Recent | Medium | Show recently visited pages |
| Keyboard Nav | Medium | Full keyboard navigation |
| Voice | Low | Voice command integration |

---

*Document generated for V4 implementation*  
*Last updated: 2026-06-10*