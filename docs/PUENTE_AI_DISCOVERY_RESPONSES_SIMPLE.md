# PUENTE AI Discovery Call - Simple Answers

Prepared from a current codebase review of IDS Pulse.
Some items are marked "not fully verified" where the repo shows the pattern but not the business fact itself.

## A. Architecture & Tech Stack

1. The app is React 19 + Vite 8 + Tailwind 4, with Capacitor 8 for native Android packaging and Supabase/PostgreSQL for backend data.
2. It is split into a web dashboard, a mobile/phone flow, and a shared backend/data layer.
3. The code shows in-house maintenance and active development; the original builder is not proven from code alone.
4. Yes, there is a real service layer. The app uses `SharedDatabase.js` plus Supabase RPCs and client APIs rather than raw direct UI access.
5. Releases are build-script driven and Vercel-backed. A full formal CI/CD pipeline is suggested by the repo, but not fully proven from the files I checked.
6. Yes, there is a lot of technical documentation in `docs/` and `.agents/rules/`.

## B. Data & Data Model

7. Main entities include suppliers, plants, projects, parts, incidents/quality alerts, rework logs, time entries, expense entries, shift reports, and users.
8. Data is captured through the mobile app flow: clock-in/out, barcode/QR scanning, photo markup, guided inspection/rework, hours, and expenses.
9. Exact production volume is not proven in code. The system is clearly built for ongoing multi-plant daily use.
10. The design is intended to be standardized across sites through a shared schema and shared data layer.
11. Yes, the Supabase PostgreSQL database is the intended source of truth.
12. The data looks structured enough for analytics, but a formal data-quality audit would still be needed before claiming it is fully AI-ready.

## C. Reporting & Analytics Gaps

13. A manager gets a report when the field user submits data, the system syncs it, and the web dashboard/client portal surfaces it for review and publishing.
14. The code does not prove request frequency. The obvious common outputs are daily quality reports, hours, overtime, expense, and exportable summaries.
15. The main blind spots are containment status, defect trends, budget burn, overtime approvals, and cross-plant visibility.
16. Both are needed: live dashboards for operations and daily/weekly reporting for management.
17. Cross-facility rollups are present in the dashboard layer.
18. Good analytics would be defect trends, Pareto charts, supplier/facility scorecards, budget burn, overtime, and clean-lot traceability.

## D. Integrations & Dependencies

19. Current visible integrations include camera scanning, photo capture/markup, email dispatch, PDF generation, Excel/CSV export, and Supabase realtime/backend access.
20. The core external dependencies are Supabase and Vercel. I did not find proof of a hard dependency on an OEM ERP portal in the checked files.
21. Authentication is Supabase Auth-based, with session and role state managed in the app.
22. It is meant to work on normal camera-capable devices, with Android native packaging through Capacitor.

## E. Users, Roles & Workflow

23. Main roles shown in code are super_admin, owner, lead, accountant, rep, and customer/client.
24. A field inspector logs in, opens an assignment, scans labels, captures photos, logs rework/hours/expenses, and submits the report.
25. Different roles have different tabs and access levels. The customer view is narrower and read-only compared with internal roles.
26. Yes, the code includes a customer-facing/client executive portal view.

## F. Infrastructure, Security & Compliance

27. The platform is designed around automotive traceability and quality requirements, but formal certification should be confirmed separately.
28. It is hosted on Vercel with Supabase as backend infrastructure. Exact residency guarantees should be confirmed with the owner.
29. The code shows security patterns like Supabase Auth, role checks, and RLS-oriented backend access, but I did not see a formal third-party security report in the files I checked.
30. Backup and disaster recovery are not clearly documented in the app code snapshot.
31. I did not see evidence of a live SSO implementation in the checked files.

## G. Team, Ownership & Constraints

32. The repo looks internally maintained, but actual bandwidth should be confirmed with the owner.
33. Layering AI/analytics onto the current platform looks more practical than a full replatform.
34. I did not find obvious licensing blockers in the repo snapshot.
35. The urgency appears to come from live containment, traceability, client reporting, and approval workflows.

## H. AI-Readiness

36. Yes. Defect photos are structured with metadata and canvas markup that could support computer vision.
37. Yes. There are free-text narratives, notes, and logs that could support summarization/NLP.
38. Yes. The system already has automation for sync, reporting, exports, and role-scoped checks.
39. The natural governance model is human-in-the-loop review with audit logging before publishing.

## I. North Star Alignment

40. The strongest capabilities are mobile inspection capture, barcode/QR scanning, quality alerts, cross-facility analytics, containment/sorting workflow, and overtime/expense tracking.
41. Both internal and external views exist.
42. Barcode/serial scanning is already supported in-app through camera-based flows.
43. Formal approval is critical. The app already has review/publish and overtime-authorization style workflows.

