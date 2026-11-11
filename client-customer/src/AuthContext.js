import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth-expired', logout);
    return () => window.removeEventListener('auth-expired', logout);
  }, [logout]);

  // khôi phục phiên đăng nhập từ token đã lưu
  useEffect(() => {
    if (!getToken()) return;
    api.get('/token')
      .then((res) => (res.data.success ? setCustomer(res.data.customer) : logout()))
      .catch(logout)
      .finally(() => setChecking(false));
  }, [logout]);

  const login = async (username, password) => {
    const res = await api.post('/login', { username, password });
    if (res.data.success) {
      setToken(res.data.token);
      setCustomer(res.data.customer);
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ customer, setCustomer, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
