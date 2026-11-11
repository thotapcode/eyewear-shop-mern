import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Categories from './pages/Categories';
import './App.css';

// chỉ cho vào khi đã đăng nhập
function RequireAuth({ children }) {
  const { token, checking } = useAuth();
  if (checking) return <p className="content">Đang kiểm tra phiên đăng nhập...</p>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/categories" replace />} />
            <Route path="categories" element={<Categories />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
