import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { path: '/admin/categories', label: 'Categories', icon: '📁' },
    { path: '/admin/menu-items', label: 'Menu Items', icon: '🍔' },
    { path: '/admin/tables', label: 'Tables', icon: '🪑' },
    { path: '/admin/orders', label: 'Order History', icon: '🧾' },
    { path: '/kitchen', label: 'Kitchen View', icon: '👨‍🍳' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">☕</span>
          <div>
            <h1 className="brand-name">CafePOS</h1>
            <span className="brand-badge">ADMIN PANEL</span>
          </div>
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
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{user?.name?.[0] || 'A'}</div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
