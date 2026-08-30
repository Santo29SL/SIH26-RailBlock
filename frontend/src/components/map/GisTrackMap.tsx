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

const SECTION_STATIONS: Record<string, StationNode[]> = {
  'MAS-AJJ': [
    { code: 'MAS', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
    { code: 'BBQ', name: 'Basin Bridge Jn', lat: 13.0988, lng: 80.2678 },
    { code: 'PER', name: 'Perambur', lat: 13.1075, lng: 80.2337 },
    { code: 'VLK', name: 'Villivakkam', lat: 13.1118, lng: 80.2081 },
    { code: 'AVD', name: 'Avadi', lat: 13.1189, lng: 80.1002 },
    { code: 'TRL', name: 'Tiruvallur', lat: 13.1437, lng: 79.9079 },
    { code: 'AJJ', name: 'Arakkonam Jn', lat: 13.0788, lng: 79.6685 },
  ],
  'NDLS-CNB': [
    { code: 'NDLS', name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    { code: 'GZB', name: 'Ghaziabad Jn', lat: 28.6692, lng: 77.4538 },
    { code: 'ALJN', name: 'Aligarh Jn', lat: 27.8974, lng: 78.0880 },
    { code: 'TDL', name: 'Tundla Jn', lat: 27.2073, lng: 78.2389 },
    { code: 'ETW', name: 'Etawah Jn', lat: 26.7855, lng: 79.0270 },
    { code: 'CNB', name: 'Kanpur Central', lat: 26.4499, lng: 80.3319 },
  ],
  'CBE-SA': [
    { code: 'CBE', name: 'Coimbatore Jn', lat: 11.0168, lng: 76.9558 },
    { code: 'TUP', name: 'Tiruppur', lat: 11.1085, lng: 77.3411 },
    { code: 'ED', name: 'Erode Jn', lat: 11.3410, lng: 77.7172 },
    { code: 'SA', name: 'Salem Jn', lat: 11.6643, lng: 78.1460 },
  ],
  'MAS-GPD': [
    { code: 'MAS', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
    { code: 'TVT', name: 'Tiruvottiyur', lat: 13.1603, lng: 80.3014 },
    { code: 'ENR', name: 'Ennore', lat: 13.2008, lng: 80.3204 },
    { code: 'PON', name: 'Ponneri', lat: 13.3364, lng: 80.1983 },
    { code: 'GPD', name: 'Gummidipundi', lat: 13.4072, lng: 80.1284 },
  ],
};

export const GisTrackMap: React.FC<GisTrackMapProps> = ({
  selectedSection,
  maintenanceRequests = [],
  onPlanBlock,
  heightClass = 'h-[460px]',
}) => {
  const [inspectedRequest, setInspectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showPowerZones, setShowPowerZones] = useState<boolean>(true);

  const secCode = selectedSection?.section_code || 'MAS-AJJ';
  const activeStations = SECTION_STATIONS[secCode] || SECTION_STATIONS['MAS-AJJ'];
  const startStation = activeStations[0];
  const endStation = activeStations[activeStations.length - 1];

  // Track polyline coordinates
  const trackPath: [number, number][] = activeStations.map((s) => [s.lat, s.lng]);

  const mapCenter: [number, number] = [
    (startStation.lat + endStation.lat) / 2,
    (startStation.lng + endStation.lng) / 2,
  ];

  // Defect pin positions along the track
  const defectsWithPositions = (maintenanceRequests.length > 0 ? maintenanceRequests : [
    { id: '1', request_code: 'TMS-E8F0F8', activity_type: 'USFD IMR Rail Flaw', priority: 'CRITICAL', department: 'TRACK', metadata_json: { chainage_km: 14.2, criticality_index: 88, usfd_classification: 'IMR' } },
    { id: '2', request_code: 'S&T-8D0D21', activity_type: 'Point Machine 114A Overhaul', priority: 'HIGH', department: 'SIGNAL', metadata_json: { chainage_km: 28.0, criticality_index: 72, usfd_classification: 'GOOD' } },
    { id: '3', request_code: 'TRD-673A8C', activity_type: '25 kV OHE Wire Tension', priority: 'HIGH', department: 'TRACTION', metadata_json: { chainage_km: 45.0, criticality_index: 68, usfd_classification: 'GOOD' } },
  ]).map((req: any, index) => {
    const meta = req.metadata_json || {};
    const chainageKm = meta.chainage_km || (index + 1) * 14;
    const progress = Math.min(0.95, Math.max(0.05, chainageKm / (selectedSection?.length_km || 68.8)));

    const lat = startStation.lat + progress * (endStation.lat - startStation.lat) + (index % 2 === 0 ? 0.003 : -0.003);
    const lng = startStation.lng + progress * (endStation.lng - startStation.lng);
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
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col h-full select-none font-sans">
      {/* Header - Official IRCTC Navy */}
      <div className="bg-[#213d77] text-white px-5 py-3 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 font-bold uppercase tracking-wider">
          <MapPin className="w-4 h-4 text-[#fb792b]" />
          <span className="text-white text-xs">GEOSPATIAL GIS TRACK &amp; TRACTION POWER MAP ({secCode})</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>CRITICAL DEFECT</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>MODERATE DEFECT</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span>25 kV OHE ZONE</span>
          </div>
        </div>
      </div>

      {/* Spacious Map Canvas */}
      <div className={`${heightClass} w-full relative z-0`}>
        <MapContainer
          key={secCode}
          center={mapCenter}
          zoom={secCode === 'NDLS-CNB' ? 7 : 10}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Steel Track Polyline */}
          <Polyline
            positions={trackPath}
            pathOptions={{ color: '#213d77', weight: 5, opacity: 0.85 }}
          />

          {/* OHE Power Feeding Zones Layer */}
          {showPowerZones && <PowerZoneLayer />}

          {/* Animated Train Movements Layer */}
          <AnimatedTrainLayer trackPath={trackPath} />

          {/* Station Markers */}
          {showStations &&
            activeStations.map((station) => (
              <Marker
                key={station.code}
                position={[station.lat, station.lng]}
                icon={createStationIcon(station.code)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-1 text-xs">
                    <div className="font-bold text-[#213d77]">{station.name} ({station.code})</div>
                    <div className="text-[11px] text-slate-500">Interlocking Junction Station</div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Defect Pins */}
          {defectsWithPositions.map((defect, idx) => (
            <Marker
              key={defect.request.id || idx}
              position={[defect.lat, defect.lng]}
              icon={createDefectIcon(defect.ci, defect.usfd)}
            >
              <Popup className="custom-popup">
                <div className="p-2.5 space-y-2 text-xs select-none">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono font-bold text-rose-600">
                      {defect.request.request_code}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold font-mono">
                      CI: {defect.ci}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">
                      {defect.request.activity_type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Department: {defect.request.department}
                    </span>
                  </div>

                  <button
                    onClick={() => setInspectedRequest(defect.request)}
                    className="w-full py-1 px-2 rounded-lg bg-[#213d77] hover:bg-[#182c52] text-white text-[10px] font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Eye className="w-3 h-3 text-[#fb792b]" />
                    <span>Inspect CatBoost &amp; SHAP</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Detail Modal */}
      <DefectDetailModal
        request={inspectedRequest}
        onClose={() => setInspectedRequest(null)}
      />
    </div>
  );
};
