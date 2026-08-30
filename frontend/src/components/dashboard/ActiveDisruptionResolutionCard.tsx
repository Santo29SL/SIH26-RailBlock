import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight, Zap, Clock, ShieldCheck, Play, RotateCcw } from 'lucide-react';

interface ActiveDisruptionResolutionCardProps {
  delayedTrainNumber?: string;
  delayMinutes?: number;
  conflictingBlockCode?: string;
  isResolved?: boolean;
  onApplyResolution: () => void;
  onDismiss: () => void;
}

export const ActiveDisruptionResolutionCard: React.FC<ActiveDisruptionResolutionCardProps> = ({
  delayedTrainNumber = '12951',
  delayMinutes = 35,
  conflictingBlockCode = 'BLK-20260829-002',
  isResolved = false,
  onApplyResolution,
  onDismiss,
}) => {
  return (
    <div className={`border-2 rounded-3xl p-5 shadow-xs select-none font-sans transition-all duration-200 ${
      isResolved
        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 animate-in fade-in'
        : 'bg-rose-50/60 border-rose-300 text-slate-900 animate-in slide-in-from-top-4'
    }`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
            isResolved ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {isResolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-wide">
                {isResolved ? 'Disruption Resolved: Schedule Realigned' : 'Live Corridor Disruption & Schedule Conflict Detected'}
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono ${
                isResolved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {isResolved ? '✓ ZERO VIP DELAY RESTORED' : `🚨 +${delayMinutes}M VIP DELAY HAZARD`}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isResolved
                ? 'The automated solver shifted the possession window to prevent all passenger detention.'
                : 'A late-running train conflict requires real-time rescheduling to preserve the statutory safety buffer.'}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
        >
          Dismiss Alert
        </button>
      </div>

      {/* 2-Column Problem & Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left: The Conflict (Problem) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-rose-900 text-xs flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>1. Injected Disruption (Problem)</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              Train #{delayedTrainNumber}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Delayed Train:</span>
              <span className="font-bold text-slate-900 font-mono">#{delayedTrainNumber} Mumbai Rajdhani (VIP Tier-1)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Injected Delay:</span>
              <span className="font-bold text-rose-600 font-mono">+{delayMinutes} Minutes</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Conflicting Possession:</span>
              <span className="font-bold text-slate-900 font-mono">{conflictingBlockCode} (02:30 — 05:00)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Violation:</span>
              <span className="font-bold text-rose-700">Violates G&amp;SR 15-min statutory headway buffer</span>
            </div>
          </div>
        </div>

        {/* Right: The Automated Resolution (Solution) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-emerald-900 text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Automated Rescheduling Strategy</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                1-CLICK TIME_SHIFT (+35m)
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 mt-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Optimization Action:</span>
                <span className="font-bold text-emerald-700 font-mono">Shift Block Start: 02:30 &rarr; 03:05 IST</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Adjusted Window:</span>
                <span className="font-bold text-blue-600 font-mono">03:05 — 05:35 IST (150m Full Duration)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Net Outcome:</span>
                <span className="font-bold text-emerald-700">0 min VIP Detention • 100% Work Preserved</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {!isResolved ? (
              <button
                onClick={onApplyResolution}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Apply Automated Reschedule (+35m Shift)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold font-mono">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reschedule Applied: Timetable Synchronized</span>
                </div>
                <button
                  onClick={onApplyResolution}
                  className="text-[10px] text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-test</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
