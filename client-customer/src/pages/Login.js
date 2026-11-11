import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

export default function Login() {
  const { customer, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state || {}).from || '/'; // quay lại trang đang làm dở, ví dụ giỏ hàng
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (customer) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await login(username.trim(), password);
      if (result.success) navigate(from, { replace: true });
      else setError(result.message);
    } catch {
      setError('Không kết nối được tới máy chủ, vui lòng thử lại.');
    }
    setBusy(false);
  };

  return (
    <AuthShell>
      <h1>Đăng nhập</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }} noValidate>
        <Field id="username" label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        <Field id="password" label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p className="msg error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'Đang đăng nhập' : 'Đăng nhập'}</button>
      </form>
      <p className="auth-foot">Chưa có tài khoản? <Link to="/signup">Đăng ký</Link></p>
    </AuthShell>
  );
}
