import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken   = localStorage.getItem('wa_token');
      const storedUser    = localStorage.getItem('wa_user');
      const storedProfile = localStorage.getItem('wa_profile');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setProfile(storedProfile ? JSON.parse(storedProfile) : null);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        if (!storedProfile) {
          fetchProfile();
        }
      }
    } catch (err) {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      if (data?.profile) {
        setProfile(data.profile);
        localStorage.setItem('wa_profile', JSON.stringify(data.profile));
      }
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('wa_user', JSON.stringify(data.user));
      }
    } catch (err) {
      // ignore
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    saveSession(data);
    await fetchProfile();
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    saveSession(data);
    await fetchProfile();
    return data;
  };

  const logout = async () => {
    try { await api.post('/api/auth/logout'); } catch (_) {}
    clearSession();
  };

  const updateProfile = (updatedProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('wa_profile', JSON.stringify(updatedProfile));
  };

  const saveSession = (data) => {
    setUser(data.user);
    setProfile(data.profile || null);
    setToken(data.token);
    localStorage.setItem('wa_token', data.token);
    localStorage.setItem('wa_user', JSON.stringify(data.user));
    if (data.profile) localStorage.setItem('wa_profile', JSON.stringify(data.profile));
    if (data.refreshToken) localStorage.setItem('wa_refresh_token', data.refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const clearSession = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('wa_token');
    localStorage.removeItem('wa_user');
    localStorage.removeItem('wa_profile');
    localStorage.removeItem('wa_refresh_token');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};