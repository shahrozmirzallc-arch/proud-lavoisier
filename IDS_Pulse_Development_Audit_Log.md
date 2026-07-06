# IDS Pulse — System Development Audit & Revision Log Book

This log book contains the comprehensive timeline of development accomplishments, architectural adjustments, and terminology alignment revisions implemented for the **IDS Pulse Operations Suite** from Day 1 to present (July 6, 2026).

---

## 🎯 Project Identity & Core Objectives
**IDS Pulse** is a mobile-first, multi-role quality auditing and incident reporting platform built for **Integrity Driven Solutions Inc. (IDS)**. It replaces an outdated manual reporting system for 80+ quality representatives deployed at tier-1 automotive supplier plants (Magna, Hutchinson, Brose) serving major automotive OEMs (GM, Stellantis, Ford, Tesla).

---

## 📅 Timeline of Revisions & Event Logs

### June 03, 2026 — Expense & Receipt Upload (REV-01)
* **What occurred**: Added expense reporting capability for field reps.
* **Why it was done**: Field representatives incurred travel, tool, and lunch expenses that required accountant reimbursement. Previously, receipt tracking was handled via text messages.
* **Action taken**: Integrated an **Expense Claims & Receipt photo upload** simulator inside the representative's mobile app, allowing reps to photograph receipts, input amounts, and select categories. Donna or Colleen can review and approve/reject claims, updating grand billing totals in real time.

### June 12, 2026 — Theme Customizer & Layout Modes (REV-02)
* **What occurred**: Added layout segment selectors and color palettes.
* **Why it was done**: Greg (Owner) requested a visual utility to present the system in client pitches showing different themes (e.g. industrial vs executive styles) and the ability to isolate the smartphone simulator for mobile-only presentations.
* **Action taken**: Implemented a **4-Palette Theme Customizer** (Royal Blue, Neon Violet, Emerald Green, Ruby Red) and viewport layout selectors (Mobile App Only, Web Dashboard Only, or Side-by-Side Laptop View) in the header.

### June 17, 2026 — Launch Roadmap & Budget Estimator (REV-03)
* **What occurred**: Built the 36-Week Launch Roadmap view.
* **Why it was done**: Greg needed a tool to present the business case, release milestones, and onshore/offshore budgeting models to potential OEM clients.
* **Action taken**: Designed a dedicated **Launch Roadmap** timeline tab outlining Phase 1 (Core Prototype), Phase 2 (Field Pilot), and Phase 3 (Global Rollout) along with sliding sliders to estimate staffing costs and project ROI.

### June 20, 2026 — Passcode Gate Integration (REV-04)
* **What occurred**: Added a system passcode lock.
* **Why it was done**: To satisfy compliance and ensure security, all prototype features needed to be locked behind a master gate before access was granted to third parties.
* **Action taken**: Integrated an onboarding security lock requiring the master credential passcode (`Shahroz123$`) to open the app.

### June 22, 2026 — Terminology Alignment: "Defect Matrix" (REV-05)
* **What occurred**: Renamed the visual heatmap.
* **Why it was done**: Donna (Quality Lead) noted that "heatmap" sounded too generic. Supplier representatives prefer the industry-standard term **"Defect Matrix"** for auditing.
* **Action taken**: Renamed all headers, navigation buttons, and tooltips referring to the heatmap to **"Defect Matrix"**.

### June 23, 2026 — Cross-Plant Auditing Tooltips (REV-06)
* **What occurred**: Upgraded tooltips on the Defect Matrix grid.
* **Why it was done**: Quality audits require immediate lookup of which representative reported a defect at which assembly location.
* **Action taken**: Programmed tooltips to display **Reporting Plant Location** and the name of the **Field Representative** when hovering over any cell.

### June 24, 2026 — Roadmap Security Enforcement (REV-07)
* **What occurred**: Locked the entire Launch Roadmap.
* **Why it was done**: Greg noted that the roadmap outlined competitive budgeting metrics that should not be visible to general reps or clients.
* **Action taken**: Placed the passcode gate lock over the entire Roadmap tab, requiring the owner passcode to unlock it.

### June 24, 2026 — Security Tab Removal (REV-08)
* **What occurred**: Removed the "Security Center" tab.
* **Why it was done**: The client wanted to simplify the menu and focus on functional operational tabs.
* **Action taken**: Deleted the security settings tab from the sidebar.

### June 24, 2026 — Role-Based Access Control (REV-09)
* **What occurred**: Implemented user authentication sessions.
* **Why it was done**: To show customized workspaces for Colleen (Accountant), Donna (Quality Lead), and Clarence (Field Rep).
* **Action taken**: Configured custom role profiles (`colleen`, `donna`, `idspulse`) allowing managers to log in and access different workspaces.

