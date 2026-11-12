// giới hạn số lần gọi theo địa chỉ IP trong một khoảng thời gian, lưu trong bộ nhớ của tiến trình.
// Dùng cho đăng nhập và đăng ký để chặn dò mật khẩu hàng loạt. Chạy nhiều tiến trình thì cần kho dùng chung như Redis.
function rateLimit({ windowMs, max, message }) {
  const hits = new Map(); // key -> { count, resetAt }

  // dọn các mục đã hết hạn để Map không phình mãi
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip + '|' + req.path;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, message: message || 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút' });
    }
    next();
  };
}

module.exports = rateLimit;
