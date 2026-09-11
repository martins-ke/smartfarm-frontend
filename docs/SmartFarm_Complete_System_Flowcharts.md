# Complete System Flowcharts & Process Workflows
## AgroSync Farm Management System
**Document Version:** 4.0  
**SDLC Stage:** Operational Flowcharts & Workflow Specifications  
**Status:** Approved  

---

## 1. High-Level System Architecture & Component Interactions

```mermaid
flowchart TD
    classDef client fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef server fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef db fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef ext fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#ffffff,font-weight:bold;

    subgraph Presentation_Layer["Presentation Layer (Client Browser / Mobile)"]
        UI["💻 React 19 Single Page App<br/>(Vite / CSS Modules / Zustand / React Router)"]:::client
        TopBar["🔔 Real-Time TopBar & Notifications<br/>(45s Polling / Category Filter Tabs)"]:::client
        Audits["📜 Chronological Audit Modals<br/>(SaleHistoryModal & PurchaseHistoryModal)"]:::client
        Dashboards["📊 Unified & Supervisor Dashboards<br/>(Donut Charts / Paginated Ledger)"]:::client
    end

    subgraph Service_Layer["Application & Business Service Layer (Spring Boot 4)"]
        Security["🛡️ Security & RBAC Filter<br/>(X-User-Id / X-User-Role / BCrypt)"]:::server
        AuthService["🔑 Auth & User Service<br/>(Bootstrap Admin / Quota & Capacity Rules)"]:::server
        ProjectService["📁 Project & Sector Service<br/>(2-Status Active/Completed Lifecycle)"]:::server
        OpsService["🚜 Activities & Harvest Service<br/>(Agronomic Presets / Stock Validation)"]:::server
        TradeService["💳 Trade, AR & AP Service<br/>(FIFO Payment Settlement / Debt Engine)"]:::server
        DashService["📈 Dashboard Aggregator<br/>(Cash Received vs AR / Project Split)"]:::server
    end

    subgraph Persistence_Layer["Data & External Cloud Layer"]
        MySQL[("🗄️ MySQL 8.0 Relational DB<br/>(InnoDB / smartfarm_db)")]:::db
        Resend["✉️ Resend Cloud Mail API<br/>(Port 443 HTTPS / Token Password Reset)"]:::ext
    end

    UI -->|HTTPS REST API Calls| Security
    TopBar -->|Polling GET /notifications| Security
    Audits -->|Payment Audit GET/POST| Security
    Dashboards -->|KPI & Transaction GET| Security

    Security --> AuthService
    Security --> ProjectService
    Security --> OpsService
    Security --> TradeService
    Security --> DashService

    AuthService -->|Spring Data JPA| MySQL
    ProjectService -->|Spring Data JPA| MySQL
    OpsService -->|Spring Data JPA| MySQL
    TradeService -->|Spring Data JPA| MySQL
    DashService -->|Spring Data JPA| MySQL

    AuthService -->|Async HTTPS REST Client| Resend
```

---

## 2. Comprehensive Entity-Relationship Model (ERD)

```mermaid
erDiagram
    USERS ||--o{ CATEGORIES : manages
    CATEGORIES ||--o{ PROJECTS : contains
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
    
    INVENTORY_ITEMS ||--o{ INVENTORY_USAGE : supplies
    INVENTORY_ITEMS ||--o{ SUPPLIER_PURCHASES : restocked
    
    ACTIVITIES ||--o{ ACTIVITY_LABOR : allocates
    EMPLOYEES ||--o{ ACTIVITY_LABOR : assigned_worker

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
        decimal credit_limit
        decimal total_purchases
        decimal total_paid
        decimal outstanding_debt
        string credit_status
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
        decimal quantity_in_stock
        decimal min_stock_level
    }

    ACTIVITIES {
        string id PK
        string title
        string type
        date scheduled_date
        date due_date
        string status
        string priority
        string project_id FK
    }

    EMPLOYEES {
        string id PK
        string name
        string id_number UK
        date date_of_birth
        decimal default_hourly_rate
    }

    ACTIVITY_LABOR {
        bigint id PK
        string activity_id FK
        string employee_id FK
        double hours_worked
        decimal wage_payable
    }
```

