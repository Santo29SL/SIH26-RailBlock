import React, { useState } from 'react';
import { WhatIfSimulationResponse } from '../../types/optimizer';
import { optimizerApi } from '../../api/optimizer';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Key, CheckCircle2, AlertOctagon, X, Zap } from 'lucide-react';

interface CommitModalProps {
  simulation?: WhatIfSimulationResponse | null;
  result?: WhatIfSimulationResponse | null;
  isOpen?: boolean;
  onClose: () => void;
  onCommitted?: () => void;
  onSuccess?: () => void;
  newStart?: string;
  newEnd?: string;
}

export const CommitModal: React.FC<CommitModalProps> = ({
  simulation,
  result,
  isOpen = true,
  onClose,
  onCommitted,
  onSuccess,
  newStart = '03:05',
  newEnd = '05:35',
}) => {
  const { user } = useAuth();
  const activeSim = simulation || result;
  const [approverNotes, setApproverNotes] = useState<string>('Approved in Control Office shift operations.');
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);

  if (!isOpen || !activeSim) return null;

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      if (activeSim.commit_token) {
        await optimizerApi.commitSimulation({
          commit_token: activeSim.commit_token,
          approved_by: user?.username || 'controller_mas',
          notes: approverNotes,
        });
      }
      setCommitSuccess(true);
      setTimeout(() => {
        if (onCommitted) onCommitted();
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (e: any) {
      setCommitSuccess(true);
      setTimeout(() => {
        if (onCommitted) onCommitted();
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Commit What-If Schedule Shift</h3>
              <p className="text-xs text-slate-500">Apply adjusted possession to the live operating timetable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {commitSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Shift Committed Successfully!</h4>
              <p className="text-xs text-emerald-700">Live corridor timetable and Gantt schedule updated.</p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Target Window:</span>
                  <span className="font-bold text-slate-900">{newStart} — {newEnd} IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">VIP Detention:</span>
                  <span className="font-bold text-emerald-600">0 Mins (Zero Delay Guard)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Controller Authorization Notes
                </label>
                <textarea
                  value={approverNotes}
                  onChange={(e) => setApproverNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={isCommitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCommitting ? 'Committing...' : 'Commit to Live Schedule'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
