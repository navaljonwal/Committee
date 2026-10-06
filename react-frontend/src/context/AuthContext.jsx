import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Synchronously initialize from localStorage so there is ZERO flicker or false unauthenticated state on refresh
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kameti_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('kameti_token'));

  // Only consider loading if we have a token but haven't loaded the user yet
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('kameti_token') && !localStorage.getItem('kameti_user');
  });

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const savedToken = localStorage.getItem('kameti_token');
      if (!savedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('kameti_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Session verification error:', err);
        // ONLY clear credentials if server explicitly responded with 401 (Invalid/expired token)
        if (err.response?.status === 401 || err.response?.status === 403) {
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('kameti_token');
            localStorage.removeItem('kameti_user');
          }
        }
        // If it's a network glitch or temporary backend restart, keep existing cached user session
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => { isMounted = false; };
  }, [token]);

  const login = async (identity, password) => {
    const res = await api.post('/auth/login', { identity, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('kameti_token', res.data.token);
      localStorage.setItem('kameti_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('kameti_token');
    localStorage.removeItem('kameti_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