---

## 3. User Registration, Bootstrap & Approval Lifecycle

```mermaid
flowchart TD
    Start([User visits /signup]) --> CheckDB{Does system have 0 users?}
    
    CheckDB -- Yes (First User) --> BootstrapMode[Set Mode = Primary Administrator Bootstrap]
    BootstrapMode --> FillAdminForm[Fill Username, Email, Password]
    FillAdminForm --> CheckAgree{Agree to System Administrator Governance?}
    CheckAgree -- No --> BlockSubmit[Disable Submit Button]
    CheckAgree -- Yes --> SubmitAdmin[Submit Registration POST /auth/register]
    SubmitAdmin --> CreateAdmin[Create User: Role=ADMIN, Status=ACTIVE]
    CreateAdmin --> AutoLogin[Auto-Login & Navigate to Command Center Dashboard]
    
    CheckDB -- No (Subsequent Users) --> RegularMode[Set Mode = Regular Account Registration]
    RegularMode --> FillRegForm[Fill Details + Select Role: Manager or Supervisor]
    FillRegForm --> CheckQuota{Role Quota Check:<br/>Managers <= 2, Supervisors <= 10?}
    CheckQuota -- Exceeded --> QuotaError[Display Quota Limit Error Banner]
    CheckQuota -- Available --> SubmitReg[Submit Registration POST /auth/register]
    SubmitReg --> CreatePending[Create User: Status=PENDING_APPROVAL]
    CreatePending --> ShowPendingBanner[Show 'Pending Admin Approval' Notice]
    ShowPendingBanner --> TriggerNotif[Trigger TopBar Notification for Administrators]
    
    TriggerNotif --> AdminReview{Admin/Manager Reviews in User Management}
    AdminReview -- Approve & Assign Roles/Sectors --> SetActive[Update User: Status=ACTIVE, assign Categories & Capacity]
    AdminReview -- Reject/Disable --> SetDisabled[Update User: Status=DISABLED]
```

---

## 4. Password Recovery & Resend Cloud API Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Farm User
    participant Frontend as React Frontend (/forgot-password)
    participant Backend as Spring Boot API (EmailService)
    participant DB as MySQL Database
    participant Resend as Resend Cloud Mail API (Port 443)
    actor Mailbox as User Inbox

    User->>Frontend: Enters registered email address & clicks "Send Reset Link"
    Frontend->>Backend: POST /auth/forgot-password { email }
    Backend->>DB: Query User by Email
    alt User Not Found
        Backend-->>Frontend: HTTP 404 (User with email not found)
        Frontend-->>User: Display error message
    else User Exists
        Backend->>Backend: Generate cryptographic token (UUID) + Set expiry = Now + 15 min
        Backend->>DB: Save PasswordResetToken record
        Backend->>Resend: HTTPS POST https://api.resend.com/emails (Bearer Token, Port 443)
        Resend->>Mailbox: Deliver formatted HTML password reset email
        Backend-->>Frontend: HTTP 200 { success: true, message: "Reset link sent" }
        Frontend-->>User: Show confirmation banner ("Check your email")
    end

    User->>Mailbox: Clicks "Reset Password" link (/reset-password?token=XYZ)
    User->>Frontend: Enters new password & confirms
    Frontend->>Backend: POST /auth/reset-password { token, newPassword }
    Backend->>DB: Validate Token & Expiry
    alt Token Invalid or Expired (> 15 mins)
        Backend-->>Frontend: HTTP 400 (Token expired or invalid)
        Frontend-->>User: Display "Reset link expired" error
    else Token Valid
        Backend->>Backend: Hash new password with BCrypt (strength 10)
        Backend->>DB: Update User.password & Delete used token
        Backend-->>Frontend: HTTP 200 { success: true, message: "Password updated" }
        Frontend-->>User: Redirect to /login with success notification
    end
