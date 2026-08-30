import React from 'react';
import { Layers, Clock, ShieldCheck, TrendingUp, Zap } from 'lucide-react';

interface ControlOfficeKpisProps {
  activeBlocksCount?: number;
  shadowSavedHours?: number;
  vipDetentionMinutes?: number;
  criticalityScore?: number;
}

export const ControlOfficeKpis: React.FC<ControlOfficeKpisProps> = ({
  activeBlocksCount = 20,
  shadowSavedHours = 5.3,
  vipDetentionMinutes = 0,
  criticalityScore = 171.6,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none font-sans">
      {/* KPI 1: Active Scheduled Blocks */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Active Possessions
          </span>
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Layers className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {activeBlocksCount}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Windows
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1.5 border-t border-slate-100">
          <span className="text-emerald-700 font-bold">100% G&amp;SR Verified</span>
          <span>• 24h/7d/30d Active</span>
        </div>
      </div>

      {/* KPI 2: Shadow Overlap Saved */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Downtime Saved
          </span>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
            +{shadowSavedHours.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Hours
          </span>
        </div>
        <div className="text-[11px] text-emerald-800 font-bold pt-1.5 border-t border-slate-100">
          55% Downtime Cut vs BDMS
        </div>
      </div>

      {/* KPI 3: VIP Headway Protection */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            VIP Passenger Delay
          </span>
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-blue-600 font-mono tracking-tight">
            {vipDetentionMinutes}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Mins
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1.5 border-t border-slate-100">
          <span className="text-blue-700 font-bold">Vande Bharat / Rajdhani</span>
          <span>• Zero Detention</span>
        </div>
      </div>

      {/* KPI 4: Criticality Score Preserved */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Criticality Preserved
          </span>
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {criticalityScore.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            / 200 Σ CI
          </span>
        </div>
        <div className="text-[11px] text-purple-700 font-bold pt-1.5 border-t border-slate-100">
          Stage 2 CatBoost Hazard Model
        </div>
      </div>
    </div>
  );
};
