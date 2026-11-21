import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, updateUser, isAdmin, showStatus } = useAuth();

  const [name, setName] = useState(() => user?.name || '');
  const [interests, setInterests] = useState(() => user?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync internal state if external user object changes
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setName(user?.name || '');
    setInterests(user?.interests || []);
  }

  // RBAC test states
  const [rbacTesting, setRbacTesting] = useState(false);
  const [rbacResult, setRbacResult] = useState(null);

  const handleAddInterest = (e) => {
    e.preventDefault();
    const tag = newInterest.trim().toLowerCase();
    if (!tag) return;
    if (interests.includes(tag)) {
      showStatus(`Interest "${tag}" already exists`, true);
      return;
    }
    if (tag.length > 30) {
      showStatus('Interest must be 30 characters or fewer', true);
      return;
    }
    setInterests([...interests, tag]);
    setNewInterest('');
  };

  const handleRemoveInterest = (tag) => {
    setInterests(interests.filter((i) => i !== tag));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showStatus('Name is required', true);
      return;
    }

    setSaving(true);
    try {
      const res = await api('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          interests
        })
      });
      const updatedUser = res?.data || res;
      updateUser(updatedUser);
      showStatus('Profile updated successfully');
    } catch (err) {
      showStatus(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestRbac = async () => {
    setRbacTesting(true);
    setRbacResult(null);
    try {
      const res = await api('/api/users');
      setRbacResult({
        success: true,
        status: 200,
        message: `Admin access authorized! Retrieved ${res.data?.length || 0} user accounts from /api/users.`
      });
    } catch (err) {
      setRbacResult({
        success: false,
        status: err.status || 403,
        message: err.message || 'Access Denied: Role "user" lacks administrative privileges.'
      });
    } finally {
      setRbacTesting(false);
    }
  };

  return (
    <main className="w-full pt-[114px] bg-[var(--bg-color)] min-h-[calc(100vh-64px)] pb-12 transition-colors duration-200">
      <div className="max-w-[760px] mx-auto p-4 sm:p-6">
        <div className="flex flex-col w-full gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1 pb-4 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-semibold tracking-wider uppercase">
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Account Credentials</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-color)]">Profile</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage your vault identity, tags, and security clearances</p>
          </div>

          {/* Identity Card */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-[var(--primary-text)] font-semibold text-2xl flex items-center justify-center shadow-md select-none">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col items-center sm:items-start gap-1 flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h2 className="text-xl font-bold text-[var(--text-color)]">{user?.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-[var(--primary-light)] text-[var(--primary-light-text)] border border-[var(--card-border)]'
                      : 'bg-[var(--card-low)] text-[var(--text-muted)] border border-[var(--card-border)]'
                  }`}
                >
                  {user?.role || 'user'}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] font-mono">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[var(--tertiary)]">verified</span>
                  Active Clearance
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">event</span>
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-base font-semibold text-[var(--text-color)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">manage_accounts</span>
              Edit Profile Information
            </h3>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider" htmlFor="profileName">
                  Full Name
                </label>
                <input
                  id="profileName"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  type="text"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider" htmlFor="profileEmail">
                    Email Address
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Non-modifiable identifier
                  </span>
                </div>
                <input
                  id="profileEmail"
                  className="w-full h-11 px-3.5 rounded-lg bg-[var(--card-low)]/50 border border-[var(--card-border)] text-[var(--text-muted)] text-sm font-mono cursor-not-allowed"
                  value={user?.email || ''}
                  disabled
                  type="email"
                />
              </div>

              {/* Interests (Tags) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-color)] uppercase tracking-wider">
                    Interests & Specialties
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)]">Indexed for Scenario 1 queries</span>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--card-low)] rounded-lg border border-[var(--card-border)] min-h-[48px]">
                  {interests.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)] italic">No interests added yet</span>
                  ) : (
                    interests.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card-bg)] text-[var(--primary)] text-xs font-medium border border-[var(--card-border)] shadow-xs"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tag)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors p-0.5 rounded-full cursor-pointer"
                          title={`Remove ${tag}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Interest Input */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    className="flex-1 h-10 px-3.5 rounded-lg bg-[var(--card-low)] border border-[var(--card-border)] text-[var(--text-color)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="Add an interest (e.g. cryptography, distributed-systems)..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest(e);
                      }
                    }}
                    type="text"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="h-10 px-4 rounded-lg bg-[var(--card-low)] hover:bg-[var(--card-border)] text-[var(--text-color)] text-xs font-medium border border-[var(--card-border)] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-6 rounded-full bg-[var(--primary)] text-[var(--primary-text)] text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {saving ? 'refresh' : 'save'}
                  </span>
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* RBAC Boundary Verification Section */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--card-low)] border border-[var(--card-border)] flex items-center justify-center text-[var(--primary)]">
                  <span className="material-symbols-outlined text-[18px]">security</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-color)]">
                    Role-Based Access Control (RBAC) Verification
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Verify authorization boundary on administrative routes
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--card-low)] text-[var(--text-muted)] border border-[var(--card-border)]">
                Role: {user?.role}
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              In this system, <code className="px-1 py-0.5 rounded bg-[var(--card-low)] font-mono text-[var(--text-color)]">/api/users</code> is strictly protected by the <code className="px-1 py-0.5 rounded bg-[var(--card-low)] font-mono text-[var(--text-color)]">authorize('admin')</code> middleware. Test the security boundary below:
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestRbac}
                disabled={rbacTesting}
                className="h-10 px-5 rounded-full bg-[var(--card-low)] hover:bg-[var(--card-border)] text-[var(--text-color)] text-xs font-semibold border border-[var(--card-border)] transition-all flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {rbacTesting ? 'refresh' : 'verified_user'}
                </span>
                <span>{rbacTesting ? 'Testing Clearance...' : 'Try Admin Action (GET /api/users)'}</span>
              </button>
            </div>

            {rbacResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  rbacResult.success
                    ? 'bg-[var(--card-low)] border-[var(--tertiary)]/30 text-[var(--text-color)]'
                    : 'bg-[var(--error-bg)] border-[var(--error)]/30 text-[var(--error-text)]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                  {rbacResult.success ? 'check_circle' : 'gpp_bad'}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    {rbacResult.success
                      ? `Access Granted (${rbacResult.status})`
                      : `RBAC Boundary Enforced (${rbacResult.status} Forbidden)`}
                  </span>
                  <p className="text-xs leading-relaxed">{rbacResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
