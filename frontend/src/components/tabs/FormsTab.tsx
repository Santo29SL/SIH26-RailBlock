import { useState } from 'react';
import type { Block, Section } from '../../api/client';
import { exportBlockBDMS, exportBlockT351, exportBlockTD602, ingestTMS, ingestSMMS, ingestTDMS } from '../../api/client';

interface Props {
  blocks: Block[];
  sections: Section[];
  onNotify: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onRefresh: () => void;
}

function FormDocField({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
  const display = value === undefined || value === null ? '—' : String(value);
  return (
    <div className="ir-form-doc-row">
      <span className="ir-form-doc-key">{label}</span>
      <span className="ir-form-doc-val">{display}</span>
    </div>
  );
}

export function FormsTab({ blocks, sections, onNotify, onRefresh }: Props) {
  // Export panel
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [bdmsData, setBdmsData] = useState<Record<string, unknown> | null>(null);
  const [t351Data, setT351Data] = useState<Record<string, unknown> | null>(null);
  const [td602Data, setTd602Data] = useState<Record<string, unknown> | null>(null);
  const [formLoading, setFormLoading] = useState('');

  // Ingestion
  type IngestDept = 'TMS' | 'SMMS' | 'TDMS';
  const [ingestDept, setIngestDept] = useState<IngestDept>('TMS');
  const [ingestSectionId, setIngestSectionId] = useState('');
  const [ingestUsfd, setIngestUsfd] = useState('IMR');
  const [ingestTgi, setIngestTgi] = useState(82.5);
  const [ingestChainage, setIngestChainage] = useState(142.5);
  const [ingestDuration, setIngestDuration] = useState(150);
  const [ingestPointRisk, setIngestPointRisk] = useState(75.0);
  const [ingestStation, setIngestStation] = useState('MAS');
  const [ingestOheWear, setIngestOheWear] = useState(65.0);
  const [ingestFp, setIngestFp] = useState('FP-MAS-01');
  const [ingestLoading, setIngestLoading] = useState(false);

  const sectionMap = Object.fromEntries(sections.map(s => [s.id, s]));

  async function loadBDMS() {
    if (!selectedBlockId) return;
    setFormLoading('bdms');
    setBdmsData(null);
    try { setBdmsData(await exportBlockBDMS(selectedBlockId) as Record<string, unknown>); }
    catch (e: unknown) { onNotify(e instanceof Error ? e.message : 'Failed to load BDMS', 'error'); }
    finally { setFormLoading(''); }
  }

  async function loadT351() {
    if (!selectedBlockId) return;
    setFormLoading('t351');
    setT351Data(null);
    try { setT351Data(await exportBlockT351(selectedBlockId) as Record<string, unknown>); }
    catch (e: unknown) { onNotify(e instanceof Error ? e.message : 'Failed to load T/351', 'error'); }
    finally { setFormLoading(''); }
  }

  async function loadTD602() {
    if (!selectedBlockId) return;
    setFormLoading('td602');
    setTd602Data(null);
    try { setTd602Data(await exportBlockTD602(selectedBlockId) as Record<string, unknown>); }
    catch (e: unknown) { onNotify(e instanceof Error ? e.message : 'Failed to load T/D 602', 'error'); }
    finally { setFormLoading(''); }
  }

  function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  async function handleIngest() {
    if (!ingestSectionId) { onNotify('Select a section', 'error'); return; }
    setIngestLoading(true);
    try {
      if (ingestDept === 'TMS') {
        await ingestTMS({
          section_id: ingestSectionId,
          usfd_classification: ingestUsfd,
          tgi_deviation: ingestTgi,
          chainage_km: ingestChainage,
          duration_minutes: ingestDuration,
        });
      } else if (ingestDept === 'SMMS') {
        await ingestSMMS({
          section_id: ingestSectionId,
          point_failure_risk: ingestPointRisk,
          station_code: ingestStation,
          duration_minutes: ingestDuration,
        });
      } else {
        await ingestTDMS({
          section_id: ingestSectionId,
          ohe_wear_pct: ingestOheWear,
          feeding_post: ingestFp,
          duration_minutes: ingestDuration,
        });
      }
      onNotify(`${ingestDept} defect ingested successfully — refresh to see in Risk tab`, 'success');
      onRefresh();
    } catch (e: unknown) {
      onNotify(e instanceof Error ? e.message : 'Ingestion failed', 'error');
    } finally {
      setIngestLoading(false);
    }
  }

  const td602caution = td602Data?.part_3_caution_order as Record<string, string> | undefined;

  return (
    <div>
      {/* Block Selector */}
      <div className="ir-panel">
        <div className="ir-panel-header">Statutory Export Documents — Select Block</div>
        <div className="ir-panel-body">
          <div className="ir-form-row">
            <div className="ir-form-group" style={{ flex: '2 1 300px' }}>
              <label className="ir-label">Select Block</label>
              <select
                className="ir-select"
                value={selectedBlockId}
                onChange={e => {
                  setSelectedBlockId(e.target.value);
                  setBdmsData(null); setT351Data(null); setTd602Data(null);
                }}
              >
                <option value="">— Select a block to export —</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.block_code} | {sectionMap[b.section_id]?.section_code ?? '?'} | {b.block_date} | {b.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="ir-form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <button className="ir-btn ir-btn-navy" onClick={loadT351} disabled={!selectedBlockId || formLoading === 't351'}>
                📄 Form T/351
              </button>
              <button className="ir-btn ir-btn-outline" onClick={loadBDMS} disabled={!selectedBlockId || formLoading === 'bdms'}>
                📦 CRIS BDMS
              </button>
              <button className="ir-btn ir-btn-outline" onClick={loadTD602} disabled={!selectedBlockId || formLoading === 'td602'}>
                🚨 Form T/D 602
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Three document panels */}
      <div className="ir-three-col">
        {/* Form T/351 */}
        <div className="ir-panel">
          <div className="ir-panel-header">Form T/351 — Disconnection Notice (G&amp;SR)</div>
          <div className="ir-panel-body">
            {formLoading === 't351'
              ? <div className="ir-loading"><div className="ir-spinner" /> Generating...</div>
              : !t351Data
                ? <div className="ir-empty">Click "Form T/351" to generate the statutory disconnection &amp; reconnection notice for this block.</div>
                : (
                  <div className="ir-form-doc">
                    <div className="ir-form-doc-title">
                      INDIAN RAILWAYS<br />Form T/351<br />
                      <span style={{ fontSize: 11, fontWeight: 400 }}>Disconnection &amp; Reconnection Notice</span>
                    </div>
                    <FormDocField label="Notice No." value={t351Data.notice_number as string} />
                    <FormDocField label="Station Code" value={t351Data.station_code as string} />
                    <FormDocField label="Section" value={t351Data.section_code as string} />
                    <FormDocField label="Date" value={t351Data.date as string} />
                    <FormDocField label="Disconnection Time" value={t351Data.disconnection_time as string} />
                    <FormDocField label="Line Affected" value={t351Data.line_affected as string} />
                    <FormDocField label="Nature of Work" value={t351Data.work_nature as string} />
                    <FormDocField label="Department" value={t351Data.department as string} />
                    <FormDocField label="Disc. Private No. (PN)" value={t351Data.disconnection_private_number as string} />
                    <FormDocField label="Station Master Name" value={t351Data.station_master_name as string} />
                    <FormDocField label="Field Engineer" value={t351Data.field_engineer_name as string} />
                    <FormDocField label="Designation" value={t351Data.field_engineer_designation as string} />
                    <FormDocField label="Reconnection PN" value={t351Data.reconnection_private_number as string | null ?? 'Not yet reconnected'} />
                    <FormDocField label="Reconnection Time" value={t351Data.reconnection_time as string} />
                    <FormDocField label="TSR Imposed" value={t351Data.tsr_imposed ? `YES — ${t351Data.tsr_speed_kmph} km/h` : 'No'} />
                    <FormDocField label="Remarks" value={t351Data.remarks as string} />
                    <FormDocField label="Form Status" value={t351Data.status as string} />
                    <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                      <button className="ir-btn ir-btn-outline" style={{ fontSize: 11 }} onClick={() => downloadJson(t351Data, `T351_${selectedBlockId.slice(0, 8)}.json`)}>⬇ Download JSON</button>
                    </div>
                  </div>
                )
            }
          </div>
        </div>

        {/* CRIS BDMS */}
        <div className="ir-panel">
          <div className="ir-panel-header">CRIS BDMS — Block Demand &amp; Management Export</div>
          <div className="ir-panel-body">
            {formLoading === 'bdms'
              ? <div className="ir-loading"><div className="ir-spinner" /> Generating BDMS payload...</div>
              : !bdmsData
                ? <div className="ir-empty">Click "CRIS BDMS" to generate the standard JSON payload for BDMS integration.</div>
                : (
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <button
                        className="ir-btn ir-btn-outline"
                        style={{ fontSize: 11 }}
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(bdmsData, null, 2)).then(() => onNotify('BDMS JSON copied to clipboard', 'success'))}
                      >
                        📋 Copy JSON
                      </button>
                      <button
                        className="ir-btn ir-btn-outline"
                        style={{ fontSize: 11 }}
                        onClick={() => downloadJson(bdmsData, `BDMS_${bdmsData.bdms_message_id ?? 'export'}.json`)}
                      >
                        ⬇ Download
                      </button>
                    </div>
                    <div style={{ fontSize: 11, marginBottom: 6, color: '#555' }}>
                      <strong>Message ID:</strong> {bdmsData.bdms_message_id as string} &nbsp;|&nbsp;
                      <strong>Block Type:</strong> {bdmsData.block_type as string} &nbsp;|&nbsp;
                      <strong>Primary Dept:</strong> {bdmsData.primary_department as string}
                    </div>
                    <pre className="ir-pre">{JSON.stringify(bdmsData, null, 2)}</pre>
                  </div>
                )
            }
          </div>
        </div>

        {/* Form T/D 602 */}
        <div className="ir-panel">
          <div className="ir-panel-header">Form T/D 602 — Single Line Working Authority</div>
          <div className="ir-panel-body">
            {formLoading === 'td602'
              ? <div className="ir-loading"><div className="ir-spinner" /> Loading SLW form...</div>
              : !td602Data
                ? <div className="ir-empty">Click "Form T/D 602" to load the Single Line Working authority sheet. Only available for blocks with SLW advisory.</div>
                : (
                  <div className="ir-form-doc">
                    <div className="ir-form-doc-title">
                      {String(td602Data.form_name ?? 'Form T/D 602')}<br />
                      <span style={{ fontSize: 10, fontWeight: 400 }}>{String(td602Data.statutory_rule ?? '')}</span>
                    </div>
                    <FormDocField label="Division" value={td602Data.division as string} />
                    <FormDocField label="Zone" value={td602Data.zone as string} />
                    <FormDocField label="Section" value={td602Data.section_code as string} />
                    <FormDocField label="Date &amp; Time" value={td602Data.date_time as string} />
                    <FormDocField label="Line Obstructed" value={td602Data.line_obstructed as string} />
                    <FormDocField label="Line in Use" value={td602Data.line_in_use as string} />
                    <FormDocField label="Pilot Train No." value={td602Data.pilot_train_number as string} />
                    <FormDocField label="SM Private Number" value={td602Data.station_master_private_number as string} />

                    {Boolean(td602Data.part_1_line_clear_ticket) && (
                      <div style={{ marginTop: 10, padding: 8, background: '#f0f4f8', border: '1px solid #90a4ae', fontSize: 11 }}>
                        <strong>Part I — Line Clear Ticket:</strong><br />
                        {String(td602Data.part_1_line_clear_ticket)}
                      </div>
                    )}
                    {Boolean(td602Data.part_2_authority_to_pass_signals_at_on) && (
                      <div style={{ marginTop: 6, padding: 8, background: '#fff3e0', border: '1px solid #ef6c00', fontSize: 11 }}>
                        <strong>Part II — Authority to Pass Signals at ON:</strong><br />
                        {String(td602Data.part_2_authority_to_pass_signals_at_on)}
                      </div>
                    )}
                    {td602caution && (
                      <div style={{ marginTop: 6, padding: 8, background: '#fce4ec', border: '1px solid #c62828', fontSize: 11 }}>
                        <strong>Part III — Caution Order:</strong><br />
                        Pilot speed: {String(td602caution.pilot_train_speed)}<br />
                        Facing points: {String(td602caution.facing_points_speed)}<br />
                        Subsequent trains: {String(td602caution.subsequent_train_speed)}<br />
                        Clamping: {String(td602caution.clamping_padlocking_mandate)}
                      </div>
                    )}
                    {Boolean(td602Data.controller_phone_script) && (
                      <div style={{ marginTop: 6, padding: 8, background: '#e8f5e9', border: '1px solid #2e7d32', fontSize: 11 }}>
                        <strong>Controller Phone Script:</strong><br />
                        {String(td602Data.controller_phone_script)}
                      </div>
                    )}
                  </div>
                )
            }
          </div>
        </div>
      </div>

      {/* Manual Ingestion Panel */}
      <div className="ir-panel">
        <div className="ir-panel-header">Manual Defect Ingestion — TMS / SMMS / TDMS</div>
        <div className="ir-panel-body">
          <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
            Manually enter defect data from Track Management System (TMS), Signal &amp; Maintenance Management System (SMMS), or Traction Distribution Management System (TDMS). The backend will create a maintenance request, run AI risk scoring, and make it available for the optimizer.
          </div>
          <div className="ir-form-row">
            <div className="ir-form-group">
              <label className="ir-label">Source System</label>
              <select className="ir-select" value={ingestDept} onChange={e => setIngestDept(e.target.value as IngestDept)}>
                <option value="TMS">TMS — Track Management System</option>
                <option value="SMMS">SMMS — Signal &amp; Maintenance</option>
                <option value="TDMS">TDMS — Traction Distribution</option>
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Section</label>
              <select className="ir-select" value={ingestSectionId} onChange={e => setIngestSectionId(e.target.value)}>
                <option value="">— Select Section —</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.section_code} — {s.division}</option>)}
              </select>
            </div>
            <div className="ir-form-group">
              <label className="ir-label">Est. Duration (min)</label>
              <input className="ir-input" type="number" value={ingestDuration} min={15} max={480} onChange={e => setIngestDuration(Number(e.target.value))} />
            </div>

            {ingestDept === 'TMS' && (
              <>
                <div className="ir-form-group">
                  <label className="ir-label">USFD Classification</label>
                  <select className="ir-select" value={ingestUsfd} onChange={e => setIngestUsfd(e.target.value)}>
                    <option value="Good">GOOD (Serviceable)</option>
                    <option value="OBS">OBS (Observed)</option>
                    <option value="OBSW">OBSW (Obs + Weld)</option>
                    <option value="IMR">IMR (Immediate Renewal Tier-1)</option>
                    <option value="IMRW">IMRW (IMR + Weld Tier-1)</option>
                  </select>
                </div>
                <div className="ir-form-group">
                  <label className="ir-label">TGI Deviation (0–100)</label>
                  <input className="ir-input" type="number" value={ingestTgi} step={0.5} min={0} max={100} onChange={e => setIngestTgi(Number(e.target.value))} />
                </div>
                <div className="ir-form-group">
                  <label className="ir-label">Chainage (km)</label>
                  <input className="ir-input" type="number" value={ingestChainage} step={0.5} onChange={e => setIngestChainage(Number(e.target.value))} />
                </div>
              </>
            )}

            {ingestDept === 'SMMS' && (
              <>
                <div className="ir-form-group">
                  <label className="ir-label">Point Failure Risk (0–100)</label>
                  <input className="ir-input" type="number" value={ingestPointRisk} step={1} min={0} max={100} onChange={e => setIngestPointRisk(Number(e.target.value))} />
                </div>
                <div className="ir-form-group">
                  <label className="ir-label">Station Code</label>
                  <input className="ir-input" placeholder="MAS" value={ingestStation} onChange={e => setIngestStation(e.target.value)} />
                </div>
              </>
            )}

            {ingestDept === 'TDMS' && (
              <>
                <div className="ir-form-group">
                  <label className="ir-label">OHE Wire Wear % (0–100)</label>
                  <input className="ir-input" type="number" value={ingestOheWear} step={1} min={0} max={100} onChange={e => setIngestOheWear(Number(e.target.value))} />
                </div>
                <div className="ir-form-group">
                  <label className="ir-label">Feeding Post / SP ID</label>
                  <input className="ir-input" placeholder="FP-MAS-01" value={ingestFp} onChange={e => setIngestFp(e.target.value)} />
                </div>
              </>
            )}

            <div className="ir-form-group" style={{ justifyContent: 'flex-end' }}>
              <button className="ir-btn ir-btn-primary" onClick={handleIngest} disabled={ingestLoading || !ingestSectionId}>
                {ingestLoading ? 'Ingesting...' : '+ Ingest Defect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
