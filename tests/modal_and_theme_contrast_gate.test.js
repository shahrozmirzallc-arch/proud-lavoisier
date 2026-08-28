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

  it('enforces zero dark container leaks in Quality Audit Incident Modal', () => {
    const incidentMatch = webDashboardContent.match(/selectedIncident\s*&&\s*\([\s\S]*?Close Audit Modal/);
    expect(incidentMatch).not.toBeNull();
    const incidentCode = incidentMatch[0];
    expect(incidentCode).not.toContain('bg-[#071325]');
    expect(incidentCode).not.toContain('bg-slate-950');
    expect(incidentCode).toContain('bg-white');
    expect(incidentCode).toContain('border-slate-300');
  });

  it('enforces zero dark container leaks in Create & Edit User Modals', () => {
    const addUserMatch = webDashboardContent.match(/showAddUserModal\s*&&\s*\([\s\S]*?Create Account/);
    expect(addUserMatch).not.toBeNull();
    const addUserCode = addUserMatch[0];
    expect(addUserCode).not.toContain('bg-slate-950');
    expect(addUserCode).not.toContain('text-amber-300');
    expect(addUserCode).toContain('bg-white');
    expect(addUserCode).toContain('text-amber-950');

    const editUserMatch = webDashboardContent.match(/showEditUserModal\s*&&\s*editingUser\s*&&\s*\([\s\S]*?Save Changes/);
    expect(editUserMatch).not.toBeNull();
    const editUserCode = editUserMatch[0];
    expect(editUserCode).not.toContain('bg-slate-950');
    expect(editUserCode).toContain('bg-white');
  });

  it('enforces zero dark container leaks in Shift Walkthrough and Rework Details Modals', () => {
    const shiftMatch = webDashboardContent.match(/selectedShiftReport\s*&&\s*\([\s\S]*?Close Walkthrough/);
    expect(shiftMatch).not.toBeNull();
    const shiftCode = shiftMatch[0];
    expect(shiftCode).not.toContain('bg-surface-elevated');
    expect(shiftCode).toContain('bg-white');

    const reworkMatch = webDashboardContent.match(/selectedReworkLog\s*&&\s*\([\s\S]*?Close Inspector/);
    expect(reworkMatch).not.toBeNull();
    const reworkCode = reworkMatch[0];
    expect(reworkCode).not.toContain('bg-surface-elevated');
    expect(reworkCode).toContain('bg-white');
  });

  it('enforces High-Contrast Light Theme tokens in Floating Toast Notifications', () => {
    const toastMatch = webDashboardContent.match(/Floating Toast Notification Overlay[\s\S]*?toast\s*&&\s*\([\s\S]*?toast\.message[\s\S]*?\)/);
    expect(toastMatch).not.toBeNull();
    const toastCode = toastMatch[0];
    expect(toastCode).not.toContain('bg-rose-950');
    expect(toastCode).not.toContain('bg-emerald-950');
    expect(toastCode).toContain('bg-rose-50 text-rose-950');
    expect(toastCode).toContain('bg-emerald-50 text-emerald-950');
  });
});

