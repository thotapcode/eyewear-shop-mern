require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const MyConstants = require('./utils/MyConstants');
const PasswordUtil = require('./utils/PasswordUtil');
const rateLimit = require('./utils/RateLimit');
const { Admin, Product } = require('./models/Models');

const app = express();
app.set('trust proxy', 1); // chạy sau proxy của hosting thì lấy đúng IP người dùng

// middlewares
// CSP tắt vì bản build của React có đoạn script nhúng sẵn; các header bảo vệ khác của helmet vẫn bật
app.use(helmet({ contentSecurityPolicy: false }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// chặn dò mật khẩu: tối đa 30 lần mỗi 10 phút cho mỗi IP và mỗi đường dẫn
const authLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });
app.use(['/api/admin/login', '/api/customer/login', '/api/customer/signup'], authLimit);

// apis
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});
app.use('/api/admin', require('./api/admin'));
app.use('/api/customer', require('./api/customer'));
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại' }));

// khi chạy thật (NODE_ENV=production), máy chủ phục vụ luôn bản build của hai trang web:
// /admin là trang quản trị, các đường dẫn còn lại là trang khách. Cách này khớp với hướng dẫn triển khai của đề cương.
const adminBuild = path.join(__dirname, '..', 'client-admin', 'build');
const customerBuild = path.join(__dirname, '..', 'client-customer', 'build');
if (process.env.NODE_ENV === 'production') {
  if (fs.existsSync(adminBuild) && fs.existsSync(customerBuild)) {
    app.use('/admin', express.static(adminBuild));
    app.get(/^\/admin(\/.*)?$/, (req, res) => res.sendFile(path.join(adminBuild, 'index.html')));
    app.use(express.static(customerBuild));
    app.get(/.*/, (req, res) => res.sendFile(path.join(customerBuild, 'index.html')));
  } else {
    console.warn('Chưa có thư mục build của client, hãy chạy "npm run build:clients" trước khi chạy ở chế độ production.');
  }
}

// lỗi không lường trước: ghi log ở máy chủ, trả về JSON gọn, không lộ chi tiết nội bộ
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Dữ liệu gửi lên quá lớn' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Dữ liệu gửi lên không đúng định dạng' });
  console.error(err);
  res.status(500).json({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại sau' });
});

// tạo tài khoản admin mặc định nếu chưa có
async function seedAdmin() {
  if ((await Admin.countDocuments({})) === 0) {
    await Admin.create({
      username: MyConstants.ADMIN_USERNAME,
      password: PasswordUtil.hash(MyConstants.ADMIN_PASSWORD),
    });
    console.log(`Created default admin "${MyConstants.ADMIN_USERNAME}"`);
  }
}
// sản phẩm tạo trước khi có tính năng tồn kho được gán 10 cái để không bị coi là hết hàng
async function migrateStock() {
  await Product.updateMany({ stock: { $exists: false } }, { $set: { stock: 10, description: '' } });
}
require('mongoose').connection.once('open', () => { seedAdmin().catch(console.error); migrateStock().catch(console.error); });

process.on('unhandledRejection', (err) => console.error('Lỗi chưa được bắt:', err));

app.listen(MyConstants.PORT, () => {
  console.log(`Server listening on ${MyConstants.PORT}${process.env.NODE_ENV === 'production' ? ' (production)' : ''}`);
});
