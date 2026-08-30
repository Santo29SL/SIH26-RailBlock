import React, { useState } from 'react';
import { FormTD602SheetPayload } from '../../types/statutory';
import { PrintableTD602 } from './PrintableTD602';
import { Radio, X, Printer, ShieldAlert, PhoneCall, Gauge, CheckSquare } from 'lucide-react';

interface FormTD602ModalProps {
  sheet?: FormTD602SheetPayload;
  isOpen: boolean;
  onClose: () => void;
}

export const FormTD602Modal: React.FC<FormTD602ModalProps> = ({
  sheet,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'printable'>('details');

  if (!isOpen) return null;

  const defaultSheet: FormTD602SheetPayload = sheet || {
    form_name: 'Form T/D 602',
    form_title: 'AUTHORITY FOR TEMPORARY SINGLE LINE WORKING ON DOUBLE LINE SECTION',
    statutory_rule: 'GR 3.68, SR 4.42, SR 4.09 & SR Chapter 15',
    division: 'Chennai',
    zone: 'Southern Railway',
    section_code: 'MAS-AJJ',
    section_name: 'Chennai Central - Arakkonam Jn',
    date_time: '25-08-2026 03:45 IST',
    line_obstructed: 'UP Main Line (Tamping Machine Overrun)',
    line_in_use: 'DOWN Main Line (Assigned for Bidirectional SLW)',
    pilot_train_number: '12621',
    station_master_private_number: 'PN-7392',
    part_1_line_clear_ticket:
      'Line clear granted for Pilot Train #12621 to enter block section MAS-AJJ on DOWN Main Line under Single Line Working.',
    part_2_authority_to_pass_signals_at_on:
      'Authorized to pass Signal S-12 and Starter Signal at ON condition with caution.',
    part_3_caution_order: {
      pilot_train_speed: '25 km/h (Caution Order Pilot ceiling)',
      facing_points_speed: '15 km/h over all facing points & crossovers',
      subsequent_train_speed: 'Booked Speed (40 km/h cap if wrong direction on Automatic Block)',
      clamping_padlocking_mandate:
        'All facing points leading to the single line section must be correctly set, clamped, and padlocked (SR 4.09).',
    },
    controller_phone_script:
      'Control Office MAS to Station Master CNB and AJJ: UP line is obstructed due to block overrun. Introduce Temporary Single Line Working on DOWN line per GR 3.68. First pilot train is #12621. Exchange Private Numbers and clamp all facing points.',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-railway-card border border-railway-border rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-railway-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Temporary Single Line Working (Form T/D 602)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  GR 3.68
                </span>
              </div>
              <p className="text-xs text-slate-400">Emergency bidirectional operations during obstruction or block overrun</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-railway-surface/60 border-b border-railway-border flex space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Statutory Rules & Dispatch Script
          </button>
          <button
            onClick={() => setActiveTab('printable')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'printable' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Printable Authority Sheet
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Section Context Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-railway-dark/80 border border-railway-border font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">OBSTRUCTED LINE</span>
                  <span className="text-rose-400 font-bold">{defaultSheet.line_obstructed}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">SINGLE LINE IN USE</span>
                  <span className="text-emerald-400 font-bold">{defaultSheet.line_in_use}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">PILOT TRAIN NUMBER</span>
                  <span className="text-white font-bold">#{defaultSheet.pilot_train_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">STATION MASTER PN</span>
                  <span className="text-amber-400 font-bold">{defaultSheet.station_master_private_number}</span>
                </div>
              </div>

              {/* Statutory Speed Ceilings (GR 3.68 / SR 4.42) */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <Gauge className="w-4 h-4" />
                  <span>Statutory Caution Order Speed Restrictions</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="p-2 rounded bg-black/40 text-center border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block font-sans">1st Pilot Train</span>
                    <span className="text-base font-black text-rose-400">25 km/h</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 text-center border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block font-sans">Facing Points</span>
                    <span className="text-base font-black text-amber-400">15 km/h</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 text-center border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block font-sans">Subsequent Trains</span>
                    <span className="text-base font-black text-emerald-400">Booked Speed</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 pt-1">
                  * Note: A 40 km/h cap applies only to wrong-direction working on automatic block sections.
                </p>
              </div>

              {/* Points Clamping & Padlocking Mandate (SR 4.09) */}
              <div className="p-3.5 rounded-xl bg-railway-dark/70 border border-railway-border flex items-start space-x-3">
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Points Clamping & Padlocking Checklist (SR 4.09)</span>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Station Masters must personally ensure that all facing points and crossover connections leading to the single line in use are manually clamped and padlocked prior to dispatching Pilot Train #{defaultSheet.pilot_train_number}.
                  </p>
                </div>
              </div>

              {/* Section Controller Phone Script */}
              <div className="p-4 rounded-xl bg-railway-surface border border-railway-border space-y-2">
                <div className="flex items-center space-x-2 text-sky-400 font-bold">
                  <PhoneCall className="w-4 h-4" />
                  <span>Verbatim Section Controller Control-Phone Dispatch Script</span>
                </div>
                <div className="p-3 rounded-lg bg-black/50 border border-sky-500/20 font-mono text-[11px] text-sky-200 leading-relaxed italic">
                  "{defaultSheet.controller_phone_script}"
                </div>
              </div>
            </div>
          ) : (
            <PrintableTD602 sheet={defaultSheet} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-railway-surface border-t border-railway-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-railway-card hover:bg-railway-cardHover text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            Complies with GR 3.68 & Zonal SR Chapter 4/15
          </span>
        </div>
      </div>
    </div>
  );
};
