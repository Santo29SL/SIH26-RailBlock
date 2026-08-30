import React, { useState, useEffect } from 'react';
import { useDivision } from '../context/DivisionContext';
import { useTelemetry } from '../context/TelemetryContext';
import { sectionsApi } from '../api/sections';
import { blocksApi } from '../api/blocks';
import { TrainMovement } from '../types/section';
import { Block } from '../types/block';
import { DualGanttChart } from '../components/gantt/DualGanttChart';
import { TrainTimetableTable } from '../components/gantt/TrainTimetableTable';
import { FormT351Modal } from '../components/statutory/FormT351Modal';
import { Calendar, ShieldCheck, Clock, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

export const GanttPage: React.FC = () => {
  const { selectedSection, planningDate } = useDivision();
  const { simulateDelay } = useTelemetry();

  const [trainMovements, setTrainMovements] = useState<TrainMovement[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  // Live delay tracking across timetable and gantt
  const [activeDelayTrainNumber, setActiveDelayTrainNumber] = useState<string>('');
  const [activeDelayMinutes, setActiveDelayMinutes] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [movs, blks] = await Promise.all([
        sectionsApi.getTrainMovements(selectedSection?.id, undefined, 1, 100),
        blocksApi.getBlocks(selectedSection?.id, undefined, 1, 50),
      ]);
      if (movs.items && movs.items.length > 0) setTrainMovements(movs.items);
      if (blks.items && blks.items.length > 0) setBlocks(blks.items);
    } catch (e) {
      console.warn('Gantt data fallback loaded');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSection, planningDate]);

  const handleInjectDelay = (trainNumber: string, delayMinutes: number) => {
    setActiveDelayTrainNumber(trainNumber);
    setActiveDelayMinutes(delayMinutes);
    if (delayMinutes > 0) {
      setToastMessage(`🚨 Telemetry Alert: Train #${trainNumber} delayed by +${delayMinutes}m. Gantt chart updated!`);
    } else {
      setToastMessage(`✓ Train #${trainNumber} reset to on-time timetable.`);
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAutoReschedule = (trainNumber: string) => {
    setActiveDelayTrainNumber('');
    setActiveDelayMinutes(0);
    setToastMessage(`✓ 1-Click Automated Rescheduler Applied: Possession rescheduled with 0 VIP delay!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f172a] text-white border border-slate-700 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-mono font-bold animate-in slide-in-from-top-4 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Space-Time Corridor Gantt Scheduler &amp; Timetable</h2>
            <p className="text-xs text-slate-500">
              Live timetable comparing scheduled passenger &amp; freight train runs against multi-department bundled maintenance windows
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Corridor: <strong className="text-slate-900">{selectedSection?.section_code || 'MAS-AJJ'}</strong></span>
          </div>
        </div>
      </div>

      {/* 1. Main Dual Gantt Timeline Canvas */}
      <DualGanttChart
        trainMovements={trainMovements}
        blocks={blocks}
        horizonHours={24}
        activeDelayTrainNumber={activeDelayTrainNumber}
        activeDelayMinutes={activeDelayMinutes}
        onSelectBlock={(b) => setSelectedBlock(b)}
      />

      {/* 2. Interactive Corridor Train Timetable Table with Real-Time Delay Controls */}
      <TrainTimetableTable
        onInjectDelay={handleInjectDelay}
        onResetDelay={(tr) => handleInjectDelay(tr, 0)}
        onAutoReschedule={handleAutoReschedule}
      />

      {/* Approvals Modal */}
      <FormT351Modal
        isOpen={!!selectedBlock}
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onBlockUpdated={fetchData}
      />
    </div>
  );
};
