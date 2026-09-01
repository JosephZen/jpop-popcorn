"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Load saved token & theme on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('jpop_token');
    const savedTheme = localStorage.getItem('jpop_theme') || 'light';

    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (savedToken) {
      setToken(savedToken);
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('jpop_token');
          setToken(null);
          setUser(null);
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
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('jpop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const adminLogin = async (key, username) => {
    const { data } = await authAPI.adminLogin({ key, username });
    localStorage.setItem('jpop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('jpop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('jpop_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
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

export default AuthContext;
