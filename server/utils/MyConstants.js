const isProd = process.env.NODE_ENV === 'production';

// chạy thật mà thiếu khóa bí mật hoặc mật khẩu admin thì dừng ngay, tránh dùng giá trị mặc định đoán được
if (isProd && (!process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD)) {
  console.error('Chế độ production bắt buộc đặt JWT_SECRET và ADMIN_PASSWORD trong biến môi trường.');
  process.exit(1);
}

const MyConstants = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES: '1h',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3002',
  // tài khoản admin mặc định, được tạo khi bảng admin còn trống
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '123',
};

module.exports = MyConstants;
