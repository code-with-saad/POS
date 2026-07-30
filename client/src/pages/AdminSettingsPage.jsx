import { useState, useEffect, useRef } from 'react';
import { getSettings, updateSetting } from '../api/settings';

const FIELDS = [
  {
    key: 'restaurantName',
    label: 'Restaurant Name',
    type: 'text',
    icon: '🏪',
    placeholder: 'e.g. CafePOS',
    group: 'General',
  },
  {
    key: 'address',
    label: 'Address',
    type: 'text',
    icon: '📍',
    placeholder: 'e.g. Main Boulevard, Gulberg III, Lahore',
    group: 'General',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    type: 'tel',
    icon: '📞',
    placeholder: 'e.g. +92 42 111 222 333',
    group: 'General',
  },
  {
    key: 'taxRatePercent',
    label: 'Tax Rate (%)',
    type: 'number',
    icon: '🧾',
    placeholder: 'e.g. 16',
    min: 0,
    max: 100,
    group: 'Billing',
  },
  {
    key: 'receiptFooter',
    label: 'Receipt Footer Message',
    type: 'text',
    icon: '💬',
    placeholder: 'e.g. Thank you for visiting!',
    group: 'Receipts',
  },
];

const GROUPS = [...new Set(FIELDS.map((f) => f.group))];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null); // { type: 'success'|'error', msg }
  const toastTimer = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const data = await getSettings();
      const map = {};
      if (data && typeof data === 'object') {
        FIELDS.forEach(({ key }) => {
          map[key] = data[key] ?? '';
        });
      }
      setSettings(map);
      setOriginal(map);
    } catch (err) {
      showToast('error', err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    // Validate tax rate
    const tax = Number(settings.taxRatePercent);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      showToast('error', 'Tax rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      const payload = {};
      FIELDS.forEach(({ key, type }) => {
        payload[key] = type === 'number' ? Number(settings[key]) : settings[key];
      });
      await updateSetting(payload);
      setOriginal(settings);
      showToast('success', 'Settings saved successfully!');
    } catch (err) {
      showToast('error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSettings(original);
  }

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="settings-spinner" />
        <p>Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Toast */}
      {toast && (
        <div className={`settings-toast settings-toast--${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-left">
          <h1 className="settings-title">⚙️ System Settings</h1>
          <p className="settings-subtitle">Configure your restaurant's global preferences</p>
        </div>
        <div className="settings-header-actions">
          {isDirty && (
            <button
              type="button"
              className="settings-btn-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              ↩ Discard
            </button>
          )}
          <button
            type="submit"
            form="settings-form"
            className={`settings-btn-primary ${!isDirty ? 'settings-btn-disabled' : ''}`}
            disabled={!isDirty || saving}
          >
            {saving ? '⏳ Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Unsaved banner */}
      {isDirty && (
        <div className="settings-unsaved-banner">
          ⚠️ You have unsaved changes
        </div>
      )}

      {/* Form */}
      <form id="settings-form" onSubmit={handleSave} className="settings-form">
        {GROUPS.map((group) => (
          <div key={group} className="settings-group">
            <div className="settings-group-header">
              <span className="settings-group-label">{group}</span>
            </div>
            <div className="settings-group-body">
              {FIELDS.filter((f) => f.group === group).map((field) => (
                <div key={field.key} className="settings-field">
                  <label htmlFor={`setting-${field.key}`} className="settings-field-label">
                    <span className="settings-field-icon">{field.icon}</span>
                    {field.label}
                  </label>
                  <input
                    id={`setting-${field.key}`}
                    type={field.type}
                    value={settings[field.key] ?? ''}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="settings-input"
                    required={field.type !== 'tel'}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </form>
    </div>
  );
}
