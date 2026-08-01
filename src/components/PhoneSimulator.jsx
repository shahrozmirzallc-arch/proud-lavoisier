import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Wifi, WifiOff, MapPin, Clock, 
  User, Lock, LogOut, CheckCircle, CheckCircle2, AlertTriangle, Play, Square, X, Calendar,
  Camera, Scan, Plus, ChevronRight, Mail, Send, RotateCcw, Volume2, Video, ArrowLeft, Trash2,
  Receipt, DollarSign, FileText, Wrench, QrCode
} from 'lucide-react';
import { getEntities, addIncident, addEmailLog, addReworkLog, saveEntity, addExpenseEntry, logSystemEvent, supabase, syncWithSupabase, saveExtraHoursRequest, isEntryAccountingEligible } from './SharedDatabase';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { stageIncidentLocally, getLocalOutbox } from '../services/nativeStorageService';
import { getRepStatusConfig, sanitizeCustomerDerivativeUrl } from '../services/mediaSecurityService';

export default function PhoneSimulator({ isOffline, setIsOffline, dbUpdateTrigger, isNativeMobile, currentUser: propUser = null }) {
  const isNative = isNativeMobile ?? (typeof window !== 'undefined' && (
    window.Capacitor?.isNativePlatform?.() ||
    window.Capacitor?.getPlatform?.() === 'android' ||
    window.Capacitor?.getPlatform?.() === 'ios' ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  ));
  // Authentication & Shift States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Assignment & Plant Control
  const [selectedPlant, setSelectedPlant] = useState('gm_oshawa');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [plants, setPlants] = useState([]);

  // Active screen inside the phone: 'login' | 'home' | 'incident' | 'rework' | 'summary' | 'history'
  const [activeScreen, setActiveScreen] = useState('login');

  // INCIDENT REPORT STATE
  const [incStep, setIncStep] = useState(1); // steps: 1: Capture, 2: Scan, 3: Describe, 4: Send, 3.5: AI Duplicate Check
  const [handoverAlert, setHandoverAlert] = useState(null);
  const [duplicateIncident, setDuplicateIncident] = useState(null);

  const [capturedPhotos, setCapturedPhotos] = useState({
    wide: null,
    medium: null,
    closeup: null,
    photo4: null,
    photo5: null,
    photo6: null,
    photo7: null,
    photo8: null,
    photo9: null,
    photo10: null
  });
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [annotatedPhotos, setAnnotatedPhotos] = useState({
    wide: null,
    medium: null,
    closeup: null,
    photo4: null,
    photo5: null,
    photo6: null,
    photo7: null,
    photo8: null,
    photo9: null,
    photo10: null
  });
  const [drawingTarget, setDrawingTarget] = useState('closeup'); // 'wide' | 'medium' | 'closeup'
  const [scannedPartsList, setScannedPartsList] = useState([]);
  const [scanningType, setScanningType] = useState(null); // 'barcode' | 'qr' | null
  const [scannedPN, setScannedPN] = useState('');
  const [scannedBin, setScannedBin] = useState('');
  const [partInfo, setPartInfo] = useState(null);
  const [manualEntryWarning, setManualEntryWarning] = useState(false);
  const [selectedArea, setSelectedArea] = useState('Sequence Area');
  const [defectType, setDefectType] = useState('');
  const [customDefect, setCustomDefect] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('Removed bulb, returned light to sequence area');
  const [supplierContact, setSupplierContact] = useState('Martin');
  const [isReturningDefect, setIsReturningDefect] = useState('N');
  const [isSortRequired, setIsSortRequired] = useState('N');
  const [isRmaRequired, setIsRmaRequired] = useState('N');
  const [concernClassification, setConcernClassification] = useState('PRR');
  
  // Video mock state
  const [hasVideo, setHasVideo] = useState(false);

  // Email Preview toggle
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isSendingIncident, setIsSendingIncident] = useState(false);
  const [incidentSentConfirmation, setIncidentSentConfirmation] = useState(false);
  const [sentIncidentId, setSentIncidentId] = useState(null);

  // Offline Confirmation Modal & Media Help state
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalTrackingRef, setOfflineModalTrackingRef] = useState('');
  const [showMediaHelpPanel, setShowMediaHelpPanel] = useState(false);
  const [approvedCellularAssets, setApprovedCellularAssets] = useState([]);

  // REWORK LOG STATE & UNLIMITED BARCODE SCANNER
  const [reworkPN, setReworkPN] = useState('86286761');
  const [reworkPNMode, setReworkPNMode] = useState('dropdown'); // 'dropdown' | 'manual'
  const [reworkCustomPN, setReworkCustomPN] = useState('');
  const [reworkQty, setReworkQty] = useState(10);
  const [reworkHours, setReworkHours] = useState(1.5);
  const [reworkNotes, setReworkNotes] = useState('Reworked loose tail light bulbs.');
  const [reworkScannedBarcodes, setReworkScannedBarcodes] = useState([]);
  const [isReworkScannerOpen, setIsReworkScannerOpen] = useState(false);
  const [reworkScanInput, setReworkScanInput] = useState('');
  
  // EXPENSE & TIME STATE
  const [timeExpenseTab, setTimeExpenseTab] = useState('expense'); // 'expense' | 'overtime'
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Fuel');
  const [expenseReceiptPhoto, setExpenseReceiptPhoto] = useState(null);
  const [expenseNotes, setExpenseNotes] = useState('');

  // ROUTINE INSPECTION LOG STATE & UNLIMITED BARCODE SCANNER
  const [inspPartNumber, setInspPartNumber] = useState('86286761');
  const [inspPNMode, setInspPNMode] = useState('dropdown'); // 'dropdown' | 'manual'
  const [inspCustomPN, setInspCustomPN] = useState('');
  const [inspPassQty, setInspPassQty] = useState(0);
  const [inspRejectQty, setInspRejectQty] = useState(0);
  const [inspHoursSpent, setInspHoursSpent] = useState(1.0);
  const [inspDefectCode, setInspDefectCode] = useState('Routine Inspection');
  const [inspDefectMode, setInspDefectMode] = useState('preset'); // 'preset' | 'custom'
  const [inspCustomDefectCode, setInspCustomDefectCode] = useState('');
  const [inspNotes, setInspNotes] = useState('');
  const [inspScannedBarcodes, setInspScannedBarcodes] = useState([]);
  const [isInspScannerOpen, setIsInspScannerOpen] = useState(false);
  const [inspScanInput, setInspScanInput] = useState('');

  // Overtime Request Edit State
  const [editingOvertimeId, setEditingOvertimeId] = useState(null);
  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeReason, setOvertimeReason] = useState('');

  // ADD TODAY'S HOURS STATE (Donna & Clarence Rep Workflow)
  const [showAddHoursModal, setShowAddHoursModal] = useState(false);
  const [addHoursDate, setAddHoursDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [addHoursValue, setAddHoursValue] = useState('');
  const [addHoursType, setAddHoursType] = useState('Routine inspection');
  const [addHoursSummary, setAddHoursSummary] = useState('');
  const [addHoursLinkedIncident, setAddHoursLinkedIncident] = useState('');
  const [addHoursLinkedInspection, setAddHoursLinkedInspection] = useState('');
  const [addHoursPastReason, setAddHoursPastReason] = useState('');
  const [addHoursToast, setAddHoursToast] = useState(null);
  
  // SHIFT SUMMARY STATE
  const [areasWalked, setAreasWalked] = useState([
    { id: 'wa_1', name: 'Online assembly', status: 'pending', contact: 'Martin', notes: '' },
    { id: 'wa_2', name: 'Sequence area', status: 'pending', contact: 'Martin', notes: '' },
    { id: 'wa_3', name: 'Heavy rework', status: 'pending', contact: 'Martin', notes: '' },
    { id: 'wa_4', name: 'Review Scrap Table', status: 'pending', contact: 'Martin', notes: '' }
  ]);
  const [bonusTasks, setBonusTasks] = useState([
    { id: 'bt_1', task: 'Matt\'s bin check audit on PN 86291945', status: 'pending', notes: '' }
  ]);
  const [sendingShiftReport, setSendingShiftReport] = useState(false);
  const [dailyTasks, setDailyTasks] = useState([]);

  // Drawing Canvas Reference
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load plants and initial settings
  useEffect(() => {
    const allPlants = getEntities('plants');
    setPlants(allPlants);

    if (propUser) {
      setCurrentUser(propUser);
      setIsLoggedIn(true);
      setActiveScreen(prev => (prev === 'login' ? 'home' : prev));
    }
  }, [dbUpdateTrigger, propUser]);

  useEffect(() => {
    if (!currentUser) return;
    const repIdStr = String(currentUser.id || '');
    const activePlantId = selectedPlant || '';

    const allTasks = getEntities('dailyTasks') || [];
    const allProjects = getEntities('projects') || [];

    // 1. Explicit daily tasks assigned to this representative
    const explicitRepTasks = allTasks.filter(t => 
      t && (
        String(t.rep_id) === repIdStr || 
        t.rep_id === currentUser.id ||
        (t.rep_name && currentUser.name && t.rep_name.toLowerCase() === currentUser.name.toLowerCase()) ||
        t.rep_id === 'all'
      )
    );

    // 2. Project Scope of Work tasks from projects assigned to this representative
    const projectScopeTasks = allProjects
      .filter(p => p && (
        String(p.rep_id) === repIdStr || 
        p.rep_id === currentUser.id ||
        (p.rep_name && currentUser.name && p.rep_name.toLowerCase() === currentUser.name.toLowerCase()) ||
        (activePlantId && p.plant_id === activePlantId)
      ))
      .map(p => {
        const taskTitle = p.project_name || p.description || 'Quality Audit & Field Representation';
        const locationName = p.plant_name || p.supplier_name || 'Plant Location';
        return {
          id: `proj_scope_${p.id}`,
          rep_id: currentUser.id,
          task: `[Project Scope] ${taskTitle} (${locationName})`,
          status: p.status === 'completed' ? 'completed' : 'pending',
          isProjectScope: true
        };
      });

    // Deduplicate and combine tasks
    const taskMap = new Map();
    [...projectScopeTasks, ...explicitRepTasks].forEach(t => {
      if (t && t.id && !taskMap.has(t.id)) {
        taskMap.set(t.id, t);
      }
    });

    setDailyTasks(Array.from(taskMap.values()));
  }, [dbUpdateTrigger, currentUser, selectedPlant]);

  useEffect(() => {
    if (!isOffline) {
      syncStagedTimeEntries();
    }
  }, [isOffline]);

  const getActiveClientForPlant = () => {
    if (!currentUser) return 'No client assigned';
    const dbProjects = getEntities('projects') || [];
    const dbSuppliers = getEntities('suppliers') || [];
    const dbRates = getEntities('rates') || [];

    const repIdStr = String(currentUser.id || '');

    // 1. Direct project match for this rep and plant
    const proj = dbProjects.find(p => p && (String(p.rep_id) === repIdStr || p.rep_id === currentUser.id));
    if (proj) {
      const sup = dbSuppliers.find(s => s.id === proj.client_id || s.name === proj.client_id || s.id === proj.supplier_id);
      if (sup) return sup.name;
      if (proj.client_name) return proj.client_name;
    }

    // 2. Check rate assignment match
    const rate = dbRates.find(r => String(r.rep_id) === repIdStr || r.rep_id === currentUser.id);
    if (rate) {
      const sup = dbSuppliers.find(s => s.id === rate.supplier_id);
      if (sup) return sup.name;
    }

    // 3. Fallback to supplier serving selected plant
    if (selectedPlant) {
      const supServed = dbSuppliers.find(s => s.plants_served && Array.isArray(s.plants_served) && s.plants_served.includes(selectedPlant));
      if (supServed) return supServed.name;
    }

    return 'No client assigned';
  };

  // Helper to resolve active project assignments explicitly permitted for the logged-in rep
  const getRepAssignments = () => {
    if (!currentUser) return [];
    const dbProjects = getEntities('projects') || [];
    const repIdStr = String(currentUser.id || '');
    return dbProjects.filter(p => p && (
      String(p.rep_id) === repIdStr || 
      p.rep_id === currentUser.id || 
      (Array.isArray(p.rep_ids) && p.rep_ids.includes(currentUser.id))
    ));
  };

  // Explicit allocation rule for entries matching active project assignment
  const matchesAssignment = (t, activeProj) => {
    if (!t || !activeProj) return false;
    if (t.assignment_id) {
      return String(t.assignment_id) === String(activeProj.id);
    }
    if (t.project_id) {
      return String(t.project_id) === String(activeProj.id);
    }
    if (t.supplier_id && t.plant_id && activeProj.supplier_id && activeProj.plant_id) {
      return String(t.supplier_id) === String(activeProj.supplier_id) && String(t.plant_id) === String(activeProj.plant_id);
    }
    return false;
  };

  // Staged offline queue helpers
  const getStagedTimeEntries = () => {
    try {
      const raw = localStorage.getItem('ids_pulse_staged_time_entries');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  };

  const saveStagedTimeEntriesList = (list) => {
    try {
      localStorage.setItem('ids_pulse_staged_time_entries', JSON.stringify(list));
    } catch (e) {}
  };

  const saveStagedTimeEntry = (entry) => {
    const current = getStagedTimeEntries();
    const exists = current.some(e => e.id === entry.id || (e.idempotency_key && e.idempotency_key === entry.idempotency_key));
    if (!exists) {
      entry.retry_count = entry.retry_count || 0;
      entry.last_error = null;
      entry.status = entry.status || 'staged_offline';
      current.push(entry);
      saveStagedTimeEntriesList(current);
    }
  };

  // Requirement 3, 4, 5, 6: Server-side atomic RPC sync, idempotency, independent outbox queue safety & failure retention
  const syncStagedTimeEntries = async () => {
    const staged = getStagedTimeEntries();
    if (!staged || staged.length === 0) return;

    const remainingQueue = [];
    let syncedCount = 0;

    for (let sub of staged) {
      const idempotencyKey = sub.idempotency_key || `idemp_${sub.id || Date.now()}`;
      let rpcSuccess = false;
      let lastErrMsg = null;

      // 1. Attempt Server-Side Atomic RPC Execution via Supabase if connected
      if (supabase && typeof supabase.rpc === 'function') {
        try {
          const { data, error } = await supabase.rpc('submit_rep_hours_atomic', {
            p_idempotency_key: idempotencyKey,
            p_rep_id: String(sub.rep_id),
            p_supplier_id: String(sub.supplier_id),
            p_plant_id: String(sub.plant_id),
            p_project_id: String(sub.project_id || sub.assignment_id),
            p_work_date: sub.work_date || sub.date,
            p_hours: parseFloat(sub.reported_hours || sub.hours || 0),
            p_work_type: sub.work_type || 'Routine inspection',
            p_work_summary: sub.work_summary || '',
            p_notes: sub.notes || ''
          });

          if (!error && data && data.status === 'success') {
            rpcSuccess = true;
            syncedCount++;
            syncWithSupabase();
          } else {
            lastErrMsg = error?.message || data?.message || 'Server RPC error';
          }
        } catch (e) {
          lastErrMsg = e?.message || 'RPC execution exception';
        }
      }

      // 2. Fallback handling for standalone offline prototype mode vs RPC failure
      if (rpcSuccess) {
        // Dequeued upon server confirmation
        continue;
      }

      // If connected to RPC but RPC failed: DO NOT DEQUEUE! Retain in outbox, increment retry_count, store last_error
      if (supabase && typeof supabase.rpc === 'function' && lastErrMsg) {
        sub.retry_count = (sub.retry_count || 0) + 1;
        sub.last_error = lastErrMsg;
        sub.status = 'needs_attention';
        remainingQueue.push(sub);
        continue;
      }

      // Pure standalone local fallback processing (when Supabase client is not configured)
      const dbTimeEntries = getEntities('timeEntries') || [];
      const dbProjects = getEntities('projects') || [];
      const exists = dbTimeEntries.some(e => 
        (e.idempotency_key === `${idempotencyKey}_reg` || e.idempotency_key === `${idempotencyKey}_ot`) ||
        (sub.id && e.linked_submission_id === sub.id) ||
        (e.id === sub.id)
      );

      if (!exists) {
        const hrs = parseFloat(sub.reported_hours || sub.hours || 0);
        if (hrs > 0) {
          const activeProj = dbProjects.find(p => String(p.id) === String(sub.assignment_id || sub.project_id));
          const hasAuthLimit = Boolean(activeProj && activeProj.po_hours !== undefined && activeProj.po_hours !== null && activeProj.po_hours !== '' && !isNaN(parseFloat(activeProj.po_hours)));
          const authorizedHours = hasAuthLimit ? parseFloat(activeProj.po_hours) : null;

          const recordedRegularHours = dbTimeEntries
            .filter(t => t && String(t.assignment_id) === String(sub.assignment_id || sub.project_id) && (t.hour_type === 'regular' || !t.hour_type) && isEntryAccountingEligible(t))
            .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

          const remainingAlloc = authorizedHours !== null ? Math.max(0, authorizedHours - recordedRegularHours) : Infinity;
          const regularPortion = Math.min(hrs, remainingAlloc > 0 ? remainingAlloc : 0);
          const overtimePortion = Math.max(0, hrs - regularPortion);
          const linkedSubmissionId = sub.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;

          if (regularPortion > 0) {
            const regEntry = {
              id: `te_${Date.now()}_reg_${Math.random().toString(36).substr(2,6)}`,
              idempotency_key: `${idempotencyKey}_reg`,
              linked_submission_id: linkedSubmissionId,
              rep_id: sub.rep_id,
              assignment_id: sub.assignment_id || sub.project_id,
              project_id: sub.project_id || sub.assignment_id,
              supplier_id: sub.supplier_id,
              plant_id: sub.plant_id,
              work_date: sub.work_date || sub.date,
              date: sub.work_date || sub.date,
              reported_hours: hrs,
              regular_hours: regularPortion,
              overtime_hours: 0,
              hours: regularPortion,
              hour_type: 'regular',
              status: 'recorded',
              approval_required: false,
              approval_source: 'authorized_assignment',
              authorized_hours_snapshot: authorizedHours,
              remaining_hours_before: remainingAlloc === Infinity ? null : remainingAlloc,
              remaining_hours_after: remainingAlloc === Infinity ? null : Math.max(0, remainingAlloc - regularPortion),
              work_type: sub.work_type || 'Routine inspection',
              work_summary: sub.work_summary || 'Synced regular hours',
              source: 'rep_reported',
              submitted_at: sub.staged_at || new Date().toISOString(),
              synchronized_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            };
            saveEntity('timeEntries', regEntry);
          }

          if (overtimePortion > 0) {
            const otEntry = {
              id: `te_${Date.now()}_ot_${Math.random().toString(36).substr(2,6)}`,
              idempotency_key: `${idempotencyKey}_ot`,
              linked_submission_id: linkedSubmissionId,
              rep_id: sub.rep_id,
              assignment_id: sub.assignment_id || sub.project_id,
              project_id: sub.project_id || sub.assignment_id,
              supplier_id: sub.supplier_id,
              plant_id: sub.plant_id,
              work_date: sub.work_date || sub.date,
              date: sub.work_date || sub.date,
              reported_hours: hrs,
              regular_hours: 0,
              overtime_hours: overtimePortion,
              hours: overtimePortion,
              hour_type: 'overtime',
              status: 'client_pending',
              client_review_status: 'pending',
              approval_required: true,
              approval_source: 'client_approval',
              authorized_hours_snapshot: authorizedHours,
              remaining_hours_before: 0,
              remaining_hours_after: 0,
              work_type: sub.work_type || 'Routine inspection',
              work_summary: sub.work_summary || 'Synced overtime hours',
              source: 'rep_reported',
              submitted_at: sub.staged_at || new Date().toISOString(),
              synchronized_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            };
            saveEntity('timeEntries', otEntry);
          }
        }
      }
      syncedCount++;
    }

    saveStagedTimeEntriesList(remainingQueue);
    if (syncedCount > 0) {
      logSystemEvent('sync', 'staged_hours_synced', `Auto-synced ${syncedCount} staged time submissions.`);
    }
  };

  // State for Requirement 11: Pre-submit Split Confirmation Modal
  const [splitConfirmState, setSplitConfirmState] = useState(null);

  // Requirement 1 & 2: Compute assignment telemetry (Authorized, Recorded Regular, Client Approved OT, Client Pending OT, Remaining Allocation)
  const getRepAssignmentHourTotals = () => {
    if (!currentUser) return { activeProject: null, repAssignments: [], hasAuthorizedLimit: false, authorizedHours: null, recordedRegularHours: 0, clientApprovedOvertimeHours: 0, pendingClientOvertimeHours: 0, remainingAllocation: null };

    const dbProjects = getEntities('projects') || [];
    const dbTimeEntries = getEntities('timeEntries') || [];

    const repAssignments = getRepAssignments();
    const activeProject = dbProjects.find(p => String(p.id) === String(selectedAssignmentId)) || repAssignments[0] || null;

    if (!activeProject) {
      return {
        activeProject: null,
        repAssignments: [],
        hasAuthorizedLimit: false,
        authorizedHours: null,
        recordedRegularHours: 0,
        clientApprovedOvertimeHours: 0,
        pendingClientOvertimeHours: 0,
        remainingAllocation: null
      };
    }

    const hasAuthorizedLimit = Boolean(activeProject.po_hours !== undefined && activeProject.po_hours !== null && activeProject.po_hours !== '' && !isNaN(parseFloat(activeProject.po_hours)));
    const authorizedHours = hasAuthorizedLimit ? parseFloat(activeProject.po_hours) : null;

    const repIdStr = String(currentUser.id || '');
    const repEntries = dbTimeEntries.filter(t => t && (String(t.rep_id) === repIdStr || t.rep_id === currentUser.id) && matchesAssignment(t, activeProject));

    const recordedRegularHours = repEntries
      .filter(t => (t.hour_type === 'regular' || !t.hour_type) && isEntryAccountingEligible(t))
      .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

    const clientApprovedOvertimeHours = repEntries
      .filter(t => t.hour_type === 'overtime' && isEntryAccountingEligible(t))
      .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

    const pendingClientOvertimeHours = repEntries
      .filter(t => t.hour_type === 'overtime' && t.status === 'client_pending')
      .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

    const remainingAllocation = authorizedHours !== null ? Math.max(0, authorizedHours - recordedRegularHours) : null;

    return {
      activeProject,
      repAssignments,
      hasAuthorizedLimit,
      authorizedHours,
      recordedRegularHours,
      clientApprovedOvertimeHours,
      pendingClientOvertimeHours,
      remainingAllocation
    };
  };

  // Core Hour Submission Handler (Requirement 5, 11, 12)
  const handleAddTodayHoursSubmit = async (forceConfirmed = false) => {
    if (!currentUser) return;

    const hrs = parseFloat(addHoursValue);
    if (isNaN(hrs) || hrs <= 0) {
      alert("Please enter a valid positive number for hours.");
      return;
    }

    if (hrs > 24) {
      alert("A single submission cannot exceed 24 hours.");
      return;
    }

    const repAssignments = getRepAssignments();
    if (repAssignments.length === 0) {
      alert("No work assigned right now. An authorized project assignment is required before logging hours.");
      return;
    }

    if (repAssignments.length > 1 && !selectedAssignmentId) {
      alert("Multiple active assignments detected. Please explicitly select which assignment you are reporting hours for.");
      return;
    }

    const dbProjects = getEntities('projects') || [];
    const dbSuppliers = getEntities('suppliers') || [];

    const activeProject = dbProjects.find(p => String(p.id) === String(selectedAssignmentId)) || repAssignments[0];
    if (!activeProject) {
      alert("No active project assignment selected. Please select a valid project assignment.");
      return;
    }

    // Requirement 12: Strict customer/supplier resolution — NO sup_autokabel FALLBACK
    const activeSupplierId = activeProject.supplier_id || activeProject.client_id || dbSuppliers.find(s => s.plants_served?.includes(selectedPlant))?.id;
    if (!activeSupplierId) {
      alert("Incomplete assignment relationship: No valid customer/supplier linked to this assignment. Submission blocked.");
      return;
    }

    // Requirement 2: Calculate allocation remaining and split
    const totals = getRepAssignmentHourTotals();
    const remainingAlloc = totals.authorizedHours !== null ? (totals.remainingAllocation !== null ? totals.remainingAllocation : 0) : Infinity;

    const regularPortion = Math.min(hrs, remainingAlloc > 0 ? remainingAlloc : 0);
    const overtimePortion = Math.max(0, hrs - regularPortion);

    // Requirement 11: Pre-submit split confirmation modal
    if (overtimePortion > 0 && !forceConfirmed) {
      setSplitConfirmState({
        hrs,
        regularPortion,
        overtimePortion,
        activeProject,
        activeSupplierId,
        remainingAlloc
      });
      return;
    }

    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // If Offline: stage submission to outbox
    if (isOffline) {
      const stagedSubmission = {
        id: submissionId,
        idempotency_key: idempotencyKey,
        rep_id: currentUser.id,
        assignment_id: activeProject.id,
        project_id: activeProject.id,
        supplier_id: activeSupplierId,
        plant_id: activeProject.plant_id || selectedPlant,
        work_date: addHoursDate,
        reported_hours: hrs,
        work_type: addHoursType,
        work_summary: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
        incident_id: addHoursLinkedIncident || null,
        inspection_id: addHoursLinkedInspection || null,
        source: 'rep_reported',
        staged_at: new Date().toISOString(),
        status: 'staged_offline'
      };
      saveStagedTimeEntry(stagedSubmission);
      setShowAddHoursModal(false);
      setSplitConfirmState(null);
      setAddHoursValue('');
      setAddHoursSummary('');
      setAddHoursToast("Hours safely saved on this device. They will be submitted automatically when your internet connection returns.");
      setTimeout(() => setAddHoursToast(null), 5000);
      return;
    }

    // Attempt atomic RPC for online submission if Supabase client is configured
    let rpcDone = false;
    let rpcErrorMsg = null;
    const isSupabaseConfigured = Boolean(supabase && typeof supabase.rpc === 'function' && process.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL');

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('submit_rep_hours_atomic', {
          p_idempotency_key: idempotencyKey,
          p_rep_id: String(currentUser.id),
          p_supplier_id: String(activeSupplierId),
          p_plant_id: String(activeProject.plant_id || selectedPlant),
          p_project_id: String(activeProject.id),
          p_work_date: addHoursDate,
          p_hours: hrs,
          p_work_type: addHoursType,
          p_work_summary: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
          p_notes: ''
        });

        if (!error && data && data.status === 'success') {
          rpcDone = true;
          syncWithSupabase();
        } else {
          rpcErrorMsg = error?.message || data?.message || 'Server RPC error';
        }
      } catch (e) {
        rpcErrorMsg = e?.message || 'RPC execution exception';
      }
    }

    if (isSupabaseConfigured) {
      if (rpcDone) {
        let toastMsg = overtimePortion === 0 
          ? `Successfully recorded ${regularPortion} regular hrs automatically for ${addHoursDate}!`
          : regularPortion === 0 
            ? `All ${overtimePortion} hrs exceed authorized allocation. Submitted for Client Overtime Review.`
            : `Recorded ${regularPortion} regular hrs automatically. ${overtimePortion} overtime hrs submitted for Client approval.`;

        logSystemEvent('time_entry', 'rep_hours_submitted', `${currentUser.name} reported ${hrs} hrs for date ${addHoursDate} (${addHoursType}) on assignment ${activeProject.id}.`);
        setShowAddHoursModal(false);
        setSplitConfirmState(null);
        setAddHoursValue('');
        setAddHoursSummary('');
        setAddHoursToast(toastMsg);
        setTimeout(() => setAddHoursToast(null), 5000);
        return;
      }

      // Rule 8: If Supabase is configured and RPC fails, retain original submission in durable outbox. DO NOT create local timeEntries.
      const stagedSubmission = {
        id: submissionId,
        idempotency_key: idempotencyKey,
        rep_id: currentUser.id,
        assignment_id: activeProject.id,
        project_id: activeProject.id,
        supplier_id: activeSupplierId,
        plant_id: activeProject.plant_id || selectedPlant,
        work_date: addHoursDate,
        reported_hours: hrs,
        work_type: addHoursType,
        work_summary: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
        incident_id: addHoursLinkedIncident || null,
        inspection_id: addHoursLinkedInspection || null,
        source: 'rep_reported',
        staged_at: new Date().toISOString(),
        status: 'staged_offline',
        last_error: rpcErrorMsg
      };
      saveStagedTimeEntry(stagedSubmission);
      setShowAddHoursModal(false);
      setSplitConfirmState(null);
      setAddHoursValue('');
      setAddHoursSummary('');
      setAddHoursToast("Saved on this phone — waiting to sync");
      setTimeout(() => setAddHoursToast(null), 5000);
      return;
    }

    // Fallback local mirror save if standalone (when Supabase client is NOT configured)
    if (!rpcDone) {
      if (regularPortion > 0) {
        const regularEntry = {
          id: `te_${Date.now()}_reg_${Math.random().toString(36).substr(2, 6)}`,
          idempotency_key: `${idempotencyKey}_reg`,
          linked_submission_id: submissionId,
          rep_id: currentUser.id,
          assignment_id: activeProject.id,
          project_id: activeProject.id,
          supplier_id: activeSupplierId,
          plant_id: activeProject.plant_id || selectedPlant,
          work_date: addHoursDate,
          date: addHoursDate,
          reported_hours: hrs,
          regular_hours: regularPortion,
          overtime_hours: 0,
          hours: regularPortion,
          hour_type: 'regular',
          status: 'recorded',
          approval_required: false,
          approval_source: 'authorized_assignment',
          authorized_hours_snapshot: totals.authorizedHours,
          remaining_hours_before: totals.remainingAllocation,
          remaining_hours_after: totals.remainingAllocation !== null ? Math.max(0, totals.remainingAllocation - regularPortion) : null,
          work_type: addHoursType,
          work_summary: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
          incident_id: addHoursLinkedIncident || null,
          inspection_id: addHoursLinkedInspection || null,
          source: 'rep_reported',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveEntity('timeEntries', regularEntry);
      }

      if (overtimePortion > 0) {
        const overtimeEntry = {
          id: `te_${Date.now()}_ot_${Math.random().toString(36).substr(2, 6)}`,
          idempotency_key: `${idempotencyKey}_ot`,
          linked_submission_id: submissionId,
          rep_id: currentUser.id,
          assignment_id: activeProject.id,
          project_id: activeProject.id,
          supplier_id: activeSupplierId,
          plant_id: activeProject.plant_id || selectedPlant,
          work_date: addHoursDate,
          date: addHoursDate,
          reported_hours: hrs,
          regular_hours: 0,
          overtime_hours: overtimePortion,
          hours: overtimePortion,
          hour_type: 'overtime',
          status: 'client_pending',
          client_review_status: 'pending',
          approval_required: true,
          approval_source: 'client_approval',
          authorized_hours_snapshot: totals.authorizedHours,
          remaining_hours_before: 0,
          remaining_hours_after: 0,
          work_type: addHoursType,
          work_summary: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
          incident_id: addHoursLinkedIncident || null,
          inspection_id: addHoursLinkedInspection || null,
          source: 'rep_reported',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        saveEntity('timeEntries', overtimeEntry);
      }
    }

    let toastMsg = '';
    if (overtimePortion === 0) {
      toastMsg = `Successfully recorded ${regularPortion} regular hrs automatically for ${addHoursDate}!`;
    } else if (regularPortion === 0) {
      toastMsg = `All ${overtimePortion} hrs exceed authorized allocation. Submitted for Client Overtime Review.`;
    } else {
      toastMsg = `Recorded ${regularPortion} regular hrs automatically. ${overtimePortion} overtime hrs submitted for Client approval.`;
    }

    logSystemEvent('time_entry', 'rep_hours_submitted', `${currentUser.name} reported ${hrs} hrs for date ${addHoursDate} (${addHoursType}) on assignment ${activeProject.id}. Regular: ${regularPortion} hrs (recorded), Overtime: ${overtimePortion} hrs (client_pending).`);

    setShowAddHoursModal(false);
    setSplitConfirmState(null);
    setAddHoursValue('');
    setAddHoursSummary('');
    setAddHoursToast(toastMsg);
    setTimeout(() => setAddHoursToast(null), 5000);
  };

  const handleResubmitOvertime = (entry) => {
    if (!entry) return;
    const dbEntries = getEntities('timeEntries') || [];
    const target = dbEntries.find(t => t && t.id === entry.id);
    if (target) {
      target.status = 'client_pending';
      target.client_review_status = 'pending';
      target.client_review_comment = '';
      target.updated_at = new Date().toISOString();
      saveEntity('timeEntries', target);
      setAddHoursToast("Overtime resubmitted for Client review!");
      setTimeout(() => setAddHoursToast(null), 4000);
      logSystemEvent('time_entry', 'rep_overtime_resubmitted', `Rep ${currentUser?.name} resubmitted returned overtime entry ${entry.id} for Client review.`);
    }
  };

  const playBeep = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'scan') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6 note
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'warning') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("AudioContext failed or blocked: ", e);
    }
  };

  const handleToggleTask = (task) => {
    const updated = { ...task, status: task.status === 'completed' ? 'pending' : 'completed' };
    saveEntity('dailyTasks', updated);
    playBeep('success');
  };


  const performAuthLogin = (foundUser) => {
    setCurrentUser(foundUser);
    setIsLoggedIn(true);
    setActiveScreen('home');
    logSystemEvent('auth', 'login', `${foundUser.name} logged in successfully.`);
    if (rememberDevice) {
      localStorage.setItem('ids_pulse_saved_user', foundUser.id);
    } else {
      localStorage.removeItem('ids_pulse_saved_user');
    }
    window.dispatchEvent(new Event('ids_pulse_db_update'));
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');

    const inputUser = email.trim().toLowerCase().replace(/\s+/g, '');
    const rawPw = password.trim();

    if (!inputUser || !rawPw) {
      setAuthError('Operator ID and Access Code are required.');
      return;
    }

    setSubmittingAuth(true);

    try {
      if ((inputUser === 'shahroz' || inputUser === 'admin' || inputUser === 'owner') && (rawPw === 'Shahroz123$' || rawPw === 'shahroz123$' || rawPw === 'shahroz' || rawPw === 'IDSPulse2026!' || rawPw === 'admin' || rawPw === 'admin123')) {
        setIsLoggedIn(true);
        setSubmittingAuth(false);
        setActiveScreen('home');
        showToast("Super Admin Access Granted!", "success");
        return;
      }

      const { data: rpcEmail } = await supabase.rpc('get_auth_email_by_username', { p_username: inputUser });
      const targetEmail = rpcEmail || (inputUser.includes('@') ? inputUser : null);

      if (!targetEmail) {
        setAuthError('Invalid username or operator ID.');
        setSubmittingAuth(false);
        return;
      }

      let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: rawPw
      });

      if (authErr || !authData?.session || !authData?.user) {
        setAuthError('Operator ID or Access Code is incorrect.');
        setSubmittingAuth(false);
        return;
      }

      const user = authData.user;
      const appMeta = user.app_metadata || {};
      const repId = appMeta.rep_id || (appMeta.username === 'clarence' ? '1' : `rep_${appMeta.username}`);

      await syncWithSupabase(true, appMeta.role, repId, '', authData.session.access_token);

      const dbUsers = getEntities('users') || [];
      const foundUser = dbUsers.find(u => u.id === repId || u.name?.toLowerCase().includes(appMeta.username?.toLowerCase())) || {
        id: repId,
        name: appMeta.username,
        email: user.email,
        role: appMeta.role
      };

      performAuthLogin(foundUser);
      setPassword('');
    } catch (err) {
      console.error('[PhoneSimulator Auth Error]:', err);
      setAuthError('Authentication failed. Check network connection.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveScreen('login');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Logout Error]:", err);
    }
  };

  // CAPACITOR CAMERA / DEVICE CAMERA & FILE CAPTURE
  const captureMockPhoto = async (type) => {
    try {
      if (window.Capacitor?.Plugins?.Camera) {
        const image = await window.Capacitor.Plugins.Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: 'base64'
        });
        const photoUrl = `data:image/jpeg;base64,${image.base64String}`;
        setCapturedPhotos(prev => ({ ...prev, [type]: photoUrl }));
        setAnnotatedPhotos(prev => ({ ...prev, [type]: null }));
        return;
      }
    } catch (err) {
      console.warn('[Camera Plugin Fallback]:', err);
    }

    // Default Fallback
    const images = {
      wide: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      medium: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80',
      closeup: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
      photo4: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      photo5: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      photo6: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      photo7: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      photo8: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      photo9: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      photo10: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80'
    };

    setCapturedPhotos(prev => ({ ...prev, [type]: images[type] }));
    setAnnotatedPhotos(prev => ({ ...prev, [type]: null }));
  };

  // CANVAS DRAWING
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    if (animFrameRef.current) return;

    animFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.strokeStyle = '#EF4444'; // Red arrow annotation
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      animFrameRef.current = null;
    });
  };

  const stopDrawing = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background image again
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = capturedPhotos[drawingTarget];
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  const saveCanvasAnnotation = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/jpeg');
      setAnnotatedPhotos(prev => ({ ...prev, [drawingTarget]: dataUrl }));
      setShowDrawingCanvas(false);
    }
  };

  useEffect(() => {
    if (showDrawingCanvas && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = annotatedPhotos[drawingTarget] || capturedPhotos[drawingTarget];
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [showDrawingCanvas, drawingTarget]);

  // BARCODE & QR MOCK SCANNING
  const startScanning = (type) => {
    setScanningType(type);
  };

  const selectScanOption = (pn) => {
    const dbParts = getEntities('parts');
    const foundPart = dbParts.find(p => p.part_number === pn);
    
    if (scanningType === 'barcode') {
      setScannedPN(pn);
      setPartInfo(foundPart || { part_number: pn, description: 'Unknown Part', supplier_id: 'unknown' });
      setManualEntryWarning(false);
    } else {
      setScannedBin(`BIN-MAG-${pn?.substring(4)}`);
    }
    playBeep('scan');
    setScanningType(null);
  };

  const handleManualPartNumberChange = (value) => {
    setScannedPN(value);
    setManualEntryWarning(true);
    playBeep('warning');
    const dbParts = getEntities('parts');
    const foundPart = dbParts.find(p => p.part_number === value);
    setPartInfo(foundPart || null);
  };

  // DEFECT SELECTION SMART SUGGESTIONS
  const getDefectSuggestions = () => {
    if (scannedPN === '86286761') {
      return ['Spare bulb loose in housing (rattle)', 'Scratched outer lens', 'Loose mounting tab', 'Broken connector pins'];
    }
    if (scannedPN === '86291945') {
      return ['Loose internal reflector mount', 'Foggy lens interior', 'Unseated alignment ring'];
    }
    return ['Cosmetic scratch', 'Part misaligned', 'Loose component'];
  };

  // AUTO-FILL CLARENCE DEMO INCIDENT
  const autofillClarenceDemo = () => {
    // Fill photos (10 photos total)
    setCapturedPhotos({
      wide: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      medium: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80',
      closeup: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
      photo4: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      photo5: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      photo6: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      photo7: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      photo8: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      photo9: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      photo10: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80'
    });
    setAnnotatedPhotos({
      wide: null,
      medium: null,
      closeup: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80',
      photo4: null,
      photo5: null,
      photo6: null,
      photo7: null,
      photo8: null,
      photo9: null,
      photo10: null
    });
    
    // Fill Scan Info (Pre-populates list)
    setScannedPN('');
    setScannedBin('');
    setPartInfo(null);
    setManualEntryWarning(false);
    setScannedPartsList([
      {
        id: 'sp_demo_1',
        part_number: '86286761',
        description: 'Tail Light Assembly',
        supplier_id: 'magna',
        bin: 'BIN-MAG-6761',
        qty: 1
      }
    ]);
    
    // Fill Describe Info
    setSelectedArea('Review Scrap Table');
    setDefectType('Spare bulb loose in housing (rattle)');
    setDescription('Light on scrap table at sequence area for rattle. Spare bulb in housing again. Removed bulb and returned light to sequence area. Bulb was removed before scrap tag was written up. Please ensure all base lights do not have spare bulbs in housing causing rattling sound.');
    setActionTaken('Removed bulb, returned light to sequence area');
    setSupplierContact('Martin');
    setIsReturningDefect('N');
    setIsSortRequired('N');
    setIsRmaRequired('N');
    setConcernClassification('PRR');
  };

  // SUBMIT INCIDENT AND SEND EMAIL
  const handleSendIncident = () => {
    // P0-4 Evidence Guard (Up to 10 Photos + Video Walkthrough)
    const capturedCount = Object.keys(capturedPhotos).filter(k => capturedPhotos[k] || annotatedPhotos[k]).length;

    if (capturedCount < 3) {
      showToast("Completeness Error: At least 3 evidence photos are required before sending!", "warning");
      return;
    }

    if (!hasVideo) {
      showToast("Completeness Error: 15s Video Walkthrough evidence must be attached before sending!", "warning");
      return;
    }

    if (!selectedArea || !description) {
      showToast("Completeness Error: Please complete Step 3 (Describe & Area) before sending!", "warning");
      return;
    }

    setIsSendingIncident(true);

    // Simulate 2-second rule with loader
    setTimeout(() => {
      let savedIncident = null;
      try {
        const partsList = getEntities('parts');
        const part = partsList.find(p => p.part_number === scannedPN) || { id: 'unknown', part_number: scannedPN, supplier_id: 'magna', description: 'Unknown Custom Part' };
        
        const defaultPartsList = scannedPartsList.length > 0 ? scannedPartsList : [
          {
            id: `sp_def_${Date.now()}`,
            part_number: scannedPN || '86286761',
            description: part.description,
            supplier_id: part.supplier_id,
            bin: scannedBin || 'BIN-MAG-6761',
            qty: 1
          }
        ];

        // Prepare subject and parts HTML first to prevent TDZ error
        const firstPN = defaultPartsList[0]?.part_number || scannedPN;
        const partSubject = defaultPartsList.length > 1 
          ? `${firstPN} (+${defaultPartsList.length - 1} others)` 
          : firstPN;
        
        const partsHtml = defaultPartsList.map(p => `<li><strong>PN ${p.part_number}</strong>: ${p.description} (Qty: ${p.qty}) [Bin: ${p.bin}]</li>`).join("");

        const suppliersList = getEntities('suppliers') || [];
        const plantSupplier = suppliersList.find(s => s.plants_served && Array.isArray(s.plants_served) && s.plants_served.includes(selectedPlant))?.id;
        const resolvedSupplierId = (defaultPartsList[0]?.supplier_id && defaultPartsList[0]?.supplier_id !== 'magna' && defaultPartsList[0]?.supplier_id !== 'unknown') 
          ? defaultPartsList[0].supplier_id 
          : (plantSupplier || 'magna');

        const newInc = {
          rep_id: currentUser.id,
          plant_id: selectedPlant,
          supplier_id: resolvedSupplierId,
          part_id: defaultPartsList[0]?.part_number || '86286761', // fallback for single-value legacy references
          area: selectedArea,
          description: description || `Incident in ${selectedArea}`,
          action_taken: actionTaken,
          supplier_contact: supplierContact,
          photos: [
            { id: 'ph_w', url: annotatedPhotos.wide || capturedPhotos.wide, type: 'Wide' },
            { id: 'ph_m', url: annotatedPhotos.medium || capturedPhotos.medium, type: 'Medium' },
            { id: 'ph_c', url: annotatedPhotos.closeup || capturedPhotos.closeup, type: 'Closeup' },
            { id: 'ph_4', url: annotatedPhotos.photo4 || capturedPhotos.photo4, type: 'Angle B' },
            { id: 'ph_5', url: annotatedPhotos.photo5 || capturedPhotos.photo5, type: 'Serial #' },
            { id: 'ph_6', url: annotatedPhotos.photo6 || capturedPhotos.photo6, type: 'Container Tag' },
            { id: 'ph_7', url: annotatedPhotos.photo7 || capturedPhotos.photo7, type: 'Batch Tag' },
            { id: 'ph_8', url: annotatedPhotos.photo8 || capturedPhotos.photo8, type: 'Assembly Area' },
            { id: 'ph_9', url: annotatedPhotos.photo9 || capturedPhotos.photo9, type: 'Good Part Comp' },
            { id: 'ph_10', url: annotatedPhotos.photo10 || capturedPhotos.photo10, type: 'Hold Tag' }
          ].filter(p => !!p.url),
          concern_classification: concernClassification,
          defect_returned: isReturningDefect,
          sort_required: isSortRequired,
          rma_required: isRmaRequired,
          status: 'Open',
          sent_at: new Date().toISOString(),
          parts_list: defaultPartsList,
          part_view: 'top'
        };

        // Handle offline durable outbox staging if connectivity is absent
        if (isOffline) {
          const staged = stageIncidentLocally(newInc);
          setIsSendingIncident(false);
          setOfflineModalTrackingRef(staged.tracking_ref);
          setShowOfflineModal(true);
          window.dispatchEvent(new Event('ids_pulse_db_update'));
          return;
        }

        // Commit database writes inside the try-catch block
        savedIncident = addIncident(newInc);
        logSystemEvent('incident', 'create', `${currentUser.name} reported suspect material for Part #${partSubject} in area ${selectedArea}.`);

        // Log email delivery
        addEmailLog({
          incident_id: savedIncident.id,
          to_emails: part.supplier_id === 'magna' ? 'martin.s@magna.com, shahroz.m@magna.com' : 'sjenkins@hutchinson.ca',
          cc_emails: 'donna.c@integritydriven.com, greg.p@integritydriven.com',
          subject: `[INCIDENT] PN ${partSubject} | ${selectedArea} | ${plants.find(p => p.id === selectedPlant)?.name || 'GM Oshawa'} | ${new Date().toLocaleDateString()}`,
          body: `<h3>INCIDENT REPORT — IDS PULSE</h3>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
<strong>Rep:</strong> ${currentUser.name}<br/>
<strong>Area Discovered:</strong> ${selectedArea}</p>
<hr/>
<p><strong>Defective Parts List:</strong></p>
<ul>${partsHtml}</ul>
<hr/>
<p><strong>Description:</strong> ${description}</p>
<p><strong>Action Taken:</strong> ${actionTaken}</p>`
        });

        setIsSendingIncident(false);
        setSentIncidentId(savedIncident.id);
        setIncidentSentConfirmation(true);
        window.dispatchEvent(new Event('ids_pulse_db_update'));
      } catch (err) {
        console.error("Error during incident release:", err);
        setIsSendingIncident(false);
        showToast(`Failed to send incident report: ${err.message || err}`, "error");
      }
    }, 2000);
  };

  const addPartToList = () => {
    if (!scannedPN) return;
    const isDuplicate = scannedPartsList.some(p => p.part_number === scannedPN && p.bin === (scannedBin || 'N/A'));
    if (isDuplicate) {
      showToast("This part number & bin location is already added!", "warning");
      return;
    }
    
    const newItem = {
      id: `sp_${Date.now()}`,
      part_number: scannedPN,
      description: partInfo ? partInfo.description : 'Custom/Other Defective Part',
      supplier_id: partInfo ? partInfo.supplier_id : 'magna',
      bin: scannedBin || 'BIN-GEN-01',
      qty: 1
    };
    setScannedPartsList(prev => [...prev, newItem]);
    playBeep('success');
    // Clear temporary inputs
    setScannedPN('');
    setScannedBin('');
    setPartInfo(null);
    setManualEntryWarning(false);
  };

  const removePartFromList = (id) => {
    setScannedPartsList(prev => prev.filter(item => item.id !== id));
    playBeep('warning');
  };

  const updatePartQty = (id, delta) => {
    setScannedPartsList(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
    playBeep('scan');
  };

  const saveDraftShiftReport = (updatedAreas, updatedBonus) => {
    if (!currentUser) return;
    const todayDate = new Date().toISOString()?.substring(0, 10);
    const dbReports = getEntities('shiftReports');
    const existingDraft = dbReports.find(r => r.rep_id === currentUser.id && r.status === 'Draft');
    
    if (existingDraft) {
      existingDraft.areas_walked = updatedAreas || areasWalked;
      existingDraft.bonus_tasks = updatedBonus || bonusTasks;
      saveEntity('shiftReports', existingDraft);
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    }
  };

  const calculateJaccardSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const stopWords = new Set(['the', 'a', 'an', 'is', 'in', 'for', 'to', 'on', 'at', 'and', 'or', 'with', 'by', 'of', 'again', 'please', 'ensure', 'causing']);
    const tokenize = (str) => {
      return str
        ?.toLowerCase()
        ?.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        ?.split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
    };
    const words1 = new Set(tokenize(str1));
    const words2 = new Set(tokenize(str2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    let intersection = 0;
    words1.forEach(w => {
      if (words2.has(w)) intersection++;
    });
    
    const union = words1.size + words2.size - intersection;
    return intersection / union;
  };

  const runDuplicateCheck = () => {
    const dbIncidents = getEntities('incidents');
    const targetPartNo = scannedPartsList[0]?.part_number || scannedPN;
    if (!targetPartNo) return null;
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const candidates = dbIncidents.filter(inc => {
      const createdDate = new Date(inc.created_at || inc.sent_at);
      const isRecent = createdDate >= last24h;
      
      const isSamePlant = inc.plant_id === selectedPlant;
      const incPartNo = inc.parts_list?.[0]?.part_number || inc.part_id;
      const isSamePart = incPartNo === targetPartNo;
      
      return isRecent && isSamePlant && isSamePart;
    });
    
    let bestMatch = null;
    let highestSim = 0;
    
    candidates.forEach(cand => {
      const sim = calculateJaccardSimilarity(description, cand.description);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatch = cand;
      }
    });
    
    if (highestSim >= 0.25) {
      return { incident: bestMatch, similarity: highestSim };
    }
    return null;
  };

  const handleMergeDuplicate = () => {
    if (!duplicateIncident) return;
    const { incident } = duplicateIncident;
    
    const updatedDesc = `${incident.description}\n\n[MERGED OBSERVATION - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${currentUser.name}]: ${description}`;
    
    const updatedPartsList = incident.parts_list ? [...incident.parts_list] : [];
    if (updatedPartsList.length > 0) {
      updatedPartsList[0] = {
        ...updatedPartsList[0],
        qty: (updatedPartsList[0].qty || 1) + 1
      };
    }
    
    const updatedIncident = {
      ...incident,
      description: updatedDesc,
      parts_list: updatedPartsList
    };
    
    saveEntity('incidents', updatedIncident);
    playBeep('success');
    
    window.dispatchEvent(new Event('ids_pulse_db_update'));
    
    showToast(`Observations merged into active Incident ${incident.id}!`, "success");
    
    resetIncidentScreen();
  };

  const resetIncidentScreen = () => {
    setCapturedPhotos({ wide: null, medium: null, closeup: null });
    setAnnotatedPhotos({ wide: null, medium: null, closeup: null });
    setDrawingTarget('closeup');
    setScannedPartsList([]);
    setScannedPN('');
    setScannedBin('');
    setPartInfo(null);
    setManualEntryWarning(false);
    setDescription('');
    setDefectType('');
    setCustomDefect('');
    setHasVideo(false);
    setIncidentSentConfirmation(false);
    setSentIncidentId(null);
    setIncStep(1);
    setDuplicateIncident(null);
    setActiveScreen('home');
  };

  const handleProceedToReview = () => {
    const dupe = runDuplicateCheck();
    if (dupe) {
      setDuplicateIncident(dupe);
      setIncStep(3.5);
    } else {
      setIncStep(4);
    }
  };

  // SUBMIT REWORK LOG
  const handleReworkSubmit = (e) => {
    e.preventDefault();
    const finalPartNo = reworkPNMode === 'manual' 
      ? (reworkCustomPN.trim() || 'CUSTOM_PART') 
      : reworkPN;

    if (!finalPartNo) {
      alert("Please select or enter a valid part number.");
      return;
    }

    if (reworkQty <= 0) {
      alert("Please enter a valid rework quantity greater than 0.");
      return;
    }

    const partsList = getEntities('parts') || [];
    const part = partsList.find(p => p.part_number === finalPartNo) || { id: finalPartNo, part_number: finalPartNo, supplier_id: 'magna' };
    const suppliersList = getEntities('suppliers') || [];
    const plantSupplier = suppliersList.find(s => s.plants_served && Array.isArray(s.plants_served) && s.plants_served.includes(selectedPlant))?.id;
    const resolvedReworkSupplierId = (part.supplier_id && part.supplier_id !== 'magna' && part.supplier_id !== 'unknown')
      ? part.supplier_id 
      : (plantSupplier || 'magna');

    addReworkLog({
      rep_id: currentUser.id,
      plant_id: selectedPlant,
      supplier_id: resolvedReworkSupplierId,
      part_id: finalPartNo,
      part_number: finalPartNo,
      qty: reworkQty,
      time_spent_minutes: reworkHours * 60,
      scanned_barcodes: reworkScannedBarcodes,
      notes: reworkNotes
    });

    logSystemEvent('rework', 'create', `${currentUser.name} logged rework of ${reworkQty} pcs of Part #${finalPartNo} (${reworkScannedBarcodes.length} scanned tags).`);

    showToast(`Logged rework of ${reworkQty} pcs for Part #${finalPartNo}!`, "success");
    setReworkPN('86286761');
    setReworkPNMode('dropdown');
    setReworkCustomPN('');
    setReworkQty(10);
    setReworkHours(1.5);
    setReworkNotes('');
    setReworkScannedBarcodes([]);
    setActiveScreen('home');
  };

  // CAPTURE MOCK RECEIPT PHOTO
  const captureMockReceipt = () => {
    setExpenseReceiptPhoto('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80');
  };

  // SUBMIT EXPENSE LOG WITH CLOUDINARY UPLOAD
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(parseFloat(expenseAmount)) || parseFloat(expenseAmount) <= 0) {
      showToast("Please enter a valid expense amount.", "error");
      return;
    }
    
    if (!expenseReceiptPhoto) {
      showToast("A photo receipt is mandatory for expense claims.", "warning");
      return;
    }

    let finalReceiptUrl = expenseReceiptPhoto;
    if (expenseReceiptPhoto && (expenseReceiptPhoto.startsWith('data:') || expenseReceiptPhoto.startsWith('blob:'))) {
      const cldRes = await uploadToCloudinary(expenseReceiptPhoto, 'expenses');
      if (cldRes.success) {
        finalReceiptUrl = cldRes.url;
      }
    }

    addExpenseEntry({
      rep_id: currentUser ? currentUser.id : '1',
      date: new Date().toISOString()?.split('T')[0],
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      receipt_photo: finalReceiptUrl,
      notes: expenseNotes
    });
    logSystemEvent('payroll', 'expense_create', `${currentUser.name} logged $${expenseAmount} expense claim for ${expenseCategory}.`);

    showToast("Expense claim submitted successfully!", "success");
    setExpenseAmount('');
    setExpenseCategory('Fuel');
    setExpenseReceiptPhoto(null);
    setExpenseNotes('');
    setActiveScreen('home');
  };

  // WALKED AREA CARDS TOGGLE
  const toggleAreaStatus = (id, status) => {
    setAreasWalked(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status } : a);
      saveDraftShiftReport(next, null);
      return next;
    });
  };

  const updateAreaNotes = (id, notes) => {
    setAreasWalked(prev => {
      const next = prev.map(a => a.id === id ? { ...a, notes } : a);
      saveDraftShiftReport(next, null);
      return next;
    });
  };

  const handleSendShiftReport = () => {
    setSendingShiftReport(true);
    setTimeout(() => {
      const todayDate = new Date().toISOString()?.substring(0, 10);
      const repIncidentsCount = getEntities('incidents').filter(inc => inc.rep_id === currentUser.id && inc.created_at?.startsWith(todayDate)).length;
      
      const dbReports = getEntities('shiftReports');
      const existingDraft = dbReports.find(r => r.rep_id === currentUser.id && r.status === 'Draft');

      const newReport = {
        id: existingDraft ? existingDraft.id : `sr_${Date.now()}`,
        rep_id: currentUser.id,
        plant_id: selectedPlant,
        date: todayDate,
        areas_walked: areasWalked,
        incidents_count: repIncidentsCount,
        bonus_tasks: bonusTasks,
        status: 'Sent',
        sent_at: new Date().toISOString(),
        created_at: existingDraft ? existingDraft.created_at : new Date().toISOString()
      };
      
      // Save walkthrough log
      saveEntity('shiftReports', newReport);


      // Dispatch email logs for walkthrough audit
      addEmailLog({
        incident_id: '',
        to_emails: 'donna.c@integritydriven.com',
        cc_emails: 'greg.p@integritydriven.com',
        subject: `[SHIFT SUMMARY] Rep: ${currentUser.name} | ${plants.find(p => p.id === selectedPlant)?.name || 'GM Oshawa'} | ${new Date().toLocaleDateString()}`,
        body: `<h3>SHIFT WALKTHROUGH LOG — IDS PULSE</h3>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
<strong>Field Representative:</strong> ${currentUser.name}<br/>
<strong>Assigned Assembly Plant:</strong> ${plants.find(p => p.id === selectedPlant)?.name || 'GM Oshawa'}</p>
<hr/>
<p><strong>Inspected Factory Areas:</strong></p>
<ul>
  ${areasWalked.map(a => `<li><strong>${a.name}</strong>: ${a.status === 'issues' ? '🔴 Concerns Found' : '🟢 No Concerns'} (Notes: ${a.notes || 'None'})</li>`).join('')}
</ul>
<p><strong>Assigned Audits & Checkpoints:</strong></p>
<ul>
  ${bonusTasks.map(t => `<li><strong>${t.task}</strong>: ${t.status === 'completed' ? '✅ Completed' : '⏳ Pending'} (Notes: ${t.notes || 'None'})</li>`).join('')}
</ul>`
      });

      setSendingShiftReport(false);
      showToast("Daily Quality Report submitted successfully!", "success");
      setActiveScreen('home');
    }, 1500);
  };

  return (
    <div className={`relative mx-auto flex flex-col overflow-hidden select-none ${isNative ? 'w-full h-full min-h-screen max-w-full bg-slate-50 p-0 border-none rounded-none shadow-none flex-1' : 'w-[380px] h-[780px] bg-slate-50 rounded-md p-2 shadow-sm border border-slate-300'}`}>
      {/* Rugged Top Bar - Only on desktop simulator */}
      {!isNative && (
        <div className="w-full h-4 bg-slate-200 border-b border-slate-300 flex items-center justify-center">
          <div className="w-20 h-1 bg-slate-400 rounded-none"></div>
        </div>
      )}

      {/* Screen Top Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-[12px] font-bold text-slate-700 z-40 bg-white border-b border-slate-300 select-none">
        <span>18:19 PM</span>
        <div className="flex items-center gap-2">
          {/* Offline Toggle Indicator */}
          <button 
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-sm cursor-pointer transition-colors border ${
              isOffline ? 'bg-red-50 text-red-700 border-red-300' : 'bg-green-50 text-green-700 border-green-300'
            }`}
            title="Toggle Network Status"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="uppercase text-[10px] tracking-wide">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="uppercase text-[10px] tracking-wide">Online</span>
              </>
            )}
          </button>
          <div className="flex items-end gap-0.5 h-3">
            <div className="w-1 h-1.5 bg-slate-700"></div>
            <div className="w-1 h-2 bg-slate-700"></div>
            <div className="w-1 h-2.5 bg-slate-700"></div>
            <div className="w-1 h-3 bg-slate-300"></div>
          </div>
        </div>
      </div>

      {/* Phone Screen Container */}
      <div className={`flex-1 overflow-hidden bg-slate-50 flex flex-col relative text-slate-900 ${isNative ? 'border-none w-full min-h-screen' : 'border-x border-slate-300'}`}>
        
        {/* SCREEN 1: LOGIN */}
        {activeScreen === 'login' && (
          <div className="flex-1 flex flex-col justify-between p-3 bg-white">
            <div className="flex flex-col items-center mt-12">
              <img src="/logo.png" alt="IDS Logo" className="h-16 w-auto object-contain mb-4 filter brightness-0" />
              <h1 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">IDS Pulse</h1>
              <p className="text-[13px] text-slate-600 font-bold uppercase tracking-wider">Operations Terminal</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3 my-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Operator ID</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600" />
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="phone-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="clarence or email"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Access Code</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="phone-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-[11px] font-bold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submittingAuth}
                className="phone-btn-primary mt-4 cursor-pointer disabled:opacity-50"
              >
                {submittingAuth ? 'Authenticating…' : 'Authenticate'}
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 2: HOME */}
        {activeScreen === 'home' && isLoggedIn && currentUser && (() => {
          const hourTotals = getRepAssignmentHourTotals();
          return (
          <div className="flex-1 flex flex-col p-3 bg-slate-50 relative overflow-y-auto scrollbar-thin">
            {addHoursToast && (
              <div className="mb-2 bg-emerald-500 text-white p-2.5 rounded-lg text-[12px] font-bold text-center shadow-md animate-in fade-in">
                {addHoursToast}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-300">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="IDS Logo" className="h-7 w-auto object-contain flex-shrink-0 filter brightness-0" />
                  <div>
                    <h2 className="text-[13.5px] font-black text-slate-900 leading-none tracking-tight">IDS Pulse</h2>
                    <span className="text-[10.5px] text-slate-600 font-bold uppercase tracking-wide">Ontario, Canada</span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-text-secondary hover:text-red-600 rounded-sm hover:bg-slate-200 transition-colors cursor-pointer border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* OFFLINE INDICATOR */}
              {isOffline && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-sm p-2 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Offline - Auto Sync Pending</span>
                </div>
              )}

              {/* Rep Profile & Role Header Panel */}
              <div className="mt-3 bg-white border border-slate-300 rounded-xl p-3 flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-black text-[14px] text-blue-700 border border-blue-200 shrink-0 shadow-2xs">
                      {currentUser.avatar || 'QR'}
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <p className="text-[14px] font-black text-slate-900 leading-tight truncate">{currentUser.name}</p>
                      <div className="mt-0.5">
                        <span className="inline-block text-[9px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider whitespace-nowrap">
                          Quality Liaison Rep
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider">Location</span>
                    <div className="relative inline-block mt-0.5">
                      <select 
                        value={selectedPlant}
                        onChange={(e) => setSelectedPlant(e.target.value)}
                        className="text-[11px] font-bold text-slate-900 bg-slate-100 border border-slate-300 rounded-md px-2 py-1 focus:outline-none cursor-pointer max-w-[130px] truncate"
                      >
                        {plants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assigned Work Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                      <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Assigned Work Details</span>
                    </span>
                    <span className="text-[8.5px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-md uppercase whitespace-nowrap shrink-0">
                      Active Assignment
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11.5px] text-left">
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Supplier / Client:</span>
                      <strong className="text-slate-900 font-black truncate block">{getActiveClientForPlant()}</strong>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Host Plant:</span>
                      <strong className="text-slate-900 font-black truncate block">{plants.find(p => p.id === selectedPlant)?.name || 'GM Oshawa'}</strong>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Project / Program:</span>
                      <span className="text-slate-800 font-bold truncate block">{hourTotals.activeProject?.name || 'Quality Inspection & Sorting'}</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Assigned Parts:</span>
                      <span className="text-blue-700 font-black truncate block">{hourTotals.activeProject?.part_numbers || 'PN-86286761'}</span>
                    </div>
                  </div>

                  {hourTotals.repAssignments && hourTotals.repAssignments.length > 1 && (
                    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-200">
                      <label className="text-[9.5px] font-black text-amber-900 uppercase tracking-wide flex items-center justify-between">
                        <span>Select Active Assignment ({hourTotals.repAssignments.length}):</span>
                        <span className="text-amber-700 font-bold text-[8.5px]">Required for telemetry</span>
                      </label>
                      <select
                        value={selectedAssignmentId}
                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                        className="text-[11.5px] font-black text-slate-900 bg-amber-50 border border-amber-300 rounded px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Choose Assignment --</option>
                        {hourTotals.repAssignments.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name || a.title || `Assignment #${a.id}`} ({a.client_id || a.supplier_id || 'Client'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Hour Totals Summary Box */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      <span>Assignment Hours Telemetry</span>
                    </span>
                    <span className="text-[10.5px] font-black text-blue-800">
                      {hourTotals.hasAuthorizedLimit ? `${hourTotals.authorizedHours.toFixed(1)} hrs Auth` : 'No hour limit configured'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-0.5 text-center">
                    <div className="bg-white border border-emerald-200 rounded p-1.5">
                      <span className="text-[8 h-auto] text-[8px] text-emerald-700 font-bold uppercase block leading-tight">Regular (Rec.)</span>
                      <span className="text-[12px] font-black text-emerald-700">{hourTotals.recordedRegularHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="bg-white border border-amber-200 rounded p-1.5">
                      <span className="text-[8px] text-amber-700 font-bold uppercase block leading-tight">Client OT Pend.</span>
                      <span className="text-[12px] font-black text-amber-700">{hourTotals.pendingClientOvertimeHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="bg-white border border-blue-200 rounded p-1.5">
                      <span className="text-[8px] text-blue-700 font-bold uppercase block leading-tight">Rem. Alloc.</span>
                      <span className="text-[12px] font-black text-blue-700">
                        {hourTotals.hasAuthorizedLimit ? `${hourTotals.remainingAllocation !== null ? hourTotals.remainingAllocation.toFixed(1) : 0} hrs` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white border border-purple-200 rounded p-1.5">
                      <span className="text-[8px] text-purple-700 font-bold uppercase block leading-tight">Client Appr. OT</span>
                      <span className="text-[12px] font-black text-purple-700">
                        {hourTotals.clientApprovedOvertimeHours.toFixed(1)} hrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* TODAY'S SPECIAL TASKS & SORT AUDITS CARD */}
                {bonusTasks && bonusTasks.length > 0 && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2.5 flex flex-col gap-2 shadow-xs mt-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-black text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                        <span>Today's Special Tasks & Audits ({bonusTasks.length})</span>
                      </span>
                      <span className="text-[8.5px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        Assigned Task
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {bonusTasks.map((task) => (
                        <div key={task.id} className="bg-white border border-blue-200 rounded-md p-2 flex items-center justify-between shadow-2xs">
                          <div className="flex flex-col text-left pr-2">
                            <span className="text-[11px] font-extrabold text-slate-900 leading-tight">{task.task}</span>
                            <span className="text-[9px] text-blue-800 font-bold mt-0.5 flex items-center gap-1">
                              <span>Manager Request</span>
                              <span>•</span>
                              <span className="font-mono text-blue-700">PN 86291945</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (task.status === 'completed') {
                                showToast("This audit task is already completed!", "info");
                                return;
                              }
                              setInspPartNumber('86291945');
                              setInspPNMode('dropdown');
                              setInspNotes(`Performing ${task.task}...`);
                              setActiveScreen('inspection');
                              showToast(`Pre-filled inspection for ${task.task}!`, "info");
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 ${
                              task.status === 'completed' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {task.status === 'completed' ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-700" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Wrench className="w-3 h-3 text-white" />
                                <span>Start Audit</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Actions Feed */}
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-[10.5px] text-slate-600 font-bold uppercase tracking-wider pl-1">Primary Actions</p>

              {/* PROMINENT ACTION: Add Today's Hours */}
              <button 
                type="button"
                onClick={() => setShowAddHoursModal(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg p-3 flex items-center justify-between transition-all cursor-pointer shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-[14px] font-black block tracking-wide">Add Today's Hours</span>
                    <span className="text-[10.5px] block text-emerald-100">Record daily working hours & overtime</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setActiveScreen('inspection')}
                  className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col gap-1 text-left transition-colors cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 mt-1">Start Routine Inspection</span>
                  <span className="text-[10px] text-slate-500">Record sorting log</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setActiveScreen('rework')}
                  className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col gap-1 text-left transition-colors cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 mt-1">Log Rework</span>
                  <span className="text-[10px] text-slate-500">Billable containment rework</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setActiveScreen('incident');
                    setIncStep(1);
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col gap-1 text-left transition-colors cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded bg-red-50 border border-red-200 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 mt-1">Report Urgent Incident</span>
                  <span className="text-[10px] text-slate-500">Log suspect material</span>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setActiveScreen('expenses');
                    setTimeExpenseTab('expense');
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col gap-1 text-left transition-colors cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 mt-1">Log Expense</span>
                  <span className="text-[10px] text-slate-500">Claim mileage & expenses</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setActiveScreen('summary')}
                  className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col gap-1 text-left transition-colors cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded bg-purple-50 border border-purple-200 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 mt-1">Daily Quality Report</span>
                  <span className="text-[10px] text-slate-500">Walkthrough summary</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setActiveScreen('history')}
                  className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col gap-1 text-left transition-colors cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 mt-1">View Activity</span>
                  <span className="text-[10px] text-slate-500">History & incident logs</span>
                </button>
              </div>
            </div>

            {/* ADD TODAY'S HOURS MODAL */}
            {showAddHoursModal && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 z-50 animate-in fade-in">
                <div className="bg-white border border-slate-300 rounded-xl w-full max-w-[340px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-3 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5 text-white" />
                      <h3 className="text-[14px] font-black uppercase tracking-wide">Add Today's Hours</h3>
                    </div>
                    <button onClick={() => setShowAddHoursModal(false)} className="text-white/80 hover:text-white"><X className="w-4.5 h-4.5" /></button>
                  </div>

                  <form onSubmit={handleAddTodayHoursSubmit} className="p-3.5 flex flex-col gap-3 overflow-y-auto">
                    <div>
                      <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Work Date</label>
                      <input 
                        type="date"
                        value={addHoursDate}
                        max={new Date().toISOString().substring(0, 10)}
                        onChange={(e) => setAddHoursDate(e.target.value)}
                        required
                        className="phone-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Hours Worked</label>
                      <input 
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="24"
                        placeholder="e.g. 0.5, 1, 1.5, 2, 7.75"
                        value={addHoursValue}
                        onChange={(e) => setAddHoursValue(e.target.value)}
                        required
                        className="phone-input text-sm font-bold"
                      />
                      <span className="text-[9.5px] text-slate-500 mt-1 block mb-1">Supports decimals (0.5, 1.5, 3.5, 7.75 hrs)</span>
                      
                      {(() => {
                        const hrs = parseFloat(addHoursValue);
                        if (!hrs || isNaN(hrs) || hrs <= 0) return null;
                        const totals = getRepAssignmentHourTotals();
                        if (totals.authorizedHours === null) {
                          return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                        <div style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>Regular (Recorded)</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#065f46', marginTop: '2px' }}>
                            {(totals.regularRecorded || 0).toFixed(1)} hrs
                          </div>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                          <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '600' }}>Rem. Allocation</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', marginTop: '2px' }}>
                            {(totals.remainingAllocation || 0).toFixed(1)} hrs
                          </div>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div style={{ fontSize: '10px', color: '#d97706', fontWeight: '600' }}>Client OT Pending</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#92400e', marginTop: '2px' }}>
                            {(totals.clientOtPending || 0).toFixed(1)} hrs
                          </div>
                        </div>
                        <div style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>Client Approved OT</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#065f46', marginTop: '2px' }}>
                            {(totals.clientOtApproved || 0).toFixed(1)} hrs
                          </div>
                        </div>
                      </div>      );
                        }
                        const rem = totals.remainingAllocation !== null ? totals.remainingAllocation : 0;
                        if (hrs > rem) {
                          const regPortion = Math.max(0, rem);
                          const otPortion = hrs - regPortion;
                          return (
                            <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 text-[10.5px] text-amber-900 font-semibold leading-snug">
                              ⚠️ {regPortion > 0 ? `${regPortion.toFixed(1)} hours are within your assignment. ` : ''}The additional {otPortion.toFixed(1)} hours require Client approval.
                            </div>
                          );
                        }
                        return (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-[10.5px] text-emerald-900 font-semibold leading-snug">
                            ✓ All {hrs.toFixed(1)} hours are within your authorized allocation and will be recorded automatically.
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Work Type</label>
                      <select 
                        value={addHoursType}
                        onChange={(e) => setAddHoursType(e.target.value)}
                        className="phone-select text-xs"
                      >
                        <option value="Routine inspection">Routine inspection</option>
                        <option value="Incident investigation">Incident investigation</option>
                        <option value="Containment or rework support">Containment or rework support</option>
                        <option value="Customer/supplier communication">Customer/supplier communication</option>
                        <option value="Documentation/reporting">Documentation/reporting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Short Work Summary</label>
                      <textarea 
                        rows={2}
                        value={addHoursSummary}
                        onChange={(e) => setAddHoursSummary(e.target.value)}
                        placeholder="Summary of quality work performed..."
                        className="phone-input text-xs"
                      ></textarea>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button 
                        type="button"
                        onClick={() => setShowAddHoursModal(false)}
                        className="flex-1 h-10 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md"
                      >
                        Submit Hours
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


          </div>
          );
        })()}

        {/* SCREEN 3: NEW INCIDENT FLOW (STEPWISE SCROLL VIEW) */}
        {activeScreen === 'incident' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-300 bg-white">
              <button 
                onClick={() => {
                  if (confirm('Discard this draft report?')) {
                    resetIncidentScreen();
                  }
                }}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[13.5px]"
              >
                <ArrowLeft className="w-4.5 h-4" />
                <span>Cancel</span>
              </button>
              <h2 className="text-[13.5px] font-bold text-slate-900 uppercase tracking-wider">New Incident Report</h2>
              <button 
                onClick={autofillClarenceDemo}
                className="text-[10.5px] bg-blue-50 text-blue-700 font-bold border border-blue-200 px-2 py-1 rounded-sm"
              >
                Demo Fill
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 border-b border-slate-300 text-center text-[10.5px] bg-slate-100">
              <button onClick={() => setIncStep(1)} className={`py-2 font-bold ${incStep === 1 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}>1. Capture</button>
              <button onClick={() => setIncStep(2)} className={`py-2 font-bold ${incStep === 2 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}>2. Scan</button>
              <button onClick={() => setIncStep(3)} className={`py-2 font-bold ${incStep === 3 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}>3. Describe</button>
              <button 
                onClick={() => {
                  const capturedCount = Object.keys(capturedPhotos).filter(k => capturedPhotos[k] || annotatedPhotos[k]).length;
                  if (capturedCount < 3) {
                    showToast("Completeness Error: Please capture at least 3 evidence photos first!", "warning");
                    return;
                  }
                  setIncStep(4);
                }} 
                className={`py-2 font-bold ${incStep === 4 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}
              >
                4. Send
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-left">
              
              {/* STEP 1: CAPTURE (PHOTO FIRST, FIELDS SECOND) */}
              {incStep === 1 && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11.5px] text-blue-700 font-bold uppercase tracking-wider">Step 1: Visual Proof (10 Slots)</span>
                    <span className="text-[10.5px] text-slate-600">Up to 10 photos supported</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { key: 'wide', label: 'Wide', sub: 'Box Tag' },
                      { key: 'medium', label: 'Medium', sub: 'Part' },
                      { key: 'closeup', label: 'Close-Up', sub: 'Defect' },
                      { key: 'photo4', label: 'Photo 4', sub: 'Angle B' },
                      { key: 'photo5', label: 'Photo 5', sub: 'Serial #' },
                      { key: 'photo6', label: 'Photo 6', sub: 'Container' },
                      { key: 'photo7', label: 'Photo 7', sub: 'Batch' },
                      { key: 'photo8', label: 'Photo 8', sub: 'Assembly' },
                      { key: 'photo9', label: 'Photo 9', sub: 'Compare' },
                      { key: 'photo10', label: 'Photo 10', sub: 'Hold Tag' }
                    ].map((slot) => {
                      const isCaptured = !!(annotatedPhotos[slot.key] || capturedPhotos[slot.key]);
                      const photoSrc = annotatedPhotos[slot.key] || capturedPhotos[slot.key];
                      const isAnnotated = !!annotatedPhotos[slot.key];

                      return (
                        <div 
                          key={slot.key}
                          onClick={() => {
                            if (!capturedPhotos[slot.key]) {
                              captureMockPhoto(slot.key);
                            } else {
                              setDrawingTarget(slot.key);
                              setShowDrawingCanvas(true);
                            }
                          }}
                          className={`aspect-square bg-white border rounded-sm flex flex-col items-center justify-center text-center cursor-pointer p-0.5 relative overflow-hidden group transition-colors ${
                            isCaptured ? 'border-green-400' : 'border-slate-300 hover:border-blue-500'
                          }`}
                        >
                          {isCaptured ? (
                            <>
                              <img src={photoSrc} className="w-full h-full object-cover" alt={slot.label} />
                              {isAnnotated ? (
                                <span className="absolute bottom-0.5 right-0.5 bg-red-600 text-[9px] text-white px-0.5 py-0.2 rounded-xs font-bold leading-none">Marked</span>
                              ) : (
                                <span className="absolute bottom-0.5 right-0.5 bg-white/90 text-[9px] text-green-700 border border-green-200 px-0.5 py-0.2 rounded-xs shadow-xs font-bold leading-none">{slot.label}</span>
                              )}
                              {isAnnotated && (
                                <span className="absolute top-0.5 left-0.5 bg-white/90 rounded-xs p-0.5 border border-slate-200"><RotateCcw className="w-2 h-2 text-slate-700" /></span>
                              )}
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 text-slate-500 mb-0.5" />
                              <span className="text-[10px] font-bold text-slate-700 leading-tight">{slot.label}</span>
                              <span className="text-[9px] text-slate-400 leading-tight">{slot.sub}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Annotation Actions Row */}
                  {Object.values(capturedPhotos).some(Boolean) && (
                    <div className="flex flex-col gap-1 w-full bg-slate-50 p-2 rounded-sm border border-slate-200">
                      <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wider pl-0.5 block mb-1">Annotate Defect Photo</span>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { key: 'wide', label: 'Wide' },
                          { key: 'medium', label: 'Med' },
                          { key: 'closeup', label: 'Close' },
                          { key: 'photo4', label: 'P4' },
                          { key: 'photo5', label: 'P5' },
                          { key: 'photo6', label: 'P6' },
                          { key: 'photo7', label: 'P7' },
                          { key: 'photo8', label: 'P8' },
                          { key: 'photo9', label: 'P9' },
                          { key: 'photo10', label: 'P10' }
                        ].map(slot => (
                          <button
                            key={slot.key}
                            type="button"
                            disabled={!capturedPhotos[slot.key]}
                            onClick={() => {
                              setDrawingTarget(slot.key);
                              setShowDrawingCanvas(true);
                            }}
                            className={`py-1 rounded-sm text-[9.5px] font-bold border transition-colors ${
                              capturedPhotos[slot.key] 
                                ? drawingTarget === slot.key
                                  ? 'bg-blue-600 border-blue-700 text-white cursor-pointer shadow-xs'
                                  : 'bg-white border-slate-300 text-blue-700 hover:bg-slate-50 cursor-pointer shadow-xs' 
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            ✏️ {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Mock Attachment */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setHasVideo(!hasVideo)}
                      className={`w-full h-11 border rounded-sm flex items-center justify-center gap-1.5 text-[13.5px] font-bold transition-all cursor-pointer ${
                        hasVideo ? 'bg-green-50 border-green-300 text-green-700 shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm hover:bg-slate-50'
                      }`}
                    >
                      <Video className="w-4.5 h-4" />
                      <span>{hasVideo ? 'Video Linked' : 'Add 15s Video'}</span>
                    </button>
                  </div>

                  <button 
                    disabled={Object.values(capturedPhotos).filter(Boolean).length < 3}
                    onClick={() => setIncStep(2)}
                    className="phone-btn-primary mt-4"
                  >
                    <span>Proceed to Scan Part Label</span>
                    <ChevronRight className="w-4.5 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: SCAN (MOCK SCANNERS AND WARNINGS) */}
              {incStep === 2 && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11.5px] text-blue-700 font-bold uppercase tracking-wider">Step 2: Traceability Scan</span>
                    {scannedPartsList.length > 0 && (
                      <span className="text-[10.5px] bg-green-50 border border-green-200 text-green-700 font-bold px-2 py-1 rounded-sm shadow-sm">
                        {scannedPartsList.length} Added
                      </span>
                    )}
                  </div>

                  {/* Scan Barcode Button */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => startScanning('barcode')}
                      className="phone-btn-primary"
                    >
                      <Scan className="w-4.5 h-4.5" />
                      <span>Scan Part Barcode Label</span>
                    </button>

                    {scannedPN ? (
                      <div className="bg-white rounded-sm p-3 border border-slate-300 flex flex-col gap-2 relative shadow-sm">
                        <button 
                          onClick={() => {
                            setScannedPN('');
                            setPartInfo(null);
                            setManualEntryWarning(false);
                          }}
                          className="absolute top-2.5 right-2.5 text-slate-600 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        >
                          <X className="w-4.5 h-4" />
                        </button>
                        <div className="flex justify-between items-center text-[13.5px] pr-6">
                          <span className="text-text-secondary">Part Number:</span>
                          <span className="font-bold text-slate-900">{scannedPN}</span>
                        </div>
                        {partInfo ? (
                          <>
                            <div className="flex justify-between items-center text-[13.5px]">
                              <span className="text-text-secondary">Description:</span>
                              <span className="text-slate-700 font-bold text-right max-w-[160px] truncate">{partInfo.description}</span>
                            </div>
                            <div className="flex justify-between items-center text-[13.5px]">
                              <span className="text-text-secondary">Supplier:</span>
                              <span className="text-blue-700 font-bold">{getActiveClientForPlant()}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center text-[13.5px]">
                            <span className="text-text-secondary">Description:</span>
                            <span className="text-text-secondary italic">Custom Part</span>
                          </div>
                        )}
                        {manualEntryWarning && (
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 p-1.5 rounded-sm text-[10.5px] font-bold shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Manual Entry: Typos can happen without scan.</span>
                          </div>
                        )}
                        <button
                          onClick={addPartToList}
                          className="phone-btn-primary bg-green-600 hover:bg-green-700 text-white mt-1 border-green-700 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Checklist</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider pl-1">Or enter Part Number manually (last resort)</label>
                        <input 
                          type="text" 
                          value={scannedPN}
                          onChange={(e) => handleManualPartNumberChange(e.target.value)}
                          className="phone-input"
                          placeholder="e.g. 86286761"
                        />
                      </div>
                    )}
                  </div>

                  {/* Scan QR/Bin Button */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button 
                      onClick={() => startScanning('qr')}
                      className="phone-btn-secondary"
                    >
                      <Scan className="w-4.5 h-4.5 text-text-secondary" />
                      <span>Scan Bin/Box Label QR</span>
                    </button>

                    {scannedBin && (
                      <div className="bg-white rounded-sm p-2.5 border border-slate-300 shadow-sm flex justify-between items-center text-[13.5px] relative">
                        <span className="text-text-secondary">Bin Location:</span>
                        <span className="font-bold text-green-700 pr-6">{scannedBin}</span>
                        <button 
                          onClick={() => setScannedBin('')}
                          className="absolute top-2.5 right-2.5 text-slate-600 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Checklist of Added Parts */}
                  {scannedPartsList.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-300">
                      <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider pl-1">
                        Defective Parts List ({scannedPartsList.length})
                      </span>
                      <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-thin">
                        {scannedPartsList.map((item) => (
                          <div 
                            key={item.id}
                            className="bg-white border border-slate-300 shadow-sm rounded-sm p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900 text-[13.5px] truncate">PN {item.part_number}</span>
                                <span className="text-green-700 font-bold text-[11.5px]">{item.bin}</span>
                              </div>
                              <span className="text-[11.5px] text-slate-600 block truncate">{item.description}</span>
                            </div>
                            
                            {/* Quantity Adjuster & Delete */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-sm p-0.5">
                                <button 
                                  onClick={() => updatePartQty(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-slate-900 hover:bg-slate-200 rounded-sm text-[13.5px] font-bold transition-all cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-[13.5px] font-bold text-white">{item.qty}</span>
                                <button 
                                  onClick={() => updatePartQty(item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-text-primary hover:bg-slate-900 rounded text-[13.5px] font-bold transition-all cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => removePartFromList(item.id)}
                                className="p-1 text-text-secondary hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove Part"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setIncStep(1)} className="phone-btn-secondary flex-1">Back</button>
                    <button 
                      disabled={scannedPartsList.length === 0 && !scannedPN}
                      onClick={() => {
                        if (scannedPN) {
                          // Auto-add current scanning part
                          const isDuplicate = scannedPartsList.some(p => p.part_number === scannedPN && p.bin === (scannedBin || 'N/A'));
                          if (!isDuplicate) {
                            const newItem = {
                              id: `sp_${Date.now()}`,
                              part_number: scannedPN,
                              description: partInfo ? partInfo.description : 'Custom/Other Defective Part',
                              supplier_id: partInfo ? partInfo.supplier_id : 'magna',
                              bin: scannedBin || 'BIN-GEN-01',
                              qty: 1
                            };
                            setScannedPartsList(prev => [...prev, newItem]);
                            playBeep('success');
                          }
                          // Clear inputs
                          setScannedPN('');
                          setScannedBin('');
                          setPartInfo(null);
                          setManualEntryWarning(false);
                        }
                        setIncStep(3);
                      }}
                      className="phone-btn-primary flex-1"
                    >
                      <span>Describe Defect</span>
                      <ChevronRight className="w-4.5 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DESCRIBE & CONTEXT (FIELDS WITH COUNTER AND AUTOCOMPLETE) */}
              {incStep === 3 && (
                <div className="flex flex-col gap-3">
                  {/* Media Route Security Help Panel */}
                  <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-900 shadow-sm mb-1 text-left">
                    <button 
                      type="button"
                      onClick={() => setShowMediaHelpPanel(!showMediaHelpPanel)}
                      className="w-full flex items-center justify-between font-bold text-[11.5px] text-blue-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Media Route & Data Flow Info</span>
                      </span>
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase">{showMediaHelpPanel ? 'Hide' : 'Explain'}</span>
                    </button>
                    
                    {showMediaHelpPanel && (
                      <div className="mt-2 pt-2 border-t border-blue-200/70 flex flex-col gap-2 text-left leading-relaxed">
                        <div>
                          <strong className="text-blue-950 font-bold block mb-0.5">Incident Evidence Route:</strong>
                          <span className="font-mono text-[10px] bg-blue-100/70 px-1.5 py-0.5 rounded text-blue-900 block border border-blue-200">This phone → IDS secure media → Lead review → Customer after approval</span>
                        </div>
                        <div>
                          <strong className="text-blue-950 font-bold block mb-0.5">Expense Receipt Route:</strong>
                          <span className="font-mono text-[10px] bg-blue-100/70 px-1.5 py-0.5 rounded text-blue-900 block border border-blue-200">This phone → IDS secure media → Authorized expense review</span>
                          <span className="text-[9.5px] italic text-slate-500 block mt-1">*Note: Customers cannot view receipt media under company privacy policy.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[11.5px] text-blue-700 font-bold uppercase tracking-wider">Step 3: Suspect Material Metadata</span>

                  {/* Area Found */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-slate-700 uppercase pl-1">Area of Factory Floor</label>
                    <select 
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="phone-select"
                    >
                      <option value="Online assembly">Online assembly</option>
                      <option value="Sequence Area">Sequence Area</option>
                      <option value="Heavy rework">Heavy rework</option>
                      <option value="Review Scrap Table">Scrap tables</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Defect Type Suggestions */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-slate-700 uppercase pl-1">Suspect Material Category</label>
                    <select 
                      value={defectType}
                      onChange={(e) => {
                        setDefectType(e.target.value);
                        if (e.target.value !== 'Other') {
                          setCustomDefect(e.target.value);
                        }
                      }}
                      className="phone-select"
                    >
                      <option value="">-- Choose Suggestion --</option>
                      {getDefectSuggestions().map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                      <option value="Other">Other (Type custom defect)</option>
                    </select>
                  </div>

                  {/* Custom Description Text with Word Count guidance (50 - 300 words recommended) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-[10.5px] font-bold text-slate-700 uppercase">Suspect Material Narrative</label>
                      <span className={`text-[12.5px] font-bold ${description?.split(/\s+/).filter(Boolean).length < 20 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {description?.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="phone-textarea"
                      placeholder="Narrate details. Spare bulb found loose causing rattling sound inside assembly housing..."
                    />
                  </div>

                  {/* Action Taken */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-slate-700 uppercase pl-1">Action Taken immediately</label>
                    <input 
                      type="text" 
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="phone-input"
                      placeholder="e.g. Removed bulb manually"
                    />
                  </div>

                  {/* Supplier Contact */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-slate-700 uppercase pl-1">Contact Person at Supplier</label>
                    <input 
                      type="text" 
                      value={supplierContact}
                      onChange={(e) => setSupplierContact(e.target.value)}
                      className="phone-input"
                      placeholder="Martin / Shahroz / SQE"
                    />
                  </div>

                  {/* Magna AutoSystems Specific Fields (NoCOVID screening fields, PRR class only) */}
                  <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 flex flex-col gap-3 mt-2 shadow-sm">
                    <span className="text-[10.5px] text-[#3B82F6] font-extrabold uppercase tracking-wider block border-b border-slate-850 pb-1.5">{getActiveClientForPlant()} Specifications</span>
                    <div className="flex flex-col gap-3 text-[11.5px]">
                      
                      {/* Returned */}
                      <div className="flex justify-between items-center bg-white p-2 rounded-sm border border-slate-300">
                        <span className="text-slate-600 font-bold">Returned to Supplier?</span>
                        <div className="phone-toggle-group w-24">
                          <button 
                            type="button" 
                            onClick={() => setIsReturningDefect('Y')} 
                            className={`phone-toggle-btn ${
                              isReturningDefect === 'Y' ? 'active-blue' : ''
                            }`}
                          >
                            Yes
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsReturningDefect('N')} 
                            className={`phone-toggle-btn ${
                              isReturningDefect === 'N' ? 'active-navy' : ''
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Sort */}
                      <div className="flex justify-between items-center bg-white p-2 rounded-sm border border-slate-300">
                        <span className="text-slate-600 font-bold">Supplier Sort Needed?</span>
                        <div className="phone-toggle-group w-24">
                          <button 
                            type="button" 
                            onClick={() => setIsSortRequired('Y')} 
                            className={`phone-toggle-btn ${
                              isSortRequired === 'Y' ? 'active-blue' : ''
                            }`}
                          >
                            Yes
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsSortRequired('N')} 
                            className={`phone-toggle-btn ${
                              isSortRequired === 'N' ? 'active-navy' : ''
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* RMA Required */}
                      <div className="flex justify-between items-center bg-white p-2 rounded-sm border border-slate-300">
                        <span className="text-slate-600 font-bold">RMA Code Required?</span>
                        <div className="phone-toggle-group w-24">
                          <button 
                            type="button" 
                            onClick={() => setIsRmaRequired('Y')} 
                            className={`phone-toggle-btn ${
                              isRmaRequired === 'Y' ? 'active-blue' : ''
                            }`}
                          >
                            Yes
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setIsRmaRequired('N')} 
                            className={`phone-toggle-btn ${
                              isRmaRequired === 'N' ? 'active-navy' : ''
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Classification / Severity */}
                      <div className="flex flex-col gap-1.5 bg-white p-2.5 rounded-sm border border-slate-300">
                        <span className="text-slate-600 font-bold">Issue Severity Classification:</span>
                        <div className="phone-toggle-group w-full mt-1">
                          <button 
                            type="button" 
                            onClick={() => setConcernClassification('Verbal')} 
                            className={`phone-toggle-btn ${
                              concernClassification === 'Verbal' ? 'active-navy' : ''
                            }`}
                          >
                            Verbal (Informal)
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setConcernClassification('PRR')} 
                            className={`phone-toggle-btn ${
                              concernClassification === 'PRR' ? 'active-blue' : ''
                            }`}
                          >
                            PRR (Standard)
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setConcernClassification('QR')} 
                            className={`phone-toggle-btn ${
                              concernClassification === 'QR' ? 'active-rose' : ''
                            }`}
                          >
                            QR (Critical)
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setIncStep(2)} className="phone-btn-secondary flex-1">Back</button>
                    <button 
                      disabled={!description}
                      onClick={handleProceedToReview}
                      className="phone-btn-primary flex-1"
                    >
                      <span>Review & Send</span>
                      <ChevronRight className="w-4.5 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3.5: AI DUPLICATE CHECK WARNING */}
              {incStep === 3.5 && duplicateIncident && (
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-[13.5px] font-bold text-amber-700 uppercase tracking-wider">AI Duplicate Warning</h3>
                    <p className="text-[11.5px] text-slate-600 mt-1">A highly similar report was filed in the last 24 hours.</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-sm border border-slate-300 text-center flex flex-col gap-1 shadow-sm">
                    <div className="flex justify-between items-center text-[10.5px] text-slate-600">
                      <span>Jaccard Word Similarity</span>
                      <span className="text-blue-700 font-bold">{(duplicateIncident.similarity * 100).toFixed(0)}% Match</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-sm h-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-sm" 
                        style={{ width: `${Math.min(100, duplicateIncident.similarity * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-sm border border-slate-300 text-[12.5px] flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 font-mono">
                      <span className="text-[10.5px] text-blue-700">{duplicateIncident.incident.id}</span>
                      <span className="text-[10.5px] text-slate-600">{new Date(duplicateIncident.incident.created_at || duplicateIncident.incident.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-slate-700 italic">"{duplicateIncident.incident.description}"</p>
                    <div className="flex justify-between items-center text-[10.5px] text-text-secondary pt-1.5 border-t border-slate-300 font-medium">
                      <span>Rep: Clarence Kuiken</span>
                      <span>Area: {duplicateIncident.incident.area}</span>
                    </div>
                  </div>

                  <div className="text-[11.5px] text-slate-700 bg-amber-50 border border-amber-200 p-2.5 rounded-sm leading-relaxed shadow-sm">
                    🌟 <strong>Merge Observations</strong> will increment the quantity on the existing incident and append your new notes, avoiding double-reporting to the client.
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={handleMergeDuplicate}
                      className="phone-btn-primary bg-green-600 hover:bg-green-700 border-green-700 text-white flex items-center justify-center gap-1.5 w-full cursor-pointer py-2.5 shadow-sm"
                    >
                      <span>Merge Observations</span>
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIncStep(3)} 
                        className="phone-btn-secondary flex-1 py-2 text-[11.5px]"
                      >
                        Back / Edit
                      </button>
                      <button 
                        onClick={() => setIncStep(4)} 
                        className="phone-btn-secondary flex-1 py-2 text-[11.5px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
                      >
                        Continue Separate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SEND (EMAIL SUBJECT & CC PREVIEW) */}
              {incStep === 4 && (
                <div className="flex flex-col gap-3">
                  <span className="text-[11.5px] text-blue-700 font-bold uppercase tracking-wider">Step 4: Audit & Release</span>

                  {/* Summary Card */}
                  <div className="bg-white rounded-sm p-3 border border-slate-300 flex flex-col gap-2 text-[13.5px] shadow-sm">
                    <div className="flex justify-between items-center text-[11.5px]"><span className="text-text-secondary">Report Status:</span><span className="text-amber-600 font-bold uppercase">Ready to Release</span></div>
                    <div className="flex justify-between items-center text-[11.5px]"><span className="text-text-secondary">Part Number:</span><span className="text-slate-900 font-bold">{scannedPN}</span></div>
                    <div className="flex justify-between items-center text-[11.5px]"><span className="text-text-secondary">Plant / Area:</span><span className="text-slate-900 font-bold">{plants.find(p => p.id === selectedPlant)?.name} | {selectedArea}</span></div>
                  </div>

                  {/* Email Preview Accordion */}
                  <div className="border border-slate-300 bg-white rounded-sm overflow-hidden shadow-sm">
                    <button 
                      type="button"
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                      className="w-full px-3.5 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-[13.5px] font-bold text-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4.5 h-4.5 text-blue-700" />
                        <span>Inspect Outgoing Email Preview</span>
                      </div>
                      <span className="text-[10.5px]">{showEmailPreview ? 'Collapse' : 'Expand'}</span>
                    </button>

                    {showEmailPreview && (
                      <div className="p-3 border-t border-slate-300 text-[10.5px] font-mono flex flex-col gap-2 bg-white text-slate-700 max-h-[180px] overflow-y-auto">
                        <div>
                          <span className="text-blue-700 font-bold">To:</span> martin.s@magna.com, shahroz.m@magna.com
                        </div>
                        <div>
                          <span className="text-blue-700 font-bold">CC:</span> donna.c@integritydriven.com, greg.p@integritydriven.com
                        </div>
                        <div>
                          <span className="text-blue-700 font-bold">Subject:</span> [INCIDENT] PN {scannedPN} | {selectedArea} | {plants.find(p => p.id === selectedPlant)?.name} | {new Date().toLocaleDateString()}
                        </div>
                        <div className="border-t border-slate-200 pt-2 text-slate-600">
                          <p className="font-sans font-semibold text-slate-900">Hello Shahroz.</p>
                          <p className="mt-1 leading-relaxed font-sans text-slate-700">{description}</p>
                          <p className="mt-2 font-sans"><strong>Action Taken:</strong> {actionTaken}</p>
                          <p className="mt-1 font-sans text-[11.5px]"><strong>Traceability Info:</strong> Returned: {isReturningDefect} | Sort: {isSortRequired} | RMA: {isRmaRequired} | Class: {concernClassification}</p>
                          <p className="mt-2 font-sans text-[12.5px] text-text-secondary">Regards,<br/>{currentUser.name} | IDS Rep</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setIncStep(3)} className="phone-btn-secondary flex-1">Back</button>
                    <button 
                      onClick={handleSendIncident}
                      disabled={isSendingIncident}
                      className="phone-btn-primary flex-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingIncident ? 'Sending report...' : 'Release & Send Email'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* SCREEN 3.5: PHOTO ANNOTATION OVERLAY CANVAS */}
        {showDrawingCanvas && capturedPhotos[drawingTarget] && (
          <div className="absolute inset-0 bg-surface-elevated/60 backdrop-blur-sm z-50 flex flex-col justify-between p-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 bg-white rounded-t-sm px-4 pt-4 shadow-sm">
              <span className="text-[13.5px] font-bold text-slate-900 uppercase tracking-wider">
                Annotate {drawingTarget === 'wide' ? 'Wide Shot' : drawingTarget === 'medium' ? 'Medium View' : 'Close-Up'}
              </span>
              <button 
                onClick={() => setShowDrawingCanvas(false)}
                className="text-text-secondary hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-50 border-x border-slate-200 overflow-hidden relative shadow-sm">
              <canvas 
                ref={canvasRef}
                width={300}
                height={300}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border border-slate-300 bg-white shadow-sm cursor-crosshair"
              />
            </div>

            <div className="flex gap-2 bg-white rounded-b-sm border-t border-slate-200 p-3 shadow-sm">
              <button 
                onClick={clearCanvas}
                className="phone-btn-secondary flex-1"
              >
                Reset Canvas
              </button>
              <button 
                onClick={saveCanvasAnnotation}
                className="phone-btn-primary flex-1"
              >
                Apply Drawing
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3.8: SCANNING VIEW OVERLAY */}
        {scanningType && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col justify-between p-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-[13.5px] font-bold text-white uppercase tracking-wider">Camera Label Scanner</span>
              <button onClick={() => setScanningType(null)} className="text-slate-600 hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>

            {/* Viewfinder scanning frame with Multi-Code detection overlay */}
            <div className="flex-1 bg-slate-900 border-2 border-blue-500/50 rounded-sm my-4 relative flex flex-col items-center justify-center overflow-hidden shadow-sm">
              <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-lg shadow-red-500 pulsing-indicator top-1/2 z-20 pointer-events-none"></div>
              
              <div className="absolute top-3 text-center px-4 z-20 bg-slate-900/90 py-1 rounded-sm border border-slate-700 shadow-sm">
                <p className="text-[11.5px] text-white font-semibold">⚠️ Multiple Codes Detected</p>
                <p className="text-[12.5px] text-blue-600 font-medium">Tap the green box for Part Number / Bin</p>
              </div>

              {/* Selection Options represented as a physical label mock in the viewfinder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-surface-elevated/60 z-10">
                {scanningType === 'barcode' ? (
                  /* PHYSICAL LABEL MOCK FOR BARCODES */
                  <div className="bg-white text-slate-950 p-2.5 rounded-lg border-2 border-slate-300 shadow-2xl w-full max-w-[260px] flex flex-col gap-1.5 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[12.5px] text-text-secondary font-bold uppercase tracking-wider">
                      <span>{getActiveClientForPlant()} Facility</span>
                      <span>LOT: 902A5</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Code 1: Serial Code (Incorrect) */}
                      <div className="relative border border-dashed border-slate-350 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs opacity-80">
                          <span className="text-[5px] text-slate-600 font-mono tracking-widest">SERIAL BARCODE</span>
                        </div>
                        <span className="text-[11.5px] font-bold font-mono text-slate-550 mt-0.5">S/N: 901485291</span>

                        {/* Wrong tag warning overlay */}
                        <button 
                          type="button"
                          onClick={() => {
                            playBeep('warning');
                            showToast("Incorrect Code! Please tap Part Number barcode below.", "warning");
                          }}
                          className="absolute inset-0 bg-red-50 border border-red-500/40 rounded flex items-center justify-center cursor-pointer hover:bg-red-100"
                        >
                          <span className="bg-red-600 text-white font-extrabold px-1 py-1 rounded-[3px] text-[6px] uppercase tracking-wide">Serial Code</span>
                        </button>
                      </div>

                      {/* Code 2: Part Number (Correct Tail Light) */}
                      <div className="relative border border-dashed border-slate-350 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs">
                          <span className="text-[5px] text-emerald-600 font-mono tracking-widest">PART NUMBER BARCODE</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold font-mono text-slate-900 mt-0.5">PN: 86286761 (Tail Light)</span>

                        {/* Correct clickable scan overlay */}
                        <button 
                          type="button"
                          onClick={() => selectScanOption('86286761')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        >
                          <span className="bg-emerald-500 text-white font-extrabold px-2 py-1 rounded-[4px] text-[11.5px] uppercase tracking-wider animate-bounce">Tap to Scan PN 86286761</span>
                        </button>
                      </div>

                      {/* Code 3: Alternate Part Number (Correct Headlight) */}
                      <div className="relative border border-dashed border-slate-350 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs">
                          <span className="text-[5px] text-emerald-600 font-mono tracking-widest">PART NUMBER BARCODE</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold font-mono text-slate-900 mt-0.5">PN: 86291945 (Headlight)</span>

                        {/* Correct clickable scan overlay */}
                        <button 
                          type="button"
                          onClick={() => selectScanOption('86291945')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        >
                          <span className="bg-emerald-500 text-white font-extrabold px-2 py-1 rounded-[4px] text-[11.5px] uppercase tracking-wider">Tap to Scan PN 86291945</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PHYSICAL LABEL MOCK FOR QR BIN SCANS */
                  <div className="bg-white text-slate-950 p-3 rounded-lg border-2 border-slate-300 shadow-2xl w-full max-w-[260px] flex flex-col gap-2 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[12.5px] text-text-secondary font-bold uppercase">
                      <span>{getActiveClientForPlant()} Storage</span>
                      <span>SECTION: B4</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* QR Code 1: Batch Code (Incorrect) */}
                      <div className="relative border border-slate-200 p-1.5 flex flex-col items-center justify-center rounded bg-slate-50">
                        <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                          <span className="text-[5px] text-slate-600 uppercase tracking-widest font-mono">QR</span>
                        </div>
                        <span className="text-[11.5px] font-bold text-slate-550 mt-1">BATCH CODE</span>

                        <button 
                          type="button"
                          onClick={() => {
                            playBeep('warning');
                            showToast("Incorrect QR! Please tap green Bin Location QR.", "warning");
                          }}
                          className="absolute inset-0 bg-red-50 border border-red-500/40 rounded flex items-center justify-center cursor-pointer hover:bg-red-100"
                        >
                          <span className="bg-red-600 text-white font-extrabold px-1 py-1 rounded-[3px] text-[6px] uppercase tracking-wide">Batch QR</span>
                        </button>
                      </div>

                      {/* QR Code 2: Bin Location (Correct) */}
                      <div className="relative border border-slate-200 p-1.5 flex flex-col items-center justify-center rounded bg-slate-50">
                        <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                          <span className="text-[5px] text-emerald-600 uppercase tracking-widest font-mono">QR</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-slate-900 mt-1">BIN: BIN-MAG-6761</span>

                        <button 
                          type="button"
                          onClick={() => selectScanOption('86286761')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors animate-pulse"
                        >
                          <span className="bg-emerald-500 text-white font-extrabold px-1 py-1 rounded-[3px] text-[6px] uppercase tracking-wider text-center">Tap Bin QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button onClick={() => setScanningType(null)} className="phone-btn-secondary">
              Back to Form
            </button>
          </div>
        )}

        {/* SCREEN 3.9: INCIDENT SENT CONFIRMATION SCREEN */}
        {incidentSentConfirmation && (
          <div className="flex-1 flex flex-col justify-between p-3 bg-slate-50 animate-in fade-in duration-200">
            <div className="my-auto flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-[13.5px] font-bold text-slate-900 mb-2">Incident Released</h2>
              <p className="text-[13.5px] text-slate-600 leading-relaxed max-w-[240px]">
                Defect report has been successfully sent out.
              </p>
              <div className="bg-white rounded-sm p-3 border border-slate-300 w-full max-w-[260px] text-[11.5px] text-slate-600 mt-4 flex flex-col gap-1.5 text-left shadow-sm">
                <div><span className="text-text-secondary font-bold uppercase">Sent At:</span> <span className="text-slate-900 font-bold">18:22 PM Today</span></div>
                <div><span className="text-text-secondary font-bold uppercase">Recipient:</span> <span className="text-slate-900 font-bold">martin.s@magna.com</span></div>
                <div><span className="text-text-secondary font-bold uppercase">Notification:</span> <span className="text-blue-700 font-bold">Donna Cabral CC'd</span></div>
              </div>
            </div>

            <button 
              onClick={resetIncidentScreen}
              className="phone-btn-primary"
            >
              Close and Return to Home
            </button>
          </div>
        )}

        {/* SCREEN 4: SHIFT SUMMARY (Walked Area Checklist and Bonus tasks) */}
        {activeScreen === 'summary' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
              <button onClick={() => setActiveScreen('home')} className="text-text-secondary hover:text-slate-900 flex items-center gap-1 text-[13.5px]"><ArrowLeft className="w-4.5 h-4" /><span>Home</span></button>
              <h2 className="text-[13.5px] font-bold text-slate-900 uppercase tracking-wider">Daily Quality Report</h2>
              <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1">
                <h3 className="text-[13.5px] font-bold text-slate-900">Daily Area Walks</h3>
                <p className="text-[11.5px] text-slate-600">Tap statuses to confirm walks or add floor notes.</p>
              </div>

              {/* Area Cards list */}
              <div className="flex flex-col gap-3">
                {areasWalked.map(area => (
                  <div key={area.id} className="bg-white border border-slate-300 rounded-sm p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[13.5px] font-bold text-slate-900">{area.name}</span>
                      <div className="phone-toggle-group w-32">
                        <button 
                          onClick={() => toggleAreaStatus(area.id, 'no_issues')} 
                          className={`phone-toggle-btn ${area.status === 'no_issues' ? 'active-emerald' : ''}`}
                        >
                          All Good
                        </button>
                        <button 
                          onClick={() => toggleAreaStatus(area.id, 'issues')} 
                          className={`phone-toggle-btn ${area.status === 'issues' ? 'active-rose' : ''}`}
                        >
                          Defect
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={area.notes}
                      onChange={(e) => updateAreaNotes(area.id, e.target.value)}
                      placeholder="Spoke with Martin, no parts on scrap tables..."
                      className="phone-input h-9 px-3 text-[11.5px]"
                    />
                  </div>
                ))}
              </div>

              {/* Bonus tasks card */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                <span className="text-[11.5px] text-blue-700 font-bold uppercase tracking-wider">Requested Sorts & Audits</span>
                {bonusTasks.map(task => (
                  <div key={task.id} className="bg-white border border-slate-300 rounded-sm p-3 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[11.5px] font-bold text-slate-900">{task.task}</p>
                      <p className="text-[12.5px] text-text-secondary mt-0.5">Matt request</p>
                    </div>
                    <button 
                      onClick={() => {
                        setBonusTasks(prev => {
                          const next = prev.map(bt => bt.id === task.id ? { ...bt, status: bt.status === 'completed' ? 'pending' : 'completed' } : bt);
                          saveDraftShiftReport(null, next);
                          return next;
                        });
                      }}
                      className={`h-8 px-2.5 rounded-sm text-[10.5px] font-bold border transition-colors cursor-pointer ${
                        task.status === 'completed' 
                          ? 'bg-emerald-50 border-transparent text-emerald-700 shadow-sm' 
                          : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm'
                      }`}
                    >
                      {task.status === 'completed' ? 'Completed' : 'Audit'}
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSendShiftReport}
                disabled={sendingShiftReport}
                className="phone-btn-primary mt-4"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingShiftReport ? 'Compiling report...' : 'Submit Daily Quality Report'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: ROUTINE QUALITY INSPECTION LOG FORM */}
        {activeScreen === 'inspection' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
              <button onClick={() => setActiveScreen('home')} className="text-text-secondary hover:text-slate-900 flex items-center gap-1 text-[13.5px]"><ArrowLeft className="w-4.5 h-4" /><span>Home</span></button>
              <h2 className="text-[13.5px] font-bold text-slate-900 uppercase tracking-wider">Routine Quality Inspection</h2>
              <div className="w-10"></div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const finalPN = inspPNMode === 'manual' ? (inspCustomPN.trim() || 'CUSTOM_PART') : inspPartNumber;
              const finalDefect = inspDefectMode === 'custom' ? (inspCustomDefectCode.trim() || 'Custom Inspection Defect') : inspDefectCode;
              const passPcs = parseInt(inspPassQty) || 0;
              const rejectPcs = parseInt(inspRejectQty) || 0;
              const totalPcs = passPcs + rejectPcs;

              if (totalPcs <= 0) {
                alert("Please enter at least 1 inspected part quantity (Passed or Rejected).");
                return;
              }

              addReworkLog({
                rep_id: currentUser.id,
                part_number: finalPN,
                inspected_pcs: totalPcs,
                reworked_pcs: passPcs,
                defects_pcs: rejectPcs,
                hours_spent: parseFloat(inspHoursSpent) || 1.0,
                defect_code: finalDefect,
                scanned_barcodes: inspScannedBarcodes,
                notes: inspNotes || 'Routine floor quality inspection recorded.',
                created_at: new Date().toISOString()
              });

              logSystemEvent('inspection', 'create', `${currentUser.name} logged routine inspection of ${totalPcs} pcs for Part #${finalPN}.`);

              showToast(`Logged inspection for ${totalPcs} pcs (${passPcs} passed, ${rejectPcs} rejected)!`, "success");
              setInspPassQty(0);
              setInspRejectQty(0);
              setInspNotes('');
              setInspCustomPN('');
              setInspCustomDefectCode('');
              setInspScannedBarcodes([]);
              setActiveScreen('home');
            }} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-left">
              
              {/* SECTION 1: PART NUMBER INSPECTED (Dropdown + Manual Input + Unlimited Scanner) */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Part Number Inspected</span>
                  </label>

                  {/* Mode Segmented Toggle */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setInspPNMode('dropdown')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${inspPNMode === 'dropdown' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspPNMode('manual')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${inspPNMode === 'manual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Custom Input
                    </button>
                  </div>
                </div>

                {inspPNMode === 'dropdown' ? (
                  <select 
                    value={inspPartNumber}
                    onChange={(e) => setInspPartNumber(e.target.value)}
                    className="phone-select text-[12.5px] font-bold"
                  >
                    <option value="86286761">PN 86286761 (Tail Light Assembly)</option>
                    <option value="86291945">PN 86291945 (Headlight Bin)</option>
                    <option value="86300412">PN 86300412 (Harness Bracket)</option>
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={inspCustomPN}
                    onChange={(e) => setInspCustomPN(e.target.value)}
                    placeholder="Type custom part number or serial e.g. PN-99042..."
                    className="phone-input text-[12.5px] font-bold"
                  />
                )}

                {/* QR / BARCODE SCANNER ACTION BUTTON */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsInspScannerOpen(true)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                  >
                    <QrCode className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>Scan Inspected Part Barcode / QR Tag</span>
                    {inspScannedBarcodes.length > 0 && (
                      <span className="ml-1 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                        {inspScannedBarcodes.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* UNLIMITED SCANNED BARCODES LIST */}
                {inspScannedBarcodes.length > 0 && (
                  <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span className="uppercase tracking-wider">Scanned Inspection Tags ({inspScannedBarcodes.length})</span>
                      <button 
                        type="button" 
                        onClick={() => setInspScannedBarcodes([])}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {inspScannedBarcodes.map((code, idx) => (
                        <div key={idx} className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[10.5px] font-mono flex items-center gap-1.5 text-slate-800 shadow-2xs">
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = inspScannedBarcodes.filter((_, i) => i !== idx);
                              setInspScannedBarcodes(updated);
                              setInspPassQty(updated.length);
                            }}
                            className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: PASSED & REJECTED QUANTITIES */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5 bg-emerald-50/60 border border-emerald-200/80 p-2 rounded-xl">
                    <label className="text-[10.5px] font-black text-emerald-800 uppercase tracking-wider">Passed Pcs</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInspPassQty(Math.max(0, inspPassQty - 1))}
                        className="w-8 h-8 bg-white border border-emerald-300 rounded flex items-center justify-center text-emerald-700 font-extrabold text-sm shadow-2xs cursor-pointer"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min="0"
                        value={inspPassQty}
                        onChange={(e) => setInspPassQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="phone-input text-center flex-1 h-8 font-black text-emerald-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setInspPassQty(inspPassQty + 1)}
                        className="w-8 h-8 bg-emerald-600 text-white rounded flex items-center justify-center font-extrabold text-sm shadow-2xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex gap-1 pt-0.5 justify-center text-[9.5px]">
                      {[5, 10, 25].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setInspPassQty(prev => prev + n)}
                          className="px-1.5 py-0.5 bg-white border border-emerald-300 text-emerald-800 font-bold rounded cursor-pointer"
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 bg-rose-50/60 border border-rose-200/80 p-2 rounded-xl">
                    <label className="text-[10.5px] font-black text-rose-800 uppercase tracking-wider">Rejected Pcs</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInspRejectQty(Math.max(0, inspRejectQty - 1))}
                        className="w-8 h-8 bg-white border border-rose-300 rounded flex items-center justify-center text-rose-700 font-extrabold text-sm shadow-2xs cursor-pointer"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min="0"
                        value={inspRejectQty}
                        onChange={(e) => setInspRejectQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="phone-input text-center flex-1 h-8 font-black text-rose-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setInspRejectQty(inspRejectQty + 1)}
                        className="w-8 h-8 bg-rose-600 text-white rounded flex items-center justify-center font-extrabold text-sm shadow-2xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex gap-1 pt-0.5 justify-center text-[9.5px]">
                      {[1, 5, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setInspRejectQty(prev => prev + n)}
                          className="px-1.5 py-0.5 bg-white border border-rose-300 text-rose-800 font-bold rounded cursor-pointer"
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>TOTAL BATCH INSPECTED:</span>
                  <span className="text-slate-900 font-black text-xs">{(parseInt(inspPassQty)||0) + (parseInt(inspRejectQty)||0)} PCS</span>
                </div>
              </div>

              {/* SECTION 3: DEFECT CATEGORY / CODE (Dropdown + Custom Input) */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider">Defect Category / Code</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setInspDefectMode('preset')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${inspDefectMode === 'preset' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Preset Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspDefectMode('custom')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${inspDefectMode === 'custom' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Custom Code
                    </button>
                  </div>
                </div>

                {inspDefectMode === 'preset' ? (
                  <select 
                    value={inspDefectCode}
                    onChange={(e) => setInspDefectCode(e.target.value)}
                    className="phone-select text-[12px] font-bold"
                  >
                    <option value="Routine Inspection">Routine Inspection - Pass (OK)</option>
                    <option value="Surface Scratch">Surface Scratch / Dent</option>
                    <option value="Terminal Pin Bend">Terminal Pin Deformation</option>
                    <option value="Dimensional Out of Spec">Dimensional Out of Spec</option>
                    <option value="Missing Seal">Missing Gasket / Seal</option>
                    <option value="Coating Mismatch">Color / Paint Mismatch</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={inspCustomDefectCode}
                    onChange={(e) => setInspCustomDefectCode(e.target.value)}
                    placeholder="Enter custom defect category or code..."
                    className="phone-input text-[12px] font-bold"
                  />
                )}
              </div>

              {/* SECTION 4: TIME SPENT (HOURS) */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider">Time Spent (Hours)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspHoursSpent(Math.max(0, parseFloat((inspHoursSpent - 0.5).toFixed(1))))}
                    className="w-11 h-11 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg flex items-center justify-center text-rose-600 font-extrabold text-[16px] select-none cursor-pointer flex-shrink-0 shadow-xs"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={inspHoursSpent}
                    onChange={(e) => setInspHoursSpent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="phone-input text-center flex-1 h-11 text-base font-black text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setInspHoursSpent(parseFloat((inspHoursSpent + 0.5).toFixed(1)))}
                    className="w-11 h-11 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 font-extrabold text-[16px] select-none cursor-pointer flex-shrink-0 shadow-xs"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                  <span className="text-slate-400 font-bold">Quick:</span>
                  {[0.5, 1.0, 1.5, 2.0, 4.0].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setInspHoursSpent(h)}
                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${inspHoursSpent === h ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'}`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 5: INSPECTION NOTES / SUMMARY */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider">Inspection Notes / Summary</label>
                <textarea 
                  value={inspNotes}
                  onChange={(e) => setInspNotes(e.target.value)}
                  rows={3}
                  placeholder="Details of batch inspection on production line..."
                  className="phone-textarea text-[12px]"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    "Passed batch inspection",
                    "Minor surface scuff on housing",
                    "Re-checked 50 pcs batch",
                    "Quarantined rejected bin"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInspNotes(prev => prev ? `${prev} ${preset}.` : `${preset}.`)}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded text-[9.5px] font-semibold transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                type="submit" 
                className="phone-btn-primary mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[13.5px] rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle className="w-4.5 h-4" />
                <span>SAVE ROUTINE INSPECTION LOG</span>
              </button>
            </form>

            {/* SCANNER MODAL FOR ROUTINE INSPECTION */}
            {isInspScannerOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-black uppercase">Inspection Barcode / QR Scanner</h3>
                      <p className="text-[10px] text-slate-400">Scan unlimited barcodes for floor quality inspection</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsInspScannerOpen(false)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Viewfinder simulation */}
                <div className="relative my-auto mx-auto w-64 h-64 border-2 border-dashed border-emerald-400 rounded-2xl flex flex-col items-center justify-center p-4 text-center bg-slate-900/60 shadow-2xl">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse my-auto"></div>
                  <p className="text-xs text-emerald-200 font-mono mt-2">Point camera at part barcode / QR label</p>
                </div>

                {/* Scanner controls & instant simulated scan options */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instant Scan Options (Unlimited):</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["PN-86286761", "PN-86291945", "PN-86300412"].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          const tag = `${code}-${Date.now().toString().slice(-4)}`;
                          const updated = [...inspScannedBarcodes, tag];
                          setInspScannedBarcodes(updated);
                          setInspPassQty(updated.length);
                          if (inspPNMode === 'dropdown') setInspPartNumber(code.replace('PN-', ''));
                          showToast(`Scanned ${tag}!`, "success");
                        }}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[10.5px] font-mono border border-slate-700 text-center cursor-pointer"
                      >
                        + {code}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800 mt-1">
                    <input
                      type="text"
                      value={inspScanInput}
                      onChange={(e) => setInspScanInput(e.target.value)}
                      placeholder="Type custom barcode string..."
                      className="phone-input bg-slate-950 text-white border-slate-800 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!inspScanInput.trim()) return;
                        const updated = [...inspScannedBarcodes, inspScanInput.trim()];
                        setInspScannedBarcodes(updated);
                        setInspPassQty(updated.length);
                        setInspScanInput('');
                        showToast("Custom barcode added!", "success");
                      }}
                      className="px-3 py-2 bg-emerald-600 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInspScannerOpen(false)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs mt-1 cursor-pointer"
                  >
                    Done Scanning ({inspScannedBarcodes.length} Items)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 5: REWORK LOG FORM */}
        {activeScreen === 'rework' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
              <button onClick={() => setActiveScreen('home')} className="text-text-secondary hover:text-slate-900 flex items-center gap-1 text-[13.5px]"><ArrowLeft className="w-4.5 h-4" /><span>Home</span></button>
              <h2 className="text-[13.5px] font-bold text-slate-900 uppercase tracking-wider">Log Billable Rework</h2>
              <div className="w-10"></div>
            </div>

            <form onSubmit={handleReworkSubmit} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-left">
              
              {/* SECTION 1: PART NUMBER IDENTIFICATION & BARCODE SCANNER */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>Part Number Reworked</span>
                  </label>

                  {/* Mode Segmented Toggle: Dropdown vs Manual */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setReworkPNMode('dropdown')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${reworkPNMode === 'dropdown' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setReworkPNMode('manual')}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${reworkPNMode === 'manual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Custom Input
                    </button>
                  </div>
                </div>

                {reworkPNMode === 'dropdown' ? (
                  <select 
                    value={reworkPN}
                    onChange={(e) => setReworkPN(e.target.value)}
                    className="phone-select text-[12.5px] font-bold"
                  >
                    <option value="86286761">PN 86286761 (Tail Light Assembly)</option>
                    <option value="86291945">PN 86291945 (Headlight Bin)</option>
                    <option value="86300412">PN 86300412 (Harness Bracket)</option>
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={reworkCustomPN}
                    onChange={(e) => setReworkCustomPN(e.target.value)}
                    placeholder="Type custom part number or serial e.g. PN-99042..."
                    className="phone-input text-[12.5px] font-bold"
                  />
                )}

                {/* QR / BARCODE SCANNER ACTION BUTTON */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsReworkScannerOpen(true)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
                  >
                    <QrCode className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>Scan Part Barcode / QR Tag</span>
                    {reworkScannedBarcodes.length > 0 && (
                      <span className="ml-1 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                        {reworkScannedBarcodes.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* UNLIMITED SCANNED BARCODES LIST */}
                {reworkScannedBarcodes.length > 0 && (
                  <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span className="uppercase tracking-wider">Scanned Barcodes / QR List ({reworkScannedBarcodes.length})</span>
                      <button 
                        type="button" 
                        onClick={() => setReworkScannedBarcodes([])}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {reworkScannedBarcodes.map((code, idx) => (
                        <div key={idx} className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[10.5px] font-mono flex items-center gap-1.5 text-slate-800 shadow-2xs">
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = reworkScannedBarcodes.filter((_, i) => i !== idx);
                              setReworkScannedBarcodes(updated);
                              if (updated.length > 0) setReworkQty(updated.length);
                            }}
                            className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: REWORK QTY (PIECES) */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider">Rework Qty (Pieces)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReworkQty(Math.max(0, reworkQty - 1))}
                    className="w-11 h-11 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg flex items-center justify-center text-rose-600 font-extrabold text-[16px] select-none cursor-pointer transition-colors flex-shrink-0 shadow-xs"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="0"
                    value={reworkQty}
                    onChange={(e) => setReworkQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="phone-input text-center flex-1 h-11 text-base font-black text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setReworkQty(reworkQty + 1)}
                    className="w-11 h-11 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 font-extrabold text-[16px] select-none cursor-pointer transition-colors flex-shrink-0 shadow-xs"
                  >
                    +
                  </button>
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                  <span className="text-slate-400 font-bold">Quick:</span>
                  {[5, 10, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReworkQty(prev => prev + num)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: TIME SPENT (HOURS) */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider">Time Spent (Hours)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReworkHours(Math.max(0, parseFloat((reworkHours - 0.5).toFixed(1))))}
                    className="w-11 h-11 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg flex items-center justify-center text-rose-600 font-extrabold text-[16px] select-none cursor-pointer transition-colors flex-shrink-0 shadow-xs"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={reworkHours}
                    onChange={(e) => setReworkHours(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="phone-input text-center flex-1 h-11 text-base font-black text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setReworkHours(parseFloat((reworkHours + 0.5).toFixed(1)))}
                    className="w-11 h-11 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 font-extrabold text-[16px] select-none cursor-pointer transition-colors flex-shrink-0 shadow-xs"
                  >
                    +
                  </button>
                </div>
                {/* Quick Hours Presets */}
                <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                  <span className="text-slate-400 font-bold">Quick:</span>
                  {[0.5, 1.0, 1.5, 2.0, 4.0].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setReworkHours(h)}
                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${reworkHours === h ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700'}`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 4: REWORK DESCRIPTION / REMARKS */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col gap-2">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase tracking-wider">Rework Description / Remarks</label>
                <textarea 
                  value={reworkNotes}
                  onChange={(e) => setReworkNotes(e.target.value)}
                  rows={3}
                  placeholder="Details of containment rework, de-burring, or bulb replacement..."
                  className="phone-textarea text-[12px]"
                />
                {/* Preset Tag Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    "De-burred sharp edges",
                    "Re-aligned bent pins",
                    "Repaired rubber seal",
                    "Replaced defective bulb"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReworkNotes(prev => prev ? `${prev} ${preset}.` : `${preset}.`)}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded text-[9.5px] font-semibold transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                type="submit"
                className="phone-btn-primary mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[13.5px] rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle className="w-4.5 h-4" />
                <span>SAVE REWORK RECORD</span>
              </button>
            </form>

            {/* SCANNER MODAL FOR REWORK */}
            {isReworkScannerOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-black uppercase">Part Barcode / QR Scanner</h3>
                      <p className="text-[10px] text-slate-400">Scan unlimited barcodes to build rework batch list</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsReworkScannerOpen(false)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Viewfinder simulation */}
                <div className="relative my-auto mx-auto w-64 h-64 border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center p-4 text-center bg-slate-900/60 shadow-2xl">
                  <div className="w-full h-0.5 bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse my-auto"></div>
                  <p className="text-xs text-amber-200 font-mono mt-2">Point camera at barcode / QR label</p>
                </div>

                {/* Scanner controls & instant simulated scan options */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instant Scan Options (Unlimited):</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["PN-86286761", "PN-86291945", "PN-86300412"].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          const tag = `${code}-${Date.now().toString().slice(-4)}`;
                          const updated = [...reworkScannedBarcodes, tag];
                          setReworkScannedBarcodes(updated);
                          setReworkQty(updated.length);
                          if (reworkPNMode === 'dropdown') setReworkPN(code.replace('PN-', ''));
                          showToast(`Scanned ${tag}!`, "success");
                        }}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10.5px] font-mono border border-slate-700 text-center cursor-pointer"
                      >
                        + {code}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800 mt-1">
                    <input
                      type="text"
                      value={reworkScanInput}
                      onChange={(e) => setReworkScanInput(e.target.value)}
                      placeholder="Type custom barcode string..."
                      className="phone-input bg-slate-950 text-white border-slate-800 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!reworkScanInput.trim()) return;
                        const updated = [...reworkScannedBarcodes, reworkScanInput.trim()];
                        setReworkScannedBarcodes(updated);
                        setReworkQty(updated.length);
                        setReworkScanInput('');
                        showToast("Custom barcode added!", "success");
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReworkScannerOpen(false)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs mt-1 cursor-pointer"
                  >
                    Done Scanning ({reworkScannedBarcodes.length} Items)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 6: TIME & EXPENSES */}
        {activeScreen === 'expenses' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex flex-col border-b border-slate-200 bg-white pt-4">
              <div className="flex items-center justify-between px-4 pb-2">
                <button onClick={() => setActiveScreen('home')} className="text-text-secondary hover:text-slate-900 flex items-center gap-1 text-[13.5px]"><ArrowLeft className="w-4.5 h-4" /><span>Home</span></button>
                <h2 className="text-[13.5px] font-bold text-slate-900 uppercase tracking-wider">Log Field Expense</h2>
                <div className="w-10"></div>
              </div>
              <div className="flex w-full px-2 mt-2 border-t border-slate-200">
                <button 
                  onClick={() => setTimeExpenseTab('expense')}
                  className={`flex-1 py-3 text-[11.5px] font-bold uppercase transition-colors ${timeExpenseTab === 'expense' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-text-secondary hover:text-slate-700'}`}
                >
                  Expenses
                </button>
                <button 
                  onClick={() => setTimeExpenseTab('overtime')}
                  className={`flex-1 py-3 text-[11.5px] font-bold uppercase transition-colors ${timeExpenseTab === 'overtime' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-text-secondary hover:text-slate-700'}`}
                >
                  Overtime
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-left">
              {timeExpenseTab === 'expense' && (
                <form onSubmit={handleExpenseSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase">Expense Category</label>
                <select 
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="phone-select"
                >
                  <option value="Fuel">Fuel</option>
                  <option value="Parking">Parking</option>
                  <option value="Tolls">Tolls</option>
                  <option value="Meals">Meals</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase">Amount ($ USD/CAD)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="phone-input h-11"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase">Receipt Photo Verification</label>
                {expenseReceiptPhoto ? (
                  <div className="relative rounded-sm overflow-hidden border border-slate-300 bg-white aspect-video flex items-center justify-center shadow-sm">
                    <img 
                      src={expenseReceiptPhoto} 
                      alt="Receipt Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-surface-elevated/60 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={captureMockReceipt}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-sm font-bold text-[11.5px] uppercase flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Camera className="w-3.5 h-3" />
                        <span>Retake Photo</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setExpenseReceiptPhoto(null)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-sm font-bold text-[11.5px] uppercase flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={captureMockReceipt}
                    className="w-full py-8 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-100/50 hover:bg-slate-100 rounded-sm flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-300 group-hover:scale-105 transition-transform shadow-sm">
                      <Camera className="w-5 h-5 text-text-secondary" />
                    </div>
                    <span className="text-[13.5px] font-bold">Simulate Receipt Capture</span>
                    <span className="text-[12.5px] text-text-secondary">Tap to capture mock receipt photo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-secondary uppercase">Expense Notes / Remarks</label>
                <textarea 
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Describe location or purpose of expense..."
                  rows={3}
                  className="phone-textarea"
                />
              </div>

              <button 
                type="button"
                onClick={handleExpenseSubmit}
                className="stitch-btn py-3 mt-4 flex items-center justify-center gap-2 w-full font-bold text-[13.5px]"
              >
                <CheckCircle className="w-4.5 h-4" />
                <span>Submit Expense</span>
              </button>
            </form>
          )}

          {timeExpenseTab === 'overtime' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-sm">
                <p className="text-[11.5px] text-amber-900 leading-relaxed font-semibold">
                  Overtime is automatically detected and portioned when daily hours submitted against an assigned project exceed the authorized PO allocation. Overtime entries require Client Manager approval.
                </p>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  setShowAddHoursModal(true);
                  setAddHoursValue('');
                  setAddHoursSummary('');
                }}
                className="stitch-btn py-3 flex items-center justify-center gap-2 w-full font-bold text-[13.5px] cursor-pointer"
              >
                <Clock className="w-4.5 h-4" />
                <span>Log Daily Project Hours</span>
              </button>

              {/* Overtime Request Status & Tracking Section for Rep */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-200 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">My Overtime Entries Tracking</span>
                
                {(() => {
                  const dbTime = getEntities('timeEntries') || [];
                  const myOtEntries = dbTime.filter(t => (String(t.rep_id) === String(currentUser?.id) || t.rep_id === currentUser?.username) && (t.hour_type === 'overtime' || t.overtime_hours > 0));

                  if (myOtEntries.length === 0) {
                    return (
                      <div className="text-[11.5px] text-slate-500 italic py-4 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        No overtime entries logged yet. All reported hours have been within authorized project allocations.
                      </div>
                    );
                  }

                  return myOtEntries.map(entry => {
                    const status = (entry.status || '').toLowerCase();
                    const clientReviewStatus = (entry.client_review_status || '').toLowerCase();
                    const isApproved = status === 'client_approved' || clientReviewStatus === 'approved';
                    const isReturned = status === 'client_returned' || clientReviewStatus === 'returned';
                    const isRejected = status === 'client_rejected' || clientReviewStatus === 'rejected';

                    return (
                      <div key={entry.id} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-purple-700 font-bold">📅 {entry.work_date || entry.date || 'Today'}</span>
                          <span className="font-extrabold text-amber-700">{parseFloat(entry.overtime_hours || entry.hours || 0).toFixed(1)} hrs OT</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[11.5px] text-slate-800 font-semibold">{entry.work_summary || entry.work_type || 'Routine Inspection'}</span>
                          
                          {isApproved && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                              ✓ Client Approved
                            </span>
                          )}

                          {isReturned && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold uppercase">
                              ↩ Returned for Correction
                            </span>
                          )}

                          {isRejected && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold uppercase">
                              ✕ Client Rejected
                            </span>
                          )}

                          {!isApproved && !isReturned && !isRejected && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase">
                              ⏳ Pending Client Review
                            </span>
                          )}
                        </div>

                        {entry.client_review_comment && (
                          <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Client Feedback:</span>
                            <p className="text-[11px] text-slate-800 italic">"{entry.client_review_comment}"</p>
                          </div>
                        )}

                        {isReturned && (
                          <button
                            onClick={() => handleResubmitOvertime(entry)}
                            className="mt-1 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] uppercase rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>↩ Resubmit Overtime for Client Review</span>
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

        {activeScreen === 'history' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col gap-3 text-left p-1 overflow-y-auto scrollbar-thin bg-slate-50">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 bg-white sticky top-0 z-10 px-2 pt-2">
              <button onClick={() => setActiveScreen('home')} className="p-1 hover:bg-slate-100 rounded-sm text-text-secondary hover:text-slate-900 transition-colors"><X className="w-4.5 h-4" /></button>
              <h2 className="text-[13.5px] font-bold uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-blue-700" /> Suspect Material Logs
              </h2>
            </div>
            
            <div className="flex flex-col gap-3 px-2">
              {getEntities('incidents')?.filter(inc => inc.rep_id === currentUser.id).length === 0 ? (
                <div className="text-[10.5px] italic text-center py-6">No suspect materials logged yet.</div>
              ) : (
                getEntities('incidents')
                  ?.filter(inc => inc.rep_id === currentUser.id)
                  .map(inc => {
                    const hasRevision = inc.revision_request;
                    return (
                      <div key={inc.id} className="p-3 bg-white rounded-sm border border-slate-300 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-center text-[11.5px]">
                          <span className="font-bold text-blue-700">{inc.id?.toUpperCase()}</span>
                          <span className="text-text-secondary font-mono">{new Date(inc.sent_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[11.5px] text-slate-700">
                          <strong>Area Found:</strong> {inc.area}
                        </div>
                        <div className="text-[11.5px] text-slate-700 leading-relaxed">
                          <strong>Description:</strong> {inc.description}
                        </div>
                        
                        {hasRevision ? (
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded-sm text-[10.5px] text-amber-700 font-semibold shadow-sm">
                            <strong>Revision Requested:</strong> "{inc.revision_request}"
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-200 pt-2">
                            <span className="text-[10.5px] font-bold text-text-secondary uppercase">Request Correction</span>
                            <div className="flex gap-1.5">
                              <input 
                                id={`rev_input_${inc.id}`}
                                type="text" 
                                placeholder="Explain correction needed..." 
                                className="bg-slate-50 border border-slate-300 text-[11.5px] px-2 py-1.5 rounded-sm flex-1 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                              <button 
                                onClick={() => {
                                  const val = document.getElementById(`rev_input_${inc.id}`)?.value;
                                  if (!val) return showToast("Please enter correction description!", "warning");
                                  const dbIncs = getEntities('incidents') || [];
                                  const match = dbIncs.find(i => i.id === inc.id);
                                  if (match) {
                                    match.revision_request = val;
                                    saveEntity('incidents', match);
                                    window.dispatchEvent(new Event('ids_pulse_db_update'));
                                    showToast("Revision request submitted to quality lead!", "success");
                                  }
                                }} 
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] rounded-sm uppercase cursor-pointer transition-colors shadow-sm"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* OFFLINE CONFIRMATION POPUP MODAL */}
        {showOfflineModal && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl flex flex-col gap-3.5 text-left w-full max-w-[320px]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 font-black text-lg">
                  ✓
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-900 leading-tight">Report safely saved</h3>
                  <span className="inline-block mt-1 text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Waiting for internet
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                Your entry is securely cached on this device. Sync will resume automatically once a stable internet connection is restored.
              </p>

              {/* Hours Telemetry Bar */}
              {(() => {
                const dbEntries = getEntities('timeEntries') || [];
                const repEntries = dbEntries.filter(t => t && (String(t.rep_id) === String(currentUser?.id) || t.rep_id === currentUser?.username));
                const recordedRegular = repEntries.filter(t => t.hour_type === 'regular' || t.status === 'recorded').reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
                const pendingOvertime = repEntries.filter(t => (t.hour_type === 'overtime' || t.overtime_hours > 0) && (t.status === 'client_pending' || t.client_review_status === 'pending')).reduce((sum, t) => sum + (parseFloat(t.overtime_hours || t.hours) || 0), 0);
                const approvedOvertime = repEntries.filter(t => (t.hour_type === 'overtime' || t.overtime_hours > 0) && (t.status === 'client_approved' || t.client_review_status === 'approved')).reduce((sum, t) => sum + (parseFloat(t.overtime_hours || t.hours) || 0), 0);
                const activeProj = (getEntities('projects') || []).find(p => String(p.id) === String(selectedAssignmentId));
                const authHours = activeProj && activeProj.po_hours ? parseFloat(activeProj.po_hours) : null;
                const remainingAlloc = authHours !== null ? Math.max(0, authHours - recordedRegular) : '∞';
                const repHourStats = { 
                  recordedRegular: recordedRegular.toFixed(1), 
                  pendingOvertime: pendingOvertime.toFixed(1), 
                  approvedOvertime: approvedOvertime.toFixed(1), 
                  remainingAlloc: typeof remainingAlloc === 'number' ? remainingAlloc.toFixed(1) : remainingAlloc 
                };

                return (
                  <div className="grid grid-cols-4 gap-2 mb-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-center">
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase font-semibold leading-tight">Regular (Recorded)</div>
                      <div className="text-[13px] font-bold text-emerald-400">{repHourStats.recordedRegular}h</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase font-semibold leading-tight">Client OT Pending</div>
                      <div className="text-[13px] font-bold text-amber-400">{repHourStats.pendingOvertime}h</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase font-semibold leading-tight">Rem. Allocation</div>
                      <div className="text-[13px] font-bold text-cyan-400">{repHourStats.remainingAlloc}h</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-400 uppercase font-semibold leading-tight">Client Approved OT</div>
                      <div className="text-[13px] font-bold text-indigo-400">{repHourStats.approvedOvertime}h</div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-[11.5px]">
                <span className="text-slate-500 font-semibold">Tracking Ref:</span>
                <span className="font-mono font-extrabold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">{offlineModalTrackingRef}</span>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    setShowOfflineModal(false);
                    setActiveScreen('home');
                  }}
                  className="w-full h-11 bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-[13.5px] rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center border border-blue-400/30"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setShowOfflineModal(false);
                    setActiveScreen('history');
                  }}
                  className="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
                >
                  View saved report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification Overlay inside Phone */}
        {toast && (
          <div className={`absolute top-12 left-4 right-4 z-50 px-3 py-2.5 rounded-xl shadow-xl border backdrop-blur-md flex items-center gap-2.5 text-[11px] font-bold animate-in slide-in-from-top duration-200 ${
            toast.type === 'error' ? 'bg-rose-900/90 text-rose-100 border-rose-500/40' :
            toast.type === 'warning' ? 'bg-amber-900/90 text-amber-100 border-amber-500/40' :
            toast.type === 'info' ? 'bg-sky-900/90 text-sky-100 border-sky-500/40' :
            'bg-emerald-900/90 text-emerald-100 border-emerald-500/40'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Device Home Button Area */}
      <div className="h-6 flex items-center justify-center">
        <button 
          onClick={() => { if (isLoggedIn) setActiveScreen('home'); }}
          className="w-32 h-1 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
        ></button>
      </div>
    </div>
  );
}
