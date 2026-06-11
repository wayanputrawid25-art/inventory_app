# Approval Workflow

This document defines the Approval Workflow used across the Inventory App for reviewing and resolving submitted work (opnames, tasks, adjustments, etc.). It specifies the actions: Approve, Reject, and Recount, and explains UI behaviors, transition rules, permissions, notifications, and audit requirements.

## Actions

### Approve
- Description: A reviewer confirms submitted work is correct and authorizes downstream processing (e.g., inventory adjustments, closing a task).
- When to use: Counts or changes have been validated and any discrepancies have been resolved or documented.
- Required inputs: Approval note (recommended; may be required by policy), reviewer identity (captured automatically), optional attachments (supporting evidence).
- System behavior:
  - Mark the item/session as Approved and record timestamp and approver ID.
  - Trigger configured post-approval actions (apply inventory adjustments, close tasks, generate reports, notify stakeholders).
  - Lock submitted data from casual edits; only users with override permissions can unlock.
- Notifications: Notify submitter, assigned stakeholders, and downstream systems.
- Audit: Store immutable audit record including approver, timestamp, note, and any pre-/post-adjustment snapshots.

---

### Reject
- Description: Reviewer determines the submission is insufficient, incorrect, or requires changes and sends it back for correction.
- When to use: Significant discrepancies, missing evidence, or procedural errors that require rework.
- Required inputs: Rejection reason (mandatory), action required (e.g., correct counts, provide evidence), optional assignment (reassign back to a counter or to a lead for reconciliation).
- System behavior:
  - Transition submission to Rejected or "Changes Requested" state with reviewer comments.
  - Unlock relevant items for editing by counters or lead (based on permissions).
  - Optionally create follow-up tasks or issues for investigation.
- Notifications: Notify original submitter and assigned counters that changes are requested; include reviewer comments and any flagged items.
- Audit: Record rejection event, reviewer identity, timestamp, and the required corrective actions.

---

### Recount
- Description: A process to re-open counting for specific items or for the whole session to obtain new counts.
- When to use: When discrepancies cannot be resolved through review notes, or when suspected counting errors require a physical re-count.
- Types:
  - Partial Recount: Specific SKUs, locations, or bins are flagged for re-count.
  - Full Recount: Entire session is returned to counters for full recount.
- Required inputs: Reason for recount (mandatory), scope (item-level or session-level), deadline for re-count.
- System behavior:
  - Transition relevant items/sessions back to `Assigned` or `In Progress` with recount flag.
  - Preserve original counts and mark them as superseded but retained for audit.
  - Assign counters for the recount; provide priority and deadline.
  - Provide a reconciliation view to compare original and recount results.
- Notifications: Notify assigned counters and leads about recount assignment and deadlines.
- Audit: Retain original and recount values, who performed the recount, timestamps, and final reconciliation notes.

---

## Workflow & State Transitions
- Submitted -> Approved (on Approve)
- Submitted -> Rejected / Changes Requested (on Reject)
- Rejected -> Assigned/In Progress (after reassignment or when counter resumes work)
- Submitted -> Recount Requested (on Recount) -> Assigned/In Progress -> Submitted (after recount)
- Approved -> Reopen (rare) -> Recount or Edit (requires override permission)

Guardrails:
- Approval may require multiple sign-offs depending on organizational policy (e.g., finance approval for large adjustments).
- Enforce minimum reviewer permissions; some approvals may require senior reviewer roles.
- Prevent auto-approval if thresholds of discrepancy exceed configurable limits.

---

## UI Patterns
- Approval Modal: shows summary (submitted values, discrepancies, attachments), mandatory approval/rejection input, and action buttons (Approve, Request Changes, Recount).
- Rejection Flow: require structured reason, optionally suggest corrective steps, and allow immediate re-assignment.
- Recount Flow: quick-select items for partial recount, schedule time slots, and assign counters.
- Status Chips & Timeline: show Approval status and history in the detail panel with expand/collapse for audit trail.
- Locking Indicators: visually indicate which fields are read-only post-submission and who can unlock them.

---

## Permissions & Roles
- Roles should be defined for: Counter, Lead Counter, Reviewer, Senior Reviewer, Inventory Manager, Finance Approver, Admin.
- Minimum permissions:
  - Counter: count and submit
  - Lead Counter: submit, request recount, assign counters
  - Reviewer: approve, reject, request recount
  - Senior Reviewer / Finance: required for high-impact approvals
  - Admin: override locks and force approvals (audited)
- Role-based rules should be configurable in system settings.

---

## Notifications
- Events that trigger notifications: Submitted, Approved, Rejected, Recount requested, Recount completed, Approval required (escalations).
- Notification channels: in-app, email, and optional push notifications.
- Include direct links to the affected session, item, or task and a short summary of required actions.

---

## Audit & Compliance
- Maintain an immutable audit log of all approval actions: who performed the action, timestamps, notes, attachments, and before/after snapshots of key data.
- Exportable logs and reports for regulatory audits.
- Optionally include cryptographic signing or versioned snapshots for high-compliance environments.

---

## Integration & Automation
- Webhooks: emit events for Approve/Reject/Recount for downstream systems (ERP, accounting, reporting).
- Batch approvals: support bulk-approve or bulk-reject with safeguards (preview of affected items and ability to exclude outliers).
- Threshold rules: automated escalation when discrepancies exceed configured thresholds (e.g., auto-flag for senior review).

---

## Edge Cases & Conflict Handling
- Concurrent reviewers: record all reviewer actions and the system should resolve race conditions with explicit last-action wins or require reconciliation when conflicting approvals occur.
- Partial approvals: allow item-level approvals within a session if needed; final Apply adjustments only after all critical items are approved or policy thresholds are satisfied.
- Emergency overrides: admins can force-approve in emergencies but must provide mandatory justification which is recorded in the audit trail.

---

## API Considerations
- Endpoints to implement:
  - POST /api/approvals/{sessionId}/approve
  - POST /api/approvals/{sessionId}/reject
  - POST /api/approvals/{sessionId}/recount
  - GET /api/approvals/{sessionId}/history
  - PATCH /api/approvals/{sessionId}/unlock (admin only)
- Payloads must include reviewer id (server-side enforced), notes, attachments (IDs), and optional reassignments.
- Ensure idempotency for approve/reject actions to avoid duplicate processing.

---

## Metrics to Track
- Approval time (submitted -> approved)
- Rejection rate (percent of submissions rejected)
- Recount rate and time to recount
- Number of overrides and emergency approvals
- Impacted inventory adjustments following approvals

---

## Version History
| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-08 | Initial approval workflow draft |
