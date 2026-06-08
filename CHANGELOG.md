# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Reports UI
- **New Reports Page** - Built comprehensive reports interface for analytics and reporting
  - Reports Header: Title with refresh button
  - Quick Stats: Total SKU, Low Stock, Out of Stock, and Discrepancy counts
  - Report Categories: Four category cards (Inventory, Sales, Opname, Audit)
  - Recent Reports: List of recently generated reports with download/view actions
  - Report Generator Modal: Form for generating custom reports with templates

- **Report Categories**
  - Laporan Inventory - Stok gudang, movements, dan valuation report
  - Laporan Penjualan - Sales performance, outlet breakdown, dan trend
  - Laporan Stok Opname - Opname results, discrepancies, dan variance analysis
  - Laporan Audit - Audit trails, user activities, dan compliance reports

- **Report Generator Features**
  - Template selection for each report type
  - Date range picker (start and end dates)
  - Output format selection (PDF, Excel, CSV)
  - Option to include charts and visualizations
  - Optional description field

- **Reports Functions** - Added JavaScript functions for Reports interactions
  - `loadReportsPage()` - Initialize reports page on menu selection
  - `refreshReports()` - Refresh reports data
  - `openReportGenerator(type)` - Open report generator modal for specific type
  - `closeReportGenerator()` - Close report generator modal
  - `generateReport(type)` - Generate report with selected parameters
  - `downloadReport(reportId)` - Download existing report
  - `viewReport(reportId)` - View report preview

#### Audit Center
- **New Audit Center Page** - Built comprehensive audit center following wireframe from `audit-workflow.md`
  - Audit Center Header: Title, search bar, and export button
  - Stats Cards: Total logs, opname, approval, adjustment, and auth event counts
  - Filter Bar: Action, User, Resource, and Date range filters with view toggle
  - Audit Table View: Full table with timestamp, user, action, resource, change summary, origin
  - Audit Timeline View: Chronological feed with icons and change summaries
  - Pagination: Previous/Next buttons with page numbers
  - Export functionality for compliance reporting

- **Audit Actions**
  - Created (Green) - Resource creation events
  - Updated (Blue) - Resource modification events
  - Submitted (Purple) - Submission events
  - Approved (Green) - Approval events
  - Rejected (Red) - Rejection events
  - Deleted (Red) - Deletion events
  - Login/Logout (Gray) - Authentication events

- **Audit Origins**
  - Web UI - User actions via web interface
  - API - Actions via API calls
  - Mobile - Actions from mobile devices

- **Audit Center Features** (per design spec)
  - Immutable audit trail with before/after snapshots
  - Filter by action type, user, resource, and date range
  - Search across change summary and resource IDs
  - Table and timeline view toggle
  - Pagination for large datasets
  - Export capability for compliance reports

- **Audit Center Functions** - Added JavaScript functions for Audit Center interactions
  - `loadAuditCenter()` - Initialize audit center on menu selection
  - `renderAuditTable()` - Render audit log table with pagination
  - `renderAuditTimeline()` - Render audit log timeline view
  - `updateAuditStats()` - Update audit count statistics
  - `setAuditView()` - Toggle between table and timeline views
  - `filterAudit()` - Filter by search, action, user, resource, and date
  - `renderAuditPagination()` - Render pagination controls
  - `goToAuditPage()` / `prevAuditPage()` / `nextAuditPage()` - Navigation
  - `openAuditDetail()` - Open detailed audit view
  - `exportAuditLog()` - Export audit logs

#### Activity Timeline
- **New Activity Timeline Page** - Built comprehensive activity timeline following wireframe from `activity-timeline.md`
  - Activity Timeline Header: Title, search bar, and refresh button
  - Stats Cards: Total activities, today, opname, task, and approval counts
  - Filter Bar: Type, Actor, and Date range filters with view toggle
  - Timeline View: Chronological feed with date grouping (Today, Yesterday, 7 Hari, Lebih Lama)
  - Activity Items: Icon, actor avatar, title, description, type badge, timestamp, and resource links
  - Compact View: Single-line format for quick scanning
  - Load More: Pagination button for lazy loading older activities

- **Activity Types**
  - Stok Opname (Blue) - Stock opname events
  - Task (Purple) - Task lifecycle events
  - Approval (Green) - Approval workflow events
  - Penyesuaian (Amber) - Stock adjustment events
  - Authentication (Gray) - Login/logout events
  - Stok (Red) - General stock events

- **Activity Timeline Features** (per design spec)
  - Grouped by date with collapsible sections
  - Actor information with avatar and name
  - Resource links to related items (opname, task, approval)
  - Filter by type, actor, and date range
  - Search across title and description
  - Timeline and compact view toggle

