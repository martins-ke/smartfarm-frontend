# SmartFarm Complete System Flowcharts Specification
**Document Version:** 1.0  
**SDLC Stage:** Phase 2 — System Architecture & Workflow Flowcharts  
**Status:** Approved Reference  

---

## Table of Flowcharts
1. [User Authentication & Password Recovery Flow](#1-user-authentication--password-recovery-flow)
2. [Hierarchical Access Delegation & Capacity Verification](#2-hierarchical-access-delegation--capacity-verification)
3. [Category & Project Lifecycle (With Date & ID Guards)](#3-category--project-lifecycle-with-date--id-guards)
4. [Field Operations & Inventory Consumption Flow](#4-field-operations--inventory-consumption-flow)
5. [Financial Governance & Stock-Backed Sales Flow](#5-financial-governance--stock-backed-sales-flow)
6. [Dynamic Scoped Dashboard & Zero-State Engine](#6-dynamic-scoped-dashboard--zero-state-engine)
7. [Safe User Deletion & Cascade Unlinking Flow](#7-safe-user-deletion--cascade-unlinking-flow)

---

## 1. User Authentication & Password Recovery Flow

```mermaid
flowchart TD
    Start([User opens Login / Forgot Password]) --> Choice{Action?}
    
    %% Login Path
    Choice -- Login --> InputCreds[Enter Username/Email + Password]
    InputCreds --> VerifyDB{Check DB Record & Password}
    VerifyDB -- Invalid --> ErrLogin[Show: Invalid Credentials]
    VerifyDB -- Valid --> CheckStatus{Account Status?}
    CheckStatus -- DISABLED --> ErrDisabled[Show: Account Disabled - Contact Admin]
    CheckStatus -- PENDING --> ErrPending[Show: Awaiting Admin Approval]
    CheckStatus -- ACTIVE --> SuccessLogin[Generate Session & Load Scoped Dashboard]

    %% Self Password Reset Path
    Choice -- Forgot Password --> InputEmail[Enter Registered Email]
    InputEmail --> CheckEmailExists{Email in Database?}
    CheckEmailExists -- No --> ErrNoEmail[HTTP 400: No account found. Contact Farm Admin]
    CheckEmailExists -- Yes --> GenToken[Generate 1-Hour Cryptographic Token]
    GenToken --> SendMail[Send HTML Reset Email via Gmail SMTP]
    SendMail --> ClickLink[User clicks Email Link on Frontend]
    ClickLink --> InputNewPass[Enter New Password >= 6 chars]
    InputNewPass --> UpdatePass[Save BCrypt Hash & Invalidate Token]
    UpdatePass --> LoginRedirect[Redirect to Login with Success Banner]

    %% Admin/Manager Reset Path
    Choice -- Staff Admin Reset --> AdminModal[Admin/Manager opens User Management Reset Modal]
    AdminModal --> AdminInput[Enter New Temp Password]
    AdminInput --> DirectUpdate[Update BCrypt Hash directly in DB]
    DirectUpdate --> NotifyAdmin[Show: Password reset successfully]
```

---

## 2. Hierarchical Access Delegation & Capacity Verification

```mermaid
flowchart TD
    subgraph ADMIN_TIER["👑 Admin Level"]
        A1[Admin selects Farm Manager] --> A2[Select Farm Categories to Assign]
        A2 --> A3[Configure Manager Privileges: Create Categories, View Financials, etc.]
        A3 --> A4{Manager Category Count > 3?}
        A4 -- Yes --> A5[Display Workload Warning Alert]
        A4 -- No --> A6[Commit Categories & Privileges to Manager in DB]
        A5 --> A6
    end

    subgraph MANAGER_TIER["👔 Manager Level"]
        A6 --> M1[Manager selects / creates Field Supervisor]
        M1 --> M2[Supervisor permanently linked: manager_id = Manager.id]
        M2 --> M3[Select Project inside Manager's Assigned Categories]
        M3 --> M4[Configure Supervisor Privileges: Record Harvest, Log Activities, etc.]
        M4 --> M5{Supervisor Active Projects >= max_project_capacity?}
        M5 -- Yes --> M6[Block Assignment: Exceeds Workload Threshold]
        M5 -- No --> M7[Commit Project Assignment & Privileges in DB]
    end

    subgraph SUPERVISOR_TIER["👷 Supervisor Level"]
        M7 --> S1[Supervisor Logs In]
        S1 --> S2[Scoped strictly to assigned projects]
        S1 --> S3[Perform allowed operations: Harvest, Activities, Input Usage]
        S1 -.->|STRICTLY BLOCKED| S4[Revenue, Net Profit, Financial Totals]
    end
```

---

## 3. Category & Project Lifecycle (With Date & ID Guards)

```mermaid
flowchart TD
    StartProject([Create Project Form Submitted]) --> ValDates{startDate <= endDate?}
    
    ValDates -- No: startDate > endDate --> ErrDate[Block: Start date cannot be greater than end date!]
    
    ValDates -- Yes --> CheckName{Project Name Unique in DB?}
    CheckName -- Duplicate Name --> ErrName[HTTP 400: Project with this name already exists!]
    
    CheckName -- Unique Name --> GenID[IdGenarator: Generate ID with Prefix + Count]
    GenID --> CheckIDCol{projectRepo.existsById id ?}
    CheckIDCol -- Collides --> IncCount[count++ -> Regenerate ID]
    IncCount --> CheckIDCol
    
    CheckIDCol -- Unique ID --> SaveProj[Save Project to Database]
    SaveProj --> ToastSuccess[Show Green Toast: Project created successfully]
    ToastSuccess --> RedirectList[Redirect to Category Project List Page]
```

---

## 4. Field Operations & Inventory Consumption Flow

```mermaid
flowchart TD
    subgraph FIELD_ACTIVITY["📋 Activity Logging"]
        ActStart([Log Activity]) --> ActPriv{Has CAN_LOG_ACTIVITIES?}
        ActPriv -- No --> ActBlock[403 Forbidden]
        ActPriv -- Yes --> ActSave[Save Activity: Date, Title, Type, Project]
    end

    subgraph FIELD_HARVEST["🌾 Harvest Yield Recording"]
        HarvStart([Record Harvest Yield]) --> HarvPriv{Has CAN_RECORD_HARVEST?}
        HarvPriv -- No --> HarvBlock[403 Forbidden]
        HarvPriv -- Yes --> HarvSave[Save Harvest: Item, Quantity, Units, Project]
        HarvSave --> StockInc[Increment Project Available Harvest Quantity]
    end

    subgraph INVENTORY_USE["📦 Stock Consumption"]
        InvStart([Use Inventory Item]) --> InvPriv{Has CAN_USE_INVENTORY?}
        InvPriv -- No --> InvBlock[403 Forbidden]
        InvPriv -- Yes --> CheckStock{Stock >= Quantity Requested?}
        CheckStock -- Insufficient --> InvErr[HTTP 400: Not enough stock in inventory]
        CheckStock -- Sufficient --> DeductStock[Deduct quantity_in_stock & Record Usage Log]
    end
```

---

## 5. Financial Governance & Stock-Backed Sales Flow

```mermaid
flowchart TD
    SaleStart([Record Sale Request]) --> SalePriv{User Role == ADMIN/MANAGER OR Has CAN_RECORD_SALES?}
    SalePriv -- No --> SaleBlock[403 Forbidden: Not authorized to record sales]
    
    SalePriv -- Yes --> CalcStock[Calculate: totalHarvested - totalSold]
    CalcStock --> StockCheck{Available Stock >= Requested Quantity?}
    
    StockCheck -- No --> StockFail[HTTP 400: Cannot sell more than harvested quantity!]
    
    StockCheck -- Yes --> GenSaleID[Collision-free Sale ID Generation]
    GenSaleID --> SaveSale[Record Sale: Item, Qty, Unit Price, Total, Project]
    SaveSale --> UpdateLedger[Update Project Total Sales & Recalculate Net Profit]
    UpdateLedger --> SuccessSale[Return 201 Created: Sale recorded successfully]
```

---

## 6. Dynamic Scoped Dashboard & Zero-State Engine

```mermaid
flowchart TD
    DashStart([User opens Dashboard]) --> CheckRole{User Role?}

    %% Admin Path
    CheckRole -- ADMIN --> AdminDash[Fetch Global Enterprise Metrics]
    AdminDash --> RenderAdmin[Render Full Financial KPIs + All Categories + User Quotas + Donut Chart]

    %% Manager Path
    CheckRole -- MANAGER --> FetchMgrCats[Fetch Categories where manager in user_assigned_categories]
    FetchMgrCats --> HasCats{Assigned Categories > 0?}
    HasCats -- No --> MgrZero[SUPPRESS ALL STATS & CHARTS: Render 'No Categories Assigned' Hero Card]
    HasCats -- Yes --> MgrDash[Fetch Projects in Assigned Categories]
    MgrDash --> RenderMgr[Render Sector Budgets + Category Projects + Supervisor Workloads]

    %% Supervisor Path
    CheckRole -- SUPERVISOR --> FetchSupProjs[Fetch Projects where supervisor_id = user.id]
    FetchSupProjs --> HasProjs{Assigned Projects > 0?}
    HasProjs -- No --> SupZero[SUPPRESS ALL STATS & CHARTS: Render 'No Projects Assigned' Hero Card]
    HasProjs -- Yes --> SupDash[Fetch Yields, Tasks, and Activities for Assigned Projects]
    SupDash --> StripFin[STRIP ALL REVENUE, BUDGETS & PROFIT METRICS]
    StripFin --> RenderSup[Render Operational Yields, Activity Logs & Completion Progress]
```

---

## 7. Safe User Deletion & Cascade Unlinking Flow

```mermaid
flowchart TD
    DelStart([Admin / Manager triggers Delete User]) --> SelfCheck{Is User Deleting Own Account?}
    SelfCheck -- Yes --> BlockSelf[Block: Cannot delete your own active account!]
    
    SelfCheck -- No --> AdminCheck{Is Target User an ADMIN?}
    AdminCheck -- Yes --> BlockAdmin[Block: Cannot delete primary Farm Administrator!]
    
    AdminCheck -- No --> ConfirmModal[User confirms confirmation modal]
    ConfirmModal --> Step1[Step 1: Delete linked PasswordResetToken if exists]
    Step1 --> Step2[Step 2: Clear user_assigned_categories join table entries]
    Step2 --> Step3[Step 3: Unassign supervisor_id on supervised projects to NULL]
    Step3 --> Step4[Step 4: Clear createdById references on created staff]
    Step4 --> Step5[Step 5: Safely delete User entity from DB]
    Step5 --> Step6[Show Success Toast: User removed successfully]
    Step6 --> RefreshTable[Auto-refresh Staff Table]
```
