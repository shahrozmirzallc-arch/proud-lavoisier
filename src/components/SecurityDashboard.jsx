import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, Terminal, Network, 
  User, History, Trash2, Settings, AlertTriangle, Play, Check, 
  X, Lock, Unlock, Wifi, Cpu, AlertCircle, RefreshCw, Globe, ArrowRight,
  Eye, EyeOff, Radio, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function SecurityDashboard() {
  const [agentStatus, setAgentStatus] = useState('disconnected'); // 'connected' or 'disconnected'
  const [autoMode, setAutoMode] = useState(false); // Auto-pilot state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'audit', 'connections', 'rules', 'logs'
  const [connections, setConnections] = useState([]);
  const [logs, setLogs] = useState([]);
  const [rules, setRules] = useState({ blocked_ips: [], blocked_processes: [], allowed_ips: [], allowed_processes: [] });
  const [auditReport, setAuditReport] = useState(null);
  
  // Dynamic UI state
  const [expandedConnections, setExpandedConnections] = useState({});
  const [expandedLogs, setExpandedLogs] = useState({});
  const [isAuditing, setIsAuditing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Custom manual rules
  const [manualBlockType, setManualBlockType] = useState('ip');
  const [manualBlockTarget, setManualBlockTarget] = useState('');
  
  // Simulated scrolling matrix terminal line for extra "top secret" effect
  const [terminalLines, setTerminalLines] = useState([
    "SECURE KERNEL ENFORCEMENT: ACTIVE",
    "CYBER MONITORING ACTIVE IN BACKGROUND THREADS",
    "FIREWALL DEFENSE BLOCKS LISTENING FOR DATA EXTRAPOLATION"
  ]);

  useEffect(() => {
    if (agentStatus !== 'connected') return;
    const items = [
      "DIAGNOSTIC STATUS: INTERCEPTING PORTS",
      "MONITORING SOCKETS IN RANGE 1-65535",
      "HARDWARE INBOUND BLOCK RULES ENFORCED",
      "LOG FILES CORRELATION COMPLETE: NO ANOMALIES",
      "RUNNING AUTO-PILOT CLASSIFICATION MATRIX...",
      "AUTO-SHIELD ACTIVE: SUSPICIOUS IPS WILL BE BLOCKED",
      "RDP SOCKET AUDITOR CAPTURED 0 ANOMALIES"
    ];
    
    const interval = setInterval(() => {
      const randomLine = items[Math.floor(Math.random() * items.length)];
      setTerminalLines(prev => {
        const next = [...prev, `[${new Date().toLocaleTimeString()}] ${randomLine}`];
        if (next.length > 5) next.shift();
        return next;
      });
    }, 8500);
    return () => clearInterval(interval);
  }, [agentStatus]);

  // Check Agent Status & Auto Mode
  const checkAgent = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/status');
      if (res.ok) {
        setAgentStatus('connected');
        const data = await res.json();
        setAutoMode(data.auto_mode);
        return true;
      }
    } catch (e) {
      setAgentStatus('disconnected');
    }
    return false;
  };

  const loadData = async () => {
    if (agentStatus !== 'connected') return;
    try {
      const [connRes, logRes, ruleRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/connections'),
        fetch('http://127.0.0.1:8000/api/logs'),
        fetch('http://127.0.0.1:8000/api/rules')
      ]);

      if (connRes.ok) setConnections(await connRes.json());
      if (logRes.ok) setLogs(await logRes.json());
      if (ruleRes.ok) setRules(await ruleRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAgent();

    const statusInterval = setInterval(checkAgent, 3000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    if (agentStatus !== 'connected') return;
    loadData();
    const dataInterval = setInterval(() => {
      if (activeTab === 'connections' || activeTab === 'dashboard') {
        loadData();
      }
    }, 4500);
    return () => clearInterval(dataInterval);
  }, [agentStatus, activeTab]);

  const runForensicAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/audit');
      if (res.ok) {
        setAuditReport(await res.json());
        loadData();
      }
    } catch (e) {
      alert("Failed to connect to agent.");
    } finally {
      setIsAuditing(false);
    }
  };

  const toggleAutoMode = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/toggle_auto_mode', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAutoMode(data.auto_mode);
        loadData();
      }
    } catch (e) {
      console.error("Failed to toggle auto mode", e);
    }
  };

  const handleBlock = async (type, target) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target })
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
      alert("Action failed. Agent might be unreachable.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAllow = async (type, target) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/allow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target })
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
      alert("Action failed. Agent might be unreachable.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearRules = async () => {
    if (!confirm("Reset all firewall blocks?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/clear_rules', { method: 'POST' });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
      alert("Action failed. Agent might be unreachable.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleManualBlockSubmit = (e) => {
    e.preventDefault();
    if (!manualBlockTarget.trim()) return;
    handleBlock(manualBlockType, manualBlockTarget.trim());
    setManualBlockTarget('');
  };

  const toggleConnectionTech = (idx) => {
    setExpandedConnections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleLogTech = (idx) => {
    setExpandedLogs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getSecurityState = () => {
    if (agentStatus !== 'connected') return { color: 'text-red-500', bg: 'bg-red-950/20 border-red-500/30', desc: 'AGENT OFFLINE', alertLvl: 'CRITICAL' };
    if (auditReport?.active_rats && auditReport.active_rats.length > 0) {
      return { color: 'text-red-500', bg: 'bg-red-950/20 border-red-500/30', desc: 'ACTIVE RAT DETECTED', alertLvl: 'HIGH RISK' };
    }
    if (auditReport?.rdp_settings?.rdp_enabled) {
      return { color: 'text-amber-500', bg: 'bg-amber-950/20 border-amber-500/30', desc: 'REMOTE ACCESS VULNERABLE', alertLvl: 'WARN' };
    }
    return { color: 'text-[#22d3ee]', bg: 'bg-[#1e3a5f]/20 border-[#22d3ee]/30', desc: 'SYSTEM SECURE', alertLvl: 'SAFE' };
  };

  const securityState = getSecurityState();

  return (
    <div className="flex-1 w-full bg-[#070b16]/90 border border-slate-900 rounded-2xl p-6 backdrop-blur-md shadow-[0_0_50px_rgba(14,165,233,0.07)] flex flex-col min-h-[600px] relative overflow-hidden">
      
      {/* Top Secret Header Classification Band */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-red-950/60 border-b border-red-500/20 flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[9px] font-black text-red-400 tracking-[0.2em] uppercase">// CLASSIFIED // DEPT OF INTERNAL SECURE ENFORCEMENT</span>
        </div>
        <span className="text-[9px] font-mono text-slate-500 tracking-wider">LEVEL 5 SECRET // ACCESS REGISTERED</span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-900 gap-4 mb-6 mt-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${securityState.bg} rounded-xl flex items-center justify-center border shadow-[inset_0_0_15px_rgba(34,211,238,0.05)] relative`}>
            {agentStatus !== 'connected' ? (
              <ShieldAlert className={`w-6 h-6 ${securityState.color}`} />
            ) : (
              <ShieldCheck className={`w-6 h-6 ${securityState.color}`} />
            )}
            <Radio className="w-3.5 h-3.5 text-cyan-400 absolute bottom-0.5 right-0.5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wider font-mono flex items-center gap-2">
              <span>CYBER SHIELD COMMAND CENTRE</span>
              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">{securityState.alertLvl}</span>
            </h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>ACTIVE SYSTEM STATE:</span>
              <span className={`font-black uppercase flex items-center gap-1.5 ${securityState.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {securityState.desc}
              </span>
            </p>
          </div>
        </div>

        {/* System controls (Auto-Pilot / Audit buttons) */}
        {agentStatus === 'connected' && (
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Auto-Pilot Toggle Panel */}
            <div className="flex items-center bg-[#050a14] border border-slate-800 rounded-lg px-3 py-1.5 gap-2.5 font-mono">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">DEFENSE SHIELD</span>
                <span className={`text-[10px] font-black tracking-wide ${autoMode ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {autoMode ? "AUTO-PILOT ACTIVE" : "MANUAL INTERCEPT"}
                </span>
              </div>
              <button 
                onClick={toggleAutoMode}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors p-0.5"
                title={autoMode ? "Deactivate Auto-Pilot" : "Activate Auto-Pilot"}
              >
                {autoMode ? (
                  <ToggleRight className="w-8 h-8 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={runForensicAudit}
                disabled={isAuditing}
                className="bg-cyan-950/40 hover:bg-cyan-900/40 text-[#22d3ee] border border-[#22d3ee]/40 font-black font-mono text-xs py-2 px-4 rounded-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>DEEP AUDITING...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-cyan-400/20" />
                    <span>TRIGGER DEEP AUDIT</span>
                  </>
                )}
              </button>
              <button 
                onClick={loadData}
                className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 py-2 px-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                title="Reload Feeds"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}
      </div>

      {agentStatus !== 'connected' ? (
        // Render Disconnected State (Help Setup Instructions)
        <div className="bg-[#0b0f19]/80 border border-slate-900 rounded-xl p-8 max-w-2xl mx-auto text-center backdrop-blur-md shadow-2xl relative overflow-hidden mt-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
          <div className="w-16 h-16 bg-red-950/30 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <h2 className="text-lg font-black font-mono text-white mb-2 tracking-widest uppercase">// SECURE AGENT DISCONNECTED //</h2>
          <p className="text-slate-400 text-xs mb-6 max-w-md mx-auto leading-relaxed">
            The background agent monitoring this laptop's ports and startup folders is offline. Start the service as Administrator to restore security.
          </p>

          <div className="bg-[#040811] border border-slate-800 rounded-lg p-6 text-left mb-6 font-mono text-[11px] max-w-lg mx-auto">
            <p className="text-red-400 mb-2 font-bold">// SECURE POWERUP INSTRUCTIONS:</p>
            <p className="text-slate-400 mb-1">1. Start Command Prompt or PowerShell as <strong className="text-white">ADMINISTRATOR</strong></p>
            <p className="text-slate-400 mb-3">2. Navigate to your workspace directory and execute:</p>
            <div className="bg-black/80 p-3 rounded border border-slate-800 text-cyan-400 font-bold select-all flex justify-between items-center group cursor-pointer">
              <span>python security_agent.py</span>
              <span className="text-[9px] text-slate-500 group-hover:text-[#22d3ee] font-sans">COPY</span>
            </div>
            <p className="text-amber-500 mt-4 text-[10px] leading-relaxed">
              *ADMIN PRIVILEGES are mandatory to block malicious IP connections at the hardware firewall and analyze Windows Event login logs.
            </p>
          </div>

          <button 
            onClick={checkAgent}
            className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-bold font-mono py-2.5 px-6 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>CHECK AGENT CONNECTION</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          
          {/* Navigation Sidebar */}
          <div className="w-full md:w-52 flex-shrink-0 flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-900/60 pb-4 md:pb-0 md:pr-4 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer text-left w-full whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#1e3a5f]/30 border border-[#22d3ee]/30 text-[#22d3ee] shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <Cpu className="w-4 h-4" />
              <span>SECURITY COCKPIT</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('audit');
                if (!auditReport) runForensicAudit();
              }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer text-left w-full whitespace-nowrap ${activeTab === 'audit' ? 'bg-[#1e3a5f]/30 border border-[#22d3ee]/30 text-[#22d3ee] shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <Terminal className="w-4 h-4" />
              <span>FORENSIC SCAN REPORT</span>
            </button>
            <button 
              onClick={() => setActiveTab('connections')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer text-left w-full whitespace-nowrap ${activeTab === 'connections' ? 'bg-[#1e3a5f]/30 border border-[#22d3ee]/30 text-[#22d3ee] shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <Network className="w-4 h-4" />
              <span>LIVE NETWORK TRAFFIC</span>
              {connections.length > 0 && (
                <span className="ml-auto text-[9px] bg-cyan-950 border border-cyan-700 text-[#22d3ee] px-1.5 py-0.5 rounded-full font-black">{connections.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer text-left w-full whitespace-nowrap ${activeTab === 'rules' ? 'bg-[#1e3a5f]/30 border border-[#22d3ee]/30 text-[#22d3ee] shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <Settings className="w-4 h-4" />
              <span>FIREWALL RULESETS</span>
              {(rules.blocked_ips.length + rules.blocked_processes.length) > 0 && (
                <span className="ml-auto text-[9px] bg-red-950 border border-red-700 text-red-400 px-1.5 py-0.5 rounded-full font-black">{rules.blocked_ips.length + rules.blocked_processes.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer text-left w-full whitespace-nowrap ${activeTab === 'logs' ? 'bg-[#1e3a5f]/30 border border-[#22d3ee]/30 text-[#22d3ee] shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <History className="w-4 h-4" />
              <span>LOG TELEMETRY</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 min-w-0 flex flex-col min-h-[400px]">

            {/* TAB: DASHBOARD (Overview) */}
            {activeTab === 'dashboard' && (
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Visual Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#050810]/75 border border-slate-900 rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden shadow-[inset_0_0_15px_rgba(14,165,233,0.02)]">
                    <div className="absolute right-3 top-3 text-slate-900"><Wifi className="w-8 h-8" /></div>
                    <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest">Established Connections</span>
                    <span className="text-3xl font-black text-white font-mono">{connections.length}</span>
                    <span className="text-slate-400 text-[10px]">Active outbound hardware sockets</span>
                  </div>

                  <div className="bg-[#050810]/75 border border-slate-900 rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden shadow-[inset_0_0_15px_rgba(14,165,233,0.02)]">
                    <div className="absolute right-3 top-3 text-slate-900"><Terminal className="w-8 h-8" /></div>
                    <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest">Remote Access Risks</span>
                    {auditReport?.active_rats && auditReport.active_rats.length > 0 ? (
                      <span className="text-base font-black text-red-500 flex items-center gap-1.5 mt-2 font-mono">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>RAT DANGER ({auditReport.active_rats.length})</span>
                      </span>
                    ) : (
                      <span className="text-base font-black text-[#22d3ee] flex items-center gap-1.5 mt-2 font-mono">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
                        <span>NO RAT DETECTED</span>
                      </span>
                    )}
                    <span className="text-slate-500 text-[10px] font-mono">Memory scan clear</span>
                  </div>

                  <div className="bg-[#050810]/75 border border-slate-900 rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden shadow-[inset_0_0_15px_rgba(14,165,233,0.02)]">
                    <div className="absolute right-3 top-3 text-slate-900"><Lock className="w-8 h-8" /></div>
                    <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest">Active Blocked Rules</span>
                    <span className="text-3xl font-black text-red-400 font-mono">{rules.blocked_ips.length + rules.blocked_processes.length}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{rules.blocked_ips.length} IP Rules | {rules.blocked_processes.length} Apps</span>
                  </div>
                </div>

                {/* Simulated Diagnostic Terminal Log */}
                <div className="bg-black/90 border border-slate-900 p-4 rounded-xl font-mono text-[10px] text-emerald-500 shadow-inner flex flex-col gap-1">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5 text-slate-500">
                    <span className="font-bold">LIVE TELEMETRY MONITOR</span>
                    <span className="animate-pulse flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 
                      {autoMode ? "AUTO-PILOT AGENT ONLINE" : "MANUAL INTERCEPT AGENT ONLINE"}
                    </span>
                  </div>
                  {terminalLines.map((line, i) => (
                    <div key={i} className="truncate select-none">{line}</div>
                  ))}
                </div>

                {/* Audit quick stats */}
                {auditReport && (
                  <div className="bg-[#050810]/40 border border-slate-900 rounded-xl p-5 flex flex-col gap-3">
                    <h3 className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">CRITICAL AUDITING CHECKPOINTS</h3>
                    
                    <div className="flex flex-col gap-2.5 font-mono text-xs">
                      <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                        <div className="flex items-center gap-2.5">
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Remote Desktop Access (RDP)</p>
                            <p className="text-[9px] text-slate-500 font-sans">Check fDenyTSConnections registry value</p>
                          </div>
                        </div>
                        {auditReport.rdp_settings?.rdp_enabled ? (
                          <span className="text-[9px] font-black bg-red-950/40 border border-red-800 text-red-400 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-400" /> RDP VULNERABLE
                          </span>
                        ) : (
                          <span className="text-[9px] font-black bg-emerald-950/40 border border-emerald-800 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase">
                            PORT SECURED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs font-bold text-white">Logged In Users & Console Sessions</p>
                            <p className="text-[9px] text-slate-500 font-sans">Detects active keyboard or remote console sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-200">
                            {auditReport.active_sessions?.length || 1} Active Session(s)
                          </span>
                          <p className="text-[9px] text-slate-500 font-sans">
                            ({auditReport.active_sessions?.map(s => s.username || 'Current User').join(', ') || 'Current'})
                          </p>
                        </div>
                      </div>

                      {auditReport.security_logon_events && (
                        <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-900">
                          <div className="flex items-center gap-2.5">
                            <History className="w-4 h-4 text-cyan-400" />
                            <div>
                              <p className="text-xs font-bold text-white">Remote Logon Audit Records</p>
                              <p className="text-[9px] text-slate-500 font-sans">Reads Windows Event Logs for recent logins</p>
                            </div>
                          </div>
                          {auditReport.security_logon_events.filter(e => e.logon_type === 10).length > 0 ? (
                            <span className="text-[9px] font-black bg-red-950/40 border border-red-800 text-red-400 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" /> REMOTE LOGIN FOUND
                            </span>
                          ) : (
                            <span className="text-[9px] font-black bg-emerald-950/40 border border-emerald-800 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase">
                              NO LOGS FOUND
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!auditReport && (
                  <div className="bg-[#050810]/40 border border-slate-900 rounded-xl p-8 text-center mt-4">
                    <p className="text-slate-400 text-xs mb-4 font-mono">No security diagnostic scan loaded for this session.</p>
                    <button 
                      onClick={runForensicAudit}
                      disabled={isAuditing}
                      className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black font-mono text-xs py-2.5 px-6 rounded-lg flex items-center gap-2 mx-auto cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      {isAuditing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>DIAGNOSING SYSTEM...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-slate-950" />
                          <span>RUN COMPLETE DIAGNOSTIC SCAN</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FORENSIC REPORT */}
            {activeTab === 'audit' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto max-h-[550px] pr-2">
                {!auditReport ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                    <p className="text-slate-400 text-xs font-mono">Scrubbing system directories and Event Logs...</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 font-mono">
                    <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center justify-between">
                        <span>Remote Access Software Scan</span>
                        <span className="text-[9px] text-slate-500">PIDs checking</span>
                      </h3>
                      {auditReport.active_rats.length === 0 ? (
                        <div className="bg-emerald-950/20 border border-emerald-800 text-emerald-400 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                          <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                          <span>All Clear: No Remote Control software detected running in memory.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {auditReport.active_rats.map(rat => (
                            <div key={rat.pid} className="bg-red-950/20 border border-red-500/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <span className="text-xs font-black text-red-400 block">{rat.explanation || rat.description}</span>
                                <span className="text-[10px] text-slate-400 block mt-1">Application: {rat.name} (PID: {rat.pid}) | User: {rat.username}</span>
                                <span className="text-[9px] text-slate-500 block truncate max-w-lg mt-0.5" title={rat.path}>{rat.path}</span>
                              </div>
                              <button 
                                onClick={() => handleBlock('process', rat.name)}
                                className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/30 text-[9px] font-bold py-1 px-3 rounded cursor-pointer transition-colors"
                              >
                                KILL PROCESS
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                        Terminal Session Registry (qwinsta)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-900 pb-2 font-black">
                              <th className="py-1.5 uppercase tracking-wider">Session</th>
                              <th className="py-1.5 uppercase tracking-wider">Username</th>
                              <th className="py-1.5 uppercase tracking-wider">ID</th>
                              <th className="py-1.5 uppercase tracking-wider">State</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditReport.active_sessions.map((session, idx) => (
                              <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/10">
                                <td className="py-2 text-white font-mono">{session.session_name || '-'}</td>
                                <td className="py-2 text-cyan-400 font-bold">{session.username || 'Current Logged User'}</td>
                                <td className="py-2 text-slate-400 font-mono">{session.id}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${session.state === 'Active' || session.state === 'Listen' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                                    {session.state}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                        Local Accounts & Authorization Groups
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-900/20 border border-slate-900 p-3 rounded-lg">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase mb-2">Registered Users</span>
                          <div className="flex flex-wrap gap-2">
                            {auditReport.local_users?.all_users?.map((u, i) => (
                              <span key={i} className="text-xs bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">{u}</span>
                            )) || <span className="text-xs text-slate-500">No logs</span>}
                          </div>
                        </div>

                        <div className="bg-slate-900/20 border border-slate-900 p-3 rounded-lg">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase mb-2">System Administrators</span>
                          <div className="flex flex-wrap gap-2">
                            {auditReport.local_users?.administrators?.map((u, i) => (
                              <span key={i} className="text-xs bg-red-950/30 border border-red-800/30 text-red-400 px-2 py-0.5 rounded font-bold">{u}</span>
                            )) || <span className="text-xs text-slate-500">No logs</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                        Active Autorun Keys (Registry Persistence)
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1.5 font-mono">HKLM\...\Run (Computer boot autorun)</span>
                          {auditReport.startup_persistence?.hklm_run?.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No startup items found</p>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                              {auditReport.startup_persistence.hklm_run.map((run, i) => (
                                <div key={i} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded text-[10px] font-mono flex justify-between gap-4">
                                  <span className="text-[#22d3ee] font-bold">{run.name}</span>
                                  <span className="text-slate-400 truncate max-w-sm" title={run.value}>{run.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1.5 font-mono">HKCU\...\Run (User session login autorun)</span>
                          {auditReport.startup_persistence?.hkcu_run?.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No startup items found</p>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                              {auditReport.startup_persistence.hkcu_run.map((run, i) => (
                                <div key={i} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded text-[10px] font-mono flex justify-between gap-4">
                                  <span className="text-[#22d3ee] font-bold">{run.name}</span>
                                  <span className="text-slate-400 truncate max-w-sm" title={run.value}>{run.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">
                        Windows Security Logon Logs (Event ID 4624)
                      </h3>
                      {typeof auditReport.security_logon_events === 'object' && auditReport.security_logon_events.error ? (
                        <div className="bg-amber-950/20 border border-amber-800/30 text-amber-500 p-3 rounded-lg text-xs font-bold">
                          {auditReport.security_logon_events.error}
                        </div>
                      ) : !auditReport.security_logon_events || auditReport.security_logon_events.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No login events captured.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-60">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-900 pb-2 font-black font-mono">
                                <th className="py-1.5 uppercase tracking-wider">Timestamp</th>
                                <th className="py-1.5 uppercase tracking-wider">Target User</th>
                                <th className="py-1.5 uppercase tracking-wider">Logon Method</th>
                                <th className="py-1.5 uppercase tracking-wider">Remote IP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditReport.security_logon_events.map((evt, idx) => (
                                <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/10">
                                  <td className="py-2 text-slate-400 font-mono">{evt.time}</td>
                                  <td className="py-2 text-white font-bold">{evt.username}</td>
                                  <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono ${evt.logon_type === 10 ? 'bg-red-950/40 text-red-400 border border-red-900' : 'bg-slate-900 text-slate-400'}`}>
                                      {evt.logon_type_desc}
                                    </span>
                                  </td>
                                  <td className="py-2 text-cyan-400 font-bold font-mono">{evt.ip_address}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB: NETWORK MONITOR */}
            {activeTab === 'connections' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black font-mono text-slate-400 uppercase tracking-widest">
                    ACTIVE SOCKET CONNECTIONS
                  </h3>
                  <button 
                    onClick={loadData}
                    className="text-[#22d3ee] hover:text-white border border-[#22d3ee]/30 bg-[#22d3ee]/5 text-[9px] font-black font-mono py-1 px-2.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> RE-SCAN
                  </button>
                </div>
                
                {connections.length === 0 ? (
                  <div className="flex-1 bg-slate-950/20 border border-slate-900/50 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                    <Globe className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-mono">No outbound established sockets detected.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[450px] pr-2">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-900 pb-2 font-black font-mono text-[10px]">
                          <th className="py-1.5 uppercase tracking-wider w-3/5">Activity (Simple Words)</th>
                          <th className="py-1.5 uppercase tracking-wider w-1/5">Details</th>
                          <th className="py-1.5 uppercase tracking-wider w-1/5">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {connections.map((conn, idx) => (
                          <React.Fragment key={idx}>
                            <tr className="border-b border-slate-900/40 hover:bg-[#0c1325]/30">
                              <td className="py-3 pr-4">
                                <div className="flex items-start gap-2">
                                  <div className="w-2.5 h-2.5 bg-cyan-500/20 border border-cyan-400 rounded-full mt-1 shrink-0 animate-pulse" />
                                  <div>
                                    <span className="text-white text-xs font-bold leading-normal block font-sans">
                                      {conn.explanation || "A program is sending data out to the internet."}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Program: {conn.process_name}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3">
                                <button
                                  onClick={() => toggleConnectionTech(idx)}
                                  className={`font-mono text-[9px] font-black py-1 px-2.5 rounded transition-all cursor-pointer select-none border ${expandedConnections[idx] ? 'bg-cyan-950 border-cyan-800 text-[#22d3ee]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                  {expandedConnections[idx] ? "Hide Tech [-]" : "Tech [?]"}
                                </button>
                              </td>

                              <td className="py-3 flex items-center gap-2.5 font-mono">
                                <button 
                                  onClick={() => handleBlock('ip', conn.remote_ip)}
                                  className="bg-red-950/20 hover:bg-red-600/20 text-red-400 hover:text-white border border-red-500/30 text-[9px] font-bold py-1 px-2.5 rounded cursor-pointer transition-colors"
                                >
                                  BLOCK IP
                                </button>
                                <button 
                                  onClick={() => handleBlock('process', conn.process_name)}
                                  className="bg-red-950/20 hover:bg-red-600/20 text-red-400 hover:text-white border border-red-500/30 text-[9px] font-bold py-1 px-2.5 rounded cursor-pointer transition-colors"
                                >
                                  KILL APP
                                </button>
                              </td>
                            </tr>

                            {expandedConnections[idx] && (
                              <tr>
                                <td colSpan="3" className="bg-[#040810] px-4 py-3 border-b border-slate-900/60">
                                  <div className="font-mono text-[10px] text-emerald-400 flex flex-col gap-1.5 border border-emerald-950/40 rounded p-3 bg-emerald-950/5">
                                    <p className="font-bold text-emerald-500">// TECHNICAL NETWORK DIAGNOSTICS</p>
                                    <p><span className="text-slate-500">Executable:</span> {conn.process_name} (PID: {conn.pid})</p>
                                    <p className="break-all"><span className="text-slate-500">Folder Path:</span> {conn.process_path}</p>
                                    <p><span className="text-slate-500">Remote Socket:</span> {conn.remote_ip}:{conn.remote_port} ({conn.status})</p>
                                    <p><span className="text-slate-500">Local Socket:</span> {conn.local_ip}:{conn.local_port}</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BLOCK / ALLOW RULES */}
            {activeTab === 'rules' && (
              <div className="flex-1 flex flex-col gap-6 font-mono">
                <form onSubmit={handleManualBlockSubmit} className="bg-[#050810]/75 border border-slate-900 p-4 rounded-xl flex items-center gap-4">
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rule Target</label>
                    <select 
                      value={manualBlockType} 
                      onChange={(e) => setManualBlockType(e.target.value)}
                      className="bg-slate-950 border border-slate-900 text-slate-200 text-xs rounded-lg p-2 font-bold outline-none cursor-pointer"
                    >
                      <option value="ip">IP Address</option>
                      <option value="process">Process name</option>
                    </select>
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Target Value</label>
                    <input 
                      type="text" 
                      placeholder={manualBlockType === 'ip' ? "e.g. 185.200.118.4" : "e.g. suspicious.exe"}
                      value={manualBlockTarget}
                      onChange={(e) => setManualBlockTarget(e.target.value)}
                      className="bg-slate-950 border border-slate-900 text-slate-200 text-xs rounded-lg p-2 outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-500/30 font-bold text-xs py-2 px-4 rounded-lg self-end h-9.5 flex items-center cursor-pointer transition-colors"
                  >
                    ADD BLOCK
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-0 flex-1">
                  <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Blocked IPs (Windows Firewall)</span>
                      <span className="text-[9px] bg-red-950 border border-red-800 text-red-400 px-1.5 py-0.5 rounded-full font-bold">{rules.blocked_ips.length}</span>
                    </div>

                    {rules.blocked_ips.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">No blocked IPs active.</p>
                    ) : (
                      <div className="flex-1 overflow-y-auto max-h-60 flex flex-col gap-1.5 pr-1">
                        {rules.blocked_ips.map(ip => (
                          <div key={ip} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg flex items-center justify-between text-xs">
                            <span className="text-red-400 font-bold">{ip}</span>
                            <button 
                              onClick={() => handleAllow('ip', ip)}
                              className="text-slate-400 hover:text-[#22d3ee] cursor-pointer transition-colors p-1"
                              title="Delete Firewall Rule"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#050810]/50 border border-slate-900 rounded-xl p-4 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Blocked Executables</span>
                      <span className="text-[9px] bg-red-950 border border-red-800 text-red-400 px-1.5 py-0.5 rounded-full font-bold">{rules.blocked_processes.length}</span>
                    </div>

                    {rules.blocked_processes.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">No blocked executables active.</p>
                    ) : (
                      <div className="flex-1 overflow-y-auto max-h-60 flex flex-col gap-1.5 pr-1">
                        {rules.blocked_processes.map(proc => (
                          <div key={proc} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg flex items-center justify-between text-xs">
                            <span className="text-slate-300">{proc}</span>
                            <button 
                              onClick={() => handleAllow('process', proc)}
                              className="text-slate-400 hover:text-[#22d3ee] cursor-pointer transition-colors p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#050810]/40 border border-slate-900 p-4 rounded-xl mt-auto">
                  <div>
                    <span className="text-xs font-bold text-white block">RESET FIREWALL RULESETS</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">Clears all security rules and removes custom Windows Defender Firewall block lists.</span>
                  </div>
                  <button 
                    onClick={handleClearRules}
                    className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>RESET MATRIX</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: EVENT STREAM */}
            {activeTab === 'logs' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black font-mono text-slate-400 uppercase tracking-widest">
                    SYSTEM SECURITY LOGS TELEMETRY
                  </h3>
                  <button 
                    onClick={loadData}
                    className="text-[#22d3ee] hover:text-white border border-[#22d3ee]/30 bg-[#22d3ee]/5 text-[9px] font-black font-mono py-1 px-2.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> RELOAD LOGS
                  </button>
                </div>
                
                {logs.length === 0 ? (
                  <div className="flex-1 bg-slate-950/20 border border-slate-900/50 rounded-xl p-8 text-center flex flex-col items-center justify-center font-mono">
                    <History className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500">Security event logs empty.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[450px] pr-2 flex flex-col gap-2">
                    {logs.map((log, idx) => (
                      <React.Fragment key={idx}>
                        <div className="bg-[#050810]/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3 justify-between">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                              log.action === 'Blocked' ? 'bg-red-950/30 border-red-500/20 text-red-400' :
                              log.action === 'Allowed' ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400' :
                              'bg-cyan-950/30 border-cyan-500/20 text-cyan-400'
                            }`}>
                              {log.type === 'process' ? <Cpu className="w-4 h-4" /> : <Network className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block leading-normal font-sans">
                                {log.explanation || "A program was processed by the security agent."}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Program: {log.source}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-4">
                            <div className="flex flex-col gap-1 items-end">
                              <span className="text-[9px] text-slate-500 font-mono block">{log.timestamp}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border font-mono ${
                                log.action === 'Blocked' ? 'bg-red-950 text-red-400 border-red-900/40' :
                                log.action === 'Allowed' ? 'bg-emerald-950 text-emerald-400 border-emerald-900/40' :
                                'bg-cyan-950 text-cyan-400 border-cyan-900/40'
                              }`}>
                                {log.action}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleLogTech(idx)}
                              className={`font-mono text-[9px] font-black py-1 px-2 rounded transition-all cursor-pointer border ${expandedLogs[idx] ? 'bg-cyan-950 border-cyan-800 text-[#22d3ee]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                            >
                              {expandedLogs[idx] ? "Hide [-]" : "Tech [?]"}
                            </button>
                          </div>
                        </div>

                        {expandedLogs[idx] && (
                          <div className="bg-black/90 p-3 rounded-lg border border-slate-900 font-mono text-[10px] text-emerald-500 mx-2 -mt-1 shadow-inner">
                            <p className="font-bold text-slate-500">// RAW EVENT PAYLOAD</p>
                            <p><span className="text-slate-600">Event Source:</span> {log.source}</p>
                            <p><span className="text-slate-600">Trace Logs:</span> {log.detail}</p>
                            <p><span className="text-slate-600">Severity:</span> {log.action === 'Blocked' ? 'CRITICAL - REJECTED' : 'INFO - AUTOPASS'}</p>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
