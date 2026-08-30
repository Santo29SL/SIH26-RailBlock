import { useEffect, useState, useRef } from 'react';
import type { Section, TrainMovement, Block, MaintenanceRequest, Train } from '../../api/client';
import { fetchTrainMovements, fetchBlocks, fetchTrains } from '../../api/client';
import { MapView } from '../MapView';

interface Props {
  section: Section | null;
  defects: MaintenanceRequest[];
  onNotify: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const DEPT_COLORS: Record<string, string> = {
  TRACK: '#1565c0',
  SIGNAL: '#e65100',
  TRACTION: '#6a1b9a',
};

const TRAIN_COLORS: Record<string, string> = {
  HIGH: '#c62828',
  MEDIUM: '#f57f17',
  LOW: '#546e7a',
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function DashboardTab({ section, defects, onNotify }: Props) {
  const [movements, setMovements] = useState<TrainMovement[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsEvents, setWsEvents] = useState<Array<{ type: string; msg: string; time: string }>>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const today = new Date().getDay();
  const dowMon = today === 0 ? 6 : today - 1;

  useEffect(() => {
    if (!section) return;
    setLoading(true);
    Promise.all([
      fetchTrainMovements(section.id, dowMon),
      fetchBlocks({ section_id: section.id }),
      fetchTrains(),
    ])
      .then(([mvs, blksRes, trs]) => {
        setMovements(mvs);
        setBlocks(blksRes.items);
        setTrains(trs);
      })
      .catch(e => onNotify(e.message, 'error'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/v1/events/ws/telemetry');
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setWsEvents(prev => [{ type: d.event_type, msg: JSON.stringify(d), time: new Date().toLocaleTimeString('en-IN') }, ...prev.slice(0, 19)]);
      } catch { /* */ }
    };
    return () => { ws.close(); };
  }, []);

  const trainMap = Object.fromEntries(trains.map(t => [t.id, t]));

  const activeBlocks = blocks.filter(b => b.status === 'ACTIVE').length;
  const proposedBlocks = blocks.filter(b => b.status === 'PROPOSED').length;
  const shadowHours = blocks.reduce((s, b) => s + (((b.optimizer_metadata ?? {}) as Record<string, number>)?.shadow_overlap_hours ?? 0), 0);
  const criticalDefects = defects.filter(d => d.priority === 'CRITICAL').length;
  const pendingDefects = defects.filter(d => d.status === 'PENDING').length;

  // Gantt constants
  const W = 1000;
  const HEADER_H = 22;
  const ROW_H = 32;
  const LABEL_W = 90;
  const TOTAL_MIN = 1440;
  const svgH = HEADER_H + ROW_H * 2 + 16;

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayBlocks = blocks.filter(b => b.block_date === todayDateStr);
  const hourTicks = Array.from({ length: 25 }, (_, i) => i);

  function xOf(min: number) {
    return LABEL_W + ((min / TOTAL_MIN) * (W - LABEL_W));
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="ir-kpi-grid">
        <div className="ir-kpi-card">
          <div className="ir-kpi-label">Active Blocks</div>
          <div className="ir-kpi-value">{activeBlocks}</div>
          <div className="ir-kpi-sub">{proposedBlocks} proposed</div>
        </div>
        <div className="ir-kpi-card orange">
          <div className="ir-kpi-label">Total Blocks (Section)</div>
          <div className="ir-kpi-value">{blocks.length}</div>
          <div className="ir-kpi-sub">All statuses</div>
        </div>
        <div className="ir-kpi-card green">
          <div className="ir-kpi-label">Shadow Hours Saved</div>
          <div className="ir-kpi-value">{shadowHours.toFixed(1)}</div>
          <div className="ir-kpi-sub">Labour hrs consolidated</div>
        </div>
        <div className="ir-kpi-card red">
          <div className="ir-kpi-label">Critical Defects</div>
          <div className="ir-kpi-value">{criticalDefects}</div>
          <div className="ir-kpi-sub">{pendingDefects} pending action</div>
        </div>
        <div className="ir-kpi-card gold">
          <div className="ir-kpi-label">Train Movements</div>
          <div className="ir-kpi-value">{movements.length}</div>
          <div className="ir-kpi-sub">Today on this section</div>
        </div>
      </div>

      {/* Gantt Panel */}
      <div className="ir-panel">
        <div className="ir-panel-header">
          <span>24-Hour Corridor Timeline — {section?.section_code ?? '—'} | {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span style={{ fontSize: 10 }}>■ Trains &nbsp; ■ Blocks</span>
        </div>
        <div className="ir-panel-body ir-gantt-wrap">
          {loading ? (
            <div className="ir-loading"><div className="ir-spinner" /> Loading timetable...</div>
          ) : (
            <svg className="ir-gantt-svg" viewBox={`0 0 ${W} ${svgH}`} style={{ height: svgH }}>
              {/* Hour grid */}
              {hourTicks.map(h => (
                <g key={h}>
                  <line x1={xOf(h * 60)} y1={HEADER_H} x2={xOf(h * 60)} y2={svgH} stroke="#e0e0e0" strokeWidth="0.5" />
                  {h % 2 === 0 && <text x={xOf(h * 60) + 2} y={14} fontSize="9" fill="#888">{String(h).padStart(2, '0')}:00</text>}
                </g>
              ))}

              {/* Row labels */}
              <rect x={0} y={HEADER_H} width={LABEL_W - 2} height={ROW_H} fill="#003366" />
              <text x={4} y={HEADER_H + ROW_H / 2 + 4} fontSize="9" fill="#fff" fontWeight="700">TRAINS</text>
              <rect x={0} y={HEADER_H + ROW_H} width={LABEL_W - 2} height={ROW_H} fill="#002244" />
              <text x={4} y={HEADER_H + ROW_H * 1.5 + 4} fontSize="9" fill="#fff" fontWeight="700">BLOCKS</text>

              {/* Train movements */}
              {movements.map(mv => {
                const train = trainMap[mv.train_id];
                const dep = timeToMinutes(mv.departure_time);
                const arr = timeToMinutes(mv.arrival_time);
                const dur = arr > dep ? arr - dep : (1440 - dep + arr);
                const x1 = xOf(dep);
                const bw = Math.max(2, (dur / TOTAL_MIN) * (W - LABEL_W));
                const col = train ? TRAIN_COLORS[train.priority] ?? '#546e7a' : '#546e7a';
                return (
                  <g key={mv.id}>
                    <rect x={Math.max(LABEL_W, x1 - (15 / TOTAL_MIN) * (W - LABEL_W))} y={HEADER_H + 2} width={(15 / TOTAL_MIN) * (W - LABEL_W)} height={ROW_H - 4} fill="rgba(198,40,40,0.08)" />
                    <rect x={x1 + bw} y={HEADER_H + 2} width={(15 / TOTAL_MIN) * (W - LABEL_W)} height={ROW_H - 4} fill="rgba(198,40,40,0.08)" />
                    <rect x={x1} y={HEADER_H + 4} width={bw} height={ROW_H - 8} fill={col}>
                      <title>{train?.train_number} {train?.train_name} | {mv.departure_time}→{mv.arrival_time}</title>
                    </rect>
                  </g>
                );
              })}

              {/* Today's blocks */}
              {todayBlocks.map(blk => {
                const dep = timeToMinutes(blk.start_time);
                const dur = blk.duration_minutes;
                const x1 = xOf(dep);
                const bw = Math.max(2, (dur / TOTAL_MIN) * (W - LABEL_W));
                const dept = ((blk.optimizer_metadata ?? {}) as Record<string, string>)?.primary_department ?? 'TRACK';
                const col = DEPT_COLORS[dept] ?? '#1565c0';
                return (
                  <g key={blk.id}>
                    <rect x={x1} y={HEADER_H + ROW_H + 4} width={bw} height={ROW_H - 8} fill={col} opacity={0.85}>
                      <title>{blk.block_code} | {blk.start_time}–{blk.end_time} | {blk.status}</title>
                    </rect>
                    {bw > 30 && <text x={x1 + 3} y={HEADER_H + ROW_H + ROW_H / 2 + 3} fontSize="8" fill="#fff">{blk.block_code}</text>}
                  </g>
                );
              })}

              {/* Current time marker */}
              {(() => {
                const now = new Date();
                const nowMin = now.getHours() * 60 + now.getMinutes();
                return <line x1={xOf(nowMin)} y1={HEADER_H} x2={xOf(nowMin)} y2={svgH} stroke="#f37021" strokeWidth="1.5" strokeDasharray="4,3" />;
              })()}
            </svg>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, padding: '6px 0', fontSize: 10, color: '#555', flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: '#c62828', marginRight: 4 }} />VIP Train (Rajdhani/VB)</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: '#f57f17', marginRight: 4 }} />Express/Mail</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: '#546e7a', marginRight: 4 }} />Freight</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: '#1565c0', marginRight: 4 }} />Track Block</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: '#e65100', marginRight: 4 }} />Signal Block</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: '#6a1b9a', marginRight: 4 }} />Traction Block</span>
            <span style={{ color: '#f37021', fontWeight: 700 }}>| = Current Time</span>
            <span style={{ background: 'rgba(198,40,40,0.08)', padding: '0 4px' }}>Red shading = 15-min safety buffer</span>
          </div>
        </div>
      </div>

      {/* GIS Track Map */}
      <MapView section={section} defects={defects} blocks={blocks} />

      {/* Defects + WebSocket live events */}
      <div className="ir-two-col">
        <div className="ir-panel">
          <div className="ir-panel-header">Pending Maintenance Requests — {section?.section_code ?? 'All Sections'}</div>
          <div className="ir-panel-body">
            {defects.length === 0 ? (
              <div className="ir-empty">No maintenance requests found for this section.</div>
            ) : (
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Dept</th><th>Activity</th><th>Priority</th><th>Deadline</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.filter(d => d.status === 'PENDING').slice(0, 10).map(d => (
                    <tr key={d.id}>
                      <td className="mono">{d.request_code}</td>
                      <td><span className={`ir-badge ir-badge-${d.department.toLowerCase()}`}>{d.department}</span></td>
                      <td>{d.activity_type}</td>
                      <td><span className={`ir-badge ir-badge-${d.priority === 'CRITICAL' ? 'active' : d.priority === 'HIGH' ? 'express' : 'freight'}`}>{d.priority}</span></td>
                      <td>{d.deadline}</td>
                      <td><span className={`ir-badge ir-badge-${d.status.toLowerCase()}`}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ir-panel">
          <div className="ir-panel-header">
            <span>Live Telemetry — WebSocket Stream</span>
            <span style={{ fontSize: 10 }}>{wsRef.current?.readyState === 1 ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}</span>
          </div>
          <div className="ir-panel-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {wsEvents.length === 0 ? (
              <div className="ir-empty">Waiting for live telemetry events from Control Office...</div>
            ) : (
              wsEvents.map((ev, i) => (
                <div key={i} className={`ir-ws-event ${ev.type.includes('DELAY') ? 'delay' : ev.type === 'PONG' ? 'success' : 'info'}`}>
                  <strong>{ev.time}</strong> — {ev.type}<br />
                  <span style={{ color: '#666', wordBreak: 'break-all' }}>{ev.msg.slice(0, 140)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
