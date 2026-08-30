import React from 'react';
import { Sparkles, Play, Wrench, Zap, FileText, CheckCircle2, ArrowRight, HelpCircle, BookOpen } from 'lucide-react';

interface CorridorWorkflowBarProps {
  onRunTest1_LogDefect: () => void;
  onRunTest2_InjectDelay: () => void;
  onRunTest3_SolveSchedule: () => void;
  onRunTest4_OpenStationMaster: () => void;
  onOpenTour?: () => void;
}

export const JudgeScenarioBar: React.FC<CorridorWorkflowBarProps> = ({
  onRunTest1_LogDefect,
  onRunTest2_InjectDelay,
  onRunTest3_SolveSchedule,
  onRunTest4_OpenStationMaster,
  onOpenTour,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs select-none font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-wide">
                Corridor Operations &amp; Automated Dispatch Lifecycle
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 font-mono">
                1-CLICK WORKFLOW
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Step-by-step verification pipeline for multi-department block planning &amp; disruption recovery
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>How This System Works (2-Min Visual Guide)</span>
            </button>
          )}

          <div className="text-[10px] font-mono text-slate-600 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            SIH PS 26027
          </div>
        </div>
      </div>

      {/* 4 Clean Interactive One-Click Workflow Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 */}
        <button
          onClick={onRunTest1_LogDefect}
          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left group cursor-pointer flex items-start space-x-3"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            1
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
              Log Track Defect (TMS)
            </span>
            <span className="text-[11px] text-slate-500 block leading-snug mt-1">
              Ingests USFD rail flaw &rarr; evaluates Criticality (CI = 88) on GIS map.
            </span>
          </div>
        </button>

        {/* Step 2 */}
        <button
          onClick={onRunTest2_InjectDelay}
          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-rose-400 hover:shadow-xs transition-all text-left group cursor-pointer flex items-start space-x-3"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            2
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-rose-600 transition-colors">
              Inject Train Delay (+35m)
            </span>
            <span className="text-[11px] text-slate-500 block leading-snug mt-1">
              Simulates VIP delay &rarr; highlights conflict &amp; triggers 1-click rescheduler.
            </span>
          </div>
        </button>

        {/* Step 3 */}
        <button
          onClick={onRunTest3_SolveSchedule}
          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all text-left group cursor-pointer flex items-start space-x-3"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            3
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-600 transition-colors">
              Optimize Schedule (CP-SAT)
            </span>
            <span className="text-[11px] text-slate-500 block leading-snug mt-1">
              Bundles 3 departments into 1 window &rarr; saves +5.3h track downtime.
            </span>
          </div>
        </button>

        {/* Step 4 */}
        <button
          onClick={onRunTest4_OpenStationMaster}
          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all text-left group cursor-pointer flex items-start space-x-3"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            4
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
              Station Master PN Grant
            </span>
            <span className="text-[11px] text-slate-500 block leading-snug mt-1">
              Signs SSE consents &rarr; issues Station Master Private Number (Form T/351).
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
