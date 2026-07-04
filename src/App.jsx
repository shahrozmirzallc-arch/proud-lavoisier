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
  const [layoutMode, setLayoutMode] = useState('side-by-side'); // 'side-by-side' | 'phone-only' | 'dashboard-only' | 'roadmap-only'
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
    return 'night'; // Default is Light Theme
  });

  // Password Lock State
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true');
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('ids_pulse_role') || 'admin');
  const [currentUserRepId, setCurrentUserRepId] = useState(() => sessionStorage.getItem('ids_pulse_rep_id') || '');
  const [currentUserCustomerId, setCurrentUserCustomerId] = useState(() => sessionStorage.getItem('ids_pulse_customer_id') || '');
  const [systemPassword, setSystemPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [revokedError, setRevokedError] = useState(false);

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
    return (
      <div 
        className="min-h-screen text-slate-100 flex items-center justify-center p-4 font-sans relative" 
        style={{ 
          backgroundColor: 'var(--bg-color)',
          backgroundImage: dayNight === 'day' 
            ? 'radial-gradient(circle at top, rgba(30, 58, 95, 0.25) 0%, rgba(11, 19, 41, 0.95) 100%)'
            : 'radial-gradient(circle at top, rgba(14, 165, 233, 0.12) 0%, rgba(248, 250, 252, 0.98) 100%)'
        }}
      >
        {/* Day / Night Toggle for Login Screen */}
        <div className="absolute top-4 right-4 z-50">
          <button 
            type="button"
            onClick={() => setDayNight(prev => prev === 'day' ? 'night' : 'day')}
            className={`flex items-center gap-2 text-[10px] font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
              dayNight === 'day' 
                ? 'bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-900 hover:text-amber-300 shadow-sm shadow-black/25 text-slate-100' 
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 shadow-sm text-slate-900'
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
        </div>

        <div className="lock-screen-frame w-full max-w-[420px] p-6 rounded-2xl glass-panel border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col items-center">
          {/* Decorative ambient light */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo / Shield Icon */}
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center relative mb-5 shadow-lg shadow-black/40">
            <div className="absolute inset-0 bg-[#0EA5E9]/5 rounded-2xl animate-pulse" />
            <Shield className="w-8 h-8 text-[#22D3EE] fill-[#1E3A5F]/20" />
            <Lock className="w-4 h-4 text-[#22D3EE] absolute bottom-3 right-3 bg-slate-950 rounded-full p-0.5" />
          </div>

          {/* Header Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-black text-white uppercase tracking-wider">IDS Pulse Security Gateway</h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[320px] mx-auto">
              This terminal is encrypted. Please authenticate to initialize dashboard and simulator session.
            </p>
          </div>

          {/* Form */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const rawPw = systemPassword.trim();
              const pw = rawPw.toLowerCase().replace(/\s+/g, '');
              
              // Verify Masterpassword using secure SHA-256 comparison
              const msgBuffer = new TextEncoder().encode(rawPw);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              if (hashHex === '3dc913cc6d99a4f6fa13c07c646c8efa8b9410d323c484dfc1fef45322782131') {
                setIsUnlocked(true);
                setUserRole('shahroz');
                sessionStorage.setItem('ids_pulse_unlocked', 'true');
                sessionStorage.setItem('ids_pulse_role', 'shahroz');
                setAuthError(false);
                setRevokedError(false);
              } else if (pw === 'colleen') {
                setIsUnlocked(true);
                setUserRole('accountant');
                sessionStorage.setItem('ids_pulse_unlocked', 'true');
                sessionStorage.setItem('ids_pulse_role', 'accountant');
                setAuthError(false);
                setRevokedError(false);
              } else if (['shahroz', 'idspulse', 'donna', 'hugo', 'nabil', 'rogelio', 'autokabel', 'magna', 'hutchinson', 'brose'].includes(pw)) {
                setRevokedError(true);
                setAuthError(false);
                setSystemPassword('');
              } else {
                setAuthError(true);
                setRevokedError(false);
                setSystemPassword('');
                setTimeout(() => setAuthError(false), 800);
              }
            }}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Access Password</label>
              <div className="relative">
                <input 
                  type="password"
                  value={systemPassword}
                  onChange={(e) => setSystemPassword(e.target.value)}
                  placeholder="Enter password (e.g. hugo, autokabel, idspulse)"
                  className={`w-full bg-slate-950/80 border text-sm px-10 py-2.5 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-[#22D3EE]/50 transition-all ${
                    authError ? 'border-red-500/80 shadow-lg shadow-red-500/5 ring-1 ring-red-500/20' : 'border-slate-800'
                  }`}
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#22D3EE] hover:bg-[#22D3EE]/85 text-slate-950 font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#22D3EE]/10 flex items-center justify-center gap-2"
            >
              <span>Authenticate Session</span>
            </button>
          </form>

          {/* Validation Notice */}
          {authError && (
            <span className="text-[10px] text-red-400 font-bold mt-3 block animate-pulse text-center">
              ⚠️ Invalid password. Authentication rejected.
            </span>
          )}

          {revokedError && (
            <span className="text-[10px] text-amber-500 font-bold mt-3 block text-center leading-relaxed">
              ⚠️ Right now, the development is going through a Security Audit. Your password has been revoked temporarily.
            </span>
          )}

          {/* Security details foot notes */}
          <div className="mt-8 pt-4 border-t border-slate-900/60 w-full flex justify-between items-center text-[8.5px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Status: Encrypted</span>
            <span>IDS Pulse v3.3</span>
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
      <main className="flex-1 flex items-center justify-center p-4 lg:p-6 max-w-7xl mx-auto w-full min-h-0">
        <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center min-h-0">
          
          {/* Phone Column */}
          {(layoutMode === 'side-by-side' || layoutMode === 'phone-only') && (
            <div className="flex-shrink-0 flex items-center justify-center py-4 mx-auto lg:mx-0">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Clarence's Phone (Mobile App)</span>
                <PhoneSimulator 
                  isOffline={isOffline} 
                  setIsOffline={setIsOffline}
                  dbUpdateTrigger={dbUpdateTrigger}
                />
              </div>
            </div>
          )}

          {/* Web Dashboard Column */}
          {(layoutMode === 'side-by-side' || layoutMode === 'dashboard-only') && (
            <div className="flex-1 w-full max-w-5xl flex flex-col min-h-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 pl-2">
                {userRole === 'accountant' ? "Colleen's Dashboard (Web CRM Portal)" :
                 userRole === 'lead' ? "Donna's Dashboard (Web CRM Portal)" :
                 userRole === 'shahroz' ? "Shahroz's Admin Dashboard (Web CRM Portal)" :
                 userRole === 'qre' ? "QRE Representative Portal" :
                 userRole === 'customer' ? "Customer Quality Portal" :
                 "Greg's Admin Dashboard (Web CRM Portal)"}
              </span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} userRole={userRole} currentUserRepId={currentUserRepId} currentUserCustomerId={currentUserCustomerId} /></ErrorBoundary>
            </div>
          )}

          {/* Launch Roadmap Column */}
          {layoutMode === 'roadmap-only' && userRole === 'shahroz' && (
            <div className="flex-1 w-full max-w-5xl flex flex-col min-h-0">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 pl-2">IDS Pulse Project Launch Roadmap & Timeline</span>
              <ErrorBoundary><WebDashboard dbUpdateTrigger={dbUpdateTrigger} forceRoadmapOnly={true} userRole={userRole} /></ErrorBoundary>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
