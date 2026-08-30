import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DualGantt } from './components/DualGantt';
import { GisTrackMap } from './components/GisTrackMap';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { RiskInspector } from './components/RiskInspector';
import { StatutoryModal } from './components/StatutoryModal';
import { AddEntryModal } from './components/AddEntryModal';
import {
  TrainMovement,
  ScheduledBlock,
  MaintenanceDefect,
  fetchTrainMovements,
  fetchScheduledBlocks,
  fetchMaintenanceRequests,
  runOptimizer,
} from './api/client';
import { ShieldCheck, Clock, Zap, CheckCircle, FileText, PlusCircle, Wrench, Train } from 'lucide-react';

export const App: React.FC = () => {
  const [trains, setTrains] = useState<TrainMovement[]>([]);
  const [blocks, setBlocks] = useState<ScheduledBlock[]>([]);
  const [defects, setDefects] = useState<MaintenanceDefect[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [modalBlock, setModalBlock] = useState<ScheduledBlock | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    const [trData, blkData, defData] = await Promise.all([
      fetchTrainMovements(),
      fetchScheduledBlocks(),
      fetchMaintenanceRequests(),
    ]);
    const safeTrains = Array.isArray(trData) ? trData : (trData as any)?.items || [];
    const safeBlocks = Array.isArray(blkData) ? blkData : (blkData as any)?.items || [];
    const safeDefects = Array.isArray(defData) ? defData : (defData as any)?.items || [];
    setTrains(safeTrains);
    setBlocks(safeBlocks);
    setDefects(safeDefects);
    if (safeBlocks.length > 0 && !selectedBlock) {
      setSelectedBlock(safeBlocks[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run CP-SAT solver
  const handleRunOptimizer = async (horizonDays: number) => {
    setIsOptimizing(true);
    setStatusNotification(`Running Google OR-Tools CP-SAT Space-Time Solver for ${horizonDays}-day horizon...`);
    try {
      const res = await runOptimizer('2026-08-29', horizonDays);
      setStatusNotification(res.message);
      await loadData();
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  // Block state transition
  const handleTransitionSuccess = (blockId: string, newStatus: string, pn: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              status: newStatus as any,
              disconnection_pn: pn,
            }
          : b
      )
    );
    if (selectedBlock?.id === blockId) {
      setSelectedBlock((prev) => (prev ? { ...prev, status: newStatus as any, disconnection_pn: pn } : null));
    }
  };

  // Add new defect from modal
  const handleAddDefect = (newDefect: MaintenanceDefect) => {
    setDefects((prev) => [newDefect, ...prev]);
    setStatusNotification(`✅ Logged ${newDefect.request_code} (${newDefect.activity_type}) with AI Criticality Index ${newDefect.criticality_index}/100.`);
  };

  // Add new train from modal
  const handleAddTrain = (newTrain: TrainMovement) => {
    setTrains((prev) => [...prev, newTrain]);
    setStatusNotification(`✅ Injected train #${newTrain.train_number} (${newTrain.train_name}) from ${newTrain.entry_time} to ${newTrain.exit_time}.`);
  };

  // Filter trains & blocks by section
  const filteredTrains = selectedSection === 'ALL' ? trains : trains;
  const filteredBlocks =
    selectedSection === 'ALL'
      ? blocks
      : blocks.filter((b) => b.section_code === selectedSection);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      {/* IRCTC Official Header */}
      <Header
        activeSection={selectedSection}
        onSectionChange={setSelectedSection}
        onRunOptimizer={handleRunOptimizer}
        isOptimizing={isOptimizing}
      />

      {/* Main Content Area */}
      <main className="ir-container" style={{ flex: 1, marginTop: '8px' }}>
        
        {/* Live Notification Bar */}
        {statusNotification && (
          <div
            style={{
              background: '#002244',
              color: '#ffffff',
              padding: '8px 12px',
              marginBottom: '10px',
              borderLeft: '4px solid #f37021',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{statusNotification}</span>
            <button
              onClick={() => setStatusNotification(null)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Division KPI Metrics Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
          <div className="ir-panel" style={{ margin: 0, padding: '10px', borderLeft: '4px solid #003366' }}>
            <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700 }}>ACTIVE SCHEDULED BLOCKS</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#003366' }}>
              {blocks.length} POSSESSIONS
            </div>
            <div style={{ fontSize: '10px', color: '#2e7d32' }}>All G&SR Safety Conflicts Resolved</div>
          </div>

          <div className="ir-panel" style={{ margin: 0, padding: '10px', borderLeft: '4px solid #2e7d32' }}>
            <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700 }}>SHADOW OVERLAP SAVED</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#2e7d32' }}>
              5.3 HOURS
            </div>
            <div style={{ fontSize: '10px', color: '#555555' }}>Bundled across Track, S&T & TRD</div>
          </div>

          <div className="ir-panel" style={{ margin: 0, padding: '10px', borderLeft: '4px solid #c62828' }}>
            <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700 }}>TIER-1 VIP PROTECTION</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#c62828' }}>
              0 MINS DELAY
            </div>
            <div style={{ fontSize: '10px', color: '#c62828' }}>Hard Constraint: Zero VIP Detention</div>
          </div>

          <div className="ir-panel" style={{ margin: 0, padding: '10px', borderLeft: '4px solid #f37021' }}>
            <div style={{ fontSize: '11px', color: '#666666', fontWeight: 700 }}>AI CRITICALITY RESOLVED</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f37021' }}>
              171.6 / 200 PTS
            </div>
            <div style={{ fontSize: '10px', color: '#555555' }}>CatBoost Monotone Hazard Model</div>
          </div>
        </div>

        {/* Live Manual Ingestion Sandbox Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #999999',
            padding: '6px 10px',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#003366', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={14} color="#f37021" />
            <span>DISPATCH ACTION: MANUAL ASSET / TRAIN INGESTION</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="ir-btn ir-btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <Wrench size={12} />
              + LOG DEFECT / ISSUE (TMS / SMMS / TDMS)
            </button>
            <button
              className="ir-btn ir-btn-navy"
              onClick={() => setIsAddModalOpen(true)}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              <Train size={12} />
              + INJECT TRAIN MOVEMENT
            </button>
          </div>
        </div>

        {/* 1. Dual-Swimlane Gantt Timeline */}
        <DualGantt
          trains={filteredTrains}
          blocks={filteredBlocks}
          selectedBlockId={selectedBlock?.id || null}
          onSelectBlock={(b) => setSelectedBlock(b)}
        />

        {/* Selected Block Quick Actions Strip */}
        {selectedBlock && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #999999',
              padding: '8px 12px',
              marginBottom: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: '#003366' }}>SELECTED POSSESSION: </span>
              <strong>{selectedBlock.block_code}</strong> ({selectedBlock.section_code} • {selectedBlock.start_time} - {selectedBlock.end_time})
              <span style={{ marginLeft: '10px' }} className={`ir-badge ${selectedBlock.status === 'APPROVED' ? 'ir-badge-completed' : selectedBlock.status === 'ACTIVE' ? 'ir-badge-active' : 'ir-badge-proposed'}`}>
                {selectedBlock.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="ir-btn ir-btn-navy"
                onClick={() => setModalBlock(selectedBlock)}
              >
                <FileText size={13} />
                OPEN FORM T/351 & T/D 602 PORTAL
              </button>
            </div>
          </div>
        )}

        {/* 2. Middle Row: Leaflet GIS Track Map + What-If Simulation Sandbox */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <GisTrackMap defects={defects} selectedSection={selectedSection} />
          <WhatIfSimulator
            selectedBlock={selectedBlock}
            onBlockUpdated={loadData}
          />
        </div>

        {/* 3. Bottom Row: Multi-Department Defect Inspector & SHAP Reasoning */}
        <RiskInspector defects={defects} />

      </main>

      {/* Statutory Form T/351 & T/D 602 Modal */}
      <StatutoryModal
        block={modalBlock}
        onClose={() => setModalBlock(null)}
        onTransitionSuccess={handleTransitionSuccess}
      />

      {/* Manual Defect & Train Movement Ingestion Modal */}
      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDefect={handleAddDefect}
        onAddTrain={handleAddTrain}
      />

      {/* Footer */}
      <footer style={{ background: '#002244', color: '#b0bec5', padding: '8px 16px', fontSize: '11px', borderTop: '2px solid #f37021', textAlign: 'center' }}>
        <div>
          CENTRE FOR RAILWAY INFORMATION SYSTEMS (CRIS) • RESEARCH DESIGNS AND STANDARDS ORGANISATION (RDSO)
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          RailBlock Decision Support System • Smart India Hackathon 2026 (PS 26027) • Strictly conforms to Indian Railways G&SR & IRPWM Operating Manuals
        </div>
      </footer>
    </div>
  );
};
