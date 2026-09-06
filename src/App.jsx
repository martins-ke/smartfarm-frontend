import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Mainlayout } from './Layout/Mainlayout'
import { DashboardPage } from './Pages/Dashboard/DashboardPage'
import { Category } from './Pages/Category/Category'
import CategoryForm from './Pages/Category/CategoryForm'
import { ProjectListPage } from './Pages/Projects/ProjectListPage'
import { ProjectFormPage } from './Pages/Projects/ProjectFormPage'
import { ProjectDashboardPage } from './Pages/Projects/ProjectDashboardPage'
import LoginPage from './Pages/LoginPage'
import SignupPage from './Pages/SignupPage'
import ForgotPasswordPage from './Pages/ForgotPasswordPage'
import ResetPasswordPage from './Pages/ResetPasswordPage'
import ForbiddenPage from './Pages/ForbiddenPage'
import UserManagementPage from './Pages/UserManagement/UserManagementPage'
import UserDetailsPage from './Pages/UserManagement/UserDetailsPage'
import AssignCategoriesPage from './Pages/UserManagement/AssignCategoriesPage'
import AssignProjectsPage from './Pages/UserManagement/AssignProjectsPage'
import { ProtectedRoute } from './Components/ProtectedRoute'
import { ROLE } from './utils/accessControl'

import { InventoryPage } from './Pages/Inventory/InventoryPage'
import SuppliersPage from './Pages/Suppliers/SuppliersPage'
import SupplierDetailsPage from './Pages/Suppliers/SupplierDetailsPage'
import CustomersPage from './Pages/Customers/CustomersPage'
import CustomerDetailsPage from './Pages/Customers/CustomerDetailsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/users/login' element={<Navigate to="/login" replace />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/users/signup' element={<Navigate to="/signup" replace />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password' element={<ResetPasswordPage />} />
        <Route path='/forbidden' element={<ForbiddenPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Mainlayout />}>
            <Route path='/' element={<DashboardPage />} />

            <Route element={<ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.MANAGER, ROLE.SUPERVISOR]} />}>
              <Route path='/categories' element={<Category />} />
              <Route path='/categories/new' element={<CategoryForm />} />
              <Route path='/categories/:category_id/:category' element={<ProjectListPage />} />
              <Route path='/categories/:category_id/:category/new' element={<ProjectFormPage />} />
              <Route path='/categories/:category/projects/:projectId' element={<ProjectDashboardPage />} />
              <Route path='/inventory' element={<InventoryPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.MANAGER]} />}>
              <Route path='/users' element={<UserManagementPage />} />
              <Route path='/users/:userId' element={<UserDetailsPage />} />
              <Route path='/users/:userId/projects' element={<AssignProjectsPage />} />
              <Route path='/suppliers' element={<SuppliersPage />} />
              <Route path='/suppliers/:supplierId' element={<SupplierDetailsPage />} />
              <Route path='/customers' element={<CustomersPage />} />
              <Route path='/customers/:customerId' element={<CustomerDetailsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={[ROLE.ADMIN]} />}>
              <Route path='/users/:userId/categories' element={<AssignCategoriesPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
