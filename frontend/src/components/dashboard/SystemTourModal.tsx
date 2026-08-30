import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Wrench, ShieldCheck, Clock, Zap, MapPin, Layers, FileText } from 'lucide-react';

interface SystemTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemTourModal: React.FC<SystemTourModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  if (!isOpen) return null;

  const slides = [
    {
      stepNumber: 1,
      tag: 'THE REAL WORLD PROBLEM',
      title: 'Why Indian Railways Needs This System',
      description:
        'Three different railway departments maintain the tracks: Track Engineers (rails), Signal Engineers (points & circuits), and Traction Engineers (25 kV overhead wires).',
      highlight:
        'Currently, each department requests separate track closures at different times. This closes the railway line 3 times a day for 5.5 hours, delaying passenger trains and wasting track capacity.',
      badgeColor: 'bg-rose-500',
      icon: Wrench,
    },
    {
      stepNumber: 2,
      tag: 'WHAT THIS SYSTEM DOES (THE CORE SOLUTION)',
      title: 'Automated Multi-Department Joint Bundling',
      description:
        'RailBlock automatically takes defect lists from all 3 departments (TMS, SMMS, TDMS) and bundles them into 1 Single "Joint Shadow Block" during natural late-night gaps (02:30 — 05:00 IST).',
      highlight:
        'Result: Instead of closing the line 3 times for 5.5 hours, the track is closed only once for 2.5 hours. This saves +5.3 hours of track downtime (55% reduction) with ZERO delay to VIP trains!',
      badgeColor: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    {
      stepNumber: 3,
      tag: 'UNDERSTANDING THE SCREEN',
      title: 'How to Read the Control Office Dashboard',
      description:
        'The screen is organized into intuitive, logical workspaces:',
      points: [
        'Top 4 Metric Cards: Shows total possessions (20), hours saved (+5.3h), and zero VIP delay.',
        'Top Timeline (Dual Gantt): Row 1 shows passenger trains (Red = VIP). Row 2 shows the bundled repair windows.',
        'Left Half (GIS Map): Shows the 68.8 km corridor, stations (MAS to AJJ), and exact defect locations.',
        'Right Half (What-If Simulator): Lets you test moving repair windows to see if any trains get delayed.',
        'Bottom Table: Lists all pending repairs with failure risk scores (Criticality Index).',
      ],
      badgeColor: 'bg-blue-500',
      icon: Layers,
    },
    {
      stepNumber: 4,
      tag: 'STEP-BY-STEP 2-MINUTE DEMO',
      title: 'What to Click in Front of a Judge or User',
      description:
        'Follow this exact 4-step sequence using the top workflow bar:',
      points: [
        'Click Step 1: "Log Track Defect (TMS)" ➔ Watch the defect get scored (CI=88) and drop onto the map.',
        'Click Step 2: "Inject Train Delay (+35m)" ➔ Watch Train #12951 turn red and flag a conflict with the repair window.',
        'Click "Apply Automated Fast Reschedule" ➔ Watch the repair window shift forward, resolving the delay instantly.',
        'Click Step 4: "Station Master PN Grant" ➔ Enter Private Number (PN-4821) in Form T/351 to legally grant track possession.',
      ],
      badgeColor: 'bg-amber-500',
      icon: Zap,
    },
  ];

  const current = slides[currentSlide];
  const IconComp = current.icon;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 bg-[#002b49] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/20 uppercase">
                  {current.tag}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Slide {currentSlide + 1} of {slides.length}
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-sans mt-0.5">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 flex-1">
          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            {current.description}
          </p>

          {current.highlight && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans space-y-1">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
                Key Takeaway:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {current.highlight}
              </p>
            </div>
          )}

          {current.points && (
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {current.points.map((pt, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs font-sans">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    {idx + 1}
                  </div>
                  <span className="text-slate-800 leading-snug">{pt}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex space-x-1.5">
            {slides.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  currentSlide === idx ? 'w-8 bg-[#ea580c]' : 'w-2.5 bg-slate-300'
                }`}
              ></div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold font-sans hover:bg-slate-100 transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold font-sans transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <span>Next Slide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-sans transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Got It! Explore Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
