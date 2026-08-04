import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function CustomersPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Order History Modal State
  const [historyCust, setHistoryCust] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settle Balance Modal State
  const [settleCust, setSettleCust] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    fetchCustomers();
    const interval = setInterval(() => {
      fetchCustomers(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchCustomers(silent = false) {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      if (!silent) showToast('error', err.message || 'Failed to load customers');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleOpenAdd() {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setShowModal(true);
  }

  function handleOpenEdit(c) {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, formData);
        showToast('success', 'Customer updated!');
      } else {
        await api.post('/customers', formData);
        showToast('success', 'Customer added!');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      showToast('error', err.message || 'Failed to save customer');
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete customer ${c.name}?`)) return;
    try {
      await api.delete(`/customers/${c._id}`);
      showToast('success', 'Customer deleted');
      fetchCustomers();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete customer');
    }
  }

  // Fetch & Open Order History Modal
  async function handleOpenHistory(c) {
    setHistoryCust(c);
    setLoadingHistory(true);
    try {
      const orders = await api.get(`/customers/${c._id}/orders`);
      setHistoryOrders(orders);
    } catch (err) {
      showToast('error', err.message || 'Failed to load order history');
    } finally {
      setLoadingHistory(false);
    }
  }

  // Open Settle Balance Modal
  function handleOpenSettle(c) {
    setSettleCust(c);
    setPayAmount(c.receivableBalance || '');
    setPayMethod('cash');
    setPayNote('');
  }

  // Submit Payment Settlement
  async function handleSettlePayment(e) {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      showToast('error', 'Please enter a valid payment amount');
      return;
    }
    setSubmittingPay(true);
    try {
      await api.post(`/customers/${settleCust._id}/payments`, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        note: payNote,
      });
      showToast('success', `Payment of ${currency} ${Number(payAmount).toLocaleString()} recorded!`);
      setSettleCust(null);
      fetchCustomers();
    } catch (err) {
      showToast('error', err.message || 'Failed to record payment');
    } finally {
      setSubmittingPay(false);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">person</span> Customer Directory &amp; Accounts
          </h1>
          <p className="page-subtitle">Manage customer profiles, tab/receivable balances, and view order history (Auto-refreshes every 5s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-1" onClick={() => fetchCustomers(false)} title="Refresh Customers">
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span> Refresh
          </button>
          <button className="btn-primary flex items-center gap-1" onClick={handleOpenAdd}>
            <span className="material-symbols-outlined text-sm">person_add</span> Add Customer
          </button>
        </div>
      </div>

      <div className="report-filters mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="settings-input"
          style={{ maxWidth: '340px' }}
        />
      </div>

      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading customer directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
          <h2>No customers found</h2>
          <p>Click "Add Customer" above to register a new customer profile.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Balance Due (Receivable)</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const bal = c.receivableBalance || 0;
                  return (
                    <tr key={c._id}>
                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar-sm">{c.name[0].toUpperCase()}</div>
                          <div>
                            <span className="font-semibold block">{c.name}</span>
                            <span className="text-xs text-slate-400">{c.phone || c.email || 'No contact'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{c.phone || '—'}</td>
                      <td><span className="font-bold">{c.totalOrders || 0}</span></td>
                      <td className="price-cell">{currency} {(c.totalSpent || 0).toLocaleString()}</td>
                      <td>
                        {bal > 0 ? (
                          <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {currency} {bal.toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Cleared ({currency} 0)
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group flex items-center justify-end gap-1">
                          <button
                            className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                            onClick={() => handleOpenHistory(c)}
                            title="View Order History"
                          >
                            <span className="material-symbols-outlined text-xs">history</span> Orders
                          </button>
                          <button
                            className={`btn-primary text-xs px-2 py-1 flex items-center gap-1 ${
                              bal > 0 ? 'bg-emerald-600 hover:bg-emerald-500' : 'opacity-60'
                            }`}
                            onClick={() => handleOpenSettle(c)}
                            title="Receive Payment / Settle Balance"
                          >
                            <span className="material-symbols-outlined text-xs">payments</span> Settle
                          </button>
                          <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Edit Profile">
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                          <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(c)} title="Delete Profile">
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saad Kashif"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 0300-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  placeholder="Street / Delivery Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Special preferences or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingCustomer ? 'Update Customer' : 'Save Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {historyCust && (
        <div className="modal-overlay">
          <div className="modal-card max-w-3xl w-full">
            <div className="modal-header">
              <div>
                <h3 className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">history</span>
                  Order History: {historyCust.name}
                </h3>
                <p className="text-xs text-slate-400">Total Orders: {historyCust.totalOrders || 0} | Total Spent: {currency} {(historyCust.totalSpent || 0).toLocaleString()}</p>
              </div>
              <button className="modal-close" onClick={() => setHistoryCust(null)}>✕</button>
            </div>

            <div className="modal-body p-4 max-h-[480px] overflow-y-auto">
              {loadingHistory ? (
                <div className="p-8 text-center text-slate-400">Loading order history...</div>
              ) : historyOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No orders recorded for this customer yet.</div>
              ) : (
                <div className="space-y-3">
                  {historyOrders.map((ord) => (
                    <div key={ord._id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">#{ord.orderNumber}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 capitalize text-slate-300">{ord.orderType}</span>
                          <span className={`text-xs px-2 py-0.5 rounded capitalize font-semibold ${
                            ord.paymentMethod === 'credit' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {ord.paymentMethod === 'credit' ? 'Credit Tab' : ord.paymentMethod}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(ord.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        {ord.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}</span>
                            <span>{currency} {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-700/40 text-sm font-bold">
                        <span className="text-slate-400 text-xs">Total Amount</span>
                        <span className="text-emerald-400">{currency} {(ord.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions p-4 border-t border-slate-700/60">
              <button className="btn-secondary" onClick={() => setHistoryCust(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Balance Modal */}
      {settleCust && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">payments</span>
                Settle Balance: {settleCust.name}
              </h3>
              <button className="modal-close" onClick={() => setSettleCust(null)}>✕</button>
            </div>
            <form onSubmit={handleSettlePayment} className="modal-form">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm mb-3">
                Current Due Balance: <strong>{currency} {(settleCust.receivableBalance || 0).toLocaleString()}</strong>
              </div>

              <div className="form-group">
                <label>Payment Amount Received ({currency}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={settleCust.receivableBalance || undefined}
                  placeholder="Enter amount customer is paying..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="settings-input">
                  <option value="cash">Cash</option>
                  <option value="card">Card / Digital</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared daily bill via Cash"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setSettleCust(null)}>Cancel</button>
                <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-500" disabled={submittingPay}>
                  {submittingPay ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>

            {/* Previous Payment History for Customer */}
            {settleCust.paymentHistory?.length > 0 && (
              <div className="p-4 border-t border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recent Settlement History</h4>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {settleCust.paymentHistory.slice().reverse().map((ph, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-800/80">
                      <div>
                        <span className="font-semibold text-emerald-400">{currency} {ph.amount.toLocaleString()}</span>
                        <span className="text-slate-400 ml-2">({ph.paymentMethod})</span>
                        {ph.note && <span className="text-slate-400 block text-[11px]">{ph.note}</span>}
                      </div>
                      <span className="text-slate-500 text-[11px]">{new Date(ph.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
