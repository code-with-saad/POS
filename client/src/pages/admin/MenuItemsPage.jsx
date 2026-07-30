import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import ItemVisual from '../../components/ItemVisual.jsx';

export default function MenuItemsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchItems(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedCategory]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [catsData, itemsData] = await Promise.all([
        api.get('/categories'),
        api.get('/menu-items'),
      ]);
      setCategories(catsData);
      setItems(itemsData);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems(silent = false) {
    try {
      const data = await api.get(
        selectedCategory ? `/menu-items?category=${selectedCategory}` : '/menu-items'
      );
      setItems(data);
      setLastRefreshed(new Date());
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load items');
    }
  }

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  function handleOpenAddModal() {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories[0]?._id || '',
      isAvailable: true,
      imageUrl: '',
    });
    setShowModal(true);
  }

  function handleOpenEditModal(item) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category?._id || item.category || '',
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingItem) {
        await api.put(`/menu-items/${editingItem._id}`, formData);
        setSuccess('Menu item updated successfully');
      } else {
        await api.post('/menu-items', formData);
        setSuccess('Menu item created successfully');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAvailability(item) {
    try {
      const updated = await api.patch(`/menu-items/${item._id}/availability`);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, isAvailable: updated.isAvailable } : i))
      );
    } catch (err) {
      setError(err.message || 'Failed to update availability');
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete menu item "${item.name}"?`)) return;
    try {
      await api.delete(`/menu-items/${item._id}`);
      setSuccess('Menu item deleted successfully');
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to delete menu item');
    }
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Menu Items Management</h1>
          <p className="page-subtitle">Manage products, pricing, and availability</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
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
          <button className="btn-secondary text-xs" onClick={() => fetchItems()}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={handleOpenAddModal}>
            + Add Menu Item
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="category-tabs">
          <button
            className={`tab-btn ${selectedCategory === '' ? 'tab-btn-active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`tab-btn ${selectedCategory === cat._id ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedCategory(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" />
          <p>Loading menu items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🍔</span>
          <h3>No menu items found</h3>
          <p>Create your first menu item or clear filters to view existing items.</p>
          <button className="btn-primary mt-4" onClick={handleOpenAddModal}>
            + Add Menu Item
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Price (PKR)</th>
                <th>Available</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="table-item-cell">
                      <ItemVisual
                        imageUrl={item.imageUrl}
                        itemName={item.name}
                        categoryName={item.category?.name}
                        className="table-item-visual"
                      />
                      <div className="item-name-cell">
                        <span className="item-title">{item.name}</span>
                        {item.description && (
                          <span className="item-desc">{item.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">
                      {item.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="price-cell">Rs. {item.price.toLocaleString()}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={() => handleToggleAvailability(item)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      className="btn-icon"
                      onClick={() => handleOpenEditModal(item)}
                      title="Edit Item"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleDelete(item)}
                      title="Delete Item"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Menu Item Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Zinger Burger"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, category: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (PKR) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 680"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, price: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, imageUrl: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Short description of the dish..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, isAvailable: e.target.checked }))
                  }
                />
                <label htmlFor="isAvailable">Item Available for Order</label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
