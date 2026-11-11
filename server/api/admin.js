const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const PasswordUtil = require('../utils/PasswordUtil');
const { Admin, Category, Product } = require('../models/Models');

const PAGE_SIZE = 4;

// ---- login & logout ----
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: 'Please input username and password' });
  const admin = await Admin.findOne({ username });
  if (!admin || !PasswordUtil.verify(password, admin.password)) {
    return res.json({ success: false, message: 'Incorrect username or password' });
  }
  const token = JwtUtil.genToken({ id: admin._id, username: admin.username });
  res.json({ success: true, message: 'Authentication successful', token });
});

router.get('/token', JwtUtil.checkToken, (req, res) => {
  const token = req.headers['x-access-token'];
  res.json({ success: true, message: 'Token is valid', token });
});

// ---- categories ----
router.get('/categories', JwtUtil.checkToken, async (req, res) => {
  res.json(await Category.find({}));
});

router.post('/categories', JwtUtil.checkToken, async (req, res) => {
  res.json(await Category.create({ name: req.body.name }));
});

router.put('/categories/:id', JwtUtil.checkToken, async (req, res) => {
  res.json(await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true }));
});

router.delete('/categories/:id', JwtUtil.checkToken, async (req, res) => {
  res.json(await Category.findByIdAndDelete(req.params.id));
});

// ---- products ----
router.get('/products', JwtUtil.checkToken, async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const total = await Product.countDocuments({});
  const products = await Product.find({})
    .sort({ cdate: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('category');
  res.json({ products, noPages: Math.ceil(total / PAGE_SIZE), curPage: page });
});

router.post('/products', JwtUtil.checkToken, async (req, res) => {
  const { name, price, category, image, brand, frameType, material } = req.body;
  const product = await Product.create({
    name, price, category, image, brand, frameType, material, cdate: Date.now(),
  });
  res.json(product);
});

router.put('/products/:id', JwtUtil.checkToken, async (req, res) => {
  const { name, price, category, image, brand, frameType, material } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { name, price, category, image, brand, frameType, material },
    { new: true }
  );
  res.json(product);
});

router.delete('/products/:id', JwtUtil.checkToken, async (req, res) => {
  res.json(await Product.findByIdAndDelete(req.params.id));
});

module.exports = router;
