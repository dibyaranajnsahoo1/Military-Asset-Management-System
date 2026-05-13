import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { RoleBadge, Modal, Toast, EmptyState } from '../components/common';
import { api } from '../api';

export default function UsersPage({ currentUser, bases }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [form,     setForm]     = useState({ name: '', email: '', role: 'LogisticsOfficer', baseId: '', password: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim())
      return showToast('Name, email and password are required.', 'error');
    if (form.password.length < 8)
      return showToast('Password must be at least 8 characters.', 'error');
    if (form.role !== 'Admin' && !form.baseId)
      return showToast('Please assign a base to this user.', 'error');

    try {
      await api.createUser({
        name: form.name,
        email: form.email,
        role: form.role,
        baseId: form.role === 'Admin' ? null : form.baseId,
        password: form.password,
      });
      showToast('User created successfully!');
      setForm({ name: '', email: '', role: 'LogisticsOfficer', baseId: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser._id || id === currentUser.id) return showToast('You cannot delete your own account.', 'error');
    try {
      await api.deleteUser(id);
      showToast('User removed.');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const counts = {
    total:    users.length,
    admin:    users.filter(u => u.role === 'Admin').length,
    commander:users.filter(u => u.role === 'BaseCommander').length,
    logistics:users.filter(u => u.role === 'LogisticsOfficer').length,
  };

  return (
    <div className="page-content">
      <Toast toast={toast} />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Users',  value: counts.total,     color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Admins',       value: counts.admin,     color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Commanders',   value: counts.commander, color: '#0891B2', bg: '#ECFEFF' },
          { label: 'Logistics',    value: counts.logistics, color: '#059669', bg: '#F0FDF4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>System Users</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8' }}>{users.length} registered users</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add User
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Base</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                : users.length === 0
                ? <tr><td colSpan={5}><EmptyState message="No users found" Icon={Users} /></td></tr>
                : users.map(u => (
                  <tr key={u._id || u.id}>
                    <td style={{ fontWeight: 600 }}>
                      {u.name}
                      {(u._id === currentUser._id || u.id === currentUser.id) && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>You</span>
                      )}
                    </td>
                    <td style={{ color: '#64748B' }}>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ color: '#64748B' }}>
                      {u.baseId
                        ? bases.find(b => b._id === u.baseId?._id || b.id === u.baseId)?.name || u.baseId?.name
                        : <span style={{ color: '#CBD5E1' }}>All Bases</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u._id || u.id)}
                        disabled={u._id === currentUser._id || u.id === currentUser.id}
                        style={{ opacity: (u._id === currentUser._id || u.id === currentUser.id) ? 0.4 : 1, cursor: (u._id === currentUser._id || u.id === currentUser.id) ? 'not-allowed' : 'pointer' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title="Add New User" subtitle="Create a new system account" onClose={() => setShowForm(false)}>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Col. John Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@military.gov" />
            </div>
          </div>
          <div className={form.role !== 'Admin' ? 'grid-2-col' : ''} style={{ display: 'grid', gridTemplateColumns: form.role !== 'Admin' ? '1fr 1fr' : '1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-input" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value, baseId: '' }))}>
                <option value="Admin">Admin</option>
                <option value="BaseCommander">Base Commander</option>
                <option value="LogisticsOfficer">Logistics Officer</option>
              </select>
            </div>
            {form.role !== 'Admin' && (
              <div className="form-group">
                <label className="form-label">Assigned Base *</label>
                <select className="form-input" value={form.baseId}
                  onChange={e => setForm(f => ({ ...f, baseId: e.target.value }))}>
                  <option value="">Select base...</option>
                  {bases.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Set initial password (min 8 chars)" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Create User</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
