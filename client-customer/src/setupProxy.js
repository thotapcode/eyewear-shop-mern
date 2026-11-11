const { createProxyMiddleware } = require('http-proxy-middleware');

// chuyển các yêu cầu /api sang máy chủ cổng 3000 khi chạy npm start.
// Dùng file này thay cho trường "proxy" trong package.json vì trường đó gây lỗi
// "allowedHosts" trên những máy không nhận được địa chỉ mạng LAN.
module.exports = function (app) {
  app.use(createProxyMiddleware('/api', { target: 'http://localhost:3000', changeOrigin: true }));
};
