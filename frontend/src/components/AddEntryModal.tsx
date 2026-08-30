import React, { useState } from 'react';
import { PlusCircle, Train, Wrench, X, ShieldAlert } from 'lucide-react';
import { MaintenanceDefect, TrainMovement } from '../api/client';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDefect: (defect: MaintenanceDefect) => void;
  onAddTrain: (train: TrainMovement) => void;
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  isOpen,
  onClose,
  onAddDefect,
  onAddTrain,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'DEFECT' | 'TRAIN'>('DEFECT');

  // Defect Form States
  const [dept, setDept] = useState<'TRACK' | 'SIGNAL' | 'TRACTION'>('TRACK');
  const [activity, setActivity] = useState<string>('USFD Flaw Rail Renewal (IMR)');
  const [sectionCode, setSectionCode] = useState<string>('PER-TRL');
  const [kmMarker, setKmMarker] = useState<string>('KM 48/12 - 49/00');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');
  const [daysOverdue, setDaysOverdue] = useState<number>(12);
  const [flawType, setFlawType] = useState<string>('IMR');
  const [speedDrop, setSpeedDrop] = useState<number>(30);

  // Train Form States
  const [trainNum, setTrainNum] = useState<string>('20608');
  const [trainName, setTrainName] = useState<string>('Vande Bharat Express (MYS-MAS)');
  const [trainType, setTrainType] = useState<'PREMIUM' | 'SUPERFAST' | 'PASSENGER' | 'FREIGHT'>('PREMIUM');
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  const [entryTime, setEntryTime] = useState<string>('16:15');
  const [exitTime, setExitTime] = useState<string>('17:00');

  // Handle Submit Defect
  const handleDefectSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Domain heuristic formula matching CatBoost/XGBoost ML model
    let baseProb = 0.15;
    if (flawType === 'IMR') baseProb += 0.35;
    if (daysOverdue > 10) baseProb += 0.20;
    if (speedDrop > 40) baseProb += 0.15;
    const failProb = Math.min(0.95, baseProb);
    const ci = Math.round(failProb * 100 * 10) / 10;

    const newDefect: MaintenanceDefect = {
      id: 'def-' + Date.now(),
      request_code: `MR-${dept.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      department: dept,
      activity_type: activity,
      section_code: sectionCode,
      kilometer_marker: kmMarker,
      priority: priority,
      days_overdue: Number(daysOverdue),
      criticality_index: ci,
      failure_probability: failProb,
      shap_reasoning: `Manual Log [${dept}]: ${activity} with ${flawType} severity, ${daysOverdue} days overdue and ${speedDrop} km/h TSR drop pushed failure hazard to ${(failProb * 100).toFixed(1)}% (CI: ${ci}).`,
      metadata: {
        tgi_deviation: 78.0,
        speed_restriction_kmh: Number(speedDrop),
        usfd_flaw_severity: flawType,
        section_gmt_density: 55.0,
        days_overdue: Number(daysOverdue),
      },
    };

    onAddDefect(newDefect);
    onClose();
  };

  // Handle Submit Train
  const handleTrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isVip = trainType === 'PREMIUM';
    const prio = isVip ? 'TIER_1_VIP' : trainType === 'FREIGHT' ? 'TIER_3_FREIGHT' : 'TIER_2_EXPRESS';

    const newTrain: TrainMovement = {
      id: 'tr-' + Date.now(),
      train_number: trainNum,
      train_name: trainName,
      train_type: trainType,
      priority: prio,
      movement_type: trainType === 'FREIGHT' ? 'FORECAST_FREIGHT' : 'SCHEDULED_PASSENGER',
      direction: direction,
      entry_time: entryTime.length === 5 ? `${entryTime}:00` : entryTime,
      exit_time: exitTime.length === 5 ? `${exitTime}:00` : exitTime,
      is_vip: isVip,
    };

    onAddTrain(newTrain);
    onClose();
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
          width: '680px',
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
            <PlusCircle size={16} color="#f37021" />
            CONTROL OFFICE DISPATCH: MANUAL INGESTION SANDBOX
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid #d0d7de', background: '#f0f4f8' }}>
          <button
            onClick={() => setActiveTab('DEFECT')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderBottom: activeTab === 'DEFECT' ? '3px solid #003366' : 'none',
              background: activeTab === 'DEFECT' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '12px',
              color: '#003366',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Wrench size={13} color="#f37021" />
            + LOG ASSET DEFECT / ISSUE (TMS / SMMS / TDMS)
          </button>
          <button
            onClick={() => setActiveTab('TRAIN')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderBottom: activeTab === 'TRAIN' ? '3px solid #003366' : 'none',
              background: activeTab === 'TRAIN' ? '#ffffff' : 'transparent',
              fontWeight: 700,
              fontSize: '12px',
              color: '#003366',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Train size={13} color="#003366" />
            + INJECT TRAIN MOVEMENT (COA TIMETABLE)
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
          {activeTab === 'DEFECT' ? (
            <form onSubmit={handleDefectSubmit}>
              <div style={{ background: '#fff3e0', border: '1px solid #f37021', padding: '8px 10px', fontSize: '11px', marginBottom: '14px' }}>
                <strong>CRIS TMS/SMMS Field Log:</strong> Ingests an urgent track flaw, point machine failure, or OHE wear record. The AI engine will immediately calculate its Criticality Index ($CI$) and place it on the GIS map.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    DEPARTMENT:
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value as any)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                  >
                    <option value="TRACK">TRACK (Engineering / P.Way)</option>
                    <option value="SIGNAL">SIGNAL (S&T / Interlocking)</option>
                    <option value="TRACTION">TRACTION (TRD / OHE Power)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    SECTION CODE:
                  </label>
                  <select
                    value={sectionCode}
                    onChange={(e) => setSectionCode(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                  >
                    <option value="PER-TRL">PER-TRL (Perambur - Tiruvallur)</option>
                    <option value="TRL-AJJ">TRL-AJJ (Tiruvallur - Arakkonam)</option>
                    <option value="MAS-PER">MAS-PER (Chennai Central - Perambur)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                  ACTIVITY & ASSET DEFECT DESCRIPTION:
                </label>
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px', fontWeight: 700 }}
                  placeholder="e.g. Deep Screening (BCM) or Point Machine 118 Overhaul"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    KILOMETER / LOCATION MARKER:
                  </label>
                  <input
                    type="text"
                    value={kmMarker}
                    onChange={(e) => setKmMarker(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px' }}
                    placeholder="e.g. KM 48/12 - 49/00"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    DAYS OVERDUE (PENALTY FACTOR):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={daysOverdue}
                    onChange={(e) => setDaysOverdue(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    FLAW SEVERITY / RISK CLASSIFICATION:
                  </label>
                  <select
                    value={flawType}
                    onChange={(e) => setFlawType(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                  >
                    <option value="IMR">IMR (Immediate Removal Flaw)</option>
                    <option value="OBS">OBS (Observed Flaw with Caution)</option>
                    <option value="ROUTINE">Routine Maintenance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    IMPOSED TSR SPEED RESTRICTION:
                  </label>
                  <select
                    value={speedDrop}
                    onChange={(e) => setSpeedDrop(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                  >
                    <option value={20}>20 km/h (Severe 110-20=90 Drop)</option>
                    <option value={30}>30 km/h</option>
                    <option value={50}>50 km/h</option>
                    <option value={80}>80 km/h</option>
                    <option value={110}>No Speed Restriction (MPS)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="ir-btn ir-btn-outline" onClick={onClose}>
                  CANCEL
                </button>
                <button type="submit" className="ir-btn ir-btn-primary">
                  <Wrench size={13} />
                  LOG DEFECT & CALCULATE AI RISK
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTrainSubmit}>
              <div style={{ background: '#e3f2fd', border: '1px solid #1976d2', padding: '8px 10px', fontSize: '11px', marginBottom: '14px' }}>
                <strong>COA Timetable Injection:</strong> Injects a new passenger train run or goods train forecast onto the corridor timeline. Notice how it immediately cuts corridor gaps on the Gantt chart!
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    TRAIN NUMBER:
                  </label>
                  <input
                    type="text"
                    value={trainNum}
                    onChange={(e) => setTrainNum(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px', fontWeight: 700 }}
                    placeholder="e.g. 20608 or BOXN-9912"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    TRAIN NAME / DESCRIPTION:
                  </label>
                  <input
                    type="text"
                    value={trainName}
                    onChange={(e) => setTrainName(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px' }}
                    placeholder="e.g. Vande Bharat Express (MYS-MAS)"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    PRIORITY & TYPE:
                  </label>
                  <select
                    value={trainType}
                    onChange={(e) => setTrainType(e.target.value as any)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                  >
                    <option value="PREMIUM">TIER-1 VIP (Vande Bharat / Shatabdi)</option>
                    <option value="SUPERFAST">TIER-2 SUPERFAST / EXPRESS</option>
                    <option value="PASSENGER">TIER-2 PASSENGER / SUBURBAN EMU</option>
                    <option value="FREIGHT">TIER-3 FORECAST GOODS / FREIGHT RAKE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    LINE DIRECTION:
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #999999', fontWeight: 700 }}
                  >
                    <option value="UP">UP LINE (Towards Chennai Central)</option>
                    <option value="DOWN">DOWN LINE (Towards Arakkonam)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    ENTRY TIME (HH:MM):
                  </label>
                  <input
                    type="time"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                    EXIT TIME (HH:MM):
                  </label>
                  <input
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #999999', fontSize: '12px', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="ir-btn ir-btn-outline" onClick={onClose}>
                  CANCEL
                </button>
                <button type="submit" className="ir-btn ir-btn-navy">
                  <Train size={13} />
                  INJECT TRAIN INTO CORRIDOR
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
