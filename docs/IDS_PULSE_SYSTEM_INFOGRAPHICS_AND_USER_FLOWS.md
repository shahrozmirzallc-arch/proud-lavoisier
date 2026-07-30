# IDS Pulse — System Architecture & User Flow Diagrams
**Integrity Driven Solutions Inc. (IDS)**

---

## 📍 Local HTML Infographic File
A fully interactive, styled HTML version of these diagrams is available locally at:
👉 [`docs/IDS_PULSE_SYSTEM_INFOGRAPHICS_AND_USER_FLOWS.html`](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/IDS_PULSE_SYSTEM_INFOGRAPHICS_AND_USER_FLOWS.html)

---

## 🏛️ 1. High-Level System Architecture

```mermaid
graph TD
  subgraph CLIENT_LAYER ["📱 Client Layer"]
    REP["📱 Field Quality Inspector (Mobile App)"]
    ADMIN["💻 Operations Lead Supervisor (Donna)"]
    ACCT["📊 Financial Accountant (Colleen)"]
    CUST["🏭 Supplier Quality Director (Customer Portal)"]
  end

  subgraph APP_CORE ["🚀 Application Core"]
    PS["PhoneSimulator.jsx<br/>(Shift Clock, Barcode Scan, Media Evidence)"]
    WD["WebDashboard.jsx<br/>(Live Command Center, Defect Feed, PO Telemetry)"]
    TSS["IntegrityWeeklyTimesheet.jsx<br/>(Rate Calculation & Billable Hours)"]
    INV["InvoiceModal.jsx<br/>(PDF Export & Client Invoicing)"]
  end

  subgraph STORAGE_SYNC ["💾 Data & Resilience Layer"]
    SDB["SharedDatabase.js<br/>(LocalStorage DB & Event Bus)"]
    NSS["nativeStorageService.js<br/>(Durable Offline Outbox)"]
    SB["☁️ Supabase Cloud DB<br/>(PostgreSQL Realtime Storage)"]
  end

  REP --> PS
  ADMIN --> WD
  ACCT --> TSS
  ACCT --> INV
  CUST --> WD

  PS --> SDB
  PS --> NSS
  WD --> SDB
  TSS --> SDB

  NSS -->|Auto Flush on Reconnect| SB
  SDB <-->|Bi-Directional Sync| SB
```

---

## 📱 2. Field Quality Inspector (Rep) Shift & Incident User Flow

```mermaid
flowchart LR
  A[🔒 Log In] --> B[⏱️ Clock In to Plant Shift]
  B --> C{Action Needed?}
  C -->|Defect Discovered| D[⚠️ Tap New Suspect Material]
  C -->|Rework Sorting| E[⏱️ Log Rework Hours]
  C -->|Travel/Meals| F[🧾 Log Expenses]
  C -->|End of Shift| G[📋 Submit Shift Summary & Clock Out]

  D --> D1[📷 Scan Part Barcode & Bin QR]
  D1 --> D2[📝 Enter Description & Location]
  D2 --> D3[📸 Capture 3+ Photos, Video & Voice]
  D3 --> D4{Network Online?}
  D4 -->|Yes| D5[🚀 Save Incident & Send Email Log]
  D4 -->|No| D6[📦 Queue in Durable Outbox]
```

### Steps Summary:
1. **Shift Onboarding**: Select plant (e.g. AutoKabel Windsor) and tap **CLOCK IN TO SHIFT**.
2. **Scan & Defect Log**: Scan part barcode and bin QR. Description & area discovery.
3. **Evidence Capture**: 3+ photos (Wide, Medium, Closeup), 15s MP4 video walkthrough, and voice note audio.
4. **Immediate Alert**: Tap **RELEASE INCIDENT REPORT**.
5. **Rework & Clock Out**: Log sorted pcs & rework hours, submit shift summary & clock out.

---

## 💻 3. Operations Lead Supervisor (Donna) Flow

```mermaid
flowchart TD
  A[🖥️ Open Web Dashboard] --> B[📡 Live Command Center]
  B --> C[🚨 Active Quality Alerts]
  B --> D[📊 Live PO Budget Telemetry]
  B --> E[👥 Rep Directory & Dispatches]

  C --> C1[👁️ Open Incident Inspector]
  C1 --> C2[📸 Review 10 Photo Angles]
  C1 --> C3[🔊 Play Voice Memo Audio]
  C1 --> C4[🎥 Watch 15s Video Walkthrough]
  C1 --> C5{Decision}
  C5 -->|Approved| C6[📄 Download/Print Official PDF]
  C5 -->|Reject| C7[↩️ Return to Rep with Reason]
```

---

## 📊 4. Financial Accountant (Colleen) Invoicing & Rates Flow

```mermaid
sequenceDiagram
  autonumber
  actor Rep as Field Rep
  actor Colleen as Colleen (Accountant)
  participant DB as Shared Database
  actor Client as AutoKabel / Client

  Rep->>DB: Log Shift Hours & Rework Pcs
  Colleen->>DB: Open Invoicing Control & Timesheets
  DB-->>Colleen: Load Uninvoiced Time Entries (e.g. 8.0 hrs @ C$45/hr)
  Colleen->>Colleen: Select Client Company (AutoKabel Systems)
  Colleen->>Colleen: Review Billable Subtotal & HST (13%)
  Colleen->>DB: Click Generate Official PDF Invoice
  DB-->>Colleen: Output Branded PDF Invoice (IDS Logo, Zero Truncation)
  Colleen->>Client: Send Invoice & PO Telemetry Report
```

---

## ⚡ 5. Offline Resiliency & Data Sync Pipeline

```mermaid
flowchart TD
  A[📱 Rep Submits Incident/Report] --> B{Network Connected?}
  B -->|Online| C[☁️ Direct Upsert to Supabase DB]
  C --> D[✉️ Generate System Email Log]
  
  B -->|Offline| E[📦 nativeStorageService.stageIncidentLocally]
  E --> F[🆔 Generate Tracking Ref: LOCAL-INC-2026-XXXX]
  F --> G[💾 Store in localStorage Queue: ids_pulse_offline_queue]
  G --> H[🔔 Show Offline Confirmation Modal to Rep]

  H --> I[📡 Device Reconnects to Internet]
  I --> J[⚡ Trigger window.addEventListener('online')]
  J --> K[🔄 Execute flushOfflineQueue()]
  K --> L[☁️ Batch Upsert Queue to Supabase DB]
  L --> M[✅ Remove Synced Items from Local Outbox]
```

---

### Document Details
- **Platform**: IDS Pulse Quality & Operations Suite
- **Author**: Integrity Driven Solutions Inc.
- **Local File Path**: `docs/IDS_PULSE_SYSTEM_INFOGRAPHICS_AND_USER_FLOWS.md`
