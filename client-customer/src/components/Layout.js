import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const value = keyword.trim();
    if (value) navigate(`/product/search/${encodeURIComponent(value)}`);
  };

  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">Eyewear Shop</Link>
        <nav className="menu">
          {categories.map((c) => (
            <Link key={c._id} to={`/product/category/${c._id}`}>{c.name}</Link>
          ))}
        </nav>
        <div className="spacer" />
        <form className="search" onSubmit={handleSearch}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm gọng, thương hiệu..." />
          <button type="submit">Tìm</button>
        </form>
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
