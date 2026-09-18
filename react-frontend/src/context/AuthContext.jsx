import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kameti_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          setToken(null);
          setUser(null);
          localStorage.removeItem('kameti_token');
          localStorage.removeItem('kameti_user');
        }
      }
      setLoading(false);
    }
    loadUser();
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
