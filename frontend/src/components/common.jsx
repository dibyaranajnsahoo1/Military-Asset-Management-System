import { X, Package } from 'lucide-react';
import { TYPE_CFG, ROLE_CFG, ASSET_TYPES } from '../data';

// ─── TYPE BADGE ────────────────────────────────────────────────────────────
export const TypeBadge = ({ type }) => {
  const cfg = TYPE_CFG[type] || { bg: '#F1F5F9', color: '#64748B' };
  return <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{type}</span>;
};

// ─── ROLE BADGE ────────────────────────────────────────────────────────────
export const RoleBadge = ({ role }) => {
  const cfg = ROLE_CFG[role] || {};
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
};

// ─── EMPTY STATE ───────────────────────────────────────────────────────────
export const EmptyState = ({ message = 'No records found', Icon = Package }) => (
  <div style={{ textAlign: 'center', padding: '44px 20px', color: '#CBD5E1' }}>
    <Icon size={38} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
    <p style={{ fontSize: 13.5, margin: 0, color: '#94A3B8', fontWeight: 500 }}>{message}</p>
  </div>
);

// ─── TOAST ─────────────────────────────────────────────────────────────────
export const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="toast" style={{ background: toast.type === 'success' ? '#059669' : '#DC2626', color: 'white' }}>
      <span>{toast.type === 'success' ? '✓' : '✕'}</span>
      {toast.msg}
    </div>
  );
};

// ─── MODAL ─────────────────────────────────────────────────────────────────
export const Modal = ({ title, subtitle, onClose, children, maxWidth = 540 }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal-box" style={{ maxWidth }}>
      <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{title}</h2>
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 16, flexShrink: 0 }}>
          <X size={16} color="#64748B" />
        </button>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  </div>
);

// ─── FILTER BAR ────────────────────────────────────────────────────────────
export const FilterBar = ({ filters, setFilters, showBase, user, bases = [] }) => (
  <div className="filter-bar">
    <div>
      <label className="form-label">From Date</label>
      <input className="form-input" type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} style={{ width: 150 }} />
    </div>
    <div>
      <label className="form-label">To Date</label>
      <input className="form-input" type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} style={{ width: 150 }} />
    </div>
    {showBase && user.role === 'Admin' && (
      <div>
        <label className="form-label">Base</label>
        <select className="form-input" value={filters.base} onChange={e => setFilters(f => ({ ...f, base: e.target.value }))} style={{ width: 155 }}>
          <option value="">All Bases</option>
          {bases.map(b => {
            const id = b._id || b.id;
            return <option key={id} value={id}>{b.name}</option>;
          })}
        </select>
      </div>
    )}
    <div>
      <label className="form-label">Equipment Type</label>
      <select className="form-input" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={{ width: 155 }}>
        <option value="">All Types</option>
        {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
    <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ dateFrom: '', dateTo: '', base: '', type: '' })}>
      Reset
    </button>
  </div>
);
