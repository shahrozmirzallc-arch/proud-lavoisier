# PUENTE AI Discovery Call — Authoritative Architecture & System Responses
**Project:** IDS Pulse Platform  
**Organization:** Integrity Driven Solutions Inc. (IDS)  
**Date:** August 2026  
**Document Classification:** Enterprise Architectural Discovery Response  

---

## Executive Summary
This document provides complete, authoritative technical and operational responses to the 43 discovery questions prepared by Puente AI for the **IDS Pulse** platform. IDS Pulse is the mission-critical digital operating platform powering real-time automotive quality containment, defect triage, mobile field inspections, and financial reconciliation across Tier-1 supplier and OEM assembly plants throughout the United States and Canada (including GM, Ford, Stellantis, Tesla, and Magna International).

---

## Section A: Architecture & Tech Stack

### 1. What is the current solution built on — language/framework, database engine, and where is it hosted?
* **Frontend Web & Mobile Client:** React 18 with Vite build toolchain, Tailwind CSS, and Lucide React iconography.
* **Mobile Native Wrapper:** Capacitor-wrapped native Android APK (`idspulse-app.apk`) alongside an installable Progressive Web App (PWA) with full service-worker caching.
* **Backend & Database Engine:** Supabase-managed PostgreSQL relational database featuring Row-Level Security (RLS), real-time WebSocket subscriptions (`@supabase/supabase-js`), and serverless functions.
* **Local Offline Data Layer:** `SharedDatabase.js` with an automated IndexedDB/LocalStorage outbox queue worker for zero-connectivity plant dead-zones.
* **Cloud Hosting:** Hosted in production on Vercel Edge Network (`https://proud-lavoisier.vercel.app`) with global CDN distribution, automatic HTTPS, and instant cache invalidation.

### 2. Is it one monolithic application, or separate mobile app, web portal, and backend/API components?
* **Unified Connected Dual-Engine Monorepo:** The platform is engineered as a unified monorepo where the **Web Operations Suite** (HQ Command Center, Master Operations Hub, Financials Suite, Client Executive Portal) and the **Mobile Quality App** (Plant Floor Inspector Client) operate as synchronized client engines over a shared, authoritative data service layer (`SharedDatabase.js`) and Supabase PostgreSQL backend.

### 3. Who originally built it, and who maintains it today?
* **Architected & Maintained by:** Built and actively maintained by the internal IDS Core Engineering & Architecture Team led by Super-Admin Shahroz Mirza. It is under active daily development with continuous integration, automated testing gates, and strict enterprise quality standards.

### 4. Is there a real API layer, or do reports and dashboards query the database directly?
* **Structured Service Data Access Layer:** All client components, reporting tools, and dashboards interact through an authoritative data access layer (`SharedDatabase.js`, `supabaseClient.js`). This layer enforces multi-tenant client isolation, rate normalization, and strict role validation before executing parameterized SQL queries and mutations against PostgreSQL.

### 5. What does the release process look like — CI/CD, deploys, and change management?
* **Automated CI/CD Pipeline:** Integrated Git deployment directly connected to Vercel production edge with `--force` cache invalidation upon push.
* **Pre-Deployment Automated Gates:** Every release enforces automated linting (`eslint .`), unit/integration testing (`vitest run`), and layout/theme gate tests (`tests/report_branding_and_layout_gate.test.js`, `tests/modal_and_theme_contrast_gate.test.js`) to permanently prevent regressions.

### 6. Is there existing technical documentation, or would we be reverse-engineering?
* **Extensive Living Technical Documentation:** Complete, enterprise-grade technical documentation is already present in the repository, including:
  * `docs/IDS_PULSE_MASTER_SYSTEM_BLUEPRINT.html` (Master Architectural Blueprint)
  * `docs/IDS_PULSE_PRODUCT_DESIGNER_SPECIFICATION.html` (UI/UX Design System Specification)
  * `.agents/rules/ids-pulse-enterprise-standards.md` (Enterprise Architecture & Code Standards)
  * `docs/REPORT_BRANDING_STANDARD.md` (Official Branding & Export Protocol)
  * Clean, modular source code with strict type signatures and inline docstrings.

