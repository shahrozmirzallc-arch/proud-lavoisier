# Developer Onboarding & Setup Guide: IDS Pulse

Welcome to **IDS Pulse Operations Suite**, developed for **Integrity Driven Solutions Inc. (IDS)**. This guide provides step-by-step instructions to get your local environment configured, run tests, adhere to coding rules, and deploy updates cleanly.

---

## 1. Prerequisites & Environment Setup

### Software Requirements
- **Node.js**: v18.x or v20.x installed
- **Package Manager**: `npm` (v9+)
- **Git**: Installed and configured
- **Android Studio** (Optional, required only for native APK debugging): JDK 17, Android SDK API 34+
- **Vercel CLI** (Optional, for production deployments): `npm i -g vercel`

### Quick Start Commands
```bash
# 1. Clone the repository
git clone https://github.com/shahrozmirzallc-arch/proud-lavoisier.git
cd proud-lavoisier

# 2. Install project dependencies
npm install

# 3. Launch local Vite development server
npm run dev
```

The application will be accessible locally at `http://localhost:5173`.

---

## 2. Project Architecture & Key Files

Before making changes, inspect these core architectural files:

1. **[AGENTS.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/AGENTS.md)**: Repository behavioral rules and mandatory project guardrails.
2. **[PROJECT_CODEX.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/PROJECT_CODEX.md)**: Codex summary of architecture, schemas, and login roles.
3. **[src/App.jsx](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/App.jsx)**: Authentication gateway, role session synchronization, and layout routing.
4. **[src/components/SharedDatabase.js](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/components/SharedDatabase.js)**: Authoritative database layer, 3-way contact resolution, and localStorage fallback logic.
5. **[src/components/WebDashboard.jsx](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/components/WebDashboard.jsx)**: Enterprise portal (Command Center, Defect Heatmap, Reports Hub, Invoicing, Workforce).
6. **[src/components/PhoneSimulator.jsx](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/src/components/PhoneSimulator.jsx)**: Field Rep Mobile App (Shift logs, rework entry, expense claims).

---

## 3. Strict Coding Guardrails & Anti-Recurrence Rules

Developers working on this repository MUST strictly follow these rules:

### Rule 1: Zero Emoji Policy
- Emojis are strictly prohibited anywhere in UI buttons, titles, modals, alert cards, feeds, reports, documentation, and code comments.
- Use SVG icons from `lucide-react` or professional typography.

### Rule 2: Shahroz Mirza Super-Admin Protection
- `shahroz` is the sole unalterable System Super-Admin with password `Shahroz121$`.
- Never alter, reset, or override this account in code or automated scripts.

### Rule 3: IDS Rep vs Client Rep Separation
- **IDS Rep**: IDS employee dispatched to plant floor (e.g. `Clarence Kuiken`).
- **Client Rep**: Client company quality manager (e.g. `Robert Sterling`).
- The `isFieldRep()` helper and rep dropdowns must exclude customer accounts (`role === 'customer' || role === 'client' || !!user.customer_id`).

### Rule 4: Mandatory Automotive Onboarding Fields
- Every project onboarding workflow must capture:
  1. PO Number
  2. Suspect Part Number
  3. Client Contact Phone & Email
  4. Dynamic Assembly Plant Location & City (never hardcode fixed fallback cities).

### Rule 5: Currency Evaluation
- United States (US) locations/reps evaluate in **USD**.
- Canadian locations/reps evaluate in **CAD**.

### Rule 6: High-Contrast Light Theme
- Enforce explicit high-contrast light theme container classes (`bg-white`, `text-slate-900`, `text-slate-950 font-extrabold`) for all alert cards and feeds.
- Never use low-contrast muted text on dark containers inside light dashboards.

---

## 4. Testing & Quality Verification

Run verification before committing any code:

```bash
# Run ESLint and Vite Build check
npm run build

# Run Vitest unit tests
npm run test

# Run Report Branding and Layout Gate Test
node tests/report_branding_and_layout_gate.test.js
```

---

## 5. Deployment & Release Workflow

### Web Production Deployment (Vercel)
The live production application is hosted on Vercel at `https://proud-lavoisier.vercel.app/`.

```bash
# Ensure build passes cleanly
npm run build

# Deploy to Vercel production with cache invalidation
vercel --prod --force
```

### Native Android Build Pipeline
To generate updated native Android APK files:

```bash
# Run PowerShell native Android build script
powershell -ExecutionPolicy Bypass -File ./build_native_apk.ps1
```

---

## 6. Support & Documentation Links

- **Job Description**: [IDS_PULSE_DEVELOPER_JOB_DESCRIPTION.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/IDS_PULSE_DEVELOPER_JOB_DESCRIPTION.md)
- **Technical Specification**: [IDS_PULSE_TECHNICAL_SPECIFICATION.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/IDS_PULSE_TECHNICAL_SPECIFICATION.md)
- **Branding Standard**: [REPORT_BRANDING_STANDARD.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/REPORT_BRANDING_STANDARD.md)
