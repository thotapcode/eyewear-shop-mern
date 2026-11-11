import React from 'react';
import { Link } from 'react-router-dom';

export const imageSrc = (p) => (p.image ? `data:image/jpeg;base64,${p.image}` : null);
export const formatPrice = (price) => `$${Number(price).toLocaleString('en-US')}`;

export default function ProductCard({ product }) {
  const src = imageSrc(product);
  return (
    <Link to={`/product/${product._id}`} className="card">
      {src ? <img src={src} alt={product.name} /> : <div className="no-image">Chưa có ảnh</div>}
      <h3>{product.name}</h3>
      {product.brand && <p className="brand-line">{product.brand}</p>}
      <p className="price">{formatPrice(product.price)}</p>
    </Link>
  );
}

export function ProductGrid({ products, empty = 'Không có sản phẩm nào' }) {
  if (products.length === 0) return <p>{empty}</p>;
  return (
    <div className="grid">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
