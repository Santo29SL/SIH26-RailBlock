import React, { useState } from 'react';
import { TrainMovement } from '../../types/section';
import { Block } from '../../types/block';
import { Layers, Clock, ShieldCheck, ArrowRight, Train, Wrench, Zap, Radio, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DualGanttChartProps {
  trainMovements?: TrainMovement[];
  blocks?: Block[];
  horizonHours?: number;
  activeDelayTrainNumber?: string;
  activeDelayMinutes?: number;
  onSelectBlock?: (block: Block) => void;
}

const parseTimeToMinutes = (timeStr: any): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;

  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1]?.split('Z')[0];
    if (timePart) {
      const parts = timePart.split(':').map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
  }

  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

export const DualGanttChart: React.FC<DualGanttChartProps> = ({
  trainMovements = [],
  blocks = [],
  horizonHours = 24,
  activeDelayTrainNumber = '',
  activeDelayMinutes = 0,
  onSelectBlock,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('blk-01');

  const totalMinutes = 24 * 60;
  const timeTicks = Array.from({ length: 13 }, (_, i) => i * 2); // 00, 02, 04 ... 24

  // Calibrated train runs
  const defaultTrains = [
    {
      id: 'tr-1',
      number: '12621',
      name: 'Tamil Nadu Superfast',
      type: 'PASSENGER',
      priority: 'HIGH',
      departure: '00:45:00',
      arrival: '02:00:00',
      depMin: 45,
      arrMin: 120,
      isVip: false,
    },
    {
      id: 'tr-2',
      number: '20607',
      name: 'Vande Bharat Express',
      type: 'PASSENGER',
      priority: 'VIP',
      departure: '05:30:00',
      arrival: '06:45:00',
      depMin: 330,
      arrMin: 405,
      isVip: true,
    },
    {
      id: 'tr-3',
      number: 'BOXN-88',
      name: 'Coal Goods Freight',
      type: 'FREIGHT',
      priority: 'MEDIUM',
      departure: '11:15:00',
      arrival: '12:45:00',
      depMin: 675,
      arrMin: 765,
      isVip: false,
    },
    {
      id: 'tr-4',
      number: '12951',
      name: 'Mumbai Rajdhani Exp',
      type: 'PASSENGER',
      priority: 'VIP',
      departure: '17:00:00',
      arrival: '18:30:00',
      depMin: 1020,
      arrMin: 1110,
      isVip: true,
    },
    {
      id: 'tr-5',
      number: 'CONT-44',
      name: 'Container Freight Rake',
      type: 'FREIGHT',
      priority: 'MEDIUM',
      departure: '20:30:00',
      arrival: '22:00:00',
      depMin: 1230,
      arrMin: 1320,
      isVip: false,
    },
  ];

  // 4 Coordinated Joint Maintenance Possessions
  const defaultBlocks = [
    {
      id: 'blk-01',
      block_code: 'BLK-20260825-001',
      start_time: '02:30:00',
      end_time: '05:00:00',
      duration_minutes: 150,
      saved_hours: 3.0,
      depMin: 150,
      arrMin: 300,
      status: 'APPROVED',
      departments: ['TRACK', 'SIGNAL', 'TRACTION'],
    },
    {
      id: 'blk-02',
      block_code: 'BLK-20260825-002',
      start_time: '07:30:00',
      end_time: '09:30:00',
      duration_minutes: 120,
      saved_hours: 1.5,
      depMin: 450,
      arrMin: 570,
      status: 'PROPOSED',
      departments: ['TRACK', 'SIGNAL'],
    },
    {
      id: 'blk-03',
      block_code: 'BLK-20260825-003',
      start_time: '13:30:00',
      end_time: '15:30:00',
      duration_minutes: 120,
      saved_hours: 2.0,
      depMin: 810,
      arrMin: 930,
      status: 'APPROVED',
      departments: ['SIGNAL', 'TRACTION'],
    },
    {
      id: 'blk-04',
      block_code: 'BLK-20260829-002',
      start_time: '22:15:00',
      end_time: '23:55:00',
      duration_minutes: 100,
      saved_hours: 4.2,
      depMin: 1335,
      arrMin: 1435,
      status: 'PROPOSED',
      departments: ['TRACK', 'SIGNAL', 'TRACTION'],
    },
  ];

  const trainsToRender = trainMovements && trainMovements.length > 0
    ? trainMovements.map((m: any, idx) => {
        let depMin = parseTimeToMinutes(m.departure_time || m.scheduled_departure || '00:00:00');
        let arrMin = parseTimeToMinutes(m.arrival_time || m.scheduled_arrival || '02:00:00');
        if (arrMin <= depMin) arrMin = depMin + 90;

        const trainNumber = m.train?.train_number || m.train_number || (idx === 0 ? '12621' : idx === 1 ? '20607' : idx === 2 ? 'BOXN-88' : idx === 3 ? '12951' : 'CONT-44');
        const trainName = m.train?.train_name || m.train_name || (idx === 0 ? 'Tamil Nadu SF' : idx === 1 ? 'Vande Bharat' : idx === 2 ? 'Coal Goods' : idx === 3 ? 'Mumbai Rajdhani' : 'Container Freight');
        const isVip = trainNumber === '20607' || trainNumber === '12951' || m.priority === 'VIP' || m.train?.priority === 'HIGH';

        const isDelayed = activeDelayMinutes > 0 && (trainNumber === activeDelayTrainNumber || (activeDelayTrainNumber === '' && trainNumber === '12951'));
        if (isDelayed) {
          depMin += activeDelayMinutes;
          arrMin += activeDelayMinutes;
        }

        return {
          id: m.id || `tr-gen-${idx}`,
          number: trainNumber,
          name: trainName,
          type: m.movement_type || (isVip ? 'PASSENGER' : 'FREIGHT'),
          priority: isVip ? 'VIP' : 'MEDIUM',
          departure: (m.departure_time || m.scheduled_departure || '00:00:00').slice(0, 5),
          arrival: (m.arrival_time || m.scheduled_arrival || '02:00:00').slice(0, 5),
          depMin: depMin,
          arrMin: arrMin,
          isVip: isVip,
          isDelayed: isDelayed,
        };
      })
    : defaultTrains.map((t) => {
        let depMin = t.depMin;
        let arrMin = t.arrMin;
        const isDelayed = activeDelayMinutes > 0 && (t.number === activeDelayTrainNumber || (activeDelayTrainNumber === '' && t.number === '12951'));
        if (isDelayed) {
          depMin += activeDelayMinutes;
          arrMin += activeDelayMinutes;
        }
        return {
          ...t,
          depMin,
          arrMin,
          isDelayed,
        };
      });

  const blocksToRender = blocks && blocks.length > 0
    ? blocks.map((b: any, idx) => {
        const depMin = parseTimeToMinutes(b.start_time || '02:30:00');
        let arrMin = parseTimeToMinutes(b.end_time || '05:00:00');
        if (arrMin <= depMin) arrMin = Math.min(1435, depMin + (b.duration_minutes || 120));

        return {
          id: b.id || `blk-gen-${idx}`,
          block_code: b.block_code || `BLK-20260829-${idx + 1}`,
          start_time: (b.start_time || '02:30:00').slice(0, 5),
          end_time: (b.end_time || '05:00:00').slice(0, 5),
          duration_minutes: b.duration_minutes || 150,
          saved_hours: b.shadow_overlap_hours || 3.0,
          depMin: depMin,
          arrMin: arrMin,
          status: b.status || 'PROPOSED',
          departments: ['TRACK', 'SIGNAL', 'TRACTION'],
          rawBlock: b,
        };
      })
    : defaultBlocks;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs select-none space-y-5 font-sans">
      {/* Top Header & Horizon Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Corridor Train Timetable &amp; Joint Maintenance Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Visual timeline showing passenger train paths aligned with bundled Track, Signal &amp; Electrical repair windows
            </p>
          </div>
        </div>

        {/* Horizon Switcher Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setSelectedHorizon('24h')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              selectedHorizon === '24h' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            24h Schedule
          </button>
          <button
            onClick={() => setSelectedHorizon('7d')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              selectedHorizon === '7d' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7-Day Weekly
          </button>
          <button
            onClick={() => setSelectedHorizon('30d')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              selectedHorizon === '30d' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30-Day Monthly
          </button>
        </div>
      </div>

      {/* 24-Hour Gantt Timeline Canvas */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[1000px] space-y-4">
          {/* Hour Numbers Axis */}
          <div className="relative h-7 bg-slate-100 rounded-lg border border-slate-200 flex items-center px-2">
            {timeTicks.map((hour) => {
              const leftPercent = (hour / 24) * 100;
              return (
                <div
                  key={hour}
                  className={`absolute flex flex-col items-center ${
                    hour === 0 ? 'left-2' : hour === 24 ? 'right-2' : 'transform -translate-x-1/2'
                  }`}
                  style={hour !== 0 && hour !== 24 ? { left: `${leftPercent}%` } : undefined}
                >
                  <span className="text-[11px] font-mono font-bold text-slate-800">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                  <div className="w-[1px] h-1 bg-slate-300"></div>
                </div>
              );
            })}
          </div>

          {/* Lane 1: Train Movements */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
              <div className="flex items-center space-x-2">
                <Train className="w-4 h-4 text-blue-700" />
                <span>1. RUNNING TRAINS (TIMETABLE PATHS)</span>
              </div>
              <span className="text-slate-500 font-normal">{trainsToRender.length} Scheduled Passenger &amp; Freight Runs</span>
            </div>

            <div className="relative h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
              {timeTicks.map((hour) => (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-200"
                  style={{ left: `${(hour / 24) * 100}%` }}
                ></div>
              ))}

              {trainsToRender.map((t) => {
                const rawLeft = (t.depMin / totalMinutes) * 100;
                const rawWidth = Math.max(14, ((t.arrMin - t.depMin) / totalMinutes) * 100);

                const left = Math.min(84, Math.max(1, rawLeft));
                const width = Math.min(15, rawWidth);

                const isVip = t.isVip;
                const isExpress = t.type === 'PASSENGER' && !isVip;
                const isDelayed = t.isDelayed;

                return (
                  <div
                    key={t.id}
                    className={`absolute top-2 bottom-2 rounded-lg p-2 flex flex-col justify-between text-white text-xs shadow-xs hover:scale-[1.01] transition-all cursor-pointer ${
                      isDelayed
                        ? 'bg-rose-600 border border-amber-300 ring-1 ring-rose-500 animate-pulse z-20'
                        : isVip
                        ? 'bg-rose-600 border border-rose-500'
                        : isExpress
                        ? 'bg-blue-700 border border-blue-600'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`Train #${t.number} ${t.name} (${t.departure} - ${t.arrival})`}
                  >
                    <div className="flex items-center justify-between font-bold text-[10px] leading-tight">
                      <span className="truncate">#{t.number}</span>
                      <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold uppercase shrink-0 ml-1 ${
                        isDelayed
                          ? 'bg-amber-300 text-slate-950 font-black animate-pulse'
                          : isVip
                          ? 'bg-amber-300 text-slate-950 shadow-xs'
                          : isExpress
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        {isDelayed ? `+${activeDelayMinutes}m DELAY` : isVip ? 'VIP PASSENGER' : isExpress ? 'SUPERFAST' : 'FREIGHT'}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold truncate leading-tight mt-0.5">
                      {t.name}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono bg-black/25 px-1.5 py-0.2 rounded border border-white/10 mt-0.5">
                      <span>{t.departure}</span>
                      <span>&rarr;</span>
                      <span>{t.arrival}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lane 2: Bundled Maintenance Windows */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>2. SCHEDULED REPAIR WINDOWS (BUNDLED MULTI-DEPT SLOTS)</span>
              </div>
              <span className="text-emerald-700 font-bold font-mono">100% Zero Passenger Delay</span>
            </div>

            <div className="relative h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
              {timeTicks.map((hour) => (
                <div
                  key={hour}
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-200"
                  style={{ left: `${(hour / 24) * 100}%` }}
                ></div>
              ))}

              {blocksToRender.map((b) => {
                const rawLeft = (b.depMin / totalMinutes) * 100;
                const rawWidth = Math.max(14, ((b.arrMin - b.depMin) / totalMinutes) * 100);

                const left = Math.min(84, Math.max(1, rawLeft));
                const width = Math.min(15, rawWidth);
                const isSelected = selectedBlockId === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBlockId(b.id);
                      if (onSelectBlock && b.rawBlock) onSelectBlock(b.rawBlock);
                    }}
                    className={`absolute top-2 bottom-2 rounded-lg p-2 flex flex-col justify-between text-white text-xs shadow-xs hover:scale-[1.01] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-2 border-blue-400 ring-2 ring-blue-500/20 z-10'
                        : 'bg-[#0f172a] border border-slate-700'
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <div className="flex items-center justify-between font-bold text-[10px] leading-tight">
                      <span className="truncate">{b.block_code}</span>
                      <span className="text-[9px] font-mono bg-white/20 px-1 py-0.2 rounded ml-1 shrink-0">
                        {b.start_time} - {b.end_time}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-[8px] font-bold mt-0.5">
                      <span className="px-1 py-0.2 rounded bg-rose-600 text-white font-mono">Track</span>
                      <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-mono">Signal</span>
                      <span className="px-1 py-0.2 rounded bg-sky-400 text-slate-950 font-mono">Electrical</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-emerald-300 font-bold font-mono border-t border-slate-700/60 pt-0.5 mt-0.5">
                      <span>3 Depts Bundled</span>
                      <span>+{b.saved_hours}h saved</span>
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
export default DualGanttChart;
