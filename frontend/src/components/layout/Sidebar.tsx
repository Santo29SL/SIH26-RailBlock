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
      className={`h-screen sticky top-0 shrink-0 bg-[#182c52] text-white border-r border-[#101e38] flex flex-col justify-between transition-all duration-300 z-30 select-none overflow-y-auto font-sans shadow-lg ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#101e38] flex items-center justify-between sticky top-0 bg-[#182c52] z-10">
          {!collapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="px-2.5 py-1 rounded-lg bg-[#fb792b] font-black text-xs text-white tracking-wider shadow-xs">
                IRCTC
              </div>
              <div>
                <span className="text-xs font-black text-white block leading-tight tracking-wide">CONTROL OFFICE</span>
                <span className="text-[9px] text-blue-200 font-mono font-semibold">CRIS • RDSO • COA</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto px-2 py-1 rounded bg-[#fb792b] font-black text-xs text-white">
              IR
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-[#101e38] hover:bg-[#213d77] text-blue-200 hover:text-white transition-colors cursor-pointer"
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
                    ? 'bg-[#fb792b] text-white shadow-md font-bold'
                    : 'text-blue-100 hover:bg-[#213d77] hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-[#101e38] text-blue-200 group-hover:text-white'}`}>
                  <IconComp className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isActive ? 'bg-white text-[#fb792b]' : 'bg-[#101e38] text-amber-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] block truncate font-normal ${isActive ? 'text-orange-100' : 'text-blue-200'}`}>
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
      <div className="p-3 border-t border-[#101e38] sticky bottom-0 bg-[#182c52]">
        <div className="bg-[#101e38] border border-blue-400/20 rounded-2xl p-2.5 flex items-center space-x-2.5">
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
