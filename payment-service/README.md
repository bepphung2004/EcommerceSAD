# Payment Service (Dịch vụ Thanh toán)

## 1. Giới thiệu chung (Overview)
Payment Service chịu trách nhiệm mô phỏng các hoạt động giao dịch thanh toán trong hệ thống thương mại điện tử. Nó ghi nhận số tiền thanh toán, hình thức thanh toán và trạng thái của hóa đơn tương ứng với mỗi đơn hàng.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Xử lý yêu cầu thanh toán (Checkout Simulation)**:
  - Nếu hình thức thanh toán là **`COD`** (Cash on Delivery): Thiết lập trạng thái thanh toán mặc định là `pending` (Chờ thu hộ tiền mặt khi giao hàng).
  - Nếu hình thức thanh toán là **`Ví điện tử`** (Momo/ZaloPay/Thẻ): Giả lập giao dịch thành công lập tức và đưa trạng thái về `success`, đồng thời lưu lại thông tin tài khoản hoặc số điện thoại ví của khách hàng (`wallet_details`).
- **Tra cứu hóa đơn (Transaction Lookup)**: Cho phép truy vấn thông tin hóa đơn thanh toán thông qua `order_id`.
- **Đồng bộ hóa trạng thái hóa đơn**: Nhận yêu cầu cập nhật trạng thái từ các dịch vụ khác (ví dụ: chuyển trạng thái hóa đơn COD từ `pending` sang `success` khi đơn hàng giao thành công, hoặc sang `failed` nếu đơn hàng bị hoàn trả).

---

## 3. Công nghệ sử dụng (Technology Stack)
- **Django (Python 3.11)** & **Django REST Framework (DRF)**.
- **MySQL 8.0**: Cơ sở dữ liệu lưu trữ hóa đơn giao dịch (`payment-db`).
- **mysqlclient**: Driver kết nối cơ sở dữ liệu.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
payment-service/
├── config/
│   ├── settings.py         # Cấu hình Django (kết nối MySQL, cấu hình DRF auth)
│   ├── urls.py             # Định tuyến cấp dự án
│   └── ...
├── core/
│   ├── migrations/         # Di cư dữ liệu MySQL
│   ├── models.py           # Khai báo cấu trúc bảng Payment
│   ├── serializers.py      # Tuần tự hóa thông tin giao dịch
│   ├── urls.py             # Định tuyến cấp ứng dụng (/payment/pay và /payment/status)
│   └── views.py            # API View xử lý thanh toán và cập nhật trạng thái hóa đơn
├── Dockerfile              # Cấu hình đóng gói container chạy Django Payment Service
├── manage.py               # Lệnh điều hành Django
└── requirements.txt        # Thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `core/models.py`:
  - `Payment`: Lưu thông tin `order_id` (Integer - liên kết logic), `amount` (Float), `method` (Varchar, mặc định `'COD'`), `status` (`pending`, `success`, `failed`), và `wallet_details` (Varchar - lưu số tài khoản ví điện tử).
- `core/views.py`:
  - `PaymentPayView`: Nhận payload POST gồm `order_id`, `amount`, `method` và `wallet_details`. Thực hiện tạo mới bản ghi thanh toán.
  - `PaymentStatusView`:
    - `get`: Lấy thông tin hóa đơn dựa trên tham số query `?order_id=<id>`.
    - `patch`: Cập nhật trạng thái hóa đơn (`pending`, `success`, `failed`) cho một đơn hàng.

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
Dịch vụ kết nối tới cơ sở dữ liệu MySQL (`payment-db`) chạy cổng mặc định `3306` nội bộ.

### Bảng Hóa đơn thanh toán (`core_payment`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID hóa đơn tự tăng |
| `order_id` | Integer | Not Null | ID đơn hàng (Khóa ngoại logic) |
| `amount` | Double | Not Null | Số tiền cần thanh toán |
| `method` | VarChar(50) | Default: `'COD'` | Kênh thanh toán (`COD`, `Ví điện tử`, Momo, v.v.) |
| `wallet_details` | VarChar(255) | Default: `""` | Số tài khoản / Số điện thoại ví điện tử |
| `status` | VarChar(50) | Default: `'pending'` | Trạng thái thanh toán (`pending`, `success`, `failed`) |

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- **order-service**:
  - Gửi `POST /payment/pay` để tạo hóa đơn khi khách hàng đặt hàng mới.
  - Gửi `GET /payment/status?order_id=<id>` để lấy thông tin kênh thanh toán và kiểm tra trạng thái trước khi cập nhật.
  - Gửi `PATCH /payment/status` để đổi trạng thái sang `success` khi đơn COD được giao, hoặc sang `failed` nếu đơn hàng hủy/thất bại.
- **API Gateway**: Chuyển tiếp yêu cầu xem hóa đơn từ Frontend của khách hàng tại trang lịch sử thanh toán (`/payments`).

### Outbound (Gửi yêu cầu):
- Dịch vụ này **không gọi** tới bất kỳ dịch vụ backend nào khác.

---

## 7. Danh sách API Endpoints (API Routes)

| Method | Endpoint | Quyền truy cập | Body / Payload | Response chính |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/pay` | JWT (IsAuthenticated) | `{"order_id", "amount", "method", "wallet_details"}` | `{"id", "order_id", "amount", "method", "status", "wallet_details"}` |
| `GET` | `/status` | JWT (IsAuthenticated) | Query param `?order_id=<id>` | `{"id", "order_id", "amount", "method", "status", "wallet_details"}` |
| `PATCH` | `/status` | JWT (IsAuthenticated) | `{"order_id", "status"}` | `{"id", "status"}` |

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8004`.
- **Ánh xạ ra ngoài (Host)**: Cổng `3310` cho database MySQL `payment-db`.
- **Biến môi trường cần thiết**:
  - `PAYMENT_DB_NAME`, `PAYMENT_DB_USER`, `PAYMENT_DB_PASSWORD`: Cấu hình kết nối MySQL.
  - `PAYMENT_DB_HOST`: Host database (trong docker compose là `payment-db`).
  - `PAYMENT_DB_PORT`: Cổng MySQL (mặc định `3306`).
