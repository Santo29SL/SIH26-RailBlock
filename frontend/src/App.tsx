import { useEffect, useState, useCallback } from 'react';
import type { Section, MaintenanceRequest, Block, ModelInfoResponse } from './api/client';
import { fetchSections, fetchMaintenanceRequests, fetchBlocks, fetchModelInfo } from './api/client';
import { DashboardTab } from './components/tabs/DashboardTab';
import { PlannerTab } from './components/tabs/PlannerTab';
import { RiskTab } from './components/tabs/RiskTab';
import { BlocksTab } from './components/tabs/BlocksTab';
import { FormsTab } from './components/tabs/FormsTab';

// ── Types ─────────────────────────────────────────────────

type Tab = 'dashboard' | 'planner' | 'risk' | 'blocks' | 'forms';
type ToastType = 'info' | 'error' | 'success';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// ── App ───────────────────────────────────────────────────

export default function App() {
  // Global state
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [defects, setDefects] = useState<MaintenanceRequest[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [defectsLoading, setDefectsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState(0);

  // Clock
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Notification system
  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = toastCounter + 1;
    setToastCounter(id);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, [toastCounter]);

  // Load sections
  useEffect(() => {
    setSectionsLoading(true);
    fetchSections()
      .then(s => {
        setSections(s);
        if (s.length > 0) setSelectedSectionId(s[0].id);
      })
      .catch(e => notify(`Could not connect to backend: ${e.message}`, 'error'))
      .finally(() => setSectionsLoading(false));

    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => { /* model info optional */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load defects & blocks when section changes
  const loadDefects = useCallback(() => {
    setDefectsLoading(true);
    fetchMaintenanceRequests({ section_id: selectedSectionId || undefined, page_size: 100 })
      .then(res => setDefects(res.items))
      .catch(e => notify(e.message, 'error'))
      .finally(() => setDefectsLoading(false));
  }, [selectedSectionId, notify]);

  const loadBlocks = useCallback(() => {
    setBlocksLoading(true);
    fetchBlocks({ section_id: selectedSectionId || undefined, page_size: 100 })
      .then(res => setBlocks(res.items))
      .catch(e => notify(e.message, 'error'))
      .finally(() => setBlocksLoading(false));
  }, [selectedSectionId, notify]);

  useEffect(() => {
    loadDefects();
    loadBlocks();
  }, [selectedSectionId, loadDefects, loadBlocks]);

  const selectedSection = sections.find(s => s.id === selectedSectionId) ?? null;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '🏠 Dashboard' },
    { key: 'planner', label: '🤖 Optimizer & Planner' },
    { key: 'risk', label: '⚠ Risk Inspector' },
    { key: 'blocks', label: '📋 Block Lifecycle' },
    { key: 'forms', label: '📄 Statutory Forms' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ir-gray-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ir-navy)', borderBottom: '3px solid var(--ir-orange)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 10, height: 48 }}>
          {/* Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: 'var(--ir-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff' }}>IR</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: 1, lineHeight: 1.1 }}>RailBlock DSS</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Automated Block Planning — SIH 2026 | PS 26027</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Section Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase' }}>Section:</span>
            {sectionsLoading ? (
              <span style={{ color: '#fff', fontSize: 12 }}>Loading...</span>
            ) : sections.length === 0 ? (
              <span style={{ color: '#f44336', fontSize: 11 }}>⚠ DB Empty — seed data first</span>
            ) : (
              <select
                style={{ background: '#004d99', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 8px', fontSize: 12, fontWeight: 700 }}
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
              >
                <option value="">All Sections</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.section_code} — {s.division}</option>
                ))}
              </select>
            )}
          </div>

          {/* Section info pills */}
          {selectedSection && (
            <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '2px 8px' }}>{selectedSection.zone}</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '2px 8px' }}>{selectedSection.length_km} km</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '2px 8px' }}>{selectedSection.line_type}</span>
            </div>
          )}

          {/* Backend status + Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: sections.length > 0 ? '#66bb6a' : '#ef5350', fontSize: 10 }}>
              {sections.length > 0 ? '● BACKEND ONLINE' : '● BACKEND OFFLINE'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Roboto Mono, monospace' }}>{clock}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="ir-tabs" style={{ position: 'sticky', top: 48, zIndex: 90 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', width: '100%' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`ir-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          {/* Live block count badges */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', fontSize: 10 }}>
            <span style={{ background: '#f37021', color: '#fff', padding: '2px 8px', fontWeight: 700 }}>
              {blocks.filter(b => b.status === 'ACTIVE').length} ACTIVE
            </span>
            <span style={{ background: '#003366', color: '#fff', padding: '2px 8px', fontWeight: 700 }}>
              {blocks.filter(b => b.status === 'PROPOSED').length} PROPOSED
            </span>
            <span style={{ background: '#c62828', color: '#fff', padding: '2px 8px', fontWeight: 700 }}>
              {defects.filter(d => d.priority === 'CRITICAL' && d.status === 'PENDING').length} CRITICAL PENDING
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ir-container" style={{ paddingTop: 10, maxWidth: 1440 }}>
        {/* Error banner if no sections */}
        {!sectionsLoading && sections.length === 0 && (
          <div className="ir-error" style={{ marginBottom: 12 }}>
            ⚠ <strong>Backend database appears empty.</strong> Please ensure the FastAPI server is running on <code>localhost:8000</code> and the database has been seeded with{' '}
            <code>python -m app.scripts.seed_all</code>. All data displayed is live from the database — no dummy data is shown.
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            section={selectedSection}
            defects={defects}
            onNotify={notify}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerTab
            section={selectedSection}
            sections={sections}
            defects={defects}
            onNotify={notify}
            onBlocksUpdated={loadBlocks}
          />
        )}

        {activeTab === 'risk' && (
          <RiskTab
            defects={defects}
            modelInfo={modelInfo}
            loading={defectsLoading}
            onNotify={notify}
          />
        )}

        {activeTab === 'blocks' && (
          <BlocksTab
            blocks={blocks}
            sections={sections}
            loading={blocksLoading}
            onNotify={notify}
            onRefresh={loadBlocks}
          />
        )}

        {activeTab === 'forms' && (
          <FormsTab
            blocks={blocks}
            sections={sections}
            onNotify={notify}
            onRefresh={() => { loadDefects(); loadBlocks(); }}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#002244', color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center', padding: '8px 0', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        RAILBLOCK DECISION SUPPORT SYSTEM — Smart India Hackathon 2026 | PS 26027 | Indian Railways Engineering Department
        &nbsp;|&nbsp; All data is live from PostgreSQL. No sample or dummy data is shown.
      </div>

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`ir-toast ${t.type}`}
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ cursor: 'pointer' }}
          >
            {t.type === 'error' ? '✘' : t.type === 'success' ? '✔' : 'ℹ'} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
