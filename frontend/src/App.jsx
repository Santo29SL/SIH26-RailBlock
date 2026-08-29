import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Map, Calendar, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import NetworkMap from './components/NetworkMap';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import BlockSchedule from './components/BlockSchedule';

/* ── App shell (sidebar + routes) used at /dashboard, /map, /schedule ── */
function AppShell() {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: <Activity size={18} />, label: 'Dashboard' },
    { to: '/map',       icon: <Map size={18} />,      label: 'Network Map' },
    { to: '/schedule',  icon: <Calendar size={18} />,  label: 'Block Schedule' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-body)', color: 'var(--color-text)', background: 'var(--color-bg)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '224px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)',
        borderRight: '1px solid color-mix(in srgb,#fff 14%,transparent)',
      }}>
        <Link to="/" style={{
          padding: '22px 24px 18px', fontFamily: 'var(--font-heading)',
          fontSize: '20px', letterSpacing: '.04em', color: 'inherit',
          textDecoration: 'none', borderBottom: '1px solid color-mix(in srgb,#fff 12%,transparent)',
        }}>
          🚆 RailBlock AI
        </Link>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ to, icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 14px', textDecoration: 'none', fontSize: '14px',
                color: active ? 'var(--color-accent-300)' : 'color-mix(in srgb,var(--color-neutral-100) 80%,transparent)',
                background: active ? 'color-mix(in srgb,var(--color-accent) 18%,transparent)' : 'transparent',
                borderLeft: active ? '2px solid var(--color-accent-400)' : '2px solid transparent',
                transition: 'background .15s, color .15s',
              }}>
                {icon}<span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '14px 24px', borderTop: '1px solid color-mix(in srgb,#fff 12%,transparent)', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-neutral-100) 45%,transparent)' }}>
          NR · Delhi Division
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          padding: '14px 28px', background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', margin: 0, fontWeight: 400, letterSpacing: '.02em' }}>
            Automatic Block Planning System
          </h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', opacity: .6, padding: '4px' }}>
            <Settings size={18} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map"       element={<NetworkMap />} />
            <Route path="/schedule"  element={<BlockSchedule />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/* ── Root ── */
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
