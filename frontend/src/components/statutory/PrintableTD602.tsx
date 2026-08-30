import React from 'react';
import { FormTD602SheetPayload } from '../../types/statutory';
import { Printer, ShieldAlert, FileText } from 'lucide-react';

interface PrintableTD602Props {
  sheet: FormTD602SheetPayload;
}

export const PrintableTD602: React.FC<PrintableTD602Props> = ({ sheet }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Statutory Form T/D 602 Authority</span>
        </button>
      </div>

      <div className="printable-area p-8 bg-white text-black font-serif border-2 border-black rounded-lg max-w-2xl mx-auto shadow-2xl space-y-6">
        {/* Official Header */}
        <div className="text-center border-b-2 border-black pb-3">
          <h2 className="text-xl font-bold uppercase tracking-wider">INDIAN RAILWAYS</h2>
          <h3 className="text-sm font-semibold uppercase mt-0.5">{sheet.zone} — {sheet.division} DIVISION</h3>
          <h1 className="text-base font-bold uppercase underline mt-2 text-rose-900">
            {sheet.form_name}: {sheet.form_title}
          </h1>
          <p className="text-[11px] italic mt-1 font-sans">
            (Issued under statutory authority of {sheet.statutory_rule})
          </p>
        </div>

        {/* Section Context */}
        <div className="grid grid-cols-2 gap-3 text-xs font-sans p-3 bg-slate-100 border border-black/40">
          <div><span className="font-bold">Block Section:</span> <span className="font-mono font-bold">{sheet.section_code} ({sheet.section_name})</span></div>
          <div><span className="font-bold">Date & Time:</span> <span className="font-mono">{sheet.date_time}</span></div>
          <div><span className="font-bold">Obstructed Line:</span> <span className="font-mono text-rose-800 font-bold">{sheet.line_obstructed}</span></div>
          <div><span className="font-bold">Single Line in Use:</span> <span className="font-mono text-emerald-800 font-bold">{sheet.line_in_use}</span></div>
          <div><span className="font-bold">Pilot Train No:</span> <span className="font-mono font-bold">#{sheet.pilot_train_number}</span></div>
          <div><span className="font-bold">Station Master PN:</span> <span className="font-mono font-bold text-rose-800">{sheet.station_master_private_number}</span></div>
        </div>

        {/* 3-Part Authority Specification */}
        <div className="space-y-3 text-xs font-sans">
          {/* Part 1: Line Clear Ticket */}
          <div className="p-3 border border-black bg-slate-50">
            <span className="font-bold uppercase tracking-wide block mb-1 text-slate-800">PART I: PAPER LINE CLEAR TICKET</span>
            <p className="font-mono text-[11px] leading-relaxed">{sheet.part_1_line_clear_ticket}</p>
          </div>

          {/* Part 2: Authority to Pass Signals */}
          <div className="p-3 border border-black bg-slate-50">
            <span className="font-bold uppercase tracking-wide block mb-1 text-slate-800">PART II: AUTHORITY TO PASS SIGNALS AT 'ON'</span>
            <p className="font-mono text-[11px] leading-relaxed">{sheet.part_2_authority_to_pass_signals_at_on}</p>
          </div>

          {/* Part 3: Statutory Caution Order & Speed Ceilings */}
          <div className="p-3 border-2 border-rose-800 bg-rose-50 text-rose-950">
            <span className="font-bold uppercase tracking-wide block mb-1 text-rose-900">PART III: CAUTION ORDER SPEED RESTRICTIONS</span>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
              <li><span className="font-bold">First Pilot Train:</span> {sheet.part_3_caution_order.pilot_train_speed}</li>
              <li><span className="font-bold">Facing Points & Crossovers:</span> {sheet.part_3_caution_order.facing_points_speed}</li>
              <li><span className="font-bold">Subsequent Running Trains:</span> {sheet.part_3_caution_order.subsequent_train_speed}</li>
              <li><span className="font-bold">Clamping Mandate:</span> {sheet.part_3_caution_order.clamping_padlocking_mandate}</li>
            </ul>
          </div>
        </div>

        {/* Section Controller Phone Script */}
        <div className="p-3 border border-dashed border-black bg-amber-50 text-xs font-sans">
          <span className="font-bold uppercase block mb-1 text-amber-900">SECTION CONTROLLER CONTROL-PHONE DISPATCH SCRIPT</span>
          <p className="font-mono text-[11px] italic bg-white p-2 border border-black/20">
            "{sheet.controller_phone_script}"
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-black text-xs font-sans">
          <div className="text-center">
            <div className="h-10 border-b border-black flex items-end justify-center font-mono italic">
              Loco Pilot / Guard
            </div>
            <span className="font-bold block mt-1">Signature of Loco Pilot & Guard</span>
          </div>

          <div className="text-center">
            <div className="h-10 border-b border-black flex items-end justify-center font-mono italic">
              Station Master
            </div>
            <span className="font-bold block mt-1">Signature of Station Master</span>
            <span className="text-[10px] text-slate-600 font-mono">PN: {sheet.station_master_private_number}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
