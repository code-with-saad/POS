import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function OrdersHistoryPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, typeFilter, dateFilter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('orderType', typeFilter);
      if (dateFilter) params.append('date', dateFilter);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get(`/orders${queryString}`);
      setOrders(data);
    } catch (err) {
      showToast('error', err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      setUpdating(true);
      const updated = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? updated : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'pending': return 'badge-status-pending';
      case 'preparing': return 'badge-status-preparing';
      case 'served': return 'badge-status-served';
      case 'completed': return 'badge-status-completed';
      case 'cancelled': return 'badge-status-cancelled';
      default: return '';
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Order History &amp; Logs</h1>
          <p className="page-subtitle">Track, filter, and inspect all customer orders</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders}>
          🔄 Refresh Orders
        </button>
      </header>


      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="flex gap-3 flex-wrap">
          <select
            className="search-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="search-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="dine-in">Dine-In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>

          <input
            type="date"
            className="search-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {(statusFilter || typeFilter || dateFilter) && (
            <button
              className="btn-secondary text-xs"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setDateFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" />
          <p>Loading order records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🧾</span>
          <h3>No orders found</h3>
          <p>No transactions recorded matching the selected criteria.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date / Time</th>
                <th>Type &amp; Table</th>
                <th>Items Summary</th>
                <th>Total (PKR)</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="font-mono font-bold text-amber-400">
                    #{order.orderNumber}
                  </td>
                  <td className="text-muted text-xs">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className="font-semibold uppercase text-xs">
                      {order.orderType}
                    </span>
                    {order.table && (
                      <span className="text-muted text-xs block">
                        📍 {order.table.name} ({order.table.section})
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-sm">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </span>
                  </td>
                  <td className="price-cell">Rs. {order.total.toLocaleString()}</td>
                  <td>
                    <span className="text-xs uppercase font-semibold text-zinc-300">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusBadgeClass(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      className="btn-icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      👁️ View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div>
                <h3>Order #{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-muted">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="modal-form">
              {/* Top Info Grid */}
              <div className="form-grid text-sm">
                <div>
                  <span className="text-muted block text-xs uppercase">Order Type</span>
                  <span className="font-bold uppercase">{selectedOrder.orderType}</span>
                  {selectedOrder.table && (
                    <span className="text-muted block">Table: {selectedOrder.table.name}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted block text-xs uppercase">Cashier</span>
                  <span className="font-semibold">{selectedOrder.cashier?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted block text-xs uppercase">Payment Method</span>
                  <span className="font-semibold uppercase">{selectedOrder.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted block text-xs uppercase">Current Status</span>
                  <span className={`status-pill ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 my-2">
                <span className="text-xs text-muted block mb-2 font-semibold uppercase">Update Order Status:</span>
                <div className="flex gap-2 flex-wrap">
                  {selectedOrder.status !== 'preparing' && selectedOrder.status !== 'completed' && (
                    <button
                      className="btn-secondary text-xs"
                      disabled={updating}
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'preparing')}
                    >
                      🍳 Mark Preparing
                    </button>
                  )}
                  {selectedOrder.status !== 'served' && selectedOrder.status !== 'completed' && (
                    <button
                      className="btn-secondary text-xs text-amber-400 border-amber-500/30"
                      disabled={updating}
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'served')}
                    >
                      🍽️ Mark Served
                    </button>
                  )}
                  {selectedOrder.status !== 'completed' && (
                    <button
                      className="btn-primary text-xs"
                      disabled={updating}
                      onClick={() => handleStatusUpdate(selectedOrder._id, 'completed')}
                    >
                      ✅ Mark Completed
                    </button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                    <button
                      className="btn-icon btn-icon-danger text-xs"
                      disabled={updating}
                      onClick={() => {
                        if (window.confirm('Cancel this order? Table will be freed if assigned.')) {
                          handleStatusUpdate(selectedOrder._id, 'cancelled');
                        }
                      }}
                    >
                      🚫 Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Itemized Line Items */}
              <div className="table-card my-2">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="font-semibold text-white">{item.name}</span>
                          {item.notes && (
                            <span className="text-xs text-amber-300 block font-mono">
                              Note: {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">Rs. {item.price}</td>
                        <td className="text-right font-semibold text-emerald-400">
                          Rs. {item.price * item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-1 items-end text-sm pt-2 border-t border-zinc-800">
                <div className="flex justify-between w-48 text-muted">
                  <span>Subtotal:</span>
                  <span>Rs. {selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between w-48 text-muted">
                    <span>Discount:</span>
                    <span>-Rs. {selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 text-muted">
                  <span>Tax:</span>
                  <span>Rs. {selectedOrder.tax}</span>
                </div>
                <div className="flex justify-between w-48 font-bold text-amber-400 text-lg pt-1 border-t border-zinc-700">
                  <span>Grand Total:</span>
                  <span>Rs. {selectedOrder.total}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
