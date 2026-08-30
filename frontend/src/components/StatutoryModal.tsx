import React, { useState } from 'react';
import { FileText, Key, CheckCircle, X, Printer } from 'lucide-react';
import { ScheduledBlock } from '../api/client';

interface StatutoryModalProps {
  block: ScheduledBlock | null;
  onClose: () => void;
  onTransitionSuccess: (blockId: string, newStatus: string, pn: string) => void;
}

export const StatutoryModal: React.FC<StatutoryModalProps> = ({
  block,
  onClose,
  onTransitionSuccess,
}) => {
  if (!block) return null;

  const [activeTab, setActiveTab] = useState<'T351' | 'TD602'>('T351');
  const [privateNumber, setPrivateNumber] = useState<string>('');
  const [smName, setSmName] = useState<string>('R. K. Sharma (SM/MAS)');
  const [fieldEngName, setFieldEngName] = useState<string>('P. V. Nair (SSE/P.Way)');
  const [tsrSpeed, setTsrSpeed] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuthorize = () => {
    if (!privateNumber) {
      alert('Statutory G&SR Violation: Station Master Private Number (PN) is mandatory.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage(`Block ${block.block_code} officially authorized under Private Number ${privateNumber}.`);
      onTransitionSuccess(block.id, 'ACTIVE', privateNumber);
    }, 600);
  };

  const handleClearBlock = () => {
    if (!privateNumber) {
      alert('Statutory G&SR Violation: Reconnection Private Number (PN) is mandatory.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage(`Block ${block.block_code} officially cleared. Reconnection PN: ${privateNumber}. TSR: ${tsrSpeed} km/h.`);
      onTransitionSuccess(block.id, 'COMPLETED', privateNumber);
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '780px',
          maxWidth: '100%',
          border: '2px solid #003366',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: '#003366',
            color: '#ffffff',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #f37021',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#f37021" />
            STATUTORY INDIAN RAILWAYS POSSESSION & DISCONNECTION PORTAL
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #d0d7de', background: '#f0f4f8' }}>
          <button
            onClick={() => setActiveTab('T351')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderBottom: activeTab === 'T351' ? '3px solid #003366' : 'none',
              background: activeTab === 'T351' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '12px',
              color: '#003366',
              cursor: 'pointer',
            }}
          >
            FORM T/351: DISCONNECTION & RECONNECTION NOTICE
          </button>
          <button
            onClick={() => setActiveTab('TD602')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderBottom: activeTab === 'TD602' ? '3px solid #003366' : 'none',
              background: activeTab === 'TD602' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '12px',
              color: '#003366',
              cursor: 'pointer',
            }}
          >
            FORM T/D 602: TEMPORARY SINGLE LINE WORKING (TSLW GR 3.68)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {message && (
            <div style={{ padding: '8px 12px', marginBottom: '12px', background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20', fontSize: '12px', fontWeight: 700 }}>
              {message}
            </div>
          )}

          {activeTab === 'T351' ? (
            <div>
              {/* Form T/351 Header */}
              <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#003366' }}>SOUTHERN RAILWAY — CHENNAI DIVISION</div>
                <div style={{ fontWeight: 900, fontSize: '15px', color: '#c62828' }}>FORM T/351: DISCONNECTION NOTICE</div>
                <div style={{ fontSize: '11px', color: '#555555' }}>Under Indian Railways General & Subsidiary Rules (G&SR Rule 15.08)</div>
              </div>

              {/* Notice Metadata Grid */}
              <table className="ir-table" style={{ marginBottom: '16px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '25%', fontWeight: 700 }}>Block Identification:</td>
                    <td className="mono" style={{ fontWeight: 700, color: '#003366' }}>{block.block_code}</td>
                    <td style={{ width: '25%', fontWeight: 700 }}>Section & Track:</td>
                    <td>{block.section_name} ({block.section_code})</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Scheduled Duration:</td>
                    <td>{block.duration_minutes} Mins ({block.start_time} - {block.end_time})</td>
                    <td style={{ fontWeight: 700 }}>Primary Department:</td>
                    <td><strong>{block.primary_department}</strong> (Bundled: {block.participating_departments.join(', ')})</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Current Status:</td>
                    <td>
                      <span className={`ir-badge ${block.status === 'APPROVED' ? 'ir-badge-completed' : block.status === 'ACTIVE' ? 'ir-badge-active' : 'ir-badge-proposed'}`}>
                        {block.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>Existing PN:</td>
                    <td className="mono">{block.disconnection_pn || 'Pending Authorization'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Station Master & Field Engineer Sign-Off Section */}
              <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #d0d7de', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, color: '#003366', fontSize: '12px', marginBottom: '8px' }}>
                  STATUTORY PRIVATE NUMBER (PN) EXCHANGE WORKFLOW
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                      STATION MASTER (AUTHORIZING OFFICIAL):
                    </label>
                    <input
                      type="text"
                      value={smName}
                      onChange={(e) => setSmName(e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #999999', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                      FIELD ENGINEER (SSE/P.WAY OR SSE/SIGNAL):
                    </label>
                    <input
                      type="text"
                      value={fieldEngName}
                      onChange={(e) => setFieldEngName(e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #999999', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px', color: '#c62828' }}>
                      ENTER CONFIDENTIAL PRIVATE NUMBER (PN):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PN-4821"
                      value={privateNumber}
                      onChange={(e) => setPrivateNumber(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '2px solid #003366', fontWeight: 700, fontSize: '13px' }}
                    />
                  </div>

                  {block.status === 'ACTIVE' && (
                    <div style={{ width: '140px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                        POST-WORK TSR:
                      </label>
                      <select
                        value={tsrSpeed}
                        onChange={(e) => setTsrSpeed(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                      >
                        <option value={20}>20 km/h</option>
                        <option value={30}>30 km/h</option>
                        <option value={45}>45 km/h</option>
                        <option value={75}>75 km/h</option>
                        <option value={110}>MPS (Normal)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="ir-btn ir-btn-outline" onClick={() => window.print()}>
                  <Printer size={13} />
                  PRINT NOTICE
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {block.status !== 'ACTIVE' ? (
                    <button
                      className="ir-btn ir-btn-danger"
                      onClick={handleAuthorize}
                      disabled={isSubmitting}
                    >
                      <Key size={13} />
                      {isSubmitting ? 'TRANSMITTING PN...' : 'GRANT DISCONNECTION (START WORK)'}
                    </button>
                  ) : (
                    <button
                      className="ir-btn ir-btn-success"
                      onClick={handleClearBlock}
                      disabled={isSubmitting}
                    >
                      <CheckCircle size={13} />
                      {isSubmitting ? 'CLEARING...' : 'RECONNECT & CLEAR TRACK'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Form T/D 602 Emergency Protocol */}
              <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#003366' }}>INDIAN RAILWAYS GENERAL RULES</div>
                <div style={{ fontWeight: 900, fontSize: '15px', color: '#c62828' }}>FORM T/D 602: AUTHORITY FOR TEMPORARY SINGLE LINE WORKING (TSLW)</div>
                <div style={{ fontSize: '11px', color: '#555555' }}>Prescribed under GR 3.68 & Zonal Subsidiary Rules for Double-Line Obstruction</div>
              </div>

              <div style={{ background: '#fff3e0', padding: '10px', border: '1px solid #f37021', marginBottom: '12px', fontSize: '11px', lineHeight: 1.5 }}>
                <strong>OPERATIONAL NOTICE:</strong> When a maintenance block overruns and parallel line train movement is mandated, trains operate bidirectionally over the single clear track under pilot authority, maximum speed 25 km/h over facing points.
              </div>

              <table className="ir-table" style={{ marginBottom: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, width: '30%' }}>Section Affected:</td>
                    <td>{block.section_name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Line Obstructed:</td>
                    <td><strong style={{ color: '#c62828' }}>UP MAIN LINE</strong> (Under Block {block.block_code})</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Single Line Operational Track:</td>
                    <td><strong style={{ color: '#2e7d32' }}>DOWN MAIN LINE</strong> (Bidirectional Pilot Working)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Pilot Station Master:</td>
                    <td>{smName}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Caution Order Imposed:</td>
                    <td>Speed restricted to 25 km/h on facing points; day/night pilot hand signals.</td>
                  </tr>
                </tbody>
              </table>

              <button className="ir-btn ir-btn-navy" onClick={() => alert('TSLW Form T/D 602 Authority sheet generated and dispatched to Section Controller.')}>
                GENERATE & TRANSMIT T/D 602 AUTHORITY
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
