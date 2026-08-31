import React, { useState } from 'react';
import type { Block, Section } from '../../api/client';
import { transitionBlock, rescheduleBlock } from '../../api/client';

interface Props {
  blocks: Block[];
  sections: Section[];
  loading: boolean;
  onNotify: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onRefresh: () => void;
}

const STATUS_FLOW = ['PROPOSED', 'APPROVED', 'ACTIVE', 'COMPLETED'];

export function BlocksTab({ blocks, sections, loading, onNotify, onRefresh }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  // Transition form fields
  const [discPn, setDiscPn] = useState('');
  const [reconnPn, setReconnPn] = useState('');
  const [smName, setSmName] = useState('');
  const [engName, setEngName] = useState('');
  const [engDesig, setEngDesig] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [tsrImposed, setTsrImposed] = useState(false);
  const [tsrSpeed, setTsrSpeed] = useState(45);
  const [transLoading, setTransLoading] = useState(false);

  // Reschedule
  const [delayMin, setDelayMin] = useState(25);
  const [reschedLoading, setReschedLoading] = useState(false);

  const sectionMap = Object.fromEntries((sections ?? []).map(s => [s.id, s]));
  const filtered = (blocks ?? []).filter(b => !statusFilter || b.status === statusFilter);

  async function doTransition(targetStatus: string) {
    if (!selectedBlock) return;
    setTransLoading(true);
    try {
      const payload: Record<string, unknown> = { target_status: targetStatus };
      if (targetStatus === 'APPROVED') {
        payload.approved_by = approvedBy || undefined;
        payload.remarks = remarks || undefined;
      }
      if (targetStatus === 'ACTIVE') {
        payload.disconnection_private_number = discPn;
        payload.station_master_name = smName;
        payload.field_engineer_name = engName;
        payload.field_engineer_designation = engDesig;
      }
      if (targetStatus === 'COMPLETED') {
        payload.reconnection_private_number = reconnPn;
        payload.tsr_imposed = tsrImposed;
        if (tsrImposed) payload.tsr_speed_kmph = tsrSpeed;
      }
      if (targetStatus === 'CANCELLED') {
        payload.remarks = remarks || undefined;
      }
      const updated = await transitionBlock(selectedBlock.id, payload as unknown as Parameters<typeof transitionBlock>[1]);
      setSelectedBlock(updated);
      onNotify(`Block ${updated.block_code} → ${updated.status}`, 'success');
      onRefresh();
    } catch (e: unknown) {
      onNotify(e instanceof Error ? e.message : 'Transition failed', 'error');
    } finally {
      setTransLoading(false);
    }
  }

  async function doReschedule() {
    if (!selectedBlock) return;
    setReschedLoading(true);
    try {
      await rescheduleBlock({ active_block_id: selectedBlock.id, delay_minutes: delayMin });
      onNotify('Greedy rescheduler executed — check advisory', 'success');
    } catch (e: unknown) {
      onNotify(e instanceof Error ? e.message : 'Reschedule failed', 'error');
    } finally {
      setReschedLoading(false);
    }
  }

  function stateClass(status: string, current: string) {
    const ci = STATUS_FLOW.indexOf(current ?? '');
    const si = STATUS_FLOW.indexOf(status);
    if (current === 'CANCELLED') return status === current ? 'cancelled-state' : '';
    if (si < ci) return 'done-state';
    if (si === ci) return 'active-state';
    return '';
  }

  function selectBlock(b: Block) {
    setSelectedBlock(b);
    setDiscPn(''); setReconnPn(''); setSmName(''); setEngName('');
    setEngDesig(''); setApprovedBy(''); setRemarks('');
    setTsrImposed(false);
  }

  const meta = (selectedBlock?.optimizer_metadata ?? {}) as Record<string, unknown>;
  const jobs = selectedBlock?.block_jobs ?? [];

  return (
    <div className="ir-two-col" style={{ alignItems: 'start' }}>
      {/* Left: Block List */}
      <div className="ir-panel">
        <div className="ir-panel-header">All Scheduled Blocks</div>
        <div className="ir-panel-body">
          <div className="ir-form-row" style={{ marginBottom: 8 }}>
            <div className="ir-form-group">
              <label className="ir-label">Filter by Status</label>
              <select className="ir-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSelectedBlock(null); }}>
                <option value="">All Statuses</option>
                {['PROPOSED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="ir-form-group" style={{ justifyContent: 'flex-end' }}>
              <button className="ir-btn ir-btn-outline" style={{ fontSize: 11 }} onClick={onRefresh}>↻ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="ir-loading"><div className="ir-spinner" /> Loading blocks...</div>
          ) : filtered.length === 0 ? (
            <div className="ir-empty">No blocks found. Run the AI Optimizer (Planner tab) or What-If Simulator to generate blocks.</div>
          ) : (
            <table className="ir-table">
              <thead>
                <tr><th>Block Code</th><th>Section</th><th>Date</th><th>Window</th><th>Status</th><th>Jobs</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const startTime = (b.start_time ?? '').slice(0, 5);
                  const endTime = (b.end_time ?? '').slice(0, 5);
                  const numJobs = (b.block_jobs ?? []).length;
                  return (
                    <tr
                      key={b.id}
                      style={{ cursor: 'pointer', background: selectedBlock?.id === b.id ? '#e3f2fd' : undefined }}
                      onClick={() => selectBlock(b)}
                    >
                      <td className="mono">{b.block_code}</td>
                      <td>{sectionMap[b.section_id]?.section_code ?? (b.section_id ? b.section_id.slice(0, 8) : '—')}</td>
                      <td>{b.block_date ?? '—'}</td>
                      <td>{startTime} – {endTime}</td>
                      <td><span className={`ir-badge ir-badge-${(b.status ?? '').toLowerCase()}`}>{b.status}</span></td>
                      <td>{numJobs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: Block Detail & State Machine */}
      <div>
        {!selectedBlock ? (
          <div className="ir-panel">
            <div className="ir-panel-body">
              <div className="ir-empty">← Select a block from the list to manage its G&amp;SR lifecycle and transitions.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Block Detail */}
            <div className="ir-panel">
              <div className="ir-panel-header">{selectedBlock.block_code} — Block Detail &amp; Lifecycle</div>
              <div className="ir-panel-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, fontSize: 12 }}>
                  <div><span className="ir-label">Section: </span>{sectionMap[selectedBlock.section_id]?.section_code ?? '—'}</div>
                  <div><span className="ir-label">Date: </span>{selectedBlock.block_date ?? '—'}</div>
                  <div><span className="ir-label">Time Window: </span>{(selectedBlock.start_time ?? '').slice(0, 5)} – {(selectedBlock.end_time ?? '').slice(0, 5)}</div>
                  <div><span className="ir-label">Duration: </span>{selectedBlock.duration_minutes ?? 0} min</div>
                  <div><span className="ir-label">Train Impact: </span>{selectedBlock.train_impact_count ?? 0} trains | Score: {Number(selectedBlock.impact_score ?? 0).toFixed(2)}</div>
                  <div><span className="ir-label">Status: </span><span className={`ir-badge ir-badge-${(selectedBlock.status ?? '').toLowerCase()}`}>{selectedBlock.status}</span></div>
                  {Boolean(meta.primary_department) && (
                    <div><span className="ir-label">Primary Dept: </span><span className={`ir-badge ir-badge-${String(meta.primary_department).toLowerCase()}`}>{String(meta.primary_department)}</span></div>
                  )}
                  {meta.is_joint_shadow_block !== undefined && (
                    <div><span className="ir-label">Block Type: </span><strong>{String(meta.is_joint_shadow_block) === 'true' ? 'JOINT SHADOW BLOCK' : 'PRIMARY BLOCK'}</strong></div>
                  )}
                  {meta.shadow_overlap_hours !== undefined && (
                    <div><span className="ir-label">Shadow Hours: </span>{Number(meta.shadow_overlap_hours).toFixed(2)}</div>
                  )}
                  {meta.total_criticality_index !== undefined && (
                    <div><span className="ir-label">Total CI: </span>{Number(meta.total_criticality_index).toFixed(1)}</div>
                  )}
                </div>

                <hr className="ir-divider" />

                {/* State Flow Indicator */}
                <div className="ir-label" style={{ marginBottom: 4 }}>G&amp;SR Block Lifecycle:</div>
                <div className="ir-state-flow">
                  {STATUS_FLOW.map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <span className="ir-state-arrow">→</span>}
                      <span className={`ir-state-node ${stateClass(s, selectedBlock.status)}`}>{s}</span>
                    </React.Fragment>
                  ))}
                  {selectedBlock.status === 'CANCELLED' && (
                    <>
                      <span className="ir-state-arrow">|</span>
                      <span className="ir-state-node cancelled-state">CANCELLED</span>
                    </>
                  )}
                </div>

                <hr className="ir-divider" />

                {/* PROPOSED → APPROVED */}
                {selectedBlock.status === 'PROPOSED' && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: '#003366' }}>Approve this Block</div>
                    <div className="ir-form-row">
                      <div className="ir-form-group">
                        <label className="ir-label">Approved By</label>
                        <input className="ir-input" placeholder="Sr. DOM/Chennai" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} />
                      </div>
                      <div className="ir-form-group">
                        <label className="ir-label">Remarks</label>
                        <input className="ir-input" placeholder="Optional operational remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="ir-btn ir-btn-success" onClick={() => doTransition('APPROVED')} disabled={transLoading}>✔ Approve Block</button>
                      <button className="ir-btn ir-btn-danger" onClick={() => doTransition('CANCELLED')} disabled={transLoading}>✘ Cancel Block</button>
                    </div>
                  </div>
                )}

                {/* APPROVED → ACTIVE */}
                {selectedBlock.status === 'APPROVED' && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: '#003366' }}>Activate Block</div>
                    <div style={{ fontSize: 11, color: '#c62828', marginBottom: 8 }}>
                      ⚠ Station Master Private Number (PN) is mandatory to activate under G&amp;SR rules.
                    </div>
                    <div className="ir-form-row">
                      <div className="ir-form-group">
                        <label className="ir-label">Disconnection Private No. *</label>
                        <input className="ir-input" placeholder="PN-4821" value={discPn} onChange={e => setDiscPn(e.target.value)} />
                      </div>
                      <div className="ir-form-group">
                        <label className="ir-label">Station Master Name</label>
                        <input className="ir-input" placeholder="R. K. Sharma" value={smName} onChange={e => setSmName(e.target.value)} />
                      </div>
                      <div className="ir-form-group">
                        <label className="ir-label">Field Engineer Name</label>
                        <input className="ir-input" placeholder="P. V. Nair" value={engName} onChange={e => setEngName(e.target.value)} />
                      </div>
                      <div className="ir-form-group">
                        <label className="ir-label">Designation</label>
                        <input className="ir-input" placeholder="SSE/Permanent Way/MAS" value={engDesig} onChange={e => setEngDesig(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="ir-btn ir-btn-primary" onClick={() => doTransition('ACTIVE')} disabled={transLoading || !discPn}>
                        🔴 Activate Block
                      </button>
                      <button className="ir-btn ir-btn-danger" onClick={() => doTransition('CANCELLED')} disabled={transLoading}>✘ Cancel</button>
                    </div>
                  </div>
                )}

                {/* ACTIVE → COMPLETED + Reschedule */}
                {selectedBlock.status === 'ACTIVE' && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: '#003366' }}>Complete Block (Reconnection)</div>
                    <div style={{ fontSize: 11, color: '#c62828', marginBottom: 8 }}>
                      ⚠ Reconnection Private Number (PN) is mandatory before granting Line Clear under G&amp;SR.
                    </div>
                    <div className="ir-form-row">
                      <div className="ir-form-group">
                        <label className="ir-label">Reconnection Private No. *</label>
                        <input className="ir-input" placeholder="PN-4899" value={reconnPn} onChange={e => setReconnPn(e.target.value)} />
                      </div>
                      <div className="ir-form-group">
                        <label className="ir-label">TSR Imposed?</label>
                        <select className="ir-select" value={tsrImposed ? 'yes' : 'no'} onChange={e => setTsrImposed(e.target.value === 'yes')}>
                          <option value="no">No Temporary Speed Restriction</option>
                          <option value="yes">Yes — TSR Imposed (Caution Order)</option>
                        </select>
                      </div>
                      {tsrImposed && (
                        <div className="ir-form-group">
                          <label className="ir-label">TSR Speed (km/h)</label>
                          <input className="ir-input" type="number" value={tsrSpeed} min={10} max={75} onChange={e => setTsrSpeed(Number(e.target.value))} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="ir-btn ir-btn-success" onClick={() => doTransition('COMPLETED')} disabled={transLoading || !reconnPn}>
                        ✔ Complete Block
                      </button>
                      <button className="ir-btn ir-btn-danger" onClick={() => doTransition('CANCELLED')} disabled={transLoading}>✘ Cancel</button>
                    </div>

                    <hr className="ir-divider" />
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Emergency Rescheduler — Live Train Delay</div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                      If a train is running late, the greedy rescheduler will compute an adjusted possession window to minimise further detention.
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div className="ir-form-group">
                        <label className="ir-label">Train Delay (minutes)</label>
                        <input className="ir-input" type="number" style={{ width: 100 }} value={delayMin} min={1} max={180} onChange={e => setDelayMin(Number(e.target.value))} />
                      </div>
                      <button className="ir-btn ir-btn-navy" onClick={doReschedule} disabled={reschedLoading}>
                        {reschedLoading ? 'Rescheduling...' : '⚡ Greedy Reschedule'}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedBlock.status === 'COMPLETED' || selectedBlock.status === 'CANCELLED') && (
                  <div style={{ fontSize: 12, color: '#666', padding: '8px 0' }}>
                    This block is <strong>{selectedBlock.status.toLowerCase()}</strong>. No further lifecycle transitions are possible.
                  </div>
                )}
              </div>
            </div>

            {/* Block Jobs */}
            {jobs.length > 0 && (
              <div className="ir-panel">
                <div className="ir-panel-header">Bundled Jobs in this Block ({jobs.length})</div>
                <div className="ir-panel-body">
                  <table className="ir-table">
                    <thead>
                      <tr><th>#</th><th>Maintenance Request ID</th><th>Sequence / Role</th><th>Added On</th></tr>
                    </thead>
                    <tbody>
                      {jobs.map((j, i) => (
                        <tr key={j.id ?? i}>
                          <td>{i + 1}</td>
                          <td className="mono" style={{ fontSize: 10 }}>{j.maintenance_request_id ?? '—'}</td>
                          <td>{j.sequence_order === 1 ? <strong>PRIMARY (Anchor)</strong> : `Shadow Activity #${j.sequence_order ?? i + 1}`}</td>
                          <td>{j.created_at ? new Date(j.created_at).toLocaleString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
