import React, { useState, useEffect } from 'react';
import { Section } from '../../types/section';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Train, RefreshCw, Layers } from 'lucide-react';

interface VandeBharatHeroProps {
  selectedSection: Section | null;
  onExploreClick?: () => void;
}

export const VandeBharatHero: React.FC<VandeBharatHeroProps> = ({
  selectedSection,
  onExploreClick,
}) => {
  const sectionCode = selectedSection?.section_code || 'NDLS-GZB';
  const lengthKm = selectedSection?.length_km || 48.2;
  const lineType = selectedSection?.line_type || '4 UP/DN';

  // Animation states:
  // 1. 'LOADING': Train travels smoothly across the screen while data loads (3.6s)
  // 2. 'STATIC': Train stays stationary/parked on the track (exact match with reference video/image)
  const [animState, setAnimState] = useState<'LOADING' | 'STATIC'>('LOADING');
  const [loadPercent, setLoadPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Reading Timetables & Track Closures...');

  const startLoadingAnimation = () => {
    setAnimState('LOADING');
    setLoadPercent(15);
    setStatusText('Loading Live Timetable & Route Data...');

    setTimeout(() => {
      setLoadPercent(50);
      setStatusText(`Scanning Sector ${sectionCode} (${lengthKm} km)...`);
    }, 1200);

    setTimeout(() => {
      setLoadPercent(85);
      setStatusText('Bundling Track, Signal & Electric Maintenance...');
    }, 2400);

    setTimeout(() => {
      setLoadPercent(100);
      setStatusText('Schedule Optimized — 0 Train Delays');
      setAnimState('STATIC');
    }, 3600);
  };

  useEffect(() => {
    startLoadingAnimation();
  }, [selectedSection]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden space-y-6 select-none">
      {/* Top Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Headline */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Corridor Batching</span>
            </span>

            {animState === 'STATIC' && (
              <button
                onClick={startLoadingAnimation}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                title="Re-run animation and data sync"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-scan Route</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              One corridor.
            </h1>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              One block.
            </h1>
            <h1 className="text-3xl md:text-5xl font-black text-blue-600 tracking-tight leading-none">
              Planned by AI.
            </h1>
          </div>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-xl">
            Instead of stopping trains 3 separate times for Track, Signal, and Electric repairs, RailBlock bundles compatible work into a single unified window — saving hours of track stoppage with zero passenger delays.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onExploreClick}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Explore AI Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Priority Trains Protected</span>
            </div>
          </div>
        </div>

        {/* Right Sector Summary Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  SELECTED ROUTE
                </span>
                <span className="font-black text-base text-slate-900">
                  {sectionCode}
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                ● Live &amp; Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">TRACK SPAN</span>
                <span className="font-black text-sm text-slate-800">{lengthKm} km</span>
                <span className="text-[10px] text-slate-500 block">{lineType} Lines</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">DAILY TRAFFIC</span>
                <span className="font-black text-sm text-blue-600">213 Trains</span>
                <span className="text-[10px] text-slate-500 block">Scheduled Today</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">PENDING REPAIRS</span>
                <span className="font-black text-sm text-slate-800">17 Tasks</span>
                <span className="text-[10px] text-slate-500 block">Track &amp; Signals</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">HOURS SAVED</span>
                <span className="font-black text-sm text-emerald-600">+3.0 hrs</span>
                <span className="text-[10px] text-slate-500 block">55% Downtime Cut</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Vande Bharat Train on Track Rails */}
      <div className="relative pt-4 border-t border-slate-100">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <div className="flex items-center space-x-2 font-medium">
            <Train className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">Train #22436 Vande Bharat Express</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">{statusText}</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {animState === 'LOADING' ? (
              <span className="text-blue-600 font-bold font-mono">{loadPercent}% Loaded</span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready &amp; Synced</span>
              </span>
            )}
          </div>
        </div>

        {/* Track Canvas */}
        <div className="relative h-14 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-end p-2">
          {/* Top OHE Wire */}
          <div className="absolute top-1.5 left-0 right-0 h-[1px] bg-slate-300"></div>

          {/* Ground Track Rails */}
          <div className="absolute bottom-2.5 left-0 right-0 h-[2px] bg-slate-400"></div>
          <div className="absolute bottom-0.5 left-0 right-0 h-[3px] bg-slate-500"></div>

          {/* Sleepers */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2.5 opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #475569 0, #475569 4px, transparent 0, transparent 22px)',
            }}
          ></div>

          {/* Train Rake: Moves during loading, then stays STATICALLY parked on track */}
          <div
            className={`absolute bottom-2.5 flex items-end ${
              animState === 'LOADING'
                ? 'animate-train-smooth-load'
                : 'left-1/2 -translate-x-1/2'
            }`}
          >
            <svg
              viewBox="0 0 520 60"
              className="w-[420px] h-[48px] overflow-visible drop-shadow-sm"
            >
              {/* Pantograph */}
              <path d="M 380 18 L 370 4 L 355 4 L 365 18" stroke="#475569" strokeWidth="2" fill="none" />
              <line x1="345" y1="4" x2="375" y2="4" stroke="#0284c7" strokeWidth="2.5" />

              {/* Train Body (Forward nose on the right ->) */}
              <path
                d="M 15 48 L 10 38 Q 20 18, 50 18 L 440 18 Q 480 18, 508 38 L 500 48 Z"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />

              {/* Front Nose Blue Stripe */}
              <path
                d="M 435 18 Q 480 18, 508 38 L 445 38 Z"
                fill="#0284C7"
              />

              {/* Windshield */}
              <path
                d="M 458 22 Q 476 22, 488 30 Q 474 32, 458 32 Z"
                fill="#0F172A"
              />

              {/* Headlight */}
              <circle cx="504" cy="38" r="2.5" fill="#38BDF8" />

              {/* Blue Livery Ribbon */}
              <rect x="25" y="24" width="415" height="10" fill="#0284C7" rx="2" />

              {/* Windows */}
              {[40, 75, 110, 145, 180, 215, 250, 285, 320, 355, 390, 420].map((wx, i) => (
                <rect key={i} x={wx} y="26" width="22" height="6" fill="#0F172A" rx="1.5" />
              ))}

              {/* Navy Accent Skirt */}
              <rect x="20" y="42" width="470" height="5" fill="#1E3A8A" rx="1" />

              {/* Bogie Wheels */}
              {[50, 80, 190, 220, 330, 360, 450, 480].map((wheelX, wi) => (
                <g key={wi}>
                  <circle cx={wheelX} cy="49" r="5" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
                  <circle cx={wheelX} cy="49" r="2" fill="#94A3B8" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
