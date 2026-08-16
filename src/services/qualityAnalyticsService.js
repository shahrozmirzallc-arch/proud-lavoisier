// src/services/qualityAnalyticsService.js
// Authoritative Supplier Quality Intelligence, PPM Defect Rate Engine & Pareto Analytics

import { getEntities } from '../components/SharedDatabase.js';

export const isSupMatch = (rSup, targetSup) => {
  if (!rSup || !targetSup) return false;
  if (rSup === targetSup) return true;
  const s1 = String(rSup).toLowerCase().trim();
  const s2 = String(targetSup).toLowerCase().trim();
  if (s1 === s2) return true;
  const clean1 = s1.replace(/^sup_|^supplier_/, '').replace(/_/g, ' ');
  const clean2 = s2.replace(/^sup_|^supplier_/, '').replace(/_/g, ' ');
  return clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1);
};

/**
 * 1. Calculate industry-standard Parts Per Million (PPM) defect rate for a supplier or plant.
 * Formula: PPM = (Total Defective Pieces / Total Inspected Pieces) * 1,000,000
 *
 * @param {Object} [params]
 * @param {string} [params.supplierId] - Filter by supplier ID
 * @param {string} [params.plantId] - Filter by assembly plant ID
 * @param {string} [params.startDate] - ISO date string start filter
 * @param {string} [params.endDate] - ISO date string end filter
 * @returns {Object} PPM metrics summary
 */
export function calculateSupplierPPM({ supplierId, plantId, startDate, endDate } = {}) {
  const shiftReports = getEntities('shiftReports') || [];
  const incidents = getEntities('incidents') || [];

  // Filter shift reports based on criteria
  const filteredShifts = shiftReports.filter(sr => {
    if (!sr) return false;
    if (supplierId && !isSupMatch(sr.supplier_id || sr.client_id, supplierId)) return false;
    if (plantId && sr.plant_id !== plantId) return false;
    if (startDate && sr.date && sr.date < startDate) return false;
    if (endDate && sr.date && sr.date > endDate) return false;
    return true;
  });

  // Filter incidents based on criteria
  const filteredIncidents = incidents.filter(inc => {
    if (!inc) return false;
    if (supplierId && !isSupMatch(inc.supplier_id || inc.client_id, supplierId)) return false;
    if (plantId && inc.plant_id !== plantId) return false;
    const incDate = inc.date || (inc.created_at ? inc.created_at.split('T')[0] : null);
    if (startDate && incDate && incDate < startDate) return false;
    if (endDate && incDate && incDate > endDate) return false;
    return true;
  });

  // Calculate total inspected pieces across shift reports
  let totalInspected = 0;
  let shiftDefects = 0;
  filteredShifts.forEach(sr => {
    const inspected = Number(sr.inspected_count || sr.pieces_inspected || sr.parts_inspected || sr.total_inspected || 0);
    const defective = Number(sr.defective_count || sr.pieces_defective || sr.defect_count || 0);
    totalInspected += (isNaN(inspected) ? 0 : inspected);
    shiftDefects += (isNaN(defective) ? 0 : defective);
  });

  // Calculate total defect pieces across incidents
  let incidentDefects = 0;
  filteredIncidents.forEach(inc => {
    const defective = Number(inc.pieces_defective || inc.defect_quantity || inc.scrap_count || inc.affected_quantity || 0);
    incidentDefects += (isNaN(defective) ? 0 : defective);
  });

  const totalDefective = Math.max(shiftDefects, incidentDefects) || (shiftDefects + incidentDefects);

  if (totalInspected === 0) {
    return {
      ppm: 0,
      totalInspected: 0,
      totalDefective: totalDefective,
      passRate: '100.0%',
      ratingGrade: 'A',
      statusText: 'No Pieces Inspected',
      tier: 'unrated'
    };
  }

  const rawPpm = (totalDefective / totalInspected) * 1000000;
  const ppm = Math.round(rawPpm);
  const passRateNum = Math.max(0, 100 - ((totalDefective / totalInspected) * 100));
  const passRate = `${passRateNum.toFixed(1)}%`;

  let ratingGrade = 'A';
  let statusText = 'World Class (<50 PPM)';
  let tier = 'world_class';

  if (ppm > 200) {
    ratingGrade = 'C';
    statusText = 'Action Required (>200 PPM)';
    tier = 'action_required';
  } else if (ppm > 50) {
    ratingGrade = 'B';
    statusText = 'Acceptable (50-200 PPM)';
    tier = 'acceptable';
  }

  return {
    ppm,
    totalInspected,
    totalDefective,
    passRate,
    ratingGrade,
    statusText,
    tier
  };
}

/**
 * 2. Generate Pareto Root-Cause Defect Breakdown.
 * Groups quality defects by category, calculates frequency, defective volume, and cumulative 80/20 percentage.
 *
 * @param {Object} [filter]
 * @returns {Array<Object>} Pareto defect items sorted descending by defect quantity
 */
