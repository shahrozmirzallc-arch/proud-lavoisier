import { supabase } from '../components/SharedDatabase.js';

/**
 * Validates onboarding payload parameters.
 */
export function validateOnboardingPayload(payload) {
  if (!payload) {
    throw new Error("Validation Error: Onboarding payload is missing.");
  }
  const supplierName = payload.supplier_name || payload.company_name;
  if (!supplierName || !supplierName.trim()) {
    throw new Error("Validation Error: Company/Supplier Name is required.");
  }
  const projectName = payload.project_name || payload.description;
  if (!projectName || !projectName.trim()) {
    throw new Error("Validation Error: Project Name/Scope is required.");
  }
  const bRate = parseFloat(payload.billing_rate);
  const pRate = parseFloat(payload.pay_rate);
  if (isNaN(bRate) || bRate < 0) {
    throw new Error("Validation Error: Billing rate must be a valid non-negative number.");
  }
  if (isNaN(pRate) || pRate < 0) {
    throw new Error("Validation Error: Pay rate must be a valid non-negative number.");
  }

  return {
    supplier_name: supplierName.trim(),
    project_name: projectName.trim(),
    billing_rate: bRate,
    pay_rate: pRate,
    contact_name: payload.contact_name?.trim() || '',
    contact_email: payload.contact_email?.trim() || '',
    contact_phone: payload.contact_phone?.trim() || '',
    address: payload.address?.trim() || '',
    plant_name: payload.plant_name?.trim() || 'Windsor Plant 1',
    plant_city: payload.plant_city?.trim() || 'Windsor',
    plant_address: payload.plant_address?.trim() || payload.address?.trim() || 'Windsor, ON',
    part_number: payload.part_number?.trim() || 'AT-4472',
    po_number: payload.po_number?.trim() || 'PO-2026-ATLAS',
    rep_id: payload.rep_id || '1',
    currency: payload.currency || 'USD',
    start_date: payload.start_date || new Date().toISOString().split('T')[0],
    allotted_hours: parseFloat(payload.allotted_hours) || 40
  };
}

/**
 * Resolves project rate numerical value or returns null if not configured.
 */
export function resolveRateValue(project, ratesList = [], type = 'billing') {
  if (!project) return null;
  const directVal = type === 'billing' ? project.billing_rate : project.pay_rate;
  if (directVal !== undefined && directVal !== null && directVal !== '' && !isNaN(parseFloat(directVal))) {
    return parseFloat(directVal);
  }
  if (Array.isArray(ratesList)) {
    const matched = ratesList.find(r => 
      r.project_id === project.id || 
      (r.supplier_id === (project.supplier_id || project.client_id) && r.rep_id === project.rep_id)
    );
    if (matched) {
      const val = type === 'billing' ? matched.billing_rate : matched.pay_rate;
      if (val !== undefined && val !== null && val !== '' && !isNaN(parseFloat(val))) {
        return parseFloat(val);
      }
    }
  }
  return null;
}

/**
 * Formats rate for registry UI display. Never returns 'NaN'.
 */
export function formatRateDisplay(project, ratesList = [], type = 'billing') {
  const num = resolveRateValue(project, ratesList, type);
  if (num === null) return 'Rate not configured';
  const currSymbol = project?.currency === 'CAD' ? 'C$' : 'US$';
  return `${currSymbol} ${num.toFixed(2)}/hr`;
}

/**
 * Executes atomic client onboarding via Supabase RPC.
 */
export async function performAtomicClientOnboarding(rawPayload) {
  const validated = validateOnboardingPayload(rawPayload);

  // Genuine network offline check
  if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
    return {
      isOffline: true,
      status: 'pending_offline',
      message: 'Offline: Onboarding command queued for verification upon reconnect.'
    };
  }

  // Call Supabase atomic RPC function
  const { data, error } = await supabase.rpc('onboard_client_project', {
    p_supplier_id: rawPayload.supplier_id || null,
    p_supplier_name: validated.supplier_name,
    p_contact_name: validated.contact_name || null,
    p_contact_email: validated.contact_email || null,
    p_contact_phone: validated.contact_phone || null,
    p_address: validated.address || null,
    p_allotted_hours: validated.allotted_hours,
    p_plant_id: rawPayload.plant_id || null,
    p_plant_name: validated.plant_name,
    p_plant_city: validated.plant_city,
    p_plant_address: validated.plant_address,
    p_project_name: validated.project_name,
    p_part_number: validated.part_number,
    p_po_number: validated.po_number,
    p_rep_id: validated.rep_id,
    p_billing_rate: validated.billing_rate,
    p_pay_rate: validated.pay_rate,
    p_currency: validated.currency,
    p_start_date: validated.start_date
  });

  if (error) {
    throw new Error(`Server Error: ${error.message}`);
  }

  return data;
}
