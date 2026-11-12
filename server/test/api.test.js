// Kiểm thử tự động cho API, dùng bộ chạy test có sẵn của Node (không cần cài thêm thư viện).
//
//   1. Chạy máy chủ ở một cửa sổ khác:   npm run dev
//   2. Chạy kiểm thử:                    npm test
//
// Bài test gọi API thật nên dùng chính cơ sở dữ liệu trong .env. Mọi dữ liệu tạo ra đều có tiền tố "AUTOTEST"
// và được xóa sạch khi test kết thúc, kể cả khi có test thất bại. Đổi địa chỉ máy chủ bằng biến TEST_API.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mongoose = require('mongoose');

const API = process.env.TEST_API || 'http://localhost:3000';
const ADMIN = `${API}/api/admin`;
const CUSTOMER = `${API}/api/customer`;
const SHIP = { name: 'Nguyễn Văn A', phone: '0901234567', address: '12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', note: 'Giao giờ hành chính' };
const PASSWORD = 'AutoTest123';

async function call(base, method, url, body, token) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'x-access-token': token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
const admin = (m, u, b, t) => call(ADMIN, m, u, b, t);
const customer = (m, u, b, t) => call(CUSTOMER, m, u, b, t);

const state = {};

before(async () => {
  assert.ok(process.env.MONGODB_URI, 'Thiếu MONGODB_URI trong server/.env');
  assert.ok(process.env.ADMIN_PASSWORD, 'Thiếu ADMIN_PASSWORD trong server/.env');
  await mongoose.connect(process.env.MONGODB_URI);
  state.db = mongoose.connection;
  const login = await admin('POST', '/login', { username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD });
  assert.equal(login.body.success, true, 'Không đăng nhập được admin, kiểm tra máy chủ đang chạy và ADMIN_PASSWORD');
  state.adminToken = login.body.token;

  state.category = (await admin('POST', '/categories', { name: 'AUTOTEST danh mục' }, state.adminToken)).body;
  state.product = (await admin('POST', '/products', { name: 'AUTOTEST gọng', price: 1000000, stock: 3, category: state.category._id, brand: 'Test', description: 'Mô tả' }, state.adminToken)).body;

  // tạo hai khách đã kích hoạt
  state.customers = {};
  for (const u of ['autotest_a', 'autotest_b']) {
    await state.db.collection('customers').deleteMany({ username: u });
    await customer('POST', '/signup', { username: u, password: PASSWORD, name: `Khách ${u}`, email: `${u}@example.com` });
    const doc = await state.db.collection('customers').findOne({ username: u });
    await customer('POST', '/active', { id: String(doc._id), token: doc.token });
    const l = await customer('POST', '/login', { username: u, password: PASSWORD });
    state.customers[u] = { id: l.body.customer._id, token: l.body.token };
  }
});

after(async () => {
  const db = state.db;
  if (db) {
    const ids = Object.values(state.customers || {}).map((c) => new mongoose.Types.ObjectId(c.id));
    await db.collection('orders').deleteMany({ customer: { $in: ids } });
    await db.collection('customers').deleteMany({ username: /^autotest_/ });
    await db.collection('products').deleteMany({ name: /^AUTOTEST/ });
    await db.collection('categories').deleteMany({ name: /^AUTOTEST/ });
    await db.collection('banners').deleteMany({ title: /^AUTOTEST/ });
  }
  await mongoose.disconnect();
});

const stock = async () => (await customer('GET', `/products/${state.product._id}`)).body.stock;
const buy = (who, quantity, shipping = SHIP) => customer('POST', '/checkout', { items: [{ product: state.product._id, quantity }], shipping }, state.customers[who].token);

