// src/services/weeklyDigestService.js
// Authoritative Weekly Client Quality Digest & Containment Summary Engine
// Compiles plant inspection volume, PPM scorecards, defect Pareto, and PO spend for Client SQEs

import { getEntities, logSystemEvent } from '../components/SharedDatabase';
import { calculateSupplierPPM, getDefectParetoAnalysis } from './qualityAnalyticsService';
import { calculatePOBudgetTelemetry } from './poBudgetService';
import { LOGO_BASE64 } from '../components/LogoBase64';

/**
 * Compiles a comprehensive weekly quality executive digest for a specific supplier/client.
 *
 * @param {string} supplierId - Target supplier/client ID
 * @param {Object} [options] - Date range options
 * @returns {Object} Weekly digest payload ready for display or email dispatch
 */
export function generateWeeklyClientDigest(supplierId, options = {}) {
  const suppliers = getEntities('suppliers') || [];
  const shiftReports = getEntities('shiftReports') || [];
  const incidents = getEntities('incidents') || [];
  const projects = getEntities('projects') || [];

  const supplier = suppliers.find(s => s.id === supplierId || s.id === supplierId?.toLowerCase());
  const supplierName = supplier ? supplier.name : (supplierId?.toUpperCase() || 'Tier-1 Automotive Partner');

  // Calculate 7-day date window
  const endDate = options.endDate ? new Date(options.endDate) : new Date();
  const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000));
  const startIso = startDate.toISOString().substring(0, 10);
  const endIso = endDate.toISOString().substring(0, 10);

  // Filter shifts belonging to this supplier in the weekly window
  const weeklyShifts = shiftReports.filter(sr => {
    if (!sr) return false;
    const matchesSupplier = sr.supplier_id === supplierId || sr.customer_id === supplierId;
    if (!matchesSupplier) return false;
    if (!sr.date) return true;
    return sr.date >= startIso && sr.date <= endIso;
  });

  let totalHours = 0;
  let totalInspected = 0;
  let totalDefectsInShifts = 0;

  weeklyShifts.forEach(sr => {
    totalHours += Number(sr.hours_worked || sr.total_hours || sr.hours || 0);
    totalInspected += Number(sr.inspected_count || sr.pieces_inspected || sr.total_inspected_pcs || 0);
    totalDefectsInShifts += Number(sr.defective_count || sr.pieces_defective || 0);
  });

  // Filter incidents in the weekly window
  const weeklyIncidents = incidents.filter(inc => {
    if (!inc) return false;
    const matchesSupplier = inc.supplier_id === supplierId || inc.customer_id === supplierId || inc.client_id === supplierId;
    if (!matchesSupplier) return false;
    if (!inc.date && !inc.created_at) return true;
    const incDate = (inc.date || inc.created_at || '').substring(0, 10);
    return incDate >= startIso && incDate <= endIso;
  });

  const criticalSpillsCount = weeklyIncidents.filter(i => (i.level_of_concern || i.severity || '').toLowerCase() === 'critical').length;

  // PPM and Pareto Analytics
  const ppmStats = calculateSupplierPPM({ supplierId });
  const paretoDefects = getDefectParetoAnalysis({ supplierId }).slice(0, 5);

  // Associated Projects and PO Budget telemetry
  const clientProjects = projects.filter(p => p.supplier_id === supplierId || p.client_id === supplierId);
  const projectTelemetry = clientProjects.map(p => calculatePOBudgetTelemetry(p));

  // Resolved SQE contacts for delivery
  const contacts = supplier?.contacts || [];
  const recipientEmails = contacts.map(c => typeof c === 'object' ? c.email : c).filter(Boolean);
  if (supplier?.contact_email && !recipientEmails.includes(supplier.contact_email)) {
    recipientEmails.push(supplier.contact_email);
  }

  return {
    supplierId,
    supplierName,
    reportPeriod: `${startIso} to ${endIso}`,
    generatedAt: new Date().toISOString(),
    recipientEmails,
    summaryMetrics: {
      totalShiftsLogged: weeklyShifts.length,
      totalHoursLogged: Number(totalHours.toFixed(1)),
      totalInspectedPieces: totalInspected,
      totalDefectsFound: totalDefectsInShifts + weeklyIncidents.reduce((sum, i) => sum + Number(i.pieces_defective || i.quantity || 0), 0),
      ppm: ppmStats.ppm,
      ratingGrade: ppmStats.ratingGrade,
      qualityTier: ppmStats.tier,
      passRate: ppmStats.passRate,
      criticalSpillsCount,
      openIncidentsCount: weeklyIncidents.length
    },
    paretoTopDefects: paretoDefects,
    activeProjects: projectTelemetry
  };
}

