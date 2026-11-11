import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function MyProfile() {
  const { customer, setCustomer, checking } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (customer) setForm({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '', password: '' });
  }, [customer]);

  if (checking) return <p>Đang kiểm tra phiên đăng nhập...</p>;
  if (!customer) return <Navigate to="/login" replace />;

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    try {
      const res = await api.put(`/customers/${customer._id}`, form);
      if (res.data.success) {
        setCustomer(res.data.customer);
        setResult({ success: true, message: 'Đã cập nhật hồ sơ' });
      } else {
        setResult({ success: false, message: res.data.message });
      }
    } catch {
      setResult({ success: false, message: 'Không kết nối được tới server' });
    }
  };

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <h2>Hồ sơ của tôi</h2>
      <label>Tên đăng nhập<input value={customer.username} disabled /></label>
      <label>Họ và tên<input value={form.name} onChange={setField('name')} required /></label>
      <label>Số điện thoại<input value={form.phone} onChange={setField('phone')} /></label>
      <label>Email<input type="email" value={form.email} onChange={setField('email')} required /></label>
      <label>Mật khẩu mới (để trống nếu không đổi)<input type="password" value={form.password} onChange={setField('password')} /></label>
      {result && <p className={result.success ? 'ok' : 'error'}>{result.message}</p>}
      <button type="submit">Lưu thay đổi</button>
    </form>
  );
}
