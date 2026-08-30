import React, { useState } from 'react';
import { Layers, CheckCircle2, Clock, ShieldCheck, ArrowRight, GitMerge, Info, AlertTriangle } from 'lucide-react';

interface OptimizationSolutionCardProps {
  onOpenStatutory?: () => void;
}

export const OptimizationSolutionCard: React.FC<OptimizationSolutionCardProps> = ({
  onOpenStatutory,
}) => {
  const [showLifecycleExplainer, setShowLifecycleExplainer] = useState<boolean>(false);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs select-none space-y-4 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-[#213d77] tracking-wide">
                Corridor Possession Solution &amp; Impact Analysis
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 font-mono">
                55% Downtime Cut
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Replaces decentralized manual departmental requests with 1 synchronized multi-department Joint Possession
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLifecycleExplainer(!showLifecycleExplainer)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#213d77] text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <Info className="w-3.5 h-3.5 text-[#fb792b]" />
            <span>How Requests Are Processed?</span>
          </button>

          {onOpenStatutory && (
            <button
              onClick={onOpenStatutory}
              className="px-4 py-1.5 rounded-xl bg-[#213d77] hover:bg-[#182c52] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Open Form T/351 Clearance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Flow Accordion */}
      {showLifecycleExplainer && (
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#213d77]">
              End-to-End Corridor Possession Lifecycle
            </span>
            <span className="text-[10px] text-slate-500 font-mono">G&amp;SR Chapter V Protocols</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#fb792b] font-mono block">STAGE 1: TMS/SMMS</span>
              <p className="text-slate-700 font-semibold">Asset Defect Ingested</p>
              <p className="text-[11px] text-slate-500">Manual or telemetry feed logs track/signal/OHE flaws.</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#fb792b] font-mono block">STAGE 2: CATBOOST</span>
              <p className="text-slate-700 font-semibold">Criticality Scoring (CI)</p>
              <p className="text-[11px] text-slate-500">Asset hazard model evaluates CI score &amp; urgency tier.</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#fb792b] font-mono block">STAGE 5: CP-SAT</span>
              <p className="text-slate-700 font-semibold">Joint Bundle Solved</p>
              <p className="text-[11px] text-slate-500">Bundles Track + Signal + TRD into 1 shadow slot.</p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-[#fb792b] font-mono block">STAGE 7: STATUTORY</span>
              <p className="text-slate-700 font-semibold">Station Master PN Issued</p>
              <p className="text-[11px] text-slate-500">Form T/351 Disconnection Private Numbers granted.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Before vs. After Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Box: Before Optimization */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Legacy Decentralized Approach (3 Separate Requests)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
              9.6h Total Track Downtime
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">1. Track Engineering (TMS)</span>
                <span className="text-[11px] text-slate-500 font-mono">00:45 - 04:15 (3.5h standalone block)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-700">3.5h Loss</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">2. Signal &amp; Telecom (SMMS)</span>
                <span className="text-[11px] text-slate-500 font-mono">08:00 - 10:30 (2.5h standalone block)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-700">2.5h Loss</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">3. Electrical Traction (TDMS)</span>
                <span className="text-[11px] text-slate-500 font-mono">13:30 - 17:06 (3.6h standalone block)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-700">3.6h Loss</span>
            </div>
          </div>
        </div>

        {/* Right Box: After Optimization (RailBlock Solution) */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Optimized Joint Shadow Possession (1 Synchronized Slot)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
              4.3h Total Window (+5.3h Saved)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#213d77]">BLK-20260829-002 (UP MAIN)</span>
              <span className="text-xs font-mono font-bold text-emerald-700">02:30 — 05:00 IST</span>
            </div>

            <p className="text-[11px] text-slate-600">
              Bundles USFD rail replacement, Point Machine 114A overhaul, and 25 kV OHE catenary adjustment into a single synchronized window.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono text-[10px] font-bold border border-rose-200">
                Track: 3.5h Work
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono text-[10px] font-bold border border-amber-200">
                Signal: 2.5h Work
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-mono text-[10px] font-bold border border-sky-200">
                Traction: 3.6h Work
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-emerald-800 bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">
            <span className="font-bold">Net Corridor Efficiency:</span>
            <span className="font-bold text-emerald-900">+5.3 Hours Saved | 0 VIP Train Delay</span>
          </div>
        </div>
      </div>
    </div>
  );
};
