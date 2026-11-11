import React from 'react';
import GlassesMark from './GlassesMark';

// khung hai cột cho các trang đăng nhập, đăng ký: bên trái giới thiệu, bên phải là biểu mẫu
export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth-side" aria-hidden="true">
        <GlassesMark className="glyph-bg" strokeWidth={2} />
        <h2>Chọn gọng ưng ý, theo dõi mọi thứ ở một nơi.</h2>
        <p>Tài khoản giúp lưu thông tin giao hàng và xem lại các lần mua.</p>
      </aside>
      <div className="auth-main">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
