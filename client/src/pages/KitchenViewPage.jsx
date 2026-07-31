import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import SideDrawer from '../components/SideDrawer.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function KitchenViewPage() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Determine back destination and label
  const backState = location.state?.from;
  const backPath = backState?.path || '/pos';
  const backLabel = backState?.label ? `Return to ${backState.label}` : 'Return to POS';

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
    } catch (err) {
      showToast('error', err.message || 'Failed to refresh kitchen orders');
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
      showToast('error', err.message || 'Failed to update status');
    }
  }

  function getMinutesAgo(dateString) {
    const diffMs = new Date() - new Date(dateString);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  }

  return (
    <div className={`kitchen-app${drawerOpen ? ' pos-drawer-active' : ''}`}>
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} currentPage="Kitchen View" />

      {/* Top KDS Bar */}
      <header className="kitchen-header">
        <div className="flex items-center gap-3">
          <button
            className="pos-hamburger pos-hamburger--kitchen"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <span /><span /><span />
          </button>
          <span className="text-3xl">👨‍🍳</span>
          <div>
            <h1 className="text-xl font-bold text-amber-400">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-zinc-400">Live order queue for kitchen &amp; prep staff</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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

          <button className="btn-secondary text-xs" onClick={() => navigate(backPath)}>
            ⬅️ {backLabel}
          </button>

          <Link to="/admin" className="btn-primary text-xs">
            📊 Admin Dashboard
          </Link>
        </div>
      </header>


      {/* Main Tickets Board */}
      <main className="kitchen-main">
        {loading ? (
          <div className="page-spinner-overlay" style={{ position: 'relative', minHeight: '200px' }}>
            <div className="page-spinner" />
            <p className="page-spinner-text">Loading kitchen tickets…</p>
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
                    {(() => {
                      const maxRound = Math.max(...order.items.map((i) => i.round || 1));
                      const hasMultipleRounds = maxRound > 1;

                      return order.items.map((item, idx) => {
                        const isLatestRound = hasMultipleRounds && (item.round || 1) === maxRound;
                        return (
                          <div
                            key={idx}
                            className={`ticket-item-row ${
                              isLatestRound ? 'bg-amber-500/20 p-1.5 rounded border border-amber-500/40' : ''
                            }`}
                          >
                            <span className="ticket-qty">{item.quantity}x</span>
                            <div className="flex-1">
                              <span className="ticket-item-name">
                                {item.name}
                                {item.variant && (
                                  <span className="ml-1 text-xs px-1 py-0.5 rounded bg-zinc-800 text-amber-300 font-semibold">
                                    {item.variant}
                                  </span>
                                )}
                                {isLatestRound && (
                                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold animate-pulse">
                                    NEW ADDITION (R{item.round})
                                  </span>
                                )}
                              </span>
                              {item.notes && (
                                <span className="ticket-item-note">
                                  ⚠️ Note: {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
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
