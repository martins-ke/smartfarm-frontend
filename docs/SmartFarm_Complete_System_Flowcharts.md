# SmartFarm Complete System Flowcharts Specification
**Document Version:** 1.0  
**SDLC Stage:** Phase 2 — System Architecture & Workflow Flowcharts  
**Status:** Approved Reference  

---

## 1. User Authentication, Login & Multi-Method Password Recovery Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    Start([User opens Login / Forgot Password]):::startNode --> Choice{Select Action?}:::decisionNode
    
    Choice -- 1. Login --> InputCreds[Enter Username/Email + Password]:::actionNode
    InputCreds --> VerifyDB{Verify Credentials in Database}:::decisionNode
    VerifyDB -- Invalid --> ErrLogin[Show Error: Invalid Credentials]:::errorNode
    VerifyDB -- Valid --> CheckStatus{Account Status?}:::decisionNode
    CheckStatus -- DISABLED --> ErrDisabled[Account Disabled: Contact Farm Admin]:::errorNode
    CheckStatus -- PENDING --> ErrPending[Account Awaiting Admin Approval]:::errorNode
    CheckStatus -- ACTIVE --> SuccessLogin[Authenticated: Generate Session & Load Scoped Dashboard]:::successNode

    Choice -- 2. Self Password Reset --> InputEmail[Enter Registered Email]:::actionNode
    InputEmail --> CheckEmailExists{Email Exists in DB?}:::decisionNode
    CheckEmailExists -- No --> ErrNoEmail[HTTP 400: No account found with this email. Contact Administrator]:::errorNode
    CheckEmailExists -- Yes --> GenToken[Generate 1-Hour Cryptographic Token]:::actionNode
    GenToken --> SendMail[Send HTML Reset Email via Gmail SMTP]:::actionNode
    SendMail --> ClickLink[User clicks Secure Link on Frontend]:::actionNode
    ClickLink --> InputNewPass[Enter New Secure Password]:::actionNode
    InputNewPass --> UpdatePass[Save BCrypt Hash & Invalidate Token]:::successNode
    UpdatePass --> LoginRedirect[Redirect to Login with Success Toast]:::successNode

    Choice -- 3. Staff Admin Direct Reset --> AdminModal[Admin/Manager opens User Reset Modal]:::actionNode
    AdminModal --> AdminInput[Enter Temporary Password]:::actionNode
    AdminInput --> DirectUpdate[Update BCrypt Hash directly in DB]:::successNode
    DirectUpdate --> NotifyAdmin[Display Success Toast Notification]:::successNode
```

---

## 2. Staff Provisioning, Quota Limits & Status Lifecycle Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef adminNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef managerNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    ProvStart([Provision Staff Member]):::startNode --> CheckCreatorRole{Creator Role?}:::decisionNode
    
    CheckCreatorRole -- ADMIN --> AdminSelectRole{Select Target Role}:::decisionNode
    AdminSelectRole -- MANAGER --> CheckMgrQuota{Current Managers >= 2?}:::decisionNode
    CheckMgrQuota -- Yes --> BlockMgr[HTTP 400: Maximum Manager limit reached (Max 2)]:::errorNode
    CheckMgrQuota -- No --> InputStaffData[Enter Name, Username, Email, Password]:::actionNode
    
    AdminSelectRole -- SUPERVISOR --> CheckSupQuota1{Current Supervisors >= 10?}:::decisionNode
    CheckSupQuota1 -- Yes --> BlockSup1[HTTP 400: Maximum Supervisor limit reached (Max 10)]:::errorNode
    CheckSupQuota1 -- No --> InputStaffData

    CheckCreatorRole -- MANAGER --> CheckMgrPriv{Has CAN_CREATE_SUPERVISORS?}:::decisionNode
    CheckMgrPriv -- No --> BlockMgrPriv[403 Forbidden: Manager not authorized to create supervisors]:::errorNode
    CheckMgrPriv -- Yes --> CheckSupQuota2{Current Supervisors >= 10?}:::decisionNode
    CheckSupQuota2 -- Yes --> BlockSup2[HTTP 400: Maximum Supervisor limit reached (Max 10)]:::errorNode
    CheckSupQuota2 -- No --> SetMgrParent[Auto-link manager_id = currentManager.id]:::actionNode
    SetMgrParent --> InputStaffData

    InputStaffData --> ValUnique{Username / Email Unique?}:::decisionNode
    ValUnique -- Duplicate --> ErrDup[HTTP 400: Username or Email already in use]:::errorNode
    ValUnique -- Unique --> HashPass[Hash Password with BCrypt cost=10]:::actionNode
    HashPass --> SetInitialStatus{Creator is Admin?}:::decisionNode
    SetInitialStatus -- Yes --> SetActive[Set status = ACTIVE]:::successNode
    SetInitialStatus -- No / Self-Signup --> SetPending[Set status = PENDING_APPROVAL]:::actionNode
    SetActive --> SaveUser[Save User Entity in Database]:::successNode
    SetPending --> SaveUser
    SaveUser --> SuccessToast[Show Success Toast Notification]:::successNode
```

