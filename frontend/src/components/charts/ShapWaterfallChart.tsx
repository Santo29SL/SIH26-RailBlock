import React from 'react';
import { Activity, TrendingUp, FileText } from 'lucide-react';

interface ShapWaterfallChartProps {
  shapExplanation?: any;
  criticalityIndex?: number;
  failureProbability?: number;
  baseValue?: number;
  shapValues?: Record<string, number>;
  finalProb?: number;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  shapExplanation,
  criticalityIndex = 88,
  failureProbability,
  baseValue = 0.082,
  shapValues,
  finalProb,
}) => {
  const base = shapExplanation?.base_value !== undefined ? shapExplanation.base_value : baseValue;
  const prob = failureProbability !== undefined ? failureProbability : finalProb !== undefined ? finalProb : 0.88;
  const rawAttributions = shapExplanation?.feature_attributions || shapValues || {
    'Ultrasonic Rail Crack Severity': 0.24,
    'Track Roughness / Geometry Deviation': 0.15,
    'Speed Restriction Drop (Caution Speed)': 0.14,
    'Maintenance Overdue Days': 0.12,
    'Train Traffic Density': 0.05,
  };

  const attributions = Object.entries(rawAttributions).map(([key, val]) => ({
    name: key.replace(/_/g, ' '),
    value: Number(val),
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs select-none space-y-4 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Contributing Defect Factors (Risk Breakdown)</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                FACTOR ANALYSIS
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Shows how much each track condition contributes to the calculated breakdown risk
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Urgency Score</span>
          <span className="text-xl font-black text-rose-600">{criticalityIndex.toFixed(0)} / 100</span>
        </div>
      </div>

      {/* Probability Equation Bar */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">Baseline Track Risk</span>
          <span className="font-bold text-blue-700">{(base * 100).toFixed(1)}%</span>
        </div>
        <span className="text-slate-400 font-bold">+</span>
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">Track Defects Added</span>
          <span className="font-bold text-amber-700">
            +{Math.max(0, (prob - base) * 100).toFixed(1)}%
          </span>
        </div>
        <span className="text-slate-400 font-bold">=</span>
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">Total Failure Risk</span>
          <span className="font-black text-rose-600 text-sm">{(prob * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Attributions Bar Chart */}
      <div className="space-y-3 pt-2">
        {attributions.map((attr, idx) => {
          const isPositive = attr.value >= 0;
          const percentage = Math.abs(attr.value * 100);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 capitalize">{attr.name}</span>
                <span
                  className={`font-mono font-bold ${
                    isPositive ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {isPositive ? `+${percentage.toFixed(1)}% risk` : `-${percentage.toFixed(1)}% risk`}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPositive ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, percentage * 2.5)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ShapWaterfallChart;
