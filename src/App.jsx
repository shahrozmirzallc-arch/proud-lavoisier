import React, { useState, useEffect } from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import WebDashboard from './components/WebDashboard';
import { initializeDB } from './components/SharedDatabase';
import LoginScreen from './components/LoginScreen';
import { SpinnerGap } from '@phosphor-icons/react';
import { Shield, Activity, Monitor, Smartphone, RefreshCw, Laptop, Milestone, Lock, Key, Sun, Moon, User } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          color: '#f8fafc',
          textAlign: 'left',
          margin: '16px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#f87171', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
            ⚠️ Render Crash Detected
          </h3>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            An error occurred while rendering this section: <code style={{ backgroundColor: '#020617', padding: '2px 6px', borderRadius: '4px', color: '#fca5a5', fontFamily: 'monospace' }}>{this.state.error?.toString()}</code>
          </p>
          <pre style={{
            backgroundColor: '#020617',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#64748b',
            overflowX: 'auto',
            maxHeight: '250px',
            margin: '0'
          }}>
            {this.state.error?.stack}
          </pre>
          <button 
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '16px',
              padding: '6px 12px',
              backgroundColor: '#0ea5e9',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Retry Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.Capacitor?.isNativePlatform?.() ||
      window.Capacitor?.getPlatform?.() === 'android' ||
      window.Capacitor?.getPlatform?.() === 'ios' ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  });

  const [layoutMode, setLayoutMode] = useState(() => {
    const role = sessionStorage.getItem('ids_pulse_role') || 'admin';
    const unlocked = sessionStorage.getItem('ids_pulse_unlocked') === 'true';
    if (typeof window !== 'undefined' && (
      window.Capacitor?.isNativePlatform?.() ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    )) {
      return 'phone-only';
    }
    if (unlocked && role !== 'qre' && role !== 'rep') {
      return 'dashboard-only';
    }
    return 'side-by-side';
  }); // 'side-by-side' | 'phone-only' | 'dashboard-only' | 'roadmap-only'

  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(
        Boolean(
          window.Capacitor?.isNativePlatform?.() ||
          window.Capacitor?.getPlatform?.() === 'android' ||
          window.Capacitor?.getPlatform?.() === 'ios' ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.innerWidth <= 768
        )
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isOffline, setIsOffline] = useState(false);
  
  // Database update trigger to force component re-renders when data updates
  const [dbUpdateTrigger, setDbUpdateTrigger] = useState(0);

  // Dynamic Theme State (v3.2)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ids_pulse_theme') || 'royal-blue';
  });

  // Day / Night Theme Mode (v4.2): Day = Dark (default), Night = Light Mode
  const [dayNight, setDayNight] = useState(() => {
    const saved = localStorage.getItem('ids_pulse_daynight');
    if (saved) return saved;
    return 'day'; // Default is Dark Theme
  });

  // Password Lock State
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('ids_pulse_unlocked') === 'true' || sessionStorage.getItem('ids_pulse_unlocked') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('ids_pulse_role') || sessionStorage.getItem('ids_pulse_role') || 'admin');
  const [currentUserRepId, setCurrentUserRepId] = useState(() => sessionStorage.getItem('ids_pulse_rep_id') || '');
  const [currentUserCustomerId, setCurrentUserCustomerId] = useState(() => sessionStorage.getItem('ids_pulse_customer_id') || '');
  const [systemUsername, setSystemUsername] = useState('');
  const [systemPassword, setSystemPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    document.body.classList.remove('theme-royal-blue', 'theme-neon-violet', 'theme-emerald-green', 'theme-ruby-red');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('ids_pulse_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (dayNight === 'night') {
      document.body.classList.add('mode-light');
      document.body.classList.remove('mode-dark');
    } else {
      document.body.classList.add('mode-dark');
      document.body.classList.remove('mode-light');
    }
    localStorage.setItem('ids_pulse_daynight', dayNight);
  }, [dayNight]);

  // Initialize DB and listen to custom event
  useEffect(() => {
    initializeDB();
    
    const handleDbUpdate = () => {
      setDbUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('ids_pulse_db_update', handleDbUpdate);
    return () => {
      window.removeEventListener('ids_pulse_db_update', handleDbUpdate);
    };
  }, []);

  // Initial Session Checking State
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecking(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const handleSignedIn = async ({ username, password }) => {
    const inputUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const rawPw = password.trim();

    // Verify raw input hash
    const msgBuffer = new TextEncoder().encode(rawPw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify space-removed raw input hash for tolerance
    const spaceRemovedRaw = rawPw.replace(/\s+/g, '');
    const cleanBuffer = new TextEncoder().encode(spaceRemovedRaw);
    const cleanHashBuffer = await crypto.subtle.digest('SHA-256', cleanBuffer);
    const cleanHashHex = Array.from(new Uint8Array(cleanHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Admin Specific Password Hashes
    const adminHashes = {
      greg: 'e6e0bc2e0084fd9a105a96352b19bc17e1133c305d71b95ea8ee34d4ab02b5ee', // Greg2026!
      colleen: 'ccd752abe030dc31bc9ae49e24a4dd23372253615a5ec6a390fe47ba6878abc3', // Colleen2026!
      monica: '9556d2e682b19a2e62f4b4ba8638b17bbd128a9d8da20f567a49d6fce6e42e9b', // Monica2026!
      iris: '224277d14561475a8bc9aba23aaeb0cbf89c6238640419be87feb4d35d653ca6', // Iris2026!
      donna: '30e94cd242d100d9f98f7455f3729a261e8adbef1be6068d56f2ca8906f02ddf', // Donna2026!
      miriam: '8570ccf94f2ed3e87fe169f26abfed781fcfd0a78bed27aab58d9de07fc0467c', // Miriam2026!
      idspulse: '9a92a6d1cf6ec2949a7ee59160e25dbc16948a10c5d8d805456c1b788da3ac51', // Pulse2026!
      diana: 'fbb9c06c0bb8db5f7eef5fd346791577e8abe77c668167fb3f0035b34a759d9b', // DianaPulse2026!
      shahroz: '3dc913cc6d99a4f6fa13c07c646c8efa8b9410d323c484dfc1fef45322782131' // Shahroz123$
    };

    const repHashes = {
      hugo: 'c64af887d9674ca8412b190b24d2f6832f26bd793741b8950ee0fdef607ecf29', // Hugo2026!
      nabil: 'fa7bd90019d53e79275df8cfbdb2c1aa0452cd5014a61bc33a00762c0a1c6758', // Nabil2026!
      rogelio: 'e61e93bbc830f459760753dc939561ff6f7803265ab3558b528fee3cae768666', // Rogelio2026!
      clarence: 'f53f71f14ab8ec71d37880f364626c078b44ebb0c2ab0bfd725f0d82f93d00c0' // Clarence2026!
    };

    const customerHashes = {
      autokabel: '6f43cfa01465d7148ff27a7937b1a0c423c270d0021bc96c13077cc97fc7e59a', // Autokabel2026!
      magna: '012a4330d67f32ea9a514c8941cb068d2fcdb1600e6bc7699790e606fbe96559', // Magna2026!
      hutchinson: 'aeb399a87fbb23ee6a65017fd465aa284dc6ee406334b9d5544d6ecf0d125677', // Hutchinson2026!
      brose: '314ac53360d6111f3be1678d7a96aa6d3886921327a04bc488d0ead1eb930373', // Brose2026!
      abc123: '1b431fc447e54efd4aba29ca904126c95f4c5146fd9ba9a44269735826883f76' // Abc1232026!
    };

    const isValidSpecificAdmin = adminHashes[inputUser] && (hashHex === adminHashes[inputUser] || cleanHashHex === adminHashes[inputUser]);
    const isValidSpecificRep = repHashes[inputUser] && (hashHex === repHashes[inputUser] || cleanHashHex === repHashes[inputUser]);
    const isValidSpecificCustomer = customerHashes[inputUser] && (hashHex === customerHashes[inputUser] || cleanHashHex === customerHashes[inputUser]);

    let targetUser = inputUser;
    let isAuthorized = false;
    let loginType = '';

    const admins = Object.keys(adminHashes);
    const reps = Object.keys(repHashes);
    const customers = Object.keys(customerHashes);

    if (admins.includes(targetUser) && isValidSpecificAdmin) {
      isAuthorized = true;
      loginType = 'admin';
    } else if (reps.includes(targetUser) && isValidSpecificRep) {
      isAuthorized = true;
      loginType = 'rep';
    } else if (customers.includes(targetUser) && isValidSpecificCustomer) {
      isAuthorized = true;
      loginType = 'customer';
    }

    if (isAuthorized) {
      setIsUnlocked(true);
      if (loginType === 'admin') {
        const adminName = targetUser;
        setDayNight('day');
        const reactRole = (adminName === 'shahroz' || adminName === 'idspulse') ? 'shahroz' : 
                          (adminName === 'colleen' ? 'accountant' : 
                          (adminName === 'donna' ? 'lead' : 'owner'));
        setUserRole(reactRole);
        setLayoutMode('dashboard-only');
        sessionStorage.setItem('ids_pulse_unlocked', 'true');
        sessionStorage.setItem('ids_pulse_role', reactRole);
        sessionStorage.setItem('ids_pulse_admin_user', adminName);
        setAuthError(false);
      } else if (loginType === 'rep') {
        setDayNight('day');
        setUserRole('rep');
        const repId = targetUser === 'clarence' ? '1' : `rep_${targetUser}`;
        setCurrentUserRepId(repId);
        setLayoutMode('phone-only');
        sessionStorage.setItem('ids_pulse_unlocked', 'true');
        sessionStorage.setItem('ids_pulse_role', 'rep');
        sessionStorage.setItem('ids_pulse_rep_id', repId);
        sessionStorage.removeItem('ids_pulse_admin_user');
        setAuthError(false);
      } else if (loginType === 'customer') {
        setDayNight('day');
        setUserRole('customer');
        setCurrentUserCustomerId(targetUser);
        setLayoutMode('dashboard-only');
        sessionStorage.setItem('ids_pulse_unlocked', 'true');
        sessionStorage.setItem('ids_pulse_role', 'customer');
        sessionStorage.setItem('ids_pulse_customer_id', targetUser);
        sessionStorage.removeItem('ids_pulse_admin_user');
        setAuthError(false);
      }
      return true;
    } else {
      setAuthError(true);
      setSystemPassword('');
      return false;
    }
  };

  if (authChecking) {
    return (
      <div className="auth-loading" role="status">
        <img src="/ids-pulse-shield.png" alt="" />
        <SpinnerGap className="spin" />
        <strong>Checking secure access…</strong>
      </div>
    );
  }

  if (!isUnlocked) {
    return <LoginScreen onSignedIn={handleSignedIn} />;
  }

  return (
    <div className="min-h-screen text-text-primary flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-color)' }}>
      
      {/* Desktop Navigation Header */}
      {!isMobileDevice && (
        <header className="bg-surface/85 backdrop-blur-md border-b border-border-subtle sticky top-0 z-30 px-4 py-2.5 lg:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* System Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-text-primary uppercase">IDS Pulse Operations Suite</h1>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                    Active
                  </span>

                  {/* Super Admin / Multi-Role Switcher */}
                  {isUnlocked && (
                    <div className="flex items-center gap-1.5 bg-surface-elevated px-2 py-0.5 rounded-lg border border-border-subtle ml-2">
                      <User className="w-3 h-3 text-[#22D3EE]" />
                      <select 
                        value={userRole}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          const currentUser = sessionStorage.getItem('ids_pulse_admin_user');
                          if (newRole === 'shahroz' && currentUser !== 'shahroz' && currentUser !== 'idspulse') {
                            return; // Block unauthorized switch
                          }
                          setUserRole(newRole);
                          setDbUpdateTrigger(prev => prev + 1);
                        }}
                        className="bg-transparent border-none text-[9.5px] font-bold text-[#22D3EE] focus:outline-none cursor-pointer p-0.5"
                      >
                        <option value="owner" className="bg-surface text-text-primary">Greg (Admin)</option>
                        <option value="accountant" className="bg-surface text-text-primary">Colleen (Finance)</option>
                        <option value="lead" className="bg-surface text-text-primary">Donna (Shift Lead)</option>
                        {(sessionStorage.getItem('ids_pulse_admin_user') === 'shahroz' || sessionStorage.getItem('ids_pulse_admin_user') === 'idspulse') && (
                          <option value="shahroz" className="bg-surface text-text-primary">Shahroz (Super Admin)</option>
                        )}
                      </select>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-text-secondary">Enterprise quality tracking, audit metrics, and field dispatch operations.</p>
              </div>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {/* Dynamic Theme Switcher */}
              <div className="flex items-center gap-1.5 bg-surface-elevated p-1.5 rounded-lg border border-border-subtle">
                <span className="text-[8px] text-text-secondary font-black uppercase px-1">Theme:</span>
                <button 
                  type="button"
                  onClick={() => setTheme('royal-blue')}
                  className={`w-3.5 h-3.5 rounded-full bg-blue-600 border ${theme === 'royal-blue' ? 'border-white scale-110 shadow-md shadow-blue-500/50' : 'border-border-subtle'} transition-all cursor-pointer`}
                  title="Royal Blue & Amber"
                />
                <button 
                  type="button"
                  onClick={() => setTheme('neon-violet')}
                  className={`w-3.5 h-3.5 rounded-full bg-violet-600 border ${theme === 'neon-violet' ? 'border-white scale-110 shadow-md shadow-violet-500/50' : 'border-border-subtle'} transition-all cursor-pointer`}
                  title="Neon Violet & Turquoise"
                />
                <button 
                  type="button"
                  onClick={() => setTheme('emerald-green')}
                  className={`w-3.5 h-3.5 rounded-full bg-emerald-600 border ${theme === 'emerald-green' ? 'border-white scale-110 shadow-md shadow-emerald-500/50' : 'border-border-subtle'} transition-all cursor-pointer`}
                  title="Emerald & Slate"
                />
                <button 
                  type="button"
                  onClick={() => setTheme('ruby-red')}
                  className={`w-3.5 h-3.5 rounded-full bg-rose-600 border ${theme === 'ruby-red' ? 'border-white scale-110 shadow-md shadow-rose-500/50' : 'border-border-subtle'} transition-all cursor-pointer`}
                  title="Charcoal & Ruby"
                />
              </div>

              {/* Day / Night Toggle Button */}
              <button 
                type="button"
                onClick={() => setDayNight(prev => prev === 'day' ? 'night' : 'day')}
                title={dayNight === 'day' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className={`w-[220px] px-3 py-1.5 rounded-xl font-bold flex items-center justify-between transition-all cursor-pointer ${
                  dayNight === 'day' 
                    ? 'bg-surface-elevated border-border-subtle text-amber-400 hover:bg-surface hover:text-amber-300 shadow-sm shadow-black/25' 
                    : 'bg-surface-elevated border-border-subtle text-indigo-600 hover:bg-surface hover:text-indigo-700 shadow-sm'
                }`}
              >
                {dayNight === 'day' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>

              {/* Contextual Options */}
              <div className="flex items-center gap-3">
                {/* Segmented Layout Selector */}
                <div className="flex items-center bg-surface-elevated p-1 rounded-lg border border-border-subtle">
                  <button 
                    type="button"
                    onClick={() => setLayoutMode('phone-only')}
                    className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'phone-only' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-text-secondary hover:text-text-primary'}`}
                    title="Show Mobile App Only"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">App Only</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLayoutMode('dashboard-only')}
                    className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'dashboard-only' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-text-secondary hover:text-text-primary'}`}
                    title="Show Dashboard Only"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Dashboard Only</span>
                  </button>
                  {userRole === 'shahroz' && (
                    <button 
                      type="button"
                      onClick={() => setLayoutMode('roadmap-only')}
                      className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'roadmap-only' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-text-secondary hover:text-text-primary'}`}
                      title="Show Launch Roadmap Only"
                    >
                      <Milestone className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Launch Roadmap</span>
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setLayoutMode('side-by-side')}
                    className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'side-by-side' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-text-secondary hover:text-text-primary'}`}
                    title="Show Side-by-Side Layout"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Side-by-Side</span>
                  </button>
                </div>
                
                <button 
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('ids_pulse_db');
                    initializeDB();
                    window.dispatchEvent(new Event('ids_pulse_db_update'));
                  }}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary bg-surface-elevated border border-border-subtle py-1.5 px-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                  title="Clear and reset local database"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('ids_pulse_unlocked');
                    sessionStorage.removeItem('ids_pulse_role');
                    sessionStorage.removeItem('ids_pulse_rep_id');
                    sessionStorage.removeItem('ids_pulse_customer_id');
                    window.location.reload();
                  }}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-red-400 bg-surface-elevated border border-border-subtle py-1.5 px-2.5 rounded-lg text-sm cursor-pointer transition-colors"
                  title="Lock Application Session"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400/85" />
                  <span className="hidden md:inline text-red-400/85 font-bold">Lock Session</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Layout Area */}
      <main className={isMobileDevice ? "flex-1 w-full min-h-screen p-0 m-0 bg-slate-50" : "flex-1 flex items-stretch justify-center p-4 lg:p-6 w-full min-h-0"}>
        <div className={isMobileDevice ? "w-full h-full min-h-screen" : "flex flex-col lg:flex-row gap-8 w-full items-stretch justify-center min-h-0"}>
          
          {/* Phone Column */}
          {(layoutMode === 'side-by-side' || layoutMode === 'phone-only') && (
            <div className={isMobileDevice ? "w-full h-full min-h-screen" : "flex-shrink-0 flex items-center justify-center py-4 mx-auto lg:mx-0"}>
              <div className={isMobileDevice ? "w-full h-full min-h-screen flex flex-col" : "flex flex-col items-center"}>
                {!isMobileDevice && (
                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2">Clarence's Phone (Mobile App)</span>
                )}
                <ErrorBoundary>
                  <PhoneSimulator 
                    isOffline={isOffline} 
                    setIsOffline={setIsOffline}
                    dbUpdateTrigger={dbUpdateTrigger}
                    isNativeMobile={isMobileDevice}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Web Dashboard Column */}
          {(!isMobileDevice && (layoutMode === 'side-by-side' || layoutMode === 'dashboard-only')) && (
            <div className="flex-1 w-full flex flex-col min-h-0">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2 pl-2">
                {userRole === 'accountant' ? "Colleen's Dashboard (Web CRM Portal)" :
                 userRole === 'lead' ? "Donna's Dashboard (Web CRM Portal)" :
                 userRole === 'shahroz' ? "Shahroz's Super Admin Dashboard (Web CRM Portal)" :
                 userRole === 'rep' ? "QRE Representative Portal" :
                 userRole === 'customer' ? "Customer Quality Portal" :
                 "Greg's Admin Dashboard (Web CRM Portal)"}
              </span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} userRole={userRole} currentUserRepId={currentUserRepId} currentUserCustomerId={currentUserCustomerId} layoutMode={layoutMode} /></ErrorBoundary>
            </div>
          )}

          {/* Launch Roadmap Column */}
          {(!isMobileDevice && layoutMode === 'roadmap-only' && userRole === 'shahroz') && (
            <div className="flex-1 w-full flex flex-col min-h-0">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2 pl-2">IDS Pulse Project Launch Roadmap & Timeline</span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} forceRoadmapOnly={true} userRole={userRole} layoutMode={layoutMode} /></ErrorBoundary>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
