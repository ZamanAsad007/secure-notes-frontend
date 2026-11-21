import React, { useState } from 'react';
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

const AppContent = () => {
  const { user, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('notes');
  const [selectedPostAuthor, setSelectedPostAuthor] = useState(null);

  const handleNavigateToPosts = (userId, userName) => {
    setSelectedPostAuthor({ id: userId, name: userName });
    setCurrentTab('posts');
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
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'posts') setSelectedPostAuthor(null);
          setCurrentTab(tab);
        }}
      />

      {/* Main Tab Content */}
      <div className="flex-1">
        {currentTab === 'notes' && <NotesPage />}
        {currentTab === 'posts' && (
          <PostsPage
            initialAuthor={selectedPostAuthor}
          />
        )}
        {currentTab === 'profile' && <ProfilePage />}
        {isAdmin && currentTab === 'all-notes' && (
          <AdminAllNotesPage
            onNavigateToPosts={handleNavigateToPosts}
          />
        )}
        {isAdmin && currentTab === 'users' && (
          <AdminUsersPage
            onNavigateToPosts={handleNavigateToPosts}
          />
        )}
        {isAdmin && currentTab === 'interests' && (
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
