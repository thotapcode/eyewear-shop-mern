import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MagnifyingGlass, SignOut } from '@phosphor-icons/react';
import api from '../api';
import { useAuth } from '../AuthContext';
import GlassesMark from './GlassesMark';

export default function Layout() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

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
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <Link to="/" className="brand" aria-label="Eyewear Shop, về trang chủ">
            <GlassesMark size={34} strokeWidth={6} />
            <span>Eyewear Shop</span>
          </Link>
          <nav className="nav" aria-label="Danh mục sản phẩm">
            {categories.map((c) => (
              <NavLink key={c._id} to={`/product/category/${c._id}`}>{c.name}</NavLink>
            ))}
          </nav>
          <form className="search" role="search" onSubmit={handleSearch}>
            <MagnifyingGlass size={18} />
            <label className="sr-only" htmlFor="q">Tìm sản phẩm</label>
            <input id="q" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm gọng, thương hiệu" />
          </form>
          <div className="header-actions">
            {customer ? (
              <>
                <Link to="/myprofile" className="user-chip">
                  <span className="avatar">{(customer.name || '?').trim().charAt(0).toUpperCase()}</span>
                  <span className="name">{customer.name}</span>
                </Link>
                <button className="icon-btn" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất">
                  <SignOut size={22} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Đăng nhập</Link>
                <Link to="/signup" className="btn btn-primary hide-sm">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.main>

      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <Link to="/" className="brand"><GlassesMark size={30} strokeWidth={6} /><span>Eyewear Shop</span></Link>
              <p>Gọng cận, kính râm và phụ kiện. Chọn theo danh mục hoặc tìm theo thương hiệu.</p>
            </div>
            <div className="footer-links">
              {categories.map((c) => <Link key={c._id} to={`/product/category/${c._id}`}>{c.name}</Link>)}
              {!customer && <Link to="/signup">Tạo tài khoản</Link>}
            </div>
          </div>
          <div className="footer-bottom">© 2026 Eyewear Shop</div>
        </div>
      </footer>
    </>
  );
}
