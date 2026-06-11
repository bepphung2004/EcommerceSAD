# Order Service (Dịch vụ Đơn hàng & Điều phối)

## 1. Giới thiệu chung (Overview)
Order Service là dịch vụ điều phối trung tâm (Orchestrator) chịu trách nhiệm quản lý quy trình tạo đơn hàng, tính toán tổng tiền, lưu trữ lịch sử mua sắm và phối hợp với các dịch vụ khác (Thanh toán và Vận chuyển) để hoàn thiện luồng nghiệp vụ E-Commerce từ lúc đặt hàng đến khi giao hàng thành công.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Khởi tạo và Quản lý Đơn hàng**: Tiếp nhận yêu cầu mua sản phẩm, tính toán giá trị giỏ hàng và lưu thông tin chi tiết đơn hàng (`Order`) cùng danh sách các sản phẩm đính kèm (`OrderItem`).
- **Điều phối Thanh toán (Payment Orchestration)**: Khi đơn hàng được tạo, gửi yêu cầu HTTP POST sang Payment Service để thực hiện giao dịch:
  - Nếu thanh toán qua Ví điện tử (`Momo`/`ZaloPay`) thành công ngay lập tức: Chuyển đơn sang trạng thái `paid` (Đã thanh toán) và gọi sang Shipping Service để tạo vận đơn giao hàng.
  - Nếu chọn hình thức thanh toán COD (Nhận hàng trả tiền): Đơn hàng được đưa về trạng thái `pending` (Chờ xử lý) và tạo vận đơn vận chuyển bình thường.
  - Nếu thanh toán thất bại: Chuyển đơn sang trạng thái `failed`.
- **Đồng bộ trạng thái vận đơn & thanh toán (Status Synchronization)**: Khi nhân viên (`staff`/`admin`) thay đổi trạng thái đơn hàng:
  - **`shipping`** (Đang giao): Đồng bộ cập nhật trạng thái vận chuyển tương ứng sang Shipping Service thành `shipping`.
  - **`delivered`** (Đã nhận): Đồng bộ cập nhật trạng thái vận chuyển sang Shipping Service thành `delivered`. Nếu là đơn COD, tự động kích hoạt cập nhật trạng thái Payment Service sang `success` (vì khách đã trả tiền cho người giao hàng).
  - **`failed`** (Thất bại): Đồng bộ cập nhật trạng thái vận chuyển và trạng thái thanh toán sang `failed`.

---

## 3. Công nghệ sử dụng (Technology Stack)
- **Django (Python 3.11)** & **Django REST Framework (DRF)**.
- **MySQL 8.0**: Cơ sở dữ liệu lưu trữ đơn hàng (`order-db`).
- **requests**: Thư viện HTTP client đồng bộ dùng để điều phối các lệnh gọi API chéo sang các dịch vụ nội bộ khác.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
order-service/
├── config/
│   ├── settings.py         # Cấu hình kết nối MySQL và phân quyền JWT
│   ├── urls.py             # Định tuyến cấp dự án
│   └── ...
├── core/
│   ├── migrations/         # Di cư dữ liệu MySQL
│   ├── models.py           # Khai báo cấu trúc Order và OrderItem
│   ├── serializers.py      # Tuần tự hóa thông tin đơn hàng và kiểm soát chi tiết
│   ├── urls.py             # Định tuyến ứng dụng (/orders/)
│   └── views.py            # Chứa logic tạo đơn, đồng bộ trạng thái vận chuyển/thanh toán
├── Dockerfile              # Cấu hình đóng gói container chạy Django Order Service
├── manage.py               # Lệnh điều hành Django
└── requirements.txt        # Thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `core/models.py`:
  - `Order`: Lưu thông tin `user_id` (Integer), `total_price` (Float), `address` (Varchar), và `status` (`pending`, `paid`, `failed`, `shipping`, `delivered`).
  - `OrderItem`: Lưu thông tin `order` (ForeignKey), `product_id` (Integer), `quantity` (Integer), và `price` (Float).
