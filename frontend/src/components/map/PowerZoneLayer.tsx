import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { Zap } from 'lucide-react';

interface PowerZone {
  id: string;
  name: string;
  feedingPost: string;
  sectioningPost: string;
  spanKm: string;
  voltageKv: number;
  status: 'ENERGIZED' | 'ISOLATED';
  coordinates: [number, number][];
}

// Coordinates for Feeding Post (FP) / Sectioning Post (SP) power spans around Chennai - Arakkonam
const MOCK_POWER_ZONES: PowerZone[] = [
  {
    id: 'fp-mas-01',
    name: 'Substation Span FP-MAS / SP-TRL',
    feedingPost: 'FP-MAS-01 (Chennai)',
    sectioningPost: 'SP-TRL-01 (Tiruvallur)',
    spanKm: 'KM 0.0 to KM 42.0 (42 km span)',
    voltageKv: 25,
    status: 'ENERGIZED',
    coordinates: [
      [13.0827, 80.2707],
      [13.1189, 80.1472],
      [13.1437, 79.9079],
      [13.1300, 79.9100],
      [13.1000, 80.1500],
      [13.0700, 80.2700],
    ],
  },
  {
    id: 'fp-trl-02',
    name: 'Substation Span SP-TRL / FP-AJJ',
    feedingPost: 'FP-AJJ-01 (Arakkonam)',
    sectioningPost: 'SP-TRL-01 (Tiruvallur)',
    spanKm: 'KM 42.0 to KM 68.8 (26.8 km span)',
    voltageKv: 25,
    status: 'ENERGIZED',
    coordinates: [
      [13.1437, 79.9079],
      [13.0788, 79.6685],
      [13.0650, 79.6700],
      [13.1300, 79.9100],
    ],
  },
];

export const PowerZoneLayer: React.FC = () => {
  return (
    <>
      {MOCK_POWER_ZONES.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coordinates}
          pathOptions={{
            color: '#38BDF8',
            fillColor: '#0284C7',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        >
          <Popup>
            <div className="p-2 text-xs text-white space-y-1 font-sans">
              <div className="flex items-center space-x-1 text-sky-400 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>{zone.name}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                <div>Feeding Post: <span className="text-white font-semibold">{zone.feedingPost}</span></div>
                <div>Sectioning Post: <span className="text-white font-semibold">{zone.sectioningPost}</span></div>
                <div>Span: <span className="text-white">{zone.spanKm}</span></div>
                <div>Traction: <span className="text-emerald-400 font-bold">{zone.voltageKv} kV AC (ENERGIZED)</span></div>
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
};
