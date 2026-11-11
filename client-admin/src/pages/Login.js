import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { useAuth } from '../AuthContext';
import GlassesMark from '../components/GlassesMark';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await login(username.trim(), password);
      if (result.success) navigate('/dashboard');
      else setError(result.message);
    } catch {
      setError('Không kết nối được tới máy chủ, vui lòng thử lại.');
    }
    setBusy(false);
  };

  return (
    <div className="login">
      <aside className="login-side" aria-hidden="true">
        <GlassesMark className="glyph-bg" strokeWidth={2} />
        <h2>Quản lý danh mục và sản phẩm của cửa hàng.</h2>
        <p>Đăng nhập bằng tài khoản quản trị để thêm, sửa và xóa dữ liệu.</p>
      </aside>
      <div className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h1>Đăng nhập quản trị</h1>
          <div className="field">
            <label htmlFor="username">Tên đăng nhập</label>
            <input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          </div>
          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="control">
              <input id="password" className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 44 }} required />
              <button type="button" className="icon-btn toggle" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                {show ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && <p className="msg" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'Đang đăng nhập' : 'Đăng nhập'}</button>
        </form>
      </div>
    </div>
  );
}
