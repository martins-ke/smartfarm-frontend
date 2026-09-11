# System Design and Architecture Document
## AgroSync Farm Management System
**Document Version:** 4.0  
**SDLC Stage:** Technical Architecture & Production Blueprint  
**Status:** Approved  

---

## 1. Executive Summary & Architectural Overview

**AgroSync** is built on a decoupled, cloud-native architecture combining a high-performance **Spring Boot 4 (Java 25)** micro-monolith backend with a reactive **React 19 (Vite)** single-page web client and MySQL relational database.

```mermaid
graph TD
    classDef client fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef server fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef db fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef ext fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#ffffff,font-weight:bold;

    Client["💻 React 19 Frontend Client<br/>(AgroSync PWA / Desktop Web)"]:::client
    API["⚡ Spring Boot 4 REST API<br/>(Port 8001 / Spring Security)"]:::server
    DB[("🗄️ MySQL Database<br/>(InnoDB Engine / smartfarm_db)")]:::db
    EmailService["✉️ Resend HTTP Mail API<br/>(Port 443 HTTPS / Password Resets)"]:::ext

    Client -->|HTTPS / JSON REST API| API
    Client -->|45s Background Polling| API
    API -->|JPA / Hibernate ORM| DB
    API -->|Async HTTPS HTTP Client| EmailService
```

---

## 2. C4 Container Diagram

```mermaid
C4Container
    title Container Diagram for AgroSync System

    Person(user, "Farm User", "Admin, Manager, or Field Supervisor")

    Container_Boundary(c1, "AgroSync Web Platform") {
        Container(spa, "Single-Page Application", "React 19, Vite, CSS Modules", "Provides modern UI, real-time TopBar notifications, task scheduling presets, 2-status project lifecycle, AP/AR installment audit modals, and paginated transaction history")
        Container(api, "API Application", "Java 25, Spring Boot 4, Spring Security", "Provides business logic, RBAC/PBAC access control, financial math, FIFO debt allocation, stock-controlled selling, and notification aggregation")
        ContainerDb(database, "Relational Database", "MySQL 8.0+", "Stores users, categories, projects, activities, sales, expenses, inventory, suppliers, customers, payments, and labor records")
    }

    System_Ext(email, "Resend Email Service", "Delivers password reset tokens and security alerts via HTTPS API")

    Rel(user, spa, "Interacts with UI via HTTPS", "Browser / Mobile")
    Rel(spa, api, "Makes API calls", "JSON/REST over HTTPS")
    Rel(api, database, "Reads and writes data", "JDBC / JPA")
    Rel(api, email, "Sends emails", "HTTPS REST API")
```

---

## 3. Comprehensive Entity-Relationship Data Model (ERD)

```mermaid
erDiagram
    USERS ||--o{ USER_CATEGORIES : assigned_to
    CATEGORIES ||--o{ USER_CATEGORIES : includes
    CATEGORIES ||--o{ PROJECTS : contains
    USERS ||--o{ PROJECTS : manages
    USERS ||--o{ PROJECTS : supervises
    
    PROJECTS ||--o{ ACTIVITIES : schedules
    PROJECTS ||--o{ EXPENSES : incurs
    PROJECTS ||--o{ HARVEST : produces
    PROJECTS ||--o{ SALES : generates
    PROJECTS ||--o{ INVENTORY_USAGE : consumes
    
    CUSTOMERS ||--o{ SALES : purchases
    CUSTOMERS ||--o{ CUSTOMER_PAYMENTS : remits
    SALES ||--o{ CUSTOMER_PAYMENTS : settled_by
    
    SUPPLIERS ||--o{ SUPPLIER_PURCHASES : bills
    SUPPLIERS ||--o{ SUPPLIER_PAYMENTS : paid_by
    SUPPLIER_PURCHASES ||--o{ SUPPLIER_PAYMENTS : settled_by
    
    INVENTORY_ITEMS ||--o{ INVENTORY_USAGE : items_used
    INVENTORY_ITEMS ||--o{ SUPPLIER_PURCHASES : restocked_by
    
    ACTIVITIES ||--o{ ACTIVITY_LABOR : allocates
    EMPLOYEES ||--o{ ACTIVITY_LABOR : assigned_worker
    
    USERS ||--o{ PASSWORD_RESET_TOKENS : requests

    USERS {
        string id PK
        string username UK
        string email UK
        string password
        string role
        string status
        int max_project_capacity
        string privileges
    }

    CATEGORIES {
        string id PK
        string name UK
        string description
    }

    PROJECTS {
        string id PK
        string name UK
        string season
        string status
        date start_date
        date end_date
        decimal budget
        string description
        string category_id FK
        string manager_id FK
        string supervisor_id FK
    }

    SALES {
        string id PK
        string item
        float quantity
        decimal unit_price
        date added_on
        decimal total_amount
        decimal amount_paid
        decimal balance_due
        string payment_mode
        string payment_status
        string project_id FK
        string customer_id FK
    }

    CUSTOMERS {
        string id PK
        string name
        string contact UK
        string id_number UK
        string address
        decimal credit_limit
        decimal total_purchases
        decimal total_paid
        decimal outstanding_debt
        string credit_status
        string category
    }

    CUSTOMER_PAYMENTS {
        string id PK
        string customer_id FK
        string sale_id FK
        decimal amount
        date payment_date
        string payment_mode
        string reference_number
        decimal balance_after
        string notes
    }

    SUPPLIERS {
        string id PK
        string name UK
        string contact_person
        string phone_number
        string email
        string id_or_tax_number
        string address
        string category
        decimal total_billed
        decimal total_paid
        decimal balance_owed
    }

    SUPPLIER_PURCHASES {
        string id PK
        string supplier_id FK
        string invoice_number
        decimal invoice_amount
        decimal amount_paid
        decimal balance_due
        string payment_status
        string inventory_item_id FK
        decimal restock_quantity
        date purchase_date
        string notes
    }

    SUPPLIER_PAYMENTS {
        string id PK
        string supplier_id FK
        string purchase_id FK
        decimal amount
        date payment_date
        string payment_mode
        string reference_number
        decimal balance_after
        string notes
    }

    INVENTORY_ITEMS {
        string id PK
        string name UK
        string category
        string unit
        decimal quantity_in_stock
        decimal unit_price
        decimal min_stock_level
    }

    INVENTORY_USAGE {
        string id PK
        string inventory_item_id FK
        string project_id FK
        decimal quantity_used
        date usage_date
        string notes
    }

    HARVEST {
        string id PK
        string item
        float quantity
        string units
        string notes
        date added_on
        string project_id FK
    }

    ACTIVITIES {
        string id PK
        string title
        string type
        string notes
        date scheduled_date
        date due_date
        string status
        string priority
        date completed_on
        string project_id FK
    }

    EMPLOYEES {
        string id PK
        string name
        string id_number UK
        string phone_number
        date date_of_birth
        string role
        decimal default_hourly_rate
    }

    ACTIVITY_LABOR {
        bigint id PK
        string activity_id FK
        string employee_id FK
        date assignment_date
        double hours_worked
        decimal wage_payable
        string notes
    }
```

