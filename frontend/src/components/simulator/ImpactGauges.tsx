import React from 'react';
import { WhatIfSimulationResponse } from '../../types/optimizer';
import { ShieldCheck, ShieldAlert, Clock, TrendingUp, Zap, Layers } from 'lucide-react';

interface ImpactGaugesProps {
  simulation?: WhatIfSimulationResponse | null;
  result?: WhatIfSimulationResponse | null;
  isLoading?: boolean;
}

export const ImpactGauges: React.FC<ImpactGaugesProps> = ({ simulation, result, isLoading = false }) => {
  const activeSim = simulation || result || {
    simulation_id: 'mock-sim-id',
    is_feasible: true,
    has_vip_train_conflict: false,
    detention_delta_minutes: 0,
    total_detention_minutes: 0,
    conflicting_trains_count: 0,
    risk_score_delta: -2.4,
    criticality_index_preserved_pct: 100.0,
    shadow_efficiency_score: 0.88,
    slw_advisory_required: false,
    commit_token: 'token_01',
    expires_at: new Date().toISOString(),
    conflicting_trains: [],
  };

  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 text-center shadow-xs">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500 font-medium font-sans">Evaluating corridor constraints &amp; VIP headway...</span>
      </div>
    );
  }

  const isFeasible = activeSim.is_feasible && !activeSim.has_vip_train_conflict;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none font-sans">
      {/* Feasibility Status */}
      <div
        className={`p-5 rounded-3xl border flex flex-col justify-between shadow-xs ${
          isFeasible
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-600">CORRIDOR STATUS</span>
          {isFeasible ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-rose-600" />}
        </div>
        <div className="mt-2">
          <span className="text-xl font-black tracking-tight block">
            {isFeasible ? 'FEASIBLE' : 'INFEASIBLE'}
          </span>
          <span className="text-[11px] text-slate-600 block mt-0.5">
            {activeSim.has_vip_train_conflict
              ? 'VIP Train Conflict (Zero-Detention rule violated)'
              : isFeasible
              ? 'Meets All Headway Rules'
              : 'Window Overrun'}
          </span>
        </div>
      </div>

      {/* Train Detention Delta */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">TRAIN DELAY IMPACT</span>
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span
              className={`text-2xl font-black font-mono ${
                activeSim.detention_delta_minutes === 0
                  ? 'text-emerald-600'
                  : activeSim.detention_delta_minutes > 0
                  ? 'text-rose-600'
                  : 'text-blue-600'
              }`}
            >
              {activeSim.detention_delta_minutes > 0 ? `+${activeSim.detention_delta_minutes}` : activeSim.detention_delta_minutes}
            </span>
            <span className="text-xs text-slate-400 font-mono">min</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {activeSim.detention_delta_minutes === 0 ? 'Zero detention added' : 'Passenger delay incurred'}
          </span>
        </div>
      </div>

      {/* Shadow Efficiency Score */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">SHADOW EFFICIENCY</span>
          <Layers className="w-5 h-5 text-purple-600" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black font-mono text-purple-600">
              {Math.round(activeSim.shadow_efficiency_score * 100)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Multi-department utilization</span>
        </div>
      </div>

      {/* Criticality Preserved */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">CRITICALITY PRESERVED</span>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black font-mono text-slate-900">
              {activeSim.criticality_index_preserved_pct.toFixed(0)}%
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">Full defect work completed</span>
        </div>
      </div>
    </div>
  );
};
