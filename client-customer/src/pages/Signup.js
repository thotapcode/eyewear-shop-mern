import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

const EMPTY = { username: '', password: '', name: '', phone: '', email: '' };

export default function Signup() {
  const { customer } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  if (customer) return <Navigate to="/" replace />;

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const err = {};
    if (!form.username.trim()) err.username = 'Vui lòng nhập tên đăng nhập';
    if (form.password.length < 6) err.password = 'Mật khẩu cần có ít nhất 6 ký tự';
    if (!form.name.trim()) err.name = 'Vui lòng nhập họ và tên';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Email chưa đúng định dạng';
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const res = await api.post('/signup', { ...form, username: form.username.trim(), email: form.email.trim() });
      setResult(res.data);
      if (res.data.success) setForm(EMPTY);
    } catch {
      setResult({ success: false, message: 'Không kết nối được tới máy chủ, vui lòng thử lại.' });
    }
    setBusy(false);
  };

  return (
    <AuthShell>
      <h1>Tạo tài khoản</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }} noValidate>
        <Field id="username" label="Tên đăng nhập" value={form.username} onChange={setField('username')} error={errors.username} autoComplete="username" />
        <Field id="password" label="Mật khẩu" type="password" value={form.password} onChange={setField('password')} error={errors.password} help="Ít nhất 6 ký tự" autoComplete="new-password" />
        <Field id="name" label="Họ và tên" value={form.name} onChange={setField('name')} error={errors.name} autoComplete="name" />
        <Field id="phone" label="Số điện thoại (không bắt buộc)" type="tel" value={form.phone} onChange={setField('phone')} autoComplete="tel" />
        <Field id="email" label="Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} help="Liên kết kích hoạt sẽ gửi về email này" autoComplete="email" />
        {result && <p className={`msg ${result.success ? 'ok' : 'error'}`} role="status">{result.message}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'Đang gửi' : 'Đăng ký'}</button>
      </form>
      <p className="auth-foot">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthShell>
  );
}
