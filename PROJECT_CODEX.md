# IDS Pulse Operations Suite — Project Codex

This Project Codex serves as the single source of truth for the architecture, file systems, data schemas, and role configurations of the **IDS Pulse Operations Suite**. 

---

## 📂 1. Directory Structure

The core files of this React + Vite + Tailwind CSS application are located as follows:

```text
proud-lavoisier/
├── index.html                  # Main entry page & Google Fonts linking
├── package.json                # Dependencies (@types/react, jspdf, exceljs, lucide-react)
├── vite.config.js              # Vite React plugin setup
├── src/
│   ├── main.jsx                # React DOM render entry point
│   ├── index.css               # CSS styling variables, font setups, and Day/Night color tokens
│   ├── App.jsx                 # Security Gateway, Layout Switcher, and Theme Controller
│   └── components/
│       ├── SharedDatabase.js   # Client-side database, localStorage sync, and custom event listeners
│       ├── PhoneSimulator.jsx  # Mobile App Simulator (Field rep on-demand time & incident logging)
│       └── WebDashboard.jsx    # Enterprise Portal (Metrics, Defect Matrix, Excel/PDF exports, scoped Pulse AI)
```

---

## 🔑 2. Authentication Gate & Role Permissions

Role-based access is validated at the secure login gateway inside `src/App.jsx`. The passcodes are case and space-insensitive (e.g. `s hahroz` matches `shahroz`).

### Role Configuration Matrix
| Passcode | Role Identifier | Visible Dashboard Tabs | Pulse AI Audit capabilities | Launch Roadmap |
| :--- | :--- | :--- | :--- | :--- |
| **`shahroz`** | Owner (Shahroz Mirza) | All Tabs | Unrestricted (Audits All Data) | **Visible** (Auto-unlocked) |
| **`idspulse`**| Admin (Greg Phillippe) | All Tabs (except Roadmap) | Unrestricted (Audits All Data) | Hidden / Inaccessible |
| **`colleen`** | Accountant (Colleen) | Timesheets & Mileage, Pulse AI | Audits Financials & Receipts only | Hidden / Inaccessible |
| **`donna`**   | Quality Lead (Donna) | Operations Tabs, Pulse AI | Audits Defects & Duplicates only | Hidden / Inaccessible |

---

## 💾 3. Shared Database Schema (`SharedDatabase.js`)

Uses `localStorage` under key `ids_pulse_db` to persist state across reloads. 
* **State Synchronization:** Any write operation updates local storage and dispatches a custom window event:
  `window.dispatchEvent(new Event('ids_pulse_db_update'))`
* **Core Schemas:**
  1. `suppliers`: Array of active suppliers (e.g. Magna, Hutchinson).
  2. `plants`: Active plant listings (e.g. GM Oshawa, Ford Oakville).
  3. `parts`: Automotive assembly parts numbers (e.g. 86286761).
  4. `incidents`: Quality defects (coordinates, part, area, description, supplier_contact, plant, rep).
  5. `reworkLogs`: Pieces reworked, inspected OK/NOK counts, dates, and inspector notes.
  6. `timeEntries`: Clocked hours, mileage tracker records, and invoice calculations.
  7. `expenseEntries`: Travel and meal claims, amounts, and uploaded receipt photo strings.
  8. `higgsfieldGuides`: Synthesized AI repair-guide metadata (incident_id, part_number, plant, style, length_sec, audio, prompt, defect coordinates, created_at). Added by R019.

---

## 📱 4. Mobile Simulator Components (`PhoneSimulator.jsx`)

Provides field representatives with an on-demand dispatcher tool:
* **Incident Logger (Suspect Material):**
  * Barcode scanner simulation.
  * Photographic Canvas drawing module: allows clicking on a car part graphic to draw a red indicator dot, saving precise coordinates.
* **On-Demand Rework Tracker:** Sheets to log hours, pieces inspected, OK/NOK outcomes per part.
* **Expense Claims:** Form to input amounts, categorize claims (Fuel, Meals), and capture receipts.
* **Flexible Clocking:** Remove rigid shift-locks to support 24/7 on-call logging. Reps can view submitted files and request **Revisions** to logs.

---

## 📊 5. Web CRM Dashboard Components (`WebDashboard.jsx`)

An enterprise data visualizer and exporter:
* **Visual Defect Matrix:** Plots coordinate markers onto an SVG CAD part drawing. Hovering displays a tooltip indicating the Reporting Plant, Rep, and Timestamp. Selecting a part queries all plant records globally.
* **Accountant Ledger:** Dynamic metrics cards (Hours, Mileage, Expenses, Grand Invoices with double-underlines). Clickable lightbox viewer to verify receipt photos.
* **Reporting Engines:**
  * **QuickBooks CSV:** Structured CSV containing corporate billing headers.
  * **Excel Ledger (`exceljs`):** Styled spreadsheet with accounting borders, auto-adjusted columns, and dynamic sum formulas.
  * **PDF/Print Engine (`jspdf`):** Export layouts with rotated watermark text and white-branded company logo card structures.

---

## 🤖 6. Role-Scoped Pulse AI Copilot

Integrated chat assistant and automated database checker:
* **Welcome Messages:** Customized to the user's role on load.
* **Audit Scopes:**
  * Accountant (`colleen`): Flags shifts > 16 hrs, negative logs, and high expenses without receipts.
  * Quality Lead (`donna`): Flags missing supplier QM contacts and short narratives, and detects potential duplicate incidents using Jaccard Similarity.
* **Security Controls (Access Denied blocks):**
  * Donna is denied export access to financial Excel/QuickBooks ledgers.
  * Colleen is denied access to quality defect PDF audits.

---

## 🚀 7. Design aesthetics & Themes (`src/index.css`)

* **Day & Night Switcher:** Toggle control switches background from Slate-50 light (Day) to slate-950 dark (Night).
* **CSS Custom Variables:** Theme colors are bound to selectors (`.theme-royal-blue`, `.theme-neon-violet`, `.theme-emerald-green`, `.theme-ruby-red`) specifying background casts, accents, card transparencies, and glassmorphism levels.
* **Aesthetics:** Glow effects (`glow-pulse`), slide-in drawers, and dynamic hover border highlights.
