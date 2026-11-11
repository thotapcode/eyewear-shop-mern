import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [checking, setChecking] = useState(!!getToken());

  // kiểm tra token đã lưu còn hợp lệ không
  useEffect(() => {
    if (!getToken()) return;
    api.get('/token').then((res) => {
      if (!res.data.success) logout();
      setChecking(false);
    }).catch(() => { logout(); setChecking(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/login', { username, password });
    if (res.data.success) {
      setToken(res.data.token);
      setTokenState(res.data.token);
    }
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ token, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
