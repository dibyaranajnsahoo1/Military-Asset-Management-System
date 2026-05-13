import { useState, useEffect } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { fmtDate, fmtNum } from '../data';
import { TypeBadge, FilterBar, Modal, Toast, EmptyState } from '../components/common';
import { api } from '../api';

export default function Purchases({ user, assets, bases }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filters,  setFilters]  = useState({ dateFrom: '', dateTo: '', base: '', type: '' });
  const [showForm, setShowForm] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [form,     setForm]     = useState({ assetId: '', quantity: '', purchaseDate: new Date().toISOString().split('T')[0] });

  const baseAssets = assets.filter(a => user.role === 'Admin' ? true : a.baseId?._id === user.baseId || a.baseId === user.baseId);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchases();
      // The backend handles base scope for non-admins, but we can do local filtering too
      let data = res.data || [];
      if (filters.base) data = data.filter(p => p.baseId?._id === filters.base || p.baseId === filters.base);
      if (filters.type) data = data.filter(p => p.assetId?.type === filters.type);
      if (filters.dateFrom) data = data.filter(p => p.purchaseDate >= filters.dateFrom);
      if (filters.dateTo)   data = data.filter(p => p.purchaseDate <= filters.dateTo);
      // Sort by newest first
      data.sort((a, b) => new Date(b.purchaseDate || b.createdAt) - new Date(a.purchaseDate || a.createdAt));
      setPurchases(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPurchases(); }, [filters]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async () => {
    if (!form.assetId || !form.quantity || !form.purchaseDate)
      return showToast('Please fill all required fields.', 'error');
    if (parseInt(form.quantity) <= 0)
      return showToast('Quantity must be greater than 0.', 'error');
    
    const asset = assets.find(a => a._id === form.assetId || a.id === form.assetId);
    
    try {
      await api.createPurchase({
        assetId: form.assetId,
        baseId: asset.baseId?._id || asset.baseId,
        quantity: parseInt(form.quantity),
        purchaseDate: form.purchaseDate,
      });
      showToast('Purchase recorded successfully!');
      setForm({ assetId: '', quantity: '', purchaseDate: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchPurchases();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-content">
      <Toast toast={toast} />
      <FilterBar filters={filters} setFilters={setFilters} showBase user={user} />

      <div className="section-card">
        <div className="section-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Purchase History</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8' }}>{purchases.length} records found</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> New Purchase
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th><th>Type</th><th>Base</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th>Date</th><th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                : purchases.length === 0
                ? <tr><td colSpan={6}><EmptyState message="No purchases found for the selected filters" Icon={ShoppingCart} /></td></tr>
                : purchases.map(p => (
                  <tr key={p._id || p.id}>
                    <td style={{ fontWeight: 600 }}>{p.assetId?.name || p.assetName}</td>
                    <td><TypeBadge type={p.assetId?.type || p.assetType} /></td>
                    <td style={{ color: '#64748B' }}>{bases.find(b => b._id === p.baseId?._id || b.id === p.baseId)?.name || p.baseId?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>+{fmtNum(p.quantity)}</td>
                    <td style={{ color: '#64748B' }}>{fmtDate(p.purchaseDate)}</td>
                    <td style={{ color: '#94A3B8', fontSize: 12.5 }}>{p.addedBy?.name || p.addedBy}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title="Record New Purchase" subtitle="Add newly acquired assets to inventory" onClose={() => setShowForm(false)}>
          <div className="form-group">
            <label className="form-label">Asset *</label>
            <select className="form-input" value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}>
              <option value="">Select asset...</option>
              {baseAssets.map(a => (
                <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({a.type}) — {bases.find(b => b._id === a.baseId?._id || b.id === a.baseId)?.name || a.baseId?.name}</option>
              ))}
            </select>
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Enter quantity" />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Date *</label>
              <input className="form-input" type="date" value={form.purchaseDate}
                onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Record Purchase</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
