import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import api from '../api';
import { useAuth } from '../AuthContext';
import BannerSlider from '../components/BannerSlider';
import GlassesMark from '../components/GlassesMark';
import Reveal from '../components/Reveal';
import { ProductGrid, RowCard, formatPrice, imageSrc } from '../components/ProductCard';

const rise = (delay) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function Home() {
  const { customer } = useAuth();
  const [banners, setBanners] = useState(null); // null: đang tải
  const [categories, setCategories] = useState(null);
  const [newProducts, setNewProducts] = useState(null);
  const [hotProducts, setHotProducts] = useState([]);

  useEffect(() => {
    api.get('/banners').then((res) => setBanners(Array.isArray(res.data) ? res.data : [])).catch(() => setBanners([]));
    api.get('/categories').then((res) => setCategories(Array.isArray(res.data) ? res.data : [])).catch(() => setCategories([]));
    api.get('/products/new').then((res) => setNewProducts(Array.isArray(res.data) ? res.data : [])).catch(() => setNewProducts([]));
    api.get('/products/hot').then((res) => setHotProducts(Array.isArray(res.data) ? res.data : [])).catch(() => setHotProducts([]));
  }, []);

  const featured = newProducts && newProducts[0];
  const featuredImg = imageSrc(featured);
  // lặp tên danh mục đủ dài để dải chữ chạy liền mạch
  const tickerItems = categories && categories.length > 0
    ? Array.from({ length: Math.max(8, categories.length * 4) }, (_, i) => categories[i % categories.length])
    : [];

  const hasBanners = banners && banners.length > 0;

  return (
    <>
      {hasBanners && <BannerSlider banners={banners} />}
      {banners === null && <div className="banner skeleton" aria-busy="true" />}
      {banners && banners.length === 0 && (
      <div className="wrap">
        <section className="hero">
          <div className="hero-copy">
            <motion.h1 {...rise(0.05)}>Nhìn rõ<br />mỗi <span>ngày</span></motion.h1>
            <motion.p className="lead" {...rise(0.2)}>
              Gọng cận, kính râm và phụ kiện. Chọn theo danh mục hoặc tìm theo thương hiệu.
            </motion.p>
            <motion.div className="hero-cta" {...rise(0.3)}>
              <a href="#moi" className="btn">Xem sản phẩm mới <ArrowRight size={18} weight="bold" /></a>
              {!customer && <Link to="/signup" className="btn btn-ghost">Tạo tài khoản</Link>}
            </motion.div>
          </div>

          <motion.div className="hero-art" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
            <figure className="hero-figure">
              {featured ? (
                <Link to={`/product/${featured._id}`} aria-label={`Xem ${featured.name}`}>
                  <div className="hero-media">
                    {featuredImg ? <img src={featuredImg} alt={featured.name} /> : <GlassesMark className="glyph-bg" strokeWidth={6} />}
                  </div>
                </Link>
              ) : (
                <div className="hero-media"><GlassesMark className="glyph-bg" strokeWidth={6} /></div>
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
      </div>
      )}

      {tickerItems.length > 0 && (
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((dup) => (
              <div key={dup} style={{ display: 'flex' }}>
                {tickerItems.map((c, i) => (
                  <span className="ticker-item" key={`${dup}-${i}`}>{c.name}<GlassesMark size={34} strokeWidth={7} /></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wrap">
        <section className="section" id="moi">
          <Reveal className="section-head"><h2>Sản phẩm mới</h2></Reveal>
          <ProductGrid
            products={newProducts}
            lead={newProducts && newProducts.length === 3}
            empty={(
              <div className="empty">
                <GlassesMark className="glyph-bg" strokeWidth={6} />
                <p>Cửa hàng chưa có sản phẩm nào. Quản trị viên thêm sản phẩm ở trang quản trị là sẽ hiện ở đây.</p>
              </div>
            )}
          />
        </section>

        {categories && categories.length > 0 && (
          <section className="section">
            <Reveal className="section-head"><h2>Mua theo danh mục</h2></Reveal>
            <div className="index-list">
              {categories.map((c, i) => (
                <Reveal key={c._id} delay={i * 0.05}>
                  <Link to={`/product/category/${c._id}`} className="index-row">
                    <h3>{c.name}</h3>
                    <ArrowUpRight size={44} weight="bold" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {hotProducts.length > 0 && (
          <section className="section">
            <Reveal className="section-head"><h2>Bán chạy nhất</h2></Reveal>
            <div className="rows">
              {hotProducts.map((p, i) => (
                <Reveal key={p._id} delay={i * 0.06}><RowCard product={p} /></Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
