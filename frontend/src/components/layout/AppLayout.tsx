import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { TelemetryBanner } from './TelemetryBanner';
import { FastReschedulerModal } from '../simulator/FastReschedulerModal';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="h-screen max-h-screen overflow-hidden flex bg-[#f1f5f9] text-slate-900 font-sans">
      {/* Left Sidebar Menu Bar — Always Permanently Visible & Fixed */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area on Right — Independent Scroll Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Control Office Command Header */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Container — Scrolls Smoothly While Sidebar Stays Fixed */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f1f5f9]">
          <div className="max-w-[1600px] mx-auto space-y-4">
            {children}
          </div>
        </main>

        {/* Live Disruption Notification Banner */}
        <TelemetryBanner />

        {/* Fast Rescheduler Live Modal */}
        <FastReschedulerModal />
      </div>
    </div>
  );
};
