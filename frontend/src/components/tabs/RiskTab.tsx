import { useState } from 'react';
import type { MaintenanceRequest, RiskPredictionResponse, ModelInfoResponse } from '../../api/client';
import { predictRisk } from '../../api/client';

interface Props {
  defects: MaintenanceRequest[];
  modelInfo: ModelInfoResponse | null;
  loading: boolean;
  onNotify: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const FEATURE_LABELS: Record<string, string> = {
  tgi_deviation: 'TGI Deviation',
  speed_restriction_kmh: 'Speed Restriction (km/h)',
  days_overdue: 'Days Overdue',
  section_gmt_density: 'GMT Density',
  point_failure_risk: 'Point Failure Risk',
  ohe_insulator_wear: 'OHE Insulator Wear',
  usfd_flaw_severity: 'USFD Flaw Severity',
  'department_code_TRACK': 'Dept: Track',
  'department_code_SIGNAL': 'Dept: Signal',
  'department_code_TRACTION': 'Dept: Traction',
  'priority_code_CRITICAL': 'Priority: Critical',
  'priority_code_HIGH': 'Priority: High',
};

export function RiskTab({ defects, modelInfo, loading, onNotify }: Props) {
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [scores, setScores] = useState<Record<string, RiskPredictionResponse>>({});
  const [scoring, setScoring] = useState<Record<string, boolean>>({});
  const [expandedShap, setExpandedShap] = useState<string | null>(null);

  const filtered = defects.filter(d => {
    if (deptFilter && d.department !== deptFilter) return false;
    if (priorityFilter && d.priority !== priorityFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  async function scoreDefect(d: MaintenanceRequest) {
    setScoring(prev => ({ ...prev, [d.id]: true }));
    try {
      const meta = (d.metadata_json ?? {}) as Record<string, unknown>;
      const result = await predictRisk({
        request_code: d.request_code,
        department: d.department,
        activity_type: d.activity_type,
        priority: d.priority,
        tgi_deviation: typeof meta.tgi_deviation === 'number' ? meta.tgi_deviation : undefined,
        speed_restriction_kmh: typeof meta.speed_restriction_kmh === 'number' ? meta.speed_restriction_kmh : undefined,
        days_overdue: typeof meta.days_overdue === 'number' ? meta.days_overdue : undefined,
        section_gmt_density: typeof meta.section_gmt_density === 'number' ? meta.section_gmt_density : undefined,
        point_failure_risk: typeof meta.point_failure_risk === 'number' ? meta.point_failure_risk : undefined,
        ohe_insulator_wear: typeof meta.ohe_insulator_wear === 'number' ? meta.ohe_insulator_wear : undefined,
        usfd_classification: typeof meta.usfd_classification === 'string' ? meta.usfd_classification : undefined,
        metadata_json: meta,
      });
      setScores(prev => ({ ...prev, [d.id]: result }));
    } catch (e: unknown) {
      onNotify(e instanceof Error ? e.message : 'Scoring failed', 'error');
    } finally {
      setScoring(prev => ({ ...prev, [d.id]: false }));
    }
  }

  function ciClass(ci: number) {
    if (ci >= 75) return 'high';
    if (ci >= 40) return 'medium';
    return 'low';
  }

  function ciColor(ci: number) {
    if (ci >= 75) return '#c62828';
    if (ci >= 40) return '#e65100';
    return '#2e7d32';
  }

  return (
    <div>
      {/* AI Model Info Bar */}
      <div className="ir-panel">
        <div className="ir-panel-header">AI Risk Engine — Stage 2 Model Information</div>
        <div className="ir-panel-body">
          {!modelInfo ? (
            <div className="ir-empty">Model information unavailable. Check if backend is running.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: 12 }}>
              <div><span className="ir-label">Model: </span><strong>{modelInfo.model_name ?? '—'}</strong></div>
              <div><span className="ir-label">Version: </span><strong>{modelInfo.version ?? '—'}</strong></div>
              <div><span className="ir-label">Status: </span>
                <span style={{ color: modelInfo.status === 'ready' ? '#2e7d32' : '#c62828', fontWeight: 700 }}>
                  {(modelInfo.status ?? '—').toUpperCase()}
                </span>
              </div>
              {modelInfo.created_at && <div><span className="ir-label">Trained: </span>{modelInfo.created_at.slice(0, 10)}</div>}
              {modelInfo.metrics && Object.entries(modelInfo.metrics).slice(0, 5).map(([k, v]) => (
                <div key={k}><span className="ir-label">{k.toUpperCase()}: </span><strong>{typeof v === 'number' ? v.toFixed(4) : String(v)}</strong></div>
              ))}
              {modelInfo.disclaimer && <div style={{ fontSize: 10, color: '#888', flexBasis: '100%' }}>{modelInfo.disclaimer}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Filter + Table */}
      <div className="ir-panel">
        <div className="ir-panel-header">Maintenance Requests — AI Criticality Inspector (XGBoost + SHAP)</div>
        <div className="ir-panel-body">
          <div className="ir-form-row" style={{ marginBottom: 10 }}>
            <div className="ir-form-group">
              <label className="ir-label">Department</label>
              <select className="ir-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                <option>TRACK</option>
                <option>SIGNAL</option>
                <option>TRACTION</option>
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Priority</label>
              <select className="ir-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                <option>CRITICAL</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Status</label>
              <select className="ir-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option>PENDING</option>
                <option>SCHEDULED</option>
                <option>COMPLETED</option>
                <option>CANCELLED</option>
              </select>
            </div>
            <div className="ir-form-group" style={{ justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: '#555', paddingBottom: 4 }}>
                {filtered.length} record(s) | {Object.keys(scores).length} scored
              </span>
            </div>
          </div>

          {loading ? (
            <div className="ir-loading"><div className="ir-spinner" /> Loading maintenance records...</div>
          ) : filtered.length === 0 ? (
            <div className="ir-empty">No maintenance requests match the selected filters.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>Request Code</th>
                    <th>Dept</th>
                    <th>Activity</th>
                    <th>Priority</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Criticality Index (CI)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const sc = scores[d.id];
                    const shapExpanded = expandedShap === d.id;
                    return (
                      <>
                        <tr key={d.id}>
                          <td className="mono">{d.request_code}</td>
                          <td><span className={`ir-badge ir-badge-${d.department.toLowerCase()}`}>{d.department}</span></td>
                          <td>{d.activity_type}</td>
                          <td><span className={`ir-badge ir-badge-${d.priority === 'CRITICAL' ? 'active' : d.priority === 'HIGH' ? 'express' : 'freight'}`}>{d.priority}</span></td>
                          <td>{d.deadline}</td>
                          <td><span className={`ir-badge ir-badge-${d.status.toLowerCase()}`}>{d.status}</span></td>
                          <td>{d.duration_minutes} min</td>
                          <td style={{ minWidth: 140 }}>
                            {sc ? (
                              <>
                                <div style={{ fontWeight: 700, fontSize: 14, color: ciColor(sc.criticality_index) }}>
                                  {sc.criticality_index.toFixed(1)} / 100
                                </div>
                                <div className="ir-ci-bar-wrap" style={{ marginTop: 2 }}>
                                  <div className={`ir-ci-bar ${ciClass(sc.criticality_index)}`} style={{ width: `${sc.criticality_index}%` }} />
                                </div>
                                <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                                  P(fail)={(sc.failure_probability * 100).toFixed(1)}% | {sc.scoring_mode ?? sc.model_used}
                                </div>
                                <button
                                  style={{ fontSize: 10, color: '#003366', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                                  onClick={() => setExpandedShap(shapExpanded ? null : d.id)}
                                >
                                  {shapExpanded ? '▲ Hide SHAP' : '▼ Show SHAP'}
                                </button>
                              </>
                            ) : (
                              <span style={{ color: '#aaa', fontSize: 11 }}>Not yet scored</span>
                            )}
                          </td>
                          <td>
                            <button className="ir-btn ir-btn-outline" style={{ fontSize: 11 }} onClick={() => scoreDefect(d)} disabled={scoring[d.id]}>
                              {scoring[d.id] ? 'Scoring...' : '🧠 Score AI'}
                            </button>
                          </td>
                        </tr>
                        {sc && shapExpanded && (
                          <tr key={`${d.id}-shap`} style={{ background: '#f0f4f8' }}>
                            <td colSpan={9} style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6, color: '#003366' }}>
                                SHAP Explanation — {sc.shap_explanation.human_readable_reasoning}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {Object.entries(sc.shap_explanation.feature_attributions)
                                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                                  .slice(0, 10)
                                  .map(([feat, val]) => (
                                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 200, flex: '1 1 200px', fontSize: 11, padding: '3px 0', borderBottom: '1px solid #ddd' }}>
                                      <span style={{ flex: 1, color: '#444' }}>{FEATURE_LABELS[feat] ?? feat}</span>
                                      <span style={{ width: Math.abs(val) * 300, height: 8, background: val >= 0 ? '#c62828' : '#2e7d32', display: 'inline-block', minWidth: 2 }} />
                                      <span style={{ fontWeight: 700, color: val >= 0 ? '#c62828' : '#2e7d32', minWidth: 55, textAlign: 'right' }}>
                                        {val >= 0 ? '+' : ''}{val.toFixed(4)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 10, color: '#888' }}>
                                Base value: {sc.shap_explanation.base_value.toFixed(4)} | Space: {sc.shap_explanation.space}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
