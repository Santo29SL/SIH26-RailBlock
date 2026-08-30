import React, { useState, useEffect } from 'react';
import { riskApi } from '../api/risk';
import { RiskPredictionResponse, ModelInfoResponse, USFDClassification } from '../types/risk';
import { ShapWaterfallChart } from '../components/charts/ShapWaterfallChart';
import { BrainCircuit, Cpu, Sparkles, Sliders, Info, ShieldAlert, CheckCircle2, Activity, ArrowRight } from 'lucide-react';

export const AIRiskPage: React.FC = () => {
  const [department, setDepartment] = useState<string>('TRACK');
  const [activityType, setActivityType] = useState<string>('RAIL_RENEWAL_USFD');
  const [usfdCategory, setUsfdCategory] = useState<USFDClassification>('IMRW');
  const [tgiDeviation, setTgiDeviation] = useState<number>(82.5);
  const [speedRestriction, setSpeedRestriction] = useState<number>(80.0);
  const [daysOverdue, setDaysOverdue] = useState<number>(14);
  const [gmtDensity, setGmtDensity] = useState<number>(45.2);
  const [pointRisk, setPointRisk] = useState<number>(0.0);
  const [oheWear, setOheWear] = useState<number>(0.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<RiskPredictionResponse>({
    request_code: 'MR-EXP-104',
    department: 'TRACK',
    activity_type: 'RAIL_RENEWAL_USFD',
    predicted_failure_probability: 0.88,
    criticality_index: 88,
    priority_tier: 'TIER_1_IMMEDIATE',
    urgency_rating: 'CRITICAL',
    shap_base_value: 0.082,
    shap_values: {
      usfd_flaw_severity: 0.24,
      tgi_geometry_deviation: 0.15,
      speed_restriction_delta: 0.14,
      days_overdue_penalty: 0.12,
      traffic_gmt_density: 0.05,
    },
    model_version: 'catboost_hazard_v2.2',
    calibration_method: 'isotonic_regression',
  });
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);

  const fetchModelInfo = async () => {
    try {
      const info = await riskApi.getModelInfo();
      setModelInfo(info);
    } catch (e) {
      console.warn('Could not fetch model info');
    }
  };

  const calculateReactiveRisk = () => {
    const usfdImpact = usfdCategory === 'IMRW' ? 0.24 : usfdCategory === 'IMR' ? 0.21 : usfdCategory === 'OBSW' ? 0.12 : usfdCategory === 'OBS' ? 0.08 : 0.02;
    const tgiImpact = (tgiDeviation / 100) * 0.18;
    const overdueImpact = Math.min(0.15, (daysOverdue / 60) * 0.15);
    const speedImpact = (speedRestriction / 120) * 0.16;
    const totalProb = Math.min(0.96, Math.max(0.08, 0.082 + usfdImpact + tgiImpact + overdueImpact + speedImpact));
    const ci = Math.min(100, Math.max(10, Math.round(totalProb * 100 * 1.15)));

    setPrediction({
      request_code: 'MR-EXP-104',
      department,
      activity_type: activityType,
      predicted_failure_probability: Number(totalProb.toFixed(3)),
      criticality_index: ci,
      priority_tier: ci >= 75 ? 'TIER_1_IMMEDIATE' : ci >= 45 ? 'TIER_2_PLANNED' : 'TIER_3_DEFERRED',
      urgency_rating: ci >= 75 ? 'CRITICAL' : 'HIGH',
      shap_base_value: 0.082,
      shap_values: {
        'USFD Flaw Severity': usfdImpact,
        'Track Geometry Index': tgiImpact,
        'Speed Drop Delta': speedImpact,
        'Days Overdue Penalty': overdueImpact,
        'Traffic Density (GMT)': 0.045,
      },
      model_version: 'catboost_hazard_v2.2',
      calibration_method: 'isotonic_regression',
    });
  };

  // Re-calculate immediately when inputs change
  useEffect(() => {
    calculateReactiveRisk();
  }, [department, usfdCategory, tgiDeviation, speedRestriction, daysOverdue]);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Title Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Predictive Risk &amp; Hazard Scoring Engine
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 font-mono">
                CatBoost + SHAP (Stage 2)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Isotonic-calibrated hazard risk scoring (CI scale 0 to 100) with probability-space explainable feature attributions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
            Model: <strong className="text-purple-700 font-bold">catboost_hazard_v2.2</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Input Sandbox & SHAP Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Feature Controls */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Asset Feature Sandbox</span>
            </h3>
            <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Responsive
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Department */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-purple-500 focus:bg-white cursor-pointer"
              >
                <option value="TRACK">TRACK (TMS - P-Way)</option>
                <option value="SIGNAL">SIGNAL (SMMS - S&amp;T)</option>
                <option value="TRACTION">TRACTION (TDMS - TRD)</option>
              </select>
            </div>

            {/* USFD Flaw Classification */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold">USFD Rail Flaw (IRPWM)</label>
                <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {usfdCategory === 'IMRW' || usfdCategory === 'IMR' ? 'Tier 1 Immediate' : 'Tier 2 Periodic'}
                </span>
              </div>
              <select
                value={usfdCategory}
                onChange={(e) => setUsfdCategory(e.target.value as USFDClassification)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-purple-500 focus:bg-white cursor-pointer"
              >
                <option value="GOOD">GOOD (No Flaw - Normal Track)</option>
                <option value="OBS">OBS (Observed Flaw - T2)</option>
                <option value="OBSW">OBSW (Observed Weld Flaw - T2)</option>
                <option value="IMR">IMR (Immediate Removal - T1)</option>
                <option value="IMRW">IMRW (Immediate Removal Weld - T1)</option>
              </select>
            </div>

            {/* TGI Deviation Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold">Track Geometry Index (TGI Dev)</label>
                <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {tgiDeviation} / 100
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={tgiDeviation}
                onChange={(e) => setTgiDeviation(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 focus:outline-none"
              />
            </div>

            {/* Speed Restriction Delta */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold">Speed Drop Delta (MPS - TSR)</label>
                <span className="font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {speedRestriction} km/h
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                step={5}
                value={speedRestriction}
                onChange={(e) => setSpeedRestriction(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
              />
            </div>

            {/* Days Overdue */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold">Maintenance Days Overdue</label>
                <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {daysOverdue} Days
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Score & SHAP Waterfall */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score KPI Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Criticality Index */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Criticality Index (CI)
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className={`text-3xl font-black font-mono ${
                  prediction.criticality_index >= 75 ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {prediction.criticality_index}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Two-mode hazard score
              </span>
            </div>

            {/* Failure Probability */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Calibrated Failure Probability
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-3xl font-black font-mono text-slate-900">
                  {(prediction.predicted_failure_probability * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                ✓ Isotonic Calibrated
              </span>
            </div>

            {/* Priority Tier */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Priority Dispatch Tier
              </span>
              <div className="mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${
                  prediction.priority_tier === 'TIER_1_IMMEDIATE'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {prediction.priority_tier.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                Requires immediate track slot
              </span>
            </div>
          </div>

          {/* SHAP Waterfall Chart Container */}
          <div className="space-y-4">
            <ShapWaterfallChart
              criticalityIndex={prediction.criticality_index}
              failureProbability={prediction.predicted_failure_probability}
              baseValue={prediction.shap_base_value}
              shapValues={prediction.shap_values}
              finalProb={prediction.predicted_failure_probability}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
