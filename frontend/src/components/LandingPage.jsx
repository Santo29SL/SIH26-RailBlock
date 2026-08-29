import React from 'react';
import { Link } from 'react-router-dom';

const stages = [
  { no: "01", tag: "INGEST", title: "Data Ingestion & Unification", body: "REST/SOAP adapters pull TGI, USFD flaws, point machine locking times, axle counter resets, OHE wear and live COA schedules into one normalised JSON schema.", tech: "Read-Only Edge Gateway · ETL" },
  { no: "02", tag: "SCORE", title: "AI Risk & Criticality Engine", body: "Gradient boosted trees compute a Criticality Index 0–100 from TGI deviation, speed restriction delta, days overdue and section GMT density.", tech: "XGBoost / LightGBM · SHAP XAI" },
  { no: "03", tag: "CAPACITY", title: "Corridor Gap Extraction", body: "Parses the COA timetable per section, profiles headway and velocity, and extracts downtime slots where usable duration clears the minimum block window.", tech: "Headway profiler · slot extractor" },
  { no: "04", tag: "CLUSTER", title: "Shadow Block Clustering", body: "Spatial-temporal DBSCAN groups defects inside a 10 km block section, matches FP/SP power isolation spans, then filters against the G&SR conflict matrix.", tech: "DBSCAN · G&SR matrix" },
  { no: "05", tag: "OPTIMISE", title: "Two-Tier Constraint Engine", body: "Space-time-state MILP assigns joint blocks to slots over weekly and monthly horizons. Mutually exclusive occupancy and 15-minute buffers are hard constraints.", tech: "Google OR-Tools · Airflow DAG" },
  { no: "06", tag: "ADAPT", title: "Real-Time Rescheduling & SLW", body: "WebSocket telemetry from COA triggers a localised heuristic re-solve past 20 minutes of delay. Overruns fall back to Single Line Working under GR&SR Ch. 5/15.", tech: "WebSockets · burst block protection" },
  { no: "07", tag: "DECIDE", title: "Control Office Dashboard", body: "Dual Gantt, GIS defect map and a what-if simulator, ending in a digital draft proposal pushed to BDMS with Form T/351 signoff preserved.", tech: "React · Leaflet · BDMS draft push" }
];

const timetable = [
  { no: "12951", name: "Mumbai Rajdhani Express", coaches: "1A / 2A / 3A", pri: "P1", arr: "22:48", dep: "22:50", halt: "2m", pf: "3", gap: "18m" },
  { no: "22435", name: "Vande Bharat Express", coaches: "EC / CC", pri: "P1", arr: "23:08", dep: "—", halt: "term", pf: "1", gap: "34m" },
  { no: "12617", name: "Mangala Lakshadweep Exp", coaches: "2A / 3A / SL", pri: "P3", arr: "23:42", dep: "23:47", halt: "5m", pf: "6", gap: "26m" },
  { no: "GOODS", name: "Freight rake — BOXNHL", coaches: "58 BOXN", pri: "P4", arr: "00:13", dep: "00:31", halt: "18m", pf: "GY", gap: "34m" },
  { no: "12801", name: "Satavahana Express", coaches: "2A / 3A / SL", pri: "P3", arr: "01:05", dep: "01:07", halt: "2m", pf: "5", gap: "165m" },
  { no: "12557", name: "Sapt Kranti Express", coaches: "2A / 3A / SL", pri: "P3", arr: "03:52", dep: "03:55", halt: "3m", pf: "4", gap: "41m" },
  { no: "12002", name: "Bhopal Shatabdi Express", coaches: "EC / CC", pri: "P2", arr: "04:36", dep: "—", halt: "orig", pf: "1", gap: "12m" }
];

