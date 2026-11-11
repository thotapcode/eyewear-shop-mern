import React, { useEffect, useState } from 'react';
import api from '../api';
import { ProductGrid } from '../components/ProductCard';

export default function Home() {
  const [newProducts, setNewProducts] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);

  useEffect(() => {
    api.get('/products/new').then((res) => setNewProducts(res.data));
    api.get('/products/hot').then((res) => setHotProducts(res.data));
  }, []);

  return (
    <div>
      <section>
        <h2>Sản phẩm mới</h2>
        <ProductGrid products={newProducts} empty="Chưa có sản phẩm mới" />
      </section>
      {hotProducts.length > 0 && (
        <section>
          <h2>Sản phẩm bán chạy</h2>
          <ProductGrid products={hotProducts} />
        </section>
      )}
    </div>
  );
}
