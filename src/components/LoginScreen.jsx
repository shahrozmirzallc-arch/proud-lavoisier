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

export function Logo() {
  return (
    <div className="brand">
      <img src="/ids-pulse-shield.png" alt="" />
      <div>
        <strong>IDS PULSE</strong>
        <span>Industrial Quality Operations</span>
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

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (trimmedUser.length < 3 || trimmedUser.length > 100) {
      setError('Enter a valid username.');
      return;
    }

    if (password.length < 8 || password.length > 256) {
      setError('Enter a valid password.');
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
                <small>Saved, queued and demo-synced states are never hidden.</small>
              </span>
            </div>
            <div>
              <Database weight="fill" />
              <span>
                <strong>Traceable sources</strong>
                <small>Reports identify the exact fictional device records used.</small>
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
          <p>Sign in with your authorized Super Admin account.</p>

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

          {/* 1-CLICK QUICK DEMO ACCESS BUTTONS */}
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-col gap-2 text-left">
            <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider">⚡ 1-Click Instant Demo Login:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSignedIn({ username: 'shahroz', password: 'Shahroz123$' })}
                className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/50 text-indigo-200 font-extrabold py-2 px-2.5 rounded-xl text-[12px] flex items-center gap-1.5 transition-all cursor-pointer shadow-md col-span-2 justify-center"
              >
                <span>⚡ Super Admin (Shahroz Mirza)</span>
              </button>
              <button
                type="button"
                onClick={() => onSignedIn({ username: 'greg', password: 'Greg2026!' })}
                className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 font-bold py-2 px-2.5 rounded-xl text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>👑 Owner (Greg)</span>
              </button>
              <button
                type="button"
                onClick={() => onSignedIn({ username: 'admin', password: 'Admin2026!' })}
                className="bg-sky-600/20 hover:bg-sky-600/40 border border-sky-500/40 text-sky-300 font-bold py-2 px-2.5 rounded-xl text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>👑 Admin (Donna)</span>
              </button>
              <button
                type="button"
                onClick={() => onSignedIn({ username: 'abc123', password: 'Abc1232026!' })}
                className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-bold py-2 px-2.5 rounded-xl text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🏢 Client (Abc123)</span>
              </button>
              <button
                type="button"
                onClick={() => onSignedIn({ username: 'colleen', password: 'Colleen2026!' })}
                className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold py-2 px-2.5 rounded-xl text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>💼 Accountant (Colleen)</span>
              </button>
              <button
                type="button"
                onClick={() => onSignedIn({ username: 'hugo', password: 'Hugo2026!' })}
                className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 font-bold py-2 px-2.5 rounded-xl text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>👷 Field Rep (Hugo)</span>
              </button>
            </div>
          </div>

          <small className="login-support">
            Need access help? Contact your IDS Pulse administrator.
          </small>
        </div>
      </section>
    </main>
  );
}
