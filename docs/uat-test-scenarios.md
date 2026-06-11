# User Acceptance Testing (UAT) Test Scenarios
**Application:** CV EPIC Warehouse Inventory Control Suite V3  
**Version:** 3.0.0  
**Date:** 2026-06-10  
**Tester:** _________________________  
**Environment:** Production (Neon PostgreSQL)

---

## Overview

This document contains detailed test scenarios for User Acceptance Testing of the CV EPIC Warehouse Inventory Control Suite V3. Each scenario includes pre-conditions, test steps, expected results, and acceptance criteria.

---

## 1. Authentication Test Scenarios

### TC-AUTH-001: Admin Login
**Priority:** Critical  
**Module:** Authentication

**Pre-conditions:**
- Admin user account exists (username: admin, password: admin123)
- Application is accessible

**Test Steps:**
1. Open application URL
2. Click "Admin" login mode
3. Enter username: admin
4. Enter password: admin123
5. Click login button

**Expected Results:**
- Login successful
- Redirect to Admin Dashboard
- User name displayed in header
- Admin menus visible in sidebar
- JWT token stored in localStorage

**Acceptance Criteria:**
- [ ] No error messages displayed
- [ ] Dashboard loads within 5 seconds
- [ ] All admin menu items visible

---

### TC-AUTH-002: User Login
**Priority:** Critical  
**Module:** Authentication

**Pre-conditions:**
- Regular user account exists (username: staff, password: staff123)
- Application is accessible

**Test Steps:**
1. Open application URL
2. Click "User" login mode (default)
3. Enter username: staff
4. Enter password: staff123
5. Click login button

**Expected Results:**
- Login successful
- Redirect to User Dashboard
- User name displayed in header
- User menus visible in sidebar (opname, mydashboard, sotasks, sohistory, profile)

**Acceptance Criteria:**
- [ ] No error messages displayed
- [ ] User-specific dashboard loads
- [ ] Admin menus NOT visible

---

### TC-AUTH-003: Invalid Login Credentials
**Priority:** High  
**Module:** Authentication

**Pre-conditions:**
- Application is accessible

**Test Steps:**
1. Open application URL
2. Enter invalid username: invaliduser
3. Enter invalid password: wrongpassword
4. Click login button

**Expected Results:**
- Error message displayed: "Invalid username or password"
- User remains on login screen
- No token stored

**Acceptance Criteria:**
- [ ] Error message is clear and actionable
- [ ] No sensitive information leaked
- [ ] Can retry login

---

### TC-AUTH-004: Session Persistence
**Priority:** High  
**Module:** Authentication

**Pre-conditions:**
- User is logged in
- JWT token exists in localStorage

**Test Steps:**
1. Refresh the browser page
2. Verify current page state

**Expected Results:**
- User remains logged in
- Current menu/page maintained
- Token is valid

**Acceptance Criteria:**
- [ ] No re-login required
- [ ] All data preserved

---

### TC-AUTH-005: Logout
**Priority:** High  
**Module:** Authentication

**Pre-conditions:**
- User is logged in

**Test Steps:**
1. Click logout button in header
2. Verify screen state

**Expected Results:**
- Logout successful
- Login modal displayed
- Token cleared from localStorage
- All user data cleared

**Acceptance Criteria:**
- [ ] Cannot access protected routes after logout
- [ ] Redirected to login screen

---

## 2. User Management Test Scenarios

### TC-USER-001: Create New User (Admin Only)
**Priority:** Critical  
**Module:** User Management

**Pre-conditions:**
- Admin user is logged in
- Navigate to Pengguna menu

**Test Steps:**
1. Click "Tambah User" or "+" button
2. Enter username: testuser
3. Enter email: testuser@example.com
4. Enter full name: Test User
5. Enter password: testpass123
6. Select role: staff_gudang
7. Click save/submit

**Expected Results:**
- User created successfully
- Success message displayed
- New user appears in user list
- User can login with new credentials

