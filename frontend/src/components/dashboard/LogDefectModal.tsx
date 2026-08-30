import React, { useState } from 'react';
import { X, Plus, Wrench, Radio, Zap, CheckCircle2 } from 'lucide-react';

interface LogDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LogDefectModal: React.FC<LogDefectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [department, setDepartment] = useState<'TRACK' | 'SIGNAL' | 'TRACTION'>('TRACK');
  const [activity, setActivity] = useState<string>('USFD IMR Rail Flaw Replacement');
  const [kmLocation, setKmLocation] = useState<string>('KM 14/20 - 15/00');
  const [severity, setSeverity] = useState<number>(5);
  const [daysOverdue, setDaysOverdue] = useState<number>(3);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
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
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Log New Maintenance Requisition (Stage 1)
              </h3>
              <p className="text-xs text-slate-500">
                Manual asset defect ingestion for TMS, SMMS, or TDMS
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Department Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">
              Target Department
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDepartment('TRACK');
                  setActivity('USFD IMR Rail Flaw Replacement');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-bold cursor-pointer transition-all ${
                  department === 'TRACK'
                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>TMS (Track)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartment('SIGNAL');
                  setActivity('Point Machine Overhaul & Motor Test');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-bold cursor-pointer transition-all ${
                  department === 'SIGNAL'
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>SMMS (Signal)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDepartment('TRACTION');
                  setActivity('25 kV OHE Catenary Wire Adjustment');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-bold cursor-pointer transition-all ${
                  department === 'TRACTION'
                    ? 'bg-sky-50 border-sky-400 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>TDMS (OHE)</span>
              </button>
            </div>
          </div>

          {/* Activity Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Maintenance Activity &amp; Defect Title
            </label>
            <input
              type="text"
              required
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-blue-500"
            />
          </div>

          {/* Section & Chainage KM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Section Chainage (KM)
              </label>
              <input
                type="text"
                required
                value={kmLocation}
                onChange={(e) => setKmLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Days Overdue
              </label>
              <input
                type="number"
                min={0}
                max={90}
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none"
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Defect Severity Level (1 - 5)
              </label>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
                {severity === 5 ? 'Level 5 (Critical Emergency)' : `Level ${severity}`}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ea580c]"
            />
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
              className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Requisition Saved &amp; Scored!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit &amp; Run Risk Scoring</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
