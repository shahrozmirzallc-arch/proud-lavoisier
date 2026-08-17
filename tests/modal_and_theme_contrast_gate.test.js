// tests/modal_and_theme_contrast_gate.test.js
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mandatory Modal & Theme Contrast Gate (Rule 16)', () => {
  const webDashboardPath = path.join(process.cwd(), 'src/components/WebDashboard.jsx');
  const webDashboardContent = fs.readFileSync(webDashboardPath, 'utf8');

  it('enforces that Emergency Shift Transfer Modal uses 100% High-Contrast Light Theme classes', () => {
    // Extract handover modal card body
    const modalMatch = webDashboardContent.match(/showHandoverModal\s*&&\s*\([\s\S]*?<div className="bg-white border-2 border-amber-400[\s\S]*?Cancel[\s\S]*?Execute Seamless Transfer[\s\S]*?\)/);
    expect(modalMatch).not.toBeNull();
    const modalCode = modalMatch[0];

    // Must NOT contain dark container classes inside modal body
    expect(modalCode).not.toContain('from-amber-950');
    expect(modalCode).not.toContain('bg-emerald-950');
    expect(modalCode).not.toContain('text-emerald-200');
    expect(modalCode).not.toContain('text-slate-300 uppercase');

    // Must contain high-contrast light theme classes
    expect(modalCode).toContain('bg-white');
    expect(modalCode).toContain('bg-slate-50');
    expect(modalCode).toContain('bg-emerald-50');
    expect(modalCode).toContain('text-slate-900');
    expect(modalCode).toContain('text-emerald-950');
  });

  it('enforces zero unreadable faint labels (text-slate-300 / text-slate-400 on form inputs) in handover modal', () => {
    const modalMatch = webDashboardContent.match(/showHandoverModal\s*&&\s*\([\s\S]*?Cancel[\s\S]*?Execute Seamless Transfer[\s\S]*?\)/);
    const modalCode = modalMatch[0];

    // Form labels must be high contrast (slate-800, slate-900, or black)
    expect(modalCode).not.toContain('text-slate-300 uppercase tracking-wider pl-0.5');
    expect(modalCode).toContain('text-slate-800');
  });
});
