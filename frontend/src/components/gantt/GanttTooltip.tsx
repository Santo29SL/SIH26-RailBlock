import React from 'react';
import { TrainMovement } from '../../types/section';
import { Block } from '../../types/block';
import { Clock, ShieldAlert, Layers, CheckCircle2 } from 'lucide-react';

interface GanttTooltipProps {
  content: {
    type: 'train' | 'block';
    data: TrainMovement | Block;
    x: number;
    y: number;
  } | null;
}

export const GanttTooltip: React.FC<GanttTooltipProps> = ({ content }) => {
  if (!content) return null;

  const { type, data, x, y } = content;

  return (
    <div
      style={{
        left: `${Math.min(window.innerWidth - 300, x + 12)}px`,
        top: `${y + 12}px`,
      }}
      className="fixed z-50 w-72 bg-railway-card border border-railway-border rounded-xl shadow-2xl p-3 text-xs text-white pointer-events-none animate-in fade-in zoom-in-95 duration-100"
    >
      {type === 'train' ? (
        (() => {
          const m = data as TrainMovement;
          const isVip =
            m.train?.train_name?.includes('Rajdhani') ||
            m.train?.train_name?.includes('Vande Bharat') ||
            m.train?.train_name?.includes('Shatabdi');

          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-railway-border/60 pb-1.5">
                <span className="font-bold text-sky-400 font-mono">
                  #{m.train?.train_number || '12621'}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono ${
                    isVip
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {isVip ? 'TIER 1 VIP (ZERO DETENTION)' : `${m.train?.train_type || 'EXPRESS'}`}
                </span>
              </div>
              <h4 className="font-bold text-white text-xs">{m.train?.train_name || 'Passenger Service'}</h4>
              <div className="flex items-center space-x-2 text-slate-300 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  Dep: {m.departure_time.slice(0, 5)} | Arr: {m.arrival_time.slice(0, 5)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Movement: <span className="font-mono text-slate-200">{m.movement_type}</span>
              </div>
            </div>
          );
        })()
      ) : (
        (() => {
          const b = data as Block;
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-railway-border/60 pb-1.5">
                <span className="font-bold text-amber-400 font-mono">{b.block_code}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                  {b.status}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>
                  {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                </span>
              </div>
              {b.is_joint_shadow_block && (
                <div className="p-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 flex items-center space-x-1">
                  <Layers className="w-3 h-3" />
                  <span>Joint Shadow Block (+{b.shadow_overlap_hours || 0}h labor saved)</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-railway-border/40 font-mono">
                <span>Criticality: {b.total_criticality_index || 0}</span>
                <span>Train Detention: {b.estimated_train_detention_minutes || 0}m</span>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
