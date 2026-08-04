// src/utils/shiftAreaUtils.js
// Authoritative Daily Quality Report Area Terminology & Compatibility Helpers

/**
 * Canonical 5 Daily Quality Report Area Names (in mandatory order)
 */
export const CANONICAL_SHIFT_AREAS = [
  'Install Area',
  'Sequence Area',
  'Heavy Repair',
  'Review Scrap Table',
  'SAC Department'
];

/**
 * Display-name compatibility mapping for legacy records.
 * - "Online assembly" -> "Install Area"
 * - "Heavy rework" -> "Heavy Repair"
 */
export function formatAreaName(name) {
  if (!name) return '';
  const str = String(name).trim();
  const lower = str.toLowerCase();
  if (lower === 'online assembly' || lower === 'install area') return 'Install Area';
  if (lower === 'sequence area') return 'Sequence Area';
  if (lower === 'heavy rework' || lower === 'heavy repair') return 'Heavy Repair';
  if (lower === 'review scrap table' || lower === 'scrap table') return 'Review Scrap Table';
  if (lower === 'sac department' || lower === 'sac dept') return 'SAC Department';
  return str;
}

/**
 * Normalizes legacy areas and merges them to guarantee the exact canonical 5 areas in order,
 * preserving statuses, notes, and contact info without creating duplicate areas.
 */
export function normalizeAndMergeShiftAreas(savedAreas = []) {
  const mergedMap = new Map();

  // Initialize canonical 5 defaults in order
  CANONICAL_SHIFT_AREAS.forEach((cName, idx) => {
    mergedMap.set(cName, {
      id: `wa_${idx + 1}`,
      name: cName,
      status: 'pending',
      contact: 'Martin',
      notes: ''
    });
  });

  if (Array.isArray(savedAreas) && savedAreas.length > 0) {
    savedAreas.forEach(item => {
      if (!item || !item.name) return;
      const formattedName = formatAreaName(item.name);
      const existing = mergedMap.get(formattedName);

      if (existing) {
        mergedMap.set(formattedName, {
          ...existing,
          status: item.status && item.status !== 'pending' ? item.status : (existing.status !== 'pending' ? existing.status : item.status || 'pending'),
          contact: item.contact || existing.contact,
          notes: item.notes ? item.notes : existing.notes
        });
      } else {
        // Preserves any additional custom area if present in DB
        mergedMap.set(formattedName, {
          id: item.id || `wa_custom_${Math.random().toString(36).substring(2, 6)}`,
          name: formattedName,
          status: item.status || 'pending',
          contact: item.contact || 'Plant Floor Contact',
          notes: item.notes || ''
        });
      }
    });
  }

  // Build final array preserving exact canonical order 1..5 followed by custom areas
  const result = [];
  CANONICAL_SHIFT_AREAS.forEach(cName => {
    if (mergedMap.has(cName)) {
      result.push(mergedMap.get(cName));
      mergedMap.delete(cName);
    }
  });

  // Append any remaining custom areas
  mergedMap.forEach(val => result.push(val));

  return result;
}
