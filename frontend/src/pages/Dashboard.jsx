import { BarChart2, Eye, Package, Target, TrendingUp, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState, FilterBar, Modal, TypeBadge } from '../components/common';
import { fmtDate, fmtNum } from '../data';
import { api } from '../api';
import { useEffect } from 'react';

// ─── NET MOVEMENT MODAL (BONUS) ────────────────────────────────────────────
function NetMovementModal({ metrics, bases, onClose }) {
  const [tab, setTab] = useState('purchases');

  const TABS = [
    { id: 'purchases',   label: `Purchases (${metrics.purchasesList.length})`,    color: '#059669' },
    { id: 'transferIn',  label: `Transfer In (${metrics.transfersInList.length})`, color: '#2563EB' },
    { id: 'transferOut', label: `Transfer Out (${metrics.transfersOutList.length})`,color: '#DC2626' },
  ];

  return (
    <Modal title="Net Movement Breakdown" subtitle="Detailed view of all inflows and outflows" onClose={onClose} maxWidth={760}>
      {/* Summary stats */}
      <div className="grid-3-col">
        {[
          { label: 'PURCHASES',    value: metrics.totalPurchases,   color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', prefix: '+' },
          { label: 'TRANSFER IN',  value: metrics.totalTransfersIn, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', prefix: '+' },
          { label: 'TRANSFER OUT', value: metrics.totalTransfersOut,color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', prefix: '-' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: s.color, letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.prefix}{fmtNum(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Net total */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>Net Movement Total</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: metrics.netMovement >= 0 ? '#059669' : '#DC2626' }}>
          {metrics.netMovement >= 0 ? '+' : ''}{fmtNum(metrics.netMovement)}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: '#F8FAFC', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid #E2E8F0' }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            style={{ fontSize: 12.5, ...(tab === t.id ? { background: t.color } : {}) }}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th>{tab === 'purchases' ? 'Base' : tab === 'transferIn' ? 'From Base' : 'To Base'}</th>
              <th style={{ textAlign: 'right' }}>Quantity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {tab === 'purchases' && (
              metrics.purchasesList.length === 0
                ? <tr><td colSpan={5}><EmptyState message="No purchases in this period" /></td></tr>
                : metrics.purchasesList.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.assetName}</td>
                    <td><TypeBadge type={p.assetType} /></td>
                    <td style={{ color: '#64748B' }}>{bases.find(b => b._id === p.baseId?._id || b.id === p.baseId)?.name || p.baseId?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>+{fmtNum(p.quantity)}</td>
                    <td style={{ color: '#94A3B8' }}>{fmtDate(p.purchaseDate)}</td>
                  </tr>
                ))
            )}
            {tab === 'transferIn' && (
              metrics.transfersInList.length === 0
                ? <tr><td colSpan={5}><EmptyState message="No inbound transfers in this period" /></td></tr>
                : metrics.transfersInList.map(t => (
                  <tr key={t._id || t.id}>
                    <td style={{ fontWeight: 600 }}>{t.assetId?.name || t.assetName}</td>
                    <td><TypeBadge type={t.assetId?.type || t.assetType} /></td>
                    <td style={{ color: '#64748B' }}>{bases.find(b => b._id === t.fromBaseId?._id || b.id === t.fromBaseId)?.name || t.fromBaseId?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>+{fmtNum(t.quantity)}</td>
                    <td style={{ color: '#94A3B8' }}>{fmtDate(t.transferDate)}</td>
                  </tr>
                ))
            )}
            {tab === 'transferOut' && (
              metrics.transfersOutList.length === 0
                ? <tr><td colSpan={5}><EmptyState message="No outbound transfers in this period" /></td></tr>
                : metrics.transfersOutList.map(t => (
                  <tr key={t._id || t.id}>
                    <td style={{ fontWeight: 600 }}>{t.assetId?.name || t.assetName}</td>
                    <td><TypeBadge type={t.assetId?.type || t.assetType} /></td>
                    <td style={{ color: '#64748B' }}>{bases.find(b => b._id === t.toBaseId?._id || b.id === t.toBaseId)?.name || t.toBaseId?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>-{fmtNum(t.quantity)}</td>
                    <td style={{ color: '#94A3B8' }}>{fmtDate(t.transferDate)}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── DASHBOARD PAGE ────────────────────────────────────────────────────────
export default function Dashboard({ user, assets, bases }) {
  const [filters,       setFilters]       = useState({ dateFrom: '', dateTo: '', base: '', type: '' });
  const [showNetModal,  setShowNetModal]  = useState(false);
  const [metrics,       setMetrics]       = useState(null);
  const [chartData,     setChartData]     = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.base) queryParams.append('baseId', filters.base);
        if (filters.type) queryParams.append('assetType', filters.type);
        if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
        const qs = `?${queryParams.toString()}`;
        
        const [mRes, cRes] = await Promise.all([
          api.getDashboardMetrics(qs),
          api.getDashboardChart(qs),
        ]);
        setMetrics(mRes.data);
        setChartData(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [filters]);

  if (loading || !metrics) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;

  const CARDS = [
    { key: 'openingBalance', label: 'Opening Balance', value: metrics.openingBalance,  color: '#7C3AED', bg: '#F5F3FF', Icon: Package,  sub: 'Initial period stock'   },
    { key: 'closingBalance', label: 'Closing Balance', value: metrics.closingBalance,  color: '#0891B2', bg: '#ECFEFF', Icon: BarChart2, sub: 'Current stock level'   },
    { key: 'netMovement',    label: 'Net Movement',    value: metrics.netMovement,     color: '#059669', bg: '#F0FDF4', Icon: TrendingUp,sub: 'Purchases + In − Out', clickable: true },
    { key: 'assigned',       label: 'Assigned',        value: metrics.totalAssigned,   color: '#D97706', bg: '#FFFBEB', Icon: UserCheck, sub: 'Deployed to personnel' },
    { key: 'expended',       label: 'Expended',        value: metrics.totalExpended,   color: '#DC2626', bg: '#FEF2F2', Icon: Target,   sub: 'Consumed / lost'        },
  ];

  const visibleAssets = assets
    .filter(a => user.role === 'Admin' ? (!filters.base || a.baseId?._id === filters.base || a.baseId === filters.base) : (a.baseId?._id === user.baseId || a.baseId === user.baseId))
    .filter(a => !filters.type || a.type === filters.type);

  return (
    <div className="page-content">
      <FilterBar filters={filters} setFilters={setFilters} showBase user={user} />

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(195px,1fr))', gap: 14, marginBottom: 20 }}>
        {CARDS.map(card => (
          <div
            key={card.key}
            className={`metric-card ${card.clickable ? 'clickable' : ''}`}
            onClick={() => card.clickable && setShowNetModal(true)}
            title={card.clickable ? 'Click to view breakdown' : ''}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, background: card.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.Icon size={20} color={card.color} />
              </div>
              {card.clickable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EFF6FF', padding: '4px 9px', borderRadius: 20 }}>
                  <Eye size={11} color="#2563EB" />
                  <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700 }}>Details</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: card.color, lineHeight: 1, marginBottom: 4 }}>
              {fmtNum(Math.abs(card.value))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>{card.label}</div>
            <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{card.sub}</div>
            {card.clickable && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="stat-pill" style={{ background: '#F0FDF4', color: '#15803D' }}>+{fmtNum(metrics.totalPurchases)} Purch</span>
                <span className="stat-pill" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>+{fmtNum(metrics.totalTransfersIn)} In</span>
                <span className="stat-pill" style={{ background: '#FEF2F2', color: '#DC2626' }}>-{fmtNum(metrics.totalTransfersOut)} Out</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="section-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
          Asset Activity — Last 6 Months
        </h3>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={chartData} barGap={2} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmtNum} />
            <Tooltip
              contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12.5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
              formatter={v => [fmtNum(v)]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            <Bar dataKey="Purchases"    fill="#059669" radius={[5,5,0,0]} />
            <Bar dataKey="TransferIn"  fill="#2563EB" radius={[5,5,0,0]} />
            <Bar dataKey="TransferOut" fill="#DC2626" radius={[5,5,0,0]} />
            <Bar dataKey="Assigned"     fill="#D97706" radius={[5,5,0,0]} />
            <Bar dataKey="Expended"     fill="#7C3AED" radius={[5,5,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Inventory Table */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Asset Inventory</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8' }}>{visibleAssets.length} assets tracked</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Asset Name</th><th>Type</th><th>Base</th><th style={{ textAlign: 'right' }}>Opening Qty</th></tr>
            </thead>
            <tbody>
              {visibleAssets.length === 0
                ? <tr><td colSpan={4}><EmptyState message="No assets match the selected filters" /></td></tr>
                : visibleAssets.map(a => (
                  <tr key={a._id || a.id}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td><TypeBadge type={a.type} /></td>
                    <td style={{ color: '#64748B' }}>{bases.find(b => b._id === a.baseId?._id || b.id === a.baseId)?.name || a.baseId?.name || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>{fmtNum(a.currentQty || a.openingQty)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showNetModal && <NetMovementModal metrics={metrics} bases={bases} onClose={() => setShowNetModal(false)} />}
    </div>
  );
}
