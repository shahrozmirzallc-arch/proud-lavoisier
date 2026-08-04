/**
 * Authoritative Eligibility & Multi-Currency Financial Calculation Module
 * IDS Pulse — Hours & Financial Processing
 */

export const isEntryAccountingEligible = (entry) => {
  if (!entry) return false;

  // Staged offline or queued items are NOT financially eligible
  if (entry.status === 'staged_offline' || entry.status === 'queued') return false;

  // Items requiring allocation or rate configuration are NOT financially eligible
  if (
    entry.status === 'needs_allocation_configuration' ||
    entry.status === 'needs_configuration' ||
    entry.status === 'needs_rate_configuration'
  ) {
    return false;
  }

  // Pending, returned, rejected, voided entries are NOT financially eligible
  if (['client_pending', 'client_returned', 'client_rejected', 'voided', 'rejected'].includes(entry.status)) {
    return false;
  }

  // Regular hours recorded automatically
  if (entry.hour_type === 'regular' && entry.status === 'recorded') return true;

  // Overtime hours approved by client
  if (entry.hour_type === 'overtime' && (entry.status === 'client_approved' || entry.client_review_status === 'approved')) {
    return true;
  }

  return false;
};

export const calculateBillingTotalsByCurrency = (entries = [], financialsMap = {}) => {
  const totals = { CAD: 0, USD: 0, missingRatesCount: 0 };

  entries.forEach(entry => {
    if (!isEntryAccountingEligible(entry)) return;

    const fin = financialsMap[entry.id] || entry.financials;
    const hours = parseFloat(fin?.billable_hours ?? entry.hours ?? 0);
    const rate = parseFloat(fin?.billing_rate_snapshot ?? entry.billing_rate);
    const currency = (fin?.billing_currency_snapshot || entry.billing_currency || 'CAD').toUpperCase();

    if (isNaN(rate) || rate <= 0) {
      totals.missingRatesCount++;
      return;
    }

    if (!totals[currency]) totals[currency] = 0;
    totals[currency] += hours * rate;
  });

  return totals;
};

export const calculatePayrollTotalsByCurrency = (entries = [], financialsMap = {}) => {
  const totals = { CAD: 0, USD: 0, missingRatesCount: 0 };

  entries.forEach(entry => {
    if (!isEntryAccountingEligible(entry)) return;

    const fin = financialsMap[entry.id] || entry.financials;
    const hours = parseFloat(fin?.payable_hours ?? entry.hours ?? 0);
    const rate = parseFloat(fin?.pay_rate_snapshot ?? entry.pay_rate);
    const currency = (fin?.pay_currency_snapshot || entry.pay_currency || 'CAD').toUpperCase();

    if (isNaN(rate) || rate <= 0) {
      totals.missingRatesCount++;
      return;
    }

    if (!totals[currency]) totals[currency] = 0;
    totals[currency] += hours * rate;
  });

  return totals;
};
