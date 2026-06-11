# CV EPIC Warehouse - Documentation Master Index

**Document Version:** 2.0.0  
**Date:** 2026-06-10  
**Purpose:** Single source of truth for all project documentation

---

## 📋 DOCUMENTATION OVERVIEW

This document serves as the master index for all project documentation, providing a clear structure for navigation, categorization, and maintenance.

---

## 📁 DOCUMENT STRUCTURE

### PRIMARY DOCUMENTS

These are the authoritative source-of-truth documents for their respective domains. Reference these first when working on related tasks.

| Document | Category | Purpose | Last Updated |
|----------|----------|---------|--------------|
| [project-audit.md](project-audit.md) | **Architecture** | Comprehensive project analysis, technical debt, and recommendations | 2026-06-10 |
| [database-map.md](DATABASE_MAP.md) | **Database** | Complete database schema: 19 tables, PostgreSQL structure, and relationships | 2026-06-09 |
| [feature-map.md](feature-map.md) | **Features** | Complete feature inventory (50 features) with code locations and API mapping | 2026-06-08 |
| [page-map.md](page-map.md) | **Navigation** | Maps sidebar menus to pages, JavaScript files, and API endpoints | 2026-06-10 |
| [role-map.md](role-map.md) | **Roles** | Role mapping from legacy roles to target V4 roles | 2026-06-08 |
| [business-flow-v4.md](business-flow-v4.md) | **Business Flow** | Complete business workflow design for V4 implementation | 2026-06-10 |
| [navigation-v4.md](navigation-v4.md) | **Navigation** | Final navigation structure with 8 main menus and role-based access | 2026-06-10 |
| [ui-wireframe-v4.md](ui-wireframe-v4.md) | **UI/Design** | Desktop and mobile wireframes, component specifications | 2026-06-10 |
| [implementation-roadmap.md](implementation-roadmap.md) | **Roadmap** | 6-phase implementation plan with timeline and dependencies | 2026-06-10 |

---

### SUPPORTING DOCUMENTS

Reference documentation that provides detailed information for specific areas.

#### Architecture & Analysis

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [dependency-graph.md](dependency-graph.md) | Complete dependency flow from index.html to database | 2026-06-10 |
| [pre-implementation-validation.md](pre-implementation-validation.md) | Cross-validate V4 design against existing codebase | 2026-06-10 |
| [api-audit.md](api-audit.md) | API endpoint audit: methods, responses, authentication | 2026-06-08 |
| [database-audit.md](database-audit.md) | Detailed database structure analysis (PostgreSQL/Flask/MySQL) | 2026-06-08 |
| [ui-ux-audit.md](ui-ux-audit.md) | UI/UX issues: broken navigation, empty pages, confusing screens | 2026-06-10 |
| [role-system-audit.md](role-system-audit.md) | Existing roles, permissions, gaps, and recommendations | 2026-06-10 |

#### Design System

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [design-system.md](design-system.md) | Design tokens, typography, spacing, button and card components | 2026-06-08 |
| [responsive-strategy.md](responsive-strategy.md) | Responsive breakpoints for Desktop/Tablet/Mobile | 2026-06-08 |

#### Feature Specifications

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [activity-timeline.md](activity-timeline.md) | Activity Timeline feature specification | 2026-06-08 |
| [approval-workflow.md](approval-workflow.md) | Approval workflow: Approve/Reject/Recount actions | 2026-06-08 |
| [audit-workflow.md](audit-workflow.md) | Audit workflow and tracking model | 2026-06-08 |
| [opname-workflow.md](opname-workflow.md) | Stock Opname workflow specification | 2026-06-08 |
| [task-center.md](task-center.md) | Task Center design and lifecycle | 2026-06-08 |

#### UI Wireframes

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [admin-dashboard.md](admin-dashboard.md) | Admin Dashboard wireframe specification | 2026-06-08 |
| [operator-dashboard.md](operator-dashboard.md) | Operator Dashboard wireframe specification | 2026-06-08 |

#### Database Reference

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [PRODUCT_ANALYSIS.md](PRODUCT_ANALYSIS.md) | Product naming patterns and category/level structure | 2026-06-09 |

---

### ARCHIVED DOCUMENTS

Legacy documents kept for historical reference. Information has been incorporated into PRIMARY or SUPPORTING documents.

| Document | Reason for Archival | Archived Date |
|----------|--------------------|---------------|
| [archive/navigation-v2.md](archive/navigation-v2.md) | Superseded by navigation-v4.md | 2026-06-10 |
| [archive/repository-audit.md](archive/repository-audit.md) | Superseded by project-audit.md | 2026-06-10 |
| [archive/SPRINT1_AUDIT.md](archive/SPRINT1_AUDIT.md) | Sprint 1 audit completed | 2026-06-10 |
| [archive/SPRINT1_FIX_PLAN.md](archive/SPRINT1_FIX_PLAN.md) | Sprint 1 fixes implemented | 2026-06-10 |
| [archive/DATABASE_AUDIT_STATUS.md](archive/DATABASE_AUDIT_STATUS.md) | Audit completed, integrated into DATABASE_MAP.md | 2026-06-10 |
| [archive/REFACTOR_REPORT.md](archive/REFACTOR_REPORT.md) | Refactor completed | 2026-06-10 |
| [archive/documentation-architecture.md](archive/documentation-architecture.md) | Superseded by MASTER_INDEX.md | 2026-06-10 |

---

## 🎯 SINGLE SOURCE OF TRUTH MAPPING

| Domain | Primary Document | Supporting Documents |
|--------|------------------|---------------------|
| **Architecture** | project-audit.md | dependency-graph.md, pre-implementation-validation.md |
| **Database** | database-map.md | database-audit.md, PRODUCT_ANALYSIS.md |
| **Features** | feature-map.md | All feature specification docs |
| **Navigation** | navigation-v4.md | page-map.md |
| **Roles** | role-map.md | role-system-audit.md |
| **Business Flow** | business-flow-v4.md | — |
| **UI/Design** | ui-wireframe-v4.md | design-system.md, responsive-strategy.md, admin-dashboard.md, operator-dashboard.md |
| **Roadmap** | implementation-roadmap.md | pre-implementation-validation.md |

---

## 🔍 QUICK REFERENCE

### For New Developers

1. Start with [project-audit.md](project-audit.md) for project overview
2. Review [database-map.md](database-map.md) for data structure
3. Check [navigation-v4.md](navigation-v4.md) for navigation
4. Reference [design-system.md](design-system.md) for UI guidelines

### For Implementation

1. Use [implementation-roadmap.md](implementation-roadmap.md) for phases
2. Reference [pre-implementation-validation.md](pre-implementation-validation.md) for readiness
3. Check [page-map.md](page-map.md) for feature-to-page mapping

### For Debugging

1. Check [dependency-graph.md](dependency-graph.md) for code flow
2. Reference [api-audit.md](api-audit.md) for API endpoints
3. Review [database-audit.md](database-audit.md) for schema details

---

## 📊 DOCUMENT STATISTICS

| Category | Count |
|----------|-------|
| PRIMARY Documents | 9 |
| SUPPORTING Documents | 17 |
| ARCHIVED Documents | 7 |
| **Total** | **33** |

---

*Document version: 2.0.0*  
*Last updated: 2026-06-10*
