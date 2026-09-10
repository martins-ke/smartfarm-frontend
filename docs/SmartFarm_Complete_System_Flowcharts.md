# Complete System Flowcharts & Process Workflows
## AgroSync Farm Management System
**Document Version:** 3.0  
**SDLC Stage:** Operational Flowcharts & Workflow Specifications  
**Status:** Approved  

---

## 1. Authentication & Bootstrap Flow

```mermaid
flowchart TD
    Start([User visits /signup]) --> CheckDB{Does system have 0 users?}
    
    CheckDB -- Yes --> BootstrapMode[Set Mode = Primary Admin Bootstrap]
    BootstrapMode --> FillAdminForm[Fill Username, Email, Password]
    FillAdminForm --> CheckBox{Checked Responsibility Box?}
    CheckBox -- No --> BlockSubmit[Disable Submit Button]
    CheckBox -- Yes --> SubmitAdmin[Submit Registration]
    SubmitAdmin --> CreateAdmin[Create User: Role=ADMIN, Status=ACTIVE]
    CreateAdmin --> AutoLogin[Auto-Login & Navigate to Dashboard]
    
    CheckDB -- No --> RegularMode[Set Mode = Regular Account Request]
    RegularMode --> FillRegForm[Fill Details + Select Role: Manager/Supervisor]
    FillRegForm --> SubmitReg[Submit Registration]
    SubmitReg --> CreatePending[Create User: Status=PENDING_APPROVAL]
    CreatePending --> ShowPendingBanner[Show 'Pending Admin Approval' Banner]
    ShowPendingBanner --> AdminNotif[Trigger TopBar Notification for Admin/Manager]
```

---

## 2. Real-Time Notification Engine Flow

```mermaid
flowchart TD
    Init([TopBar Component Mounts]) --> FetchNotifs[Call GET /notifications]
    FetchNotifs --> CheckPendingUsers{Pending User Registrations?}
    CheckPendingUsers -- Yes --> AddUserNotif[Add USERS: WARNING Card]
    CheckPendingUsers -- No --> CheckLowStock{Items <= MinStockLevel?}
    
    AddUserNotif --> CheckLowStock
    CheckLowStock -- Yes --> AddStockNotif[Add INVENTORY: DANGER Card]
    CheckLowStock -- No --> CheckOverdueTasks{Tasks past due date?}
    
    AddStockNotif --> CheckOverdueTasks
    CheckOverdueTasks -- Yes --> AddOverdueNotif[Add TASKS: DANGER Alert with days count]
    CheckOverdueTasks -- No --> CheckUpcomingTasks{Tasks due in next 7 days?}
    
    AddOverdueNotif --> CheckUpcomingTasks
    CheckUpcomingTasks -- Yes --> AddUpcomingNotif[Add TASKS: INFO/WARNING Card]
    CheckUpcomingTasks -- No --> CheckDebts{Unpaid Invoices or Customer Debts?}
    
    AddUpcomingNotif --> CheckDebts
    CheckDebts -- Yes --> AddFinanceNotif[Add FINANCE: AP/AR Alerts]
    CheckDebts -- No --> RenderBadge[Render Badge Count & Pulse Animation]
    
    AddFinanceNotif --> RenderBadge
    RenderBadge --> Wait45s[Wait 45 Seconds or Route Change]
    Wait45s --> FetchNotifs
```

---

## 3. Farm Task Scheduling with Agronomic Presets

