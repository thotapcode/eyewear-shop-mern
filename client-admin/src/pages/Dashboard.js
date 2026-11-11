import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, Tag, TrendUp, Users } from '@phosphor-icons/react';
import api from '../api';

const money = (n) => `${Math.round(Number(n)).toLocaleString('vi-VN')} ₫`;
const fmtDate = (t) => new Date(t).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const STATUS = {
  PENDING: { label: 'Chờ duyệt', cls: 'pending' },
  APPROVED: { label: 'Đã duyệt', cls: 'approved' },
  CANCELED: { label: 'Đã hủy', cls: 'canceled' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data && res.data.orders ? res.data : null));
  }, []);

  const cards = stats && [
    { icon: TrendUp, label: 'Doanh thu (đơn đã duyệt)', value: money(stats.revenue), to: '/orders' },
    { icon: Receipt, label: 'Đơn chờ duyệt', value: stats.orders.PENDING, to: '/orders', hot: stats.orders.PENDING > 0 },
    { icon: Users, label: 'Khách hàng', value: stats.customers, to: '/customers' },
    { icon: Tag, label: 'Sản phẩm', value: stats.products, to: '/products' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Tổng quan</h1>
          <p className="muted">Tình hình cửa hàng tại thời điểm hiện tại.</p>
        </div>
      </div>

      <div className="stat-grid">
        {!stats && [0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}
        {cards && cards.map((c) => (
          <Link key={c.label} to={c.to} className={`stat${c.hot ? ' hot' : ''}`}>
            <c.icon size={22} />
            <span className="stat-value mono">{c.value}</span>
            <span className="muted">{c.label}</span>
          </Link>
        ))}
      </div>

      {stats && (
        <div className="dash-cols">
          <section className="card table-card">
            <div className="dash-head"><h2>Đơn hàng mới nhất</h2><Link to="/orders" className="inline-link">Xem tất cả <ArrowRight size={14} weight="bold" /></Link></div>
            {stats.recent.length === 0 ? <div className="empty"><span>Chưa có đơn hàng nào.</span></div> : (
              <ul className="dash-list">
                {stats.recent.map((o) => {
                  const st = STATUS[o.status] || STATUS.PENDING;
                  return (
                    <li key={o._id}>
                      <div>
                        <strong className="mono">#{o._id.slice(-6).toUpperCase()}</strong>
                        <span className="muted block">{o.customer ? o.customer.name : 'Khách đã bị xóa'} · {fmtDate(o.cdate)}</span>
                      </div>
                      <span className="mono">{money(o.total)}</span>
                      <span className={`status ${st.cls}`}>{st.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card table-card">
            <div className="dash-head"><h2>Sắp hết hàng</h2><Link to="/products" className="inline-link">Quản lý <ArrowRight size={14} weight="bold" /></Link></div>
            {stats.lowStock.length === 0 ? <div className="empty"><span>Mọi sản phẩm đều còn trên 5 cái.</span></div> : (
              <ul className="dash-list">
                {stats.lowStock.map((p) => (
                  <li key={p._id}>
                    <div><strong>{p.name}</strong><span className="muted block">{p.brand}</span></div>
                    <span className={`status ${p.stock === 0 ? 'canceled' : 'pending'}`}>{p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
