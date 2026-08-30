import React from 'react';
import { TrainMovement } from '../../types/section';

interface TrainBarProps {
  movement: TrainMovement;
  startMinutes: number; // minutes from 00:00
  durationMinutes: number;
  totalTimelineMinutes: number;
  onHover: (movement: TrainMovement, event: React.MouseEvent) => void;
  onLeave: () => void;
}

export const TrainBar: React.FC<TrainBarProps> = ({
  movement,
  startMinutes,
  durationMinutes,
  totalTimelineMinutes,
  onHover,
  onLeave,
}) => {
  const leftPercent = Math.max(0, Math.min(100, (startMinutes / totalTimelineMinutes) * 100));
  const widthPercent = Math.max(0.8, Math.min(100 - leftPercent, (durationMinutes / totalTimelineMinutes) * 100));

  // Determine train priority and color coding per ADR 0003
  const trainNumber = movement.train?.train_number || '12621';
  const trainName = movement.train?.train_name || 'Express Train';
  const isFreight = movement.movement_type === 'FORECAST_FREIGHT' || movement.train?.train_type === 'FREIGHT';

  const isVip =
    trainName.includes('Rajdhani') ||
    trainName.includes('Vande Bharat') ||
    trainName.includes('Shatabdi') ||
    trainName.includes('Tejas') ||
    trainName.includes('Duronto') ||
    trainName.includes('Gatimaan') ||
    movement.train?.priority === 'HIGH';

  const isExpress = !isVip && !isFreight && (movement.train?.train_type === 'SUPERFAST' || movement.train?.train_type === 'EXPRESS' || movement.train?.train_type === 'MAIL');

  let colorClasses = 'bg-blue-600/80 border-blue-400 text-white'; // Passenger/Local
  let icon = '🚆';

  if (isVip) {
    colorClasses = 'bg-rose-600 border-rose-300 text-white font-extrabold shadow-lg shadow-rose-600/40 ring-1 ring-white/40';
    icon = '🚄';
  } else if (isExpress) {
    colorClasses = 'bg-orange-500 border-orange-300 text-white font-bold shadow-md shadow-orange-500/30';
    icon = '🚆';
  } else if (isFreight) {
    colorClasses = 'bg-slate-700 border-amber-400/80 text-amber-200 border-dashed';
    icon = '🚂';
  }

  return (
    <div
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
      onMouseEnter={(e) => onHover(movement, e)}
      onMouseLeave={onLeave}
      className={`absolute h-8 top-1 rounded-lg border text-[10px] flex items-center justify-between px-2 cursor-pointer transition-all hover:scale-y-110 hover:z-30 select-none ${colorClasses}`}
    >
      <div className="flex items-center space-x-1 truncate">
        <span className="text-xs shrink-0">{icon}</span>
        <span className="truncate font-mono font-bold">
          #{trainNumber} {trainName.slice(0, 10)}
        </span>
      </div>
      {isVip && (
        <span className="hidden sm:inline-block text-[8px] px-1 py-0.2 rounded bg-black/40 text-rose-200 font-mono font-black shrink-0 ml-1">
          VIP
        </span>
      )}
    </div>
  );
};
