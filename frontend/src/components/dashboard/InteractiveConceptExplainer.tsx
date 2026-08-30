import React, { useState } from 'react';
import { Layers, Clock, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle, BookOpen } from 'lucide-react';

export const InteractiveConceptExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'comparison' | 'stages' | 'glossary'>('comparison');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-700 flex items-center justify-between text-xs font-semibold shadow-xs transition-all cursor-pointer font-sans"
      >
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-blue-700" />
          <span>New to RailBlock? View System Guide</span>
        </div>
        <span className="text-[11px] font-mono text-blue-700">Show Guide &darr;</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs space-y-3.5 select-none font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>How RailBlock Works</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                55% Downtime Cut
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Bundling 3 separate department maintenance closures into 1 single train gap
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeTab === 'comparison' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Old vs. RailBlock
            </button>
            <button
              onClick={() => setActiveTab('stages')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeTab === 'stages' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeTab === 'glossary' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Railway Terms
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Tab 1: Visual Comparison */}
      {activeTab === 'comparison' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* The Old Way */}
          <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>The Old Method (Separate Closures)</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-700">5.5 Hours Stopped</span>
            </div>
            <p className="text-xs text-slate-600">
              Each department closes the track separately at different hours, stopping passenger trains 3 separate times.
            </p>
            {/* Timeline bars */}
            <div className="space-y-1.5 text-xs font-mono pt-1">
              <div className="p-2 rounded bg-white border border-rose-200 text-rose-900 flex justify-between">
                <span>1. Track Machine Repair (TMS)</span>
                <span className="font-bold">2.5 hrs</span>
              </div>
              <div className="p-2 rounded bg-white border border-amber-200 text-amber-900 flex justify-between">
                <span>2. Signal Points Testing (S&amp;T)</span>
                <span className="font-bold">1.5 hrs</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200 text-slate-700 flex justify-between">
                <span>3. Electric Wire Inspection (TRD)</span>
                <span className="font-bold">1.5 hrs</span>
              </div>
            </div>
          </div>

          {/* The RailBlock Way */}
          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>The RailBlock Method (Joint Shared Window)</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">Only 2.5 Hours (55% Saved)</span>
            </div>
            <p className="text-xs text-slate-600">
              All 3 repairs happen concurrently during a single natural train gap — stopping track closures once.
            </p>
            {/* Unified Bar */}
            <div className="p-3 rounded-lg bg-white border border-emerald-300 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>🚆 Unified 2.5-Hour Maintenance Window</span>
                <span className="text-emerald-700 font-mono">+3.0h Saved</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-slate-600">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Track (Primary 2.5h)</span>
                <span>+</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Signal (Shadow 1.5h)</span>
                <span>+</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">Electric (Shadow 1.5h)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 4-Stage Pipeline */}
      {activeTab === 'stages' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-blue-700 font-bold block uppercase">1. Ingestion</span>
            <p className="text-slate-600">Reads defect reports from TMS, SMMS &amp; TDMS databases.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-purple-700 font-bold block uppercase">2. Risk Score</span>
            <p className="text-slate-600">Scores defect urgency (0-100) so safety-critical repairs go first.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-amber-700 font-bold block uppercase">3. Gap Finder</span>
            <p className="text-slate-600">Finds free time slots in the timetable without train traffic.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-emerald-700 font-bold block uppercase">4. Optimizer</span>
            <p className="text-slate-600">Schedules joint blocks with zero VIP train detention guarantee.</p>
          </div>
        </div>
      )}

      {/* Tab 3: Railway Glossary */}
      {activeTab === 'glossary' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-blue-700 block">USFD Flaw</span>
            <p className="text-slate-600">Ultrasonic rail flaw testing. IMR = Immediate rail replacement needed.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-rose-600 block">Form T/D 602</span>
            <p className="text-slate-600">Single Line Working: Emergency bidirectional trains when 1 line is closed.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-amber-700 block">Private Number (PN)</span>
            <p className="text-slate-600">Station Master legal code ensuring the track is disconnected safely.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-700 block">TSR Recovery</span>
            <p className="text-slate-600">Gradual speed recovery from 20 km/h pilot back to 110 km/h full speed.</p>
          </div>
        </div>
      )}
    </div>
  );
};
