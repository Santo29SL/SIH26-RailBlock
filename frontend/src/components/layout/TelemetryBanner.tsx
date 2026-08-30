import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { AlertOctagon, X, Zap } from 'lucide-react';

export const TelemetryBanner: React.FC = () => {
  const { activePopupAlert, dismissPopupAlert, openReschedulerForAlert } = useTelemetry();

  if (!activePopupAlert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500/60 shadow-2xl shadow-rose-950/80 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-rose-300">LIVE TELEMETRY DISRUPTION</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 font-mono font-bold">
                  STAGE 6
                </span>
              </div>
              <p className="text-xs text-slate-200 font-semibold mt-0.5">
                Train #{activePopupAlert.trainCode} Delayed by <span className="text-rose-400 font-bold">+{activePopupAlert.delayMinutes} mins</span>
              </p>
            </div>
          </div>
          <button
            onClick={dismissPopupAlert}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-lg border border-rose-500/20 font-mono">
          {activePopupAlert.actionAdvised}
        </div>

        <div className="mt-3 flex items-center space-x-2">
          {activePopupAlert.rescheduleRequired ? (
            <button
              onClick={() => openReschedulerForAlert(activePopupAlert)}
              className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Launch Fast Rescheduler & SLW Fallback</span>
            </button>
          ) : (
            <button
              onClick={dismissPopupAlert}
              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              Acknowledge Buffer Absorption
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
