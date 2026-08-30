import React from 'react';

interface TimelineScrubberProps {
  totalHours: number; // e.g. 24, 168 (7d), 720 (30d)
  currentHourCursor?: number;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  totalHours,
  currentHourCursor,
}) => {
  // Generate tick marks depending on horizon
  const step = totalHours <= 24 ? 2 : totalHours <= 168 ? 24 : 72; // every 2h for 24h, every day for 7d
  const ticks = [];
  for (let h = 0; h <= totalHours; h += step) {
    ticks.push(h);
  }

  return (
    <div className="h-6 bg-railway-surface/90 border-b border-railway-border relative select-none font-mono text-[10px] text-slate-400">
      {ticks.map((h) => {
        const left = (h / totalHours) * 100;
        const displayLabel =
          totalHours <= 24
            ? `${String(h % 24).padStart(2, '0')}:00`
            : `Day ${Math.floor(h / 24) + 1}`;

        return (
          <div
            key={h}
            style={{ left: `${left}%` }}
            className="absolute top-0 bottom-0 flex flex-col justify-between -translate-x-1/2"
          >
            <span className="px-1 text-[9px] font-semibold">{displayLabel}</span>
            <div className="w-[1px] h-1.5 bg-railway-border mx-auto" />
          </div>
        );
      })}

      {/* Current simulated time vertical cursor */}
      {currentHourCursor !== undefined && (
        <div
          style={{ left: `${(currentHourCursor / totalHours) * 100}%` }}
          className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-30 pointer-events-none"
        >
          <div className="w-2 h-2 rounded-full bg-rose-500 -ml-[3px] -mt-1 shadow-md shadow-rose-500/50" />
        </div>
      )}
    </div>
  );
};
