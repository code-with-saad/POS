import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_DESTINATIONS = {
  superadmin: { path: '/superadmin/organizations', label: 'Super Admin Portal' },
  admin:      { path: '/admin',   label: 'Admin Portal' },
  manager:    { path: '/admin',   label: 'Manager Portal' },
  cashier:    { path: '/pos',     label: 'POS Terminal' },
  kitchen:    { path: '/kitchen', label: 'Kitchen Display System' },
};

export default function LockedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dest = ROLE_DESTINATIONS[user?.role] ?? { path: '/login', label: 'Login' };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      textAlign: 'center',
    }}>
      {/* Lock icon */}
      <div style={{
        width: '5rem', height: '5rem',
        borderRadius: '50%',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#ef4444' }}>
          lock
        </span>
      </div>

      <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Access Restricted
      </h1>
      <p style={{ color: '#a1a1aa', maxWidth: '30rem', marginBottom: '1.5rem', lineHeight: 1.65 }}>
        This area is locked for your account level&nbsp;(
        <span style={{ color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
          {user?.role ?? 'guest'}
        </span>
        ). You do not have permission to view this page.
      </p>

      {/* Destination card */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        maxWidth: '26rem', width: '100%',
        marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        textAlign: 'left',
      }}>
        <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '1.5rem', flexShrink: 0 }}>
          info
        </span>
        <div>
          <p style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500, marginBottom: '0.15rem' }}>
            Your Authorized Destination:
          </p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>{dest.label}</p>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(dest.path, { replace: true })}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#f59e0b',
          color: '#09090b',
          fontWeight: 700,
          borderRadius: '0.75rem',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.9rem',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#d97706')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#f59e0b')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span>
        Return to Your Authorized Portal
      </button>
    </div>
  );
}