```

---

## 5. Streamlined Project Lifecycle & Sector Delegation Flow (2-Status Model)

```mermaid
flowchart TD
    Start([Manager / Admin enters Category Page]) --> ClickCreate[Click '+ Create Project']
    
    ClickCreate --> CheckBudgetPrivilege{Has CAN_MANAGE_BUDGETS Privilege?}
    CheckBudgetPrivilege -- No --> DenyCreate[HTTP 403: Access Denied]
    CheckBudgetPrivilege -- Yes --> OpenForm[Open Project Creation Form]
    
    OpenForm --> FillProjectForm[Fill Project Name, Season, Start/End Dates, Budget, Description]
    FillProjectForm --> SelectStatus[Select Project Status: 'Active' or 'Completed']
    SelectStatus --> ValidateDates{Start Date <= End Date?}
    ValidateDates -- No --> DateError[Notify: Start date cannot be after end date]
    ValidateDates -- Yes --> CheckNameUnique{Project Name Unique?}
    CheckNameUnique -- Duplicate --> NameError[Notify: Project name already exists]
    CheckNameUnique -- Unique --> SubmitProject[POST /projects/create]
    
    SubmitProject --> SaveProject[Project Created in MySQL with Status = 'active' or 'completed']
    SaveProject --> AssignSupervisor{Assign Supervisor?}
    AssignSupervisor -- Yes --> CheckCapacity{Supervisor Active Projects < Capacity (default 4)?}
    CheckCapacity -- Full --> CapacityAlert[Display Capacity Limit Warning]
    CheckCapacity -- OK --> LinkSupervisor[Attach supervisor_id to project]
    
    LinkSupervisor --> ProjectDashboard[Project Dashboard Activated]
    
    ProjectDashboard --> StatusToggle{Project Status Action}
    StatusToggle -- Switch to Completed --> SetCompleted[PATCH /projects/id/status -> 'completed']
    StatusToggle -- Reopen to Active --> SetActive[PATCH /projects/id/status -> 'active']
    SetCompleted --> UpdateDonut[Project Status Donut Chart updates immediately]
    SetActive --> UpdateDonut
```

---

## 6. Field Activity Scheduling, Agronomic Presets & Labor Allocation Flow

```mermaid
flowchart TD
    OpenActivities([Supervisor opens Activities Tab]) --> ActionSelect{Action Choice}
    
    ActionSelect -- Click Agronomic Preset --> PresetChoice{Select Agronomic Preset}
    PresetChoice -- '+2 Wks (Spraying)' --> Set14[Set Date=Today+14d, Priority=HIGH, Type='Field Care']
    PresetChoice -- '+3 Wks (Weeding)' --> Set21[Set Date=Today+21d, Priority=MEDIUM, Type='Field Care']
    PresetChoice -- '+4 Wks (Top-Dressing)' --> Set28[Set Date=Today+28d, Priority=HIGH, Type='Fertilization']
    PresetChoice -- '+2 Mos (Harvesting)' --> Set60[Set Date=Today+60d, Priority=URGENT, Type='Harvesting']
    
    ActionSelect -- Custom Task --> CustomForm[Manually select title, scheduled date, due date, priority]
    
    Set14 --> SaveActivity[Submit POST /activities/record]
    Set21 --> SaveActivity
    Set28 --> SaveActivity
    Set60 --> SaveActivity
    CustomForm --> SaveActivity
    
    SaveActivity --> ActivityCreated[Activity created with Status='SCHEDULED']
    ActivityCreated --> RenderBadges[Renders in Feed with Dynamic Badges: 'Due Today', 'Overdue by X days', etc.]
    
    RenderBadges --> TaskAction{Task Execution}
    TaskAction -- Mark Done --> ToggleStatus[PATCH /activities/id/status -> 'COMPLETED']
    
    TaskAction -- Allocate Labor --> OpenLaborModal[Open ActivityLaborModal]
    OpenLaborModal --> SelectEmployee[Select Employee from Registry]
    SelectEmployee --> ValidateAge{Age >= 18 Years?}
    ValidateAge -- No --> RejectWorker[Block Selection: Legal Age Requirement Violation]
    ValidateAge -- Yes --> InputHours[Input Hours Worked & Hourly Wage Rate]
    InputHours --> CalcWage[Calculate Wage Payable = Hours * Rate]
    CalcWage --> SaveLabor[POST /activities/id/labor]
    SaveLabor --> UpdatePayable[Wage logged to Employee Payable Records]
