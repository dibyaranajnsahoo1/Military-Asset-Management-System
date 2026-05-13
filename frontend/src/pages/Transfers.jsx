import { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { fmtDate, fmtNum } from '../data';
import { TypeBadge, FilterBar, Modal, Toast, EmptyState } from '../components/common';
import { api } from '../api';

export default function Transfers({ user, assets, bases }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filters,  setFilters]  = useState({ dateFrom: '', dateTo: '', base: '', type: '' });
  const [showForm, setShowForm] = useState(false);
  const [toast,    setToast]    = useState(null);
  const [form,     setForm]     = useState({
    assetId: '', fromBaseId: user.baseId || '', toBaseId: '',
    quantity: '', transferDate: new Date().toISOString().split('T')[0],
  });

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.getTransfers();
      let data = res.data || [];
      if (filters.base) data = data.filter(t => t.fromBaseId?._id === filters.base || t.toBaseId?._id === filters.base || t.fromBaseId === filters.base || t.toBaseId === filters.base);
      if (filters.type) data = data.filter(t => t.assetId?.type === filters.type);
      if (filters.dateFrom) data = data.filter(t => t.transferDate >= filters.dateFrom);
      if (filters.dateTo)   data = data.filter(t => t.transferDate <= filters.dateTo);
      setTransfers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, [filters]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSubmit = async () => {
    if (!form.assetId || !form.fromBaseId || !form.toBaseId || !form.quantity)
      return showToast('Please fill all required fields.', 'error');
    if (form.fromBaseId === form.toBaseId)
      return showToast('Source and destination base must differ.', 'error');
    if (parseInt(form.quantity) <= 0)
      return showToast('Quantity must be greater than 0.', 'error');

    try {
      await api.createTransfer({
        assetId: form.assetId,
        fromBaseId: form.fromBaseId,
        toBaseId: form.toBaseId,
        quantity: parseInt(form.quantity),
        transferDate: form.transferDate,
      });
      showToast('Transfer initiated successfully!');
      setForm({ assetId: '', fromBaseId: user.baseId || '', toBaseId: '', quantity: '', transferDate: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchTransfers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const availableFromBases = user.role === 'Admin' ? bases : bases.filter(b => b._id === user.baseId || b.id === user.baseId);

  return (
    <div className="page-content">
      <Toast toast={toast} />
      <FilterBar filters={filters} setFilters={setFilters} showBase user={user} />

      <div className="section-card">
        <div className="section-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Transfer History</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8' }}>{transfers.length} records found</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> New Transfer
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th><th>Type</th><th>From Base</th><th>To Base</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th>Date</th><th>Initiated By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                : transfers.length === 0
                ? <tr><td colSpan={7}><EmptyState message="No transfers found for selected filters" Icon={ArrowLeftRight} /></td></tr>
                : transfers.map(t => {
                  const isIn  = user.role !== 'Admin' && (t.toBaseId?._id === user.baseId || t.toBaseId === user.baseId);
                  const isOut = user.role !== 'Admin' && (t.fromBaseId?._id === user.baseId || t.fromBaseId === user.baseId);
                  return (
                    <tr key={t._id || t.id}>
                      <td style={{ fontWeight: 600 }}>{t.assetId?.name || t.assetName}</td>
                      <td><TypeBadge type={t.assetId?.type || t.assetType} /></td>
                      <td style={{ color: '#64748B' }}>{bases.find(b => b._id === t.fromBaseId?._id || b.id === t.fromBaseId)?.name || t.fromBaseId?.name || '—'}</td>
                      <td style={{ color: '#64748B' }}>{bases.find(b => b._id === t.toBaseId?._id || b.id === t.toBaseId)?.name || t.toBaseId?.name || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isIn ? '#059669' : isOut ? '#DC2626' : '#2563EB' }}>
                        {isIn ? '+' : isOut ? '-' : ''}{fmtNum(t.quantity)}
                      </td>
                      <td style={{ color: '#64748B' }}>{fmtDate(t.transferDate)}</td>
                      <td style={{ color: '#94A3B8', fontSize: 12.5 }}>{t.initiatedBy?.name || t.initiatedBy}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title="Initiate Asset Transfer" subtitle="Move assets between military bases" onClose={() => setShowForm(false)}>
          <div className="form-group">
            <label className="form-label">Asset *</label>
            <select className="form-input" value={form.assetId} onChange={e => {
              const a = assets.find(x => x._id === e.target.value || x.id === e.target.value);
              setForm(f => ({ ...f, assetId: e.target.value, fromBaseId: a?.baseId?._id || a?.baseId || f.fromBaseId }));
            }}>
              <option value="">Select asset...</option>
              {(user.role === 'Admin' ? assets : assets.filter(a => a.baseId?._id === user.baseId || a.baseId === user.baseId)).map(a => (
                <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({a.type}) — {bases.find(b => b._id === a.baseId?._id || b.id === a.baseId)?.name || a.baseId?.name}</option>
              ))}
            </select>
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">From Base *</label>
              <select className="form-input" value={form.fromBaseId}
                onChange={e => setForm(f => ({ ...f, fromBaseId: e.target.value }))}
                disabled={user.role !== 'Admin'}>
                <option value="">Select...</option>
                {availableFromBases.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">To Base *</label>
              <select className="form-input" value={form.toBaseId}
                onChange={e => setForm(f => ({ ...f, toBaseId: e.target.value }))}>
                <option value="">Select...</option>
                {bases.filter(b => (b._id || b.id) !== form.fromBaseId).map(b => (
                  <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Enter qty" />
            </div>
            <div className="form-group">
              <label className="form-label">Transfer Date *</label>
              <input className="form-input" type="date" value={form.transferDate}
                onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Initiate Transfer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
