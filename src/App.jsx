import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Snackbar } from './components/Snackbar';
import { AuthPage } from './pages/AuthPage';
import { NotesPage } from './pages/NotesPage';
import { PostsPage } from './pages/PostsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAllNotesPage } from './pages/AdminAllNotesPage';
import { AdminInterestsPage } from './pages/AdminInterestsPage';

const VALID_TABS = ['notes', 'posts', 'profile', 'all-notes', 'users', 'interests'];
const ADMIN_ONLY_TABS = ['all-notes', 'users', 'interests'];

/**
 * Resolves the active tab from:
 * 1. URL Pathname (e.g. '/posts', '/users')
 * 2. URL Hash (e.g. '#posts')
 * 3. URL Query Param (e.g. '?tab=posts')
 * 4. Stored tab in localStorage / sessionStorage
 * Defaults to 'notes'.
 */
const resolveTabFromLocation = () => {
  if (typeof window === 'undefined') return 'notes';

  // 1. Pathname check (e.g. '/posts', '/all-notes')
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (VALID_TABS.includes(path)) {
    return path;
  }

  // 2. Hash check (e.g. '#posts')
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  if (VALID_TABS.includes(hash)) {
    return hash;
  }

  // 3. Query param check (e.g. '?tab=posts')
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (VALID_TABS.includes(tabParam)) {
    return tabParam;
  }

  // 4. Stored tab from localStorage or sessionStorage
  try {
    const stored =
      localStorage.getItem('secure_notes_current_tab') ||
      sessionStorage.getItem('secure_notes_current_tab');
    if (VALID_TABS.includes(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }

  return 'notes';
};

const AppContent = () => {
  const { user, loading, isAdmin } = useAuth();

  // Initialize from location without discarding admin tabs prematurely while auth is loading
  const [currentTab, setCurrentTab] = useState(() => resolveTabFromLocation());
  const [selectedPostAuthor, setSelectedPostAuthor] = useState(null);

  // Compute active tab ensuring RBAC security once role is known
  const activeTab = !loading && !isAdmin && ADMIN_ONLY_TABS.includes(currentTab)
    ? 'notes'
    : currentTab;

  const navigateToTab = (tab, replace = false) => {
    let target = tab;
    if (!VALID_TABS.includes(target) || (!isAdmin && ADMIN_ONLY_TABS.includes(target))) {
      target = 'notes';
    }
    setCurrentTab(target);
    try {
      localStorage.setItem('secure_notes_current_tab', target);
      sessionStorage.setItem('secure_notes_current_tab', target);
    } catch {
      // ignore
    }

    const targetPath = target === 'notes' ? '/' : `/${target}`;
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab: target }, '', targetPath);
      } else {
        window.history.pushState({ tab: target }, '', targetPath);
      }
    }
  };

  // Sync state on browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const tab = resolveTabFromLocation();
      setCurrentTab(tab);
      try {
        localStorage.setItem('secure_notes_current_tab', tab);
        sessionStorage.setItem('secure_notes_current_tab', tab);
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync URL bar and storage once auth is verified (DO NOT wipe URL during loading!)
  useEffect(() => {
    if (loading || !user) return;

    const targetPath = activeTab === 'notes' ? '/' : `/${activeTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({ tab: activeTab }, '', targetPath);
    }
    try {
      localStorage.setItem('secure_notes_current_tab', activeTab);
      sessionStorage.setItem('secure_notes_current_tab', activeTab);
    } catch {
      // ignore
    }
  }, [loading, user, activeTab]);

  const handleNavigateToPosts = (userId, userName) => {
    setSelectedPostAuthor({ id: userId, name: userName });
    navigateToTab('posts');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-color)] gap-4 transition-colors">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--primary-light)] border-t-[var(--primary)] animate-spin"></div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
          <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">lock</span>
          <span>Verifying encrypted session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Snackbar />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-200">
      {/* Top App Header & Tab Navigation */}
      <Header
        currentTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'posts') setSelectedPostAuthor(null);
          navigateToTab(tab);
        }}
      />

      {/* Main Tab Content */}
      <div className="flex-1">
        {activeTab === 'notes' && <NotesPage />}
        {activeTab === 'posts' && (
          <PostsPage
            initialAuthor={selectedPostAuthor}
          />
        )}
        {activeTab === 'profile' && <ProfilePage />}
        {isAdmin && activeTab === 'all-notes' && (
          <AdminAllNotesPage
            onNavigateToPosts={handleNavigateToPosts}
          />
        )}
        {isAdmin && activeTab === 'users' && (
          <AdminUsersPage
            onNavigateToPosts={handleNavigateToPosts}
          />
        )}
        {isAdmin && activeTab === 'interests' && (
          <AdminInterestsPage
            onNavigateToPosts={handleNavigateToPosts}
          />
        )}
      </div>

      {/* System Footer */}
      <footer className="w-full bg-[var(--header-bg)] border-t border-[var(--card-border)] py-4 transition-colors">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>Secure Notes — Encrypted Vault & Public Community Timeline</span>
          <div className="flex items-center gap-4">
            <span className="text-[var(--tertiary)] flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              End-to-End Encrypted
            </span>
            <span>AES-256</span>
          </div>
        </div>
      </footer>

      {/* Global Snackbar */}
      <Snackbar />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