- **Activity Timeline Functions** - Added JavaScript functions for Activity Timeline interactions
  - `loadActivityTimeline()` - Initialize activity timeline on menu selection
  - `renderActivityList()` - Render activity list with date grouping
  - `updateActivityStats()` - Update activity count statistics
  - `groupActivitiesByDate()` - Group activities by date ranges
  - `setActivityView()` - Toggle between timeline and compact views
  - `filterActivity()` - Filter by search, type, actor, and date
  - `refreshActivity()` - Refresh activity data
  - `loadMoreActivity()` - Load more activities with pagination

#### Approval Center
- **New Approval Center Page** - Built comprehensive approval center following wireframe from `approval-workflow.md`
  - Approval Center Header: Title, search bar, and type filter
  - Stats Cards: Total pending, urgent, opname, adjustment, and approved today
  - Filter Tabs: Pending Review, Approved, Rejected, Recount
  - Approval List: Full table with type badge, title, submitter, date, priority, status, and actions
  - Approval Detail Drawer: Right-side panel showing full approval details with discrepancy analysis
  - Approval Actions Panel: Notes textarea and action buttons (Approve, Reject, Request Recount)
  - Approval History Timeline: Chronological activity feed

- **Approval Types**
  - Stok Opname (Blue badge) - Stock opname submissions
  - Penyesuaian (Amber badge) - Stock adjustments
  - Task (Purple badge) - Task approvals

- **Approval Status System**
  - Pending (Amber) - Awaiting review
  - Approved (Green) - Approved by reviewer
  - Rejected (Red) - Rejected with notes
  - Recount (Purple) - Requested for recount

- **Approval Actions** (per design spec)
  - Approve: Confirm submission and authorize downstream processing
  - Reject: Send back with mandatory rejection reason
  - Recount: Request partial or full recount of items

- **Approval Center Functions** - Added JavaScript functions for Approval Center interactions
  - `loadApprovalCenter()` - Initialize approval center on menu selection
  - `renderApprovalList()` - Render approval list with filters
  - `updateApprovalStats()` - Update approval count statistics
  - `setApprovalFilter()` - Switch between pending/approved/rejected/recount tabs
  - `filterApprovals()` - Filter approvals by search and type
  - `openApprovalDetail()` / `closeApprovalDetail()` - Open/close approval detail drawer
  - `approveItem()` - Approve an item
  - `rejectItem()` - Reject an item with mandatory notes
  - `recountItem()` - Request recount for an item

#### Task Center
- **New Task Center Page** - Built comprehensive task management center following wireframe from `task-center.md`
  - Task Center Header: Title, search bar, and create task button
  - Filter Bar: Status, Priority, and Assignee filters with list/board view toggle
  - Task Stats: Real-time count of total tasks, drafts, assigned, in progress, review, and closed
  - Task List View: Full table with title, status chip, priority badge, assignee avatar, due date, and actions
  - Task Board View: Kanban-style columns for each status (Draft, Assigned, In Progress, Review, Approved, Closed)
  - Task Detail Drawer: Right-side panel showing full task details with activity feed
  - Create Task Modal: Form for creating new tasks with title, description, priority, assignee, and due date

- **Task Status System**
  - Draft (Gray) - Task created but not yet assigned
  - Assigned (Blue) - Task assigned but work not started
  - In Progress (Amber) - Work actively underway
  - Review (Indigo) - Submitted for review
  - Approved (Green) - Review completed and approved
  - Closed (Muted Gray) - Task finished and archived

- **Task Priority System**
  - High (Red badge) - Critical tasks requiring immediate attention
  - Medium (Amber badge) - Standard priority tasks
  - Low (Gray badge) - Non-urgent tasks

- **Task Center Functions** - Added JavaScript functions for Task Center interactions
  - `loadTaskCenter()` - Initialize Task Center on menu selection
  - `renderTaskList()` - Render task list with filters
  - `updateTaskStats()` - Update task count statistics
  - `populateBoardView()` - Populate Kanban board columns
  - `setTaskView()` - Toggle between list and board views
  - `filterTasks()` - Filter tasks by search, status, priority, assignee
  - `openTaskDetail()` / `closeTaskDetail()` - Open/close task detail drawer
  - `openCreateTaskModal()` / `closeCreateTaskModal()` - Open/close create task modal
  - `createTask()` - Create new task
  - `updateTaskStatus()` - Advance task to next status
  - `isOverdue()` - Check if task is overdue