---

## 3. Hierarchical Access Delegation & Capacity Verification Flow (Option B PBAC)

```mermaid
flowchart TD
    classDef adminNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef managerNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef supervisorNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;

    subgraph ADMIN_TIER["👑 Farm Administrator Level"]
        A1[Select Farm Manager]:::adminNode --> A2[Assign Farm Categories]:::adminNode
        A2 --> A3[Configure Manager Privileges: Create Categories, View Financials, Manage Budgets]:::adminNode
        A3 --> A4{Manager Category Count > 3?}:::decisionNode
        A4 -- Yes --> A5[Display Workload Capacity Alert: Manager handling > 3 sectors]:::errorNode
        A4 -- No --> A6[Save Categories & Privileges in DB]:::adminNode
        A5 --> A6
    end

    subgraph MANAGER_TIER["👔 Farm Manager Level"]
        A6 --> M1[Select Dedicated Field Supervisor]:::managerNode
        M1 --> M2[Verify Dedicated Link: manager_id == Manager.id]:::managerNode
        M2 --> M3[Select Project within Manager's Assigned Categories]:::managerNode
        M3 --> M4[Configure Supervisor Privileges: Harvest, Activities, Stock, Expenses]:::managerNode
        M4 --> M5{Supervisor Active Projects >= max_project_capacity?}:::decisionNode
        M5 -- Yes --> M6[Block Assignment: Exceeds Maximum Supervisor Capacity]:::errorNode
        M5 -- No --> M7[Save Project Assignment & Privileges in DB]:::managerNode
    end

    subgraph SUPERVISOR_TIER["👷 Field Supervisor Level"]
        M7 --> S1[Supervisor Logs In]:::supervisorNode
        S1 --> S2[Dashboard Scoped Strictly to Assigned Projects]:::supervisorNode
        S1 --> S3[Execute Authorized Operations: Harvest Yields, Daily Logs, Stock Deductions]:::supervisorNode
        S1 -.->|STRICTLY SHIELDED & BLOCKED| S4[Total Farm Revenue, Profit Margins & Sector Budgets]:::errorNode
    end
```

---

## 4. Category Lifecycle & Sector Management Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    CatAction([Category Action Requested]):::startNode --> ActionType{Action Type?}:::decisionNode

    ActionType -- 1. Create Category --> AuthCheck{Is Admin OR Manager with CAN_CREATE_CATEGORIES?}:::decisionNode
    AuthCheck -- No --> BlockCreate[403 Forbidden: Not authorized to create categories]:::errorNode
    AuthCheck -- Yes --> InputCat[Enter Category Name & Description]:::actionNode
    InputCat --> CheckCatName{Category Name Unique in DB?}:::decisionNode
    CheckCatName -- Duplicate --> ErrCatName[HTTP 400: Category with this name already exists]:::errorNode
    CheckCatName -- Unique --> GenCatID[Generate ID with Collision Guard Loop]:::actionNode
    GenCatID --> SaveCat[Save Category Entity to DB]:::successNode
    SaveCat --> ToastCatSuccess[Show Green Toast: Category created successfully]:::successNode

    ActionType -- 2. Edit Category --> AuthEdit{Is Admin?}:::decisionNode
    AuthEdit -- No --> BlockEdit[403 Forbidden: Only Admin can edit category properties]:::errorNode
    AuthEdit -- Yes --> UpdateCat[Update Category Name & Description in DB]:::successNode
    UpdateCat --> ToastEditSuccess[Show Green Toast: Category updated]:::successNode

    ActionType -- 3. Delete Category --> AuthDel{Is Admin?}:::decisionNode
    AuthDel -- No --> BlockDel[403 Forbidden: Only Admin can delete categories]:::errorNode
    AuthDel -- Yes --> CheckProjectsExist{Category contains active projects?}:::decisionNode
    CheckProjectsExist -- Yes --> ErrHasProj[HTTP 400: Cannot delete category containing active projects]:::errorNode
    CheckProjectsExist -- No --> UnlinkCatMgrs[Remove category from user_assigned_categories join table]:::actionNode
    UnlinkCatMgrs --> DeleteCatDB[Delete Category Entity from DB]:::successNode
    DeleteCatDB --> ToastDelSuccess[Show Green Toast: Category deleted successfully]:::successNode