- `core/views.py`:
  - `OrdersView`: 
    - `get`: Khách hàng chỉ xem được đơn của mình, còn Admin/Staff xem được toàn bộ đơn hệ thống.
    - `post`: Nhận thông tin thanh toán (`payment_method`, `wallet_details`), địa chỉ (`address`) và các item. Tạo đơn và kích hoạt lệnh gọi POST sang `payment-service` và `shipping-service`.
  - `OrderStatusUpdateView`:
    - `patch`: Cho phép Admin/Staff cập nhật trạng thái đơn (ví dụ sang `shipping` hoặc `delivered`) và tự động kích hoạt các yêu cầu PATCH đồng bộ sang `payment-service` và `shipping-service`.

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
Dịch vụ kết nối tới cơ sở dữ liệu MySQL (`order-db`) chạy cổng mặc định `3306` nội bộ.

### Sơ đồ các bảng dữ liệu chính:

#### 1. Bảng Đơn hàng (`core_order`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID đơn hàng tự tăng |
| `user_id` | Integer | Not Null | ID khách hàng (Khóa ngoại logic) |
| `total_price` | Double | Default: `0.0` | Tổng giá trị đơn hàng |
| `status` | VarChar(50) | Default: `'pending'` | Trạng thái (`pending`, `paid`, `failed`, `shipping`, `delivered`) |
| `address` | VarChar(255) | Default: `'N/A'` | Địa chỉ nhận hàng của khách |

#### 2. Bảng Chi tiết sản phẩm đơn hàng (`core_orderitem`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID dòng tự tăng |
| `order_id` | Integer | Foreign Key -> `core_order(id)` | Liên kết tới đơn hàng |
| `product_id` | Integer | Not Null | ID sản phẩm (Khóa ngoại logic) |
| `quantity` | Integer | Not Null | Số lượng mua |
| `price` | Double | Not Null | Đơn giá tại thời điểm mua |

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

Dịch vụ này sử dụng thư viện `requests` để điều phối các nghiệp vụ thông qua giao thức HTTP REST (đồng bộ).

### Inbound (Nhận yêu cầu):
- **API Gateway**: Nhận yêu cầu tạo đơn từ khách hàng hoặc thay đổi trạng thái từ nhân viên.

### Outbound (Gửi yêu cầu):
- **payment-service**:
  - Gửi `POST /payment/pay` khi tạo đơn để thực hiện giao dịch thanh toán.
  - Gửi `PATCH /payment/status` để cập nhật trạng thái thanh toán khi đơn hàng giao thành công hoặc thất bại.
- **shipping-service**:
  - Gửi `POST /shipping/create` khi đơn thanh toán thành công hoặc chọn COD để tạo vận đơn.
  - Gửi `PATCH /shipping/status` để đồng bộ hóa cập nhật trạng thái vận chuyển (`shipping`/`delivered`/`failed`).

---

## 7. Danh sách API Endpoints (API Routes)

| Method | Endpoint | Quyền truy cập | Body / Payload | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | JWT (Bất kỳ ai) | Không có | Lấy danh sách đơn hàng (phân lọc theo vai trò) |
| `POST` | `/` | JWT (Customer/Admin) | `{"address", "payment_method", "wallet_details", "items"}` | Khởi tạo đơn mới và điều phối thanh toán/vận chuyển |
| `PATCH` | `/<order_id>/status` | JWT (Admin/Staff) | `{"status"}` | Cập nhật trạng thái đơn và đồng bộ hóa chéo |

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8003`.
- **Ánh xạ ra ngoài (Host)**: Cổng `3309` cho database MySQL `order-db`.
- **Biến môi trường cần thiết**:
  - `ORDER_DB_NAME`, `ORDER_DB_USER`, `ORDER_DB_PASSWORD`: Cấu hình kết nối MySQL.
  - `ORDER_DB_HOST`: Host database (trong docker compose là `order-db`).
  - `PAYMENT_SERVICE_URL`: URL API thanh toán (mặc định: `http://payment-service:8004/payment/pay`).
  - `SHIPPING_SERVICE_URL`: URL API vận chuyển (mặc định: `http://shipping-service:8005/shipping/create`).
