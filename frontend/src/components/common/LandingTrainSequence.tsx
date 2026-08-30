import React, { useState, useEffect } from 'react';
import { VandeBharatVectorTrain } from './VandeBharatVectorTrain';
import { ArrowRight, ShieldCheck, CheckCircle2, Server, Database, Cpu, Train, Clock, Lock, Sparkles } from 'lucide-react';

interface LandingTrainSequenceProps {
  onComplete: () => void;
}

export const LandingTrainSequence: React.FC<LandingTrainSequenceProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  const stages = [
    {
      id: 1,
      title: 'TMS / SMMS / TDMS Feed',
      desc: 'Ingesting Track, Signal & Traction defect logs from legacy edge gateway...',
      icon: Database,
    },
    {
      id: 2,
      title: 'CatBoost Hazard Model',
      desc: 'Evaluating Criticality Index (CI) & failure probabilities with SHAP attribution...',
      icon: Cpu,
    },
    {
      id: 3,
      title: 'Google OR-Tools CP-SAT',
      desc: 'Solving 2-Tier constraint formulation to bundle multi-dept shadow windows...',
      icon: Server,
    },
    {
      id: 4,
      title: 'COA Timetable Dispatch',
      desc: 'Synchronizing with Control Office Application with 0 min VIP train detention...',
      icon: Train,
    },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-GB') + ' ' +
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Smooth 2.2-second official boot sequence
    const duration = 2200;
    const intervalTime = 16;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 28) setCurrentStepIndex(0);
      else if (pct < 56) setCurrentStepIndex(1);
      else if (pct < 84) setCurrentStepIndex(2);
      else setCurrentStepIndex(3);

      if (elapsed >= duration) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#f4f6f9] z-[999] flex flex-col justify-between select-none font-sans overflow-y-auto">
      {/* Top Official Government Emblem Header Bar */}
      <header className="bg-[#15284f] text-white border-b border-[#0f1d38] px-6 py-2 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-white tracking-wide">
              MINISTRY OF RAILWAYS • GOVERNMENT OF INDIA
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-blue-200">Centre for Railway Information Systems (CRIS)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-blue-200">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#fb792b]" />
              <span>{currentTime || '30/08/2026 19:20:00 IST'}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <Lock className="w-3 h-3" />
              <span>SECURED HTTPS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Landing Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-3xl w-full bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Main Card Header - IRCTC Navy */}
          <div className="bg-[#213d77] text-white p-6 border-b border-[#15284f] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded bg-[#fb792b] text-white font-mono font-bold text-[10px] uppercase tracking-wider">
                  CRIS • RDSO
                </span>
                <span className="text-blue-200 text-xs font-mono">
                  Smart India Hackathon • Problem Statement 26027
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-black tracking-wide text-white">
                AUTOMATIC BLOCK PLANNING &amp; OPTIMIZATION SYSTEM
              </h1>
              <p className="text-xs text-blue-100">
                Control Office Application (COA) • Multi-Department Corridor Possession &amp; Headway Engine
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#15284f] border border-blue-400/30 text-xs font-mono font-bold text-white flex items-center space-x-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>G&amp;SR AUTHORIZED</span>
            </div>
          </div>

          {/* Interior Body */}
          <div className="p-6 bg-slate-50 space-y-5">
            {/* Daylight Train Runway Canvas */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
              {/* OHE Overhead Catenary Wire */}
              <div className="w-full h-[2px] bg-slate-400 mb-2 relative">
                <div
                  className="absolute -top-1 w-2.5 h-2.5 bg-[#fb792b] rounded-full shadow-xs"
                  style={{
                    left: `${Math.min(96, Math.max(2, progress))}%`,
                    transition: 'left 16ms linear',
                  }}
                ></div>
              </div>

              {/* Smooth Train Translation */}
              <div className="w-full relative h-[120px] overflow-hidden flex items-center">
                <div
                  className="absolute left-0 w-[720px] md:w-[860px] shrink-0"
                  style={{
                    transform: `translate3d(${(progress / 100) * 190 - 95}%, 0, 0)`,
                    transition: 'transform 16ms linear',
                    willChange: 'transform',
                  }}
                >
                  <VandeBharatVectorTrain
                    trainNumber="22435"
                    trainName="VANDE BHARAT EXPRESS"
                    speedRating="160 KM/H MPS | PRIORITY CLASS 1"
                    facingDirection="RIGHT"
                  />
                </div>
              </div>

              {/* Ground Steel Rails & Concrete Sleepers */}
              <div className="w-full h-3 relative flex items-center -mt-2 bg-slate-200 rounded-xs">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-slate-400"></div>
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-slate-400"></div>
                <div className="w-full flex justify-between px-2">
                  {Array.from({ length: 44 }).map((_, i) => (
                    <div key={i} className="w-1 h-3 bg-slate-400/80 rounded-xs"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Clean Rectangular Stage Boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {stages.map((st, idx) => {
                const isCurrent = currentStepIndex === idx;
                const isDone = currentStepIndex > idx;
                const IconComp = st.icon;

                return (
                  <div
                    key={st.id}
                    className={`p-3 rounded-xl border transition-all text-left space-y-1.5 ${
                      isCurrent
                        ? 'bg-white border-[#fb792b] shadow-xs ring-1 ring-[#fb792b]'
                        : isDone
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        STAGE 0{st.id}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <IconComp className={`w-4 h-4 ${isCurrent ? 'text-[#fb792b]' : 'text-slate-400'}`} />
                      )}
                    </div>
                    <div className={`font-bold text-xs leading-snug ${isCurrent ? 'text-[#213d77]' : 'text-slate-800'}`}>
                      {st.title}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Text & Progress Bar */}
            <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-800 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fb792b] animate-pulse"></span>
                  <span className="truncate max-w-[480px]">
                    {stages[currentStepIndex].desc}
                  </span>
                </div>
                <span className="text-[#213d77] font-black font-mono text-sm">
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Official IRCTC Saffron Orange Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#213d77] to-[#fb792b] rounded-full shadow-xs"
                  style={{
                    width: `${progress}%`,
                    transition: 'width 16ms linear',
                  }}
                ></div>
              </div>
            </div>

            {/* Bottom Action Section */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600 font-medium">
                Corridor: <strong className="text-slate-900 font-mono">MAS - AJJ (68.8 KM Quadruple Line)</strong>
              </div>

              <button
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-[#213d77] hover:bg-[#182c52] text-white text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer transition-colors"
              >
                <span>Enter Control Office Application (COA)</span>
                <ArrowRight className="w-4 h-4 text-[#fb792b]" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Official Government Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 shrink-0 text-center text-xs text-slate-500 font-mono">
        <p>
          © 2026 Centre for Railway Information Systems (CRIS) &amp; Research Designs and Standards Organisation (RDSO). All rights reserved.
        </p>
      </footer>
    </div>
  );
};
