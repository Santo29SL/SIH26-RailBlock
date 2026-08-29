/**
 * Dashboard.jsx — Live Command Dashboard
 * Pulls real data from the FastAPI backend via the API service layer.
 */

import { useEffect, useState, useCallback } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { blocksAPI, maintenanceAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
  PROPOSED:  { color: '#6366f1', bg: 'rgba(99,102,241,.15)',  label: 'Proposed' },
  APPROVED:  { color: '#22d3ee', bg: 'rgba(34,211,238,.15)',  label: 'Approved' },
  ACTIVE:    { color: '#f59e0b', bg: 'rgba(245,158,11,.15)',  label: 'Active'   },
  COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,.15)',  label: 'Done'     },
  CANCELLED: { color: '#6b7280', bg: 'rgba(107,114,128,.12)', label: 'Cancelled'},
};

const DEPT_COLOR = {
  TRACK:      '#22d3ee',
  SIGNALLING: '#f59e0b',
  TRACTION:   '#10b981',
  OHE:        '#8b5cf6',
  CIVIL:      '#f97316',
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.PROPOSED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      background: m.bg, color: m.color,
      fontSize: '11px', fontWeight: 600, letterSpacing: '.04em',
      border: `1px solid ${m.color}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--color-accent)' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: '12px',
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      transition: 'border-color .2s, background .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.borderColor = color + '55'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '8px',
          background: color + '1a', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>{sub}</div>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [blocks, setBlocks]       = useState([]);
  const [maintenance, setMaint]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLast]    = useState(null);
  const [online, setOnline]       = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [blocksRes, maintRes] = await Promise.all([
        blocksAPI.list({ pageSize: 100 }),
        maintenanceAPI.list({ pageSize: 100 }),
      ]);
      setBlocks(blocksRes.data.items ?? []);
      setMaint(maintRes.data.items ?? []);
      setLast(new Date());
      setOnline(true);
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
      setError(err?.response?.data?.detail ?? err.message ?? 'Backend unreachable');
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const blocksByStatus = blocks.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const pendingMaint = maintenance.filter(m => m.status === 'PENDING').length;
  const criticalMaint = maintenance.filter(m => m.priority === 'CRITICAL' && m.status !== 'COMPLETED').length;

  // Dept breakdown for pending maintenance
  const deptCounts = maintenance.reduce((acc, m) => {
    if (m.status !== 'COMPLETED') {
      acc[m.department] = (acc[m.department] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, fontWeight: 600 }}>
            Command Dashboard
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>
            Live railway block planning metrics · Auto-refreshes every 30 s
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Online indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: online ? '#10b981' : '#ef4444' }}>
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? 'Backend connected' : 'Backend offline'}
          </div>
          <button
            id="dashboard-refresh-btn"
            onClick={fetchData}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '8px', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              padding: '7px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px',
              opacity: loading ? .5 : 1, transition: 'opacity .2s, background .2s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontSize: '13px',
        }}>
          <AlertTriangle size={16} />
          <strong>Backend error:</strong> {error}
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '11px', marginLeft: 'auto' }}>
            Make sure the FastAPI server is running on port 8000
          </span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <StatCard icon={Activity} label="Total Blocks"   value={blocks.length}               color="#6366f1" />
        <StatCard icon={Clock}    label="Active Blocks"  value={blocksByStatus.ACTIVE ?? 0}  color="#f59e0b"
          sub={`${blocksByStatus.PROPOSED ?? 0} proposed · ${blocksByStatus.APPROVED ?? 0} approved`} />
        <StatCard icon={CheckCircle2} label="Completed" value={blocksByStatus.COMPLETED ?? 0} color="#10b981"
          sub={`${blocksByStatus.CANCELLED ?? 0} cancelled`} />
        <StatCard icon={AlertTriangle} label="Critical Requests" value={criticalMaint} color="#ef4444"
          sub={`${pendingMaint} pending total`} />
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Blocks */}
        <section style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Recent Blocks</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>{blocks.length} total</span>
          </div>
          <div style={{ padding: '8px 0', maxHeight: '320px', overflowY: 'auto' }}>
            {loading
              ? <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>Loading…</div>
              : blocks.length === 0
                ? <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>No blocks found</div>
                : blocks.slice(0, 12).map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
                    fontSize: '13px', gap: '12px',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.block_code}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '11px' }}>
                        {b.block_date} · {b.duration_minutes} min
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))
            }
          </div>
        </section>

        {/* Department breakdown */}
        <section style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Open Work by Department</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>{maintenance.length} requests</span>
          </div>
          <div style={{ padding: '20px' }}>
            {loading
              ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>Loading…</div>
              : Object.keys(deptCounts).length === 0
                ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '13px' }}>No open maintenance work</div>
                : Object.entries(deptCounts)
                    .sort(([,a],[,b]) => b - a)
                    .map(([dept, count]) => {
                      const maxVal = Math.max(...Object.values(deptCounts));
                      const pct = Math.round((count / maxVal) * 100);
                      const color = DEPT_COLOR[dept] ?? '#6366f1';
                      return (
                        <div key={dept} style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{dept}</span>
                            <span style={{ color: color, fontWeight: 600 }}>{count}</span>
                          </div>
                          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '3px',
                              background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                              width: `${pct}%`,
                              transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                            }} />
                          </div>
                        </div>
                      );
                    })
            }
          </div>
        </section>

      </div>

      {lastUpdated && (
        <div style={{ marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,.2)', textAlign: 'right' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
