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
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs select-none space-y-4 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                Corridor Possession Solution &amp; Impact Analysis
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-mono">
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
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>How Requests Are Processed?</span>
          </button>

          {onOpenStatutory && (
            <button
              onClick={onOpenStatutory}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
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
            <span className="text-xs font-bold text-blue-950 flex items-center space-x-2">
              <GitMerge className="w-4 h-4 text-blue-600" />
              <span>Where Does Your Request Go &amp; How Is It Processed?</span>
            </span>
            <button
              onClick={() => setShowLifecycleExplainer(false)}
              className="text-xs text-blue-700 hover:underline font-bold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-600 block font-mono">STAGE 1: INGESTION</span>
              <span className="font-bold text-slate-900 block">TMS / SMMS / TDMS</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Defect tagged with asset location (e.g. KM 14.2) and severity.
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-purple-600 block font-mono">STAGE 2: RISK SCORING</span>
              <span className="font-bold text-slate-900 block">Criticality Index (CI)</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Evaluates failure probability using USFD flaw type, track geometry, and overdue days.
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-600 block font-mono">STAGE 3: SHADOW CLUSTER</span>
              <span className="font-bold text-slate-900 block">3-Dept Joint Window</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Bundles Track, Signal &amp; Traction jobs sharing the same corridor span.
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 block font-mono">STAGE 4: SOLVE &amp; GRANT</span>
              <span className="font-bold text-slate-900 block">OR-Tools CP-SAT + PN</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Places block into timetable gap; Station Master issues Private Number (Form T/351).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Before vs. After Visual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Card: Before (Current Manual BDMS Planning) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 text-xs">
              Traditional Manual Planning (BDMS)
            </span>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono">
              5.5 Hours Total Closed
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-medium">1. Track (TMS) Solo Closure:</span>
              <span className="font-bold text-slate-900 font-mono">2.5 hrs</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-medium">2. Signals (SMMS) Solo Closure:</span>
              <span className="font-bold text-slate-900 font-mono">1.5 hrs</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-medium">3. Traction (TDMS) Solo Closure:</span>
              <span className="font-bold text-slate-900 font-mono">1.5 hrs</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 pt-1 flex items-start space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>3 separate track stoppages, high passenger train detention, low corridor availability.</span>
          </div>
        </div>

        {/* Right Card: After (Automated Joint Shadow Block) */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <span className="font-bold text-emerald-950 text-xs flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Optimized Joint Shadow Block (RailBlock)</span>
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
              2.5 Hours Unified
            </span>
          </div>

          <div className="space-y-2">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Unified Possession Window:</span>
                <span className="font-bold text-emerald-700 font-mono">02:30 — 05:00 IST</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Track, Signal, and 25 kV Traction teams work concurrently during natural late-night timetable gap.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">Downtime Saved:</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">+5.3 Hours (55%)</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">VIP Train Delay:</span>
                <span className="font-bold text-blue-600 text-sm font-mono">0 Mins (Zero Delay)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-900 font-medium pt-1 flex items-start space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>1 physical track closure only, zero VIP passenger disruption, maximum corridor availability.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
