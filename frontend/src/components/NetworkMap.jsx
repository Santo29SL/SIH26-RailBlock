import { MapContainer, TileLayer, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // CRITICAL: Leaflet won't render correctly without this

// Mock data representing distinct physical railway track segments[cite: 3]
const railwaySections = [
  { 
    id: 'SEC_A', 
    name: 'Section A (Main Line)', 
    positions: [[15.1394, 76.9214], [15.1550, 76.9400]], 
    color: '#1e3a8a', // railway-primary
    status: 'Active'
  },
  { 
    id: 'SEC_B', 
    name: 'Section B (Branch Line)', 
    positions: [[15.1550, 76.9400], [15.1800, 76.9600]], 
    color: '#f59e0b', // railway-accent (simulating a pending block request)
    status: 'Maintenance Requested'
  }
];

const NetworkMap = () => {
  return (
    <div className="h-full w-full rounded shadow overflow-hidden">
      <MapContainer 
        center={[15.1450, 76.9300]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Render our railway sections as Polylines on the map */}
        {railwaySections.map((section) => (
          <Polyline 
            key={section.id}
            positions={section.positions} 
            pathOptions={{ color: section.color, weight: 6 }}
          >
            <Tooltip sticky>
              <div className="font-sans">
                <strong>{section.id}</strong>: {section.name} <br/>
                Status: {section.status}
              </div>
            </Tooltip>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
};

export default NetworkMap;