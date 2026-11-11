import React from 'react';
import { motion } from 'motion/react';

// hiện dần khi cuộn tới, để người xem thấy nội dung xuất hiện theo thứ tự đọc
export default function Reveal({ children, delay = 0, y = 20, as = 'div', className }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
