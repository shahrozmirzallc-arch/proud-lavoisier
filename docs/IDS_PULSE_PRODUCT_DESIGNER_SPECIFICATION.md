# IDS Pulse — Product Designer Specification & Design System Guide
**Version:** 3.4.0  
**Author:** Integrity Driven Solutions Inc. (IDS) Engineering & Product Team  
**Audience:** Product Designers, UI/UX Specialists, Frontend Developers  
**Target Platform:** Web (Desktop/Tablet) + Hybrid Mobile (Android Native APK & PWA)  
**Live Production URL:** [https://proud-lavoisier.vercel.app](https://proud-lavoisier.vercel.app)

---

## 1. Executive Summary & Product Mission

**Integrity Driven Solutions Inc. (IDS)** provides mission-critical quality containment, defect inspection, and liaison engineering services to Tier-1 automotive suppliers (e.g. Magna Powertrain, Stellantis, GM, Tesla, Multimatic) operating inside major assembly plants across the United States and Canada.

**IDS Pulse** is the central operating platform powering IDS. It bridges physical plant-floor inspections with real-time digital intelligence:
- **Field Inspectors (IDS Reps)** use the mobile app on plant floors to clock in, count inspected parts, log defects, capture photo evidence, and submit shift containment reports.
- **Super-Admins & QA Directors (Donna, Greg, Shahroz)** use the Web Command Center to dispatch inspectors, configure hourly billing/pay rates, monitor live plant incidents, review draft reports, and publish data.
- **Client Quality Managers (Automotive OEM/Tier-1 Customers)** use the Client Portal to track part containment progress in real time, approve overtime, and inspect lot certifications.
- **Finance & Accounting Staff** use the accounting engine to reconcile timesheets against client PO budget caps, audit field payroll, and generate QuickBooks/PDF invoices.

### Design Philosophy
> **"Function-Driven, Industrial-Grade High Contrast, and Zero Fluff."**
> In automotive assembly plants, field inspectors work in loud, fast-paced environments with gloves, dirty screens, and varying lighting. The interface must be immediately legible, intuitive, thumb-friendly, and rock-solid.

---

## 2. The 4 Core User Personas

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   IDS PULSE USER ECOSYSTEM                                │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────┤
│ 1. IDS FIELD INSPECTOR        │ 2. CLIENT QUALITY MANAGER     │ 3. QA DIRECTOR / ADMIN    │
│    (Mobile / Plant Floor)     │    (Web Executive Portal)     │    (Command Center)       │
│ • Single-thumb interaction    │ • High-level KPIs & Charts    │ • 1-Stop Operations Hub   │
│ • Large touch targets (>=44px)│ • Lot containment status      │ • Real-time triage feed   │
│ • Quick defect logging        │ • Overtime approvals          │ • Rate & dispatch engine  │
│ • Offline queue resilience    │ • Budget PO hours burn rate   │ • Report publishing gate  │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

### Persona 1: The IDS Field Quality Liaison Inspector (IDS Rep)
* **Context**: Dispatched on-site inside assembly plants (e.g., GM Oshawa, Ford Oakville, Stellantis Windsor).
* **Key Tasks**: Clock in/out, log shift hours, record part numbers inspected, document defect reasons, attach annotated photos, submit end-of-shift reports.
* **Design Needs**:
  - Compact mobile viewport (375px–420px width).
  - High-contrast touch buttons ($\ge 44\text{px}$ touch targets).
  - Minimal typing — smart dropdowns, pre-filled plant defaults, camera capture.
  - Offline sync status indicator (Online / Syncing / Staged Offline).

### Persona 2: The Client Quality Manager (Client Rep / Customer)
* **Context**: Senior Quality Director or Supplier Quality Engineer at the client company (e.g., Magna, Tesla).
* **Key Tasks**: Review daily containment progress, verify defect PPM rates, approve rep overtime requests, download signed GCA/audit certificates.
* **Design Needs**:
  - Clean executive summary cards with instant clarity on good vs suspect parts.
  - Transparent lot traceability timeline.
  - 1-click overtime approvals with comment capability.
  - Zero sensitive internal data exposure (Client must NEVER see inspector pay rates, other clients' records, or unapproved internal drafts).

### Persona 3: The Super-Admin & QA Director (Donna, Greg, Shahroz)
* **Context**: HQ leadership coordinating multi-plant staffing, client onboarding, and quality assurance.
* **Key Tasks**: Onboard new clients and assembly plants, provision user logins, dispatch reps, set unified billing/pay rates, review pending shift reports, publish to client portals.
* **Design Needs**:
  - 1-Stop **Operations & Directory Hub** with Master Operations Matrix table.
  - Real-time notification banners and urgent containment feeds.
  - 1-Click action shortcuts (`+ Onboard Client`, `+ Create User`, `Assign Dispatch`).

### Persona 4: The Finance & Accounting Controller
* **Context**: Back-office billing coordinator reconciling weekly plant hours and payroll.
* **Key Tasks**: Audit approved timesheets, verify PO budget hour limits, generate single/batch PDF invoices, export QuickBooks CSV timesheets.
* **Design Needs**:
  - Tabular financial drill-down views with currency formatting (CAD vs USD).
  - Visual budget progress bars (Green $\le 80\%$, Amber $80\text{--}99\%$, Red $\ge 100\%$ PO Cap).
  - Authoritative calculation parity across on-screen summaries and generated PDF exports.

---

## 3. Brand Identity & Visual Design System

### 3.1 Color Palette & Token Architecture

All UI components MUST enforce clean, accessible high-contrast color tokens with a contrast ratio $\ge 7:1$ (WCAG AAA standard).

```
PRIMARY BRAND PALETTE:
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Industrial Deep Navy     │ Corporate Navy Blue      │ Action Cobalt Blue       │
│ #10284A                  │ #173868                  │ #1769E0 / #3B82F6        │
│ (Primary Headers & Nav)  │ (Hover / Accent Surface) │ (Primary Action Buttons) │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘

FUNCTIONAL STATUS PALETTE:
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Status: Quality Pass     │ Status: Concern / Alert  │ Status: Critical Defect  │
│ Emerald: #059669         │ Amber: #D97706           │ Crimson Red: #DC2626     │
│ Surface: #ECFDF5         │ Surface: #FFFBEB         │ Surface: #FEF2F2         │
│ Text: #064E3B font-black │ Text: #78350F font-black │ Text: #7F1D1D font-black │
│ Border: #6EE7B7          │ Border: #FCD34D          │ Border: #FCA5A5          │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘

NEUTRAL PAPER SCALE (Light Theme Surface):
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Pure White (#FFFFFF)     │ Slate Light (#F8FAFC)    │ Border Slate (#CBD5E1)   │
│ Main Card & Input BG     │ Dashboard Background     │ Form & Container Borders │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

### 3.2 Typography Tokens

* **Font Family**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`
* **Hierarchy**:
  - **Display Title (H1)**: `text-2xl` to `text-3xl` (`24px`–`30px`), `font-black`, `tracking-tight`, `text-slate-900`
  - **Section Title (H2)**: `text-lg` to `text-xl` (`18px`–`20px`), `font-black`, `tracking-wide`, `text-slate-900`
  - **Sub-Header / Card Title (H3)**: `text-[14px]` to `text-[15px]`, `font-extrabold`, `uppercase`, `tracking-wider`, `text-slate-800`
  - **Body Text**: `text-[13px]` to `text-[14px]`, `font-medium`, `text-slate-700`, `leading-normal`
  - **Secondary / Helper Text**: `text-[11.5px]` to `text-[12px]`, `font-semibold`, `text-slate-500`
  - **Badge / Micro Label**: `text-[9.5px]` to `text-[11px]`, `font-black`, `uppercase`, `tracking-widest`

### 3.3 Form Inputs & Controls Standard

* **Background**: Pure white (`bg-white`).
* **Border**: 2px solid slate border (`border-2 border-slate-300`).
* **Focus State**: `focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`.
* **Typography**: `text-slate-900 font-bold text-xs` or `text-sm`.
* **Touch Targets**: Minimum height `44px` on mobile, `38px` on desktop.
* **Controlled Dropdowns**: If an inspector or admin selects *"Other / Not listed"*, a custom text input container MUST dynamically slide down and remain permanently mounted.

---

## 4. Mandatory System Guardrails for Product Designers

Every mockup, prototype, and component design MUST strictly comply with these core rules:

### RULE 1: ZERO EMOJI POLICY (Permanent)
- **Rule**: Emojis (e.g. 🚀, ⚠️, 📋, 👤, 🏢, ✅) are **strictly prohibited** across all UI components, buttons, alert banners, modal dialogs, status badges, reports, and documentation.
- **Solution**: Use clean SVG icons from `lucide-react` (e.g. `<Shield />`, `<AlertTriangle />`, `<Users />`, `<Building2 />`, `<CheckCircle2 />`) or professional plain text typography.

### RULE 2: ZERO DARK CONTAINER LEAKS (High-Contrast Light Theme)
- **Rule**: Nesting dark container classes (`bg-slate-950`, `bg-emerald-950`, `from-amber-950`, `bg-slate-900`) inside light dashboard surfaces or modals is strictly banned.
- **Solution**: All modals, cards, popups, and drawers must use pure white (`bg-white`) or light slate (`bg-slate-50`) surfaces with dark typography (`text-slate-900`, `text-slate-800 font-black`) and crisp borders (`border-2 border-slate-300`).

### RULE 3: ZERO TEXT TRUNCATION FOR REPORT DATA
- **Rule**: Ellipsis (`...`) or CSS overflow clipping (`text-truncate`) is strictly forbidden for report data, defect narratives, incident actions, and shift summaries.
- **Solution**: Layouts must support multi-line dynamic wrapping (`break-words`, `whitespace-normal`) so quality records remain 100% readable.

### RULE 4: STRICT SEPARATION OF IDS REP VS CLIENT REP
- **IDS Rep (Field Inspector / Liaison)**: Staff employed by IDS dispatched to assembly plants. Display with blue/cyan badges (`bg-blue-100 text-blue-950 border-blue-300`).
- **Client Rep (Customer Contact / Quality Manager)**: Representatives employed by the automotive customer. Display with amber badges (`bg-amber-100 text-amber-950 border-amber-300`).
- Designers must NEVER conflate these two personas in navigation or dropdown filters.

### RULE 5: LOCATION-BASED CURRENCY ASSIGNMENT
- **United States Plants & Clients**: All rates, transactions, and invoices evaluate in **`USD`** (`$X.XX/hr USD`).
- **Canadian Plants & Clients**: All rates, transactions, and invoices evaluate in **`CAD`** (`$X.XX/hr CAD`).
- Designers must always provide clear currency pill tags next to hourly rates and financial totals.

### RULE 6: CANONICAL TRANSPARENT LOGO ONLY
- All human-readable reports, exports, and headers must use the official transparent IDS Pulse logo sourced from `src/config/brandingConfig.js`. Black rectangle backgrounds or unofficial placeholder logos are banned.

---

## 5. Key Screen Blueprints & Information Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 IDS PULSE NAVIGATION MAP                                  │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────┤
│ QUALITY & OPERATIONS          │ FINANCIALS & AUDIT            │ DIRECTORIES & SYSTEM      │
│ • Live Command Center         │ • Timesheets & Hours Logging  │ • Operations & Setup Hub  │
│ • Incident Reports Hub        │ • Clients & Rates Engine      │ • Suppliers & Plants Dir  │
│ • Daily Planner & Schedule    │ • Invoice Billing Center      │ • User Accounts & Logins  │
│ • Defect Rework Logs          │ • CER Weekly Audit Sheets     │ • Email Dispatch Logs     │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────┘
```

### 5.1 Screen 1: The Consolidated Operations & Directory Hub

The **Operations Hub** is the central 1-stop workspace for Super-Admins to set up and manage all operations.

#### Layout Structure:
1. **Top Action Header**:
   - Title: `Operations & Directory Hub`
   - Subtitle: `Centralized 1-stop workspace for Client Onboarding, Field Reps, Plant Projects & Rates`
   - Action Buttons: `[+ Onboard Client & Plant]`, `[+ Create New User]`, `[Assign Rep Dispatch]`, `[Export PDF]`.
2. **Interactive 4-Step Workflow Guide Banner**:
   - Step 1: *Onboard Client & Plant Location*
   - Step 2: *Provision User Logins*
   - Step 3: *Dispatch Rep & Lock Rates*
   - Step 4: *Shift Reports & Client Portal*
3. **Sub-View Switcher Pills**:
   - `Master Operations Matrix` (Connected table linking Client, Plant, Scope, PO, Rep, Rates)
   - `User Accounts & Logins` (Searchable user cards filtered by Rep, Client, Staff)
   - `Projects & PO Budgets` (Project cards with live PO budget hour caps)
   - `Clients & Plants Directory` (Tier-1 automotive suppliers, plants, primary contacts)

---

### 5.2 Screen 2: Mobile Field Inspector App (Phone Viewport)

Designed for fast, one-thumb operation on mobile browsers and the Android native build.

#### Core Mobile Views:
1. **Clock-In / Shift Launcher**:
   - Prominent plant selection card.
   - 1-Tap `Clock In to Shift` button (Green, min-height 52px).
   - Live timer showing elapsed hours.
2. **4-Step Incident Creation Wizard**:
   - **Step 1 (Basic Details)**: Client Company, Plant, Suspect Part Number, Problem Description.
   - **Step 2 (Defect Quantities)**: Inspected Pcs, Defect Pcs, Scrap Pcs, Level of Concern (Low/Med/High).
   - **Step 3 (Containment Action & Evidence)**: Action narrative, Spoke With contact, Camera photo capture + Canvas markup, Barcode scan.
   - **Step 4 (Client Routing & Review)**: Select Client Quality Contacts, Review Summary, 1-Tap Submit.
3. **Daily Defect Rework Feed**:
   - Fast counter for reworked units, rework hours, and containment serial tags.

---

### 5.3 Screen 3: Client Executive Portal

The dedicated view for automotive OEM and Tier-1 quality managers.

#### Core Client Views:
1. **Live Quality Containment Feed**:
   - Real-time cards showing published shift inspection reports.
   - Pass/Fail piece counters and PPM trend badges.
2. **Lot Traceability & Containment Status**:
   - Filterable table by Part Number, PO Number, and Plant Location.
   - Visual status badges (`100% Contained`, `In Progress`, `Certified Clean Lot`).
3. **Overtime Request & Approval Drawer**:
   - Overtime requests submitted by inspectors requiring customer sign-off.
   - 1-Click `[Approve Overtime]` / `[Decline]` with customer notes.
4. **PO Budget Telemetry**:
   - Visual progress bar showing consumed hours vs authorized PO cap.

---

### 5.4 Screen 4: Branded Document & Report Export Engine

All generated PDF, Excel, and CSV documents must adhere to strict enterprise layout standards:
- **Header**: Canonical IDS logo on top left, report title, date, plant timezone (EDT), authoritative reference ID.
- **Orientation Gate**:
  - Wide multi-column tables (Rework Feed, Timesheets, CER Audits) MUST render in **Landscape** mode.
  - Standard incident narratives, certificates, and invoices render in **Portrait** mode.
- **Zero Ellipsis**: All text cells dynamically expand row heights using `splitTextToSize`.
- **Multi-Page Continuation**: Running headers, page numbers (`Page X of Y`), and confidential company disclaimers on every page.

---

## 6. Frontend Collaboration & Engineering Handoff

### 6.1 Technology Stack
* **Framework**: React 19 + Vite 8
* **Styling**: Tailwind CSS 4 + Custom High-Contrast Utility Tokens
* **Icons**: `lucide-react`
* **PDF Engine**: `jspdf` + `jspdf-autotable`
* **Excel Engine**: `exceljs`
* **Backend / Database**: Supabase (PostgreSQL) with offline `localStorage` fallback
* **Mobile Runtime**: Capacitor / Android Native WebView APK

### 6.2 Codebase Directory Guide
* `src/components/WebDashboard.jsx`: Super-Admin Command Center & Operations Hub.
* `src/components/PhoneSimulator.jsx`: Mobile Field Inspector UI & Phone simulator.
* `src/components/ClientDashboard.jsx`: Client Executive Quality Portal.
* `src/components/SharedDatabase.js`: Core data access layer, user provisioning, rate resolver.
* `src/utils/generateInvoicePdf.js`: Canonical billing invoice PDF engine.
* `src/utils/generateDailyReportPdf.js`: Shift & containment audit PDF engine.
* `src/config/brandingConfig.js`: Canonical logo asset (`LOGO_BASE64`) and enterprise branding constants.
---

## 7. Designer Checklist for New Feature Specs

When designing a new component, modal, or screen for IDS Pulse, verify against this checklist:
- [ ] **Contrast Check**: Are all text elements on light backgrounds with contrast ratio $\ge 7:1$?
- [ ] **Zero Emojis**: Are all icons sourced from `lucide-react` with zero emojis?
- [ ] **Touch Target**: Are mobile action buttons $\ge 44\text{px}$ high?
- [ ] **No Dark Leaks**: Are modal dialogs and alert boxes using light surfaces with crisp borders?
- [ ] **Currency Tag**: Is currency dynamically formatted as CAD or USD based on plant location?
- [ ] **Role Isolation**: Is the distinction between IDS Rep and Client Rep preserved?
- [ ] **Responsive Flow**: Does the design adapt seamlessly between Desktop (1440px) and Mobile (375px)?
- [ ] **Authoritative Data**: Does every data element map to an authoritative database entity?

---
*For questions or design system clarifications, contact the Lead Systems Architect (Shahroz Mirza) or Director of Quality Operations (Donna Cabral).*