```

---

## 5. Project Planning & Lifecycle Management Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    StartProject([Create Project Form Submitted]):::startNode --> ValDates{Check: startDate <= endDate?}:::decisionNode
    
    ValDates -- No: Invalid Date Range --> ErrDate[Block: Start date cannot be greater than end date!]:::errorNode
    
    ValDates -- Yes: Valid Date Range --> CheckName{Project Name Unique in DB?}:::decisionNode
    CheckName -- Duplicate Name Found --> ErrName[HTTP 400: A project with this name already exists!]:::errorNode
    
    CheckName -- Name is Unique --> GenID[IdGenarator: Generate ID with Category Prefix + Count]:::actionNode
    GenID --> CheckIDCol{"projectRepo.existsById(id)?"}:::decisionNode
    CheckIDCol -- ID Collides --> IncCount[Increment count++ and Regenerate ID]:::actionNode
    IncCount --> CheckIDCol
    
    CheckIDCol -- ID is Unique --> CheckCategory{Category Exists in DB?}:::decisionNode
    CheckCategory -- No --> ErrCat[HTTP 404: Category not found]:::errorNode
    CheckCategory -- Yes --> SaveProj[Save Project: Status = active, Budget, Supervisor]:::successNode
    SaveProj --> ToastSuccess[Show Green Toast: Project created successfully]:::successNode
    ToastSuccess --> RedirectList[Redirect to Category Projects Page]:::successNode
```

---

## 6. Field Operations & Daily Activity Logging Flow

```mermaid
flowchart TD
    classDef startNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    ActStart([Supervisor submits Daily Activity]):::startNode --> ActAuth{User is Admin/Manager OR Has CAN_LOG_ACTIVITIES?}:::decisionNode
    ActAuth -- No --> ActBlock[403 Forbidden: Activity logging privilege is disabled]:::errorNode
    
    ActAuth -- Yes --> CheckProjAssignment{Project assigned to this Supervisor?}:::decisionNode
    CheckProjAssignment -- No (Other Supervisor) --> BlockScope[403 Forbidden: Cannot log activities for unassigned project]:::errorNode
    CheckProjAssignment -- Yes --> ValFields{Validate: Title, Type, Date provided?}:::decisionNode
    ValFields -- Missing Fields --> ErrFields[HTTP 400: Missing mandatory activity details]:::errorNode
    
    ValFields -- Valid Fields --> GenActID[Generate Collision-Safe Activity ID]:::actionNode
    GenActID --> SaveAct[Save Activity: Weeding / Irrigation / Spraying / Feeding]:::successNode
    SaveAct --> UpdateProjLog[Update Project Recent Activity Timeline]:::successNode
    UpdateProjLog --> ToastActSuccess[Display Green Toast: Activity logged successfully]:::successNode
```

---

## 7. Harvest Yield Recording & Production Pool Flow

```mermaid
flowchart TD
    classDef startNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    HarvStart([Record Harvest Yield Request]):::startNode --> HarvAuth{Has CAN_RECORD_HARVEST or Admin/Manager?}:::decisionNode
    HarvAuth -- No --> HarvBlock[403 Forbidden: Harvest recording privilege disabled]:::errorNode
    
    HarvAuth -- Yes --> ValYield{Check: Quantity > 0 and Unit Selected?}:::decisionNode
    ValYield -- No --> ErrYield[HTTP 400: Harvest quantity must be greater than 0]:::errorNode
    
    ValYield -- Yes --> GenHarvID[Generate Collision-Safe Harvest ID]:::actionNode
    GenHarvID --> SaveHarv[Save Harvest Entity: Item, Quantity, Units, Date, Project]:::successNode
    SaveHarv --> IncrementHarvestPool[Increment Project Total Available Harvest Stock]:::successNode
    IncrementHarvestPool --> ToastHarvSuccess[Show Green Toast: Harvest recorded & pool updated]:::successNode
```

