import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Active from './pages/Active';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import MyProfile from './pages/MyProfile';

export default function App() {
  return (
    // reducedMotion="user": tôn trọng thiết lập giảm chuyển động của hệ điều hành
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="product/category/:cid" element={<ProductList />} />
              <Route path="product/search/:keyword" element={<ProductList />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="active" element={<Active />} />
              <Route path="myprofile" element={<MyProfile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  );
}
