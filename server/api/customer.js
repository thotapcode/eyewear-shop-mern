const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const PasswordUtil = require('../utils/PasswordUtil');
const MailUtil = require('../utils/MailUtil');
const { Customer, Category, Product, Order, Banner } = require('../models/Models');

const PHONE = /^[0-9+\s.-]{9,15}$/;
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));
// không bao giờ trả mật khẩu và mã kích hoạt về client
const publicCustomer = (c) => ({ _id: c._id, username: c.username, name: c.name, phone: c.phone, email: c.email, address: c.address || '', active: c.active });

// ---- sản phẩm ----
router.get('/categories', async (req, res) => {
  res.json(await Category.find({}));
});

router.get('/banners', async (req, res) => {
  res.json(await Banner.find({ active: true }).sort({ sortOrder: 1 }));
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
  const b = req.body || {};
  const username = text(b.username, 40);
  const name = text(b.name, 80);
  const email = text(b.email, 120);
  const phone = text(b.phone, 20);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!username || !password || !name || !email) {
    return res.json({ success: false, message: 'Vui lòng nhập đủ tên đăng nhập, mật khẩu, họ tên và email' });
  }
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
    return res.json({ success: false, message: 'Tên đăng nhập gồm 3 đến 30 ký tự chữ, số, dấu chấm, gạch ngang hoặc gạch dưới' });
  }
  if (password.length < 6 || password.length > 100) return res.json({ success: false, message: 'Mật khẩu cần từ 6 đến 100 ký tự' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.json({ success: false, message: 'Email chưa đúng định dạng' });
  if (phone && !PHONE.test(phone)) return res.json({ success: false, message: 'Số điện thoại chưa hợp lệ' });
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
  const customer = await Customer.findOneAndUpdate({ _id: id, token, active: 0 }, { active: 1 }, { new: true }); // tài khoản bị khóa không tự mở lại được bằng liên kết cũ
  res.json(customer
    ? { success: true, message: 'Kích hoạt thành công' }
    : { success: false, message: 'Liên kết kích hoạt không hợp lệ' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) return res.json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  const customer = await Customer.findOne({ username });
  if (!customer || !PasswordUtil.verify(password, customer.password)) {
    return res.json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  if (customer.active === 2) return res.json({ success: false, message: 'Tài khoản đã bị khóa, vui lòng liên hệ cửa hàng' });
  if (customer.active !== 1) return res.json({ success: false, message: 'Tài khoản chưa được kích hoạt' });
  const token = JwtUtil.genToken({ role: 'customer', id: customer._id, username: customer.username });
  res.json({ success: true, message: 'Đăng nhập thành công', token, customer: publicCustomer(customer) });
});

router.get('/token', JwtUtil.checkCustomer, async (req, res) => {
  const customer = await Customer.findById(req.decoded.id);
  if (!customer || customer.active !== 1) return res.json({ success: false, message: 'Tài khoản không hợp lệ' });
  res.json({ success: true, message: 'Token is valid', token: req.headers['x-access-token'], customer: publicCustomer(customer) });
});

// sau khi qua checkCustomer, kiểm tra thêm tài khoản còn tồn tại và đang kích hoạt
// (token đã cấp vẫn còn hạn nhưng tài khoản có thể đã bị admin khóa)
async function requireActive(req, res, next) {
  const customer = await Customer.findById(req.decoded.id);
  if (!customer || customer.active !== 1) return res.json({ success: false, message: 'Tài khoản không hợp lệ hoặc đã bị khóa' });
  next();
}

// khách chỉ được sửa hồ sơ của chính mình
router.put('/customers/:id', JwtUtil.checkCustomer, requireActive, async (req, res) => {
  if (String(req.decoded.id) !== req.params.id) return res.json({ success: false, message: 'Không có quyền sửa hồ sơ này' });
  const { name, phone, email, address, password } = req.body;
  if (!text(name, 80) || !/^\S+@\S+\.\S+$/.test(text(email, 120))) return res.json({ success: false, message: 'Họ tên và email không hợp lệ' });
  const update = { name: text(name, 80), phone: text(phone, 20), email: text(email, 120), address: text(address, 200) };
  if (password) {
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) return res.json({ success: false, message: 'Mật khẩu mới cần từ 6 đến 100 ký tự' });
    update.password = PasswordUtil.hash(password);
  }
  const customer = await Customer.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, customer: publicCustomer(customer) });
});

