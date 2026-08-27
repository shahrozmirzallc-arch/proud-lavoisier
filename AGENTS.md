# AGENTS.md — Permanent Project Instructions for Google Antigravity

This repository houses the **IDS Pulse** platform by **Integrity Driven Solutions Inc. (IDS)**.

## Mandatory Reporting & Branding Directives

Every AI coding agent and developer modifying this codebase MUST read and strictly adhere to:
1. [.agents/rules/ids-pulse-enterprise-standards.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/.agents/rules/ids-pulse-enterprise-standards.md)
2. [.agents/rules/ids-pulse-reporting.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/.agents/rules/ids-pulse-reporting.md)
3. [docs/REPORT_BRANDING_STANDARD.md](file:///C:/Users/Sharoz/Documents/antigravity/proud-lavoisier/docs/REPORT_BRANDING_STANDARD.md)

---

## Core System Guardrails

- **One Approved Canonical Logo**: Sourced from `src/config/brandingConfig.js` (`LOGO_BASE64` in `LogoBase64.js`). All human-readable reports (PDF, HTML, Excel) MUST carry this logo.
- **Zero Text Truncation**: Ellipsis (`...`) or CSS clipping for report data is strictly forbidden. Narratives must wrap onto multi-line rows with dynamic row height.
- **Authoritative Data Only**: Reports must draw 100% from authoritative database records. Never invent, hardcode, or substitute fake demo data.
- **Zero Binary IDE Tab Open**: Never open `.apk`, `.pdf`, `.zip`, or large binary build outputs in internal IDE tabs. Always open in Windows Explorer (`explorer.exe /select,"<file_path>"`).
- **Zero Emoji Rule**: Emojis are strictly forbidden across UI components, buttons, feeds, modals, reports, documentation, artifacts, and AI assistant responses. Use clean SVG icons from `lucide-react` or professional plain text typography only.
- **Mandatory Unified Rate Engine & Zero Draft Code Rule**: All tables, project registries, and financial drill-downs MUST use the unified rate resolver (`getRepSupplierRates()` / `resolveRateValue()`) with 3-tier fallback (rates $\rightarrow$ supplier $\rightarrow$ currency). Raw draft codes like `__new__` MUST NEVER be displayed; always render `Unassigned / Pending`.
- **Mandatory High-Contrast Light Theme & Zero Dark Container Leak Rule**: All dashboard cards, modals, popups, inputs, and form controls MUST enforce clean high-contrast light theme classes (`bg-white`, `bg-slate-50`, `bg-emerald-50`, `text-slate-900`, `text-slate-800 font-black`, `border-2 border-slate-300`). Dark container classes (`bg-slate-950`, `bg-emerald-950`, `from-amber-950`) and faint muted text (`text-slate-300`, `text-emerald-200`) inside light modals are strictly forbidden.
- **Strict Verbatim UI Terminology Guardrail**: When giving navigation instructions or explaining screens, agents MUST ALWAYS quote the exact character-for-character label on the button/tab (e.g. `Live Command Center`, NEVER `HQ Command Center`). Paraphrasing or loose terminology is strictly prohibited.
- **Automated Verification**: Run `node tests/report_branding_and_layout_gate.test.js` and `npx vitest run tests/modal_and_theme_contrast_gate.test.js` before completing any modifications.
