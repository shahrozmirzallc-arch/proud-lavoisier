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

export default function LoginScreen({ onSignedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
              <span>Password</span>
              <div>
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

          {/* Quick 1-Click Login Shortcuts */}
          <div className="mt-4 pt-4 border-t border-slate-700/60">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2 text-center">
              Quick 1-Click Test Sign-Ins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError('');
                  setUsername('clarence');
                  setPassword('password123');
                  setSubmitting(true);
                  try {
                    const res = await onSignedIn({ username: 'clarence', password: 'password123' });
                    if (!res) setError('Could not sign in as Rep.');
                  } catch {
                    setError('Authentication error occurred.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-2.5 py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-200 text-xs font-bold transition-all text-left flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] font-extrabold text-indigo-300">Clarence Kuiken</span>
                <span className="text-[9px] text-indigo-400 font-mono">Rep • Quality Inspector</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError('');
                  setUsername('donna');
                  setPassword('password123');
                  setSubmitting(true);
                  try {
                    const res = await onSignedIn({ username: 'donna', password: 'password123' });
                    if (!res) setError('Could not sign in as Admin.');
                  } catch {
                    setError('Authentication error occurred.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-2.5 py-2 rounded-lg bg-sky-950/70 hover:bg-sky-900 border border-sky-500/30 text-sky-200 text-xs font-bold transition-all text-left flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] font-extrabold text-sky-300">Donna Cabral</span>
                <span className="text-[9px] text-sky-400 font-mono">Admin • Operations Lead</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError('');
                  setUsername('colleen');
                  setPassword('password123');
                  setSubmitting(true);
                  try {
                    const res = await onSignedIn({ username: 'colleen', password: 'password123' });
                    if (!res) setError('Could not sign in as Accountant.');
                  } catch {
                    setError('Authentication error occurred.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-2.5 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/30 text-amber-200 text-xs font-bold transition-all text-left flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] font-extrabold text-amber-300">Colleen Boyd</span>
                <span className="text-[9px] text-amber-400 font-mono">Accountant • Controller</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError('');
                  setUsername('autokabel');
                  setPassword('password123');
                  setSubmitting(true);
                  try {
                    const res = await onSignedIn({ username: 'autokabel', password: 'password123' });
                    if (!res) setError('Could not sign in as AutoKabel Client.');
                  } catch {
                    setError('Authentication error occurred.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-2.5 py-2 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 text-xs font-bold transition-all text-left flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] font-extrabold text-cyan-300">AutoKabel Client</span>
                <span className="text-[9px] text-cyan-400 font-mono">AutoKabel • Quality Portal</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setError('');
                  setUsername('customer');
                  setPassword('password123');
                  setSubmitting(true);
                  try {
                    const res = await onSignedIn({ username: 'customer', password: 'password123' });
                    if (!res) setError('Could not sign in as Client.');
                  } catch {
                    setError('Authentication error occurred.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="px-2.5 py-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 text-xs font-bold transition-all text-left flex flex-col cursor-pointer disabled:opacity-50"
              >
                <span className="text-[11px] font-extrabold text-emerald-300">Client Partner</span>
                <span className="text-[9px] text-emerald-400 font-mono">Client • Quality Portal</span>
              </button>
            </div>
          </div>

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
