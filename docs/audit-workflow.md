# Audit Workflow

This document defines the Audit Workflow for the Inventory App and the audit log tracking model. It focuses on what to track, how to store it, access controls, querying and export, and implementation guidance to ensure integrity, traceability, and compliance.

## Purpose
Maintain an immutable, searchable record of important actions that affect inventory, tasks, approvals, and configuration. Audit logs support troubleshooting, compliance audits, and forensic analysis.

## Tracking Model
Every audit entry should capture the following core fields:

- **user**
  - Who performed the action.
  - Recommended fields: user_id (UUID), username/email, display_name, role, and IP address (when available).

- **action**
  - What the user did.
  - Use an enumerated action type (e.g., ITEM_COUNTED, OPNAME_SUBMITTED, OPNAME_APPROVED, TASK_CREATED, TASK_UPDATED, ADJUSTMENT_APPLIED, LOGIN, API_KEY_CREATED, PERMISSION_GRANTED).
  - Include an action_description text field for human-readable context.

- **before**
  - Snapshot of the relevant resource state immediately before the action.
  - Keep this small but sufficient: include key properties (e.g., quantity, status, assignee, metadata). For large objects store a trimmed diff or reference to stored snapshot.

- **after**
  - Snapshot of the relevant resource state immediately after the action.
  - Same structure as `before` to enable comparisons.

### Additional recommended fields
- **timestamp**: ISO 8601 in UTC
- **resource_type**: e.g., opname_session, item, task, user, configuration
- **resource_id**: identifier for the affected resource
- **request_id / correlation_id**: to correlate related actions within a transaction or user flow
- **origin**: UI, API, mobile, background-job
- **client_info**: user agent, device id (if applicable)
- **ip_address**: source IP
- **reason**: optional text capturing why the action occurred (useful for overrides)
- **attachments**: links/IDs for stored evidence (photos, PDFs)
- **change_summary**: a short delta summary (e.g., quantity: 10 -> 7)
- **immutable_id / sequence**: internal sequence to enforce ordering

---

## JSON Example

```json
{
  "immutable_id": "aud_0001c2ab3",
  "timestamp": "2026-06-08T08:10:00Z",
  "user": {
    "user_id": "usr_1234",
    "username": "jane.doe@example.com",
    "display_name": "Jane Doe",
    "role": "Reviewer"
  },
  "action": {
    "type": "OPNAME_APPROVED",
    "description": "Approved stock opname session #op_2026_06_08"
  },
  "resource_type": "opname_session",
  "resource_id": "op_2026_06_08",
  "before": {
    "status": "Submitted",
    "adjustments_pending": 12
  },
  "after": {
    "status": "Approved",
    "adjustments_applied": true
  },
  "change_summary": "status: Submitted -> Approved; adjustments_applied: false -> true",
  "request_id": "req_998877",
  "origin": "web_ui",
  "ip_address": "203.0.113.4",
  "attachments": ["att_photo_452"]
}
```

---

## Storage & Immutability
- Store audit entries in an append-only datastore (e.g., write-optimized table in PostgreSQL with insert-only policy, or an immutable log such as Kafka or a dedicated audit store).
- Do not allow direct modification or deletion of audit records. If corrections are required, write a new compensating audit entry explaining the correction.
- Use cryptographic signing or checksums for high-compliance scenarios if required.
- Consider partitioning/retention policies: keep full detailed logs for an operationally required period (e.g., 1–3 years) and aggregate summaries for longer-term storage.

---

## Access Control & Privacy
- Restrict access to audit logs to authorized roles (e.g., Admin, Compliance, Security, Audit Team).
- Mask or redact PII in logs when users do not have explicit access. Consider storing sensitive data encrypted at rest and decrypting only for authorized viewers.
- Log access to audit records themselves (who viewed or exported logs) as an additional audit trail.

---

## Querying & UI
- Provide a searchable Audit Viewer in the admin console with filters:
  - Date range
  - User
  - Action type
  - Resource type / resource id
  - Request / correlation id
  - Origin (web/api/mobile)
  - Free text search across description and change_summary
- Support quick diffs: show before vs after side-by-side and highlight changed fields.
- Allow export (CSV, JSON, PDF) of filtered results; enforce access and rate limits for exports.

---

## API & Integration
- Expose read-only audit API endpoints for authorized clients (e.g., GET /api/admin/audit?query=...)
- Emit audit events to webhooks or streaming systems for downstream processing (SIEM, ELK, data warehouse).
- Ensure idempotency and ordering when ingesting audit events from async systems.

---

## Retention & Compliance
- Define retention policy aligned with legal/regulatory requirements and business needs.
- Implement automated retention and archival: move old logs to secure cold storage with verified integrity.
- For GDPR/CCPA, be cautious when fulfilling data-subject requests: do not remove audit trails that are legally required; prefer redaction where possible and document decisions.

---

## Implementation Patterns
- Database table schema (PostgreSQL example):
  - id (bigserial / UUID)
  - immutable_id (string)
  - timestamp (timestamptz)
  - user_id (UUID)
  - username (text)
  - role (text)
  - action_type (text)
  - action_description (text)
  - resource_type (text)
  - resource_id (text)
  - before_json (jsonb)
  - after_json (jsonb)
  - change_summary (text)
  - metadata (jsonb) — request_id, origin, ip, attachments

- Indexes: timestamp, user_id, action_type, resource_type + resource_id, request_id
- For high write volumes, consider a write-optimized stream (Kafka) and a separate read-store for querying (Elasticsearch, ClickHouse, or a dedicated OLAP store).

---

## Monitoring & Alerting
- Create alerts for suspicious activity patterns: mass deletions (attempted), repeated failed logins followed by critical actions, large-scale adjustments, sudden spikes in recounts or reopens.
- Monitor audit log pipeline health and delays between action and log ingestion.

---

## Example Use Cases
- Investigate who approved a large stock adjustment and when.
- Reconstruct timeline for a product variance across locations.
- Provide auditors with ordered, exportable records of approvals and adjustments.

---

## UX Best Practices
- When showing before/after in the UI, always include timestamps and actor names for each snapshot.
- Provide contextual links back to the resource and related tasks for quick investigation.
- Avoid exposing raw PII unless necessary — present summarized/redacted views for standard users.

---

## Version History
| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-08 | Initial audit workflow and tracking model |
