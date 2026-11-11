import React from 'react';

// ký hiệu gọng kính: hai tròng tròn nối bằng sống mũi, dùng làm logo và hình nền
export default function GlassesMark({ className, size, strokeWidth = 5 }) {
  return (
    <svg
      className={className}
      width={size}
      viewBox="0 0 120 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{ overflow: 'visible' }}
    >
      <circle cx="28" cy="30" r="22" />
      <circle cx="92" cy="30" r="22" />
      <path d="M50 28c3-4 17-4 20 0" />
      <path d="M6 24 1 12M114 24l5-12" />
    </svg>
  );
}
