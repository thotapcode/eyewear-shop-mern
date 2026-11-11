const mongoose = require('mongoose');
const MyConstants = require('./MyConstants');

// kết nối MongoDB Atlas; nếu mạng hoặc DNS chập chờn lúc khởi động thì thử lại sau 5 giây thay vì bỏ cuộc,
// vì lỗi kết nối đầu tiên sẽ khiến mọi truy vấn sau đó treo cho tới khi khởi động lại máy chủ
async function connect() {
  if (!MyConstants.MONGODB_URI) {
    console.error('Thiếu MONGODB_URI trong file server/.env');
    return;
  }
  try {
    await mongoose.connect(MyConstants.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message, '- thử lại sau 5 giây');
    setTimeout(connect, 5000);
  }
}
connect();

module.exports = mongoose;