```mermaid
flowchart TD
    OpenTab([User opens Activities Tab]) --> ClickSchedule[Click '+ Add Task' or Presets Bar]
    
    ClickSchedule --> ChoosePreset{Select Preset Button?}
    ChoosePreset -- '+2 Wks (Spraying)' --> Set14[Set Date=Today+14d, Priority=HIGH, Type=Field Care]
    ChoosePreset -- '+3 Wks (Weeding)' --> Set21[Set Date=Today+21d, Priority=MEDIUM, Type=Field Care]
    ChoosePreset -- '+4 Wks (Top-Dressing)' --> Set28[Set Date=Today+28d, Priority=HIGH, Type=Fertilization]
    ChoosePreset -- '+2 Mos (Harvesting)' --> Set60[Set Date=Today+60d, Priority=URGENT, Type=Harvesting]
    ChoosePreset -- Custom --> CustomDate[User selects manual Scheduled Date & Due Date]
    
    Set14 --> SaveTask[Submit POST /activities/record]
    Set21 --> SaveTask
    Set28 --> SaveTask
    Set60 --> SaveTask
    CustomDate --> SaveTask
    
    SaveTask --> TaskCreated[Task Created with Status=SCHEDULED]
    TaskCreated --> LiveList[Renders in Task List with Countdown Badge]
    
    LiveList --> UserAction{User Action on Task}
    UserAction -- Toggle Checkmark --> UpdateStatus[PATCH /activities/id/status -> COMPLETED]
    UserAction -- Allocate Labor --> OpenLaborModal[Assign Verified Workers & Set Wages]
    UserAction -- Edit / Delete --> ModifyTask[PUT / DELETE /activities/id]
```

---

## 4. Accounts Payable (AP) & Accounts Receivable (AR) Trade Flow

```mermaid
flowchart TD
    subgraph AP_Suppliers["Accounts Payable (Farm Buys Inputs)"]
        BuyInputs([Farm Buys Feeds / Chemicals]) --> SelectSupplier[Select Registered Supplier]
        SelectSupplier --> RecordPurchase[Record Invoice: Total Amount, Amount Paid]
        RecordPurchase --> CalcAPBalance[Calculate Balance Due = Total - Paid]
        CalcAPBalance --> UpdateSupplierDebt[Increment Supplier.outstandingDebt by Balance Due]
        UpdateSupplierDebt --> APNotif[Trigger Pending Invoice Alert if Balance > 0]
    end

    subgraph AR_Customers["Accounts Receivable (Farm Sells Produce)"]
        SellProduce([Customer Buys Harvest]) --> SelectCustomer[Select Registered Customer]
        SelectCustomer --> RecordSale[Record Sale: Total Amount, Amount Paid]
        RecordSale --> CheckStock{Quantity <= Harvest Stock?}
        CheckStock -- No --> RejectSale[Reject Sale: Insufficient Harvested Produce]
        CheckStock -- Yes --> CalcARBalance[Calculate Balance Due = Total - Paid]
        CalcARBalance --> UpdateCustDebt[Increment Customer.outstandingDebt by Balance Due]
        UpdateCustDebt --> DeductHarvestStock[Deduct available produce from project harvest]
    end
```

---

## 5. Unified Transaction History & Pagination Engine Flow

```mermaid
flowchart TD
    Mount[Unified Dashboard Mounts] --> FetchDashboard[Call GET /dashboard/summary]
    FetchDashboard --> IngestTx[Ingest recentTransactions Array]
    IngestTx --> ListenFilters[Listen to Search Query & Type Filter]
    
    ListenFilters --> FilterArray[Filter by Search Query & Type: ALL / SALES / SUPPLIES]
    FilterArray --> SortDescending[Sort Array: Date Descending, then ID Descending]
    SortDescending --> CalcPagination[Calculate Total Pages = ceil(count / 5)]
    
    CalcPagination --> SliceData[Slice Records: (page - 1) * 5 to page * 5]
    SliceData --> RenderTable[Render 5 Transaction Rows with Status Badges]
    
    RenderTable --> UserPageAction{User Pagination Action}
    UserPageAction -- Click Prev --> PrevPage[Set page = max(1, page - 1)]
    UserPageAction -- Click Next --> NextPage[Set page = min(total, page + 1)]
    UserPageAction -- Click Pill --> SpecificPage[Set page = selected page]
    UserPageAction -- Change Search/Filter --> ResetPage[Auto-reset page = 1]
    
    PrevPage --> SliceData
    NextPage --> SliceData
    SpecificPage --> SliceData
    ResetPage --> FilterArray
```
