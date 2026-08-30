import React, { useState, useEffect } from 'react';
import { VandeBharatVectorTrain } from './VandeBharatVectorTrain';
import { RotateCw, CheckCircle2 } from 'lucide-react';
import { Section } from '../../types/section';

interface TrainCorridorBannerProps {
  selectedSection?: Section | null;
  planningDate?: string;
  onExploreClick?: () => void;
}

export const TrainCorridorBanner: React.FC<TrainCorridorBannerProps> = ({
  selectedSection,
  planningDate,
  onExploreClick,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);

  const handleReScan = () => {
    setIsScanning(true);
    setScanProgress(0);
  };

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          setIsScanning(false);
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs select-none space-y-4 font-sans">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-3">
        {/* Left: Summary description */}
        <div className="max-w-2xl space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              CRIS • RDSO • SIH PS 26027
            </span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>G&amp;SR Verified Corridor</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Automatic Block Planning &amp; Optimization System eliminates uncoordinated manual track closures. Ingests data from Track, Signal, and Electrical feeds, calculates urgency scores, and bundles them into unified repair windows that clear the timetable.
          </p>
        </div>

        {/* Right: 4 Statistical Metric Counters */}
        <div className="flex items-center space-x-6 text-right font-mono">
          <div>
            <div className="text-lg font-black text-slate-900 leading-none">130/160</div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">KM/H MPS</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-200"></div>
          <div>
            <div className="text-lg font-black text-slate-900 leading-none">40.2 KM</div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">SPAN</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-200"></div>
          <div>
            <div className="text-lg font-black text-slate-900 leading-none">20</div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">POSSESSIONS</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-200"></div>
          <div>
            <div className="text-lg font-black text-emerald-700 leading-none">17</div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">BUNDLED</div>
          </div>
        </div>
      </div>

      {/* Train Vector Illustration Container with Smooth Moving Scan */}
      <div className="relative overflow-hidden pt-1 pb-1">
        {isScanning && (
          <div
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent pointer-events-none z-10 transition-all"
            style={{ left: `${scanProgress}%` }}
          ></div>
        )}

        {/* Exact Vande Bharat Vector Train */}
        <VandeBharatVectorTrain
          trainNumber="22435"
          trainName="VANDE BHARAT EXPRESS"
          speedRating="160 KM/H MPS | PRIORITY CLASS 1 | VBE T-18 RAKE"
        />
      </div>

      {/* Scan Control Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Corridor Active: <strong>{selectedSection?.section_code || 'MAS-AJJ'}</strong> (Chennai Central — Arakkonam Jn)</span>
        </div>

        <button
          onClick={handleReScan}
          disabled={isScanning}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-700' : ''}`} />
          <span>{isScanning ? 'Scanning Telemetry...' : 'Re-Scan Corridor'}</span>
        </button>
      </div>
    </div>
  );
};
export default TrainCorridorBanner;
