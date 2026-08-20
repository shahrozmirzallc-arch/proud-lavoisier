# PUENTE AI Discovery Call — Technical & Operational Discovery Document
**Client Platform:** IDS Pulse  
**Organization:** Integrity Driven Solutions Inc. (IDS)  
**Date:** August 2026  
**Document Classification:** Executive Technical Discovery Responses  

---

## Executive Summary
This document provides comprehensive technical and operational responses to the 43 discovery questions prepared by Puente AI regarding the **IDS Pulse** platform. IDS Pulse is the mission-critical digital operating platform powering real-time automotive quality containment, defect triage, mobile field inspections, client visibility, and financial reconciliation across Tier-1 supplier and OEM assembly plants throughout the United States and Canada (including GM, Ford, Stellantis, Tesla, and Magna International).

---

## Section A: Architecture & Tech Stack

### 1. What is the current solution built on — language/framework, database engine, and where is it hosted?
* **Frontend Web & Mobile Client:** Built on modern React 18, Vite build toolchain, and Tailwind CSS.
* **Mobile Native Application:** Native Android Application (via Capacitor runtime) alongside an installable Progressive Web App (PWA) with full offline service-worker caching.
* **Backend & Database Engine:** Managed PostgreSQL relational database featuring Row-Level Security (RLS), real-time WebSocket subscriptions, and serverless edge functions powered by Supabase.
* **Local Offline Data Layer:** Client-side outbox queue worker utilizing local storage and IndexedDB for continuous operation in zero-connectivity plant floor dead-zones.
* **Cloud Hosting:** Hosted in production on Vercel Enterprise Edge Network with global CDN distribution, automatic SSL/TLS encryption, and instant cache invalidation.

### 2. Is it one monolithic application, or separate mobile app, web portal, and backend/API components?
* **Unified Connected Dual-Engine Platform:** The platform is engineered as a unified, synchronized dual-engine architecture where the **Web Operations Suite** (HQ Command Center, Operations Hub, Client Executive Portal, Financials Suite) and the **Mobile Quality App** (Plant Floor Inspector Client) share a single authoritative data service layer and centralized PostgreSQL cloud database.

### 3. Who originally built it, and who maintains it today?
* **Architected & Maintained by:** Built and actively maintained 100% in-house by the internal IDS Core Engineering & Architecture Team led by the System Super-Admin, with daily active feature enhancements, automated quality gates, and continuous support.

### 4. Is there a real API layer, or do reports and dashboards query the database directly?
* **Structured Service Data Access Layer:** All client components, executive portals, mobile apps, and reporting tools communicate through a dedicated data access and service layer. This layer enforces strict multi-tenant isolation, CAD/USD rate resolution, and role-based permissions before executing secure, parameterized database queries and mutations.

### 5. What does the release process look like — CI/CD, deploys, and change management?
* **Automated CI/CD Pipeline:** Fully automated Git-integrated deployment pipeline delivering updates directly to the production cloud edge upon verified code push.
* **Pre-Deployment Automated Gates:** Every release automatically enforces code linting, unit/integration test suites, and strict UI contrast and branding gate checks to prevent regressions.

### 6. Is there existing technical documentation, or would we be reverse-engineering?
* **Comprehensive Living Technical Documentation:** Complete, enterprise-grade technical documentation already exists and is maintained alongside the system, including:
  * Official Master System Architecture Blueprint
  * UI/UX Product Design System Specification
  * Enterprise Standards & Automotive Compliance Guidelines
  * Report Branding & PDF Export Protocols
  * Fully structured, modular source code with strict type docstrings.

---

## Section B: Data & Data Model

