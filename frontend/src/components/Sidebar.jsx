import { LayoutDashboard, ShoppingCart, ArrowLeftRight, UserCheck, Users, LogOut, Shield, Building2 } from 'lucide-react';
import { ROLE_ACCESS, ROLE_CFG } from '../data';
import { RoleBadge } from './common';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',        Icon: LayoutDashboard },
  { id: 'purchases',   label: 'Purchases',         Icon: ShoppingCart    },
  { id: 'transfers',   label: 'Transfers',         Icon: ArrowLeftRight  },
  { id: 'assignments', label: 'Assignments',       Icon: UserCheck       },
  { id: 'users',       label: 'User Management',   Icon: Users           },
];

export default function Sidebar({ user, activePage, setActivePage, onLogout, bases }) {
  const allowed  = ROLE_ACCESS[user.role] || [];
  const baseName = user.baseId ? bases?.find(b => b._id === user.baseId || b.id === user.baseId)?.name : null;
  const roleCfg  = ROLE_CFG[user.role] || {};

  return (
    <div style={{ width: 232, height: '100vh', background: '#FFFFFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Brand */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>MAMS</div>
            <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Asset Management</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px 6px', marginBottom: 2 }}>Navigation</div>
        {NAV_ITEMS.filter(n => allowed.includes(n.id)).map(({ id, label, Icon }) => (
          <button key={id} className={`sidebar-link ${activePage === id ? 'active' : ''}`} onClick={() => setActivePage(id)}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div style={{ padding: '12px 8px 16px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px', border: '1px solid #F1F5F9', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 7 }}>{user.email}</div>
          <RoleBadge role={user.role} />
          {baseName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
              <Building2 size={12} color="#94A3B8" />
              <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>{baseName}</span>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
          onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'}
          onMouseOut={e => e.currentTarget.style.background = '#FEF2F2'}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
