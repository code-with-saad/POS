import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function InventoryPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [stockReason, setStockReason] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'General',
    unit: 'pcs',
    quantity: 0,
    minStockAlert: 5,
    costPrice: 0,
    notes: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const data = await api.get('/inventory');
      setItems(data);
    } catch (err) {
      showToast('error', err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd() {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      category: 'General',
      unit: 'pcs',
      quantity: 0,
      minStockAlert: 5,
      costPrice: 0,
      notes: '',
    });
    setShowModal(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      category: item.category || 'General',
      unit: item.unit || 'pcs',
      quantity: item.quantity,
      minStockAlert: item.minStockAlert,
      costPrice: item.costPrice || 0,
      notes: item.notes || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem._id}`, formData);
        showToast('success', 'Inventory item updated!');
      } else {
        await api.post('/inventory', formData);
        showToast('success', 'Inventory item created!');
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      showToast('error', err.message || 'Failed to save item');
    }
  }

  async function handleAdjustStockSubmit(e) {
    e.preventDefault();
    if (!stockItem || stockAdjustment === 0) return;
    try {
      await api.patch(`/inventory/${stockItem._id}/stock`, {
        adjustment: Number(stockAdjustment),
        reason: stockReason,
      });
      showToast('success', 'Stock quantity adjusted!');
      setShowStockModal(false);
      fetchInventory();
    } catch (err) {
      showToast('error', err.message || 'Failed to adjust stock');
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete ${item.name} from inventory?`)) return;
    try {
      await api.delete(`/inventory/${item._id}`);
      showToast('success', 'Item removed from inventory');
      fetchInventory();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete item');
    }
  }

  const categories = Array.from(new Set(items.map((i) => i.category || 'General')));

  const filtered = items.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !categoryFilter || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minStockAlert).length;
  const totalAssetValue = items.reduce((sum, i) => sum + i.quantity * (i.costPrice || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">inventory_2</span> Inventory &amp; Stock
          </h1>
          <p className="page-subtitle">Track raw materials, stock levels, and min-stock alerts</p>
        </div>
        <button className="btn-primary flex items-center gap-1" onClick={handleOpenAdd}>
          <span className="material-symbols-outlined text-sm">add</span> Add Stock Item
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="dashboard-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon text-amber-500">
            <span className="material-symbols-outlined text-3xl">inventory</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Total Stock Items</span>
          </div>
        </div>

        <div className="stat-card" style={lowStockCount > 0 ? { border: '1px solid var(--color-error)' } : {}}>
          <div className="stat-icon" style={{ color: lowStockCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
            <span className="material-symbols-outlined text-3xl">{lowStockCount > 0 ? 'warning' : 'check_circle'}</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{lowStockCount}</span>
            <span className="stat-label">Low Stock Alerts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon text-emerald-400">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{currency} {totalAssetValue.toLocaleString()}</span>
            <span className="stat-label">Total Inventory Asset Value</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="report-filters">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="settings-input"
          style={{ maxWidth: '300px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="settings-input"
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading inventory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
          <h2>No inventory items found</h2>
          <p>Click "Add Stock Item" above to add your first stock item.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / SKU</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Min Alert</th>
                  <th>Cost Price</th>
                  <th>Asset Value</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.minStockAlert;
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                          {item.sku && <span className="text-xs text-muted font-mono">SKU: {item.sku}</span>}
                        </div>
                      </td>
                      <td><span className="category-pill">{item.category}</span></td>
                      <td>
                        <span className="font-bold text-lg">{item.quantity}</span>{' '}
                        <span className="text-xs text-muted">{item.unit}</span>
                      </td>
                      <td>{item.minStockAlert} {item.unit}</td>
                      <td>{currency} {item.costPrice}</td>
                      <td className="price-cell">{currency} {(item.quantity * item.costPrice).toLocaleString()}</td>
                      <td>
                        {isLow ? (
                          <span className="status-pill badge-status-cancelled flex items-center gap-1 w-fit">
                            <span className="material-symbols-outlined text-xs">warning</span> LOW STOCK
                          </span>
                        ) : (
                          <span className="status-pill badge-status-completed flex items-center gap-1 w-fit">
                            <span className="material-symbols-outlined text-xs">check</span> IN STOCK
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            className="btn-secondary text-xs flex items-center gap-1"
                            onClick={() => {
                              setStockItem(item);
                              setStockAdjustment(0);
                              setStockReason('');
                              setShowStockModal(true);
                            }}
                            title="Adjust Stock (+ / -)"
                          >
                            <span className="material-symbols-outlined text-xs">tune</span> Stock
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Item"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDelete(item)}
                            title="Delete Item"
                          >
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Inventory Item' : 'Add Stock Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Milk (Full Cream)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>SKU / Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g. MLK-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy, Packaging, Spices"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Measurement Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="l">l (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Min Stock Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Cost Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes / Description</label>
                <textarea
                  rows="2"
                  placeholder="Optional notes or storage instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingItem ? 'Update Item' : 'Save Stock Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showStockModal && stockItem && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Adjust Stock — {stockItem.name}</h3>
              <button className="modal-close" onClick={() => setShowStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjustStockSubmit} className="modal-form">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded text-sm mb-2">
                Current Stock: <strong className="text-amber-400">{stockItem.quantity} {stockItem.unit}</strong>
              </div>

              <div className="form-group">
                <label>Quantity Adjustment (+ for add, - for subtract)</label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="e.g. +10 or -5"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(e.target.value)}
                />
                <span className="text-xs text-muted">New Quantity will be: <strong>{Math.max(0, stockItem.quantity + Number(stockAdjustment || 0))} {stockItem.unit}</strong></span>
              </div>

              <div className="form-group">
                <label>Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Restock shipment, Damaged, Spoilage"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
