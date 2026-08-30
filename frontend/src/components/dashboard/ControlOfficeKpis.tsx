import React from 'react';
import { Layers, Clock, ShieldCheck, TrendingUp, Zap, Train } from 'lucide-react';

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
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-[#213d77] uppercase tracking-wide">
            Active Possessions
          </span>
          <span className="p-2 rounded-xl bg-blue-50 text-[#213d77]">
            <Layers className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-[#213d77] font-mono tracking-tight">
            {activeBlocksCount}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Windows
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1.5 border-t border-slate-100">
          <span className="text-emerald-700 font-bold">100% G&amp;SR Verified</span>
          <span>• Multi-Dept Bundled</span>
        </div>
      </div>

      {/* KPI 2: Shadow Overlap Saved */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-[#213d77] uppercase tracking-wide">
            Downtime Saved
          </span>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <Clock className="w-4 h-4 text-emerald-600" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
            +{shadowSavedHours.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Hours
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1.5 border-t border-slate-100">
          <span className="text-[#fb792b] font-bold">55% Line Capacity Gain</span>
          <span>• Zero Bottlenecks</span>
        </div>
      </div>

      {/* KPI 3: VIP Detention Protection */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-[#213d77] uppercase tracking-wide">
            VIP Train Delay
          </span>
          <span className={`p-2 rounded-xl ${vipDetentionMinutes === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <Train className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className={`text-3xl font-black font-mono tracking-tight ${vipDetentionMinutes === 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {vipDetentionMinutes}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Minutes
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1.5 border-t border-slate-100">
          <span className="text-emerald-700 font-bold">Vande Bharat &amp; Rajdhani</span>
          <span>Protected</span>
        </div>
      </div>

      {/* KPI 4: Criticality Score Resolved */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-bold text-[#213d77] uppercase tracking-wide">
            Hazard CI Cleared
          </span>
          <span className="p-2 rounded-xl bg-orange-50 text-[#fb792b]">
            <ShieldCheck className="w-4 h-4 text-[#fb792b]" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2 my-1">
          <span className="text-3xl font-black text-[#fb792b] font-mono tracking-tight">
            {criticalityScore.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Score
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1.5 border-t border-slate-100">
          <span className="text-[#213d77] font-bold">CatBoost Hazard Model</span>
          <span>• Stage 2</span>
        </div>
      </div>
    </div>
  );
};