```

---

## 7. Harvest Logging, Warehouse Inventory Usage & Stock-Controlled Selling

```mermaid
flowchart TD
    subgraph Harvest_Intake["1. Harvest Intake"]
        LogHarvest([Harvest Collected]) --> EnterYield[Enter Crop Item, Quantity, Unit & Notes]
        EnterYield --> SaveHarvest[POST /harvest/record]
        SaveHarvest --> IncHarvestStock[Project Cumulative Harvest Stock Incremented]
    end

    subgraph Inventory_Supplies["2. Warehouse Supplies Consumption"]
        UseSupply([Project Consumes Fertilizer/Chemicals]) --> SelectInvItem[Select Inventory Item from Warehouse]
        SelectInvItem --> EnterQtyUsed[Enter Quantity Used & Notes]
        EnterQtyUsed --> DeductStock[POST /inventory/id/use]
        DeductStock --> UpdateWarehouse[Warehouse stock_quantity decremented]
        UpdateWarehouse --> CheckReorder{Stock <= min_stock_level?}
        CheckReorder -- Yes --> TriggerLowStockAlert[Trigger Low Stock Dashboard & Notification Alert]
    end

    subgraph FarmGate_Sales["3. Stock-Controlled Farm-Gate Sales"]
        RecordSaleReq([Customer Buys Produce]) --> SelectProduce[Select Produce Item & Quantity]
        SelectProduce --> CheckAvailStock{Quantity <= (Harvested - Sold)?}
        CheckAvailStock -- No (Insufficient Stock) --> RejectSale[HTTP 400: Cannot sell more than harvested stock]
        CheckAvailStock -- Yes (Stock Available) --> CheckPaymentAmount{Amount Paid < Total Amount?}
        
        CheckPaymentAmount -- Yes (Credit / Partial) --> EnforceCustomer[Require Registered Customer Attachment]
        EnforceCustomer --> CheckCreditLimit{Customer Debt + Balance Due > Credit Limit?}
        CheckCreditLimit -- Yes --> BlockCreditSale[HTTP 400: Customer Credit BLOCKED]
        CheckCreditLimit -- No --> SaveSaleWithDebt[Save Sale: Status='PARTIAL_PAYMENT' or 'CREDIT_UNPAID']
        SaveSaleWithDebt --> AutoLogDownPayment[Log Down-Payment as 1st Entry in CustomerPayment]
        SaveSaleWithDebt --> IncCustomerDebt[Increment Customer.outstandingDebt by Balance Due]
        
        CheckPaymentAmount -- No (Full Payment) --> SaveFullSale[Save Sale: Status='PAID_IN_FULL']
        SaveFullSale --> LogFullPayment[Log Full Payment in CustomerPayment]
        
        SaveSaleWithDebt --> DeductProduceStock[Deduct Sold Volume from Project Available Harvest]
        SaveFullSale --> DeductProduceStock
    end
