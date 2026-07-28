# IDS Pulse — Master Report Inventory & Migration Registry

**Integrity Driven Solutions Inc. (IDS)**  
**Version:** `v3.0.0`  
**Last Updated:** July 28, 2026  

---

## Complete Report Inventory

| # | Report Name | Source File / Function | Primary Data Source | Output Format | Approved Logo Status | Orientation | Migration Status | Test Status |
|---|---|---|---|---|---|---|---|---|
| 1 | **IDS Rework Audit Feed** | `WebDashboard.jsx` (`handleDownloadReworkFeedReport`) | Rework Log DB | PDF / Print | ✅ Approved Logo (`LOGO_BASE64`) | Landscape | **MIGRATED** | **PASS** |
| 2 | **Shift Audit Log Report** | `WebDashboard.jsx` (`handlePrintShiftReport`) | Shift Incident DB | PDF / Print | ✅ Approved Logo (`LOGO_BASE64`) | Landscape | **MIGRATED** | **PASS** |
| 3 | **Supplier Directory Report** | `WebDashboard.jsx` (`handlePrintSupplierDirectoryReport`) | Supplier DB | PDF / Print | ✅ Approved Logo (`LOGO_BASE64`) | Portrait | **MIGRATED** | **PASS** |
| 4 | **Incident Master Audit** | `WebDashboard.jsx` (`handlePrintReport`) | Incident Detail DB | PDF / Print | ✅ Approved Logo (`LOGO_BASE64`) | Portrait | **MIGRATED** | **PASS** |
| 5 | **Weekly Timesheet PDF** | `IntegrityWeeklyTimesheet.jsx` (`handlePDFExport`) | Rep Clock Logs | PDF | ✅ Approved Logo (`LOGO_BASE64`) | Landscape | **MIGRATED** | **PASS** |
| 6 | **Customer Quality Portal Report** | `WebDashboard.jsx` (`handleExportCustomerPDF`) | Customer Portal DB | PDF | ✅ Approved Logo (`LOGO_BASE64`) | Landscape | **MIGRATED** | **PASS** |
| 7 | **CER & Payroll Executive Grid** | `WebDashboard.jsx` (`handleExportCER`) | Payroll & CER DB | PDF / Print | ✅ Approved Logo (`LOGO_BASE64`) | Landscape | **MIGRATED** | **PASS** |
| 8 | **Client Billing Invoice PDF** | `generateInvoicePdf.js` (`generateIntegrityInvoicePDF`) | Billing DB | PDF | ✅ Approved Logo (`LOGO_BASE64`) | Portrait | **MIGRATED** | **PASS** |
| 9 | **Human-Readable Excel Workbook** | `IntegrityWeeklyTimesheet.jsx` (`handleExportExcel`) | Timesheet / Audit DB | Excel (.xlsx) | ✅ Branded Workbook Header | Landscape Print | **MIGRATED** | **PASS** |
| 10 | **QuickBooks Payroll CSV** | `IntegrityWeeklyTimesheet.jsx` (`handleQuickBooksExport`) | Approved Timesheets | Machine CSV | 🚫 Machine Exception (No Image Data) | N/A | **MIGRATED** | **PASS** |
| 11 | **Client QuickBooks Billing CSV** | `WebDashboard.jsx` (`handleExportClientQuickBooks`) | Approved Invoices | Machine CSV | 🚫 Machine Exception (No Image Data) | N/A | **MIGRATED** | **PASS** |

---

## Compliance Verification Summary

- **Total Reports Inventoried**: 11
- **Human-Readable Reports with Logo**: 9 / 9 (100%)
- **Machine Export Files Clean (No Base64)**: 2 / 2 (100%)
- **Zero Text Truncation (`...`) Enforced**: 11 / 11 (100%)
- **Automated Test Gate**: All 11 reports verified passing in `tests/report_branding_and_layout_gate.test.js`.
