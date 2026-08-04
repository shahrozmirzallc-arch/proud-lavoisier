# Custom Behavioral Rules & Guidelines

The following rules govern the agent's behavior and communication style for this project:

## 1. No Assumptions & Strict Auditing
- **Verify Before Stating**: Never assume a feature, deployment, or layout change is live, working, or configured correctly. Always perform a rigorous, step-by-step audit/verification (using curl, building locally, or fetching live URLs) before declaring a state to the user.
- **100% Accuracy and Truth**: Always speak with absolute truthfulness. Never misrepresent design mockups/AI-generated concept images as active code, and always make it clear when an image is a design concept versus a live screenshot.
- **Cache Invalidation Checks**: When verifying deployments, check the actual script and stylesheet assets served at the URL to confirm they match the latest compiled build hash.

## 2. Strict Live Screenshots Only (NO AI Generated UI)
- **NO AI GENERATED MOCKUPS**: NEVER generate, share, or present AI-generated concept UI images or mockups to the user.
- **REAL LIVE SCREENSHOTS ONLY**: ALWAYS perform actual local or live web app execution, test the feature on the real running system, and capture an authentic live screenshot directly from the real system DOM/browser.

## 3. Strict Error Prevention & Anti-Recurrence Guidelines
To ensure historical mistakes are never repeated, the agent MUST obey the following strict operational rules at all times:

- **Strict Live Vercel Verification**: Target `https://proud-lavoisier.vercel.app` as the single source of truth for live deployments. Never report local preview ports (`localhost:4173`) as live production.
- **Zero Background Task Leaks**: Always terminate temporary server/preview background processes (`manage_task kill`) immediately after use. Confirm `manage_task list` returns 0 running tasks before completing turns.
- **Dynamic Current Date & Open History Defaults**: Date selectors and incident feeds must default to the live ISO date (`new Date()`) with `showAllDates: true` to prevent empty "No records found" feeds.
- **Uniform Admin Permissions & Access**: All admin user accounts (`admin`, `donna`, `greg`, `owner`) must maintain 100% equal, unrestricted Super-Admin privileges with 1-click login shortcuts.
- **Exact File Mapping & Transparent Logos**: Inspect uploaded user files individually to prevent mapping screenshots as logo assets. Logos on white/paper surfaces must use 100% transparent PNGs with zero black box rectangle artifacts.
- **Theme Contrast Asset Inversion Audit**: Every audit MUST verify that logos, icons, and text assets dynamically adjust contrast for their background surface (`brightness(0) invert(1)` on dark/black backgrounds, pure un-inverted dark text on white/light paper surfaces) to prevent "Theme Contrast Asset Mismatch" and "Hardcoded Static Asset Inversion Bug".
- **Mandatory High-Contrast Light Theme & Zero Unreadable Contrast Guardrail**: All modals, onboarding forms, popups, and inputs MUST enforce explicit high-contrast light theme classes (e.g. `bg-white`, `border-slate-300`, `text-slate-900`, `text-slate-700 font-extrabold`) or verified `@theme` variables in `index.css`. NEVER use un-indexed theme tokens (`bg-surface-elevated`) or dark blue/gray text (`text-blue-600`) on dark slate backdrops that yield low contrast ratio (< 4.5:1). Every UI edit MUST be visually verified with a live Puppeteer screenshot before completing turns.
- **Zero-Overlap PDF Layout Engine**: All PDF export templates must enforce multiline text wrapping (`doc.splitTextToSize`), dynamic font scaling for long strings (e.g. invoice numbers), auto-truncation for fixed metadata columns, and multi-column height recalculation.
- **Strict Lint & Zero Undeclared Variables Guardrail**: Never deploy without `npm run build` passing. `no-undef` MUST remain set to `'error'` in `eslint.config.js` and `package.json` MUST enforce `eslint . && vite build` on every build to permanently block undeclared variable runtime crashes.
- **Zero Main-Thread Blocking & INP Guardrail**: All heavy user interaction handlers (PDF/Excel exports, batch email dispatches, canvas markup) MUST yield execution (`setTimeout` / `requestAnimationFrame`) so UI updates paint in `< 16ms`. Search/filter inputs MUST use `useDeferredValue` or debouncing to prevent keypress latency.
- **Mandatory Login Session Role Synchronization Guardrail**: Every authentication handler in `App.jsx` (demo bypass logins, Supabase auth sessions, prototype logins) MUST explicitly synchronize `sessionStorage.setItem('ids_pulse_role', normRole)`, `ids_pulse_username`, `ids_pulse_customer_id`, and `ids_pulse_rep_id` upon sign-in. When logging out or locking session, stale role keys MUST be purged so that `SharedDatabase.js` query helpers (`getEntities`) never evaluate staff or admin accounts (`donna`, `greg`, `colleen`, `shahroz`) under non-admin customer/rep filtering rules.
- **Dynamic Live Rep Deployment Card Status Guardrail**: All deployment and project cards in `WebDashboard.jsx` (`dynamicRepCards`) MUST reactively calculate live deployment badges and inspected piece counts directly from database collections (`shiftReports`, `reworkLogs`). Static fallback strings like `'Inspecting'` or static badge statuses like `'ON-SITE / CLOCKED IN'` when a report has been filed are strictly forbidden. Submitted shift reports (`status: 'Sent'` or `'published'`) MUST update card badges to `REPORT SUBMITTED` and display exact inspected piece counts (`X Pcs (Report Sent)`).
## 4. Mandatory Browser & UI Navigation Layout Verification
- **Verified Visual Navigation**: Whenever providing UI navigation instructions or explaining where buttons/tabs are located, the agent MUST inspect the live DOM / codebase / browser to confirm the exact button labels, tab titles, colors, and layout locations before giving instructions to the user.