/**
 * Composes a branded, zero-truncation HTML email for the Weekly Quality Digest.
 *
 * @param {Object} digest - Generated weekly digest payload
 * @returns {string} Fully rendered HTML email string
 */
export function composeWeeklyDigestHtml(digest) {
  const { supplierName, reportPeriod, summaryMetrics, paretoTopDefects, activeProjects } = digest;

  const paretoRows = paretoTopDefects.length > 0
    ? paretoTopDefects.map((p, idx) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-weight: bold; color: #1E293B;">#${idx + 1} ${p.defectType}</td>
          <td style="padding: 10px 12px; text-align: center; font-family: monospace; font-weight: bold; color: #DC2626;">${p.totalQuantity} pcs</td>
          <td style="padding: 10px 12px; text-align: center; font-weight: bold; color: #2563EB;">${p.percentage}%</td>
          <td style="padding: 10px 12px; text-align: center;">${p.criticalCount > 0 ? '<span style="background: #FEE2E2; color: #991B1B; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">CRITICAL</span>' : '<span style="background: #E0F2FE; color: #075985; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">STANDARD</span>'}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #64748B; font-style: italic;">Zero non-conforming defects logged this period. Assembly floor is clean.</td></tr>`;

  const projectRows = activeProjects.length > 0
    ? activeProjects.map(pr => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-weight: bold; color: #1E293B;">${pr.projectName}</td>
          <td style="padding: 10px 12px; text-align: center; font-family: monospace;">${pr.poNumber}</td>
          <td style="padding: 10px 12px; text-align: center; font-family: monospace;">${pr.totalHours} hrs</td>
          <td style="padding: 10px 12px; text-align: center; font-family: monospace; font-weight: bold;">$${pr.totalSpend.toLocaleString()} ${pr.currency}</td>
          <td style="padding: 10px 12px; text-align: center;">
            <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; ${
              pr.isCritical ? 'background: #FEE2E2; color: #991B1B;' : (pr.isWarning ? 'background: #FEF3C7; color: #92400E;' : 'background: #DCFCE7; color: #166534;')
            }">
              ${pr.statusLabel} (${pr.burnPercentage}%)
            </span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748B;">No active project POs assigned.</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IDS Pulse Weekly Quality Containment Digest</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="padding: 24px; background: #0F172A; text-align: left;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <img src="${LOGO_BASE64}" alt="IDS Logo" style="height: 36px; display: block;" />
              <h1 style="color: #FFFFFF; font-size: 18px; font-weight: 900; margin: 12px 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Weekly Quality Containment Digest
              </h1>
              <p style="color: #94A3B8; font-size: 12px; margin: 0; font-weight: 600;">
                ${supplierName} | Reporting Window: ${reportPeriod}
              </p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <span style="display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 900; background: ${summaryMetrics.ratingGrade === 'A' ? '#10B981' : (summaryMetrics.ratingGrade === 'B' ? '#3B82F6' : '#EF4444')}; color: #FFFFFF;">
                Grade ${summaryMetrics.ratingGrade} (${summaryMetrics.ppm} PPM)
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- KPI Summary Grid -->
    <tr>
      <td style="padding: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="25%" style="padding: 12px; background: #F1F5F9; border-radius: 12px; text-align: center;">
              <span style="font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; display: block;">Inspected Volume</span>
              <strong style="font-size: 18px; color: #0F172A; font-family: monospace;">${summaryMetrics.totalInspectedPieces.toLocaleString()}</strong>
            </td>
            <td width="4%"></td>
            <td width="25%" style="padding: 12px; background: #F1F5F9; border-radius: 12px; text-align: center;">
              <span style="font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; display: block;">Pass Rate</span>
              <strong style="font-size: 18px; color: #10B981; font-family: monospace;">${summaryMetrics.passRate}</strong>
            </td>
            <td width="4%"></td>
            <td width="25%" style="padding: 12px; background: #F1F5F9; border-radius: 12px; text-align: center;">
              <span style="font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; display: block;">Logged Hours</span>
              <strong style="font-size: 18px; color: #2563EB; font-family: monospace;">${summaryMetrics.totalHoursLogged} hrs</strong>
            </td>
            <td width="4%"></td>
            <td width="25%" style="padding: 12px; background: #F1F5F9; border-radius: 12px; text-align: center;">
              <span style="font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; display: block;">Critical Spills</span>
              <strong style="font-size: 18px; color: #EF4444; font-family: monospace;">${summaryMetrics.criticalSpillsCount}</strong>
            </td>
          </tr>
        </table>

        <!-- Pareto Top Defects Section -->
        <div style="margin-top: 28px;">
          <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 12px;">
            Top Pareto Non-Conformance Classifications
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #F8FAFC; color: #64748B; font-size: 10px; text-transform: uppercase; font-weight: bold;">
                <th style="padding: 8px 12px;">Defect Type</th>
                <th style="padding: 8px 12px; text-align: center;">Quantity</th>
                <th style="padding: 8px 12px; text-align: center;">Impact %</th>
                <th style="padding: 8px 12px; text-align: center;">Severity</th>
              </tr>
            </thead>
            <tbody>
              ${paretoRows}
            </tbody>
          </table>
        </div>

        <!-- Active PO Budget Tracker -->
        <div style="margin-top: 28px;">
          <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 12px;">
            Active Purchase Order (PO) Budget Status
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #F8FAFC; color: #64748B; font-size: 10px; text-transform: uppercase; font-weight: bold;">
                <th style="padding: 8px 12px;">Project</th>
                <th style="padding: 8px 12px; text-align: center;">PO Number</th>
                <th style="padding: 8px 12px; text-align: center;">Hours</th>
                <th style="padding: 8px 12px; text-align: center;">Spend</th>
                <th style="padding: 8px 12px; text-align: center;">Burn Rate Status</th>
              </tr>
            </thead>
            <tbody>
              ${projectRows}
            </tbody>
          </table>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #64748B;">
        This automated weekly digest was generated from authoritative plant containment data by <strong>Integrity Driven Solutions Inc. (IDS Pulse)</strong>.<br />
        For questions or emergency quality containment support, contact operations@integritydrivensolutions.ca.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches the weekly quality digest to all registered client quality contacts.
 *
 * @param {string} supplierId - Target supplier ID
 * @returns {Promise<Object>} Dispatch receipt
 */
export async function dispatchWeeklyClientDigest(supplierId) {
  const digest = generateWeeklyClientDigest(supplierId);
  const html = composeWeeklyDigestHtml(digest);

  logSystemEvent('digest', 'dispatch', `Weekly Quality Digest generated for ${digest.supplierName} (${digest.recipientEmails.length} recipients)`);

  return {
    success: true,
    supplierId,
    supplierName: digest.supplierName,
    recipients: digest.recipientEmails,
    summaryMetrics: digest.summaryMetrics,
    html
  };
}