### June 24, 2026 — Owner Passcode Lockdown (REV-10)
* **What occurred**: Restricted roadmap visibility.
* **Why it was done**: Greg wanted budget figures accessible strictly via the owner session passcode **`shahroz`**.
* **Action taken**: Restricted the roadmap view to users logging in under `shahroz` session credentials.

### June 24, 2026 — AI Capabilities Role-Filtering (REV-11)
* **What occurred**: Role-filtered AI diagnostics.
* **Why it was done**: Donna should not view raw financial invoices, and Colleen has no operational need to audit plant floor quality logs.
* **Action taken**: Restricted AI prompt logs to hide financial calculations from Donna and exclude incident reports from Colleen.

### June 29, 2026 — Default Day/Light Theme (REV-12)
* **What occurred**: Reset the default workspace background.
* **Why it was done**: Representatives noted that high-contrast light backgrounds are easier to read on outdoor tablets in bright sunlight.
* **Action taken**: Adjusted the default startup theme to Day Mode (light background), while retaining the night mode toggle for dark office environments.

### July 02, 2026 — Terminology Standardization (REV-14)
* **What occurred**: Standardized scrap and repair terms.
* **Why it was done**: Clarified terminology to match standard operating procedures:
  - "Inspect Scrap Table" $\rightarrow$ **"Review Scrap Table"**
  - "Defect Alert" $\rightarrow$ **"Suspect Material"**
  - "Repair Parts" $\rightarrow$ **"Rework Parts"**
* **Action taken**: Patched all labels, checkboxes, and database tables in `WebDashboard.jsx` and `PhoneSimulator.jsx`.

### July 03, 2026 — Shift-Free Incident Logging & Revisions (REV-16, REV-18)
* **What occurred**: Removed clock-in block and enabled log revisions.
* **Why it was done**: Workers on 24/7 on-call dispatch need to submit suspect material logs immediately without first opening an active shift. Reps also need to edit mistake logs.
* **Action taken**: Bypassed shift controls on the mobile simulator and built an **Incident Revisions Request** screen inside the mobile app to request edits.

### July 04, 2026 — Weekly Manager Bulk Entry (REV-17)
* **What occurred**: Developed the bulk entry subtab.
* **Why it was done**: Managers needed to backdate hours/mileage for multiple field reps in one form at weekend close.
* **Action taken**: Added a **Weekly Manager Bulk Entry Portal** under Colleen's workspace tab.

### July 04, 2026 — Google Stitch Projects Registry (REV-19)
* **What occurred**: Connected database to project rates.
* **Why it was done**: Rates differ per project/plant. Standardized system defaults needed overrides based on project client assignments.
* **Action taken**: Seeded Magna (CAD), Tesla (USD), and Ford (USD) projects, and integrated the dynamic rate resolver matching records in `SharedDatabase.js`.

### July 05, 2026 — Option E Login Gateway (REV-20)
* **What occurred**: Replaced login screen with the Option E "Tesla EV" design.
* **Why it was done**: The client selected the clean light-mode titanium look featuring both User Identity/Email and password inputs.
* **Action taken**: Implemented Option E inside `App.jsx` as the primary login screen.

### July 06, 2026 — Invoicing Currency Separation (REV-21)
* **What occurred**: Configured currency separation.
* **Why it was done**: Monica reported that some suppliers (e.g. Mechatronics) are invoiced in both CAD and USD. Separate statements are required per currency.
* **Action taken**:
  - Added a **Billing Currency** filter (CAD, USD, All) to Colleen's Invoicing tab.
  - Selecting CAD or USD updates all subtotals with the correct currency prefix (`C$` or `US$`).
  - Selecting "All Currencies" shows both totals side-by-side (e.g. `C$ 200 & US$ 300`).
  - Added safety checks blocking QuickBooks export or PDF compile under "All Currencies" mode, prompting the accountant to print separate statements per currency.

### July 06, 2026 — Representative Onboarding Pay Currency & Full-Screen Layout (REV-22, REV-23)
* **What occurred**: Onboarded representative payout currencies and expanded the layout width.
* **Why it was done**: Rep pay currency is fixed (Rule 2) regardless of project currency (e.g. Canadian reps always paid in CAD, US reps in USD). The centered dashboard also wasted screen space.
* **Action taken**:
  - Added a **Payment Currency** dropdown to the representative onboarding form.
  - Added a **Pay Currency** column to the representatives table.
  - Configured custom matrix formatting to display billing rates in project currency and pay rates in rep currency.
  - Expanded the width of `App.jsx` layouts to 100% full screen.
