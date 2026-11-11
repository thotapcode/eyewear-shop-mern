import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'customer-cart';
export const MAX_QTY = 20; // trùng giới hạn của máy chủ

function load() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((i) => i && i.id && i.qty >= 1) : [];
  } catch {
    return [];
  }
}

// giỏ hàng chỉ lưu mã sản phẩm và số lượng, tên giá ảnh luôn lấy mới từ máy chủ khi hiển thị
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* trình duyệt chặn lưu trữ thì giỏ chỉ sống trong phiên */ }
  }, [items]);

  const add = useCallback((id, qty = 1) => {
    setItems((list) => {
      const found = list.find((i) => i.id === id);
      if (found) return list.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + qty, MAX_QTY) } : i));
      return [...list, { id, qty: Math.min(qty, MAX_QTY) }];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    const q = Math.max(1, Math.min(MAX_QTY, qty));
    setItems((list) => list.map((i) => (i.id === id ? { ...i, qty: q } : i)));
  }, []);

  const remove = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
