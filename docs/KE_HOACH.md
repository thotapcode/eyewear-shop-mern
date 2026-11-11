# Kế hoạch thực hiện đồ án Eyewear Shop (MERN)

## 1. Mục tiêu và phạm vi

Xây dựng website bán kính mắt theo mô hình MERN của môn Lập trình web nâng cao (71ITSE41403), bám sát project mẫu Shopping Online của giảng viên và thay dữ liệu thành sản phẩm kính (gọng, tròng, kính râm). Đồ án chiếm 50% điểm môn, chấm theo rubric 3 gồm năm tiêu chí: giao diện và chức năng, công nghệ sử dụng, thuyết trình, vai trò cá nhân trong nhóm, tinh thần tự rèn luyện.

Hệ thống gồm ba thành phần:

| Thành phần | Công nghệ | Cổng chạy | Vai trò |
|---|---|---|---|
| server | Node.js, Express, Mongoose, JWT | 3000 | Cung cấp RESTful API |
| client-admin | React | 3001 (đường dẫn /admin) | Quản trị danh mục, sản phẩm, đơn hàng, khách hàng |
| client-customer | React | 3002 | Khách xem sản phẩm, giỏ hàng, đặt hàng |

Cơ sở dữ liệu là MongoDB Atlas (cluster Cluster0, database eyewear).

## 2. Luồng vận hành tổng quát

### 2.1. Luồng dữ liệu

Trình duyệt gọi client React. Client dùng axios gọi đường dẫn bắt đầu bằng /api, cấu hình proxy trong package.json chuyển yêu cầu sang server cổng 3000. Server xử lý bằng Express, đọc ghi MongoDB Atlas qua Mongoose rồi trả JSON về client.

### 2.2. Luồng xác thực

1. Người dùng nhập tài khoản ở trang đăng nhập.
2. Client gọi POST /api/admin/login (hoặc /api/customer/login).
3. Server kiểm tra mật khẩu đã băm, nếu đúng thì tạo JWT và trả về.
4. Client lưu token trong localStorage, mọi yêu cầu sau gửi kèm header x-access-token.
5. Middleware checkToken ở server xác minh token trước khi cho vào API cần bảo vệ.
6. Khi tải lại trang, client gọi GET /api/admin/token để kiểm tra token còn hợp lệ.

### 2.3. Luồng nghiệp vụ khách hàng

1. Khách đăng ký, server tạo tài khoản ở trạng thái chưa kích hoạt và gửi email chứa mã kích hoạt.
2. Khách mở liên kết trong email, server kích hoạt tài khoản.
3. Khách đăng nhập, xem sản phẩm theo danh mục hoặc tìm kiếm, thêm vào giỏ.
4. Khách thanh toán, server tạo đơn hàng trạng thái PENDING.
5. Admin xem danh sách đơn, chuyển trạng thái sang APPROVED hoặc CANCELED.
6. Khách xem lại các đơn của mình cùng trạng thái.

## 3. Kế hoạch theo giai đoạn

Các giai đoạn bám theo buổi 7 đến 10 của đề cương. Mỗi chức năng làm theo thứ tự: model, API, kiểm thử API, giao diện, build thử, commit riêng.

| Giai đoạn | Nội dung | Tiêu chí rubric liên quan |
|---|---|---|
| 1. Khung dự án (buổi 7) | Cấu trúc ba thư mục, kết nối Atlas, JWT, băm mật khẩu | Công nghệ |
| 2. Admin (buổi 7) | Đăng nhập, danh mục, sản phẩm | Chức năng, giao diện |
| 3. Khách hàng, phần tài khoản và sản phẩm (buổi 8) | Trang chủ, danh sách theo danh mục, tìm kiếm, chi tiết, đăng ký, kích hoạt, đăng nhập, hồ sơ | Chức năng, giao diện |
| 4. Giỏ hàng và đơn hàng (buổi 9) | Thêm giỏ, xem giỏ, xóa, thanh toán, đơn của tôi, admin duyệt đơn, quản lý khách hàng | Chức năng |
| 5. Triển khai (buổi 10) | Cấu hình server phục vụ bản build, đưa lên hosting | Công nghệ |
| 6. Hoàn thiện và báo cáo | Kiểm thử toàn bộ, báo cáo, slide thuyết trình | Thuyết trình |

## 4. Bảng theo dõi tiến độ

Trạng thái: Xong là đã có code và đã kiểm tra theo ghi chú; Chưa là chưa làm.

