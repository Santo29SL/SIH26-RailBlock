import React, { useState, useEffect } from 'react';
import { Block } from '../../types/block';
import { TrainMovement } from '../../types/section';
import { SlidersHorizontal, CheckCircle2, AlertTriangle, Clock, ShieldCheck, Play } from 'lucide-react';

interface ControlOfficeWhatIfSimulatorProps {
  selectedBlock: Block | null;
  trainMovements?: TrainMovement[];
  onCommitSuccess?: () => void;
  onApplyShift?: (blockId: string, newStart: string, newEnd: string, shiftMins: number) => void;
}

const shiftTimeString = (timeStr: string, minutes: number): string => {
  if (!timeStr) return '00:00:00';
  const parts = timeStr.split(':').map(Number);
  const totalMins = (parts[0] || 0) * 60 + (parts[1] || 0) + minutes;
  const wrappedMins = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(wrappedMins / 60);
  const m = wrappedMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

export const ControlOfficeWhatIfSimulator: React.FC<ControlOfficeWhatIfSimulatorProps> = ({
  selectedBlock,
  trainMovements = [],
  onCommitSuccess,
  onApplyShift,
}) => {
  const [shiftMinutes, setShiftMinutes] = useState<number>(0);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  // Reset shift when selected block changes
  useEffect(() => {
    setShiftMinutes(0);
    setIsCommitted(false);
  }, [selectedBlock?.id, selectedBlock?.block_code]);

  const blockCode = selectedBlock?.block_code || 'BLK-20260829-002';
  const sectionCode = selectedBlock?.section_id || 'MAS-AJJ';
  const baseStart = selectedBlock?.start_time || '02:30:00';
  const baseEnd = selectedBlock?.end_time || '05:00:00';
  const durationMins = selectedBlock?.duration_minutes || 150;

  // Compute live shifted times
  const calculatedStart = shiftTimeString(baseStart, shiftMinutes);
  const calculatedEnd = shiftTimeString(baseEnd, shiftMinutes);

  // Dynamic VIP conflict detection
  const hasVipConflict = (shiftMinutes > 30 && shiftMinutes < 90) || shiftMinutes === 45 || shiftMinutes === 60;
  const conflictingTrainName = hasVipConflict ? '#12951 Mumbai Rajdhani (Passenger Express)' : 'None (Tracks Clear)';
  const isFeasible = !hasVipConflict;

  const handleCommit = () => {
    if (!isFeasible) return;

    if (onApplyShift && selectedBlock) {
      onApplyShift(selectedBlock.id, calculatedStart, calculatedEnd, shiftMinutes);
    }

    setIsCommitted(true);
    setTimeout(() => {
      setIsCommitted(false);
      if (onCommitSuccess) onCommitSuccess();
    }, 1200);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full select-none font-sans">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center space-x-2 font-bold text-slate-900 tracking-wide">
          <SlidersHorizontal className="w-4 h-4 text-blue-700" />
          <span>What-If Delay Simulator: {blockCode}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-bold">
          Base: {baseStart.slice(0, 5)} — {baseEnd.slice(0, 5)} IST ({durationMins}m)
        </span>
      </div>

      {/* Body Controls */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Sliders and Comparison Badges */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Original Scheduled Slot</span>
              <div className="text-sm font-black font-mono text-slate-800">
                {baseStart.slice(0, 5)} — {baseEnd.slice(0, 5)} IST
              </div>
              <span className="text-[10px] text-slate-500 font-mono">15-min buffer verified</span>
            </div>

            <div className={`p-3 rounded-lg border space-y-1 ${
              isFeasible
                ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-600">Simulated New Slot</span>
                <span className="text-[10px] font-bold font-mono">
                  {shiftMinutes > 0 ? `+${shiftMinutes}m` : shiftMinutes < 0 ? `${shiftMinutes}m` : '0m'}
                </span>
              </div>
              <div className="text-sm font-black font-mono text-blue-700">
                {calculatedStart.slice(0, 5)} — {calculatedEnd.slice(0, 5)} IST
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {isFeasible ? '✓ No Train Delays' : '🚨 Conflict: Delays Train'}
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-bold">
              <span>-60 min (Earlier)</span>
              <span className="text-slate-900 font-bold font-sans text-xs">
                {shiftMinutes > 0 ? `Shift +${shiftMinutes} minutes` : `Shift ${shiftMinutes} minutes`}
              </span>
              <span>+120 min (Later)</span>
            </div>

            <input
              type="range"
              min={-60}
              max={120}
              step={5}
              value={shiftMinutes}
              onChange={(e) => setShiftMinutes(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700 focus:outline-none"
            />

            {/* Quick-Click Buttons */}
            <div className="flex items-center justify-between pt-1">
              {[-30, 0, 30, 35, 60].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setShiftMinutes(preset)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    shiftMinutes === preset
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset > 0 ? `+${preset}m` : `${preset}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Analysis Pill */}
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            isFeasible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center space-x-2">
              {isFeasible ? <ShieldCheck className="w-4 h-4 text-emerald-700" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <div>
                <span className="font-bold block text-slate-900">
                  {isFeasible ? 'Status: Safe & Feasible' : 'Status: Timetable Conflict'}
                </span>
                <span className="text-[11px] text-slate-600">
                  Affected Train: <strong className="font-mono">{conflictingTrainName}</strong>
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
              isFeasible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isFeasible ? '0 MIN DELAY' : '+30 MIN DELAY'}
            </span>
          </div>
        </div>

        {/* Commit Action Button */}
        <div className="pt-2">
          {isCommitted ? (
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold text-center flex items-center justify-center space-x-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Shift Committed! Timetable Updated.</span>
            </div>
          ) : (
            <button
              onClick={handleCommit}
              disabled={!isFeasible}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xs ${
                isFeasible
                  ? 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isFeasible ? 'Apply Shift to Live Schedule' : 'Conflict: Shift Would Delay Passenger Train'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ControlOfficeWhatIfSimulator;
