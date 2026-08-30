import React, { useState } from 'react';
import { X, Train, Radio, Play, CheckCircle2 } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

interface InjectTrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InjectTrainModal: React.FC<InjectTrainModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { simulateDelay } = useTelemetry();
  const [trainCode, setTrainCode] = useState<string>('12951');
  const [delayMinutes, setDelayMinutes] = useState<number>(25);
  const [isFired, setIsFired] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();
    simulateDelay(trainCode, delayMinutes);
    setIsFired(true);
    setTimeout(() => {
      setIsFired(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Inject Train Movement &amp; Live Disruption
              </h3>
              <p className="text-xs text-slate-500">
                Test real-time COA telemetry broadcast &amp; reactive fast rescheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleInject} className="p-6 space-y-4 text-xs">
          {/* Train Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Select Train Service (COA Stream)
            </label>
            <select
              value={trainCode}
              onChange={(e) => setTrainCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none cursor-pointer"
            >
              <option value="12951">#12951 Mumbai Rajdhani (VIP Tier 1 - Priority)</option>
              <option value="20607">#20607 Vande Bharat Express (VIP Tier 1 - Priority)</option>
              <option value="12621">#12621 Tamil Nadu Superfast Express (Tier 2)</option>
              <option value="BOXN-88">#BOXN-88 Coal Freight Rake (Tier 3 Goods)</option>
            </select>
          </div>

          {/* Delay Duration */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Injected Train Delay (Minutes)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={5}
                max={120}
                step={5}
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none"
              />
              <span className="text-xs text-slate-500 font-bold">mins</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
              Quick Scenario Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTrainCode('12621');
                  setDelayMinutes(15);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                +15m Minor Delay
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrainCode('12951');
                  setDelayMinutes(35);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                +35m VIP Rajdhani Conflict
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrainCode('BOXN-88');
                  setDelayMinutes(60);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-colors cursor-pointer"
              >
                +60m Goods Train Hold
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#002b49] hover:bg-[#003e6b] text-white font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              {isFired ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Telemetry Broadcasted!</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-sky-400" />
                  <span>Inject &amp; Broadcast Telemetry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
