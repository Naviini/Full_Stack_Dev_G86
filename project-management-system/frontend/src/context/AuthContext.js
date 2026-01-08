import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socketService';

export const AuthContext = createContext();

// Generate unique tab ID
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tabId] = useState(TAB_ID);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        // Token changed in another tab
        if (e.newValue && e.newValue !== token) {
          // Another tab logged in with a different token
          setToken(e.newValue);
        } else if (!e.newValue && token) {
          // Another tab logged out
          setToken(null);
          setUser(null);
          socketService.disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then((res) => {
          setUser(res.data);
          // Initialize WebSocket connection upon successful login
          socketService.connect(token);
          // Store tab info for debugging
          sessionStorage.setItem(`tab_user_${TAB_ID}`, res.data.id);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          socketService.disconnect();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      socketService.disconnect();
    }
  }, [token]);

  const login = (userData, newToken) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // Store tab info for debugging
    sessionStorage.setItem(`tab_user_${TAB_ID}`, userData.id);
    // Initialize WebSocket connection on login
    socketService.connect(newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem(`tab_user_${TAB_ID}`);
    // Disconnect WebSocket on logout
    socketService.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token, tabId }}>
      {children}
    </AuthContext.Provider>
  );
};
