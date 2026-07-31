import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      setData(res.data || res);
    } catch (err) {
      showToast('error', err.message || 'Failed to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>No data available</h3>
          <button className="btn-primary mt-4" onClick={fetchAnalytics}>Retry</button>
        </div>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalOrders = 0,
    avgOrderValue = 0,
    todayRevenue = 0,
    todayOrders = 0,
    categoriesCount = 0,
    menuItemsCount = 0,
    topSellingItems = [],
    recentOrders = [],
  } = data || {};

  // Compute max quantity for bar width scaling
  const maxQty = topSellingItems.reduce((max, item) => Math.max(max, item.totalQuantity), 1);

  return (
    <div className="page-container">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Real-time Sales Overview & Performance Analytics</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={fetchAnalytics}>
          🔄 Refresh
        </button>
      </header>

      {/* KPI Cards Row 1: Sales & Revenue */}
      <div className="dashboard-grid mb-6">
        <div className="stat-card highlight-card">
          <div>
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-value">Rs. {todayRevenue.toLocaleString()}</span>
              <span className="stat-label">Today's Revenue</span>
            </div>
          </div>
          <div>
            <span className="stat-badge">{todayOrders} orders today</span>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <span className="stat-value">Rs. {totalRevenue.toLocaleString()}</span>
              <span className="stat-label">All-Time Revenue</span>
            </div>
          </div>
          <div>
            <span className="stat-subtext">{totalOrders} completed orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">🧾</div>
            <div className="stat-content">
              <span className="stat-value">Rs. {avgOrderValue.toLocaleString()}</span>
              <span className="stat-label">Average Order Value</span>
            </div>
          </div>
          <div>
            <span className="stat-subtext">Per order average</span>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <span className="stat-value">{totalOrders}</span>
              <span className="stat-label">Completed Orders</span>
            </div>
          </div>
          <div>
            <Link to="/admin/orders" className="stat-link">
              View All →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <span className="stat-value">{categoriesCount}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
          <div>
            <Link to="/admin/categories" className="stat-link">
              Manage →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">🍔</div>
            <div className="stat-content">
              <span className="stat-value">{menuItemsCount}</span>
              <span className="stat-label">Menu Items</span>
            </div>
          </div>
          <div>
            <Link to="/admin/menu-items" className="stat-link">
              Manage →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">🪑</div>
            <div className="stat-content">
              <span className="stat-value">Tables</span>
              <span className="stat-label">Layout & Status</span>
            </div>
          </div>
          <div>
            <Link to="/admin/tables" className="stat-link">
              Manage →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-icon">👨‍🍳</div>
            <div className="stat-content">
              <span className="stat-value">Kitchen</span>
              <span className="stat-label">Live KDS Display</span>
            </div>
          </div>
          <div>
            <Link to="/kitchen" className="stat-link">
              Open KDS →
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Sections */}
      <div className="analytics-section-grid mt-6">
        {/* Top Selling Items */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>🔥 Top Selling Items</h3>
            <span className="card-subtitle">By quantity sold</span>
          </div>
          {topSellingItems.length === 0 ? (
            <p className="text-muted p-4">No completed order data yet.</p>
          ) : (
            <div className="top-items-list">
              {topSellingItems.map((item, idx) => {
                const percent = Math.round((item.totalQuantity / maxQty) * 100);
                return (
                  <div key={item._id || idx} className="top-item-row">
                    <div className="item-rank">#{idx + 1}</div>
                    <div className="item-details">
                      <div className="item-name-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-stat">
                          <strong>{item.totalQuantity} sold</strong> (Rs. {item.totalSales.toLocaleString()})
                        </span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>🕒 Recent Transactions</h3>
            <Link to="/admin/orders" className="card-action-link">
              View All History →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-muted p-4">No recent transactions found.</p>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map((order) => (
                <div key={order._id} className="recent-order-item">
                  <div>
                    <div className="order-number-row">
                      <span className="order-num">{order.orderNumber}</span>
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <span className="order-meta">
                      {order.orderType?.toUpperCase()}
                      {order.table?.name ? ` • ${order.table.name}` : ''} •{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="order-amount">
                    Rs. {(order.total || order.grandTotal || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