**API Endpoint:** POST /v1/users  
**API Response:** 201 Created

**Acceptance Criteria:**
- [ ] User record created in database
- [ ] User can authenticate
- [ ] Role assigned correctly

---

### TC-USER-002: Create User - Duplicate Username
**Priority:** High  
**Module:** User Management

**Pre-conditions:**
- Admin user is logged in
- User with username "admin" exists

**Test Steps:**
1. Navigate to Pengguna menu
2. Click "Tambah User"
3. Enter username: admin (existing)
4. Enter valid other fields
5. Click save/submit

**Expected Results:**
- Error message displayed: "Username sudah digunakan"
- No duplicate user created

**API Response:** 400 Bad Request

**Acceptance Criteria:**
- [ ] Validation prevents duplicate
- [ ] Clear error message shown

---

### TC-USER-003: Edit User (Admin Only)
**Priority:** High  
**Module:** User Management

**Pre-conditions:**
- Admin user is logged in
- At least one user exists

**Test Steps:**
1. Navigate to Pengguna menu
2. Find a user in the list
3. Click edit button/icon
4. Modify name: "Updated Name"
5. Click save/submit

**Expected Results:**
- User updated successfully
- Success message displayed
- Updated name shown in list

**API Endpoint:** PUT /v1/users/:id  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] Changes persisted
- [ ] UI reflects update

---

### TC-USER-004: Disable User (Admin Only)
**Priority:** Critical  
**Module:** User Management

**Pre-conditions:**
- Admin user is logged in
- Active user exists (not self)

**Test Steps:**
1. Navigate to Pengguna menu
2. Find an active user
3. Click disable button
4. Confirm action

**Expected Results:**
- User disabled successfully
- Status changed to inactive
- User cannot login

**API Endpoint:** POST /v1/users/:id/disable  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] is_active = false in database
- [ ] User login fails
- [ ] UI shows disabled status

---

### TC-USER-005: Enable User (Admin Only)
**Priority:** High  
**Module:** User Management

**Pre-conditions:**
- Admin user is logged in
- Disabled user exists

**Test Steps:**
1. Navigate to Pengguna menu
2. Find a disabled user
3. Click enable button
4. Confirm action

**Expected Results:**
- User enabled successfully
- Status changed to active
- User can login again

**API Endpoint:** POST /v1/users/:id/enable  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] is_active = true in database
- [ ] User login succeeds

---

### TC-USER-006: Delete User (Admin Only)
**Priority:** Critical  
**Module:** User Management

**Pre-conditions:**
- Admin user is logged in
- Test user exists (not self)

**Test Steps:**
1. Navigate to Pengguna menu
2. Find a user to delete
3. Click delete button
4. Confirm deletion

**Expected Results:**
- User deleted successfully
- User removed from list
- User cannot login

**API Endpoint:** DELETE /v1/users/:id  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] User record removed
- [ ] No orphaned data
- [ ] User login fails

---

### TC-USER-007: Non-Admin Cannot Access User Management
**Priority:** Critical  
**Module:** User Management

**Pre-conditions:**
- Regular user is logged in

**Test Steps:**
1. Attempt to navigate to Pengguna menu
2. Or directly call API: GET /v1/users

**Expected Results:**
- Menu not visible in sidebar
- Or 403 Forbidden response
- User list not accessible

**API Response:** 403 Forbidden

**Acceptance Criteria:**
- [ ] UI hides admin-only menus
- [ ] API enforces authorization

---

### TC-USER-008: Change Password (Self)
**Priority:** High  
**Module:** User Management

**Pre-conditions:**
- Any user is logged in

**Test Steps:**
1. Navigate to Pengaturan/Profil
2. Click "Ubah Password"
3. Enter old password
4. Enter new password (min 8 chars)
5. Confirm new password
6. Click save

**Expected Results:**
- Password changed successfully
- Success message displayed
- Can login with new password

**API Endpoint:** POST /v1/auth/change-password  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] Old password verified
- [ ] New password stored securely
- [ ] Login works with new password

