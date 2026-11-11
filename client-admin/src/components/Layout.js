import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChartBar, Image as ImageIcon, Receipt, SignOut, SquaresFour, Tag, Users } from '@phosphor-icons/react';
import { useAuth } from '../AuthContext';
import GlassesMark from './GlassesMark';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <GlassesMark size={34} strokeWidth={6} />
          <div>Eyewear Shop<small>Trang quản trị</small></div>
        </div>
        <nav aria-label="Chức năng quản trị">
          <NavLink to="/dashboard"><ChartBar size={20} /> Tổng quan</NavLink>
          <NavLink to="/categories"><SquaresFour size={20} /> Danh mục</NavLink>
          <NavLink to="/products"><Tag size={20} /> Sản phẩm</NavLink>
          <NavLink to="/banners"><ImageIcon size={20} /> Banner</NavLink>
          <NavLink to="/orders"><Receipt size={20} /> Đơn hàng</NavLink>
          <NavLink to="/customers"><Users size={20} /> Khách hàng</NavLink>
        </nav>
        <div className="foot">
          <button onClick={handleLogout}><SignOut size={20} /> <span>Đăng xuất</span></button>
        </div>
      </aside>
      <motion.main
        className="main"
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
