import { supabase, saveEntity, getDB, addUser, provisionUser } from '../components/SharedDatabase.js';

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

  const dbUsers = getDB()?.users || [];
  const repId = payload.rep_id || (dbUsers.find(u => u.role === 'rep')?.id || (dbUsers[0]?.id || 'rep_default'));

  return {
    supplier_name: supplierName.trim(),
    project_name: projectName.trim(),
    billing_rate: bRate,
    pay_rate: pRate,
    contact_name: payload.contact_name?.trim() || '',
    contact_email: payload.contact_email?.trim() || '',
    contact_phone: payload.contact_phone?.trim() || '',
    address: payload.address?.trim() || '',
    plant_name: payload.plant_name?.trim() || '',
    plant_city: payload.plant_city?.trim() || '',
    plant_address: payload.plant_address?.trim() || payload.address?.trim() || '',
    part_number: payload.part_number?.trim() || '',
    po_number: payload.po_number?.trim() || '',
    rep_id: repId,
    rep_name: payload.rep_name?.trim() || '',
    currency: payload.currency || 'CAD',
    start_date: payload.start_date || new Date().toISOString().split('T')[0],
    allotted_hours: parseFloat(payload.allotted_hours) || 0
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
 * Executes atomic client onboarding via Supabase RPC with fallback to direct table persistence.
 */
export async function performAtomicClientOnboarding(rawPayload) {
  const dbDataPre = getDB();
  const validated = validateOnboardingPayload(rawPayload);

  // Resolve rep_name if not explicitly passed
  let resolvedRepName = validated.rep_name;
  if (!resolvedRepName && validated.rep_id) {
    const matchedRep = (dbDataPre.users || []).find(u => String(u.id) === String(validated.rep_id) || u.username === validated.rep_id);
    if (matchedRep) {
      resolvedRepName = matchedRep.name;
    } else {
      resolvedRepName = matchedRep?.name || 'IDS Field Rep';
    }
  }

  if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
    return {
      isOffline: true,
      status: 'pending_offline',
      message: 'Offline: Onboarding command queued for verification upon reconnect.'
    };
  }

  // CLIENT-SIDE DEDUP: Check for existing supplier by name to prevent duplicates
  const existingSupplier = (dbDataPre.suppliers || []).find(s =>
    (rawPayload.supplier_id && String(s.id) === String(rawPayload.supplier_id)) ||
    (s.name && s.name.toLowerCase().trim() === validated.supplier_name.toLowerCase().trim())
  );
  const dedupSupplierId = existingSupplier ? existingSupplier.id : (rawPayload.supplier_id || null);

  try {
    const { data, error } = await supabase.rpc('onboard_client_project', {
      p_supplier_id: dedupSupplierId,
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

    if (!error && data) {
      // RPC succeeded — write all entities to LOCAL DB so they're immediately available
      const rpcSupplierId = data.supplier_id || dedupSupplierId || `sup_${Date.now()}`;
      const rpcPlantId = data.plant_id || rawPayload.plant_id || `plant_${Date.now()}`;
      const rpcProjectId = data.project_id || `proj_${Date.now()}`;

      // Write supplier locally (reuse existing if deduped)
      saveEntity('suppliers', {
        id: rpcSupplierId,
        name: validated.supplier_name,
        contact_name: validated.contact_name || (existingSupplier?.contact_name || ''),
        contact_person: validated.contact_name || (existingSupplier?.contact_person || ''),
        contact_email: validated.contact_email || (existingSupplier?.contact_email || ''),
        contact_phone: validated.contact_phone || (existingSupplier?.contact_phone || ''),
        phone: validated.contact_phone || (existingSupplier?.phone || ''),
        address: validated.address || (existingSupplier?.address || ''),
        allotted_hours: validated.allotted_hours || (existingSupplier?.allotted_hours || 0),
        created_at: existingSupplier?.created_at || new Date().toISOString()
      });

      // Write plant locally
      saveEntity('plants', {
        id: rpcPlantId,
        name: validated.plant_name,
        city: validated.plant_city,
        address: validated.plant_address,
        supplier_ids: [rpcSupplierId],
        created_at: new Date().toISOString()
      });

      // Write project locally
      saveEntity('projects', {
        id: rpcProjectId,
        name: validated.project_name,
        supplier_id: rpcSupplierId,
        supplier_name: validated.supplier_name,
        client_id: rpcSupplierId,
        plant_id: rpcPlantId,
        plant_name: validated.plant_name,
        rep_id: validated.rep_id,
        rep_name: resolvedRepName,
        scope_of_work: validated.project_name,
        po_hours: validated.allotted_hours,
        billing_rate: validated.billing_rate,
        pay_rate: validated.pay_rate,
        currency: validated.currency,
        status: 'active',
        start_date: validated.start_date
      });

      // Write rate locally
      saveEntity('rates', {
        id: data.rate_id || `rate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        rep_id: validated.rep_id,
        supplier_id: rpcSupplierId,
        plant_id: rpcPlantId,
        project_id: rpcProjectId,
        billing_rate: validated.billing_rate,
        pay_rate: validated.pay_rate,
        currency: validated.currency,
        created_at: new Date().toISOString()
      });

      // Provision customer user account locally & sync so client company logins work immediately
      try {
        const provRes = provisionUser({
          name: validated.contact_name || `${validated.supplier_name} Quality Manager`,
          email: validated.contact_email || `${validated.supplier_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@client.com`,
          role: 'customer',
          supplier_id: rpcSupplierId,
          customer_id: rpcSupplierId,
          title: 'Client Quality Manager'
        });
        if (provRes?.user) {
          Promise.resolve(supabase.from('users').upsert(provRes.user)).catch(e => console.warn("[Supabase Cloud Customer Sync Warning]:", e));
        }
      } catch (e) {
        console.warn("[Onboarding Customer User Notice]:", e);
      }

      window.dispatchEvent(new Event('ids_pulse_db_update'));

      return data;
    }
  } catch (rpcErr) {
    console.warn("[Onboarding Service] RPC onboard_client_project unavailable, falling back to direct table persistence:", rpcErr);
  }

  // Direct Table & Local Storage Persistence Fallback: Reuse existing supplier if company name matches
  const currentSuppliers = dbDataPre.suppliers || [];
  const matchedSupplier = currentSuppliers.find(s => 
    (rawPayload.supplier_id && String(s.id) === String(rawPayload.supplier_id)) || 
    (s.name && s.name.toLowerCase().trim() === validated.supplier_name.toLowerCase().trim())
  );

  const supplierId = matchedSupplier ? matchedSupplier.id : (rawPayload.supplier_id || `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const plantId = rawPayload.plant_id || `plant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const supplierObj = {
    id: supplierId,
    name: validated.supplier_name,
    contact_name: validated.contact_name || (matchedSupplier?.contact_name || ''),
    contact_person: validated.contact_name || (matchedSupplier?.contact_person || ''),
    contact_email: validated.contact_email || (matchedSupplier?.contact_email || ''),
    contact_phone: validated.contact_phone || (matchedSupplier?.contact_phone || ''),
    phone: validated.contact_phone || (matchedSupplier?.phone || ''),
    address: validated.address || (matchedSupplier?.address || ''),
    allotted_hours: validated.allotted_hours || (matchedSupplier?.allotted_hours || 0),
    created_at: matchedSupplier?.created_at || new Date().toISOString()
  };

  const plantObj = {
    id: plantId,
    name: validated.plant_name,
    city: validated.plant_city,
    address: validated.plant_address,
    supplier_ids: [supplierId],
    created_at: new Date().toISOString()
  };

  const projectObj = {
    id: projectId,
    name: validated.project_name,
    supplier_id: supplierId,
    supplier_name: validated.supplier_name,
    client_id: supplierId,
    plant_id: plantId,
    plant_name: validated.plant_name,
    rep_id: validated.rep_id,
    rep_name: resolvedRepName,
    scope_of_work: validated.project_name,
    po_hours: validated.allotted_hours,
    billing_rate: validated.billing_rate,
    pay_rate: validated.pay_rate,
    currency: validated.currency,
    status: 'active',
    start_date: validated.start_date
  };

  const rateObj = {
    id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rep_id: validated.rep_id,
    supplier_id: supplierId,
    plant_id: plantId,
    project_id: projectId,
    billing_rate: validated.billing_rate,
    pay_rate: validated.pay_rate,
    currency: validated.currency,
    created_at: new Date().toISOString()
  };

  // Save to Local Database
  saveEntity('suppliers', supplierObj);
  saveEntity('plants', plantObj);
  saveEntity('projects', projectObj);
  saveEntity('rates', rateObj);

  // Provision Customer User Account through canonical engine
  try {
    const provRes = provisionUser({
      name: validated.contact_name || `${validated.supplier_name} Quality Manager`,
      email: validated.contact_email || `${validated.supplier_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@client.com`,
      role: 'customer',
      supplier_id: supplierId,
      customer_id: supplierId,
      title: 'Client Quality Manager'
    });
    if (provRes?.user) {
      Promise.resolve(supabase.from('users').upsert(provRes.user)).catch(e => console.warn("[Supabase Cloud Customer Sync Warning]:", e));
    }
  } catch (provErr) {
    console.warn("[Onboarding Customer User Notice]:", provErr.message);
  }

  // Provision inline new rep if explicitly requested
  if (rawPayload.is_inline_new_rep && rawPayload.new_rep_user) {
    try {
      const provRepRes = provisionUser(rawPayload.new_rep_user);
      if (provRepRes?.user) {
        Promise.resolve(supabase.from('users').upsert(provRepRes.user)).catch(e => console.warn("[Supabase Cloud Rep Sync Warning]:", e));
      }
    } catch (provRepErr) {
      console.warn("[Onboarding Inline Rep Notice]:", provRepErr.message);
    }
  }

  // Clean project object for Supabase table upsert (only valid database columns)
  const dbProjectObj = {
    id: projectId,
    name: validated.project_name,
    supplier_id: supplierId,
    client_id: supplierId,
    plant_id: plantId,
    rep_id: validated.rep_id,
    po_hours: validated.allotted_hours,
    billing_rate: validated.billing_rate,
    pay_rate: validated.pay_rate,
    currency: validated.currency,
    status: 'active',
    start_date: validated.start_date
  };

  // Upsert to Supabase with Promise.resolve safety
  Promise.allSettled([
    Promise.resolve(supabase.from('suppliers').upsert(supplierObj)),
    Promise.resolve(supabase.from('plants').upsert(plantObj)),
    Promise.resolve(supabase.from('projects').upsert(dbProjectObj)),
    Promise.resolve(supabase.from('rates').upsert(rateObj))
  ]).then((results) => {
    results.forEach((res, idx) => {
      if (res.status === 'rejected' || (res.value && res.value.error)) {
        const err = res.reason || res.value?.error;
        console.warn(`[Supabase Onboarding Upsert ${idx}] Warning:`, err?.message || err);
      }
    });
  });

  window.dispatchEvent(new Event('ids_pulse_db_update'));

  return {
    supplier_id: supplierId,
    plant_id: plantId,
    project_id: projectId,
    rep_id: validated.rep_id
  };
}
