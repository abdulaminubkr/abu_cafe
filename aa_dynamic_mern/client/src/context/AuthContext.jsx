import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);

  const login = useCallback((token, userData, userRole) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', userRole);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setRole(userRole);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setUser(null);
    setRole(null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setRole(res.data.role);
      return res.data;
    } catch (e) {
      logout();
      return null;
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, role, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
