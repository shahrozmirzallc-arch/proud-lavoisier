# IDS Pulse Permanent Reporting & Branding Rule

**Always-on Workspace Rule for Google Antigravity & Agentic Coding Assistants**

---

## Mandatory Instructions for All Coding Agents

1. **Read Reporting Standards**: Always read `docs/REPORT_BRANDING_STANDARD.md` and `.agents/rules/ids-pulse-reporting.md` before creating, editing, or refactoring any report, export, PDF, HTML print template, Excel workbook, or QuickBooks file.
2. **Approved Logo Requirement**: Every human-readable IDS Pulse report and document MUST carry the approved official company logo (`src/config/brandingConfig.js` / `src/components/LogoBase64.js`).
3. **Completion Criteria**: Report generation is NOT complete merely because a file downloads. Data completeness, layout integrity, branding compliance, and 100% text readability are mandatory.
4. **Shared Report Shell**: Never create a custom report renderer that bypasses `src/utils/sharedReportShell.js`. All human-readable reports must use the unified branded report shell.
5. **Authoritative Data Integrity**: Never invent, hard-code, or silently substitute business data, representative names, hours, rates, parts, or totals.
6. **Zero Text Truncation**: Never truncate report text or narratives with `...` or ellipsis. Use `overflow: 'linebreak'` with dynamic row height and automatic landscape orientation for wide tables.
7. **Automated Verification**: No report may ship unless automated branding and layout tests (`tests/report_branding_and_layout_gate.test.js`) pass cleanly.
