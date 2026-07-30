import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categoriesCount: 0,
    menuItemsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [cats, items] = await Promise.all([
          api.get('/categories'),
          api.get('/menu-items'),
        ]);
        setStats({
          categoriesCount: cats.length,
          menuItemsCount: items.length,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">CafePOS System Overview & Quick Actions</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <span className="stat-value">
              {loading ? '-' : stats.categoriesCount}
            </span>
            <span className="stat-label">Categories</span>
          </div>
          <Link to="/admin/categories" className="stat-link">
            Manage →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🍔</div>
          <div className="stat-content">
            <span className="stat-value">
              {loading ? '-' : stats.menuItemsCount}
            </span>
            <span className="stat-label">Menu Items</span>
          </div>
          <Link to="/admin/menu-items" className="stat-link">
            Manage →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <span className="stat-value">6</span>
            <span className="stat-label">Dining Tables</span>
          </div>
          <Link to="/admin/tables" className="stat-link">
            Phase 4 →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <span className="stat-value">0</span>
            <span className="stat-label">Today's Orders</span>
          </div>
          <Link to="/admin/orders" className="stat-link">
            Phase 5 →
          </Link>
        </div>
      </div>
    </div>
  );
}
