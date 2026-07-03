import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Wifi, WifiOff, MapPin, Clock, 
  User, Lock, LogOut, CheckCircle, AlertTriangle, Play, Square, X, Calendar,
  Camera, Scan, Plus, ChevronRight, Mail, Send, RotateCcw, Volume2, Video, ArrowLeft, Trash2,
  Receipt, DollarSign
} from 'lucide-react';
import { getEntities, addIncident, addEmailLog, addReworkLog, saveEntity, addExpenseEntry } from './SharedDatabase';

export default function PhoneSimulator({ isOffline, setIsOffline, dbUpdateTrigger }) {
  // Authentication & Shift States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('clarence.k@integritydriven.com');
  const [password, setPassword] = useState('password123');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Shift Control
  const [shiftActive, setShiftActive] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('gm_oshawa');
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftStartRawTime, setShiftStartRawTime] = useState(null);
  const [plants, setPlants] = useState([]);
  
  // Modals & Prompts
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [modalEndTime, setModalEndTime] = useState('');
  const [modalElapsedTime, setModalElapsedTime] = useState('');

  // Active screen inside the phone: 'login' | 'home' | 'incident' | 'rework' | 'summary' | 'history'
  const [activeScreen, setActiveScreen] = useState('login');

  // INCIDENT REPORT STATE
  const [incStep, setIncStep] = useState(1); // steps: 1: Capture, 2: Scan, 3: Describe, 4: Send, 3.5: AI Duplicate Check
  const [defectLocationX, setDefectLocationX] = useState(null);
  const [defectLocationY, setDefectLocationY] = useState(null);
  const [partViewTemplate, setPartViewTemplate] = useState('86286761');
  const [handoverAlert, setHandoverAlert] = useState(null);
  const [duplicateIncident, setDuplicateIncident] = useState(null);

  const [capturedPhotos, setCapturedPhotos] = useState({
    wide: null,
    medium: null,
    closeup: null
  });
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [annotatedPhotos, setAnnotatedPhotos] = useState({ wide: null, medium: null, closeup: null });
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
  
  // Audio & Video mock states
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  // Email Preview toggle
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isSendingIncident, setIsSendingIncident] = useState(false);
  const [incidentSentConfirmation, setIncidentSentConfirmation] = useState(false);
  const [sentIncidentId, setSentIncidentId] = useState(null);

  // REWORK LOG STATE
  const [reworkPN, setReworkPN] = useState('86286761');
  const [reworkQty, setReworkQty] = useState(10);
  const [reworkHours, setReworkHours] = useState(1.5);
  const [reworkNotes, setReworkNotes] = useState('Reworked loose tail light bulbs.');
  
  // EXPENSE STATE
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Fuel');
  const [expenseReceiptPhoto, setExpenseReceiptPhoto] = useState(null);
  const [expenseNotes, setExpenseNotes] = useState('');
  
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
  const [isDrawing, setIsDrawing] = useState(false);

  // Load plants and initial settings
  useEffect(() => {
    const allPlants = getEntities('plants');
    setPlants(allPlants);
    
    const savedUser = localStorage.getItem('ids_pulse_saved_user');
    if (savedUser) {
      const dbUsers = getEntities('users');
      const found = dbUsers.find(u => u.id === savedUser);
      if (found) {
        setCurrentUser(found);
        setEmail(found.email);
      }
    }

    const allTasks = getEntities('dailyTasks') || [];
    const repTasks = allTasks.filter(t => t.rep_id === '1' && t.date === '2026-06-01');
    setDailyTasks(repTasks);
  }, [dbUpdateTrigger]);

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
    const activeShiftRepId = localStorage.getItem('ids_pulse_active_shift_rep_id');
    
    if (activeShiftRepId && activeShiftRepId !== foundUser.id) {
      const dbReports = getEntities('shiftReports');
      const prevDraftReport = dbReports.find(r => r.rep_id === activeShiftRepId && r.status === 'Draft');
      if (prevDraftReport) {
        prevDraftReport.status = 'Locked';
        prevDraftReport.locked_at = new Date().toISOString();
        prevDraftReport.locked_by = foundUser.name;
        saveEntity('shiftReports', prevDraftReport);
      }
      
      const dbUsers = getEntities('users');
      const prevRep = dbUsers.find(u => u.id === activeShiftRepId);
      const prevRepName = prevRep ? prevRep.name : 'Clarence Kuiken';
      
      setHandoverAlert({
        show: true,
        prevRepName: prevRepName,
        newRepName: foundUser.name
      });
      
      localStorage.removeItem('ids_pulse_active_shift_rep_id');
      localStorage.removeItem('ids_pulse_active_shift_plant_id');
      localStorage.removeItem('ids_pulse_active_shift_start_time');
      setShiftActive(false);
      setShiftStartTime(null);
      setShiftStartRawTime(null);
    } else {
      const todayDate = new Date().toISOString().substring(0, 10);
      const dbReports = getEntities('shiftReports');
      const userDraft = dbReports.find(r => r.rep_id === foundUser.id && r.status === 'Draft');
      if (userDraft) {
        setShiftActive(true);
        setShiftStartTime(new Date(userDraft.created_at || userDraft.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setShiftStartRawTime(new Date(userDraft.created_at || userDraft.sent_at));
        setSelectedPlant(userDraft.plant_id);
        setAreasWalked(userDraft.areas_walked);
        setBonusTasks(userDraft.bonus_tasks);
      }
    }
    
    setCurrentUser(foundUser);
    setIsLoggedIn(true);
    setActiveScreen('home');
    if (rememberDevice) {
      localStorage.setItem('ids_pulse_saved_user', foundUser.id);
    } else {
      localStorage.removeItem('ids_pulse_saved_user');
    }
    window.dispatchEvent(new Event('ids_pulse_db_update'));
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    const dbUsers = getEntities('users');
    const found = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (found) {
      performAuthLogin(found);
    } else {
      alert('Invalid credentials. For testing, use the preset email or click "Quick Demo Login".');
    }
  };

  const handleQuickLogin = () => {
    const dbUsers = getEntities('users');
    const clarence = dbUsers.find(u => u.name.includes('Clarence')) || dbUsers[0];
    if (clarence) {
      setEmail(clarence.email);
      performAuthLogin(clarence);
    }
  };

  const handleQuickLoginAs = (role) => {
    const dbUsers = getEntities('users');
    const user = dbUsers.find(u => {
      if (role === 'Clarence') return u.name.includes('Clarence');
      if (role === 'Donna') return u.name.includes('Donna');
      if (role === 'Hugo') return u.name.includes('Hugo');
      if (role === 'Nabil') return u.name.includes('Nabil');
      if (role === 'Rogelio') return u.name.includes('Rogelio');
      return false;
    });
    if (user) {
      setEmail(user.email);
      performAuthLogin(user);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShiftActive(false);
    setActiveScreen('login');
    localStorage.removeItem('ids_pulse_saved_user');
  };

  const handleStartShift = () => {
    setShiftActive(true);
    const now = new Date();
    setShiftStartRawTime(now);
    setShiftStartTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    
    localStorage.setItem('ids_pulse_active_shift_rep_id', currentUser.id);
    localStorage.setItem('ids_pulse_active_shift_plant_id', selectedPlant);
    localStorage.setItem('ids_pulse_active_shift_start_time', now.toISOString());
    
    const initialAreas = [
      { id: 'wa_1', name: 'Online assembly', status: 'pending', contact: 'T/L and installers', notes: '' },
      { id: 'wa_2', name: 'Sequence area', status: 'pending', contact: 'Martin', notes: '' },
      { id: 'wa_3', name: 'Heavy rework', status: 'pending', contact: 'Martin', notes: '' },
      { id: 'wa_4', name: 'Review Scrap Table', status: 'pending', contact: 'Martin', notes: '' }
    ];
    const initialBonus = [
      { id: 'bt_1', task: 'Matt\'s bin check audit on PN 86291945', status: 'pending', notes: '' }
    ];

    setAreasWalked(initialAreas);
    setBonusTasks(initialBonus);

    const todayDate = now.toISOString().substring(0, 10);
    const dbReports = getEntities('shiftReports');
    const existingDraft = dbReports.find(r => r.rep_id === currentUser.id && r.status === 'Draft');
    
    if (!existingDraft) {
      const draftReport = {
        id: `sr_draft_${Date.now()}`,
        rep_id: currentUser.id,
        plant_id: selectedPlant,
        date: todayDate,
        areas_walked: initialAreas,
        incidents_count: 0,
        bonus_tasks: initialBonus,
        status: 'Draft',
        created_at: now.toISOString()
      };
      saveEntity('shiftReports', draftReport);
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    }
  };

  const triggerEndShiftFlow = () => {
    const now = new Date();
    const endTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setModalEndTime(endTimeString);

    if (shiftStartRawTime) {
      const diffMs = now - shiftStartRawTime;
      const diffSeconds = Math.floor(diffMs / 1000);
      if (diffSeconds < 60) {
        setModalElapsedTime('9.0 Hours (Simulated Demo)');
      } else {
        const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
        setModalElapsedTime(`${diffHrs} Hours`);
      }
    } else {
      setModalElapsedTime('8.5 Hours');
    }
    
    setShowEndShiftModal(true);
  };

  const confirmEndShift = () => {
    setShowEndShiftModal(false);
    setShiftActive(false);
    setShiftStartTime(null);
    setShiftStartRawTime(null);
    setActiveScreen('summary');
  };

  // MOCK CAMERA CAPTURE
  const captureMockPhoto = (type) => {
    const images = {
      wide: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', // box label container
      medium: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80', // tail light assembly
      closeup: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80' // defect close up
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#EF4444'; // Red arrow annotation
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
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
      setScannedBin(`BIN-MAG-${pn.substring(4)}`);
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
    // Fill photos
    setCapturedPhotos({
      wide: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      medium: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80',
      closeup: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'
    });
    setAnnotatedPhotos({
      wide: null,
      medium: null,
      closeup: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'
    });
    
    // Fill coordinates
    setDefectLocationX(0.29);
    setDefectLocationY(0.49);
    setPartViewTemplate('86286761');

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
    setIsSendingIncident(true);

    // Simulate 3-second rule with loader
    setTimeout(() => {
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

      const newInc = {
        rep_id: currentUser.id,
        plant_id: selectedPlant,
        supplier_id: defaultPartsList[0]?.supplier_id || 'magna',
        part_id: defaultPartsList[0]?.part_number || '86286761', // fallback for single-value legacy references
        area: selectedArea,
        description: description || `Incident in ${selectedArea}`,
        action_taken: actionTaken,
        supplier_contact: supplierContact,
        photos: [
          { id: 'ph_w', url: annotatedPhotos.wide || capturedPhotos.wide, type: 'Wide' },
          { id: 'ph_m', url: annotatedPhotos.medium || capturedPhotos.medium, type: 'Medium' },
          { id: 'ph_c', url: annotatedPhotos.closeup || capturedPhotos.closeup, type: 'Closeup' }
        ],
        concern_classification: concernClassification,
        defect_returned: isReturningDefect,
        sort_required: isSortRequired,
        rma_required: isRmaRequired,
        status: 'Open',
        sent_at: new Date().toISOString(),
        parts_list: defaultPartsList,
        defect_location_x: defectLocationX,
        defect_location_y: defectLocationY,
        part_view: 'top'
      };

      const savedIncident = addIncident(newInc);

      const firstPN = defaultPartsList[0]?.part_number || scannedPN;
      const partSubject = defaultPartsList.length > 1 
        ? `${firstPN} (+${defaultPartsList.length - 1} others)` 
        : firstPN;
      
      const partsHtml = defaultPartsList.map(p => `<li><strong>PN ${p.part_number}</strong>: ${p.description} (Qty: ${p.qty}) [Bin: ${p.bin}]</li>`).join("");

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
    }, 2000);
  };

  const addPartToList = () => {
    if (!scannedPN) return;
    const isDuplicate = scannedPartsList.some(p => p.part_number === scannedPN && p.bin === (scannedBin || 'N/A'));
    if (isDuplicate) {
      alert("This part number and bin location is already added to the list!");
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
    const todayDate = new Date().toISOString().substring(0, 10);
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
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
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
    
    alert(`Observations successfully merged into active Incident ${incident.id}! Affecting PN ${updatedPartsList[0]?.part_number}.`);
    
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
    setHasAudio(false);
    setHasVideo(false);
    setIncidentSentConfirmation(false);
    setSentIncidentId(null);
    setIncStep(1);
    setDefectLocationX(null);
    setDefectLocationY(null);
    setPartViewTemplate('86286761');
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
    const partsList = getEntities('parts');
    const part = partsList.find(p => p.part_number === reworkPN) || { id: 'unknown', part_number: reworkPN, supplier_id: 'magna' };

    addReworkLog({
      rep_id: currentUser.id,
      plant_id: selectedPlant,
      supplier_id: part.supplier_id,
      part_id: part.id,
      qty: reworkQty,
      time_spent_minutes: reworkHours * 60,
      notes: reworkNotes
    });

    alert('Rework logged successfully!');
    setReworkPN('86286761');
    setReworkQty(10);
    setReworkHours(1.5);
    setReworkNotes('Reworked loose tail light bulbs.');
    setActiveScreen('home');
  };

  // CAPTURE MOCK RECEIPT PHOTO
  const captureMockReceipt = () => {
    setExpenseReceiptPhoto('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80');
  };

  // SUBMIT EXPENSE LOG
  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(parseFloat(expenseAmount)) || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    addExpenseEntry({
      rep_id: currentUser ? currentUser.id : '1',
      date: new Date().toISOString().split('T')[0],
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      receipt_photo: expenseReceiptPhoto,
      notes: expenseNotes
    });

    alert('Expense claim submitted successfully!');
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
      const todayDate = new Date().toISOString().substring(0, 10);
      const repIncidentsCount = getEntities('incidents').filter(inc => inc.rep_id === currentUser.id && inc.created_at.startsWith(todayDate)).length;
      
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
      
      // Clean up localStorage active shift indicators
      localStorage.removeItem('ids_pulse_active_shift_rep_id');
      localStorage.removeItem('ids_pulse_active_shift_plant_id');
      localStorage.removeItem('ids_pulse_active_shift_start_time');
      setShiftActive(false);
      setShiftStartTime(null);
      setShiftStartRawTime(null);

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
      alert('Shift Summary Report submitted successfully! Logged in email history.');
      setActiveScreen('home');
    }, 1500);
  };

  return (
    <div className="relative mx-auto w-[380px] h-[780px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-12 ring-slate-900/50 flex flex-col overflow-hidden select-none">
      {/* Speaker and Camera Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
        <div className="w-16 h-1 bg-slate-800 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-3 border border-slate-800"></div>
      </div>

      {/* Screen Top Status Bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[11px] font-semibold text-slate-400 z-40 bg-slate-900/40 backdrop-blur-sm select-none">
        <span>18:19 PM</span>
        <div className="flex items-center gap-1.5">
          {/* Offline Toggle Indicator */}
          <button 
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              isOffline ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
            title="Toggle Network Status"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </>
            )}
          </button>
          <div className="w-5 h-2.5 border border-slate-600 rounded-sm p-0.5 flex items-center">
            <div className="h-full w-4 bg-slate-400 rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* Phone Screen Container */}
      <div className="flex-1 rounded-[36px] overflow-hidden bg-slate-900 flex flex-col relative text-slate-100">
        
        {/* SCREEN 1: LOGIN */}
        {activeScreen === 'login' && (
          <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#1E3A5F]/40 to-slate-950">
            <div className="flex flex-col items-center mt-12">
              <img src="/logo.png" alt="IDS Logo" className="h-14 w-auto object-contain mb-4" />
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">IDS Pulse</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">Quality on the floor.</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 my-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="phone-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="name@integritydriven.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
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

              <button 
                type="submit" 
                className="phone-btn-primary mt-4"
              >
                Sign In
              </button>
            </form>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center">Quick Login Presets</span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button type="button" onClick={() => handleQuickLoginAs('Clarence')} className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-[9px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer">Clarence</button>
                <button type="button" onClick={() => handleQuickLoginAs('Hugo')} className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-[9px] font-bold text-sky-400 hover:text-white transition-all cursor-pointer">Hugo (QRE)</button>
                <button type="button" onClick={() => handleQuickLoginAs('Nabil')} className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-[9px] font-bold text-sky-400 hover:text-white transition-all cursor-pointer">Nabil (QRE)</button>
                <button type="button" onClick={() => handleQuickLoginAs('Rogelio')} className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-[9px] font-bold text-sky-400 hover:text-white transition-all cursor-pointer">Rogelio (QRE)</button>
                <button type="button" onClick={() => handleQuickLoginAs('Donna')} className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-[9px] font-bold text-indigo-400 hover:text-white transition-all cursor-pointer">Donna</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: HOME */}
        {activeScreen === 'home' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col p-4 bg-slate-950 relative overflow-y-auto scrollbar-thin">
            {handoverAlert && handoverAlert.show && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-[#22D3EE]/30 rounded-2xl p-5 flex flex-col gap-3 max-w-[320px] text-center shadow-2xl">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shift Handover Lock</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>{handoverAlert.prevRepName}</strong> had an active shift running.
                  </p>
                  <p className="text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-850 leading-relaxed">
                    The active draft shift summary was automatically <strong>locked</strong>. A new shift session has been initialized for you.
                  </p>
                  <button 
                    type="button"
                    onClick={() => setHandoverAlert(null)}
                    className="phone-btn-primary mt-2 py-2"
                  >
                    Acknowledge & Continue
                  </button>
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="IDS Logo" className="h-7 w-auto object-contain flex-shrink-0" />
                  <div>
                    <h2 className="text-xs font-bold text-white leading-none">IDS Pulse</h2>
                    <span className="text-[9px] text-slate-500 font-medium">Ontario, Canada</span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Plant Location & Shift Actions */}
              <div className="mt-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#1E3A5F] flex items-center justify-center font-bold text-xs text-[#22D3EE] border border-[#0EA5E9]/30">
                      {currentUser.avatar}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white leading-tight">{currentUser.name}</p>
                      <p className="text-[9px] text-[#0EA5E9] font-medium leading-none">Field Specialist</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 font-medium">Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${
                      shiftActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {shiftActive ? 'ON SHIFT' : 'OFF LINE'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Current Plant Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                    <select 
                      value={selectedPlant}
                      onChange={(e) => setSelectedPlant(e.target.value)}
                      disabled={shiftActive}
                      className="phone-select"
                      style={{ paddingLeft: '38px' }}
                    >
                      {plants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-1">
                  {shiftActive ? (
                    <button 
                      onClick={triggerEndShiftFlow}
                      className="phone-btn-primary bg-rose-650 hover:bg-rose-700 active:bg-rose-800 shadow-rose-900/20"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>End Work Shift</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleStartShift}
                      className="phone-btn-primary"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Work Shift</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

             {/* Middle Main Content */}
            <div className="my-auto flex flex-col items-center justify-center text-center py-4 px-2">
              {shiftActive ? (
                <div className="w-full bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3 pulsing-indicator">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">Active: {plants.find(p => p.id === selectedPlant)?.name}</h3>
                  <p className="text-[10px] text-slate-400">Recording reports & timesheet hours.</p>
                  <div className="grid grid-cols-2 gap-3 w-full mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Started At</span>
                      <span className="text-xs font-bold text-slate-300 mt-1">{shiftStartTime}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Incidents Logged</span>
                      <span className="text-xs font-extrabold text-[#22D3EE] mt-1">
                        {getEntities('incidents').filter(inc => inc.created_at.startsWith(new Date().toISOString().substring(0, 10))).length}
                      </span>
                    </div>
                  </div>

                  {/* Synced tasks checklist for easy glove tapping */}
                  <div className="w-full mt-4 flex flex-col text-left">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 border-t border-slate-800/60 pt-3">
                      <CheckCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
                      <span>Today's Assigned Tasks</span>
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {dailyTasks.length > 0 ? (
                        dailyTasks.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => handleToggleTask(t)}
                            className="bg-slate-950/80 border border-slate-850 p-2 rounded-xl flex items-center gap-2.5 cursor-pointer hover:border-slate-800 transition-colors"
                          >
                            <input 
                              type="checkbox" 
                              checked={t.status === 'completed'}
                              onChange={() => {}} // handled by onClick on parent for ease of glove tap
                              className="rounded border-slate-800 text-[#0EA5E9] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer flex-shrink-0"
                            />
                            <span className={`text-[10px] leading-tight select-none ${t.status === 'completed' ? 'line-through text-slate-500 font-medium' : 'text-slate-300 font-bold'}`}>
                              {t.task}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] text-slate-600 italic">No tasks assigned for today.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-[260px]">
                  <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/20 flex items-center justify-center border border-[#1E3A5F]/40 mb-3">
                    <Clock className="w-5 h-5 text-[#64748B]" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-300 mb-1">Shift Inactive</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Select your plant location in the panel above and tap **"Start Work Shift"** to begin reporting defects and logging rework.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Actions Feed</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setActiveScreen('incident');
                    setIncStep(1);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800/60 rounded-xl p-3 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center mb-1.5 border border-red-500/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span className="text-xs font-bold block text-white group-hover:text-[#0EA5E9] transition-colors">New Suspect Material</span>
                  <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">Log suspect materials on floor</span>
                </button>

                <button 
                  disabled={!shiftActive}
                  onClick={() => setActiveScreen('rework')}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800/60 rounded-xl p-3 text-left transition-colors cursor-pointer group disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center mb-1.5 border border-[#0EA5E9]/10">
                    <Clock className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-xs font-bold block text-white group-hover:text-[#0EA5E9] transition-colors">Log Rework</span>
                  <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">Track billable pcs</span>
                </button>

                <button 
                  disabled={!shiftActive}
                  onClick={() => setActiveScreen('expenses')}
                  className="col-span-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800/60 rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer group disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10 shrink-0">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white group-hover:text-emerald-400 transition-colors">Log Expenses & Receipts</span>
                    <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">Track fuel, parking, tolls, or meals</span>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setActiveScreen('summary')}
                className="w-full h-11 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 rounded-xl px-3.5 flex items-center justify-between text-xs font-semibold text-slate-350 hover:text-white cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#22D3EE]" />
                  <span>Shift Logs & Summary</span>
                </div>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">1</span>
              </button>

              <button 
                onClick={() => setActiveScreen('history')}
                className="w-full h-11 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 rounded-xl px-3.5 flex items-center justify-between text-xs font-semibold text-slate-350 hover:text-white cursor-pointer transition-colors mt-2"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Suspect Material Logs</span>
                </div>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {getEntities('incidents')?.filter(inc => inc.rep_id === (currentUser?.id || '1')).length || 0}
                </span>
              </button>
            </div>

            {/* END SHIFT CONFIRMATION MODAL */}
            {showEndShiftModal && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[300px] overflow-hidden shadow-2xl">
                  <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-white">End Shift Confirmation</h3>
                    </div>
                    <button onClick={() => setShowEndShiftModal(false)} className="text-slate-500"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Are you sure you want to end your shift? Please review your shift hours:
                    </p>
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500 uppercase font-bold">Rep:</span><span className="text-slate-300 font-semibold">{currentUser.name}</span></div>
                      <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500 uppercase font-bold">Plant:</span><span className="text-slate-300 font-semibold">{plants.find(p => p.id === selectedPlant)?.name}</span></div>
                      <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500 uppercase font-bold">Start Time:</span><span className="text-slate-300 font-semibold">{shiftStartTime}</span></div>
                      <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500 uppercase font-bold">End Time:</span><span className="text-slate-300 font-semibold">{modalEndTime}</span></div>
                      <div className="border-t border-slate-850 pt-1.5 flex justify-between items-center text-[10px]"><span className="text-[#22D3EE] uppercase font-bold">Elapsed:</span><span className="text-[#22D3EE] font-bold">{modalElapsedTime}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 px-4 py-3 border-t border-slate-850 flex gap-2 justify-end">
                    <button 
                      onClick={() => setShowEndShiftModal(false)} 
                      className="h-9 px-3.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      No, Cancel
                    </button>
                    <button 
                      onClick={confirmEndShift} 
                      className="h-9 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-900/10"
                    >
                      Yes, End Shift
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SCREEN 3: NEW INCIDENT FLOW (STEPWISE SCROLL VIEW) */}
        {activeScreen === 'incident' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-900">
              <button 
                onClick={() => {
                  if (confirm('Discard this draft report?')) {
                    resetIncidentScreen();
                  }
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">New Incident Report</h2>
              <button 
                onClick={autofillClarenceDemo}
                className="text-[9px] bg-[#1E3A5F] text-[#22D3EE] font-bold border border-[#22D3EE]/25 px-2 py-1 rounded"
              >
                Demo Fill
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 border-b border-slate-850 text-center text-[9px] bg-slate-900/50">
              <button onClick={() => setIncStep(1)} className={`py-2 font-bold ${incStep === 1 ? 'text-[#0EA5E9] border-b-2 border-[#0EA5E9] bg-[#0EA5E9]/5' : 'text-slate-500'}`}>1. Capture</button>
              <button onClick={() => setIncStep(2)} className={`py-2 font-bold ${incStep === 2 ? 'text-[#0EA5E9] border-b-2 border-[#0EA5E9] bg-[#0EA5E9]/5' : 'text-slate-500'}`}>2. Scan</button>
              <button onClick={() => setIncStep(3)} className={`py-2 font-bold ${incStep === 3 ? 'text-[#0EA5E9] border-b-2 border-[#0EA5E9] bg-[#0EA5E9]/5' : 'text-slate-500'}`}>3. Describe</button>
              <button onClick={() => setIncStep(4)} className={`py-2 font-bold ${incStep === 4 ? 'text-[#0EA5E9] border-b-2 border-[#0EA5E9] bg-[#0EA5E9]/5' : 'text-slate-500'}`}>4. Send</button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-left">
              
              {/* STEP 1: CAPTURE (PHOTO FIRST, FIELDS SECOND) */}
              {incStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Step 1: Suspect Material Visual Proof</span>
                    <span className="text-[9px] text-slate-500">Min 3 photos recommended</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Photo 1: Wide */}
                    <div 
                      onClick={() => {
                        if (!capturedPhotos.wide) {
                          captureMockPhoto('wide');
                        } else {
                          setDrawingTarget('wide');
                          setShowDrawingCanvas(true);
                        }
                      }}
                      className="aspect-square bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer p-1 relative overflow-hidden group hover:border-[#0EA5E9]"
                    >
                      {annotatedPhotos.wide || capturedPhotos.wide ? (
                        <>
                          <img src={annotatedPhotos.wide || capturedPhotos.wide} className="w-full h-full object-cover" alt="Wide" />
                          {annotatedPhotos.wide ? (
                            <span className="absolute bottom-1 right-1 bg-red-500 text-[8px] text-white px-1 py-0.5 rounded-sm font-bold">Marked</span>
                          ) : (
                            <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] text-emerald-400 px-1 py-0.5 rounded">Wide</span>
                          )}
                          {annotatedPhotos.wide && (
                            <span className="absolute top-1 left-1 bg-slate-950/80 rounded-full p-1"><RotateCcw className="w-2.5 h-2.5 text-slate-300" /></span>
                          )}
                        </>
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate-500 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400">Wide Shot</span>
                          <span className="text-[7px] text-slate-500 mt-0.5">(Box Label)</span>
                        </>
                      )}
                    </div>

                    {/* Photo 2: Medium */}
                    <div 
                      onClick={() => {
                        if (!capturedPhotos.medium) {
                          captureMockPhoto('medium');
                        } else {
                          setDrawingTarget('medium');
                          setShowDrawingCanvas(true);
                        }
                      }}
                      className="aspect-square bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer p-1 relative overflow-hidden group hover:border-[#0EA5E9]"
                    >
                      {annotatedPhotos.medium || capturedPhotos.medium ? (
                        <>
                          <img src={annotatedPhotos.medium || capturedPhotos.medium} className="w-full h-full object-cover" alt="Medium" />
                          {annotatedPhotos.medium ? (
                            <span className="absolute bottom-1 right-1 bg-red-500 text-[8px] text-white px-1 py-0.5 rounded-sm font-bold">Marked</span>
                          ) : (
                            <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] text-emerald-400 px-1 py-0.5 rounded">Med</span>
                          )}
                          {annotatedPhotos.medium && (
                            <span className="absolute top-1 left-1 bg-slate-950/80 rounded-full p-1"><RotateCcw className="w-2.5 h-2.5 text-slate-300" /></span>
                          )}
                        </>
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate-500 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400">Medium</span>
                          <span className="text-[7px] text-slate-500 mt-0.5">(Part View)</span>
                        </>
                      )}
                    </div>

                    {/* Photo 3: Close-up */}
                    <div 
                      onClick={() => {
                        if (!capturedPhotos.closeup) {
                          captureMockPhoto('closeup');
                        } else {
                          setDrawingTarget('closeup');
                          setShowDrawingCanvas(true);
                        }
                      }}
                      className="aspect-square bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer p-1 relative overflow-hidden group hover:border-[#0EA5E9]"
                    >
                      {annotatedPhotos.closeup || capturedPhotos.closeup ? (
                        <>
                          <img src={annotatedPhotos.closeup || capturedPhotos.closeup} className="w-full h-full object-cover" alt="Closeup" />
                          {annotatedPhotos.closeup ? (
                            <span className="absolute bottom-1 right-1 bg-red-500 text-[8px] text-white px-1 py-0.5 rounded-sm font-bold">Marked</span>
                          ) : (
                            <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] text-emerald-400 px-1 py-0.5 rounded">Close-Up</span>
                          )}
                          {annotatedPhotos.closeup && (
                            <span className="absolute top-1 left-1 bg-slate-950/80 rounded-full p-1"><RotateCcw className="w-2.5 h-2.5 text-slate-300" /></span>
                          )}
                        </>
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-slate-500 mb-1" />
                          <span className="text-[9px] font-bold text-slate-400">Close-Up</span>
                          <span className="text-[7px] text-slate-500 mt-0.5">(Defect itself)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Annotation Actions Row */}
                  {(capturedPhotos.wide || capturedPhotos.medium || capturedPhotos.closeup) && (
                    <div className="flex flex-col gap-1 w-full bg-slate-900/40 p-2 rounded-xl border border-slate-850">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider pl-0.5 block mb-1">Annotate Defect Photo</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          disabled={!capturedPhotos.wide}
                          onClick={() => {
                            setDrawingTarget('wide');
                            setShowDrawingCanvas(true);
                          }}
                          className={`py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                            capturedPhotos.wide 
                              ? 'bg-slate-900 border-[#22D3EE]/25 text-[#22D3EE] hover:bg-slate-850 cursor-pointer' 
                              : 'bg-slate-950 border-slate-950 text-slate-600 cursor-not-allowed opacity-40'
                          }`}
                        >
                          ✏️ Wide
                        </button>
                        <button
                          type="button"
                          disabled={!capturedPhotos.medium}
                          onClick={() => {
                            setDrawingTarget('medium');
                            setShowDrawingCanvas(true);
                          }}
                          className={`py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                            capturedPhotos.medium 
                              ? 'bg-slate-900 border-[#22D3EE]/25 text-[#22D3EE] hover:bg-slate-850 cursor-pointer' 
                              : 'bg-slate-950 border-slate-950 text-slate-600 cursor-not-allowed opacity-40'
                          }`}
                        >
                          ✏️ Med
                        </button>
                        <button
                          type="button"
                          disabled={!capturedPhotos.closeup}
                          onClick={() => {
                            setDrawingTarget('closeup');
                            setShowDrawingCanvas(true);
                          }}
                          className={`py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                            capturedPhotos.closeup 
                              ? 'bg-[#1E3A5F] border-[#22D3EE]/40 text-white hover:bg-[#1E3A5F]/85 cursor-pointer' 
                              : 'bg-slate-950 border-slate-950 text-slate-600 cursor-not-allowed opacity-40'
                          }`}
                        >
                          ✏️ Close-Up
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Defect Location Heatmap Placement SVG Selector */}
                  {capturedPhotos.closeup && (
                    <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Suspect Material Placement</span>
                        <span className="text-[9px] text-slate-500">Tap part below</span>
                      </div>
                      
                      <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-880">
                        <button 
                          type="button" 
                          onClick={() => setPartViewTemplate('86286761')}
                          className={`flex-1 py-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center ${
                            partViewTemplate === '86286761' ? 'bg-[#1E3A5F] text-white border border-[#22D3EE]/25' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Tail Light
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setPartViewTemplate('86291945')}
                          className={`flex-1 py-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center ${
                            partViewTemplate === '86291945' ? 'bg-[#1E3A5F] text-white border border-[#22D3EE]/25' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Headlight Casing
                        </button>
                      </div>

                      <div className="relative bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-center justify-center overflow-hidden h-36 cursor-crosshair">
                        <svg 
                          viewBox="0 0 100 100" 
                          className="w-full h-full max-h-32 object-contain"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width;
                            const y = (e.clientY - rect.top) / rect.height;
                            setDefectLocationX(parseFloat(x.toFixed(2)));
                            setDefectLocationY(parseFloat(y.toFixed(2)));
                            playBeep('success');
                          }}
                        >
                          {partViewTemplate === '86286761' ? (
                            <g>
                              <rect x="5" y="25" width="90" height="50" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                              <rect x="10" y="30" width="35" height="40" rx="4" fill="#991B1B" opacity="0.3" stroke="#DC2626" strokeWidth="1" />
                              <rect x="55" y="30" width="35" height="40" rx="4" fill="#991B1B" opacity="0.3" stroke="#DC2626" strokeWidth="1" />
                              <circle cx="27.5" cy="50" r="10" fill="#EF4444" opacity="0.4" />
                              <circle cx="72.5" cy="50" r="10" fill="#EF4444" opacity="0.4" />
                              <line x1="50" y1="25" x2="50" y2="75" stroke="#475569" strokeDasharray="3 3" />
                              <text x="50" y="20" fill="#64748B" fontSize="6" textAnchor="middle" fontWeight="bold">Tail Light Assembly (86286761)</text>
                            </g>
                          ) : (
                            <g>
                              <path d="M10,50 C10,25 40,20 90,40 C90,40 70,75 30,70 C15,68 10,60 10,50 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                              <circle cx="45" cy="48" r="14" fill="#0EA5E9" opacity="0.2" stroke="#38BDF8" strokeWidth="1" />
                              <circle cx="75" cy="42" r="8" fill="#0EA5E9" opacity="0.2" stroke="#38BDF8" strokeWidth="1" />
                              <path d="M12,48 C20,35 45,35 45,48" stroke="#64748B" strokeWidth="1.5" fill="none" />
                              <text x="50" y="16" fill="#64748B" fontSize="6" textAnchor="middle" fontWeight="bold">Headlight Casing (86291945)</text>
                            </g>
                          )}
                          
                          {defectLocationX !== null && defectLocationY !== null && (
                            <g>
                              <circle 
                                cx={defectLocationX * 100} 
                                cy={defectLocationY * 100} 
                                r="4" 
                                fill="#FF0000" 
                                className="animate-ping" 
                                style={{ transformOrigin: `${defectLocationX * 100}px ${defectLocationY * 100}px` }} 
                              />
                              <circle 
                                cx={defectLocationX * 100} 
                                cy={defectLocationY * 100} 
                                r="3.5" 
                                fill="#EF4444" 
                                stroke="#FFFFFF" 
                                strokeWidth="0.8" 
                              />
                            </g>
                          )}
                        </svg>
                        {defectLocationX !== null && defectLocationY !== null && (
                          <div className="absolute bottom-1 right-2 bg-slate-950/80 text-[8px] text-[#22D3EE] font-mono px-1 py-0.5 rounded">
                            X: {defectLocationX} | Y: {defectLocationY}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audio & Video Mock Attachments */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setHasVideo(!hasVideo)}
                      className={`flex-1 h-11 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        hasVideo ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>{hasVideo ? 'Video Linked' : 'Add 15s Video'}</span>
                    </button>
                    
                    <button 
                      onClick={() => setHasAudio(!hasAudio)}
                      className={`flex-1 h-11 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        hasAudio ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{hasAudio ? 'Audio Note Linked' : 'Add Audio Memo'}</span>
                    </button>
                  </div>

                  <button 
                    disabled={!capturedPhotos.wide || !capturedPhotos.medium || !capturedPhotos.closeup}
                    onClick={() => setIncStep(2)}
                    className="phone-btn-primary mt-4"
                  >
                    <span>Proceed to Scan Part Label</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: SCAN (MOCK SCANNERS AND WARNINGS) */}
              {incStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Step 2: Traceability Scan</span>
                    {scannedPartsList.length > 0 && (
                      <span className="text-[9px] bg-[#10B981]/25 text-[#10B981] font-bold px-2 py-0.5 rounded-full">
                        {scannedPartsList.length} Added
                      </span>
                    )}
                  </div>

                  {/* Scan Barcode Button */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => startScanning('barcode')}
                      className="phone-btn-primary bg-[#1e3a5f] hover:bg-[#1e3a5f]/85 active:bg-[#152943] shadow-md shadow-[#1e3a5f]/15"
                    >
                      <Scan className="w-4 h-4 text-[#22D3EE]" />
                      <span>Scan Part Barcode Label</span>
                    </button>

                    {scannedPN ? (
                      <div className="bg-[#1E293B]/60 rounded-xl p-3 border border-[#334155]/60 flex flex-col gap-2 relative">
                        <button 
                          onClick={() => {
                            setScannedPN('');
                            setPartInfo(null);
                            setManualEntryWarning(false);
                          }}
                          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex justify-between items-center text-xs pr-6">
                          <span className="text-slate-400">Part Number:</span>
                          <span className="font-bold text-white">{scannedPN}</span>
                        </div>
                        {partInfo ? (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Description:</span>
                              <span className="text-slate-200 font-semibold text-right max-w-[160px] truncate">{partInfo.description}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">Supplier:</span>
                              <span className="text-[#22D3EE] font-semibold">Magna AutoSystems</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Description:</span>
                            <span className="text-slate-450 italic">Custom Part</span>
                          </div>
                        )}
                        {manualEntryWarning && (
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-1.5 rounded-lg text-[9px] font-bold">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>Manual Entry: Typos can happen without scan.</span>
                          </div>
                        )}
                        <button
                          onClick={addPartToList}
                          className="phone-btn-primary bg-[#10B981] hover:bg-[#10B981]/90 active:bg-[#0c8c61] shadow-md shadow-[#10B981]/15 mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Checklist</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Or enter Part Number manually (last resort)</label>
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
                      <Scan className="w-4 h-4 text-slate-400" />
                      <span>Scan Bin/Box Label QR</span>
                    </button>

                    {scannedBin && (
                      <div className="bg-[#1E293B]/60 rounded-xl p-2.5 border border-[#334155]/60 flex justify-between items-center text-xs relative">
                        <span className="text-slate-400">Bin Location:</span>
                        <span className="font-bold text-emerald-400 pr-6">{scannedBin}</span>
                        <button 
                          onClick={() => setScannedBin('')}
                          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Checklist of Added Parts */}
                  {scannedPartsList.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                        Defective Parts List ({scannedPartsList.length})
                      </span>
                      <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 pr-1 scrollbar-thin">
                        {scannedPartsList.map((item) => (
                          <div 
                            key={item.id}
                            className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-xs truncate">PN {item.part_number}</span>
                                <span className="text-emerald-400 font-semibold text-[10px]">{item.bin}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">{item.description}</span>
                            </div>
                            
                            {/* Quantity Adjuster & Delete */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                                <button 
                                  onClick={() => updatePartQty(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 rounded text-xs font-bold transition-all cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-white">{item.qty}</span>
                                <button 
                                  onClick={() => updatePartQty(item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 rounded text-xs font-bold transition-all cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              
                              <button 
                                onClick={() => removePartFromList(item.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DESCRIBE & CONTEXT (FIELDS WITH COUNTER AND AUTOCOMPLETE) */}
              {incStep === 3 && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Step 3: Suspect Material Metadata</span>

                  {/* Area Found */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase pl-1">Area of Factory Floor</label>
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
                    <label className="text-[9px] font-bold text-slate-500 uppercase pl-1">Suspect Material Category</label>
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
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Suspect Material Narrative</label>
                      <span className={`text-[8px] font-bold ${description.split(/\s+/).filter(Boolean).length < 20 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {description.split(/\s+/).filter(Boolean).length} words
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
                    <label className="text-[9px] font-bold text-slate-500 uppercase pl-1">Action Taken immediately</label>
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
                    <label className="text-[9px] font-bold text-slate-500 uppercase pl-1">Contact Person at Supplier</label>
                    <input 
                      type="text" 
                      value={supplierContact}
                      onChange={(e) => setSupplierContact(e.target.value)}
                      className="phone-input"
                      placeholder="Martin / Shahroz / SQE"
                    />
                  </div>

                  {/* Magna AutoSystems Specific Fields (NoCOVID screening fields, PRR class only) */}
                  <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-850 flex flex-col gap-3 mt-2">
                    <span className="text-[9px] text-[#22D3EE] font-extrabold uppercase tracking-wider block border-b border-slate-850 pb-1.5">Magna Specifications</span>
                    <div className="flex flex-col gap-2.5 text-[10px]">
                      
                      {/* Returned */}
                      <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-850/60">
                        <span className="text-slate-400 font-bold">Returned to Supplier?</span>
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
                      <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-850/60">
                        <span className="text-slate-400 font-bold">Supplier Sort Needed?</span>
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
                      <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-850/60">
                        <span className="text-slate-400 font-bold">RMA Code Required?</span>
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
                      <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850/60">
                        <span className="text-slate-400 font-bold">Issue Severity Classification:</span>
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
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3.5: AI DUPLICATE CHECK WARNING */}
              {incStep === 3.5 && duplicateIncident && (
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider text-amber-400">AI Duplicate Warning</h3>
                    <p className="text-[10px] text-slate-400 mt-1">A highly similar report was filed in the last 24 hours.</p>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                      <span>Jaccard Word Similarity</span>
                      <span className="text-[#22D3EE] font-bold">{(duplicateIncident.similarity * 100).toFixed(0)}% Match</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, duplicateIncident.similarity * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 font-mono">
                      <span className="text-[9px] text-[#22D3EE]">{duplicateIncident.incident.id}</span>
                      <span className="text-[9px] text-slate-500">{new Date(duplicateIncident.incident.created_at || duplicateIncident.incident.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-slate-300 italic">"{duplicateIncident.incident.description}"</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-800/60 font-medium">
                      <span>Rep: Clarence Kuiken</span>
                      <span>Area: {duplicateIncident.incident.area}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl leading-relaxed">
                    🌟 <strong>Merge Observations</strong> will increment the quantity on the existing incident and append your new notes, avoiding double-reporting to the client.
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={handleMergeDuplicate}
                      className="phone-btn-primary bg-[#10B981] hover:bg-[#10B981]/90 border-[#10B981]/30 text-white flex items-center justify-center gap-1.5 w-full cursor-pointer py-2.5"
                    >
                      <span>Merge Observations</span>
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIncStep(3)} 
                        className="phone-btn-secondary flex-1 py-2 text-[10px]"
                      >
                        Back / Edit
                      </button>
                      <button 
                        onClick={() => setIncStep(4)} 
                        className="phone-btn-secondary flex-1 py-2 text-[10px] border-[#EF4444]/20 text-rose-400 hover:bg-rose-500/5 hover:text-white"
                      >
                        Continue Separate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SEND (EMAIL SUBJECT & CC PREVIEW) */}
              {incStep === 4 && (
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Step 4: Audit & Release</span>

                  {/* Summary Card */}
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500">Report Status:</span><span className="text-amber-400 font-bold uppercase">Ready to Release</span></div>
                    <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500">Part Number:</span><span className="text-white font-semibold">{scannedPN}</span></div>
                    <div className="flex justify-between items-center text-[10px]"><span className="text-slate-500">Plant / Area:</span><span className="text-white font-semibold">{plants.find(p => p.id === selectedPlant)?.name} | {selectedArea}</span></div>
                  </div>

                  {/* Email Preview Accordion */}
                  <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                      className="w-full px-3.5 py-3 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-xs font-bold text-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#0EA5E9]" />
                        <span>Inspect Outgoing Email Preview</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{showEmailPreview ? 'Collapse' : 'Expand'}</span>
                    </button>

                    {showEmailPreview && (
                      <div className="p-3 border-t border-slate-800 text-[9px] font-mono flex flex-col gap-2 bg-slate-950 text-slate-300 max-h-[180px] overflow-y-auto">
                        <div>
                          <span className="text-[#22D3EE] font-bold">To:</span> martin.s@magna.com, shahroz.m@magna.com
                        </div>
                        <div>
                          <span className="text-[#22D3EE] font-bold">CC:</span> donna.c@integritydriven.com, greg.p@integritydriven.com
                        </div>
                        <div>
                          <span className="text-[#22D3EE] font-bold">Subject:</span> [INCIDENT] PN {scannedPN} | {selectedArea} | {plants.find(p => p.id === selectedPlant)?.name} | {new Date().toLocaleDateString()}
                        </div>
                        <div className="border-t border-slate-850 pt-2 text-slate-400">
                          <p className="font-sans font-semibold text-white">Hello Shahroz.</p>
                          <p className="mt-1 leading-relaxed font-sans">{description}</p>
                          <p className="mt-2 font-sans"><strong>Action Taken:</strong> {actionTaken}</p>
                          <p className="mt-1 font-sans"><strong>Traceability Info:</strong> Returned: {isReturningDefect} | Sort: {isSortRequired} | RMA: {isRmaRequired} | Class: {concernClassification}</p>
                          <p className="mt-2 font-sans text-[8px] text-slate-500">Regards,<br/>{currentUser.name} | IDS Rep</p>
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
          <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col justify-between p-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Annotate {drawingTarget === 'wide' ? 'Wide Shot' : drawingTarget === 'medium' ? 'Medium View' : 'Close-Up'}
              </span>
              <button 
                onClick={() => setShowDrawingCanvas(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden my-3 relative">
              <canvas 
                ref={canvasRef}
                width={300}
                height={300}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border border-slate-700 bg-slate-950 rounded-xl cursor-crosshair"
              />
            </div>

            <div className="flex gap-2">
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
          <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col justify-between p-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Camera Label Scanner</span>
              <button onClick={() => setScanningType(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            {/* Viewfinder scanning frame with Multi-Code detection overlay */}
            <div className="flex-1 bg-slate-900 border-2 border-[#22D3EE]/30 rounded-2xl my-4 relative flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-lg shadow-red-500 pulsing-indicator top-1/2 z-20 pointer-events-none"></div>
              
              <div className="absolute top-3 text-center px-4 z-20 bg-slate-950/85 py-1 rounded-lg border border-slate-800">
                <p className="text-[10px] text-white font-semibold">⚠️ Multiple Codes Detected</p>
                <p className="text-[8px] text-[#22D3EE] font-medium">Tap the green box for Part Number / Bin</p>
              </div>

              {/* Selection Options represented as a physical label mock in the viewfinder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/40 z-10">
                {scanningType === 'barcode' ? (
                  /* PHYSICAL LABEL MOCK FOR BARCODES */
                  <div className="bg-white text-slate-950 p-2.5 rounded-lg border-2 border-slate-300 shadow-2xl w-full max-w-[260px] flex flex-col gap-1.5 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Magna Belleville Systems</span>
                      <span>LOT: 902A5</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Code 1: Serial Code (Incorrect) */}
                      <div className="relative border border-dashed border-slate-350 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs opacity-80">
                          <span className="text-[5px] text-slate-400 font-mono tracking-widest">SERIAL BARCODE</span>
                        </div>
                        <span className="text-[7px] font-bold font-mono text-slate-550 mt-0.5">S/N: 901485291</span>

                        {/* Wrong tag warning overlay */}
                        <button 
                          type="button"
                          onClick={() => {
                            playBeep('warning');
                            alert("Incorrect Code Selected!\n\nThis is the Supplier Serial Number. Please tap the PART NUMBER barcode below instead.");
                          }}
                          className="absolute inset-0 bg-red-500/10 border border-red-500/40 rounded flex items-center justify-center cursor-pointer hover:bg-red-500/20"
                        >
                          <span className="bg-red-600 text-white font-extrabold px-1 py-0.5 rounded-[3px] text-[6px] uppercase tracking-wide">Serial Code</span>
                        </button>
                      </div>

                      {/* Code 2: Part Number (Correct Tail Light) */}
                      <div className="relative border border-dashed border-slate-350 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs">
                          <span className="text-[5px] text-emerald-400 font-mono tracking-widest">PART NUMBER BARCODE</span>
                        </div>
                        <span className="text-[7px] font-extrabold font-mono text-slate-900 mt-0.5">PN: 86286761 (Tail Light)</span>

                        {/* Correct clickable scan overlay */}
                        <button 
                          type="button"
                          onClick={() => selectScanOption('86286761')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        >
                          <span className="bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-[4px] text-[7px] uppercase tracking-wider animate-bounce">Tap to Scan PN 86286761</span>
                        </button>
                      </div>

                      {/* Code 3: Alternate Part Number (Correct Headlight) */}
                      <div className="relative border border-dashed border-slate-350 p-1 flex flex-col items-center rounded bg-slate-50">
                        <div className="flex h-3.5 w-full bg-slate-900 justify-center items-center rounded-xs">
                          <span className="text-[5px] text-emerald-400 font-mono tracking-widest">PART NUMBER BARCODE</span>
                        </div>
                        <span className="text-[7px] font-extrabold font-mono text-slate-900 mt-0.5">PN: 86291945 (Headlight)</span>

                        {/* Correct clickable scan overlay */}
                        <button 
                          type="button"
                          onClick={() => selectScanOption('86291945')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors"
                        >
                          <span className="bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-[4px] text-[7px] uppercase tracking-wider">Tap to Scan PN 86291945</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* PHYSICAL LABEL MOCK FOR QR BIN SCANS */
                  <div className="bg-white text-slate-950 p-3 rounded-lg border-2 border-slate-300 shadow-2xl w-full max-w-[260px] flex flex-col gap-2 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-[8px] text-slate-500 font-bold uppercase">
                      <span>Magna Bin Storage</span>
                      <span>SECTION: B4</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* QR Code 1: Batch Code (Incorrect) */}
                      <div className="relative border border-slate-200 p-1.5 flex flex-col items-center justify-center rounded bg-slate-50">
                        <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                          <span className="text-[5px] text-slate-400 uppercase tracking-widest font-mono">QR</span>
                        </div>
                        <span className="text-[7px] font-bold text-slate-550 mt-1">BATCH CODE</span>

                        <button 
                          type="button"
                          onClick={() => {
                            playBeep('warning');
                            alert("Incorrect QR Code!\n\nThis is the Manufacturing Batch QR. Please tap the green BIN LOCATION QR code instead.");
                          }}
                          className="absolute inset-0 bg-red-500/10 border border-red-500/40 rounded flex items-center justify-center cursor-pointer hover:bg-red-500/20"
                        >
                          <span className="bg-red-600 text-white font-extrabold px-1 py-0.5 rounded-[3px] text-[6px] uppercase tracking-wide">Batch QR</span>
                        </button>
                      </div>

                      {/* QR Code 2: Bin Location (Correct) */}
                      <div className="relative border border-slate-200 p-1.5 flex flex-col items-center justify-center rounded bg-slate-50">
                        <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                          <span className="text-[5px] text-emerald-400 uppercase tracking-widest font-mono">QR</span>
                        </div>
                        <span className="text-[7px] font-extrabold text-slate-900 mt-1">BIN: BIN-MAG-6761</span>

                        <button 
                          type="button"
                          onClick={() => selectScanOption('86286761')}
                          className="absolute inset-0 bg-emerald-500/15 border-2 border-emerald-500 rounded flex items-center justify-center cursor-pointer hover:bg-emerald-500/30 transition-colors animate-pulse"
                        >
                          <span className="bg-emerald-500 text-white font-extrabold px-1 py-0.5 rounded-[3px] text-[6px] uppercase tracking-wider text-center">Tap Bin QR</span>
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
          <div className="flex-1 flex flex-col justify-between p-6 bg-slate-950 animate-in fade-in duration-200">
            <div className="my-auto flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Incident Released</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                Defect report has been successfully sent out.
              </p>
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-850 w-full max-w-[260px] text-[10px] text-slate-400 mt-4 flex flex-col gap-1.5 text-left">
                <div><span className="text-slate-500 font-bold uppercase">Sent At:</span> <span className="text-slate-300 font-medium">18:22 PM Today</span></div>
                <div><span className="text-slate-500 font-bold uppercase">Recipient:</span> <span className="text-slate-300 font-medium">martin.s@magna.com</span></div>
                <div><span className="text-slate-500 font-bold uppercase">Notification:</span> <span className="text-[#22D3EE] font-bold">Donna Cabral CC'd</span></div>
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
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-900">
              <button onClick={() => setActiveScreen('home')} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"><ArrowLeft className="w-4 h-4" /><span>Home</span></button>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Shift Summary Log</h2>
              <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-white">Daily Area Walks</h3>
                <p className="text-[10px] text-slate-500">Tap statuses to confirm walks or add floor notes.</p>
              </div>

              {/* Area Cards list */}
              <div className="flex flex-col gap-3">
                {areasWalked.map(area => (
                  <div key={area.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{area.name}</span>
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
                      className="phone-input h-9 px-3 text-[10px]"
                    />
                  </div>
                ))}
              </div>

              {/* Bonus tasks card */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-850">
                <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Requested Sorts & Audits</span>
                {bonusTasks.map(task => (
                  <div key={task.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-white">{task.task}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">Matt request</p>
                    </div>
                    <button 
                      onClick={() => {
                        setBonusTasks(prev => {
                          const next = prev.map(bt => bt.id === task.id ? { ...bt, status: bt.status === 'completed' ? 'pending' : 'completed' } : bt);
                          saveDraftShiftReport(null, next);
                          return next;
                        });
                      }}
                      className={`h-8 px-2.5 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                        task.status === 'completed' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
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
                <span>{sendingShiftReport ? 'Compiling report...' : 'Submit End-Of-Shift Log'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: REWORK LOG FORM */}
        {activeScreen === 'rework' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-900">
              <button onClick={() => setActiveScreen('home')} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"><ArrowLeft className="w-4 h-4" /><span>Home</span></button>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Log Billable Rework</h2>
              <div className="w-10"></div>
            </div>

            <form onSubmit={handleReworkSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Part Number Reworked</label>
                <select 
                  value={reworkPN}
                  onChange={(e) => setReworkPN(e.target.value)}
                  className="phone-select"
                >
                  <option value="86286761">PN 86286761 (Tail Light)</option>
                  <option value="86291945">PN 86291945 (Headlight Bin)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Rework Qty (Pieces)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReworkQty(Math.max(0, reworkQty - 1))}
                    className="w-11 h-11 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/25 rounded-xl flex items-center justify-center text-rose-400 font-extrabold text-lg select-none cursor-pointer transition-colors flex-shrink-0"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={reworkQty}
                    onChange={(e) => setReworkQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="phone-input text-center flex-1 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setReworkQty(reworkQty + 1)}
                    className="w-11 h-11 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-[#10B981]/30 border border-emerald-500/25 rounded-xl flex items-center justify-center text-emerald-400 font-extrabold text-lg select-none cursor-pointer transition-colors flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Time Spent (Hours)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReworkHours(Math.max(0, reworkHours - 0.5))}
                    className="w-11 h-11 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/25 rounded-xl flex items-center justify-center text-rose-400 font-extrabold text-lg select-none cursor-pointer transition-colors flex-shrink-0"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    step="0.5"
                    value={reworkHours}
                    onChange={(e) => setReworkHours(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="phone-input text-center flex-1 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setReworkHours(reworkHours + 0.5)}
                    className="w-11 h-11 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-[#10B981]/30 border border-emerald-500/25 rounded-xl flex items-center justify-center text-emerald-400 font-extrabold text-lg select-none cursor-pointer transition-colors flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Rework Description / Remarks</label>
                <textarea 
                  value={reworkNotes}
                  onChange={(e) => setReworkNotes(e.target.value)}
                  rows={3}
                  className="phone-textarea"
                />
              </div>

              <button 
                type="submit"
                className="phone-btn-primary mt-4"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Rework Record</span>
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 6: LOG EXPENSES & RECEIPTS */}
        {activeScreen === 'expenses' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-900">
              <button onClick={() => setActiveScreen('home')} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"><ArrowLeft className="w-4 h-4" /><span>Home</span></button>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Log Expense</h2>
              <div className="w-10"></div>
            </div>

            <form onSubmit={handleExpenseSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Expense Category</label>
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
                <label className="text-[9px] font-bold text-slate-500 uppercase">Amount ($ USD/CAD)</label>
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
                <label className="text-[9px] font-bold text-slate-500 uppercase">Receipt Photo Verification</label>
                {expenseReceiptPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
                    <img 
                      src={expenseReceiptPhoto} 
                      alt="Receipt Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={captureMockReceipt}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Retake Photo</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setExpenseReceiptPhoto(null)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={captureMockReceipt}
                    className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-450 hover:text-white transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold">Simulate Receipt Capture</span>
                    <span className="text-[8px] text-slate-500">Tap to capture mock receipt photo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Expense Notes / Remarks</label>
                <textarea 
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Describe location or purpose of expense..."
                  rows={3}
                  className="phone-textarea"
                />
              </div>

              <button 
                type="submit"
                className="phone-btn-primary mt-4"
              >
                <CheckCircle className="w-4 h-4 text-emerald-450" />
                <span>Save & Submit Expense</span>
              </button>
            </form>
          </div>
        )}

        {activeScreen === 'history' && isLoggedIn && currentUser && (
          <div className="flex-1 flex flex-col gap-4 text-left p-1 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
              <button onClick={() => setActiveScreen('home')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0EA5E9]" /> Suspect Material Logs
              </h2>
            </div>
            
            <div className="flex flex-col gap-2">
              {getEntities('incidents')?.filter(inc => inc.rep_id === currentUser.id).length === 0 ? (
                <div className="text-[10px] text-slate-500 italic text-center py-6">No suspect materials logged yet.</div>
              ) : (
                getEntities('incidents')
                  ?.filter(inc => inc.rep_id === currentUser.id)
                  .map(inc => {
                    const hasRevision = inc.revision_request;
                    return (
                      <div key={inc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-[#22D3EE]">{inc.id.toUpperCase()}</span>
                          <span className="text-slate-400 font-mono">{new Date(inc.sent_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          <strong>Area Found:</strong> {inc.area}
                        </div>
                        <div className="text-[10px] text-slate-300 leading-relaxed">
                          <strong>Description:</strong> {inc.description}
                        </div>
                        
                        {hasRevision ? (
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[9px] text-amber-400">
                            <strong>Revision Requested:</strong> "{inc.revision_request}"
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-900 pt-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Request Correction</span>
                            <div className="flex gap-1.5">
                              <input 
                                id={`rev_input_${inc.id}`}
                                type="text" 
                                placeholder="Explain correction needed..." 
                                className="bg-slate-900 border border-slate-800 text-[10px] px-2 py-1 rounded flex-1 text-white placeholder-slate-650 focus:outline-none"
                              />
                              <button 
                                onClick={() => {
                                  const val = document.getElementById(`rev_input_${inc.id}`)?.value;
                                  if (!val) return alert("Please enter correction description!");
                                  const dbIncs = getEntities('incidents') || [];
                                  const match = dbIncs.find(i => i.id === inc.id);
                                  if (match) {
                                    match.revision_request = val;
                                    saveEntity('incidents', match);
                                    window.dispatchEvent(new Event('ids_pulse_db_update'));
                                    alert("Revision request successfully logged and sent to quality lead!");
                                  }
                                }} 
                                className="px-2 py-1 bg-[#0EA5E9] hover:bg-[#0EA5E9]/80 text-white font-bold text-[9px] rounded uppercase cursor-pointer"
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
