const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const PasswordUtil = require('../utils/PasswordUtil');
const MailUtil = require('../utils/MailUtil');
const { Admin, Category, Product, Customer, Order, Banner } = require('../models/Models');

const PAGE_SIZE = 8;

// trả số lượng của đơn bị hủy về kho
async function restoreStock(order) {
  await Product.bulkWrite(order.items.map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.quantity } } } })));
}

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

const cleanName = (v) => (typeof v === 'string' ? v.trim() : '');
const bad = (res, message) => res.json({ success: false, message });

router.post('/categories', JwtUtil.checkAdmin, async (req, res) => {
  const name = cleanName(req.body.name);
  if (!name || name.length > 60) return bad(res, 'Tên danh mục phải từ 1 đến 60 ký tự');
  res.json(await Category.create({ name }));
});

router.put('/categories/:id', JwtUtil.checkAdmin, async (req, res) => {
  const name = cleanName(req.body.name);
  if (!name || name.length > 60) return bad(res, 'Tên danh mục phải từ 1 đến 60 ký tự');
  if (!isId(req.params.id)) return bad(res, 'Danh mục không tồn tại');
  res.json(await Category.findByIdAndUpdate(req.params.id, { name }, { new: true }));
});

// không cho xóa danh mục còn sản phẩm để tránh sản phẩm mồ côi
router.delete('/categories/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return bad(res, 'Danh mục không tồn tại');
  const used = await Product.countDocuments({ category: req.params.id });
  if (used > 0) return bad(res, `Danh mục còn ${used} sản phẩm, hãy chuyển hoặc xóa sản phẩm trước`);
  res.json(await Category.findByIdAndDelete(req.params.id));
});

// ---- products ----
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/products', JwtUtil.checkAdmin, async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const q = cleanName(req.query.q);
  const filter = q ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { brand: new RegExp(escapeRegex(q), 'i') }] } : {};
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ cdate: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('category');
  res.json({ products, noPages: Math.ceil(total / PAGE_SIZE), curPage: page });
});

// kiểm tra và làm sạch dữ liệu sản phẩm, trả về { error } hoặc { data }
async function readProduct(body) {
  const name = cleanName(body.name);
  if (!name || name.length > 120) return { error: 'Tên sản phẩm phải từ 1 đến 120 ký tự' };
  const price = Number(body.price);
  if (body.price === '' || body.price === null || !Number.isFinite(price) || price < 0 || price > 10000000) return { error: 'Giá phải là số từ 0 đến 10.000.000' };
  const stock = body.stock === undefined || body.stock === '' ? 0 : Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { error: 'Tồn kho phải là số nguyên từ 0 đến 100.000' };
  if (!isId(body.category) || !(await Category.exists({ _id: body.category }))) return { error: 'Vui lòng chọn danh mục hợp lệ' };
  const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const image = typeof body.image === 'string' ? body.image : '';
  if (image.length > 2500000) return { error: 'Ảnh quá lớn, vui lòng chọn ảnh dưới 1,5 MB' };
  return {
    data: {
      name, price, stock, category: body.category, image,
      brand: text(body.brand, 60), frameType: text(body.frameType, 60), material: text(body.material, 60),
      description: text(body.description, 2000),
    },
  };
}

router.post('/products', JwtUtil.checkAdmin, async (req, res) => {
  const { error, data } = await readProduct(req.body);
  if (error) return bad(res, error);
  res.json(await Product.create({ ...data, cdate: Date.now() }));
});

router.put('/products/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return bad(res, 'Sản phẩm không tồn tại');
  const { error, data } = await readProduct(req.body);
  if (error) return bad(res, error);
  const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json(product || { success: false, message: 'Sản phẩm không tồn tại' });
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
  if (status === 'CANCELED') await restoreStock(order); // hủy đơn thì trả hàng về kho
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

// ---- banner ----
function readBanner(body) {
  const t = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const title = t(body.title, 80);
  if (!title) return { error: 'Vui lòng nhập tiêu đề banner' };
  const link = t(body.link, 200);
  if (link && !/^(\/(?!\/)|https?:\/\/)/.test(link)) return { error: 'Liên kết phải bắt đầu bằng / hoặc http' };
  const image = typeof body.image === 'string' ? body.image : '';
  if (!image) return { error: 'Vui lòng chọn ảnh banner' };
  if (image.length > 4000000) return { error: 'Ảnh banner quá lớn, vui lòng chọn ảnh dưới 2,5 MB' };
  const sortOrder = Number(body.sortOrder);
  return {
    data: {
      title, subtitle: t(body.subtitle, 160), cta: t(body.cta, 30), link, image,
      active: body.active !== false, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  };
}

router.get('/banners', JwtUtil.checkAdmin, async (req, res) => {
  res.json(await Banner.find({}).sort({ sortOrder: 1 }));
});

router.post('/banners', JwtUtil.checkAdmin, async (req, res) => {
  const { error, data } = readBanner(req.body);
  if (error) return res.json({ success: false, message: error });
  res.json(await Banner.create(data));
});

router.put('/banners/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Banner không tồn tại' });
  const { error, data } = readBanner(req.body);
  if (error) return res.json({ success: false, message: error });
  res.json((await Banner.findByIdAndUpdate(req.params.id, data, { new: true })) || { success: false, message: 'Banner không tồn tại' });
});

// bật hoặc tắt hiển thị nhanh, không phải gửi lại ảnh
router.put('/banners/active/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Banner không tồn tại' });
  const banner = await Banner.findByIdAndUpdate(req.params.id, { active: req.body.active === true }, { new: true, select: '-image' });
  res.json(banner ? { success: true, banner } : { success: false, message: 'Banner không tồn tại' });
});

router.delete('/banners/:id', JwtUtil.checkAdmin, async (req, res) => {
  if (!isId(req.params.id)) return res.json({ success: false, message: 'Banner không tồn tại' });
  res.json((await Banner.findByIdAndDelete(req.params.id)) || { success: false, message: 'Banner không tồn tại' });
});

// ---- thống kê cho trang tổng quan ----
router.get('/stats', JwtUtil.checkAdmin, async (req, res) => {
  const [revenueAgg, byStatus, customers, products, lowStock, recent] = await Promise.all([
    Order.aggregate([{ $match: { status: 'APPROVED' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Customer.countDocuments({}),
    Product.countDocuments({}),
    Product.find({ stock: { $lte: 5 } }, 'name brand stock').sort({ stock: 1 }).limit(6),
    Order.find({}).sort({ cdate: -1 }).limit(5).populate('customer', 'name username'),
  ]);
  const orders = { PENDING: 0, APPROVED: 0, CANCELED: 0 };
  byStatus.forEach((b) => { orders[b._id] = b.n; });
  res.json({ revenue: revenueAgg[0] ? revenueAgg[0].total : 0, orders, customers, products, lowStock, recent });
});

module.exports = router;
