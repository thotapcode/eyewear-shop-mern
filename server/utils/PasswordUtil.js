const crypto = require('crypto');

// băm mật khẩu bằng scrypt có sẵn trong Node, định dạng "salt:hash"
const PasswordUtil = {
  hash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
  },
  verify(password, stored) {
    const [salt, hash] = String(stored).split(':');
    if (!salt || !hash) return false;
    const test = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
  },
};

module.exports = PasswordUtil;
