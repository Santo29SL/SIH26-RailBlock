import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ControlOfficeFooter: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white p-4 rounded-2xl shadow-xs text-slate-500 text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
          </div>
          <div>
            <div className="font-bold text-slate-800">
              INDIAN RAILWAYS • CENTRE FOR RAILWAY INFORMATION SYSTEMS (CRIS) &amp; RDSO
            </div>
            <div className="text-[11px] text-slate-500">
              Automatic Block Planning &amp; Multi-Department Corridor Possession System • G&amp;SR Verified
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>TMS, SMMS &amp; TDMS Integrated</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google OR-Tools CP-SAT Two-Tier Optimization</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Statutory Form T/351 Protocol Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
