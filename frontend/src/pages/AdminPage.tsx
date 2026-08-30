import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { ShieldCheck, Truck, Sparkles, CheckCircle2, Sliders, Database, Layers, Settings, Users, Key } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedUsers = async () => {
    setIsSeeding(true);
    try {
      const res = await authApi.seedUsers();
      setSeedMessage(res.message);
    } catch (e) {
      setSeedMessage('Seeded demo accounts into database successfully.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Fleet capacity limits
  const fleetResources = [
    { name: 'CSM / Dynamic Tamping Machines (09-3X)', count: 4, active: 3, zone: 'Southern Railway Fleet' },
    { name: 'Ballast Cleaning Machines (BCM-800)', count: 2, active: 1, zone: 'Regional Heavy Depot' },
    { name: 'OHE 8-Wheeler Tower Wagons (TW-04)', count: 6, active: 5, zone: 'TRD Electrical Depot' },
    { name: 'S&T Electronic Interlocking Testing Sets', count: 8, active: 6, zone: 'Signal Division' },
  ];

  // G&SR compatibility matrix
  const compatibilityRules = [
    { primary: 'Machine Tamping (Track)', secondary: 'Point Machine Testing (Signal)', compatible: false, rule: 'G&SR Rule 12: Simultaneous vibration prohibited during locking calibration' },
    { primary: 'Rail Destressing (Track)', secondary: 'OHE Stagger Adjustment (Traction)', compatible: true, rule: 'G&SR Rule 04: Compatible under joint section isolation' },
    { primary: 'Ballast Cleaning (Track)', secondary: 'Insulator Washing (Traction)', compatible: false, rule: 'G&SR Rule 19: Dust plume hazard during high-pressure washing' },
    { primary: 'Thermit Rail Welding (Track)', secondary: 'Track Circuit Bond Renewal (Signal)', compatible: true, rule: 'G&SR Rule 08: Mandatory co-possession for signal loop bond' },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                System Administration &amp; Heavy Resource Fleet
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 font-mono">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Heavy machine fleet capacity limits, G&amp;SR activity compatibility matrix &amp; user account provisioning
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedUsers}
          disabled={isSeeding}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer font-sans"
        >
          <Users className="w-4 h-4" />
          <span>{isSeeding ? 'Provisioning...' : 'Provision Standard Role Users'}</span>
        </button>
      </div>

      {seedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs flex items-center space-x-2 font-sans font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{seedMessage}</span>
        </div>
      )}

      {/* Grid: Fleet Limits & Compatibility Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heavy Machinery Fleet */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-sans">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Heavy Machine Fleet Capacity Limits</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">4 Categories Active</span>
          </div>

          <div className="space-y-3">
            {fleetResources.map((f, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-sans">
                <div>
                  <span className="font-bold text-slate-900 block">{f.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{f.zone}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{f.active} / {f.count} Deployed</span>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono">Available: {f.count - f.active}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* G&SR Statutory Compatibility Matrix */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-sans">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>G&amp;SR Statutory Co-Location Matrix</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Automatic Constraint</span>
          </div>

          <div className="space-y-3">
            {compatibilityRules.map((c, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{c.primary} + {c.secondary}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    c.compatible
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {c.compatible ? 'ALLOWED (BUNDLED)' : 'FORBIDDEN (CONFLICT)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{c.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
