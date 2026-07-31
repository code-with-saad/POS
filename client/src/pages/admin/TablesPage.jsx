import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function TablesPage() {
  const { showToast } = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [selectedSection, setSelectedSection] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    section: 'Main Hall',
    capacity: 4,
    status: 'available',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTables(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchTables(silent = false) {
    try {
      if (!silent) setLoading(true);
      const data = await api.get('/tables');
      setTables(data);
      setLastRefreshed(new Date());
    } catch (err) {
      showToast('error', err.message || 'Failed to load tables');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  const sections = Array.from(new Set(tables.map((t) => t.section || 'Main Hall')));

  function handleOpenAddModal() {
    setEditingTable(null);
    setFormData({
      name: `T${tables.length + 1}`,
      section: sections[0] || 'Main Hall',
      capacity: 4,
      status: 'available',
    });
    setShowModal(true);
  }

  function handleOpenEditModal(table) {
    setEditingTable(table);
    setFormData({
      name: table.name,
      section: table.section || 'Main Hall',
      capacity: table.capacity || 4,
      status: table.status || 'available',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable._id}`, formData);
        showToast('success', 'Table updated successfully');
      } else {
        await api.post('/tables', formData);
        showToast('success', 'Table created successfully');
      }
      setShowModal(false);
      fetchTables();
    } catch (err) {
      showToast('error', err.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(table) {
    try {
      const nextStatus = table.status === 'available' ? 'occupied' : 'available';
      const updated = await api.patch(`/tables/${table._id}/status`, { status: nextStatus });
      setTables((prev) =>
        prev.map((t) => (t._id === table._id ? { ...t, status: updated.status } : t))
      );
    } catch (err) {
      showToast('error', err.message || 'Failed to update table status');
    }
  }

  async function handleDelete(table) {
    if (!window.confirm(`Delete table "${table.name}"?`)) return;
    try {
      await api.delete(`/tables/${table._id}`);
      showToast('success', 'Table deleted');
      fetchTables();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete table');
    }
  }

  const filteredTables = tables.filter(
    (table) => !selectedSection || table.section === selectedSection
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">Configure dining layout, sections, and track table availability</p>
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
          <button className="btn-secondary text-xs" onClick={() => fetchTables()}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={handleOpenAddModal}>
            + Add Table
          </button>
        </div>
      </header>


      {/* Section Filter Bar */}
      <div className="filter-bar">
        <div className="category-tabs">
          <button
            className={`tab-btn ${selectedSection === '' ? 'tab-btn-active' : ''}`}
            onClick={() => setSelectedSection('')}
          >
            All Sections ({tables.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              className={`tab-btn ${selectedSection === sec ? 'tab-btn-active' : ''}`}
              onClick={() => setSelectedSection(sec)}
            >
              {sec} ({tables.filter((t) => t.section === sec).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading tables…</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🪑</span>
          <h3>No tables found</h3>
          <p>Add dining tables to manage seating for dine-in orders.</p>
          <button className="btn-primary mt-4" onClick={handleOpenAddModal}>
            + Add Table
          </button>
        </div>
      ) : (
        <div className="tables-grid">
          {filteredTables.map((table) => {
            const isAvailable = table.status === 'available';
            return (
              <div
                key={table._id}
                className={`table-box ${isAvailable ? 'table-box-available' : 'table-box-occupied'}`}
              >
                <div className="table-box-header">
                  <span className="table-box-name">{table.name}</span>
                  <span
                    className={`status-badge ${
                      isAvailable ? 'status-badge-available' : 'status-badge-occupied'
                    }`}
                  >
                    {isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                  </span>
                </div>

                <div className="table-box-body">
                  <p className="table-box-section">📍 {table.section || 'Main Hall'}</p>
                  <p className="table-box-capacity">👥 Capacity: {table.capacity} Persons</p>
                </div>

                <div className="table-box-actions">
                  <button
                    className={`btn-icon ${isAvailable ? 'btn-icon-warn' : 'btn-icon-success'}`}
                    onClick={() => handleToggleStatus(table)}
                  >
                    {isAvailable ? 'Mark Occupied' : 'Mark Free'}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleOpenEditModal(table)}
                    title="Edit Table"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => handleDelete(table)}
                    title="Delete Table"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Table Name / Number *</label>
                <input
                  type="text"
                  placeholder="e.g. T1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Section / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Main Hall, Outdoor Terrace, Rooftop"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, section: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Seating Capacity</label>
                <input
                  type="number"
                  placeholder="4"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, capacity: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                </select>
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
                  {saving ? 'Saving...' : editingTable ? 'Update Table' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
