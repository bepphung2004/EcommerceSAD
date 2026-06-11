# Shipping Service (Dịch vụ Vận chuyển & Giao vận)

## 1. Giới thiệu chung (Overview)
Shipping Service chịu trách nhiệm xử lý các thông tin liên quan đến giao hàng và vận đơn (Shipment). Nó lưu giữ địa chỉ giao nhận của khách hàng, điều phối trạng thái thực tế của quá trình vận chuyển từ kho đến tay khách hàng và cập nhật tiến độ vận đơn.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Tạo vận đơn mới (Shipment Creation)**: Tiếp nhận `order_id` và địa chỉ giao hàng (`address`) từ Order Service khi một đơn hàng mới được thiết lập. Trạng thái vận đơn ban đầu mặc định là `processing` (Đang xử lý chuẩn bị hàng).
- **Tra cứu thông tin giao vận (Shipment Tracking)**: Cho phép truy cập thông tin vận đơn hiện tại và kiểm tra tiến độ giao hàng thông qua `order_id`.
- **Cập nhật trạng thái vận đơn**:
  - Nhận các cập nhật trạng thái từ phía nhân viên giao hàng hoặc tự động từ hệ thống thông qua phương thức `PATCH`.
  - Hỗ trợ các trạng thái giao vận: `processing` (Đang chuẩn bị), `shipping` (Đang giao hàng), `delivered` (Giao hàng thành công), và `failed` (Giao hàng thất bại/Hoàn hàng).

---

## 3. Công nghệ sử dụng (Technology Stack)
- **Django (Python 3.11)** & **Django REST Framework (DRF)**.
- **MySQL 8.0**: Cơ sở dữ liệu lưu trữ vận đơn (`shipping-db`).
- **mysqlclient**: Driver kết nối cơ sở dữ liệu.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
shipping-service/
├── config/
│   ├── settings.py         # Cấu hình Django (kết nối MySQL, cấu hình DRF auth)
│   ├── urls.py             # Định tuyến cấp dự án
│   └── ...
├── core/
│   ├── migrations/         # Di cư dữ liệu MySQL
│   ├── models.py           # Khai báo cấu trúc bảng Shipment
│   ├── serializers.py      # Tuần tự hóa thông tin vận đơn
│   ├── urls.py             # Định tuyến ứng dụng (/shipping/create và /shipping/status)
│   └── views.py            # API xử lý tạo và cập nhật trạng thái vận đơn
├── Dockerfile              # Cấu hình đóng gói container chạy Django Shipping Service
├── manage.py               # Lệnh điều hành Django
└── requirements.txt        # Thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `core/models.py`:
  - `Shipment`: Lưu thông tin `order_id` (Integer - liên kết logic), `address` (Text - địa chỉ giao nhận), và `status` (`processing`, `shipping`, `delivered`, `failed`).
- `core/views.py`:
  - `ShipmentCreateView`: Nhận payload POST chứa `order_id` và `address` để tạo vận đơn mới ở trạng thái `processing`.
  - `ShipmentStatusView`:
    - `get`: Trả về thông tin vận đơn khớp với `order_id` truyền vào qua Query Parameter.
    - `patch`: Cập nhật trạng thái vận đơn (`status`) của đơn hàng chỉ định.

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
Dịch vụ kết nối tới cơ sở dữ liệu MySQL (`shipping-db`) chạy cổng mặc định `3306` nội bộ.

### Bảng Vận đơn giao hàng (`core_shipment`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID vận đơn tự tăng |
| `order_id` | Integer | Not Null | ID đơn hàng (Khóa ngoại logic) |
| `address` | Text | Not Null | Địa chỉ giao nhận chi tiết |
| `status` | VarChar(50) | Default: `'processing'` | Trạng thái giao hàng (`processing`, `shipping`, `delivered`, `failed`) |

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- **order-service**:
  - Gửi `POST /shipping/create` để tạo vận đơn mới khi khách hoàn tất đặt hàng.
  - Gửi `PATCH /shipping/status` để cập nhật trạng thái vận chuyển đồng bộ khi nhân viên thay đổi trạng thái đơn hàng trên Dashboard quản lý.
- **API Gateway**: Chuyển tiếp yêu cầu xem trạng thái vận đơn từ Frontend của khách hàng hoặc trang quản lý của nhân viên.

### Outbound (Gửi yêu cầu):
- Dịch vụ này **không gọi** tới bất kỳ dịch vụ backend nào khác.

---

## 7. Danh sách API Endpoints (API Routes)

| Method | Endpoint | Quyền truy cập | Body / Payload | Response chính |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/create` | JWT (IsAuthenticated) | `{"order_id", "address"}` | `{"id", "order_id", "address", "status"}` |
| `GET` | `/status` | JWT (IsAuthenticated) | Query param `?order_id=<id>` | `{"id", "order_id", "address", "status"}` |
| `PATCH` | `/status` | JWT (IsAuthenticated) | `{"order_id", "status"}` | `{"id", "order_id", "status"}` |

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8005`.
- **Ánh xạ ra ngoài (Host)**: Cổng `3311` cho database MySQL `shipping-db`.
- **Biến môi trường cần thiết**:
  - `SHIPPING_DB_NAME`, `SHIPPING_DB_USER`, `SHIPPING_DB_PASSWORD`: Cấu hình kết nối MySQL.
  - `SHIPPING_DB_HOST`: Host database (trong docker compose là `shipping-db`).
  - `SHIPPING_DB_PORT`: Cổng MySQL (mặc định `3306`).
