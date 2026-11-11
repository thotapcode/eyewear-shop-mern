const jwt = require('jsonwebtoken');
const MyConstants = require('./MyConstants');

// middleware: yêu cầu header x-access-token hợp lệ và đúng vai trò (admin hoặc customer)
function checkRole(role) {
  return (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.json({ success: false, message: 'Auth token is not provided.' });
    jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
      if (err || decoded.role !== role) {
        return res.json({ success: false, message: 'Auth token is not valid.' });
      }
      req.decoded = decoded;
      next();
    });
  };
}

const JwtUtil = {
  genToken(payload) {
    return jwt.sign(payload, MyConstants.JWT_SECRET, { expiresIn: MyConstants.JWT_EXPIRES });
  },
  checkAdmin: checkRole('admin'),
  checkCustomer: checkRole('customer'),
};

module.exports = JwtUtil;