export function getDefectParetoAnalysis(filter = {}) {
  const incidents = getEntities('incidents') || [];

  const defectGroups = {};

  // Aggregate from incidents
  incidents.forEach(inc => {
    if (!inc) return;
    if (filter.supplierId && !isSupMatch(inc.supplier_id || inc.client_id, filter.supplierId)) return;
    if (filter.plantId && inc.plant_id !== filter.plantId) return;

    const rawDefect = inc.defect_type || inc.defect_description || inc.concern_classification || 'Unclassified Defect';
    const defectType = rawDefect.trim();
    const qty = Number(inc.pieces_defective || inc.defect_quantity || inc.affected_quantity || 1);

    if (!defectGroups[defectType]) {
      defectGroups[defectType] = {
        defectType,
        incidentCount: 0,
        totalQuantity: 0,
        criticalCount: 0,
        samplePartNumbers: new Set()
      };
    }

    defectGroups[defectType].incidentCount += 1;
    defectGroups[defectType].totalQuantity += (isNaN(qty) ? 1 : qty);
    if (String(inc.level_of_concern || inc.severity || '').toLowerCase() === 'critical') {
      defectGroups[defectType].criticalCount += 1;
    }
    if (inc.part_number) {
      defectGroups[defectType].samplePartNumbers.add(inc.part_number);
    }
  });

  // Calculate total defect volume
  const totalVolume = Object.values(defectGroups).reduce((acc, g) => acc + g.totalQuantity, 0);

  // Sort descending by totalQuantity
  const sorted = Object.values(defectGroups).sort((a, b) => b.totalQuantity - a.totalQuantity);

  let runningCumulative = 0;
  return sorted.map(item => {
    const percentage = totalVolume > 0 ? (item.totalQuantity / totalVolume) * 100 : 0;
    runningCumulative += percentage;

    return {
      defectType: item.defectType,
      incidentCount: item.incidentCount,
      totalQuantity: item.totalQuantity,
      criticalCount: item.criticalCount,
      percentage: Number(percentage.toFixed(1)),
      cumulativePercentage: Number(Math.min(100, runningCumulative).toFixed(1)),
      isParetoTop80: runningCumulative - percentage <= 80,
      partNumbers: Array.from(item.samplePartNumbers)
    };
  });
}

/**
 * 3. Generate authoritative Supplier Performance Scorecards.
 * Evaluates all suppliers across active projects, PPM rate, open incidents, and containment responsiveness.
 *
 * @returns {Array<Object>} Comprehensive supplier quality scorecards
 */
export function getSupplierQualityScorecards() {
  const suppliers = getEntities('suppliers') || [];
  const projects = getEntities('projects') || [];
  const incidents = getEntities('incidents') || [];
  const shiftReports = getEntities('shiftReports') || [];

  return suppliers.map(sup => {
    const supId = sup.id;
    const supProjects = projects.filter(p => isSupMatch(p.supplier_id || p.client_id || p.customer_id, supId));
    const supIncidents = incidents.filter(i => isSupMatch(i.supplier_id || i.client_id, supId));
    const openIncidents = supIncidents.filter(i => String(i.status || '').toLowerCase() !== 'closed' && String(i.status || '').toLowerCase() !== 'released');
    const criticalIncidents = supIncidents.filter(i => String(i.level_of_concern || i.severity || '').toLowerCase() === 'critical');

    const ppmStats = calculateSupplierPPM({ supplierId: supId });

    // Calculate total hours logged for this supplier
    let totalHours = 0;
    shiftReports.filter(sr => isSupMatch(sr.supplier_id || sr.client_id, supId)).forEach(sr => {
      totalHours += Number(sr.hours_worked || sr.total_hours || sr.hours || 0);
    });

    // Scorecard Grade Evaluation
    let grade = 'A';
    if (ppmStats.ppm > 200 || criticalIncidents.length >= 2) {
      grade = 'C';
    } else if (ppmStats.ppm > 50 || criticalIncidents.length === 1 || openIncidents.length >= 2) {
      grade = 'B';
    }

    return {
      supplierId: sup.id,
      supplierName: sup.name || sup.company_name || 'Automotive Supplier',
      contactPerson: sup.contact_person || sup.contact_name || 'Quality Manager',
      email: sup.email || 'quality@supplier.com',
      phone: sup.phone || '+1 (519) 555-0100',
      activeProjectsCount: supProjects.length,
      totalIncidentsCount: supIncidents.length,
      openIncidentsCount: openIncidents.length,
      criticalIncidentsCount: criticalIncidents.length,
      totalHoursLogged: Number(totalHours.toFixed(1)),
      totalInspectedPieces: ppmStats.totalInspected,
      totalDefectivePieces: ppmStats.totalDefective,
      ppm: ppmStats.ppm,
      passRate: ppmStats.passRate,
      grade,
      statusTier: ppmStats.tier,
      statusLabel: ppmStats.statusText
    };
  });
}
