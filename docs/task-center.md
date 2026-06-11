# Task Center Design

This document describes the Task Center design for the Inventory App. It covers task lifecycle statuses, UI layout, interactions, and accessibility considerations.

## Statuses
The Task Center uses the following canonical task statuses:

- **Draft**
  - Description: Task has been created but not yet assigned or started. Editable by the creator.
  - Typical actions: Edit, Assign, Delete, Save as Draft

- **Assigned**
  - Description: Task has been assigned to a user but work has not started.
  - Typical actions: Start Task, Reassign, Comment

- **In Progress**
  - Description: Work on the task is actively underway by the assignee.
  - Typical actions: Add Comment, Upload Attachment, Request Review, Mark Ready for Review

- **Review**
  - Description: Task work is submitted for review. Reviewers can comment, request changes, or approve.
  - Typical actions: Approve, Request Changes, Comment

- **Approved**
  - Description: Review completed and task is approved. Task may be closed or moved to a follow-up stage.
  - Typical actions: Close Task, Reopen, Archive

- **Closed**
  - Description: Task is finished and archived. Read-only state.
  - Typical actions: Reopen, Clone Task for new work

---

## Task Center Layout

Main screen components:

- **Header**: Title, global actions (Create Task, Bulk actions), search bar
- **Filters & Views** (left rail on desktop / collapsible on mobile): Status filter, Assignee, Priority, Tags, Date range, Saved views
- **Task List**: Main area showing a list or table of tasks with columns for Title, Status, Assignee, Due date, Priority, Actions
- **Task Card / Row**: Compact representation containing key metadata, quick actions (Start, Assign, More), and context menu
- **Task Detail Panel**: Right-side drawer or modal that opens when a task is selected, containing full description, activity feed, attachments, subtasks, comments, and status controls
- **Activity / Notifications**: Inline activity feed in the detail panel plus global notifications for mentions and assignment

Design behaviors:
- Clicking a task opens the detail panel without leaving the list (supports quick triage).
- Bulk operations available from list view (change status, assign, delete).
- Keyboard shortcuts: Create new task (N), Open selected task (Enter), Quick assign (A)

---

## Status Transitions & Rules

- Draft -> Assigned (on assign) or Draft -> Closed (if canceled)
- Assigned -> In Progress (on start) or Assigned -> Draft (unassign/return to draft)
- In Progress -> Review (on submit for review) or In Progress -> Assigned (reassign)
- Review -> Approved (on approval) or Review -> In Progress (request changes)
- Approved -> Closed (on close) or Approved -> In Progress (reopen)
- Closed -> Reopen -> In Progress or Assigned (when reopened)

Guardrails:
- Only users with appropriate permissions can move tasks into Review or Approved states.
- Reviewers must leave a comment when requesting changes.

---

## Visual Indicators

- Status chips with color-coded semantic colors (see design system):
  - Draft: Gray
  - Assigned: Blue (informational)
  - In Progress: Amber/Yellow
  - Review: Indigo
  - Approved: Green
  - Closed: Muted Gray
- Priority badges (Low / Medium / High) with distinct tint
- Avatar stack for multiple assignees
- Icons for quick affordances (comments, attachments, subtasks)

---

## Notifications & Activity

- In-app notifications for assignments, mentions, and status changes.
- Email or push notifications configurable per user preference (on assignment, on mention, on status change).
- Activity feed shows chronological events with timestamps and author.

---

## Accessibility

- All interactive elements must be keyboard navigable and provide visible focus indicators.
- Status colors must meet contrast requirements and should not be the sole indicator of status (include text labels and icons).
- Task detail panel must trap focus while open and return focus to the originating element on close.
- Provide aria-live regions for real-time status updates and notifications.

---

## Mobile Considerations

- Use single-column list of full-width task cards.
- Filters accessed via a collapsible panel or modal.
- Task detail opens full screen with easy back navigation.
- Actions prioritized for touch: large tap targets and simplified action sets.

---

## Metrics & Tracking

Track the following to measure Task Center effectiveness:
- Number of tasks created per week
- Average time in each status
- Cycle time (Draft -> Closed)
- Review turnaround time
- Reopen rate after approval

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-08 | Initial draft of Task Center design |
