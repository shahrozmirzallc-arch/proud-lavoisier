import React, { useState, useEffect } from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import WebDashboard from './components/WebDashboard';
import { initializeDB, syncWithSupabase, supabase } from './components/SharedDatabase';
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
    if (typeof window !== 'undefined' && (
      window.Capacitor?.isNativePlatform?.() ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    )) {
      return 'phone-only';
    }
    return 'dashboard-only';
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

  // Auth State (Strictly Managed via Supabase Auth Session)
  const [currentUser, setCurrentUser] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentUserRepId, setCurrentUserRepId] = useState('');
  const [currentUserCustomerId, setCurrentUserCustomerId] = useState('');
  const [systemUsername, setSystemUsername] = useState('');
  const [systemPassword, setSystemPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

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

  // Helper to purge stale session keys from storage (preserving data cache and offline queues)
  const clearStaleSessionStorage = () => {
    try {
      const protectedKeys = [
        'ids_pulse_db',
        'ids_pulse_db_version',
        'ids_pulse_theme',
        'ids_pulse_daynight',
        'ids_pulse_offline_queue',
        'ids_pulse_sqlite_outbox_v2'
      ];
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('ids_pulse_') && !protectedKeys.includes(key)) {
          sessionStorage.removeItem(key);
        }
      });
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ids_pulse_') && !protectedKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Storage purge warning:", e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const appMeta = session.user.app_metadata || {};
          const role = appMeta.role || 'customer';
          const targetUser = appMeta.username || '';
          const repId = appMeta.rep_id || (targetUser === 'clarence' ? '1' : `rep_${targetUser}`);
          const custId = appMeta.customer_id || targetUser;

          setIsUnlocked(true);
          setAuthError(false);
          setUserRole(role);
          setCurrentUser({
            id: role === 'rep' ? repId : custId,
            name: appMeta.full_name || targetUser || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            role: role
          });
        }
      } catch (err) {
        console.error('[App Auth Session Init Error]:', err);
      } finally {
        setAuthChecking(false);
      }
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const appMeta = session.user.app_metadata || {};
        const role = appMeta.role || 'customer';
        const targetUser = appMeta.username || '';
        const repId = appMeta.rep_id || (targetUser === 'clarence' ? '1' : `rep_${targetUser}`);
        const custId = appMeta.customer_id || targetUser;

        setIsUnlocked(true);
        setAuthError(false);
        setUserRole(role);
        setCurrentUser({
          id: role === 'rep' ? repId : custId,
          name: appMeta.full_name || targetUser || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: role
        });
      } else if (event === 'SIGNED_OUT') {
        clearStaleSessionStorage();
        setIsUnlocked(false);
        setUserRole(null);
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignedIn = async ({ username, password }) => {
    const inputUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const rawPw = password.trim();

    try {
      clearStaleSessionStorage();

      const dbData = JSON.parse(localStorage.getItem('ids_pulse_db') || '{}');
      const localUsers = dbData.users || [];
      
      const allKnownUsers = [
        { id: 'admin_1', name: 'Shahroz Mirza', email: 'smirza@integritydriven.com', username: 'shahroz', role: 'super_admin' },
        { id: '24', name: 'Donna Cabral', email: 'dcabral@integritydriven.com', username: 'donna', role: 'lead' },
        { id: 'lead_diana', name: 'Diana Operations Lead', email: 'diana@goto-ids.com', username: 'diana', role: 'lead' },
        { id: 'owner_1', name: 'Greg Phillippe', email: 'gphillippe@integritydriven.com', username: 'greg', role: 'owner' },
        { id: 'acct_1', name: 'Colleen Boyd', email: 'cboyd@integritydriven.com', username: 'colleen', role: 'accountant' },
        { id: 'rep_clarence', name: 'Clarence Kuiken', email: 'ckuiken@integritydriven.com', username: 'clarence', role: 'rep', title: 'Quality Inspector' },
        { id: 'cust_1', name: 'Client Partner', email: 'client@fictionalclient.com', username: 'customer', role: 'customer', title: 'Client Quality Manager' },
        ...localUsers
      ];

      const matchedUser = allKnownUsers.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uEmailPrefix = uEmail.split('@')[0];
        const uFullName = (u.name || '').toLowerCase().replace(/\s+/g, '');

        return (
          uName === inputUser ||
          uEmail === inputUser ||
          uEmailPrefix === inputUser ||
          uFullName === inputUser ||
          (inputUser === 'shahroz' && u.id === 'admin_1') ||
          ((inputUser === 'donna' || inputUser === 'dcabral') && u.id === '24') ||
          ((inputUser === 'diana') && (u.id === 'lead_diana' || uName === 'diana')) ||
          ((inputUser === 'greg' || inputUser === 'gphillippe') && u.id === 'owner_1') ||
          ((inputUser === 'colleen' || inputUser === 'cboyd') && u.id === 'acct_1') ||
          ((inputUser === 'clarence' || inputUser === 'ckuiken') && (u.id === 'rep_clarence' || uName === 'clarence')) ||
          ((inputUser === 'customer' || inputUser === 'client') && (u.id === 'cust_1' || u.role === 'customer'))
        );
      });

      // Reject deactivated users
      if (matchedUser && (matchedUser.is_deactivated || matchedUser.status === 'deactivated')) {
        console.warn("[Auth Security]: Deactivated user login rejected:", inputUser);
        setAuthError(true);
        return false;
      }

      // Determine target email for authenticating with Supabase Auth
      let targetEmail = matchedUser?.email || (inputUser.includes('@') ? inputUser : null);
      if (!targetEmail) {
        if (inputUser === 'shahroz') targetEmail = 'smirza@integritydriven.com';
        else if (inputUser === 'admin') targetEmail = 'admin@goto-ids.com';
        else if (inputUser === 'greg' || inputUser === 'owner') targetEmail = 'gphillippe@integritydriven.com';
        else if (inputUser === 'donna') targetEmail = 'dcabral@integritydriven.com';
        else if (inputUser === 'diana') targetEmail = 'diana@goto-ids.com';
        else if (inputUser === 'colleen') targetEmail = 'cboyd@integritydriven.com';
        else if (inputUser === 'clarence') targetEmail = 'ckuiken@integritydriven.com';
        else if (inputUser === 'customer' || inputUser === 'client') targetEmail = 'client@fictionalclient.com';
      }

      // Check explicit Demo Auth flag
      const isDemoAuthEnabled = typeof import.meta !== 'undefined' && (import.meta.env?.VITE_ENABLE_DEMO_AUTH === 'true' || import.meta.env?.DEV);

      // Attempt Real Supabase Auth Authentication
      if (targetEmail) {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: rawPw
        });

        if (!authErr && authData?.session && authData?.user) {
          const user = authData.user;
          const appMeta = user.app_metadata || {};
          let loginType = appMeta.role || matchedUser?.role || 'customer';
          if (targetEmail === 'smirza@integritydriven.com' || inputUser === 'shahroz') {
            loginType = 'super_admin';
          }
          const targetUser = appMeta.username || inputUser;
          const repId = appMeta.rep_id || (targetUser === 'clarence' ? 'rep_clarence' : `rep_${targetUser}`);
          const custId = appMeta.customer_id || 'supplier_fictional_101';

          setIsUnlocked(true);
          setAuthError(false);
          setUserRole(loginType);
          setCurrentUser({
            id: loginType === 'rep' ? repId : (matchedUser?.id || custId),
            name: appMeta.full_name || matchedUser?.name || targetUser,
            email: user.email,
            role: loginType
          });

          if (loginType === 'rep') {
            setCurrentUserRepId(repId);
            setLayoutMode('phone-only');
          } else {
            setLayoutMode('dashboard-only');
          }

          syncWithSupabase(true, loginType, loginType === 'rep' ? repId : '', loginType === 'customer' ? custId : '', authData.session.access_token);
          return true;
        }
      }

      // Controlled Demo Fallback (ONLY if explicit VITE_ENABLE_DEMO_AUTH flag or DEV mode AND valid demo password 'password123')
      if (isDemoAuthEnabled && matchedUser && rawPw === 'password123') {
        const normRole = matchedUser.username === 'shahroz' || matchedUser.id === 'admin_1' ? 'super_admin' : (matchedUser.role || 'lead');
        setIsUnlocked(true);
        setAuthError(false);
        setUserRole(normRole);
        setCurrentUser(matchedUser);
        if (normRole === 'rep') {
          setCurrentUserRepId(matchedUser.id);
          setLayoutMode('phone-only');
        } else {
          setLayoutMode('dashboard-only');
        }
        return true;
      }

      // WRONG PASSWORD / UNKNOWN USER -> REJECT!
      setAuthError(true);
      return false;
    } catch (err) {
      console.error("[Supabase Auth Execution Error]:", err);
      setAuthError(true);
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
    <div className="min-h-screen text-text-primary flex flex-col font-sans bg-bg transition-colors duration-300">
      
      {/* Desktop Navigation Header */}
      {!isMobileDevice && (
        <header className="bg-surface/95 backdrop-blur-md border-b border-border-subtle sticky top-0 z-30 px-4 py-2.5 lg:px-6 shadow-sm transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* System Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/20 text-white flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-text-primary uppercase">IDS Pulse Operations Suite</h1>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary font-medium">Enterprise quality tracking, audit metrics, and field dispatch operations.</p>
              </div>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {/* Dynamic Theme Switcher */}
              <div className="flex items-center gap-1.5 bg-surface-elevated p-1.5 rounded-lg border border-border-subtle shadow-xs">
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
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer border text-xs shadow-xs ${
                  dayNight === 'day' 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
                }`}
              >
                {dayNight === 'day' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>

              {/* Contextual Options */}
              <div className="flex items-center gap-3">
                {/* Segmented Layout Selector (Admin/Staff Roles Only) */}
                {['admin', 'owner', 'accountant', 'lead', 'shahroz', 'super_admin'].includes(userRole) && (
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
                )}
                
                <button 
                  type="button"
                  onClick={async () => {
                    clearStaleSessionStorage();
                    await supabase.auth.signOut();
                    setIsUnlocked(false);
                    setCurrentUser(null);
                    setUserRole('');
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
          
          {/* Phone Column (Rendered for Reps or Staff layout modes) */}
          {(userRole === 'rep' || (userRole !== 'customer' && (layoutMode === 'side-by-side' || layoutMode === 'phone-only'))) && (
            <div className={isMobileDevice ? "w-full h-full min-h-screen" : "flex-shrink-0 flex items-center justify-center py-4 mx-auto lg:mx-0"}>
              <div className={isMobileDevice ? "w-full h-full min-h-screen flex flex-col" : "flex flex-col items-center"}>
                {!isMobileDevice && (
                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2">Field Inspector App</span>
                )}
                <ErrorBoundary>
                  <PhoneSimulator 
                    isOffline={isOffline} 
                    setIsOffline={setIsOffline}
                    dbUpdateTrigger={dbUpdateTrigger}
                    isNativeMobile={isMobileDevice}
                    currentUser={currentUser}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Web Dashboard Column (Rendered for Customers or Staff layout modes) */}
          {(userRole === 'customer' || (userRole !== 'rep' && (layoutMode === 'side-by-side' || layoutMode === 'dashboard-only'))) && (
            <div className="flex-1 w-full flex flex-col min-h-0">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2 pl-2">
                {userRole === 'customer' ? "Customer Quality Portal" :
                 userRole === 'rep' ? "QRE Representative Portal" :
                 userRole === 'accountant' ? "Colleen's Dashboard (Web CRM Portal)" :
                 userRole === 'lead' ? "Donna's Dashboard (Web CRM Portal)" :
                 userRole === 'shahroz' ? "Shahroz's Super Admin Dashboard (Web CRM Portal)" :
                 "Greg's Admin Dashboard (Web CRM Portal)"}
              </span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} userRole={userRole} currentUserRepId={currentUserRepId} currentUserCustomerId={currentUserCustomerId} currentUser={currentUser} layoutMode={layoutMode} /></ErrorBoundary>
            </div>
          )}

          {/* Launch Roadmap Column */}
          {(!isMobileDevice && layoutMode === 'roadmap-only' && userRole === 'shahroz') && (
            <div className="flex-1 w-full flex flex-col min-h-0">
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2 pl-2">IDS Pulse Project Launch Roadmap & Timeline</span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} forceRoadmapOnly={true} userRole={userRole} currentUser={currentUser} layoutMode={layoutMode} /></ErrorBoundary>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
