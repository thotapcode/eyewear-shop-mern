<div align="center">

# Eyewear Shop

Website bán kính mắt full-stack xây dựng bằng MERN, gồm trang bán hàng cho khách và trang quản trị riêng.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Tests](https://img.shields.io/badge/tests-26%20passing-brightgreen)

</div>

Đồ án môn Lập trình web nâng cao (71ITSE41403), Trường Đại học Văn Lang. Dữ liệu mẫu gồm 30 sản phẩm của các thương hiệu thật, dùng ảnh có giấy phép mở, giá bằng VND.

## Tính năng

**Khách hàng**

- Trang chủ có banner tự chuyển, danh mục, sản phẩm mới và bán chạy
- Tìm kiếm, lọc theo thương hiệu, sắp xếp theo giá
- Chi tiết sản phẩm kèm mô tả và tồn kho theo thời gian thực
- Đăng ký, kích hoạt tài khoản qua email, đăng nhập, sửa hồ sơ và địa chỉ
- Giỏ hàng lưu trên trình duyệt, đặt hàng thanh toán khi nhận hàng
- Xem lịch sử đơn, tự hủy đơn đang chờ (hàng được hoàn lại kho)
- Giao diện đen trắng phong cách thời trang, tự chuyển sáng tối theo hệ thống, dùng tốt trên điện thoại

**Quản trị**

- Tổng quan doanh thu, số đơn theo trạng thái, sản phẩm sắp hết hàng
- Quản lý danh mục, sản phẩm (ảnh, giá, tồn kho, mô tả), banner trang chủ
- Duyệt hoặc hủy đơn, xem địa chỉ giao hàng
- Xem, khóa, mở khóa khách hàng và gửi lại email kích hoạt

## Công nghệ

| Lớp | Sử dụng |
|---|---|
| Giao diện | React 19, React Router 7, Axios, Motion, Phosphor Icons |
| Máy chủ | Node.js, Express 5, Mongoose 9 |
| Cơ sở dữ liệu | MongoDB Atlas |
| Xác thực | JWT theo vai trò admin và khách, mật khẩu băm scrypt |
| Bảo mật | helmet, giới hạn tần suất đăng nhập, kiểm tra dữ liệu vào, chống NoSQL injection |
| Email | Nodemailer (không cấu hình thì in liên kết kích hoạt ra console) |

## Cấu trúc

```
eyewear-shop-mern
├── server            API Express, models, seed, test        (cổng 3000)
├── client-admin      Trang quản trị, chạy ở /admin          (cổng 3001)
├── client-customer   Trang khách hàng                       (cổng 3002)
└── docs              Tài liệu bàn giao, nguồn ảnh mẫu
```

## Bắt đầu nhanh

Yêu cầu Node.js 20 trở lên và một database MongoDB Atlas (gói miễn phí là đủ).

```bash
git clone https://github.com/thotapcode/eyewear-shop-mern.git
cd eyewear-shop-mern

cd server && npm install && cd ..
cd client-admin && npm install && cd ..
cd client-customer && npm install && cd ..
```

Tạo `server/.env` từ `server/.env.example`:

| Biến | Ý nghĩa |
|---|---|
| `MONGODB_URI` | Chuỗi kết nối Atlas (cần thêm IP máy vào Network Access) |
| `JWT_SECRET` | Chuỗi ngẫu nhiên dài để ký token |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Tài khoản admin, được tạo ở lần chạy đầu khi chưa có admin |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail và App Password để gửi email kích hoạt (có thể để trống) |
| `CLIENT_URL` | Địa chỉ công khai của trang khách, dùng cho liên kết kích hoạt |

Chạy ba tiến trình ở ba cửa sổ:

```bash
cd server && npm run dev
cd client-admin && npm start
cd client-customer && npm start
```

- Trang khách: http://localhost:3002
- Trang quản trị: http://localhost:3001/admin

## Dữ liệu mẫu

```bash
cd server
npm run seed          # nạp danh mục, 30 sản phẩm, 3 banner, khách và đơn hàng mẫu
npm run seed:reset    # xóa dữ liệu mẫu rồi nạp lại
npm run seed:clean    # chỉ xóa dữ liệu mẫu
```

Dữ liệu mẫu được đánh dấu riêng nên không ảnh hưởng dữ liệu thật. Khách mẫu có mật khẩu `Demo12345`, ví dụ `minhanh`, `quocbao`, `hongnhung`. Tài khoản `vankhoa` chưa kích hoạt và `maiphuong` đang bị khóa để thử các trạng thái này. Nguồn và giấy phép từng ảnh nằm ở [docs/ANH_NGUON.md](docs/ANH_NGUON.md).

## Kiểm thử

Bật server rồi chạy:

```bash
cd server && npm test
```

26 ca kiểm thử gọi API thật: phân quyền, chống NoSQL injection, kiểm tra dữ liệu vào, đặt hàng, trừ và hoàn kho, hủy đơn, khóa tài khoản, banner. Dữ liệu test có tiền tố `AUTOTEST` và được dọn sạch sau khi chạy.

## Triển khai

Server phục vụ luôn hai bản build nên chỉ cần một dịch vụ Node (ví dụ Render):

```bash
cd server
npm run build:clients
npm run start:prod
```

Đặt biến môi trường trên hosting: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENT_URL`, `NODE_ENV=production`. Thiếu `JWT_SECRET` hoặc `ADMIN_PASSWORD` thì server từ chối khởi động. Trang khách ở `/`, trang quản trị ở `/admin`, API ở `/api`. Trên Atlas cần mở Network Access cho hosting.

## API

| Nhóm | Đường dẫn | Ví dụ |
|---|---|---|
| Admin | `/api/admin/*` | `login`, `categories`, `products`, `banners`, `orders`, `customers`, `stats` |
| Khách | `/api/customer/*` | `signup`, `active`, `login`, `products/*`, `checkout`, `orders/customer/:id` |

Mô tả đầy đủ từng endpoint nằm trong [docs/HuongDan_BanGiao.pdf](docs/HuongDan_BanGiao.pdf).

## Tài liệu

- [Hướng dẫn và bàn giao](docs/HuongDan_BanGiao.pdf): cài đặt, luồng thao tác, API, tiến độ
- [Nguồn ảnh](docs/ANH_NGUON.md): tác giả và giấy phép ảnh sản phẩm

## Tác giả

Phan Nguyễn Ngọc Thọ, Khoa Công nghệ thông tin, Trường Đại học Văn Lang. Giảng viên hướng dẫn: ThS. Đặng Đình Hòa.
