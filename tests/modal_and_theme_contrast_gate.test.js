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

  it('enforces that Assembly Plant currency badges in Master Matrix use High-Contrast Light Theme classes (Rule 18)', () => {
    // Extract Master Matrix table section
    const matrixMatch = webDashboardContent.match(/Master Matrix Table[\s\S]*?<table[\s\S]*?<\/table>/);
    expect(matrixMatch).not.toBeNull();
    const matrixCode = matrixMatch[0];

    // Must NOT contain dark slate badge classes
    expect(matrixCode).not.toContain('dark:bg-slate-700');
    expect(matrixCode).not.toContain('bg-slate-200 dark:bg-slate-700');

    // Must enforce high-contrast light theme classes with bold dark text
    expect(matrixCode).toContain('bg-blue-50 text-blue-950');
    expect(matrixCode).toContain('bg-emerald-50 text-emerald-950');
  });

  it('enforces zero dark container leaks in Emergency Broadcast Modal Inspector', () => {
    const broadcastMatch = webDashboardContent.match(/EMERGENCY BROADCAST LOG INSPECTOR[\s\S]*?selectedBroadcastLog\s*&&\s*\([\s\S]*?Close Inspector/);
    if (broadcastMatch) {
      const broadcastCode = broadcastMatch[0];
      expect(broadcastCode).not.toContain('dark:bg-slate-950');
      expect(broadcastCode).not.toContain('dark:bg-slate-900');
      expect(broadcastCode).toContain('bg-white');
    }
  });
});

