import React, { useState } from 'react';
import { Department } from '../../types/block';
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react';

interface ConsentSignoffProps {
  departments?: Department[];
  blockId?: string;
  currentStatus?: string;
  onAllConsentsGiven?: (allGiven: boolean) => void;
  onConsentsComplete?: () => void;
}

export const ConsentSignoff: React.FC<ConsentSignoffProps> = ({
  departments,
  blockId,
  currentStatus,
  onAllConsentsGiven,
  onConsentsComplete,
}) => {
  const deptList: Department[] = departments && departments.length > 0 ? departments : ['TRACK', 'SIGNAL', 'TRACTION'];

  const [consents, setConsents] = useState<Record<string, boolean>>({
    TRACK: true,
    SIGNAL: true,
    TRACTION: true,
  });

  const toggleConsent = (dept: string) => {
    const updated = { ...consents, [dept]: !consents[dept] };
    setConsents(updated);
    const allGiven = deptList.every((d) => updated[d]);
    if (onAllConsentsGiven) onAllConsentsGiven(allGiven);
    if (onConsentsComplete && allGiven) onConsentsComplete();
  };

  const getDeptDetails = (dept: Department) => {
    switch (dept) {
      case 'TRACK':
        return { role: 'Track Engineer (SSE / Permanent Way)', icon: '🛤️', note: 'Track geometry & welding safety checked' };
      case 'SIGNAL':
        return { role: 'Signal Engineer (SSE / Signal & Telecom)', icon: '🚦', note: 'Point locking & track circuit disconnection approved' };
      case 'TRACTION':
        return { role: 'Electric Engineer (SSE / Traction TRD)', icon: '⚡', note: '25 kV OHE power isolation permit ready' };
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 select-none font-sans">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Step 1: Multi-Department Pre-Approval Consents</span>
        </h4>
        <span className="text-[10px] text-emerald-700 font-bold font-mono">3 / 3 Signed (Consents Ready)</span>
      </div>

      <div className="space-y-2">
        {deptList.map((dept) => {
          const details = getDeptDetails(dept);
          const isSigned = !!consents[dept];

          return (
            <div
              key={dept}
              onClick={() => toggleConsent(dept)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSigned
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{details.icon}</span>
                <div>
                  <span className="text-xs font-bold block text-slate-900">{details.role}</span>
                  <span className="text-[11px] text-slate-500">{details.note}</span>
                </div>
              </div>

              <div>
                {isSigned ? (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Consent Signed</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                    <Circle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Click to Sign</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
