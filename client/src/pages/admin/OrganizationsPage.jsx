import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY_FORM = {
  name: '', slug: '', ownerName: '', phone: '', email: '',
  adminUsername: '', adminPassword: '',
};

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      // Auto-generate slug from name
      if (key === 'name') {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.adminUsername || !form.adminPassword) {
      showToast('error', 'Name, admin username and password are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/organizations', form);
      showToast('success', `"${form.name}" registered successfully!`);
      setShowModal(false);
      setForm(EMPTY_FORM);
      setShowPass(false);
      fetchOrgs();
    } catch (err) {
      showToast('error', err.message || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  }

  function openModal() { setForm(EMPTY_FORM); setShowPass(false); setShowModal(true); }

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Tenants &amp; Organizations</h1>
          <p className="page-subtitle">Manage client restaurants, cafes and business tenants on this platform</p>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_business</span>
          New Organization
        </button>
      </header>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Total Tenants', value: orgs.length, icon: 'corporate_fare', color: '#f59e0b' },
          { label: 'Active', value: orgs.length, icon: 'check_circle', color: '#22c55e' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: s.color }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</p>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Create your first tenant organization to get started.
          </p>
          <button className="btn-primary" onClick={openModal}>+ Create First Organization</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {orgs.map((org) => (
            <OrgCard key={org._id} org={org} />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); } }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="modal-header">
              <h2>Register New Organization</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* ─ Org Info ─ */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', marginBottom: '0.75rem' }}>
                  Organization Info
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
              </div>

              {/* ─ Admin Credentials ─ */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
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

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgCard({ org }) {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.6rem',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '1.3rem' }}>
              store
            </span>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{org.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{org.slug}</p>
          </div>
        </div>
        <span style={{
          padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem',
          fontWeight: 700, textTransform: 'uppercase',
          background: 'rgba(34,197,94,0.12)', color: '#22c55e',
          border: '1px solid rgba(34,197,94,0.25)',
        }}>
          Active
        </span>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {org.ownerName && (
          <Row icon="person" text={org.ownerName} />
        )}
        {org.phone && <Row icon="call" text={org.phone} />}
        {org.email && <Row icon="mail" text={org.email} />}
      </div>

      {/* Footer */}
      <div style={{
        paddingTop: '0.75rem', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '0.75rem', color: 'var(--text-muted)',
      }}>
        <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
        <span style={{
          padding: '0.15rem 0.5rem', borderRadius: '4px',
          background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
          fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase',
        }}>
          {org.plan || 'basic'}
        </span>
      </div>
    </div>
  );
}

function Row({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