```

---

## 8. Customer Accounts Receivable, Credit & Installment Audit History Flow

```mermaid
flowchart TD
    StartCust([User navigates to Customer Details Page]) --> ViewLedger[View Accounts Receivable Ledger: Total Billed, Total Paid, Outstanding Debt]
    
    ViewLedger --> ViewSalesTable[View Paginated Customer Sales Table]
    ViewSalesTable --> ClickAudit[Click '<FaHistory /> Audit' Button on any Sale Row]
    
    ClickAudit --> OpenAuditModal[Open SaleHistoryModal]
    OpenAuditModal --> FetchAuditHistory[GET /customers/sales/saleId/payments]
    FetchAuditHistory --> DisplayAudit[Render Invoice Breakdown Grid + Chronological Payment Log Table]
    
    DisplayAudit --> UserPaymentAction{User Payment Action}
    
    UserPaymentAction -- Settle Specific Sale --> ClickPaySale[Click 'Pay Towards This Sale']
    ClickPaySale --> TargetModal[Open Payment Modal pre-filled with saleId & balanceDue]
    
    UserPaymentAction -- General Settle Debt --> ClickSettleDebt[Click 'Settle Debt' on Top Header]
    ClickSettleDebt --> OpenGeneralModal[Open Payment Modal without saleId]
    
    TargetModal --> EnterPayment[Enter Amount, Payment Mode: MPESA/BANK/CASH, Reference Code & Notes]
    OpenGeneralModal --> EnterPayment
    
    EnterPayment --> SubmitPayment[POST /customers/id/payments]
    
    SubmitPayment --> AllocationEngine{Is specific saleId provided?}
    AllocationEngine -- Yes (Targeted) --> ApplyToSale[Credit payment directly to target sale, reduce balanceDue, log CustomerPayment]
    AllocationEngine -- No (General) --> ApplyFIFO[Apply payment in FIFO order across oldest unpaid sales, log CustomerPayment for each]
    
    ApplyToSale --> RecalcCustomerAR[Recalculate Customer: totalPaid += amount, outstandingDebt = totalPurchases - totalPaid]
    ApplyFIFO --> RecalcCustomerAR
    RecalcCustomerAR --> UpdateStatusBadge[Update Status: CLEAR if debt=0, else HAS_DEBT / BLOCKED]
    UpdateStatusBadge --> LiveRefresh[Modal & Page refresh instantly with updated audit logs]
