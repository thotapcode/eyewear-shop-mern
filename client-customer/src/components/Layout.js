import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">Eyewear Shop</Link>
        <div className="spacer" />
        <nav className="account">
          {customer ? (
            <>
              <Link to="/myprofile">Xin chào, {customer.name}</Link>
              <button onClick={handleLogout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/signup">Đăng ký</Link>
            </>
          )}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