### 7. Can you walk us through the data schema for inspections and quality alerts?
* **Client Suppliers:** Tier-1 client companies (e.g., Magna, Stellantis, GM) with quality contact records and billing defaults.
* **Assembly Plants:** Manufacturing and assembly plant locations with dynamic addresses, country attributes, and localized currency (CAD/USD).
* **Containment Projects:** Active quality containment projects linking Client, Plant, Purchase Order (PO Number), allocated Budget Hours cap, suspect part numbers, assigned Field Inspector, and agreed hourly billing/pay rates.
* **Shift Reports:** Daily field inspection logs capturing GPS clock-in/out timestamps, total elapsed shift hours, inspected piece counts, defect/rework quantities, scrap units, and publishing status lifecycle (Draft $\rightarrow$ Submitted $\rightarrow$ Published).
* **Quality Alerts & Incidents:** 4-step quality containment tickets capturing part numbers, defect categories, severity ratings, root cause explanations, containment sorting procedures, and annotated photographic evidence.
* **Authoritative Rate Engine:** Unified rate resolver enforcing location-based currency rules (US = USD, Canada = CAD) with multi-tier fallback logic.
* **User Accounts:** Authenticated user directory with granular role-based permissions (Super-Admin, Operations Lead, Field Inspector, Client Quality Manager).

### 8. How is data captured in the field today?
* **Mobile Quality App (Android & PWA):** Field quality inspectors capture inspection data directly on mobile phones and tablets using:
  1. **1-Tap Shift Clock-in:** GPS timestamp verification and live running elapsed hours timer.
  2. **Barcode / QR Container Scanner:** Built-in camera scanner reading lot container tags on the plant floor.
  3. **Photo Evidence Canvas Markup:** Camera capture with an interactive visual markup canvas allowing inspectors to draw defect callout arrows, circles, and notes directly onto part images.
  4. **4-Step Defect Wizard:** Structured step-by-step modal recording part numbers, defect quantities, corrective actions, and customer floor contacts.
  5. **Offline Outbox Queue:** Automatic local caching and background synchronization worker for seamless operation in steel-reinforced plant dead-zones.

### 9. What's the volume — inspections per day, quality alerts per month, active facilities?
* **Active Facilities:** 10+ major Tier-1 automotive assembly and manufacturing facilities across Ontario (Canada) and Michigan/Ohio/Texas (United States).
* **Daily Inspection Volume:** Hundreds to thousands of automotive components inspected, sorted, and certified daily across active shifts.
* **Monthly Volume:** Dozens of critical quality containment alerts, hundreds of submitted shift reports, and continuous real-time shift telemetry.

### 10. Is data structured consistently across every site?
* **100% Consistent & Standardized:** All facilities and assembly plants use the identical authoritative data schema, validation rules, and rate engine. Disconnected spreadsheets and manual logs have been completely replaced with unified database records.

### 11. Is there a single source of truth?
* **Single Authoritative Source of Truth:** The central PostgreSQL cloud database serves as the sole source of truth. Web dashboards, client executive portals, mobile inspection apps, and PDF report generators all synchronize with this central repository.

### 12. How clean and complete is the historical data for AI/analytics models?
* **High Data Integrity:** Historical records are structured with mandatory automotive fields (PO Numbers, Part Numbers, Plant Locations, Inspected Quantities, Defect Classifications, Timestamps) and complete relational integrity, making the dataset immediately usable for predictive defect modeling, PPM forecasting, and AI analysis.

---

## Section C: Reporting & Analytics Gaps

### 13. Walk me through how a manager actually gets a report today, step by step.
1. **Field Inspector Submission:** The inspector completes their shift and submits the daily quality containment report via the Mobile Quality App.
2. **QA Director Review:** The Operations Lead / QA Director receives the incoming draft report in the live Web Command Center feed and audits piece counts and PO hour burn rate.
3. **1-Click Publishing Gate:** The QA Director clicks "Publish to Client Portal".
4. **Automated Customer Dispatch:** The system updates the live Client Executive Portal feed in real time and automatically sends an official, branded PDF/HTML summary email directly to designated client contacts.

### 14. Which reports are requested most often, and which take the longest to produce?
* **Most Requested:** Daily Quality Containment Summaries (PDF), Certified Clean Lot Feeds, PO Budget Burn Reports, and Bi-Weekly Client Invoices.
* **Production Speed:** Generated on-demand in under 2 seconds via built-in vector PDF and CSV export engines.

