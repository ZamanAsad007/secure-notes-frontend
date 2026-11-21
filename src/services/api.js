const TOKEN_KEY = 'secure_notes_token';

let onAuthErrorCallback = null;

export const setAuthErrorCallback = (cb) => {
  onAuthErrorCallback = cb;
};

export const getToken = () => {
  return sessionStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
};

export const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

/**
 * Universal API fetch helper
 */
export const api = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Normalize endpoint: handle '/api/...', '/...', or '...'
  let cleanEndpoint = endpoint;
  if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.slice(4);
  } else if (cleanEndpoint === '/api') {
    cleanEndpoint = '';
  } else if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }

  const url = `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      if (onAuthErrorCallback) {
        onAuthErrorCallback(data?.error || 'Session expired. Please log in again.');
      }
    }
    const errorMessage = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
