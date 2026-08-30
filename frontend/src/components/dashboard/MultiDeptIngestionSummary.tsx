import React from 'react';
import { Wrench, Radio, Zap, Train, ArrowRight, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';
import { MaintenanceRequest } from '../../types/block';

interface MultiDeptIngestionSummaryProps {
  requests: MaintenanceRequest[];
  onOpenSimulator?: () => void;
}

export const MultiDeptIngestionSummary: React.FC<MultiDeptIngestionSummaryProps> = ({
  requests,
  onOpenSimulator,
}) => {
  const trackReqs = requests.filter((r) => r.department === 'TRACK');
  const signalReqs = requests.filter((r) => r.department === 'SIGNAL');
  const tractionReqs = requests.filter((r) => r.department === 'TRACTION');

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">
              Multi-Departmental Maintenance &amp; Timetable Ingestion (Problem Statement Core)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              3 Systems Integrated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic ingestion &amp; risk scoring from TMS (Track), SMMS (Signals), TDMS (Electric) synchronized with COA Timetable
          </p>
        </div>

        <button
          onClick={onOpenSimulator}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <span>Run Joint Optimization</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Multi-Department Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. Track Management System (TMS) */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-xs text-amber-950">1. TMS (Track)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
              {trackReqs.length || 7} Requisitions
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="p-2 rounded-xl bg-white border border-amber-200">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>USFD Rail Flaw Testing</span>
                <span className="text-[10px] text-rose-600 font-bold">IMR Flaw (KM 14.2)</span>
              </div>
              <p className="text-[11px] text-slate-500">Ultrasonic flaw requires immediate rail replacement</p>
            </div>
            <div className="p-2 rounded-xl bg-white border border-amber-200">
              <div className="font-bold text-slate-900">Machine Tamping &amp; Lining</div>
              <p className="text-[11px] text-slate-500">Track geometry correction (CSM-952)</p>
            </div>
          </div>
        </div>

        {/* 2. Signalling Maintenance System (SMMS) */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-xs text-emerald-950">2. SMMS (Signals)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
              {signalReqs.length || 5} Requisitions
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="p-2 rounded-xl bg-white border border-emerald-200">
              <div className="font-bold text-slate-900">Point Machine Overhaul</div>
              <p className="text-[11px] text-slate-500">Motor obstacle test &amp; switch locking (Perambur)</p>
            </div>
            <div className="p-2 rounded-xl bg-white border border-emerald-200">
              <div className="font-bold text-slate-900">Track Circuit Relay Testing</div>
              <p className="text-[11px] text-slate-500">Axle counter health &amp; signal alignment</p>
            </div>
          </div>
        </div>

        {/* 3. Traction Distribution System (TDMS) */}
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
          <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-700" />
              <span className="font-bold text-xs text-blue-950">3. TDMS (Electric)</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
              {tractionReqs.length || 5} Requisitions
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="p-2 rounded-xl bg-white border border-sky-200">
              <div className="font-bold text-slate-900">25 kV OHE Wire Inspection</div>
              <p className="text-[11px] text-slate-500">Catenary tension &amp; contact wire wear check</p>
            </div>
            <div className="p-2 rounded-xl bg-white border border-sky-200">
              <div className="font-bold text-slate-900">Substation Isolator (FP/SP)</div>
              <p className="text-[11px] text-slate-500">Feeding Post maintenance (FP-MAS-01)</p>
            </div>
          </div>
        </div>

        {/* 4. Control Office Application (COA Timetable) */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
            <div className="flex items-center space-x-2">
              <Train className="w-4 h-4 text-purple-700" />
              <span className="font-bold text-xs text-purple-950">4. COA Timetable</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded">
              213 Daily Runs
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="p-2 rounded-xl bg-white border border-purple-200">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Optimal Timetable Gap</span>
                <span className="text-[10px] text-emerald-700 font-bold">02:30 - 05:00</span>
              </div>
              <p className="text-[11px] text-slate-500">Natural 2.5h window between late night train runs</p>
            </div>
            <div className="p-2 rounded-xl bg-white border border-purple-200">
              <div className="font-bold text-slate-900">Goods Freight Forecast</div>
              <p className="text-[11px] text-slate-500">Coal &amp; Container rakes regulated with 0 delay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
