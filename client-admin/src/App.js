import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider } from './components/UI';
import Layout from './components/Layout';
import Login from './pages/Login';
import Categories from './pages/Categories';
import Products from './pages/Products';

// chỉ cho vào khi đã đăng nhập
function RequireAuth({ children }) {
  const { token, checking } = useAuth();
  if (checking) return <div className="login-main"><div className="skeleton" style={{ width: 240, height: 24 }} /></div>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    // reducedMotion="user": tôn trọng thiết lập giảm chuyển động của hệ điều hành
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <UIProvider>
          <BrowserRouter basename="/admin">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
                <Route index element={<Navigate to="/categories" replace />} />
                <Route path="categories" element={<Categories />} />
                <Route path="products" element={<Products />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </UIProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
