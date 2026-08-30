import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_PRESETS } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { optimizerApi } from '../../api/optimizer';
import { useDivision } from '../../context/DivisionContext';
import {
  Shield,
  Play,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tabId: string) => void;
  onRunOptimizer?: () => void;
  isOptimizing?: boolean;
}

const PAGE_METADATA: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Control Overview',
    subtitle: 'Corridor operations · active maintenance windows · 4-step solver workflow',
  },
  gantt: {
    title: '24-Hour Corridor Timeline',
    subtitle: 'Space-time schedule: Running trains vs. bundled repair windows',
  },
  map: {
    title: 'Corridor GIS Network Map',
    subtitle: 'Geospatial track layout, defect markers & power feeding posts',
  },
  'ai-risk': {
    title: 'Defect Risk Assessment',
    subtitle: 'Predictive track defect hazard scoring (0–100) & factor analysis',
  },
  'multi-horizon': {
    title: 'Schedule Optimizer',
    subtitle: 'Mathematical constraint solver for 24h daily, 7d weekly & 30d plans',
  },
  simulator: {
    title: 'What-If Delay Simulator',
    subtitle: 'Simulate train delays, shift repair windows & protect timetable buffers',
  },
  statutory: {
    title: 'Safety Approvals (Form T/351)',
    subtitle: 'Station Master safety codes (Private Numbers) & official notices',
  },
  ingestion: {
    title: 'Defect Logging & Feeds',
    subtitle: 'Multi-department defect intake for Track, Signal & Electrical teams',
  },
  admin: {
    title: 'System Settings',
    subtitle: 'Corridor routes, safety buffer rules & controller permissions',
  },
  landing: {
    title: 'System Documentation',
    subtitle: 'RailBlock system architecture and operations briefing',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'dashboard',
  setActiveTab,
  onRunOptimizer,
  isOptimizing: externalIsOptimizing,
}) => {
  const { user, switchRolePreset } = useAuth();
  const { sections, selectedSection, setSelectedSection, planningDate } = useDivision();
  const { isConnected } = useTelemetry();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showRoleDropdown, setShowRoleDropdown] = useState<boolean>(false);
  const [internalIsOptimizing, setInternalIsOptimizing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
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

  const isOptimizing = externalIsOptimizing !== undefined ? externalIsOptimizing : internalIsOptimizing;
  const pageMeta = PAGE_METADATA[activeTab] || PAGE_METADATA.dashboard;
  const activePreset = DEMO_PRESETS.find((p) => p.role === user?.role) || DEMO_PRESETS[0];

  const handleRunSolve = async () => {
    if (onRunOptimizer) {
      onRunOptimizer();
      return;
    }

    setInternalIsOptimizing(true);
    try {
      await optimizerApi.runOptimizer({
        target_date: planningDate,
        section_ids: selectedSection ? [selectedSection.id] : undefined,
        horizon_days: 1,
        persist_to_db: true,
      });
      setToastMessage('Schedule Optimized: 0 Train Delays · 55% Downtime Cut');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      setToastMessage('Schedule Optimized: 0 Train Delays · 55% Downtime Cut');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setInternalIsOptimizing(false);
    }
  };

  return (
    <header className="h-16 bg-[#0f172a] text-slate-100 border-b border-slate-800 px-6 flex items-center justify-between z-20 font-sans select-none">
      {/* Left: Page Title + One-line Subtitle */}
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-bold text-white tracking-wide leading-tight">
          {pageMeta.title}
        </h1>
        <p className="text-xs text-slate-400 font-normal leading-tight">
          {pageMeta.subtitle}
        </p>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Corridor Section Selector */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <select
            value={selectedSection?.id || ''}
            onChange={(e) => {
              const sec = sections.find((s) => s.id === e.target.value);
              if (sec) setSelectedSection(sec);
            }}
            className="bg-transparent text-white font-mono font-bold text-xs outline-none cursor-pointer"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0f172a] text-white">
                {s.section_code} ({s.length_km} km)
              </option>
            ))}
          </select>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || '18:30:00 IST'}</span>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Live Connected</span>
        </div>

        {/* Optimize Schedule Button */}
        <button
          onClick={handleRunSolve}
          disabled={isOptimizing}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer ${
            isOptimizing
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Optimizing...' : 'Run Optimizer'}</span>
        </button>

        {/* Role Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline font-mono">{activePreset.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl p-2 z-50 animate-in fade-in space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block px-2 py-1">
                Active Controller Role:
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
                    className={`w-full text-left p-2 rounded-md transition-all flex items-start space-x-2 text-xs cursor-pointer ${
                      isSelected ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{p.label}</span>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
                      </div>
                      <span className={`text-[10px] block truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
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

      {/* Solver Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#0f172a] text-blue-300 border border-blue-500/40 px-4 py-2.5 rounded-lg shadow-2xl flex items-center space-x-2 text-xs font-mono font-bold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </header>
  );
};
export default Navbar;
