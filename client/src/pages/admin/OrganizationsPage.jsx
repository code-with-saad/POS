import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY_FORM = {
  name: '', slug: '', ownerName: '', phone: '', email: '', plan: 'pro',
  adminUsername: '', adminPassword: '',
};

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null); // null = create mode, orgObj = edit mode
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchOrgs(); }, []);

  async function fetchOrgs() {
    try {
      setLoading(true);
      const data = await api.get('/organizations');
      setOrgs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !editingOrg) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return next;
    });
  }

  function handleCreateNew() {
    setEditingOrg(null);
    setForm(EMPTY_FORM);
    setShowPass(false);
    setShowModal(true);
  }

  function handleEdit(org) {
    setEditingOrg(org);
    setForm({
      name: org.name || '',
      slug: org.slug || '',
      ownerName: org.ownerName || '',
      phone: org.phone || '',
      email: org.email || '',
      plan: org.plan || 'pro',
      adminUsername: '',
      adminPassword: '',
    });
    setShowPass(false);
    setShowModal(true);
  }

  async function handleDelete(org) {
    if (!window.confirm(`Are you sure you want to delete organization "${org.name}"?`)) return;
    try {
      await api.delete(`/organizations/${org._id}`);
      showToast('success', `Organization "${org.name}" deleted`);
      fetchOrgs();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete organization');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingOrg && (!form.name || !form.adminUsername || !form.adminPassword)) {
      showToast('error', 'Name, admin username and password are required');
      return;
    }
    setSaving(true);
    try {
      if (editingOrg) {
        await api.put(`/organizations/${editingOrg._id}`, {
          name: form.name,
          slug: form.slug,
          ownerName: form.ownerName,
          phone: form.phone,
          email: form.email,
          plan: form.plan,
        });
        showToast('success', `"${form.name}" updated successfully!`);
      } else {
        await api.post('/organizations', form);
        showToast('success', `"${form.name}" registered successfully!`);
      }
      setShowModal(false);
      setEditingOrg(null);
      setForm(EMPTY_FORM);
      setShowPass(false);
      fetchOrgs();
    } catch (err) {
      showToast('error', err.message || 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Tenants &amp; Organizations</h1>
          <p className="page-subtitle">Manage client restaurants, cafes and business tenants on this platform</p>
        </div>
        <button className="btn-primary" onClick={handleCreateNew}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_business</span>
          New Organization
        </button>
      </header>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '1.25rem', marginBottom: '2rem',
      }}>
        {[
          { label: 'Total Tenants', value: orgs.length, icon: 'corporate_fare', color: '#f59e0b', border: '#f59e0b40' },
          { label: 'Active Orgs', value: orgs.filter(o => o.isActive !== false).length, icon: 'check_circle', color: '#22c55e', border: '#22c55e40' },
        ].map((s) => (
          <div key={s.label} className="card" style={{
            padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
            border: `1px solid ${s.border}`, borderRadius: '16px', background: 'var(--color-surface)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: s.color }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Org Grid ── */}
      {loading ? (
        <div className="loading-state">
          <div className="btn-spinner" />
          <p>Loading organizations…</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#f59e0b', display: 'block', marginBottom: '0.5rem' }}>
            corporate_fare
          </span>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No organizations yet</p>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Create your first tenant organization to get started.
          </p>
          <button className="btn-primary" onClick={handleCreateNew}>+ Create First Organization</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.5rem' }}>
          {orgs.map((org) => (
            <OrgCard key={org._id} org={org} onEdit={() => handleEdit(org)} onDelete={() => handleDelete(org)} />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); } }}>
          <div className="modal-card" style={{ maxWidth: '540px', width: '100%' }}>
            <div className="modal-header">
              <h2>{editingOrg ? `Edit "${editingOrg.name}"` : 'Register New Organization'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* ─ Org Info ─ */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', marginBottom: '0.75rem' }}>
                  Organization Details
                </p>

                <div className="form-group">
                  <label>Business / Restaurant Name *</label>
                  <input type="text" required className="input-field" placeholder="e.g. XYZ Cafe"
                    value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>URL Slug</label>
                  <input type="text" className="input-field" placeholder="Auto-generated from name"
                    value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Owner Name</label>
                    <input type="text" className="input-field" placeholder="e.g. John Doe"
                      value={form.ownerName} onChange={(e) => handleChange('ownerName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="text" className="input-field" placeholder="0300-1234567"
                      value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="input-field" placeholder="admin@example.com"
                    value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Subscription Plan</label>
                  <select className="input-field" value={form.plan} onChange={(e) => handleChange('plan', e.target.value)}>
                    <option value="basic">Basic Tier</option>
                    <option value="pro">Pro Tier</option>
                    <option value="enterprise">Enterprise Tier</option>
                  </select>
                </div>
              </div>

              {/* ─ Admin Credentials (Only for Create) ─ */}
              {!editingOrg && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', marginBottom: '0.75rem' }}>
                    Initial Admin Account
                  </p>

                  <div className="form-group">
                    <label>Admin Username *</label>
                    <input type="text" required className="input-field" placeholder="e.g. xyz_admin"
                      value={form.adminUsername} onChange={(e) => handleChange('adminUsername', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Admin Password *</label>
                    <div className="password-input-wrap">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        className="input-field"
                        placeholder="Minimum 6 characters"
                        value={form.adminPassword}
                        onChange={(e) => handleChange('adminPassword', e.target.value)}
                      />
                      <button type="button" className="password-eye-btn" onClick={() => setShowPass((v) => !v)}>
                        <span className="material-symbols-outlined">
                          {showPass ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : (editingOrg ? 'Update Organization' : 'Create Organization')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgCard({ org, onEdit, onDelete }) {
  return (
    <div className="card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      background: 'var(--color-surface)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      position: 'relative',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '12px',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '1.6rem' }}>
              store
            </span>
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2, color: 'var(--color-text)' }}>{org.name}</h3>
            <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontFamily: 'monospace', marginTop: '2px' }}>/{org.slug}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.7rem',
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.3)',
          }}>
            Active
          </span>
          <button onClick={onEdit} title="Edit Organization" style={{
            background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
            borderRadius: '8px', width: '32px', height: '32px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)', cursor: 'pointer'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
          </button>
          <button onClick={onDelete} title="Delete Organization" style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', width: '32px', height: '32px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
          </button>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface2)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <Row icon="person" text={org.ownerName || 'No owner specified'} />
        <Row icon="call" text={org.phone || 'No phone'} />
        <Row icon="mail" text={org.email || 'No email'} />
      </div>

      {/* Footer */}
      <div style={{
        paddingTop: '0.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '0.78rem', color: 'var(--color-muted)',
      }}>
        <span>Registered: {new Date(org.createdAt).toLocaleDateString()}</span>
        <span style={{
          padding: '0.2rem 0.6rem', borderRadius: '6px',
          background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.3)',
          fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
        }}>
          {org.plan || 'pro'}
        </span>
      </div>
    </div>
  );
}

function Row({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: '#f59e0b' }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
