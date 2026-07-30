import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CategoriesPage from './pages/admin/CategoriesPage.jsx';
import MenuItemsPage from './pages/admin/MenuItemsPage.jsx';
import TablesPage from './pages/admin/TablesPage.jsx';
import OrdersHistoryPage from './pages/admin/OrdersHistoryPage.jsx';
import KitchenViewPage from './pages/KitchenViewPage.jsx';
import POS from './pages/POS.jsx';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/pos'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Subroutes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="menu-items" element={<MenuItemsPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="orders" element={<OrdersHistoryPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Kitchen Display View */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'admin']}>
            <KitchenViewPage />
          </ProtectedRoute>
        }
      />

      {/* Cashier POS Terminal */}
      <Route
        path="/pos/*"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'admin']}>
            <POS />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
