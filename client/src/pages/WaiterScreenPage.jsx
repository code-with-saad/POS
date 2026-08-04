import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import SideDrawer from '../components/SideDrawer.jsx';

export default function WaiterScreenPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | ready | served
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/orders');
      // Filter orders relevant for Waiter Screen (ready or served)
      const waiterOrders = (data || []).filter((o) => ['ready', 'served'].includes(o.status));
      setOrders(waiterOrders);
    } catch (err) {
      if (!silent) showToast('error', err.message || 'Failed to fetch waiter orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function handleUpdateStatus(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      showToast('success', `Order status updated to ${newStatus.toUpperCase()}!`);
      fetchOrders(true);
    } catch (err) {
      showToast('error', err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ready') return o.status === 'ready';
    if (filter === 'served') return o.status === 'served';
    return true;
  });

  return (
    <div className={`page-container ${drawerOpen ? 'pos-drawer-active' : ''}`}>
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} currentPage="Waiter Terminal" />

      {/* Header */}
      <div className="page-header flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => setDrawerOpen(true)} title="Open navigation menu">
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">room_service</span> Waiter Service Terminal
            </h1>
            <p className="page-subtitle">Real-time ready orders &amp; table delivery management (Auto-refreshes every 4s)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-1" onClick={() => fetchOrders(false)}>
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="report-filters mb-6 flex flex-wrap gap-2">
        <button
          className={`report-preset-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Ready &amp; Served ({orders.length})
        </button>
        <button
          className={`report-preset-btn ${filter === 'ready' ? 'active' : ''}`}
          onClick={() => setFilter('ready')}
        >
          🔔 Ready for Pickup ({orders.filter((o) => o.status === 'ready').length})
        </button>
        <button
          className={`report-preset-btn ${filter === 'served' ? 'active' : ''}`}
          onClick={() => setFilter('served')}
        >
          🍽️ Currently Served ({orders.filter((o) => o.status === 'served').length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading ready orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined text-5xl text-slate-500 mb-2">check_circle</span>
          <h2>No orders waiting for service</h2>
          <p>When the kitchen finishes preparing food, ready orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((ord) => {
            const isReady = ord.status === 'ready';
            const isDineIn = ord.orderType === 'dine-in';
            const tableName = ord.table?.name ? `${ord.table.name} (${ord.table.section || 'Hall'})` : 'No Table';

            return (
              <div
                key={ord._id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isReady
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-700/60'
                }`}
              >
                {/* Header info */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-lg">#{ord.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-xs uppercase font-semibold bg-slate-800 text-slate-300">
                        {ord.orderType}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                        isReady ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {isReady ? '🔔 READY' : '🍽️ SERVED'}
                    </span>
                  </div>

                  {/* Table Badge */}
                  {isDineIn && (
                    <div className="mb-3 p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-sm">
                      <span className="text-slate-400 font-medium">Location:</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">table_restaurant</span> {tableName}
                      </span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
                    {ord.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-sm p-2 rounded bg-slate-950/50 border border-slate-800">
                        <div>
                          <span className="font-bold text-slate-200">{item.quantity}x</span>{' '}
                          <span className="font-semibold text-slate-100">{item.name}</span>
                          {item.variant && <span className="text-xs text-amber-400 block font-mono">Size: {item.variant}</span>}
                          {item.notes && <span className="text-xs text-slate-400 italic block">Note: {item.notes}</span>}
                        </div>
                        <span className="text-xs text-slate-400 font-mono mt-0.5">
                          {currency} {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-400">Total Bill</span>
                    <span className="text-emerald-400 font-bold text-base">{currency} {(ord.total || 0).toLocaleString()}</span>
                  </div>

                  {isReady ? (
                    <button
                      className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md"
                      onClick={() => handleUpdateStatus(ord._id, 'served')}
                      disabled={updatingId === ord._id}
                    >
                      <span className="material-symbols-outlined">room_service</span>
                      {updatingId === ord._id ? 'Updating...' : 'Mark as Served'}
                    </button>
                  ) : (
                    <button
                      className="btn-secondary w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold hover:bg-slate-800"
                      onClick={() => handleUpdateStatus(ord._id, 'completed')}
                      disabled={updatingId === ord._id}
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {updatingId === ord._id ? 'Updating...' : 'Complete Ticket'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
