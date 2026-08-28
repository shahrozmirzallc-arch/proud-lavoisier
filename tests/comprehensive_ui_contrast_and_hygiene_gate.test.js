// tests/comprehensive_ui_contrast_and_hygiene_gate.test.js
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Rule 19: Comprehensive Static UI Hygiene & Anti-Recurrence Gate', () => {
  const srcDir = path.join(process.cwd(), 'src');

  function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getAllFiles(filePath, fileList);
      } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  const jsxFiles = getAllFiles(srcDir);

  it('verifies that no modal dialogs in WebDashboard contain dark container classes', () => {
    const webDashboardPath = path.join(process.cwd(), 'src/components/WebDashboard.jsx');
    const content = fs.readFileSync(webDashboardPath, 'utf8');

    const bannedModalCardClasses = [
      'bg-[#071325]',
      'bg-[#0a1525]',
      'from-amber-950',
      'bg-emerald-950'
    ];

    const modalNames = [
      'selectedIncident',
      'selectedEmailLog',
      'selectedBroadcastLog',
      'selectedShiftReport',
      'selectedReworkLog',
      'showAddUserModal',
      'showEditUserModal',
      'showAssignRepModal',
      'showHandoverModal',
      'selectedReceiptPhoto',
      'showCalendarModal',
      'selectedZoomImage',
      'createdUserCredentials'
    ];

    for (const modalName of modalNames) {
      const regex = new RegExp(`${modalName}\\s*&&\\s*\\([\\s\\S]*?\\)\\s*\\}`, 'g');
      const matches = content.match(regex) || [];
      for (const block of matches) {
        for (const banned of bannedModalCardClasses) {
          const innerCard = block.replace(/fixed inset-0[^"]*|absolute inset-0[^"]*/g, '');
          expect(innerCard).not.toContain(banned);
        }
      }
    }
  });

  it('verifies zero raw __new__ or __unassigned__ placeholder leaks in WebDashboard drill-down & summary views', () => {
    const webDashboardPath = path.join(process.cwd(), 'src/components/WebDashboard.jsx');
    const content = fs.readFileSync(webDashboardPath, 'utf8');

    expect(content).not.toMatch(/>\s*\{[^}]*__new__[^}]*\}\s*</);
    expect(content).not.toMatch(/>\s*__new__\s*</);
  });

  it('verifies that floating toasts enforce high-contrast light theme classes (Rule 16/18)', () => {
    const webDashboardPath = path.join(process.cwd(), 'src/components/WebDashboard.jsx');
    const content = fs.readFileSync(webDashboardPath, 'utf8');

    const toastMatch = content.match(/Floating Toast Notification Overlay[\s\S]*?toast\s*&&\s*\([\s\S]*?toast\.message[\s\S]*?\)/);
    expect(toastMatch).not.toBeNull();
    const toastCode = toastMatch[0];

    expect(toastCode).not.toContain('bg-rose-950');
    expect(toastCode).not.toContain('bg-amber-950');
    expect(toastCode).not.toContain('bg-emerald-950');
    expect(toastCode).not.toContain('bg-sky-950');
    expect(toastCode).toContain('bg-rose-50 text-rose-950');
    expect(toastCode).toContain('bg-emerald-50 text-emerald-950');
  });

  it('verifies that invoice preview modal toolbar enforces High-Contrast Light Theme tokens', () => {
    const invoiceModalPath = path.join(process.cwd(), 'src/components/InvoiceModal.jsx');
    const content = fs.readFileSync(invoiceModalPath, 'utf8');

    expect(content).not.toContain('bg-slate-900 text-white px-6 py-4');
    expect(content).toContain('bg-slate-100 text-slate-900 px-6 py-4');
  });

  it('verifies that all JSX files in src do not contain literal emojis (Rule 14 Zero Emoji Rule)', () => {
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const filePath of jsxFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(emojiRegex);
      if (match) {
        expect.fail(`Literal emoji found in ${filePath}: "${match[0]}". Rule 14 strictly forbids all emojis.`);
      }
    }
  });
});
