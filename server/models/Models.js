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

module.exports = {
  Admin: mongoose.model('Admin', AdminSchema),
  Category: mongoose.model('Category', CategorySchema),
  Product: mongoose.model('Product', ProductSchema),
};
