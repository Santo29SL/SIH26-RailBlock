import React, { useEffect, useRef } from 'react';
import { MapPin, Zap, AlertTriangle } from 'lucide-react';
import { MaintenanceDefect } from '../api/client';
import L from 'leaflet';

interface GisTrackMapProps {
  defects: MaintenanceDefect[];
  selectedSection: string;
}

// Station node coordinates (Chennai Central - Arakkonam Corridor)
const STATIONS = [
  { code: 'MAS', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { code: 'PER', name: 'Perambur', lat: 13.1112, lng: 80.2325 },
  { code: 'TRL', name: 'Tiruvallur', lat: 13.1437, lng: 79.9079 },
  { code: 'AJJ', name: 'Arakkonam Jn', lat: 13.0841, lng: 79.6698 },
];

export const GisTrackMap: React.FC<GisTrackMapProps> = ({ defects }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center map around Chennai - Tiruvallur
    const map = L.map(mapContainerRef.current, {
      center: [13.11, 79.97],
      zoom: 10,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; Indian Railways CRIS / OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    // Draw Railway Track Polyline
    const trackCoords: [number, number][] = STATIONS.map((s) => [s.lat, s.lng]);
    L.polyline(trackCoords, {
      color: '#003366',
      weight: 6,
      opacity: 0.9,
    }).addTo(map);

    // Station Markers
    STATIONS.forEach((st) => {
      const marker = L.circleMarker([st.lat, st.lng], {
        radius: 7,
        fillColor: '#ffffff',
        color: '#003366',
        weight: 3,
        fillOpacity: 1,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Roboto', sans-serif; font-size: 12px; border-radius: 0;">
          <strong style="color: #003366;">[${st.code}] ${st.name}</strong><br/>
          <span>Block Station • Absolute Block System</span>
        </div>
      `);
    });

    // Defect Markers
    const defectCoords: [number, number][] = [
      [13.125, 80.05], // Defect 1: PER-TRL
      [13.143, 79.91], // Defect 2: TRL Yard
      [13.12, 80.12],  // Defect 3: PER-TRL OHE
    ];

    defects.forEach((def, idx) => {
      const coords = defectCoords[idx] || [13.12, 80.0];
      const color = def.criticality_index >= 80 ? '#c62828' : def.criticality_index >= 50 ? '#f57f17' : '#2e7d32';

      const defectMarker = L.circleMarker(coords, {
        radius: 9,
        fillColor: color,
        color: '#000000',
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map);

      defectMarker.bindPopup(`
        <div style="font-family: 'Roboto', sans-serif; font-size: 12px; min-width: 200px; border-radius: 0;">
          <div style="background: ${color}; color: #ffffff; padding: 3px 6px; font-weight: bold;">
            ${def.request_code} (CI: ${def.criticality_index}/100)
          </div>
          <div style="padding: 6px;">
            <strong>${def.activity_type}</strong><br/>
            <span>Dept: <strong>${def.department}</strong> • Overdue: ${def.days_overdue} days</span><br/>
            <span style="color: #555555; font-size: 11px;">${def.kilometer_marker || def.section_code}</span>
          </div>
        </div>
      `);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [defects]);

  return (
    <div className="ir-panel">
      <div className="ir-panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={15} color="#ffb74d" />
          GEOSPATIAL GIS TRACK & TRACTION POWER (FP/SP) MAP
        </span>
        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: 'normal' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#c62828' }}></span> CI &gt; 80 (CRITICAL)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#f57f17' }}></span> CI 50-80 (MODERATE)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={12} color="#f37021" /> FP/SP TRACTION ISOLATION ZONES (40-80 KM)
          </span>
        </div>
      </div>
      <div className="ir-panel-body" style={{ padding: 0 }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '320px', background: '#e5e7eb' }} />
      </div>
    </div>
  );
};
