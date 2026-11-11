const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const PasswordUtil = require('../utils/PasswordUtil');
const MailUtil = require('../utils/MailUtil');
const { Admin, Category, Product, Customer, Order } = require('../models/Models');

const PAGE_SIZE = 4;

// ---- login & logout ----
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: 'Please input username and password' });
  const admin = await Admin.findOne({ username });
  if (!admin || !PasswordUtil.verify(password, admin.password)) {
    return res.json({ success: false, message: 'Incorrect username or password' });
  }
  const token = JwtUtil.genToken({ role: 'admin', id: admin._id, username: admin.username });
  res.json({ success: true, message: 'Authentication successful', token });
});

router.get('/token', JwtUtil.checkAdmin, (req, res) => {
  const token = req.headers['x-access-token'];
  res.json({ success: true, message: 'Token is valid', token });
});

// ---- categories ----
router.get('/categories', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Category.find({}));
});

router.post('/categories', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Category.create({ name: req.body.name }));
});

router.put('/categories/:id', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true }));
});

router.delete('/categories/:id', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Category.findByIdAndDelete(req.params.id));
});

// ---- products ----
router.get('/products', JwtUtil.checkAdmin, async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const total = await Product.countDocuments({});
  const products = await Product.find({})
    .sort({ cdate: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('category');
  res.json({ products, noPages: Math.ceil(total / PAGE_SIZE), curPage: page });
});

router.post('/products', JwtUtil.checkAdmin, async (req, res) => {
  const { name, price, category, image, brand, frameType, material } = req.body;
  const product = await Product.create({
    name, price, category, image, brand, frameType, material, cdate: Date.now(),
  });
  res.json(product);
});

router.put('/products/:id', JwtUtil.checkAdmin, async (req, res) => {
  const { name, price, category, image, brand, frameType, material } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { name, price, category, image, brand, frameType, material },
    { new: true }
  );
  res.json(product);
});

router.delete('/products/:id', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Product.findByIdAndDelete(req.params.id));
});

// ---- đơn hàng ----
const isId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));
const STATUSES = ['APPROVED', 'CANCELED'];

router.get('/orders', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Order.find({}).sort({ cdate: -1 }).populate('customer', 'name username email phone'));
});

router.get('/orders/customer/:cid', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.cid)) return res.json([]);
  res.json(await Order.find({ customer: req.params.cid }).sort({ cdate: -1 }).populate('customer', 'name username email phone'));
});

// chỉ đơn đang chờ duyệt (PENDING) mới đổi được trạng thái
router.put('/orders/status/:id', JwtUtil.checkAdmin, async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.json({ success: false, message: 'Trạng thái không hợp lệ' });
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Đơn hàng không tồn tại' });
  const order = await Order.findOneAndUpdate({ _id: req.params.id, status: 'PENDING' }, { status }, { new: true });
  if (!order) return res.json({ success: false, message: 'Đơn hàng không tồn tại hoặc đã được xử lý' });
  res.json({ success: true, order });
});

// ---- khách hàng ----
// không bao giờ trả mật khẩu và mã kích hoạt
const CUSTOMER_FIELDS = '-password -token';

router.get('/customers', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Customer.find({}, CUSTOMER_FIELDS));
});

router.put('/customers/deactive/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Khách hàng không tồn tại' });
  const customer = await Customer.findOneAndUpdate({ _id: req.params.id, active: 1 }, { active: 2 }, { new: true, select: CUSTOMER_FIELDS });
  res.json(customer ? { success: true, customer } : { success: false, message: 'Chỉ khóa được tài khoản đang hoạt động' });
});

router.put('/customers/reactive/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Khách hàng không tồn tại' });
  const customer = await Customer.findOneAndUpdate({ _id: req.params.id, active: 2 }, { active: 1 }, { new: true, select: CUSTOMER_FIELDS });
  res.json(customer ? { success: true, customer } : { success: false, message: 'Chỉ mở khóa được tài khoản đang bị khóa' });
});

// gửi lại email kích hoạt cho tài khoản chưa kích hoạt
router.get('/customers/sendmail/:id', JwtUtil.checkAdmin, async (req, res) => {
  const customer = isId(req.params.id) ? await Customer.findById(req.params.id) : null;
  if (!customer) return res.json({ success: false, message: 'Khách hàng không tồn tại' });
  if (customer.active !== 0) return res.json({ success: false, message: 'Chỉ gửi lại email cho tài khoản chưa kích hoạt' });
  try {
    const sent = await MailUtil.sendActivation(customer);
    res.json({ success: true, message: sent ? 'Đã gửi email kích hoạt' : 'Chưa cấu hình email, liên kết kích hoạt được in ra cửa sổ chạy máy chủ' });
  } catch (err) {
    console.error('Gửi mail thất bại:', err.message);
    res.json({ success: false, message: 'Gửi email thất bại' });
  }
});

module.exports = router;
