import React from 'react';
import { FormT351NoticePayload } from '../../types/statutory';
import { Printer } from 'lucide-react';

interface PrintableT351Props {
  notice: FormT351NoticePayload;
}

export const PrintableT351: React.FC<PrintableT351Props> = ({ notice }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Statutory Form T/351</span>
        </button>
      </div>

      <div className="printable-area p-8 bg-white text-black font-serif border-2 border-black rounded-lg max-w-2xl mx-auto shadow-2xl">
        {/* Official IR Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">INDIAN RAILWAYS</h2>
          <h3 className="text-sm font-semibold uppercase mt-0.5">SOUTHERN RAILWAY — CHENNAI DIVISION</h3>
          <h1 className="text-base font-bold uppercase underline mt-2">
            FORM T/351: NOTICE OF DISCONNECTION / RECONNECTION OF TRACK & ASSETS
          </h1>
          <p className="text-[11px] italic mt-1 font-sans">(Prescribed under General Rules 3.68 & Indian Railways P-Way / S&T Manuals)</p>
        </div>

        {/* Form Details */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-4">
          <div>
            <span className="font-bold">Notice Serial No:</span> <span className="font-mono">{notice.notice_number}</span>
          </div>
          <div>
            <span className="font-bold">Date of Possession:</span> <span className="font-mono">{notice.date}</span>
          </div>
          <div>
            <span className="font-bold">Block Section:</span> <span className="font-mono font-bold">{notice.section_code}</span>
          </div>
          <div>
            <span className="font-bold">Station Master Station:</span> <span className="font-mono">{notice.station_code}</span>
          </div>
        </div>

        {/* Section Description */}
        <div className="text-xs font-sans space-y-3 mb-6">
          <div className="p-2.5 border border-black/50 bg-slate-50">
            <span className="font-bold block mb-1">1. Nature of Physical Work & Assets Disconnected:</span>
            <p className="font-mono">{notice.work_nature}</p>
          </div>

          <div className="p-2.5 border border-black/50 bg-slate-50">
            <span className="font-bold block mb-1">2. Line & Track Track Circuit Affected:</span>
            <p className="font-mono">{notice.line_affected}</p>
          </div>
        </div>

        {/* Disconnection Private Number Authorization Box */}
        <div className="p-4 border-2 border-dashed border-black bg-amber-50 mb-6 text-xs font-sans">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold uppercase tracking-wide">STATUTORY DISCONNECTION AUTHORIZATION (STAGE 1)</span>
            <span className="font-bold text-emerald-800 font-mono">STATUS: {notice.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-600 block text-[10px]">STATION MASTER PRIVATE NO (PN)</span>
              <span className="font-black text-sm text-rose-800">{notice.disconnection_private_number}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[10px]">TIME OF DISCONNECTION</span>
              <span className="font-black text-sm">{notice.disconnection_time} hrs</span>
            </div>
          </div>
        </div>

        {/* Reconnection & TSR Clearance (Stage 2) */}
        {notice.reconnection_private_number ? (
          <div className="p-4 border-2 border-black bg-cyan-50 mb-6 text-xs font-sans">
            <span className="font-bold uppercase tracking-wide block mb-2">STATUTORY RECONNECTION & CLEARANCE (STAGE 2)</span>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-600 block text-[10px]">RECONNECTION PRIVATE NO (PN)</span>
                <span className="font-black text-sm text-cyan-900">{notice.reconnection_private_number}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">TIME OF RECONNECTION</span>
                <span className="font-black text-sm">{notice.reconnection_time || 'N/A'} hrs</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-cyan-200">
                <span className="font-bold text-[10px]">POST-WORK TEMPORARY SPEED RESTRICTION (TSR):</span>{' '}
                <span className="font-black font-mono text-rose-800">
                  {notice.tsr_imposed ? `${notice.tsr_speed_kmph} km/h (Caution Order Imposed)` : 'MPS Restored (No TSR)'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-black text-xs font-sans">
          <div className="text-center">
            <div className="h-10 border-b border-black flex items-end justify-center font-mono italic">
              {notice.field_engineer_name}
            </div>
            <span className="font-bold block mt-1">Signature of Field Engineer</span>
            <span className="text-[10px] text-slate-600 font-mono">{notice.field_engineer_designation}</span>
          </div>

          <div className="text-center">
            <div className="h-10 border-b border-black flex items-end justify-center font-mono italic">
              {notice.station_master_name}
            </div>
            <span className="font-bold block mt-1">Signature of Station Master</span>
            <span className="text-[10px] text-slate-600 font-mono">Station: {notice.station_code}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
