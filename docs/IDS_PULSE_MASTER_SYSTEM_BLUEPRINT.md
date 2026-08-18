# IDS Pulse — Master System Blueprint & Architectural Specification
**Version:** 3.4.0  
**Organization:** Integrity Driven Solutions Inc. (IDS)  
**System Classification:** Enterprise Automotive Quality Containment, Liaison & Operations Platform  
**Target Environments:** Desktop Web Command Suite + Android Native Mobile Application  
**Live Production Endpoint:** [https://proud-lavoisier.vercel.app](https://proud-lavoisier.vercel.app)

---

## 1. Executive System Architecture Overview

**IDS Pulse** is the central digital infrastructure of **Integrity Driven Solutions Inc. (IDS)**. The platform integrates physical automotive plant-floor containment operations with real-time quality intelligence, supervisory command, client visibility, and financial reconciliation.

The system is engineered as a unified dual-engine architecture sharing a single authoritative data pipeline:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    IDS PULSE PLATFORM ECOSYSTEM                                        │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ ENGINE 1: WEB OPERATIONS SUITE                     │ ENGINE 2: MOBILE QUALITY APP                      │
│ (Super-Admin Command, Client Portal & Accounting)  │ (Field Quality Liaison Inspector Mobile Client)   │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ • 1-Stop Operations & Setup Hub (Master Matrix)    │ • 1-Tap Plant Shift Clock-In & Time Counter       │
│ • Live Quality Command Center & Incident Triage    │ • 4-Step Defect Incident Wizard & Level of Concern│
│ • Client Executive Portal & Lot Containment Feed   │ • Photo Evidence Capture & Canvas Defect Markup   │
│ • Automated Rate Resolver & PO Budget Telemetry    │ • Defect Rework Counter & Containment Lot Tags    │
│ • Billing Invoices, Payroll & QuickBooks CSV Engine│ • Offline Outbox Queue & Auto-Sync Engine         │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ AUTHORITATIVE DATA & EVENT LAYER (SharedDatabase.js + Supabase PostgreSQL + Local Storage Fallback)    │
│ • Users & RBAC Matrix  • Tier-1 Suppliers & Plants  • Active Projects & POs  • Rates & Currencies      │
│ • Shift Reports Feed   • Quality Incidents Log      • Defect Rework Feed     • Time Entries & Audits   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Dual-Engine Decomposition

### 2.1 Engine 1: Web Operations Suite (Desktop & Tablet)

The Web Operations Suite provides complete operational, financial, and executive oversight for company leadership, quality managers, and automotive clients.

#### Module 1.1: 1-Stop Operations & Setup Hub
* **Purpose**: Centralized administrative control center replacing disconnected setup screens.
* **Core Views**:
  1. **Master Operations Matrix**: Authoritative live table uniting Client Company, Assembly Plant Location, Currency (CAD/USD), Project Scope & Part Number, PO Number & Cap Hours, Assigned Field Inspector with 1-click Reassignment, Hourly Billing Rate, Hourly Pay Rate, and 1-click Dispatch actions.
  2. **User Accounts & Logins**: Directory for IDS Field Inspectors (`rep`), Client Quality Managers (`customer`), and Staff (`admin`/`lead`), featuring real-time search, category filtering, password resets, and permission management.
  3. **Projects & PO Budgets**: Interactive project cards displaying live budget hour consumption against client PO caps.
  4. **Suppliers & Plants Directory**: Automotive Tier-1 client profiles, plant locations, primary quality contacts, and direct links to client portal logins.
* **Universal Action Header**: Global shortcuts (`+ Onboard Client & Plant`, `+ Create New User`, `Assign Rep Dispatch`, `Export PDF`).
* **Interactive 4-Step Workflow Guide**: Embedded guidance cards walking through the end-to-end operational lifecycle.

#### Module 1.2: Live Command Center & Incident Triage
* **Purpose**: Real-time quality operations feed monitoring plant floor activity across all locations.
* **Capabilities**:
  - Live shift report feed with inspector clock-in status, hours logged, and parts inspected.
  - Urgent quality containment alerts with severity badges (`Critical Severity`, `Rework Required`, `Containment Active`).
  - **1-Click Publishing Gate**: QA Directors review incoming inspector reports and click `Publish to Client Portal` to make data instantly visible to clients.

#### Module 1.3: Client Executive Quality Portal
* **Purpose**: Dedicated, isolated portal view for automotive Tier-1 supplier and OEM quality managers (e.g. Magna, Stellantis, Tesla).
* **Capabilities**:
  - Real-time containment lot tracking and certified clean parts verification.
  - Defect PPM trends and piece count analytics.
  - Overtime request approval drawer enabling 1-click authorization with customer comments.
  - Strict data isolation (Clients never see inspector pay rates or other clients' records).

#### Module 1.4: Financials, Timesheets & Invoicing Center
* **Purpose**: End-to-end accounting engine reconciling field labor hours against purchase orders.
* **Capabilities**:
  - Unified rate engine (`resolveRateValue()`) evaluating plant-location currency (US = USD, Canada = CAD).
  - Single and batch PDF invoice generator conforming to official corporate layout standards.
  - Payroll calculation and multi-tab Excel workbook exporter (`exceljs`).
  - QuickBooks-compliant CSV timesheet exporter.
  - Visual PO budget burn rate indicators (Green $\le 80\%$, Amber $80\text{--}99\%$, Red $\ge 100\%$).

---

### 2.2 Engine 2: Mobile Quality App (Android Native & PWA)

The Mobile Quality App is designed specifically for IDS Field Inspectors operating on assembly plant floors under demanding industrial conditions.

#### Module 2.1: Shift Clock-In & Location Launcher
* **Purpose**: Fast, error-free shift activation.
* **Capabilities**:
  - Pre-selected plant assignment with single-tap `Clock In to Shift` button ($\ge 44\text{px}$ touch target).
  - Live running timer tracking elapsed shift hours.
  - Location-based plant defaults eliminating manual typing.

#### Module 2.2: 4-Step Incident Creation Wizard
* **Step 1 (Basic Details)**: Client Company, Assembly Plant, Suspect Part Number, Problem Description.
* **Step 2 (Defect Quantities & Severity)**: Total Inspected, Defect Pcs, Scrap Pcs, Level of Concern selector (`Low`, `Medium`, `High`).
* **Step 3 (Containment Action & Visual Evidence)**:
  - Containment action narrative with dynamic multi-line text input.
  - *Spoke With* plant contact selector.
  - Integrated camera capture with canvas annotation markup tool (draw arrows, circles, defect highlights).
  - Barcode scanner integration for rapid part number acquisition.
* **Step 4 (Client Routing & Submission)**:
  - 3-way client contact matching to route reports to authorized customer managers.
  - End-of-shift review summary and single-tap submission.

#### Module 2.3: Defect Rework & Scrap Counter
* **Purpose**: Real-time logging of component rework operations.
* **Capabilities**: Fast counter for reworked units, rework labor hours, and containment serial tags.

#### Module 2.4: Offline Outbox Queue & Background Sync
* **Purpose**: Continuous operation in plant areas with zero cellular connectivity.
* **Capabilities**: Local queue staging in persistent storage with automated background sync (`backgroundSyncWorker.js`) when connectivity is restored.

---

## 3. End-to-End Operational Lifecycle Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                MASTER 6-PHASE OPERATIONAL LIFECYCLE                                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: CLIENT & PLANT ONBOARDING                                                                     │
│ Admin creates Client Company (e.g. Magna), Plant (e.g. GM Oshawa), PO Number, and Budget Hours Cap.    │
│                                           │                                                            │
│                                           ▼                                                            │
│ PHASE 2: USER PROVISIONING & DISPATCH                                                                  │
│ Admin provisions Inspector & Client logins, assigns Rep to Plant Project, and locks Billing/Pay Rates. │
│                                           │                                                            │
│                                           ▼                                                            │
│ PHASE 3: PLANT FLOOR SHIFT EXECUTION (Mobile)                                                          │
│ Inspector clocks in, inspects parts, logs defects/rework, captures photos, and submits shift report.   │
│                                           │                                                            │
│                                           ▼                                                            │
│ PHASE 4: HQ QA REVIEW & PUBLISHING GATE                                                                │
│ QA Director audits report in Command Center and clicks "Publish to Client Portal".                    │
│                                           │                                                            │
│                                           ▼                                                            │
│ PHASE 5: CLIENT VISIBILITY & OVERTIME APPROVAL                                                         │
│ Client Quality Manager views live containment lot metrics and approves inspector overtime requests.   │
│                                           │                                                            │
│                                           ▼                                                            │
│ PHASE 6: FINANCIAL RECONCILIATION & INVOICING                                                          │
│ Timesheets reconciled against PO budget caps; batch PDF invoices and QuickBooks timesheets exported.   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Authoritative Data Schema Specification

All platform operations read and write to standardized data entities managed by `SharedDatabase.js`:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CORE DATA ENTITY STRUCTURE                                       │
├───────────────────┬────────────────────────────────────────────────────────────────────────────────────┤
│ ENTITY            │ KEY FIELDS & RELATIONSHIPS                                                         │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ users             │ id, username, password, name, email, phone, role (rep|customer|admin|lead|owner),  │
│                   │ supplier_id (links client reps to company), plant_id, hourly_rate, pay_currency    │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ suppliers         │ id, name, code, contact_person, contact_email, phone, address, plants[]            │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ plants            │ id, name, code, supplier_id, address, city, state, country, default_currency       │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ projects          │ id, name, code, supplier_id, plant_id, rep_id, po_number, allocated_hours,        │
│                   │ part_number, billing_rate, pay_rate, currency (CAD|USD), status (Active|Completed)│
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ rates             │ id, supplier_id, plant_id, rep_id, billing_rate, pay_rate, currency, updated_at    │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ shiftReports      │ id, rep_id, supplier_id, plant_id, date, shift, hours_worked, parts_inspected,     │
│                   │ parts_defective, scrap_qty, status (Draft|Submitted|published), published_at       │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ reworkLogs        │ id, rep_id, supplier_id, plant_id, project_id, date, pieces_reworked, rework_hours│
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ incidents         │ id, rep_id, supplier_id, plant_id, part_number, level_of_concern, problem_desc,    │
│                   │ action_taken, spoke_with, photos[], status (Open|Contained|Closed)                 │
├───────────────────┼────────────────────────────────────────────────────────────────────────────────────┤
│ timeEntries       │ id, rep_id, project_id, date, hours, billing_rate, pay_rate, currency, status      │
└───────────────────┴────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Security Architecture & Role-Based Access Control (RBAC)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PERMISSIONS & ACCESS MATRIX                                      │
├──────────────────────────┬──────────────┬──────────────┬────────────────┬───────────────┬──────────────┤
│ CAPABILITY               │ SUPER-ADMIN  │ QA DIRECTOR  │ FIELD REP      │ CLIENT MGR    │ ACCOUNTING   │
├──────────────────────────┼──────────────┼──────────────┼────────────────┼───────────────┼──────────────┤
│ Operations Hub & Matrix  │ Full (CRUD)  │ Full (CRUD)  │ No Access      │ No Access     │ Read Only    │
│ User Provisioning        │ Full (CRUD)  │ Full (CRUD)  │ No Access      │ No Access     │ No Access    │
│ Rep Dispatch & Rates     │ Full (CRUD)  │ Full (CRUD)  │ No Access      │ No Access     │ Read Only    │
│ Incident Publishing Gate │ Approve/Pub  │ Approve/Pub  │ Submit Only    │ View Approved │ View Only    │
│ Mobile Shift Clock-In    │ Simulated    │ Simulated    │ Native Access  │ No Access     │ No Access    │
│ Client Quality Portal    │ Audit Mode   │ Audit Mode   │ No Access      │ Primary View  │ No Access    │
│ Invoice & Payroll Export │ Full Export  │ Full Export  │ No Access      │ Invoice Only  │ Full Export  │
│ Inspector Pay Rate Data  │ Unrestricted │ Unrestricted │ Own Rate Only  │ STRICT BLOCK  │ Unrestricted │
└──────────────────────────┴──────────────┴──────────────┴────────────────┴───────────────┴──────────────┘
```

### Security Guardrails:
1. **Shahroz Mirza Super-Admin Lock**: User `shahroz` is the permanent system super-admin with immutable credentials and unrestricted access.
2. **Client Data Isolation Guardrail**: Customer users (`role === 'customer'`) can only query records matching their `supplier_id`. Inspector pay rates and internal profit margins are permanently scrubbed before rendering client views.
3. **Session Role Synchronization**: Every login synchronization stamps `sessionStorage` with normalized role tags to prevent stale cache privilege leaks.

---

## 6. Enterprise Design System & Guardrails

The platform adheres to strict visual and typographic standards:
* **High-Contrast Light Theme**: All cards, modals, and inputs enforce pure white (`bg-white`) or light slate (`bg-slate-50`) backgrounds with dark high-contrast typography (`text-slate-900`, `text-slate-800 font-black`) maintaining contrast ratios $\ge 7:1$ (WCAG AAA).
* **Zero Dark Container Leaks**: Dark container backgrounds (`bg-slate-950`, `bg-amber-950`) inside light modals are permanently prohibited.
* **Zero Emoji Rule**: Emojis are strictly banned across the entire codebase, UI buttons, badges, notifications, and export reports. Professional SVG icons from `lucide-react` are used exclusively.
* **Zero Text Truncation Rule**: Ellipsis (`...`) for report narratives is prohibited. All tables and cards dynamically expand row heights using multi-line text wrapping.
* **Location-Based Currency Standard**: All US plants and clients evaluate in **USD**; all Canadian plants and clients evaluate in **CAD**.

---

## 7. Technical Stack & Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TECHNICAL INFRASTRUCTURE                                         │
├──────────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ LAYER                    │ TECHNOLOGY & SPECIFICATIONS                                                 │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ Frontend Framework       │ React 19 + Vite 8 (Client Environment)                                      │
│ Styling & Tokens         │ Tailwind CSS 4 + High-Contrast Utility Design System                        │
│ Icon Library             │ Lucide React (Clean SVG vector icons)                                       │
│ PDF Generation Engine    │ jsPDF + jsPDF-AutoTable (Canonical branded PDF templates)                   │
│ Excel Export Engine      │ ExcelJS (Multi-sheet styled payroll and timesheet workbooks)                │
│ Backend / Database       │ Supabase PostgreSQL + REST API + LocalStorage Offline Engine                │
│ Mobile Build Engine      │ Capacitor + Android Native WebView APK (Zero-freeze Electron guard)         │
│ Production Hosting       │ Vercel Production Environment (Automated CI/CD with cache invalidation)     │
│ Automated Quality Gates  │ Vitest (31 test suites, 305 automated tests passing)                        │
└──────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---
*Document approved by Integrity Driven Solutions Inc. (IDS) Engineering & Product Operations.*
