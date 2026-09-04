# Software Requirements Specification (SRS)
## SmartFarm Management Application
**Document Version:** 1.0  
**SDLC Stage:** Phase 1 — Requirements Specification  
**Status:** Approved Baseline  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document details the complete functional, non-functional, security, and architectural requirements for the **SmartFarm Management Application**. It serves as the authoritative single source of truth for engineering, testing, and continuous maintenance.

### 1.2 Scope of the System
SmartFarm is an enterprise-grade, zero-cost cloud farm management platform designed for agricultural enterprises. The application enables:
- Executive oversight and financial tracking by **Farm Administrators**.
- Sector-level resource management, project planning, and supervisor delegation by **Farm Managers**.
- Field-level yield, activity, and input tracking by **Field Supervisors** under strict financial privacy isolation.

### 1.3 Definitions, Acronyms, and Abbreviations
- **RBAC:** Role-Based Access Control.
- **PBAC:** Privilege/Policy-Based Access Control (fine-grained feature toggle permissions).
- **1:N:** One-to-Many entity relationship.
- **Zero-State Dashboard:** A tailored, clean UI rendered when an authenticated user has zero assigned projects/categories, suppressing empty graphs and displaying actionable next steps.
- **KPI:** Key Performance Indicator (Revenue, Yield, Expenses, Net Profit).

---

## 2. Overall Description

### 2.1 Product Perspective & User Personas
The system enforces a strict 3-tier organizational hierarchy:

```
                  ┌───────────────────────────────┐
                  │    👑 FARM ADMINISTRATOR      │
                  │  Global owner & executive     │
                  └──────────────┬────────────────┘
                                 │ Delegates Categories & Privileges
                                 ▼
                  ┌───────────────────────────────┐
                  │       👔 FARM MANAGER         │
                  │  Sector / Category overseer   │
                  └──────────────┬────────────────┘
                                 │ Delegates Projects & Privileges
                                 ▼
                  ┌───────────────────────────────┐
                  │     👷 FIELD SUPERVISOR       │
                  │  Operational field recorder   │
                  └───────────────────────────────┘
```

| Persona | Role Key | System Scope | Max Quota | Core Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Farm Administrator** | `ADMIN` | Entire Farm (Global) | 1 Account | User management, financial health, category assignment, manager privilege delegation, system configuration. |
| **Farm Manager** | `MANAGER` | Assigned Categories | Max 2 Accounts | Project planning, supervisor hiring & assignment, sector expense auditing, supervisor privilege delegation. |
| **Field Supervisor** | `SUPERVISOR` | Assigned Projects | Max 10 Accounts | Daily field logging (harvests, activities, stock consumption). **Zero access to sales revenue/budgets.** |

### 2.2 General Constraints
- **Dedicated Supervisor Model:** Supervisors are **not shared** across managers. A supervisor belongs to exactly one Manager (`manager_id`).
- **One-to-Many Project Assignment:** A supervisor can oversee multiple projects, but each project is assigned to at most one supervisor.
- **Financial Privacy Barrier:** Field supervisors are strictly prohibited from viewing total farm sales cash flow, project budgets, profit margins, or net values.
- **Zero-Cost Cloud Infrastructure:** Designed to run in production with high availability at $0/month (Vercel Frontend, Render Backend, Cloud MySQL/TiDB, Gmail SMTP).

---

## 3. Detailed Functional Requirements (FR)

### FR-1: Authentication, Account Provisioning & Password Recovery
- **FR-1.1:** System shall support authentication using either `Username` or `Email` combined with a password.
- **FR-1.2:** Unauthenticated users can request a password reset by providing their registered email address (`POST /users/forgot-password`).
- **FR-1.3:** If an email is not registered in the system, the API shall return HTTP 400 with: *"No account found with this email address. If you did not register an email, please contact your Farm Administrator to reset your password."*
- **FR-1.4:** If the email exists, the system generates a secure cryptographic token (`PasswordResetToken` valid for 1 hour) and sends an HTML reset email via SMTP.
- **FR-1.5:** Administrators and Managers can execute direct password resets for staff accounts via the User Management portal (`PATCH /users/{id}/admin-reset-password`).

### FR-2: Staff Quotas & Hierarchical Access Delegation (PBAC)
- **FR-2.1:** The system shall strictly enforce organizational staff limits: Max 1 Admin, Max 2 Managers, Max 10 Supervisors.
- **FR-2.2:** **Admin to Manager Delegation:**
  - Admin assigns one or more Farm Categories to a Manager.
  - Admin configures fine-grained privilege toggles for the Manager:
    - `CAN_CREATE_CATEGORIES`: Ability to create new farm sectors.
    - `CAN_CREATE_SUPERVISORS`: Ability to provision supervisor accounts.
    - `CAN_VIEW_FINANCIALS`: Ability to view profit/loss and revenue totals.
    - `CAN_MANAGE_BUDGETS`: Ability to set and modify project budgets.
