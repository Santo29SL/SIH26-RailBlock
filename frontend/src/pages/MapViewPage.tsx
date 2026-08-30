import React, { useState, useEffect } from 'react';
import { useDivision } from '../context/DivisionContext';
import { blocksApi } from '../api/blocks';
import { MaintenanceRequest } from '../types/block';
import { GisTrackMap } from '../components/map/GisTrackMap';
import { Map, MapPin, ShieldCheck } from 'lucide-react';

interface MapViewPageProps {
  onNavigateTab: (tabId: string) => void;
}

export const MapViewPage: React.FC<MapViewPageProps> = ({ onNavigateTab }) => {
  const { selectedSection } = useDivision();
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await blocksApi.getMaintenanceRequests(selectedSection?.id, undefined, undefined, 1, 50);
        if (res.items) setMaintenanceRequests(res.items);
      } catch (e) {
        console.warn('Could not fetch requests for GIS map');
      }
    };
    fetchRequests();
  }, [selectedSection]);

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Full-Scale Geospatial GIS Track &amp; Live Train Movement Map
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-mono">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Explore live moving trains, station stops, 25 kV traction feeding posts, and track defect locations across the corridor
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Corridor: <strong className="text-slate-900">{selectedSection?.section_code || 'MAS-AJJ'}</strong> ({selectedSection?.length_km || 68.8} km)</span>
          </span>
        </div>
      </div>

      {/* Enlarged Full-View GIS Track Map Component */}
      <div className="h-[calc(100vh-230px)] min-h-[560px]">
        <GisTrackMap
          selectedSection={selectedSection}
          maintenanceRequests={maintenanceRequests}
          onPlanBlock={() => onNavigateTab('simulator')}
          heightClass="h-full"
        />
      </div>
    </div>
  );
};
