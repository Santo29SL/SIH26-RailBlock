import React, { useState } from 'react';
import { Layers, CheckCircle2, Clock, ShieldCheck, ArrowRight, GitBranch, Info, AlertTriangle } from 'lucide-react';

interface OptimizationSolutionCardProps {
  onOpenStatutory?: () => void;
}

export const OptimizationSolutionCard: React.FC<OptimizationSolutionCardProps> = ({
  onOpenStatutory,
}) => {
  const [showLifecycleExplainer, setShowLifecycleExplainer] = useState<boolean>(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs select-none space-y-4 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                Maintenance Window Optimization &amp; Impact Analysis
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-mono">
                55% DOWNTIME SAVED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Replaces separate departmental closures with 1 synchronized shared repair window
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLifecycleExplainer(!showLifecycleExplainer)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-blue-700" />
            <span>Workflow Stages</span>
          </button>

          {onOpenStatutory && (
            <button
              onClick={onOpenStatutory}
              className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Open Safety Notice (Form T/351)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Flow Accordion */}
      {showLifecycleExplainer && (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-blue-700" />
              <span>4-Stage Maintenance Planning Pipeline:</span>
            </span>
            <button
              onClick={() => setShowLifecycleExplainer(false)}
              className="text-xs text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 block font-mono">1. DEFECT LOGS</span>
              <span className="font-bold text-slate-900 block">Track, Signal &amp; Power</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Defects detected by ultrasonic scans, switch logs, and wire inspection.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 block font-mono">2. RISK SCORING</span>
              <span className="font-bold text-slate-900 block">Urgency Rating (0-100)</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Evaluates defect risk so urgent track flaws receive priority scheduling.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 block font-mono">3. BUNDLE REPAIRS</span>
              <span className="font-bold text-slate-900 block">Shared Time Slot</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Bundles nearby Track, Signal &amp; Power work into one joint time window.
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 block font-mono">4. SOLVE &amp; APPROVE</span>
              <span className="font-bold text-slate-900 block">0 Train Delays + Form T/351</span>
              <p className="text-[11px] text-slate-600 leading-snug">
                Places window into a train gap; Station Master issues safety authorization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Before vs. After Visual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Card: Before (Traditional Uncoordinated Closures) */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 text-xs">
              Traditional Uncoordinated Planning
            </span>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200 font-mono">
              5.5 Hours Stopped
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-600 font-medium">1. Track Department Closure:</span>
              <span className="font-bold text-slate-900 font-mono">2.5 hrs</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-600 font-medium">2. Signal Department Closure:</span>
              <span className="font-bold text-slate-900 font-mono">1.5 hrs</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-600 font-medium">3. Electrical Department Closure:</span>
              <span className="font-bold text-slate-900 font-mono">1.5 hrs</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 pt-1 flex items-start space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>3 separate track stoppages, high passenger train delays, wasted track capacity.</span>
          </div>
        </div>

        {/* Right Card: After (Automated Joint Shadow Block) */}
        <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <span className="font-bold text-emerald-950 text-xs flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>RailBlock Bundled Maintenance Window</span>
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-mono">
              2.5 Hours (55% Saved)
            </span>
          </div>

          <div className="space-y-2">
            <div className="bg-white p-2.5 rounded border border-emerald-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Unified Maintenance Window:</span>
                <span className="font-bold text-emerald-700 font-mono">02:30 — 05:00 IST</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Track, Signal, and Electrical teams work concurrently during natural late-night timetable gap.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">Downtime Saved:</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">+5.3 Hours (55%)</span>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">VIP Train Delays:</span>
                <span className="font-bold text-blue-700 text-sm font-mono">0 Mins (Zero Delay)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-900 font-medium pt-1 flex items-start space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <span>1 physical track closure only, zero VIP passenger disruption, maximum corridor availability.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OptimizationSolutionCard;
