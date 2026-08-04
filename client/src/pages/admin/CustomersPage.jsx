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

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

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
            <span className="material-symbols-outlined text-amber-500">person</span> Customer Directory
          </h1>
          <p className="page-subtitle">Manage customer profiles, contact information, and order history (Auto-refreshes every 5s)</p>
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
                  <th>Email</th>
                  <th>Address</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar-sm">{c.name[0].toUpperCase()}</div>
                        <span className="font-semibold">{c.name}</span>
                      </div>
                    </td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.address || '—'}</td>
                    <td><span className="font-bold">{c.totalOrders || 0}</span></td>
                    <td className="price-cell">{currency} {(c.totalSpent || 0).toLocaleString()}</td>
                    <td className="text-right">
                      <div className="action-buttons-group">
                        <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Edit">
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(c)} title="Delete">
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </div>
  );
}
