# Job Description: Senior Full-Stack Developer (React / Supabase / Capacitor / Tailwind)

## Position Overview
- **Company**: Integrity Driven Solutions Inc. (IDS)
- **Product**: IDS Pulse Operations Suite (Automotive Quality Management Platform)
- **Employment Type**: Full-Time / Contract Developer
- **Primary Tech Stack**: React 19, Vite, Tailwind CSS v4, Supabase (PostgreSQL / RLS), Capacitor (Android Native), jsPDF, ExcelJS, Vitest
- **Target Platform**: Desktop Web Portal, Client Portal, Mobile PWA, and Native Android APK

Integrity Driven Solutions Inc. (IDS) is seeking an experienced Senior Full-Stack Developer to lead the ongoing development, maintenance, enhancement, and production release of the **IDS Pulse Operations Suite**. IDS Pulse is an enterprise automotive quality containment and field workforce management platform utilized by quality managers, field inspectors, account leadership, and tier-1 automotive clients (including GM, Stellantis, Ford, Hutchinson, Auto-Kabel, Magna, etc.).

---

## Key Responsibilities

1. **Full-Stack Application Development**:
   - Maintain and build features across the React 19 frontend (`src/App.jsx`, `WebDashboard.jsx`, `PhoneSimulator.jsx`, `IntegrityWeeklyTimesheet.jsx`).
   - Manage Supabase backend database schema (`IDS_Pulse_Supabase_Setup.sql`, RLS policies, tables: `suppliers`, `plants`, `parts`, `incidents`, `shift_reports`, `rework_logs`, `time_entries`, `expense_entries`, `users`).
   - Maintain client-side offline fallback data engine (`src/components/SharedDatabase.js`).

2. **Mobile & Cross-Platform Engineering**:
   - Maintain mobile-first responsive interfaces and Capacitor Android integration (`@capacitor/android`, `@capacitor/cli`).
   - Compile, sign, test, and release native Android APK builds (`idspulse-app.apk`) via PowerShell build pipelines (`build_native_apk.ps1`).

3. **PDF & Financial Reporting Engine**:
   - Maintain high-precision PDF exports (jsPDF & jsPDF-autotable) for shift containment reports, defect heatmaps, customer invoices, and accountant ledgers.
   - Maintain Excel ledger export engines (`exceljs`) ensuring exact column formatting, dynamic formulas, zero text truncation, and mandatory IDS branding.

4. **Multi-Role Security & Governance**:
   - Enforce strict role-based access controls across System Super-Admin (`shahroz`), Admins (`greg`, `donna`), Field Reps (`clarence`, etc.), Accountants (`colleen`), and Client Quality Representatives (`Robert Sterling`, `Elena Rostova`, etc.).
   - Enforce explicit security rules protecting system super-admin accounts and preventing privilege escalation.

5. **CI/CD & Live Deployment Verification**:
   - Manage live Vercel deployment pipeline (`https://proud-lavoisier.vercel.app/`).
   - Execute automated end-to-end quality release gates (`npm run build`, `vitest`, Puppeteer UI verification tests) before every production release.

---

## Required Qualifications & Technical Skills

- **Frontend**: 5+ years of experience with React (ES6+, React Hooks, React 19), Vite, and Tailwind CSS v4.
- **Backend & Database**: Strong expertise in Supabase / PostgreSQL, Row Level Security (RLS) policies, SQL migrations, REST APIs, and client-side offline caching strategies.
- **Mobile Native**: Hands-on experience with Capacitor, Android SDK, Android Studio / Gradle build tools, and APK code signing.
- **Reporting & Data Export**: Hands-on experience with `jspdf`, `jspdf-autotable`, and `exceljs` for complex tabular data layout generation.
- **Quality Assurance**: Proficiency with automated testing frameworks (Vitest, Puppeteer, ESLint, Node.js scripts) and CI/CD pipelines (Vercel).
- **Domain Knowledge**: Familiarity with automotive manufacturing terminology (PO numbers, suspect part numbers, containment actions, assembly plants, shift reports, rework inspection logs) is a major plus.

---

## Non-Negotiable Project Mandates & Guardrails

The hired developer MUST strictly follow all project rules outlined in `AGENTS.md` and repository guidelines:

1. **Zero Emoji Policy**: Emojis are strictly forbidden across all UI components, buttons, feeds, modals, reports, code comments, and documentation. Only clean SVG icons from `lucide-react` or professional typography may be used.
2. **Shahroz Mirza Super-Admin Lock**: The account `shahroz` is the sole unalterable System Super-Admin with password `Shahroz121$`. No script, code change, or admin operation may alter or overwrite this account.
3. **Automotive Onboarding Mandatory Fields**: All client onboarding flows and atomic transactions must record:
   - Purchase Order (PO Number)
   - Suspect Part Number / Component
   - Client Contact Phone & Email
   - Dynamic Assembly Plant Location & City
4. **Currency Rules**: 
   - US-based plants/clients and US-based reps evaluate in **USD**.
   - Canada-based plants/clients and Canadian reps evaluate in **CAD**.
5. **Canonical Reporting Standards**: Every human-readable PDF, HTML, or Excel report must carry the approved canonical IDS logo (`src/config/brandingConfig.js`) with zero text truncation.
6. **Live Single Source of Truth**: All verified builds must pass `npm run build` cleanly and be deployed live to Vercel with cache invalidation (`--force`).

---

## How to Apply & Evaluation Process

Candidates will be evaluated through:
1. Review of past React 19 / Supabase / Capacitor portfolio code.
2. A technical walkthrough of the [IDS_PULSE_TECHNICAL_SPECIFICATION.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/IDS_PULSE_TECHNICAL_SPECIFICATION.md).
3. Demonstration of local environment setup, running `npm run build`, and running automated verification tests as described in [IDS_PULSE_DEVELOPER_ONBOARDING_GUIDE.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/IDS_PULSE_DEVELOPER_ONBOARDING_GUIDE.md).
