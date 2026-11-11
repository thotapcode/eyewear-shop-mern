import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { customer, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (customer) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(username.trim(), password);
      if (result.success) navigate('/');
      else setError(result.message);
    } catch {
      setError('Không kết nối được tới server');
    }
  };

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <h2>Đăng nhập</h2>
      <label>Tên đăng nhập
        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
      </label>
      <label>Mật khẩu
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Đăng nhập</button>
      <p className="hint">Chưa có tài khoản? <Link to="/signup">Đăng ký</Link></p>
    </form>
  );
}
