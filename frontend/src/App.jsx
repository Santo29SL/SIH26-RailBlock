import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Map, Calendar, Zap, AlertTriangle } from 'lucide-react';
import NetworkMap from './components/NetworkMap';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import BlockSchedule from './components/BlockSchedule';

const navItems = [
  { to: '/dashboard', icon: Activity, label: 'Command' },
  { to: '/map',       icon: Map,      label: 'Network' },
  { to: '/schedule',  icon: Calendar,  label: 'Schedule' },
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
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', color: 'var(--text-3)', padding: '8px 12px 6px', textTransform: 'uppercase' }}>Control</div>
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', marginBottom: 2,
              textDecoration: 'none', fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: active ? 500 : 400,
              color: active ? 'var(--amber)' : 'var(--text-2)',
              background: active ? 'rgba(245 158 11 / .1)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--amber)' : 'transparent'}`,
              borderRadius: '0 var(--r1) var(--r1) 0',
              transition: 'all .15s',
            }}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '.06em', lineHeight: 1.7 }}>
          <div>NDLS–GZB · 46.2 km</div>
          <div>4 UP / DN lines</div>
          <div>PS 26027 · SIH 2026</div>
        </div>
      </div>
    </aside>
  );
}

function AppHeader() {
  const { pathname } = useLocation();
  const titles = {
    '/dashboard': { label: 'Command Dashboard', sub: 'Live block planning metrics' },
    '/map':       { label: 'Network Map',        sub: 'Section defects & GIS overlay' },
    '/schedule':  { label: 'Block Schedule',      sub: 'Gantt timeline · weekly view' },
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
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '.04em', lineHeight: 1 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 3, letterSpacing: '.04em' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
          <Zap size={11} style={{ color: 'var(--amber)' }} />
          BDMS · READ-ONLY
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
          <AlertTriangle size={11} style={{ color: 'var(--orange)' }} />
          G&amp;SR ENFORCED
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--amber)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 12, color: '#05070d',
        }}>SC</div>
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
