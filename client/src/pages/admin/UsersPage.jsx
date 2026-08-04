import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const ALL_MODULES = [
    { key: 'inventory',  label: 'Inventory Management' },
    { key: 'suppliers',  label: 'Suppliers' },
    { key: 'purchases',  label: 'Purchases / Receiving' },
    { key: 'customers',  label: 'Customers & Ledger' },
    { key: 'reports',    label: 'Reports & Analytics' },
    { key: 'orders',     label: 'Order History' },
    { key: 'tables',     label: 'Table Management' },
    { key: 'pos',        label: 'POS Terminal' },
    { key: 'kitchen',    label: 'Kitchen Display (KDS)' },
    { key: 'waiter',     label: 'Waiter Screen' },
  ];

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'cashier',
    isActive: true,
    allowedModules: [],
  });

  function toggleModule(key) {
    setFormData((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(key)
        ? prev.allowedModules.filter((m) => m !== key)
        : [...prev.allowedModules, key],
    }));
  }

  const [resetPass, setResetPass] = useState({ newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get('/users');
      // Hide platform superadmin accounts from tenant staff management view
      setUsers(Array.isArray(res) ? res.filter((u) => u.role !== 'superadmin') : []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load user list');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData({
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'cashier',
      isActive: true,
      allowedModules: [],
    });
    setModalError('');
    setShowAddModal(true);
  }

  function openEditModal(user) {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      allowedModules: user.allowedModules || [],
    });
    setModalError('');
    setShowEditModal(true);
  }

  function openResetModal(user) {
    setSelectedUser(user);
    setResetPass({ newPassword: '', confirmPassword: '' });
    setModalError('');
    setShowResetModal(true);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setModalError('Passwords do not match');
      return;
    }
    try {
      setSubmitting(true);
      setModalError('');
      await api.post('/users', {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        allowedModules: formData.allowedModules,
      });
      showToast('success', `Account created for ${formData.name}!`);
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditUser(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError('');
      await api.put(`/users/${selectedUser._id}`, {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        isActive: formData.isActive,
        allowedModules: formData.allowedModules,
      });
      showToast('success', 'User updated successfully!');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (resetPass.newPassword !== resetPass.confirmPassword) {
      setModalError('Passwords do not match');
      return;
    }
    try {
      setSubmitting(true);
      setModalError('');
      await api.patch(`/users/${selectedUser._id}/reset-password`, {
        newPassword: resetPass.newPassword,
      });
      showToast('success', `Password reset for ${selectedUser.username}!`);
      setShowResetModal(false);
    } catch (err) {
      setModalError(err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Are you sure you want to delete ${user.name}'s account?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      showToast('success', 'User account deleted.');
      fetchUsers();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete user');
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Cashier & Staff Management</h1>
          <p className="page-subtitle">Manage system users, cashier roles, and access credentials</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          ➕ Add New Staff / Cashier
        </button>
      </header>


      {loading ? (
        <div className="page-spinner-overlay">
          <div className="page-spinner" />
          <p className="page-spinner-text">Loading staff accounts…</p>
        </div>
      ) : (
        <div className="admin-card p-0">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>STAFF MEMBER</th>
                  <th>USERNAME</th>
                  <th>ROLE</th>
                  <th>MODULE ACCESS</th>
                  <th>STATUS</th>
                  <th>CREATED DATE</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-4">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-name-cell">
                          <span className="user-avatar-sm">{u.name[0].toUpperCase()}</span>
                          <span className="font-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td>
                        <code className="user-badge-code">@{u.username}</code>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role === 'admin' ? 'completed' : u.role === 'manager' ? 'preparing' : 'pending'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(!u.allowedModules || u.allowedModules.length === 0) ? (
                            <span className="text-xs text-slate-500 italic">All defaults</span>
                          ) : u.allowedModules.map((mod) => (
                            <span key={mod} className="px-1.5 py-0.5 text-xs rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono">
                              {mod}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-completed' : 'badge-cancelled'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            className="btn-secondary btn-xs"
                            onClick={() => openEditModal(u)}
                            title="Edit User Details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-secondary btn-xs"
                            onClick={() => openResetModal(u)}
                            title="Reset Password"
                          >
                            🔑 Key
                          </button>
                          <button
                            className="btn-danger btn-xs"
                            onClick={() => handleDeleteUser(u)}
                            title="Delete Account"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add New Staff / Cashier</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              {modalError && <div className="error-alert mb-2">⚠️ {modalError}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Cashier"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cashier2"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen Staff (KDS Only)</option>
                  <option value="manager">Manager</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter password..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password..."
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="font-semibold text-sm text-amber-400">Module Access Permissions</label>
                <p className="text-xs text-slate-400 mb-2">Leave empty for full default access. Check specific modules to restrict access.</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((mod) => (
                    <label key={mod.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors">
                      <input
                        type="checkbox"
                        className="accent-amber-500 w-4 h-4"
                        checked={formData.allowedModules.includes(mod.key)}
                        onChange={() => toggleModule(mod.key)}
                      />
                      <span className="text-xs font-medium text-slate-300">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Staff Member — {selectedUser.name}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEditUser} className="modal-form">
              {modalError && <div className="error-alert mb-2">⚠️ {modalError}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen Staff (KDS Only)</option>
                  <option value="manager">Manager</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Account Active (Allowed to log in)</span>
                </label>
              </div>
              <div className="form-group">
                <label className="font-semibold text-sm text-amber-400">Module Access Permissions</label>
                <p className="text-xs text-slate-400 mb-2">Leave empty for full default access. Check specific modules to restrict access.</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((mod) => (
                    <label key={mod.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors">
                      <input
                        type="checkbox"
                        className="accent-amber-500 w-4 h-4"
                        checked={formData.allowedModules.includes(mod.key)}
                        onChange={() => toggleModule(mod.key)}
                      />
                      <span className="text-xs font-medium text-slate-300">{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Reset Password for @{selectedUser.username}</h3>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="modal-form">
              {modalError && <div className="error-alert mb-2">⚠️ {modalError}</div>}
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password..."
                  value={resetPass.newPassword}
                  onChange={(e) => setResetPass({ ...resetPass, newPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password..."
                  value={resetPass.confirmPassword}
                  onChange={(e) => setResetPass({ ...resetPass, confirmPassword: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
