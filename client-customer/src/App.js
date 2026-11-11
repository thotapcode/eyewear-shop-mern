import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Active from './pages/Active';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import './App.css';

export default function App() {
  return (
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
