import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import Field from '../components/Field';
import { formatPrice } from '../components/ProductCard';

const PHONE = /^[0-9+\s.-]{9,15}$/;

export default function Checkout() {
  const { customer, checking } = useAuth();
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // điền sẵn thông tin từ hồ sơ
  useEffect(() => {
    if (customer) setForm((f) => ({ ...f, name: f.name || customer.name || '', phone: f.phone || customer.phone || '', address: f.address || customer.address || '' }));
  }, [customer]);

  const ids = items.map((i) => i.id).join(',');
  useEffect(() => {
    if (!ids) return;
    let alive = true;
    Promise.all(ids.split(',').map((id) => api.get(`/products/${id}`).then((r) => [id, r.data]).catch(() => [id, null])))
      .then((pairs) => alive && setProducts(Object.fromEntries(pairs)));
    return () => { alive = false; };
  }, [ids]);

  if (checking) return <div className="wrap page"><div className="skeleton" style={{ height: 320 }} /></div>;
  if (!customer) return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  if (items.length === 0) return <Navigate to="/cart" replace />;

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const lines = items.map((i) => ({ ...i, product: products ? products[i.id] : undefined }));
  const total = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.qty : 0), 0);
  const unavailable = lines.some((l) => l.product === null || (l.product && l.product.stock < l.qty));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = {};
    if (!form.name.trim()) err.name = 'Vui lòng nhập tên người nhận';
    if (!PHONE.test(form.phone.trim())) err.phone = 'Số điện thoại chưa hợp lệ (9 đến 15 chữ số)';
    if (form.address.trim().length < 8) err.address = 'Vui lòng nhập địa chỉ đầy đủ (số nhà, đường, quận, thành phố)';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const res = await api.post('/checkout', { items: items.map((i) => ({ product: i.id, quantity: i.qty })), shipping: form });
      if (res.data.success) {
        clear();
        navigate('/orders', { state: { placed: true } });
      } else {
        setError(res.data.message);
      }
    } catch {
      setError('Không kết nối được tới máy chủ, vui lòng thử lại.');
    }
    setBusy(false);
  };

  return (
    <div className="wrap page">
      <Link to="/cart" className="crumbs" style={{ display: 'inline-flex' }}><ArrowLeft size={14} weight="bold" /> Quay lại giỏ hàng</Link>
      <h1 className="page-title">Thanh toán</h1>
      <form className="cart" style={{ marginTop: 32 }} onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <h2 className="display-sm">Thông tin giao hàng</h2>
          <Field id="name" label="Tên người nhận" value={form.name} onChange={setField('name')} error={errors.name} autoComplete="name" />
          <Field id="phone" label="Số điện thoại" type="tel" value={form.phone} onChange={setField('phone')} error={errors.phone} autoComplete="tel" />
          <Field id="address" label="Địa chỉ giao hàng" value={form.address} onChange={setField('address')} error={errors.address} autoComplete="street-address" />
          <Field id="note" label="Ghi chú (không bắt buộc)" value={form.note} onChange={setField('note')} help="Ví dụ: giao giờ hành chính, gọi trước khi giao" />
          <div className="pay-box">
            <strong>Thanh toán khi nhận hàng (COD)</strong>
            <p className="muted">Bạn trả tiền mặt cho nhân viên giao hàng khi nhận kính. Cửa hàng chưa nhận thanh toán trực tuyến.</p>
          </div>
        </div>

        <aside className="summary">
          <h2 className="display-sm">Đơn hàng</h2>
          <ul className="sum-list">
            {lines.map((l) => (
              <li key={l.id}>
                <span>{l.product ? l.product.name : 'Đang tải'} <span className="muted">x {l.qty}</span></span>
                <span className="mono">{l.product ? formatPrice(l.product.price * l.qty) : ''}</span>
              </li>
            ))}
          </ul>
          <div className="sum-row total"><span>Tổng cộng</span><span className="mono">{formatPrice(total)}</span></div>
          {unavailable && <p className="msg error" role="alert">Có sản phẩm hết hàng hoặc không đủ số lượng. Quay lại giỏ hàng để điều chỉnh.</p>}
          {error && <p className="msg error" role="alert">{error}</p>}
          <button className="btn btn-block" type="submit" disabled={busy || products === null || unavailable}>{busy ? 'Đang đặt hàng' : 'Xác nhận đặt hàng'}</button>
        </aside>
      </form>
    </div>
  );
}
