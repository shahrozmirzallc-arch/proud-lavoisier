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

export function Logo({ light = false }) {
  return (
    <div className="brand flex items-center gap-3">
      <img 
        src={LOGO_BASE64} 
        alt="IDS Pulse Logo" 
        className="h-11 w-auto object-contain flex-shrink-0" 
        style={{ filter: light ? 'none' : 'brightness(0) invert(1)' }}
      />
      <div className="flex flex-col text-left leading-none">
        <strong className={light ? "text-slate-900 font-black text-xl tracking-tight" : "text-white font-black text-xl tracking-tight"}>
          IDS PULSE
        </strong>
        <span className={light ? "text-slate-600 font-semibold text-[9.5px] uppercase tracking-widest mt-1" : "text-blue-200 font-semibold text-[9.5px] uppercase tracking-widest mt-1"}>
          INTEGRITY DRIVEN SOLUTIONS INC.
        </span>
      </div>
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
        <div className="login-brand-content">
          <Logo />
          <div className="login-brand-copy">
            <span>Protected industrial pilot</span>
            <h1>Every quality decision, clearly traced.</h1>
            <p>Review incidents, approvals, time, expenses and billing from one calm, task-first workspace.</p>
          </div>
          <div className="login-trust-list">
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
        <div className="login-card">
          <div className="login-mobile-brand">
            <Logo />
          </div>
          <div className="login-lock">
            <LockKey weight="fill" />
          </div>
          <span className="login-eyebrow">IDS Pulse secure access</span>
          <h2>Welcome back</h2>
          <p>Sign in with your authorized credentials to access your workspace.</p>

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
              <div className="p-3 mb-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2" role="status">
                <CheckCircle weight="fill" className="text-emerald-400 text-base shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {error && (
              <div className="login-error" role="alert">
                <WarningCircle weight="fill" />
                {error}
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
                  Signing in securely…
                </>
              ) : (
                <>
                  <LockKey />
                  Sign in to IDS Pulse
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Login Shortcuts (REP, ADMIN, ACCOUNTANT, CLIENT) */}
          {demoEnabled && (
            <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Quick 1-Click Role Sign-Ins:
                </span>
                <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  Instant Access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                  className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-500/40 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-200/60 dark:bg-indigo-900/80 px-1.5 py-0.5 rounded">
                      REP
                    </span>
                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-mono">Mobile</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 dark:text-indigo-100 block">Clarence Kuiken</strong>
                  <span className="text-[9.5px] text-indigo-600 dark:text-indigo-300 font-medium block">Quality Representative</span>
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
                  className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 border border-sky-200 dark:border-sky-500/40 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-200/60 dark:bg-sky-900/80 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                    <span className="text-[9px] text-sky-500 dark:text-sky-400 font-mono">Lead</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 dark:text-sky-100 block">Donna Cabral</strong>
                  <span className="text-[9.5px] text-sky-600 dark:text-sky-300 font-medium block">Operations Lead Admin</span>
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
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 border border-amber-200 dark:border-amber-500/40 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/80 px-1.5 py-0.5 rounded">
                      ACCOUNTANT
                    </span>
                    <span className="text-[9px] text-amber-500 dark:text-amber-400 font-mono">Billing</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 dark:text-amber-100 block">Colleen Boyd</strong>
                  <span className="text-[9.5px] text-amber-600 dark:text-amber-300 font-medium block">Financial Controller</span>
                </button>

                {/* 4. CLIENT ROLE */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setError('');
                    setUsername('autokabel');
                    setPassword('');
                    setSubmitting(true);
                    try {
                      const res = await onSignedIn({ username: 'autokabel', isDemoMode: true });
                      if (!res) setError('Could not sign in as CLIENT.');
                    } catch {
                      setError('Authentication error occurred.');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-500/40 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded">
                      CLIENT
                    </span>
                    <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-mono">Portal</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 dark:text-emerald-100 block">AutoKabel Client</strong>
                  <span className="text-[9.5px] text-emerald-600 dark:text-emerald-300 font-medium block">Supplier Quality Partner</span>
                </button>
              </div>
            </div>
          )}

          <small className="login-support mt-3">
            Need access help? Contact your IDS Pulse administrator.
          </small>
          <div className="mt-3 text-center text-[10px] text-slate-400 font-mono">
            Candidate Build SHA: <span className="font-bold text-sky-400">{candidateSha}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