## 5. Mandatory Business Logic Rationale for Step-by-Step Instructions
- **Logical Purpose First**: Whenever providing step-by-step testing or operational instructions, the agent MUST explicitly explain the **Logical Reason / Business Purpose** behind why the step is necessary before giving the action items (e.g., *"We start with Step 1 (Project & PO Onboarding) because without creating the client company, plant location, and allocated PO budget first, field quality inspectors will have no active project assignment or PO budget cap to log shift hours against"*).

## 6. Mandatory Permanent IDS Pulse Reporting & Branding Rule
- **Mandatory Reporting Rule Inspection**: Every coding agent MUST read and obey:
  - [.agents/rules/ids-pulse-reporting.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/.agents/rules/ids-pulse-reporting.md)
  - [docs/REPORT_BRANDING_STANDARD.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/REPORT_BRANDING_STANDARD.md)
- **Logo Requirement**: Every human-readable IDS Pulse report and document MUST carry the approved official company logo (`src/config/brandingConfig.js` / `LOGO_BASE64`).
- **Zero Text Truncation**: Ellipsis (`...`) or text clipping is strictly prohibited for report data.
- **Automated Verification**: No report may ship unless automated branding and layout tests (`tests/report_branding_and_layout_gate.test.js`) pass.

## 7. HARD SECURITY RULE: SHAHROZ MIRZA SUPER-ADMIN PROTECTION
- **Sole Super-Admin**: Shahroz Mirza (`shahroz`) is the ONLY unalterable System Super-Admin.
- **Strict Password Lock**: The password for `shahroz` is locked to `Shahroz121$`.
- **Zero Override / Zero Exposure**: No AI agent, automated script, normalization function, or demo fallback may ever touch, change, reset, overwrite, or expose the credentials or access rights of Shahroz Mirza (`shahroz`).

## 8. MANDATORY ROLE DISTINCTION RULE: IDS REP VS CLIENT REP
- **IDS Rep (IDS Field Inspector / Quality Liaison Rep)**: Employees of Integrity Driven Solutions Inc. (IDS) dispatched to assembly plant floors to perform quality inspections, rework, and log shift hours (e.g. `Clarence Kuiken`, `Rep Test Inspector`).
- **Client Rep (Client Contact / Customer Quality Manager)**: Key representatives, quality managers, and overtime approvers employed by the Client Company (e.g. `Magna Powertrain International` -> `Robert Sterling`, `Elena Rostova`; `Stellantis` -> `Mark Vance`, `Sandra Bullock`; `GM` -> `Sarah Jenkins`, `David O'Connor`).
- **Strict Separation & Anti-Recurrence Guardrail**: The agent MUST NEVER mix up or confuse IDS Reps with Client Reps. Admin adds Client Reps as Customer Contacts/Logins for client companies, while IDS Reps are staff members assigned to plant floor projects.
- **Strict Code-Level Filtering Guard**: The `isFieldRep()` helper function and all `ASSIGN FIELD REP` project dropdowns MUST ALWAYS check `if (role === 'customer' || role === 'client' || !!user.customer_id) return false;` first. NEVER filter reps using broad title checks like `title.includes('quality')` without enforcing customer role exclusion. Any PR or modification violating this distinction will fail automated validation tests.

## 10. HARD RULE: MANDATORY AUTOMOTIVE ONBOARDING FIELDS & ZERO HARDCODED DUMMY FALLBACKS
- **Mandatory Automotive Onboarding Fields**: Every project onboarding workflow and atomic client transaction MUST capture and persist:
  1. **Purchase Order (PO Number)** (e.g. `PO-GM-CAMI-2026-88`)
  2. **Suspect Part Number / Component** (e.g. `PN 84920194`)
  3. **Client Contact Phone & Email**
  4. **Dynamic Assembly Plant Location & City** (NEVER hardcode fixed default cities like `'Belleville'`).
  ## 11. HARD CURRENCY RULE: LOCATION-BASED CURRENCY ASSIGNMENT (US = USD, CANADA = CAD)
- **Customer Currency Rule**: If a Customer, Client Company, or Assembly Plant is located in the **United States (US)** (e.g. Michigan, Ohio, Texas, Detroit, Chicago), all billing rates, invoices, and transactions MUST evaluate in **`USD`**. If located in **Canada** (e.g. Ontario, Oakville, Windsor, Brampton, Oshawa), all billing rates, invoices, and transactions MUST evaluate in **`CAD`**.
- **IDS Field Rep Pay Currency Rule**: If an IDS Field Rep is based in or assigned to the **United States (US)** (e.g. Hugo Ramos, Nabil, Rogelio), their pay currency MUST evaluate in **`USD`**. If based in or assigned to **Canada** (e.g. Clarence Kuiken), their pay currency MUST evaluate in **`CAD`**.
- **Zero Fallback Ambiguity**: Defaulting US clients to CAD or Canadian clients to USD is strictly forbidden. `getCustomerCurrency()` and `getRepSupplierRates()` MUST resolve currency dynamically based on plant/customer location.




