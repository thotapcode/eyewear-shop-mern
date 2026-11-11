import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import api from '../api';
import { useAuth } from '../AuthContext';
import GlassesMark from '../components/GlassesMark';
import { formatPrice } from '../components/ProductCard';

const STATUS = {
  PENDING: { label: 'Chờ duyệt', cls: 'pending' },
  APPROVED: { label: 'Đã duyệt', cls: 'approved' },
  CANCELED: { label: 'Đã hủy', cls: 'canceled' },
};

const fmtDate = (t) => new Date(t).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export default function Orders() {
  const { customer, checking } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [asking, setAsking] = useState(null); // đơn đang hỏi xác nhận hủy
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!customer) return;
    api.get(`/orders/customer/${customer._id}`).then((res) => setOrders(Array.isArray(res.data) ? res.data : []));
  }, [customer]);

  const load = () => api.get(`/orders/customer/${customer._id}`).then((res) => setOrders(Array.isArray(res.data) ? res.data : []));

  const cancel = async (o) => {
    setMsg('');
    try {
      const res = await api.put(`/orders/cancel/${o._id}`);
      setMsg(res.data.success ? 'Đã hủy đơn hàng' : res.data.message);
    } catch {
      setMsg('Không kết nối được tới máy chủ, vui lòng thử lại.');
    }
    setAsking(null);
    load();
  };

  if (checking) return <div className="wrap page"><div className="skeleton" style={{ height: 240 }} /></div>;
  if (!customer) return <Navigate to="/login" replace state={{ from: '/orders' }} />;

  return (
    <div className="wrap page">
      <h1 className="page-title">Đơn hàng của tôi</h1>

      {location.state && location.state.placed && (
        <p className="msg ok" role="status" style={{ marginTop: 24 }}>
          <CheckCircle size={20} weight="fill" /> Đặt hàng thành công. Cửa hàng sẽ duyệt đơn và bạn theo dõi trạng thái ngay tại đây.
        </p>
      )}

      {msg && <p className="msg ok" role="status" style={{ marginTop: 24 }}>{msg}</p>}

      <div className="orders">
        {orders === null && <div className="skeleton" style={{ height: 160 }} />}
        {orders && orders.length === 0 && (
          <div className="empty">
            <GlassesMark className="glyph-bg" strokeWidth={6} />
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/" className="btn">Bắt đầu mua sắm</Link>
          </div>
        )}
        {orders && orders.map((o) => {
          const st = STATUS[o.status] || { label: o.status, cls: 'pending' };
          return (
            <article className="order" key={o._id}>
              <header>
                <div>
                  <h2 className="display-sm">Đơn #{o._id.slice(-6).toUpperCase()}</h2>
                  <p className="muted">{fmtDate(o.cdate)}</p>
                </div>
                <span className={`status ${st.cls}`}>{st.label}</span>
              </header>
              <ul>
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    <span>{i.name} <span className="muted">x {i.quantity}</span></span>
                    <span className="mono">{formatPrice(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              {o.shipping && o.shipping.name && (
                <div className="ship">
                  <p><strong>Giao đến:</strong> {o.shipping.name}, {o.shipping.phone}</p>
                  <p className="muted">{o.shipping.address}</p>
                  {o.shipping.note && <p className="muted">Ghi chú: {o.shipping.note}</p>}
                  <p className="muted">Thanh toán khi nhận hàng</p>
                </div>
              )}
              <footer><span>Tổng cộng</span><strong className="mono">{formatPrice(o.total)}</strong></footer>
              {o.status === 'PENDING' && (
                <div className="order-actions">
                  {asking === o._id ? (
                    <>
                      <span>Hủy đơn này?</span>
                      <button className="btn sm" onClick={() => cancel(o)}>Xác nhận hủy</button>
                      <button className="btn btn-ghost sm" onClick={() => setAsking(null)}>Giữ đơn</button>
                    </>
                  ) : <button className="btn btn-ghost sm" onClick={() => setAsking(o._id)}>Hủy đơn</button>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