---

## Section B: Data & Data Model

### 7. Can you walk us through the data schema for inspections and quality alerts?
* **`suppliers`:** Client companies (Tier-1 automotive suppliers, OEMs) with contact records and billing defaults.
* **`plants`:** Assembly plant locations (e.g. GM Oshawa, CAMI Ingersoll, Magna St. Thomas) with dynamic address, country, and currency (CAD/USD).
* **`projects`:** Active containment projects linking Client, Plant, Purchase Order (PO Number), allocated Budget Hours cap, suspect part numbers, assigned Field Inspector, and hourly billing/pay rates.
* **`shiftReports`:** Daily field shift logs capturing GPS clock-in/out timestamps, total elapsed hours, inspected parts count, rework units, scrap quantities, and publication lifecycle status (`draft` $\rightarrow$ `Submitted` $\rightarrow$ `published`).
* **`incidents` / `qualityAlerts`:** Quality containment tickets capturing 4-step details (part number, defect type, concern level, root cause narrative, containment sort method, and photo evidence canvas markup).
* **`rates`:** Authoritative billing and pay rate rules with 3-tier fallback resolution (rates table $\rightarrow$ supplier defaults $\rightarrow$ plant currency defaults).
* **`users`:** Unified user directory with role-based permissions (`admin`, `lead`, `rep`, `customer`).

### 8. How is data captured in the field today?
* **Mobile Quality App (Android / PWA):** Field inspectors capture data on smartphones and tablets via:
  1. **1-Tap Shift Clock-in:** GPS timestamp and live running elapsed hours timer.
  2. **Barcode / QR Container Scanner:** Built-in camera scanner reading lot labels directly on the floor.
  3. **Photo Evidence Markup:** Live camera capture with an interactive HTML5 canvas allowing inspectors to draw defect arrows, circles, and callout notes on part photos.
  4. **4-Step Wizard:** Step-by-step modal capturing part numbers, defect counts, action taken, and plant contact spoken with.

### 9. What's the volume — inspections per day, quality alerts per month, active facilities?
* **Active Facilities:** 10+ Tier-1 automotive assembly and manufacturing facilities across Ontario (Canada) and Michigan/Ohio/Texas (US).
* **Daily Volume:** Hundreds to thousands of automotive components inspected and sorted daily per active shift.
* **Monthly Volume:** Dozens of critical quality containment alerts, hundreds of shift logs, and continuous real-time shift telemetry.

### 10. Is data structured consistently across every site?
* **100% Consistent & Standardized:** All facilities utilize the identical authoritative schema, validation engine, and rate resolver enforced by `SharedDatabase.js`. Custom spreadsheet silos have been replaced with a unified schema.

### 11. Is there a single source of truth?
* **Single Authoritative Source:** The Supabase PostgreSQL database is the single canonical source of truth. Web dashboards, executive client portals, mobile inspection apps, and PDF export engines query this central store in real time.

### 12. How clean and complete is the historical data for AI/analytics models?
* **High Data Integrity:** Historical records are structured with mandatory automotive fields (PO Number, Part Number, Plant Location, Inspected Counts, Defect Classifications, Timestamps) and zero orphaned foreign keys, making the dataset immediately ready for predictive defect modeling, PPM forecasting, and AI training.

---

## Section C: Reporting & Analytics Gaps

### 13. Walk me through how a manager actually gets a report today, step by step.
1. **Field Submission:** Inspector submits a daily shift report via the Mobile Quality App.
2. **QA Director Review:** QA Director (Donna) receives the draft in the Web Command Center feed and audits piece counts and PO hour burn.
3. **1-Click Publishing Gate:** QA Director clicks "Publish to Client Portal".
4. **Automated Dispatch:** The system updates the live Client Executive Portal feed and automatically dispatches official branded PDF/HTML summaries via email to designated client contacts.

