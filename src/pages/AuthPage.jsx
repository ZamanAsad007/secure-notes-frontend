import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const { login, register, theme, toggleTheme, showStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const interests = interestsInput
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i.length > 0);
      await register(name, email, password, interests);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword = 'Password123!') => {
    handleTabSwitch('signin');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
    showStatus(`Loaded credentials for ${demoEmail}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      {/* Top right theme switcher */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-color)] shadow-sm transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      <main className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-[var(--card-low)] rounded-full flex items-center justify-center shadow-sm mb-3">
            <span className="material-symbols-outlined text-[32px] text-[var(--primary)]">
              lock
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-color)]">
            Secure Notes
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Secure cloud notes & community posts
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Material 3 Tab Switch */}
          <div className="flex mb-6 bg-[var(--card-low)] p-1 rounded-full border border-[var(--card-border)]">
            <button
              onClick={() => handleTabSwitch('signin')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Sign in</span>
            </button>
            <button
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Create account</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error)] rounded-lg text-sm">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span className="flex-1">{errorMsg}</span>
              <button
                onClick={() => setErrorMsg('')}
                className="hover:opacity-75"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
              {/* Email */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Email address
                </label>
                <div className="relative flex items-center bg-[var(--card-low)] border border-[var(--card-border)] rounded-lg focus-within:border-[var(--primary)]">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--text-muted)] text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Password
                </label>
                <div className="relative flex items-center bg-[var(--card-low)] border border-[var(--card-border)] rounded-lg focus-within:border-[var(--primary)]">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--text-muted)] text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-color)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Indicator */}
              <div className="flex items-center justify-between px-1 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--tertiary)] animate-pulse"></span>
                  <span>JWT Authenticated &amp; RBAC Protected</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[var(--tertiary)]">
                  verified_user
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[var(--primary)] text-[var(--primary-text)] text-sm font-semibold rounded-full shadow hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
              {/* Full Name */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Full name
                </label>
                <div className="relative flex items-center bg-[var(--card-low)] border border-[var(--card-border)] rounded-lg focus-within:border-[var(--primary)]">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--text-muted)] text-[20px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Email address
                </label>
                <div className="relative flex items-center bg-[var(--card-low)] border border-[var(--card-border)] rounded-lg focus-within:border-[var(--primary)]">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--text-muted)] text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Master Password
                </label>
                <div className="relative flex items-center bg-[var(--card-low)] border border-[var(--card-border)] rounded-lg focus-within:border-[var(--primary)]">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--text-muted)] text-[20px]">
                    vpn_key
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    maxLength={72}
                    className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-color)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Interests */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                  Interests (comma separated)
                </label>
                <div className="relative flex items-center bg-[var(--card-low)] border border-[var(--card-border)] rounded-lg focus-within:border-[var(--primary)]">
                  <span className="material-symbols-outlined absolute left-3 text-[var(--text-muted)] text-[20px]">
                    interests
                  </span>
                  <input
                    type="text"
                    value={interestsInput}
                    onChange={(e) => setInterestsInput(e.target.value)}
                    placeholder="e.g. coding, security, chess"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-[var(--text-color)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[var(--primary)] text-[var(--primary-text)] text-sm font-semibold rounded-full shadow hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <span>Create account</span>
                )}
              </button>
            </form>
          )}

          {/* Interactive Demo Accounts Switcher */}
          <div className="mt-6 pt-4 border-t border-[var(--card-border)] -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 rounded-b-2xl bg-[var(--card-low)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
                  science
                </span>
                Interactive Demo Accounts
              </span>
              <span className="text-xs text-[var(--primary)] font-medium">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fillDemoAccount('alice@example.com', 'Password123!')}
                className="flex items-center justify-between p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--primary)] transition-colors text-left"
                type="button"
              >
                <div className="truncate">
                  <p className="text-xs font-semibold text-[var(--text-color)] truncate">
                    alice@example.com
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Standard User</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--tag-bg)] text-[var(--text-muted)] font-bold">
                  User
                </span>
              </button>

              <button
                onClick={() => fillDemoAccount('admin@example.com', 'AdminSecurePassword123!')}
                className="flex items-center justify-between p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--primary)] transition-colors text-left"
                type="button"
              >
                <div className="truncate">
                  <p className="text-xs font-semibold text-[var(--text-color)] truncate">
                    admin@example.com
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">System Admin</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary-light-text)] font-bold">
                  Admin
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[var(--tertiary)]">
              lock
            </span>
            <span>HS256 JWT</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[var(--card-border)]"></span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
              shield
            </span>
            <span>Role-Based Access</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[var(--card-border)]"></span>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[var(--tertiary)]">
              database
            </span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      </main>
    </div>
  );
};
