import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function SuppliersPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    categoryProvided: '',
    balance: 0,
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      setLoading(true);
      const data = await api.get('/suppliers');
      setSuppliers(data);
    } catch (err) {
      showToast('error', err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd() {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      categoryProvided: '',
      balance: 0,
      notes: '',
    });
    setShowModal(true);
  }

  function handleOpenEdit(s) {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      categoryProvided: s.categoryProvided || '',
      balance: s.balance || 0,
      notes: s.notes || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier._id}`, formData);
        showToast('success', 'Supplier updated!');
      } else {
        await api.post('/suppliers', formData);
        showToast('success', 'Supplier created!');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      showToast('error', err.message || 'Failed to save supplier');
    }
  }

  async function handleDelete(s) {
    if (!window.confirm(`Delete supplier ${s.name}?`)) return;
    try {
      await api.delete(`/suppliers/${s._id}`);
      showToast('success', 'Supplier deleted');
      fetchSuppliers();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete supplier');
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (s.categoryProvided && s.categoryProvided.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOwed = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">local_shipping</span> Supplier Management
          </h1>
          <p className="page-subtitle">Manage vendors, suppliers, supplied categories, and payable balances</p>
        </div>
        <button className="btn-primary flex items-center gap-1" onClick={handleOpenAdd}>
          <span className="material-symbols-outlined text-sm">add_business</span> Add Supplier
        </button>
      </div>

      <div className="dashboard-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon text-amber-500">
            <span className="material-symbols-outlined text-3xl">store</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{suppliers.length}</span>
            <span className="stat-label">Active Suppliers</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon text-red-400">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{currency} {totalOwed.toLocaleString()}</span>
            <span className="stat-label">Total Payable Balance</span>
          </div>
        </div>
      </div>

      <div className="report-filters mb-4">
        <input
          type="text"
          placeholder="Search by vendor name, contact person, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="settings-input"
          style={{ maxWidth: '360px' }}
        />
      </div>

      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading suppliers list...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined text-4xl mb-2">domain_disabled</span>
          <h2>No suppliers found</h2>
          <p>Click "Add Supplier" above to register your raw material vendors.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor / Company</th>
                  <th>Contact Person</th>
                  <th>Phone / Email</th>
                  <th>Category Provided</th>
                  <th>Payable Balance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold">{s.name}</span>
                        {s.address && <span className="text-xs text-muted">{s.address}</span>}
                      </div>
                    </td>
                    <td>{s.contactPerson || '—'}</td>
                    <td>
                      <div className="flex flex-col text-xs">
                        {s.phone && <span>📞 {s.phone}</span>}
                        {s.email && <span className="text-muted">✉️ {s.email}</span>}
                        {!s.phone && !s.email && <span>—</span>}
                      </div>
                    </td>
                    <td><span className="category-pill">{s.categoryProvided || 'General'}</span></td>
                    <td className="price-cell font-bold">{currency} {(s.balance || 0).toLocaleString()}</td>
                    <td className="text-right">
                      <div className="action-buttons-group">
                        <button className="btn-icon" onClick={() => handleOpenEdit(s)} title="Edit">
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(s)} title="Delete">
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
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Company / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Wholesale / Dairy Fresh"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ali Raza (Sales Manager)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0321-9876543"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. sales@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Items / Category Provided</label>
                  <input
                    type="text"
                    placeholder="e.g. Milk, Meat, Packaging"
                    value={formData.categoryProvided}
                    onChange={(e) => setFormData({ ...formData, categoryProvided: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Payable Balance ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Office / Warehouse Address</label>
                <input
                  type="text"
                  placeholder="Physical address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="2"
                  placeholder="Payment terms, delivery days, etc..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
