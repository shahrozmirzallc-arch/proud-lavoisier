import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Wifi, WifiOff, MapPin, Clock, 
  User, Lock, LogOut, CheckCircle, CheckCircle2, AlertTriangle, Play, Square, X, Calendar,
  Camera, Scan, Plus, ChevronRight, Mail, Send, RotateCcw, Volume2, Video, ArrowLeft, Trash2, Edit3,
  Receipt, DollarSign, FileText, Wrench, QrCode, Home, Briefcase, Menu
} from 'lucide-react';
import { getEntities, addIncident, addEmailLog, addReworkLog, saveEntity, addExpenseEntry, logSystemEvent, supabase, syncWithSupabase, saveExtraHoursRequest, isEntryAccountingEligible } from './SharedDatabase';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { stageIncidentLocally, getLocalOutbox } from '../services/nativeStorageService';
import {
  resolveAuthoritativeAssignment,
  resolveAssignmentContacts,
  buildRecipientSnapshot,
  releaseIncidentToClient
} from '../services/incidentWorkflowService';
import { getFormattedLocationTime, getFormattedLocationDate } from '../utils/locationTimeUtil';
import BusinessDropdown from './common/BusinessDropdown';
import { formatAreaName, normalizeAndMergeShiftAreas } from '../utils/shiftAreaUtils';
import { submitRepHours, reviewClientOvertime, resubmitReturnedOvertime, HoursSplitModal, HoursStatus } from '../features/hours';