---

## 4. Financial & Business Logic Engine

### 4.1 Cash Received vs Booked Revenue
The financial engine computes ground-truth liquid cash vs total booked revenue:
$$\text{Total Booked Sales} = \sum_{s \in \text{Sales}} s.\text{total\_amount}$$
$$\text{Pending Customer Debt (AR)} = \sum_{c \in \text{Customers}} c.\text{outstanding\_debt}$$
$$\text{Cash Received (In Account)} = \text{Total Booked Sales} - \text{Pending Customer Debt}$$

### 4.2 Accounts Receivable (AR) & Credit Rules
For any customer $C$:
$$C.\text{outstanding\_debt} = C.\text{total\_purchases} - C.\text{total\_paid}$$
$$\text{Credit Status} = \begin{cases} \text{CLEAR}, & \text{if } C.\text{outstanding\_debt} = 0 \\ \text{BLOCKED}, & \text{if } C.\text{credit\_limit} > 0 \text{ and } C.\text{outstanding\_debt} > C.\text{credit\_limit} \\ \text{HAS\_DEBT}, & \text{otherwise} \end{cases}$$

### 4.3 Accounts Payable (AP) & Supplier Liabilities
For any supplier $S$:
$$S.\text{balance\_owed} = S.\text{total\_billed} - S.\text{total\_paid}$$

### 4.4 Stock-Controlled Selling Validation
When a sale request $R$ is initiated for crop item $I$ in project $P$:
$$\text{Total Harvested} = \sum_{h \in P.\text{Harvest}, h.\text{item} = I} h.\text{quantity}$$
$$\text{Total Sold} = \sum_{s \in P.\text{Sales}, s.\text{item} = I} s.\text{quantity}$$
$$\text{Available Stock} = \max(0, \text{Total Harvested} - \text{Total Sold})$$
$$\text{Validation Rule: If } R.\text{quantity} > \text{Available Stock} \implies \text{Reject Sale (HTTP 400)}$$

### 4.5 FIFO Installment Payment Settlement Algorithm
When an unallocated general debt payment $A$ is submitted for customer $C$ (or supplier $S$):
```text
1. Fetch all unpaid/partial sales of customer sorted by added_on ASC (Oldest First).
2. Remaining Payment R = A
3. FOR EACH sale S IN unpaid_sales:
     IF R <= 0 THEN BREAK
     Available To Settle = S.balance_due
     Payment Allocated P = MIN(R, Available To Settle)
     S.amount_paid += P
     S.balance_due -= P
     IF S.balance_due == 0 THEN S.payment_status = "PAID_IN_FULL"
     ELSE S.payment_status = "PARTIAL_PAYMENT"
     Save S
     Log CustomerPayment Record (amount = P, balance_after = S.balance_due)
     R -= P
4. C.total_paid += A
5. C.outstanding_debt = C.total_purchases - C.total_paid
6. Update customer credit status (CLEAR / HAS_DEBT / BLOCKED)
```