### 15. What decisions are being delayed or made blind because of reporting gaps?
* **Solved by IDS Pulse:** Prior to IDS Pulse, manual paper logs delayed containment status by 24–48 hours, risking line shutdowns ($50,000/minute). IDS Pulse provides real-time shift telemetry and live defect PPM tracking, eliminating blind spots.

### 16. Do you need real-time/live dashboards, or is daily or weekly reporting sufficient?
* **Both are Mission-Critical:** Real-time dashboards are required for active plant floor containment and emergency holds, while automated daily/weekly PDF digests are delivered for executive management reviews.

### 17. Is there any cross-facility or cross-program rollup today?
* **Yes, Fully Implemented:** The Master Operations Matrix in the Web Operations Suite provides cross-plant rollups across all active automotive programs in both the US and Canada.

### 18. What does "good" analytics look like to you?
* Real-time Defect PPM Pareto trend charts, certified clean container lot counters, live PO budget burn rate meters (actual vs cap), inspector shift efficiency scorecards, and rate margin financial analytics.

---

## Section D: Integrations & Dependencies

### 19. Does the current system integrate with OEM portals, ERP, PPAP, or hardware?
* Built-in mobile camera hardware integration for barcode/QR scanning and photo markup.
* Automated email dispatch pipeline (SendGrid/SMTP/API).
* QuickBooks and payroll CSV batch export pipeline.
* PostgreSQL realtime WebSockets for live plant floor feed broadcasting.

### 20. Are there external systems the current tool depends on?
* Hosted on standard enterprise cloud infrastructure (PostgreSQL, Vercel Edge). It operates self-sufficiently without fragile screen-scraping dependencies.

### 21. What authentication is used?
* Enterprise token-based authentication with JWTs, session role synchronization, and granular Role-Based Access Control (RBAC).

### 22. Is the solution tied to specific hardware?
* **Hardware-Agnostic:** Operates seamlessly on any Android smartphone/tablet, iPhone/iPad (PWA/Safari), and desktop workstation (Chrome/Edge/Firefox). Standard mobile cameras function as barcode scanners, eliminating the need for expensive proprietary scanner guns.

---

## Section E: Users, Roles & Workflow

### 23. Who are the primary users?
1. **Super-Admin / Operations Lead:** System administrators and QA directors — full governance, project onboarding, report auditing, and financial oversight.
2. **IDS Field Inspector / Quality Liaison Rep:** Plant floor inspectors — inspection execution, lot sorting, and defect logging.
3. **Client Quality Manager / OEM Representative:** Customer quality managers (e.g. Magna, OEM assembly plant managers) — lot containment tracking and overtime approvals.
4. **Accounting & Operations:** Billing rate reconciliation, PO tracking, and payroll export.

### 24. What does a typical day look like for a field inspector using the tool?
* Clocks in with 1-tap GPS timestamp on Mobile App $\rightarrow$ Reviews pre-assigned plant and part numbers $\rightarrow$ Conducts 5 plant walk audits $\rightarrow$ Scans container barcodes $\rightarrow$ Counts inspected/rework/scrap parts $\rightarrow$ Annotates defect photos $\rightarrow$ Submits daily report $\rightarrow$ Clocks out.

### 25. What permission levels exist today?
* **4-Tier Strict RBAC:** Super-Admin (unrestricted), Operations Lead (project/report review), Field Inspector (assigned plant data capture only), and Client Quality Manager (isolated customer lot feeds and overtime approvals only).

### 26. Do customers or OEMs ever get direct access to the tool or reports?
* **Yes:** Client Quality Managers log directly into the dedicated **Client Executive Portal** to view live certified clean parts, defect charts, and approve overtime requests with zero access to internal wage costs or other clients' data.

---

## Section F: Infrastructure, Security & Compliance

