import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  SlidersHorizontal,
  Activity,
  FileCheck2,
  Database,
  Layers,
  Settings,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  subDescription: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'OPERATIONS',
    items: [
      {
        id: 'dashboard',
        label: 'Control Overview',
        subDescription: 'Corridor status & active windows',
        icon: LayoutDashboard,
      },
      {
        id: 'gantt',
        label: 'Corridor Timeline',
        subDescription: '24h train paths vs. repair windows',
        icon: Calendar,
        badge: 'LIVE',
      },
      {
        id: 'map',
        label: 'Corridor GIS Map',
        subDescription: 'Geospatial tracks & power posts',
        icon: MapPin,
      },
    ],
  },
  {
    title: 'OPTIMIZATION & ANALYSIS',
    items: [
      {
        id: 'ai-risk',
        label: 'Defect Risk Assessment',
        subDescription: 'Hazard scoring & contributing factors',
        icon: Activity,
      },
      {
        id: 'multi-horizon',
        label: 'Schedule Optimizer',
        subDescription: '24h, 7-day & 30-day solver planning',
        icon: Layers,
        badge: 'OR-TOOLS',
      },
      {
        id: 'simulator',
        label: 'What-If Delay Simulator',
        subDescription: 'Simulate train delays & shifts',
        icon: Clock,
      },
    ],
  },
  {
    title: 'SAFETY & DATA FEEDS',
    items: [
      {
        id: 'statutory',
        label: 'Safety Approvals (T/351)',
        subDescription: 'Station Master codes & notice',
        icon: FileCheck2,
      },
      {
        id: 'ingestion',
        label: 'Defect Logging & Feeds',
        subDescription: 'Track, Signal & Power telemetry',
        icon: Database,
      },
      {
        id: 'admin',
        label: 'System Settings',
        subDescription: 'Corridor routes & parameters',
        icon: Settings,
      },
    ],
  },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  return (
    <aside className="w-[235px] h-screen sticky top-0 shrink-0 bg-[#0f172a] text-slate-100 border-r border-slate-800 flex flex-col justify-between z-30 select-none font-sans">
      {/* Brand Header */}
      <div className="overflow-y-auto flex-1">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-sm flex items-center justify-center tracking-wider">
              RB
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight tracking-wider">
                RAILBLOCK COA
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                Control Office System
              </span>
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            v2.4
          </span>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="p-2 space-y-4">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                {section.title}
              </span>

              {section.items.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-blue-900/60 text-white font-semibold border-l-2 border-blue-400 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border-l-2 border-transparent'
                    }`}
                  >
                    <IconComp
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[8px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              isActive
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] block truncate font-normal ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {item.subDescription}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Documentation Link */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('landing')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group ${
                activeTab === 'landing'
                  ? 'bg-blue-900/60 text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate">System Documentation</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  Architecture &amp; Features
                </span>
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer Strip at Bottom of Sidebar */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-[#0b1120] shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-[11px]">System Active</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            COA Live
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
          <p className="text-slate-300 font-medium truncate">NDLS ↔ GZB · 46.2 km Corridor</p>
          <p className="text-slate-500 text-[9px]">Indian Railways · Control Office</p>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
