# User Acceptance Testing (UAT) Checklist
**Application:** CV EPIC Warehouse Inventory Control Suite V3  
**Version:** 3.0.0  
**Date:** 2026-06-10  
**Tester:** _________________________  
**Environment:** Production (Neon PostgreSQL)

---

## Pre-UAT Requirements

- [ ] Test user accounts available (Admin + Regular User)
- [ ] Test data populated in database
- [ ] Browser console cleared before testing
- [ ] Network tab open for API inspection
- [ ] Mobile viewport tested (375px width)

---

## 1. ADMIN ROLE MENUS

### 1.1 Dashboard
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| KPI cards display | All 10+ KPI cards render | ☐ | |
| Penjualan Hari Ini shows | Numeric value or 0 | ☐ | |
| Pembelian Hari Ini shows | Numeric value or 0 | ☐ | |
| Produk Aktif shows | Numeric value or 0 | ☐ | |
| Customer Aktif shows | Numeric value or 0 | ☐ | |
| Stok Kritis shows | Numeric value or 0 | ☐ | |
| SO Berjalan shows | Numeric value or 0 | ☐ | |
| Pending Approval shows | Numeric value or 0 | ☐ | |
| SO Selesai shows | Numeric value or 0 | ☐ | |
| Total Users shows | Numeric value or 0 | ☐ | |
| Task Aktif shows | Numeric value or 0 | ☐ | |
| Aktivitas table loads | Recent transactions listed | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Cards stack vertically | ☐ | |

### 1.2 Penjualan
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Tab menu displays | All tabs render (Dashboard, KPI, Chart, etc.) | ☐ | |
| Default tab shows dashboard | Data loads on default view | ☐ | |
| KPI tab shows metrics | Sales metrics displayed | ☐ | |
| Chart tab shows charts | Charts render correctly | ☐ | |
| Mini Review displays | Summary data visible | ☐ | |
| Outlet Transaction shows | Outlet list loads | ☐ | |
| Input section works | Form fields present | ☐ | |
| Import section works | Upload option present | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Tables scroll horizontally | ☐ | |

### 1.3 Persediaan (Inventory)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Table displays products | Product list loads | ☐ | |
| Filter works | Filter by produk/category | ☐ | |
| Period filter works | Change bulan/tahun | ☐ | |
| Stock calculations correct | Rolling stock values accurate | ☐ | |
| No placeholder data | All cells have values | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Table scrolls horizontally | ☐ | |

### 1.4 Stok Opname
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Tab menu displays | All tabs render | ☐ | |
| Default tab shows list | Perintah list loads | ☐ | |
| Create new perintah works | Form/modal opens | ☐ | |
| Input qty fisik works | Item entry form present | ☐ | |
| Submit action works | Status changes to menunggu_approval | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Forms usable on mobile | ☐ | |

### 1.5 Task Center
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Task list displays | Tasks shown (if any) | ☐ | |
| Filter works | Filter by status/type | ☐ | |
| Task detail opens | Click task shows details | ☐ | |
| No placeholder screen | Content renders | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Cards stack on mobile | ☐ | |

### 1.6 Approval Center
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Approval list displays | Pending approvals shown | ☐ | |
| Filter works | Filter by status | ☐ | |
| Approval detail opens | Click shows details | ☐ | |
| Approve action works | Admin can approve (200 OK) | ☐ | |
| Reject action works | Admin can reject (200 OK) | ☐ | |
| Non-admin blocked | Returns 403 for non-admin | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Cards stack on mobile | ☐ | |

### 1.7 Laporan (Reports)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Report options display | Different report types shown | ☐ | |
| Generate report works | Report data loads | ☐ | |
| Export option present | Download option available | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Report preview scrolls | ☐ | |

### 1.8 Audit
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Audit log displays | Recent changes listed | ☐ | |
| Filter works | Filter by table/user/action | ☐ | |
| Detail view works | Click shows change details | ☐ | |
| No placeholder screen | Content renders | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Logs list on mobile | ☐ | |

### 1.9 Pengguna (Users)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| User list displays | All users shown | ☐ | |
| Search works | Filter by name/email | ☐ | |
| Create user works | Form/modal opens | ☐ | |
| Edit user works | Edit form opens | ☐ | |
| Disable user works | User status changes | ☐ | |
| Enable user works | User status changes | ☐ | |
| Delete user works | User removed | ☐ | |
| Role assignment works | Can change user role | ☐ | |
| Non-admin blocked | Returns 403 for non-admin | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Cards on mobile | ☐ | |

