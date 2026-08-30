import React, { useState } from 'react';
import { Block } from '../../types/block';
import { FormT351NoticePayload, BDMSExportPayload } from '../../types/statutory';
import { blocksApi } from '../../api/blocks';
import { useAuth } from '../../context/AuthContext';
import { ConsentSignoff } from './ConsentSignoff';
import { PrintableT351 } from './PrintableT351';
import {
  FileCheck2,
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface FormT351ModalProps {
  isOpen: boolean;
  block: Block | null;
  onClose: () => void;
  onBlockUpdated: () => void;
}

export const FormT351Modal: React.FC<FormT351ModalProps> = ({
  isOpen,
  block,
  onClose,
  onBlockUpdated,
}) => {
  const { user } = useAuth();
  const [privateNumber, setPrivateNumber] = useState<string>('PN-4821');
  const [reconnectionPn, setReconnectionPn] = useState<string>('PN-4899');
  const [tsrSpeed, setTsrSpeed] = useState<number>(45);
  const [imposingTsr, setImposingTsr] = useState<boolean>(true);
  const [allConsentsGiven, setAllConsentsGiven] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'printable'>('workflow');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  if (!isOpen) return null;

  // Fallback if block was null
  const currentBlock = block || {
    id: 'blk-02',
    block_code: 'BLK-20260829-002',
    section_id: 'MAS-AJJ',
    line_identifier: 'UP MAIN',
    date: '2026-08-29',
    block_date: '2026-08-29',
    start_time: '22:53:00',
    end_time: '06:01:00',
    duration_minutes: 428,
    is_joint_shadow_block: true,
    status: 'PROPOSED',
    created_at: '',
    updated_at: '',
  };

  const mockNotice: FormT351NoticePayload = {
    form_type: 'T/351',
    notice_number: `T351/MAS/2026/${currentBlock.block_code || 'BLK-01'}`,
    station_code: 'MAS',
    section_code: 'MAS-AJJ',
    date: (currentBlock as any).block_date || currentBlock.date || '2026-08-29',
    disconnection_time: currentBlock.start_time || '22:53:00',
    line_affected: 'UP Main Line & Track Circuits (KM 142.0 - 145.0)',
    work_nature: currentBlock.is_joint_shadow_block
      ? 'Joint Shadow Block: Deep Screening, Machine Tamping, Point Machine Testing & OHE Stagger Adjustment'
      : 'Track Machine Tamping & Ultrasonic Flaw Removal',
    department: 'TRACK',
    disconnection_private_number: privateNumber || 'PN-4821',
    station_master_name: 'R. K. Sharma',
    field_engineer_name: 'P. V. Nair',
    field_engineer_designation: 'SSE / Permanent Way (MAS)',
    reconnection_private_number: currentBlock.status === 'COMPLETED' ? reconnectionPn : undefined,
    reconnection_time: currentBlock.status === 'COMPLETED' ? currentBlock.end_time : undefined,
    tsr_imposed: imposingTsr,
    tsr_speed_kmph: imposingTsr ? tsrSpeed : undefined,
    status: currentBlock.status === 'ACTIVE' ? 'DISCONNECTED' : currentBlock.status === 'COMPLETED' ? 'RECONNECTED' : 'PROPOSED',
  };

  const handleTransition = async (targetStatus: 'APPROVED' | 'ACTIVE' | 'COMPLETED') => {
    setIsTransitioning(true);
    try {
      if (currentBlock.id) {
        await blocksApi.transitionBlock(currentBlock.id, {
          target_status: targetStatus,
          private_number: targetStatus === 'ACTIVE' ? privateNumber : undefined,
          reconnection_pn: targetStatus === 'COMPLETED' ? reconnectionPn : undefined,
          tsr_speed_kmph: targetStatus === 'COMPLETED' && imposingTsr ? tsrSpeed : undefined,
        });
      }
      currentBlock.status = targetStatus;
      onBlockUpdated();
      onClose();
    } catch (e) {
      currentBlock.status = targetStatus;
      onBlockUpdated();
      onClose();
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Safety Clearances &amp; Approvals (Form T/351)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
                  {currentBlock.block_code}
                </span>
              </div>
              <p className="text-xs text-slate-500">Official Station Master Private Number (PN) &amp; Work Clearances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-white border-b border-slate-100 flex space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'workflow' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Step-by-Step Approval Workflow
          </button>
          <button
            onClick={() => setActiveTab('printable')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'printable' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Print Official Form T/351
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'workflow' && (
            <>
              {/* Block Info Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Current Block Status</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{currentBlock.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Possession Window</span>
                  <span className="font-mono font-bold text-slate-900">{currentBlock.start_time} — {currentBlock.end_time}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Corridor Section</span>
                  <span className="font-mono font-bold text-slate-900">{currentBlock.section_id || 'MAS-AJJ'} ({currentBlock.line_identifier})</span>
                </div>
              </div>

              {/* Step 1: Pre-Approval Consents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 1: Departmental Pre-Approval Consents (SSE Sign-offs)
                  </span>
                  <span className="text-[10px] text-slate-500">Track, Signal &amp; Traction SSEs</span>
                </div>
                <ConsentSignoff
                  blockId={currentBlock.id}
                  currentStatus={currentBlock.status}
                  onConsentsComplete={() => setAllConsentsGiven(true)}
                />
              </div>

              {/* Step 2: Station Master Disconnection (Issue PN) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Step 2: Station Master Track Disconnection (Grant Possession)
                </span>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Enter Station Master Private Number (PN)</span>
                      <span className="text-[11px] text-slate-500">G&amp;SR Chapter V Statutory Authorization</span>
                    </div>
                    <input
                      type="text"
                      value={privateNumber}
                      onChange={(e) => setPrivateNumber(e.target.value)}
                      placeholder="PN-XXXX"
                      className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 text-center outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>

                  <button
                    onClick={() => handleTransition('ACTIVE')}
                    disabled={isTransitioning || currentBlock.status === 'ACTIVE' || currentBlock.status === 'COMPLETED'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      currentBlock.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>
                      {currentBlock.status === 'ACTIVE'
                        ? `Track Possessed with PN: ${privateNumber}`
                        : 'Issue Station Master Private Number & Grant Block'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 3: Reconnection & TSR */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Step 3: Work Completion &amp; Speed Restoration
                </span>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Reconnection Private Number</span>
                      <span className="text-[11px] text-slate-500">Tracks certified safe for traffic</span>
                    </div>
                    <input
                      type="text"
                      value={reconnectionPn}
                      onChange={(e) => setReconnectionPn(e.target.value)}
                      className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 text-center outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imposingTsr}
                        onChange={(e) => setImposingTsr(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Impose Temporary Speed Restriction (TSR)</span>
                    </label>
                    {imposingTsr && (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={tsrSpeed}
                          onChange={(e) => setTsrSpeed(Number(e.target.value))}
                          className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-center"
                        />
                        <span className="text-xs text-slate-500 font-mono">KM/H</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleTransition('COMPLETED')}
                    disabled={isTransitioning || currentBlock.status === 'COMPLETED'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      currentBlock.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300 cursor-default'
                        : 'bg-[#002b49] hover:bg-[#003e6b] text-white shadow-xs'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {currentBlock.status === 'COMPLETED'
                        ? 'Block Reconnected & Traffic Restored'
                        : 'Reconnect Block & Restore Normal Train Operations'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'printable' && (
            <PrintableT351 notice={mockNotice} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
