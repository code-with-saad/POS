import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerName: '',
    phone: '',
    email: '',
    adminUsername: '',
    adminPassword: '',
  });

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    try {
      setLoading(true);
      const res = await api.get('/organizations');
      setOrgs(res);
    } catch (err) {
      showToast('error', err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/organizations', formData);
      showToast('success', 'Organization & Admin User created successfully!');
      setShowModal(false);
      setFormData({
        name: '',
        slug: '',
        ownerName: '',
        phone: '',
        email: '',
        adminUsername: '',
        adminPassword: '',
      });
      fetchOrgs();
    } catch (err) {
      showToast('error', err.message || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Multi-Tenant Organizations</h1>
          <p className="page-subtitle">Manage client restaurants, cafes, and business tenants</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create New Organization
        </button>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" />
          <p>Loading organizations...</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">corporate_fare</span>
          <p>No organizations registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <div key={org._id} className="card p-5 border border-zinc-800 rounded-xl bg-zinc-900/60 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-amber-400">{org.name}</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                    {org.plan}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400 mb-3">Slug: {org.slug}</div>

                <div className="space-y-1 text-sm text-zinc-300">
                  {org.ownerName && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-zinc-500">person</span>
                      <span>{org.ownerName}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-zinc-500">call</span>
                      <span>{org.phone}</span>
                    </div>
                  )}
                  {org.email && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-zinc-500">mail</span>
                      <span>{org.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs text-zinc-500">
                <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Tenant
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card max-w-lg">
            <div className="modal-header">
              <h2>Register New Tenant / Organization</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">Organization Info</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-400">Business / Restaurant Name *</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="e.g. XYZ Cafe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">URL Slug (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. xyz-cafe (auto-generated if empty)"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-zinc-400">Owner Name</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. John Doe"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400">Phone</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="0300-1234567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">Initial Admin Account Credentials</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-400">Admin Username *</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="e.g. xyz_admin"
                        value={formData.adminUsername}
                        onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Admin Password *</label>
                      <input
                        type="password"
                        required
                        className="input-field"
                        placeholder="Password for initial admin"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions mt-6">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
