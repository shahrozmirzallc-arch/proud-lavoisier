import React, { useState, useEffect } from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import WebDashboard from './components/WebDashboard';
import { initializeDB } from './components/SharedDatabase';
import { Shield, Activity, Monitor, Smartphone, RefreshCw, Laptop, Milestone, Lock, Key, Sun, Moon } from 'lucide-react';

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
  const [layoutMode, setLayoutMode] = useState(() => {
    const role = sessionStorage.getItem('ids_pulse_role') || 'admin';
    const unlocked = sessionStorage.getItem('ids_pulse_unlocked') === 'true';
    if (unlocked && role !== 'qre' && role !== 'rep') {
      return 'dashboard-only';
    }
    return 'side-by-side';
  }); // 'side-by-side' | 'phone-only' | 'dashboard-only' | 'roadmap-only'
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
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true');
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('ids_pulse_role') || 'admin');
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

  if (!isUnlocked) {
    const isLight = dayNight === 'night';
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300" 
        style={{ 
          backgroundColor: isLight ? '#f3f4f6' : '#0f172a'
        }}
      >
        {/* Global Theme Toggle Button */}
        <div className="absolute top-6 right-8 z-50">
          <button 
            type="button"
            onClick={() => setDayNight(prev => prev === 'day' ? 'night' : 'day')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-mono text-[10px] font-bold select-none cursor-pointer uppercase tracking-wider ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Night Mode (Dark)</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Day Mode (Light)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Content Card - Option E Tesla Clean Tech Style (Expanded Spaces) */}
        <div className={`w-full max-w-[460px] border p-12 flex flex-col gap-10 relative z-10 transition-all rounded-none ${
          isLight 
            ? 'bg-white border-slate-200 shadow-sm text-slate-900' 
            : 'bg-slate-900 border-slate-800 shadow-lg text-white'
        }`}>
          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 flex items-center justify-center relative">
              <Shield className={`w-12 h-12 ${isLight ? 'text-blue-600' : 'text-blue-500'}`} style={{ strokeWidth: 1.5 }} />
              <Lock className={`w-4 h-4 absolute bottom-0.5 right-0.5 p-0.5 rounded-full ${
                isLight ? 'text-blue-600 bg-white' : 'text-blue-500 bg-slate-900'
              }`} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tighter mb-2">IDS PULSE SECURITY GATEWAY</h1>
              <p className={`text-xs leading-relaxed max-w-[320px] mx-auto ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                This terminal is encrypted. Please authenticate to initialize dashboard and simulator session.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const inputUser = systemUsername.trim().toLowerCase().replace(/\s+/g, '');
              const rawPw = systemPassword.trim();
              const inputPw = rawPw.toLowerCase().replace(/\s+/g, '');
              
              // Verify raw input
              const msgBuffer = new TextEncoder().encode(rawPw);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              // Verify space-removed raw input for tolerance
              const spaceRemovedRaw = rawPw.replace(/\s+/g, '');
              const cleanBuffer = new TextEncoder().encode(spaceRemovedRaw);
              const cleanHashBuffer = await crypto.subtle.digest('SHA-256', cleanBuffer);
              const cleanHashHex = Array.from(new Uint8Array(cleanHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
              
              // Shahroz's Password Hash (Shahroz123$)
              const isShahrozPw = (
                hashHex === '3dc913cc6d99a4f6fa13c07c646c8efa8b9410d323c484dfc1fef45322782131' ||
                cleanHashHex === '3dc913cc6d99a4f6fa13c07c646c8efa8b9410d323c484dfc1fef45322782131'
              );

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
                brose: '314ac53360d6111f3be1678d7a96aa6d3886921327a04bc488d0ead1eb930373' // Brose2026!
              };

              const isValidSpecificAdmin = adminHashes[inputUser] && (hashHex === adminHashes[inputUser] || cleanHashHex === adminHashes[inputUser]);
              const isValidSpecificRep = repHashes[inputUser] && (hashHex === repHashes[inputUser] || cleanHashHex === repHashes[inputUser]);
              const isValidSpecificCustomer = customerHashes[inputUser] && (hashHex === customerHashes[inputUser] || cleanHashHex === customerHashes[inputUser]);

              // Setup login target
              let targetUser = inputUser;
              let isAuthorized = false;
              let loginType = ''; // 'admin', 'rep', 'customer'

              // If username is blank, check if the password is one of the key hashes
              if (!targetUser) {
                if (adminHashes['diana'] === hashHex) {
                  targetUser = 'diana';
                  isAuthorized = true;
                  loginType = 'admin';
                } else if (isShahrozPw) {
                  targetUser = 'greg'; // fallback default admin
                  isAuthorized = true;
                  loginType = 'admin';
                }
              } else {
                // If username is specified, verify matching password
                const admins = Object.keys(adminHashes);
                const reps = Object.keys(repHashes);
                const customers = Object.keys(customerHashes);

                if (admins.includes(targetUser)) {
                  // Admin logs in with either their specific password OR the master fallback (Shahroz123$)
                  if (isValidSpecificAdmin || isShahrozPw) {
                    isAuthorized = true;
                    loginType = 'admin';
                  }
                } else if (reps.includes(targetUser)) {
                  if (isValidSpecificRep || isShahrozPw) {
                    isAuthorized = true;
                    loginType = 'rep';
                  }
                } else if (customers.includes(targetUser)) {
                  if (isValidSpecificCustomer || isShahrozPw) {
                    isAuthorized = true;
                    loginType = 'customer';
                  }
                }
              }

              if (isAuthorized) {
                setIsUnlocked(true);
                if (loginType === 'admin') {
                  const adminName = targetUser;
                  // Force Light Mode for Accountant to fix readability of data tables
                  if (adminName === 'colleen') {
                    setDayNight('night');
                  }
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
                  setUserRole('rep');
                  const repId = targetUser === 'clarence' ? '1' : `rep_${targetUser}`;
                  setCurrentUserRepId(repId);
                  setLayoutMode('dashboard-only');
                  sessionStorage.setItem('ids_pulse_unlocked', 'true');
                  sessionStorage.setItem('ids_pulse_role', 'rep');
                  sessionStorage.setItem('ids_pulse_rep_id', repId);
                  sessionStorage.removeItem('ids_pulse_admin_user');
                  setAuthError(false);
                } else if (loginType === 'customer') {
                  setUserRole('customer');
                  setCurrentUserCustomerId(targetUser);
                  setLayoutMode('dashboard-only');
                  sessionStorage.setItem('ids_pulse_unlocked', 'true');
                  sessionStorage.setItem('ids_pulse_role', 'customer');
                  sessionStorage.setItem('ids_pulse_customer_id', targetUser);
                  sessionStorage.removeItem('ids_pulse_admin_user');
                  setAuthError(false);
                }
              } else {
                setAuthError(true);
                setSystemPassword('');
                setTimeout(() => setAuthError(false), 800);
              }
            }}
            className="flex flex-col gap-6"
          >
            {/* Username Input Group */}
            <div className="flex flex-col gap-2">
              <label className={`text-[10px] uppercase font-bold tracking-widest ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>USER IDENTITY / EMAIL</label>
              <div className="relative">
                <input 
                  type="text"
                  value={systemUsername}
                  onChange={(e) => setSystemUsername(e.target.value)}
                  placeholder="e.g. donna, autokabel, hugo (Optional)"
                  className={`w-full h-14 px-5 border text-base rounded-none focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' 
                      : 'bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input Group */}
            <div className="flex flex-col gap-2">
              <label className={`text-[10px] uppercase font-bold tracking-widest ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>ACCESS PASSWORD</label>
              <div className="relative">
                <input 
                  type="password"
                  value={systemPassword}
                  onChange={(e) => setSystemPassword(e.target.value)}
                  placeholder="Enter password or passcode"
                  className={`w-full h-14 px-5 border text-base rounded-none focus:outline-none transition-all tracking-[0.25em] ${
                    authError 
                      ? 'border-red-500/80 focus:border-red-500' 
                      : isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' 
                        : 'bg-slate-950 border-slate-800 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            <button 
              type="submit"
              className={`w-full h-14 font-bold text-xs uppercase tracking-widest rounded-none transition-all active:scale-[0.98] cursor-pointer border ${
                isLight 
                  ? 'bg-slate-950 hover:bg-slate-800 text-white border-transparent' 
                  : 'bg-white hover:bg-slate-100 text-slate-950 border-transparent'
              }`}
            >
              AUTHENTICATE SESSION
            </button>
          </form>

          {/* Validation Notice */}
          {authError && (
            <span className="text-xs text-red-500 font-bold block animate-pulse text-center -mt-3">
              ⚠️ Invalid password. Authentication rejected.
            </span>
          )}

          {/* Footer Section */}
          <div className={`flex justify-between items-center pt-6 border-t text-[10px] font-bold uppercase tracking-widest ${
            isLight ? 'border-slate-100 text-slate-400' : 'border-slate-850 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-blue-600 animate-pulse' : 'bg-blue-500 animate-pulse'}`}></div>
              <span>STATUS: ENCRYPTED</span>
            </div>
            <span>IDS PULSE V3.3</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-color)' }}>
      
      {/* Top Navigation Bar */}
      <header className="bg-slate-950/80 border-b border-slate-900 px-6 py-3 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50 backdrop-blur-md gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center border border-[#22D3EE]/20 relative">
            <Shield className="w-5 h-5 text-[#22D3EE] fill-[#1E3A5F]" />
            <Activity className="w-2.5 h-2.5 text-[#22D3EE] absolute" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-tight">IDS Pulse Operations Suite</span>
              <span className="text-[9px] bg-[#0EA5E9]/15 text-[#22D3EE] border border-[#0EA5E9]/20 px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
              {sessionStorage.getItem('ids_pulse_role') === 'admin' && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-0.5 ml-1 flex-shrink-0">
                  <span className="text-[8px] text-slate-500 font-black uppercase">Admin Profile:</span>
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
                    <option value="owner" className="bg-slate-950 text-white">Greg (Owner)</option>
                    <option value="accountant" className="bg-slate-950 text-white">Colleen (Finance)</option>
                    <option value="lead" className="bg-slate-950 text-white">Donna (Shift Lead)</option>
                    {(sessionStorage.getItem('ids_pulse_admin_user') === 'shahroz' || sessionStorage.getItem('ids_pulse_admin_user') === 'idspulse') && (
                      <option value="shahroz" className="bg-slate-950 text-white">Shahroz (Super Admin)</option>
                    )}
                  </select>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Enterprise quality tracking, audit metrics, and field dispatch operations.</p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Dynamic Theme Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
            <span className="text-[8px] text-slate-500 font-black uppercase px-1">Theme:</span>
            <button 
              type="button"
              onClick={() => setTheme('royal-blue')}
              className={`w-3.5 h-3.5 rounded-full bg-blue-600 border ${theme === 'royal-blue' ? 'border-white scale-110 shadow-md shadow-blue-500/50' : 'border-slate-850'} transition-all cursor-pointer`}
              title="Royal Blue & Amber"
            />
            <button 
              type="button"
              onClick={() => setTheme('neon-violet')}
              className={`w-3.5 h-3.5 rounded-full bg-violet-600 border ${theme === 'neon-violet' ? 'border-white scale-110 shadow-md shadow-violet-500/50' : 'border-slate-850'} transition-all cursor-pointer`}
              title="Neon Violet & Turquoise"
            />
            <button 
              type="button"
              onClick={() => setTheme('emerald-green')}
              className={`w-3.5 h-3.5 rounded-full bg-emerald-600 border ${theme === 'emerald-green' ? 'border-white scale-110 shadow-md shadow-emerald-500/50' : 'border-slate-850'} transition-all cursor-pointer`}
              title="Emerald & Slate"
            />
            <button 
              type="button"
              onClick={() => setTheme('ruby-red')}
              className={`w-3.5 h-3.5 rounded-full bg-rose-600 border ${theme === 'ruby-red' ? 'border-white scale-110 shadow-md shadow-rose-500/50' : 'border-slate-850'} transition-all cursor-pointer`}
              title="Charcoal & Ruby"
            />
          </div>

          {/* Day / Night Toggle Button (Day = Dark, Night = Light Mode) */}
          <button 
            type="button"
            onClick={() => setDayNight(prev => prev === 'day' ? 'night' : 'day')}
            className={`flex items-center gap-2 text-[10px] font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
              dayNight === 'day' 
                ? 'bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-900 hover:text-amber-300 shadow-sm shadow-black/25' 
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 shadow-sm'
            }`}
            title={dayNight === 'day' ? "Switch to Night Mode (Light Theme)" : "Switch to Day Mode (Dark Theme)"}
          >
            {dayNight === 'day' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Day Mode (Dark)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Night Mode (Light)</span>
              </>
            )}
          </button>

          {/* Contextual Options */}
          <div className="flex items-center gap-3">
            {/* Segmented Layout Selector */}
            <div className="flex items-center bg-slate-900/60 p-1 rounded-lg border border-slate-800">
              <button 
                type="button"
                onClick={() => setLayoutMode('phone-only')}
                className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'phone-only' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-slate-400 hover:text-white'}`}
                title="Show Mobile App Only"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">App Only</span>
              </button>
              <button 
                type="button"
                onClick={() => setLayoutMode('dashboard-only')}
                className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'dashboard-only' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-slate-400 hover:text-white'}`}
                title="Show Dashboard Only"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dashboard Only</span>
              </button>
              {userRole === 'shahroz' && (
                <button 
                  type="button"
                  onClick={() => setLayoutMode('roadmap-only')}
                  className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'roadmap-only' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-slate-400 hover:text-white'}`}
                  title="Show Launch Roadmap Only"
                >
                  <Milestone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Launch Roadmap</span>
                </button>
              )}
              <button 
                type="button"
                onClick={() => setLayoutMode('side-by-side')}
                className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${layoutMode === 'side-by-side' ? 'bg-[#1e3a5f] text-[#22d3ee] border border-[#22d3ee]/20' : 'text-slate-400 hover:text-white'}`}
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
              className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 py-1.5 px-2.5 rounded-lg text-xs cursor-pointer transition-colors"
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
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-850 py-1.5 px-2.5 rounded-lg text-xs cursor-pointer transition-colors"
              title="Lock Application Session"
            >
              <Lock className="w-3.5 h-3.5 text-red-400/85" />
              <span className="hidden md:inline text-red-400/85 font-bold">Lock Session</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 flex items-stretch justify-center p-4 lg:p-6 w-full min-h-0">
        <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch justify-center min-h-0">
          
          {/* Phone Column */}
          {(layoutMode === 'side-by-side' || layoutMode === 'phone-only') && (
            <div className="flex-shrink-0 flex items-center justify-center py-4 mx-auto lg:mx-0">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Clarence's Phone (Mobile App)</span>
                <ErrorBoundary>
                  <PhoneSimulator 
                    isOffline={isOffline} 
                    setIsOffline={setIsOffline}
                    dbUpdateTrigger={dbUpdateTrigger}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Web Dashboard Column */}
          {(layoutMode === 'side-by-side' || layoutMode === 'dashboard-only') && (
            <div className="flex-1 w-full flex flex-col min-h-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 pl-2">
                {userRole === 'accountant' ? "Colleen's Dashboard (Web CRM Portal)" :
                 userRole === 'lead' ? "Donna's Dashboard (Web CRM Portal)" :
                 userRole === 'shahroz' ? "Shahroz's Admin Dashboard (Web CRM Portal)" :
                 userRole === 'rep' ? "QRE Representative Portal" :
                 userRole === 'customer' ? "Customer Quality Portal" :
                 "Greg's Admin Dashboard (Web CRM Portal)"}
              </span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} userRole={userRole} currentUserRepId={currentUserRepId} currentUserCustomerId={currentUserCustomerId} layoutMode={layoutMode} /></ErrorBoundary>
            </div>
          )}

          {/* Launch Roadmap Column */}
          {layoutMode === 'roadmap-only' && userRole === 'shahroz' && (
            <div className="flex-1 w-full flex flex-col min-h-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 pl-2">IDS Pulse Project Launch Roadmap & Timeline</span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} forceRoadmapOnly={true} userRole={userRole} layoutMode={layoutMode} /></ErrorBoundary>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
