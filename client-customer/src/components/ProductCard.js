import React from 'react';
import { Link } from 'react-router-dom';
import GlassesMark from './GlassesMark';
import Reveal from './Reveal';

export const imageSrc = (p) => (p && p.image ? `data:image/jpeg;base64,${p.image}` : null);
export const formatPrice = (price) => `$${Number(price).toLocaleString('en-US')}`;

export default function ProductCard({ product }) {
  const src = imageSrc(product);
  return (
    <Link to={`/product/${product._id}`} className="card">
      <div className="card-media">
        {src ? <img src={src} alt={product.name} loading="lazy" /> : <GlassesMark className="glyph-bg" />}
      </div>
      <div className="card-body">
        {product.brand && <p className="card-brand">{product.brand}</p>}
        <h3 className="card-name">{product.name}</h3>
        <p className="card-price mono">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Đang tải sản phẩm">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '4 / 5' }} />
          <div className="skeleton line" style={{ width: '40%' }} />
          <div className="skeleton line" style={{ width: '75%' }} />
        </div>
      ))}
    </div>
  );
}

// products là null khi đang tải dữ liệu
export function ProductGrid({ products, empty }) {
  if (products === null) return <SkeletonGrid />;
  if (products.length === 0) return empty || null;
  return (
    <div className="grid">
      {products.map((p, i) => (
        <Reveal key={p._id} delay={Math.min(i, 5) * 0.05}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}
