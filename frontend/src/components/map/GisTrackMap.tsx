import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Section } from '../../types/section';
import { MaintenanceRequest } from '../../types/block';
import { createDefectIcon, createStationIcon } from './DefectPin';
import { PowerZoneLayer } from './PowerZoneLayer';
import { AnimatedTrainLayer } from './AnimatedTrainLayer';
import { DefectDetailModal } from './DefectDetailModal';
import { MapPin, Eye, Zap, Layers, Maximize2 } from 'lucide-react';

interface GisTrackMapProps {
  selectedSection?: Section | null;
  maintenanceRequests?: MaintenanceRequest[];
  onPlanBlock?: (request: MaintenanceRequest) => void;
  heightClass?: string;
}

interface StationNode {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

const MAS_AJJ_STATIONS: StationNode[] = [
  { code: 'MAS', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { code: 'BBQ', name: 'Basin Bridge Jn', lat: 13.0988, lng: 80.2678 },
  { code: 'PER', name: 'Perambur', lat: 13.1075, lng: 80.2337 },
  { code: 'VLK', name: 'Villivakkam', lat: 13.1118, lng: 80.2081 },
  { code: 'AVD', name: 'Avadi', lat: 13.1189, lng: 80.1002 },
  { code: 'TRL', name: 'Tiruvallur', lat: 13.1437, lng: 79.9079 },
  { code: 'AJJ', name: 'Arakkonam Jn', lat: 13.0788, lng: 79.6685 },
];

export const GisTrackMap: React.FC<GisTrackMapProps> = ({
  selectedSection,
  maintenanceRequests = [],
  onPlanBlock,
  heightClass = 'h-[460px]',
}) => {
  const [inspectedRequest, setInspectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showPowerZones, setShowPowerZones] = useState<boolean>(true);

  // Track polyline coordinates
  const trackPath: [number, number][] = MAS_AJJ_STATIONS.map((s) => [s.lat, s.lng]);

  // Defect pin positions along the track
  const defectsWithPositions = (maintenanceRequests.length > 0 ? maintenanceRequests : [
    { id: '1', request_code: 'TMS-E8F0F8', activity_type: 'Ultrasonic Rail Crack Flaw', priority: 'CRITICAL', department: 'TRACK', metadata_json: { chainage_km: 14.2, criticality_index: 88, usfd_classification: 'IMR' } },
    { id: '2', request_code: 'S&T-8D0D21', activity_type: 'Track Switcher Point Machine Overhaul', priority: 'HIGH', department: 'SIGNAL', metadata_json: { chainage_km: 28.0, criticality_index: 72, usfd_classification: 'GOOD' } },
    { id: '3', request_code: 'TRD-673A8C', activity_type: '25 kV Overhead Wire Adjustment', priority: 'HIGH', department: 'TRACTION', metadata_json: { chainage_km: 45.0, criticality_index: 68, usfd_classification: 'GOOD' } },
  ]).map((req: any, index) => {
    const meta = req.metadata_json || {};
    const chainageKm = meta.chainage_km || (index + 1) * 16;
    const progress = Math.min(0.95, Math.max(0.05, chainageKm / 68.8));

    const lat = 13.0827 + progress * (13.0788 - 13.0827) + (index % 2 === 0 ? 0.003 : -0.003);
    const lng = 80.2707 + progress * (79.6685 - 80.2707);
    const ci = meta.criticality_index || 75;

    return {
      request: req,
      lat,
      lng,
      ci,
      usfd: meta.usfd_classification || 'GOOD',
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full select-none font-sans">
      {/* Header */}
      <div className="bg-[#002b49] text-white px-5 py-3 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 font-bold uppercase tracking-wider">
          <MapPin className="w-4 h-4 text-sky-400" />
          <span className="text-white text-xs">GEOSPATIAL CORRIDOR TRACK &amp; POWER SUBSTATION MAP</span>
        </div>

        {/* Legend & Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>URGENT DEFECT</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>SCHEDULED DEFECT</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span>25 kV POWER ZONE</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className={`${heightClass} w-full relative z-0`}>
        <MapContainer
          center={[13.11, 79.98]}
          zoom={11}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* CartoDB Positron Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Railway Corridor Track Polyline */}
          <Polyline
            positions={trackPath}
            pathOptions={{
              color: '#0f172a',
              weight: 5,
              opacity: 0.9,
            }}
          />
          <Polyline
            positions={trackPath}
            pathOptions={{
              color: '#ea580c',
              weight: 2.5,
              opacity: 0.8,
              dashArray: '8, 8',
            }}
          />

          {/* Stations Markers */}
          {showStations &&
            MAS_AJJ_STATIONS.map((station) => (
              <Marker
                key={station.code}
                position={[station.lat, station.lng]}
                icon={createStationIcon(station.code)}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs space-y-1">
                    <div className="font-bold text-slate-900">{station.name} ({station.code})</div>
                    <div className="text-[11px] text-slate-500">Main Line Corridor Junction</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">Line Clear: Normal Traffic</div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Defect Pins along Track */}
          {defectsWithPositions.map((item, idx) => (
            <Marker
              key={idx}
              position={[item.lat, item.lng]}
              icon={createDefectIcon(item.ci, item.usfd)}
              eventHandlers={{
                click: () => setInspectedRequest(item.request),
              }}
            >
              <Popup>
                <div className="p-1.5 font-sans text-xs space-y-1.5 min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">{item.request.request_code}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      item.ci >= 75 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Urgency: {item.ci}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">{item.request.activity_type}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {item.request.department} • KM {item.request.metadata_json?.chainage_km || 14.2}
                  </div>
                  <button
                    onClick={() => setInspectedRequest(item.request)}
                    className="w-full mt-1 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Explain AI Reason</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 25 kV Traction Power Feeding Posts & Sub-sectors */}
          {showPowerZones && <PowerZoneLayer />}

          {/* Live Animated Trains */}
          <AnimatedTrainLayer />
        </MapContainer>
      </div>

      {/* Modal for Defect Inspection */}
      {inspectedRequest && (
        <DefectDetailModal
          request={inspectedRequest}
          onClose={() => setInspectedRequest(null)}
          onPlanBlock={onPlanBlock}
        />
      )}
    </div>
  );
};
export default GisTrackMap;
