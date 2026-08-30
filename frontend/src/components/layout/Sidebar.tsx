import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  MapPin,
  SlidersHorizontal,
  Calendar,
  FileCheck2,
  Activity,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  badge?: string;
  requiredRoles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Master Control Room Dispatch',
  },
  {
    id: 'gantt',
    label: 'Space-Time Gantt',
    icon: Layers,
    description: 'Train Timetable vs Repair Slots',
    badge: 'LIVE',
  },
  {
    id: 'map',
    label: 'GIS Track Map',
    icon: MapPin,
    description: 'Corridor Route & Defect Pins',
  },
  {
    id: 'simulator',
    label: 'What-If Simulator',
    icon: SlidersHorizontal,
    description: 'Disruption & Delay Sandbox',
  },
  {
    id: 'multi-horizon',
    label: 'Multi-Horizon Planner',
    icon: Calendar,
    description: '24h / 7d / 30d Optimization',
  },
  {
    id: 'statutory',
    label: 'Form T/351 Portal',
    icon: FileCheck2,
    description: 'Station Master Private Number',
  },
  {
    id: 'ai-risk',
    label: 'Risk Analysis & SHAP',
    icon: Activity,
    description: 'Predictive Asset Hazard Scoring',
  },
  {
    id: 'ingestion',
    label: 'Data Ingestion',
    icon: Database,
    description: 'TMS, SMMS & TDMS Feeds',
  },
  {
    id: 'admin',
    label: 'System Settings',
    icon: Settings,
    description: 'User Roles & System Config',
  },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <aside
      className={`h-screen sticky top-0 shrink-0 bg-[#0f172a] text-white border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 select-none overflow-y-auto font-sans ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-[#0f172a] z-10">
          {!collapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="px-2 py-1 rounded-lg bg-blue-600 font-black text-xs text-white tracking-wider">
                RB
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">CONTROL OFFICE</span>
                <span className="text-[9px] text-slate-400 font-mono">CRIS • RDSO • SIH</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto px-2 py-1 rounded bg-blue-600 font-black text-xs text-white">
              RB
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 p-2.5 rounded-2xl transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 group-hover:text-white'}`}>
                  <IconComp className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isActive ? 'bg-white text-blue-600' : 'bg-slate-800 text-blue-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] block truncate font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Role Card at Bottom */}
      <div className="p-3 border-t border-slate-800/80 sticky bottom-0 bg-[#0f172a]">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2.5 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-white block truncate">
                {user?.role?.replace('_', ' ') || 'SECTION CONTROLLER'}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono block font-semibold">G&amp;SR Authorized</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
