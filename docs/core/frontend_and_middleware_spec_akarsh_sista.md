# SIH PS 26027: Frontend & Middleware Specification (Akarsh & Sista's Scope)
## Stage 7 UI Dashboard, External Adapters, and Middleware Integration

---

## 1. Scope & Ownership

Akarsh and Sista are responsible for:
1. **Frontend UI/UX Application (React + Vite + TailwindCSS):** Building the Control Office visual dashboard, Gantt charts, GIS mapping, What-If simulator, and Form T/351 sign-off workflows.
2. **Middleware & Integration Connectors:** Building the API client layer, WebSocket telemetry streaming client, external TMS/SMMS/TDMS ETL scripts, and CRIS BDMS export push connectors.

```mermaid
graph TD
    subgraph FRONTEND UI (React + Tailwind)
        UI1[Dual-Swimlane Gantt Chart]
        UI2[Leaflet GIS Track & Defect Map]
        UI3[What-If Simulation Slider UI]
        UI4[Form T/351 Statutory Portal]
        UI5[TSR Speed Recovery Chart]
    end

    subgraph MIDDLEWARE & INTEGRATION
        MW1[Backend Core API Client / TanStack Query]
        MW2[WebSocket Telemetry Event Listener]
        MW3[TMS / SMMS / TDMS ETL Data Ingestors]
        MW4[CRIS BDMS Official Push Connector]
        MW5[Air-Gap Read-Only Edge Gateway]
    end

    FRONTEND UI <--> MIDDLEWARE & INTEGRATION
    MIDDLEWARE & INTEGRATION <--> BE[(Aadith & Santhosh Backend Core)]
```

---

## 2. Frontend UI Deliverables (React.js / Vite / TailwindCSS)

### View 1: Dual-Swimlane Gantt Timeline Chart
* **Visual Components:**
  * **Top Swimlane:** Real-time train runs (Rajdhani/VB in Red, Express in Orange, Passenger in Blue, Goods in Grey).
  * **Bottom Swimlane:** Maintenance blocks (Proposed in Yellow, Approved in Green, Active in Red stripes).
  * **Joint Shadow Block Badge:** Visual badge showing combined departments (`TRACK` + `SIGNAL` + `TRACTION`).
* **Interactivity:** Time-scrubber slider (24h to 7-day view), tooltip with train delays, block duration, and included jobs.

### View 2: Interactive Geospatial GIS Track Map (Leaflet.js)
* **Visual Components:**
  * Railway track line strings loaded via GeoJSON.
  * **Defect Status Pins:** 🔴 Critical ($CI > 80$), 🟡 Moderate ($50 \le CI \le 80$), 🟢 Low risk.
  * **Traction Power Boundaries:** Visual FP/SP (Feeding Post / Sectioning Post) substation zones ($40\text{--}80\text{ km}$).
  * Active block hazard animations.

### View 3: "What-If" Disruption Simulator UI
* **Visual Controls:**
  * Interactive time-shift sliders ($\pm 15$ to $\pm 180$ minutes) for any block.
  * Live impact meters: Train Detention Minutes (`+30 min`), Impacted Trains (`2 Express`), Criticality Index Preserved (`92%`).
  * Instant "Apply Changes" or "Revert" actions communicating with `POST /api/v1/optimizer/simulate`.

### View 4: Statutory Form T/351 Portal & Private Number Exchange
* **Workflow:**
  1. Auto-generated Form T/351 Disconnection Notice for joint possessions.
  2. Input box for **Station Master Private Number (PN)**.
  3. Digital sign-off checkboxes for PWI (Track), SSE (Signal), and TRD (Traction).
  4. Form T/351-B Reconnection Notice generation with Temporary Speed Restriction (TSR) entries.
  5. PDF / Printable document generator.

### View 5: Post-Block TSR Speed Recovery Curve Visualizer
* Line chart rendering speed relaxation profile ($20\text{--}30\text{ km/h} \to 45\text{ km/h} \to 75\text{ km/h} \to \text{MPS}$).

---

## 3. Middleware & External Integration Deliverables

### Deliverable 1: Backend Core API Integration Layer
* Set up a centralized API client (Axios / TanStack Query) to interact with Aadith & Santhosh’s Backend Core:
  * `GET /api/v1/sections`
  * `GET /api/v1/trains` & `GET /api/v1/train-movements`
  * `GET /api/v1/maintenance`
  * `GET /api/v1/blocks` & `GET /api/v1/blocks/{id}`
  * `POST /api/v1/optimizer/run`
  * `POST /api/v1/optimizer/simulate`
  * `GET /api/v1/blocks/{id}/export-bdms`
  * `GET /api/v1/blocks/{id}/t351-notice`

### Deliverable 2: Real-time WebSocket Disruption Listener
* Connects to `/ws/telemetry/disruptions`.
* Displays real-time toast alerts when train delays $> 20\text{ mins}$ occur, showing re-scheduled block recommendations.

### Deliverable 3: Legacy Ingestion Adapters (TMS, SMMS, TDMS)
* Build lightweight parser/sanitizer scripts that transform raw legacy records into standard `maintenance_requests` payloads.

### Deliverable 4: CRIS BDMS Push Connector
* Ingests approved blocks and triggers standard CRIS BDMS draft proposals.

---

## 4. Sprint Execution Plan for Akarsh & Sista

* **Sprint 1:** React project setup, Tailwind theme, navigation shell, API client integration with existing backend CRUD endpoints.
* **Sprint 2:** Build Dual-Swimlane Gantt Timeline and Leaflet GIS Track Map.
* **Sprint 3:** What-If Simulator interface, Form T/351 Sign-Off portal, and WebSocket telemetry consumer.
* **Sprint 4:** Legacy adapters, CRIS BDMS payload validation, and end-to-end user testing.
