import React, { useState, useEffect } from 'react';
import { useDivision } from '../context/DivisionContext';
import { blocksApi } from '../api/blocks';
import { Block } from '../types/block';
import { FormT351Modal } from '../components/statutory/FormT351Modal';
import { FormTD602Modal } from '../components/statutory/FormTD602Modal';
import {
  FileCheck2,
  ShieldCheck,
  Clock,
  Key,
  Radio,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export const StatutoryPage: React.FC = () => {
  const { selectedSection, planningDate } = useDivision();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockForT351, setSelectedBlockForT351] = useState<Block | null>(null);
  const [showTD602Modal, setShowTD602Modal] = useState<boolean>(false);

  const loadBlocks = async () => {
    try {
      const res = await blocksApi.getBlocks(selectedSection?.id, undefined, 1, 50);
      if (res.items && res.items.length > 0) setBlocks(res.items);
    } catch (e) {
      console.warn('Could not load blocks for statutory portal');
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [selectedSection, planningDate]);

  const displayBlocks: Block[] = blocks.length > 0 ? blocks : [
    {
      id: 'blk-01',
      block_code: 'BLK-20260825-001',
      section_id: 'MAS-AJJ',
      line_identifier: 'UP MAIN',
      date: '2026-08-29',
      start_time: '02:30:00',
      end_time: '05:00:00',
      duration_minutes: 150,
      is_joint_shadow_block: true,
      shadow_overlap_hours: 3.0,
      total_criticality_index: 85.8,
      status: 'APPROVED',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'blk-02',
      block_code: 'BLK-20260829-002',
      section_id: 'MAS-AJJ',
      line_identifier: 'UP MAIN',
      date: '2026-08-29',
      start_time: '22:53:00',
      end_time: '06:01:00',
      duration_minutes: 428,
      is_joint_shadow_block: true,
      shadow_overlap_hours: 5.3,
      total_criticality_index: 92.5,
      status: 'PROPOSED',
      created_at: '',
      updated_at: '',
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Statutory Approvals &amp; Safety Clearances (Form T/351 &amp; T/D 602)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 font-mono">
                G&amp;SR Chapter V
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Departmental pre-approvals, Station Master Private Numbers (Form T/351), and Single Line Working authority
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTD602Modal(true)}
          className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer font-sans shadow-xs"
        >
          <Radio className="w-4 h-4 text-amber-600" />
          <span>Single Line Working Authority (Form T/D 602)</span>
        </button>
      </div>

      {/* Block Registry Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
            Corridor Possession Clearances &amp; Private Number Registry
          </h3>
          <span className="text-[10px] text-slate-500 font-mono font-bold">
            {displayBlocks.length} Possessions Requiring SM Consent
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Block Code</th>
                <th className="p-3.5">Corridor Section</th>
                <th className="p-3.5">Line Affected</th>
                <th className="p-3.5">Timetable Window</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Statutory Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {displayBlocks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{b.block_code}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-700">{b.section_id || 'MAS-AJJ'}</td>
                  <td className="p-3.5 font-mono text-slate-800">{b.line_identifier || 'UP MAIN'}</td>
                  <td className="p-3.5 font-mono text-slate-900">
                    {b.start_time} — {b.end_time} ({b.duration_minutes}m)
                  </td>
                  <td className="p-3.5">
                    {b.is_joint_shadow_block ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                        JOINT SHADOW
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700">
                        SOLO
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      b.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'ACTIVE'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedBlockForT351(b)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Open Form T/351
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBlockForT351 && (
        <FormT351Modal
          isOpen={true}
          block={selectedBlockForT351}
          onClose={() => setSelectedBlockForT351(null)}
          onBlockUpdated={() => {
            loadBlocks();
            setSelectedBlockForT351(null);
          }}
        />
      )}

      {showTD602Modal && (
        <FormTD602Modal
          isOpen={showTD602Modal}
          onClose={() => setShowTD602Modal(false)}
        />
      )}
    </div>
  );
};
