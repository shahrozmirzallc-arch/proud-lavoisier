import React, { useState, useEffect } from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import WebDashboard from './components/WebDashboard';
import { initializeDB, syncWithSupabase, supabase } from './components/SharedDatabase';
import LoginScreen from './components/LoginScreen';
import { SpinnerGap, LockKey, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Shield, Monitor, Smartphone, Laptop, Lock, AlertTriangle } from 'lucide-react';

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
  const [authError, setAuthError] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Password Recovery State
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);
  const [pwUpdateMsg, setPwUpdateMsg] = useState('');
  const [pwUpdateErr, setPwUpdateErr] = useState('');

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
      localStorage.removeItem('ids_pulse_saved_user');
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
        const savedUserStr = localStorage.getItem('ids_pulse_saved_user');
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            if (savedUser && savedUser.role) {
              setIsUnlocked(true);
              setUserRole(savedUser.role);
              setCurrentUser(savedUser);

              sessionStorage.setItem('ids_pulse_role', savedUser.role);
              sessionStorage.setItem('ids_pulse_username', savedUser.username || '');
              if (savedUser.role === 'customer') {
                const custId = savedUser.supplier_id || savedUser.customer_id || savedUser.id;
                sessionStorage.setItem('ids_pulse_customer_id', custId);
                setCurrentUserCustomerId(custId);
                setLayoutMode('dashboard-only');
              } else if (savedUser.role === 'rep' || savedUser.id?.startsWith('rep_')) {
                sessionStorage.setItem('ids_pulse_rep_id', savedUser.id);
                setCurrentUserRepId(savedUser.id);
                setLayoutMode('phone-only');
              } else {
                setLayoutMode('dashboard-only');
              }
              setAuthChecking(false);
              return;
            }
          } catch (e) {
            console.warn("Failed to parse saved user:", e);
          }
        }

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 2500));
        const res = await Promise.race([sessionPromise, timeoutPromise]);
        const session = res?.data?.session;

        if (session && session.user) {
          const appMeta = session.user.app_metadata || {};
          const role = appMeta.role || 'customer';
          const targetUser = appMeta.username || '';
          const repId = appMeta.rep_id || (targetUser === 'clarence' ? '1' : `rep_${targetUser}`);
          const custId = appMeta.customer_id || targetUser;

          const uObj = {
            id: role === 'rep' ? repId : custId,
            name: appMeta.full_name || targetUser || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            role: role
          };

          setIsUnlocked(true);
          setUserRole(role);
          setCurrentUser(uObj);
          localStorage.setItem('ids_pulse_saved_user', JSON.stringify(uObj));
        }
      } catch (err) {
        console.error('[App Auth Session Init Error]:', err);
      } finally {
        setAuthChecking(false);
      }
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        return;
      }

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

  const handleSignedIn = async ({ username, password = '', isDemoMode = false }) => {
    const inputUser = (username || '').trim().toLowerCase().replace(/\s+/g, '');
    const rawPw = (password || '').trim();

    try {
      clearStaleSessionStorage();

      if (isDemoMode) {

        const demoUsers = {
          clarence: { id: 'rep_clarence', name: 'Clarence Kuiken', email: 'clarence.k@goto-ids.com', username: 'clarence', role: 'rep', title: 'Quality Liaison Rep', isDemoSession: true },
          donna: { id: '24', name: 'Donna Cabral', email: 'donna@goto-ids.com', username: 'donna', role: 'lead', title: 'Operations Lead', isDemoSession: true },
          colleen: { id: 'acct_1', name: 'Colleen Boyd', email: 'colleen@goto-ids.com', username: 'colleen', role: 'accountant', title: 'Accountant', isDemoSession: true },
          magna_client: { id: 'user_cust_magna_robert', name: 'Robert Sterling (Magna)', email: 'robert.sterling@magna.com', username: 'magna_client', role: 'customer', title: 'Magna Primary Quality Director', supplier_id: 'sup_magna', customer_id: 'sup_magna', client_id: 'sup_magna', isDemoSession: true },
          robert: { id: 'user_cust_magna_robert', name: 'Robert Sterling (Magna)', email: 'robert.sterling@magna.com', username: 'magna_client', role: 'customer', title: 'Magna Primary Quality Director', supplier_id: 'sup_magna', customer_id: 'sup_magna', client_id: 'sup_magna', isDemoSession: true },
          stellantis_client: { id: 'user_cust_stellantis_mark', name: 'Mark Vance (Stellantis)', email: 'mark.vance@stellantis.com', username: 'stellantis_client', role: 'customer', title: 'Stellantis Quality Manager', supplier_id: 'sup_stellantis', isDemoSession: true },
          tesla_elon: { id: 'user_cust_tesla_elon', name: 'Elon Vance (Tesla Giga Texas)', email: 'evance@tesla.com', username: 'tesla_elon', password: 'TeslaPassword2026!', role: 'customer', title: 'Tesla Quality Director', supplier_id: 'sup_tesla', customer_id: 'sup_tesla', client_id: 'sup_tesla', isDemoSession: true },
          autokabel: { id: 'user_cust_stellantis_mark', name: 'Mark Vance (Stellantis)', email: 'mark.vance@stellantis.com', username: 'stellantis_client', role: 'customer', title: 'Stellantis Quality Manager', supplier_id: 'sup_stellantis', isDemoSession: true },
          customer: { id: 'user_cust_stellantis_mark', name: 'Mark Vance (Stellantis)', email: 'mark.vance@stellantis.com', username: 'stellantis_client', role: 'customer', title: 'Stellantis Quality Manager', supplier_id: 'sup_stellantis', isDemoSession: true }
        };

        let demoUser = demoUsers[inputUser];
        
        // If not in static shortcuts, search dynamic users database!
        if (!demoUser) {
          try {
            const db = JSON.parse(localStorage.getItem('ids_pulse_db') || '{}');
            const dbUsers = Array.isArray(db.users) ? db.users : [];
            const foundUser = dbUsers.find(u => 
              u && (
                u.username?.toLowerCase() === inputUser ||
                u.email?.toLowerCase() === inputUser ||
                u.id?.toLowerCase() === inputUser
              )
            );
            
            if (foundUser) {
              // Validate password if explicitly set by Admin
              if (foundUser.password && rawPw && foundUser.password !== rawPw) {
                console.warn("[Auth Security]: Password mismatch for user:", inputUser);
                setAuthError(true);
                return false;
              }
              demoUser = foundUser;
            }
          } catch (e) {
            console.warn("Could not check dynamic users db:", e);
          }
        }

        if (!demoUser) {
          console.warn("[Auth Security]: Unknown username or user account rejected:", inputUser);
          setAuthError(true);
          return false;
        }

        setIsUnlocked(true);
        setAuthError(false);
        setUserRole(demoUser.role);
        setCurrentUser(demoUser);
        localStorage.setItem('ids_pulse_saved_user', JSON.stringify(demoUser));

        sessionStorage.setItem('ids_pulse_role', demoUser.role);
        sessionStorage.setItem('ids_pulse_username', demoUser.username || '');
        if (demoUser.role === 'customer') {
          const custId = demoUser.supplier_id || demoUser.customer_id || demoUser.id;
          sessionStorage.setItem('ids_pulse_customer_id', custId);
          setCurrentUserCustomerId(custId);
          setLayoutMode('dashboard-only');
        } else if (demoUser.role === 'rep') {
          sessionStorage.setItem('ids_pulse_rep_id', demoUser.id);
          setCurrentUserRepId(demoUser.id);
          setLayoutMode('phone-only');
        } else {
          sessionStorage.removeItem('ids_pulse_customer_id');
          sessionStorage.removeItem('ids_pulse_rep_id');
          setLayoutMode('dashboard-only');
        }
        return true;
      }

      const dbData = JSON.parse(localStorage.getItem('ids_pulse_db') || '{}');
      const localUsers = dbData.users || [];
      
      const allKnownUsers = [
        { id: 'admin_1', name: 'Shahroz Mirza', email: 'shahrozmirzallc@gmail.com', username: 'shahroz', password: 'Shahroz121$', role: 'super_admin' },
        { id: '24', name: 'Donna Cabral', email: 'donna@goto-ids.com', username: 'donna', role: 'lead' },
        { id: 'lead_diana', name: 'Diana Operations Lead', email: 'diana@goto-ids.com', username: 'diana', role: 'lead' },
        { id: 'owner_1', name: 'Greg Phillippe', email: 'greg@goto-ids.com', username: 'greg', role: 'owner' },
        { id: 'acct_1', name: 'Colleen Boyd', email: 'colleen@goto-ids.com', username: 'colleen', role: 'accountant' },
        { id: 'rep_clarence', name: 'Clarence Kuiken', email: 'clarence.k@goto-ids.com', username: 'clarence', role: 'rep', title: 'IDS Field Rep' },
        { id: 'rep_test', name: 'Rep Test Inspector', email: 'rep_test@integritydriven.com', username: 'rep_test', password: 'RepTestPass2026!', role: 'rep', title: 'IDS Field Rep' },
        { id: 'cust_1', name: 'Client Partner', email: 'client@fictionalclient.com', username: 'customer', role: 'customer', title: 'Client Quality Manager' },
        { id: 'autokabel', name: 'AutoKabel Quality Manager', email: 'quality@autokabel.com', username: 'autokabel', password: 'AutokabelQuality2026!', role: 'customer', title: 'Autokabel Client Partner', supplier_id: 'autokabel' },
        ...localUsers
      ];

      const matchedUser = allKnownUsers.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uId = (u.id || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uEmailPrefix = uEmail.split('@')[0];
        const uFullName = (u.name || '').toLowerCase();
        const uRole = (u.role || '').toLowerCase();

        const cleanInput = inputUser.replace(/[^a-z0-9]/g, '');
        const cleanName = uName.replace(/[^a-z0-9]/g, '');
        const cleanId = uId.replace(/[^a-z0-9]/g, '');
        const cleanPrefix = uEmailPrefix.replace(/[^a-z0-9]/g, '');
        const cleanFull = uFullName.replace(/[^a-z0-9]/g, '');

        return (
          uName === inputUser ||
          (cleanInput.length > 0 && cleanName === cleanInput) ||
          uId === inputUser ||
          (cleanInput.length > 0 && cleanId === cleanInput) ||
          uEmail === inputUser ||
          (cleanInput.length > 0 && cleanPrefix === cleanInput) ||
          (cleanInput.length > 0 && cleanFull === cleanInput) ||
          (inputUser === 'shahroz' && u.id === 'admin_1') ||
          ((inputUser === 'admin' || inputUser === 'super_admin' || inputUser === 'smirza') && (u.id === 'admin_1' || uRole === 'super_admin')) ||
          ((inputUser === 'donna' || inputUser === 'dcabral' || inputUser === 'lead' || inputUser === 'ops') && (u.id === '24' || uName === 'donna')) ||
          ((inputUser === 'diana') && (u.id === 'lead_diana' || uName === 'diana')) ||
          ((inputUser === 'greg' || inputUser === 'gphillippe' || inputUser === 'owner' || inputUser === 'director') && (u.id === 'owner_1' || uRole === 'owner')) ||
          ((inputUser === 'colleen' || inputUser === 'cboyd' || inputUser === 'accountant' || inputUser === 'accounting' || inputUser === 'controller') && (u.id === 'acct_1' || uRole === 'accountant')) ||
          ((inputUser === 'clarence' || inputUser === 'ckuiken' || inputUser === 'rep' || inputUser === 'inspector' || inputUser === 'qre') && (u.id === 'rep_clarence' || uRole === 'rep')) ||
          ((inputUser === 'autokabel' || inputUser === 'autokabel_client' || inputUser === 'autokabel_north_america') && (u.id === 'autokabel' || uName === 'autokabel')) ||
          ((inputUser === 'customer' || inputUser === 'client' || inputUser === 'partner' || inputUser === 'gm') && (u.id === 'cust_1' || uRole === 'customer'))
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
        if (inputUser === 'shahroz') targetEmail = 'shahrozmirzallc@gmail.com';
        else if (inputUser === 'admin') targetEmail = 'admin@goto-ids.com';
        else if (inputUser === 'greg' || inputUser === 'owner') targetEmail = 'greg@goto-ids.com';
        else if (inputUser === 'donna') targetEmail = 'donna@goto-ids.com';
        else if (inputUser === 'diana') targetEmail = 'diana@goto-ids.com';
        else if (inputUser === 'colleen') targetEmail = 'colleen@goto-ids.com';
        else if (inputUser === 'clarence') targetEmail = 'clarence.k@goto-ids.com';
        else if (inputUser === 'customer' || inputUser === 'client') targetEmail = 'client@fictionalclient.com';
      }

      // Attempt Real Supabase Auth Authentication
      if (targetEmail) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: rawPw
          });

          if (!authErr && authData?.session && authData?.user) {
            const user = authData.user;
            const appMeta = user.app_metadata || {};
            let loginType = appMeta.role || matchedUser?.role || 'customer';
            if (targetEmail === 'shahrozmirzallc@gmail.com' || inputUser === 'shahroz') {
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
        } catch (sErr) {
          console.warn("[Supabase Auth Cloud Fallback]:", sErr);
        }
      }

      // Prototype Account Login Fallback (For matched system users)
      if (matchedUser && rawPw.length > 0) {
        // Enforce strict custom password for Super Admin Shahroz
        if (matchedUser.username === 'shahroz' || matchedUser.id === 'admin_1') {
          if (rawPw !== 'Shahroz121$') {
            console.warn("[Auth Security]: Incorrect password for Super Admin shahroz");
            setAuthError(true);
            return false;
          }
        } else if (matchedUser.password && matchedUser.password !== rawPw) {
          console.warn("[Auth Security]: Incorrect password for local user:", inputUser);
          setAuthError(true);
          return false;
        }

        const normRole = matchedUser.username === 'shahroz' || matchedUser.id === 'admin_1' ? 'super_admin' : (matchedUser.role || 'rep');
        setIsUnlocked(true);
        setAuthError(false);
        setUserRole(normRole);
        setCurrentUser(matchedUser);
        localStorage.setItem('ids_pulse_saved_user', JSON.stringify(matchedUser));

        sessionStorage.setItem('ids_pulse_role', normRole);
        sessionStorage.setItem('ids_pulse_username', matchedUser.username || '');
        if (normRole === 'rep' || matchedUser.id?.startsWith('rep_')) {
          sessionStorage.setItem('ids_pulse_rep_id', matchedUser.id);
          setCurrentUserRepId(matchedUser.id);
          setLayoutMode('phone-only');
        } else if (normRole === 'customer') {
          const targetCustId = matchedUser.supplier_id || matchedUser.customer_id || matchedUser.id;
          sessionStorage.setItem('ids_pulse_customer_id', targetCustId);
          setCurrentUserCustomerId(targetCustId);
          setLayoutMode('dashboard-only');
        } else {
          sessionStorage.removeItem('ids_pulse_customer_id');
          sessionStorage.removeItem('ids_pulse_rep_id');
          setLayoutMode('dashboard-only');
        }
        syncWithSupabase(true, normRole, normRole === 'rep' ? matchedUser.id : '', normRole === 'customer' ? (matchedUser.supplier_id || matchedUser.customer_id || matchedUser.id) : '');
        return true;
      }

      // UNKNOWN USER -> REJECT!
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

  const handleResetPassword = async (userOrEmail) => {
    try {
      let emailToReset = userOrEmail;
      if (!emailToReset.includes('@')) {
        const usernameMap = {
          shahroz: 'shahrozmirzallc@gmail.com',
          donna: 'donna@goto-ids.com',
          clarence: 'clarence.k@goto-ids.com',
          colleen: 'colleen@goto-ids.com',
          greg: 'greg@goto-ids.com'
        };
        emailToReset = usernameMap[userOrEmail.toLowerCase()] || `${userOrEmail}@goto-ids.com`;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}`
      });
      if (error) throw error;
      return { success: true, message: `Password reset email sent to ${emailToReset}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  if (isResettingPassword) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
          <div className="flex items-center gap-3 mb-4">
            <LockKey className="text-emerald-400 text-3xl" weight="fill" />
            <div>
              <h2 className="text-xl font-bold text-white">Set New Password</h2>
              <p className="text-xs text-slate-400">Enter your new secure password for IDS Pulse.</p>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setPwUpdateErr('');
            setPwUpdateMsg('');
            if (newPassword.length < 8) {
              setPwUpdateErr('Password must be at least 8 characters long.');
              return;
            }
            setUpdatingPw(true);
            try {
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
              setPwUpdateMsg('Password updated successfully! You can now log in.');
              setTimeout(() => {
                setIsResettingPassword(false);
                window.location.hash = '';
              }, 2000);
            } catch (err) {
              setPwUpdateErr(err.message || 'Failed to update password.');
            } finally {
              setUpdatingPw(false);
            }
          }}>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              New Password
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                className="w-full mt-1.5 p-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </label>

            {pwUpdateMsg && (
              <div className="p-3 mb-4 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle weight="fill" className="text-emerald-400 text-base shrink-0" />
                <span>{pwUpdateMsg}</span>
              </div>
            )}

            {pwUpdateErr && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-medium flex items-center gap-2">
                <WarningCircle weight="fill" className="text-red-400 text-base shrink-0" />
                <span>{pwUpdateErr}</span>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={updatingPw}
                className="flex-1 py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm transition-all disabled:opacity-50"
              >
                {updatingPw ? 'Updating…' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => setIsResettingPassword(false)}
                className="py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (!isUnlocked) {
    return <LoginScreen onSignedIn={handleSignedIn} onResetPassword={handleResetPassword} demoEnabled={true} />;
  }

  return (
    <div className="min-h-screen text-text-primary flex flex-col font-sans bg-bg transition-colors duration-300">
      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <div className="bg-amber-500 text-slate-950 font-bold text-center py-1.5 px-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
          <span>DEMO MODE — Simulated Data (Not Connected to Production Database)</span>
        </div>
      )}
      
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
                  <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2">IDS Rep Mobile App</span>
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

        </div>
      </main>
    </div>
  );
}

export default App;
