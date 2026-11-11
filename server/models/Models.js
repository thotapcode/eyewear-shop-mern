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
  description: String,
  stock: Number, // số lượng còn trong kho
  cdate: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { versionKey: false });

const CustomerSchema = mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phone: String,
  email: String,
  address: String,
  active: Number, // 0: chưa kích hoạt, 1: đang hoạt động, 2: bị admin khóa
  token: String, // mã kích hoạt gửi qua email
}, { versionKey: false });

const OrderSchema = mongoose.Schema({
  cdate: Number,
  total: Number,
  status: String, // PENDING, APPROVED, CANCELED
  payment: String, // COD: thanh toán khi nhận hàng
  shipping: { name: String, phone: String, address: String, note: String },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  // name và price là bản chụp lúc đặt hàng, để đơn cũ không đổi khi sản phẩm bị sửa hoặc xóa
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
  }],
}, { versionKey: false });

// banner quảng cáo ở đầu trang chủ; sortOrder nhỏ hiện trước, chỉ banner active=true mới hiện cho khách
const BannerSchema = mongoose.Schema({
  title: String,
  subtitle: String,
  cta: String, // chữ trên nút
  link: String, // đường dẫn nội bộ như /product/category/<id>
  image: String, // base64
  active: Boolean,
  sortOrder: Number,
}, { versionKey: false });

module.exports = {
  Banner: mongoose.model('Banner', BannerSchema),
  Admin: mongoose.model('Admin', AdminSchema),
  Category: mongoose.model('Category', CategorySchema),
  Product: mongoose.model('Product', ProductSchema),
  Customer: mongoose.model('Customer', CustomerSchema),
  Order: mongoose.model('Order', OrderSchema),
};
