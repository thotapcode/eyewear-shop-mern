import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { ProductGrid } from '../components/ProductCard';

// dùng chung cho hai trang: /product/category/:cid và /product/search/:keyword
export default function ProductList() {
  const { cid, keyword } = useParams();
  const [products, setProducts] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    setProducts(null);
    if (cid) {
      setTitle('Sản phẩm theo danh mục');
      api.get(`/products/category/${cid}`).then((res) => {
        setProducts(res.data);
        if (res.data.length > 0 && res.data[0].category) setTitle(res.data[0].category.name);
      });
    } else if (keyword) {
      setTitle(`Kết quả tìm kiếm cho "${keyword}"`);
      api.get(`/products/search/${encodeURIComponent(keyword)}`).then((res) => setProducts(res.data));
    }
  }, [cid, keyword]);

  return (
    <div>
      <h2>{title}</h2>
      <ProductGrid products={products} />
    </div>
  );
}
