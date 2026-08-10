---
name: antigravity-design-expert
description: >-
  Design, review, and enforce state-of-the-art UI/UX, typography, color contrast, animations, and branding systems in Antigravity.
  Use when designing frontend components, auditing UI color contrast (>7:1 ratio), enforcing the Zero Emoji Rule,
  optimizing theme asset inversions, and ensuring premium visual aesthetics for the IDS Pulse platform.
---

# Antigravity Design Expert — Premium UI/UX & Branding Skill

This skill provides comprehensive guidelines for designing, building, and auditing state-of-the-art visual interfaces, typography, component hierarchies, and branding standards within **IDS Pulse** and **Google Antigravity**.

---

## 1. Core Visual Design System Principles

### A. Modern Aesthetics & WOW Factor
- **Typography**: Enforce modern Google Fonts (`Inter`, `Outfit`, `Plus Jakarta Sans`) over browser defaults.
- **Glassmorphism & Gradients**: Utilize subtle backdrop blurs (`backdrop-blur-md`), smooth gradients (`bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900`), and refined borders (`border border-white/10`).
- **Interactive Micro-Animations**: Implement hover scale transforms (`hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out`), smooth focus rings, and dynamic status pulses.

### B. High Contrast Light Theme Guardrail (WCAG AAA Compliance)
- **Dashboard Alert Cards & Feeds**: Enforce explicit high-contrast light theme containers (`bg-white`, `bg-amber-50`, `bg-slate-50`, `border-amber-300`, `border-slate-300`, `text-amber-950`, `text-slate-900`, `text-slate-950 font-extrabold`).
- **Forbidden Low-Contrast Patterns**: NEVER place dark tint classes (`bg-amber-950`, `bg-slate-900`) inside light dashboard surfaces with low-contrast text (`text-amber-200`, `text-slate-400`). All text-to-background contrast ratios MUST exceed **7:1**.

### C. Zero Emoji Directive & SVG Icon Standard
- **Zero Emojis**: Emojis are strictly forbidden across all UI buttons, titles, alert feeds, modals, tabs, and notifications.
- **Lucide Icon Standard**: Use clean, modern SVG icons exclusively from `lucide-react` (e.g. `<ShieldCheck className="w-5 h-5 text-indigo-600" />`).

---

## 2. Branding & Theme Contrast Inversion Audit

### A. Canonical Base64 Logo Integration
- Source logo strictly from `src/config/brandingConfig.js` (`LOGO_BASE64` in `LogoBase64.js`).
- Logos rendered on white/paper surfaces must use 100% transparent PNGs with zero black box rectangle artifacts.

### B. Dynamic Theme Contrast Asset Inversion
- On dark header/sidebar surfaces: Apply CSS filter `filter: brightness(0) invert(1)` to dark logos/icons.
- On light paper/document surfaces: Render dark assets un-inverted (`filter: none`).

---

## 3. UI Verification & Live Screenshot Protocol

- **NO AI GENERATED UI MOCKUPS**: Never generate, share, or present AI-generated concept UI images as live UI.
- **REAL LIVE SCREENSHOTS ONLY**: Always execute the web app locally or on Vercel live (`https://proud-lavoisier.vercel.app/`), test the component with Puppeteer scripts (e.g. `capture_authentic_live_app.cjs`), and capture real screenshots from the DOM.

---

## 4. Controlled Dropdown & Layout Persistence Guidelines

- **Controlled Dropdowns**: Custom "Other / Not Listed" text input boxes in dropdowns (`BusinessDropdown.jsx`) must NEVER be auto-cleared when receiving empty draft strings.
- **Zero Text Truncation**: No `text-ellipsis` or CSS overflow clipping for critical quality data. Enable dynamic multiline text wrapping.