describe('Xác thực và phân quyền', () => {
  it('admin gọi API không có token bị chặn', async () => {
    assert.equal((await admin('GET', '/categories')).body.success, false);
  });
  it('đăng nhập sai mật khẩu bị từ chối', async () => {
    assert.equal((await admin('POST', '/login', { username: 'admin', password: 'sai-mat-khau' })).body.success, false);
  });
  it('đăng nhập không chấp nhận đối tượng thay cho chuỗi (NoSQL injection)', async () => {
    assert.equal((await customer('POST', '/login', { username: { $ne: '' }, password: { $ne: '' } })).body.success, false);
    assert.equal((await admin('POST', '/login', { username: { $ne: '' }, password: { $ne: '' } })).body.success, false);
  });
  it('token của khách không dùng được cho API admin và ngược lại', async () => {
    const a = await admin('GET', '/orders', undefined, state.customers.autotest_a.token);
    assert.equal(Array.isArray(a.body), false);
    assert.equal((await customer('GET', '/token', undefined, state.adminToken)).body.success, false);
  });
  it('đường dẫn API không tồn tại trả JSON 404', async () => {
    const r = await call(API, 'GET', '/api/khong-co');
    assert.equal(r.status, 404);
    assert.equal(r.body.success, false);
  });
});

describe('Đăng ký khách hàng', () => {
  it('thiếu thông tin hoặc sai định dạng bị từ chối', async () => {
    const base = { username: 'autotest_x', password: PASSWORD, name: 'X', email: 'x@example.com' };
    for (const bad of [{ username: 'a' }, { username: 'có dấu' }, { password: '123' }, { email: 'khong-phai-email' }, { name: '' }, { phone: '12' }]) {
      assert.equal((await customer('POST', '/signup', { ...base, ...bad })).body.success, false, JSON.stringify(bad));
    }
    assert.equal(await state.db.collection('customers').countDocuments({ username: 'autotest_x' }), 0);
  });
  it('tên đăng nhập trùng bị từ chối', async () => {
    assert.equal((await customer('POST', '/signup', { username: 'autotest_a', password: PASSWORD, name: 'A', email: 'a@example.com' })).body.success, false);
  });
  it('chưa kích hoạt thì không đăng nhập được, kích hoạt sai mã bị từ chối', async () => {
    await customer('POST', '/signup', { username: 'autotest_c', password: PASSWORD, name: 'C', email: 'c@example.com' });
    try {
      assert.equal((await customer('POST', '/login', { username: 'autotest_c', password: PASSWORD })).body.success, false);
      const doc = await state.db.collection('customers').findOne({ username: 'autotest_c' });
      assert.equal((await customer('POST', '/active', { id: String(doc._id), token: 'sai' })).body.success, false);
    } finally {
      await state.db.collection('customers').deleteMany({ username: 'autotest_c' });
    }
  });
});

describe('Quản lý sản phẩm và danh mục (admin)', () => {
  const base = () => ({ name: 'AUTOTEST sp', price: 500000, stock: 5, category: state.category._id });
  it('tên rỗng, giá âm, giá chữ, tồn kho lẻ, danh mục sai đều bị từ chối', async () => {
    for (const bad of [{ name: ' ' }, { price: -1 }, { price: 'abc' }, { stock: 1.5 }, { category: '64a000000000000000000000' }]) {
      assert.equal((await admin('POST', '/products', { ...base(), ...bad }, state.adminToken)).body.success, false, JSON.stringify(bad));
    }
  });
  it('tìm kiếm theo tên và không lỗi với ký tự đặc biệt', async () => {
    const found = await admin('GET', '/products?q=AUTOTEST', undefined, state.adminToken);
    assert.ok(found.body.products.some((p) => p._id === state.product._id));
    assert.ok(Array.isArray((await admin('GET', `/products?q=${encodeURIComponent('(.*')}`, undefined, state.adminToken)).body.products));
  });
  it('không xóa được danh mục còn sản phẩm', async () => {
    assert.equal((await admin('DELETE', `/categories/${state.category._id}`, undefined, state.adminToken)).body.success, false);
  });
  it('số liệu tổng quan có đủ trường', async () => {
    const s = (await admin('GET', '/stats', undefined, state.adminToken)).body;
    assert.equal(typeof s.revenue, 'number');
    assert.ok(s.orders && Array.isArray(s.lowStock) && Array.isArray(s.recent));
  });
});

