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
│ • DASH-01: 1-Stop Operations Hub & Master Matrix   │ • APP-01: 1-Tap Shift Clock-In & Time Counter     │
│ • DASH-02: Live Command Center & Incident Triage   │ • APP-02: 4-Step Defect Incident Creation Wizard  │
│ • DASH-03: Client Executive Portal & Lot Feeds     │ • APP-03: Visual Evidence Canvas & Photo Markup   │
│ • DASH-04: 1-Click Publishing Gate to Clients      │ • APP-04: Optical Barcode Container Scanner       │
│ • DASH-05: Automated Rate Resolver (CAD / USD)     │ • APP-05: Defect Rework & Scrap Quantity Counters │
│ • DASH-06: Batch PDF Invoicing & Payroll Exporter  │ • APP-06: Offline Outbox Queue & Auto-Sync Engine │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ AUTHORITATIVE CLOUD SYNCHRONIZATION BRIDGE (SharedDatabase.js + Supabase PostgreSQL + Local Storage)   │
│ 1. Onboarding & Dispatch Sync: Client, Plant, PO Hours & Inspector Rates pushed to Mobile Client       │
│ 2. Live Field Data Sync: Mobile Shift Clock-Ins & Inspected Piece Counts streamed to Command Center    │
│ 3. Quality Gate Review: Draft Incident Reports reviewed by QA Director & published to Client Portal    │
│ 4. Overtime Authorization: Field OT requests routed directly to Client Manager approval drawer         │
│ 5. Financial Reconciliation: Approved timesheets reconciled against PO caps for PDF Invoicing & Payroll│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Functional Breakdown by Engine

### 2.1 Engine 1: Web Operations Suite Functions

| Function ID | Function Name | Target Role | Core Capability & Business Purpose | Data Pipeline Connection |
| :--- | :--- | :--- | :--- | :--- |
| **DASH-01** | **Universal Client Onboarding** | Super-Admin | Registers Tier-1 Client Company, Assembly Plant Location, Purchase Order, and allocated Budget Hours cap in 1 modal. | Creates records in `suppliers`, `plants`, and `projects` collections. |
| **DASH-02** | **User Accounts Provisioning** | Super-Admin | Provisions authentication credentials for Field Inspectors, Client Quality Managers, and Staff with role presets. | Writes to `users` table; syncs RBAC session keys upon login. |
| **DASH-03** | **Field Rep Dispatch Engine** | Super-Admin | Dispatches Field Inspector to active plant project; locks in agreed hourly billing rate and field inspector pay rate. | Updates `projects.rep_id` and writes to authoritative `rates` table. |
| **DASH-04** | **Master Operations Matrix** | Admin / QA Dir | Central connected table linking Client, Plant, Currency (CAD/USD), Scope, PO Cap, Rep, Rates, with 1-click actions. | Queries unified data joins across clients, plants, projects, and rates. |
| **DASH-05** | **Live Command Center Feed** | QA Director | Real-time operations feed monitoring active inspector clock-ins, inspected piece counts, and open containment alerts. | Subscribes to live `shiftReports` and `incidents` event stream. |
| **DASH-06** | **1-Click Publishing Gate** | QA Director | Audit mechanism allowing QA Directors to inspect incoming draft shift reports and publish them directly to clients. | Transitions `shiftReports.status` from `Submitted` to `published`. |
| **DASH-07** | **Client Executive Portal** | Customer Mgr | Dedicated view for Tier-1 quality managers showing live certified clean lot tracking and PPM defect trends. | Strictly filtered by `supplier_id`; cost and pay rates permanently scrubbed. |
| **DASH-08** | **Client Overtime Approval** | Customer Mgr | Interactive drawer enabling customer managers to approve or decline field inspector overtime requests with notes. | Updates `overtimeRequests.status` to `Approved` / `Declined`. |
| **DASH-09** | **Unified Rate Resolver** | Accounting / Admin | 3-Tier rate engine resolving billing and pay rates based on location (US = USD, Canada = CAD). | Executes `resolveRateValue()` fallback resolver across all tables. |
| **DASH-10** | **PO Budget Burn Rate Meter** | Accounting / Client | Visual progress bar tracking consumed labor hours against client PO caps with green/amber/red threshold alerts. | Calculates $\sum(\text{hours})$ from approved `shiftReports` against `projects.allocated_hours`. |
| **DASH-11** | **Batch Invoicing & Payroll** | Accounting | Generates canonical branded PDF billing invoices, QuickBooks CSV timesheets, and multi-tab payroll workbooks. | Draws directly from approved `timeEntries` using `generateInvoicePdf.js` and ExcelJS. |

---

### 2.2 Engine 2: Mobile Quality App Functions

