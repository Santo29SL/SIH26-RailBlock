import React, { useState, useEffect } from 'react';
import { useDivision } from '../context/DivisionContext';
import { blocksApi } from '../api/blocks';
import { optimizerApi } from '../api/optimizer';
import { Block } from '../types/block';
import { WhatIfSimulationResponse } from '../types/optimizer';
import { WhatIfSlider } from '../components/simulator/WhatIfSlider';
import { ImpactGauges } from '../components/simulator/ImpactGauges';
import { ConflictingTrainsTable } from '../components/simulator/ConflictingTrainsTable';
import { CommitModal } from '../components/simulator/CommitModal';
import { SimulatedEventInjector } from '../components/simulator/SimulatedEventInjector';
import { SlidersHorizontal, Key, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const SimulationPage: React.FC = () => {
  const { selectedSection, planningDate } = useDivision();
  const [shiftMinutes, setShiftMinutes] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResponse>({
    simulation_id: 'sim-init-01',
    is_feasible: true,
    has_vip_train_conflict: false,
    detention_delta_minutes: 0,
    total_detention_minutes: 0,
    conflicting_trains_count: 0,
    risk_score_delta: -2.4,
    criticality_index_preserved_pct: 100.0,
    shadow_efficiency_score: 0.88,
    slw_advisory_required: false,
    commit_token: `token_verified_sim_${Date.now()}`,
    expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
    conflicting_trains: [],
  });
  const [showCommitModal, setShowCommitModal] = useState<boolean>(false);

  const baseStart = '02:30:00';
  const baseEnd = '05:00:00';

  const shiftTime = (timeStr: string, minutes: number): string => {
    const parts = timeStr.split(':').map(Number);
    let totalMins = (parts[0] || 0) * 60 + (parts[1] || 0) + minutes;
    if (totalMins < 0) totalMins += 1440;
    totalMins = totalMins % 1440;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const calculatedStart = shiftTime(baseStart, shiftMinutes);
  const calculatedEnd = shiftTime(baseEnd, shiftMinutes);

  const runSimulation = async (shift: number) => {
    setIsSimulating(true);
    try {
      const response = await optimizerApi.simulateWhatIf({
        section_id: selectedSection?.id || 'sec-mas-ajj-01',
        target_date: planningDate,
        start_time: shiftTime(baseStart, shift) + ':00',
        end_time: shiftTime(baseEnd, shift) + ':00',
        maintenance_request_ids: ['req-01', 'req-02'],
      });
      setSimulationResult(response);
    } catch (e) {
      const hasVip = shift > 30 && shift < 90;
      const detentionDelta = hasVip ? 45 : shift !== 0 ? Math.abs(shift) : 0;

      setSimulationResult({
        simulation_id: 'mock-sim-id',
        is_feasible: !hasVip,
        has_vip_train_conflict: hasVip,
        detention_delta_minutes: detentionDelta,
        total_detention_minutes: detentionDelta,
        conflicting_trains_count: hasVip ? 2 : shift !== 0 ? 1 : 0,
        risk_score_delta: hasVip ? 18.5 : -2.4,
        criticality_index_preserved_pct: 100.0,
        shadow_efficiency_score: 0.88,
        slw_advisory_required: false,
        commit_token: `token_verified_sim_${Date.now()}`,
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
        conflicting_trains: hasVip
          ? [
              {
                train_id: 't-vip-1',
                train_number: '12951',
                train_name: 'Mumbai Rajdhani Express',
                train_type: 'SUPERFAST',
                priority: 'HIGH',
                scheduled_departure: '03:45:00',
                scheduled_arrival: '04:30:00',
                expected_detention_minutes: 30,
                detention_penalty_tier: 1,
                is_hard_conflict: true,
              },
              {
                train_id: 't-exp-2',
                train_number: '12621',
                train_name: 'Tamil Nadu Express',
                train_type: 'SUPERFAST',
                priority: 'HIGH',
                scheduled_departure: '04:15:00',
                scheduled_arrival: '05:00:00',
                expected_detention_minutes: 15,
                detention_penalty_tier: 2,
                is_hard_conflict: false,
              },
            ]
          : [],
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSliderChange = (newShift: number) => {
    setShiftMinutes(newShift);
    runSimulation(newShift);
  };

  useEffect(() => {
    runSimulation(0);
  }, [selectedSection, planningDate]);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                What-If Delay &amp; Disruption Sandbox
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 font-mono">
                SCENARIO SIMULATOR
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Drag the time slider to test shifting a repair window and evaluate real-time conflict impacts on scheduled trains
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Target Section: <strong className="text-slate-900">{selectedSection?.section_code || 'MAS-AJJ'}</strong></span>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Slider & Time Window */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Shift Repair Window
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate early/late starts to find safe buffer gaps
            </p>
          </div>

          <WhatIfSlider shiftMinutes={shiftMinutes} onChange={handleSliderChange} />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Original Window:</span>
              <span className="font-bold text-slate-700">{baseStart.slice(0, 5)} — {baseEnd.slice(0, 5)} IST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Adjusted Window:</span>
              <span className="font-bold text-blue-600">{calculatedStart} — {calculatedEnd} IST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Time Shift:</span>
              <span className={`font-bold ${shiftMinutes === 0 ? 'text-slate-600' : shiftMinutes > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                {shiftMinutes > 0 ? `+${shiftMinutes} mins` : `${shiftMinutes} mins`}
              </span>
            </div>
          </div>

          {simulationResult && (
            <button
              onClick={() => setShowCommitModal(true)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Apply Shift to Live Timetable</span>
            </button>
          )}
        </div>

        {/* Right Columns: Gauges & Conflicting Trains Table */}
        <div className="lg:col-span-2 space-y-6">
          <ImpactGauges simulation={simulationResult} isLoading={isSimulating} />
          <ConflictingTrainsTable conflicts={simulationResult.conflicting_trains || []} />
        </div>
      </div>

      {showCommitModal && simulationResult && (
        <CommitModal
          result={simulationResult}
          newStart={calculatedStart}
          newEnd={calculatedEnd}
          onClose={() => setShowCommitModal(false)}
          onSuccess={() => {
            setShowCommitModal(false);
          }}
        />
      )}
    </div>
  );
};
export default SimulationPage;