---

## 3. Stock Opname Test Scenarios

### TC-OPNAME-001: Create Stock Opname Command (Admin Only)
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- Admin user is logged in

**Test Steps:**
1. Navigate to Stok Opname menu
2. Click "Buat Perintah SO" or "+"
3. Enter kode_so: SO-2026-001
4. Select bulan: 6
5. Select tahun: 2026
6. Enter svp_nama: Supervisor Name
7. Enter lokasi: Warehouse A
8. Click save

**Expected Results:**
- Command created successfully
- Status: menunggu
- Appears in perintah list

**API Endpoint:** POST /v3-opname  
**API Response:** 201 Created

**Acceptance Criteria:**
- [ ] Record created in stok_opname_perintah
- [ ] Status = 'menunggu'

---

### TC-OPNAME-002: Start Stock Opname (User)
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- Regular user is logged in
- Pending opname command exists (status: menunggu)

**Test Steps:**
1. Navigate to Tugas SO menu
2. Find pending opname
3. Click "Mulai SO" or "Start"
4. Confirm action

**Expected Results:**
- Opname started
- Status changed to: proses
- Header created in stok_opname
- User can now input physical counts

**API Endpoint:** PUT /v3-opname (action: start)  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] Status = 'proses'
- [ ] started_at populated
- [ ] stok_opname record created

---

### TC-OPNAME-003: Input Physical Quantity (User)
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- User has started an opname (status: proses)

**Test Steps:**
1. Navigate to active opname
2. Find product in list
3. Enter physical count: 50
4. Click save/confirm

**Expected Results:**
- Physical quantity recorded
- Difference calculated (stok_sistem - stok_fisik)
- Item saved to stok_opname_detail

**API Endpoint:** POST /v3-opname-detail  
**API Response:** 201 Created

**Acceptance Criteria:**
- [ ] Detail record created
- [ ] selisih calculated correctly

---

### TC-OPNAME-004: Submit Stock Opname (User)
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- User has completed physical count entry
- Opname status: proses

**Test Steps:**
1. Navigate to active opname
2. Verify all items counted
3. Click "Submit" or "Kirim"
4. Confirm submission

**Expected Results:**
- Opname submitted
- Status changed to: menunggu_approval
- Awaiting admin approval

**API Endpoint:** PUT /v3-opname (action: submit)  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] Status = 'menunggu_approval'
- [ ] completed_at populated
- [ ] Admin can now approve

---

### TC-OPNAME-005: Approve Stock Opname (Admin Only)
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- Admin user is logged in
- Opname exists with status: menunggu_approval

**Test Steps:**
1. Navigate to Approval Center menu
2. Find pending approval
3. Click "Approve" button
4. Confirm approval

**Expected Results:**
- Opname approved
- Status changed to: selesai
- Finalization timestamp recorded

**API Endpoint:** PUT /v3-opname (action: approve) OR POST /v1/approvals/:id/approve  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] Status = 'selesai'
- [ ] disesuaikan_at populated
- [ ] Stock adjustments finalized

---

### TC-OPNAME-006: Reject Stock Opname (Admin Only)
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- Admin user is logged in
- Opname exists with status: menunggu_approval

**Test Steps:**
1. Navigate to Approval Center menu
2. Find pending approval
3. Click "Tolak" or "Reject" button
4. Confirm rejection

**Expected Results:**
- Opname rejected
- Status changed to: ditolak
- User notified of rejection

**API Endpoint:** PUT /v3-opname (action: reject) OR POST /v1/approvals/:id/reject  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] Status = 'ditolak'
- [ ] No stock adjustments made

---

### TC-OPNAME-007: Non-Admin Cannot Approve
**Priority:** Critical  
**Module:** Stok Opname

**Pre-conditions:**
- Regular user is logged in
- Opname exists with status: menunggu_approval

**Test Steps:**
1. Attempt to call approve API
2. Or try to access Approval Center

