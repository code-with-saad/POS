import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function POS() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="stub-page">
      <div className="stub-card">
        <span className="stub-icon">🧾</span>
        <h1>POS Terminal</h1>
        <p>Welcome, <strong>{user?.name}</strong></p>
        <p className="stub-note">Phase 5 will build the full billing &amp; cart flow here.</p>
        <button className="stub-logout" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
