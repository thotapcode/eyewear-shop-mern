import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import api from '../api';
import GlassesMark from '../components/GlassesMark';
import { ProductGrid } from '../components/ProductCard';

const SORTS = {
  default: { label: 'Mặc định', fn: null },
  asc: { label: 'Giá tăng dần', fn: (a, b) => a.price - b.price },
  desc: { label: 'Giá giảm dần', fn: (a, b) => b.price - a.price },
};

// dùng chung cho hai trang: /product/category/:cid và /product/search/:keyword
export default function ProductList() {
  const { cid, keyword } = useParams();
  const [products, setProducts] = useState(null);
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    setProducts(null);
    setBrand('');
    setSort('default');
    if (cid) {
      setTitle('Danh mục');
      api.get(`/products/category/${cid}`).then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setProducts(list);
        if (list.length > 0 && list[0].category) setTitle(list[0].category.name);
      }).catch(() => setProducts([]));
    } else if (keyword) {
      setTitle(`Kết quả cho "${keyword}"`);
      api.get(`/products/search/${encodeURIComponent(keyword)}`).then((res) => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => setProducts([]));
    }
  }, [cid, keyword]);

  const brands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  }, [products]);

  const shown = useMemo(() => {
    if (!products) return null;
    const list = brand ? products.filter((p) => p.brand === brand) : [...products];
    return SORTS[sort].fn ? list.sort(SORTS[sort].fn) : list;
  }, [products, brand, sort]);

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span>{cid ? 'Danh mục' : 'Tìm kiếm'}</span>
      </nav>
      <div className="list-head">
        <div>
          <h1 className="page-title">{title}</h1>
          {shown && <p className="muted" style={{ marginTop: 8 }}>{shown.length} sản phẩm</p>}
        </div>
      </div>

      {products && products.length > 0 && (
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Lọc theo thương hiệu">
            <button className="chip" aria-pressed={brand === ''} onClick={() => setBrand('')}>Tất cả</button>
            {brands.map((b) => (
              <button key={b} className="chip" aria-pressed={brand === b} onClick={() => setBrand(b)}>{b}</button>
            ))}
          </div>
          <label className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            Sắp xếp
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
        </div>
      )}

      <ProductGrid
        products={shown}
        empty={(
          <div className="empty">
            <GlassesMark className="glyph-bg" />
            <p>{keyword ? 'Không có sản phẩm nào khớp từ khóa. Thử tên thương hiệu hoặc từ ngắn hơn.' : 'Danh mục này chưa có sản phẩm.'}</p>
            <Link to="/" className="btn btn-ghost"><ArrowLeft size={18} /> Về trang chủ</Link>
          </div>
        )}
      />
    </div>
  );
}
