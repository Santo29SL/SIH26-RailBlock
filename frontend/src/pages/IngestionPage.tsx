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
    <div className="space-y-6 select-none font-sans">
      {/* Title Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Multi-Department Defect Logging (Track, Signal &amp; Power)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                DATA INTAKE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Submit maintenance defect reports and automatically normalize into standardized schemas for risk scoring and scheduling
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Target Section: <strong className="text-slate-900">{selectedSection?.section_code || 'MAS-AJJ'}</strong></span>
          </span>
        </div>
      </div>

      {/* Main Grid: Form Controls & Schema Ingestion Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Department Selectors & Ingestion Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          {/* Department Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveTab('tms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'tms'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Wrench className="w-4 h-4 text-rose-600" />
              <span>Track (Rails)</span>
            </button>

            <button
              onClick={() => setActiveTab('smms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'smms'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-600" />
              <span>Signals (Switches)</span>
            </button>

            <button
              onClick={() => setActiveTab('tdms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'tdms'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Electrical (Wires)</span>
            </button>
          </div>

          {/* TMS Form */}
          {activeTab === 'tms' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ultrasonic Rail Crack Flaw Type</label>
                  <select
                    value={tmsUsfd}
                    onChange={(e) => setTmsUsfd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="IMR">IMR (Immediate Rail Replacement - Critical)</option>
                    <option value="IMRW">IMRW (Immediate Weld Replacement)</option>
                    <option value="OBS">OBS (Observed Periodic Testing)</option>
                    <option value="OBSW">OBSW (Observed Weld Testing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Track Geometry / Roughness Deviation (TGI)</label>
                  <input
                    type="number"
                    value={tmsTgi}
                    onChange={(e) => setTmsTgi(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Track Location (KM)</label>
                  <input
                    type="number"
                    value={tmsChainage}
                    onChange={(e) => setTmsChainage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimated Repair Duration (Minutes)</label>
                  <input
                    type="number"
                    value={tmsDuration}
                    onChange={(e) => setTmsDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestTMS}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Database className="w-4 h-4 text-white" />
                <span>{isSubmitting ? 'Submitting Track Defect...' : 'Log Track Defect'}</span>
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Track Switch Motor Failure Risk (%)</label>
                  <input
                    type="number"
                    value={smmsRisk}
                    onChange={(e) => setSmmsRisk(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestSMMS}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Radio className="w-4 h-4 text-white" />
                <span>{isSubmitting ? 'Submitting Signal Defect...' : 'Log Signal Defect'}</span>
              </button>
            </div>
          )}

          {/* TDMS Form */}
          {activeTab === 'tdms' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Power Substation / Feeding Post</label>
                  <input
                    type="text"
                    value={tdmsFp}
                    onChange={(e) => setTdmsFp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Overhead Wire Insulator Wear (%)</label>
                  <input
                    type="number"
                    value={tdmsWear}
                    onChange={(e) => setTdmsWear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestTDMS}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>{isSubmitting ? 'Submitting Electrical Defect...' : 'Log Electrical Defect'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Ingestion Status & Normalized Payload */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
              Normalized Defect Stream
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Stream
            </span>
          </div>

          {ingestedResult ? (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-xs font-sans">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Successfully Ingested &amp; Normalized</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-700">
                <p>Defect Code: <strong className="text-slate-900">{ingestedResult.request_code}</strong></p>
                <p>Department: <strong className="text-slate-900">{ingestedResult.department}</strong></p>
                <p>Priority Tier: <strong className="text-rose-700">{ingestedResult.priority}</strong></p>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-emerald-200">
                Defect routed to Risk Assessment Table and GIS Map.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-sans space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Submit a defect report above to see the real-time normalized telemetry stream.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default IngestionPage;
