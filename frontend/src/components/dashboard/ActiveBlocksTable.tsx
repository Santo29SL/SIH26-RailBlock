import React from 'react';
import { Block } from '../../types/block';
import { Clock, Layers, ArrowRight, ShieldCheck, Activity, Key } from 'lucide-react';

interface ActiveBlocksTableProps {
  blocks: Block[];
  onSelectBlock?: (block: Block) => void;
  onOpenStatutory?: (block: Block) => void;
}

export const ActiveBlocksTable: React.FC<ActiveBlocksTableProps> = ({
  blocks,
  onSelectBlock,
  onOpenStatutory,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROPOSED':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">PROPOSED</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">APPROVED</span>;
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center space-x-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            <span>ACTIVE (G&amp;SR)</span>
          </span>
        );
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Scheduled Maintenance Possessions (Blocks)</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">{blocks.length} Active in Corridor</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-bold">Block Code</th>
              <th className="px-4 py-2.5 font-bold">Window Timings</th>
              <th className="px-4 py-2.5 font-bold">Type &amp; Bundling</th>
              <th className="px-4 py-2.5 font-bold">Overlap Saved</th>
              <th className="px-4 py-2.5 font-bold">Criticality (CI)</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5 font-bold text-right">Statutory Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No maintenance blocks scheduled for this section date. Run Optimizer (Stage 5) to generate.
                </td>
              </tr>
            ) : (
              blocks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    <button
                      onClick={() => onSelectBlock && onSelectBlock(b)}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {b.block_code}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-800">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {b.is_joint_shadow_block ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                        <span>JOINT SHADOW</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">SOLO PRIMARY</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-600 font-bold">
                    +{b.shadow_overlap_hours || 0} hrs
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {b.total_criticality_index || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onOpenStatutory && onOpenStatutory(b)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Form T/351</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
