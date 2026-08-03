import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
    { path: '/pos', label: 'POS Terminal', icon: 'point_of_sale' },
    { path: '/admin/tables', label: 'Tables', icon: 'table_restaurant' },
    { path: '/kitchen', label: 'Kitchen View', icon: 'soup_kitchen' },
    { path: '/admin/orders', label: 'Order History', icon: 'receipt_long' },
    { path: '/admin/reports', label: 'Reports', icon: 'analytics' },
    { path: '/admin/inventory', label: 'Inventory', icon: 'inventory_2' },
    { path: '/admin/customers', label: 'Customers', icon: 'person' },
    { path: '/admin/suppliers', label: 'Suppliers', icon: 'local_shipping' },
    { path: '/admin/purchases', label: 'Purchasing', icon: 'shopping_cart' },
    { path: '/admin/categories', label: 'Categories', icon: 'category' },
    { path: '/admin/menu-items', label: 'Menu Items', icon: 'restaurant_menu' },
    { path: '/admin/users', label: 'Staff & Cashiers', icon: 'group' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined brand-icon">local_cafe</span>
            <div>
              <h1 className="brand-name">{settings?.restaurantName || 'CafePOS'}</h1>
              <span className="brand-badge">ADMIN PANEL</span>
            </div>
          </div>
          <button className="sidebar-theme-btn-top" onClick={toggleTheme} title="Toggle theme">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-btn" onClick={toggleTheme} title="Toggle theme">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="sidebar-user-row">
            <div className="user-profile">
              <div className="avatar">{user?.name?.[0] || 'A'}</div>
              <div className="user-info">
                <p className="user-name">{user?.name}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>
            <button className="logout-btn flex items-center gap-1" onClick={handleLogout} title="Logout">
              <span className="material-symbols-outlined text-sm">logout</span> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
