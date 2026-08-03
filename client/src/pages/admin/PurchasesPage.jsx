import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function PurchasesPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: '',
    paidAmount: 0,
    notes: '',
    items: [{ itemName: '', quantity: 1, unit: 'pcs', unitCost: 0 }],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [pData, sData, iData] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/inventory'),
      ]);
      setPurchases(pData);
      setSuppliers(sData);
      setInventory(iData);
    } catch (err) {
      showToast('error', err.message || 'Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  }

  function handleAddItemRow() {
    setFormData((f) => ({
      ...f,
      items: [...f.items, { itemName: '', quantity: 1, unit: 'pcs', unitCost: 0 }],
    }));
  }

  function handleRemoveItemRow(index) {
    setFormData((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  }

  function handleUpdateItem(index, field, value) {
    setFormData((f) => {
      const updated = [...f.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, items: updated };
    });
  }

  function handleSelectInventoryItem(index, invItemName) {
    const matched = inventory.find((i) => i.name === invItemName);
    setFormData((f) => {
      const updated = [...f.items];
      updated[index] = {
        ...updated[index],
        itemName: invItemName,
        unit: matched ? matched.unit : 'pcs',
        unitCost: matched ? matched.costPrice : 0,
      };
      return { ...f, items: updated };
    });
  }

  const calculatedTotal = formData.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.supplierId) {
      showToast('error', 'Please select a supplier');
      return;
    }
    try {
      await api.post('/purchases', {
        ...formData,
        totalAmount: calculatedTotal,
      });
      showToast('success', 'Purchase order recorded & stock updated!');
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      showToast('error', err.message || 'Failed to record purchase');
    }
  }

  async function handleResetBook(e) {
    e.preventDefault();
    if (confirmText !== 'RESET') {
      showToast('error', 'Please type RESET in capital letters');
      return;
    }
    try {
      setResetting(true);
      await api.post('/purchases/reset-book', { confirmText });
      showToast('success', 'New accounting book started! Sales & purchases reset.');
      setShowResetModal(false);
      setConfirmText('');
      fetchInitialData();
    } catch (err) {
      showToast('error', err.message || 'Failed to reset book');
    } finally {
      setResetting(false);
    }
  }

  const totalPurchaseExpenses = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">shopping_cart</span> Purchasing &amp; Expense Entry
          </h1>
          <p className="page-subtitle">Record raw material purchase orders from vendors and update stock</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs text-red-400 flex items-center gap-1 border-red-500/40 hover:bg-red-500/10" onClick={() => setShowResetModal(true)}>
            <span className="material-symbols-outlined text-sm">restart_alt</span> Start New Book (Reset)
          </button>
          <button className="btn-primary flex items-center gap-1" onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined text-sm">add_shopping_cart</span> New Purchase Order
          </button>
        </div>
      </div>

      <div className="dashboard-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon text-amber-500">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{purchases.length}</span>
            <span className="stat-label">Total Purchase Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon text-emerald-400">
            <span className="material-symbols-outlined text-3xl">account_balance</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{currency} {totalPurchaseExpenses.toLocaleString()}</span>
            <span className="stat-label">Total Purchasing Expenses</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
          <h2>No purchase orders yet</h2>
          <p>Click "New Purchase Order" above to record vendor purchases and auto-update stock.</p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td><span className="user-badge-code">{p.purchaseNumber}</span></td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="font-semibold">{p.supplier?.name || 'Unknown'}</td>
                    <td>
                      <div className="flex flex-col text-xs gap-0.5">
                        {p.items.map((it, idx) => (
                          <span key={idx}>• {it.itemName} ({it.quantity} {it.unit} @ {currency}{it.unitCost})</span>
                        ))}
                      </div>
                    </td>
                    <td className="price-cell">{currency} {p.totalAmount.toLocaleString()}</td>
                    <td>{currency} {p.paidAmount.toLocaleString()}</td>
                    <td>
                      {p.paymentStatus === 'paid' ? (
                        <span className="status-pill badge-status-completed">PAID</span>
                      ) : p.paymentStatus === 'partial' ? (
                        <span className="status-pill badge-status-pending">PARTIAL</span>
                      ) : (
                        <span className="status-pill badge-status-cancelled">UNPAID</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>New Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Supplier *</label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                >
                  <option value="">-- Choose Vendor --</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.categoryProvided || 'Vendor'})</option>
                  ))}
                </select>
              </div>

              {/* Purchase Items List */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-amber-400">Purchased Items *</label>
                  <button type="button" className="btn-secondary text-xs" onClick={handleAddItemRow}>
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-wrap bg-zinc-900/50 p-2 rounded border border-zinc-800">
                      <select
                        className="flex-2 text-sm"
                        value={row.itemName}
                        onChange={(e) => handleSelectInventoryItem(idx, e.target.value)}
                      >
                        <option value="">-- Select from Inventory or Type below --</option>
                        {inventory.map((inv) => (
                          <option key={inv._id} value={inv.name}>{inv.name} ({inv.quantity} {inv.unit} in stock)</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Item Name"
                        required
                        value={row.itemName}
                        onChange={(e) => handleUpdateItem(idx, 'itemName', e.target.value)}
                        className="flex-2 text-sm"
                      />

                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        min="0.01"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="w-20 text-sm"
                      />

                      <input
                        type="text"
                        placeholder="Unit"
                        value={row.unit}
                        onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                        className="w-20 text-sm"
                      />

                      <input
                        type="number"
                        placeholder="Cost Price"
                        required
                        min="0"
                        step="any"
                        value={row.unitCost}
                        onChange={(e) => handleUpdateItem(idx, 'unitCost', e.target.value)}
                        className="w-24 text-sm"
                      />

                      {formData.items.length > 1 && (
                        <button type="button" className="btn-icon btn-icon-danger" onClick={() => handleRemoveItemRow(idx)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded">
                <span className="font-bold">Total Order Amount:</span>
                <span className="text-xl font-extrabold text-amber-400">{currency} {calculatedTotal.toLocaleString()}</span>
              </div>

              <div className="form-group">
                <label>Amount Paid Now ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                />
                <span className="text-xs text-muted">Unpaid balance ({currency} {Math.max(0, calculatedTotal - Number(formData.paidAmount || 0)).toLocaleString()}) will be added to vendor balance.</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm &amp; Record PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start New Book (Reset) Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header border-b border-red-500/40">
              <h3 className="text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined">warning</span> Start New Accounting Book
              </h3>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>✕</button>
            </div>
            <form onSubmit={handleResetBook} className="modal-form">
              <div className="bg-red-500/15 border border-red-500/40 p-3 rounded text-sm text-red-300">
                <strong>Warning!</strong> Starting a new book will clear all past sales, completed orders, and purchase records so the owner can start a fresh accounting period. Categories and Menu Items will remain intact.
              </div>

              <div className="form-group">
                <label>Type <strong>RESET</strong> in capital letters to confirm:</label>
                <input
                  type="text"
                  required
                  placeholder="RESET"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 text-white" disabled={resetting || confirmText !== 'RESET'}>
                  {resetting ? 'Resetting Book…' : 'Yes, Start New Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
