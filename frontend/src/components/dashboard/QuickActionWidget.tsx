import React from 'react';
import { Cpu, SlidersHorizontal, Radio, Database, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface QuickActionWidgetProps {
  onRunOptimizer: () => void;
  onOpenSimulator: () => void;
  onSimulateDelay: () => void;
  onOpenIngestion: () => void;
  isOptimizing?: boolean;
}

export const QuickActionWidget: React.FC<QuickActionWidgetProps> = ({
  onRunOptimizer,
  onOpenSimulator,
  onSimulateDelay,
  onOpenIngestion,
  isOptimizing = false,
}) => {
  const { user } = useAuth();
  const canRunOptimizer = user?.role === 'ADMIN' || user?.role === 'SECTION_CONTROLLER';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mission-Critical Fast Actions</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">1-Click Dispatch</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Run Optimizer */}
        <button
          onClick={onRunOptimizer}
          disabled={!canRunOptimizer || isOptimizing}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
            canRunOptimizer
              ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800 shadow-xs cursor-pointer'
              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Cpu className={`w-4 h-4 ${canRunOptimizer ? 'text-blue-600' : 'text-slate-400'}`} />
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <span className="font-bold text-xs block text-slate-900">
            {isOptimizing ? 'Solving CP-SAT...' : 'Run CP-SAT Solver'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">Stage 5 Optimization</span>
        </button>

        {/* What-If Sandbox */}
        <button
          onClick={onOpenSimulator}
          className="p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-left transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <span className="font-bold text-xs block text-slate-900">What-If Sandbox</span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">HMAC Commit Tokens</span>
        </button>

        {/* Live Disruption Test */}
        <button
          onClick={onSimulateDelay}
          className="p-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-left transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <span className="font-bold text-xs block text-slate-900">Inject Delay (+25m)</span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">Stage 6 Telemetry Test</span>
        </button>

        {/* Legacy Ingestion */}
        <button
          onClick={onOpenIngestion}
          className="p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-left transition-all shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <Database className="w-4 h-4 text-amber-600" />
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <span className="font-bold text-xs block text-slate-900">Ingest Legacy Defect</span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">TMS / SMMS / TDMS</span>
        </button>
      </div>
    </div>
  );
};
