require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const MyConstants = require('./utils/MyConstants');
const PasswordUtil = require('./utils/PasswordUtil');
const { Admin, Product } = require('./models/Models');

const app = express();

// middlewares
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// apis
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});
app.use('/api/admin', require('./api/admin'));
app.use('/api/customer', require('./api/customer'));

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
require('mongoose').connection.once('open', () => { seedAdmin(); migrateStock(); });

app.listen(MyConstants.PORT, () => {
  console.log(`Server listening on ${MyConstants.PORT}`);
});
