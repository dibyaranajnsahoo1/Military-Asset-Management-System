import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { api } from './api';
import { ROLE_ACCESS } from './data';

import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Purchases   from './pages/Purchases';
import Transfers   from './pages/Transfers';
import Assignments from './pages/Assignments';
import Users       from './pages/Users';
import Sidebar     from './components/Sidebar';

// ─── PAGE METADATA ─────────────────────────────────────────────────────────
const PAGE_META = {
  dashboard:   { title: 'Operations Dashboard',          sub: 'Real-time asset tracking across all bases'     },
  purchases:   { title: 'Purchases',                     sub: 'Record and review asset acquisitions'          },
  transfers:   { title: 'Transfers',                     sub: 'Manage inter-base asset movements'             },
  assignments: { title: 'Assignments & Expenditures',    sub: 'Track deployment and consumption'              },
  users:       { title: 'User Management',               sub: 'Manage system access and permissions'          },
};

// ─── HEADER ─────────────────────────────────────────────────────────────────
function Header({ page, user, onToggleSidebar, bases }) {
  const meta    = PAGE_META[page] || {};
  const today   = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const baseObj = user.baseId ? bases.find(b => b._id === user.baseId || b.id === user.baseId) : null;
  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('');

  return (
    <div className="header-container" style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>{meta.title}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#94A3B8' }}>{meta.sub}</p>
        </div>
      </div>
      <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="header-date-base" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{today}</div>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 1 }}>
            {baseObj ? baseObj.name : 'All Bases'}
          </div>
        </div>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{initials}</span>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [user,        setUser]        = useState(null);
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingApp,  setLoadingApp]  = useState(true);
  const [assets,      setAssets]      = useState([]);
  const [bases,       setBases]       = useState([]);

  // Check auth on mount
  useEffect(() => {
    api.getMe().then(res => {
      setUser(res.user);
      setPage(ROLE_ACCESS[res.user.role]?.[0] || 'dashboard');
    }).catch(() => {
      // Not logged in
    }).finally(() => setLoadingApp(false));
  }, []);

  // Fetch base assets and bases whenever user logs in
  useEffect(() => {
    if (user) {
      Promise.all([api.getAssets(), api.getBases()])
        .then(([assetsRes, basesRes]) => {
          setAssets(assetsRes.data);
          setBases(basesRes.data);
        }).catch(console.error);
    }
  }, [user]);

  // Listen for auth expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      // Clear token from sessionStorage
      sessionStorage.removeItem('auth_token');
    };
    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  const handleLogin  = (u) => { setUser(u); setPage(ROLE_ACCESS[u.role]?.[0] || 'dashboard'); };
  const handleLogout = ()  => { 
    sessionStorage.removeItem('auth_token');
    api.logout().finally(() => { setUser(null); setPage('dashboard'); }); 
  };
  const handlePageChange = (p) => { setPage(p); setSidebarOpen(false); };

  if (loadingApp) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F1F5F9' }}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar user={user} activePage={page} setActivePage={handlePageChange} onLogout={handleLogout} bases={bases} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header page={page} user={user} onToggleSidebar={() => setSidebarOpen(true)} bases={bases} />

        <div style={{ flex: 1, overflow: 'auto', background: '#F1F5F9' }}>
          {page === 'dashboard' && (
            <Dashboard user={user} assets={assets} bases={bases} />
          )}
          {page === 'purchases' && (
            <Purchases user={user} assets={assets} bases={bases} />
          )}
          {page === 'transfers' && (
            <Transfers user={user} assets={assets} bases={bases} />
          )}
          {page === 'assignments' && (
            <Assignments user={user} assets={assets} bases={bases} />
          )}
          {page === 'users' && user.role === 'Admin' && (
            <Users currentUser={user} bases={bases} />
          )}
        </div>
      </div>
    </div>
  );
}
