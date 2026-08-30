import { useEffect, useState, useCallback } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff, Zap, TrendingUp } from 'lucide-react';
import { blocksAPI, maintenanceAPI } from '../services/api';

const STATUS_META = {
  PROPOSED:  { color: '#8b5cf6', bg: 'rgba(139,92,246,.12)',  label: 'Proposed',  dot: '#8b5cf6' },
  APPROVED:  { color: '#22d3ee', bg: 'rgba(34,211,238,.12)',  label: 'Approved',  dot: '#22d3ee' },
  ACTIVE:    { color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  label: 'Active',    dot: '#f59e0b' },
  COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,.12)',  label: 'Done',      dot: '#10b981' },
  CANCELLED: { color: '#6b7280', bg: 'rgba(107,114,128,.1)', label: 'Cancelled', dot: '#6b7280' },
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
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 20,
      background: m.bg, color: m.color,
      fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '.05em',
      border: `1px solid ${m.color}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'var(--amber)' }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r2)',
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color .2s',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* top-right accent bar */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: color, opacity: .3 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--r2)',
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [blocks, setBlocks]     = useState([]);
  const [maintenance, setMaint] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdated, setLast]  = useState(null);
  const [online, setOnline]     = useState(true);

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
      setError(err?.response?.data?.detail ?? err.message ?? 'Backend unreachable');
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const byStatus    = blocks.reduce((a, b) => { a[b.status] = (a[b.status] ?? 0) + 1; return a; }, {});
  const pendingMaint   = maintenance.filter(m => m.status === 'PENDING').length;
  const criticalMaint  = maintenance.filter(m => m.priority === 'CRITICAL' && m.status !== 'COMPLETED').length;
  const deptCounts     = maintenance.reduce((a, m) => { if (m.status !== 'COMPLETED') { a[m.department] = (a[m.department] ?? 0) + 1; } return a; }, {});

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, color: online ? 'var(--green)' : 'var(--red)', letterSpacing: '.06em' }}>
              {online ? <Wifi size={11} /> : <WifiOff size={11} />}
              {online ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}
            </span>
            {lastUpdated && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                · {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
            Updates every 30 seconds · New Delhi → Ghaziabad · Northern Railway
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--surface)', border: '1px solid var(--border-2)',
            borderRadius: 'var(--r1)', color: 'var(--text-2)', cursor: loading ? 'not-allowed' : 'pointer',
            padding: '7px 14px', fontSize: 12, fontFamily: 'var(--font-mono)',
            letterSpacing: '.04em',
            opacity: loading ? .5 : 1, transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)'; }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          REFRESH
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.3)',
          borderRadius: 'var(--r2)', padding: '12px 16px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 10,
          color: '#fca5a5', fontSize: 13, fontFamily: 'var(--font-mono)',
        }}>
          <AlertTriangle size={14} />
          <strong>Backend error:</strong> {error}
          <span style={{ color: 'var(--text-3)', fontSize: 10, marginLeft: 'auto' }}>Make sure FastAPI is running on port 8000</span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Activity}      label="Total Blocks"          value={blocks.length}               color="var(--violet)" />
        <StatCard icon={Clock}         label="In Progress"           value={byStatus.ACTIVE ?? 0}        color="var(--amber)"
          sub={`${byStatus.PROPOSED ?? 0} waiting · ${byStatus.APPROVED ?? 0} approved`} />
        <StatCard icon={CheckCircle2}  label="Completed"             value={byStatus.COMPLETED ?? 0}     color="var(--green)"
          sub={`${byStatus.CANCELLED ?? 0} cancelled`} />
        <StatCard icon={AlertTriangle} label="Urgent Issues"         value={criticalMaint}               color="var(--red)"
          sub={`${pendingMaint} jobs still pending`} />
      </div>

      {/* Two-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent blocks */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>Recent Maintenance Blocks</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{blocks.length} TOTAL</span>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {loading
              ? <div style={{ padding: 28, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>Loading…</div>
              : blocks.length === 0
                ? <div style={{ padding: 28, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>No blocks found</div>
                : blocks.slice(0, 14).map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 20px', borderBottom: '1px solid var(--border)',
                    gap: 12,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.block_code}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
                        {b.block_date} · {b.duration_minutes} min
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))
            }
          </div>
        </section>

        {/* Dept breakdown */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>Pending Work by Team</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>{maintenance.length} REQUESTS</span>
          </div>
          <div style={{ padding: '20px 20px' }}>
            {loading
              ? <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>Loading…</div>
              : Object.keys(deptCounts).length === 0
                ? <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>No open maintenance work</div>
                : Object.entries(deptCounts).sort(([,a],[,b]) => b - a).map(([dept, count]) => {
                    const maxVal = Math.max(...Object.values(deptCounts));
                    const pct = Math.round((count / maxVal) * 100);
                    const color = DEPT_COLOR[dept] ?? 'var(--violet)';
                    return (
                      <div key={dept} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', letterSpacing: '.05em' }}>{dept}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, fontWeight: 500 }}>{count}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--border-2)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: `linear-gradient(90deg, ${color}, ${color}88)`,
                            width: `${pct}%`,
                            transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                            boxShadow: `0 0 8px ${color}55`,
                          }} />
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </section>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
