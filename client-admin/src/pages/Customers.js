import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeSimple, Lock, LockOpen, Receipt, Users } from '@phosphor-icons/react';
import api from '../api';
import { useUI } from '../components/UI';

const STATE = {
  0: { label: 'Chưa kích hoạt', cls: 'pending' },
  1: { label: 'Hoạt động', cls: 'approved' },
  2: { label: 'Đã khóa', cls: 'canceled' },
};

export default function Customers() {
  const { toast, confirm } = useUI();
  const [customers, setCustomers] = useState(null);

  const load = useCallback(async () => {
    const res = await api.get('/customers');
    setCustomers(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (request, okMessage) => {
    try {
      const res = await request();
      if (res.data.success) toast(okMessage || res.data.message);
      else toast(res.data.message, 'error');
      load();
    } catch {
      toast('Không thực hiện được, vui lòng thử lại', 'error');
    }
  };

  const lock = async (c) => {
    const ok = await confirm({ title: 'Khóa tài khoản?', message: `${c.name} sẽ không đăng nhập và không đặt hàng được cho tới khi bạn mở khóa.`, confirmLabel: 'Khóa' });
    if (ok) run(() => api.put(`/customers/deactive/${c._id}`), 'Đã khóa tài khoản');
  };
  const unlock = (c) => run(() => api.put(`/customers/reactive/${c._id}`), 'Đã mở khóa tài khoản');
  const resend = (c) => run(() => api.get(`/customers/sendmail/${c._id}`));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Khách hàng</h1>
          <p className="muted">{customers ? `${customers.length} tài khoản` : 'Đang tải'}</p>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Khách hàng</th><th>Email</th><th>Điện thoại</th><th>Trạng thái</th><th className="num" style={{ width: 150 }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {customers === null && [0, 1, 2].map((i) => <tr key={i}><td colSpan="5"><div className="skeleton" style={{ height: 44 }} /></td></tr>)}
              {customers && customers.map((c) => {
                const st = STATE[c.active] || STATE[0];
                return (
                  <tr key={c._id}>
                    <td><strong>{c.name}</strong><span className="muted block">@{c.username}</span></td>
                    <td>{c.email}</td>
                    <td>{c.phone || <span className="muted">-</span>}</td>
                    <td><span className={`status ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div className="row-actions">
                        <Link className="icon-btn" to={`/orders?customer=${c._id}`} aria-label={`Xem đơn của ${c.name}`} title="Xem đơn hàng"><Receipt size={18} /></Link>
                        {c.active === 0 && <button className="icon-btn" onClick={() => resend(c)} aria-label={`Gửi lại email kích hoạt cho ${c.name}`} title="Gửi lại email kích hoạt"><EnvelopeSimple size={18} /></button>}
                        {c.active === 1 && <button className="icon-btn danger" onClick={() => lock(c)} aria-label={`Khóa ${c.name}`} title="Khóa tài khoản"><Lock size={18} /></button>}
                        {c.active === 2 && <button className="icon-btn ok" onClick={() => unlock(c)} aria-label={`Mở khóa ${c.name}`} title="Mở khóa"><LockOpen size={18} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {customers && customers.length === 0 && (
          <div className="empty">
            <Users size={40} />
            <strong>Chưa có khách hàng nào</strong>
            <span>Tài khoản sẽ hiện ở đây khi có người đăng ký trên trang cửa hàng.</span>
          </div>
        )}
      </div>
    </div>
  );
}
