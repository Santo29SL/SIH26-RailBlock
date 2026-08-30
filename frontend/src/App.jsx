import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Map, Calendar } from 'lucide-react';
import NetworkMap from './components/NetworkMap';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import BlockSchedule from './components/BlockSchedule';

const navItems = [
  { to: '/dashboard', icon: Activity, label: 'Overview',      sub: 'Live status & alerts' },
  { to: '/map',       icon: Map,      label: 'Track Map',     sub: 'See defects on map' },
  { to: '/schedule',  icon: Calendar, label: 'Block Timeline',sub: 'Maintenance schedule' },
];

function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Track texture strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'repeating-linear-gradient(to bottom, var(--amber) 0px, var(--amber) 6px, transparent 6px, transparent 18px)',
        opacity: .35,
      }} />

      {/* Logo */}
      <Link to="/" style={{
        padding: '20px 20px 18px 24px',
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 2,
          background: 'var(--amber)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9H16M2 5H16M2 13H16" stroke="#05070d" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="6" cy="9" r="2" fill="#05070d"/>
            <circle cx="12" cy="5" r="2" fill="#05070d"/>
            <circle cx="9" cy="13" r="2" fill="#05070d"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, letterSpacing: '.06em', color: 'var(--text)', lineHeight: 1.1 }}>RAILBLOCK</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>AI · NR Delhi Div</div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 10px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text-3)', padding: '8px 12px 6px', textTransform: 'uppercase' }}>Pages</div>
        {navItems.map(({ to, icon: Icon, label, sub }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', marginBottom: 2,
              textDecoration: 'none',
              color: active ? 'var(--amber)' : 'var(--text-2)',
              background: active ? 'rgba(245 158 11 / .08)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--amber)' : 'transparent'}`,
              borderRadius: '0 var(--r1) var(--r1) 0',
              transition: 'all .15s',
            }}>
              <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : .65 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{sub}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer status */}
      <div style={{
        padding: '12px 14px 14px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span className="signal-dot amber" style={{ width: 6, height: 6 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>System Active</span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.7 }}>
          <div>New Delhi → Ghaziabad</div>
          <div>46.2 km corridor</div>
          <div style={{ marginTop: 4, color: 'var(--text-3)', fontSize: 10 }}>SIH 2026 · PS 26027</div>
        </div>
      </div>
    </aside>
  );
}

function AppHeader() {
  const { pathname } = useLocation();
  const titles = {
    '/dashboard': { label: 'Overview',       sub: 'Live status · active maintenance · alerts' },
    '/map':       { label: 'Track Map',      sub: 'Defects & sections · New Delhi → Ghaziabad' },
    '/schedule':  { label: 'Block Timeline', sub: 'Hour-by-hour maintenance schedule' },
  };
  const { label, sub } = titles[pathname] ?? { label: 'RailBlock', sub: '' };
  return (
    <header style={{
      padding: '12px 28px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '.04em', lineHeight: 1 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-3)', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
          View only
        </span>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#05070d' }}>SC</div>
      </div>
    </header>
  );
}

function AppShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <AppHeader />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map"       element={<NetworkMap />} />
            <Route path="/schedule"  element={<BlockSchedule />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/dashboard" element={<AppShell />} />
        <Route path="/map"       element={<AppShell />} />
        <Route path="/schedule"  element={<AppShell />} />
      </Routes>
    </Router>
  );
}