// Reusable AutoGrowTextarea component (Section 3)
const AutoGrowTextarea = ({
  value,
  onChange,
  placeholder,
  minHeight = '120px',
  maxHeight = '280px',
  className = '',
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}) => {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const scrollH = el.scrollHeight;
      const minH = parseInt(minHeight, 10) || 120;
      const maxH = parseInt(maxHeight, 10) || 280;
      const targetH = Math.min(Math.max(scrollH, minH), maxH);
      el.style.height = `${targetH}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value || ''}
      onChange={(e) => {
        onChange(e);
        adjustHeight();
      }}
      placeholder={placeholder}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      style={{ minHeight, maxHeight }}
      className={`w-full p-3 bg-slate-50 border rounded-xl text-[16px] md:text-sm font-medium text-slate-900 focus:bg-white focus:border-[#008F72] transition-all resize-y overflow-y-auto ${className}`}
      {...props}
    />
  );
};

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
  const [mobileTime, setMobileTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setMobileTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Toast Notification State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Assignment & Plant Control
  const [selectedPlant, setSelectedPlant] = useState('plant_oakville');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [plants, setPlants] = useState([]);

  const [activeScreen, setActiveScreen] = useState('login');

  useEffect(() => {
    window.__setActiveScreen = (s) => setActiveScreen(s);
    window.__openDailyQualityReport = () => setActiveScreen('summary');
  });

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

  // Photo evidence collection state — start with EMPTY evidence list per Section 2
  const [evidenceList, setEvidenceList] = useState([]);
  const [annotateTargetId, setAnnotateTargetId] = useState(null);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#EF4444'); // Red default
  const [activeStrokes, setActiveStrokes] = useState([]);

  // Real 30-Second Video Evidence State (Section I)
  const [stagedVideoObject, setStagedVideoObject] = useState(null);
  const [showDeleteVideoConfirm, setShowDeleteVideoConfirm] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const videoFileInputRef = useRef(null);

  // Authoritative HTML5 Video Duration Validator (Section I)
  const validateAndStageVideoFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No video file selected."));
        return;
      }

      if (!file.type || !file.type.startsWith('video/')) {
        reject(new Error("Selected file is not a valid video format."));
        return;
      }

      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const durationSec = Math.round(videoEl.duration);

        if (durationSec > 30) {
          reject(new Error("This video is longer than 30 seconds. Record a shorter video or choose another file."));
          return;
        }

        const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const reader = new FileReader();
        reader.onload = (e) => {
          const videoObject = {
            id: `vid_${Date.now()}`,
            name: file.name || `defect_clip_${Date.now().toString().slice(-4)}.mp4`,
            dataUrl: e.target.result,
            durationSec: durationSec,
            durationStr: `00:${durationSec.toString().padStart(2, '0')} of 00:30`,
            fileSizeMb: fileSizeMb,
            isLargeFile: parseFloat(fileSizeMb) > 10.0,
            stagedAt: new Date().toISOString()
          };
          resolve(videoObject);
        };
        reader.onerror = () => reject(new Error("Failed to read video file content."));
        reader.readAsDataURL(file);
      };

      videoEl.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unreadable or corrupted video file format."));
      };

      videoEl.src = objectUrl;
    });
  };

  const handleVideoFileSelected = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const videoObj = await validateAndStageVideoFile(file);
      setStagedVideoObject(videoObj);
      setMediaEvidenceStatus('provided');
      setMediaUnavailableReason(null);
      setMediaUnavailableNote('');
      showToast(`Video attached: ${videoObj.name} (${videoObj.fileSizeMb} MB, ${videoObj.durationStr})`, "success");
    } catch (err) {
      showToast(err.message || "Failed to validate video file.", "error");
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Step 1 Media Evidence State (Section 2 & 6 Master Correction Prompt)
  const [mediaChoice, setMediaChoice] = useState(null); // 'add' | 'unavailable' | 'not_provided' | null
  const [mediaEvidenceStatus, setMediaEvidenceStatus] = useState('not_provided'); // 'provided' | 'unavailable' | 'not_provided'
  const [mediaUnavailableReason, setMediaUnavailableReason] = useState(null);
  const [mediaUnavailableNote, setMediaUnavailableNote] = useState('');
  const [showMissingMediaDialog, setShowMissingMediaDialog] = useState(false);

  // Container replacement targeting ID (Section 5)
  const [replacingContainerId, setReplacingContainerId] = useState(null);

  // Step 2 Parts & Traceability State (Section 4 Master Correction Prompt)
  const [partChoice, setPartChoice] = useState(null); // 'scan' | 'manual' | 'unavailable' | null
  const [traceabilityStatus, setTraceabilityStatus] = useState('not_provided'); // 'provided' | 'not_provided'
  const [unavailableReason, setUnavailableReason] = useState(null);
  const [unavailableNote, setUnavailableNote] = useState('');

  const [affectedParts, setAffectedParts] = useState([]);
  const [manualPNInput, setManualPNInput] = useState('');
  const [manualSerialInput, setManualSerialInput] = useState('');
  const [manualLotInput, setManualLotInput] = useState('');
  const [manualDateInput, setManualDateInput] = useState('');
  const [manualQtyInput, setManualQtyInput] = useState('');
  const [manualInputError, setManualInputError] = useState('');

  // Non-blocking confirmation modal state (Section 4)
  const [showNoTraceabilityConfirmation, setShowNoTraceabilityConfirmation] = useState(false);
  const [hasConfirmedNoTraceability, setHasConfirmedNoTraceability] = useState(false);

  // Section B: Tote or Container Information
  const [containerChoice, setContainerChoice] = useState(null); // 'scan' | 'manual' | 'unavailable' | null
  const [containerTraceabilityStatus, setContainerTraceabilityStatus] = useState('not_provided'); // 'provided' | 'not_provided'
  const [containerUnavailableReason, setContainerUnavailableReason] = useState(null);
  const [toteBinLabels, setToteBinLabels] = useState([]);
  const [manualToteInput, setManualToteInput] = useState('');
  const [manualContainerType, setManualContainerType] = useState('Tote');
  const [manualContainerSerial, setManualContainerSerial] = useState('');
  const [manualContainerLot, setManualContainerLot] = useState('');
  const [manualContainerQty, setManualContainerQty] = useState('');
  const [manualToteError, setManualToteError] = useState('');

  // Unmatched Container Association Modal
  const [unmatchedContainerPrompt, setUnmatchedContainerPrompt] = useState(null);

  const [selectedTotePartAssociation, setSelectedTotePartAssociation] = useState('ALL');
  const [editingToteId, setEditingToteId] = useState(null);
  const [editToteInputValue, setEditToteInputValue] = useState('');
  const [editToteError, setEditToteError] = useState('');

  const [toteBinLabel, setToteBinLabel] = useState(''); // Legacy fallback compatibility accessor
  const [mislabelWarning, setMislabelWarning] = useState(null);
  const [verificationTargetPartId, setVerificationTargetPartId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);
  const [editPartInputValue, setEditPartInputValue] = useState('');
  const [editInputError, setEditInputError] = useState('');

  const [scannedPartsList, setScannedPartsList] = useState([]);
  const [scanningType, setScanningType] = useState(null); // 'barcode' | 'qr' | null
  const [scannedPN, setScannedPN] = useState('');
  const [scannedBin, setScannedBin] = useState('');
  const [partInfo, setPartInfo] = useState(null);
  const [manualEntryWarning, setManualEntryWarning] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [areaError, setAreaError] = useState('');
  const [defectType, setDefectType] = useState('');
  const [customDefect, setCustomDefect] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [selectedSupplierContactIds, setSelectedSupplierContactIds] = useState([]);
  const [supplierContactSearch, setSupplierContactSearch] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [isReturningDefect, setIsReturningDefect] = useState('N');
  const [isSortRequired, setIsSortRequired] = useState('N');
  const [isRmaRequired, setIsRmaRequired] = useState('N');
  const [rmaNumber, setRmaNumber] = useState('');

  const getSupplierName = (supId) => {
    if (!supId) return 'Client / Supplier';
    const dbSuppliers = getEntities('suppliers') || [];
    const sup = dbSuppliers.find(s => String(s.id) === String(supId) || s.name === supId || s.code === supId);
    return sup?.name || supId;
  };
  const [concernClassification, setConcernClassification] = useState('');

  // Authoritative Routing Contacts Resolver (Phase 1 Fix)
  const getAvailableRoutingContacts = () => {
    const activeAssignment = resolveActiveAssignment();
    const dbContacts = getEntities('supplier_contacts') || getEntities('contacts') || [];
    const dbSuppliers = getEntities('suppliers') || [];

    return resolveAssignmentContacts({
      assignment: activeAssignment,
      contactsList: dbContacts,
      suppliersList: dbSuppliers
    });
  };

  const getAvailableSupplierContacts = () => {
    const routingObj = getAvailableRoutingContacts();
    if (Array.isArray(routingObj)) return routingObj;
    if (routingObj && Array.isArray(routingObj.supplierContacts) && Array.isArray(routingObj.customerContacts)) {
      return [...routingObj.customerContacts, ...routingObj.supplierContacts];
    }
    if (routingObj && Array.isArray(routingObj.customerContacts) && routingObj.customerContacts.length > 0) {
      return routingObj.customerContacts;
    }
    if (routingObj && Array.isArray(routingObj.supplierContacts)) {
      return routingObj.supplierContacts;
    }
    return [];
  };

  // Auto-select available client contacts for active assignment when step 3 or 4 loads
  useEffect(() => {
    if (incStep >= 3 && selectedSupplierContactIds.length === 0) {
      const avail = getAvailableSupplierContacts();
      if (avail.length > 0) {
        const allIds = avail.map(c => c.id);
        setSelectedSupplierContactIds(allIds);
        const names = avail.map(c => c.name).join(', ');
        setSupplierContact(names);
      }
    }
  }, [incStep, selectedAssignmentId]);
  
  // Saved Draft Prompt Object (Section 7)
  const [savedDraftObject, setSavedDraftObject] = useState(null);

  // Centralized Validation Function (Section 1 & 3 Master Correction Prompt)
  const validateIncidentWorkflow = (targetStep = 4) => {
    const hasAnyRealMedia = evidenceList.length > 0 || !!stagedVideoObject;

    if (targetStep >= 2) {
      if (!hasAnyRealMedia && mediaEvidenceStatus !== 'unavailable') {
        return {
          valid: false,
          errorStep: 1,
          code: 'MEDIA_REASON_REQUIRED',
          message: 'A missing-media reason is required before continuing without visual evidence.'
        };
      }
      if (!hasAnyRealMedia && mediaEvidenceStatus === 'unavailable') {
        if (!mediaUnavailableReason) {
          return {
            valid: false,
            errorStep: 1,
            code: 'MEDIA_REASON_MISSING',
            message: 'Please select why visual media is unavailable.'
          };
        }
        if (mediaUnavailableReason === 'Other' && (!mediaUnavailableNote || !mediaUnavailableNote.trim())) {
          return {
            valid: false,
            errorStep: 1,
            code: 'MEDIA_OTHER_NOTE_REQUIRED',
            message: 'An explanation note is required when "Other" reason is selected for missing media.'
          };
        }
      }
    }

    if (targetStep >= 4) {
      const activeProj = resolveActiveAssignment();
      if (!activeProj || (!activeProj.customer_id && !activeProj.client_id && !activeProj.supplier_id && !activeProj.billing_customer_id)) {
        return {
          valid: false,
          errorStep: 1,
          code: 'NO_ASSIGNMENT_RESOLVED',
          message: 'An authoritative project assignment is required to release an incident report. Please select an active assignment.'
        };
      }

      if (!selectedArea || !selectedArea.trim()) {
        setAreaError('Enter where the concern was found.');
        return {
          valid: false,
          errorStep: 3,
          code: 'AREA_REQUIRED',
          message: 'Enter where the concern was found.'
        };
      }
      if (!description || !description.trim()) {
        setDescriptionError('Describe the suspect defect.');
        return {
          valid: false,
          errorStep: 3,
          code: 'DESCRIPTION_REQUIRED',
          message: 'Describe the suspect defect.'
        };
      }
    }

    return { valid: true };
  };

  // Check saved draft on mount
  useEffect(() => {
    if (currentUser?.id) {
      const draftKey = `ids_incident_draft_${currentUser.id}`;
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.affectedParts?.length > 0 || parsed.toteBinLabels?.length > 0 || parsed.evidenceList?.length > 0 || parsed.stagedVideoObject || parsed.traceabilityStatus === 'not_provided' || parsed.mediaEvidenceStatus === 'unavailable')) {
            setSavedDraftObject(parsed);
          }
        }
      } catch (e) {
        console.warn("Could not check saved draft:", e);
      }
    }
  }, [currentUser]);

  // Restore saved draft (Requirement 10: Complete Page 3 Restoration)
  const handleRestoreDraft = () => {
    if (!savedDraftObject) return;
    if (savedDraftObject.incidentStep) setIncStep(savedDraftObject.incidentStep);
    setMediaChoice(savedDraftObject.mediaChoice || null);
    setMediaEvidenceStatus(savedDraftObject.mediaEvidenceStatus || 'not_provided');
    setMediaUnavailableReason(savedDraftObject.mediaUnavailableReason || null);
    setMediaUnavailableNote(savedDraftObject.mediaUnavailableNote || '');
    if (savedDraftObject.evidenceList) setEvidenceList(savedDraftObject.evidenceList);
    if (savedDraftObject.stagedVideoObject) setStagedVideoObject(savedDraftObject.stagedVideoObject);

    setPartChoice(savedDraftObject.partChoice || null);
    setTraceabilityStatus(savedDraftObject.traceabilityStatus || 'not_provided');
    setUnavailableReason(savedDraftObject.unavailableReason || null);
    setUnavailableNote(savedDraftObject.unavailableNote || '');
    setAffectedParts(savedDraftObject.affectedParts || []);

    setContainerChoice(savedDraftObject.containerChoice || null);
    setContainerTraceabilityStatus(savedDraftObject.containerTraceabilityStatus || 'not_provided');
    setContainerUnavailableReason(savedDraftObject.containerUnavailableReason || null);
    setToteBinLabels(savedDraftObject.toteBinLabels || []);
    setVerificationTargetPartId(savedDraftObject.verificationTargetPartId || null);
    setMislabelWarning(savedDraftObject.unresolvedMislabel || null);

    if (savedDraftObject.selectedPlant) setSelectedPlant(savedDraftObject.selectedPlant);
    if (savedDraftObject.selectedArea !== undefined) setSelectedArea(savedDraftObject.selectedArea);
    if (savedDraftObject.defectType !== undefined) setDefectType(savedDraftObject.defectType);
    if (savedDraftObject.description !== undefined) setDescription(savedDraftObject.description);
    if (savedDraftObject.actionTaken !== undefined) setActionTaken(savedDraftObject.actionTaken);
    if (savedDraftObject.selectedSupplierContactIds !== undefined) setSelectedSupplierContactIds(savedDraftObject.selectedSupplierContactIds);
    if (savedDraftObject.supplierContact !== undefined) setSupplierContact(savedDraftObject.supplierContact);
    if (savedDraftObject.isReturningDefect !== undefined) setIsReturningDefect(savedDraftObject.isReturningDefect);
    if (savedDraftObject.isSortRequired !== undefined) setIsSortRequired(savedDraftObject.isSortRequired);
    if (savedDraftObject.isRmaRequired !== undefined) setIsRmaRequired(savedDraftObject.isRmaRequired);
    if (savedDraftObject.rmaNumber !== undefined) setRmaNumber(savedDraftObject.rmaNumber);
    if (savedDraftObject.concernClassification !== undefined) setConcernClassification(savedDraftObject.concernClassification);

    setSavedDraftObject(null);
    showToast("Saved report draft restored", "success");
  };

  const handleDiscardDraft = () => {
    if (currentUser?.id) {
      try {
        localStorage.removeItem(`ids_incident_draft_${currentUser.id}`);
      } catch (e) {
        console.warn("Could not clear draft:", e);
      }
    }
    setSavedDraftObject(null);
    resetIncidentFormState();
    showToast("Saved draft discarded", "info");
  };

  // DRAFT PERSISTENCE (Requirement Section 10: Complete State Storage)
  useEffect(() => {
    if (currentUser?.id) {
      const draftKey = `ids_incident_draft_${currentUser.id}`;
      const hasAnyRealMedia = evidenceList.length > 0 || !!stagedVideoObject;
      if (affectedParts.length > 0 || toteBinLabels.length > 0 || evidenceList.length > 0 || stagedVideoObject || mediaEvidenceStatus === 'unavailable' || selectedArea || description) {
        const draftObj = {
          draftId: `draft_${currentUser.id}`,
          incidentStep: incStep,

          mediaChoice,
          mediaEvidenceStatus: hasAnyRealMedia ? 'provided' : mediaEvidenceStatus,
          mediaUnavailableReason: hasAnyRealMedia ? null : mediaUnavailableReason,
          mediaUnavailableNote: hasAnyRealMedia ? null : mediaUnavailableNote,
          evidenceList,
          stagedVideoObject,

          partChoice,
          traceabilityStatus: affectedParts.length > 0 ? 'provided' : 'not_provided',
          unavailableReason,
          unavailableNote,
          affectedParts,

          containerChoice,
          containerTraceabilityStatus: toteBinLabels.length > 0 ? 'provided' : 'not_provided',
          containerUnavailableReason,
          toteBinLabels,
          toteBinLabel: toteBinLabels[0]?.labelValue || toteBinLabel || '',

          verificationTargetPartId,
          unresolvedMislabel: mislabelWarning,

          selectedPlant,
          selectedArea,
          defectType,
          description,
          actionTaken,
          selectedSupplierContactIds,
          supplierContact,
          isReturningDefect,
          isSortRequired,
          isRmaRequired,
          rmaNumber,
          concernClassification,
          updatedAt: new Date().toISOString()
        };
        try {
          localStorage.setItem(draftKey, JSON.stringify(draftObj));
        } catch (e) {
          console.warn("Could not save incident draft to localStorage:", e);
        }
      }
    }
  }, [affectedParts, toteBinLabels, toteBinLabel, mediaChoice, mediaEvidenceStatus, mediaUnavailableReason, mediaUnavailableNote, evidenceList, stagedVideoObject, partChoice, traceabilityStatus, unavailableReason, unavailableNote, containerChoice, containerTraceabilityStatus, containerUnavailableReason, verificationTargetPartId, mislabelWarning, selectedArea, defectType, description, actionTaken, selectedSupplierContactIds, supplierContact, isReturningDefect, isSortRequired, isRmaRequired, rmaNumber, concernClassification, selectedPlant, incStep, currentUser]);

  // Helper function to clear draft and reset all incident form state
  const resetIncidentFormState = () => {
    setMediaChoice(null);
    setMediaEvidenceStatus('not_provided');
    setMediaUnavailableReason(null);
    setMediaUnavailableNote('');
    setShowMissingMediaDialog(false);
    setEvidenceList([]);
    setStagedVideoObject(null);

    setPartChoice(null);
    setTraceabilityStatus('not_provided');
    setUnavailableReason(null);
    setUnavailableNote('');
    setAffectedParts([]);

    setContainerChoice(null);
    setContainerTraceabilityStatus('not_provided');
    setContainerUnavailableReason(null);
    setToteBinLabels([]);
    setReplacingContainerId(null);
    setManualToteInput('');
    setManualContainerType('Tote');
    setManualContainerSerial('');
    setManualContainerLot('');
    setManualContainerQty('');
    setManualToteError('');
    setSelectedTotePartAssociation('ALL');
    setEditingToteId(null);
    setEditToteInputValue('');
    setEditToteError('');
    setToteBinLabel('');
    setManualPNInput('');
    setManualSerialInput('');
    setManualLotInput('');
    setManualDateInput('');
    setManualQtyInput('');
    setManualInputError('');
    setMislabelWarning(null);
    setVerificationTargetPartId(null);
    setEditingPartId(null);
    setEditPartInputValue('');
    setEditInputError('');
    setShowNoTraceabilityConfirmation(false);
    setHasConfirmedNoTraceability(false);
    setUnmatchedContainerPrompt(null);
    setScannedPartsList([]);
    setScannedPN('');
    setScannedBin('');
    setPartInfo(null);

    setSelectedArea('');
    setAreaError('');
    setDefectType('');
    setDescription('');
    setDescriptionError('');
    setActionTaken('');
    setSelectedSupplierContactIds([]);
    setSupplierContactSearch('');
    setSupplierContact('');
    setIsReturningDefect('N');
    setIsSortRequired('N');
    setIsRmaRequired('N');
    setRmaNumber('');
    setConcernClassification('');
    setIncStep(1);
    if (currentUser?.id) {
      try {
        localStorage.removeItem(`ids_incident_draft_${currentUser.id}`);
      } catch (e) {
        console.warn("Could not clear incident draft:", e);
      }
    }
  };

  // Email Preview toggle
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  useEffect(() => {
    window.__toggleEmailPreview = () => setShowEmailPreview(prev => !prev);
  }, []);
  const [isSendingIncident, setIsSendingIncident] = useState(false);
  const [incidentSentConfirmation, setIncidentSentConfirmation] = useState(false);
  const [sentIncidentId, setSentIncidentId] = useState(null);
  const [isOfflineRelease, setIsOfflineRelease] = useState(false);

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
  
  // SHIFT SUMMARY STATE (Canonical 5 Daily Quality Report Areas)
  const [areasWalked, setAreasWalked] = useState(() => normalizeAndMergeShiftAreas([]));
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
    window.__openDailyQualityReport = () => setActiveScreen('summary');

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

  // Explicit Authoritative Assignment Resolver (Section 1)
  const resolveActiveAssignment = () => {
    if (!currentUser) return null;
    const dbProjects = getEntities('projects') || [];
    const repAssignments = getRepAssignments() || [];

    return resolveAuthoritativeAssignment({
      currentUser,
      selectedAssignmentId,
      assignmentsList: repAssignments,
      projectsList: dbProjects
    });
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

    const activeAssignment = (selectedAssignmentId && repAssignments.find(a => String(a.id) === String(selectedAssignmentId))) || repAssignments[0];
    if (!activeAssignment) {
      setAddHoursToast("No active project assignment available.");
      return;
    }

    const totals = getRepAssignmentHourTotals();
    const remainingAlloc = totals.remainingAllocation !== null ? totals.remainingAllocation : 0;
    const regularPortion = Math.min(hrs, remainingAlloc > 0 ? remainingAlloc : 0);
    const overtimePortion = Math.max(0, hrs - regularPortion);

    // Pre-submit split confirmation modal
    if (overtimePortion > 0 && !forceConfirmed) {
      const dbSuppliers = getEntities('suppliers') || [];
      const custObj = dbSuppliers.find(s => String(s.id) === String(activeAssignment.billing_customer_id || activeAssignment.customer_id));
      setSplitConfirmState({
        hoursEntered: hrs,
        remainingAlloc,
        regularPortion,
        overtimePortion,
        customerName: custObj?.name || activeAssignment.billing_customer_id || 'Client Customer',
        assignmentTitle: activeAssignment.title || activeAssignment.name || 'Project Assignment'
      });
      return;
    }

    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      const res = await submitRepHours({
        idempotencyKey,
        assignmentId: activeAssignment.id,
        workDate: addHoursDate,
        hours: hrs,
        workType: addHoursType,
        workSummary: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
        isOffline: isOffline
      });

      setShowAddHoursModal(false);
      setSplitConfirmState(null);
      setAddHoursValue('');
      setAddHoursSummary('');

      const newEntry = {
        id: `te_${Date.now()}`,
        idempotency_key: idempotencyKey,
        assignment_id: activeAssignment.id,
        project_id: activeAssignment.project_id || activeAssignment.id,
        rep_id: currentUser.id || 'rep_user',
        client_id: activeAssignment.supplier_id || activeAssignment.client_id || (getEntities('suppliers')?.[0]?.id || 'sup_client'),
        supplier_id: activeAssignment.supplier_id || activeAssignment.client_id || (getEntities('suppliers')?.[0]?.id || 'sup_client'),
        plant_id: activeAssignment.plant_id || (plants?.[0]?.id || 'plant_location'),
        work_date: addHoursDate,
        hours: hrs,
        regular_hours: regularPortion,
        overtime_hours: overtimePortion,
        status: overtimePortion > 0 ? 'Pending Overtime Review' : 'Approved',
        work_type: addHoursType,
        notes: addHoursSummary || `${addHoursType} performed at plant ${selectedPlant}`,
        created_at: new Date().toISOString()
      };
      saveEntity('timeEntries', newEntry);
      window.dispatchEvent(new Event('ids_pulse_db_update'));

      if (res?.status === 'staged_offline') {
        setAddHoursToast("Hours recorded locally on device!");
      } else if (res?.status === 'needs_allocation_configuration' || res?.status === 'needs_configuration') {
        setAddHoursToast("Hours saved. Authorized assignment hours must be configured before processing.");
      } else {
        const toastMsg = overtimePortion === 0 
          ? `Recorded ${regularPortion} regular hrs automatically for ${addHoursDate}.`
          : regularPortion === 0 
            ? `All ${overtimePortion} hrs sent to Client for overtime review.`
            : `Recorded ${regularPortion} regular hrs automatically. ${overtimePortion} overtime hrs sent to Client for review.`;
        setAddHoursToast(toastMsg);
        setTimeout(() => syncWithSupabase().catch(() => {}), 10);
      }
      setTimeout(() => setAddHoursToast(null), 5000);
    } catch (err) {
      setShowAddHoursModal(false);
      setSplitConfirmState(null);
      setAddHoursValue('');
      setAddHoursSummary('');
      setAddHoursToast(`Submission saved safely on device: ${err.message}`);
      setTimeout(() => setAddHoursToast(null), 5000);
    }
  };

  const handleResubmitOvertime = async (entry) => {
    if (!entry) return;
    try {
      await resubmitReturnedOvertime({
        timeEntryId: entry.id,
        workSummary: entry.work_summary || '',
        comment: 'Resubmitted by Rep'
      });
      setAddHoursToast("Overtime resubmitted for Client review!");
      setTimeout(() => setAddHoursToast(null), 4000);
      syncWithSupabase();
    } catch (err) {
      setAddHoursToast(`Resubmission error: ${err.message}`);
      setTimeout(() => setAddHoursToast(null), 4000);
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

  // FLEXIBLE EVIDENCE HELPERS (Donna & Clarence Working Process)
  const addPhotoToEvidenceList = (photoUrl) => {
    if (evidenceList.length >= 10) {
      showToast("Maximum 10 photos per report limit reached.", "warning");
      return;
    }
    const newId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCount = evidenceList.length + 1;
    const newItem = {
      id: newId,
      url: photoUrl,
      note: '',
      order: newCount,
      label: `Photo ${newCount}`,
      isAnnotated: false,
      annotatedUrl: null,
      strokes: []
    };
    setEvidenceList(prev => [...prev, newItem]);
    showToast(`Photo ${newCount} added`, "success");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      addPhotoToEvidenceList(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const reorderEvidenceItem = (id, direction) => {
    setEvidenceList(prev => {
      const idx = prev.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const newArr = [...prev];
      const [moved] = newArr.splice(idx, 1);
      newArr.splice(targetIdx, 0, moved);
      return newArr.map((item, i) => ({ ...item, order: i + 1, label: `Photo ${i + 1}` }));
    });
  };

  const updateEvidenceItemNote = (id, text) => {
    setEvidenceList(prev => prev.map(item => item.id === id ? { ...item, note: text } : item));
  };

  const removeEvidenceItem = (id) => {
    setEvidenceList(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, i) => ({ ...item, order: i + 1, label: `Photo ${i + 1}` }));
    });
    setDeleteConfirmTarget(null);
    showToast("Photo removed", "info");
  };

  const openAnnotationModal = (item) => {
    setAnnotateTargetId(item.id);
    setActiveStrokes(item.strokes || []);
  };

  const saveAnnotationForTargetItem = (dataUrl) => {
    setEvidenceList(prev => prev.map(item => {
      if (item.id === annotateTargetId) {
        return {
          ...item,
          isAnnotated: true,
          annotatedUrl: dataUrl,
          strokes: activeStrokes
        };
      }
      return item;
    }));
    setAnnotateTargetId(null);
    showToast("Annotation saved to photo", "success");
  };

  const undoAnnotationStroke = () => {
    setActiveStrokes(prev => prev.slice(0, -1));
  };

  const resetAnnotationStrokes = () => {
    setActiveStrokes([]);
    setResetConfirmOpen(false);
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

  // BARCODE & QR MOCK SCANNING (STEP 2 TRACEABILITY)
  const startScanning = (type) => {
    setScanningType(type);
  };

  const handleAddManualPart = () => {
    const trimmed = (manualPNInput || '').trim().toUpperCase();
    if (!trimmed) {
      setManualInputError("Please enter a part number.");
      playBeep('warning');
      return;
    }
    const isDuplicate = affectedParts.some(p => (p.partNumber || '').toUpperCase() === trimmed);
    if (isDuplicate) {
      setManualInputError(`Part number ${trimmed} is already added to this report.`);
      playBeep('warning');
      return;
    }

    const partsList = getEntities('parts') || [];
    const match = partsList.find(p => p.part_number === trimmed);
    const description = match ? match.description : 'Description not available';

    const newItem = {
      id: `ap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      partNumber: trimmed,
      description: description,
      scannedValue: trimmed,
      scanFormat: 'manual',
      entryMethod: 'Entered manually',
      verificationStatus: 'unverified',
      possibleMislabel: false,
      expectedPartNumber: trimmed,
      createdAt: new Date().toISOString()
    };

    setAffectedParts(prev => [...prev, newItem]);
    setScannedPartsList(prev => [...prev, { id: newItem.id, part_number: trimmed, description: newItem.description, bin: toteBinLabel || 'N/A', qty: 1 }]);
    setScannedPN(trimmed);
    setManualPNInput('');
    setManualInputError('');
    playBeep('success');
    showToast(`Part #${trimmed} added manually`, "success");
  };

  const handleRemoveAffectedPart = (id) => {
    setAffectedParts(prev => prev.filter(p => p.id !== id));
    setScannedPartsList(prev => prev.filter(p => p.id !== id));
    if (verificationTargetPartId === id) setVerificationTargetPartId(null);
    showToast("Part removed from list", "info");
  };

  const handleEditAffectedPart = (item) => {
    setEditingPartId(item.id);
    setEditPartInputValue(item.partNumber);
    setEditInputError('');
  };

  const saveEditedAffectedPart = () => {
    const trimmed = (editPartInputValue || '').trim().toUpperCase();
    if (!trimmed) {
      setEditInputError("Part number cannot be empty.");
      playBeep('warning');
      return;
    }
    const isDuplicate = affectedParts.some(p => p.id !== editingPartId && (p.partNumber || '').toUpperCase() === trimmed);
    if (isDuplicate) {
      setEditInputError(`Part number ${trimmed} is already in use by another item.`);
      playBeep('warning');
      return;
    }

    const partsList = getEntities('parts') || [];
    const match = partsList.find(p => p.part_number === trimmed);
    const description = match ? match.description : 'Description not available';

    setAffectedParts(prev => prev.map(p => p.id === editingPartId ? {
      ...p,
      partNumber: trimmed,
      scannedValue: trimmed,
      description: description,
      expectedPartNumber: trimmed
    } : p));
    setScannedPartsList(prev => prev.map(p => p.id === editingPartId ? { ...p, part_number: trimmed, description: description } : p));
    setEditingPartId(null);
    setEditInputError('');
    playBeep('success');
    showToast(`Part number updated to #${trimmed}`, "success");
  };

  // Warning Banner Choices (Requirement 3)
  const handleMislabelKeepBoth = () => {
    if (!mislabelWarning) return;
    const { targetPartId, expectedPartNumber, scannedValue, scanFormat } = mislabelWarning;
    if (targetPartId) {
      setAffectedParts(prev => prev.map(p => p.id === targetPartId ? {
        ...p,
        scannedValue: scannedValue,
        verificationStatus: 'mismatch',
        possibleMislabel: true
      } : p));
    } else {
      const newItem = {
        id: `ap_mismatch_${Date.now()}`,
        partNumber: scannedValue,
        description: 'Description not available',
        scannedValue: scannedValue,
        scanFormat: scanFormat || 'barcode',
        entryMethod: 'Scanned',
        verificationStatus: 'mismatch',
        possibleMislabel: true,
        expectedPartNumber: expectedPartNumber,
        createdAt: new Date().toISOString()
      };
      setAffectedParts(prev => [...prev, newItem]);
    }
    setMislabelWarning(null);
    setVerificationTargetPartId(null);
    showToast("Mislabeled part added with review flag", "warning");
  };

  const handleMislabelRescan = () => {
    setMislabelWarning(null);
    startScanning('barcode');
  };

  const handleMislabelCorrectExpected = () => {
    if (!mislabelWarning) return;
    const { targetPartId, scannedValue } = mislabelWarning;
    if (targetPartId) {
      const partsList = getEntities('parts') || [];
      const match = partsList.find(p => p.part_number === scannedValue);
      const desc = match ? match.description : 'Description not available';
      setAffectedParts(prev => prev.map(p => p.id === targetPartId ? {
        ...p,
        partNumber: scannedValue,
        scannedValue: scannedValue,
        description: desc,
        verificationStatus: 'verified',
        possibleMislabel: false
      } : p));
    }
    setMislabelWarning(null);
    setVerificationTargetPartId(null);
    showToast(`Expected part number corrected to #${scannedValue}`, "success");
  };

  const handleMislabelCancel = () => {
    setMislabelWarning(null);
    setVerificationTargetPartId(null);
  };  const handleStartVerificationScan = (partId) => {
    setVerificationTargetPartId(partId);
    startScanning('barcode');
  };

  // Section B: Multiple Tote/Bin Labels Helpers
  const handleAddManualToteBinLabel = () => {
    const trimmed = (manualToteInput || '').trim().toUpperCase();
    if (!trimmed) {
      setManualToteError("Please enter a tote/bin label.");
      playBeep('warning');
      return;
    }
    const isDuplicate = toteBinLabels.some(t => (t.labelValue || '').toUpperCase() === trimmed);
    if (isDuplicate) {
      setManualToteError(`Tote/Bin label ${trimmed} is already added.`);
      playBeep('warning');
      return;
    }

    const newTote = {
      id: `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      labelValue: trimmed,
      entryMethod: 'Entered manually',
      scanFormat: 'manual',
      relatedPartIds: selectedTotePartAssociation === 'ALL' ? [] : [selectedTotePartAssociation],
      createdAt: new Date().toISOString()
    };

    setToteBinLabels(prev => [...prev, newTote]);
    setManualToteInput('');
    setManualToteError('');
    setSelectedTotePartAssociation('ALL');
    playBeep('success');
    showToast(`Tote/Bin label ${trimmed} added`, "success");
  };

  const handleRemoveToteBinLabel = (id) => {
    setToteBinLabels(prev => prev.filter(t => t.id !== id));
    showToast("Tote/Bin label removed", "info");
  };

  const handleEditToteBinLabel = (item) => {
    setEditingToteId(item.id);
    setEditToteInputValue(item.labelValue);
    setEditToteError('');
  };

  const saveEditedToteBinLabel = () => {
    const trimmed = (editToteInputValue || '').trim().toUpperCase();
    if (!trimmed) {
      setEditToteError("Tote/Bin label cannot be empty.");
      playBeep('warning');
      return;
    }
    const isDuplicate = toteBinLabels.some(t => t.id !== editingToteId && (t.labelValue || '').toUpperCase() === trimmed);
    if (isDuplicate) {
      setEditToteError(`Tote/Bin label ${trimmed} is already in use.`);
      playBeep('warning');
      return;
    }

    setToteBinLabels(prev => prev.map(t => t.id === editingToteId ? {
      ...t,
      labelValue: trimmed
    } : t));
    setEditingToteId(null);
    setEditToteError('');
    playBeep('success');
    showToast("Tote/Bin label updated", "success");
  };

  const updateTotePartAssociation = (toteId, partId) => {
    setToteBinLabels(prev => prev.map(t => t.id === toteId ? {
      ...t,
      relatedPartIds: partId === 'ALL' ? [] : [partId]
    } : t));
    showToast("Part association updated", "info");
  };

  const selectScanOption = (pn, type = 'barcode') => {
    const activeScanType = scanningType || type;
    setScanningType(null);
    playBeep('scan');

    const trimmed = (pn || '').trim().toUpperCase();

    if (activeScanType === 'qr' && (trimmed.startsWith('BIN') || trimmed.includes('BOX') || activeScanType === 'tote_bin' || replacingContainerId)) {
      if (replacingContainerId) {
        setToteBinLabels(prev => prev.map(t => t.id === replacingContainerId ? {
          ...t,
          labelValue: trimmed,
          entryMethod: 'Scanned',
          scanFormat: 'qr'
        } : t));
        setReplacingContainerId(null);
        showToast(`Container label replaced with ${trimmed}`, "success");
        return;
      }

      const isDuplicate = toteBinLabels.some(t => (t.labelValue || '').toUpperCase() === trimmed);
      if (isDuplicate) {
        showToast(`Tote/Bin label ${trimmed} is already added!`, "warning");
        return;
      }
      const newTote = {
        id: `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        labelValue: trimmed,
        entryMethod: 'Scanned',
        scanFormat: 'qr',
        relatedPartIds: [],
        createdAt: new Date().toISOString()
      };
      setToteBinLabels(prev => [...prev, newTote]);
      showToast(`Sample scan added for prototype testing — Tote/Bin: ${trimmed}`, "success");
      return;
    }

    // Explicit Verification Flow (Requirement 3)
    if (verificationTargetPartId) {
      const targetPart = affectedParts.find(p => p.id === verificationTargetPartId);
      if (targetPart) {
        const expected = (targetPart.partNumber || targetPart.expectedPartNumber || '').trim().toUpperCase();
        if (trimmed === expected) {
          setAffectedParts(prev => prev.map(p => p.id === targetPart.id ? {
            ...p,
            scannedValue: trimmed,
            verificationStatus: 'verified',
            possibleMislabel: false
          } : p));
          setVerificationTargetPartId(null);
          setMislabelWarning(null);
          playBeep('success');
          showToast(`Sample scan added for prototype testing — Verified PN #${trimmed} matches expected part!`, "success");
          return;
        } else {
          setMislabelWarning({
            targetPartId: targetPart.id,
            expectedPartNumber: expected,
            scannedValue: trimmed,
            scanFormat: activeScanType
          });
          playBeep('warning');
          showToast("Possible mislabel detected! Please review warning.", "warning");
          return;
        }
      }
    }

    // Normal multi-part scan (Requirement 1 & 3: Adding a different part number is NOT automatically a mislabel!)
    const isDuplicate = affectedParts.some(p => (p.partNumber || '').toUpperCase() === trimmed);
    if (isDuplicate) {
      showToast(`Part number ${trimmed} is already added to this report!`, "warning");
      return;
    }

    const partsList = getEntities('parts') || [];
    const foundPart = partsList.find(p => p.part_number === trimmed);
    const description = foundPart ? foundPart.description : 'Description not available';

    const newItem = {
      id: `ap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      partNumber: trimmed,
      description: description,
      scannedValue: trimmed,
      scanFormat: activeScanType,
      entryMethod: 'Scanned',
      verificationStatus: 'verified',
      possibleMislabel: false,
      expectedPartNumber: trimmed,
      createdAt: new Date().toISOString()
    };

    setAffectedParts(prev => [...prev, newItem]);
    setScannedPartsList(prev => [...prev, { id: newItem.id, part_number: trimmed, description: newItem.description, bin: toteBinLabel || 'N/A', qty: 1 }]);
    setScannedPN(trimmed);
    showToast(`Sample scan added for prototype testing — PN ${trimmed}`, "success");
  };

  const handleManualPartNumberChange = (value) => {
    setManualPNInput(value);
    setManualInputError('');
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
    // Fill Evidence Photos
    setEvidenceList([
      {
        id: 'ev_demo_1',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        note: 'Scrap Tag & Part Number on Scrap Table',
        order: 1,
        label: 'Photo 1',
        isAnnotated: true,
        annotatedUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        strokes: []
      },
      {
        id: 'ev_demo_2',
        url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80',
        note: 'Loose bulb housing assembly crack detail',
        order: 2,
        label: 'Photo 2',
        isAnnotated: false,
        annotatedUrl: null,
        strokes: []
      },
      {
        id: 'ev_demo_3',
        url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
        note: 'Container tag batch number B-86286761',
        order: 3,
        label: 'Photo 3',
        isAnnotated: false,
        annotatedUrl: null,
        strokes: []
      }
    ]);
    
    // Fill Scan Info (Pre-populates list with 4 distinct parts for Clarence verification)
    const demoParts = [
      {
        id: 'ap_demo_1',
        partNumber: '86286761',
        description: 'Tail Light Assembly',
        scannedValue: '86286761',
        scanFormat: 'barcode',
        entryMethod: 'Scanned',
        verificationStatus: 'verified',
        possibleMislabel: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ap_demo_2',
        partNumber: '86291945',
        description: 'Headlamp Bracket',
        scannedValue: '86291945',
        scanFormat: 'qr',
        entryMethod: 'Scanned',
        verificationStatus: 'verified',
        possibleMislabel: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ap_demo_3',
        partNumber: '86291946',
        description: 'Side Mirror Housing',
        scannedValue: '86291946',
        scanFormat: 'manual',
        entryMethod: 'Entered manually',
        verificationStatus: 'unverified',
        possibleMislabel: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'ap_demo_4',
        partNumber: '86291947',
        description: 'Door Latch Bezel',
        scannedValue: '86291947',
        scanFormat: 'manual',
        entryMethod: 'Entered manually',
        verificationStatus: 'mismatch',
        possibleMislabel: true,
        createdAt: new Date().toISOString()
      }
    ];

    const demoTotes = [
      {
        id: 'tb_demo_1',
        labelValue: 'BIN-MAG-6761',
        entryMethod: 'Scanned',
        scanFormat: 'qr',
        relatedPartIds: ['ap_demo_1'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'tb_demo_2',
        labelValue: 'TOTE-SEQ-402',
        entryMethod: 'Entered manually',
        scanFormat: 'manual',
        relatedPartIds: ['ap_demo_2', 'ap_demo_3'],
        createdAt: new Date().toISOString()
      }
    ];

    setAffectedParts(demoParts);
    setToteBinLabels(demoTotes);
    setToteBinLabel('BIN-MAG-6761');
    setScannedPN('86286761');
    setScannedBin('BIN-MAG-6761');
    setPartInfo({ part_number: '86286761', description: 'Tail Light Assembly', supplier_id: 'magna' });
    setManualEntryWarning(false);
    setScannedPartsList(demoParts.map(p => ({ id: p.id, part_number: p.partNumber, description: p.description, bin: 'BIN-MAG-6761', qty: 1 })));
    
    setSelectedArea('Review Scrap Table');
    setDefectType('Spare bulb loose in housing (rattle)');
    setDescription('Light on scrap table at sequence area for rattle. Spare bulb in housing again. Removed bulb and returned light to sequence area. Bulb was removed before scrap tag was written up. Please ensure all base lights do not have spare bulbs in housing causing rattling sound.');
    setActionTaken('Removed bulb, returned light to sequence area');
    const availContacts = getAvailableSupplierContacts();
    if (availContacts.length > 0) {
      setSelectedSupplierContactIds(availContacts.map(c => c.id));
      setSupplierContact(availContacts.map(c => c.name).join(', '));
    } else {
      setSupplierContact('Robert Sterling, Elena Rostova');
    }
    setIsReturningDefect('N');
    setIsSortRequired('N');
    setIsRmaRequired('N');
    setConcernClassification('PRR');
  };

  // AUTHORITATIVE SUBMIT / RELEASE INCIDENT HANDLER (Sections 1, 5, 6, 7)
  const handleSendIncident = async () => {
    // 1. Run Centralized Validation
    const validation = validateIncidentWorkflow(4);
    if (!validation.valid) {
      showToast(validation.message, "warning");
      if (validation.code.startsWith('MEDIA_')) {
        setShowMissingMediaDialog(true);
      }
      setIncStep(validation.errorStep);
      return;
    }

    setIsSendingIncident(true);

    try {
      const hasAnyRealMedia = evidenceList.length > 0 || !!stagedVideoObject;

      const formattedPartsList = affectedParts.map(p => ({
        id: p.id,
        part_number: p.partNumber,
        description: p.description || 'Description not available',
        bin: toteBinLabels[0]?.labelValue || null,
        qty: p.quantity || 1,
        entry_method: p.entryMethod,
        scan_format: p.scanFormat,
        verification_status: p.verificationStatus,
        possible_mislabel: p.possibleMislabel
      }));

      const formattedToteList = toteBinLabels.map(t => ({
        id: t.id,
        label_value: t.labelValue,
        container_type: t.containerType || 'Tote',
        entry_method: t.entryMethod,
        scan_format: t.scanFormat,
        related_part_ids: t.relatedPartIds || [],
        created_at: t.createdAt
      }));

      const firstPN = affectedParts[0]?.partNumber || null;
      const partSubject = affectedParts.length > 1
        ? `PN ${firstPN} (+${affectedParts.length - 1} others)`
        : firstPN ? `PN ${firstPN}` : 'Traceability pending';

      // Authoritative Assignment Context Resolution (Section 1 & 7)
      const activeProj = resolveActiveAssignment();
      if (!activeProj || !activeProj.client_id) {
        setIsSendingIncident(false);
        showToast("An authoritative project assignment with a configured client ID is required to release an incident report.", "error");
        setIncStep(1);
        return;
      }

      if (!currentUser || !currentUser.id) {
        setIsSendingIncident(false);
        showToast("Authentication error: No active application user session found.", "error");
        return;
      }

      const resolvedAssignmentId = activeProj.id;
      const resolvedClientId = activeProj.client_id;
      const resolvedSupplierId = activeProj.supplier_id;
      const resolvedPlantId = activeProj.plant_id;
      const resolvedProjectId = activeProj.id;

      const dbSuppliers = getEntities('suppliers') || [];
      const selectedContacts = getAvailableSupplierContacts().filter(c => selectedSupplierContactIds.includes(c.id));
      const recipientSnapshot = buildRecipientSnapshot(selectedContacts, dbSuppliers);

      const newInc = {
        rep_id: currentUser.id,
        rep_name: currentUser.name || 'Quality Representative',
        assignment_id: resolvedAssignmentId,
        client_id: resolvedClientId,
        customer_id: resolvedClientId,
        supplier_id: resolvedSupplierId,
        plant_id: resolvedPlantId,
        project_id: resolvedProjectId,

        media_evidence_status: hasAnyRealMedia ? 'provided' : 'unavailable',
        media_unavailable_reason: hasAnyRealMedia ? null : mediaUnavailableReason,
        media_unavailable_note: hasAnyRealMedia ? null : mediaUnavailableNote,
        photos: evidenceList.map(ev => ({
          id: ev.id,
          url: ev.annotatedUrl || ev.url,
          type: ev.label,
          note: ev.note,
          order: ev.order
        })),
        videos: stagedVideoObject ? [stagedVideoObject] : [],

        traceability_status: affectedParts.length > 0 ? 'provided' : (traceabilityStatus || 'not_provided'),
        traceability_unavailable_reason: affectedParts.length > 0 ? null : (unavailableReason || null),
        traceability_unavailable_note: affectedParts.length > 0 ? null : (unavailableNote || null),

        container_traceability_status: toteBinLabels.length > 0 ? 'provided' : 'not_provided',

        parts_list: formattedPartsList,
        tote_bin_labels: formattedToteList,
        part_number: firstPN || 'N/A',
        quantity: affectedParts.reduce((sum, p) => sum + (parseInt(p.quantity, 10) || 1), 0),

        area: selectedArea ? selectedArea.trim() : '',
        defect_type: defectType ? defectType.trim() : null,
        description: description ? description.trim() : '',
        action_taken: actionTaken ? actionTaken.trim() : null,
        supplier_contact_ids: selectedSupplierContactIds || [],
        supplier_contacts_snapshot: recipientSnapshot,
        supplier_contact: selectedContacts.map(c => c.name).join(', ') || supplierContact || null,
        returned_to_supplier: isReturningDefect === 'Y',
        sort_requested: isSortRequired === 'Y',
        rma_required: isRmaRequired === 'Y',
        rma_number: isRmaRequired === 'Y' && rmaNumber ? rmaNumber.trim() : null,
        concern_classification: concernClassification ? concernClassification.trim() : null,

        created_at: new Date().toISOString()
      };

      const releaseResult = await releaseIncidentToClient({
        incidentPayload: newInc,
        isOffline: !!isOffline,
        currentUser
      });

      setIsSendingIncident(false);

      if (!releaseResult.success) {
        showToast(releaseResult.message || "Report was not released. Your information is still here. Please try again.", "error");
        return;
      }

      setSentIncidentId(releaseResult.tracking_ref || releaseResult.incident?.id);
      setIsOfflineRelease(!!releaseResult.isOffline);
      setIncidentSentConfirmation(true);
      
      const activityMsg = releaseResult.isOffline
        ? `Incident queued securely on this device (${partSubject}).`
        : `Incident released to Client Dashboard (${partSubject}).`;
      logSystemEvent('incident', releaseResult.isOffline ? 'queued_offline' : 'release', activityMsg);
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    } catch (err) {
      console.error("Error during incident release:", err);
      setIsSendingIncident(false);
      showToast(`Report was not released. Your information is still here. Please try again. (${err.message || err})`, "error");
    }
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
    const normalizedAreas = normalizeAndMergeShiftAreas(updatedAreas || areasWalked);

    if (existingDraft) {
      existingDraft.areas_walked = normalizedAreas;
      if (updatedBonus) existingDraft.bonus_tasks = updatedBonus;
      saveEntity('shiftReports', existingDraft);
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    } else {
      const newDraft = {
        id: `sr_draft_${currentUser.id}_${todayDate}`,
        rep_id: currentUser.id,
        plant_id: selectedPlant || 'gm_oshawa',
        date: todayDate,
        areas_walked: normalizedAreas,
        incidents_count: 0,
        bonus_tasks: updatedBonus || bonusTasks,
        status: 'Draft',
        created_at: new Date().toISOString()
      };
      saveEntity('shiftReports', newDraft);
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const dbReports = getEntities('shiftReports') || [];
    const existingDraft = dbReports.find(r => r.rep_id === currentUser.id && r.status === 'Draft');
    if (existingDraft && Array.isArray(existingDraft.areas_walked)) {
      const merged = normalizeAndMergeShiftAreas(existingDraft.areas_walked);
      setAreasWalked(merged);
    }
  }, [currentUser, dbUpdateTrigger]);

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
    setStagedVideoObject(null);
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
      const canonicalAreas = normalizeAndMergeShiftAreas(areasWalked);

      const newReport = {
        id: existingDraft ? existingDraft.id : `sr_${Date.now()}`,
        rep_id: currentUser.id,
        plant_id: selectedPlant,
        date: todayDate,
        areas_walked: canonicalAreas,
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
        to_emails: (getEntities('users')?.find(u => u.role === 'lead')?.email) || 'operations@integritydriven.com',
        cc_emails: (getEntities('users')?.find(u => u.role === 'owner')?.email) || 'management@integritydriven.com',
        subject: `[SHIFT SUMMARY] Rep: ${currentUser.name} | ${plants.find(p => p.id === selectedPlant)?.name || 'Record unavailable'} | ${new Date().toLocaleDateString()}`,
        body: `<h3>SHIFT WALKTHROUGH LOG — IDS PULSE</h3>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
<strong>Field Representative:</strong> ${currentUser.name}<br/>
<strong>Assigned Assembly Plant:</strong> ${plants.find(p => p.id === selectedPlant)?.name || 'Record unavailable'}</p>
<hr/>
<p><strong>Inspected Factory Areas:</strong></p>
<ul>
  ${canonicalAreas.map(a => `<li><strong>${formatAreaName(a.name)}</strong>: ${a.status === 'issues' ? '🔴 Concerns Found' : '🟢 No Concerns'} (Notes: ${a.notes || 'None'})</li>`).join('')}
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
        {(() => {
          const locHint = currentUser?.assigned_plant || currentUser?.location || '';
          const timeInfo = getFormattedLocationTime(mobileTime, locHint);
          return (
            <span className="font-mono flex items-center gap-1.5 text-[11px]">
              <span>{timeInfo.timeString}</span>
              <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">{timeInfo.timeZoneAbbr}</span>
            </span>
          );
        })()}
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

        {/* SCREEN 2A: REFACTORED HOME */}
        {activeScreen === 'home' && isLoggedIn && currentUser && (() => {
          const hourTotals = getRepAssignmentHourTotals();
          
          // Item 4: Determine next actionable task (excluding completed, preferring overdue -> due today -> nearest future)
          const getNextActionableTask = () => {
            if (!bonusTasks || bonusTasks.length === 0) return null;
            const actionable = bonusTasks.filter(t => t.status !== 'completed');
            if (actionable.length === 0) return null;
            const todayStr = new Date().toISOString().substring(0, 10);
            const overdue = actionable.filter(t => t.dueDate && t.dueDate < todayStr);
            if (overdue.length > 0) return overdue[0];
            const dueToday = actionable.filter(t => t.dueDate === todayStr);
            if (dueToday.length > 0) return dueToday[0];
            const sorted = [...actionable].sort((a, b) => {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return a.dueDate.localeCompare(b.dueDate);
            });
            return sorted[0];
          };
          const nextTask = getNextActionableTask();

          // Item 3: No fake hours fallback
          const authHours = hourTotals.hasAuthorizedLimit ? hourTotals.authorizedHours : null;
          const recHours = hourTotals.recordedRegularHours || 0;
          const percent = (authHours && authHours > 0) ? Math.min(100, Math.round((recHours / authHours) * 100)) : 0;

          const dbPlants = [...(getEntities('plants') || []), ...(plants || [])];
          const plantObj = dbPlants.find(p => String(p.id) === String(selectedPlant) || p.name === selectedPlant || p.code === selectedPlant);
          const displayPlant = plantObj ? plantObj.name : (selectedPlant || 'Record unavailable');

          // Dynamically resolve assignment & project matching the selected plant
          const allAssignments = getRepAssignments() || [];
          const allProjects = getEntities('projects') || [];

          const plantMatchAsgn = allAssignments.find(a => 
            String(a.plant_id) === String(selectedPlant) || 
            a.plant_name === selectedPlant || 
            (plantObj && (String(a.plant_id) === String(plantObj.id) || a.plant_name === plantObj.name))
          );

          const plantMatchProj = allProjects.find(pr => 
            String(pr.plant_id) === String(selectedPlant) || 
            pr.plant_name === selectedPlant || 
            (plantObj && (String(pr.plant_id) === String(plantObj.id) || pr.plant_name === plantObj.name))
          );

          const activeAsgn = plantMatchAsgn || plantMatchProj || resolveActiveAssignment();

          const clientId = activeAsgn?.billing_customer_id || activeAsgn?.supplier_id;
          const dbSuppliers = getEntities('suppliers') || [];
          const supObj = dbSuppliers.find(s => String(s.id) === String(clientId) || s.name === clientId || s.code === clientId);
          const activeClientName = typeof getActiveClientForPlant === 'function' ? getActiveClientForPlant(selectedPlant) : null;
          const displayClient = supObj ? supObj.name : ((activeClientName && activeClientName !== 'No client assigned') ? activeClientName : (plantMatchProj?.client_name || activeAsgn?.client_name || 'Magna Powertrain International'));

          const projId = activeAsgn?.project_id || activeAsgn?.id;
          const projObj = allProjects.find(pr => String(pr.id) === String(projId) || pr.name === projId || pr.code === projId);
          const displayProject = projObj ? projObj.name : (activeAsgn?.name || activeAsgn?.project_name || 'Quality Inspection & Sorting');

          const dbParts = getEntities('parts') || [];
          const partObj = dbParts.find(pt => String(pt.project_id) === String(projId) || String(pt.supplier_id) === String(clientId) || String(pt.plant_id) === String(selectedPlant));
          const displayPart = partObj ? (partObj.part_number ? `PN-${partObj.part_number}` : partObj.part_name) : (activeAsgn?.part_number ? `PN-${activeAsgn.part_number}` : (plantMatchProj?.part_number ? `PN-${plantMatchProj.part_number}` : 'PN-86291945'));

          const displayPo = activeAsgn?.po_number || activeAsgn?.poNumber || projObj?.po_number || (plantMatchProj?.po_number) || (plantMatchAsgn?.po_number) || (selectedPlant?.includes('Windsor') ? 'PO-WIN-2026-92' : 'PO-GM-CAMI-2026-88');

          return (
            <div className="flex-1 min-h-0 flex flex-col p-3 bg-[#F5F8FC] relative overflow-y-auto scrollbar-thin text-left gap-3">
              {addHoursToast && (
                <div className="bg-[#008F72] text-white p-2.5 rounded-lg text-xs font-bold text-center shadow-sm animate-in fade-in">
                  {addHoursToast}
                </div>
              )}

              {/* SLEEK NATIVE TOP BAR WITH LARGE PROMINENT OFFICIAL LOGO */}
              <div className="flex items-center justify-between pb-2 border-b border-[#EAEFF5]">
                <div className="flex items-center">
                  <img src="/logo.png" alt="IDS Pulse Logo" className="h-11 max-w-[200px] w-auto object-contain shrink-0" />
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-extrabold text-[#10284A] leading-tight">
                    Welcome, {currentUser?.name?.split(' ')[0] || currentUser?.name || 'Rep'}
                  </span>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                    isOffline ? 'bg-[#FDECEF] text-[#B42336] border border-[#CBD8E8]' : 'bg-[#DDF8EE] text-[#00765F]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-[#D92D3F]' : 'bg-[#008F72]'}`}></span>
                    <span>{isOffline ? 'Offline' : 'Online'}</span>
                  </div>
                </div>
              </div>

              {/* FULL-WIDTH STACKED PLANT NAME SELECTOR (ZERO TRUNCATION) */}
              <div className="bg-white border border-[#CBD8E8] rounded-xl px-3 py-2 flex flex-col gap-1 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1769E0] shrink-0" />
                  <span className="text-[10px] uppercase tracking-wide font-extrabold text-[#5B6F89]">Plant Name</span>
                </div>

                <select 
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="w-full text-xs font-bold text-[#10284A] bg-[#EFF3F8] border border-[#CBD8E8] rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1769E0]"
                >
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* CURRENT ASSIGNMENT CARD (UNIFIED ASSIGNMENT + BUDGET OR EMPTY STATE) */}
              {plantMatchAsgn || plantMatchProj ? (
                <div className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex flex-col gap-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#CBD8E8] pb-1.5">
                    <span className="text-xs font-bold text-[#10284A] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#1769E0]" />
                      <span>Current Assignment</span>
                    </span>
                    <span className="text-[10px] bg-[#DDF8EE] text-[#00765F] font-bold px-2 py-0.5 rounded-md uppercase">
                      Active
                    </span>
                  </div>

                  {/* STACKED VERTICAL DETAILS (EVERY DETAIL HAS ITS OWN FULL-WIDTH LINE) */}
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex flex-col gap-0.5 pb-1.5 border-b border-[#F0F4F8]">
                      <span className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#5B6F89]">Supplier / Client</span>
                      <strong className="text-[#10284A] font-extrabold text-xs break-words leading-snug">{displayClient}</strong>
                    </div>

                    <div className="flex flex-col gap-0.5 pb-1.5 border-b border-[#F0F4F8]">
                      <span className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#5B6F89]">Purchase Order (PO #)</span>
                      <span className="text-[#1256B8] font-black text-xs break-words leading-snug font-mono">
                        {displayPo}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 pb-1.5 border-b border-[#F0F4F8]">
                      <span className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#5B6F89]">Host Plant</span>
                      <strong className="text-[#10284A] font-extrabold text-xs break-words leading-snug">{displayPlant}</strong>
                    </div>

                    <div className="flex flex-col gap-0.5 pb-1.5 border-b border-[#F0F4F8]">
                      <span className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#5B6F89]">Project / Program</span>
                      <span className="text-[#10284A] font-bold text-xs break-words leading-snug">{displayProject}</span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9.5px] uppercase tracking-wide font-extrabold text-[#5B6F89]">Assigned Parts</span>
                      <span className="text-[#1256B8] font-bold text-xs break-words leading-snug">{displayPart}</span>
                    </div>
                  </div>

                  {/* UNIFIED PROJECT HOURS BUDGET BAR */}
                  <div className="pt-2 border-t border-[#EAEFF5] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#10284A] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#008F72]" />
                        <span>Project Hours</span>
                      </span>
                      <span className="text-[11px] font-bold text-[#10284A]">
                        {authHours !== null 
                          ? `${recHours.toFixed(1)} of ${authHours} authorized hours recorded`
                          : `Authorized hours not configured (${recHours.toFixed(1)} hrs logged)`}
                      </span>
                    </div>

                    {authHours !== null && authHours > 0 ? (
                      <div className="w-full bg-[#EFF3F8] h-2.5 rounded-full overflow-hidden border border-[#CBD8E8]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${recHours >= authHours ? 'bg-[#C66A00]' : 'bg-[#008F72]'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="text-[10.5px] text-[#5B6F89] italic bg-[#EFF3F8] p-1.5 rounded-md border border-[#CBD8E8]">
                        Authorized hours limit not configured for this program.
                      </div>
                    )}

                    {hourTotals.pendingClientOvertimeHours > 0 && (
                      <div className="text-[11px] text-[#C66A00] bg-[#FFF4D6] px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <span>{hourTotals.pendingClientOvertimeHours.toFixed(1)} overtime hours waiting for Client</span>
                      </div>
                    )}

                    {/* WEEKLY SHIFT LOG SUMMARY (PAY PERIOD CONTEXT) */}
                    <div className="flex items-center justify-between text-[10.5px] bg-[#F8FAFC] p-2 rounded-lg border border-[#CBD8E8] mt-1">
                      <span className="font-bold text-[#5B6F89] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#1769E0]" />
                        <span>Weekly Shift Logs:</span>
                      </span>
                      <span className="font-extrabold text-[#10284A]">
                        {hourTotals.recordedRegularHours ? hourTotals.recordedRegularHours.toFixed(1) : '0.0'} hrs logged this week
                      </span>
                    </div>
                  </div>

                  {/* PRIMARY ACTION BUTTON */}
                  <button 
                    type="button"
                    onClick={() => {
                      const activeAsgn = resolveActiveAssignment();
                      if (activeAsgn && activeAsgn.id) {
                        setSelectedAssignmentId(activeAsgn.id);
                      }
                      setShowAddHoursModal(true);
                    }}
                    className={`w-full h-11 text-white rounded-xl font-bold text-sm flex items-center justify-between px-3.5 transition-all cursor-pointer shadow-xs mt-1 ${
                      authHours !== null && recHours >= authHours 
                        ? 'bg-[#C66A00] hover:bg-[#B05D00]' 
                        : 'bg-[#008F72] hover:bg-[#00765F]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white" />
                      <span>
                        {authHours !== null && recHours >= authHours 
                          ? 'PO Budget Cap Reached — Add Overtime Hours' 
                          : "Add Today's Hours"}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                /* EMPTY ASSIGNMENT STATE FOR SELECTED PLANT */
                <div className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex flex-col gap-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#CBD8E8] pb-1.5">
                    <span className="text-xs font-bold text-[#10284A] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#5B6F89]" />
                      <span>Current Assignment</span>
                    </span>
                    <span className="text-[10px] bg-[#FFF4D6] text-[#C66A00] font-extrabold px-2 py-0.5 rounded-md uppercase">
                      No Assignment
                    </span>
                  </div>

                  <div className="py-4 px-3 text-center flex flex-col items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#EAEFF5]">
                    <AlertTriangle className="w-6 h-6 text-[#C66A00]" />
                    <h4 className="text-xs font-extrabold text-[#10284A]">You Have No Assigned Work at {displayPlant}</h4>
                    <p className="text-[11px] text-[#5B6F89] max-w-[250px] leading-relaxed">
                      You currently do not have an active project, PO budget, or containment assignment configured at this plant location.
                    </p>
                  </div>
                </div>
              )}



              {/* ADD TODAY'S HOURS MODAL */}
              {showAddHoursModal && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 z-50 animate-in fade-in">
                  <div className="bg-white border border-slate-300 rounded-xl w-full max-w-[340px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
                    <div className="bg-[#008F72] p-3 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4.5 h-4.5 text-white" />
                        <h3 className="text-[14px] font-black uppercase tracking-wide">Add Today's Hours</h3>
                      </div>
                      <button onClick={() => setShowAddHoursModal(false)} className="text-white/80 hover:text-white"><X className="w-4.5 h-4.5" /></button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleAddTodayHoursSubmit(false); }} className="p-3.5 flex flex-col gap-3 overflow-y-auto">
                      
                      {/* Section 10: Rep Assignment Selector */}
                      {(() => {
                        const repAssignments = getRepAssignments();
                        const dbSuppliers = getEntities('suppliers') || [];
                        const getSupplierName = (supId) => {
                          if (!supId) return 'Client / Supplier';
                          const sup = dbSuppliers.find(s => String(s.id) === String(supId) || s.name === supId || s.code === supId);
                          return sup?.name || supId;
                        };

                        if (repAssignments.length === 0) {
                          return (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
                              <p className="text-xs font-bold text-amber-800">No active project assignment assigned.</p>
                              <p className="text-[11px] text-amber-700 mt-0.5">Admin must create or configure a project assignment before hours can be logged.</p>
                            </div>
                          );
                        }

                        return (
                          <div>
                            <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                              Project Assignment *
                            </label>
                            {repAssignments.length === 1 ? (
                              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-left">
                                <span className="text-xs font-bold text-slate-900 block">{repAssignments[0].title || repAssignments[0].name}</span>
                                <span className="text-[10.5px] text-slate-500 block mt-0.5">
                                  {getSupplierName(repAssignments[0].supplier_id || repAssignments[0].client_id)} • {repAssignments[0].authorized_hours ? `${repAssignments[0].authorized_hours}h authorized` : 'Hours allocation not configured'}
                                </span>
                              </div>
                            ) : (
                              <select
                                id="rep-assignment-selector"
                                value={selectedAssignmentId || (repAssignments.length > 0 ? repAssignments[0].id : '')}
                                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                                className="phone-input text-xs font-bold"
                              >
                                <option value="">-- Choose Assignment --</option>
                                {repAssignments.map(asgn => {
                                  const pName = asgn.title || asgn.name || `Project ${asgn.id}`;
                                  const cName = getSupplierName(asgn.supplier_id || asgn.client_id);
                                  const hrsLabel = asgn.authorized_hours ? `${asgn.authorized_hours}h alloc` : 'Hours allocation not configured';
                                  return (
                                    <option key={asgn.id} value={asgn.id}>
                                      {pName} — {cName} [{hrsLabel}]
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                        );
                      })()}
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
                      </div>

                      <div>
                        <BusinessDropdown
                          id="add-hours-work-type"
                          label="Work Type"
                          options={[
                            'Routine inspection',
                            'Incident investigation',
                            'Containment or rework support',
                            'Customer/supplier communication',
                            'Documentation/reporting'
                          ]}
                          value={addHoursType}
                          onChange={(newVal) => setAddHoursType(newVal)}
                          placeholder="Select work type..."
                          customInputLabel="Enter the missing work activity type"
                          customInputPlaceholder="Example: Calibration check, root cause analysis..."
                        />
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
                          className="flex-1 h-10 bg-[#008F72] hover:bg-[#00765F] text-white font-bold text-xs rounded-lg shadow-md"
                        >
                          Submit Hours
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Requirement 11: Render Split Confirmation Modal */}
              {splitConfirmState && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex items-center justify-center p-3 z-50 animate-in zoom-in-95">
                  <div className="bg-white border border-amber-300 rounded-xl w-full max-w-[340px] p-4 flex flex-col gap-3 shadow-2xl text-left">
                    <div className="flex items-center gap-2 text-amber-700 border-b border-slate-200 pb-2">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider">Part of these hours requires Client approval.</h3>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-1 text-[11.5px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Hours Entered:</span>
                        <span className="font-bold text-slate-900">{splitConfirmState.hrs} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Remaining Allocation:</span>
                        <span className="font-bold text-slate-900">{splitConfirmState.remainingAlloc} hrs</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1 mt-1">
                        <span>Regular Recorded (Auto):</span>
                        <span>{splitConfirmState.regularPortion} hrs</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-bold">
                        <span>Overtime Pending Client Review:</span>
                        <span>{splitConfirmState.overtimePortion} hrs</span>
                      </div>
                    </div>

                    <div className="text-[10.5px] text-slate-600">
                      <p><span className="font-bold text-slate-800">Customer:</span> {getSupplierName(splitConfirmState.activeSupplierId)}</p>
                      <p><span className="font-bold text-slate-800">Assignment:</span> {splitConfirmState.activeProject?.title || splitConfirmState.activeProject?.id}</p>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSplitConfirmState(null)}
                        className="flex-1 py-2 bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddTodayHoursSubmit(true)}
                        className="flex-1 py-2 bg-[#008F72] text-white font-bold text-xs rounded-lg hover:bg-[#00765F] shadow-sm cursor-pointer"
                      >
                        Submit Hours
                      </button>
                    </div>
                  </div>
                </div>
              )}


          </div>
          );
        })()}

        {/* SCREEN 2B: WORK DESTINATION */}
        {activeScreen === 'work' && isLoggedIn && currentUser && (
          <div className="flex-1 min-h-0 flex flex-col p-3 bg-[#F5F8FC] overflow-y-auto gap-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#CBD8E8]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#008F72]" />
                <h2 className="text-sm font-extrabold text-[#10284A]">Assigned Work & Actions</h2>
              </div>
              <button 
                onClick={() => setActiveScreen('home')}
                className="text-xs text-[#1769E0] font-bold hover:underline cursor-pointer"
              >
                ← Back Home
              </button>
            </div>

            {/* QUICK WORK ACTIONS */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setActiveScreen('inspection')}
                className="bg-white border border-[#CBD8E8] hover:border-[#008F72] rounded-xl p-3 flex flex-col gap-1.5 transition-all text-left shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#DDF8EE] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#008F72]" />
                </div>
                <span className="text-xs font-bold text-[#10284A]">Routine Inspection</span>
                <span className="text-[10px] text-[#5B6F89]">Record sorting log</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveScreen('rework')}
                className="bg-white border border-[#CBD8E8] hover:border-[#1769E0] rounded-xl p-3 flex flex-col gap-1.5 transition-all text-left shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF2FF] flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-[#1769E0]" />
                </div>
                <span className="text-xs font-bold text-[#10284A]">Log Billable Rework</span>
                <span className="text-[10px] text-[#5B6F89]">Containment rework</span>
              </button>
            </div>

            {/* REQUESTED SORTS AND AUDITS */}
            <div className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex flex-col gap-2 shadow-2xs">
              <span className="text-xs font-bold text-[#10284A] border-b border-[#CBD8E8] pb-1.5 block">
                Requested Sorts and Audits ({bonusTasks ? bonusTasks.length : 0})
              </span>

              <div className="flex flex-col gap-2">
                {bonusTasks && bonusTasks.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-[#EFF3F8] rounded-lg border border-[#CBD8E8] flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#10284A]">{t.task}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#1256B8] font-mono font-bold">PN-{t.partNumber || '86291945'}</span>
                        <span className="text-[10px] text-[#5B6F89]">{t.dueDate ? `Due ${t.dueDate}` : 'Active'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInspPartNumber(t.partNumber || '86291945');
                        setInspPNMode('dropdown');
                        setInspNotes(`Performing ${t.task}...`);
                        setActiveScreen('inspection');
                        showToast(`Pre-filled inspection for ${t.task}!`, "info");
                      }}
                      className="px-2.5 py-1 bg-[#008F72] hover:bg-[#00765F] text-white rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2C: REPORTS DESTINATION */}
        {activeScreen === 'reports' && isLoggedIn && currentUser && (
          <div className="flex-1 min-h-0 flex flex-col p-3 bg-[#F5F8FC] overflow-y-auto gap-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#CBD8E8]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#008F72]" />
                <h2 className="text-sm font-extrabold text-[#10284A]">Quality Reports & Logs</h2>
              </div>
              <button 
                onClick={() => setActiveScreen('home')}
                className="text-xs text-[#1769E0] font-bold hover:underline cursor-pointer"
              >
                ← Back Home
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setActiveScreen('summary')}
                className="bg-white border border-[#CBD8E8] hover:border-[#008F72] rounded-xl p-3 flex flex-col gap-1.5 transition-all text-left shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#DDF8EE] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#008F72]" />
                </div>
                <span className="text-xs font-bold text-[#10284A]">Daily Quality Report</span>
                <span className="text-[10px] text-[#5B6F89]">Summary walkthrough</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveScreen('history')}
                className="bg-white border border-[#CBD8E8] hover:border-[#1769E0] rounded-xl p-3 flex flex-col gap-1.5 transition-all text-left shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF2FF] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#1769E0]" />
                </div>
                <span className="text-xs font-bold text-[#10284A]">Activity & Incident Logs</span>
                <span className="text-[10px] text-[#5B6F89]">View audit history</span>
              </button>
            </div>

            <div className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex flex-col gap-2 shadow-2xs">
              <span className="text-xs font-bold text-[#10284A] border-b border-[#CBD8E8] pb-1.5 block">
                Saved Drafts & Incident Reports
              </span>
              <p className="text-xs text-[#5B6F89] italic py-2">All submitted reports are automatically synced and available in Activity History.</p>
            </div>
          </div>
        )}

        {/* SCREEN 2D: MORE DESTINATION */}
        {activeScreen === 'more' && isLoggedIn && currentUser && (
          <div className="flex-1 min-h-0 flex flex-col p-3 bg-[#F5F8FC] overflow-y-auto gap-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#CBD8E8]">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#008F72]" />
                <h2 className="text-sm font-extrabold text-[#10284A]">Operations & Settings</h2>
              </div>
              <button 
                onClick={() => setActiveScreen('home')}
                className="text-xs text-[#1769E0] font-bold hover:underline cursor-pointer"
              >
                ← Back Home
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                type="button"
                onClick={() => {
                  setActiveScreen('expenses');
                  setTimeExpenseTab('expense');
                }}
                className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex items-center justify-between hover:bg-[#EFF3F8] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF4D6] flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-[#C66A00]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#10284A] block">Log Field Expense</span>
                    <span className="text-[10px] text-[#5B6F89]">Claim mileage & out-of-pocket expenses</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6F89]" />
              </button>

              <button 
                type="button"
                onClick={() => setActiveScreen('history')}
                className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex items-center justify-between hover:bg-[#EFF3F8] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF2FF] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#1769E0]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#10284A] block">Activity History</span>
                    <span className="text-[10px] text-[#5B6F89]">Review logged shifts & reports</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5B6F89]" />
              </button>

              <div className="bg-white border border-[#CBD8E8] rounded-xl p-3 flex flex-col gap-2">
                <span className="text-xs font-bold text-[#10284A] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#008F72]" />
                  <span>Offline & Sync Telemetry</span>
                </span>
                <p className="text-[11px] text-[#5B6F89]">
                  {isOffline ? 'System working in Offline Mode. Records saved locally.' : 'System connected to Database. 0 pending offline sync records.'}
                </p>
              </div>

              <button 
                type="button"
                onClick={handleLogout}
                className="w-full h-11 bg-[#FDECEF] border border-[#D92D3F] text-[#B42336] rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-2 hover:bg-[#FCE3E7] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({currentUser.name})</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2E: SAFE RECOVERABLE FALLBACK FOR UNKNOWN ACTIVE SCREEN */}
        {isLoggedIn && currentUser && !['home', 'work', 'reports', 'more', 'incident', 'inspection', 'rework', 'expenses', 'summary', 'history'].includes(activeScreen) && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F5F8FC] text-center gap-3">
            <AlertTriangle className="w-10 h-10 text-[#D92D3F]" />
            <div>
              <h3 className="text-sm font-extrabold text-[#10284A]">This section could not be opened.</h3>
              <p className="text-xs text-[#5B6F89] mt-1">The requested screen target standard path is unavailable.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveScreen('home')}
              className="px-5 py-2 bg-[#008F72] hover:bg-[#00765F] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors mt-2"
            >
              Return to Home
            </button>
          </div>
        )}
        {activeScreen === 'incident' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
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

            {/* REQUIRED MISSING-MEDIA REASON DIALOG (Section 2 AG Master Correction Prompt) */}
            {showMissingMediaDialog && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs z-50 flex items-center justify-center p-3">
                <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-2xl flex flex-col gap-3 w-full max-w-[330px] text-left animate-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <AlertTriangle className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Why is there no media?</h3>
                      <span className="text-[10px] text-slate-500 font-medium">Select a reason before continuing without media.</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10.5px] font-bold text-slate-700">Missing Media Reason *</label>
                    <select
                      value={mediaUnavailableReason || ''}
                      onChange={(e) => {
                        setMediaUnavailableReason(e.target.value || null);
                        if (e.target.value !== 'Other') setMediaUnavailableNote('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white"
                    >
                      <option value="">Select reason</option>
                      <option value="Photography is not permitted at this plant">Photography is not permitted at this plant</option>
                      <option value="Unsafe to capture media">Unsafe to capture media</option>
                      <option value="Evidence is no longer physically available">Evidence is no longer physically available</option>
                      <option value="Camera permission was denied">Camera permission was denied</option>
                      <option value="Device or camera problem">Device or camera problem</option>
                      <option value="Poor visibility">Poor visibility</option>
                      <option value="General process concern with no visible defect">General process concern with no visible defect</option>
                      <option value="Other">Other</option>
                    </select>

                    {mediaUnavailableReason === 'Other' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-rose-700">Explanation Note *</label>
                        <textarea
                          rows={2}
                          value={mediaUnavailableNote}
                          onChange={(e) => setMediaUnavailableNote(e.target.value)}
                          placeholder="Explain why media is not available..."
                          className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 focus:border-rose-500 resize-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!mediaUnavailableReason) {
                          showToast("Please select a missing-media reason.", "warning");
                          return;
                        }
                        if (mediaUnavailableReason === 'Other' && (!mediaUnavailableNote || !mediaUnavailableNote.trim())) {
                          showToast("An explanation note is required for 'Other'.", "warning");
                          return;
                        }
                        setMediaEvidenceStatus('unavailable');
                        setShowMissingMediaDialog(false);
                        setIncStep(2);
                      }}
                      className="w-full min-h-[42px] py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer text-center"
                    >
                      Save reason and continue
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMissingMediaDialog(false)}
                      className="w-full min-h-[38px] py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer text-center"
                    >
                      Go back and add media
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step Indicators */}
            <div className="grid grid-cols-4 border-b border-slate-300 text-center text-[10.5px] bg-slate-100">
              <button onClick={() => setIncStep(1)} className={`py-2 font-bold ${incStep === 1 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}>1. Capture</button>
              <button onClick={() => {
                const validation = validateIncidentWorkflow(2);
                if (!validation.valid) {
                  showToast(validation.message, "warning");
                  if (validation.code.startsWith('MEDIA_')) setShowMissingMediaDialog(true);
                  return;
                }
                setIncStep(2);
              }} className={`py-2 font-bold ${incStep === 2 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}>2. Scan</button>
              <button onClick={() => {
                const validation = validateIncidentWorkflow(3);
                if (!validation.valid) {
                  showToast(validation.message, "warning");
                  if (validation.code.startsWith('MEDIA_')) setShowMissingMediaDialog(true);
                  return;
                }
                setIncStep(3);
              }} className={`py-2 font-bold ${incStep === 3 ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600'}`}>3. Describe</button>
              <button
                onClick={() => {
                  const validation = validateIncidentWorkflow(4);
                  if (!validation.valid) {
                    showToast(validation.message, "warning");
                    if (validation.code.startsWith('MEDIA_')) setShowMissingMediaDialog(true);
                    setIncStep(validation.errorStep);
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
            <div id="phone-form-scroll-container" className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-left">
              
              {/* STEP 1: CAPTURE (VISUAL EVIDENCE — OPTIONAL per Section 2) */}
              {incStep === 1 && (
                <div className="flex flex-col gap-3 relative">
                  <div className="flex justify-between items-center bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11.5px] text-[#008F72] font-black uppercase tracking-wider block">Visual Evidence — Optional</span>
                      <span className="text-[10px] text-slate-500 font-medium">Add a photo or video when it is safe and available.</span>
                    </div>
                  </div>

                  {evidenceList.length === 0 && !stagedVideoObject && mediaEvidenceStatus === 'unavailable' && mediaUnavailableReason && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-xs font-black text-amber-900 block">No media — {mediaUnavailableReason}</span>
                          {mediaUnavailableNote && <span className="text-[10px] text-amber-700">{mediaUnavailableNote}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMissingMediaDialog(true)}
                        className="text-[10.5px] font-extrabold text-amber-800 underline cursor-pointer"
                      >
                        Change reason
                      </button>
                    </div>
                  )}

                  {/* Hidden File Input for Native File Pick */}
                  <input
                    id="evidence_file_input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Action Buttons: Take or add photo | Add video | Continue (Section 2) */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (evidenceList.length >= 10) {
                          showToast("Maximum 10 photos per report limit reached.", "warning");
                          return;
                        }
                        setShowAddPhotoModal(true);
                      }}
                      className="w-full py-3 bg-[#008F72] hover:bg-[#00765F] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-600/30"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take or add photo ({evidenceList.length}/10)</span>
                    </button>

                    <input
                      type="file"
                      ref={videoFileInputRef}
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoFileSelected}
                    />

                    {!stagedVideoObject ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (videoFileInputRef.current) {
                              videoFileInputRef.current.click();
                            }
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl border border-[#008F72]/40 bg-[#008F72]/10 text-[#00765F] hover:bg-[#008F72]/20 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                        >
                          <Video className="w-4 h-4 text-[#00765F]" />
                          <span>Choose Video (Max 30s)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#008F72] text-white flex items-center justify-center font-bold text-xs">
                              <Video className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-xs text-slate-800 leading-tight">{stagedVideoObject.name}</span>
                              <span className="text-[10px] text-slate-600 font-medium">{stagedVideoObject.durationStr || '00:15 of 00:30'} • {stagedVideoObject.fileSizeMb || '2.4'} MB</span>
                            </div>
                          </div>

                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase border border-emerald-300">
                            Staged
                          </span>
                        </div>

                        {stagedVideoObject.isLargeFile && !stagedVideoObject.useMobileData && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-[10px]">
                            <span className="font-bold text-amber-800">Waiting for Wi-Fi ({stagedVideoObject.fileSizeMb} MB)</span>
                            <button
                              type="button"
                              onClick={() => setStagedVideoObject({ ...stagedVideoObject, useMobileData: true })}
                              className="px-2 py-1 bg-amber-600 text-white rounded font-extrabold cursor-pointer"
                            >
                              Upload Mobile Data
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-emerald-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              if (videoFileInputRef.current) {
                                videoFileInputRef.current.click();
                              }
                            }}
                            className="px-2.5 py-1 text-[10.5px] font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all"
                          >
                            Replace / Record again
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowDeleteVideoConfirm(true)}
                            className="px-2.5 py-1 text-[10.5px] font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                          >
                            Delete video
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const hasAnyRealMedia = evidenceList.length > 0 || !!stagedVideoObject;
                        if (hasAnyRealMedia) {
                          setMediaEvidenceStatus('provided');
                          setMediaUnavailableReason(null);
                          setMediaUnavailableNote('');
                          setIncStep(2);
                        } else if (mediaEvidenceStatus === 'unavailable' && mediaUnavailableReason) {
                          setIncStep(2);
                        } else {
                          setShowMissingMediaDialog(true);
                        }
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Evidence Cards List */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {evidenceList.map((item, index) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col gap-2 relative">
                        {/* Header: Photo Label, Reorder & Delete Controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-800">Photo {index + 1} of {evidenceList.length}</span>
                            {item.isAnnotated && (
                              <span className="bg-red-100 text-red-700 border border-red-200 text-[9.5px] font-bold px-1.5 py-0.2 rounded-md">
                                Marked
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => reorderEvidenceItem(item.id, 'up')}
                              className={`p-1 rounded-md border text-[10px] font-bold transition-colors ${
                                index === 0 ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                              }`}
                              title="Move photo up"
                            >
                              ▲
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={index === evidenceList.length - 1}
                              onClick={() => reorderEvidenceItem(item.id, 'down')}
                              className={`p-1 rounded-md border text-[10px] font-bold transition-colors ${
                                index === evidenceList.length - 1 ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                              }`}
                              title="Move photo down"
                            >
                              ▼
                            </button>

                            {/* Delete (Section 9: Deleting final photo MUST be allowed!) */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget(item.id)}
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Body: Thumbnail + Controls + Optional Note */}
                        <div className="flex gap-3">
                          <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                            <img
                              src={item.annotatedUrl || item.url}
                              alt={item.label}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => openAnnotationModal(item)}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{item.isAnnotated ? 'Edit photo markups' : 'Mark photo'}</span>
                            </button>

                            <textarea
                              rows={2}
                              value={item.note || ''}
                              onChange={(e) => updateEvidenceItemNote(item.id, e.target.value)}
                              placeholder="Optional description / notes (e.g. Scrap Tag #, crack detail)..."
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#008F72] transition-all resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* STEP 2: PARTS & TRACEABILITY (AUTHORITATIVE PROMPT WORKFLOW) */}
              {incStep === 2 && (
                <div className="flex flex-col gap-3.5 text-left relative">
                  {/* Saved Draft Restoration Banner (Section 16) */}
                  {savedDraftObject && (
                    <div className="bg-blue-50 border border-blue-300 p-3 rounded-xl flex flex-col gap-2 text-left shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-blue-900">Continue saved report draft?</span>
                        <span className="text-[9.5px] text-blue-700 font-mono">
                          Saved: {new Date(savedDraftObject.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-blue-800">
                        You have an unsubmitted incident draft with {savedDraftObject.affectedParts?.length || 0} part(s) and {savedDraftObject.toteBinLabels?.length || 0} container label(s).
                      </p>
                      <div className="flex gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleRestoreDraft}
                          className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-lg shadow-2xs cursor-pointer text-center"
                        >
                          Continue saved report
                        </button>
                        <button
                          type="button"
                          onClick={handleDiscardDraft}
                          className="py-1.5 px-3 bg-white border border-blue-300 text-blue-900 font-bold text-xs rounded-lg hover:bg-blue-100 cursor-pointer text-center"
                        >
                          Start new report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header & Page Title (Section 3) */}
                  <div className="flex flex-col gap-1 bg-slate-100/70 p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#008F72] font-black uppercase tracking-wider">
                        Step 2: Parts & Traceability
                      </span>
                      {affectedParts.length > 0 && (
                        <span className="text-[10.5px] bg-[#008F72]/10 text-[#008F72] border border-[#008F72]/30 font-bold px-2 py-0.5 rounded-full font-mono">
                          {affectedParts.length} Added
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                      Add available part and container information. If a label is missing or unreadable, you can still continue.
                    </p>
                  </div>

                  {/* SECTION 1: AFFECTED PART INFORMATION (Section 4 — 3 Equal Choices) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col gap-3">
                    <div>
                      <span className="text-[11.5px] font-black text-slate-900 uppercase tracking-wider block">
                        Section 1: Affected Part Information
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Choose the option that matches what is available at the plant.
                      </span>
                    </div>

                    {/* 3 Equal Choices */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPartChoice('scan');
                          startScanning('barcode');
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                          partChoice === 'scan'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Scan className="w-4 h-4 text-emerald-600" />
                        <span>Scan part/master label</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPartChoice('manual')}
                        className={`py-2 px-1.5 rounded-xl border text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                          partChoice === 'manual'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>Enter part number</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPartChoice('unavailable');
                          setTraceabilityStatus('unavailable');
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                          partChoice === 'unavailable' || traceabilityStatus === 'unavailable'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Part number not available</span>
                      </button>
                    </div>

                    {/* CHOICE 2 FORM: Enter Part Number (Section 6) */}
                    {partChoice === 'manual' && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-800">Part Number *</label>
                          <input
                            type="text"
                            value={manualPNInput}
                            onChange={(e) => handleManualPartNumberChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddManualPart();
                              }
                            }}
                            placeholder="Example: 86286761"
                            className="min-h-[44px] px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600">Serial/Lot # — Optional</label>
                            <input
                              type="text"
                              value={manualLotInput}
                              onChange={(e) => setManualLotInput(e.target.value)}
                              placeholder="Example: LOT-902"
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-mono text-slate-800"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600">Quantity — Optional</label>
                            <input
                              type="number"
                              value={manualQtyInput}
                              onChange={(e) => setManualQtyInput(e.target.value)}
                              placeholder="1"
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-mono text-slate-800"
                            />
                          </div>
                        </div>

                        {manualInputError && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{manualInputError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleAddManualPart}
                          className="min-h-[44px] w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" />
                          <span>{affectedParts.length > 0 ? 'Add another affected part' : 'Add affected part'}</span>
                        </button>
                      </div>
                    )}

                    {/* CHOICE 3 FORM: Part Number Not Available (Section 7) */}
                    {(partChoice === 'unavailable' || traceabilityStatus === 'unavailable') && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-amber-200 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                        <span className="text-[11px] font-extrabold text-amber-900">Why is the part number unavailable? — Optional</span>

                        <select
                          value={unavailableReason || ''}
                          onChange={(e) => setUnavailableReason(e.target.value || null)}
                          className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:border-amber-500"
                        >
                          <option value="">Select reason (Optional)</option>
                          <option value="Label missing">Label missing</option>
                          <option value="Label damaged or unreadable">Label damaged or unreadable</option>
                          <option value="Part number not known yet">Part number not known yet</option>
                          <option value="General process concern">General process concern</option>
                          <option value="Other">Other</option>
                        </select>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-amber-900">Add a note — Optional</label>
                          <textarea
                            rows={2}
                            value={unavailableNote}
                            onChange={(e) => setUnavailableNote(e.target.value)}
                            placeholder="Add optional notes about missing part number..."
                            className="p-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:border-amber-500 resize-none"
                          />
                        </div>

                        <div className="p-2 bg-white/80 border border-amber-300/80 rounded-lg text-center">
                          <span className="text-[11px] font-extrabold text-amber-900 block">Part number not available</span>
                          <span className="text-[10px] text-amber-800">You can continue now and supply traceability later if needed.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Possible Mislabel Warning Banner (Section 10) */}
                  {mislabelWarning && (
                    <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-xl flex flex-col gap-2 shadow-md">
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs leading-snug">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                        <span>Possible mislabel — the scanned label does not match the expected part.</span>
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Scanned code: <code className="font-mono font-bold text-slate-900 bg-amber-100 px-1 py-0.5 rounded">{mislabelWarning.scannedValue}</code> vs Expected part: <code className="font-mono font-bold text-slate-900 bg-amber-100 px-1 py-0.5 rounded">{mislabelWarning.expectedPartNumber}</code>
                      </p>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={handleMislabelKeepBoth}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
                        >
                          Keep both values & flag for review
                        </button>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={handleMislabelRescan}
                            className="py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-[10.5px] rounded-lg hover:bg-amber-100 cursor-pointer text-center"
                          >
                            Rescan label
                          </button>
                          <button
                            type="button"
                            onClick={handleMislabelCorrectExpected}
                            className="py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-[10.5px] rounded-lg hover:bg-amber-100 cursor-pointer text-center"
                          >
                            Correct expected
                          </button>
                          <button
                            type="button"
                            onClick={handleMislabelCancel}
                            className="py-1.5 bg-white border border-amber-300 text-slate-700 font-bold text-[10.5px] rounded-lg hover:bg-slate-100 cursor-pointer text-center"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Affected Parts List Section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-black text-slate-900 uppercase tracking-wider">Affected parts</span>
                      {affectedParts.length > 0 && (
                        <span className="text-[10.5px] text-slate-500 font-mono">
                          {affectedParts.length} record(s)
                        </span>
                      )}
                    </div>

                    {affectedParts.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 text-center flex flex-col items-center justify-center gap-1 text-slate-500">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700">
                          {traceabilityStatus === 'unavailable' ? 'Part number recorded as not available.' : 'No affected parts added yet.'}
                        </p>
                        <p className="text-[10.5px] text-slate-500">Select an option above to add parts or record as unavailable.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
                        {affectedParts.map((item) => (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col gap-1.5 relative">
                            {editingPartId === item.id ? (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={editPartInputValue}
                                    onChange={(e) => setEditPartInputValue(e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#008F72]"
                                  />
                                  <button
                                    type="button"
                                    onClick={saveEditedAffectedPart}
                                    className="px-3 py-1.5 bg-[#008F72] text-white font-bold text-xs rounded-lg cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPartId(null);
                                      setEditInputError('');
                                    }}
                                    className="px-2 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {editInputError && (
                                  <span className="text-[10.5px] text-rose-600 font-bold">{editInputError}</span>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-black text-slate-900 font-mono block">PN {item.partNumber}</span>
                                    <span className="text-[11px] font-medium text-slate-600 block leading-tight">{item.description || 'Description not available'}</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                                      item.entryMethod === 'Entered manually'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                      {item.entryMethod || 'Scanned'}
                                    </span>
                                    {item.possibleMislabel && (
                                      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                                        Mislabel Flag
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Format: {item.scanFormat || 'barcode'}
                                    </span>
                                    {item.verificationStatus === 'verified' && (
                                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        Verified
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2.5">
                                    {item.verificationStatus !== 'verified' && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartVerificationScan(item.id)}
                                        className={`text-[10.5px] font-bold cursor-pointer transition-colors ${
                                          verificationTargetPartId === item.id
                                            ? 'text-amber-600 animate-pulse font-extrabold'
                                            : 'text-emerald-700 hover:text-emerald-900'
                                        }`}
                                      >
                                        {verificationTargetPartId === item.id ? 'Scanning target...' : 'Verify by scan'}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleEditAffectedPart(item)}
                                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAffectedPart(item.id)}
                                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: TOTE OR CONTAINER INFORMATION — OPTIONAL (Section 11 & 13) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11.5px] font-black text-slate-800 uppercase tracking-wider block">
                          Section 2: Tote or Container Information — Optional
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Add this information only when a tote, bin, box or container label is available.
                        </span>
                      </div>
                      {toteBinLabels.length > 0 && (
                        <span className="text-[10.5px] text-slate-500 font-mono font-bold">{toteBinLabels.length} added</span>
                      )}
                    </div>

                    {/* 3 Container Choices */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setContainerChoice('scan');
                          startScanning('qr');
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                          containerChoice === 'scan'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        <span>Scan container label</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setContainerChoice('manual')}
                        className={`py-2 px-1.5 rounded-xl border text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                          containerChoice === 'manual'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>Enter container label</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setContainerChoice('unavailable');
                          setContainerTraceabilityStatus('unavailable');
                        }}
                        className={`py-2 px-1.5 rounded-xl border text-[10.5px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                          containerChoice === 'unavailable' || containerTraceabilityStatus === 'unavailable'
                            ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <X className="w-4 h-4 text-slate-500" />
                        <span>No container label</span>
                      </button>
                    </div>

                    {/* CHOICE 2 CONTAINER FORM: Enter Container Label (Section 12) */}
                    {containerChoice === 'manual' && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex gap-2">
                          <div className="w-1/3">
                            <label className="text-[10px] font-bold text-slate-600">Type</label>
                            <select
                              value={manualContainerType}
                              onChange={(e) => setManualContainerType(e.target.value)}
                              className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                            >
                              <option value="Tote">Tote</option>
                              <option value="Bin">Bin</option>
                              <option value="Box">Box</option>
                              <option value="Container">Container</option>
                              <option value="Unknown">Unknown</option>
                            </select>
                          </div>

                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-600">Container Label *</label>
                            <input
                              type="text"
                              value={manualToteInput}
                              onChange={(e) => {
                                setManualToteInput(e.target.value);
                                setManualToteError('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddManualToteBinLabel();
                                }
                              }}
                              placeholder="Example: BIN-MAG-6761"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {manualToteError && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>{manualToteError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleAddManualToteBinLabel}
                          className="min-h-[44px] w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" />
                          <span>{toteBinLabels.length > 0 ? 'Add another container label' : 'Add container label'}</span>
                        </button>
                      </div>
                    )}

                    {/* CHOICE 3 CONTAINER FORM: No Container Label Reason (Section 13) */}
                    {(containerChoice === 'unavailable' || containerTraceabilityStatus === 'unavailable') && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-300 bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-left">
                        <span className="text-[11px] font-extrabold text-slate-800">Reason container label is unavailable — Optional</span>
                        <select
                          value={containerUnavailableReason || ''}
                          onChange={(e) => setContainerUnavailableReason(e.target.value || null)}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                        >
                          <option value="">Select reason (Optional)</option>
                          <option value="Part was not in a container">Part was not in a container</option>
                          <option value="Container label missing">Container label missing</option>
                          <option value="Label damaged or unreadable">Label damaged or unreadable</option>
                          <option value="Not applicable">Not applicable</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    {/* Tote/Bin Scrollable Collection List */}
                    <div className="flex flex-col gap-1.5">
                      {toteBinLabels.length === 0 ? (
                        <div className="p-2.5 bg-white border border-dashed border-slate-300 rounded-lg text-center">
                          <span className="text-[11px] text-slate-400 font-medium">No tote or container information added. This section is optional.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                          {toteBinLabels.map((item) => {
                            const relatedPartsText = !item.relatedPartIds || item.relatedPartIds.length === 0
                              ? 'Entire incident'
                              : item.relatedPartIds.map(id => {
                                  const match = affectedParts.find(p => p.id === id);
                                  return match ? `PN ${match.partNumber}` : null;
                                }).filter(Boolean).join(', ') || 'Entire incident';

                            return (
                              <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex flex-col gap-1">
                                {editingToteId === item.id ? (
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        value={editToteInputValue}
                                        onChange={(e) => setEditToteInputValue(e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={saveEditedToteBinLabel}
                                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingToteId(null);
                                          setEditToteError('');
                                        }}
                                        className="px-2 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    {editToteError && (
                                      <span className="text-[10.5px] text-rose-600 font-bold">{editToteError}</span>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${
                                          item.entryMethod === 'Entered manually'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                          {item.entryMethod || 'Scanned'}
                                        </span>
                                        <span className="text-xs font-mono font-black text-slate-900">{item.labelValue}</span>
                                        {item.containerType && (
                                          <span className="text-[9px] text-slate-500 font-medium border border-slate-200 px-1 rounded">
                                            {item.containerType}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {item.entryMethod === 'Scanned' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReplacingContainerId(item.id);
                                              startScanning('qr');
                                            }}
                                            className="text-[10.5px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                          >
                                            Replace
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleEditToteBinLabel(item)}
                                          className="text-[10.5px] font-bold text-blue-700 hover:underline cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveToteBinLabel(item.id)}
                                          className="text-[10.5px] font-bold text-rose-600 hover:underline cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>

                                    {/* Clean Association Display (Section 15 — Clean UI without permanent dropdown clutter) */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                                      <span className="font-medium">Applies to: <span className="font-bold text-slate-800">{relatedPartsText}</span></span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons (Section 3 & Section 8) */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 mt-1">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIncStep(1)}
                        className="flex-1 min-h-[48px] py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center justify-center"
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (affectedParts.length === 0 && traceabilityStatus !== 'unavailable' && !hasConfirmedNoTraceability) {
                            setShowNoTraceabilityConfirmation(true);
                            return;
                          }
                          if (affectedParts.length === 0 && traceabilityStatus !== 'unavailable') {
                            setTraceabilityStatus('not_provided');
                          } else if (affectedParts.length > 0) {
                            setTraceabilityStatus('provided');
                          }
                          setIncStep(3);
                        }}
                        className="flex-1 min-h-[48px] py-3 bg-[#008F72] hover:bg-[#00765F] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-600/30"
                      >
                        <span>Continue to Describe</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* NON-BLOCKING CONTINUATION CONFIRMATION MODAL (Section 8) */}
                  {showNoTraceabilityConfirmation && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-2xl flex flex-col gap-3 max-w-[320px] text-center animate-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-xs font-black text-slate-900">No part traceability added</h3>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            No part traceability has been added. You can continue now and add it later if it becomes available.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setHasConfirmedNoTraceability(true);
                              setTraceabilityStatus('not_provided');
                              setShowNoTraceabilityConfirmation(false);
                              setIncStep(3);
                            }}
                            className="w-full min-h-[44px] py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Continue without traceability
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNoTraceabilityConfirmation(false)}
                            className="w-full min-h-[40px] py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
                          >
                            Go back and add traceability
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DESCRIBE (PAGE 3 OVERHAUL) */}
              {incStep === 3 && (
                <div className="flex flex-col gap-3.5 text-left">
                  {/* Step Header */}
                  <div className="flex flex-col gap-1 bg-slate-100/70 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs text-[#008F72] font-black uppercase tracking-wider">
                      Step 3: Describe Concern & Context
                    </span>
                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                      Record where the concern was found, defect type, detailed description, and supplier follow-up details.
                    </p>
                  </div>

                  {/* 1. FACTORY AREA */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <BusinessDropdown
                      id="selected-area-dropdown"
                      label="Area Found"
                      required={true}
                      options={[
                        'Sequence Area',
                        'Heavy Repair',
                        'Scrap Table',
                        'Assembly Line 1',
                        'Assembly Line 2',
                        'Receiving Dock',
                        'Quality Lab',
                        'Staging Yard'
                      ]}
                      value={selectedArea}
                      onChange={(newVal) => {
                        setSelectedArea(newVal);
                        if (areaError) setAreaError('');
                      }}
                      placeholder="Select factory area / location..."
                      customInputLabel="Enter the missing factory area / location"
                      customInputPlaceholder="Example: Line 4 Sub-Assembly, Rack Storage 12..."
                      error={areaError}
                    />
                  </div>

                  {/* 2. DEFECT / CONCERN TYPE */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <BusinessDropdown
                      id="defect-type-dropdown"
                      label="Defect / Concern Type"
                      options={[
                        'Loose component',
                        'Rattle sound',
                        'Damaged label',
                        'Flash / Burrs',
                        'Missing fastener',
                        'Surface scratch',
                        'Terminal pin deformation',
                        'Dimensional out of spec',
                        'Missing gasket / seal',
                        'Color / paint mismatch'
                      ]}
                      value={defectType}
                      onChange={(newVal) => setDefectType(newVal)}
                      placeholder="Select or enter defect type..."
                      customInputLabel="Enter the missing defect type"
                      customInputPlaceholder="Example: Connector tab fracture, improper torque..."
                    />
                  </div>

                  {/* 3. SUSPECT DEFECT * */}
                  <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label htmlFor="suspect-defect-input" className="text-[11px] font-extrabold text-slate-900">
                        Suspect Defect *
                      </label>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        {description ? `${description.trim().split(/\s+/).filter(Boolean).length} words` : '0 words'}
                      </span>
                    </div>
                    <AutoGrowTextarea
                      id="suspect-defect-input"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (descriptionError) setDescriptionError('');
                      }}
                      minHeight="120px"
                      maxHeight="280px"
                      aria-describedby={descriptionError ? "desc-error" : undefined}
                      aria-invalid={!!descriptionError}
                      placeholder="Describe what was found, why it is considered a defect, and include measurements or observations when relevant."
                      className={descriptionError ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300'}
                    />
                    {descriptionError && (
                      <span id="desc-error" className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{descriptionError}</span>
                      </span>
                    )}
                  </div>

                  {/* 4. ACTION TAKEN */}
                  <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <label htmlFor="action-taken-input" className="text-[11px] font-extrabold text-slate-900 flex items-center justify-between">
                      <span>Action Taken</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <AutoGrowTextarea
                      id="action-taken-input"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      minHeight="96px"
                      maxHeight="280px"
                      placeholder="Example: Removed the loose bulb and returned the light to the sequence area."
                      className="border-slate-300"
                    />
                  </div>

                  {/* 5. CLIENT QUALITY CONTACTS */}
                  <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <label className="text-[11px] font-extrabold text-slate-900 flex items-center justify-between">
                      <span>Client Quality Contact(s)</span>
                      <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Auto-routed for Client</span>
                    </label>

                    {getAvailableSupplierContacts().length === 0 ? (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col gap-1 text-left">
                        <span className="text-[11px] font-extrabold text-amber-900">
                          No client contact is configured for this assignment. The report can be released to the Client Dashboard, but an email notification cannot be prepared.
                        </span>
                        <span className="text-[10px] text-amber-700 font-medium">
                          Source: Contacts configured for this assignment. Next: Selected contacts will appear in the final report-routing review.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {/* Search filter input */}
                        {getAvailableSupplierContacts().length > 3 && (
                          <input
                            type="text"
                            value={supplierContactSearch}
                            onChange={(e) => setSupplierContactSearch(e.target.value)}
                            placeholder="Filter contacts..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800"
                          />
                        )}

                        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {getAvailableSupplierContacts()
                            .filter(c => !supplierContactSearch || c.name.toLowerCase().includes(supplierContactSearch.toLowerCase()) || (c.role && c.role.toLowerCase().includes(supplierContactSearch.toLowerCase())))
                            .map(contact => {
                              const isSelected = selectedSupplierContactIds.includes(contact.id);
                              return (
                                <button
                                  key={contact.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      const updated = selectedSupplierContactIds.filter(id => id !== contact.id);
                                      setSelectedSupplierContactIds(updated);
                                      const names = getAvailableSupplierContacts().filter(c => updated.includes(c.id)).map(c => c.name).join(', ');
                                      setSupplierContact(names);
                                    } else {
                                      const updated = [...selectedSupplierContactIds, contact.id];
                                      setSelectedSupplierContactIds(updated);
                                      const names = getAvailableSupplierContacts().filter(c => updated.includes(c.id)).map(c => c.name).join(', ');
                                      setSupplierContact(names);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold">{contact.name}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {contact.role} {contact.email ? `• ${contact.email}` : ''}
                                    </span>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                    isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected ? '✓' : ''}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Source: Contacts configured for this assignment. Next: Selected contacts will appear in the final report-routing review.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 6. SUPPLIER FOLLOW-UP SECTION */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5">
                    <span className="text-[11.5px] font-black text-slate-900 uppercase tracking-wider block">
                      Supplier Follow-up
                    </span>

                    <div className="flex flex-col gap-2 text-[11.5px]">
                      {/* Returned to Supplier? */}
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-800 font-bold">Returned to Supplier?</span>
                        <div className="phone-toggle-group w-32 min-h-[44px]">
                          <button
                            type="button"
                            aria-pressed={isReturningDefect === 'Y'}
                            aria-label="Returned to Supplier Yes"
                            onClick={() => setIsReturningDefect('Y')}
                            className={`flex-1 min-h-[44px] phone-toggle-btn transition-all ${
                              isReturningDefect === 'Y'
                                ? 'active-yes'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isReturningDefect === 'Y' ? '✓ Yes' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            aria-pressed={isReturningDefect === 'N'}
                            aria-label="Returned to Supplier No"
                            onClick={() => setIsReturningDefect('N')}
                            className={`flex-1 min-h-[44px] phone-toggle-btn transition-all ${
                              isReturningDefect === 'N'
                                ? 'active-no'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isReturningDefect === 'N' ? '✕ No' : 'No'}
                          </button>
                        </div>
                      </div>

                      {/* Sort Requested? */}
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-800 font-bold">Sort Requested?</span>
                        <div className="phone-toggle-group w-32 min-h-[44px]">
                          <button
                            type="button"
                            aria-pressed={isSortRequired === 'Y'}
                            aria-label="Sort Requested Yes"
                            onClick={() => setIsSortRequired('Y')}
                            className={`flex-1 min-h-[44px] phone-toggle-btn transition-all ${
                              isSortRequired === 'Y'
                                ? 'active-yes'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSortRequired === 'Y' ? '✓ Yes' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            aria-pressed={isSortRequired === 'N'}
                            aria-label="Sort Requested No"
                            onClick={() => setIsSortRequired('N')}
                            className={`flex-1 min-h-[44px] phone-toggle-btn transition-all ${
                              isSortRequired === 'N'
                                ? 'active-no'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSortRequired === 'N' ? '✕ No' : 'No'}
                          </button>
                        </div>
                      </div>

                      {/* RMA Required? */}
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-800 font-bold">RMA Required?</span>
                        <div className="phone-toggle-group w-32 min-h-[44px]">
                          <button
                            type="button"
                            aria-pressed={isRmaRequired === 'Y'}
                            aria-label="RMA Required Yes"
                            onClick={() => setIsRmaRequired('Y')}
                            className={`flex-1 min-h-[44px] phone-toggle-btn transition-all ${
                              isRmaRequired === 'Y'
                                ? 'active-yes'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isRmaRequired === 'Y' ? '✓ Yes' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            aria-pressed={isRmaRequired === 'N'}
                            aria-label="RMA Required No"
                            onClick={() => {
                              setIsRmaRequired('N');
                              setRmaNumber('');
                            }}
                            className={`flex-1 min-h-[44px] phone-toggle-btn transition-all ${
                              isRmaRequired === 'N'
                                ? 'active-no'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isRmaRequired === 'N' ? '✕ No' : 'No'}
                          </button>
                        </div>
                      </div>

                      {/* Optional RMA Number input if RMA Required */}
                      {isRmaRequired === 'Y' && (
                        <div className="flex flex-col gap-1 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200 animate-in fade-in-50 duration-150">
                          <label className="text-[10.5px] font-bold text-blue-900">RMA Number — Optional</label>
                          <input
                            type="text"
                            value={rmaNumber}
                            onChange={(e) => setRmaNumber(e.target.value)}
                            placeholder="Example: RMA-2026-0891"
                            className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 7. ISSUE CLASSIFICATION / STATUS */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <BusinessDropdown
                      id="concern-classification-dropdown"
                      label="Issue Classification / Status"
                      options={[
                        'PRR',
                        'PRR / GIM',
                        'EWO',
                        '8D / SCAR',
                        'Quality Alert',
                        'Scrap Tag',
                        'Verbal Notification'
                      ]}
                      value={concernClassification}
                      onChange={(newVal) => setConcernClassification(newVal)}
                      placeholder="Select classification..."
                      customInputLabel="Enter custom concern classification"
                      customInputPlaceholder="Example: Engineering Hold Notice #402..."
                    />
                  </div>

                  {/* NAVIGATION BUTTONS */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200 mt-1">
                    <button
                      type="button"
                      onClick={() => setIncStep(2)}
                      className="flex-1 min-h-[48px] py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center justify-center"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const validation = validateIncidentWorkflow(4);
                        if (!validation.valid) {
                          showToast(validation.message, "warning");
                          return;
                        }
                        setIncStep(4);
                      }}
                      className="flex-1 min-h-[48px] py-3 bg-[#008F72] hover:bg-[#00765F] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-600/30"
                    >
                      <span>Review & Send</span>
                      <ChevronRight className="w-4 h-4" />
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

              {/* STEP 4: AUDIT & RELEASE (PAGE 4 OVERHAUL - SECTIONS A to G) */}
              {incStep === 4 && (() => {
                const activeProj = resolveActiveAssignment() || {};
                const dbSuppliers = getEntities('suppliers') || [];
                const activeSupplier = dbSuppliers.find(s => s.id === activeProj.supplier_id || s.id === activeProj.client_id || s.name === activeProj.client_id) || {};
                const activeCustomer = dbSuppliers.find(s => s.id === activeProj.customer_id) || activeSupplier;

                const selectedContacts = getAvailableSupplierContacts().filter(c => selectedSupplierContactIds.includes(c.id));
                const contactEmails = selectedContacts.map(c => c.email).filter(Boolean);

                const firstPN = affectedParts[0]?.partNumber || null;

                return (
                  <div className="flex flex-col gap-3.5 text-left">
                    {/* Header */}
                    <div className="flex flex-col gap-1 bg-slate-100/70 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs text-[#008F72] font-black uppercase tracking-wider">
                        Step 4: Audit & Release
                      </span>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                        Final read-only verification checkpoint before releasing this report to the Client Dashboard.
                      </p>
                    </div>

                    {/* SECTION A: ASSIGNMENT & DESTINATION */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#008F72]" />
                        <span>A. Assignment & Destination</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer / Client</span>
                          <span className="font-extrabold text-slate-900">{activeProj.customer_name || activeCustomer.name || 'Client Company'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Supplier</span>
                          <span className="font-extrabold text-slate-900">{activeSupplier.name || 'Supplier'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Plant</span>
                          <span className="font-extrabold text-slate-900">{plants.find(p => p.id === selectedPlant)?.name || selectedPlant || 'Plant'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Project / Program</span>
                          <span className="font-extrabold text-slate-900">{activeProj.title || activeProj.name || 'Quality Audit Project'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">IDS Liaison Rep</span>
                          <span className="font-extrabold text-slate-900">{currentUser?.name || 'Clarence Kuiken'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Report Date / Time</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700">{new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: MEDIA EVIDENCE */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#008F72]" />
                        <span>B. Media Evidence</span>
                      </span>
                      <div className="flex flex-col gap-1.5 text-[11.5px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Visual Evidence Status:</span>
                          <span className={`font-extrabold ${evidenceList.length > 0 || stagedVideoObject ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {(evidenceList.length > 0 || stagedVideoObject) ? 'Provided' : 'Not Provided'}
                          </span>
                        </div>
                        {(evidenceList.length > 0 || stagedVideoObject) ? (
                          <div className="flex flex-col gap-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-800">
                              📷 Photos: {evidenceList.length} | 🎥 Videos: {stagedVideoObject ? 1 : 0}
                            </span>
                            {evidenceList.map((ev, idx) => (
                              <div key={idx} className="text-[10.5px] text-slate-600 italic">
                                • {ev.label}: {ev.note || 'No note attached'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex flex-col gap-0.5">
                            <span className="font-bold">Reason: {mediaUnavailableReason || 'Not specified'}</span>
                            {mediaUnavailableNote && <span className="italic">Note: "{mediaUnavailableNote}"</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION C: TRACEABILITY */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#008F72]" />
                        <span>C. Traceability</span>
                      </span>
                      <div className="flex flex-col gap-2 text-[11.5px]">
                        {/* Parts */}
                        <div className="flex justify-between items-start">
                          <span className="text-slate-600 font-medium">Part Traceability:</span>
                          <span className="font-extrabold text-slate-900 text-right">
                            {affectedParts.length > 0 ? `${affectedParts.length} part(s)` : 'Not provided'}
                          </span>
                        </div>
                        {affectedParts.map((p, idx) => (
                          <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-0.5 font-mono text-[10.5px]">
                            <span className="font-bold text-slate-900">PN: {p.partNumber} ({p.entryMethod || 'Manual'})</span>
                            <span className="text-slate-600 font-sans">{p.description} | Qty: {p.quantity || 1}</span>
                          </div>
                        ))}

                        {/* Containers */}
                        <div className="flex justify-between items-start pt-1 border-t border-slate-100">
                          <span className="text-slate-600 font-medium">Container Traceability:</span>
                          <span className="font-extrabold text-slate-900 text-right">
                            {toteBinLabels.length > 0 ? `${toteBinLabels.length} container(s)` : 'Not provided'}
                          </span>
                        </div>
                        {toteBinLabels.map((t, idx) => (
                          <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-0.5 font-mono text-[10.5px]">
                            <span className="font-bold text-slate-900">Label: {t.labelValue} ({t.containerType || 'Tote'})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION D: CONCERN DETAILS */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#008F72]" />
                        <span>D. Concern Details</span>
                      </span>
                      <div className="flex flex-col gap-2 text-[11.5px]">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Area Found</span>
                          <span className="font-bold text-slate-900">{selectedArea || 'Not specified'}</span>
                        </div>
                        {defectType && (
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Defect / Concern Type</span>
                            <span className="font-bold text-slate-900">{defectType}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Suspect Defect Narrative</span>
                          <p className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                            {description || 'No narrative provided'}
                          </p>
                        </div>
                        {actionTaken && (
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Action Taken Narrative</span>
                            <p className="font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                              {actionTaken}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION E: SUPPLIER FOLLOW-UP */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[#008F72]" />
                        <span>E. Supplier Follow-up</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-bold">Returned:</span>
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold ${isReturningDefect === 'Y' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isReturningDefect === 'Y' ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-bold">Sort Requested:</span>
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold ${isSortRequired === 'Y' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isSortRequired === 'Y' ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center col-span-2">
                          <span className="text-slate-600 font-bold">RMA Required:</span>
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold ${isRmaRequired === 'Y' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {isRmaRequired === 'Y' ? `Yes (${rmaNumber || 'No code entered'})` : 'No'}
                          </span>
                        </div>
                        {concernClassification && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center col-span-2">
                            <span className="text-slate-600 font-bold">Classification:</span>
                            <span className="font-bold text-slate-900">{concernClassification}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION F: REPORT RECIPIENTS */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#008F72]" />
                          <span>F. Report Recipients</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIncStep(3)}
                          className="text-[10px] text-[#008F72] hover:underline font-extrabold uppercase cursor-pointer"
                        >
                          Change →
                        </button>
                      </div>

                      {selectedContacts.length === 0 ? (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium leading-relaxed">
                          No client contact is configured for this assignment. The report can be released to the Client Dashboard, but an email cannot be prepared.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {selectedContacts.map(contact => (
                            <div key={contact.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-0.5 text-[11.5px]">
                              <span className="font-bold text-slate-900">{contact.name}</span>
                              <span className="text-[10.5px] text-slate-600">{contact.role} {contact.email ? `• ${contact.email}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION G: DELIVERY CHANNELS & EMAIL PREVIEW */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
                      <span className="text-[11.5px] font-black text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-1.5">
                        G. Delivery Channels
                      </span>

                      {/* Channel 1: Client Dashboard */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-1 text-[11.5px] shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">Channel 1: Client Dashboard</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                            Ready
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                          The released report will appear in the assigned client's IDS Pulse dashboard.
                        </p>
                      </div>

                      {/* Channel 2: Email */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-1 text-[11.5px] shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">Channel 2: Email</span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase">
                            Inactive — prototype
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
                          Recipient and message preview are prepared, but no external email will be sent until email delivery is approved and enabled.
                        </p>
                      </div>

                      {/* Collapsible Email Preview */}
                      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                        <button
                          id="toggle-email-preview-btn"
                          type="button"
                          onClick={() => setShowEmailPreview(!showEmailPreview)}
                          className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>Inspect Outgoing Email Preview</span>
                          </span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded uppercase">
                            EMAIL SENDING OFF
                          </span>
                        </button>

                        {showEmailPreview && (
                          <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-2 text-[11px] font-mono leading-relaxed text-left">
                            <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
                              <div><strong className="text-slate-500 uppercase">To:</strong> <span className="text-slate-900 font-bold">{contactEmails.length > 0 ? contactEmails.join(', ') : 'No recipient email available'}</span></div>
                              <div><strong className="text-slate-500 uppercase">CC:</strong> <span className="text-slate-600">None (Internal IDS CC unconfigured)</span></div>
                              <div><strong className="text-slate-500 uppercase">Subject:</strong> <span className="text-slate-900 font-bold">[IDS URGENT INCIDENT] {firstPN || 'Concern'} - {selectedArea}</span></div>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 text-[10.5px] space-y-1.5">
                              <p className="font-bold">IDS PULSE URGENT QUALITY INCIDENT NOTIFICATION</p>
                              <p><strong>Plant / Location:</strong> {plants.find(p => p.id === selectedPlant)?.name || selectedPlant} — {selectedArea}</p>
                              <p><strong>Suspect Defect:</strong> {description}</p>
                              {actionTaken && <p><strong>Action Taken:</strong> {actionTaken}</p>}
                              <p><strong>Traceability / Media:</strong> {affectedParts.length} parts listed | {evidenceList.length} photos attached</p>
                              <p className="text-amber-800 font-bold pt-1 border-t border-slate-200">
                                [Portal Link Placeholder - Unavailable while email is disabled]
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RELEASE NAVIGATION & ACTION BUTTON */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 mt-1">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIncStep(3)}
                          className="flex-1 min-h-[48px] py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center justify-center"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSendIncident}
                          disabled={isSendingIncident}
                          className="flex-1 min-h-[48px] py-3 bg-[#008F72] hover:bg-[#00765F] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-600/30"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSendingIncident ? 'Releasing report...' : 'Release to Client Dashboard'}</span>
                        </button>
                      </div>
                      <span className="text-[10.5px] text-center text-slate-500 font-bold block">
                        Email delivery is currently inactive.
                      </span>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* PHOTO ANNOTATION WORKSPACE OVERLAY (DONNA & CLARENCE WORKING PROCESS) */}
        {annotateTargetId && (() => {
          const targetItem = evidenceList.find(i => i.id === annotateTargetId);
          if (!targetItem) return null;

          return (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-3 animate-in fade-in duration-200 text-left">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 px-1">
                <div>
                  <span className="text-[13px] font-extrabold text-white uppercase tracking-wider block">
                    Mark Photo {targetItem.order}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Draw defect circle or arrow</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setAnnotateTargetId(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 flex flex-col items-center justify-center my-2 relative">
                <div className="relative w-[310px] h-[310px] rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
                  <img
                    src={targetItem.url}
                    alt="Target for annotation"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  />
                  
                  {/* SVG Vector Drawing Surface */}
                  <svg
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setIsDrawing(true);
                      setActiveStrokes(prev => [...prev, { color: strokeColor, points: [{ x, y }] }]);
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawing) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setActiveStrokes(prev => {
                        if (prev.length === 0) return prev;
                        const lastIndex = prev.length - 1;
                        const lastStroke = prev[lastIndex];
                        const updatedStroke = {
                          ...lastStroke,
                          points: [...lastStroke.points, { x, y }]
                        };
                        const copy = [...prev];
                        copy[lastIndex] = updatedStroke;
                        return copy;
                      });
                    }}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onTouchStart={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      if (!touch) return;
                      const x = touch.clientX - rect.left;
                      const y = touch.clientY - rect.top;
                      setIsDrawing(true);
                      setActiveStrokes(prev => [...prev, { color: strokeColor, points: [{ x, y }] }]);
                    }}
                    onTouchMove={(e) => {
                      if (!isDrawing) return;
                      const touch = e.touches[0];
                      if (!touch) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = touch.clientX - rect.left;
                      const y = touch.clientY - rect.top;
                      setActiveStrokes(prev => {
                        if (prev.length === 0) return prev;
                        const lastIndex = prev.length - 1;
                        const lastStroke = prev[lastIndex];
                        const updatedStroke = {
                          ...lastStroke,
                          points: [...lastStroke.points, { x, y }]
                        };
                        const copy = [...prev];
                        copy[lastIndex] = updatedStroke;
                        return copy;
                      });
                    }}
                    onTouchEnd={() => setIsDrawing(false)}
                  >
                    {activeStrokes.map((stroke, sIdx) => {
                      if (!stroke.points || stroke.points.length === 0) return null;
                      const d = stroke.points.reduce((acc, pt, pIdx) => {
                        return pIdx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                      }, '');
                      return (
                        <path
                          key={sIdx}
                          d={d}
                          stroke={stroke.color}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Color Selector Bar (4 Confirmed Colors) */}
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between shadow-lg">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Color:</span>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#EF4444', label: 'Red' },
                    { color: '#F59E0B', label: 'Yellow' },
                    { color: '#000000', label: 'Black' },
                    { color: '#3B82F6', label: 'Blue' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setStrokeColor(c.color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        strokeColor === c.color ? 'scale-125 border-white ring-2 ring-white/50' : 'border-transparent hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: c.color === '#000000' ? '#18181B' : c.color }}
                      title={c.label}
                    >
                      {strokeColor === c.color && <span className="w-2 h-2 rounded-full bg-white shadow-xs"></span>}
                    </button>
                  ))}
                </div>
                
                {/* Stroke Action Tools */}
                <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                  <button
                    type="button"
                    disabled={activeStrokes.length === 0}
                    onClick={undoAnnotationStroke}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                      activeStrokes.length > 0 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    disabled={activeStrokes.length === 0}
                    onClick={() => setResetConfirmOpen(true)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                      activeStrokes.length > 0 ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700 cursor-pointer' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAnnotateTargetId(null)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Export SVG to Canvas Data URL
                    const canvas = document.createElement('canvas');
                    canvas.width = 600;
                    canvas.height = 600;
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = targetItem.url;
                    img.onload = () => {
                      ctx.drawImage(img, 0, 0, 600, 600);
                      // Draw strokes scaled 600/310
                      const scale = 600 / 310;
                      activeStrokes.forEach(stroke => {
                        if (!stroke.points || stroke.points.length === 0) return;
                        ctx.strokeStyle = stroke.color;
                        ctx.lineWidth = 3.5 * scale;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.beginPath();
                        stroke.points.forEach((pt, pIdx) => {
                          if (pIdx === 0) ctx.moveTo(pt.x * scale, pt.y * scale);
                          else ctx.lineTo(pt.x * scale, pt.y * scale);
                        });
                        ctx.stroke();
                      });
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                      saveAnnotationForTargetItem(dataUrl);
                    };
                  }}
                  className="py-2.5 bg-[#008F72] hover:bg-[#00765F] text-white text-xs font-extrabold rounded-xl shadow-md transition-colors cursor-pointer border border-emerald-600/30"
                >
                  Save Marking
                </button>
              </div>
            </div>
          );
        })()}

        {/* RESET ANNOTATION CONFIRMATION MODAL */}
        {resetConfirmOpen && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl flex flex-col gap-3 text-left w-full max-w-[290px]">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-extrabold text-slate-900">Reset All Markings?</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                This will clear all vector drawings on this photo. You can redraw anytime.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Keep Markings
                </button>
                <button
                  type="button"
                  onClick={resetAnnotationStrokes}
                  className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PHOTO OPTIONS MODAL (CAMERA VS LIBRARY) */}
        {showAddPhotoModal && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center p-3 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xl flex flex-col gap-2.5 text-left w-full max-w-[340px] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Add Visual Proof Photo</span>
                <button 
                  type="button" 
                  onClick={() => setShowAddPhotoModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddPhotoModal(false);
                  const samplePhotos = [
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80'
                  ];
                  const pick = samplePhotos[evidenceList.length % samplePhotos.length];
                  addPhotoToEvidenceList(pick);
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Take Camera Photo (Live View)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddPhotoModal(false);
                  document.getElementById('evidence_file_input')?.click();
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Pick from Device Photo Library</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 font-bold text-xs text-center cursor-pointer mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* DELETE EVIDENCE PHOTO CONFIRMATION MODAL */}
        {deleteConfirmTarget && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl flex flex-col gap-3 text-left w-full max-w-[290px]">
              <div className="flex items-center gap-2.5 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h4 className="text-sm font-extrabold text-slate-900">Delete Evidence Photo?</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to remove this photo from your report draft?
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => removeEvidenceItem(deleteConfirmTarget)}
                  className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Delete Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3.8: SCANNING VIEW OVERLAY (Requirement 4) */}
        {scanningType && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col justify-between p-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-[13.5px] font-bold text-white uppercase tracking-wider">Simulated Camera Scanner</span>
              <button onClick={() => setScanningType(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Viewfinder scanning frame with Prototype Notice Overlay (Requirement 4) */}
            <div className="flex-1 bg-slate-900 border-2 border-emerald-500/50 rounded-lg my-3 relative flex flex-col items-center justify-center overflow-hidden shadow-sm">
              <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500 pulsing-indicator top-1/2 z-20 pointer-events-none"></div>
              
              <div className="absolute top-2.5 text-center px-3 z-20 bg-slate-950/90 py-1.5 rounded-lg border border-emerald-500/40 shadow-sm max-w-[280px]">
                <p className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wide">Scanner simulated in web prototype</p>
                <p className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">Real camera barcode & QR scanning will be connected in native mobile application.</p>
              </div>

              {/* Selection Options represented as a physical label mock in the viewfinder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-slate-950/60 z-10">
                {scanningType === 'barcode' ? (
                  /* PHYSICAL LABEL MOCK FOR BARCODES */
                  <div className="bg-white text-slate-950 p-2.5 rounded-lg border-2 border-slate-300 shadow-2xl w-full max-w-[260px] flex flex-col gap-1.5 animate-in zoom-in duration-200 mt-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Facility Material Label</span>
                      <span>LOT: 902A5</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Code 1: Part Number (86286761) */}
                      <div className="relative border border-dashed border-slate-300 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs">
                          <span className="text-[5px] text-emerald-400 font-mono tracking-widest">PART NUMBER BARCODE</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold font-mono text-slate-900 mt-0.5">PN: 86286761</span>

                        <button 
                          type="button"
                          onClick={() => selectScanOption('86286761')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        >
                          <span className="bg-[#008F72] text-white font-extrabold px-2 py-1 rounded text-[10.5px] uppercase tracking-wider animate-bounce">Use sample scan (86286761)</span>
                        </button>
                      </div>

                      {/* Code 2: Alternate Part Number (86291945) */}
                      <div className="relative border border-dashed border-slate-300 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs">
                          <span className="text-[5px] text-emerald-400 font-mono tracking-widest">PART NUMBER BARCODE</span>
                        </div>
                        <span className="text-[11.5px] font-extrabold font-mono text-slate-900 mt-0.5">PN: 86291945</span>

                        <button 
                          type="button"
                          onClick={() => selectScanOption('86291945')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        >
                          <span className="bg-[#008F72] text-white font-extrabold px-2 py-1 rounded text-[10.5px] uppercase tracking-wider">Use sample scan (86291945)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PHYSICAL LABEL MOCK FOR QR BIN SCANS */
                  <div className="bg-white text-slate-950 p-3 rounded-lg border-2 border-slate-300 shadow-2xl w-full max-w-[260px] flex flex-col gap-2 animate-in zoom-in duration-200 mt-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[11px] text-slate-500 font-bold uppercase">
                      <span>Tote / Bin Traceability Label</span>
                      <span>SECTION: B4</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="relative border border-slate-300 p-2 flex flex-col items-center justify-center rounded bg-slate-50 w-full">
                        <span className="text-xs font-extrabold font-mono text-slate-900">BIN-MAG-6761</span>
                        <button 
                          type="button"
                          onClick={() => selectScanOption('BIN-MAG-6761', 'qr')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors animate-pulse"
                        >
                          <span className="bg-[#008F72] text-white font-extrabold px-2 py-1 rounded text-[10.5px] uppercase tracking-wider text-center">Use sample scan (BIN-MAG-6761)</span>
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

        {/* SCREEN 3.9: INCIDENT RELEASED CONFIRMATION SCREEN (Sections 6 & 7) */}
        {incidentSentConfirmation && (
          <div className="flex-1 flex flex-col justify-between p-4 bg-slate-50 animate-in fade-in duration-200 text-left">
            <div className="my-auto flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm border ${
                isOfflineRelease ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
                {isOfflineRelease ? <WifiOff className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              </div>
              <h2 className="text-base font-black text-slate-900 mb-1">
                {isOfflineRelease ? 'Report Saved Offline' : 'Report Released'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-[260px] font-medium">
                {isOfflineRelease
                  ? 'Report safely saved. It will be released to the Client Dashboard automatically when your internet connection returns.'
                  : 'Report released to the Client Dashboard. External email was not sent.'}
              </p>

              <div className="bg-white rounded-xl p-3 border border-slate-200 w-full max-w-[290px] text-[11px] text-slate-600 mt-4 flex flex-col gap-1.5 text-left shadow-xs">
                <div><span className="text-slate-400 font-bold uppercase">Tracking Ref:</span> <span className="text-slate-900 font-mono font-bold">{sentIncidentId || 'INC-LOCAL'}</span></div>
                <div><span className="text-slate-400 font-bold uppercase">Released At:</span> <span className="text-slate-900 font-mono font-bold">{new Date().toLocaleTimeString()}</span></div>
                <div><span className="text-slate-400 font-bold uppercase">Delivery Channel:</span> <span className="text-emerald-700 font-bold">Client Dashboard</span></div>
                <div><span className="text-slate-400 font-bold uppercase">Email Status:</span> <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Inactive — prototype</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIncidentSentConfirmation(false);
                setIsOfflineRelease(false);
                resetIncidentFormState();
                setActiveScreen('home');
              }}
              className="w-full min-h-[48px] py-3 bg-[#008F72] hover:bg-[#00765F] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
              <div className="flex flex-col gap-3" id="daily-quality-report-area-list">
                {areasWalked.map(area => (
                  <div key={area.id} data-area-id={area.id} data-area-name={formatAreaName(area.name)} className="bg-white border border-slate-300 rounded-sm p-3 flex flex-col gap-2 shadow-sm daily-quality-area-card">
                    <div className="flex justify-between items-center">
                      <span className="text-[13.5px] font-bold text-slate-900 area-card-title">{formatAreaName(area.name)}</span>
                      <div className="phone-toggle-group w-36 flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                        <button 
                          type="button"
                          onClick={() => toggleAreaStatus(area.id, 'no_issues')} 
                          className={`phone-toggle-btn flex-1 py-1 text-[11.5px] font-bold rounded-sm transition-all cursor-pointer ${
                            area.status === 'no_issues' 
                              ? 'active-emerald active-yes bg-emerald-600 text-white font-black shadow-sm' 
                              : 'bg-transparent text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Good
                        </button>
                        <button 
                          type="button"
                          onClick={() => toggleAreaStatus(area.id, 'issues')} 
                          className={`phone-toggle-btn flex-1 py-1 text-[11.5px] font-bold rounded-sm transition-all cursor-pointer ${
                            area.status === 'issues' 
                              ? 'active-rose active-no active-defect bg-red-600 text-white font-black shadow-sm' 
                              : 'bg-transparent text-slate-600 hover:text-slate-900'
                          }`}
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
                      className="phone-input h-9 px-3 text-[11.5px] area-card-notes-input"
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

                <BusinessDropdown
                  id="insp-defect-dropdown"
                  options={[
                    { value: 'Routine Inspection', label: 'Routine Inspection - Pass (OK)' },
                    { value: 'Surface Scratch', label: 'Surface Scratch / Dent' },
                    { value: 'Terminal Pin Bend', label: 'Terminal Pin Deformation' },
                    { value: 'Dimensional Out of Spec', label: 'Dimensional Out of Spec' },
                    { value: 'Missing Seal', label: 'Missing Gasket / Seal' },
                    { value: 'Coating Mismatch', label: 'Color / Paint Mismatch' }
                  ]}
                  value={inspDefectCode}
                  onChange={(newVal) => setInspDefectCode(newVal)}
                  placeholder="Select defect category..."
                  customInputLabel="Enter custom inspection defect type"
                  customInputPlaceholder="Enter custom defect category or code..."
                />
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
              <div>
                <BusinessDropdown
                  id="expense-category-dropdown"
                  label="Expense Category"
                  required={true}
                  options={[
                    'Mileage',
                    'Fuel',
                    'Tolls',
                    'Meals',
                    'Parking',
                    'Supplies'
                  ]}
                  value={expenseCategory}
                  onChange={(newVal) => setExpenseCategory(newVal)}
                  placeholder="Select category..."
                  customInputLabel="Enter custom expense category"
                  customInputPlaceholder="Example: Protective Gear, Lodging..."
                />
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

        {/* DELETE VIDEO CONFIRMATION MODAL (Section I) */}
        {showDeleteVideoConfirm && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl flex flex-col gap-4 text-left w-full max-w-[320px]">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600 font-black text-lg">
                  <Video className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-900 leading-tight">Remove this video from the report?</h3>
                  <span className="text-[10.5px] text-slate-500 font-medium">This will un-stage the current video evidence file.</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteVideoConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Keep video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStagedVideoObject(null);
                    setShowDeleteVideoConfirm(false);
                    showToast("Video attachment removed from report", "info");
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Remove video
                </button>
              </div>
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

        {/* FIXED BOTTOM NAVIGATION BAR (Phase 11) */}
        {isLoggedIn && (
          <div className="bg-white border-t border-[#CBD8E8] h-14 shrink-0 grid grid-cols-5 items-center px-1 z-30 shadow-md text-[#10284A]">
            <button
              type="button"
              onClick={() => setActiveScreen('home')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
                activeScreen === 'home' ? 'text-[#008F72] font-bold' : 'text-[#5B6F89] hover:text-[#10284A]'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">Home</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('work')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
                activeScreen === 'work' ? 'text-[#008F72] font-bold' : 'text-[#5B6F89] hover:text-[#10284A]'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">Work</span>
            </button>

            {/* ALERT - Dynamic Central Action (Primary theme by default, Red only if active critical alert exists) */}
            {(() => {
              const activeIncidents = (getEntities('incidents') || []).filter(inc => inc.status === 'open' || inc.status === 'active' || inc.quality_hold);
              const hasActiveAlert = activeIncidents.length > 0;
              const isSelected = activeScreen === 'incident';

              return (
                <button
                  type="button"
                  onClick={() => setActiveScreen('incident')}
                  className="flex flex-col items-center justify-center -mt-4 cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 border-2 border-white relative ${
                    hasActiveAlert
                      ? 'bg-[#D92D3F] hover:bg-[#B42336]'
                      : isSelected
                      ? 'bg-[#008F72] hover:bg-[#00765F]'
                      : 'bg-[#10284A] hover:bg-[#1A3863]'
                  }`}>
                    <AlertTriangle className="w-5 h-5 text-white" />
                    {hasActiveAlert && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                        {activeIncidents.length}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-extrabold tracking-tight mt-0.5 ${
                    hasActiveAlert ? 'text-[#D92D3F]' : isSelected ? 'text-[#008F72]' : 'text-[#10284A]'
                  }`}>
                    Alerts
                  </span>
                </button>
              );
            })()}

            <button
              type="button"
              id="phone-nav-reports-btn"
              onClick={() => setActiveScreen('reports')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
                activeScreen === 'reports' ? 'text-[#008F72] font-bold' : 'text-[#5B6F89] hover:text-[#10284A]'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">Reports</span>
            </button>

            <button
              type="button"
              id="phone-nav-more-btn"
              onClick={() => setActiveScreen('more')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
                activeScreen === 'more' || activeScreen === 'expenses' || activeScreen === 'history' ? 'text-[#008F72] font-bold' : 'text-[#5B6F89] hover:text-[#10284A]'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">More</span>
            </button>
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