| STT | Chức năng | API (server) | Giao diện | Trạng thái | Ghi chú kiểm tra |
|---|---|---|---|---|---|
| 1 | Khung server, kết nối Atlas | Có | Không áp dụng | Xong | Đã chạy với Atlas |
| 2 | Admin đăng nhập, đăng xuất | Có | Có | Xong | API đã thử với dữ liệu thật; giao diện mới build, chưa thử tay trên trình duyệt |
| 3 | Admin quản lý danh mục | Có | Có | Xong | Như trên |
| 4 | Admin quản lý sản phẩm (có phân trang, ảnh) | Có | Có | Xong | Như trên |
| 5 | Khách: trang chủ (sản phẩm mới, bán chạy) | Chưa | Chưa | Chưa | |
| 6 | Khách: danh sách theo danh mục | Chưa | Chưa | Chưa | |
| 7 | Khách: tìm kiếm | Chưa | Chưa | Chưa | |
| 8 | Khách: chi tiết sản phẩm | Chưa | Chưa | Chưa | |
| 9 | Khách: đăng ký | Chưa | Chưa | Chưa | Cần cấu hình gửi email |
| 10 | Khách: kích hoạt tài khoản | Chưa | Chưa | Chưa | |
| 11 | Khách: đăng nhập, đăng xuất | Chưa | Chưa | Chưa | |
| 12 | Khách: hồ sơ cá nhân | Chưa | Chưa | Chưa | |
| 13 | Khách: giỏ hàng | Không cần | Chưa | Chưa | Lưu ở phía client |
| 14 | Khách: thanh toán, tạo đơn | Chưa | Chưa | Chưa | |
| 15 | Khách: đơn hàng của tôi | Chưa | Chưa | Chưa | |
| 16 | Admin: danh sách và duyệt đơn | Chưa | Chưa | Chưa | |
| 17 | Admin: danh sách khách hàng, vô hiệu hóa, gửi lại mail | Chưa | Chưa | Chưa | |
| 18 | Triển khai lên hosting | Chưa | Chưa | Chưa | Slide mẫu dùng Replit, cần kiểm tra lại dịch vụ còn dùng được |
| 19 | Báo cáo và slide thuyết trình | Không áp dụng | Không áp dụng | Chưa | Theo quy cách tài liệu của khoa |

## 5. Các điểm còn thiếu, cần bổ sung hoặc cân nhắc bỏ

Cần bổ sung cho phần đã làm:

- Token hết hạn sau một giờ nhưng client chưa tự đăng xuất khi server báo token không hợp lệ ở các trang quản lý.
- Xóa danh mục chưa kiểm tra danh mục đó còn sản phẩm hay không.
- Server chưa kiểm tra dữ liệu đầu vào đầy đủ (giá âm, tên rỗng); hiện chỉ kiểm tra ở giao diện.
- Chưa có kiểm thử tự động; hiện kiểm thử bằng script gọi API.
- Ảnh lưu dạng base64 trong database, gói miễn phí chỉ có 512 MB nên cần giới hạn kích thước ảnh khi tải lên.

Có thể bổ sung cho hợp chủ đề kính mắt, làm sau cùng nếu còn thời gian:

- Lọc sản phẩm theo thương hiệu, loại gọng, khoảng giá.
- Thêm mô tả, số lượng tồn kho và trạng thái còn hàng.

Cân nhắc bỏ hoặc giữ ở mức đơn giản:

- Gửi email kích hoạt cần tài khoản email ứng dụng; nếu khó cấu hình thì có phương án kích hoạt trực tiếp qua liên kết hiển thị cho admin.
- Gói miễn phí của hosting thường có giới hạn, cần chọn nơi triển khai khi tới giai đoạn 5.

## 6. Cách chạy và kiểm thử

Chuẩn bị: cài Node.js, tạo file server/.env từ server/.env.example rồi điền MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD. File .env không được đưa lên GitHub.

Chạy từng thành phần, mỗi lệnh ở một cửa sổ terminal:

```
cd server && npm run dev
cd client-admin && npm start
cd client-customer && npm start
```

Địa chỉ truy cập: trang admin tại http://localhost:3001/admin, trang khách tại http://localhost:3002, API kiểm tra tại http://localhost:3000/hello.

Quy ước làm việc: mỗi chức năng một commit riêng, thông điệp commit bằng tiếng Việt mô tả việc đã làm; chỉ đẩy lên GitHub khi đã build hoặc chạy thử không lỗi.
