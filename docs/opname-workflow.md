# Stock Opname Workflow

This document outlines the Stock Opname (inventory counting) workflow for the Inventory App. The workflow ensures accurate physical stock counts and provides clear handoffs between roles from creation through approval.

## Flow Overview
Canonical steps in the Stock Opname process:

1. Create
2. Assign
3. Count
4. Submit
5. Review
6. Approve

Each step includes UI behaviors, roles, validations, and notifications.

---

## 1. Create
- Description: A stock opname session is created to audit inventory for a location, category, or the entire warehouse.
- Actors: Inventory manager, Supervisor
- Required fields: Title, Location(s), Date range, Scope (full/partial), Notes, Responsible team
- Optional fields: Tags, Expected items list, Counting method (per-item, cycle counting)
- UI: "Create Opname" form accessible from the Task Center or Inventory menu. Quick-create from a product or location page pre-fills context.
- Validation: Must include at least one location and a start date. Prevent overlapping active opnames for the same location unless explicitly forced.
- Notifications: Assigned stakeholders notified of new opname creation if they are in the responsibility list.

Transition: After creation, the opname is in state `Created` and ready for assignment.

---

## 2. Assign
- Description: Assign counters (users or teams) to the opname session and optionally split responsibilities by area or item set.
- Actors: Inventory manager, Supervisor
- UI: Assignment panel in the opname detail; support for bulk-assign, role selection (Lead counter, Counter), and time slots.
- Validation: Ensure counters have necessary permissions; avoid assigning same user to conflicting time slots.
- Notifications: Assigned counters receive assignment notification with link to their counting tasks and schedule.

Transition: After assignment, the opname moves to `Assigned` state.

---

## 3. Count
- Description: Counters perform physical counts and record quantities in the app.
- Actors: Counters (warehouse staff, auditors)
- UI: Mobile-first counting interface with offline support: searchable item list, barcode scanning, quantity input, photo attachment, and notes per item.
- Features:
  - Batch counting: scan multiple items then enter counts
  - Automatic matching to expected items and flagging of discrepancies (missing or extra items)
  - Subtotals and progress indicators (items counted vs total)
  - Save draft counts locally and sync when online
- Validation: Quantities must be non-negative integers; required fields (e.g., quantity or "not found") enforced per item.
- Conflict handling: If simultaneous counters edit the same item, show last-modified and merge rules (e.g., latest count wins or require reconciliation based on settings).
- Notifications: Counters get reminders for upcoming time slots and low-progress warnings.

Transition: When counters finish their assigned items, the opname moves to `Counting Complete` or `Ready to Submit` (depending on whether all counters have finished).

---

## 4. Submit
- Description: Counters or a lead submit the opname session for review. Submission finalizes counts for review and prevents casual edits.
- Actors: Lead counter, Supervisor
- UI: "Submit for Review" button in opname detail. Show summary of counts, discrepancies, attachments, and a required submission note explaining major discrepancies.
- Validation: All assigned items must have a recorded state (counted, not found, or marked for follow-up) or a configured override must be used.
- Locking: On submit, counts become read-only for regular counters. Admins or supervisors can unlock for corrections.
- Notifications: Reviewers are notified of a new opname pending review, including a summary report link.

Transition: Submission moves the opname to `Submitted` or `Pending Review` state.

---

## 5. Review
- Description: Reviewers (supervisors, inventory leads) verify counts, investigate discrepancies, and request corrections or approve.
- Actors: Reviewers, Auditors
- UI: Review panel shows side-by-side expected vs counted values, discrepancy filters (by severity, by item), ability to comment per-item, request follow-up, or mark as accepted.
- Actions:
  - Approve item counts
  - Request changes with annotations
  - Assign follow-up tasks for investigation
  - Add adjustment records or notes (with audit trail)
- Validation: Review must include a reviewer note when approving or requesting changes.
- Notifications: Counters and relevant stakeholders receive notifications on requested changes or approval.

Transition: If reviewer requests changes, opname returns to `In Review - Changes Requested` or back to `Assigned`/`In Progress` depending on severity. If reviewer approves, opname moves to `Approved`.

---

## 6. Approve
- Description: Final approval confirms counts and triggers inventory updates (stock adjustments, reconciliation records) and reporting.
- Actors: Inventory manager, Finance approver (optional)
- UI: Approval confirmation modal with checklist: review completed, adjustments documented, approvals captured.
- Actions on approve:
  - Apply adjustments to inventory (create adjustment transactions)
  - Generate and archive opname report (PDF/CSV)
  - Trigger downstream workflows (reorder, write-offs, accounting entries) as configured
- Audit: Record approver identity, timestamp, and any approval notes. Maintain immutable audit trail for regulatory compliance.
- Notifications: Stakeholders notified of completion; reports available for download.

State: Approved → Closed/Completed (depending on organizational policy).

---

## Additional Considerations

Permissions & Roles
- Define permissions for creating, assigning, counting, reviewing, and approving opnames.
- Special override permissions for unlocking submitted opnames or force-applying adjustments.

Data Integrity
- Keep an immutable audit trail of original counts, reviewer notes, and any manual adjustments.
- Support export of raw counting data and final adjustments for reconciliation.

Offline & Mobile
- Ensure reliable offline counting with conflict resolution and clear sync states.

Edge Cases
- Partial submissions: allow submitting sections of an opname while other sections remain pending when the workflow allows partial closure.
- Lost items: provide a structured workflow for investigating and resolving missing stock (investigation task, root cause, write-off if needed).
- Discrepancy thresholds: configure automatic approval or escalation when discrepancies fall within acceptable thresholds.

Metrics & Reporting
- Track time to complete counts, variance rates (expected vs actual), number of adjustments, and reopen rates.
- Provide dashboards for trends by location, SKU, and counter performance.

---

## Implementation Notes
- Use transactional back-end operations when applying inventory adjustments to ensure consistency.
- Provide role-based audit logs and exportable reports.
- Integrate barcode scanning SDKs and optimize mobile UX for fast counting.

## Version History
| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-08 | Initial stock opname workflow draft |
