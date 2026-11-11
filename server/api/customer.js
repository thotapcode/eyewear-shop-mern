const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const PasswordUtil = require('../utils/PasswordUtil');
const MailUtil = require('../utils/MailUtil');
const { Customer, Category, Product, Order } = require('../models/Models');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));
// không bao giờ trả mật khẩu và mã kích hoạt về client
const publicCustomer = (c) => ({ _id: c._id, username: c.username, name: c.name, phone: c.phone, email: c.email, active: c.active });

// ---- sản phẩm ----
router.get('/categories', async (req, res) => {
  res.json(await Category.find({}));
});

router.get('/products/new', async (req, res) => {
  res.json(await Product.find({}).sort({ cdate: -1 }).limit(3).populate('category'));
});

// bán chạy: tổng số lượng trong các đơn không bị hủy
router.get('/products/hot', async (req, res) => {
  const top = await Order.aggregate([
    { $match: { status: { $ne: 'CANCELED' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', sold: { $sum: '$items.quantity' } } },
    { $sort: { sold: -1 } },
    { $limit: 3 },
  ]);
  const products = await Product.find({ _id: { $in: top.map((t) => t._id) } }).populate('category');
  products.sort((a, b) => top.findIndex((t) => t._id.equals(a._id)) - top.findIndex((t) => t._id.equals(b._id)));
  res.json(products);
});

router.get('/products/category/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.json([]);
  res.json(await Product.find({ category: req.params.id }).populate('category'));
});

router.get('/products/search/:keyword', async (req, res) => {
  const re = new RegExp(escapeRegex(req.params.keyword), 'i');
  res.json(await Product.find({ $or: [{ name: re }, { brand: re }] }).populate('category'));
});

router.get('/products/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.json(null);
  res.json(await Product.findById(req.params.id).populate('category'));
});

// ---- tài khoản ----
router.post('/signup', async (req, res) => {
  const { username, password, name, phone, email } = req.body;
  if (!username || !password || !name || !email) {
    return res.json({ success: false, message: 'Vui lòng nhập đủ tên đăng nhập, mật khẩu, họ tên và email' });
  }
  if (await Customer.findOne({ username })) {
    return res.json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
  }
  const customer = await Customer.create({
    username, password: PasswordUtil.hash(password), name, phone, email,
    active: 0, token: crypto.randomBytes(16).toString('hex'),
  });
  try {
    await MailUtil.sendActivation(customer);
  } catch (err) {
    console.error('Gửi mail thất bại:', err.message);
    return res.json({ success: false, message: 'Đã tạo tài khoản nhưng gửi email thất bại, vui lòng liên hệ quản trị' });
  }
  res.json({ success: true, message: 'Vui lòng kiểm tra email để kích hoạt tài khoản' });
});

router.post('/active', async (req, res) => {
  const { id, token } = req.body;
  if (!isId(id) || !token) return res.json({ success: false, message: 'Liên kết kích hoạt không hợp lệ' });
  const customer = await Customer.findOneAndUpdate({ _id: id, token }, { active: 1 }, { new: true });
  res.json(customer
    ? { success: true, message: 'Kích hoạt thành công' }
    : { success: false, message: 'Liên kết kích hoạt không hợp lệ' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  const customer = await Customer.findOne({ username });
  if (!customer || !PasswordUtil.verify(password, customer.password)) {
    return res.json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  if (customer.active !== 1) return res.json({ success: false, message: 'Tài khoản chưa được kích hoạt' });
  const token = JwtUtil.genToken({ role: 'customer', id: customer._id, username: customer.username });
  res.json({ success: true, message: 'Đăng nhập thành công', token, customer: publicCustomer(customer) });
});

router.get('/token', JwtUtil.checkCustomer, async (req, res) => {
  const customer = await Customer.findById(req.decoded.id);
  if (!customer || customer.active !== 1) return res.json({ success: false, message: 'Tài khoản không hợp lệ' });
  res.json({ success: true, message: 'Token is valid', token: req.headers['x-access-token'], customer: publicCustomer(customer) });
});

// khách chỉ được sửa hồ sơ của chính mình
router.put('/customers/:id', JwtUtil.checkCustomer, async (req, res) => {
  if (String(req.decoded.id) !== req.params.id) return res.json({ success: false, message: 'Không có quyền sửa hồ sơ này' });
  const { name, phone, email, password } = req.body;
  const update = { name, phone, email };
  if (password) update.password = PasswordUtil.hash(password);
  const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, customer: publicCustomer(customer) });
});

module.exports = router;
