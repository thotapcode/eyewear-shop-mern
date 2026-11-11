import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import api from '../api';
import GlassesMark from '../components/GlassesMark';
import { formatPrice, imageSrc } from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(undefined); // undefined: đang tải, null: không tồn tại

  useEffect(() => {
    setProduct(undefined);
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (product === undefined) {
    return (
      <div className="wrap page">
        <div className="detail" aria-busy="true">
          <div className="skeleton" style={{ aspectRatio: '1' }} />
          <div>
            <div className="skeleton line" style={{ width: '30%' }} />
            <div className="skeleton line" style={{ width: '80%', height: 36 }} />
            <div className="skeleton line" style={{ width: '40%', height: 30 }} />
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="wrap page">
        <div className="empty">
          <GlassesMark className="glyph-bg" />
          <p>Không tìm thấy sản phẩm này. Có thể sản phẩm đã bị gỡ.</p>
          <Link to="/" className="btn btn-ghost"><ArrowLeft size={18} /> Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const src = imageSrc(product);
  const category = product.category;
  const specs = [
    ['Danh mục', category && category.name],
    ['Loại gọng', product.frameType],
    ['Chất liệu', product.material],
  ].filter(([, v]) => v);

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        {category && <><span aria-hidden="true">/</span><Link to={`/product/category/${category._id}`}>{category.name}</Link></>}
        <span aria-hidden="true">/</span><span>{product.name}</span>
      </nav>
      <div className="detail">
        <div className="detail-media">
          {src ? <img src={src} alt={product.name} /> : <GlassesMark className="glyph-bg" strokeWidth={6} />}
        </div>
        <div className="detail-info">
          {product.brand && <p className="brandline">{product.brand}</p>}
          <h1>{product.name}</h1>
          <p className="detail-price mono">{formatPrice(product.price)}</p>
          {specs.length > 0 && (
            <dl className="specs">
              {specs.map(([k, v]) => (
                <div className="spec" key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
