import React from 'react';
import { Clock, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface WhatIfSliderProps {
  shiftMinutes: number;
  onShiftChange?: (shift: number) => void;
  onChange?: (shift: number) => void;
  baseStartTime?: string;
  baseEndTime?: string;
  calculatedStartTime?: string;
  calculatedEndTime?: string;
  onReset?: () => void;
}

export const WhatIfSlider: React.FC<WhatIfSliderProps> = ({
  shiftMinutes = 0,
  onShiftChange,
  onChange,
  baseStartTime = '02:30:00',
  baseEndTime = '05:00:00',
  calculatedStartTime = '02:30',
  calculatedEndTime = '05:00',
  onReset,
}) => {
  const handleChange = (val: number) => {
    if (onShiftChange) onShiftChange(val);
    if (onChange) onChange(val);
  };

  const handleReset = () => {
    if (onReset) onReset();
    else handleChange(0);
  };

  const baseStart = (baseStartTime || '02:30:00').slice(0, 5);
  const baseEnd = (baseEndTime || '05:00:00').slice(0, 5);
  const calcStart = calculatedStartTime || '02:30';
  const calcEnd = calculatedEndTime || '05:00';

  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 select-none font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Time-Shift Slider
          </h4>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to 0m</span>
        </button>
      </div>

      {/* Time Comparison Badges */}
      <div className="grid grid-cols-2 gap-3 font-mono">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 block font-bold uppercase font-sans">Base Slot</span>
          <span className="text-sm font-bold text-slate-800">
            {baseStart} — {baseEnd}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-700 block font-bold uppercase font-sans">Simulated Slot</span>
            <span className="text-[10px] font-bold text-blue-700">
              {shiftMinutes > 0 ? `+${shiftMinutes}m` : shiftMinutes < 0 ? `${shiftMinutes}m` : '0m'}
            </span>
          </div>
          <span className="text-sm font-black text-blue-700">
            {calcStart} — {calcEnd}
          </span>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>-60 min (Earlier)</span>
          <span className="font-bold text-blue-700 text-sm font-sans">
            {shiftMinutes > 0 ? `+${shiftMinutes} mins` : `${shiftMinutes} mins`}
          </span>
          <span>+120 min (Later)</span>
        </div>

        <input
          type="range"
          min={-60}
          max={120}
          step={5}
          value={shiftMinutes}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
        />

        {/* Quick Click Preset Buttons */}
        <div className="flex items-center justify-between pt-2">
          {[-30, 0, 30, 60, 90].map((preset) => (
            <button
              key={preset}
              onClick={() => handleChange(preset)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                shiftMinutes === preset
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset > 0 ? `+${preset}m` : `${preset}m`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
