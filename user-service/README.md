# User Service (Dịch vụ Người dùng & Xác thực)

## 1. Giới thiệu chung (Overview)
User Service quản lý toàn bộ vòng đời của người dùng trong hệ thống E-Commerce, chịu trách nhiệm lưu trữ thông tin tài khoản, xử lý đăng ký, đăng nhập và cấp phát JWT token (chứa thông tin vai trò người dùng) phục vụ cho cơ chế bảo mật của toàn bộ hệ thống.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Quản lý danh tính người dùng (Identity Management)**: Đăng ký tài khoản khách hàng mới (`customer`) và lưu trữ thông tin thông tin đăng nhập mật khẩu đã băm (PBKDF2).
- **Cấp phát JWT token (JWT Token Issuance)**: Tích hợp thư viện Rest Framework SimpleJWT để cấp phát cặp token (Access Token & Refresh Token) khi đăng nhập thành công. Nhúng thông tin vai trò (`role`) và tên đăng nhập (`username`) vào Payload của token.
- **Quản lý phân quyền (User Roles)**: Định nghĩa các nhóm vai trò trong hệ thống: `admin` (Quản trị viên), `staff` (Nhân viên), và `customer` (Khách hàng).
- **Cung cấp danh sách người dùng**: Cho phép nhân viên hoặc admin truy vấn danh sách người dùng để phục vụ công tác quản trị.

---

## 3. Công nghệ sử dụng (Technology Stack)
- **Django (Python 3.11)** & **Django REST Framework**: Framework chính xây dựng API RESTful.
- **Django REST Framework SimpleJWT**: Tiện ích mở rộng xử lý sinh và cấu hình JSON Web Tokens (JWT).
- **MySQL 8.0**: Cơ sở dữ liệu chính lưu trữ bảng người dùng (`user-db`).
- **mysqlclient**: Driver kết nối Django tới MySQL.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
user-service/
├── config/
│   ├── settings.py         # Cấu hình Django (kết nối MySQL, SimpleJWT, Installed Apps)
│   ├── urls.py             # Định tuyến cấp dự án
│   └── ...
├── core/
│   ├── migrations/         # Lịch sử các file di cư database
│   ├── models.py           # Định nghĩa User Model tùy chỉnh mở rộng vai trò
│   ├── serializers.py      # Serializers cho Đăng ký & sinh Custom JWT Payload
│   ├── urls.py             # Định tuyến cấp ứng dụng
│   └── views.py            # Xử lý Đăng ký, Đăng nhập và lấy thông tin người dùng
├── Dockerfile              # Cấu hình đóng gói container chạy Django User Service
├── manage.py               # Lệnh điều hành Django
└── requirements.txt        # Thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `core/models.py`:
  - Khai báo lớp `User` kế thừa `AbstractUser` từ Django Auth.
  - Thêm trường `role` kiểu `CharField` với các lựa chọn vai trò (`ROLE_CHOICES`): `admin`, `staff`, `customer`. Giá trị mặc định là `customer`.
- `core/serializers.py`:
  - `RegisterSerializer`: Mã hóa mật khẩu an toàn sử dụng `make_password` khi tạo tài khoản.
  - `CustomTokenObtainPairSerializer`: Kế thừa `TokenObtainPairSerializer` để chèn thêm `role` và `username` vào payload của Access Token.
- `core/views.py`:
  - `RegisterView`: Tạo tài khoản mới (AllowAny).
  - `LoginView`: Sinh và trả về JWT token (AllowAny).
  - `UsersView`: Lấy danh sách tài khoản (Chỉ cho phép `admin` và `staff` truy cập, trả về `id`, `username`, `email`, `role`).

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
Dịch vụ kết nối tới cơ sở dữ liệu MySQL (`user-db`) chạy cổng mặc định `3306` nội bộ.

### Bảng người dùng (`core_user`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID tự tăng |
| `username` | VarChar(150) | Unique, Not Null | Tên đăng nhập |
| `password` | VarChar(128) | Not Null | Mật khẩu (đã băm PBKDF2) |
| `email` | VarChar(254) | Allow Null | Địa chỉ Email |
| `role` | VarChar(20) | Default: `'customer'` | Vai trò (`admin`, `staff`, `customer`) |
| `is_active` | Boolean | Default: `True` | Trạng thái hoạt động tài khoản |
| `date_joined` | DateTime | Not Null | Thời gian đăng ký |

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- Nhận yêu cầu HTTP REST trực tiếp từ **API Gateway** gửi tới các đầu API `/auth/register`, `/auth/login`, và `/users/`.
- Gateway sẽ gửi kèm header `Authorization: Bearer <token>` đã giải mã hoặc chưa giải mã (Gateway tự kiểm tra chữ ký JWT trước khi proxy, nhưng User Service cũng cấu hình `IsAuthenticated` ở mức view của `/users/`).

### Outbound (Gửi yêu cầu):
- Dịch vụ này **không gọi** tới bất kỳ dịch vụ backend nào khác.

---

## 7. Danh sách API Endpoints (API Routes)

| Method | Endpoint | Quyền truy cập | Body / Payload | Response chính |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | `{"username", "password", "email"}` | `{"id", "username", "email", "role"}` |
| `POST` | `/auth/login` | Public | `{"username", "password"}` | `{"access": "<JWT>", "refresh": "<JWT>"}` |
| `GET` | `/users/` | JWT (Admin/Staff) | Không có | `[{"id", "username", "email", "role"}]` |

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8000`.
- **Ánh xạ ra ngoài (Host)**: Cổng `3307` cho database MySQL `user-db`.
- **Biến môi trường cần thiết** (từ file `.env` ở thư mục gốc):
  - `JWT_SECRET_KEY`: Khóa bí mật dùng để tạo chữ ký JWT.
  - `USER_DB_NAME`, `USER_DB_USER`, `USER_DB_PASSWORD`: Thông tin kết nối MySQL.
  - `USER_DB_HOST`: Tên host database (trong docker compose là `user-db`).
  - `USER_DB_PORT`: Cổng MySQL (mặc định `3306`).