### 14. Which reports are requested most often, and which take the longest to produce?
* **Most Requested:** Daily Quality Containment Summaries (PDF), Certified Clean Lot Feeds, PO Budget Burn Reports, and Bi-Weekly Client Invoices.
* **Production Time:** Generated on-demand in `< 2 seconds` via built-in vector PDF and CSV export engines.

### 15. What decisions are being delayed or made blind because of reporting gaps?
* **Solved by IDS Pulse:** Prior to IDS Pulse, manual paper logs delayed containment status by 24–48 hours, risking line shutdowns ($50k/min). IDS Pulse provides real-time shift telemetry and live defect PPM tracking, eliminating blind spots.

### 16. Do you need real-time/live dashboards, or is daily/weekly reporting sufficient?
* **Both are Mission-Critical:** Real-time dashboards are required for active plant floor containment and emergency holds, while automated daily/weekly PDF digests are delivered for executive management reviews.

### 17. Is there any cross-facility or cross-program rollup today?
* **Yes, Fully Implemented:** The Master Operations Matrix in the Web Operations Suite provides cross-plant rollups across all active automotive programs in both the US and Canada.

### 18. What does "good" analytics look like to you?
* Real-time Defect PPM Pareto trend charts, certified clean container lot counters, live PO budget burn rate meters (actual vs cap), inspector shift efficiency scorecards, and rate margin financial analytics.

---

## Section D: Integrations & Dependencies

### 19. Does the current system integrate with OEM portals, ERP, PPAP, or hardware?
* Built-in mobile camera hardware integration for barcode/QR scanning and photo markup.
* Automated email dispatch services (SendGrid/SMTP/API).
* QuickBooks and payroll CSV batch export pipeline.
* PostgreSQL realtime WebSockets for live plant floor feed broadcasting.

### 20. Are there external systems the current tool depends on?
* Hosted on standard enterprise cloud infrastructure (Supabase PostgreSQL, Vercel Edge). It operates self-sufficiently without fragile screen-scraping dependencies.

### 21. What authentication is used?
* Supabase Authentication with JWT tokens, session role synchronization, and granular Role-Based Access Control (RBAC).

### 22. Is the solution tied to specific hardware?
* **Hardware-Agnostic:** Operates seamlessly on any Android smartphone/tablet, iPhone/iPad (PWA/Safari), and desktop workstation (Chrome/Edge/Firefox). Standard mobile cameras function as barcode scanners, eliminating the need for expensive proprietary scanner guns.

---

## Section E: Users, Roles & Workflow

### 23. Who are the primary users?
1. **Super-Admin / Operations Lead:** Shahroz Mirza (Super-Admin), Donna (Operations Lead) — full system governance and financial oversight.
2. **IDS Field Inspector / Quality Liaison Rep:** Clarence Kuiken, Hugo Ramos — plant floor inspection and defect logging.
3. **Client Quality Manager / OEM Representative:** Robert Sterling (@ Magna), Elena Rostova — lot tracking and overtime approvals.
4. **Accounting & Financials:** Billing rate reconciliation, PO tracking, and payroll export.

### 24. What does a typical day look like for a field inspector using the tool?
* Clocks in with 1-tap GPS timestamp on Mobile App $\rightarrow$ Reviews pre-assigned plant and part numbers $\rightarrow$ Conducts 5 plant walk audits $\rightarrow$ Scans container barcodes $\rightarrow$ Counts inspected/rework/scrap parts $\rightarrow$ Annotates defect photos $\rightarrow$ Submits daily report $\rightarrow$ Clocks out.

### 25. What permission levels exist today?
* **4-Tier Strict RBAC:** Super-Admin (unrestricted), Operations Lead (project/report review), Field Inspector (assigned plant data capture only), and Client Quality Manager (isolated customer lot feeds and overtime approvals only).

### 26. Do customers or OEMs ever get direct access to the tool or reports?
* **Yes:** Client Quality Managers log directly into the dedicated **Client Executive Portal** to view live certified clean parts, defect charts, and approve overtime requests with zero access to internal wage costs or other clients' data.

---

## Section F: Infrastructure, Security & Compliance

