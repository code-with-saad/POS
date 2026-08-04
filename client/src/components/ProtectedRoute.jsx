import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps a route so only authenticated users with the right role or module permission can access it.
 * allowedRoles: if omitted, any authenticated user is allowed.
 * requiredModule: specific module key (e.g. 'tables', 'inventory')
 */
export default function ProtectedRoute({ children, allowedRoles, requiredModule }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin and Superadmin have full access to everything
  if (user.role === 'admin' || user.role === 'superadmin') {
    return children;
  }

  // Check explicit custom module permissions
  if (requiredModule && Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    if (user.allowedModules.includes(requiredModule)) {
      return children;
    }
  }

  // Allow entering admin layout shell if user has ANY allowedModule assigned
  if (!requiredModule && allowedRoles && (allowedRoles.includes('admin') || allowedRoles.includes('manager')) && Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    return children;
  }

  // Fallback to role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/locked" replace />;
  }

  return children;
}
