# SmartFarm Backend — Official SDLC Documentation & Specifications

Welcome to the official engineering and system architecture documentation for **SmartFarm Backend**.

---

## 📑 Available SDLC Documentation

| Document | Format | Description |
| :--- | :--- | :--- |
| **Software Requirements Specification (SRS)** | [📄 Download PDF](SmartFarm_SRS_Document.pdf) \| [📝 View Markdown](SRS_Document.md) | Phase 1 SDLC: Functional Requirements (FR-1 to FR-8), Non-Functional Requirements, PBAC Privilege Matrix, Security & Compliance. |
| **System Design & Architecture (SDD)** | [📄 Download PDF](SmartFarm_System_Design_and_Architecture.pdf) \| [📝 View Markdown](System_Design_and_Architecture.md) | Phase 2 SDLC: 3-Tier Layered Architecture, Entity-Relationship Diagram (ERD), Spring Boot REST API Contracts, Threat Modeling. |
| **Complete System Workflow Flowcharts** | [📄 Download PDF](SmartFarm_Complete_System_Flowcharts.pdf) \| [📝 View Markdown](SmartFarm_Complete_System_Flowcharts.md) | Phase 2 SDLC: 12 End-to-End Color-Coded Workflow Flowcharts covering all operational, financial, and access delegation lifecycles. |

---

## 🎨 System Flowcharts Index (12 Workflows)

1. **User Authentication, Login & Multi-Method Password Recovery Flow**
2. **Staff Provisioning, Role Quotas & Status Lifecycle Flow** (Max 1 Admin, Max 2 Managers, Max 10 Supervisors)
3. **Hierarchical Access Delegation & Capacity Verification Flow (Option B PBAC)**
4. **Category Lifecycle & Sector Management Flow**
5. **Project Planning & Lifecycle Management Flow** (Date Range Validation & ID Collision Prevention)
6. **Field Operations & Daily Activity Logging Flow**
7. **Harvest Yield Recording & Production Pool Flow**
8. **Inventory Stock Management & Project Usage Flow**
9. **Financial Accounting, Expense Tracking & Budget Auditing Flow**
10. **Financial Governance & Stock-Backed Sales Flow**
11. **Dynamic Scoped Dashboard & Zero-State Engine Flow**
12. **Safe User Deletion & Cascade Unlinking Flow**
