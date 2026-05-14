import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { RoleBadge } from '../components/common';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (loginEmail = email, loginPassword = password) => {
    setError('');
    if (!loginEmail || !loginPassword) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const res = await api.login(loginEmail.trim(), loginPassword);
      onLogin(res.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (uEmail, uPass) => {
    setEmail(uEmail);
    setPassword(uPass);
    handleSubmit(uEmail, uPass);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#0F172A 0%,#1E3A5F 55%,#0C2340 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* BG blobs */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -150, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'rgba(37,99,235,0.05)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 68, height: 68, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            <Shield size={34} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>MAMS</h1>
          <p style={{ fontSize: 13.5, color: '#94A3B8', margin: 0 }}>Military Asset Management System</p>
        </div>

        {/* Card */}
        <div className="login-card" style={{ background: 'white', borderRadius: 22, padding: '28px', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 19, fontWeight: 800, color: '#0F172A' }}>Secure Sign In</h2>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Enter your password" />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={15} color="#DC2626" />
              <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <button id="login-btn" className="btn btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14.5, borderRadius: 11, marginBottom: 4 }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* Demo accounts */}
          <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 11px', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Demo Accounts Click to Login
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { name: 'Gen. Admin', email: 'admin@military.gov', password: 'admin123', role: 'Admin' },
                { name: 'Col. James Wilson', email: 'commander@alpha.mil', password: 'commander123', role: 'BaseCommander' },
                { name: 'Lt. Sarah Chen', email: 'logistics@bravo.mil', password: 'logistics123', role: 'LogisticsOfficer' },
              ].map(u => (
                <button key={u.email} onClick={() => quickLogin(u.email, u.password)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 11, cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{u.email} · {u.password}</div>
                  </div>
                  <RoleBadge role={u.role} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 18 }}>
          © 2026 Military Asset Management System · Dibya Ranjan
        </p>
      </div>
    </div>
  );
}
