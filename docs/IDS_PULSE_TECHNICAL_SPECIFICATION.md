# Technical Specification: IDS Pulse Operations Suite

## Document Overview
This document provides the full technical architecture, data schema specification, UI component map, security model, and integration blueprint for the **IDS Pulse Operations Suite**.

---

## 1. System Architecture

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT & USER LAYER                               |
|  +---------------------------+  +--------------------------+  +----------------+  |
|  | Web Portal / Admin CRM    |  | Mobile App / Simulator   |  | Client Portal  |  |
|  | (React 19 + Tailwind v4)  |  | (Capacitor / Android)    |  | (Web Portal)   |  |
|  +---------------------------+  +--------------------------+  +----------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                APPLICATION ENGINE                                 |
|  +---------------------------+  +--------------------------+  +----------------+  |
|  | Security Gateway (App.jsx)|  | Unified DB Service       |  | PDF / Excel    |  |
|  | Role Session Sync         |  | (SharedDatabase.js)      |  | Export Engines |  |
|  +---------------------------+  +--------------------------+  +----------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    v                                             v
+---------------------------------------+     +-------------------------------------+
|        PRIMARY DATA STORE             |     |        OFFLINE / LOCAL STORE        |
|  Supabase PostgreSQL Database         |     |  Browser LocalStorage               |
|  Row Level Security (RLS) Policies    |     |  Key: ids_pulse_db                  |
|  Real-time Events & Auth Services     |     |  Custom Event: ids_pulse_db_update  |
+---------------------------------------+     +-------------------------------------+
```

### Core Stack Components
1. **Frontend Core**: React 19, Vite, Tailwind CSS v4, Lucide React icons.
2. **Mobile Layer**: Capacitor 8 (`@capacitor/core`, `@capacitor/android`), custom PowerShell APK build scripts.
3. **Database Layer**: Supabase PostgreSQL database (`IDS_Pulse_Supabase_Setup.sql`) with local storage fallback and reactive sync listeners.
4. **Export Engines**: `jspdf` and `jspdf-autotable` for branded PDFs; `exceljs` for financial ledgers.
5. **Testing & QA**: Vitest unit testing framework, Puppeteer headless browser UI verification runner.
6. **Deployment**: Vercel production hosting (`proud-lavoisier.vercel.app`).

---

## 2. Authentication & Role Permission Matrix

System access is controlled by the authentication gateway in `src/App.jsx` and synchronized across `sessionStorage` (`ids_pulse_role`, `ids_pulse_username`, `ids_pulse_customer_id`, `ids_pulse_rep_id`).

### User Roles & Capability Matrix

| Role | Key Identifiers | Accessibility Scope | Data Permissions | Special Controls |
| :--- | :--- | :--- | :--- | :--- |
| **System Super-Admin** | `shahroz` | Full Access across all hubs and modules | Unrestricted read/write across all tables | Sole unalterable admin. Password locked to `Shahroz121$`. Access to System Roadmap. |
| **System Admin** | `greg`, `donna`, `owner` | All Admin CRM Hubs (Command Center, Ops, Workforce, Reports, Accounting) | Full access to shift reports, rework logs, client onboarding, and user directories | Cannot alter Super-Admin credentials. |
| **Field Quality Inspector (IDS Rep)** | `clarence`, `rep` | Phone Simulator / Mobile App view | Log shift hours, rework inspection counts (OK/NOK), defect coordinates, and expense receipts | Scoped to assigned projects and plant floor assignments. |
| **Accountant** | `colleen` | Timesheets, Invoicing & Mileage Hubs | Read/write access to timesheets, billing rates, invoices, and expense receipts | Financial data focus. |
| **Client Quality Contact (Client Rep)** | `customer`, `client` | Client Portal Hub | Scoped read access to published shift containment reports and defect heatmaps for their company | Strictly filtered by `supplier_id` / `customer_id`. Cannot view internal IDS rep pay rates or other client data. |

---

## 3. Core Database Schemas & Models

### Primary Entities (`SharedDatabase.js` / Supabase SQL)

1. **`suppliers` (Client Companies)**:
   - `id`: Unique identifier (e.g. `sup_magna`)
   - `name`: Official company name (e.g. `Magna Powertrain International`)
   - `contacts`: Array of contact objects `{ id, name, email, phone, role }`
   - `contact_person`, `contact_email`, `contact_phone`: Fallback direct contact attributes
   - `created_at`: ISO timestamp

2. **`plants` (Assembly Plant Locations)**:
   - `id`: Plant ID (e.g. `plant_gm_cami`)
   - `supplier_id`: Associated client supplier ID
   - `name`: Facility name (e.g. `GM CAMI Assembly Plant`)
   - `city`: Facility city (e.g. `Ingersoll`)
   - `state_province`: Region (e.g. `Ontario`)
   - `country`: Country (`Canada` or `United States`)

3. **`parts` (Automotive Component Records)**:
   - `id`: Part ID
   - `part_number`: Suspect part number (e.g. `PN 84920194`)
   - `part_name`: Component description (e.g. `Front Axle Assembly`)
   - `supplier_id`: Client supplier ID

4. **`projects` (Quality Containment Onboarding)**:
   - `id`: Project ID
   - `po_number`: Purchase Order number (e.g. `PO-GM-CAMI-2026-88`)
   - `supplier_id`: Client supplier ID
   - `plant_id`: Assembly plant location ID
   - `part_number`: Suspect part number
   - `assigned_rep_ids`: Array of assigned IDS Field Rep IDs
   - `status`: Active / Completed status

5. **`shiftReports` / `reworkLogs` (Quality Inspection Data)**:
   - `id`: Unique report ID
   - `project_id`, `supplier_id`, `plant_id`, `po_number`, `part_number`: Context keys
   - `rep_id`, `rep_name`: IDS inspector details
   - `date`: ISO report date
   - `hours_worked`: Shift duration
   - `total_inspected`: Total units checked
   - `passed_count`: OK count
   - `defective_count`: NOK count
   - `defect_type`, `defect_notes`: Quality narrative
   - `status`: `Submitted (Pending IDS Review)` or `published`

---

## 4. UI Component Architecture

```text
src/
├── main.jsx                        # Entry mounting point
├── App.jsx                         # Security Gateway & Role Switcher
├── index.css                       # Design System CSS, Color Tokens & Themes
├── components/
│   ├── LoginScreen.jsx             # Multi-role Login Portal & Quick Shortcuts
│   ├── PhoneSimulator.jsx          # Inspector Mobile App & Incident Drawer
│   ├── WebDashboard.jsx            # Admin CRM, Command Center & Reports Engine
│   ├── IntegrityWeeklyTimesheet.jsx # Inspector Weekly Timesheet & Payroll Ledger
│   ├── InvoiceModal.jsx            # Client Invoicing Modal & Tax Engine
│   ├── SecurityDashboard.jsx       # Security Governance & Access Log Engine
│   └── SharedDatabase.js           # Database Helper, Contact Resolver & RLS Handler
├── config/
│   ├── brandingConfig.js           # Brand Colors, Company Info & Canonical Logo Base64
│   └── LogoBase64.js               # Official Base64 Image Asset
└── services/
    ├── onboardingService.js        # Project & PO Fast-Onboarding Service
    ├── incidentWorkflowService.js  # Incident Lifecycle Management Service
    ├── cloudinaryService.js        # Receipt & Image Upload Service
    └── nativeStorageService.js     # Capacitor Native Storage Handler
```

---

## 5. System Integration & Verification Workflow

### 1. Build & Lint Pipeline
```bash
# Run lint and compile build bundle
npm run build

# Run unit test suite
npm run test
```

### 2. Branding & Report Layout Verification Gate
```bash
# Verify report branding, transparent logo application, and non-truncation rules
node tests/report_branding_and_layout_gate.test.js
```

### 3. Native Android Build Pipeline
```bash
# Generate native Android build assets
powershell -ExecutionPolicy Bypass -File ./build_native_apk.ps1
```

### 4. Vercel Live Deployment Pipeline
```bash
# Deploy cleanly to live Vercel endpoint with cache invalidation
vercel --prod --force
```
