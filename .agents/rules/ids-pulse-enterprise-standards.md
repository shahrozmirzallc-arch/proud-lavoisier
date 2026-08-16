# IDS Pulse Enterprise Engineering & Architectural Standards

This document establishes the permanent, non-negotiable engineering, architectural, and business standards for the **IDS Pulse Platform** by **Integrity Driven Solutions Inc. (IDS)**.

---

## The 7 Core Golden Rules

### 1. Single Source of Truth (Zero Duplicate Business Logic)
- **Directives**: All domain calculations (Rates, PO Hours Budget, Overtime Multipliers, Defect PPM, Labor and Mileage Costs) MUST reside in a single shared, authoritative utility function.
- **Enforcement**: Duplicating rate resolution or PPM calculation formulas across components is strictly prohibited. Both list tables, drill-down modals, PDF exports, and Excel sheets MUST call the identical helper.

### 2. Multi-Role End-to-End Trace Before Delivery
- **Directives**: No feature, workflow, or bug fix may be marked complete without executing and verifying the complete 3-role data pipeline:
  $$\text{Field Rep (Mobile Log)} \longrightarrow \text{Admin (Command Center Review \& Publish)} \longrightarrow \text{Client Portal (Feed Visibility)}$$
- **Enforcement**: Verify that canonical keys (`supplier_id`, `plant_id`, `rep_id`) remain intact and match across all lifecycle states.

### 3. Strict Offline-First & Atomic Persistence
- **Directives**: All plant-floor submissions (Shift Reports, Incident Logs, Timesheets, Rework Logs) MUST persist to local encrypted storage first before attempting network synchronization.
- **Enforcement**: Network sync MUST execute via atomic Supabase RPC transactions using unique idempotent transaction IDs (`client_tx_id`) to prevent duplicate submissions during network re-connects.

### 4. Zero Hardcoded IDs & Dynamic Location Defaults
- **Directives**: Exact hardcoded IDs and strings are strictly forbidden in business logic. Always use normalized, fuzzy case-insensitive matching (`isSupMatch`).
- **Currency Resolution**:
  - **Canada Plants/Clients**: Evaluates strictly to **`CAD (C$)`**.
  - **US Plants/Clients**: Evaluates strictly to **`USD (US$)`**.

### 5. Automated PDF & Excel Text-Safety Gate (Zero Truncation)
- **Directives**: 
  - Every human-readable report MUST carry the official canonical base64 logo (`src/config/brandingConfig.js`).
  - Zero text truncation or ellipsis (`...`) is permitted in table rows or narrative bodies. Multi-line wrapping (`doc.splitTextToSize`) with dynamic row heights MUST be enforced.
  - Automated branding and layout tests (`tests/report_branding_and_layout_gate.test.js`) MUST pass before any release.

### 6. Real Live Visual DOM Audit (Zero Assumptions)
- **Directives**: Every UI modification MUST be validated against the live running DOM using headless browser screenshots (Puppeteer).
- **Enforcement**: Verify WCAG AAA color contrast (> 7:1 ratio), zero text clipping, responsive mobile viewport wrapping (375px), and correct theme asset contrast inversions.

### 7. Zero Background Task Leaks & Clean Session Hygiene
- **Directives**:
  - Background processes, preview servers, and testing scripts MUST be terminated immediately after execution (`manage_task list` MUST return 0 running tasks).
  - User logout and role switches MUST purge all session tokens (`ids_pulse_role`, `ids_pulse_customer_id`, `ids_pulse_rep_id`) to prevent cross-tenant data pollution.

---

## The 6 Deep Architectural Pillars

### Pillar 1: Financial & Accounting Math Guardrails
1. **Historical Rate Immutability**: Time entries and shift reports MUST stamp and freeze their effective rate (`billing_rate_snapshot`) upon submission. Changing current supplier rates MUST never retroactively alter past invoiced records.
2. **Cent-Perfect Currency Precision**: All currency math MUST enforce two-decimal precision (`Math.round(val * 100) / 100`) to eliminate floating-point penny discrepancies.
3. **PO Budget Cap Guardrails**: System MUST monitor cumulative project hours against the Purchase Order budget (`po_hours`) and trigger visual warnings at 80% and 100% thresholds.

### Pillar 2: Automotive Quality & Defect Traceability (IATF 16949 Standards)
4. **Mandatory 4-Point Containment Stamp**: Every quality incident must enforce:
   - Suspect Lot / Heat / Batch Number
   - Physical Quarantine Location (e.g. Crib 4 / Holding Pen)
   - Defect Severity Classification (Critical / Major / Minor)
   - Immediate Containment Action (100% Visual Sort / Gauge Check / Rework)
5. **Dual Sign-Off Approval Gate**: Field Rep submissions remain in `Submitted (Pending IDS Review)` until approved and digitally stamped (`approved_by`, `approved_at`) by QA Supervisor before appearing in Client Portals.
6. **Standard Automotive PPM Formula**:
   $$\text{PPM} = \left( \frac{\text{Defective Pieces}}{\text{Total Inspected Pieces}} \right) \times 1,000,000 \quad (\text{with divide-by-zero protection})$$

### Pillar 3: Offline-First & Network Resilience
7. **Idempotent Outbox Queue**: All submissions carry a client-generated UUID (`client_tx_id`) guaranteeing idempotent database upserts.
8. **Smart Mobile Image Compression**: Photos taken on plant floor tablets MUST be auto-compressed on an HTML5 canvas to max 1920x1080 (JPEG quality 0.82, < 500 KB) before cloud dispatch.

### Pillar 4: Multi-Tenant Data Isolation
9. **Zero Cross-Client Leakage**: Customer role queries MUST enforce strict supplier isolation (`supplier_id = user.supplier_id`). Client users must never access other suppliers' plants, contacts, parts, or reports.
10. **Shahroz Mirza Super-Admin Hard Lock**: System Super-Admin account (`shahroz`) is locked and immutable against automated scripts or password resets.

### Pillar 5: Real-time UI & State Synchronization
11. **Multi-Tab Reactive Sync**: Inter-tab storage events (`ids_pulse_db_update`) MUST synchronize changes instantly across open browser windows without manual page reloads.
12. **Form Input Shield**: Active user form inputs MUST NOT be cleared or unmounted by background sync polling ticks.

### Pillar 6: Native Android Hardware & Performance
13. **Graceful Hardware Fallback**: Camera/barcode scanner permission denials MUST provide an instant manual text input fallback for part numbers/VINs.
14. **Zero Main-Thread Blocking**: Large PDF/Excel generation and batch syncs MUST yield execution to maintain smooth 60 FPS UI responsiveness.
