import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash } from '@phosphor-icons/react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import GlassesMark from '../components/GlassesMark';
import QtyStepper from '../components/QtyStepper';
import { formatPrice, imageSrc } from '../components/ProductCard';

export default function Cart() {
  const { items, setQty, remove, clear } = useCart();
  const { customer, checking } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState(null); // { [id]: sản phẩm | null }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // lấy thông tin mới nhất của từng sản phẩm trong giỏ
  const ids = items.map((i) => i.id).join(',');
  useEffect(() => {
    if (!ids) { setProducts({}); return; }
    let alive = true;
    Promise.all(ids.split(',').map((id) => api.get(`/products/${id}`).then((r) => [id, r.data]).catch(() => [id, null])))
      .then((pairs) => alive && setProducts(Object.fromEntries(pairs)));
    return () => { alive = false; };
  }, [ids]);

  const lines = items.map((i) => ({ ...i, product: products ? products[i.id] : undefined }));
  const missing = lines.filter((l) => l.product === null);
  const total = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.qty : 0), 0);

  const handleCheckout = async () => {
    setError('');
    if (!customer) return navigate('/login', { state: { from: '/cart' } });
    setBusy(true);
    try {
      const res = await api.post('/checkout', { items: lines.map((l) => ({ product: l.id, quantity: l.qty })) });
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

  if (items.length === 0) {
    return (
      <div className="wrap page">
        <h1 className="page-title">Giỏ hàng</h1>
        <div className="empty" style={{ marginTop: 32 }}>
          <GlassesMark className="glyph-bg" strokeWidth={6} />
          <p>Giỏ hàng đang trống. Chọn một mẫu gọng bạn thích rồi quay lại đây.</p>
          <Link to="/" className="btn"><ArrowLeft size={18} weight="bold" /> Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <h1 className="page-title">Giỏ hàng</h1>
      <div className="cart" style={{ marginTop: 32 }}>
        <div className="cart-lines">
          {lines.map((l) => {
            const p = l.product;
            const src = imageSrc(p);
            return (
              <div className="cart-line" key={l.id}>
                <Link to={p ? `/product/${l.id}` : '#'} className="thumb">
                  {p === undefined ? <div className="skeleton" style={{ width: '100%', height: '100%' }} /> : src ? <img src={src} alt="" /> : <GlassesMark className="glyph-bg" />}
                </Link>
                <div className="info">
                  {p === null ? <p className="muted">Sản phẩm này không còn bán</p> : p && (
                    <>
                      {p.brand && <p className="card-brand">{p.brand}</p>}
                      <Link to={`/product/${l.id}`} className="name">{p.name}</Link>
                      <p className="mono muted">{formatPrice(p.price)}</p>
                    </>
                  )}
                  <div className="line-actions">
                    {p && <QtyStepper value={l.qty} onChange={(q) => setQty(l.id, q)} label={`Số lượng ${p.name}`} />}
                    <button className="icon-btn" onClick={() => remove(l.id)} aria-label="Xóa khỏi giỏ hàng" title="Xóa"><Trash size={20} /></button>
                  </div>
                </div>
                <p className="line-total mono">{p ? formatPrice(p.price * l.qty) : ''}</p>
              </div>
            );
          })}
        </div>

        <aside className="summary">
          <h2 className="display-sm">Tổng đơn hàng</h2>
          <div className="sum-row"><span className="muted">Tạm tính</span><span className="mono">{formatPrice(total)}</span></div>
          <div className="sum-row total"><span>Tổng cộng</span><span className="mono">{formatPrice(total)}</span></div>
          {missing.length > 0 && <p className="msg error" role="alert">Có sản phẩm không còn bán. Hãy xóa khỏi giỏ để thanh toán.</p>}
          {error && <p className="msg error" role="alert">{error}</p>}
          <button className="btn btn-block" onClick={handleCheckout} disabled={busy || checking || missing.length > 0 || products === null}>
            {busy ? 'Đang đặt hàng' : customer ? 'Đặt hàng' : 'Đăng nhập để đặt hàng'}
          </button>
          <Link to="/" className="auth-foot" style={{ textAlign: 'center' }}>Tiếp tục mua sắm</Link>
        </aside>
      </div>
    </div>
  );
}
