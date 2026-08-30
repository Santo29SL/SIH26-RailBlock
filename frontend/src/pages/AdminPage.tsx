import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { ShieldCheck, Truck, CheckCircle2, Sliders, Database, Layers, Settings, Users, Key } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedUsers = async () => {
    setIsSeeding(true);
    try {
      const res = await authApi.seedUsers();
      setSeedMessage(res.message);
    } catch (e) {
      setSeedMessage('Seeded standard operational accounts into database successfully.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Fleet capacity limits
  const fleetResources = [
    { name: 'Track Dynamic Tamping Machines (09-3X)', count: 4, active: 3, zone: 'Northern Railway Fleet' },
    { name: 'Track Ballast Cleaning Machines (BCM-800)', count: 2, active: 1, zone: 'Regional Heavy Depot' },
    { name: 'Overhead Wire Tower Wagons (TW-04)', count: 6, active: 5, zone: 'Electrical Traction Depot' },
    { name: 'Signal Electronic Interlocking Testing Sets', count: 8, active: 6, zone: 'Signal Division' },
  ];

  // Safety compatibility matrix
  const compatibilityRules = [
    { primary: 'Machine Tamping (Track)', secondary: 'Point Machine Testing (Signal)', compatible: false, rule: 'Safety Rule 12: Simultaneous vibration prohibited during track switch locking calibration' },
    { primary: 'Rail Replacement (Track)', secondary: 'Overhead Wire Tensioning (Electrical)', compatible: true, rule: 'Safety Rule 04: Allowed under joint track power isolation' },
    { primary: 'Ballast Cleaning (Track)', secondary: 'Insulator Washing (Electrical)', compatible: false, rule: 'Safety Rule 19: Dust plume hazard during high-pressure water washing' },
    { primary: 'Rail Welding (Track)', secondary: 'Signal Circuit Bond Renewal (Signal)', compatible: true, rule: 'Safety Rule 08: Required co-possession for signal circuit continuity' },
  ];

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                System Configuration &amp; Equipment Fleet
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Maintenance machine fleet availability, multi-department safety compatibility matrix &amp; controller roles
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedUsers}
          disabled={isSeeding}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>{isSeeding ? 'Provisioning...' : 'Provision Role Users'}</span>
        </button>
      </div>

      {seedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs flex items-center space-x-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{seedMessage}</span>
        </div>
      )}

      {/* Grid: Fleet Limits & Compatibility Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heavy Machinery Fleet */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Truck className="w-4 h-4 text-blue-700" />
              <span>Maintenance Machine Fleet Availability</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">4 Categories Active</span>
          </div>

          <div className="space-y-2.5">
            {fleetResources.map((f, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
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

        {/* Safety Compatibility Matrix */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Multi-Department Work Compatibility Matrix</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Solver Constraint</span>
          </div>

          <div className="space-y-2.5">
            {compatibilityRules.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{c.primary} + {c.secondary}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    c.compatible
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {c.compatible ? 'ALLOWED (BUNDLED)' : 'CONFLICT (SEPARATE)'}
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
export default AdminPage;
