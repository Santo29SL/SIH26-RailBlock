import React from 'react';
import { TrainMovement } from '../../types/section';
import { Block } from '../../types/block';
import { Layers, FileText, Plus, AlertTriangle, CheckCircle2, Clock, Zap, Train } from 'lucide-react';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-300';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs select-none space-y-4 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#213d77] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-[#fb792b]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-[#213d77] tracking-wide">
                Space-Time Possession &amp; Train Path Scheduler
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#213d77] font-bold border border-blue-200 font-mono">
                24-HOUR TIMETABLE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Corridor train headway paths aligned with bundled 3-department maintenance shadow windows
            </p>
          </div>
        </div>

        {/* Action Controls - Official IRCTC Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenLogDefect}
            className="px-3.5 py-1.5 rounded-xl bg-[#fb792b] hover:bg-[#e06318] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Log Defect (TMS)</span>
          </button>

          <button
            onClick={onOpenInjectTrain}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Inject Delay (+35m)</span>
          </button>

          <button
            onClick={onOpenStatutory}
            className="px-3.5 py-1.5 rounded-xl bg-[#213d77] hover:bg-[#182c52] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-200" />
            <span>Form T/351</span>
          </button>
        </div>
      </div>

      {/* Gantt Swimlanes Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[950px] space-y-3">
          {/* Time axis header (00 to 24) */}
          <div className="flex items-center space-x-3">
            <div className="w-36 shrink-0 text-[10px] font-mono font-bold text-slate-400 uppercase">
              Corridor Axis
            </div>
            <div className="relative flex-1 h-6 bg-slate-100/90 rounded-lg border border-slate-200 flex items-center px-1">
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
                  1. TRAIN MOVEMENTS
                </span>
                <span className="text-[9px] text-slate-500 block leading-tight">
                  Passenger &amp; Goods Paths
                </span>
              </div>
              <div className="relative flex-1 h-14 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                {/* 15m grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 w-[1px] bg-slate-200/80"
                    style={{ left: `${(h / 24) * 100}%` }}
                  ></div>
                ))}

                {/* Train Movement Bars */}
                {displayTrains.map((train, idx) => {
                  let depMin = timeToMinutes(train.departure_time || '00:00:00');
                  let arrMin = timeToMinutes(train.arrival_time || '02:00:00');
                  if (arrMin <= depMin) arrMin = depMin + 90;

                  const trainNo = train.train?.train_number || train.train_number || (idx === 0 ? '12621' : idx === 1 ? '20607' : idx === 2 ? 'BOXN-88' : idx === 3 ? '12951' : 'CONT-44');
                  const isDelayed = activeDelayMinutes > 0 && trainNo === activeDelayTrainNumber;
                  if (isDelayed) {
                    depMin += activeDelayMinutes;
                    arrMin += activeDelayMinutes;
                  }

                  const leftPct = (depMin / totalMinutes) * 100;
                  const widthPct = Math.max(12, ((arrMin - depMin) / totalMinutes) * 100);

                  const isVip = trainNo === '20607' || trainNo === '12951' || train.train?.priority === 'HIGH';

                  return (
                    <div
                      key={train.id || idx}
                      className={`absolute top-1.5 bottom-1.5 rounded-xl px-2 py-1 text-white text-[10px] flex flex-col justify-between shadow-xs transition-all ${
                        isDelayed
                          ? 'bg-rose-600 border-2 border-amber-300 ring-2 ring-rose-500 animate-pulse z-10'
                          : isVip
                          ? 'bg-rose-600 border border-rose-400'
                          : 'bg-[#213d77] border border-blue-400'
                      }`}
                      style={{
                        left: `${Math.min(85, Math.max(1, leftPct))}%`,
                        width: `${Math.min(14, widthPct)}%`,
                      }}
                      title={`Train #${trainNo} (${train.departure_time} - ${train.arrival_time})`}
                    >
                      <div className="flex items-center justify-between font-bold leading-tight">
                        <span className="truncate">#{trainNo}</span>
                        {isDelayed && (
                          <span className="text-[8px] bg-amber-300 text-slate-950 font-black px-1 rounded">
                            +{activeDelayMinutes}m
                          </span>
                        )}
                      </div>
                      <span className="truncate text-[9px] opacity-90 block font-semibold">
                        {train.train?.train_name || 'Corridor Train'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swimlane 2: Bundled Maintenance Possessions */}
            <div className="flex items-center space-x-3">
              <div className="w-36 shrink-0 space-y-0.5">
                <span className="text-[11px] font-bold text-slate-800 block">
                  2. POSSESSION SLOTS
                </span>
                <span className="text-[9px] text-emerald-700 block font-bold font-mono">
                  Bundled Multi-Dept
                </span>
              </div>
              <div className="relative flex-1 h-24 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                {/* 15m grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 w-[1px] bg-slate-200/80"
                    style={{ left: `${(h / 24) * 100}%` }}
                  ></div>
                ))}

                {/* Possession Block Bars */}
                {displayBlocks.map((block, idx) => {
                  const depMin = timeToMinutes(block.start_time || '02:30:00');
                  let arrMin = timeToMinutes(block.end_time || '05:00:00');
                  if (arrMin <= depMin) arrMin = Math.min(1435, depMin + (block.duration_minutes || 120));

                  const leftPct = (depMin / totalMinutes) * 100;
                  const widthPct = Math.max(14, ((arrMin - depMin) / totalMinutes) * 100);

                  const isSelected = selectedBlock?.id === block.id || selectedBlock?.block_code === block.block_code;

                  return (
                    <div
                      key={block.id || idx}
                      onClick={() => onSelectBlock(block)}
                      className={`absolute top-1.5 bottom-1.5 rounded-xl p-2 text-white text-[10px] flex flex-col justify-between cursor-pointer transition-all shadow-md ${
                        isSelected
                          ? 'bg-[#182c52] border-2 border-[#fb792b] ring-2 ring-orange-400/40 z-10'
                          : 'bg-[#213d77] border border-blue-400/50 hover:border-white'
                      }`}
                      style={{
                        left: `${Math.min(84, Math.max(1, leftPct))}%`,
                        width: `${Math.min(15, widthPct)}%`,
                      }}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="truncate">{block.block_code}</span>
                        <span className="text-[9px] font-mono bg-white/20 px-1 py-0.2 rounded shrink-0 ml-1">
                          {block.start_time?.slice(0, 5)} - {block.end_time?.slice(0, 5)}
                        </span>
                      </div>

                      {/* Department Badges */}
                      <div className="flex items-center space-x-1 my-1">
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[9px] font-bold">
                          Track
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono text-[9px] font-bold">
                          Signal
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-400 text-slate-950 font-mono text-[9px] font-bold">
                          TRD
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/20 pt-1 text-[9px]">
                        <span className="text-emerald-300 font-bold font-mono">
                          +{block.shadow_overlap_hours || 3.0}h saved
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${getStatusBadge(block.status)}`}>
                          {block.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
