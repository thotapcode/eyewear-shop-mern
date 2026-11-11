const mongoose = require('../utils/MongooseUtil');

const AdminSchema = mongoose.Schema({
  username: String,
  password: String,
}, { versionKey: false });

const CategorySchema = mongoose.Schema({
  name: String,
}, { versionKey: false });

// sản phẩm kính mắt: ngoài tên, giá, ảnh còn có thương hiệu, loại gọng, chất liệu
const ProductSchema = mongoose.Schema({
  name: String,
  price: Number,
  image: String, // base64
  brand: String,
  frameType: String,
  material: String,
  cdate: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { versionKey: false });

const CustomerSchema = mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  active: Number, // 0: chưa kích hoạt, 1: đã kích hoạt
  token: String, // mã kích hoạt gửi qua email
}, { versionKey: false });

const OrderSchema = mongoose.Schema({
  cdate: Number,
  total: Number,
  status: String, // PENDING, APPROVED, CANCELED
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  // name và price là bản chụp lúc đặt hàng, để đơn cũ không đổi khi sản phẩm bị sửa hoặc xóa
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
  }],
}, { versionKey: false });

module.exports = {
  Admin: mongoose.model('Admin', AdminSchema),
  Category: mongoose.model('Category', CategorySchema),
  Product: mongoose.model('Product', ProductSchema),
  Customer: mongoose.model('Customer', CustomerSchema),
  Order: mongoose.model('Order', OrderSchema),
};
