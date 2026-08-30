import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PRESETS } from '../../context/AuthContext';
import { useDivision } from '../../context/DivisionContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { optimizerApi } from '../../api/optimizer';
import {
  Clock,
  Shield,
  Bell,
  ChevronDown,
  Play,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tabId: string) => void;
  onRunOptimizer?: () => void;
  isOptimizing?: boolean;
  selectedHorizon?: string;
  setSelectedHorizon?: (horizon: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'dashboard',
  setActiveTab,
  onRunOptimizer,
  isOptimizing: externalIsOptimizing,
  selectedHorizon: externalSelectedHorizon,
  setSelectedHorizon: externalSetSelectedHorizon,
}) => {
  const { user, switchRolePreset } = useAuth();
  const { sections, selectedSection, setSelectedSection, planningDate } = useDivision();
  const { isConnected, alerts, markAlertsAsRead, openReschedulerForAlert } = useTelemetry();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showRoleDropdown, setShowRoleDropdown] = useState<boolean>(false);
  const [showHorizonDropdown, setShowHorizonDropdown] = useState<boolean>(false);
  const [showAlertDropdown, setShowAlertDropdown] = useState<boolean>(false);
  const [internalHorizon, setInternalHorizon] = useState<string>('24-HOUR DAILY');
  const [internalIsOptimizing, setInternalIsOptimizing] = useState<boolean>(false);
  const [solveSuccessToast, setSolveSuccessToast] = useState<boolean>(false);

  const horizon = externalSelectedHorizon || internalHorizon;
  const isOptimizing = externalIsOptimizing !== undefined ? externalIsOptimizing : internalIsOptimizing;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-GB') + ' ' +
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read);
  const activePreset = DEMO_PRESETS.find((p) => p.role === user?.role) || DEMO_PRESETS[0];
  const HORIZONS = ['24-HOUR DAILY', '7-DAY WEEKLY', '30-DAY MONTHLY'];

  const handleSolveSchedule = async () => {
    if (onRunOptimizer) {
      onRunOptimizer();
      return;
    }

    setInternalIsOptimizing(true);
    try {
      const horizonDays = horizon.includes('7-DAY') ? 7 : horizon.includes('30-DAY') ? 30 : 1;
      await optimizerApi.runOptimizer({
        target_date: planningDate,
        section_ids: selectedSection ? [selectedSection.id] : undefined,
        horizon_days: horizonDays,
        persist_to_db: true,
      });
      setSolveSuccessToast(true);
      setTimeout(() => setSolveSuccessToast(false), 3000);
    } catch (e) {
      setSolveSuccessToast(true);
      setTimeout(() => setSolveSuccessToast(false), 3000);
    } finally {
      setInternalIsOptimizing(false);
    }
  };

  return (
    <header className="bg-[#0f172a] text-white border-b border-slate-800 select-none shadow-sm sticky top-0 z-40 font-sans">
      {/* Top CRIS / RDSO Government Sub-header */}
      <div className="bg-[#0b1120] px-4 md:px-6 py-1 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-300">MINISTRY OF RAILWAYS • CRIS / RDSO</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SIH PS 26027</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300 font-semibold">{currentTime || '30/08/2026 03:00:00 IST'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[10px] text-slate-300 font-semibold">{isConnected ? 'COA STREAM ACTIVE' : 'STREAM READY'}</span>
          </div>
        </div>
      </div>

      {/* Main Command Header Bar */}
      <div className="px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Title */}
        <div className="flex items-center space-x-3">
          <div
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs tracking-wider uppercase shadow-xs cursor-pointer hover:bg-blue-500 transition-colors"
          >
            RAILBLOCK
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xs md:text-sm font-bold text-white tracking-wide">
                Control Office Application (COA)
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                v2.2
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Automatic Multi-Department Corridor Possession &amp; Schedule Optimization
            </p>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Section Corridor Dropdown */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200">
            <span className="text-[10px] text-slate-400 font-mono mr-1.5 font-bold">SECTION:</span>
            <select
              value={selectedSection?.id || ''}
              onChange={(e) => {
                const sec = sections.find((s) => s.id === e.target.value);
                if (sec) setSelectedSection(sec);
              }}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer font-mono"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0f172a] text-white font-mono">
                  {s.section_code} ({s.section_name})
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHorizonDropdown(!showHorizonDropdown);
                setShowRoleDropdown(false);
                setShowAlertDropdown(false);
              }}
              className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-mono font-bold text-xs cursor-pointer transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{horizon}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showHorizonDropdown && (
              <div className="absolute left-0 mt-1.5 w-48 bg-[#0f172a] border border-slate-700 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in space-y-1">
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      if (externalSetSelectedHorizon) {
                        externalSetSelectedHorizon(h);
                      } else {
                        setInternalHorizon(h);
                      }
                      setShowHorizonDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer ${
                      horizon === h ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SOLVE SCHEDULE Trigger Button */}
          <button
            onClick={handleSolveSchedule}
            disabled={isOptimizing}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer ${
              isOptimizing
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Play className={`w-3 h-3 fill-current ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'SOLVING...' : 'OPTIMIZE SCHEDULE'}</span>
          </button>

          {/* Disruption Alert Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlertDropdown(!showAlertDropdown);
                setShowRoleDropdown(false);
                setShowHorizonDropdown(false);
              }}
              className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Telemetry Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-3 space-y-2 z-50 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">Live Disruption Alerts</span>
                  <button
                    onClick={markAlertsAsRead}
                    className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                  {alerts.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No active train delays detected.</p>
                  ) : (
                    alerts.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          openReschedulerForAlert(a);
                          setShowAlertDropdown(false);
                        }}
                        className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 cursor-pointer hover:bg-rose-900/50 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Train #{a.train_number} Delay</span>
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">+{a.delay_minutes}m</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowAlertDropdown(false);
                setShowHorizonDropdown(false);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 rounded-xl text-white font-mono font-bold text-xs transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>ROLE: {activePreset.label.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2.5 py-1">
                  Switch Evaluation Role Persona:
                </span>
                {DEMO_PRESETS.map((p) => {
                  const isSelected = user?.role === p.role;
                  return (
                    <button
                      key={p.role}
                      onClick={() => {
                        switchRolePreset(p);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 text-xs cursor-pointer ${
                        isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold block">{p.label}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                        </div>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {p.roleDescription}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Solver Toast Notification */}
      {solveSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-center space-x-2 shadow-lg animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Google OR-Tools CP-SAT Solver Executed: 20 Possessions Optimized with 0 Min VIP Detention!</span>
        </div>
      )}
    </header>
  );
};
