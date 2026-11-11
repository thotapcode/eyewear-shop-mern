const nodemailer = require('nodemailer');
const MyConstants = require('./MyConstants');

const MailUtil = {
  // gửi mail kích hoạt; chưa cấu hình email thì in liên kết ra console của server
  async sendActivation(customer) {
    const link = `${MyConstants.CLIENT_URL}/active?id=${customer._id}&token=${customer.token}`;
    if (!MyConstants.EMAIL_USER || !MyConstants.EMAIL_PASS) {
      console.log(`[Chưa cấu hình email] Liên kết kích hoạt cho ${customer.username}: ${link}`);
      return false;
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: MyConstants.EMAIL_USER, pass: MyConstants.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: MyConstants.EMAIL_USER,
      to: customer.email,
      subject: 'Kích hoạt tài khoản Eyewear Shop',
      html: `<p>Xin chào ${customer.name},</p><p>Nhấn vào liên kết sau để kích hoạt tài khoản: <a href="${link}">${link}</a></p>`,
    });
    return true;
  },
};

module.exports = MailUtil;