| Function ID | Function Name | Target Role | Core Capability & Business Purpose | Data Pipeline Connection |
| :--- | :--- | :--- | :--- | :--- |
| **APP-01** | **1-Tap Shift Clock-In** | Field Inspector | Single-tap shift activation with pre-selected plant location defaults and live running elapsed hours timer. | Initializes active shift session in local storage and cloud database. |
| **APP-02** | **4-Step Incident Wizard** | Field Inspector | Structured defect capture workflow: Step 1 Details &rarr; Step 2 Defect Quantities &rarr; Step 3 Evidence &rarr; Step 4 Routing. | Generates atomic payload for `incidents` and `shiftReports`. |
| **APP-03** | **Visual Evidence Canvas** | Field Inspector | Integrated camera capture with canvas annotation markup tool (draw defect circles, arrows, callouts). | Encodes annotated images as Base64/Blob and attaches to incident record. |
| **APP-04** | **Barcode Container Scanner** | Field Inspector | Rapid optical recognition of automotive container barcode labels to auto-populate part numbers. | Inject scanned string directly into `part_number` input field. |
| **APP-05** | **Defect Rework & Scrap Counter** | Field Inspector | Fast counters for logging reworked units, rework labor hours, defect categories, and scrap quantities. | Persists entries in `reworkLogs` and updates shift summary. |
| **APP-06** | **3-Way Contact Routing** | Field Inspector | Dynamic resolution of authorized Client Quality Contacts for selected assembly plant to receive report dispatches. | Merges client contacts table, supplier contacts, and user records. |
| **APP-07** | **Offline Outbox Queue** | Field Inspector | Ensures uninterrupted shift logging in cellular dead-zones with automated background synchronization upon reconnect. | Managed by `nativeStorageService.js` and `backgroundSyncWorker.js`. |
| **APP-08** | **Overtime Request Launcher** | Field Inspector | Allows inspectors on plant floors to request overtime hours with business reason directly to customer managers. | Dispatches notification and mounts pending item in Client Portal drawer. |

---

## 3. How Web Dashboard & Mobile App Connect

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   END-TO-END SYNCHRONIZATION PIPELINE                                  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 1: ONBOARDING & DISPATCH (Dashboard ───> Mobile App)                                              │
│ Admin onboards Client, Plant, PO Hours, and assigns Field Rep in the Operations Hub. The Mobile App    │
│ automatically syncs and pre-populates the inspector's plant assignment and authorized part numbers.   │
│                                           │                                                            │
│                                           ▼                                                            │
│ STEP 2: REAL-TIME SHIFT EXECUTION (Mobile App ───> Dashboard)                                          │
│ Inspector clocks in on mobile and logs inspected parts, defect counts, rework hours, and photos. The   │
│ Live Command Center on the dashboard updates in real time showing active plant floor coverage.        │
│                                           │                                                            │
│                                           ▼                                                            │
│ STEP 3: QA REVIEW & 1-CLICK PUBLISHING (Mobile App ───> Admin ───> Client Portal)                      │
│ Inspector submits shift containment report. QA Director reviews draft in the Command Center and clicks │
│ "Publish to Client Portal", instantly granting live visibility to the automotive customer.            │
│                                           │                                                            │
│                                           ▼                                                            │
│ STEP 4: CLIENT LOT VISIBILITY & OVERTIME APPROVAL (Client Portal <───> Mobile App)                     │
│ Client Quality Manager views certified clean lot numbers in the portal and approves inspector overtime │
│ requests in the approval drawer. Approval status reflects back to the inspector's shift timesheet.     │
│                                           │                                                            │
│                                           ▼                                                            │
│ STEP 5: AUTOMATED FINANCIAL RECONCILIATION (Dashboard Accounting Center)                               │
│ Approved shift hours are reconciled against PO budget caps. Dashboard calculates billing amounts       │
│ ($65/hr CAD or $100/hr USD) and payroll ($32/hr CAD or $70/hr USD), generating PDF Invoices & Payroll. │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Permissions & Role-Based Access Control (RBAC) Matrix

| System Capability | Super-Admin | QA Director | Field Rep | Client Manager | Accounting |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operations Hub & Setup Matrix** | Full (CRUD) | Full (CRUD) | No Access | No Access | Read Only |
| **User Provisioning & Passwords** | Full (CRUD) | Full (CRUD) | No Access | No Access | No Access |
| **Incident Review & Publishing Gate** | Publish | Publish | Submit Only | View Approved | View Only |
| **Mobile Shift Clock-In & Logging** | Simulated | Simulated | Native Access | No Access | No Access |
| **Client Quality Portal Feed** | Audit Mode | Audit Mode | No Access | Primary View | No Access |
| **Billing Invoices & Payroll Export** | Full Export | Full Export | No Access | Invoice Only | Full Export |
| **Field Inspector Pay Rate Data** | Unrestricted | Unrestricted | Own Rate Only | **STRICT BLOCK** | Unrestricted |

---

## 5. Technical Infrastructure & Quality Standards

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TECHNICAL INFRASTRUCTURE                                         │
├──────────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ LAYER                    │ TECHNOLOGY & SPECIFICATIONS                                                 │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ Web Operations Suite     │ Modular responsive UI with high-contrast light theme tokens (React 19/Vite 8)│
│ Mobile Quality Client    │ Native mobile interface with glove-friendly touch controls (Capacitor/APK) │
│ Vector Graphics          │ Clean SVG iconography and zero emoji enforcement (Lucide React)             │
│ Document Engines         │ High-resolution PDF generation (jsPDF) and multi-tab Excel workbooks (ExcelJS)│
│ Database Architecture    │ Relational PostgreSQL cloud storage with automated schema validation (Supabase)│
│ Offline Resilience       │ Local transaction queuing with automated background synchronization         │
│ Security & Privacy       │ Strict multi-tenant client isolation and role-based permissions             │
│ Deployment Hosting       │ Global high-availability edge infrastructure (Vercel Production)            │
└──────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---
*Document approved by Integrity Driven Solutions Inc. (IDS) Engineering & Product Operations.*
