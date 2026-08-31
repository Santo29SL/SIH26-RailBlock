import { useState } from 'react';
import type { Section, MaintenanceRequest, OptimizerRunResponse, WhatIfSimulationResponse } from '../../api/client';
import { runOptimizer, simulateBlock, commitSimulation } from '../../api/client';

interface Props {
  section: Section | null;
  sections: Section[];
  defects: MaintenanceRequest[];
  onNotify: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onBlocksUpdated: () => void;
}

export function PlannerTab({ section, sections, defects, onNotify, onBlocksUpdated }: Props) {
  const today = new Date().toISOString().split('T')[0];

  // Optimizer state
  const [optDate, setOptDate] = useState(today);
  const [optHorizon, setOptHorizon] = useState(1);
  const [optSectionId, setOptSectionId] = useState(section?.id ?? '');
  const [optPersist, setOptPersist] = useState(true);
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState<OptimizerRunResponse | null>(null);
  const [optError, setOptError] = useState('');

  // What-If state
  const [simSectionId, setSimSectionId] = useState(section?.id ?? '');
  const [simDate, setSimDate] = useState(today);
  const [simStart, setSimStart] = useState('02:00');
  const [simEnd, setSimEnd] = useState('05:00');
  const [simReqIds, setSimReqIds] = useState<string[]>([]);
  const [simSlw, setSimSlw] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<WhatIfSimulationResponse | null>(null);
  const [simError, setSimError] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [approvedBy, setApprovedBy] = useState('');

  async function handleRunOptimizer() {
    setOptError('');
    setOptResult(null);
    setOptLoading(true);
    try {
      const res = await runOptimizer({
        target_date: optDate,
        section_ids: optSectionId ? [optSectionId] : undefined,
        horizon_days: optHorizon,
        persist_to_db: optPersist,
      });
      setOptResult(res);
      if (optPersist) onBlocksUpdated();
      onNotify(`Optimizer: ${res.solver_status} — ${res.total_blocks_scheduled} blocks scheduled`, 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Optimizer failed';
      setOptError(msg);
      onNotify(msg, 'error');
    } finally {
      setOptLoading(false);
    }
  }

  async function handleSimulate() {
    setSimError('');
    setSimResult(null);
    if (!simSectionId) { setSimError('Select a section'); return; }
    if (simReqIds.length === 0) { setSimError('Select at least one maintenance request to simulate'); return; }
    setSimLoading(true);
    try {
      const res = await simulateBlock({
        section_id: simSectionId,
        target_date: simDate,
        start_time: simStart + ':00',
        end_time: simEnd + ':00',
        maintenance_request_ids: simReqIds,
        allow_slw_fallback: simSlw,
      });
      setSimResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Simulation failed';
      setSimError(msg);
      onNotify(msg, 'error');
    } finally {
      setSimLoading(false);
    }
  }

  async function handleCommit() {
    if (!simResult) return;
    setCommitLoading(true);
    try {
      const res = await commitSimulation(simResult.commit_token, approvedBy || undefined);
      onNotify(`Block ${res.block_code} committed to database`, 'success');
      setSimResult(null);
      onBlocksUpdated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Commit failed';
      onNotify(msg, 'error');
    } finally {
      setCommitLoading(false);
    }
  }

  function toggleReqId(id: string) {
    setSimReqIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const pendingDefects = defects.filter(d => d.status === 'PENDING');

  return (
    <div>
      {/* Optimizer Panel */}
      <div className="ir-panel">
        <div className="ir-panel-header">AI Block Optimizer — OR-Tools CP-SAT Solver</div>
        <div className="ir-panel-body">
          <div className="ir-form-row">
            <div className="ir-form-group">
              <label className="ir-label">Section</label>
              <select className="ir-select" value={optSectionId} onChange={e => setOptSectionId(e.target.value)}>
                <option value="">All Sections</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.section_code} — {s.division}</option>)}
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Target Date</label>
              <input className="ir-input" type="date" value={optDate} onChange={e => setOptDate(e.target.value)} />
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Planning Horizon</label>
              <select className="ir-select" value={optHorizon} onChange={e => setOptHorizon(Number(e.target.value))}>
                <option value={1}>Today (1 day)</option>
                <option value={7}>Weekly (7 days)</option>
                <option value={14}>Fortnightly (14 days)</option>
                <option value={30}>Monthly (30 days)</option>
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Persist to DB</label>
              <select className="ir-select" value={optPersist ? 'yes' : 'no'} onChange={e => setOptPersist(e.target.value === 'yes')}>
                <option value="yes">Yes — Save blocks to database</option>
                <option value="no">No — Dry run only</option>
              </select>
            </div>
            <div className="ir-form-group" style={{ justifyContent: 'flex-end' }}>
              <button className="ir-btn ir-btn-primary" onClick={handleRunOptimizer} disabled={optLoading}>
                {optLoading ? 'Solving...' : '▶ Run AI Optimizer'}
              </button>
            </div>
          </div>

          {optError && <div className="ir-error">{optError}</div>}

          {optResult && (
            <div>
              <hr className="ir-divider" />
              <div className="ir-kpi-grid">
                <div className="ir-kpi-card"><div className="ir-kpi-label">Solver Status</div><div className="ir-kpi-value" style={{ fontSize: 15, color: optResult.solver_status === 'OPTIMAL' ? '#2e7d32' : '#f57f17' }}>{optResult.solver_status}</div></div>
                <div className="ir-kpi-card orange"><div className="ir-kpi-label">Blocks Scheduled</div><div className="ir-kpi-value">{optResult.total_blocks_scheduled}</div></div>
                <div className="ir-kpi-card green"><div className="ir-kpi-label">Requests Covered</div><div className="ir-kpi-value">{optResult.total_maintenance_requests_covered}</div></div>
                <div className="ir-kpi-card red"><div className="ir-kpi-label">Unassigned</div><div className="ir-kpi-value">{optResult.total_unassigned_requests}</div></div>
                <div className="ir-kpi-card gold"><div className="ir-kpi-label">Shadow Hours Saved</div><div className="ir-kpi-value">{optResult.total_shadow_overlap_hours.toFixed(2)}</div></div>
                <div className="ir-kpi-card"><div className="ir-kpi-label">Solver Time</div><div className="ir-kpi-value" style={{ fontSize: 15 }}>{optResult.solver_execution_time_ms.toFixed(0)} ms</div></div>
                <div className="ir-kpi-card"><div className="ir-kpi-label">Total CI Score</div><div className="ir-kpi-value" style={{ fontSize: 15 }}>{optResult.total_criticality_index.toFixed(1)}</div></div>
                <div className="ir-kpi-card red"><div className="ir-kpi-label">Train Detention</div><div className="ir-kpi-value" style={{ fontSize: 15 }}>{optResult.total_train_detention_minutes} min</div></div>
              </div>

              {optResult.scheduled_blocks.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ir-table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Block Code</th><th>Section</th><th>Date</th><th>Window</th><th>Primary Dept</th><th>Participating</th><th>CI Score</th><th>Shadow Hrs</th><th>Detention</th><th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optResult.scheduled_blocks.map((b, i) => (
                        <tr key={i}>
                          <td className="mono">{b.block_code}</td>
                          <td>{b.section_code ?? (b.section_id ? b.section_id.slice(0, 8) : '—')}</td>
                          <td>{b.block_date ?? '—'}</td>
                          <td>{(b.start_time ?? '').slice(0, 5)} – {(b.end_time ?? '').slice(0, 5)}</td>
                          <td><span className={`ir-badge ir-badge-${(b.primary_department ?? 'TRACK').toLowerCase()}`}>{b.primary_department ?? 'TRACK'}</span></td>
                          <td>{(b.participating_departments ?? []).join(', ')}</td>
                          <td>{(b.total_criticality_index ?? 0).toFixed(1)}</td>
                          <td>{(b.shadow_overlap_hours ?? 0).toFixed(2)}</td>
                          <td style={{ color: b.estimated_train_detention_minutes > 0 ? '#c62828' : 'inherit' }}>{b.estimated_train_detention_minutes}</td>
                          <td><span className={`ir-badge ${b.is_joint_shadow_block ? 'ir-badge-scheduled' : 'ir-badge-freight'}`}>{b.is_joint_shadow_block ? 'JOINT SHADOW' : 'PRIMARY'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* What-If Simulator */}
      <div className="ir-panel">
        <div className="ir-panel-header">What-If Block Simulator — Feasibility &amp; Impact Analysis</div>
        <div className="ir-panel-body">
          <div className="ir-form-row">
            <div className="ir-form-group">
              <label className="ir-label">Section</label>
              <select className="ir-select" value={simSectionId} onChange={e => setSimSectionId(e.target.value)}>
                <option value="">— Select —</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.section_code} — {s.division}</option>)}
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Date</label>
              <input className="ir-input" type="date" value={simDate} onChange={e => setSimDate(e.target.value)} />
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Block Start Time</label>
              <input className="ir-input" type="time" value={simStart} onChange={e => setSimStart(e.target.value)} />
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Block End Time</label>
              <input className="ir-input" type="time" value={simEnd} onChange={e => setSimEnd(e.target.value)} />
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Allow SLW Fallback</label>
              <select className="ir-select" value={simSlw ? 'yes' : 'no'} onChange={e => setSimSlw(e.target.value === 'yes')}>
                <option value="no">No</option>
                <option value="yes">Yes (Single Line Working)</option>
              </select>
            </div>
            <div className="ir-form-group" style={{ justifyContent: 'flex-end' }}>
              <button className="ir-btn ir-btn-navy" onClick={handleSimulate} disabled={simLoading}>
                {simLoading ? 'Simulating...' : '⚡ Simulate'}
              </button>
            </div>
          </div>

          {/* Maintenance request selection */}
          <div style={{ marginBottom: 8 }}>
            <div className="ir-label" style={{ marginBottom: 4 }}>Bundle Maintenance Requests (check to include in simulated block):</div>
            {pendingDefects.length === 0 ? (
              <div className="ir-empty">No PENDING maintenance requests. Ingest defects using the Forms tab first.</div>
            ) : (
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #ddd', padding: 6 }}>
                {pendingDefects.map(d => (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', cursor: 'pointer', fontSize: 12 }}>
                    <input type="checkbox" checked={simReqIds.includes(d.id)} onChange={() => toggleReqId(d.id)} />
                    <span className={`ir-badge ir-badge-${d.department.toLowerCase()}`}>{d.department}</span>
                    <strong>{d.request_code}</strong> — {d.activity_type} ({d.duration_minutes} min) — <span style={{ color: d.priority === 'CRITICAL' ? '#c62828' : '#555' }}>{d.priority}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {simError && <div className="ir-error">{simError}</div>}

          {/* Simulation Result */}
          {simResult && (
            <div style={{ border: `2px solid ${simResult.is_feasible ? '#2e7d32' : '#c62828'}`, padding: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: simResult.is_feasible ? '#2e7d32' : '#c62828', marginBottom: 8 }}>
                {simResult.is_feasible ? '✔ FEASIBLE — Block can be scheduled in this window' : '✘ NOT FEASIBLE — Hard constraints violated'}
                {simResult.has_vip_train_conflict && <span style={{ color: '#c62828', marginLeft: 10 }}>⚠ VIP TRAIN CONFLICT (Zero-Detention Hard Constraint)</span>}
              </div>

              <div className="ir-form-row" style={{ marginBottom: 0 }}>
                <div><div className="ir-kpi-label">Total Detention</div><strong>{simResult.total_detention_minutes} min</strong></div>
                <div><div className="ir-kpi-label">Conflicting Trains</div><strong>{simResult.conflicting_trains_count}</strong></div>
                <div><div className="ir-kpi-label">CI Preserved</div><strong>{simResult.criticality_index_preserved_pct.toFixed(1)}%</strong></div>
                <div><div className="ir-kpi-label">Shadow Efficiency</div><strong>{simResult.shadow_efficiency_score.toFixed(2)}</strong></div>
                <div><div className="ir-kpi-label">SLW Advisory</div><strong style={{ color: simResult.slw_advisory_required ? '#c62828' : '#2e7d32' }}>{simResult.slw_advisory_required ? 'REQUIRED' : 'NOT REQUIRED'}</strong></div>
              </div>

              {simResult.conflicting_trains.length > 0 && (
                <div style={{ marginTop: 10, overflowX: 'auto' }}>
                  <div className="ir-label" style={{ marginBottom: 4 }}>Conflicting Trains:</div>
                  <table className="ir-table">
                    <thead><tr><th>Train No.</th><th>Name</th><th>Type</th><th>Departure</th><th>Arrival</th><th>Detention (min)</th><th>Penalty Tier</th><th>Hard Conflict</th></tr></thead>
                    <tbody>
                      {simResult.conflicting_trains.map((ct, i) => (
                        <tr key={i}>
                          <td>{ct.train_number}</td>
                          <td>{ct.train_name}</td>
                          <td>{ct.train_type}</td>
                          <td>{ct.scheduled_departure}</td>
                          <td>{ct.scheduled_arrival}</td>
                          <td style={{ color: ct.expected_detention_minutes > 0 ? '#c62828' : 'inherit', fontWeight: ct.expected_detention_minutes > 0 ? 700 : 400 }}>{ct.expected_detention_minutes}</td>
                          <td>{ct.detention_penalty_tier === 1 ? 'TIER-1 VIP' : ct.detention_penalty_tier === 2 ? 'TIER-2 Express' : 'TIER-3 Freight'}</td>
                          <td style={{ color: ct.is_hard_conflict ? '#c62828' : '#2e7d32', fontWeight: 700 }}>{ct.is_hard_conflict ? 'YES' : 'NO'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {simResult.is_feasible && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input className="ir-input" style={{ maxWidth: 220 }} placeholder="Approved by (name / designation)" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} />
                  <button className="ir-btn ir-btn-success" onClick={handleCommit} disabled={commitLoading}>
                    {commitLoading ? 'Committing...' : '✔ Commit Block to Database'}
                  </button>
                  <span style={{ fontSize: 10, color: '#888' }}>HMAC token expires: {new Date(simResult.expires_at).toLocaleTimeString('en-IN')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
