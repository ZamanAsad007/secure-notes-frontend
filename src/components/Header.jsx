import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const Header = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin, logout, theme, toggleTheme } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'notes', label: 'My Notes', icon: 'description' },
    { id: 'posts', label: 'Posts', icon: 'forum' }
  ];

  if (isAdmin) {
    tabs.push(
      { id: 'all-notes', label: 'All Notes', icon: 'auto_stories' },
      { id: 'users', label: 'Users', icon: 'group' },
      { id: 'interests', label: 'Interests', icon: 'interests' }
    );
  }

  const handleSelectProfile = () => {
    onSelectTab('profile');
    setDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[var(--header-bg)] border-b border-[var(--header-border)] shadow-sm transition-colors duration-200">
      {/* Top Bar */}
      <div className="h-16 w-full max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('notes')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] shadow-sm">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-[var(--text-color)]">
            Secure Notes
          </span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--card-low)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              type="button"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'border-[var(--primary)] bg-[var(--card-low)] ring-2 ring-[var(--primary)]/20'
                  : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:bg-[var(--card-low)]'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-text)] font-semibold text-xs select-none">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-xs hidden sm:inline text-[var(--text-color)] max-w-[120px] truncate">
                {user?.name}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-[var(--primary-light)] text-[var(--primary-light-text)]'
                    : 'bg-[var(--card-low)] text-[var(--text-muted)]'
                }`}
              >
                {user?.role}
              </span>
              <span className="material-symbols-outlined text-[16px] text-[var(--text-muted)] transition-transform duration-200">
                {dropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xl py-2 z-50 text-[var(--text-color)] animate-in fade-in zoom-in-95 duration-150">
                {/* User Identity Info */}
                <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-text)] font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs text-[var(--text-color)] truncate">
                      {user?.name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                      {user?.email}
                    </span>
                    <span className="text-[10px] text-[var(--primary)] font-medium capitalize mt-0.5">
                      {user?.role} Account
                    </span>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="py-1">
                  <button
                    onClick={handleSelectProfile}
                    type="button"
                    className={`w-full px-4 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      currentTab === 'profile'
                        ? 'bg-[var(--primary-light)]/40 text-[var(--primary)] font-semibold'
                        : 'text-[var(--text-color)] hover:bg-[var(--card-low)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    <span>Profile & Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('notes');
                      setDropdownOpen(false);
                    }}
                    type="button"
                    className="w-full px-4 py-2 text-left text-xs flex items-center gap-2.5 text-[var(--text-color)] hover:bg-[var(--card-low)] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    <span>My Notes Vault</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    type="button"
                    className="w-full px-4 py-2 text-left text-xs flex items-center justify-between text-[var(--text-color)] hover:bg-[var(--card-low)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                      </span>
                      <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] capitalize">{theme}</span>
                  </button>
                </div>

                {/* Logout Action */}
                <div className="pt-1 border-t border-[var(--card-border)]">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    type="button"
                    className="w-full px-4 py-2 text-left text-xs flex items-center gap-2.5 text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar Accent */}
      <div className="w-full h-0.5 bg-[var(--card-border)] overflow-hidden">
        <div className="w-1/3 h-full bg-[var(--primary)] opacity-70 animate-pulse"></div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full bg-[var(--header-bg)] border-t border-[var(--card-border)]/50">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center overflow-x-auto">
          <nav className="flex items-center gap-6 sm:gap-8">
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`py-3.5 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
                    active
                      ? 'text-[var(--primary)] border-[var(--primary)]'
                      : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-color)]'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