```

---

## 9. Supplier Purchase Invoices, Warehouse Auto-Restock & AP Voucher Settlement Flow

```mermaid
flowchart TD
    StartSup([User navigates to Supplier Details Page]) --> ViewAPLedger[View Accounts Payable Ledger: Total Purchases Billed, Total Paid, Balance Owed]
    
    ViewAPLedger --> ActionChoice{Supplier Action}
    
    ActionChoice -- Record New Purchase Invoice --> ClickRecordInv[Click 'Record Invoice']
    ClickRecordInv --> FillInvoiceForm[Fill Invoice Number, Total Amount, Amount Paid Now, Delivery Notes]
    FillInvoiceForm --> CheckRestockLink{Link to Warehouse Inventory Item?}
    CheckRestockLink -- Yes --> EnterRestockQty[Select Inventory Item & Enter Restock Quantity Added]
    CheckRestockLink -- No --> SkipRestock[No warehouse restock linked]
    
    EnterRestockQty --> SubmitPurchase[POST /suppliers/purchases]
    SkipRestock --> SubmitPurchase
    
    SubmitPurchase --> SavePurchaseOrder[Save SupplierPurchase Record]
    SavePurchaseOrder --> AutoIncrementStock[Increment linked Warehouse inventory item stock_quantity]
    SavePurchaseOrder --> AutoLogInitialVoucher[Log Amount Paid Now as opening voucher in SupplierPayment]
    SavePurchaseOrder --> UpdateAPBalance[Increment Supplier.balanceOwed by Balance Due]
    
    ActionChoice -- View Voucher Audit Trail --> ClickPurchaseAudit[Click '<FaHistory /> Audit' on Purchase Row]
    ClickPurchaseAudit --> OpenPurchaseModal[Open PurchaseHistoryModal]
    OpenPurchaseModal --> FetchPurchasePayments[GET /suppliers/purchases/purchaseId/payments]
    FetchPurchasePayments --> RenderVoucherTimeline[Render Total Invoice, Total Paid, Balance Due & Chronological Vouchers]
    
    RenderVoucherTimeline --> PayVoucherAction{Pay Action}
    PayVoucherAction -- Settle Specific Invoice --> TargetPurchase[Open Payment Modal pre-filled with purchaseId]
    PayVoucherAction -- Settle General Supplier AP --> GeneralAPModal[Open Payment Modal for Supplier]
    
    TargetPurchase --> EnterVoucherDetails[Enter Amount, Mode: MPESA/BANK/CHEQUE/CASH, Reference & Notes]
    GeneralAPModal --> EnterVoucherDetails
    
    EnterVoucherDetails --> SubmitVoucher[POST /suppliers/id/payments]
    SubmitVoucher --> APAllocation{Is purchaseId provided?}
    APAllocation -- Yes (Targeted) --> CreditPurchase[Credit voucher to specific purchase, reduce balanceDue, log SupplierPayment]
    APAllocation -- No (FIFO) --> ApplyAPFIFO[Apply voucher in FIFO order across oldest unpaid purchases, log SupplierPayment]
    
    CreditPurchase --> RecalcSupplierAP[Recalculate Supplier: totalPaid += amount, balanceOwed = totalBilled - totalPaid]
    ApplyAPFIFO --> RecalcSupplierAP
    RecalcSupplierAP --> LiveAPRefresh[Purchase orders and AP ledger update in real-time]
```

---

## 10. Executive Dashboard Financial KPI Engine & Paginated Transactions Feed Flow

```mermaid
flowchart TD
    MountDashboard([User loads Command Center Dashboard]) --> FetchSummary[GET /dashboard/summary]
    
    FetchSummary --> CalcFinancialKPIs[Compute Ground-Truth Financial Metrics: Total Booked Sales, Customer Debts AR, Cash Received In Account]
    CalcFinancialKPIs --> RenderKPICards[Render Top KPI Metric Cards]
    RenderKPICards --> CheckDebtForButton{Customer Debts > 0?}
    CheckDebtForButton -- Yes --> ShowDebtViewBtn[Render 'View ->' button navigating to /customers]
    CheckDebtForButton -- No --> HideDebtViewBtn[Hide 'View ->' button]
    
    FetchSummary --> AggregateDonuts[Aggregate Donut Chart Data]
    AggregateDonuts --> RenderSectorDonut[Render Revenue By Sector Donut Chart]
    AggregateDonuts --> RenderProjectDonut[Render Project Status Donut Chart: Active in Green vs Completed in Blue with Base Track Ring]
    
    MountDashboard --> FetchTxFeed[GET /dashboard/transactions?page=1&size=5&filter=ALL]
    FetchTxFeed --> IngestTransactions[Ingest Sales Inflows & Supplies Outflows sorted by date descending]
    
    IngestTransactions --> UserLedgerAction{User Interaction on Transaction Ledger}
    UserLedgerAction -- Filter (ALL / SALES / SUPPLIES) --> ApplyFilter[Refetch GET /dashboard/transactions with filter & reset page=1]
    UserLedgerAction -- Search Query --> ApplySearch[Refetch GET /dashboard/transactions with search & reset page=1]
    UserLedgerAction -- Pagination (Next / Prev / Page Num) --> ChangePage[Refetch GET /dashboard/transactions with page=targetPage]
    
    ApplyFilter --> IngestTransactions
    ApplySearch --> IngestTransactions
    ChangePage --> IngestTransactions
```
