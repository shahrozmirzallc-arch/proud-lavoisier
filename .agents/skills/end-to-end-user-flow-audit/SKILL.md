---
name: end-to-end-user-flow-audit
description: Rigorously verifies multi-role user flows across Reps, Admins, and Client Portals in IDS Pulse platform, preventing silent data pipeline breaks, key mismatches, and untruthful status badges.
---

# End-to-End User Flow Audit Skill (IDS Pulse)

Use this skill whenever building, modifying, or debugging multi-role user interactions (e.g., Field Rep shift reports, incident releases, overtime approvals, client portal feeds) in **IDS Pulse**.

---

## 🎯 Core Objectives
1. **Zero Silent Disconnects**: Never assume a saved record in one role is visible to another. Always trace the full pipe from origin to recipient.
2. **Canonical Key Enforcement**: Verify `supplier_id`, `customer_id`, `client_id`, `plant_id`, and `released_to_client` match seamlessly across data layer (`SharedDatabase.js`) and UI layers (`WebDashboard.jsx`, `PhoneSimulator.jsx`).
3. **Truthful Status Lifecycle**:
   - Rep Submit $\rightarrow$ `status: 'Submitted'` (Badge: **"Submitted (Pending IDS Review)"**)
   - Admin Publish $\rightarrow$ `status: 'published'` (Badge: **"Published to Client"**)
   - Client Portal $\rightarrow$ Query `status: 'published'` AND matching `supplier_id`.

---

## 📋 Standard Audit Checklist

Whenever modifying user workflows:

### 1. Data Schema & Key Resolution
- [ ] Does the entity carry `supplier_id`?
- [ ] If `supplier_id` is omitted during creation, does `saveEntity` or the creator component resolve it dynamically from project/assignment records?
- [ ] Are legacy fallback getters (`customer_id`, `client_id`) supported in `SharedDatabase.js` filtering?

### 2. Multi-Role Data Filtering
- [ ] Does `getEntities()` filter correctly for `role === 'customer'`?
- [ ] Does the UI component (`WebDashboard.jsx`) apply matching filters to what `getEntities()` returns?
- [ ] Are atomic release flags (`released_to_client: true`) set simultaneously with status changes (`status: 'Released'`)?

### 3. Session & Auth Survival
- [ ] Does user login persist in `localStorage.getItem('ids_pulse_saved_user')`?
- [ ] Does reloading the page retain active login session and role state?

### 4. Evidence & Notes Capture
- [ ] Do area walks capture both `spoke_with` and `notes`?
- [ ] Are floor conversation notes rendered in email logs, PDF exports, and detail view modals?

---

## 🧪 Mandatory Verification Workflow

Run a node verification script simulating the exact end-to-end round trip:

```javascript
import { initializeDB, getEntities, saveEntity } from './src/components/SharedDatabase.js';

// 1. Rep creates & submits record
const record = saveEntity('shiftReports', { rep_id: 'rep_clarence', plant_id: 'plant_oakville', status: 'Submitted' });
assert(record.supplier_id === 'sup_magna', "supplier_id must be stamped!");

// 2. Admin publishes record
record.status = 'published';
saveEntity('shiftReports', record);

// 3. Client queries records
global.sessionStorage = { getItem: (k) => k === 'ids_pulse_role' ? 'customer' : k === 'ids_pulse_customer_id' ? 'sup_magna' : null };
const clientReports = getEntities('shiftReports');
assert(clientReports.some(r => r.id === record.id), "Client must see published record!");
```
