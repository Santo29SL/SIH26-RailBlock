import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Section, MaintenanceRequest, Block } from '../api/client';
import { resolveSectionCoords } from '../utils/stationCoords';

interface Props {
  section: Section | null;
  defects: MaintenanceRequest[];
  blocks: Block[];
}

const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#c62828',
  HIGH: '#f37021',
  MEDIUM: '#f57f17',
  LOW: '#004d99',
};

export function MapView({ section, defects, blocks }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 10,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Indian Railways GIS',
        maxZoom: 18,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const code = section?.section_code;
    const coords = resolveSectionCoords(code);

    const [sLat, sLng] = coords.start;
    const [eLat, eLng] = coords.end;

    // Track line (Polyline)
    const trackPolyline = L.polyline([coords.start, coords.end], {
      color: '#003366',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 6',
    }).addTo(layerGroup);

    trackPolyline.bindTooltip(`Section: ${code} (${section?.length_km ?? 21} km | ${section?.line_type ?? 'DOUBLE'})`, {
      permanent: false,
      direction: 'center',
    });

    // Start Station Marker
    const startIcon = L.divIcon({
      className: 'custom-station-icon',
      html: `<div style="background:#003366;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border:1px solid #fff;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${coords.startName}</div>`,
      iconSize: [80, 20],
      iconAnchor: [40, 10],
    });
    L.marker(coords.start, { icon: startIcon }).addTo(layerGroup).bindPopup(`<b>Station: ${coords.startName}</b><br/>Section: ${code}`);

    // End Station Marker
    const endIcon = L.divIcon({
      className: 'custom-station-icon',
      html: `<div style="background:#003366;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border:1px solid #fff;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${coords.endName}</div>`,
      iconSize: [80, 20],
      iconAnchor: [40, 10],
    });
    L.marker(coords.end, { icon: endIcon }).addTo(layerGroup).bindPopup(`<b>Station: ${coords.endName}</b><br/>Section: ${code}`);

    // Interpolate defects along the line based on index
    defects.forEach((d, idx) => {
      const fraction = (idx + 1) / (defects.length + 1);
      const dLat = sLat + fraction * (eLat - sLat);
      const dLng = sLng + fraction * (eLng - sLng);
      const color = PRIORITY_COLORS[d.priority] ?? '#f37021';

      const circle = L.circleMarker([dLat, dLng], {
        radius: 8,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(layerGroup);

      circle.bindPopup(`
        <div style="font-family:Roboto,sans-serif;font-size:12px;">
          <div style="font-weight:700;color:#003366;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px;">
            ${d.request_code} — ${d.activity_type}
          </div>
          <div><b>Department:</b> ${d.department}</div>
          <div><b>Priority:</b> <span style="color:${color};font-weight:700;">${d.priority}</span></div>
          <div><b>Status:</b> ${d.status}</div>
          <div><b>Duration:</b> ${d.duration_minutes} min</div>
          <div><b>Deadline:</b> ${d.deadline}</div>
        </div>
      `);
    });

    // Interpolate active/scheduled blocks along the line
    blocks.forEach((b, idx) => {
      const fraction = (idx + 0.5) / (blocks.length + 1);
      const bLat = sLat + fraction * (eLat - sLat) + 0.005; // slight offset
      const bLng = sLng + fraction * (eLng - sLng);

      const blockIcon = L.divIcon({
        className: 'custom-block-icon',
        html: `<div style="background:#f37021;color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border:1px solid #d85d11;white-space:nowrap;">📦 ${b.block_code}</div>`,
        iconSize: [90, 18],
        iconAnchor: [45, 9],
      });

      L.marker([bLat, bLng], { icon: blockIcon }).addTo(layerGroup).bindPopup(`
        <div style="font-family:Roboto,sans-serif;font-size:12px;">
          <div style="font-weight:700;color:#f37021;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:4px;">
            ${b.block_code}
          </div>
          <div><b>Date:</b> ${b.block_date ?? '—'}</div>
          <div><b>Window:</b> ${(b.start_time ?? '').slice(0,5)} – ${(b.end_time ?? '').slice(0,5)} (${b.duration_minutes ?? 0} min)</div>
          <div><b>Status:</b> ${b.status ?? 'PROPOSED'}</div>
          <div><b>Jobs:</b> ${(b.block_jobs ?? []).length} bundled</div>
        </div>
      `);
    });

    // Fit map bounds to cover start & end station
    const bounds = L.latLngBounds([coords.start, coords.end]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [section, defects, blocks]);

  return (
    <div className="ir-panel">
      <div className="ir-panel-header">
        <span>Section GIS Map — Track Alignment &amp; Defect Locations ({section?.section_code ?? 'MAS-AJJ'})</span>
        <span style={{ fontSize: 10 }}>🔴 Critical &nbsp; 🟠 High &nbsp; 🟡 Medium &nbsp; 🔵 Low &nbsp; 📦 Scheduled Block</span>
      </div>
      <div className="ir-panel-body" style={{ padding: 0 }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '320px', background: '#e5e3df' }} />
      </div>
    </div>
  );
}