describe('Đặt hàng, tồn kho và hủy đơn', () => {
  it('thiếu giỏ hoặc thông tin giao hàng, số lượng không hợp lệ bị từ chối', async () => {
    const t = state.customers.autotest_a.token;
    assert.equal((await customer('POST', '/checkout', { items: [] }, t)).body.success, false);
    assert.equal((await customer('POST', '/checkout', { items: [{ product: state.product._id, quantity: 1 }] }, t)).body.success, false);
    for (const q of [0, 1.5, 999, -2]) assert.equal((await buy('autotest_a', q)).body.success, false, `số lượng ${q}`);
    assert.equal((await buy('autotest_a', 1, { ...SHIP, phone: '12' })).body.success, false);
    assert.equal((await buy('autotest_a', 1, { ...SHIP, address: 'abc' })).body.success, false);
    assert.equal(await stock(), 3, 'các lần bị từ chối không được trừ kho');
  });
  it('đặt vượt tồn kho bị từ chối', async () => {
    assert.equal((await buy('autotest_a', 5)).body.success, false);
    assert.equal(await stock(), 3);
  });
  it('đặt hợp lệ: tính tiền từ cơ sở dữ liệu, lưu giao hàng, trừ kho', async () => {
    const r = await customer('POST', '/checkout', { items: [{ product: state.product._id, quantity: 2, price: 1 }], shipping: SHIP, total: 1 }, state.customers.autotest_a.token);
    assert.equal(r.body.success, true);
    assert.equal(r.body.order.total, 2000000, 'không tin giá do client gửi');
    assert.equal(r.body.order.status, 'PENDING');
    assert.equal(r.body.order.shipping.address, SHIP.address);
    assert.equal(await stock(), 1);
    state.order = r.body.order;
  });
  it('khách khác không đặt vượt phần còn lại, không xem và không hủy được đơn của người khác', async () => {
    assert.equal((await buy('autotest_b', 2)).body.success, false);
    assert.equal((await customer('GET', `/orders/customer/${state.customers.autotest_a.id}`, undefined, state.customers.autotest_b.token)).body.success, false);
    assert.equal((await customer('PUT', `/orders/cancel/${state.order._id}`, undefined, state.customers.autotest_b.token)).body.success, false);
  });
  it('khách hủy đơn của mình thì hàng về kho, hủy lần hai bị từ chối', async () => {
    assert.equal((await customer('PUT', `/orders/cancel/${state.order._id}`, undefined, state.customers.autotest_a.token)).body.success, true);
    assert.equal(await stock(), 3);
    assert.equal((await customer('PUT', `/orders/cancel/${state.order._id}`, undefined, state.customers.autotest_a.token)).body.success, false);
    assert.equal(await stock(), 3, 'hủy lần hai không được cộng kho thêm');
  });
  it('admin duyệt đơn thì không đổi lại được, hủy đơn thì hàng về kho', async () => {
    const o1 = (await buy('autotest_a', 1)).body.order;
    assert.equal((await admin('PUT', `/orders/status/${o1._id}`, { status: 'APPROVED' }, state.adminToken)).body.success, true);
    assert.equal((await admin('PUT', `/orders/status/${o1._id}`, { status: 'CANCELED' }, state.adminToken)).body.success, false);
    assert.equal((await customer('PUT', `/orders/cancel/${o1._id}`, undefined, state.customers.autotest_a.token)).body.success, false);
    assert.equal(await stock(), 2);
    const o2 = (await buy('autotest_a', 2)).body.order;
    assert.equal(await stock(), 0);
    assert.equal((await buy('autotest_b', 1)).body.success, false, 'hết hàng không đặt được');
    assert.equal((await admin('PUT', `/orders/status/${o2._id}`, { status: 'CANCELED' }, state.adminToken)).body.success, true);
    assert.equal(await stock(), 2);
  });
  it('trạng thái đơn không hợp lệ bị từ chối', async () => {
    const o = (await buy('autotest_a', 1)).body.order;
    assert.equal((await admin('PUT', `/orders/status/${o._id}`, { status: 'XYZ' }, state.adminToken)).body.success, false);
  });
});

