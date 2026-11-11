import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import api from '../api';
import { useAuth } from '../AuthContext';
import GlassesMark from '../components/GlassesMark';
import Reveal from '../components/Reveal';
import { ProductGrid, formatPrice, imageSrc } from '../components/ProductCard';

const rise = (delay) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function Home() {
  const { customer } = useAuth();
  const [categories, setCategories] = useState(null);
  const [newProducts, setNewProducts] = useState(null);
  const [hotProducts, setHotProducts] = useState([]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/products/new').then((res) => setNewProducts(res.data));
    api.get('/products/hot').then((res) => setHotProducts(res.data));
  }, []);

  const featured = newProducts && newProducts[0];
  const featuredImg = imageSrc(featured);

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <motion.h1 {...rise(0.05)}>Gọng kính hợp mặt, <em>nhìn rõ</em> mỗi ngày</motion.h1>
          <motion.p className="lead" {...rise(0.15)}>
            Gọng cận, kính râm và phụ kiện. Chọn theo danh mục hoặc tìm theo thương hiệu.
          </motion.p>
          <motion.div className="hero-cta" {...rise(0.25)}>
            <a href="#moi" className="btn btn-primary">Xem sản phẩm mới <ArrowRight size={18} weight="bold" /></a>
            {!customer && <Link to="/signup" className="btn btn-ghost">Tạo tài khoản</Link>}
          </motion.div>
        </div>

        <motion.div className="hero-art" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
          <figure className="hero-figure">
            {featured ? (
              <Link to={`/product/${featured._id}`} aria-label={`Xem ${featured.name}`}>
                <div className="hero-media">
                  {featuredImg ? <img src={featuredImg} alt={featured.name} /> : <GlassesMark className="glyph-bg" />}
                </div>
              </Link>
            ) : (
              <div className="hero-media"><GlassesMark className="glyph-bg" /></div>
            )}
            {featured && (
              <figcaption className="hero-caption">
                <strong>{featured.name}</strong>
                <span className="mono">{formatPrice(featured.price)}</span>
              </figcaption>
            )}
          </figure>
        </motion.div>
      </section>

      {categories && categories.length > 0 && (
        <section className="section">
          <Reveal className="section-head"><h2>Chọn theo danh mục</h2></Reveal>
          <div className={`cat-grid${categories.length >= 3 ? ' many' : ''}`}>
            {categories.map((c, i) => (
              <Reveal key={c._id} delay={i * 0.06}>
                <Link to={`/product/category/${c._id}`} className={`cat tone-${i % 3}`} style={{ height: '100%' }}>
                  <GlassesMark className="glyph-bg" />
                  <span className="arrow"><ArrowUpRight size={20} weight="bold" /></span>
                  <h3>{c.name}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section" id="moi">
        <Reveal className="section-head"><h2>Sản phẩm mới</h2></Reveal>
        <ProductGrid
          products={newProducts}
          empty={(
            <div className="empty">
              <GlassesMark className="glyph-bg" />
              <p>Cửa hàng chưa có sản phẩm nào. Quản trị viên thêm sản phẩm ở trang quản trị là sẽ hiện ở đây.</p>
            </div>
          )}
        />
      </section>

      {hotProducts.length > 0 && (
        <section className="section">
          <Reveal className="section-head"><h2>Bán chạy nhất</h2></Reveal>
          <ProductGrid products={hotProducts} />
        </section>
      )}
    </div>
  );
}
