import { createContext, useContext, useMemo, useState } from 'react';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('sc_user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('sc_token'));

  const value = useMemo(() => {
    const login = (userData, accessToken) => {
      setUser(userData);
      setToken(accessToken);
      localStorage.setItem('sc_user', JSON.stringify(userData));
      localStorage.setItem('sc_token', accessToken);
    };

    const logout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('sc_user');
      localStorage.removeItem('sc_token');
    };

    return { user, token, login, logout, isAuthenticated: Boolean(token) };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
