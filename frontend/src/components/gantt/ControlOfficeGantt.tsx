import React from 'react';
import { TrainMovement } from '../../types/section';
import { Block } from '../../types/block';
import { Layers, FileText, Plus, AlertTriangle, CheckCircle2, Clock, Train } from 'lucide-react';

interface ControlOfficeGanttProps {
  trainMovements: TrainMovement[];
  blocks: Block[];
  selectedBlock: Block | null;
  activeDelayTrainNumber?: string;
  activeDelayMinutes?: number;
  onSelectBlock: (block: Block) => void;
  onOpenStatutory: () => void;
  onOpenLogDefect: () => void;
  onOpenInjectTrain: () => void;
}

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

export const ControlOfficeGantt: React.FC<ControlOfficeGanttProps> = ({
  trainMovements,
  blocks,
  selectedBlock,
  activeDelayTrainNumber = '12951',
  activeDelayMinutes = 0,
  onSelectBlock,
  onOpenStatutory,
  onOpenLogDefect,
  onOpenInjectTrain,
}) => {
  const totalMinutes = 24 * 60;
  const hours = Array.from({ length: 25 }, (_, i) => i);

  // Dynamic trains list
  const displayTrains = trainMovements.length > 0 ? trainMovements : [
    { id: 't1', train_id: 'tr-1', movement_type: 'PASSENGER', departure_time: '00:45:00', arrival_time: '02:00:00', train: { train_number: '12621', train_name: 'Tamil Nadu Superfast', train_type: 'SUPERFAST', priority: 'HIGH' } },
    { id: 't2', train_id: 'tr-2', movement_type: 'PASSENGER', departure_time: '05:30:00', arrival_time: '06:45:00', train: { train_number: '20607', train_name: 'Vande Bharat Express', train_type: 'SUPERFAST', priority: 'HIGH' } },
    { id: 't3', train_id: 'tr-3', movement_type: 'FREIGHT', departure_time: '11:15:00', arrival_time: '12:45:00', train: { train_number: 'BOXN-88', train_name: 'Coal Goods Freight', train_type: 'GOODS', priority: 'MEDIUM' } },
    { id: 't4', train_id: 'tr-4', movement_type: 'PASSENGER', departure_time: '17:00:00', arrival_time: '18:30:00', train: { train_number: '12951', train_name: 'Mumbai Rajdhani', train_type: 'SUPERFAST', priority: 'HIGH' } },
    { id: 't5', train_id: 'tr-5', movement_type: 'FREIGHT', departure_time: '20:30:00', arrival_time: '22:00:00', train: { train_number: 'CONT-44', train_name: 'Container Freight', train_type: 'GOODS', priority: 'MEDIUM' } },
  ];

  // Dynamic blocks
  const displayBlocks = blocks.length > 0 ? blocks : [
    {
      id: 'blk-01',
      block_code: 'BLK-20260825-001',
      section_id: 'MAS-AJJ',
      line_identifier: 'UP MAIN',
      date: '2026-08-29',
      start_time: '02:30:00',
      end_time: '05:00:00',
      duration_minutes: 150,
      is_joint_shadow_block: true,
      shadow_overlap_hours: 3.0,
      total_criticality_index: 88.0,
      status: 'APPROVED',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'blk-02',
      block_code: 'BLK-20260825-002',
      section_id: 'MAS-AJJ',
      line_identifier: 'UP MAIN',
      date: '2026-08-29',
      start_time: '07:30:00',
      end_time: '09:30:00',
      duration_minutes: 120,
      is_joint_shadow_block: true,
      shadow_overlap_hours: 1.5,
      total_criticality_index: 78.5,
      status: 'PROPOSED',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'blk-03',
      block_code: 'BLK-20260825-003',
      section_id: 'MAS-AJJ',
      line_identifier: 'DOWN MAIN',
      date: '2026-08-29',
      start_time: '13:30:00',
      end_time: '15:30:00',
      duration_minutes: 120,
      is_joint_shadow_block: true,
      shadow_overlap_hours: 2.0,
      total_criticality_index: 74.0,
      status: 'APPROVED',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'blk-04',
      block_code: 'BLK-20260829-002',
      section_id: 'MAS-AJJ',
      line_identifier: 'UP MAIN',
      date: '2026-08-29',
      start_time: '22:15:00',
      end_time: '23:55:00',
      duration_minutes: 100,
      is_joint_shadow_block: true,
      shadow_overlap_hours: 4.2,
      total_criticality_index: 92.5,
      status: 'PROPOSED',
      created_at: '',
      updated_at: '',
    },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'ACTIVE':
        return 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs select-none space-y-4 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                24-Hour Corridor Schedule (Trains vs. Repair Windows)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                LIVE TIMETABLE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Visualizes passenger train movements alongside bundled Track, Signal &amp; Electrical repair windows
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenLogDefect}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-700" />
            <span>+ Report Defect</span>
          </button>

          <button
            onClick={onOpenInjectTrain}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Simulate Delay (+35m)</span>
          </button>

          <button
            onClick={onOpenStatutory}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Safety Notice (Form T/351)</span>
          </button>
        </div>
      </div>

      {/* Gantt Swimlanes Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[950px] space-y-3">
          {/* Time axis header (00 to 24) */}
          <div className="flex items-center space-x-3">
            <div className="w-36 shrink-0 text-[10px] font-mono font-bold text-slate-400 uppercase">
              Hour of Day (IST)
            </div>
            <div className="relative flex-1 h-6 bg-slate-100 rounded-lg border border-slate-200 flex items-center px-1">
              {hours.filter((h) => h % 2 === 0).map((h) => {
                const pct = (h / 24) * 100;
                return (
                  <span
                    key={h}
                    className={`absolute text-[10px] font-mono font-bold text-slate-700 ${
                      h === 0 ? 'left-1.5' : h === 24 ? 'right-1.5' : 'transform -translate-x-1/2'
                    }`}
                    style={h !== 0 && h !== 24 ? { left: `${pct}%` } : undefined}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                );
              })}
            </div>
          </div>

          {/* Swimlanes Grid */}
          <div className="space-y-3 pt-1">
            {/* Swimlane 1: Train Movements */}
            <div className="flex items-center space-x-3">
              <div className="w-36 shrink-0 space-y-0.5">
                <span className="text-[11px] font-bold text-slate-800 block">
                  1. RUNNING TRAINS
                </span>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Passenger &amp; Goods Paths
                </span>
              </div>
              <div className="relative flex-1 h-14 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                {/* Grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 w-[1px] bg-slate-200"
                    style={{ left: `${(h / 24) * 100}%` }}
                  ></div>
                ))}

                {/* Train Movement Cards */}
                {displayTrains.map((t: any, idx: number) => {
                  let startMin = timeToMinutes(t.departure_time);
                  let endMin = timeToMinutes(t.arrival_time);
                  const isDelayed = activeDelayMinutes > 0 && (t.train?.train_number === activeDelayTrainNumber || t.train?.train_number === '12951');

                  if (isDelayed) {
                    startMin += activeDelayMinutes;
                    endMin += activeDelayMinutes;
                  }

                  const left = (startMin / totalMinutes) * 100;
                  const width = Math.max(9, ((endMin - startMin) / totalMinutes) * 100);

                  const isVip = t.train?.train_number === '20607' || t.train?.train_number === '12951';
                  const isExpress = t.movement_type === 'PASSENGER' && !isVip;

                  return (
                    <div
                      key={t.id || idx}
                      className={`absolute top-1.5 bottom-1.5 rounded-md px-2 flex flex-col justify-center text-white text-[10px] font-mono font-bold shadow-xs transition-all ${
                        isDelayed
                          ? 'bg-rose-600 border border-amber-300 ring-1 ring-rose-500 animate-pulse z-20'
                          : isVip
                          ? 'bg-rose-600'
                          : isExpress
                          ? 'bg-blue-700'
                          : 'bg-slate-700'
                      }`}
                      style={{ left: `${Math.min(88, left % 100)}%`, width: `${Math.min(18, width)}%` }}
                      title={`Train #${t.train?.train_number} ${t.train?.train_name} (${t.departure_time} - ${t.arrival_time})`}
                    >
                      <div className="flex items-center justify-between text-[10px] leading-tight">
                        <span className="truncate">#{t.train?.train_number}</span>
                        {isDelayed && (
                          <span className="text-[8px] bg-amber-300 text-slate-950 px-1 py-0.2 rounded font-bold uppercase ml-1">
                            +{activeDelayMinutes}m
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-sans opacity-90 truncate leading-tight">
                        {t.train?.train_name?.split(' ')[0]} ({t.departure_time?.slice(0, 5)} - {t.arrival_time?.slice(0, 5)})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlane 2: Maintenance Blocks */}
            <div className="flex items-center space-x-3">
              <div className="w-36 shrink-0 space-y-0.5">
                <span className="text-[11px] font-bold text-slate-800 block">
                  2. REPAIR WINDOWS
                </span>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Bundled Multi-Dept Slots
                </span>
              </div>
              <div className="relative flex-1 h-20 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-inner">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 w-[1px] bg-slate-200"
                    style={{ left: `${(h / 24) * 100}%` }}
                  ></div>
                ))}

                {/* Maintenance Possession Blocks */}
                {displayBlocks.map((b) => {
                  let startMin = timeToMinutes(b.start_time);
                  let endMin = timeToMinutes(b.end_time);
                  if (endMin <= startMin) endMin = Math.min(1435, startMin + (b.duration_minutes || 120));

                  const rawLeft = (startMin / totalMinutes) * 100;
                  const rawWidth = Math.max(13, ((endMin - startMin) / totalMinutes) * 100);

                  const left = Math.min(84, Math.max(1, rawLeft));
                  const width = Math.min(15, rawWidth);
                  const isSelected = selectedBlock?.block_code === b.block_code || selectedBlock?.id === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => onSelectBlock(b)}
                      className={`absolute top-1.5 bottom-1.5 rounded-lg p-2 flex flex-col justify-between text-white text-[10px] font-mono font-bold shadow-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-2 border-blue-400 ring-2 ring-blue-500/20 scale-[1.01] z-10'
                          : 'bg-[#0f172a] hover:bg-slate-800 border border-slate-700'
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {/* Top Code and Times */}
                      <div className="flex items-center justify-between font-bold leading-tight">
                        <span className="truncate">{b.block_code}</span>
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-sans uppercase ml-1 shrink-0">
                          {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                        </span>
                      </div>

                      {/* Department Badges (Rose, Amber, Sky) */}
                      <div className="flex items-center space-x-1 text-[8px] font-bold">
                        <span className="px-1 py-0.2 rounded bg-rose-600 text-white">Track</span>
                        <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950">Signal</span>
                        <span className="px-1 py-0.2 rounded bg-sky-400 text-slate-950">Electrical</span>
                      </div>

                      {/* Status / Saved hours */}
                      <div className="flex items-center justify-between text-[8px] text-emerald-300 font-bold border-t border-slate-700/60 pt-0.5">
                        <span className={`px-1 py-0.2 rounded uppercase ${getStatusBadgeColor(b.status)}`}>
                          {b.status}
                        </span>
                        <span>+{b.shadow_overlap_hours || 3.0}h saved</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Possession Action Bar */}
      <div className="bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 font-bold uppercase">SELECTED REPAIR WINDOW:</span>
          <span className="font-bold text-slate-900">
            {selectedBlock?.block_code || 'BLK-20260829-002'} ({selectedBlock?.section_id || 'MAS-AJJ'} • {selectedBlock?.start_time?.slice(0, 5) || '02:30'} - {selectedBlock?.end_time?.slice(0, 5) || '05:00'})
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getStatusBadgeColor(selectedBlock?.status || 'APPROVED')}`}>
            {selectedBlock?.status || 'APPROVED'}
          </span>
          <span className="text-[10px] text-emerald-800 font-sans font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ 3 Departments Bundled (+5.3h Saved)
          </span>
        </div>

        <button
          onClick={onOpenStatutory}
          className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <FileText className="w-4 h-4 text-white" />
          <span>Safety Notice (Form T/351)</span>
        </button>
      </div>
    </div>
  );
};
export default ControlOfficeGantt;
