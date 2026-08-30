import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Train,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RotateCcw,
  Sliders,
  Filter,
  ShieldCheck,
  ArrowRight,
  Flame,
} from 'lucide-react';

export interface TrainTimetableItem {
  id: string;
  trainNumber: string;
  trainName: string;
  trainType: 'VIP_SUPERFAST' | 'SUPERFAST_EXPRESS' | 'FREIGHT_GOODS';
  priorityTier: 'TIER_1_VIP' | 'TIER_2_EXPRESS' | 'TIER_3_FREIGHT';
  scheduledDeparture: string;
  scheduledArrival: string;
  currentDelayMinutes: number;
  routeSection: string;
  direction: 'UP' | 'DOWN';
  status: 'ON_TIME' | 'DELAYED' | 'RESOLVED';
}

interface TrainTimetableTableProps {
  onInjectDelay?: (trainNumber: string, delayMinutes: number) => void;
  onResetDelay?: (trainNumber: string) => void;
  onAutoReschedule?: (trainNumber: string, delayMinutes: number) => void;
}

export const TrainTimetableTable: React.FC<TrainTimetableTableProps> = ({
  onInjectDelay,
  onResetDelay,
  onAutoReschedule,
}) => {
  const { simulateDelay } = useTelemetry();
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const [timetable, setTimetable] = useState<TrainTimetableItem[]>([
    {
      id: 'tt-1',
      trainNumber: '12621',
      trainName: 'Tamil Nadu Superfast Express',
      trainType: 'SUPERFAST_EXPRESS',
      priorityTier: 'TIER_2_EXPRESS',
      scheduledDeparture: '00:45:00',
      scheduledArrival: '02:00:00',
      currentDelayMinutes: 0,
      routeSection: 'MAS - AJJ (Main UP Line)',
      direction: 'UP',
      status: 'ON_TIME',
    },
    {
      id: 'tt-2',
      trainNumber: '20607',
      trainName: 'Vande Bharat Express',
      trainType: 'VIP_SUPERFAST',
      priorityTier: 'TIER_1_VIP',
      scheduledDeparture: '05:30:00',
      scheduledArrival: '06:45:00',
      currentDelayMinutes: 0,
      routeSection: 'MAS - AJJ (High Speed UP Line)',
      direction: 'UP',
      status: 'ON_TIME',
    },
    {
      id: 'tt-3',
      trainNumber: 'BOXN-88',
      trainName: 'Thermal Coal Bulk Freight',
      trainType: 'FREIGHT_GOODS',
      priorityTier: 'TIER_3_FREIGHT',
      scheduledDeparture: '11:15:00',
      scheduledArrival: '12:45:00',
      currentDelayMinutes: 0,
      routeSection: 'MAS - AJJ (Freight Loop 3)',
      direction: 'DOWN',
      status: 'ON_TIME',
    },
    {
      id: 'tt-4',
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      trainType: 'VIP_SUPERFAST',
      priorityTier: 'TIER_1_VIP',
      scheduledDeparture: '17:00:00',
      scheduledArrival: '18:30:00',
      currentDelayMinutes: 0,
      routeSection: 'MAS - AJJ (Main UP Line)',
      direction: 'UP',
      status: 'ON_TIME',
    },
    {
      id: 'tt-5',
      trainNumber: 'CONT-44',
      trainName: 'CONCOR Container Heavy Freight',
      trainType: 'FREIGHT_GOODS',
      priorityTier: 'TIER_3_FREIGHT',
      scheduledDeparture: '20:30:00',
      scheduledArrival: '22:00:00',
      currentDelayMinutes: 0,
      routeSection: 'MAS - AJJ (Goods Bypass)',
      direction: 'DOWN',
      status: 'ON_TIME',
    },
  ]);

  const handleApplyDelay = (trainNumber: string, delayMins: number) => {
    setTimetable((prev) =>
      prev.map((t) =>
        t.trainNumber === trainNumber
          ? {
              ...t,
              currentDelayMinutes: delayMins,
              status: delayMins > 0 ? 'DELAYED' : 'ON_TIME',
            }
          : t
      )
    );

    simulateDelay(trainNumber, delayMins);
    if (onInjectDelay) onInjectDelay(trainNumber, delayMins);
  };

  const handleResetTrain = (trainNumber: string) => {
    handleApplyDelay(trainNumber, 0);
    if (onResetDelay) onResetDelay(trainNumber);
  };

  const handleResolveTrain = (trainNumber: string) => {
    setTimetable((prev) =>
      prev.map((t) =>
        t.trainNumber === trainNumber
          ? {
              ...t,
              currentDelayMinutes: 0,
              status: 'RESOLVED',
            }
          : t
      )
    );
    if (onAutoReschedule) onAutoReschedule(trainNumber, 0);
  };

  const filteredItems = selectedFilter === 'ALL'
    ? timetable
    : selectedFilter === 'VIP'
    ? timetable.filter((t) => t.priorityTier === 'TIER_1_VIP')
    : selectedFilter === 'PASSENGER'
    ? timetable.filter((t) => t.trainType !== 'FREIGHT_GOODS')
    : timetable.filter((t) => t.trainType === 'FREIGHT_GOODS');

  const getPriorityBadge = (tier: string) => {
    switch (tier) {
      case 'TIER_1_VIP':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center space-x-1">
            <Flame className="w-3 h-3 text-amber-600" />
            <span>VIP TIER 1</span>
          </span>
        );
      case 'TIER_2_EXPRESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center space-x-1">
            <Train className="w-3 h-3 text-blue-600" />
            <span>SUPERFAST</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 inline-flex items-center space-x-1">
            <span>FREIGHT RAKE</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs select-none font-sans space-y-0">
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">
                Corridor Train Timetable &amp; Real-Time Telemetry Dispatch
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-mono">
                LIVE DISPATCH FEED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              COA Sectional Timings • Instant Disruption Injection &amp; Automated Rescheduler Testing
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-mono font-bold">
          {['ALL', 'VIP', 'PASSENGER', 'FREIGHT'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                selectedFilter === filter ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* High-Contrast Interactive Timetable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-4">Train No. &amp; Name</th>
              <th className="p-4">Priority Classification</th>
              <th className="p-4">Corridor Section &amp; Line</th>
              <th className="p-4">Scheduled Timings</th>
              <th className="p-4">Telemetry Status</th>
              <th className="p-4 text-center">Inject Test Delay</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredItems.map((train) => {
              const isDelayed = train.currentDelayMinutes > 0;
              return (
                <tr
                  key={train.id}
                  className={`transition-colors ${
                    isDelayed ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Train Identity */}
                  <td className="p-4">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          train.priorityTier === 'TIER_1_VIP'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : train.priorityTier === 'TIER_2_EXPRESS'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Train className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          #{train.trainNumber}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold truncate max-w-[200px] block">
                          {train.trainName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Priority Tier */}
                  <td className="p-4">
                    {getPriorityBadge(train.priorityTier)}
                  </td>

                  {/* Route & Track */}
                  <td className="p-4 font-mono text-[11px] text-slate-600">
                    <div>{train.routeSection}</div>
                    <span className="text-[10px] text-slate-400 font-bold">Direction: {train.direction}</span>
                  </td>

                  {/* Scheduled Timings */}
                  <td className="p-4 font-mono text-xs">
                    <div className="font-bold text-slate-900">
                      {train.scheduledDeparture.slice(0, 5)} &rarr; {train.scheduledArrival.slice(0, 5)} IST
                    </div>
                    {isDelayed && (
                      <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                        Adjusted: +{train.currentDelayMinutes}m Late
                      </div>
                    )}
                  </td>

                  {/* Status Indicator */}
                  <td className="p-4">
                    {isDelayed ? (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold font-mono text-[11px] animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>+{train.currentDelayMinutes}m DELAY</span>
                      </div>
                    ) : train.status === 'RESOLVED' ? (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>RESOLVED (ON TIME)</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>ON TIME (COA)</span>
                      </div>
                    )}
                  </td>

                  {/* Inject Delay Quick Buttons */}
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                      {[15, 30, 45].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleApplyDelay(train.trainNumber, mins)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            train.currentDelayMinutes === mins
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {isDelayed ? (
                        <>
                          <button
                            onClick={() => handleResolveTrain(train.trainNumber)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs flex items-center space-x-1 cursor-pointer transition-colors"
                            title="1-Click Automated Reschedule"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Auto-Resolve</span>
                          </button>
                          <button
                            onClick={() => handleResetTrain(train.trainNumber)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Reset to 0m"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleApplyDelay(train.trainNumber, 35)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Simulate Delay</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
