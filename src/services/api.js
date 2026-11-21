const TOKEN_KEY = 'secure_notes_token';

let onAuthErrorCallback = null;

export const setAuthErrorCallback = (cb) => {
  onAuthErrorCallback = cb;
};

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage restrictions
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

/**
 * Robust API base URL resolver.
 * Handles:
 *  - empty / undefined -> defaults to '/api'
 *  - 'https://api.example.com' (without /api) -> appends '/api'
 *  - 'https://api.example.com/api' (with /api) -> avoids duplicating '/api'
 *  - '/api' -> proxies to local dev or root relative path
 */
export const buildApiUrl = (endpoint) => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const base = envUrl || '/api';

  // Normalize endpoint: ensure it starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base.endsWith('/api')) {
    // Base already includes '/api'
    const pathWithoutApi = cleanEndpoint.startsWith('/api/')
      ? cleanEndpoint.slice(4) // '/api/notes' -> '/notes'
      : cleanEndpoint === '/api'
      ? ''
      : cleanEndpoint;
    return `${base}${pathWithoutApi}`;
  } else {
    // Base does NOT end with '/api' (e.g. 'https://my-backend.onrender.com')
    const pathWithApi =
      cleanEndpoint.startsWith('/api/') || cleanEndpoint === '/api'
        ? cleanEndpoint
        : `/api${cleanEndpoint}`;
    return `${base}${pathWithApi}`;
  }
};

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

  const url = buildApiUrl(endpoint);

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (err) {
    const networkError = new Error(
      'Unable to connect to the server. Please check your internet connection or verify the backend service is running.'
    );
    networkError.originalError = err;
    throw networkError;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      const isAuthEndpoint =
        endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
      if (onAuthErrorCallback && !isAuthEndpoint) {
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
