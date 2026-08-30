import React, { useState } from 'react';
import { X, Plus, Wrench, Radio, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { MaintenanceRequest } from '../../types/block';

interface LogDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newDefect: any) => void;
}

export const LogDefectModal: React.FC<LogDefectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [department, setDepartment] = useState<'TRACK' | 'SIGNAL' | 'TRACTION'>('TRACK');
  const [activity, setActivity] = useState<string>('USFD IMR Rail Flaw Immediate Replacement');
  const [kmLocation, setKmLocation] = useState<string>('14.2');
  const [severity, setSeverity] = useState<number>(5);
  const [daysOverdue, setDaysOverdue] = useState<number>(4);
  const [speedRestriction, setSpeedRestriction] = useState<number>(30);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const deptPrefix = department === 'TRACK' ? 'TMS' : department === 'SIGNAL' ? 'S&T' : 'TRD';
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
    const requestCode = `${deptPrefix}-${randomHex}`;
    const chainageNum = parseFloat(kmLocation) || 14.2;

    const ciScore = severity === 5 ? 88 : severity === 4 ? 76 : severity === 3 ? 62 : 45;

    const newDefectItem: any = {
      id: `req-logged-${Date.now()}`,
      request_code: requestCode,
      department: department,
      activity_type: activity,
      priority: severity >= 4 ? 'CRITICAL' : 'HIGH',
      status: 'PENDING_SANCTION',
      metadata_json: {
        chainage_km: chainageNum,
        criticality_index: ciScore,
        days_overdue: daysOverdue,
        speed_restriction_kmh: speedRestriction,
        usfd_classification: department === 'TRACK' ? 'IMR' : 'GOOD',
      },
    };

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      if (onSuccess) onSuccess(newDefectItem);
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - IRCTC Official Blue */}
        <div className="p-5 bg-[#213d77] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fb792b] flex items-center justify-center text-white font-bold shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Log New Maintenance Requisition (Stage 1)
              </h3>
              <p className="text-xs text-blue-100">
                Official asset defect ingestion for TMS, SMMS, or TDMS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
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
                  setActivity('USFD IMR Rail Flaw Immediate Replacement');
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-bold cursor-pointer transition-all ${
                  department === 'TRACK'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-rose-600" />
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
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-600" />
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
                    ? 'bg-sky-50 border-sky-500 text-sky-800 ring-2 ring-sky-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-sky-600" />
                <span>TDMS (Traction)</span>
              </button>
            </div>
          </div>

          {/* Activity Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
              Work Description
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-[#213d77] focus:bg-white"
              required
            />
          </div>

          {/* Location & Speed Drop Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Chainage Location (KM)
              </label>
              <input
                type="text"
                value={kmLocation}
                onChange={(e) => setKmLocation(e.target.value)}
                placeholder="e.g. 14.2"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-[#213d77] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Imposed TSR Speed (KM/H)
              </label>
              <input
                type="number"
                value={speedRestriction}
                onChange={(e) => setSpeedRestriction(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-[#213d77] focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Severity & Overdue Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Defect Severity (1 - 5)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-[#213d77] focus:bg-white cursor-pointer"
              >
                <option value={5}>Level 5 - Critical (IMR / Flaw)</option>
                <option value={4}>Level 4 - High Priority</option>
                <option value={3}>Level 3 - Medium Routine</option>
                <option value={2}>Level 2 - Planned Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Days Overdue
              </label>
              <input
                type="number"
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-[#213d77] focus:bg-white"
                required
              />
            </div>
          </div>

          {/* IRCTC Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaved}
              className="px-5 py-2.5 rounded-xl bg-[#fb792b] hover:bg-[#e06318] text-white font-bold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-spin" />
                  <span>Ingesting to Gantt &amp; Map...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Submit &amp; Ingest to Corridor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
