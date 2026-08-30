import React from 'react';
import { Block } from '../../types/block';
import { Layers } from 'lucide-react';

interface BlockBarProps {
  block: Block;
  startMinutes: number;
  durationMinutes: number;
  totalTimelineMinutes: number;
  onHover: (block: Block, event: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (block: Block) => void;
}

export const BlockBar: React.FC<BlockBarProps> = ({
  block,
  startMinutes,
  durationMinutes,
  totalTimelineMinutes,
  onHover,
  onLeave,
  onClick,
}) => {
  const leftPercent = Math.max(0, Math.min(100, (startMinutes / totalTimelineMinutes) * 100));
  const widthPercent = Math.max(1.0, Math.min(100 - leftPercent, (durationMinutes / totalTimelineMinutes) * 100));

  // Determine status color per spec
  let statusStyle = 'bg-amber-500/80 border-amber-400 text-amber-950 font-bold'; // PROPOSED
  if (block.status === 'APPROVED') {
    statusStyle = 'bg-emerald-500/80 border-emerald-300 text-emerald-950 font-bold shadow-md shadow-emerald-500/20';
  } else if (block.status === 'ACTIVE') {
    statusStyle =
      'bg-gradient-to-r from-rose-600 to-rose-700 border-rose-300 text-white font-extrabold shadow-lg shadow-rose-600/40 animate-pulse';
  } else if (block.status === 'COMPLETED') {
    statusStyle = 'bg-cyan-600/80 border-cyan-400 text-white font-bold';
  }

  return (
    <div
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
      onClick={() => onClick(block)}
      onMouseEnter={(e) => onHover(block, e)}
      onMouseLeave={onLeave}
      className={`absolute h-8 top-1 rounded-lg border-2 text-[10px] flex items-center justify-between px-2 cursor-pointer transition-all hover:scale-105 hover:z-20 ${statusStyle}`}
    >
      <div className="flex items-center space-x-1 truncate">
        {block.is_joint_shadow_block && <Layers className="w-3 h-3 shrink-0" />}
        <span className="font-mono tracking-tight truncate">{block.block_code}</span>
      </div>

      {block.is_joint_shadow_block && (
        <span className="hidden sm:inline-block text-[9px] px-1 rounded bg-black/30 text-white font-mono shrink-0 ml-1">
          SHADOW (+{block.shadow_overlap_hours || 0}h)
        </span>
      )}
    </div>
  );
};
