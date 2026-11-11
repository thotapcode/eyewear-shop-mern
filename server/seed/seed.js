// Nạp dữ liệu mẫu để trình diễn: danh mục, sản phẩm, khách hàng, đơn hàng và banner.
//
//   npm run seed         nạp dữ liệu mẫu (bỏ qua nếu đã nạp)
//   npm run seed:reset   xóa dữ liệu mẫu cũ rồi nạp lại từ đầu
//   npm run seed:clean   chỉ xóa dữ liệu mẫu
//
// Mọi bản ghi do file này tạo đều gắn demo: true, nên chỉ xóa đúng những bản ghi đó,
// dữ liệu thật bạn nhập tay (kể cả danh mục trùng tên) không bị đụng tới.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const PasswordUtil = require('../utils/PasswordUtil');
const data = require('./data.json');

const DEMO_PASSWORD = 'Demo12345';
const DAY = 24 * 60 * 60 * 1000;

// bộ sinh số ngẫu nhiên có hạt giống cố định, để mỗi lần nạp ra cùng một dữ liệu
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUSTOMERS = [
  ['minhanh', 'Nguyễn Minh Anh', '0901234501', '25 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 1],
  ['quocbao', 'Trần Quốc Bảo', '0912345602', '118 Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh', 1],
  ['hongnhung', 'Lê Thị Hồng Nhung', '0933456703', '42 Phan Xích Long, Phường 7, Quận Phú Nhuận, TP. Hồ Chí Minh', 1],
  ['duchuy', 'Phạm Đức Huy', '0944567804', '9 Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa', 1],
  ['ngoclan', 'Võ Ngọc Lan', '0905678905', '77 Hai Bà Trưng, Phường Tân Định, Quận 1, TP. Hồ Chí Minh', 1],
  ['thanhtung', 'Đặng Thanh Tùng', '0916789006', '15 Điện Biên Phủ, Phường Điện Biên, Quận Ba Đình, Hà Nội', 1],
  ['khanhlinh', 'Bùi Khánh Linh', '0937890107', '63 Lý Thường Kiệt, Phường 7, Quận Tân Bình, TP. Hồ Chí Minh', 1],
  ['giahan', 'Hoàng Gia Hân', '0948901208', '210 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng', 1],
  ['vankhoa', 'Đỗ Văn Khoa', '0909012309', '5 Võ Văn Tần, Phường 6, Quận 3, TP. Hồ Chí Minh', 0], // chưa kích hoạt
  ['maiphuong', 'Ngô Mai Phương', '0910123410', '88 Cách Mạng Tháng Tám, Phường 10, Quận 3, TP. Hồ Chí Minh', 2], // bị khóa
];

const NOTES = ['', '', 'Giao giờ hành chính', 'Gọi trước khi giao 15 phút', '', 'Để hàng ở bảo vệ nếu vắng nhà', '', ''];

async function clean(db) {
  const cols = ['orders', 'banners', 'customers', 'products', 'categories'];
  for (const c of cols) {
    const r = await db.collection(c).deleteMany({ demo: true });
    console.log(`  xóa ${r.deletedCount} bản ghi mẫu trong ${c}`);
  }
}

async function seed(db) {
  const rand = rng(20261112);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  // danh mục: dùng lại danh mục cùng tên nếu đã có, không tạo trùng
  const catId = {};
  for (const name of data.categories) {
    const found = await db.collection('categories').findOne({ name });
    catId[name] = found ? found._id : (await db.collection('categories').insertOne({ name, demo: true })).insertedId;
  }

  // sản phẩm: ngày tạo rải đều 40 ngày gần đây để mục "sản phẩm mới" có thứ tự
  // sản phẩm đầu danh sách là mới nhất, phụ kiện được coi là hàng cũ hơn để mục "sản phẩm mới" hiện kính
  const now = Date.now();
  let accRank = 0;
  const list = data.products.map((p, i) => {
    const isAcc = p.category === 'Phụ kiện';
    const ageDays = isAcc ? 45 + accRank++ * 2 : (i + 1) * 1.3;
    return { ...p, category: catId[p.category], cdate: Math.round(now - ageDays * DAY), demo: true };
  });

  // khách hàng
  const hash = PasswordUtil.hash(DEMO_PASSWORD);
  const customers = CUSTOMERS.map(([username, name, phone, address, active], i) => ({
    username, password: hash, name, phone, email: `${username}@example.com`, address, active,
    token: active === 0 ? `demo-token-${username}` : `used-${i}`, demo: true,
  }));
  const cRes = await db.collection('customers').insertMany(customers);
  const buyers = customers.map((c, i) => ({ ...c, _id: cRes.insertedIds[i] })).filter((c) => c.active === 1);

  // đơn hàng: một số sản phẩm bán chạy hơn hẳn để mục "bán chạy" có ý nghĩa
  const weights = list.map((p, i) => (['Ray-Ban Original Wayfarer RB2140', 'Ray-Ban Aviator Shooter RB3139', 'Ray-Ban Clubmaster RB3016 Tròng gương', 'Kính lọc ánh sáng xanh gọng đen', 'Hộp kính màu đen'].includes(p.name) ? 6 : 1 + (i % 3)));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const pickProduct = () => {
    let r = rand() * totalW;
    for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return i; }
    return 0;
  };

  const plan = [...Array(5).fill('PENDING'), ...Array(11).fill('APPROVED'), ...Array(3).fill('CANCELED')];
  const sold = {}; // số lượng đang giữ chỗ (đơn chờ và đơn đã duyệt) theo chỉ số sản phẩm
  const orders = [];
  plan.forEach((status, n) => {
    const buyer = pick(buyers);
    const lines = new Map();
    const lineCount = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < lineCount; k++) {
      const idx = pickProduct();
      const isAcc = list[idx].category === catId['Phụ kiện'];
      lines.set(idx, Math.min(3, (lines.get(idx) || 0) + 1 + (isAcc ? Math.floor(rand() * 2) : 0)));
    }
    const items = [...lines].map(([idx, quantity]) => ({ idx, name: list[idx].name, price: list[idx].price, quantity }));
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    // đơn chờ duyệt thuộc 3 ngày gần nhất, đơn còn lại rải trong 30 ngày
    const ageDays = status === 'PENDING' ? rand() * 3 : 3 + rand() * 27;
    orders.push({ buyer, items, total, status, cdate: Math.round(now - ageDays * DAY), note: pick(NOTES) });
    if (status !== 'CANCELED') items.forEach((i) => { sold[i.idx] = (sold[i.idx] || 0) + i.quantity; });
  });
  orders.sort((a, b) => a.cdate - b.cdate);

  // tồn kho đầu kỳ = tồn kho hiển thị + số đã bán, để sau khi tính đơn thì còn đúng số trong data.json
  list.forEach((p, i) => { p.stock = p.stock + (sold[i] || 0); });
  const pRes = await db.collection('products').insertMany(list);

  const orderDocs = orders.map((o) => ({
    cdate: o.cdate, total: o.total, status: o.status, payment: 'COD', customer: o.buyer._id,
    shipping: { name: o.buyer.name, phone: o.buyer.phone, address: o.buyer.address, note: o.note },
    items: o.items.map((i) => ({ product: pRes.insertedIds[i.idx], name: i.name, price: i.price, quantity: i.quantity })),
    demo: true,
  }));
  await db.collection('orders').insertMany(orderDocs);

  // banner
  const banners = data.banners.map((b) => ({
    title: b.title, subtitle: b.subtitle, cta: b.cta, link: `/product/category/${catId[b.linkCategory]}`,
    image: b.image, active: true, sortOrder: b.sortOrder, demo: true,
  }));
  await db.collection('banners').insertMany(banners);

  const by = (s) => orders.filter((o) => o.status === s).length;
  console.log('Đã nạp dữ liệu mẫu:');
  console.log(`  ${data.categories.length} danh mục, ${list.length} sản phẩm, ${customers.length} khách hàng, ${banners.length} banner`);
  console.log(`  ${orders.length} đơn hàng (${by('PENDING')} chờ duyệt, ${by('APPROVED')} đã duyệt, ${by('CANCELED')} đã hủy)`);
  console.log(`  Tài khoản khách mẫu: ${CUSTOMERS.slice(0, 3).map((c) => c[0]).join(', ')}... mật khẩu chung: ${DEMO_PASSWORD}`);
  console.log('  vankhoa chưa kích hoạt, maiphuong đang bị khóa, dùng để thử các trạng thái này ở trang admin.');
}

(async () => {
  if (!process.env.MONGODB_URI) { console.error('Thiếu MONGODB_URI trong server/.env'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const arg = process.argv[2];
  try {
    if (arg === '--clean') {
      await clean(db);
    } else {
      if (arg === '--reset') await clean(db);
      else if (await db.collection('products').countDocuments({ demo: true }) > 0) {
        console.log('Dữ liệu mẫu đã có sẵn. Dùng "npm run seed:reset" để xóa và nạp lại.');
        return;
      }
      await seed(db);
    }
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
