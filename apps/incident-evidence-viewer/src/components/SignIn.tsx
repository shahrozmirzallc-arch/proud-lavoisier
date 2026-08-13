import { useState, type FormEvent } from "react";

interface SignInProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function SignIn({ onSubmit }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-context" aria-labelledby="auth-context-title">
        <div className="wordmark wordmark-light" aria-label="IDS Pulse">
          <span className="wordmark-ids">IDS</span>
          <span className="wordmark-pulse">PULSE</span>
        </div>
        <div className="auth-context-copy">
          <p className="eyebrow eyebrow-light">Incident evidence</p>
          <h1 id="auth-context-title">Released quality records, with evidence kept private.</h1>
          <p>
            Authorized Client and IDS administrators can review immediate Incident records and
            request short-lived access to verified media.
          </p>
        </div>
        <p className="auth-boundary">IDS Pulse staging workspace</p>
      </section>

      <section className="auth-form-panel" aria-labelledby="sign-in-title">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div>
            <p className="eyebrow">Protected access</p>
            <h2 id="sign-in-title">Sign in</h2>
            <p className="form-intro">
              Use the Supabase Auth account assigned to your IDS Pulse staging workspace.
            </p>
          </div>

          <label className="field" htmlFor="viewer-email">
            <span>Email</span>
            <input
              id="viewer-email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />
          </label>

          <label className="field" htmlFor="viewer-password">
            <span>Password</span>
            <input
              id="viewer-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              maxLength={256}
              required
            />
          </label>

          {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

          <button
            className="button button-primary button-wide"
            type="submit"
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? "Verifying identity" : "Continue securely"}
          </button>

          <p className="form-footnote">
            Access is decided by database policy. This viewer does not accept demo roles or
            locally stored role claims.
          </p>
        </form>
      </section>
    </main>
  );
}
