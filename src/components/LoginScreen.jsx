import React, { useState } from 'react';
import {
  CheckCircle,
  Database,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react';

import { LOGO_BASE64 } from './LogoBase64';

export function Logo({ light = true }) {
  return (
    <div className="brand flex items-center justify-center w-full">
      <img 
        src={LOGO_BASE64} 
        alt="IDS Pulse Logo" 
        className="h-36 sm:h-40 md:h-44 w-auto max-w-full object-contain flex-shrink-0" 
        style={{ filter: 'none' }}
      />
    </div>
  );
}

export default function LoginScreen({ onSignedIn, onResetPassword, demoEnabled = true }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const candidateSha = import.meta.env.VITE_COMMIT_SHA || 'e7bf82c1cc0b6e49f3b5e38372331950281e6108';

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (trimmedUser.length < 2 || trimmedUser.length > 100) {
      setError('Enter a valid username or email.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    setSubmitting(true);

    try {
      // Delegate authentication processing to the parent handler
      const success = await onSignedIn({ username: trimmedUser, password });
      if (!success) {
        setError('Username or password is incorrect.');
      } else {
        setPassword('');
      }
    } catch {
      setError('Could not reach the secure sign-in service. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand-content flex flex-col justify-between py-2">
          {/* Main Headline shifted up to the top */}
          <div className="login-brand-copy !mt-0 !mb-auto pt-2">
            <span>Protected industrial pilot</span>
            <h1>Every quality decision, clearly traced.</h1>
            <p>Review incidents, approvals, time, expenses and billing from one calm, task-first workspace.</p>
          </div>
          <div className="login-trust-list mt-8">
            <div>
              <CheckCircle weight="fill" />
              <span>
                <strong>Role-scoped workspaces</strong>
                <small>Each preview shows only the modules relevant to that job.</small>
              </span>
            </div>
            <div>
              <ShieldCheck weight="fill" />
              <span>
                <strong>Visible action receipts</strong>
                <small>Saved, queued and synced states are never hidden.</small>
              </span>
            </div>
            <div>
              <Database weight="fill" />
              <span>
                <strong>Traceable sources</strong>
                <small>Reports identify the exact device records used.</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card !pt-4 sm:!pt-5 !pb-6">
          <div className="mb-2 flex items-center justify-center">
            <Logo light={true} />
          </div>
          <h2 className="text-2.5xl font-black text-slate-900 tracking-tight !mt-1 !mb-0.5">
            Welcome back
          </h2>
          <p className="text-xs font-medium text-slate-500 !mb-4 leading-relaxed">
            Sign in with your authorized credentials to access your workspace.
          </p>

          <form onSubmit={submit} noValidate>
            <label className="login-field" htmlFor="login-username">
              <span>Username</span>
              <input
                id="login-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                maxLength={100}
                placeholder="Enter your username"
              />
            </label>

            <label className="login-field" htmlFor="login-password">
              <span className="login-field-header">
                <span>Password</span>
                <button
                  type="button"
                  disabled={resetting || submitting}
                  onClick={async () => {
                    setError('');
                    setResetSuccess('');
                    const trimmedUser = username.trim();
                    if (!trimmedUser) {
                      setError('Please enter your username or email above first.');
                      return;
                    }
                    setResetting(true);
                    try {
                      if (onResetPassword) {
                        const res = await onResetPassword(trimmedUser);
                        if (res.success) {
                          setResetSuccess(res.message);
                        } else {
                          setError(res.error || 'Failed to send password reset email.');
                        }
                      }
                    } catch {
                      setError('Error sending password reset request.');
                    } finally {
                      setResetting(false);
                    }
                  }}
                  className="login-reset-link"
                >
                  {resetting ? 'Sending link…' : 'Reset My Password'}
                </button>
              </span>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={256}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash /> : <Eye />}
                </button>
              </div>
            </label>

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle weight="fill" className="text-emerald-600 text-base shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <WarningCircle weight="fill" className="text-red-500 text-base shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              className="primary-button login-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <SpinnerGap className="spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <LockKey weight="fill" />
                  Sign in to IDS Pulse
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Login Shortcuts */}
          {demoEnabled && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Quick 1-Click Role Sign-Ins:
                </span>
                <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant Access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. REP ROLE */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setError('');
                    setUsername('clarence');
                    setPassword('');
                    setSubmitting(true);
                    try {
                      const res = await onSignedIn({ username: 'clarence', isDemoMode: true });
                      if (!res) setError('Could not sign in as REP.');
                    } catch {
                      setError('Authentication error occurred.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 text-left transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-200/70 px-1.5 py-0.5 rounded">
                      REP
                    </span>
                    <span className="text-[9px] text-indigo-500 font-semibold">Mobile</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block truncate">Clarence Kuiken</strong>
                  <span className="text-[9.5px] text-indigo-600 font-medium block truncate">Quality Representative</span>
                </button>

                {/* 2. ADMIN ROLE */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setError('');
                    setUsername('donna');
                    setPassword('');
                    setSubmitting(true);
                    try {
                      const res = await onSignedIn({ username: 'donna', isDemoMode: true });
                      if (!res) setError('Could not sign in as ADMIN.');
                    } catch {
                      setError('Authentication error occurred.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-3 rounded-xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/80 text-left transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/70 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                    <span className="text-[9px] text-sky-500 font-semibold">Lead</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block truncate">Donna Cabral</strong>
                  <span className="text-[9.5px] text-sky-600 font-medium block truncate">Operations Lead Admin</span>
                </button>

                {/* 3. ACCOUNTANT ROLE */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setError('');
                    setUsername('colleen');
                    setPassword('');
                    setSubmitting(true);
                    try {
                      const res = await onSignedIn({ username: 'colleen', isDemoMode: true });
                      if (!res) setError('Could not sign in as ACCOUNTANT.');
                    } catch {
                      setError('Authentication error occurred.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 text-left transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                      ACCOUNTANT
                    </span>
                    <span className="text-[9px] text-amber-600 font-semibold">Billing</span>
                  </div>
                <strong className="text-xs font-bold text-slate-900 block truncate">Colleen Boyd</strong>
                  <span className="text-[9.5px] text-amber-700 font-medium block truncate">Financial Controller</span>
                </button>

                {/* 4. CLIENT ROLE */}
                {/* CLIENT — Stellantis Client (Mark Vance) */}
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setError('');
                    setUsername('autokabel');
                    setPassword('');
                    setSubmitting(true);
                    try {
                      const res = await onSignedIn({ username: 'stellantis_client', isDemoMode: true });
                      if (!res) setError('Could not sign in as CLIENT.');
                    } catch {
                      setError('Authentication error occurred.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 text-left transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-1.5 py-0.5 rounded">
                      CLIENT
                    </span>
                    <span className="text-[9px] text-emerald-600 font-semibold">Portal</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block truncate">Stellantis Client</strong>
                  <span className="text-[9.5px] text-emerald-700 font-medium block truncate">Mark Vance (Quality Mgr)</span>
                </button>

                {/* CLIENT — Magna Client (Robert Sterling) */}
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setUsername('magna_client');
                    setPassword('');
                    setSubmitting(true);
                    try {
                      const res = await onSignedIn({ username: 'magna_client', isDemoMode: true });
                      if (!res) setError('Could not sign in as Magna Client.');
                    } catch {
                      setError('Authentication error occurred.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-left transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-blue-800 bg-blue-200/70 px-1.5 py-0.5 rounded">
                      CLIENT
                    </span>
                    <span className="text-[9px] text-blue-600 font-semibold">Magna</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block truncate">Magna Client</strong>
                  <span className="text-[9.5px] text-blue-700 font-medium block truncate">Robert Sterling (Quality Dir)</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 text-center">
            <small className="text-xs text-slate-500 font-medium block">
              Need access help? Contact your IDS Pulse administrator.
            </small>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">
              Candidate Build SHA: <span className="font-bold text-sky-600">{candidateSha}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
