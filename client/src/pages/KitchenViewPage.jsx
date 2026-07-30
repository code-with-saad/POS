import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function KitchenViewPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchActiveOrders(true);
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchActiveOrders(silent = false) {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/orders');
      // Kitchen view focuses on active non-completed, non-cancelled orders
      const active = data.filter(
        (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'served'
      );
      setOrders(active);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to refresh kitchen orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      const updated = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => {
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          return prev.filter((o) => o._id !== orderId);
        }
        return prev.map((o) => (o._id === orderId ? updated : o));
      });
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  }

  function getMinutesAgo(dateString) {
    const diffMs = new Date() - new Date(dateString);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  }

  return (
    <div className="kitchen-app">
      {/* Top KDS Bar */}
      <header className="kitchen-header">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍🍳</span>
          <div>
            <h1 className="text-xl font-bold text-amber-400">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-zinc-400">Live order queue for kitchen &amp; prep staff</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-amber-500 w-4 h-4"
            />
            Auto-refresh (10s)
          </label>

          <span className="text-xs text-zinc-500 font-mono">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>

          <button className="btn-secondary text-xs" onClick={() => fetchActiveOrders()}>
            🔄 Refresh
          </button>

          <Link to="/pos" className="btn-primary text-xs">
            ⬅️ Return to POS
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-error mx-6 mt-4">{error}</div>}

      {/* Main Tickets Board */}
      <main className="kitchen-main">
        {loading ? (
          <div className="loading-state flex-1">
            <div className="btn-spinner" />
            <p>Loading active kitchen tickets...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state flex-1">
            <span className="empty-icon">🍳</span>
            <h2>Kitchen Queue Clear!</h2>
            <p>No pending or preparing orders at the moment.</p>
          </div>
        ) : (
          <div className="kitchen-tickets-grid">
            {orders.map((order) => {
              const isPending = order.status === 'pending';
              const isPreparing = order.status === 'preparing';
              const isServed = order.status === 'served';

              return (
                <div
                  key={order._id}
                  className={`kitchen-ticket ${
                    isPending
                      ? 'ticket-pending'
                      : isPreparing
                      ? 'ticket-preparing'
                      : 'ticket-served'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="ticket-header">
                    <div>
                      <span className="ticket-order-no">#{order.orderNumber}</span>
                      <span className="ticket-time-ago">
                        ⏱️ {getMinutesAgo(order.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`status-pill ${
                        isPending
                          ? 'badge-status-pending'
                          : isPreparing
                          ? 'badge-status-preparing'
                          : 'badge-status-served'
                      }`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Order Type & Table */}
                  <div className="ticket-sub-header">
                    <span className="uppercase font-bold text-amber-300">
                      {order.orderType}
                    </span>
                    {order.table && (
                      <span className="font-bold text-white">
                        📍 Table {order.table.name}
                      </span>
                    )}
                  </div>

                  {/* Itemized Kitchen Lines */}
                  <div className="ticket-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="ticket-item-row">
                        <span className="ticket-qty">{item.quantity}x</span>
                        <div className="flex-1">
                          <span className="ticket-item-name">{item.name}</span>
                          {item.notes && (
                            <span className="ticket-item-note">
                              ⚠️ Note: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Action Footer */}
                  <div className="ticket-footer">
                    {isPending && (
                      <button
                        className="btn-ticket btn-ticket-prep"
                        onClick={() => handleStatusUpdate(order._id, 'preparing')}
                      >
                        🍳 Start Preparing
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        className="btn-ticket btn-ticket-serve"
                        onClick={() => handleStatusUpdate(order._id, 'served')}
                      >
                        🍽️ Mark Ready / Served
                      </button>
                    )}

                    {isServed && (
                      <button
                        className="btn-ticket btn-ticket-complete"
                        onClick={() => handleStatusUpdate(order._id, 'completed')}
                      >
                        ✅ Complete Ticket
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
