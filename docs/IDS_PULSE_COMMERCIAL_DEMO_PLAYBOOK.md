# IDS PULSE — Commercial Sales & Demo Playbook
**Product:** IDS Pulse Platform  
**Company:** Integrity Driven Solutions Inc. (IDS)  
**Target Audience:** Tier-1 Quality Directors, Plant Operations Managers, OEM Supplier Quality Engineers (SQEs), Quality Liaison Agency Buyers  
**Live Production Suite:** [https://proud-lavoisier.vercel.app](https://proud-lavoisier.vercel.app)  

---

## Executive Positioning Statement
> *"IDS Pulse is the modern, real-time automotive quality containment and field inspection operating platform. It bridges the critical 24-to-48-hour reporting gap between plant floor field inspectors and client executive quality managers, preventing line-stoppage penalties ($50k/min) and eliminating unbilled PO budget leakage."*

---

## The 3-Minute Master Pitch & Live Demo Script

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           3-MINUTE MASTER SALES DEMO                              │
├─────────────────────────┬─────────────────────────┬───────────────────────────────┤
│ MINUTE 1: SETUP         │ MINUTE 2: FIELD CAPTURE │ MINUTE 3: CLIENT PORTAL       │
│ Super-Admin dispatches  │ Inspector clocks in,    │ QA releases lot, Client views │
│ PO budget cap & rates   │ scans QR & marks defect │ Pareto charts & signs off OT  │
└─────────────────────────┴─────────────────────────┴───────────────────────────────┘
```

### Minute 1: The Onboarding & PO Budget Control (HQ Command Center)
1. **Action:** Open [https://proud-lavoisier.vercel.app](https://proud-lavoisier.vercel.app) and click **"Demo Super-Admin (`admin`)"**.
2. **What to Say:**  
   *"Everything starts in the Command Center. Unlike traditional setups where projects are tracked on disconnected spreadsheets, an Operations Lead registers the Client Company (e.g. Magna Powertrain), assigns the assembly plant (GM Oshawa), locks the Purchase Order budget cap (e.g. 500 hours), and sets the CAD/USD billing rate in under 30 seconds."*
3. **Key Visual to Show:**
   * The **Master Operations Matrix** showing live multi-plant containment feeds across Ontario and US facilities.
   * The **PO Budget Burn Meter** with real-time percentage consumption.

---

### Minute 2: Plant Floor Mobile Field Inspection (Field Inspector Client)
1. **Action:** Switch to the Mobile View / Phone Simulator. Click **"Demo Field Rep (`clarence`)"**.
2. **What to Say:**  
   *"Now let's step onto the assembly plant floor with our Field Inspector, Clarence. In high-pressure plant environments, inspectors don't have time for complex forms."*
3. **Key Actions to Demonstrate:**
   * **1-Tap GPS Clock-In:** Show the live running shift timer.
   * **Container Barcode Scanner:** Tap the camera scanner to read container lot labels instantly.
   * **Interactive Photo Defect Canvas:** Capture or select a defective component photo, then use the drawing tools to draw a **red callout arrow and defect circle** directly on the part.
   * **4-Step Defect Wizard:** Log 120 inspected pieces, 3 rework units, and 1 containment hold.
   * **Offline Resilience:** *"Even if the inspector is deep inside a steel stamping plant with zero cellular reception, our local IndexedDB outbox queue guarantees zero data loss and silently syncs the moment connection restores."*

---

### Minute 3: QA Publishing Gate & Client Executive Portal (The "Aha!" Moment)
1. **Action:** Log back in as **"Demo QA Director (`donna`)"**, audit the draft shift report, and click **"Publish to Client Portal"**.
2. **Action:** Switch login to **"Demo Client Quality Manager (`robert` @ Magna)"**.
3. **What to Say:**  
   *"This is where the magic happens. Previously, Magna's Quality Director would wait 24 to 48 hours for a PDF or paper report. With IDS Pulse, the second Donna approves the shift report at HQ, Robert's Client Portal lights up instantly with:"*
   * **Live Certified Clean Lot Feed:** Green badges indicating inspected lots ready for the assembly line.
   * **Defect PPM Pareto Charts:** Real-time root-cause non-conformance trends.
   * **Overtime Authorization Drawer:** Robert can authorize or decline field inspector overtime with a single click, automatically locking approved hours into the billing ledger.
   * **Instant Pixel-Perfect PDF Export:** Download the official branded PDF Quality Containment Summary in < 2 seconds.

---

## Objection Handling & Executive FAQs

### Objection 1: "Our assembly plants have terrible cell service and dead-zones."
* **Response:** *"IDS Pulse was built specifically for automotive manufacturing plants. It features a durable, offline-first IndexedDB outbox queue. Field inspectors can clock in, scan barcodes, and markup defect photos completely offline. As soon as the device reconnects to Wi-Fi or LTE, the background worker synchronizes the data with zero user intervention and zero data loss."*

### Objection 2: "Can our Tier-1 clients see our internal inspector pay rates or other clients' data?"
* **Response:** *"Absolutely not. IDS Pulse enforces strict 4-tier Role-Based Access Control (RBAC) and Row-Level Security (RLS). Client Quality Managers have isolated, read-only portal accounts scoped strictly to their own supplier and plant IDs. Internal pay rates, profit margins, and other client projects are completely invisible to them."*

### Objection 3: "We operate across both Canada (CAD) and the United States (USD)."
* **Response:** *"The platform features an authoritative, location-aware currency and rate engine. If a project is onboarded in Detroit or Ohio, it automatically calculates and invoices in USD. If in Oshawa or Windsor, it evaluates in CAD. Billing and pay rates are resolved dynamically using contract-level fallback logic."*

---

## Commercial Licensing & Packaging Tiers

| Tier | Target Customer | Pricing Model | Key Inclusions |
| :--- | :--- | :--- | :--- |
| **Tier A: Agency SaaS License** | 3rd-Party Quality Liaison & Inspection Firms | **\$2,500 – \$4,500 / month** | Full Web Hub, Unlimited Field Mobile App Seats, Client Executive Portal, Automated PDF Engine |
| **Tier B: Plant Enterprise License** | Tier-1 Supplier (Magna, Linamar, Martinrea) | **\$45,000 – \$85,000 / year** | Dedicated Cloud Instance, Custom Domain, Active Directory SSO, Dedicated Support SLA |
| **Tier C: Full Source-Code Buyout** | Enterprise OEM / Strategic Acquirer | **\$120,000 – \$250,000** | 100% Proprietary IP Transfer, Full Source Repository, Database Schemas, Deployment Playbooks |

---
*Authored by Integrity Driven Solutions Inc. (IDS) Core Architecture Team.*
