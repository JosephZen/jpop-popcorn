"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Load saved token, user & theme on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('jpop_token');
    const savedUserStr = localStorage.getItem('jpop_user');
    const savedTheme = localStorage.getItem('jpop_theme') || 'light';

    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    let parsedUser = null;
    try {
      if (savedUserStr) parsedUser = JSON.parse(savedUserStr);
    } catch {}

    if (savedToken) {
      setToken(savedToken);
      if (parsedUser) setUser(parsedUser);

      authAPI.getMe()
        .then(({ data }) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('jpop_user', JSON.stringify(data.user));
          }
        })
        .catch((err) => {
          // Only clear if 401 unauthorized
          if (err.response?.status === 401) {
            localStorage.removeItem('jpop_token');
            localStorage.removeItem('jpop_user');
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('jpop_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('jpop_token', data.token);
      localStorage.setItem('jpop_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      // Ephemeral serverless fallback: if account was registered on this device
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        try {
          const registry = JSON.parse(localStorage.getItem('jpop_local_registry') || '[]');
          const normalized = (email || '').toLowerCase().trim();
          const match = registry.find(u => u.email === normalized && u.password === password);
          if (match) {
            const regRes = await authAPI.register({
              name: match.name,
              email: match.email,
              password: match.password,
              phone: match.phone,
              address: match.address,
            });
            if (regRes.data?.token) {
              localStorage.setItem('jpop_token', regRes.data.token);
              localStorage.setItem('jpop_user', JSON.stringify(regRes.data.user));
              setToken(regRes.data.token);
              setUser(regRes.data.user);
              return regRes.data;
            }
          }
        } catch {}
      }
      throw err;
    }
  };

  const adminLogin = async (key, username) => {
    const { data } = await authAPI.adminLogin({ key, username });
    localStorage.setItem('jpop_token', data.token);
    localStorage.setItem('jpop_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const loginWithToken = async (newToken) => {
    localStorage.setItem('jpop_token', newToken);
    setToken(newToken);
    const { data } = await authAPI.getMe();
    if (data?.user) {
      localStorage.setItem('jpop_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('jpop_token', data.token);
    localStorage.setItem('jpop_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    // Save to device registry for seamless persistence across serverless cold starts
    try {
      const registry = JSON.parse(localStorage.getItem('jpop_local_registry') || '[]');
      const normalized = (formData.email || '').toLowerCase().trim();
      const filtered = registry.filter(u => u.email !== normalized);
      filtered.push({
        name: formData.name,
        email: normalized,
        password: formData.password,
        phone: formData.phone || null,
        address: formData.address || null,
      });
      localStorage.setItem('jpop_local_registry', JSON.stringify(filtered));
    } catch {}

    return data;
  };

  const logout = () => {
    localStorage.removeItem('jpop_token');
    localStorage.removeItem('jpop_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const { data } = await authAPI.getMe();
      if (data?.user) {
        localStorage.setItem('jpop_user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch {}
  };

  const isAdmin = (user?.role || '').toLowerCase() === 'admin' ||
    (user?.email || '').toLowerCase() === 'admin@gmail.com';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        isAuthenticated,
        isAdmin,
        toggleTheme,
        login,
        adminLogin,
        loginWithToken,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