- **FR-2.3:** **Manager to Supervisor Delegation:**
  - Manager provisions supervisors linked to their manager account ID (`manager_id`).
  - Manager assigns specific projects (within the Manager's categories) to the Supervisor.
  - Manager configures fine-grained privilege toggles for the Supervisor:
    - `CAN_RECORD_HARVEST`: Log harvest yield volumes and units.
    - `CAN_LOG_ACTIVITIES`: Submit field activity and labor logs.
    - `CAN_USE_INVENTORY`: Deduct fertilizer, feed, and tools from stock.
    - `CAN_RECORD_EXPENSES`: Log petty field cash expenses.
    - `CAN_RECORD_SALES`: Record immediate farm-gate sales without viewing global finances.

### FR-3: Workload & Capacity Validation Rules
- **FR-3.1 (Manager Workload):** When assigning a category to a Manager, the system shall evaluate existing assignments. If a manager exceeds 3 active categories, an advisory workload confirmation is triggered.
- **FR-3.2 (Supervisor Workload):** Each supervisor has a `max_project_capacity` (default 4 projects). The system blocks assigning additional active projects unless capacity is adjusted or existing projects are completed.

### FR-4: Category & Project Lifecycle Management
- **FR-4.1:** Projects must belong to an existing Category and possess a globally unique project name.
- **FR-4.2 (Date Validation Rule):** The system shall strictly validate that `startDate <= endDate`. If `startDate > endDate`, both backend and frontend reject the request with: *"Start date cannot be greater than end date!"*
- **FR-4.3 (Unique ID Generation):** Project, Category, and Transaction IDs are generated using an incremental collision-safe loop (`while (repo.existsById(id)) count++;`) preventing primary key collisions after deletions.

### FR-5: Operational Field Tracking (Harvest, Activity, Inventory)
- **FR-5.1:** Harvest records capture item name, numerical yield, unit of measurement (KG, Litres, Bags), date, and notes.
- **FR-5.2:** Activities capture activity title, type (Weeding, Irrigation, Spraying, Feeding), date, and notes.
- **FR-5.3:** Inventory tracks quantity in stock, unit prices, reorder levels, and records deduction history when consumed by projects.

### FR-6: Financial Governance & Sales Enforcement
- **FR-6.1 (Stock-Backed Sales Rule):** A project cannot record a sale exceeding its total recorded harvest yields minus previous sales.
- **FR-6.2 (Supervisor Financial Shield):** Supervisor API endpoints and dashboard views strip budget allocations, sales revenue, and profit calculations.

### FR-7: Dynamic Scoped Dashboards & Zero-State Engine
- **FR-7.1 (Admin Dashboard):** Renders enterprise-wide aggregates, category financial distribution, user quotas, and global cashflow.
- **FR-7.2 (Manager Dashboard):** Aggregates budget, project counts, and supervisor workloads strictly for the manager's assigned categories.
- **FR-7.3 (Supervisor Dashboard):** Aggregates harvest volumes, pending tasks, and recent logs strictly for assigned projects.
- **FR-7.4 (Zero-State Suppression):** If a user has 0 assigned categories or 0 assigned projects:
  - All metrics cards, financial figures, and graphs are **suppressed**.
  - Renders a dedicated **Action Hero Card** providing immediate contextual instructions (e.g., *"No categories assigned yet. Contact your Farm Administrator to get started."*).

### FR-8: User Deletion & Referential Integrity Safeguards
- **FR-8.1:** Admin accounts cannot be deleted (`isUserAdmin` protection).
- **FR-8.2:** Deleting a user safely cascades/unlinks child records: deletes active `PasswordResetToken` rows, clears category join tables, unlinks `supervisor_id` on projects, and clears `createdById` references.

---

## 4. Non-Functional Requirements (NFR)

- **NFR-1 (Security):** BCrypt password hashing ($cost = 10$), role-based endpoint security, parameter sanitization, and SQL injection prevention via Spring Data JPA.
- **NFR-2 (Performance):** Page load times $< 1.5s$ on broadband; database indexed on `username`, `email`, `category_id`, `supervisor_id`, `manager_id`.
- **NFR-3 (Reliability):** 99.9% uptime target backed by automated heartbeat monitoring (UptimeRobot).
- **NFR-4 (Cost):** 100% compliant with zero-cost cloud architecture limits (Render Free Web Service, Vercel Hobby, TiDB Cloud / Aiven Free Tier).
- **NFR-5 (Usability):** Typography optimized with `Inter` and `DM Sans`, accessible contrast ratios, and responsive mobile-first views.
