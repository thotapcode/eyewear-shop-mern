import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const EMPTY = { username: '', password: '', name: '', phone: '', email: '' };

export default function Signup() {
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const res = await api.post('/signup', { ...form, username: form.username.trim(), email: form.email.trim() });
      setResult(res.data);
      if (res.data.success) setForm(EMPTY);
    } catch {
      setResult({ success: false, message: 'Không kết nối được tới server' });
    }
  };

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <h2>Đăng ký tài khoản</h2>
      <label>Tên đăng nhập<input value={form.username} onChange={setField('username')} required /></label>
      <label>Mật khẩu<input type="password" value={form.password} onChange={setField('password')} required /></label>
      <label>Họ và tên<input value={form.name} onChange={setField('name')} required /></label>
      <label>Số điện thoại<input value={form.phone} onChange={setField('phone')} /></label>
      <label>Email<input type="email" value={form.email} onChange={setField('email')} required /></label>
      {result && <p className={result.success ? 'ok' : 'error'}>{result.message}</p>}
      <button type="submit">Đăng ký</button>
      <p className="hint">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </form>
  );
}
