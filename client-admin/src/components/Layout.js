import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Eyewear Shop - Admin</h1>
        <nav>
          <NavLink to="/categories">Danh mục</NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
        </nav>
        <button onClick={handleLogout}>Đăng xuất</button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
