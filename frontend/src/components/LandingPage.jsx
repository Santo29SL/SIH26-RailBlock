import React from 'react';
import { Link } from 'react-router-dom';

const stages = [
  { no: "01", tag: "INGEST",   title: "Data Ingestion",          body: "REST/SOAP adapters pull TGI, USFD flaws, point machine locking times, OHE wear and live COA schedules into one normalised JSON schema.", tech: "Edge Gateway · ETL" },
  { no: "02", tag: "SCORE",    title: "AI Risk Engine",           body: "Gradient boosted trees compute Criticality Index 0–100 from TGI deviation, speed restriction delta, days overdue and section GMT density.", tech: "XGBoost · SHAP XAI" },
  { no: "03", tag: "CAPACITY", title: "Gap Extraction",           body: "Parses COA timetable per section, profiles headway and velocity, extracts downtime slots where usable duration clears minimum block window.", tech: "Headway profiler · extractor" },
  { no: "04", tag: "CLUSTER",  title: "Shadow Block Clustering",  body: "Spatial-temporal DBSCAN groups defects inside 10 km block sections, matches FP/SP isolation spans, filters against G&SR conflict matrix.", tech: "DBSCAN · G&SR matrix" },
  { no: "05", tag: "OPTIMISE", title: "Constraint Engine",        body: "Space-time-state MILP assigns joint blocks over weekly and monthly horizons. Mutually exclusive occupancy and 15-min buffers are hard constraints.", tech: "Google OR-Tools · Airflow" },
  { no: "06", tag: "ADAPT",    title: "Real-Time Reschedule",     body: "WebSocket telemetry from COA triggers localised heuristic re-solve past 20 min delay. Overruns fall back to Single Line Working under GR&SR.", tech: "WebSockets · burst protection" },
  { no: "07", tag: "DECIDE",   title: "Control Office",           body: "Dual Gantt, GIS defect map and what-if simulator. Digital draft proposal pushed to BDMS with Form T/351 signoff preserved.", tech: "React · Leaflet · BDMS" },
];

const timetable = [
  { no: "12951", name: "Mumbai Rajdhani Express",   coaches: "1A/2A/3A", pri: "P1", arr: "22:48", dep: "22:50", halt: "2m",   pf: "3",  gap: "18m",  slot: false },
  { no: "22435", name: "Vande Bharat Express",      coaches: "EC/CC",    pri: "P1", arr: "23:08", dep: "—",     halt: "term", pf: "1",  gap: "34m",  slot: false },
  { no: "12617", name: "Mangala Lakshadweep Exp",   coaches: "2A/3A/SL", pri: "P3", arr: "23:42", dep: "23:47", halt: "5m",   pf: "6",  gap: "26m",  slot: false },
  { no: "GOODS", name: "Freight rake — BOXNHL",     coaches: "58 BOXN",  pri: "P4", arr: "00:13", dep: "00:31", halt: "18m",  pf: "GY", gap: "34m",  slot: false },
  { no: "12801", name: "Satavahana Express",         coaches: "2A/3A/SL", pri: "P3", arr: "01:05", dep: "01:07", halt: "2m",   pf: "5",  gap: "165m", slot: true  },
  { no: "12557", name: "Sapt Kranti Express",        coaches: "2A/3A/SL", pri: "P3", arr: "03:52", dep: "03:55", halt: "3m",   pf: "4",  gap: "41m",  slot: false },
  { no: "12002", name: "Bhopal Shatabdi Express",   coaches: "EC/CC",    pri: "P2", arr: "04:36", dep: "—",     halt: "orig", pf: "1",  gap: "12m",  slot: false },
];

const priColor = { P1: 'var(--red)', P2: 'var(--amber)', P3: 'var(--cyan)', P4: 'var(--text-3)' };

