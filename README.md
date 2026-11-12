# Eyewear Shop

Website bán kính mắt xây dựng bằng MERN (MongoDB, Express, React, Node.js) cho môn Lập trình web nâng cao. Gồm trang bán hàng cho khách và trang quản trị riêng, dùng chung một máy chủ API.

## Cấu trúc

| Thư mục | Nội dung | Cổng khi phát triển |
|---|---|---|
| `server` | API Express, Mongoose, JWT, dữ liệu mẫu, kiểm thử | 3000 |
| `client-admin` | Trang quản trị (React), chạy dưới đường dẫn `/admin` | 3001 |
| `client-customer` | Trang khách hàng (React) | 3002 |
| `docs` | Tài liệu kế hoạch, bàn giao và nguồn ảnh mẫu | |

## Chức năng

Khách hàng: xem banner, danh mục, sản phẩm mới và bán chạy; tìm kiếm, lọc theo thương hiệu, sắp xếp; xem chi tiết và tồn kho; đăng ký kèm kích hoạt qua email, đăng nhập, sửa hồ sơ; giỏ hàng lưu trên trình duyệt; đặt hàng thanh toán khi nhận hàng; xem và hủy đơn.

Quản trị: tổng quan doanh thu và đơn hàng; quản lý danh mục, sản phẩm (ảnh, giá VND, tồn kho, mô tả), banner; duyệt hoặc hủy đơn; xem, khóa, mở khóa khách hàng và gửi lại email kích hoạt.

## Cài đặt

Yêu cầu Node.js 20 trở lên và một cơ sở dữ liệu MongoDB Atlas.

```bash
cd server && npm install
cd ../client-admin && npm install
cd ../client-customer && npm install
```

Tạo file `server/.env` từ `server/.env.example` rồi điền `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`. Không đưa file `.env` lên Git. Trong Atlas cần thêm địa chỉ IP của máy vào Network Access.

## Chạy khi phát triển

Mở ba cửa sổ terminal:

```bash
cd server && npm run dev
cd client-admin && npm start
cd client-customer && npm start
```

Trang khách tại http://localhost:3002, trang quản trị tại http://localhost:3001/admin. Hai trang web chuyển các yêu cầu `/api` sang máy chủ ở cổng 3000. Lần chạy đầu tiên máy chủ tự tạo tài khoản admin theo `ADMIN_USERNAME` và `ADMIN_PASSWORD`.

Nếu chưa cấu hình email, liên kết kích hoạt tài khoản khách được in ra cửa sổ của máy chủ.

## Dữ liệu mẫu

```bash
cd server
npm run seed          # thêm danh mục, 30 sản phẩm có ảnh thật, banner, khách và đơn hàng mẫu
npm run seed:reset    # xóa dữ liệu mẫu cũ rồi thêm lại
npm run seed:clean    # chỉ xóa dữ liệu mẫu
```

Dữ liệu mẫu được đánh dấu riêng nên không đụng đến dữ liệu thật. Tài khoản khách mẫu dùng mật khẩu `Demo12345`, danh sách tên đăng nhập được in ra sau khi chạy. Nguồn và giấy phép của từng ảnh nằm ở `docs/ANH_NGUON.md`.

## Kiểm thử

Chạy máy chủ (`npm run dev`) rồi mở cửa sổ khác:

```bash
cd server && npm test
```

Bộ kiểm thử gọi API thật gồm đăng nhập và phân quyền, chống NoSQL injection, kiểm tra dữ liệu vào, đặt hàng, trừ và hoàn kho, hủy đơn, khóa tài khoản, banner. Dữ liệu tạo ra có tiền tố `AUTOTEST` và được xóa sạch sau khi chạy. Có thể trỏ sang máy chủ khác bằng biến `TEST_API`.

## Triển khai

Máy chủ có thể phục vụ luôn hai trang web đã build, nên chỉ cần một dịch vụ Node duy nhất (ví dụ Render):

```bash
cd server && npm run build:clients   # build client-admin và client-customer
cd server && npm run start:prod      # NODE_ENV=production
```

Ở chế độ production, trang khách nằm ở `/`, trang quản trị ở `/admin`, API ở `/api`. Biến môi trường cần đặt trên hosting: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD` (hai biến sau bắt buộc, thiếu thì máy chủ không khởi động), `CLIENT_URL` là địa chỉ công khai của trang, `NODE_ENV=production`. Trên Atlas, mở Network Access cho địa chỉ của hosting (hoặc `0.0.0.0/0` nếu hosting không có IP cố định).

## Bảo mật đã áp dụng

Mật khẩu băm bằng scrypt có salt, token JWT theo vai trò admin hoặc khách, kiểm tra dữ liệu vào ở máy chủ, giá và tồn kho tính lại ở máy chủ khi đặt hàng, chặn NoSQL injection ở các trường đăng nhập, giới hạn số lần đăng nhập và đăng ký theo IP, header bảo vệ của helmet, giới hạn kích thước dữ liệu gửi lên.
