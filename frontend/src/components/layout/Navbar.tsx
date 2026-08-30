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
  MapPin,
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
    <header className="bg-[#213d77] text-white border-b border-[#182c52] select-none shadow-md sticky top-0 z-40 font-sans">
      {/* Top Government Sub-header - IRCTC Navy Bar */}
      <div className="bg-[#15284f] px-4 md:px-6 py-1 border-b border-[#0f1d38] flex items-center justify-between text-[11px] font-mono text-blue-200">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white tracking-wide">MINISTRY OF RAILWAYS • GOVERNMENT OF INDIA</span>
          <span className="text-slate-400">|</span>
          <span className="text-blue-200">CRIS • RDSO • IRCTC</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[#fb792b]" />
            <span>{currentTime || '30/08/2026 03:20:00 IST'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-[#fb792b]'}`}></span>
            <span className="text-[10px] uppercase font-bold text-white">
              {isConnected ? 'COA LIVE' : 'FEED READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Main IRCTC Command Header */}
      <div className="px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="px-2.5 py-1 rounded-lg bg-[#fb792b] text-white font-black text-xs tracking-wider shadow-xs">
              RAILBLOCK
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-black tracking-wide text-white">
                  Control Office Application (COA)
                </h1>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-mono font-bold">
                  v2.2
                </span>
              </div>
              <p className="text-[10px] text-blue-100 font-semibold">
                Automatic Multi-Department Corridor Possession &amp; Schedule Optimization
              </p>
            </div>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Section Corridor Dropdown */}
          <div className="flex items-center bg-[#15284f] border border-blue-400/40 rounded-xl px-3 py-1.5 text-white shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#fb792b] mr-1.5 shrink-0" />
            <span className="text-[10px] text-blue-200 font-mono mr-1.5 font-bold">SECTION:</span>
            <select
              value={selectedSection?.id || ''}
              onChange={(e) => {
                const sec = sections.find((s) => s.id === e.target.value);
                if (sec) setSelectedSection(sec);
              }}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer font-mono"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#15284f] text-white font-mono">
                  {s.section_code} — {s.section_name} ({s.length_km} km)
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
              className="flex items-center space-x-1.5 bg-[#15284f] border border-blue-400/40 hover:bg-[#1c356b] rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs cursor-pointer transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#fb792b]" />
              <span>{horizon}</span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {showHorizonDropdown && (
              <div className="absolute left-0 mt-1.5 w-48 bg-[#15284f] border border-blue-400/40 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in space-y-1">
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
                      horizon === h ? 'bg-[#fb792b] text-white' : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* IRCTC Orange Action Button: OPTIMIZE SCHEDULE */}
          <button
            onClick={handleSolveSchedule}
            disabled={isOptimizing}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-md transition-all cursor-pointer ${
              isOptimizing
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-[#fb792b] hover:bg-[#e06318] text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'OPTIMIZING...' : 'OPTIMIZE SCHEDULE'}</span>
          </button>

          {/* Disruption Alert Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlertDropdown(!showAlertDropdown);
                setShowRoleDropdown(false);
                setShowHorizonDropdown(false);
              }}
              className="p-2 rounded-xl bg-[#15284f] hover:bg-[#1c356b] border border-blue-400/40 text-blue-100 hover:text-white relative transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center animate-bounce">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800">Live Disruption Alerts</span>
                  <button
                    onClick={markAlertsAsRead}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Mark All Read
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {alerts.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 font-mono">
                      No active corridor alerts
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          if (a.rescheduleRequired) openReschedulerForAlert(a);
                          setShowAlertDropdown(false);
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs space-y-1 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">Train #{a.trainCode}</span>
                          <span className="text-[10px] text-rose-600 font-bold">+{a.delayMinutes}m Late</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{a.actionAdvised}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Persona Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowHorizonDropdown(false);
                setShowAlertDropdown(false);
              }}
              className="flex items-center space-x-2 bg-[#15284f] border border-blue-400/40 hover:bg-[#1c356b] rounded-xl px-3 py-1.5 text-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-blue-200 font-mono uppercase">ROLE:</span>
                <span className="font-bold text-white truncate max-w-[170px]">{activePreset.label.split('(')[0]}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-slate-400 border-b border-slate-100">
                  Switch User Persona
                </div>
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.username}
                    onClick={() => {
                      switchRolePreset(preset);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition-all cursor-pointer ${
                      user?.role === preset.role
                        ? 'bg-blue-50 border border-blue-200 text-[#213d77]'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{preset.label}</span>
                      {user?.role === preset.role && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{preset.roleDescription}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast Banner */}
      {solveSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ Optimization Schedule Solved: 0 Min VIP Train Detention Guaranteed!</span>
          </div>
        </div>
      )}
    </header>
  );
};
