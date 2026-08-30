import React from 'react';
import { Activity, TrendingUp, Info } from 'lucide-react';

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
    'USFD Flaw Severity (IMR)': 0.24,
    'Track Geometry Index (TGI)': 0.15,
    'Speed Drop Delta (MPS-TSR)': 0.14,
    'Days Overdue Penalty': 0.12,
    'Traffic Density (GMT)': 0.05,
  };

  const attributions = Object.entries(rawAttributions).map(([key, val]) => ({
    name: key.replace(/_/g, ' '),
    value: Number(val),
  }));

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs select-none space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-sans">
              <span>Probability-Space SHAP Additive Feature Attributions</span>
              <span className="text-[10px] px-2 py-0.2 rounded bg-purple-50 text-purple-700 font-mono font-bold border border-purple-200">
                XAI Feature Importance
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">Additive contributions in probability space: Base + Σ φᵢ ≈ P(failure)</p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] text-slate-400 block uppercase font-sans">Criticality Score</span>
          <span className="text-xl font-black text-rose-600">{criticalityIndex.toFixed(1)} / 100</span>
        </div>
      </div>

      {/* Probability Equation Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">Prior Base Rate (E[f(x)])</span>
          <span className="font-bold text-blue-600">{(base * 100).toFixed(1)}%</span>
        </div>
        <span className="text-slate-400 font-bold">+</span>
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">Sum of Feature Shifts (Σ φᵢ)</span>
          <span className="font-bold text-amber-600">
            +{Math.max(0, (prob - base) * 100).toFixed(1)}%
          </span>
        </div>
        <span className="text-slate-400 font-bold">=</span>
        <div>
          <span className="text-slate-500 text-[10px] block font-sans">Predicted Failure Hazard</span>
          <span className="font-black text-rose-600 text-sm">{(prob * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Attributions Bar Chart */}
      <div className="space-y-3 pt-2">
        {attributions.map((attr, idx) => {
          const isPositive = attr.value >= 0;
          const percentage = Math.abs(attr.value * 100);

          return (
            <div key={idx} className="space-y-1 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 capitalize">{attr.name}</span>
                <span
                  className={`font-mono font-bold ${
                    isPositive ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isPositive ? `+${percentage.toFixed(1)}%` : `-${percentage.toFixed(1)}%`}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive
                      ? 'bg-gradient-to-r from-rose-500 to-red-600'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-500'
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
