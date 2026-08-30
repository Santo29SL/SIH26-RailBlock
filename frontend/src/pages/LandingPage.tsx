import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Zap,
  Radio,
  Train,
  Layers,
  ChevronRight,
  Activity,
  FileCheck2,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface LandingPageProps {
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenDashboard }) => {
  // Live Example Interactive Mode: 'old' vs 'ai'
  const [demoMode, setDemoMode] = useState<'ai' | 'old'>('ai');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] font-sans selection:bg-blue-600 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-wider">
              RB
            </div>
            <div>
              <span className="font-bold text-base tracking-wider text-white block leading-none">
                RAILBLOCK COA
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Indian Railways · SIH 2026 (PS 26027)
              </span>
            </div>
          </div>

          {/* Plain English Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('the-problem')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              The Operational Problem
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              System Pipeline
            </button>
            <button
              onClick={() => scrollToSection('the-solution')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Optimization Results
            </button>
            <button
              onClick={() => scrollToSection('live-example')}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Interactive Comparison
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={onOpenDashboard}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span>Open Control Office</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-blue-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Corridor Maintenance Block Optimization System</span>
            </div>
          </div>

          {/* Main Hero Typography */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Train timetables and track maintenance,{' '}
              <span className="text-blue-400">synchronized mathematically.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              RailBlock combines maintenance requests from Track, Signal, and Electrical departments into single, safe time windows between running trains — with zero passenger delays.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenDashboard}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Open Control Overview →</span>
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-medium transition-all cursor-pointer"
            >
              View System Architecture
            </button>
          </div>

          {/* 3 Impact Stat Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Track Downtime Saved
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
                -55% Stoppage
              </div>
              <span className="text-xs text-slate-500 block">
                Cut from 5.5h to 2.5h
              </span>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                VIP Passenger Trains
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">
                0 Min Delay
              </div>
              <span className="text-xs text-slate-500 block">
                Rajdhani &amp; Vande Bharat
              </span>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Safety Guarantee
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-200 font-mono">
                100% G&amp;SR Rules
              </div>
              <span className="text-xs text-slate-500 block">
                Form T/351 Disconnection Notice
              </span>
            </div>
          </div>

          {/* Corridor Showcase */}
          <div className="max-w-4xl mx-auto pt-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Train className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white">Route: New Delhi ➔ Ghaziabad (46.2 km)</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">Quadruple Line High-Density Corridor</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
                  ● Live Timetable Synced
                </span>
              </div>

              {/* Vector Track Visual */}
              <div className="relative h-12 bg-[#0a0f1e] rounded-lg border border-slate-800 overflow-hidden flex flex-col justify-end p-2">
                <div className="absolute top-2 left-0 right-0 h-[1px] bg-slate-800" />
                <div className="absolute bottom-3 left-0 right-0 h-[2px] bg-slate-700" />
                <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-slate-700" />

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded text-xs font-mono text-blue-300">
                    <span>🚆 Vande Bharat Express #22436</span>
                    <span className="text-emerald-400 text-[11px]">· Passed (On-Time)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION 1: THE PROBLEM
      ───────────────────────────────────────────────────────────── */}
      <section id="the-problem" className="py-16 border-b border-slate-800 bg-[#0c1322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
              The Real-World Railway Challenge
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Why do passenger trains get delayed for repairs?
            </h2>
            <p className="text-sm text-slate-400">
              Indian Railways tracks require daily safety maintenance, but 3 separate engineering departments operate in disconnected silos.
            </p>
          </div>

          {/* 3 Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">1. Track Department (Rails)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Repairs worn-out rails, ultrasonic cracks, and replaces concrete sleepers. Requests a 2.5-hour track closure.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">2. Signal Department (Switches)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Services track switchers (point machines), signals, and track circuits. Requests a separate 1.5-hour closure.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">3. Electrical Department (Wires)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspects high-voltage 25kV overhead wires (OHE) and tensioners. Requests another 1.5-hour track closure.
              </p>
            </div>
          </div>

          {/* Stoppage Box */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-900/30 pb-2">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>The Traditional Problem: 3 Disconnected Closures</span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-800/50">
                5.5 Hours Total Stoppage
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Without synchronized scheduling, each department closes the track at different times of day (09:00, 13:00, and 16:00). <strong>Passenger trains are halted 3 separate times.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. SECTION 2: HOW IT WORKS
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              System Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              How RailBlock Optimizes Corridor Blocks
            </h2>
            <p className="text-sm text-slate-400">
              Mathematical constraint programming replaces manual phone calls and paperwork.
            </p>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <span className="text-xs font-mono font-bold text-blue-400 block">STEP 01</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Ingest Defect Data</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects directly to track ultrasound sensors, switch logs, and wire telemetry.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <span className="text-xs font-mono font-bold text-blue-400 block">STEP 02</span>
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Risk Scoring (0-100)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates defect urgency so urgent track flaws receive priority scheduling.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <span className="text-xs font-mono font-bold text-amber-400 block">STEP 03</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Find Timetable Gaps</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scans passenger and freight schedules to locate natural idle gaps between trains.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400 block">STEP 04</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Bundle Joint Window</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                OR-Tools solver places all 3 repairs into one shared 2.5h slot, saving 55% downtime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION 3: LIVE INTERACTIVE EXAMPLE
      ───────────────────────────────────────────────────────────── */}
      <section id="live-example" className="py-16 border-b border-slate-800 bg-[#0c1322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              Interactive Comparison
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              See the Difference in Action
            </h2>
            <p className="text-sm text-slate-400">
              Toggle between the traditional separate closures and RailBlock's unified schedule.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex justify-center">
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-medium">
              <button
                onClick={() => setDemoMode('old')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  demoMode === 'old'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Traditional Separate Closures</span>
              </button>
              <button
                onClick={() => setDemoMode('ai')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  demoMode === 'ai'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>RailBlock Bundled Schedule</span>
              </button>
            </div>
          </div>

          {/* Demonstration Canvas */}
          <div className="max-w-4xl mx-auto bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            {demoMode === 'old' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-rose-400 block">
                      TRADITIONAL UNCOORDINATED SCHEDULE
                    </span>
                    <span className="text-xs text-slate-400">
                      3 separate closures across the working day
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-3 py-1 rounded border border-rose-800/60">
                    Total Downtime: 5.5 Hours
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-slate-900 border border-rose-900/40 rounded flex items-center justify-between">
                    <span className="text-slate-300">09:00 - 11:30 · Track Department (Rail Replacement)</span>
                    <span className="text-rose-400 font-bold">2.5 hrs</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-amber-900/40 rounded flex items-center justify-between">
                    <span className="text-slate-300">13:00 - 14:30 · Signal Department (Switch Testing)</span>
                    <span className="text-amber-400 font-bold">1.5 hrs</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-blue-900/40 rounded flex items-center justify-between">
                    <span className="text-slate-300">16:00 - 17:30 · Electrical Department (Wire Repair)</span>
                    <span className="text-blue-400 font-bold">1.5 hrs</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Result: 4 passenger trains delayed by +35 to +60 minutes due to multiple midday stoppages.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-blue-400 block">
                      RAILBLOCK SYNCHRONIZED JOINT WINDOW
                    </span>
                    <span className="text-xs text-slate-400">
                      All 3 repairs bundled into 1 natural timetable gap
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800/60">
                    Total Downtime: 2.5 Hours (55% Saved)
                  </span>
                </div>

                <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>🚆 Unified Maintenance Window (02:30 - 05:00 IST)</span>
                    <span className="text-emerald-400 font-mono">+3.0 Hours Saved</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      Track: Rail Flaw (2.5h)
                    </div>
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      Signal: Points (1.5h)
                    </div>
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
                      Traction: OHE (1.5h)
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Result: 0 passenger train delays. Rajdhani &amp; Vande Bharat run without interruptions.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. BOTTOM CTA SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-14 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to explore the live control office?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Open the live dashboard to view the interactive space-time Gantt, GIS track defect map, and what-if simulation sandbox.
          </p>
          <div>
            <button
              onClick={onOpenDashboard}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm inline-flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Open Control Office →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>
            RailBlock Control Office Application (COA) · Center for Railway Information Systems (CRIS) · Smart India Hackathon 2026
          </p>
          <p className="text-slate-600 text-[11px]">
            Problem Statement 26027: Multi-Department Maintenance Corridor Block Planning &amp; Scheduling
          </p>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