**Expected Results:**
- 403 Forbidden response
- Approval button not visible
- Cannot approve as non-admin

**API Response:** 403 Forbidden

**Acceptance Criteria:**
- [ ] API enforces admin-only
- [ ] UI hides approve option for non-admin

---

## 4. Dashboard Test Scenarios

### TC-DASH-001: Admin Dashboard Data Loads
**Priority:** High  
**Module:** Dashboard

**Pre-conditions:**
- Admin user is logged in
- Database has transaction data

**Test Steps:**
1. Navigate to Dashboard menu
2. Wait for data to load
3. Verify all KPI cards

**Expected Results:**
- All KPI values displayed (not empty)
- Penjualan Hari Ini: shows today's sales
- Pembelian Hari Ini: shows today's purchases
- Produk Aktif: count of active products
- Customer Aktif: count of active customers
- Stok Kritis: products with low stock
- SO Berjalan: active stock opnames
- Pending Approval: approvals awaiting
- Aktivitas: recent transactions table

**API Endpoint:** GET /v3-dashboard  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] All 10+ KPI cards render
- [ ] Values are numeric (0 or higher)
- [ ] Aktivitas table populated

---

### TC-DASH-002: User Dashboard Shows Personal Data
**Priority:** High  
**Module:** Dashboard

**Pre-conditions:**
- Regular user is logged in
- User has completed some opnames

**Test Steps:**
1. Navigate to Dashboard Saya menu
2. Verify displayed data

**Expected Results:**
- User's assigned tasks displayed
- User's recent activity shown
- No other users' data visible
- Only relevant KPIs for user role

**Acceptance Criteria:**
- [ ] Data filtered by current user
- [ ] No data leakage

---

### TC-DASH-003: Dashboard Mobile Layout
**Priority:** Medium  
**Module:** Dashboard

**Pre-conditions:**
- Mobile device or browser resize to 375px width
- Any user logged in

**Test Steps:**
1. Resize browser to mobile width
2. Navigate to Dashboard
3. Verify layout

**Expected Results:**
- KPI cards stack vertically
- Sidebar collapses to hamburger menu
- Touch targets are 44px+
- Tables scroll horizontally

**Acceptance Criteria:**
- [ ] Usable on mobile device
- [ ] No horizontal overflow
- [ ] All elements accessible

---

## 5. Settings/Profile Test Scenarios

### TC-SETTINGS-001: View Profile
**Priority:** Medium  
**Module:** Settings

**Pre-conditions:**
- Any user is logged in

**Test Steps:**
1. Navigate to Pengaturan/Profil menu
2. View profile information

**Expected Results:**
- Username displayed
- Email displayed
- Full name displayed
- Role displayed
- Last login displayed

**API Endpoint:** GET /v1/auth/me  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] All profile fields populated
- [ ] Read-only fields not editable

---

### TC-SETTINGS-002: Update Profile Name
**Priority:** Medium  
**Module:** Settings

**Pre-conditions:**
- Any user is logged in

**Test Steps:**
1. Navigate to Pengaturan/Profil
2. Click edit on name field
3. Enter new name: "Nama Baru"
4. Click save

**Expected Results:**
- Name updated successfully
- Success message displayed
- Header shows new name

**API Endpoint:** PUT /v1/users/profile  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] nama_lengkap updated
- [ ] Change reflected immediately

---

### TC-SETTINGS-003: Update Profile Email
**Priority:** Medium  
**Module:** Settings

**Pre-conditions:**
- Any user is logged in

**Test Steps:**
1. Navigate to Pengaturan/Profil
2. Click edit on email field
3. Enter new email: newemail@example.com
4. Click save

**Expected Results:**
- Email updated successfully
- Success message displayed

**API Endpoint:** PUT /v1/users/profile  
**API Response:** 200 OK

**Acceptance Criteria:**
- [ ] email updated
- [ ] Unique constraint respected

---

## 6. Authorization & Security Test Scenarios

