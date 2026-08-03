import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined brand-icon text-amber-500">shield_person</span>
            <div>
              <h1 className="brand-name">Platform Portal</h1>
              <span className="brand-badge bg-red-500/20 text-red-400 border border-red-500/30">SUPER ADMIN</span>
            </div>
          </div>
          <button className="sidebar-theme-btn-top" onClick={toggleTheme} title="Toggle theme">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/superadmin/organizations"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <span className="material-symbols-outlined nav-icon">corporate_fare</span>
            <span>Tenants & Orgs</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-btn" onClick={toggleTheme} title="Toggle theme">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="sidebar-user-row">
            <div className="user-profile">
              <div className="avatar bg-amber-500 text-black font-bold">{user?.name?.[0] || 'S'}</div>
              <div className="user-info">
                <p className="user-name">{user?.name || 'Super Admin'}</p>
                <p className="user-role uppercase text-amber-400">{user?.role || 'superadmin'}</p>
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
