import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Field from '../components/Field';

export default function MyProfile() {
  const { customer, setCustomer, checking } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) setForm({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '', password: '' });
  }, [customer]);

  if (checking) return <div className="wrap page"><div className="skeleton" style={{ height: 320, maxWidth: 520, margin: '0 auto' }} /></div>;
  if (!customer) return <Navigate to="/login" replace />;

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    const err = {};
    if (!form.name.trim()) err.name = 'Vui lòng nhập họ và tên';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Email chưa đúng định dạng';
    if (form.password && form.password.length < 6) err.password = 'Mật khẩu mới cần có ít nhất 6 ký tự';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const res = await api.put(`/customers/${customer._id}`, form);
      if (res.data.success) {
        setCustomer(res.data.customer);
        setResult({ success: true, message: 'Đã lưu thay đổi' });
      } else {
        setResult({ success: false, message: res.data.message });
      }
    } catch {
      setResult({ success: false, message: 'Không kết nối được tới máy chủ, vui lòng thử lại.' });
    }
    setBusy(false);
  };

  return (
    <div className="wrap page">
      <div className="profile">
        <div className="profile-head">
          <span className="avatar">{(customer.name || '?').trim().charAt(0).toUpperCase()}</span>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.75rem' }}>{customer.name}</h1>
            <p className="muted">@{customer.username}</p>
          </div>
        </div>
        <form className="profile-card" onSubmit={handleSubmit} noValidate>
          <Field id="name" label="Họ và tên" value={form.name} onChange={setField('name')} error={errors.name} />
          <Field id="phone" label="Số điện thoại" type="tel" value={form.phone} onChange={setField('phone')} />
          <Field id="email" label="Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} />
          <Field id="password" label="Mật khẩu mới" type="password" value={form.password} onChange={setField('password')} error={errors.password} help="Để trống nếu không muốn đổi" autoComplete="new-password" />
          {result && <p className={`msg ${result.success ? 'ok' : 'error'}`} role="status">{result.message}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'Đang lưu' : 'Lưu thay đổi'}</button>
        </form>
      </div>
    </div>
  );
}