// ---- đặt hàng ----
const MAX_QTY = 20;

// giá và tên luôn lấy từ cơ sở dữ liệu, không tin dữ liệu giá do client gửi lên
router.post('/checkout', JwtUtil.checkCustomer, requireActive, async (req, res) => {
  const raw = Array.isArray(req.body.items) ? req.body.items : [];
  if (raw.length === 0) return res.json({ success: false, message: 'Giỏ hàng đang trống' });

  const sh = req.body.shipping || {};
  const shipping = { name: text(sh.name, 80), phone: text(sh.phone, 20), address: text(sh.address, 200), note: text(sh.note, 300) };
  if (!shipping.name) return res.json({ success: false, message: 'Vui lòng nhập tên người nhận' });
  if (!PHONE.test(shipping.phone)) return res.json({ success: false, message: 'Số điện thoại người nhận không hợp lệ' });
  if (shipping.address.length < 8) return res.json({ success: false, message: 'Vui lòng nhập địa chỉ giao hàng đầy đủ' });

  const merged = new Map(); // gộp các dòng trùng sản phẩm
  for (const it of raw) {
    const qty = Number(it.quantity);
    if (!isId(it.product) || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return res.json({ success: false, message: `Số lượng mỗi sản phẩm phải từ 1 đến ${MAX_QTY}` });
    }
    merged.set(String(it.product), Math.min((merged.get(String(it.product)) || 0) + qty, MAX_QTY));
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] } });
  if (products.length !== merged.size) {
    return res.json({ success: false, message: 'Có sản phẩm trong giỏ không còn bán, vui lòng kiểm tra lại giỏ hàng' });
  }

  // trừ kho từng sản phẩm bằng một thao tác nguyên tử; thiếu hàng thì hoàn lại những sản phẩm đã trừ
  const taken = [];
  for (const p of products) {
    const qty = merged.get(String(p._id));
    const done = await Product.findOneAndUpdate({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (!done) {
      await Product.bulkWrite(taken.map((t) => ({ updateOne: { filter: { _id: t.id }, update: { $inc: { stock: t.qty } } } })));
      return res.json({ success: false, message: `"${p.name}" chỉ còn ${Math.max(p.stock || 0, 0)} sản phẩm trong kho` });
    }
    taken.push({ id: p._id, qty });
  }

  const items = products.map((p) => ({ product: p._id, name: p.name, price: p.price, quantity: merged.get(String(p._id)) }));
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  try {
    const order = await Order.create({ cdate: Date.now(), total, status: 'PENDING', payment: 'COD', shipping, customer: req.decoded.id, items });
    res.json({ success: true, message: 'Đặt hàng thành công', order });
  } catch (err) {
    await Product.bulkWrite(taken.map((t) => ({ updateOne: { filter: { _id: t.id }, update: { $inc: { stock: t.qty } } } })));
    res.json({ success: false, message: 'Không tạo được đơn hàng, vui lòng thử lại' });
  }
});

router.get('/orders/customer/:cid', JwtUtil.checkCustomer, requireActive, async (req, res) => {
  if (String(req.decoded.id) !== req.params.cid) return res.json({ success: false, message: 'Không có quyền xem đơn hàng này' });
  res.json(await Order.find({ customer: req.params.cid }).sort({ cdate: -1 }));
});

// khách tự hủy đơn của mình khi đơn còn chờ duyệt, hàng được trả về kho
router.put('/orders/cancel/:id', JwtUtil.checkCustomer, requireActive, async (req, res) => {
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Đơn hàng không tồn tại' });
  const order = await Order.findOneAndUpdate({ _id: req.params.id, customer: req.decoded.id, status: 'PENDING' }, { status: 'CANCELED' }, { new: true });
  if (!order) return res.json({ success: false, message: 'Chỉ hủy được đơn đang chờ duyệt của bạn' });
  await Product.bulkWrite(order.items.map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.quantity } } } })));
  res.json({ success: true, order });
});

module.exports = router;
