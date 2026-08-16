// src/services/poBudgetService.js
// Authoritative Real-Time PO Budget Telemetry & Colleen's Invoicing Engine

import { getEntities } from '../components/SharedDatabase.js';

/**
 * 1. Calculate Real-Time PO Budget Telemetry for a specific Project / Assignment.
 * Computes authorized PO budget, logged labor hours, billing costs, mileage expenses,
 * remaining balance, and burn percentage with 80% / 95% threshold triggers.
 *
 * @param {Object|string} projectOrId - Project object or Project ID string
 * @returns {Object} Comprehensive PO budget telemetry report
 */
export function calculatePOBudgetTelemetry(projectOrId) {
  const projects = getEntities('projects') || [];
  const shiftReports = getEntities('shiftReports') || [];
  const rateCards = getEntities('rateCards') || [];

  const project = typeof projectOrId === 'string'
    ? projects.find(p => p.id === projectOrId || p.project_id === projectOrId)
    : projectOrId;

  if (!project) {
    return {
      poNumber: 'N/A',
      authorizedBudget: 0,
      totalSpend: 0,
      remainingBalance: 0,
      burnPercentage: 0,
      status: 'normal',
      isWarning: false,
      isCritical: false,
      currency: 'CAD',
      totalHours: 0
    };
  }

  // Determine authorized PO budget cap
  const explicitCap = Number(project.po_budget || project.po_amount || project.authorized_budget || project.budget_cap || 0);
  const authorizedHours = Number(project.authorized_hours || project.allocated_hours || 400);
  const billingRate = Number(project.billing_rate || 85);
  const authorizedBudget = explicitCap > 0 ? explicitCap : (authorizedHours * billingRate);

  const poNumber = project.po_number || project.poNumber || `PO-${(project.client_id || 'IDS').toUpperCase()}-2026`;
  const currency = project.currency || (project.plant_location?.toLowerCase().includes('mi') || project.plant_location?.toLowerCase().includes('oh') ? 'USD' : 'CAD');

  // Filter shifts belonging to this project
  const projectShifts = shiftReports.filter(sr => {
    if (!sr) return false;
    return sr.project_id === project.id || sr.project_id === project.project_id || sr.assignment_id === project.id;
  });

  let totalHours = 0;
  let totalPiecesInspected = 0;
  projectShifts.forEach(sr => {
    totalHours += Number(sr.hours_worked || sr.total_hours || sr.hours || 0);
    totalPiecesInspected += Number(sr.inspected_count || sr.pieces_inspected || 0);
  });

  // Calculate rate card lookup
  const rateCard = rateCards.find(rc => rc.project_id === project.id || rc.assignment_id === project.id);
  const effectiveBillingRate = rateCard ? Number(rateCard.billing_rate || billingRate) : billingRate;

  // Calculate total spend
  const laborSpend = totalHours * effectiveBillingRate;
  const mileageSpend = 0; // standard mileage handled in time entries
  const totalSpend = laborSpend + mileageSpend;

  const burnPercentage = authorizedBudget > 0 ? Number(((totalSpend / authorizedBudget) * 100).toFixed(1)) : 0;
  const remainingBalance = Number(Math.max(0, authorizedBudget - totalSpend).toFixed(2));

  const isCritical = burnPercentage >= 95.0;
  const isWarning = burnPercentage >= 80.0 && !isCritical;
  const status = isCritical ? 'critical_cap_exceeded' : (isWarning ? 'budget_warning' : 'healthy');

  return {
    projectId: project.id,
    projectName: project.name || project.title || 'Project Assignment',
    poNumber,
    currency,
    billingRate: effectiveBillingRate,
    authorizedHours,
    totalHours: Number(totalHours.toFixed(1)),
    totalPiecesInspected,
    authorizedBudget: Number(authorizedBudget.toFixed(2)),
    laborSpend: Number(laborSpend.toFixed(2)),
    totalSpend: Number(totalSpend.toFixed(2)),
    remainingBalance,
    burnPercentage,
    status,
    isWarning,
    isCritical,
    statusLabel: isCritical ? 'Cap Exceeded (>=95%)' : (isWarning ? 'Warning (>=80%)' : 'Healthy (<80%)')
  };
}

/**
 * 2. Get enterprise-wide PO budget telemetry across all active projects.
 *
 * @returns {Array<Object>} List of all project PO telemetry metrics
 */
export function getAllProjectsPOBudgetTelemetry() {
  const projects = getEntities('projects') || [];
  return projects.map(p => calculatePOBudgetTelemetry(p));
}

/**
 * 3. Generate Colleen's Invoicing Batch Queue.
 * Compiles uninvoiced shift hours grouped by client and PO for 1-click billing exports.
 *
 * @returns {Array<Object>} Aggregated billing batches
 */
export function compileBatchInvoicingPayload() {
  const telemetryList = getAllProjectsPOBudgetTelemetry();
  const shiftReports = getEntities('shiftReports') || [];

  return telemetryList.map(t => {
    const unbilledShifts = shiftReports.filter(sr => 
      (sr.project_id === t.projectId || sr.assignment_id === t.projectId) && 
      !sr.invoiced
    );

    const unbilledHours = unbilledShifts.reduce((acc, sr) => acc + Number(sr.hours_worked || sr.total_hours || 0), 0);
    const unbilledAmount = Number((unbilledHours * t.billingRate).toFixed(2));

    return {
      projectId: t.projectId,
      projectName: t.projectName,
      poNumber: t.poNumber,
      currency: t.currency,
      billingRate: t.billingRate,
      unbilledShiftsCount: unbilledShifts.length,
      unbilledHours: Number(unbilledHours.toFixed(1)),
      unbilledAmount,
      readyToInvoice: unbilledShifts.length > 0,
      totalSpend: t.totalSpend,
      authorizedBudget: t.authorizedBudget,
      remainingBalance: t.remainingBalance,
      burnPercentage: t.burnPercentage,
      status: t.status
    };
  });
}
