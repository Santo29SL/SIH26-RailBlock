import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Delhi–Ghaziabad corridor sections (NDLS → GZB)
const sections = [
  { id: 'SEC_NDLS_SZM', name: 'NDLS → Sabzi Mandi',   positions: [[28.6448, 77.2167],[28.6580, 77.2050]], status: 'ACTIVE',    dept: 'TRACK',      criticality: 78 },
  { id: 'SEC_SZM_DSA',  name: 'Sabzi Mandi → Delhi Shahdara', positions: [[28.6580, 77.2050],[28.6678, 77.2712]], status: 'PROPOSED',  dept: 'SIGNALLING', criticality: 52 },
  { id: 'SEC_DSA_GZB',  name: 'Delhi Shahdara → Ghaziabad',   positions: [[28.6678, 77.2712],[28.6691, 77.4239]], status: 'APPROVED',  dept: 'OHE',        criticality: 63 },
  { id: 'SEC_GZB_MAIN', name: 'Ghaziabad Jn (Main)',           positions: [[28.6691, 77.4239],[28.6720, 77.4300]], status: 'COMPLETED', dept: 'CIVIL',      criticality: 21 },
];

// Defect markers along corridor
const defects = [
  { id: 'D001', pos: [28.6530, 77.2100], label: 'TGI Deviation ≥ 7mm', dept: 'TRACK',      severity: 'HIGH',   km: 3.2  },
  { id: 'D002', pos: [28.6620, 77.2400], label: 'Point machine locking delay 340ms', dept: 'SIGNALLING', severity: 'MED',    km: 8.7  },
  { id: 'D003', pos: [28.6650, 77.2800], label: 'OHE contact wire wear > 12%', dept: 'OHE',        severity: 'HIGH',   km: 14.1 },
  { id: 'D004', pos: [28.6670, 77.3400], label: 'USFD flaw detected — rail foot', dept: 'TRACK',      severity: 'CRIT',   km: 21.6 },
  { id: 'D005', pos: [28.6680, 77.3900], label: 'Axle counter reset anomaly', dept: 'SIGNALLING', severity: 'LOW',    km: 31.4 },
];

// Stations
const stations = [
  { id: 'NDLS', name: 'New Delhi',      pos: [28.6448, 77.2167], major: true  },
  { id: 'SZM',  name: 'Sabzi Mandi',   pos: [28.6580, 77.2050], major: false },
  { id: 'DSA',  name: 'Delhi Shahdara',pos: [28.6678, 77.2712], major: false },
  { id: 'GZB',  name: 'Ghaziabad Jn', pos: [28.6691, 77.4239], major: true  },
];

const STATUS_COLOR = {
  ACTIVE:    '#f59e0b',
  PROPOSED:  '#8b5cf6',
  APPROVED:  '#22d3ee',
  COMPLETED: '#10b981',
  CANCELLED: '#6b7280',
};

const SEVERITY_COLOR = {
  CRIT: '#ef4444',
  HIGH: '#f97316',
  MED:  '#f59e0b',
  LOW:  '#22d3ee',
};

export default function NetworkMap() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('ALL');

  const filteredDefects = filter === 'ALL' ? defects : defects.filter(d => d.severity === filter);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--text-3)' }}>FILTER SEVERITY:</span>
        {['ALL','CRIT','HIGH','MED','LOW'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em',
            padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
            background: filter === f ? (SEVERITY_COLOR[f] ?? 'var(--amber)') : 'transparent',
            color: filter === f ? '#05070d' : (SEVERITY_COLOR[f] ?? 'var(--text-2)'),
            border: `1px solid ${filter === f ? 'transparent' : (SEVERITY_COLOR[f] + '55' ?? 'var(--border-2)')}`,
            transition: 'all .15s',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>
              <span style={{ width: 12, height: 3, borderRadius: 2, background: c }} />{s}
            </span>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={[28.658, 77.31]}
            zoom={11}
            style={{ height: '100%', width: '100%', background: '#06080f' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />

            {/* Track sections */}
            {sections.map(sec => (
              <Polyline
                key={sec.id}
                positions={sec.positions}
                pathOptions={{ color: STATUS_COLOR[sec.status], weight: 6, opacity: .85 }}
                eventHandlers={{ click: () => setSelected({ type: 'section', data: sec }) }}
              >
                <Tooltip sticky>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 12 }}>
                    <strong>{sec.id}</strong>: {sec.name}<br />
                    Status: {sec.status} · Dept: {sec.dept}<br />
                    Criticality: {sec.criticality}/100
                  </div>
                </Tooltip>
              </Polyline>
            ))}

            {/* Defect markers */}
            {filteredDefects.map(d => (
              <CircleMarker
                key={d.id}
                center={d.pos}
                radius={8}
                pathOptions={{
                  color: SEVERITY_COLOR[d.severity],
                  fillColor: SEVERITY_COLOR[d.severity],
                  fillOpacity: .8,
                  weight: 2,
                }}
                eventHandlers={{ click: () => setSelected({ type: 'defect', data: d }) }}
              >
                <Tooltip>
                  <div style={{ fontFamily: 'sans-serif', fontSize: 12 }}>
                    <strong>{d.id}</strong> · km {d.km}<br />
                    {d.label}<br />
                    Severity: {d.severity}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Stations */}
            {stations.map(st => (
              <CircleMarker
                key={st.id}
                center={st.pos}
                radius={st.major ? 7 : 4}
                pathOptions={{ color: '#e2e8f0', fillColor: '#06080f', fillOpacity: 1, weight: 2 }}
              >
                <Tooltip permanent={st.major} direction="top">
                  <span style={{ fontFamily: 'sans-serif', fontSize: 11, fontWeight: 600 }}>{st.id}</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Info panel */}
        {selected && (
          <div style={{
            width: 280, flexShrink: 0,
            background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            padding: 20, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--amber)' }}>
                {selected.type === 'section' ? 'TRACK SECTION' : 'DEFECT REPORT'}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            {selected.type === 'section' && (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.data.id}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>{selected.data.name}</div>
                {[
                  ['Status', selected.data.status, STATUS_COLOR[selected.data.status]],
                  ['Department', selected.data.dept, null],
                  ['Criticality Index', `${selected.data.criticality} / 100`, selected.data.criticality > 70 ? 'var(--red)' : selected.data.criticality > 40 ? 'var(--amber)' : 'var(--green)'],
                ].map(([lbl, val, col]) => (
                  <div key={lbl} style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 3 }}>{lbl}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: col ?? 'var(--text)' }}>{val}</div>
                  </div>
                ))}
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border-2)', marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selected.data.criticality}%`, borderRadius: 3, background: selected.data.criticality > 70 ? 'var(--red)' : selected.data.criticality > 40 ? 'var(--amber)' : 'var(--green)' }} />
                </div>
              </>
            )}

            {selected.type === 'defect' && (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.data.id}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px', border: `1px solid ${SEVERITY_COLOR[selected.data.severity]}55`, color: SEVERITY_COLOR[selected.data.severity], borderRadius: 2, display: 'inline-block', marginBottom: 12 }}>{selected.data.severity}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 16, lineHeight: 1.6 }}>{selected.data.label}</div>
                {[
                  ['Department', selected.data.dept],
                  ['Chainage', `km ${selected.data.km}`],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 3 }}>{lbl}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{val}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
