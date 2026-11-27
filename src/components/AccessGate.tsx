import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';

interface AccessGateProps {
  initialized: boolean;
  envConfigured: boolean;
  onAuthenticated: (token: string, username: string) => void;
}

export function AccessGate({
  initialized,
  envConfigured,
  onAuthenticated,
}: AccessGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSetupMode = !initialized;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Please enter both username and password.');
      return;
    }

    if (isSetupMode) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = isSetupMode ? '/api/auth/setup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUser, password }),
      });
      const data = (await res.json()) as {
        token?: string;
        username?: string;
        error?: string;
      };
      if (!res.ok || !data.token || !data.username) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setPassword('');
      setConfirmPassword('');
      onAuthenticated(data.token, data.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-lg p-6 space-y-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            {isSetupMode ? (
              <KeyRound className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Lock className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider">
              Aurum Quant Terminal
            </span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {isSetupMode ? 'Claim Terminal Access Credentials' : 'Sign In to Terminal'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isSetupMode
              ? 'Set your primary username and password for this preview session, or configure APP_ACCESS_USERNAME and APP_ACCESS_PASSWORD in Settings > Secrets.'
              : envConfigured
              ? 'Enter your configured terminal username and password to unlock live XAUUSD charts and AI signals.'
              : 'Enter your terminal username and password to unlock live XAUUSD charts and AI signals.'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-md"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
              placeholder="Enter username"
              className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                required
                minLength={isSetupMode ? 8 : 1}
                maxLength={128}
                placeholder="Enter password"
                className="w-full h-10 pl-3 pr-10 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </label>

          {isSetupMode && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Confirm Password
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder="Re-enter password"
                className="w-full h-10 px-3 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            {submitting
              ? isSetupMode
                ? 'Saving Credentials...'
                : 'Signing In...'
              : isSetupMode
              ? 'Save & Unlock Terminal'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