### TC-SEC-001: Unauthenticated Access Blocked
**Priority:** Critical  
**Module:** Security

**Pre-conditions:**
- No user logged in
- Clear localStorage

**Test Steps:**
1. Try to access protected API directly
2. e.g., GET /v1/users or GET /v3-opname

**Expected Results:**
- 401 Unauthorized response
- No data returned
- Cannot access without token

**API Response:** 401 Unauthorized

**Acceptance Criteria:**
- [ ] All protected endpoints require auth
- [ ] Clear error message

---

### TC-SEC-002: Invalid Token Rejected
**Priority:** Critical  
**Module:** Security

**Pre-conditions:**
- Have expired or invalid token

**Test Steps:**
1. Set invalid token in Authorization header
2. Call any protected API

**Expected Results:**
- 401 Unauthorized response
- No data returned

**API Response:** 401 Unauthorized

**Acceptance Criteria:**
- [ ] Token validation enforced

---

### TC-SEC-003: Role-Based Access Control
**Priority:** Critical  
**Module:** Security

**Pre-conditions:**
- Regular user logged in (role: staff_gudang)

**Test Steps:**
1. Try to access admin-only APIs:
   - GET /v1/users
   - POST /v1/users
   - DELETE /v1/users/1
   - POST /v1/approvals/1/approve

**Expected Results:**
- 403 Forbidden for all admin-only endpoints
- User cannot perform admin actions

**API Response:** 403 Forbidden

**Acceptance Criteria:**
- [ ] Admin-only endpoints protected
- [ ] Clear error message

---

## Test Execution Summary

| Scenario ID | Priority | Module | Status | Executed By | Date |
|-------------|----------|--------|--------|-------------|------|
| TC-AUTH-001 | Critical | Auth | ☐ | | |
| TC-AUTH-002 | Critical | Auth | ☐ | | |
| TC-AUTH-003 | High | Auth | ☐ | | |
| TC-AUTH-004 | High | Auth | ☐ | | |
| TC-AUTH-005 | High | Auth | ☐ | | |
| TC-USER-001 | Critical | User Mgmt | ☐ | | |
| TC-USER-002 | High | User Mgmt | ☐ | | |
| TC-USER-003 | High | User Mgmt | ☐ | | |
| TC-USER-004 | Critical | User Mgmt | ☐ | | |
| TC-USER-005 | High | User Mgmt | ☐ | | |
| TC-USER-006 | Critical | User Mgmt | ☐ | | |
| TC-USER-007 | Critical | User Mgmt | ☐ | | |
| TC-USER-008 | High | User Mgmt | ☐ | | |
| TC-OPNAME-001 | Critical | Opname | ☐ | | |
| TC-OPNAME-002 | Critical | Opname | ☐ | | |
| TC-OPNAME-003 | Critical | Opname | ☐ | | |
| TC-OPNAME-004 | Critical | Opname | ☐ | | |
| TC-OPNAME-005 | Critical | Opname | ☐ | | |
| TC-OPNAME-006 | Critical | Opname | ☐ | | |
| TC-OPNAME-007 | Critical | Opname | ☐ | | |
| TC-DASH-001 | High | Dashboard | ☐ | | |
| TC-DASH-002 | High | Dashboard | ☐ | | |
| TC-DASH-003 | Medium | Dashboard | ☐ | | |
| TC-SETTINGS-001 | Medium | Settings | ☐ | | |
| TC-SETTINGS-002 | Medium | Settings | ☐ | | |
| TC-SETTINGS-003 | Medium | Settings | ☐ | | |
| TC-SEC-001 | Critical | Security | ☐ | | |
| TC-SEC-002 | Critical | Security | ☐ | | |
| TC-SEC-003 | Critical | Security | ☐ | | |

---

## Defect Log

| Defect ID | Scenario | Description | Severity | Status | Reported By |
|-----------|----------|-------------|----------|--------|-------------|
| | | | | | |
| | | | | | |
| | | | | | |

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