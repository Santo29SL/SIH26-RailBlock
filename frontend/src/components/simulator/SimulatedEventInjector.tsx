import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Radio, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';

export const SimulatedEventInjector: React.FC = () => {
  const { simulateDelay } = useTelemetry();
  const [trainCode, setTrainCode] = useState<string>('12951');
  const [delayMinutes, setDelayMinutes] = useState<number>(25);
  const [isFired, setIsFired] = useState<boolean>(false);

  const handleInject = () => {
    simulateDelay(trainCode, delayMinutes);
    setIsFired(true);
    setTimeout(() => setIsFired(false), 3000);
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 select-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Test Live Delay Injection
          </h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
          TEST HARNESS
        </span>
      </div>

      <p className="text-xs text-slate-600">
        Inject a synthetic train delay into the live telemetry stream to test automatic rescheduling and VIP conflict alerts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Train Service</label>
          <select
            value={trainCode}
            onChange={(e) => setTrainCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none cursor-pointer"
          >
            <option value="12951">#12951 Mumbai Rajdhani (VIP Tier 1)</option>
            <option value="20607">#20607 Vande Bharat Exp (VIP Tier 1)</option>
            <option value="12621">#12621 Tamil Nadu SF (Express)</option>
            <option value="BOXN-88">#BOXN-88 Freight Goods Rake</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Injected Delay Duration</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">mins</span>
          </div>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase">Presets:</span>
        <button
          onClick={() => {
            setTrainCode('12621');
            setDelayMinutes(15);
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 border border-slate-200 transition-colors cursor-pointer"
        >
          +15m Minor Delay
        </button>
        <button
          onClick={() => {
            setTrainCode('12951');
            setDelayMinutes(35);
          }}
          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-700 border border-rose-200 transition-colors cursor-pointer"
        >
          +35m VIP Rajdhani Conflict
        </button>
        <button
          onClick={() => {
            setTrainCode('BOXN-88');
            setDelayMinutes(60);
          }}
          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-800 border border-amber-200 transition-colors cursor-pointer"
        >
          +60m Freight Block Overrun
        </button>
      </div>

      {/* Fire Event Button */}
      <button
        onClick={handleInject}
        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
          isFired
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
        }`}
      >
        {isFired ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Delay Injected into Telemetry Stream!</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Inject Delay (+{delayMinutes}m to #{trainCode})</span>
          </>
        )}
      </button>
    </div>
  );
};
