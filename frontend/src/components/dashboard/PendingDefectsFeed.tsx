import React from 'react';
import { MaintenanceRequest } from '../../types/block';
import { AlertCircle, BrainCircuit, Wrench, ShieldAlert } from 'lucide-react';

interface PendingDefectsFeedProps {
  requests: MaintenanceRequest[];
  onInspectDefect?: (request: MaintenanceRequest) => void;
}

export const PendingDefectsFeed: React.FC<PendingDefectsFeedProps> = ({
  requests,
  onInspectDefect,
}) => {
  const getDepartmentBadge = (dept: string) => {
    switch (dept) {
      case 'TRACK':
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">TMS TRACK</span>;
      case 'SIGNAL':
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">SMMS SIGNAL</span>;
      case 'TRACTION':
        return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">TDMS TRD</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{dept}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Pending Defect Backlog &amp; Criticality</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">{requests.length} Pending Requisitions</span>
      </div>

      <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-96">
        {requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending defect requisitions. All corridor assets compliant.
          </div>
        ) : (
          requests.map((req) => {
            const meta = req.metadata_json || {};
            const usfd = meta.usfd_classification || 'GOOD';
            const isCritical = usfd === 'IMR' || usfd === 'IMRW' || req.priority === 'CRITICAL';

            return (
              <div
                key={req.id}
                className="py-3 px-2 hover:bg-slate-50 rounded-xl transition-colors flex items-start justify-between space-x-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono font-bold text-xs text-blue-600">{req.request_code}</span>
                    {getDepartmentBadge(req.department)}
                    {isCritical && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-mono font-bold flex items-center space-x-1 animate-pulse">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>T1 USFD ({usfd})</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 truncate">{req.activity_type}</h4>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Est: {req.duration_minutes}m</span>
                    <span>Deadline: {req.deadline}</span>
                    {meta.chainage_km && <span>KM {meta.chainage_km}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <button
                    onClick={() => onInspectDefect && onInspectDefect(req)}
                    className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    title="Inspect AI Risk &amp; SHAP Attributions"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>AI XAI</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