export default function LandingPage() {
  return (
    <div style={{ minWidth: 1200, fontFamily: 'var(--font-body)', color: 'var(--text)', background: 'var(--bg)' }}>

      {/* ── Nav ── */}
      <nav className="nav" style={{ padding: '0 48px', gap: 32, height: 56 }}>
        <span className="nav-brand" style={{ marginRight: 'auto' }}>
          <span style={{ color: 'var(--amber)' }}>⬛</span> RAILBLOCK AI
        </span>
        {['problem','pipeline','shadow','corridor'].map(id => (
          <a key={id} href={`#${id}`} style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase' }}>{id}</a>
        ))}
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 18px', fontSize: 12, letterSpacing: '.06em', fontFamily: 'var(--font-display)', fontWeight: 600,
          border: '1px solid var(--amber)', color: 'var(--amber)',
          background: 'transparent', borderRadius: 2,
          transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#05070d'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)'; }}
        >
          ENTER CONTROL OFFICE →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', padding: '72px 48px 0',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        {/* dot grid bg */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255 255 255 / .04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />
        {/* amber glow top-left */}
        <div style={{
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(245 158 11 / .08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1300, margin: '0 auto', position: 'relative' }}>
          {/* Tag line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, animation: 'bp-rise .5s ease both', animationDelay: '.1s', opacity: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid rgba(245 158 11 / .3)', borderRadius: 2, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--amber)' }}>
              <span className="signal-dot amber" style={{ width: 5, height: 5 }} />
              MINISTRY OF RAILWAYS · CRIS / RDSO · SIH 2026
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--text-3)' }}>PS 26027</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 48 }}>
            <div style={{ maxWidth: 660 }}>
              <h1 style={{
                fontSize: 'clamp(56px, 7vw, 96px)', lineHeight: .9, fontWeight: 700,
                letterSpacing: '-.01em', margin: '0 0 24px',
                animation: 'bp-rise .6s ease both', animationDelay: '.2s', opacity: 0,
              }}>
                One corridor.<br />One block.<br />
                <span style={{ color: 'var(--amber)' }}>Planned by AI.</span>
              </h1>
              <p style={{
                fontSize: 16, lineHeight: 1.65, maxWidth: 540, color: 'var(--text-2)',
                animation: 'bp-rise .6s ease both', animationDelay: '.35s', opacity: 0,
              }}>
                Three departments close the same section separately — wasting 5.5 hours.
                RailBlock reads TMS, SMMS, TDMS, COA and BDMS, scores every job for risk,
                and bundles them into one <strong style={{ color: 'var(--text)' }}>Joint Shadow Block</strong> that clears the timetable.
              </p>
              <div style={{ display: 'flex', gap: 14, marginTop: 28, animation: 'bp-rise .6s ease both', animationDelay: '.45s', opacity: 0 }}>
                <Link to="/dashboard" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 15, letterSpacing: '.06em', borderRadius: 2,
                  background: 'var(--amber)', color: '#05070d', border: 'none',
                  cursor: 'pointer', textDecoration: 'none',
                  transition: 'all .15s',
                  boxShadow: '0 0 20px rgba(245 158 11 / .25)',
                }}>
                  OPEN DASHBOARD →
                </Link>
                <a href="#pipeline" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', fontFamily: 'var(--font-display)', fontWeight: 600,
                  fontSize: 14, letterSpacing: '.06em', borderRadius: 2, textDecoration: 'none',
                  background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-2)',
                  transition: 'all .15s',
                }}>
                  HOW IT WORKS
                </a>
              </div>
            </div>

            {/* Stats card */}
            <div style={{
              flexShrink: 0, width: 340,
              border: '1px solid var(--border-2)', background: 'var(--surface)',
              animation: 'bp-rise .6s ease both', animationDelay: '.5s', opacity: 0,
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--amber)', textTransform: 'uppercase' }}>Section under plan</span>
                <span className="signal-dot amber" style={{ width: 7, height: 7 }} />
              </div>
              <div style={{ padding: '18px 18px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>
                  <span>NDLS</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-2)', transform: 'translateY(-8px)' }} />
                  <span>GZB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '.04em', marginBottom: 18 }}>
                  <span>New Delhi</span><span>Ghaziabad Jn</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)' }}>
                  {[
                    ['4 UP/DN', 'Lines'],
                    ['46.2 km', 'Chainage'],
                    ['213', 'Trains/day'],
                    ['17', 'Open defects', 'var(--red)'],
                  ].map(([val, lbl, col]) => (
                    <div key={lbl} style={{ background: 'var(--surface)', padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, lineHeight: 1, color: col ?? 'var(--text)' }}>{val}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 3 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Train SVG */}
          <div style={{ position: 'relative', height: 280, marginTop: 32, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 112, height: 2, background: 'rgba(255 255 255 / .12)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 100, height: 1, background: 'rgba(255 255 255 / .07)' }} />
            <div style={{
              position: 'absolute', left: -80, right: -80, bottom: 82, height: 12,
              background: 'repeating-linear-gradient(to right, rgba(255 255 255 / .1) 0 3px, transparent 3px 40px)',
              animation: 'bp-tick .5s linear 6',
            }} />
            <div style={{ position: 'absolute', right: 0, bottom: 140, width: '70%', height: 60, pointerEvents: 'none', animation: 'bp-rush 1.9s cubic-bezier(.1,.7,.2,1) both' }}>
              <div style={{ position: 'absolute', top: 6, right: 0, width: '100%', height: 1, background: 'linear-gradient(to left,var(--amber),transparent)' }} />
              <div style={{ position: 'absolute', top: 22, right: 0, width: '78%', height: 1, background: 'linear-gradient(to left,var(--amber),transparent)' }} />
              <div style={{ position: 'absolute', top: 38, right: 0, width: '92%', height: 1, background: 'linear-gradient(to left,var(--amber),transparent)' }} />
            </div>
            <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 1180, transform: 'translateX(-50%)' }}>
              <div style={{ animation: 'bp-arrive 2.05s cubic-bezier(.16,.86,.18,1) both' }}>
                <svg viewBox="0 0 1180 300" style={{ width: 1180, height: 300, display: 'block', overflow: 'visible' }} fill="none" stroke="var(--text)" strokeWidth="1.4" strokeLinejoin="round">
                  <line x1="-200" y1="26" x2="1380" y2="26" strokeWidth="1" stroke="rgba(255 255 255 / .15)" />
                  <path d="M 640 62 L 640 40 L 596 26 M 640 40 L 684 26" strokeWidth="1.2" />
                  <path d="M 596 26 L 684 26" strokeWidth="2.4" stroke="var(--amber)" />
                  <path d="M 1170 66 L 300 66 L 300 182 L 1170 182 Z M 300 76 C 210 76 148 84 108 100 C 78 112 62 128 56 146 C 52 158 54 168 62 176 C 70 182 82 182 82 182 L 300 182 Z" fill="var(--bg)" strokeWidth="1.8" />
                  <path d="M 56 146 C 62 128 78 112 108 100 C 148 84 210 76 300 76 L 1170 76 L 1170 96 L 300 96 C 224 96 172 102 138 114 C 112 123 96 133 88 146 Z" fill="rgba(245 158 11 / .9)" stroke="rgba(245 158 11 / .5)" strokeWidth="1" />
                  <path d="M 56 146 L 1170 146" stroke="rgba(245 158 11 / .3)" strokeWidth="1" />
                  <path d="M 62 176 C 70 182 82 182 82 182 L 300 182" strokeWidth="1.6" />
                  <path d="M 118 138 C 130 116 158 100 196 92 L 226 92 L 214 140 Z" fill="rgba(15 18 32 / .9)" stroke="rgba(245 158 11 / .4)" strokeWidth="1.3" />
                  <circle cx="70" cy="152" r="5.5" fill="var(--bg)" stroke="var(--text)" strokeWidth="1.1" />
                  <circle cx="70" cy="152" r="9" fill="none" stroke="var(--amber)" strokeWidth="1" opacity="0" style={{ animation: 'bp-blink 1.4s ease-in-out infinite', animationDelay: '2.1s' }} />
                  <circle cx="70" cy="152" r="2.2" fill="var(--amber)" stroke="none" style={{ animation: 'bp-blink 1.4s ease-in-out infinite', animationDelay: '2.1s' }} />
                  <path d="M 56 168 C 60 174 68 178 82 178" strokeWidth="1.2" />
                  <rect x="252" y="106" width="906" height="40" rx="1" strokeWidth="1.3" fill="rgba(15 18 32 / .95)" />
                  <g stroke="rgba(255 255 255 / .12)" strokeWidth="2">
                    {[300,336,372,408,444,480,516,552,588,624,660,696,732,768,804,840,876,912,948,984,1020,1056,1092,1128].map(x => (
                      <path key={x} d={`M ${x} 108 L ${x} 144`} />
                    ))}
                  </g>
                  <path d="M 570 66 L 570 182 M 858 66 L 858 182" strokeWidth="1" stroke="rgba(255 255 255 / .2)" />
                  <rect x="554" y="150" width="20" height="32" strokeWidth="1" />
                  <rect x="842" y="150" width="20" height="32" strokeWidth="1" />
                  <path d="M 82 182 L 1170 182" strokeWidth="1.2" />
                  <path d="M 96 194 L 1170 194" stroke="var(--amber)" strokeWidth="2.4" />
                  {[[352],[622],[892],[1120]].map(([x], i) => (
                    <rect key={i} x={x} y="196" width={i === 3 ? 18 : 150} height="12" strokeWidth="1" />
                  ))}
                  <g strokeWidth="1.4">
                    {[180,272,450,542,720,812,990,1082].map(cx => (
                      <g key={cx} style={{ transformOrigin: `${cx}px 216px`, animation: 'bp-wheel .34s linear 6' }}>
                        <circle cx={cx} cy="216" r="12" />
                        <path d={`M ${cx} 204 L ${cx} 228 M ${cx-12} 216 L ${cx+12} 216`} />
                      </g>
                    ))}
                  </g>
                  <text x="300" y="252" fontFamily="Rajdhani" fontSize="19" fontWeight="700" fill="var(--amber)" stroke="none" letterSpacing="2">22435 · VANDE BHARAT EXPRESS</text>
                  <text x="700" y="252" fontFamily="IBM Plex Mono" fontSize="10" fill="rgba(220 228 240 / .35)" stroke="none" letterSpacing="1">EC + 7 CC · P1 · MPS 130 KMPH</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section id="problem" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '36px 48px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)' }}>
          {[
            { val: '5.5→2.5', unit: 'hrs', desc: 'Possession per section. Three solo blocks → one Joint Shadow Block.' },
            { val: '25–35', unit: '%',  desc: 'Empirical downtime recovery across routine multi-dept schedules. Peak 55%.' },
            { val: '< 30',  unit: 's',  desc: 'Greedy heuristic re-solve when train slips > 20 min. MILP handles 7-day base plan.' },
            { val: '70',    unit: '%',  desc: 'Target reduction in train detention minutes incl. IRPWM post-tamping TSR curves.' },
          ].map(({ val, unit, desc }) => (
            <div key={val} style={{ background: 'var(--surface)', padding: '28px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, lineHeight: 1, color: 'var(--amber)' }}>{val}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-2)' }}>{unit}</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section id="pipeline" style={{ maxWidth: 1300, margin: '0 auto', padding: '72px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
          <h2 style={{ margin: 0 }}>Seven stages, five feeds</h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text-3)' }}>§3 — END-TO-END PIPELINE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px 20px' }}>
          {stages.map((s, i) => (
            <div key={i} style={{
              border: '1px solid var(--border-2)', background: 'var(--surface)',
              padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8,
              minHeight: 196, position: 'relative',
              transition: 'border-color .2s, background .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245 158 11 / .35)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, lineHeight: 1, color: 'rgba(245 158 11 / .3)' }}>{s.no}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', padding: '3px 7px', border: '1px solid rgba(245 158 11 / .25)', color: 'var(--amber)', borderRadius: 2 }}>{s.tag}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, lineHeight: 1.15 }}>{s.title}</div>
              <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-2)', flex: 1, lineHeight: 1.6 }}>{s.body}</p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em', color: 'var(--amber)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>{s.tech}</div>
            </div>
          ))}
          <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>Air-gap note</div>
            <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-2)', lineHeight: 1.6 }}>All legacy reads pass through Read-Only Edge Gateway on RailNet. Nothing written back except Form T/351 draft proposal.</p>
          </div>
        </div>
      </section>

      {/* ── Shadow Block ── */}
      <section id="shadow" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '64px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
            <h2 style={{ margin: 0 }}>Shadow blocking, drawn to scale</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text-3)' }}>§4 — FIG. 02</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Before */}
            <div style={{ border: '1px solid var(--border-2)', background: 'var(--bg)', padding: '22px 24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Un-coordinated</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>Current BDMS · three separate requests</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--red)' }}>5.5 hrs</div>
              </div>
              <TimelineHeader />
              {[
                { dept: 'ENGG (TMS)', left: 0, width: 52, label: 'Track rail grinding · 2.5h' },
                { dept: 'S&T (SMMS)', left: 56, width: 30, label: 'Point machine · 1.5h' },
                { dept: 'TRD (TDMS)', left: 88, width: 12, label: '' },
              ].map(({ dept, left, width, label }) => (
                <GanttRow key={dept} dept={dept} left={left} width={width} label={label} highlight={false} />
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                3 traffic closures · 3 Form T/351 cycles
              </div>
            </div>
            {/* After */}
            <div style={{ border: '1px solid rgba(245 158 11 / .35)', background: 'rgba(245 158 11 / .04)', padding: '22px 24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--amber)' }}>Joint Shadow Block</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>DBSCAN + G&SR conflict matrix</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--green)' }}>2.5 hrs</div>
              </div>
              <TimelineHeader />
              {[
                { dept: 'PRIMARY · TMS',  left: 0, width: 52, label: 'Track rail grinding · 2.5h', primary: true },
                { dept: 'SHADOW · SMMS',  left: 4, width: 34, label: 'S&T point inspection', shadow: true },
                { dept: 'SHADOW · TDMS',  left: 22, width: 28, label: 'OHE wire maint.', shadow: true },
              ].map(({ dept, left, width, label, primary, shadow }) => (
                <GanttRow key={dept} dept={dept} left={left} width={width} label={label} primary={primary} shadow={shadow} />
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(245 158 11 / .3)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--text-3)' }}>1 traffic closure · 1 Form T/351</span>
                <strong style={{ color: 'var(--green)' }}>55% RECOVERED</strong>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12.5, margin: '16px 0 0', maxWidth: 900, color: 'var(--text-3)', lineHeight: 1.65 }}>
            Grouping is constrained, not opportunistic: defects must fall within 10 km block section, TDMS power blocks must align to same FP/SP isolation span (40–80 km), and hard-coded G&SR conflict matrix forbids incompatible pairs.
          </p>
        </div>
      </section>

      {/* ── Corridor / Timetable ── */}
      <section id="corridor" style={{ maxWidth: 1300, margin: '0 auto', padding: '72px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Tonight's corridor, NDLS–GZB</h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--text-3)' }}>§3 — GAP EXTRACTION FROM COA</span>
        </div>
        <div style={{ border: '1px solid var(--border-2)', background: 'var(--surface)', overflow: 'hidden' }}>
          <table className="table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Train</th>
                <th>Service</th>
                <th>Class</th>
                <th>Pri</th>
                <th style={{ textAlign: 'right' }}>Arr</th>
                <th style={{ textAlign: 'right' }}>Dep</th>
                <th style={{ textAlign: 'right' }}>Halt</th>
                <th style={{ textAlign: 'center' }}>PF</th>
                <th style={{ textAlign: 'right', paddingRight: 20 }}>Gap</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((t, i) => (
                <React.Fragment key={i}>
                  {t.slot && (
                    <tr>
                      <td colSpan="9" style={{
                        padding: '10px 20px',
                        background: 'rgba(245 158 11 / .08)',
                        borderTop: '1px solid rgba(245 158 11 / .3)',
                        borderBottom: '1px solid rgba(245 158 11 / .3)',
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--amber)', letterSpacing: '.04em',
                      }}>
                        ▣ DOWNTIME SLOT — 165 min raw gap · 01:22–03:37 usable · fits 2h Joint Shadow Block
                      </td>
                    </tr>
                  )}
                  <tr style={{ opacity: t.slot ? .5 : 1 }}>
                    <td style={{ paddingLeft: 20, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{t.no}</td>
                    <td>{t.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{t.coaches}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', border: `1px solid ${priColor[t.pri]}33`, color: priColor[t.pri], borderRadius: 2 }}>{t.pri}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.arr}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.dep}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>{t.halt}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.pf}</td>
                    <td style={{ textAlign: 'right', paddingRight: 20, fontFamily: 'var(--font-mono)', fontSize: 12, color: t.gap === '165m' ? 'var(--green)' : 'var(--text-2)' }}>{t.gap}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Sign-in ── */}
      <section id="signin" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr 440px', gap: 64 }}>
          <div>
            <h2 style={{ margin: '0 0 16px' }}>Enter the Control Office</h2>
            <p style={{ fontSize: 16, maxWidth: 540, color: 'var(--text-2)', lineHeight: 1.65 }}>
              Section Controllers, PWI and S&T engineers sign in against divisional roster. Dashboard is read-only against BDMS until draft proposal is signed with Private Number.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 36, maxWidth: 560 }}>
              {[['68+','Divisions in scope'],['5 feeds','TMS SMMS TDMS COA BDMS'],['T/351','Statutory notice preserved']].map(([val, lbl]) => (
                <div key={val} style={{ borderTop: '2px solid var(--amber)', paddingTop: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: '1px solid var(--border-2)', background: 'var(--bg)', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: 'var(--amber)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              Controller sign-in · RailNet authenticated
            </div>
            <div className="field"><label>Zone / Division</label>
              <select className="input"><option>Northern Railway — Delhi Division</option><option>North Central — Prayagraj Division</option><option>Western — Mumbai Central Division</option></select>
            </div>
            <div className="field"><label>Controller ID</label><input className="input" defaultValue="NR-DLI-SC-0412" /></div>
            <div className="field"><label>Password</label><input className="input" type="password" defaultValue="············" /></div>
            <div className="field"><label>Private Number (Form T/351 signing)</label><input className="input" placeholder="Issued by Station Master on execution" /></div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {['Controller','PWI','S&T'].map((r, i) => (
                <label key={r} className="radio">
                  <input type="radio" name="role" defaultChecked={i === 0} />
                  <span className="dot" />
                  <span style={{ fontSize: 13 }}>{r}</span>
                </label>
              ))}
            </div>
            <Link to="/dashboard" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '13px', marginTop: 4,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em',
              background: 'var(--amber)', color: '#05070d', textDecoration: 'none',
              borderRadius: 2, transition: 'all .15s',
              boxShadow: '0 0 20px rgba(245 158 11 / .2)',
            }}>
              ENTER CONTROL OFFICE →
            </Link>
            <p style={{ fontSize: 11, margin: 0, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>Access logged against RailNet. Read-Only Edge Gateway — no write path to TMS, SMMS or TDMS.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>AI-Powered Automatic Block Planning · Ministry of Railways (CRIS / RDSO) · PS 26027</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>SIH 2026 · v2.0</span>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */
function TimelineHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)', paddingBottom: 5, marginBottom: 10 }}>
      {['01:00','02:00','03:00','04:00','05:00'].map(t => <span key={t}>{t}</span>)}
    </div>
  );
}

function GanttRow({ dept, left, width, label, primary, shadow }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '.04em' }}>{dept}</span>
      <div style={{ height: 26, position: 'relative', background: 'repeating-linear-gradient(to right,rgba(255 255 255 / .04) 0 1px,transparent 1px 25%)' }}>
        <div style={{
          position: 'absolute', left: `${left}%`, width: `${width}%`,
          top: 0, bottom: 0,
          background: primary ? 'var(--amber)' : shadow ? 'rgba(245 158 11 / .15)' : 'rgba(245 158 11 / .12)',
          border: shadow ? '1px dashed rgba(245 158 11 / .5)' : primary ? 'none' : '1px solid rgba(245 158 11 / .3)',
          display: 'flex', alignItems: 'center', paddingLeft: 7,
          fontSize: 10, fontFamily: 'var(--font-mono)',
          color: primary ? '#05070d' : 'var(--amber)',
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
