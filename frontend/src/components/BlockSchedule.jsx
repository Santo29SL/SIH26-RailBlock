/**
 * BlockSchedule.jsx — Gantt-style timeline of maintenance blocks.
 * Fetches real block data from the FastAPI backend.
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { blocksAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  PROPOSED:  { stroke: '#6366f1', fill: 'rgba(99,102,241,.25)' },
  APPROVED:  { stroke: '#22d3ee', fill: 'rgba(34,211,238,.25)' },
  ACTIVE:    { stroke: '#f59e0b', fill: 'rgba(245,158,11,.25)'  },
  COMPLETED: { stroke: '#10b981', fill: 'rgba(16,185,129,.20)'  },
  CANCELLED: { stroke: '#6b7280', fill: 'rgba(107,114,128,.15)' },
};

function timeToMinutes(t) {
  if (!t) return 0;
  const str = typeof t === 'string' ? t : String(t);
  const parts = str.split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function fmtTime(t) {
  if (!t) return '—';
  const str = typeof t === 'string' ? t : String(t);
  return str.slice(0, 5); // HH:MM
}

// ── Gantt Row ─────────────────────────────────────────────────────────────────
function GanttRow({ block, totalMinutes = 1440 }) {
  const start  = timeToMinutes(block.start_time);
  const dur    = block.duration_minutes ?? 60;
  const leftPct  = (start / totalMinutes) * 100;
  const widthPct = Math.max((dur / totalMinutes) * 100, 0.5);
  const colors   = STATUS_COLOR[block.status] ?? STATUS_COLOR.PROPOSED;

  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative', height: '48px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.04)' }}
    >
      {/* Section label */}
      <div style={{
        width: '140px', flexShrink: 0, padding: '0 14px',
        fontSize: '11px', color: 'rgba(255,255,255,.45)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {block.block_code}
      </div>

      {/* Timeline track */}
      <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Hour grid lines */}
        {Array.from({ length: 25 }, (_, h) => (
          <div key={h} style={{
            position: 'absolute', left: `${(h / 24) * 100}%`,
            top: 0, bottom: 0,
            borderLeft: '1px solid rgba(255,255,255,.05)',
          }} />
        ))}

        {/* Block bar */}
        <div
          style={{
            position: 'absolute',
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            height: '60%',
            background: colors.fill,
            border: `1.5px solid ${colors.stroke}`,
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'height .15s, filter .15s',
            filter: hovered ? 'brightness(1.3)' : 'none',
            display: 'flex', alignItems: 'center', overflow: 'hidden',
            paddingLeft: '5px',
            minWidth: '6px',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title={`${block.block_code} | ${fmtTime(block.start_time)}–${fmtTime(block.end_time)} | ${block.duration_minutes} min | ${block.status}`}
        >
          {widthPct > 5 && (
            <span style={{ fontSize: '10px', color: colors.stroke, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '.03em' }}>
              {fmtTime(block.start_time)}
            </span>
          )}
        </div>
      </div>

      {/* Duration label */}
      <div style={{ width: '70px', flexShrink: 0, textAlign: 'right', paddingRight: '14px', fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>
        {block.duration_minutes} min
      </div>
    </div>
  );
}

// ── Hour ruler ────────────────────────────────────────────────────────────────
function HourRuler() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)', height: '32px' }}>
      <div style={{ width: '140px', flexShrink: 0 }} />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {Array.from({ length: 25 }, (_, h) => (
          <div key={h} style={{
            position: 'absolute', left: `${(h / 24) * 100}%`,
            fontSize: '10px', color: 'rgba(255,255,255,.25)', transform: 'translateX(-50%)',
            userSelect: 'none',
          }}>
            {h === 0 ? '00:00' : h % 6 === 0 ? `${String(h).padStart(2, '0')}:00` : h % 3 === 0 ? '|' : ''}
          </div>
        ))}
      </div>
      <div style={{ width: '70px', flexShrink: 0 }} />
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {Object.entries(STATUS_COLOR).map(([status, { stroke }]) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '3px', background: stroke + '40', border: `1.5px solid ${stroke}` }} />
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BlockSchedule() {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [online, setOnline]   = useState(true);
  const [date, setDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const PAGE_SIZE = 30;

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blocksAPI.list({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
      });
      const data = res.data;
      setBlocks(data.items ?? []);
      setTotal(data.total ?? 0);
      setOnline(true);
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Backend unreachable');
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: 0, fontWeight: 600 }}>
            Block Schedule
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>
            Gantt-style maintenance block timeline · {total} blocks total
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Online indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: online ? '#10b981' : '#ef4444' }}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            {online ? 'Live' : 'Offline'}
          </div>

          {/* Status filter */}
          <select
            id="schedule-status-filter"
            value={statusFilter}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '8px', color: '#fff', padding: '7px 12px',
              fontSize: '13px', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">All statuses</option>
            <option value="PROPOSED">Proposed</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Refresh */}
          <button
            id="schedule-refresh-btn"
            onClick={fetchBlocks}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '8px', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              padding: '7px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px',
              opacity: loading ? .5 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontSize: '13px',
        }}>
          <AlertTriangle size={16} />
          <strong>Backend error:</strong> {error}
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{ marginBottom: '16px' }}><Legend /></div>

      {/* ── Gantt chart ── */}
      <div style={{
        background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <HourRuler />

        {loading
          ? <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '14px' }}>
              Loading blocks…
            </div>
          : blocks.length === 0
            ? <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '14px' }}>
                No blocks found{statusFilter ? ` with status "${statusFilter}"` : ''}. Seed data or run the optimizer to populate.
              </div>
            : blocks.map(b => <GanttRow key={b.id} block={b} />)
        }
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
          marginTop: '20px', fontSize: '13px', color: 'rgba(255,255,255,.5)',
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '8px', color: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
              padding: '6px 10px', display: 'flex', alignItems: 'center',
              opacity: page === 1 ? .4 : 1,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span>Page {page} of {totalPages} · {total} blocks</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            style={{
              background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '8px', color: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              padding: '6px 10px', display: 'flex', alignItems: 'center',
              opacity: page === totalPages ? .4 : 1,
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