#### Operator Dashboard
- **New Operator Dashboard Page** - Built comprehensive operator dashboard following wireframe from `operator-dashboard.md`
  - Operator Header: Avatar, name, date, sync status
  - Progress Cards: Tasks completed, items counted, variance found
  - Task Hari Ini: List of assigned tasks with priority, status, and action buttons
  - Opname Aktif: Active opname card with progress bar and continue scan button

- **Role-Based Dashboard Display**
  - Non-admin users see operator dashboard when selecting Stok Opname
  - Admin users see full opname tab with all features

- **Operator Functions** - Added JavaScript functions for operator dashboard interactions
  - `loadOperatorDashboard()` - Initialize operator dashboard on menu selection
  - `populateMockOperatorProgress()` - Load progress data
  - `startTask()`, `continueTask()`, `viewTask()` - Task action handlers
  - `continueOpname()` - Continue to opname scan mode
  - `navigateToOperatorSection()` - Navigation helper

#### Admin Dashboard
- **New Admin Dashboard Page** - Built comprehensive admin dashboard following wireframe from `admin-dashboard.md`
  - KPI Cards: Total Stock, Stock Alert, Pending Opname, Pending Approval
  - Warehouse Health Panel: Health score, stock availability, restock risk, opname variance, data integrity indicators
  - Pending Approvals Panel: List of pending approvals with priority, requester, age, and review action
  - Recent Activity Timeline: Filterable activity log showing latest stock movements, opnames, approvals, and audits
  - Refresh button to reload dashboard data

- **Admin Menu Item** - Added Admin Panel menu item in sidebar (only visible for admin role)
  - Role-based visibility (hidden for non-admin users)
  - Icon and styling consistent with app theme

- **Navigation Functions** - Added JavaScript functions for admin dashboard interactions
  - `loadAdminDashboard()` - Initialize admin dashboard on menu selection
  - `refreshAdminDashboard()` - Refresh KPI data
  - `navigateToAdminSection()` - Navigate to related menu sections
  - `filterRecentActivity()` - Filter activity timeline by type

### Changed

#### Sidebar Redesign
- **Enhanced Brand Section**
  - New `sidebar-brand` component with gradient accent at top
  - Improved logo display with rounded corners and background
  - Better typography hierarchy (tag and title)
  - More compact and modern design

- **Section Labels**
  - Added "Menu Utama" section for main navigation (Dashboard, Admin)
  - Added "Operasional" section for operational modules (Persediaan, Forecasting, Stok Opname)
  - Visual divider between sections

- **Improved Navigation Items**
  - Added left border accent on hover (gradient from primary to accent color)
  - Better active state with subtle glow effect
  - Larger icons (20px) for better visibility
  - Better spacing and border-radius

- **Sidebar Footer**
  - Added version info footer with info icon
  - Subtle styling to not distract from main navigation

- **Responsive Improvements**
  - Better mobile adaptation with proper flex layout
  - Adjusted brand and menu item sizing for mobile
  - Improved touch targets

#### Header Redesign
- **Enhanced Brand Section**
  - Added gradient accent bar for visual distinction
  - Improved typography with better spacing and letter-spacing
  - Better visual hierarchy with subtle background styling

- **Improved User Info Display**
  - New avatar with initial letter fallback (displays first letter of username)
  - Display full username and role badge
  - Role indicator with color-coded badges (Admin in red, User in green)
  - Improved hover effects on user info card

- **Better Action Buttons**
  - Redesigned login button with gradient background matching app theme
  - Improved logout button with subtle styling
  - Added icons to both buttons (log-in, log-out from Lucide icons)
  - Better hover animations and transitions

- **Responsive Improvements**
  - Better mobile adaptation (hides text on small screens, keeps icons)
  - Improved breakpoint handling at 860px and 640px
  - Adjusted container margin-top for new header height

- **Visual Polish**
  - Added backdrop blur effect
  - Improved border and shadow styling
  - Better color consistency with app theme
  - Smooth transitions on all interactive elements

### Files Changed
- `css/style.css` - Updated sidebar and header styles; Added admin, operator dashboard, Task Center, Approval Center, Activity Timeline, Audit Center, and Reports UI styles
- `index.html` - Updated sidebar HTML structure; Added admin, operator dashboard, Task Center, Approval Center, Activity Timeline, Audit Center, and Reports sections; Updated auth state JavaScript
- `js/dashboard.js` - Added admin, operator dashboard, Task Center, Approval Center, Activity Timeline, Audit Center, and Reports functions; Updated menu handling for role-based dashboard
- `CHANGELOG.md` - Documented all changes