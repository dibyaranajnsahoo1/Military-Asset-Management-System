import { useState, useEffect } from 'react';
import { Plus, UserCheck, Target } from 'lucide-react';
import { EXPENDITURE_REASONS, fmtDate, fmtNum } from '../data';
import { TypeBadge, FilterBar, Modal, Toast, EmptyState } from '../components/common';
import { api } from '../api';

export default function Assignments({ user, assets, bases }) {
  const [assignments, setAssignments]   = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [loadingA, setLoadingA]         = useState(true);
  const [loadingE, setLoadingE]         = useState(true);
  const [tab,           setTab]           = useState('assignments');
  const [filters,       setFilters]       = useState({ dateFrom: '', dateTo: '', base: '', type: '' });
  const [showAssign,    setShowAssign]    = useState(false);
  const [showExpend,    setShowExpend]    = useState(false);
  const [toast,         setToast]         = useState(null);
  const [assignForm,    setAssignForm]    = useState({ assetId: '', assignedTo: '', quantity: '', assignmentDate: new Date().toISOString().split('T')[0] });
  const [expForm,       setExpForm]       = useState({ assetId: '', quantity: '', reason: '', dateExpended: new Date().toISOString().split('T')[0] });

  const baseAssets = assets.filter(a => user.role === 'Admin' ? true : a.baseId?._id === user.baseId || a.baseId === user.baseId);
  const showToast  = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchAssignments = async () => {
    setLoadingA(true);
    try {
      const res = await api.getAssignments();
      let data = res.data || [];
      if (filters.base) data = data.filter(r => r.baseId?._id === filters.base || r.baseId === filters.base);
      if (filters.type) data = data.filter(r => r.assetId?.type === filters.type);
      if (filters.dateFrom) data = data.filter(r => r.assignmentDate >= filters.dateFrom);
      if (filters.dateTo)   data = data.filter(r => r.assignmentDate <= filters.dateTo);
      setAssignments(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoadingA(false); }
  };

  const fetchExpenditures = async () => {
    setLoadingE(true);
    try {
      const res = await api.getExpenditures();
      let data = res.data || [];
      if (filters.base) data = data.filter(r => r.baseId?._id === filters.base || r.baseId === filters.base);
      if (filters.type) data = data.filter(r => r.assetId?.type === filters.type);
      if (filters.dateFrom) data = data.filter(r => r.dateExpended >= filters.dateFrom);
      if (filters.dateTo)   data = data.filter(r => r.dateExpended <= filters.dateTo);
      setExpenditures(data);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoadingE(false); }
  };

  useEffect(() => {
    if (tab === 'assignments') fetchAssignments();
    else fetchExpenditures();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, tab]);

  const handleAssign = async () => {
    if (!assignForm.assetId || !assignForm.assignedTo.trim() || !assignForm.quantity)
      return showToast('Please fill all required fields.', 'error');
    
    const asset = assets.find(a => a._id === assignForm.assetId || a.id === assignForm.assetId);
    try {
      await api.createAssignment({
        assetId: assignForm.assetId,
        baseId: asset.baseId?._id || asset.baseId,
        quantity: parseInt(assignForm.quantity),
        assignedTo: assignForm.assignedTo,
        assignmentDate: assignForm.assignmentDate,
      });
      showToast('Asset assigned successfully!');
      setAssignForm({ assetId: '', assignedTo: '', quantity: '', assignmentDate: new Date().toISOString().split('T')[0] });
      setShowAssign(false);
      fetchAssignments();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleExpend = async () => {
    if (!expForm.assetId || !expForm.quantity || !expForm.reason)
      return showToast('Please fill all required fields.', 'error');
    
    const asset = assets.find(a => a._id === expForm.assetId || a.id === expForm.assetId);
    try {
      await api.createExpenditure({
        assetId: expForm.assetId,
        baseId: asset.baseId?._id || asset.baseId,
        quantity: parseInt(expForm.quantity),
        reason: expForm.reason,
        dateExpended: expForm.dateExpended,
      });
      showToast('Expenditure recorded successfully!');
      setExpForm({ assetId: '', quantity: '', reason: '', dateExpended: new Date().toISOString().split('T')[0] });
      setShowExpend(false);
      fetchExpenditures();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="page-content">
      <Toast toast={toast} />
      <FilterBar filters={filters} setFilters={setFilters} showBase user={user} />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#F8FAFC', padding: 5, borderRadius: 12, width: 'fit-content', border: '1px solid #E2E8F0' }}>
        <button className={`tab-btn ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>
          Assignments ({assignments.length})
        </button>
        <button className={`tab-btn ${tab === 'expenditures' ? 'active' : ''}`} onClick={() => setTab('expenditures')}>
          Expenditures ({expenditures.length})
        </button>
      </div>

      {/* ── Assignments Table ── */}
      {tab === 'assignments' && (
        <div className="section-card">
          <div className="section-header">
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Asset Assignments</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8' }}>Assets deployed to personnel and units</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
              <Plus size={15} /> Assign Asset
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th><th>Type</th><th>Base</th><th>Assigned To</th>
                  <th style={{ textAlign: 'right' }}>Qty</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loadingA ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  : assignments.length === 0
                  ? <tr><td colSpan={6}><EmptyState message="No assignments found" Icon={UserCheck} /></td></tr>
                  : assignments.map(a => (
                    <tr key={a._id || a.id}>
                      <td style={{ fontWeight: 600 }}>{a.assetId?.name || a.assetName}</td>
                      <td><TypeBadge type={a.assetId?.type || a.assetType} /></td>
                      <td style={{ color: '#64748B' }}>{bases.find(b => b._id === a.baseId?._id || b.id === a.baseId)?.name || a.baseId?.name || '—'}</td>
                      <td>
                        <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                          {a.assignedTo}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#D97706' }}>{fmtNum(a.quantity)}</td>
                      <td style={{ color: '#64748B' }}>{fmtDate(a.assignmentDate)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Expenditures Table ── */}
      {tab === 'expenditures' && (
        <div className="section-card">
          <div className="section-header">
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Asset Expenditures</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8' }}>Consumed, damaged, or lost assets</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowExpend(true)}>
              <Plus size={15} /> Record Expenditure
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th><th>Type</th><th>Base</th><th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Qty</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loadingE ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  : expenditures.length === 0
                  ? <tr><td colSpan={6}><EmptyState message="No expenditures recorded" Icon={Target} /></td></tr>
                  : expenditures.map(e => (
                    <tr key={e._id || e.id}>
                      <td style={{ fontWeight: 600 }}>{e.assetId?.name || e.assetName}</td>
                      <td><TypeBadge type={e.assetId?.type || e.assetType} /></td>
                      <td style={{ color: '#64748B' }}>{bases.find(b => b._id === e.baseId?._id || b.id === e.baseId)?.name || e.baseId?.name || '—'}</td>
                      <td>
                        <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                          {e.reason}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>-{fmtNum(e.quantity)}</td>
                      <td style={{ color: '#64748B' }}>{fmtDate(e.dateExpended)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <Modal title="Assign Asset to Personnel" subtitle="Deploy assets to a unit or individual" onClose={() => setShowAssign(false)}>
          <div className="form-group">
            <label className="form-label">Asset *</label>
            <select className="form-input" value={assignForm.assetId} onChange={e => setAssignForm(f => ({ ...f, assetId: e.target.value }))}>
              <option value="">Select asset...</option>
              {baseAssets.map(a => (
                <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({a.type}) — {bases.find(b => b._id === a.baseId?._id || b.id === a.baseId)?.name || a.baseId?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned To (Unit / Personnel) *</label>
            <input className="form-input" type="text" value={assignForm.assignedTo}
              onChange={e => setAssignForm(f => ({ ...f, assignedTo: e.target.value }))}
              placeholder="e.g. Alpha Squad, Sgt. Johnson" />
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" min="1" value={assignForm.quantity}
                onChange={e => setAssignForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Qty" />
            </div>
            <div className="form-group">
              <label className="form-label">Assignment Date *</label>
              <input className="form-input" type="date" value={assignForm.assignmentDate}
                onChange={e => setAssignForm(f => ({ ...f, assignmentDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign}>Assign Asset</button>
          </div>
        </Modal>
      )}

      {/* Expenditure Modal */}
      {showExpend && (
        <Modal title="Record Asset Expenditure" subtitle="Log consumed, damaged, or lost assets" onClose={() => setShowExpend(false)}>
          <div className="form-group">
            <label className="form-label">Asset *</label>
            <select className="form-input" value={expForm.assetId} onChange={e => setExpForm(f => ({ ...f, assetId: e.target.value }))}>
              <option value="">Select asset...</option>
              {baseAssets.map(a => (
                <option key={a._id || a.id} value={a._id || a.id}>{a.name} ({a.type}) — {bases.find(b => b._id === a.baseId?._id || b.id === a.baseId)?.name || a.baseId?.name}</option>
              ))}
            </select>
          </div>
          <div className="grid-2-col">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" min="1" value={expForm.quantity}
                onChange={e => setExpForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Qty" />
            </div>
            <div className="form-group">
              <label className="form-label">Date Expended *</label>
              <input className="form-input" type="date" value={expForm.dateExpended}
                onChange={e => setExpForm(f => ({ ...f, dateExpended: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <select className="form-input" value={expForm.reason} onChange={e => setExpForm(f => ({ ...f, reason: e.target.value }))}>
              <option value="">Select reason...</option>
              {EXPENDITURE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={() => setShowExpend(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExpend}>Record Expenditure</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
