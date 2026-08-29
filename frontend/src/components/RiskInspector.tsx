import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronRight, Activity, HelpCircle } from 'lucide-react';
import { MaintenanceDefect } from '../api/client';

interface RiskInspectorProps {
  defects: MaintenanceDefect[];
}

export const RiskInspector: React.FC<RiskInspectorProps> = ({ defects }) => {
  const [expandedId, setExpandedId] = useState<string | null>(defects[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="ir-panel">
      <div className="ir-panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={15} color="#ffb74d" />
          AI RISK & CRITICALITY SCORING ENGINE (STAGE 2 — CATBOOST/XGBOOST + PROBABILITY SHAP)
        </span>
        <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#ffb74d' }}>
          ACTIVE MODEL: <strong>calibrated_monotone_v2</strong> • MULTI-DEPARTMENT DEFECT BACKLOG
        </span>
      </div>

      <div className="ir-panel-body" style={{ padding: 0 }}>
        <table className="ir-table">
          <thead>
            <tr>
              <th style={{ width: '30px' }}></th>
              <th>REQUEST CODE</th>
              <th>DEPT</th>
              <th>ACTIVITY & ASSET</th>
              <th>SECTION & LOCATION</th>
              <th>DAYS OVERDUE</th>
              <th>FAIL PROB</th>
              <th>CRITICALITY INDEX (CI)</th>
              <th>PRIORITY</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((def) => {
              const isExpanded = expandedId === def.id;
              const ciColor = def.criticality_index >= 80 ? '#c62828' : def.criticality_index >= 50 ? '#e65100' : '#2e7d32';

              return (
                <React.Fragment key={def.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(def.id)}>
                    <td style={{ textAlign: 'center' }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: '#003366' }}>
                      {def.request_code}
                    </td>
                    <td>
                      <span className={`ir-badge ${def.department === 'TRACK' ? 'ir-badge-vip' : def.department === 'SIGNAL' ? 'ir-badge-express' : 'ir-badge-freight'}`}>
                        {def.department}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{def.activity_type}</td>
                    <td>{def.kilometer_marker || def.section_code}</td>
                    <td style={{ fontWeight: 700, color: def.days_overdue > 10 ? '#c62828' : '#111111' }}>
                      {def.days_overdue} days
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {def.failure_probability ? `${(def.failure_probability * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '8px', background: '#e0e0e0', minWidth: '60px' }}>
                          <div
                            style={{
                              width: `${def.criticality_index}%`,
                              height: '100%',
                              background: ciColor,
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontWeight: 700, color: ciColor }}>
                          {def.criticality_index}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`ir-badge ${def.priority === 'CRITICAL' ? 'ir-badge-active' : def.priority === 'HIGH' ? 'ir-badge-express' : 'ir-badge-completed'}`}>
                        {def.priority}
                      </span>
                    </td>
                  </tr>

                  {/* Expandable SHAP Explainability Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '2px solid #003366' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                          
                          {/* Controller Reasoning */}
                          <div>
                            <div style={{ fontWeight: 700, color: '#003366', fontSize: '11px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <HelpCircle size={12} color="#003366" />
                              SECTION CONTROLLER NATURAL LANGUAGE REASONING (PROBABILITY-SPACE SHAP)
                            </div>
                            <div style={{ background: '#ffffff', border: '1px solid #d0d7de', padding: '8px', fontSize: '11px', lineHeight: 1.5 }}>
                              {def.shap_reasoning || 'Calibrated model evaluated condition metrics against 50 latent railway section regimes.'}
                            </div>
                          </div>

                          {/* Raw Feature Values */}
                          <div>
                            <div style={{ fontWeight: 700, color: '#003366', fontSize: '11px', marginBottom: '4px' }}>
                              STATUTORY ASSET CONDITION METRICS
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
                              {def.metadata.tgi_deviation !== undefined && (
                                <div>TGI Deviation: <strong>{def.metadata.tgi_deviation}/100</strong></div>
                              )}
                              {def.metadata.speed_restriction_kmh !== undefined && (
                                <div>TSR Speed Drop: <strong>{def.metadata.speed_restriction_kmh} km/h</strong></div>
                              )}
                              {def.metadata.usfd_flaw_severity !== undefined && (
                                <div>USFD Flaw: <strong style={{ color: '#c62828' }}>{def.metadata.usfd_flaw_severity}</strong></div>
                              )}
                              {def.metadata.point_failure_risk !== undefined && (
                                <div>Point Jam Risk: <strong>{def.metadata.point_failure_risk}%</strong></div>
                              )}
                              {def.metadata.ohe_insulator_wear !== undefined && (
                                <div>OHE Wear: <strong>{def.metadata.ohe_insulator_wear}%</strong></div>
                              )}
                              {def.metadata.section_gmt_density !== undefined && (
                                <div>Traffic GMT: <strong>{def.metadata.section_gmt_density} GMT</strong></div>
                              )}
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