---

## 5. Complete REST API Catalog

| Module | Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Public | Registers users (Auto-promotes 1st user to ADMIN). |
| | `POST` | `/auth/login` | Public | Authenticates credentials and returns user payload. |
| | `POST` | `/auth/forgot-password` | Public | Generates 15-min token and sends email via Resend API. |
| | `POST` | `/auth/reset-password` | Public | Validates token and resets user password. |
| **Projects** | `POST` | `/projects/create` | Admin / Manager | Creates new project with status `active` or `completed`. |
| | `GET` | `/projects/{category_id}/{category}` | All | Returns paginated projects scoped by user portfolio. |
| | `GET` | `/projects/{projectId}` | All | Returns full project details, tabs, and financial records. |
| | `PUT` | `/projects/{id}` | Admin / Manager | Updates project configuration, season, dates, and budget. |
| | `PATCH`| `/projects/{id}/status` | Admin / Manager / Sup | Toggles project status between `active` and `completed`. |
| **Activities**| `POST` | `/activities/record` | Admin / Mgr / Sup | Creates activity with agronomic preset or custom dates. |
| | `PATCH`| `/activities/{id}/status` | Admin / Mgr / Sup | Updates activity lifecycle status (`SCHEDULED`, `COMPLETED`, etc.). |
| | `POST` | `/activities/{id}/labor` | Admin / Mgr / Sup | Assigns verified employee labor and logs wage payables. |
| **Harvest** | `POST` | `/harvest/record` | Admin / Mgr / Sup | Logs crop or livestock yield volume. |
| **Sales** | `POST` | `/sales/record` | Admin / Mgr / Sup | Records farm-gate sale with stock verification & down-payment. |
| **Customers**| `GET` | `/customers` | All | Lists all customers with cumulative AR balances. |
| | `GET` | `/customers/{id}` | All | Returns customer profile and Accounts Receivable ledger. |
| | `GET` | `/customers/{id}/sales` | All | Returns paginated sales history for this customer. |
| | `GET` | `/customers/sales/{saleId}/payments`| All | Returns chronological installment audit trail for a sale. |
| | `POST` | `/customers/{id}/payments` | Admin / Mgr / Sup | Records installment payment (direct sale or FIFO). |
| **Suppliers**| `GET` | `/suppliers` | Admin / Manager | Lists suppliers with cumulative Accounts Payable balances. |
| | `GET` | `/suppliers/{id}` | Admin / Manager | Returns supplier profile and Accounts Payable ledger. |
| | `GET` | `/suppliers/{id}/purchases` | Admin / Manager | Returns purchase invoice and delivery audit trail. |
| | `GET` | `/suppliers/purchases/{purchaseId}/payments`| Admin / Manager | Returns chronological voucher payment audit trail. |
| | `POST` | `/suppliers/purchases` | Admin / Manager | Records purchase invoice with optional auto-restock. |
| | `POST` | `/suppliers/{id}/payments` | Admin / Manager | Records debt payment voucher (direct invoice or FIFO). |
| **Inventory**| `GET` | `/inventory` | All | Lists warehouse items with quantities and unit prices. |
| | `POST` | `/inventory/{id}/use` | Admin / Mgr / Sup | Deducts supplies consumed directly by a farm project. |
| **Dashboard**| `GET` | `/dashboard/summary` | Admin / Manager | Aggregates KPIs, Sector Donut, Project Donut, and charts. |
| | `GET` | `/dashboard/transactions`| Admin / Manager | Returns paginated unified transaction feed (5 per page). |
| | `GET` | `/supervisor/projects/{userId}`| Supervisor | Returns scoped supervisor field workspace. |
| **Notifs** | `GET` | `/notifications` | All | Aggregates real-time alerts across 4 categories. |

---

## 6. Security Architecture & Exception Handling

### 6.1 Stateless Header Authentication
- Requests transmit `X-User-Id` and `X-User-Role`.
- Spring Security filter chain validates credentials against database records on every request.
- Passwords stored as BCrypt hashes with salt.

### 6.2 Serialization Protection
- Bidirectional JPA relationships (`Sale` $\leftrightarrow$ `Project`, `Activity` $\leftrightarrow$ `Project`, `Harvest` $\leftrightarrow$ `Project`, `InventoryUsage` $\leftrightarrow$ `Project`, `ActivityLaborAssignment` $\leftrightarrow$ `Activity`) are annotated with `@JsonIgnore` on both fields and getters to prevent Jackson circular recursion and StackOverflow errors.

### 6.3 Global Error Handling
- `GlobalExceptionHandler` intercepts exceptions and formats unified HTTP JSON responses:
```json
{
  "body": null,
  "message": "Descriptive error message",
  "success": false,
  "time": "2026-09-11T08:45:00Z"
}
```
