import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { formatPrice, imageSrc } from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(undefined); // undefined: đang tải, null: không tồn tại

  useEffect(() => {
    setProduct(undefined);
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (product === undefined) return <p>Đang tải...</p>;
  if (product === null) return <p>Không tìm thấy sản phẩm</p>;

  const src = imageSrc(product);
  return (
    <div className="detail">
      {src ? <img src={src} alt={product.name} /> : <div className="no-image">Chưa có ảnh</div>}
      <div>
        <h2>{product.name}</h2>
        <p className="price big">{formatPrice(product.price)}</p>
        <table className="spec">
          <tbody>
            <tr><th>Danh mục</th><td>{product.category ? product.category.name : ''}</td></tr>
            <tr><th>Thương hiệu</th><td>{product.brand}</td></tr>
            <tr><th>Loại gọng</th><td>{product.frameType}</td></tr>
            <tr><th>Chất liệu</th><td>{product.material}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
