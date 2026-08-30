import React, { useState, useEffect } from 'react';
import { VandeBharatVectorTrain } from './VandeBharatVectorTrain';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface LandingTrainSequenceProps {
  onComplete: () => void;
}

export const LandingTrainSequence: React.FC<LandingTrainSequenceProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const steps = [
    'Connecting to Read-Only Legacy Edge Gateway (TMS, SMMS, TDMS)...',
    'Ingesting Control Office Application (COA) Timetable & Freight Paths...',
    'Running Stage 2 Predictive Risk & Defect Criticality Analysis Engine...',
    'Executing Stage 5 Google OR-Tools CP-SAT Two-Tier Constraint Optimization...',
  ];

  useEffect(() => {
    // Smooth 1.8-second official boot sequence
    const duration = 1800;
    const intervalTime = 16; // ~60fps
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 28) setCurrentStepIndex(0);
      else if (pct < 58) setCurrentStepIndex(1);
      else if (pct < 85) setCurrentStepIndex(2);
      else setCurrentStepIndex(3);

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(onComplete, 250);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-[#0d233a] z-[100] flex flex-col items-center justify-center p-6 text-white select-none overflow-hidden transition-opacity duration-300 font-sans ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle IRCTC Saffron & Indian Railways Navy ambient tones */}
      <div className="absolute top-1/3 w-[500px] h-[500px] bg-[#fb792b]/10 rounded-full blur-3xl pointer-events-none transform -translate-y-1/2"></div>
      <div className="absolute bottom-1/3 w-[400px] h-[400px] bg-[#213d77]/20 rounded-full blur-3xl pointer-events-none transform translate-y-1/2"></div>

      <div className="max-w-3xl w-full space-y-6 relative z-10">
        {/* Header Official Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#fb792b]/20 border border-[#fb792b]/40 text-[#fb792b] font-mono text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INDIAN RAILWAYS • CRIS &amp; RDSO</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            Automatic Block Planning &amp; Optimization System
          </h2>
          <p className="text-xs text-slate-300 font-mono">
            Control Office Application (COA) • Multi-Department Corridor Possession Engine
          </p>
        </div>

        {/* Train Track Window */}
        <div className="bg-[#183153]/90 border border-slate-600/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Dashed OHE Overhead Wire */}
          <div className="w-full h-[2px] bg-slate-500/70 mb-2 relative">
            <div
              className="absolute -top-1 w-2.5 h-2.5 bg-[#fb792b] rounded-full shadow-md shadow-[#fb792b] blur-xs"
              style={{
                left: `${Math.min(96, Math.max(2, progress))}%`,
                transition: 'left 16ms linear',
              }}
            ></div>
          </div>

          {/* Smooth GPU Transform: Train Glides Forward Head-First */}
          <div className="w-full relative h-[125px] overflow-hidden flex items-center">
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

          {/* Ground Steel Rails with Sleepers */}
          <div className="w-full h-3 relative flex items-center -mt-2">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-slate-300 shadow-xs"></div>
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-slate-300 shadow-xs"></div>
            <div className="w-full flex justify-between px-2">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="w-1 h-3 bg-slate-500/80 rounded-xs"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Live Status Bar */}
        <div className="space-y-2.5 px-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-200 font-bold flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fb792b] animate-pulse"></span>
              <span className="truncate max-w-[480px]">{steps[currentStepIndex]}</span>
            </span>
            <span className="text-[#fb792b] font-black font-mono text-sm">{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar with IRCTC Saffron Orange */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
            <div
              className="h-full bg-gradient-to-r from-[#213d77] via-[#fb792b] to-[#138808] rounded-full shadow-xs"
              style={{
                width: `${progress}%`,
                transition: 'width 16ms linear',
              }}
            ></div>
          </div>
        </div>

        {/* Instant Skip Control */}
        <div className="text-center pt-1">
          <button
            onClick={() => {
              setIsFadingOut(true);
              setTimeout(onComplete, 100);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-mono cursor-pointer transition-colors border border-white/20"
          >
            <span>Skip to Control Office Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
