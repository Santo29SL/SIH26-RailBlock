import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, CheckCircle2, FileCheck, AlertTriangle } from 'lucide-react';

interface DivisionalEscalationBannerProps {
  durationMinutes: number;
  blockCode?: string;
  isNiWork?: boolean;
}

export const DivisionalEscalationBanner: React.FC<DivisionalEscalationBannerProps> = ({
  durationMinutes,
  blockCode = 'BLK-20260825-001',
  isNiWork = false,
}) => {
  const { user } = useAuth();
  const [isSanctioned, setIsSanctioned] = useState<boolean>(false);

  const isEscalationRequired = durationMinutes > 240 || isNiWork;

  if (!isEscalationRequired) return null;

  const canSanction = user?.role === 'ADMIN' || user?.role === 'DIVISIONAL_AUTHORITY';

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/70 border-2 border-purple-500/50 shadow-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-purple-300">
                DIVISIONAL AUTHORITY ESCALATION SANCTION MANDATE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-mono font-bold">
                ADR 0009
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Traffic possession duration ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m) exceeds 4 hours.{' '}
              <span className="font-semibold text-purple-200">
                Statutory DRM / GM Sanction required per Railway Board letter dated 16.06.2022.
              </span>
            </p>
          </div>
        </div>

        {isSanctioned ? (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SANCTIONED BY DRM</span>
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center space-x-1.5 shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>AWAITING DRM SANCTION</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-purple-500/20 text-xs">
        <span className="text-[11px] text-slate-400 font-mono">
          Ref: Railway Board Joint Directorate Letter No. 2022/CE-II/TK/Traffic-Block/16.06.2022
        </span>

        {!isSanctioned && (
          <button
            onClick={() => setIsSanctioned(true)}
            disabled={!canSanction}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
              canSanction
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{canSanction ? 'Grant DRM Divisional Sanction' : 'Switch to DRM MAS Role to Sanction'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
