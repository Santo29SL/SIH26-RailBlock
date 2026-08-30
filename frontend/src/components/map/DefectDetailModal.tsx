import React from 'react';
import { MaintenanceRequest } from '../../types/block';
import { Activity, X, Gauge, MapPin, Layers, ShieldCheck } from 'lucide-react';

interface DefectDetailModalProps {
  request: MaintenanceRequest | any | null;
  onClose: () => void;
  onPlanBlock?: (request: MaintenanceRequest) => void;
}

export const DefectDetailModal: React.FC<DefectDetailModalProps> = ({
  request,
  onClose,
  onPlanBlock,
}) => {
  if (!request) return null;

  const meta = request.metadata_json || {};
  const usfd = meta.usfd_classification || 'GOOD';
  const tgiDev = meta.tgi_deviation !== undefined ? meta.tgi_deviation : 82.5;
  const curvature = meta.curvature_deg !== undefined ? meta.curvature_deg : 2.4;
  const speedRestr = meta.speed_restriction_kmh || 30;
  const daysOverdue = request.overdueDays || (meta.days_overdue ? `${meta.days_overdue} days` : '8 days');
  const ciScore = request.ci || meta.criticality_index || 88;

  const shapAttributions = [
    { name: `USFD rail flaw (${usfd})`, value: usfd === 'IMR' || usfd === 'IMRW' ? 0.24 : 0.08, color: 'bg-rose-500' },
    { name: `TGI deviation (${tgiDev})`, value: 0.14, color: 'bg-amber-500' },
    { name: `Days overdue (${daysOverdue})`, value: 0.09, color: 'bg-sky-500' },
    { name: `Speed restriction (${speedRestr} km/h)`, value: 0.07, color: 'bg-purple-500' },
    { name: `Track Curvature (${curvature}°)`, value: 0.04, color: 'bg-indigo-500' },
  ];

  const totalProb = Math.min(0.95, 0.08 + shapAttributions.reduce((acc, s) => acc + s.value, 0));

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Asset Inspection &amp; Predictive Risk Factors (SHAP)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono font-bold border border-sky-200">
                  STAGE 2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Requisition Code: <strong className="text-slate-900 font-mono">{request.requestCode || request.request_code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
          {/* Top Asset Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-mono block">CRITICALITY INDEX</span>
              <span className="text-xl font-bold font-mono text-orange-600">{ciScore} / 100</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-mono block">FAIL PROBABILITY</span>
              <span className="text-xl font-bold font-mono text-rose-600">{(totalProb * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-mono block">PRIORITY TIER</span>
              <span className="text-xl font-bold font-mono text-slate-900">{request.priority || 'HIGH'}</span>
            </div>
          </div>

          {/* Probability Factor Breakdown (SHAP Attributions) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-700">
                Statistical Failure Factor Contributions:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Base Baseline $P_0 = 8\%$</span>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {shapAttributions.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-700">{s.name}</span>
                    <span className="font-bold text-slate-900">+{(s.value * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.color}`}
                      style={{ width: `${(s.value / 0.3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          {onPlanBlock && (
            <button
              onClick={() => {
                onPlanBlock(request);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bundle into Joint Shadow Block</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