### 1.10 Pengaturan (Settings)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Profile section displays | User profile shown | ☐ | |
| Change password works | Form accepts new password | ☐ | |
| System settings display | App config shown | ☐ | |
| Database status shows | Connection status OK | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Settings scroll | ☐ | |

---

## 2. USER ROLE MENUS

### 2.1 Dashboard Saya (My Dashboard)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Personal KPIs display | User-specific metrics shown | ☐ | |
| Recent activity shows | User's recent tasks | ☐ | |
| No admin data exposed | Only user's data visible | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | KPIs stack on mobile | ☐ | |

### 2.2 Tugas SO (SO Tasks)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Task list displays | Assigned SO tasks shown | ☐ | |
| Start SO works | Status changes to proses | ☐ | |
| Input qty fisik works | Can enter physical count | ☐ | |
| Submit SO works | Status changes to menunggu_approval | ☐ | |
| Cannot approve | No approve button for user | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Forms usable on mobile | ☐ | |

### 2.3 Riwayat Saya (My History)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| History list displays | User's past SOs shown | ☐ | |
| Filter works | Filter by date/status | ☐ | |
| Detail view works | Click shows SO details | ☐ | |
| No other users' data | Only own history visible | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | List scrolls on mobile | ☐ | |

### 2.4 Profil (Profile)
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Menu accessible from sidebar | Menu item visible and clickable | ☐ | |
| Page loads successfully | No blank/placeholder screen | ☐ | |
| Profile info displays | User details shown | ☐ | |
| Edit name works | Can update nama_lengkap | ☐ | |
| Edit email works | Can update email | ☐ | |
| Change password works | Can change password | ☐ | |
| Cannot change role | Role not editable by user | ☐ | |
| No console errors | Browser console clean | ☐ | |
| Mobile layout works | Form fields on mobile | ☐ | |

---

## 3. AUTHENTICATION TESTS

### 3.1 Login
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Login modal opens | Modal displays | ☐ | |
| User login works | Correct credentials login | ☐ | |
| Admin login works | Admin credentials login | ☐ | |
| Invalid credentials rejected | Error message shown | ☐ | |
| Empty fields rejected | Validation message | ☐ | |
| User portal redirects | User dashboard shown | ☐ | |
| Admin portal redirects | Admin dashboard shown | ☐ | |
| No console errors | Browser console clean | ☐ | |

### 3.2 Logout
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Logout button present | Button visible | ☐ | |
| Click logout works | Session cleared | ☐ | |
| Redirect to login | Login modal shown | ☐ | |
| Token cleared | LocalStorage cleared | ☐ | |
| No console errors | Browser console clean | ☐ | |

---

## 4. CROSS-FUNCTIONAL TESTS

### 4.1 Navigation
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Sidebar menu works | All menus accessible | ☐ | |
| Active menu highlighted | Current menu styled | ☐ | |
| Menu state persists | Selection saved | ☐ | |
| Browser back works | History navigation | ☐ | |

### 4.2 Responsive Design
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Desktop view (1920px) | Full layout | ☐ | |
| Tablet view (768px) | Adjusted layout | ☐ | |
| Mobile view (375px) | Stacked layout | ☐ | |
| Touch targets 44px+ | Buttons tappable | ☐ | |

### 4.3 Accessibility
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Keyboard navigation | Tab through elements | ☐ | |
| Focus visible | Focus indicator shown | ☐ | |
| Screen reader labels | ARIA labels present | ☐ | |
| Color contrast | WCAG AA compliant | ☐ | |

---

## 5. SECURITY TESTS

### 5.1 Authorization
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Non-admin cannot access /users | Returns 403 | ☐ | |
| Non-admin cannot access /settings | Allowed (own profile) | ☐ | |
| Non-admin cannot approve | Returns 403 | ☐ | |
| Non-admin cannot reject | Returns 403 | ☐ | |
| Non-admin cannot create user | Returns 403 | ☐ | |
| Non-admin cannot delete user | Returns 403 | ☐ | |
| Expired token rejected | Returns 401 | ☐ | |
| No token rejected | Returns 401 | ☐ | |

### 5.2 Session
| Check | Expected Result | Pass/Fail | Notes |
|-------|-----------------|-----------|-------|
| Session persists | Login state maintained | ☐ | |
| Refresh token works | Token refreshes | ☐ | |
| Logout clears session | Session invalidated | ☐ | |

---

## UAT Summary

### Total Checks: __________
### Passed: __________
### Failed: __________
### Pass Rate: __________%

### Critical Issues Found: __________
### Medium Issues Found: __________
### Low Issues Found: __________

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |
| Product Owner | | | |

---

**Document Generated:** 2026-06-10T09:53:00Z  
**Application Version:** 3.0.0