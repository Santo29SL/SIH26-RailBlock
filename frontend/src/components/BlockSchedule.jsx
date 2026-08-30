import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { blocksAPI } from '../services/api';

const STATUS_COLOR = {
  PROPOSED:  { stroke: '#8b5cf6', fill: 'rgba(139,92,246,.2)' },
  APPROVED:  { stroke: '#22d3ee', fill: 'rgba(34,211,238,.15)' },
  ACTIVE:    { stroke: '#f59e0b', fill: 'rgba(245,158,11,.2)'  },
  COMPLETED: { stroke: '#10b981', fill: 'rgba(16,185,129,.15)' },
  CANCELLED: { stroke: '#6b7280', fill: 'rgba(107,114,128,.1)' },
};

function timeToMin(t) {
  if (!t) return 0;
  const p = String(t).split(':').map(Number);
  return (p[0] ?? 0) * 60 + (p[1] ?? 0);
}

function fmtTime(t) { return t ? String(t).slice(0, 5) : '—'; }

function GanttRow({ block }) {
  const [hovered, setHovered] = useState(false);
  const start  = timeToMin(block.start_time);
  const dur    = block.duration_minutes ?? 60;
  const leftPct  = (start / 1440) * 100;
  const widthPct = Math.max((dur / 1440) * 100, 0.5);
  const c = STATUS_COLOR[block.status] ?? STATUS_COLOR.PROPOSED;

  return (
    <div style={{
      position: 'relative', height: 44,
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 140, flexShrink: 0, padding: '0 14px',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)',
        letterSpacing: '.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {block.block_code}
      </div>
      <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Hour grid */}
        {Array.from({ length: 25 }, (_, h) => (
          <div key={h} style={{
            position: 'absolute', left: `${(h / 24) * 100}%`,
            top: 0, bottom: 0,
            borderLeft: `1px solid ${h % 6 === 0 ? 'rgba(255 255 255 / .08)' : 'rgba(255 255 255 / .03)'}`,
          }} />
        ))}
        {/* Block bar */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title={`${block.block_code} · ${fmtTime(block.start_time)} – ${dur} min · ${block.status}`}
          style={{
            position: 'absolute',
            left: `${leftPct}%`, width: `${widthPct}%`,
            height: '55%',
            background: hovered ? c.stroke + '55' : c.fill,
            border: `1.5px solid ${c.stroke}`,
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'background .15s',
            display: 'flex', alignItems: 'center',
            overflow: 'hidden', paddingLeft: 5,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: c.stroke, letterSpacing: '.04em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {block.block_code} · {fmtTime(block.start_time)}
          </span>
        </div>
        {hovered && (
          <div style={{
            position: 'absolute', left: `${leftPct}%`, top: '50%',
            transform: 'translateY(-110%)',
            background: 'var(--surface-3)', border: `1px solid ${c.stroke}`,
            borderRadius: 'var(--r2)', padding: '8px 12px', zIndex: 10, minWidth: 160,
            pointerEvents: 'none',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{block.block_code}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', lineHeight: 1.8 }}>
              <div>Start: {fmtTime(block.start_time)}</div>
              <div>Duration: {dur} min</div>
              <div style={{ color: c.stroke }}>Status: {block.status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlockSchedule() {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [online, setOnline]   = useState(true);
  const [dateOffset, setDateOffset] = useState(0);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  const dateStr = targetDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blocksAPI.list({ pageSize: 100 });
      setBlocks(res.data.items ?? []);
      setOnline(true);
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Backend unreachable');
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setDateOffset(d => d - 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r1)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
            <ChevronLeft size={14} />
          </button>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{dateStr}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{blocks.length} blocks scheduled</div>
          </div>
          <button onClick={() => setDateOffset(d => d + 1)} style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r1)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: online ? 'var(--green)' : 'var(--red)' }}>
            {online ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online ? 'LIVE' : 'OFFLINE'}
          </div>
          <button onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r1)', color: 'var(--text-2)', cursor: loading ? 'not-allowed' : 'pointer', padding: '6px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '.04em', opacity: loading ? .5 : 1 }}>
            <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> REFRESH
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 'var(--r2)', padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        {Object.entries(STATUS_COLOR).map(([status, { stroke }]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: stroke }} />
            {status}
          </div>
        ))}
      </div>

      {/* Gantt */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {/* Hour ruler */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-2)', background: 'var(--surface-2)' }}>
          <div style={{ width: 140, flexShrink: 0, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '.08em' }}>SECTION</div>
          <div style={{ flex: 1, position: 'relative', height: 32 }}>
            {hours.map(h => (
              <div key={h} style={{
                position: 'absolute', left: `${(h / 24) * 100}%`,
                top: 0, bottom: 0, display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: h % 6 === 0 ? 'var(--text-2)' : 'var(--text-3)', letterSpacing: '.04em', transform: 'translateX(-50%)' }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {loading
          ? <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>Loading schedule…</div>
          : blocks.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>No blocks found for this date</div>
            : blocks.map(b => <GanttRow key={b.id} block={b} />)
        }
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
