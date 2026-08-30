import React from 'react';
import { ConflictingTrainImpact } from '../../types/optimizer';
import { Train, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ConflictingTrainsTableProps {
  conflicts?: ConflictingTrainImpact[];
  trains?: ConflictingTrainImpact[];
}

export const ConflictingTrainsTable: React.FC<ConflictingTrainsTableProps> = ({
  conflicts,
  trains,
}) => {
  const activeConflicts = conflicts || trains || [];

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs select-none font-sans">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Train className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Impacted Passenger &amp; Freight Services
          </h4>
        </div>
        <span className="text-xs text-slate-500 font-mono font-bold">{activeConflicts.length} Impacted Trains</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 font-sans font-bold">
            <tr>
              <th className="px-4 py-3">Train Number</th>
              <th className="px-4 py-3">Service Name</th>
              <th className="px-4 py-3">Detention Tier</th>
              <th className="px-4 py-3">Timetable Slot</th>
              <th className="px-4 py-3">Detention Penalty</th>
              <th className="px-4 py-3 text-right">Violation Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {activeConflicts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <span className="font-bold text-slate-800">No train conflicts detected in this proposed maintenance window.</span>
                    <span className="text-[11px] text-slate-400">Zero detention guaranteed for all passenger and goods traffic.</span>
                  </div>
                </td>
              </tr>
            ) : (
              activeConflicts.map((t, idx) => {
                const isVipConflict = t.is_hard_conflict || t.detention_penalty_tier === 1;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      #{t.train_number}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{t.train_name}</td>
                    <td className="px-4 py-3">
                      {t.detention_penalty_tier === 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">
                          TIER 1 (VIP)
                        </span>
                      ) : t.detention_penalty_tier === 2 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold font-mono">
                          TIER 2 (EXPRESS)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                          TIER 3 (FREIGHT)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {t.scheduled_departure?.slice(0, 5)} — {t.scheduled_arrival?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600">
                      +{t.expected_detention_minutes} min
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isVipConflict ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-[10px] border border-rose-300">
                          HARD CONFLICT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold text-[10px] border border-amber-300">
                          BUFFER OVERRUN
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
