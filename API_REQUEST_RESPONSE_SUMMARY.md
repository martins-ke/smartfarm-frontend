# App request / response contract

This file describes the data the frontend expects from the backend for each request currently used by the app. It is meant to be the contract for backend implementation.

Important notes:
- The current app also has mock data support in `src/APIs/*` and `src/mocks/mockData.js`, but the backend should return the same shapes shown below.
- All project and record data are expected to be JSON objects.
- Request bodies are JSON unless otherwise noted.

## 1) Season requests

### 1.1 Create a season
- Endpoint: `POST /seasons/new`
- Used by: `src/Pages/Season/SeasonForm.jsx`
- Request body:
```json
{
  "name": "Long rains 2026",
  "size": 12,
  "period": 6,
  "budget": 250000
}
```
- Expected return:
  - Usually the created season object.
```json
{
  "id": 1,
  "name": "Long rains 2026",
  "size": 12,
  "period": 6,
  "budget": 250000
}
```
- Frontend behavior: it only waits for the request to resolve, then resets the form and shows a success notification.

### 1.2 Get all seasons
- Endpoint: `GET /seasons/all`
- Used by: `src/Pages/Season/Season.jsx`
- Expected return:
```json
[
  {
    "id": 1,
    "name": "Long rains 2026",
    "size": 12,
    "period": 6,
    "budget": 250000
  },
  {
    "id": 2,
    "name": "Short rains 2026",
    "size": 8,
    "period": 4,
    "budget": 180000
  }
]
```
- Frontend behavior: renders a table with the returned array.

### 1.3 Get all seasons count
- Endpoint: `GET /seasons/all/count`
- Used by: `src/APIs/season.js`
- Expected return:
```json
{
  "count": 12
}
```
- This is not currently rendered in the UI but the API wrapper expects a count response.

### 1.4 Get completed seasons count
- Endpoint: `GET /seasons/complete/count`
- Used by: `src/APIs/season.js`
- Expected return:
```json
{
  "count": 5
}
```

---

## 2) Category requests

### 2.1 Get all categories
- Endpoint: `GET /categories/all`
- Used by: `src/APIs/category.js`
- Expected return:
```json
[
  {
    "id": 1,
    "name": "crops",
    "description": "..."
  },
  {
    "id": 2,
    "name": "livestock",
    "description": "..."
  },
  {
    "id": 3,
    "name": "poultry",
    "description": "..."
  }
]
```

### 2.2 Get category by id
- Endpoint: `GET /categories/:categoryId`
- Expected return:
```json
{
  "id": 1,
  "name": "crops",
  "description": "..."
}
```

### 2.3 Create a category
- Endpoint: `POST /categories`
- Request body:
```json
{
  "name": "crops",
  "description": "..."
}
```
- Expected return:
```json
{
  "id": 1,
  "name": "crops",
  "description": "..."
}
```

### 2.4 Update category
- Endpoint: `PUT /categories/:categoryId`
- Request body:
```json
{
  "name": "crops",
  "description": "..."
}
```
- Expected return:
```json
{
  "id": 1,
  "name": "crops",
  "description": "..."
}
```

### 2.5 Delete category
- Endpoint: `DELETE /categories/:categoryId`
- Expected return:
```json
{
  "deleted": true,
  "id": 1
}
```

---

## 3) User/auth requests

