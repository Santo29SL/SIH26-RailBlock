import React from 'react';
import { Gauge, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface TSRRecoveryChartProps {
  initialTsrSpeed?: number;
  mpsSpeed?: number;
}

export const TSRRecoveryChart: React.FC<TSRRecoveryChartProps> = ({
  initialTsrSpeed = 20,
  mpsSpeed = 110,
}) => {
  // Statutory Indian Railways IRPWM Track Relaxation Stages
  const stages = [
    { day: 'Day 1 (Post-Work)', speed: 20, description: 'Initial Pilot Speed Restriction (Heavy Tamping / Deep Screening)', color: '#EF4444' },
    { day: 'Day 2-3 (Passage 1)', speed: 45, description: 'Relaxation after 50,000 Gross Tonnes traffic consolidation', color: '#F97316' },
    { day: 'Day 4-6 (Passage 2)', speed: 75, description: 'Intermediate relaxation following track stabilization & DTS pass', color: '#EAB308' },
    { day: 'Day 7+ (Normal)', speed: 110, description: 'Full Maximum Permissible Speed (MPS) restored. Caution Order cancelled.', color: '#10B981' },
  ];

  return (
    <div className="bg-railway-card border border-railway-border rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Post-Block TSR Speed Recovery Curve Visualizer</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                IRPWM Chapter 5
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Statutory track stabilization & velocity relaxation trajectory</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">MPS Target:</span>
          <span className="font-black text-emerald-400 text-sm">{mpsSpeed} km/h</span>
        </div>
      </div>

      {/* SVG Trajectory Chart */}
      <div className="p-4 rounded-xl bg-railway-surface border border-railway-border relative">
        <svg viewBox="0 0 600 200" className="w-full h-44 overflow-visible">
          {/* Grid lines */}
          <line x1="50" y1="20" x2="570" y2="20" stroke="#243248" strokeDasharray="3,3" />
          <line x1="50" y1="70" x2="570" y2="70" stroke="#243248" strokeDasharray="3,3" />
          <line x1="50" y1="120" x2="570" y2="120" stroke="#243248" strokeDasharray="3,3" />
          <line x1="50" y1="170" x2="570" y2="170" stroke="#334460" strokeWidth="1.5" />

          {/* Y Axis Labels */}
          <text x="40" y="24" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="end">110</text>
          <text x="40" y="74" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="end">75</text>
          <text x="40" y="124" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="end">45</text>
          <text x="40" y="160" fill="#94A3B8" fontSize="10" fontFamily="monospace" textAnchor="end">20</text>

          {/* Curve Area Fill */}
          <path
            d="M 80 160 Q 200 120, 260 120 T 420 70 T 540 20 L 540 170 L 80 170 Z"
            fill="url(#tsrGradient)"
            opacity="0.2"
          />

          {/* Curve Line */}
          <path
            d="M 80 160 Q 200 120, 260 120 T 420 70 T 540 20"
            fill="none"
            stroke="#0284C7"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="tsrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>
          </defs>

          {/* Stage Points */}
          <circle cx="80" cy="160" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="260" cy="120" r="6" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="420" cy="70" r="6" fill="#EAB308" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="540" cy="20" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />

          {/* Value Tags */}
          <text x="80" y="148" fill="#FCA5A5" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">20 km/h</text>
          <text x="260" y="108" fill="#FDBA74" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">45 km/h</text>
          <text x="420" y="58" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">75 km/h</text>
          <text x="540" y="10" fill="#86EFAC" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">110 km/h (MPS)</text>
        </svg>
      </div>

      {/* Trajectory Milestone Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {stages.map((st, i) => (
          <div key={i} className="p-3 rounded-xl bg-railway-surface border border-railway-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{st.day}</span>
              <span style={{ color: st.color }} className="font-mono font-black text-sm">
                {st.speed} km/h
              </span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2">{st.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
