import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * SideDrawer — slides in from the left with a blurred backdrop.
 * Props:
 *  isOpen: boolean
 *  onClose: () => void
 *  currentPage: string  — label of the current page shown in the header
 */
export default function SideDrawer({ isOpen, onClose, currentPage = 'Terminal' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    // Admin / Manager scope
    { path: '/admin',              label: 'Dashboard',       icon: 'dashboard',         roles: ['admin','manager'],                    module: null },
    { path: '/admin/reports',      label: 'Reports',         icon: 'bar_chart',         roles: ['admin','manager'],                    module: 'reports' },
    { path: '/admin/orders',       label: 'Order History',   icon: 'receipt_long',      roles: ['admin','manager'],                    module: 'orders' },
    { path: '/admin/tables',       label: 'Tables',          icon: 'table_restaurant',  roles: ['admin','manager'],                    module: 'tables' },
    { path: '/admin/categories',   label: 'Categories',      icon: 'category',          roles: ['admin','manager'],                    module: null },
    { path: '/admin/menu-items',   label: 'Menu Items',      icon: 'restaurant_menu',   roles: ['admin','manager'],                    module: null },
    { path: '/admin/inventory',    label: 'Inventory',       icon: 'inventory_2',       roles: ['admin','manager'],                    module: 'inventory' },
    { path: '/admin/customers',    label: 'Customers',       icon: 'people',            roles: ['admin','manager'],                    module: 'customers' },
    { path: '/admin/suppliers',    label: 'Suppliers',       icon: 'local_shipping',    roles: ['admin','manager'],                    module: 'suppliers' },
    { path: '/admin/purchases',    label: 'Purchases',       icon: 'shopping_cart',     roles: ['admin','manager'],                    module: 'purchases' },
    { path: '/admin/users',        label: 'Staff & Cashiers',icon: 'badge',             roles: ['admin'],                              module: null },
    { path: '/admin/settings',     label: 'Settings',        icon: 'settings',          roles: ['admin'],                              module: null },
    // Shared screens
    { path: '/pos',                label: 'POS Terminal',    icon: 'point_of_sale',     roles: ['admin','manager','cashier'],          module: 'pos' },
    { path: '/kitchen',            label: 'Kitchen View',    icon: 'soup_kitchen',      roles: ['admin','manager','cashier','kitchen'],module: 'kitchen' },
    { path: '/waiter',             label: 'Waiter Screen',   icon: 'room_service',      roles: ['admin','manager','cashier','kitchen'],module: 'waiter' },
  ];

  const visibleItems = navItems.filter((item) => {
    // Admins and superadmins always see everything
    if (user?.role === 'admin' || user?.role === 'superadmin') return true;

    const hasCustomModules = Array.isArray(user?.allowedModules) && user.allowedModules.length > 0;

    // Users with custom module assignments: show items by module key, ignoring base role
    if (hasCustomModules && item.module) {
      return user.allowedModules.includes(item.module);
    }

    // Users with custom modules but item has no module key (e.g. Dashboard) — hide it
    if (hasCustomModules && !item.module) return false;

    // Default: filter by role
    const roleOk = item.roles.includes(user?.role);
    return roleOk;
  });

  return (
    <>
      {/* Blurred backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? 'drawer-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className={`side-drawer ${isOpen ? 'side-drawer--open' : ''}`} aria-label="Navigation drawer">
        {/* Drawer header */}
        <div className="drawer-header">
          <div className="drawer-brand">
            <span className="drawer-brand-icon">☕</span>
            <div>
              <span className="drawer-brand-name">CafePOS</span>
              <span className="drawer-brand-sub">{currentPage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="sidebar-theme-btn-top" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="drawer-close" onClick={onClose} aria-label="Close sidebar">
              ✕
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="drawer-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `drawer-nav-link ${isActive ? 'drawer-nav-link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="material-symbols-outlined drawer-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="drawer-footer">
          <button className="drawer-theme-toggle" onClick={toggleTheme} title="Toggle theme">
            <span className="drawer-theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="drawer-user">
            <div className="drawer-avatar">{user?.name?.[0] || '?'}</div>
            <div className="drawer-user-info">
              <span className="drawer-user-name">{user?.name}</span>
              <span className="drawer-user-role">{user?.role}</span>
            </div>
            <button className="drawer-logout" onClick={handleLogout} title="Logout">
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
