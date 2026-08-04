import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);

      // Role-based redirect — respect "from" only if the role can actually visit it
      const roleHome = {
        superadmin: '/superadmin/organizations',
        admin: '/admin',
        manager: '/admin',
        cashier: '/pos',
        kitchen: '/kitchen',
      };

      // Superadmin should NEVER land on /admin or /pos — always go to their portal
      if (user.role === 'superadmin') {
        navigate('/superadmin/organizations', { replace: true });
        return;
      }

      // Kitchen should NEVER land on /pos or /admin
      if (user.role === 'kitchen') {
        navigate('/kitchen', { replace: true });
        return;
      }

      // For others, respect "from" if it exists and is not /login
      if (from && from !== '/login' && from !== '/locked') {
        navigate(from, { replace: true });
      } else {
        navigate(roleHome[user.role] || '/pos', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">☕</div>
          <h1 className="logo-name">CafePOS</h1>
          <p className="logo-sub">Point of Sale System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="password-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="password-eye-btn"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">© {new Date().getFullYear()} CafePOS. All rights reserved.</p>
      </div>
    </div>
  );
}
