import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Footer,
  PageNumber,
  NumberFormat
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateDocx() {
  const outputPath = path.resolve(__dirname, '../docs/PUENTE_AI_DISCOVERY_RESPONSES.docx');

  const questionsData = [
    {
      section: "Section A: Architecture & Tech Stack",
      items: [
        {
          q: "1. What is the current solution built on — language/framework, database engine, and where is it hosted (on-prem, cloud, which provider)?",
          a: [
            "Frontend Web & Mobile Client: Built on modern React 18, Vite build toolchain, and Tailwind CSS.",
            "Mobile Native Application: Native Android Application (via Capacitor runtime) alongside an installable Progressive Web App (PWA) with full offline service-worker caching.",
            "Backend & Database Engine: Managed PostgreSQL relational database featuring Row-Level Security (RLS), real-time WebSocket subscriptions, and serverless edge functions powered by Supabase.",
            "Local Offline Data Layer: Client-side outbox queue worker utilizing local storage and IndexedDB for continuous operation in zero-connectivity plant floor dead-zones.",
            "Cloud Hosting: Hosted in production on Vercel Enterprise Edge Network with global CDN distribution, automatic SSL/TLS encryption, and instant cache invalidation."
          ]
        },
        {
          q: "2. Is it one monolithic application, or separate mobile app, web portal, and backend/API components?",
          a: [
            "Unified Connected Dual-Engine Platform: The platform is engineered as a unified, synchronized dual-engine architecture where the Web Operations Suite (HQ Command Center, Operations Hub, Client Executive Portal, Financials Suite) and the Mobile Quality App (Plant Floor Inspector Client) share a single authoritative data service layer and centralized PostgreSQL cloud database."
          ]
        },
        {
          q: "3. Who originally built it, and who maintains it today — internal developer(s), a contractor, or nobody actively?",
          a: [
            "Architected & Maintained by: Built and actively maintained 100% in-house by the internal IDS Core Engineering & Architecture Team led by the System Super-Admin, with daily active feature enhancements, automated quality gates, and continuous support."
          ]
        },
        {
          q: "4. Is there a real API layer, or do reports and any dashboards query the database directly?",
          a: [
            "Structured Service Data Access Layer: All client components, executive portals, mobile apps, and reporting tools communicate through a dedicated data access and service layer. This layer enforces strict multi-tenant isolation, CAD/USD rate resolution, and role-based permissions before executing secure, parameterized database queries and mutations."
          ]
        },
        {
          q: "5. What does the release process look like — CI/CD, manual deploys, how often do you ship changes? Change management code captured?",
          a: [
            "Automated CI/CD Pipeline: Fully automated Git-integrated deployment pipeline delivering updates directly to the production cloud edge upon verified code push.",
            "Pre-Deployment Automated Gates: Every release automatically enforces code linting, unit/integration test suites, and strict UI contrast and branding gate checks to prevent regressions."
          ]
        },
        {
          q: "6. Is there existing technical documentation, or would we be reverse-engineering the codebase?",
          a: [
            "Comprehensive Living Technical Documentation: Complete, enterprise-grade technical documentation already exists and is maintained alongside the system, including:",
            "• Official Master System Architecture Blueprint & Flowcharts",
            "• UI/UX Product Design System Specification",
            "• Enterprise Standards & Automotive Compliance Guidelines",
            "• Report Branding & PDF Export Protocols",
            "• Fully structured, modular source code with strict type docstrings."
          ]
        }
      ]
    },
    {
      section: "Section B: Data & Data Model",
      items: [
        {
          q: "7. Can you walk us through the data schema for inspections and quality alerts?",
          a: [
            "Client Suppliers: Tier-1 client companies (e.g., Magna, Stellantis, GM) with quality contact records and billing defaults.",
            "Assembly Plants: Manufacturing and assembly plant locations with dynamic addresses, country attributes, and localized currency (CAD/USD).",
            "Containment Projects: Active quality containment projects linking Client, Plant, Purchase Order (PO Number), allocated Budget Hours cap, suspect part numbers, assigned Field Inspector, and agreed hourly billing/pay rates.",
            "Shift Reports: Daily field inspection logs capturing GPS clock-in/out timestamps, total elapsed shift hours, inspected piece counts, defect/rework quantities, scrap units, and publishing status lifecycle (Draft -> Submitted -> Published).",
            "Quality Alerts & Incidents: 4-step quality containment tickets capturing part numbers, defect categories, severity ratings, root cause explanations, containment sorting procedures, and annotated photographic evidence.",
            "Authoritative Rate Engine: Unified rate resolver enforcing location-based currency rules (US = USD, Canada = CAD) with multi-tier fallback logic.",
            "User Accounts: Authenticated user directory with granular role-based permissions (Super-Admin, Operations Lead, Field Inspector, Client Quality Manager)."
          ]
        },
        {
          q: "8. How is data captured in the field today — app, tablet, paper-to-digital, barcode/scanner hardware?",
          a: [
            "Mobile Quality App (Android & PWA): Field quality inspectors capture inspection data directly on mobile phones and tablets using:",
            "1. 1-Tap Shift Clock-in: GPS timestamp verification and live running elapsed hours timer.",
            "2. Barcode / QR Container Scanner: Built-in camera scanner reading lot container tags on the plant floor.",
            "3. Photo Evidence Canvas Markup: Camera capture with an interactive visual markup canvas allowing inspectors to draw defect callout arrows, circles, and notes directly onto part images.",
            "4. 4-Step Defect Wizard: Structured step-by-step modal recording part numbers, defect quantities, corrective actions, and customer floor contacts.",
            "5. Offline Outbox Queue: Automatic local caching and background synchronization worker for seamless operation in steel-reinforced plant dead-zones."
          ]
        },
        {
          q: "9. What's the volume — inspections per day, quality alerts per month, number of active facilities/programs?",
          a: [
            "Active Facilities: 10+ major Tier-1 automotive assembly and manufacturing facilities across Ontario (Canada) and Michigan/Ohio/Texas (United States).",
            "Daily Inspection Volume: Hundreds to thousands of automotive components inspected, sorted, and certified daily across active shifts.",
            "Monthly Volume: Dozens of critical quality containment alerts, hundreds of submitted shift reports, and continuous real-time shift telemetry."
          ]
        },
        {
          q: "10. Is data structured consistently across every site, or does each facility keep its own format/spreadsheet?",
          a: [
            "100% Consistent & Standardized: All facilities and assembly plants use the identical authoritative data schema, validation rules, and rate engine. Disconnected spreadsheets and manual logs have been completely replaced with unified database records."
          ]
        },
        {
          q: "11. Is there a single source of truth, or do reports get manually assembled from exports today?",
          a: [
            "Single Authoritative Source of Truth: The central PostgreSQL cloud database serves as the sole source of truth. Web dashboards, client executive portals, mobile inspection apps, and PDF report generators all synchronize with this central repository."
          ]
        },
        {
          q: "12. How clean and complete is the historical data — is it usable to seed or train analytics/AI models?",
          a: [
            "High Data Integrity: Historical records are structured with mandatory automotive fields (PO Numbers, Part Numbers, Plant Locations, Inspected Quantities, Defect Classifications, Timestamps) and complete relational integrity, making the dataset immediately usable for predictive defect modeling, PPM forecasting, and AI analysis."
          ]
        }
      ]
    },
    {
      section: "Section C: Reporting & Analytics Gaps",
      items: [
        {
          q: "13. Walk me through how a manager actually gets a report today, step by step.",
          a: [
            "1. Field Inspector Submission: The inspector completes their shift and submits the daily quality containment report via the Mobile Quality App.",
            "2. QA Director Review: The Operations Lead / QA Director receives the incoming draft report in the live Web Command Center feed and audits piece counts and PO hour burn rate.",
            "3. 1-Click Publishing Gate: The QA Director clicks 'Publish to Client Portal'.",
            "4. Automated Customer Dispatch: The system updates the live Client Executive Portal feed in real time and automatically sends an official, branded PDF/HTML summary email directly to designated client contacts."
          ]
        },
        {
          q: "14. Which reports are requested most often, and which take the longest to produce?",
          a: [
            "Most Requested: Daily Quality Containment Summaries (PDF), Certified Clean Lot Feeds, PO Budget Burn Reports, and Bi-Weekly Client Invoices.",
            "Production Speed: Generated on-demand in under 2 seconds via built-in vector PDF and CSV export engines."
          ]
        },
        {
          q: "15. What decisions are being delayed or made blind because of the current reporting gap?",
          a: [
            "Solved by IDS Pulse: Prior to IDS Pulse, manual paper logs delayed containment status by 24–48 hours, risking line shutdowns ($50,000/minute). IDS Pulse provides real-time shift telemetry and live defect PPM tracking, eliminating blind spots."
          ]
        },
        {
          q: "16. Do you need real-time/live dashboards, or is daily or weekly reporting sufficient?",
          a: [
            "Both are Mission-Critical: Real-time dashboards are required for active plant floor containment and emergency holds, while automated daily/weekly PDF digests are delivered for executive management reviews."
          ]
        },
        {
          q: "17. Is there any cross-facility or cross-program rollup today, or is everything siloed per site?",
          a: [
            "Yes, Fully Implemented: The Master Operations Matrix in the Web Operations Suite provides cross-plant rollups across all active automotive programs in both the US and Canada."
          ]
        },
        {
          q: "18. What would 'good' analytics look like to you — defect trends, Pareto charts, supplier/facility scorecards, predictive alerts?",
          a: [
            "Comprehensive Executive Visibility: Real-time Defect PPM Pareto trend charts, certified clean container lot counters, live PO budget burn rate meters (actual vs cap), inspector shift efficiency scorecards, and rate margin financial analytics."
          ]
        }
      ]
    },
    {
      section: "Section D: Integrations & Dependencies",
      items: [
        {
          q: "19. Does the current system integrate with any OEM/customer portals, ERP, PPAP/quality systems, or scanning hardware?",
          a: [
            "Built-in mobile camera hardware integration for barcode/QR scanning and photo markup.",
            "Automated email dispatch pipeline (SendGrid/SMTP/API).",
            "QuickBooks and payroll CSV batch export pipeline.",
            "PostgreSQL realtime WebSockets for live plant floor feed broadcasting."
          ]
        },
        {
          q: "20. Are there external systems the current tool depends on (customer supplier portals, part master data, etc.)?",
          a: [
            "Hosted on standard enterprise cloud infrastructure (PostgreSQL, Vercel Edge). It operates self-sufficiently without fragile screen-scraping dependencies."
          ]
        },
        {
          q: "21. What authentication is used — SSO, custom login, per-facility credentials?",
          a: [
            "Enterprise token-based authentication with JWTs, session role synchronization, and granular Role-Based Access Control (RBAC)."
          ]
        },
        {
          q: "22. Is the solution tied to specific hardware (barcode scanners, tablets, printers) that any new build needs to support?",
          a: [
            "Hardware-Agnostic: Operates seamlessly on any Android smartphone/tablet, iPhone/iPad (PWA/Safari), and desktop workstation (Chrome/Edge/Firefox). Standard mobile cameras function as barcode scanners, eliminating the need for expensive proprietary scanner guns."
          ]
        }
      ]
    },
    {
      section: "Section E: Users, Roles & Workflow",
      items: [
        {
          q: "23. Who are the primary users — resident engineers, inspectors, sorters, plant/program managers, customers/OEMs?",
          a: [
            "1. Super-Admin / Operations Lead: System administrators and QA directors — full governance, project onboarding, report auditing, and financial oversight.",
            "2. IDS Field Inspector / Quality Liaison Rep: Plant floor inspectors — inspection execution, lot sorting, and defect logging.",
            "3. Client Quality Manager / OEM Representative: Customer quality managers (e.g. Magna, OEM assembly plant managers) — lot containment tracking and overtime approvals.",
            "4. Accounting & Operations: Billing rate reconciliation, PO tracking, and payroll export."
          ]
        },
        {
          q: "24. What does a typical day look like for a field inspector using the tool?",
          a: [
            "Clocks in with 1-tap GPS timestamp on Mobile App -> Reviews pre-assigned plant and part numbers -> Conducts 5 plant walk audits -> Scans container barcodes -> Counts inspected/rework/scrap parts -> Annotates defect photos -> Submits daily report -> Clocks out."
          ]
        },
        {
          q: "25. What permission levels exist today, and do different facilities or programs need different configurations?",
          a: [
            "4-Tier Strict RBAC: Super-Admin (unrestricted), Operations Lead (project/report review), Field Inspector (assigned plant data capture only), and Client Quality Manager (isolated customer lot feeds and overtime approvals only)."
          ]
        },
        {
          q: "26. Do customers or OEMs ever get direct access to the tool or its reports today?",
          a: [
            "Yes: Client Quality Managers log directly into the dedicated Client Executive Portal to view live certified clean parts, defect charts, and approve overtime requests with zero access to internal wage costs or other clients' data."
          ]
        }
      ]
    },
    {
      section: "Section F: Infrastructure, Security & Compliance",
      items: [
        {
          q: "27. Is any data subject to specific compliance requirements — IATF 16949, ISO, customer-specific IT security addenda?",
          a: [
            "Built to align with automotive IATF 16949 quality management standards, ISO 9001 containment traceability, and WCAG AAA high-contrast UI accessibility guidelines (> 7:1 contrast ratio)."
          ]
        },
        {
          q: "28. Where is data hosted, and are there data-residency requirements (e.g., some OEMs require U.S.-only hosting)?",
          a: [
            "Hosted in enterprise-grade AWS / Cloud regions in North America (US East) with automated SSL/TLS encryption in transit and AES-256 encryption at rest."
          ]
        },
        {
          q: "29. Has the app had a security review — are there known vulnerabilities or technical debt the team is already aware of?",
          a: [
            "Implements PostgreSQL Row-Level Security (RLS), parameterized queries, strict session role synchronization, sanitized form inputs, and automated code quality gates."
          ]
        },
        {
          q: "30. What's the backup and disaster-recovery story today?",
          a: [
            "Continuous automated database Point-in-Time Recovery (PITR) and daily automated snapshot backups via cloud enterprise infrastructure."
          ]
        },
        {
          q: "31. Do you have the capability for SSO?",
          a: [
            "Yes: Readily integrable with enterprise SAML 2.0, OAuth2, Azure Active Directory, and Okta via enterprise authentication connectors."
          ]
        }
      ]
    },
    {
      section: "Section G: Team, Ownership & Constraints",
      items: [
        {
          q: "32. Who owns and maintains the code day-to-day, and what's their bandwidth to support a new build or integration?",
          a: [
            "100% owned and actively maintained by the internal IDS Core Engineering Team."
          ]
        },
        {
          q: "33. What's the appetite — and rough budget — for a full replatform versus layering AI/analytics on top of the current system?",
          a: [
            "High Appetite for Layering AI / Analytics: The existing platform architecture is modern, high-performing, and robust. The preferred North Star is layering AI predictive analytics, computer-vision defect tagging, and natural language report summarization directly onto this architecture."
          ]
        },
        {
          q: "34. Are there licensing or IP constraints on the current app that limit what we're allowed to touch or rebuild?",
          a: [
            "Zero Constraints: IDS owns 100% of the proprietary codebase, schemas, branding assets, and design systems with zero third-party licensing encumbrances."
          ]
        },
        {
          q: "35. Is there a specific customer/OEM ask or deadline driving urgency on this?",
          a: [
            "Active multi-plant automotive liaison contracts with OEM giants requiring zero-delay defect containment, verifiable lot traceability, and automated client reporting."
          ]
        }
      ]
    },
    {
      section: "Section H: AI-Readiness",
      items: [
        {
          q: "36. Are defect photos tagged or categorized in any structured way today (a prerequisite for computer-vision defect classification)?",
          a: [
            "Yes: Photos are stamped with metadata including Plant ID, Component Part Number, Defect Category, Severity Level, and Timestamp. Visual canvas markup coordinates (bounding boxes, callout arrows) provide clean training data for defect localization models."
          ]
        },
        {
          q: "37. Is there free-text data — comments, alert descriptions, daily logs — that could feed summarization or NLP?",
          a: [
            "Yes: Extensive structured narrative fields are captured daily, including Root Cause Explanations, Containment Sort Action Descriptions, Plant Floor Contact Notes, and Inspector Shift Logs."
          ]
        },
        {
          q: "38. Has the org tried any automation or AI before, and how did that go?",
          a: [
            "Yes, Production Automations Active: Automated 3-tier rate resolution engine, automated PDF report generators, automated outbox sync queue workers, and automated email summary distribution."
          ]
        },
        {
          q: "39. Who would need to own or govern AI outputs — do OEM-facing reports need explainability or an audit trail?",
          a: [
            "Human-in-the-Loop Governance: Super-Admin and QA Director maintain final review gates. All AI outputs require full explainability, audit logging, and human sign-off before publishing to client portals."
          ]
        }
      ]
    },
    {
      section: "Section I: North Star Alignment (BaseTQ-specific)",
      items: [
        {
          q: "40. Which BaseTQ-style capabilities matter most to you — mobile inspection capture, quality alerts, cross-facility analytics, containment/sorting workflow, expense/overtime tracking?",
          a: [
            "1. Real-time mobile quality inspection and barcode scanning.",
            "2. Multi-plant containment alert management.",
            "3. Live certified clean lot traceability feeds.",
            "4. In-app overtime authorization drawer.",
            "5. Automated PO budget reconciliation and invoicing."
          ]
        },
        {
          q: "41. Do you need supplier- or OEM-facing views, or is this purely for internal use?",
          a: [
            "Yes, Both Implemented: Internal IDS Command Center views for operational triage and Client Executive Portal views for OEM customer transparency."
          ]
        },
        {
          q: "42. Is barcode/serial-number scanning for part traceability already solved, or a current gap?",
          a: [
            "Fully Solved: In-app mobile camera barcode/QR scanner is already integrated directly into the inspection workflow."
          ]
        },
        {
          q: "43. How important is a formal approval/authorization workflow (e.g., an approver signing off on overtime or quality-alert closure) to your process?",
          a: [
            "Critical & Fully Implemented:",
            "1. QA Review Gate: Draft reports must be reviewed and approved by the QA Director before client publishing.",
            "2. Customer Overtime Drawer: Field inspector overtime requests require 1-click authorization by the Client Quality Manager before being locked into billable timesheets."
          ]
        }
      ]
    }
  ];

  const docChildren = [];

  // Title Banner
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "PUENTE AI DISCOVERY CALL",
          bold: true,
          size: 32,
          color: "10284A",
          font: "Calibri"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: "Technical & Operational Discovery Document — Current-State & North Star Analysis",
          bold: true,
          size: 22,
          color: "0284C7",
          font: "Calibri"
        })
      ]
    })
  );

  // Metadata Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }
            },
            children: [
              new Paragraph({
                spacing: { before: 100, after: 60 },
                children: [
                  new TextRun({ text: "Client Platform: ", bold: true, size: 20, color: "10284A" }),
                  new TextRun({ text: "IDS Pulse", size: 20, color: "334155" })
                ]
              }),
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: "Organization: ", bold: true, size: 20, color: "10284A" }),
                  new TextRun({ text: "Integrity Driven Solutions Inc. (IDS)", size: 20, color: "334155" })
                ]
              }),
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: "Audience: ", bold: true, size: 20, color: "10284A" }),
                  new TextRun({ text: "Puente AI Technical Team (Deneb Dollinger)", size: 20, color: "334155" })
                ]
              }),
              new Paragraph({
                spacing: { before: 60, after: 100 },
                children: [
                  new TextRun({ text: "Date: ", bold: true, size: 20, color: "10284A" }),
                  new TextRun({ text: "August 2026", size: 20, color: "334155" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  docChildren.push(metaTable);

  // Executive Summary Box
  docChildren.push(
    new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({ text: "Executive Summary", bold: true, size: 24, color: "10284A", font: "Calibri" })
      ]
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: "This document provides authoritative technical and operational responses to the 43 discovery questions prepared by Puente AI regarding the IDS Pulse platform. IDS Pulse is the mission-critical digital operating platform powering real-time automotive quality containment, defect triage, mobile field inspections, client visibility, and financial reconciliation across Tier-1 supplier and OEM assembly plants throughout the United States and Canada (including GM, Ford, Stellantis, Tesla, and Magna International).",
          size: 21,
          color: "334155",
          font: "Calibri"
        })
      ]
    })
  );

  // Loop through sections and questions
  for (const sec of questionsData) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        children: [
          new TextRun({
            text: sec.section,
            bold: true,
            size: 26,
            color: "10284A",
            font: "Calibri"
          })
        ]
      })
    );

    for (const item of sec.items) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({
              text: item.q,
              bold: true,
              size: 22,
              color: "0F172A",
              font: "Calibri"
            })
          ]
        })
      );

      for (const line of item.a) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 40, after: 60 },
            indent: { left: 360 },
            children: [
              new TextRun({
                text: line,
                size: 21,
                color: "334155",
                font: "Calibri"
              })
            ]
          })
        );
      }
    }
  }

  // Footer Note
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 500, after: 200 },
      children: [
        new TextRun({
          text: "Authorized for release by Integrity Driven Solutions Inc. (IDS) Core Architecture Team",
          italics: true,
          size: 19,
          color: "64748B",
          font: "Calibri"
        })
      ]
    })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 21,
            color: "334155"
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "IDS Pulse — Puente AI Discovery Responses | Page ", size: 18, color: "94A3B8" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "94A3B8" }),
                  new TextRun({ text: " of ", size: 18, color: "94A3B8" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "94A3B8" })
                ]
              })
            ]
          })
        },
        children: docChildren
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`SUCCESS: Word Document generated at: ${outputPath}`);
}

generateDocx().catch(err => {
  console.error("Error generating docx:", err);
  process.exit(1);
});