### 3.1 Get current user
- Endpoint: `GET /users/me`
- Used by: `src/APIs/user.js`
- Expected return:
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "role": "Farm Manager"
}
```

### 3.2 Login
- Endpoint: `POST /auth/login`
- Request body:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```
- Expected return:
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "Farm Manager"
  }
}
```

### 3.3 Logout
- Endpoint: `POST /auth/logout`
- Expected return:
```json
{
  "success": true
}
```

---

## 4) Project requests

### 4.1 Get projects by category
- Endpoint: `GET /projects/category_id/category`
- Used by: `src/Pages/Projects/ProjectListPage.jsx`
- Expected return:
```json
[
  {
    "id": 1001,
    "name": "Test Maize Season A",
    "season": "Long rains 2026",
    "status": "active",
    "startDate": "2026-03-01",
    "endDate": "2026-10-15",
    "budget": 120000,
    "description": "Maize cultivation project for the long rains season.",
    "category": "crops"
  }
]
```
- Frontend uses:
  - `projects.length`
  - `project.status`
  - `project.budget`
  - `project.startDate`
  - `project.endDate`

### 4.2 Create project
- Endpoint: `POST /projects/create`
- Used by: `src/Pages/Projects/ProjectFormPage.jsx`
- Request body:
```json
{
  "name": "Dairy herd 2026",
  "season": "Q1 2026",
  "status": "active",
  "startDate": "2026-01-01",
  "endDate": "2026-06-30",
  "budget": 450000,
  "description": "Commercial dairy project focused on herd health and productivity.",
  "category": "livestock"
}
```
- Expected return:
```json
{
  "id": 2001,
  "name": "Dairy herd 2026",
  "season": "Q1 2026",
  "status": "active",
  "startDate": "2026-01-01",
  "endDate": "2026-06-30",
  "budget": 450000,
  "description": "Commercial dairy project focused on herd health and productivity.",
  "category": "livestock"
}
```
- Frontend uses the returned `id` to navigate to the project dashboard.

### 4.3 Get project by id
- Endpoint: `GET /projects/:projectId`
- Used by: `src/Pages/Projects/ProjectDashboardPage.jsx`
- Expected return:
```json
{
  "id": 1001,
  "name": "Test Maize Season A",
  "season": "Long rains 2026",
  "status": "active",
  "startDate": "2026-03-01",
  "endDate": "2026-10-15",
  "budget": 120000,
  "description": "Maize cultivation project for the long rains season.",
  "category_id": "C001",
  "expenses": [
    {
      "id": 5001,
      "title": "Fertilizer",
      "amount": 20000,
      "notes": "Used for top dressing",
      "added_on": "2026-04-01"
    }
  ],
  "activities": [
    {
      "id": 6001,
      "title": "Irrigation",
      "type": "Field work",
      "notes": "Irrigated blocks A and B",
      "added_on": "2026-04-02"
    }
  ],
  "sales": [
    {
      "id": 7001,
      "item": "Maize",
      "quantity": 50,
      "unit_price": 40,
      "customer": {
        "name": "Market buyer",
        "contact": "0712345678"
      },
      "added_on": "2026-06-01"
    }
  ],
  "harvest": [
    {
      "id": 8001,
      "item": "Maize",
      "quantity": 120,
      "units": "kg",
      "notes": "Harvest completed",
      "added_on": "2026-06-02"
    }
  ]
}
```
- Frontend uses this object to compute:
  - total expenses
  - total sales
  - net value
  - recent records list

---

## 5) Project record requests

Note: Record creation dates are automatically generated and assigned by the backend upon record creation (e.g. stored in `added_on`). The frontend sends only data fields and `project_id`.

### 5.1 Submit an expense
- Endpoint: `POST /expenses/create`
- Request body:
```json
{
  "project_id": 1001,
  "title": "Feed purchase",
  "amount": 25000,
  "notes": "Supplement feed for the livestock unit"
}
```
- Expected return:
```json
{
  "id": 9001,
  "project_id": 1001,
  "title": "Feed purchase",
  "amount": 25000,
  "notes": "Supplement feed for the livestock unit",
  "added_on": "2026-08-21"
}
```

### 5.2 Submit an activity
- Endpoint: `POST /activities/record`
- Request body:
```json
{
  "project_id": 1001,
  "title": "Vaccination",
  "type": "Health",
  "notes": "Vaccinated calves against respiratory disease"
}
```
- Expected return:
```json
{
  "id": 9002,
  "project_id": 1001,
  "title": "Vaccination",
  "type": "Health",
  "notes": "Vaccinated calves against respiratory disease",
  "added_on": "2026-08-20"
}
```

### 5.3 Submit a sale
- Endpoint: `POST /sales/create`
- Request body:
```json
{
  "project_id": 1001,
  "item": "Milk",
  "quantity": 20,
  "unit_price": 75,
  "customer": {
    "name": "School cafeteria",
    "contact": "0784463737",
    "id_number": "12345678",
    "address": "Kitale"
  }
}
```
- Expected return:
```json
{
  "id": 9003,
  "project_id": 1001,
  "item": "Milk",
  "quantity": 20,
  "unit_price": 75,
  "customer": {
    "name": "School cafeteria",
    "contact": "0784463737"
  },
  "added_on": "2026-08-18"
}
```

### 5.4 Submit a harvest
- Endpoint: `POST /harvest/record`
- Request body:
```json
{
  "project_id": 1001,
  "item": "Maize",
  "quantity": 150,
  "units": "kg",
  "notes": "First harvest batch"
}
```
- Expected return:
```json
{
  "id": 9004,
  "project_id": 1001,
  "item": "Maize",
  "quantity": 150,
  "units": "kg",
  "notes": "First harvest batch",
  "added_on": "2026-08-15"
}
```

### 5.5 Get all customers
- Endpoint: `GET /customers/all`
- Expected return:
```json
[
  {
    "id": 1,
    "name": "School cafeteria",
    "contact": "0784463737",
    "id_number": "12345678",
    "address": "Kitale"
  }
]
```

---

## 6) Summary of frontend-calculated values
These are values computed in the frontend from the returned records:

- `totalExpenses = sum of expenses[].amount`
- `totalSales = sum of sales[].quantity * sales[].unit_price`
- `netValue = totalSales - totalExpenses`

Example:
```json
{
  "totalExpenses": 45000,
  "totalSales": 84000,
  "netValue": 39000
}
```

---

## 7) No-backend UI-only actions
These do not hit the backend:
- top bar menu open/close
- theme toggle
- notification toast display (`notify` system)
- settings button click
- logout button click
- form validation in the browser only

---

## 8) Recommended backend response convention
For every request that creates or updates data, prefer returning the created object itself (or an object with a `message` / data payload). For list/detail requests, return:
- an array of objects for list endpoints (`/categories/all`, `/customers/all`, `/projects/:category_id/:category`, `/seasons/all`), and
- a project object containing arrays for `expenses`, `activities`, `sales`, and `harvest` for project detail endpoints.

In short:
- create responses = single record object
- list responses = array of records
- get project by id = project object with top-level records arrays (`expenses`, `activities`, `sales`, `harvest`)
