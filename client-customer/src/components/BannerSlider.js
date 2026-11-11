import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';

const INTERVAL = 6500;

// nút bấm của banner: đường dẫn nội bộ dùng Link, địa chỉ http dùng thẻ a
function Cta({ banner }) {
  if (!banner.cta || !banner.link) return null;
  const inner = <>{banner.cta} <ArrowRight size={18} weight="bold" /></>;
  return /^https?:/.test(banner.link)
    ? <a className="btn banner-cta" href={banner.link} target="_blank" rel="noreferrer">{inner}</a>
    : <Link className="btn banner-cta" to={banner.link}>{inner}</Link>;
}

// dải banner đầu trang chủ: tự chuyển ảnh, dừng khi rê chuột hoặc đang dùng bàn phím trong banner
export default function BannerSlider({ banners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef(null);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused || reduce) return undefined;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearTimeout(timer.current);
  }, [index, count, paused, reduce]);

  const go = (n) => setIndex((n + count) % count);
  const b = banners[index];

  return (
    <section
      className="banner"
      aria-roledescription="carousel"
      aria-label="Banner nổi bật"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={b._id}
          className="banner-slide"
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} trên ${count}`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={`data:image/jpeg;base64,${b.image}`} alt="" />
          <div className="banner-shade" />
          <div className="wrap banner-copy">
            <motion.h2 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>{b.title}</motion.h2>
            {b.subtitle && <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>{b.subtitle}</motion.p>}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}><Cta banner={b} /></motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div className="wrap banner-controls">
          <div className="banner-dots" role="tablist" aria-label="Chọn banner">
            {banners.map((x, i) => (
              <button key={x._id} role="tab" aria-selected={i === index} aria-label={`Banner ${i + 1}: ${x.title}`} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} />
            ))}
          </div>
          <div className="banner-arrows">
            <button onClick={() => go(index - 1)} aria-label="Banner trước"><ArrowLeft size={20} weight="bold" /></button>
            <button onClick={() => go(index + 1)} aria-label="Banner sau"><ArrowRight size={20} weight="bold" /></button>
          </div>
        </div>
      )}
    </section>
  );
}
