# RailBlock: Automatic Block Planning Domain

The domain language for AI-driven infrastructure maintenance possession scheduling, corridor capacity optimization, and safety rulebook compliance on Indian Railways.

## Language

### Infrastructure & Geography

**Section**:
A distinct physical railway track segment between two consecutive block stations.
_Avoid_: Segment, stretch, track slice, rail chunk

**Feeding Post (FP) / Sectioning Post (SP)**:
A traction power substation switching installation that defines the electrical isolation boundaries for overhead equipment (OHE).
_Avoid_: Power station, substation node, electrical grid point

**Curvature (Track Geometry)**:
One of the six statutory track parameters measured to compute the Track Geometry Index (TGI): Gauge, Cross-Level, Twist, Longitudinal Level, Alignment, and Curvature.
_Avoid_: Versine defect, track bend factor, deformation curve

---

### Traffic & Capacity

**Corridor Gap**:
A continuous time interval on a section during which no train movements occupy the track.
_Avoid_: Free window, downtime slot, empty slot, track hole

**Safety Buffer**:
The statutory minimum time headway ($\ge 15\text{ mins}$) enforced before a train enters and after a train clears a section before maintenance possession can commence.
_Avoid_: Padding, margin, clearance gap, headway buffer

**Temporary Speed Restriction (TSR)**:
A statutory caution order mandating reduced train velocity over a track section following physical maintenance work.
_Avoid_: Slow zone, speed drop, speed limit

**Single Line Working (SLW) / Temporary Single Line Working (TSLW)**:
An emergency operational protocol under GR 3.68 and zonal SR Chapter 4/15 where trains move bidirectionally over a single track when the parallel line is obstructed or overrunning.
_Avoid_: Detour routing, single-track mode, bypass

---

### Maintenance & Possessions

**Maintenance Request**:
A formal requisition submitted by an engineering department (Track, Signal, or Traction) to inspect, repair, or renew physical assets.
_Avoid_: Ticket, task, defect log, job requisition

**Block**:
An officially granted possession window during which all regular train traffic is halted on a section for maintenance work.
_Avoid_: Closure, possession window, track freeze, rail blackout

**Joint Shadow Block**:
A consolidated block that executes multiple compatible maintenance requests from different departments concurrently within a single traffic closure.
_Avoid_: Bundled block, co-block, multi-department block, piggyback block

**Primary Block**:
The anchor maintenance activity within a Joint Shadow Block whose duration and spatial limits define the overall track possession window.
_Avoid_: Lead job, master block, main task

**Shadow Activity**:
A secondary, compatible maintenance task performed concurrently within the temporal and physical boundaries of a Primary Block.
_Avoid_: Sub-task, child job, attached block, nested activity

**Criticality Index (CI)**:
A normalized score from 0 to 100 representing the urgency, safety hazard, and operational risk of an unresolved defect.
_Avoid_: Priority score, severity rating, risk weight

**USFD Classification**:
The standard Indian Railways Ultrasonic Flaw Detection rail flaw grading system under IRPWM: **Good, IMR (Immediate Removal), IMRW (Immediate Removal - Weld), OBS (Observed), OBSW (Observed - Weld)**, categorized into T1 (immediate removal/protection) and T2 (re-test interval per GMT).
_Avoid_: Defect scale (0–3), flaw score, REM grading

---

### Optimization, Planning & Governance

**Constraint Programming (CP-SAT)**:
The exact mathematical constraint satisfaction and optimization solver engine (Google OR-Tools CP-SAT) used to solve candidate-block-to-corridor-gap assignments under hard safety, VIP zero-detention, and fleet capacity limits.
_Avoid_: Mixed-Integer Linear Program, heuristic rulebook

**Multi-Horizon Planning**:
The capability to generate synchronized 24-hour tactical schedules, 7-day weekly rolling plans, and 30-day monthly corridor maintenance plans from the same underlying constraint solver.
_Avoid_: Batch run, static calendar

**Divisional Authority**:
The competent administrative authority (DRM / GM level) required under Railway Board letter dated 16.06.2022 to sanction traffic blocks exceeding 4 hours and non-interlocking (NI) works exceeding 3 days.
_Avoid_: Division manager, senior supervisor, zone head

**Synthetic Seed Sandbox**:
A deterministic seed dataset whose structure mirrors the published schemas of TMS, SMMS, TDMS, and COA, calibrated to published Indian Railways operational statistics.
_Avoid_: Mock data, fake records, production RailNet dump

---

### Statutory Operations & Safety

**G&SR (General and Subsidiary Rules)**:
The binding statutory operating rulebook of Indian Railways governing train operations, safety headways, and block regulations.
_Avoid_: Rail policy, system rules, operating guidelines

**Form T/351**:
The statutory Indian Railways document exchanged between Station Masters and field engineers to officially authorize and close track disconnections.
_Avoid_: Work permit, gate pass, job authorization

**Form T/D 602**:
The statutory Indian Railways authority for Temporary Single Line Working (TSLW) on a double line section during total interruption or obstruction (combining Line Clear Ticket, Authority to Pass Signals at 'ON', and Caution Order).
_Avoid_: Detour permit, emergency pass, SLW ticket

**Private Number (PN)**:
A confidential unique numeric token exchanged between the Station Master and Field Engineer to legally authenticate block grant and clearance.
_Avoid_: Auth code, confirmation token, OTP, clearance PIN
