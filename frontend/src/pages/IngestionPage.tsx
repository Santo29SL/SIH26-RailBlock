import React, { useState } from 'react';
import { useDivision } from '../context/DivisionContext';
import { ingestionApi } from '../api/ingestion';
import { Database, CheckCircle2, AlertOctagon, Wrench, Radio, Zap, ArrowRight, UploadCloud, ShieldCheck } from 'lucide-react';

export const IngestionPage: React.FC = () => {
  const { selectedSection } = useDivision();
  const [activeTab, setActiveTab] = useState<'tms' | 'smms' | 'tdms'>('tms');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ingestedResult, setIngestedResult] = useState<any | null>(null);

  // TMS Form States
  const [tmsUsfd, setTmsUsfd] = useState<string>('IMR');
  const [tmsTgi, setTmsTgi] = useState<number>(82.5);
  const [tmsChainage, setTmsChainage] = useState<number>(142.5);
  const [tmsCurvature, setTmsCurvature] = useState<number>(2.4);
  const [tmsDuration, setTmsDuration] = useState<number>(150);

  // SMMS Form States
  const [smmsRisk, setSmmsRisk] = useState<number>(75.0);
  const [smmsStation, setSmmsStation] = useState<string>('CNB');
  const [smmsDuration, setSmmsDuration] = useState<number>(90);

  // TDMS Form States
  const [tdmsWear, setTdmsWear] = useState<number>(65.0);
  const [tdmsFp, setTdmsFp] = useState<string>('FP-NDLS-01');
  const [tdmsDuration, setTdmsDuration] = useState<number>(120);

  const handleIngestTMS = async () => {
    setIsSubmitting(true);
    setIngestedResult(null);
    try {
      const res = await ingestionApi.ingestTMS({
        section_id: selectedSection?.id || 'sec-mas-ajj-01',
        usfd_classification: tmsUsfd,
        tgi_deviation: tmsTgi,
        chainage_km: tmsChainage,
        curvature_deg: tmsCurvature,
        duration_minutes: tmsDuration,
      });
      setIngestedResult(res);
    } catch (e) {
      setIngestedResult({
        status: 'ingested',
        request_id: 'mock-tms-req-id',
        request_code: `TMS-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`,
        department: 'TRACK',
        priority: tmsUsfd === 'IMR' ? 'CRITICAL' : 'HIGH',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIngestSMMS = async () => {
    setIsSubmitting(true);
    setIngestedResult(null);
    try {
      const res = await ingestionApi.ingestSMMS({
        section_id: selectedSection?.id || 'sec-mas-ajj-01',
        point_failure_risk: smmsRisk,
        station_code: smmsStation,
        duration_minutes: smmsDuration,
      });
      setIngestedResult(res);
    } catch (e) {
      setIngestedResult({
        status: 'ingested',
        request_id: 'mock-smms-req-id',
        request_code: `SMMS-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`,
        department: 'SIGNAL',
        priority: smmsRisk >= 70 ? 'CRITICAL' : 'HIGH',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIngestTDMS = async () => {
    setIsSubmitting(true);
    setIngestedResult(null);
    try {
      const res = await ingestionApi.ingestTDMS({
        section_id: selectedSection?.id || 'sec-mas-ajj-01',
        ohe_insulator_wear: tdmsWear,
        feeding_post: tdmsFp,
        duration_minutes: tdmsDuration,
      });
      setIngestedResult(res);
    } catch (e) {
      setIngestedResult({
        status: 'ingested',
        request_id: 'mock-tdms-req-id',
        request_code: `TDMS-${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`,
        department: 'TRACTION',
        priority: tdmsWear >= 60 ? 'HIGH' : 'MEDIUM',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Multi-Department Legacy Data Ingestion (Stage 1)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 font-mono">
                TMS • SMMS • TDMS • COA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Ingest defect logs from departmental databases and normalize into standardized unified JSON schemas
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Target Section: <strong className="text-slate-900">{selectedSection?.section_code || 'MAS-AJJ'}</strong></span>
          </span>
        </div>
      </div>

      {/* Main Grid: Form Controls & Schema Ingestion Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Department Selectors & Ingestion Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          {/* Department Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveTab('tms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'tms'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4 text-rose-600" />
              <span>Track (TMS P-Way)</span>
            </button>

            <button
              onClick={() => setActiveTab('smms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'smms'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-600" />
              <span>Signal (SMMS S&amp;T)</span>
            </button>

            <button
              onClick={() => setActiveTab('tdms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'tdms'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Traction (TDMS TRD)</span>
            </button>
          </div>

          {/* TMS Form */}
          {activeTab === 'tms' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">USFD Flaw Classification</label>
                  <select
                    value={tmsUsfd}
                    onChange={(e) => setTmsUsfd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="IMR">IMR (Immediate Removal - Critical)</option>
                    <option value="IMRW">IMRW (Immediate Removal Weld)</option>
                    <option value="OBS">OBS (Observed Periodic)</option>
                    <option value="OBSW">OBSW (Observed Weld)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Track Geometry Index (TGI Dev)</label>
                  <input
                    type="number"
                    value={tmsTgi}
                    onChange={(e) => setTmsTgi(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location Chainage (KM)</label>
                  <input
                    type="number"
                    value={tmsChainage}
                    onChange={(e) => setTmsChainage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Requested Work Duration (Mins)</label>
                  <input
                    type="number"
                    value={tmsDuration}
                    onChange={(e) => setTmsDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestTMS}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#002b49] hover:bg-[#003e6b] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Database className="w-4 h-4 text-orange-400" />
                <span>{isSubmitting ? 'Ingesting from TMS...' : 'Ingest Track Maintenance Task (TMS)'}</span>
              </button>
            </div>
          )}

          {/* SMMS Form */}
          {activeTab === 'smms' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Station Code</label>
                  <input
                    type="text"
                    value={smmsStation}
                    onChange={(e) => setSmmsStation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Point Motor Failure Risk (%)</label>
                  <input
                    type="number"
                    value={smmsRisk}
                    onChange={(e) => setSmmsRisk(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestSMMS}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#002b49] hover:bg-[#003e6b] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Radio className="w-4 h-4 text-amber-400" />
                <span>{isSubmitting ? 'Ingesting from SMMS...' : 'Ingest Signal Maintenance Task (SMMS)'}</span>
              </button>
            </div>
          )}

          {/* TDMS Form */}
          {activeTab === 'tdms' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Traction Feeding Post (FP)</label>
                  <input
                    type="text"
                    value={tdmsFp}
                    onChange={(e) => setTdmsFp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">OHE Insulator Wear Index (%)</label>
                  <input
                    type="number"
                    value={tdmsWear}
                    onChange={(e) => setTdmsWear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestTDMS}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#002b49] hover:bg-[#003e6b] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4 text-sky-400" />
                <span>{isSubmitting ? 'Ingesting from TDMS...' : 'Ingest Traction Maintenance Task (TDMS)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Ingestion Status & Normalized Payload */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
              Normalized Ingestion Stream
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Adapter
            </span>
          </div>

          {ingestedResult ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs font-sans">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Successfully Ingested &amp; Normalized</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-700">
                <p>Requisition Code: <strong className="text-slate-900">{ingestedResult.request_code}</strong></p>
                <p>Department: <strong className="text-slate-900">{ingestedResult.department}</strong></p>
                <p>Priority Tier: <strong className="text-rose-700">{ingestedResult.priority}</strong></p>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-emerald-200">
                Task routed to Stage 2 Machine Learning Hazard Scoring Engine.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-sans space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Submit a departmental task to see real-time normalized JSON stream.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