describe('Quản lý khách hàng (admin)', () => {
  it('danh sách khách không lộ mật khẩu hay mã kích hoạt', async () => {
    const list = (await admin('GET', '/customers', undefined, state.adminToken)).body;
    assert.ok(list.length > 0);
    assert.ok(list.every((c) => !('password' in c) && !('token' in c)));
  });
  it('khóa tài khoản: không đăng nhập, không đặt hàng với token cũ, liên kết kích hoạt cũ không mở lại', async () => {
    const id = state.customers.autotest_b.id;
    assert.equal((await admin('PUT', `/customers/deactive/${id}`, undefined, state.adminToken)).body.customer.active, 2);
    assert.equal((await customer('POST', '/login', { username: 'autotest_b', password: PASSWORD })).body.success, false);
    assert.equal((await buy('autotest_b', 1)).body.success, false);
    const doc = await state.db.collection('customers').findOne({ username: 'autotest_b' });
    assert.equal((await customer('POST', '/active', { id: String(doc._id), token: doc.token })).body.success, false);
    assert.equal((await admin('PUT', `/customers/reactive/${id}`, undefined, state.adminToken)).body.customer.active, 1);
  });
});

describe('Hồ sơ khách hàng', () => {
  it('cập nhật hồ sơ có địa chỉ, từ chối email sai và mật khẩu mới quá ngắn', async () => {
    const { id, token } = state.customers.autotest_a;
    const ok = await customer('PUT', `/customers/${id}`, { name: 'Tên Mới', phone: '0911222333', email: 'moi@example.com', address: '99 Lê Lợi' }, token);
    assert.equal(ok.body.customer.address, '99 Lê Lợi');
    assert.equal((await customer('PUT', `/customers/${id}`, { name: 'X', email: 'abc' }, token)).body.success, false);
    assert.equal((await customer('PUT', `/customers/${id}`, { name: 'X', email: 'x@example.com', password: '123' }, token)).body.success, false);
  });
  it('không sửa được hồ sơ của người khác', async () => {
    const r = await customer('PUT', `/customers/${state.customers.autotest_b.id}`, { name: 'X', email: 'x@example.com' }, state.customers.autotest_a.token);
    assert.equal(r.body.success, false);
  });
});

describe('Banner', () => {
  const banner = { title: 'AUTOTEST banner', subtitle: 'Phụ đề', cta: 'Xem', link: '/product/category/x', image: 'abc', sortOrder: 1, active: true };
  it('dữ liệu sai bị từ chối: thiếu tiêu đề, thiếu ảnh, liên kết nguy hiểm', async () => {
    for (const bad of [{ title: ' ' }, { image: '' }, { link: 'javascript:alert(1)' }, { link: '//evil.com' }]) {
      assert.equal((await admin('POST', '/banners', { ...banner, ...bad }, state.adminToken)).body.success, false, JSON.stringify(bad));
    }
  });
  it('khách chỉ thấy banner đang bật; sửa và xóa hoạt động', async () => {
    const created = (await admin('POST', '/banners', banner, state.adminToken)).body;
    assert.ok(created._id);
    assert.ok((await customer('GET', '/banners')).body.some((b) => b._id === created._id));
    assert.equal((await admin('PUT', `/banners/active/${created._id}`, { active: false }, state.adminToken)).body.banner.active, false);
    assert.ok(!(await customer('GET', '/banners')).body.some((b) => b._id === created._id));
    assert.equal((await admin('PUT', `/banners/${created._id}`, { ...banner, title: 'AUTOTEST mới' }, state.adminToken)).body.title, 'AUTOTEST mới');
    assert.ok((await admin('DELETE', `/banners/${created._id}`, undefined, state.adminToken)).body._id);
  });
});

describe('Sản phẩm cho khách', () => {
  it('tìm kiếm, chi tiết, danh mục; id sai không làm sập máy chủ', async () => {
    assert.ok((await customer('GET', '/products/search/AUTOTEST')).body.some((p) => p._id === state.product._id));
    assert.ok(Array.isArray((await customer('GET', `/products/search/${encodeURIComponent('(.*')}`)).body));
    assert.equal((await customer('GET', `/products/${state.product._id}`)).body.name, 'AUTOTEST gọng');
    assert.equal((await customer('GET', '/products/abc')).body, null);
    assert.deepEqual((await customer('GET', '/products/category/abc')).body, []);
    assert.ok((await customer('GET', `/products/category/${state.category._id}`)).body.length >= 1);
  });
});