---

## 8. Inventory Stock Management & Project Usage Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef warningNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    InvAction([Inventory Action Requested]):::startNode --> InvChoice{Action Type?}:::decisionNode

    InvChoice -- 1. Restock / Add Stock --> AdminMgrAuth{Is Admin or Manager?}:::decisionNode
    AdminMgrAuth -- No --> BlockRestock[403 Forbidden: Only Admin/Manager can restock items]:::errorNode
    AdminMgrAuth -- Yes --> UpdateStock[Increment quantity_in_stock in DB]:::successNode
    UpdateStock --> ToastRestock[Show Toast: Stock updated successfully]:::successNode

    InvChoice -- 2. Consume Stock in Field Project --> SupAuth{Has CAN_USE_INVENTORY?}:::decisionNode
    SupAuth -- No --> BlockUsage[403 Forbidden: Inventory deduction privilege disabled]:::errorNode
    SupAuth -- Yes --> CheckStockLevel{quantity_in_stock >= requested_quantity?}:::decisionNode
    CheckStockLevel -- Insufficient Stock --> ErrStock[HTTP 400: Not enough stock in inventory]:::errorNode
    CheckStockLevel -- Sufficient Stock --> DeductStock[Deduct quantity_in_stock in InventoryItem]:::actionNode
    DeductStock --> RecordUsage[Save InventoryUsage Entity linked to Project]:::successNode
    RecordUsage --> CheckMinLevel{Remaining Stock <= min_stock_level?}:::decisionNode
    CheckMinLevel -- Yes --> TriggerLowStockAlert[Trigger Low-Stock Warning Badge on Dashboard]:::warningNode
    CheckMinLevel -- No --> UsageComplete[Finish Stock Deduction]:::successNode
    TriggerLowStockAlert --> UsageComplete
    UsageComplete --> ToastUsage[Show Toast: Stock deducted and logged to project]:::successNode
```

---

## 9. Financial Accounting, Expense Tracking & Budget Auditing Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef warningNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    ExpStart([Submit Expense Record]):::startNode --> ExpAuth{User is Admin/Manager OR Has CAN_RECORD_EXPENSES?}:::decisionNode
    ExpAuth -- No --> ExpBlock[403 Forbidden: Expense recording privilege disabled]:::errorNode
    
    ExpAuth -- Yes --> ValExp[Calculate: amount = unit_price * quantity]:::actionNode
    ValExp --> GenExpID[Generate Collision-Safe Expense ID]:::actionNode
    GenExpID --> SaveExp[Save Expense Entity linked to Project]:::successNode
    SaveExp --> FetchProjBudget[Fetch Project Total Budget & Existing Expenses]:::actionNode
    FetchProjBudget --> CheckBudgetOverrun{totalExpenses > project.budget?}:::decisionNode
    CheckBudgetOverrun -- Yes: Budget Overrun --> WarnOverrun[Trigger Over-Budget Warning Banner in Project Financials]:::warningNode
    CheckBudgetOverrun -- No: Within Budget --> HealthyBudget[Mark Budget Status as On-Track]:::successNode
    WarnOverrun --> ReturnExpSuccess[Return 201 Created: Expense recorded]:::successNode
    HealthyBudget --> ReturnExpSuccess
```

---

## 10. Financial Governance & Stock-Backed Sales Flow