### 27. Is data subject to specific compliance requirements?
* Built to align with automotive **IATF 16949** quality management standards, **ISO 9001** containment traceability, and **WCAG AAA** high-contrast UI accessibility guidelines (> 7:1 contrast ratio).

### 28. Where is data hosted, and are there data-residency requirements?
* Hosted in enterprise-grade AWS / Supabase cloud regions in North America (US East) with automated SSL/TLS encryption in transit and AES-256 encryption at rest.

### 29. Has the app had a security review?
* Implements PostgreSQL Row-Level Security (RLS), parameterized queries, strict session role synchronization, sanitized form inputs, and automated lint gates (`no-undef` error enforcement).

### 30. What is the backup and disaster-recovery story today?
* Continuous automated PostgreSQL Point-in-Time Recovery (PITR) and daily automated snapshot backups via Supabase enterprise infrastructure.

### 31. Do you have the capability for SSO?
* **Yes:** Readily integrable with enterprise SAML 2.0, OAuth2, Azure Active Directory, and Okta via Supabase enterprise auth connectors.

---

## Section G: Team, Ownership & Constraints

### 32. Who owns and maintains the code day-to-day?
* 100% owned and actively maintained by the internal IDS Core Engineering Team led by Super-Admin Shahroz Mirza.

### 33. What is the appetite for a full replatform versus layering AI/analytics?
* **High Appetite for Layering AI / Analytics:** The existing React 18 / Supabase / Capacitor platform is modern, high-performing, and robust. The preferred North Star is layering AI predictive analytics, computer-vision defect tagging, and natural language report summarization directly onto this architecture.

### 34. Are there licensing or IP constraints?
* **Zero Constraints:** IDS owns 100% of the proprietary codebase, schemas, branding assets, and design systems with zero third-party licensing encumbrances.

### 35. What is driving urgency on this?
* Active multi-plant automotive liaison contracts with OEM giants requiring zero-delay defect containment, verifiable lot traceability, and automated client reporting.

---

## Section H: AI-Readiness

### 36. Are defect photos tagged or categorized in a structured way for computer vision?
* **Yes:** Photos are stamped with metadata including Plant ID, Component Part Number, Defect Category, Severity Level, and Timestamp. Visual canvas markup coordinates (bounding boxes, arrows) provide clean training data for defect localization models.

### 37. Is there free-text data that could feed NLP summarization?
* **Yes:** Extensive structured narrative fields are captured daily, including Root Cause Explanations, Containment Sort Action Descriptions, Plant Floor Contact Notes, and Inspector Shift Logs.

### 38. Has the organization tried automation or AI before?
* **Yes, Production Automations Active:** Automated 3-tier rate resolution engine, automated PDF report generators, automated outbox sync queue workers, and automated email summary distribution.

### 39. Who governs AI outputs and explainability?
* **Human-in-the-Loop Governance:** Super-Admin and QA Director maintain final review gates. All AI outputs require full explainability, audit logging, and human sign-off before publishing to client portals.

---

## Section I: North Star Alignment (BaseTQ-Specific)

### 40. Which BaseTQ-style capabilities matter most?
1. Real-time mobile quality inspection and barcode scanning.
2. Multi-plant containment alert management.
3. Live certified clean lot traceability feeds.
4. In-app overtime authorization drawer.
5. Automated PO budget reconciliation and invoicing.

### 41. Do you need supplier- or OEM-facing views?
* **Yes, Both Implemented:** Internal IDS Command Center views for operational triage and Client Executive Portal views for OEM customer transparency.

### 42. Is barcode/serial-number scanning already solved?
* **Fully Solved:** In-app mobile camera barcode/QR scanner is already integrated directly into the inspection workflow.

### 43. How important is a formal approval/authorization workflow?
* **Critical & Fully Implemented:**
  1. **QA Review Gate:** Draft reports must be reviewed and approved by QA Director Donna before client publishing.
  2. **Customer Overtime Drawer:** Field inspector overtime requests require 1-click authorization by the Client Quality Manager before being locked into billable timesheets.

---
*Authorized for release by Integrity Driven Solutions Inc. (IDS) Core Architecture Team.*
