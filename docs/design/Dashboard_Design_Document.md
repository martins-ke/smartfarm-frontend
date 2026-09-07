# SmartFarm Dashboard - Technical Design Document


## 1. Overview
The SmartFarm Main Dashboard serves as the central command center for the application. Following SDLC best practices, this document outlines the UI topology, component specifications, and backend data requirements before any code is written. This document will serve as our single source of truth for the dashboard's implementation and future iterations.

## 2. Layout Topology & Wireframe

The dashboard follows a classic, high-density SaaS layout optimized for desktop and responsive for mobile.

```text
+-----------------------------------------------------------------------+
|  Top Navigation / Date Filter (e.g., "This Month", "This Year")       |
+-----------------------------------------------------------------------+
|                                                                       |
|  [ Widget 1: Total Revenue ]         [ Widget 2: Active Projects ]    |
|  [ Widget 3: Inventory Alerts ]      [ Widget 4: Active Customers]    |
|                                                                       |
+-----------------------------------------+-----------------------------+
|                                         |                             |
|       Sales & Revenue Trends            |    Revenue by Category      |
|           (Line Chart)                  |       (Donut Chart)         |
|                                         |                             |
+-----------------------------------------+-----------------------------+
|                                         |                             |
|       Low Stock Inventory               |    Project Status Split     |
|          (Data Table)                   |       (Bar Chart)           |
|                                         |                             |
+-----------------------------------------+-----------------------------+
```

## 3. Component Specifications

### 3.1. KPI Cards (Top Row)
*   **Total Revenue:** Displays sum of all sales. Shows a % increase/decrease compared to the previous period.
*   **Active Projects:** Displays count of projects with `ACTIVE` status.
*   **Inventory Alerts:** Count of items where `current_quantity <= threshold`. Colored red if > 0.
*   **Active Customers:** Count of unique buyers recorded in the current period.

### 3.2. Analytics Row (Middle)
*   **Sales Trend (Line Chart):** X-axis: Time (Days/Weeks). Y-axis: Revenue amount. 
*   **Revenue by Category (Donut Chart):** Breaks down the total revenue into Farm Categories (e.g., 40% Poultry, 35% Dairy, 25% Crops).

### 3.3. Operational Row (Bottom)
*   **Low Stock Warning Table:** Lists `Item Name`, `Category`, `Current Quantity`, and `Threshold`. Includes a quick action button to "Order".
*   **Project Status Split:** Horizontal bar charts showing distribution of `PENDING`, `ACTIVE`, and `COMPLETED` projects.

## 4. Data Flow & API Requirements

To populate these widgets efficiently, we will need to aggregate data. Instead of making 10 separate API calls, we will implement a dedicated Dashboard Endpoint (BFF - Backend for Frontend pattern).

*   **New Endpoint Required:** `GET /dashboard/summary`
    *   *Query Params:* `startDate`, `endDate`, `managerId` (for filtering).
    *   *Payload:*
        ```json
        {
          "kpis": {
             "revenue": 15000,
             "activeProjects": 12,
             "lowStockCount": 3,
             "customerCount": 45
          },
          "charts": {
             "salesTrend": [...],
             "revenueByCategory": [...]
          },
          "tables": {
             "lowStockItems": [...]
          }
        }
        ```

## 5. Role-Based Access Control (RBAC) View Logic

The UI rendering will conditionally hide/show data based on the logged-in user:

| Component | Admin View | Manager View | Supervisor View |
| :--- | :--- | :--- | :--- |
| **KPI: Total Revenue** | Global total | Sum of assigned categories only | *Hidden* |
| **KPI: Active Projects** | Global total | Supervised by their team | Assigned to them only |
| **KPI: Inventory Alerts** | Global low stock | Category-specific low stock | *Hidden* |
| **Sales Trend Chart** | Global sales | Category-specific sales | *Hidden* |
| **Low Stock Table** | Visible | Visible (Category filtered) | Visible (Request Restock) |