```mermaid
flowchart TD
    classDef startNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;

    SaleStart([Record Sale Request]):::startNode --> SalePriv{User is Admin/Manager OR Has CAN_RECORD_SALES?}:::decisionNode
    SalePriv -- No --> SaleBlock[403 Forbidden: Not authorized to record sales]:::errorNode
    
    SalePriv -- Yes --> CalcStock[Calculate: availableStock = totalHarvested - totalSold]:::actionNode
    CalcStock --> StockCheck{availableStock >= saleQuantity?}:::decisionNode
    
    StockCheck -- No: Insufficient Harvest --> StockFail[HTTP 400: Cannot sell more than harvested quantity!]:::errorNode
    
    StockCheck -- Yes: Harvest Stock OK --> GenSaleID[Generate Collision-Free Sale ID]:::actionNode
    GenSaleID --> SaveSale[Save Sale Record: Item, Qty, Unit Price, Total, Project, Customer]:::successNode
    SaveSale --> UpdateLedger[Update Project Total Sales & Recalculate Net Profit]:::successNode
    UpdateLedger --> SuccessSale[Return 201 Created: Sale recorded successfully]:::successNode
```

---

## 11. Dynamic Scoped Dashboard & Zero-State Engine Flow

```mermaid
flowchart TD
    classDef startNode fill:#0f172a,stroke:#334155,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef adminNode fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef managerNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef supervisorNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef zeroNode fill:#e11d48,stroke:#be123c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef renderNode fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff;

    DashStart([User opens Dashboard]):::startNode --> CheckRole{Check User Role}:::decisionNode

    CheckRole -- 1. ADMIN --> AdminDash[Fetch Global Enterprise Metrics]:::adminNode
    AdminDash --> RenderAdmin[Render Full Financial KPIs + All Categories + User Quota Cards + Donut Chart]:::renderNode

    CheckRole -- 2. MANAGER --> FetchMgrCats[Fetch Categories in user_assigned_categories]:::managerNode
    FetchMgrCats --> HasCats{Assigned Categories > 0?}:::decisionNode
    HasCats -- 0 Categories --> MgrZero[SUPPRESS ALL STATS & CHARTS: Render 'No Categories Assigned' Hero Action Card]:::zeroNode
    HasCats -- >= 1 Categories --> MgrDash[Fetch Projects in Assigned Categories]:::managerNode
    MgrDash --> RenderMgr[Render Sector Budgets + Category Projects + Supervisor Workloads]:::renderNode

    CheckRole -- 3. SUPERVISOR --> FetchSupProjs[Fetch Projects where supervisor_id = user.id]:::supervisorNode
    FetchSupProjs --> HasProjs{Assigned Projects > 0?}:::decisionNode
    HasProjs -- 0 Projects --> SupZero[SUPPRESS ALL STATS & CHARTS: Render 'No Projects Assigned' Hero Action Card]:::zeroNode
    HasProjs -- >= 1 Projects --> SupDash[Fetch Yields, Tasks, and Activities for Assigned Projects]:::supervisorNode
    SupDash --> StripFin[STRIP ALL REVENUE, BUDGETS & FINANCIAL METRICS]:::supervisorNode
    StripFin --> RenderSup[Render Operational Yields, Activity Logs & Completion Progress]:::renderNode
```

---

## 12. Safe User Deletion & Cascade Unlinking Flow

```mermaid
flowchart TD
    classDef startNode fill:#0f172a,stroke:#334155,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef decisionNode fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef errorNode fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef actionNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#ffffff;
    classDef successNode fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff,font-weight:bold;

    DelStart([Admin/Manager clicks Delete User]):::startNode --> SelfCheck{Deleting Own Active Account?}:::decisionNode
    SelfCheck -- Yes --> BlockSelf[Block: Cannot delete your own logged-in account!]:::errorNode
    
    SelfCheck -- No --> AdminCheck{Target User is an ADMIN?}:::decisionNode
    AdminCheck -- Yes --> BlockAdmin[Block: Cannot delete primary Farm Administrator!]:::errorNode
    
    AdminCheck -- No --> ConfirmModal[User confirms deletion in modal]:::actionNode
    ConfirmModal --> Step1[Step 1: Delete linked PasswordResetToken if exists]:::actionNode
    Step1 --> Step2[Step 2: Clear user_assigned_categories join table rows]:::actionNode
    Step2 --> Step3[Step 3: Unassign supervisor_id on supervised projects to NULL]:::actionNode
    Step3 --> Step4[Step 4: Clear createdById references on created staff]:::actionNode
    Step4 --> Step5[Step 5: Safely delete User entity from DB]:::successNode
    Step5 --> Step6[Show Green Toast: User removed successfully]:::successNode
    Step6 --> RefreshTable[Auto-refresh Staff Table]:::successNode
```
