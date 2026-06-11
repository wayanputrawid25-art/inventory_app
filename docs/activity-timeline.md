# Activity Timeline

This document describes the Activity Timeline feature for the Inventory App — a chronological record of actions and events related to resources (opnames, tasks, items, users, approvals) that helps users understand recent history, audits, and collaboration.

## Purpose
- Provide a single place to view chronological events tied to a resource or globally across the system.
- Help users answer "what happened and when" (who, what, before/after, context).
- Support troubleshooting, accountability, and collaboration.

## Events to Capture
Capture user and system-generated events with structured payloads. Typical events:
- Resource lifecycle: created, updated, submitted, approved, rejected, reopened
- Inventory events: count recorded, adjustment applied, stock transfer
- Task events: assigned, status changed, comment added, closed
- Review events: review requested, comment, approval, rejection
- Authentication/events: login, logout, API key created
- System events: scheduled job ran, webhook delivered, integration error

Minimum event fields:
- id (UUID)
- timestamp (ISO 8601 UTC)
- actor (user_id, display_name, role)
- action_type (enumeration)
- resource_type, resource_id
- description (human-friendly summary)
- before (optional snapshot / diff)
- after (optional snapshot / diff)
- metadata (json) — details like attachments, links, correlation_id, origin

## UI Layout Patterns
- Resource-level timeline: shown in the right-side detail panel (opname/task/item) with newest-first or oldest-first toggle
- Global timeline feed: admin or team activity stream with filters and saved views
- Compact vs Expanded items:
  - Compact: single-line summary (actor, action, short description, timestamp)
  - Expanded: full event with before/after, attachments, comments, and links

Suggested components:
- Event card with avatar, action icon, timestamp, and summary
- Inline actions: reply/comment, view attachment, open related resource
- Collapsible grouping by day/week with counts and quick jump links

## Grouping & Aggregation
- Group events by date (Today, Yesterday, this Week) and optionally by actor or activity type
- For noisy events (e.g., many item counts), aggregate into summary entries with a "show details" link
- Provide roll-up metrics: e.g., "23 items counted by Alice at 09:12 — 09:35"

## Filtering & Search
- Filters: date range, actor, action_type, resource_type, resource_id, severity, tags
- Full-text search across descriptions and change_summary
- Saved views for common queries (e.g., My approvals, High-impact adjustments)

## Real-time Updates
- Use WebSockets or Server-Sent Events to push new events to clients in real time.
- Fallbacks: polling with exponential backoff; long-polling for older browsers.
- Provide unobtrusive update indicators ("3 new events — refresh" or auto-insert with focus-preserving behavior).
- Ensure real-time updates respect user permissions (only show events the user is authorized to see).

## Pagination & Performance
- Use cursor-based pagination for timeline queries (created_at + id) to support stable paging with inserts.
- Limit initial payload (e.g., 30 events) and lazy-load older events on demand.
- For resource-level timelines, consider time-windowed default (last 90 days) with ability to load full history.
- Aggregate or summarize high-volume event types server-side to avoid flooding the UI.

## Storage & Data Model
- Append-only event store (event table or event stream) with indexes on timestamp, resource_type+resource_id, actor_id, and action_type.
- For high-throughput workloads, use an event streaming platform (Kafka, Kinesis) plus a read-store (Elasticsearch, ClickHouse) for queries.
- Store before/after snapshots as jsonb or references to stored snapshots for large objects.
- Maintain correlation_id for tracing multi-step flows.

## Privacy & Access Control
- Respect PII rules: redact or mask sensitive fields unless the viewer has permission.
- Enforce row-level security: users only see events for resources they can access (RBAC/ACL enforcement in query layer).
- Log access to timeline data for auditability.

## Notifications & Actions
- Allow users to subscribe to activity feeds (resource-level or saved view) via in-app notifications, email, or webhooks.
- Provide quick actions in timeline entries: comment, create follow-up task, assign, open resource, or start a recount.
- Throttle notification volume and support digest preferences.

## Mobile Considerations
- Compact UI with collapsing groups and emphasis on most-relevant actions.
- Support deep links from notifications to open specific timeline entries in-app.
- Ensure timeline interactions are touch-friendly and offline-capable for recently cached events.

## API Design
- GET /api/timeline?resource_type=opname_session&resource_id=op_2026_06_08&cursor=...
- GET /api/timeline?actor=user_123&action_type=OPNAME_SUBMITTED
- POST /api/timeline/subscribe — create subscription for resource or saved view
- Webhook events: POST payloads for external integrations; include correlation_id and event metadata

API response shape (abbreviated):
- items: [{id, timestamp, actor, action_type, resource_type, resource_id, description, before, after, metadata}]
- next_cursor

## Security & Integrity
- Sign important events or store immutable references for compliance use-cases.
- Validate event producers (services) and authenticate webhook sources.
- Rate-limit timeline ingestion endpoints to prevent abuse.

## Monitoring & Operational Metrics
- Track timeline ingestion latency (action -> event visible to users)
- Monitor event counts per minute and top action types
- Alert on pipeline backpressure or failed deliveries to read-store

## UX Best Practices
- Always display actor name, role, and timestamp for context
- Show concise summaries with easy access to full details
- Use icons and colors conservatively — accessibility first
- Handle noisy high-volume events through grouping and summarization

## Version History
| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-08 | Initial activity timeline specification |
