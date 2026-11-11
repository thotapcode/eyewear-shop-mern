const jwt = require('jsonwebtoken');
const MyConstants = require('./MyConstants');

const JwtUtil = {
  genToken(payload) {
    return jwt.sign(payload, MyConstants.JWT_SECRET, { expiresIn: MyConstants.JWT_EXPIRES });
  },
  // middleware: yêu cầu header x-access-token hợp lệ
  checkToken(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) return res.json({ success: false, message: 'Auth token is not provided.' });
    jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
      if (err) return res.json({ success: false, message: 'Auth token is not valid.' });
      req.decoded = decoded;
      next();
    });
  },
};

module.exports = JwtUtil;