export default function LandingPage() {
  return (
    <div style={{ minWidth: '1440px', fontFamily: 'var(--font-body)', color: 'var(--color-text)', overflow: 'hidden' }}>
      
      {/* Navigation */}
      <nav className="nav" style={{ padding: '16px 56px', borderBottom: '1px solid var(--color-divider)', gap: '34px' }}>
        <span className="nav-brand" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginRight: 'auto' }}>
          🚆 RailBlock AI
        </span>
        <a href="#problem">Problem</a>
        <a href="#pipeline">Pipeline</a>
        <a href="#shadow">Shadow Block</a>
        <a href="#corridor">Corridor</a>
        <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: '13px' }}>View Dashboard</Link>
        <a href="#signin" className="btn btn-primary blueprint" style={{ fontSize: '13px', padding: '8px 16px' }}>
          Enter Control Office
          <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
        </a>
      </nav>

      {/* Hero Section */}
      <section style={{ position: 'relative', padding: '64px 56px 0', background: 'linear-gradient(transparent 0 0), repeating-linear-gradient(to right, color-mix(in srgb, var(--color-text) 4%, transparent) 0 1px, transparent 1px 80px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '48px', maxWidth: '1328px', margin: '0 auto' }}>
          <div style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', animation: 'bp-rise .6s cubic-bezier(.2,.8,.2,1) both', animationDelay: '1.55s' }}>
              <span className="tag tag-outline" style={{ letterSpacing: '.1em' }}>MINISTRY OF RAILWAYS · CRIS / RDSO</span>
              <span style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>v2.0 · Grounded Edition</span>
            </div>
            <h1 style={{ fontSize: '76px', lineHeight: '.94', letterSpacing: '-.025em', margin: '0 0 20px', textWrap: 'balance', animation: 'bp-rise .7s cubic-bezier(.2,.8,.2,1) both', animationDelay: '1.7s' }}>
              One corridor.<br />One block.<br /><span style={{ color: 'var(--color-accent-700)' }}>Planned by AI.</span>
            </h1>
            <p style={{ fontSize: '17px', lineHeight: '1.5', maxWidth: '520px', color: 'color-mix(in srgb,var(--color-text) 74%,transparent)', animation: 'bp-rise .7s cubic-bezier(.2,.8,.2,1) both', animationDelay: '1.86s' }}>
              Track, Signal & Telecom and Traction Distribution each request possession separately through BDMS — closing the same section three times over. BlockPlan reads TMS, SMMS, TDMS, COA and BDMS, scores every job for risk, and bundles them into one Shadow Block that clears the timetable.
            </p>
          </div>
          <div style={{ flex: 'none', width: '352px', paddingBottom: '8px', animation: 'bp-rise .7s cubic-bezier(.2,.8,.2,1) both', animationDelay: '2.02s' }}>
            <div className="blueprint" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-accent-700)', marginBottom: '14px' }}>Section under plan</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', fontFamily: 'var(--font-heading)', fontSize: '34px', lineHeight: '1' }}>
                <span>NDLS</span>
                <span style={{ flex: '1', height: '1px', background: 'var(--color-divider)', transform: 'translateY(-9px)' }}></span>
                <span>GZB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', color: 'color-mix(in srgb,var(--color-text) 55%,transparent)' }}>
                <span>New Delhi</span><span>Ghaziabad Jn</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--color-divider)', marginTop: '18px' }}>
                <div style={{ background: 'var(--color-bg)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', lineHeight: '1' }}>4 UP/DN</div>
                  <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Lines</div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', lineHeight: '1' }}>46.2 km</div>
                  <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Chainage</div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', lineHeight: '1' }}>213</div>
                  <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Trains / day</div>
                </div>
                <div style={{ background: 'var(--color-bg)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', lineHeight: '1', color: 'var(--color-accent-700)' }}>17</div>
                  <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Open defects</div>
                </div>
              </div>
              <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', height: '290px', marginTop: '24px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '118px', height: '2px', background: 'color-mix(in srgb,var(--color-text) 22%,transparent)' }}></div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '106px', height: '1px', background: 'color-mix(in srgb,var(--color-text) 14%,transparent)' }}></div>
          <div style={{ position: 'absolute', left: '-80px', right: '-80px', bottom: '88px', height: '14px', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 18%,transparent) 0 3px, transparent 3px 40px)', animation: 'bp-tick .5s linear 6' }}></div>

          <div style={{ position: 'absolute', right: 0, bottom: '150px', width: '70%', height: '60px', pointerEvents: 'none', animation: 'bp-rush 1.9s cubic-bezier(.1,.7,.2,1) both' }}>
            <div style={{ position: 'absolute', top: '6px', right: 0, width: '100%', height: '1px', background: 'linear-gradient(to left,var(--color-accent),transparent)' }}></div>
            <div style={{ position: 'absolute', top: '22px', right: 0, width: '78%', height: '1px', background: 'linear-gradient(to left,var(--color-accent),transparent)' }}></div>
            <div style={{ position: 'absolute', top: '38px', right: 0, width: '92%', height: '1px', background: 'linear-gradient(to left,var(--color-accent),transparent)' }}></div>
          </div>

          <div style={{ position: 'absolute', left: '50%', bottom: 0, width: '1180px', transform: 'translateX(-50%)' }}>
            <div style={{ animation: 'bp-arrive 2.05s cubic-bezier(.16,.86,.18,1) both' }}>
              <svg viewBox="0 0 1180 300" style={{ width: '1180px', height: '300px', display: 'block', overflow: 'visible' }} fill="none" stroke="var(--color-text)" strokeWidth="1.4" strokeLinejoin="round">
                <line x1="-200" y1="26" x2="1380" y2="26" strokeWidth="1" stroke="color-mix(in srgb, var(--color-text) 30%, transparent)"></line>
                <path d="M 640 62 L 640 40 L 596 26 M 640 40 L 684 26" strokeWidth="1.2"></path>
                <path d="M 596 26 L 684 26" strokeWidth="2.4" stroke="var(--color-accent)"></path>

                <path d="M 1170 66 L 300 66 L 300 182 L 1170 182 Z M 300 76 C 210 76 148 84 108 100 C 78 112 62 128 56 146 C 52 158 54 168 62 176 C 70 182 82 182 82 182 L 300 182 Z" fill="var(--color-bg)" strokeWidth="1.8"></path>

                <path d="M 56 146 C 62 128 78 112 108 100 C 148 84 210 76 300 76 L 1170 76 L 1170 96 L 300 96 C 224 96 172 102 138 114 C 112 123 96 133 88 146 Z" fill="color-mix(in srgb, var(--color-accent) 88%, transparent)" stroke="var(--color-accent-800)" strokeWidth="1"></path>
                <path d="M 56 146 L 1170 146" stroke="var(--color-accent-800)" strokeWidth="1"></path>
                <path d="M 62 176 C 70 182 82 182 82 182 L 300 182" strokeWidth="1.6"></path>

                <path d="M 118 138 C 130 116 158 100 196 92 L 226 92 L 214 140 Z" fill="color-mix(in srgb, var(--color-accent-900) 82%, transparent)" stroke="var(--color-accent-900)" strokeWidth="1.3"></path>
                <circle cx="70" cy="152" r="5.5" fill="var(--color-bg)" stroke="var(--color-text)" strokeWidth="1.1"></circle>
                <circle cx="70" cy="152" r="9" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0" style={{ animation: 'bp-blink 1.4s ease-in-out infinite', animationDelay: '2.1s' }}></circle>
                <circle cx="70" cy="152" r="2.2" fill="var(--color-accent)" stroke="none" style={{ animation: 'bp-blink 1.4s ease-in-out infinite', animationDelay: '2.1s' }}></circle>
                <path d="M 56 168 C 60 174 68 178 82 178" strokeWidth="1.2"></path>

                <rect x="252" y="106" width="906" height="40" rx="1" strokeWidth="1.3" fill="color-mix(in srgb, var(--color-accent-900) 88%, transparent)"></rect>
                <g stroke="var(--color-bg)" strokeWidth="2">
                  <path d="M 300 108 L 300 144 M 336 108 L 336 144 M 372 108 L 372 144 M 408 108 L 408 144 M 444 108 L 444 144 M 480 108 L 480 144 M 516 108 L 516 144 M 552 108 L 552 144 M 588 108 L 588 144 M 624 108 L 624 144 M 660 108 L 660 144 M 696 108 L 696 144 M 732 108 L 732 144 M 768 108 L 768 144 M 804 108 L 804 144 M 840 108 L 840 144 M 876 108 L 876 144 M 912 108 L 912 144 M 948 108 L 948 144 M 984 108 L 984 144 M 1020 108 L 1020 144 M 1056 108 L 1056 144 M 1092 108 L 1092 144 M 1128 108 L 1128 144"></path>
                </g>
                <path d="M 570 66 L 570 182 M 858 66 L 858 182" strokeWidth="1" stroke="color-mix(in srgb, var(--color-text) 45%, transparent)"></path>
                <rect x="554" y="150" width="20" height="32" strokeWidth="1"></rect>
                <rect x="842" y="150" width="20" height="32" strokeWidth="1"></rect>
                <path d="M 82 182 L 1170 182" strokeWidth="1.2"></path>
                <path d="M 96 194 L 1170 194" stroke="var(--color-accent)" strokeWidth="2.4"></path>

                <rect x="352" y="196" width="150" height="12" strokeWidth="1"></rect>
                <rect x="622" y="196" width="150" height="12" strokeWidth="1"></rect>
                <rect x="892" y="196" width="150" height="12" strokeWidth="1"></rect>
                <rect x="1120" y="196" width="18" height="12" strokeWidth="1"></rect>

                <g strokeWidth="1.4">
                  <g style={{ transformOrigin: '180px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="180" cy="216" r="12"></circle><path d="M 180 204 L 180 228 M 168 216 L 192 216"></path></g>
                  <g style={{ transformOrigin: '272px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="272" cy="216" r="12"></circle><path d="M 272 204 L 272 228 M 260 216 L 284 216"></path></g>
                  <g style={{ transformOrigin: '450px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="450" cy="216" r="12"></circle><path d="M 450 204 L 450 228 M 438 216 L 462 216"></path></g>
                  <g style={{ transformOrigin: '542px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="542" cy="216" r="12"></circle><path d="M 542 204 L 542 228 M 530 216 L 554 216"></path></g>
                  <g style={{ transformOrigin: '720px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="720" cy="216" r="12"></circle><path d="M 720 204 L 720 228 M 708 216 L 732 216"></path></g>
                  <g style={{ transformOrigin: '812px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="812" cy="216" r="12"></circle><path d="M 812 204 L 812 228 M 800 216 L 824 216"></path></g>
                  <g style={{ transformOrigin: '990px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="990" cy="216" r="12"></circle><path d="M 990 204 L 990 228 M 978 216 L 1002 216"></path></g>
                  <g style={{ transformOrigin: '1082px 216px', animation: 'bp-wheel .34s linear 6' }}><circle cx="1082" cy="216" r="12"></circle><path d="M 1082 204 L 1082 228 M 1070 216 L 1094 216"></path></g>
                </g>
                <text x="300" y="252" fontFamily="Barlow Condensed" fontSize="19" fill="var(--color-accent-700)" stroke="none" letterSpacing="1.5">22435 · VANDE BHARAT EXPRESS</text>
                <text x="700" y="252" fontFamily="Barlow" fontSize="12" fill="color-mix(in srgb, var(--color-text) 55%, transparent)" stroke="none" letterSpacing="1">EC + 7 CC · PRIORITY CLASS 1 · MPS 130 KMPH</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" style={{ borderTop: '1px solid var(--color-divider)', borderBottom: '1px solid var(--color-divider)', background: 'var(--color-accent-900)', color: 'var(--color-neutral-100)' }}>
        <div style={{ maxWidth: '1328px', margin: '0 auto', padding: '44px 56px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'color-mix(in srgb,#fff 14%,transparent)' }}>
          <div style={{ background: 'var(--color-accent-900)', padding: '0 28px 0 0' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '52px', lineHeight: '1' }}>5.5<span style={{ fontSize: '24px' }}> hrs</span></div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '52px', lineHeight: '1', color: 'var(--color-accent-300)' }}>→ 2.5<span style={{ fontSize: '24px' }}> hrs</span></div>
            <p style={{ fontSize: '12.5px', margin: '12px 0 0', color: 'color-mix(in srgb,var(--color-neutral-100) 72%,transparent)' }}>Cumulative possession per section, three solo blocks vs one Joint Shadow Block.</p>
          </div>
          <div style={{ background: 'var(--color-accent-900)', padding: '0 28px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '52px', lineHeight: '1' }}>25–35<span style={{ fontSize: '24px' }}>%</span></div>
            <p style={{ fontSize: '12.5px', margin: '12px 0 0', color: 'color-mix(in srgb,var(--color-neutral-100) 72%,transparent)' }}>Empirical downtime recovery across routine multi-department schedules. Peak theoretical bound 55%.</p>
          </div>
          <div style={{ background: 'var(--color-accent-900)', padding: '0 28px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '52px', lineHeight: '1' }}>&lt; 30<span style={{ fontSize: '24px' }}> s</span></div>
            <p style={{ fontSize: '12.5px', margin: '12px 0 0', color: 'color-mix(in srgb,var(--color-neutral-100) 72%,transparent)' }}>Greedy heuristic re-solve when a train slips more than 20 minutes. Nightly MILP handles the 7-day base plan.</p>
          </div>
          <div style={{ background: 'var(--color-accent-900)', padding: '0 0 0 28px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '52px', lineHeight: '1' }}>70<span style={{ fontSize: '24px' }}>%</span></div>
            <p style={{ fontSize: '12.5px', margin: '12px 0 0', color: 'color-mix(in srgb,var(--color-neutral-100) 72%,transparent)' }}>Target reduction in train detention minutes, including IRPWM post-tamping TSR recovery curves.</p>
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section id="pipeline" style={{ maxWidth: '1328px', margin: '0 auto', padding: '64px 56px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '40px', margin: 0 }}>Seven stages, five feeds</h2>
          <span style={{ fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>§3 — End-to-end pipeline</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '28px 24px' }}>
          {stages.map((s, idx) => (
            <div key={idx} className="blueprint" style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '196px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', lineHeight: '1', color: 'var(--color-accent-300)' }}>{s.no}</span>
                <span className="tag tag-accent" style={{ fontSize: '10px' }}>{s.tag}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', lineHeight: '1.1' }}>{s.title}</div>
              <p style={{ fontSize: '12.5px', margin: 0, color: 'color-mix(in srgb,var(--color-text) 68%,transparent)', flex: 1 }}>{s.body}</p>
              <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-accent-700)', borderTop: '1px solid var(--color-divider)', paddingTop: '8px' }}>{s.tech}</div>
              <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
            </div>
          ))}
          <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '10px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Air-gap note</div>
            <p style={{ fontSize: '12.5px', margin: 0, color: 'color-mix(in srgb,var(--color-text) 68%,transparent)' }}>All legacy reads pass through a Read-Only Edge Gateway on RailNet. Nothing is written back except the Form T/351 draft proposal.</p>
          </div>
        </div>
      </section>

      {/* Shadow Block Section */}
      <section id="shadow" style={{ maxWidth: '1328px', margin: '0 auto', padding: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '40px', margin: 0 }}>Shadow blocking, drawn to scale</h2>
          <span style={{ fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>§4 — Fig. 02</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div className="blueprint" style={{ padding: '22px 24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>Un-coordinated</div>
                <div style={{ fontSize: '11px', color: 'color-mix(in srgb,var(--color-text) 55%,transparent)' }}>Current BDMS state · three separate requests</div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '34px', lineHeight: '1' }}>5.5 hrs</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', letterSpacing: '.1em', color: 'color-mix(in srgb,var(--color-text) 45%,transparent)', borderBottom: '1px solid var(--color-divider)', paddingBottom: '5px', marginBottom: '12px' }}>
              <span>01:00</span><span>02:00</span><span>03:00</span><span>04:00</span><span>05:00</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', letterSpacing: '.04em' }}>ENGG (TMS)</span>
                <div style={{ height: '26px', position: 'relative', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 8%,transparent) 0 1px, transparent 1px 25%)' }}>
                  <div style={{ position: 'absolute', left: 0, width: '52%', top: 0, bottom: 0, border: '1px solid var(--color-accent)', background: 'color-mix(in srgb,var(--color-accent) 16%,transparent)', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '11px' }}>Track rail grinding · 2.5 h</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', letterSpacing: '.04em' }}>S&amp;T (SMMS)</span>
                <div style={{ height: '26px', position: 'relative', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 8%,transparent) 0 1px, transparent 1px 25%)' }}>
                  <div style={{ position: 'absolute', left: '56%', width: '30%', top: 0, bottom: 0, border: '1px solid var(--color-accent)', background: 'color-mix(in srgb,var(--color-accent) 16%,transparent)', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '11px' }}>Point machine · 1.5 h</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', letterSpacing: '.04em' }}>TRD (TDMS)</span>
                <div style={{ height: '26px', position: 'relative', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 8%,transparent) 0 1px, transparent 1px 25%)' }}>
                  <div style={{ position: 'absolute', left: '88%', width: '12%', top: 0, bottom: 0, border: '1px solid var(--color-accent)', background: 'color-mix(in srgb,var(--color-accent) 16%,transparent)' }}></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-divider)', fontSize: '11.5px', color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
              Total track closed 5.5 hrs · 3 traffic closures · 3 Form T/351 cycles
            </div>
            <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
          </div>

          <div className="blueprint" style={{ padding: '22px 24px 20px', background: 'color-mix(in srgb,var(--color-accent) 5%,transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--color-accent-800)' }}>Joint Shadow Block</div>
                <div style={{ fontSize: '11px', color: 'color-mix(in srgb,var(--color-text) 55%,transparent)' }}>Spatial-temporal DBSCAN + G&amp;SR conflict matrix</div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '34px', lineHeight: '1', color: 'var(--color-accent-800)' }}>2.5 hrs</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', letterSpacing: '.1em', color: 'color-mix(in srgb,var(--color-text) 45%,transparent)', borderBottom: '1px solid var(--color-divider)', paddingBottom: '5px', marginBottom: '12px' }}>
              <span>01:00</span><span>02:00</span><span>03:00</span><span>04:00</span><span>05:00</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', letterSpacing: '.04em' }}>PRIMARY · TMS</span>
                <div style={{ height: '26px', position: 'relative', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 8%,transparent) 0 1px, transparent 1px 25%)' }}>
                  <div style={{ position: 'absolute', left: 0, width: '52%', top: 0, bottom: 0, background: 'var(--color-accent)', color: 'var(--color-bg)', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '11px', fontFamily: 'var(--font-heading)' }}>TRACK RAIL GRINDING · 2.5 H</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', letterSpacing: '.04em' }}>SHADOW · SMMS</span>
                <div style={{ height: '26px', position: 'relative', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 8%,transparent) 0 1px, transparent 1px 25%)' }}>
                  <div style={{ position: 'absolute', left: '4%', width: '34%', top: 0, bottom: 0, border: '1px dashed var(--color-accent-700)', background: 'color-mix(in srgb,var(--color-accent) 22%,transparent)', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '11px' }}>S&amp;T point inspection</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11.5px', letterSpacing: '.04em' }}>SHADOW · TDMS</span>
                <div style={{ height: '26px', position: 'relative', background: 'repeating-linear-gradient(to right, color-mix(in srgb,var(--color-text) 8%,transparent) 0 1px, transparent 1px 25%)' }}>
                  <div style={{ position: 'absolute', left: '22%', width: '28%', top: 0, bottom: 0, border: '1px dashed var(--color-accent-700)', background: 'color-mix(in srgb,var(--color-accent) 22%,transparent)', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '11px' }}>OHE wire maintenance</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-divider)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--color-accent-800)' }}>
              <span>Total track closed 2.5 hrs · 1 traffic closure</span>
              <strong style={{ fontFamily: 'var(--font-heading)', letterSpacing: '.04em' }}>55% RECOVERED</strong>
            </div>
            <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
          </div>
        </div>
        <p style={{ fontSize: '12.5px', margin: '18px 0 0', maxWidth: '900px', color: 'color-mix(in srgb,var(--color-text) 62%,transparent)' }}>
          Grouping is constrained, not opportunistic-at-any-cost: defects must fall within a 10 km block section, TDMS power blocks must align to the same FP/SP isolation span (40–80 km), and the hard-coded G&amp;SR conflict matrix forbids incompatible pairs — point machine testing cannot run while a tamping machine works the same chainage.
        </p>
      </section>

      {/* Corridor Section */}
      <section id="corridor" style={{ borderTop: '1px solid var(--color-divider)', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '1328px', margin: '0 auto', padding: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '40px', margin: 0 }}>Tonight's corridor, NDLS – GZB</h2>
            <span style={{ fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>§3 — Gap extraction from COA</span>
          </div>
          <div className="blueprint" style={{ padding: 0, background: 'var(--color-bg)' }}>
            <table className="table" style={{ fontSize: '13.5px' }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '20px' }}>Train</th><th>Service</th><th>Class</th><th>Pri</th>
                  <th style={{ textAlign: 'right' }}>Arr</th><th style={{ textAlign: 'right' }}>Dep</th><th style={{ textAlign: 'right' }}>Halt</th>
                  <th style={{ textAlign: 'center' }}>PF</th><th style={{ textAlign: 'right', paddingRight: '20px' }}>Gap to next</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ paddingLeft: '20px', fontFamily: 'var(--font-heading)', fontSize: '15px' }}>{t.no}</td>
                    <td>{t.name}</td>
                    <td style={{ color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>{t.coaches}</td>
                    <td><span className="tag tag-neutral" style={{ fontSize: '10px' }}>{t.pri}</span></td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.arr}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.dep}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>{t.halt}</td>
                    <td style={{ textAlign: 'center' }}>{t.pf}</td>
                    <td style={{ textAlign: 'right', paddingRight: '20px', fontVariantNumeric: 'tabular-nums' }}>{t.gap}</td>
                  </tr>
                ))}
                <tr style={{ background: 'color-mix(in srgb,var(--color-accent) 12%,transparent)' }}>
                  <td colSpan="9" style={{ padding: '12px 20px', fontFamily: 'var(--font-heading)', fontSize: '15px', letterSpacing: '.03em', color: 'var(--color-accent-800)' }}>
                    ▣ DOWNTIME SLOT DETECTED — 165 min raw gap · 01:22 to 03:37 usable after 15 min safety buffers · fits a 2 h Joint Shadow Block
                  </td>
                </tr>
              </tbody>
            </table>
            <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
          </div>
        </div>
      </section>

      {/* Sign In Section */}
      <section id="signin" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div style={{ maxWidth: '1328px', margin: '0 auto', padding: '64px 56px', display: 'grid', gridTemplateColumns: '1fr 440px', gap: '64px', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '40px', margin: '0 0 16px' }}>Enter the Control Office</h2>
            <p style={{ fontSize: '16px', maxWidth: '560px', color: 'color-mix(in srgb,var(--color-text) 72%,transparent)' }}>
              Section Controllers, PWI and S&amp;T engineers sign in against their divisional roster. The dashboard is read-only against BDMS until a draft proposal is signed with a Private Number.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginTop: '36px', maxWidth: '640px' }}>
              <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '12px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', lineHeight: '1' }}>68+</div>
                <div style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Divisions in scope</div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '12px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', lineHeight: '1' }}>5 feeds</div>
                <div style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>TMS SMMS TDMS COA BDMS</div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '12px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', lineHeight: '1' }}>T/351</div>
                <div style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Statutory notice preserved</div>
              </div>
            </div>
          </div>
          <div className="blueprint" style={{ padding: '28px 30px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '10.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Controller sign-in</div>
            <div className="field"><label>Zone / Division</label>
              <select className="input"><option>Northern Railway — Delhi Division</option><option>North Central — Prayagraj Division</option><option>Western — Mumbai Central Division</option></select>
            </div>
            <div className="field"><label>Controller ID</label><input className="input" defaultValue="NR-DLI-SC-0412" /></div>
            <div className="field"><label>Password</label><input className="input" type="password" defaultValue="············" /></div>
            <div className="field"><label>Private Number (Form T/351 signing)</label><input className="input" placeholder="Issued by Station Master on execution" /></div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingTop: '2px' }}>
              <label className="radio"><input type="radio" name="role" defaultChecked /><span className="dot"></span>Controller</label>
              <label className="radio"><input type="radio" name="role" /><span className="dot"></span>PWI</label>
              <label className="radio"><input type="radio" name="role" /><span className="dot"></span>S&amp;T</label>
            </div>
            <Link to="/dashboard" className="btn btn-primary btn-block blueprint" style={{ padding: '12px', fontSize: '15px', marginTop: '6px' }}>
              Enter Control Office →<i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
            </Link>
            <p style={{ fontSize: '11px', margin: 0, color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>Access is logged against RailNet. Read-Only Edge Gateway — no write path to TMS, SMMS or TDMS.</p>
            <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--color-divider)', padding: '26px 56px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'color-mix(in srgb,var(--color-text) 50%,transparent)' }}>
        <span>· AI-Powered Automatic Block Planning · Ministry of Railways (CRIS / RDSO)</span>
        <span>Mockup — Master System Proposal v2.0</span>
      </footer>
    </div>
  );
}
