import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import SuperAdminLayout from './components/SuperAdminLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CategoriesPage from './pages/admin/CategoriesPage.jsx';
import MenuItemsPage from './pages/admin/MenuItemsPage.jsx';
import TablesPage from './pages/admin/TablesPage.jsx';
import OrdersHistoryPage from './pages/admin/OrdersHistoryPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import KitchenViewPage from './pages/KitchenViewPage.jsx';
import WaiterScreenPage from './pages/WaiterScreenPage.jsx';
import POS from './pages/POS.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';
import InventoryPage from './pages/admin/InventoryPage.jsx';
import CustomersPage from './pages/admin/CustomersPage.jsx';
import SuppliersPage from './pages/admin/SuppliersPage.jsx';
import PurchasesPage from './pages/admin/PurchasesPage.jsx';
import OrganizationsPage from './pages/admin/OrganizationsPage.jsx';
import LockedPage from './pages/LockedPage.jsx';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'superadmin') return <Navigate to="/superadmin/organizations" replace />;
  if (user.role === 'admin' || user.role === 'manager') return <Navigate to="/admin" replace />;
  // Users with custom module permissions → send to admin layout (shows their modules in sidebar)
  if (Array.isArray(user.allowedModules) && user.allowedModules.length > 0) return <Navigate to="/admin" replace />;
  if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
  return <Navigate to="/pos" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/locked" element={<LockedPage />} />

      {/* Super Admin Dedicated Portal */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route index element={<Navigate to="/superadmin/organizations" replace />} />
        <Route path="*" element={<Navigate to="/superadmin/organizations" replace />} />
      </Route>

      {/* Tenant Admin, Manager, or any user with allowedModules */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="menu-items" element={<MenuItemsPage />} />
        <Route path="tables" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="tables"><TablesPage /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="orders"><OrdersHistoryPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="reports"><ReportsPage /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="inventory"><InventoryPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="customers"><CustomersPage /></ProtectedRoute>} />
        <Route path="suppliers" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="suppliers"><SuppliersPage /></ProtectedRoute>} />
        <Route path="purchases" element={<ProtectedRoute allowedRoles={['admin','manager']} requiredModule="purchases"><PurchasesPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Kitchen Display View */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={['kitchen', 'cashier', 'admin', 'manager']} requiredModule="kitchen">
            <KitchenViewPage />
          </ProtectedRoute>
        }
      />

      {/* Waiter Screen */}
      <Route
        path="/waiter"
        element={
          <ProtectedRoute allowedRoles={['kitchen', 'cashier', 'admin', 'manager']} requiredModule="waiter">
            <WaiterScreenPage />
          </ProtectedRoute>
        }
      />

      {/* Cashier POS Terminal */}
      <Route
        path="/pos/*"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'admin', 'manager']} requiredModule="pos">
            <POS />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