### 27. Is any data subject to specific compliance requirements?
* Built to align with automotive **IATF 16949** quality management standards, **ISO 9001** containment traceability, and **WCAG AAA** high-contrast UI accessibility guidelines (> 7:1 contrast ratio).

### 28. Where is data hosted, and are there data-residency requirements?
* Hosted in enterprise-grade AWS / Cloud regions in North America (US East) with automated SSL/TLS encryption in transit and AES-256 encryption at rest.

### 29. Has the app had a security review?
* Implements PostgreSQL Row-Level Security (RLS), parameterized queries, strict session role synchronization, sanitized form inputs, and automated code quality gates.

### 30. What is the backup and disaster-recovery story today?
* Continuous automated database Point-in-Time Recovery (PITR) and daily automated snapshot backups via cloud enterprise infrastructure.

### 31. Do you have the capability for SSO?
* **Yes:** Readily integrable with enterprise SAML 2.0, OAuth2, Azure Active Directory, and Okta via enterprise authentication connectors.

---

## Section G: Team, Ownership & Constraints

### 32. Who owns and maintains the code day-to-day?
* 100% owned and actively maintained by the internal IDS Core Engineering Team.

### 33. What is the appetite for a full replatform versus layering AI/analytics?
* **High Appetite for Layering AI / Analytics:** The existing platform architecture is modern, high-performing, and robust. The preferred North Star is layering AI predictive analytics, computer-vision defect tagging, and natural language report summarization directly onto this architecture.

### 34. Are there licensing or IP constraints?
* **Zero Constraints:** IDS owns 100% of the proprietary codebase, schemas, branding assets, and design systems with zero third-party licensing encumbrances.

### 35. What is driving urgency on this?
* Active multi-plant automotive liaison contracts with OEM giants requiring zero-delay defect containment, verifiable lot traceability, and automated client reporting.

---

## Section H: AI-Readiness

### 36. Are defect photos tagged or categorized in a structured way for computer vision?
* **Yes:** Photos are stamped with metadata including Plant ID, Component Part Number, Defect Category, Severity Level, and Timestamp. Visual canvas markup coordinates (bounding boxes, callout arrows) provide clean training data for defect localization models.

### 37. Is there free-text data that could feed NLP summarization?
* **Yes:** Extensive structured narrative fields are captured daily, including Root Cause Explanations, Containment Sort Action Descriptions, Plant Floor Contact Notes, and Inspector Shift Logs.

### 38. Has the organization tried automation or AI before?
* **Yes, Production Automations Active:** Automated 3-tier rate resolution engine, automated PDF report generators, automated outbox sync queue workers, and automated email summary distribution.

### 39. Who governs AI outputs and explainability?
* **Human-in-the-Loop Governance:** Super-Admin and QA Director maintain final review gates. All AI outputs require full explainability, audit logging, and human sign-off before publishing to client portals.

---

## Section I: North Star Alignment (BaseTQ-Specific)

### 40. Which BaseTQ-style capabilities matter most to you?
1. Real-time mobile quality inspection and barcode scanning.
2. Multi-plant containment alert management.
3. Live certified clean lot traceability feeds.
4. In-app overtime authorization drawer.
5. Automated PO budget reconciliation and invoicing.

### 41. Do you need supplier- or OEM-facing views, or is this purely for internal use?
* **Yes, Both Implemented:** Internal IDS Command Center views for operational triage and Client Executive Portal views for OEM customer transparency.

### 42. Is barcode/serial-number scanning for part traceability already solved?
* **Fully Solved:** In-app mobile camera barcode/QR scanner is already integrated directly into the inspection workflow.

### 43. How important is a formal approval/authorization workflow?
* **Critical & Fully Implemented:**
  1. **QA Review Gate:** Draft reports must be reviewed and approved by the QA Director before client publishing.
  2. **Customer Overtime Drawer:** Field inspector overtime requests require 1-click authorization by the Client Quality Manager before being locked into billable timesheets.

---
*Authorized for release by Integrity Driven Solutions Inc. (IDS) Core Architecture Team.*
