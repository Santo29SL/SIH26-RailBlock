import React from 'react';
import { TrainMovement, ScheduledBlock } from '../api/client';
import { Train, Wrench, ShieldAlert } from 'lucide-react';

interface DualGanttProps {
  trains: TrainMovement[];
  blocks: ScheduledBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (block: ScheduledBlock) => void;
}

// Convert "HH:MM:SS" into percentage of 24h day
function timeToPercent(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  const totalMins = (parts[0] || 0) * 60 + (parts[1] || 0);
  return Math.min(100, Math.max(0, (totalMins / 1440) * 100));
}

export const DualGantt: React.FC<DualGanttProps> = ({
  trains,
  blocks,
  selectedBlockId,
  onSelectBlock,
}) => {
  // 24-hour tick marks
  const hourTicks = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="ir-panel">
      <div className="ir-panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Train size={15} color="#ffb74d" />
          DUAL-SWIMLANE CORRIDOR TIMELINE (24-HOUR SPACE-TIME GANTT)
        </span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 'normal' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#c62828' }}></span> TIER-1 VIP (VANDE BHARAT)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#e65100' }}></span> TIER-2 EXPRESS
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#546e7a' }}></span> TIER-3 FREIGHT
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', background: '#2e7d32' }}></span> JOINT SHADOW BLOCK
          </span>
        </div>
      </div>

      <div className="ir-panel-body" style={{ padding: '12px 10px', overflowX: 'auto' }}>
        <div style={{ minWidth: '960px', position: 'relative' }}>
          
          {/* Time Axis Ticks */}
          <div style={{ display: 'flex', borderBottom: '2px solid #003366', paddingBottom: '4px', marginBottom: '8px' }}>
            <div style={{ width: '140px', fontWeight: 700, fontSize: '11px', color: '#003366' }}>
              TIME HORIZON (IST)
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#333333' }}>
              {hourTicks.map((h) => (
                <span key={h} style={{ width: '0px', textAlign: 'center' }}>
                  {h.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>

          {/* Swimlane 1: TRAIN MOVEMENTS */}
          <div style={{ display: 'flex', marginBottom: '12px', borderBottom: '1px dashed #cccccc', paddingBottom: '8px' }}>
            <div style={{ width: '140px', fontSize: '11px', fontWeight: 700, color: '#003366', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Train size={13} color="#003366" />
              TRAIN MOVEMENTS
            </div>
            <div style={{ flex: 1, height: '40px', background: '#f8fafc', border: '1px solid #d0d7de', position: 'relative' }}>
              {/* Hour Grid Lines */}
              {hourTicks.map((h) => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    left: `${(h / 24) * 100}%`,
                    top: 0,
                    bottom: 0,
                    borderLeft: '1px dotted #e2e8f0',
                  }}
                />
              ))}

              {/* Render Train Movement Bars */}
              {trains.map((tr) => {
                const entryTime = tr.entry_time || (tr as any).departure_time || '06:00:00';
                const exitTime = tr.exit_time || (tr as any).arrival_time || '06:45:00';
                const left = timeToPercent(entryTime);
                const right = timeToPercent(exitTime);
                const width = Math.max(2.5, right - left);
                const bg = tr.is_vip ? '#c62828' : tr.priority === 'TIER_3_FREIGHT' ? '#546e7a' : '#e65100';
                const trainNum = tr.train_number || (tr as any).train_id?.substring(0, 5) || 'TRN';
                const trainName = tr.train_name ? String(tr.train_name).split(' ')[0] : 'Train';

                return (
                  <div
                    key={tr.id}
                    title={`${trainNum} ${tr.train_name || 'Train'} (${entryTime} - ${exitTime})`}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top: '4px',
                      height: '30px',
                      background: bg,
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 4px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      border: '1px solid #000000',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  >
                    #{trainNum} {trainName}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Swimlane 2: SCHEDULED MAINTENANCE BLOCKS */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: '140px', fontSize: '11px', fontWeight: 700, color: '#003366', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wrench size={13} color="#f37021" />
              MAINTENANCE BLOCKS
            </div>
            <div style={{ flex: 1, height: '48px', background: '#f8fafc', border: '1px solid #d0d7de', position: 'relative' }}>
              {/* Hour Grid Lines */}
              {hourTicks.map((h) => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    left: `${(h / 24) * 100}%`,
                    top: 0,
                    bottom: 0,
                    borderLeft: '1px dotted #e2e8f0',
                  }}
                />
              ))}

              {/* Render Blocks */}
              {blocks.map((blk) => {
                const startTime = blk.start_time || '02:00:00';
                const endTime = blk.end_time || '05:00:00';
                const left = timeToPercent(startTime);
                const right = timeToPercent(endTime);
                const width = Math.max(3, right - left);
                const isSelected = blk.id === selectedBlockId;
                const statusColor = blk.status === 'APPROVED' ? '#2e7d32' : blk.status === 'ACTIVE' ? '#c62828' : '#f57f17';
                const depts = Array.isArray(blk.participating_departments) ? blk.participating_departments.join('+') : (blk.primary_department || 'TRACK');

                return (
                  <div
                    key={blk.id}
                    onClick={() => onSelectBlock(blk)}
                    title={`Click to Inspect: ${blk.block_code} (${startTime} - ${endTime})`}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top: '4px',
                      height: '38px',
                      background: statusColor,
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      border: isSelected ? '3px solid #002244' : '1px solid #000000',
                      boxShadow: isSelected ? '0 0 6px rgba(0,0,0,0.5)' : 'none',
                      cursor: 'pointer',
                      zIndex: 3,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{blk.block_code}</span>
                      <span style={{ background: '#ffffff', color: '#000000', padding: '0 3px', fontSize: '9px', fontWeight: 900 }}>
                        {blk.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'normal' }}>
                      {blk.section_code || 'SECTION'} • {blk.duration_minutes || 120}m • [{depts}]
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
