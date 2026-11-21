import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showStatus = (message, isError = false) => {
    setStatusMessage({ message, isError, id: Date.now() });
  };

  const dismissStatus = () => {
    setStatusMessage(null);
  };

  // Auto-restore session from /api/users/me
  useEffect(() => {
    setAuthErrorCallback((err) => {
      setUser(null);
      showStatus(err, true);
    });

    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api('/api/users/me');
        setUser(userData);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    setUser(data.user);
    showStatus(`Welcome back, ${data.user.name}!`);
    return data;
  };

  const register = async (name, email, password, interests = []) => {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, interests })
    });
    setToken(data.token);
    setUser(data.user);
    showStatus(`Account created successfully! Welcome, ${data.user.name}!`);
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    showStatus('Logged out successfully.');
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
