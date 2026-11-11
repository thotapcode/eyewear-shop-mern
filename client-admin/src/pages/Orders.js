import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Receipt, X } from '@phosphor-icons/react';
import api from '../api';
import { useUI } from '../components/UI';

const STATUS = {
  PENDING: { label: 'Chờ duyệt', cls: 'pending' },
  APPROVED: { label: 'Đã duyệt', cls: 'approved' },
  CANCELED: { label: 'Đã hủy', cls: 'canceled' },
};
const FILTERS = [['ALL', 'Tất cả'], ['PENDING', 'Chờ duyệt'], ['APPROVED', 'Đã duyệt'], ['CANCELED', 'Đã hủy']];

const money = (n) => `${Math.round(Number(n)).toLocaleString('vi-VN')} ₫`;
const fmtDate = (t) => new Date(t).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export default function Orders() {
  const { toast, confirm } = useUI();
  const [params] = useSearchParams();
  const customerId = params.get('customer'); // lọc theo một khách, đi từ trang khách hàng sang
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    const res = await api.get(customerId ? `/orders/customer/${customerId}` : '/orders');
    setOrders(Array.isArray(res.data) ? res.data : []);
  }, [customerId]);

  useEffect(() => { setOrders(null); load(); }, [load]);

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, APPROVED: 0, CANCELED: 0 };
    (orders || []).forEach((o) => { c.ALL += 1; c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  const shown = orders ? orders.filter((o) => filter === 'ALL' || o.status === filter) : null;

  const setStatus = async (order, status) => {
    const approve = status === 'APPROVED';
    const ok = await confirm({
      title: approve ? 'Duyệt đơn hàng?' : 'Hủy đơn hàng?',
      message: approve
        ? `Đơn #${order._id.slice(-6).toUpperCase()} (${money(order.total)}) sẽ chuyển sang Đã duyệt và không đổi lại được.`
        : `Đơn #${order._id.slice(-6).toUpperCase()} sẽ bị hủy và không đổi lại được.`,
      confirmLabel: approve ? 'Duyệt đơn' : 'Hủy đơn',
      tone: approve ? 'primary' : 'danger',
    });
    if (!ok) return;
    try {
      const res = await api.put(`/orders/status/${order._id}`, { status });
      if (res.data.success) toast(approve ? 'Đã duyệt đơn hàng' : 'Đã hủy đơn hàng');
      else toast(res.data.message, 'error');
      load();
    } catch {
      toast('Không cập nhật được, vui lòng thử lại', 'error');
    }
  };

  const who = customerId && orders && orders[0] && orders[0].customer ? orders[0].customer.name : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Đơn hàng</h1>
          <p className="muted">
            {customerId ? (<>Đơn của {who || 'khách hàng'}. <Link to="/orders" className="inline-link">Xem tất cả đơn</Link></>) : 'Duyệt hoặc hủy các đơn khách vừa đặt.'}
          </p>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Lọc theo trạng thái">
        {FILTERS.map(([k, label]) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {label} <span className="mono">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th className="num">Tổng</th><th>Trạng thái</th><th className="num" style={{ width: 130 }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {shown === null && [0, 1, 2].map((i) => <tr key={i}><td colSpan="6"><div className="skeleton" style={{ height: 44 }} /></td></tr>)}
              {shown && shown.map((o) => {
                const st = STATUS[o.status] || { label: o.status, cls: 'pending' };
                return (
                  <tr key={o._id}>
                    <td><strong className="mono">#{o._id.slice(-6).toUpperCase()}</strong><span className="muted block">{fmtDate(o.cdate)}</span></td>
                    <td>{o.customer ? (<><strong>{o.customer.name}</strong><span className="muted block">@{o.customer.username}</span></>) : <span className="muted">Khách đã bị xóa</span>}{o.shipping && o.shipping.address && (<span className="ship-line"><span className="block">Giao: {o.shipping.name}, {o.shipping.phone}</span><span className="block muted">{o.shipping.address}</span>{o.shipping.note && <span className="block muted">Ghi chú: {o.shipping.note}</span>}</span>)}</td>
                    <td>
                      {o.items.slice(0, 3).map((i, idx) => <span className="block" key={idx}>{i.name} <span className="muted">x {i.quantity}</span></span>)}
                      {o.items.length > 3 && <span className="muted block">và {o.items.length - 3} sản phẩm khác</span>}
                    </td>
                    <td className="num mono">{money(o.total)}</td>
                    <td><span className={`status ${st.cls}`}>{st.label}</span></td>
                    <td>
                      {o.status === 'PENDING' ? (
                        <div className="row-actions">
                          <button className="icon-btn ok" onClick={() => setStatus(o, 'APPROVED')} aria-label={`Duyệt đơn ${o._id.slice(-6)}`} title="Duyệt"><Check size={20} weight="bold" /></button>
                          <button className="icon-btn danger" onClick={() => setStatus(o, 'CANCELED')} aria-label={`Hủy đơn ${o._id.slice(-6)}`} title="Hủy"><X size={20} weight="bold" /></button>
                        </div>
                      ) : <span className="muted" style={{ float: 'right' }}>Đã xử lý</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown && shown.length === 0 && (
          <div className="empty">
            <Receipt size={40} />
            <strong>{orders && orders.length ? 'Không có đơn nào ở trạng thái này' : 'Chưa có đơn hàng nào'}</strong>
            <span>Đơn sẽ hiện ở đây khi khách bấm Đặt hàng trên trang cửa hàng.</span>
          </div>
        )}
      </div>
    </div>
  );
}
