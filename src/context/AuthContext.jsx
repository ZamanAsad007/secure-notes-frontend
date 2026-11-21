import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken, setAuthErrorCallback } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('secure_notes_theme') || 'light';
  });
  const [statusMessage, setStatusMessage] = useState(null);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('secure_notes_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const showStatus = useCallback((message, isError = false) => {
    setStatusMessage({ message, isError, id: Date.now() });
  }, []);

  const dismissStatus = useCallback(() => {
    setStatusMessage(null);
  }, []);

  // Auto-restore session from /api/users/me
  useEffect(() => {
    setAuthErrorCallback((err) => {
      setUser(null);
      showStatus(err, true);
    });

    let active = true;
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }
      try {
        const userData = await api('/api/users/me');
        if (active) setUser(userData);
      } catch {
        clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, [showStatus]);

  const login = useCallback(async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    setUser(data.user);
    showStatus(`Welcome back, ${data.user.name}!`);
    return data;
  }, [showStatus]);

  const register = useCallback(async (name, email, password, interests = []) => {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, interests })
    });
    setToken(data.token);
    setUser(data.user);
    showStatus(`Account created successfully! Welcome, ${data.user.name}!`);
    return data;
  }, [showStatus]);

  const logout = useCallback(() => {
    clearToken();
    try {
      localStorage.removeItem('secure_notes_current_tab');
      sessionStorage.removeItem('secure_notes_current_tab');
    } catch {
      // ignore
    }
    setUser(null);
    showStatus('Logged out successfully.');
  }, [showStatus]);

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser) return;
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  const value = {
    user,
    loading,
    theme,
    toggleTheme,
    statusMessage,
    showStatus,
    dismissStatus,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
