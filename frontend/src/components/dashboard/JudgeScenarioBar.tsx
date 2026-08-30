import React from 'react';
import { Layers, Wrench, Clock, Play, FileText } from 'lucide-react';

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
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs select-none font-sans flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
        <Layers className="w-4 h-4 text-blue-700" />
        <span>Quick Actions:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={onRunTest1_LogDefect}
          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 text-rose-600" />
          <span>1. Report Defect</span>
        </button>

        <button
          onClick={onRunTest2_InjectDelay}
          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>2. Simulate Delay (+35m)</span>
        </button>

        <button
          onClick={onRunTest3_SolveSchedule}
          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 text-blue-700 fill-current" />
          <span>3. Optimize Schedule</span>
        </button>

        <button
          onClick={onRunTest4_OpenStationMaster}
          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-700" />
          <span>4. Safety Signoff (T/351)</span>
        </button>
      </div>
    </div>
  );
};
export default JudgeScenarioBar;
