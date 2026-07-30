import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchCategories(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchCategories(silent = false) {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/categories');
      setCategories(data);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleOpenAddModal() {
    setEditingCategory(null);
    setFormData({ name: '', sortOrder: categories.length + 1 });
    setShowModal(true);
  }

  function handleOpenEditModal(category) {
    setEditingCategory(category);
    setFormData({ name: category.name, sortOrder: category.sortOrder });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
        setSuccess('Category updated successfully');
      } else {
        await api.post('/categories', formData);
        setSuccess('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/categories/${category._id}`);
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-subtitle">Organize menu items into distinct categories</p>
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
          <button className="btn-secondary text-xs" onClick={() => fetchCategories()}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={handleOpenAddModal}>
            + Add Category
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" />
          <p>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📁</span>
          <h3>No categories found</h3>
          <p>Create your first category to start organizing your menu items.</p>
          <button className="btn-primary mt-4" onClick={handleOpenAddModal}>
            + Add Category
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sort Order</th>
                <th>Category Name</th>
                <th>Created At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <span className="badge-sort">{cat.sortOrder}</span>
                  </td>
                  <td className="font-semibold text-white">{cat.name}</td>
                  <td className="text-muted">
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      className="btn-icon"
                      onClick={() => handleOpenEditModal(cat)}
                      title="Edit Category"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleDelete(cat)}
                      title="Delete Category"
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

      {/* Category Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hot Beverages"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                />
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
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
