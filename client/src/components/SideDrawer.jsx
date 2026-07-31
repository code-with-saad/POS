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
    { path: '/pos',     label: 'POS Terminal',    icon: '🖥️' },
    { path: '/kitchen', label: 'Kitchen View',     icon: '👨‍🍳' },
    { path: '/admin',   label: 'Admin Dashboard',  icon: '📊', adminOnly: true },
    { path: '/admin/orders', label: 'Order History', icon: '🧾', adminOnly: true },
    { path: '/admin/menu-items', label: 'Menu Items', icon: '🍔', adminOnly: true },
    { path: '/admin/tables', label: 'Tables',       icon: '🪑', adminOnly: true },
    { path: '/admin/settings', label: 'Settings',   icon: '⚙️', adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === 'admin');

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
              <span className="drawer-nav-icon">{item.icon}</span>
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
