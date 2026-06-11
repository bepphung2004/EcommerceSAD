# Cart Service (Dịch vụ Giỏ hàng)

## 1. Giới thiệu chung (Overview)
Cart Service phụ trách quản lý giỏ hàng của từng khách hàng trong hệ thống. Dịch vụ này cho phép người dùng thêm sản phẩm vào giỏ hàng, xem chi tiết giỏ hàng hiện tại, điều chỉnh số lượng và xóa các sản phẩm khỏi giỏ hàng trước khi tiến hành đặt hàng.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Quản lý vòng đời giỏ hàng (Cart Lifecycle)**: Tự động khởi tạo giỏ hàng cho người dùng mới khi có thao tác tương tác đầu tiên.
- **Thêm sản phẩm vào giỏ hàng (Add to Cart)**: Nhận `product_id` và số lượng `quantity`. Nếu sản phẩm đã tồn tại trong giỏ hàng, tự động cộng dồn số lượng.
- **Xóa sản phẩm (Remove from Cart)**: Loại bỏ một mặt hàng cụ thể khỏi giỏ hàng của người dùng hiện tại dựa trên `product_id`.
- **Đồng bộ hóa phiên đăng nhập**: Chỉ cho phép khách hàng đã đăng nhập (`IsAuthenticated`) thao tác và truy vấn giỏ hàng của chính mình (thông qua mã định danh `user_id` giải mã từ JWT).

---

## 3. Công nghệ sử dụng (Technology Stack)
- **Django (Python 3.11)** & **Django REST Framework (DRF)**.
- **MySQL 8.0**: Cơ sở dữ liệu lưu trữ giỏ hàng (`cart-db`).
- **mysqlclient**: Driver kết nối cơ sở dữ liệu.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
cart-service/
├── config/
│   ├── settings.py         # Cấu hình Django (kết nối MySQL, cấu hình DRF auth)
│   ├── urls.py             # Định tuyến dự án
│   └── ...
├── core/
│   ├── migrations/         # Di cư dữ liệu MySQL
│   ├── models.py           # Khai báo cấu trúc Cart và CartItem
│   ├── serializers.py      # Tuần tự hóa thông tin giỏ hàng và danh sách hàng hóa
│   ├── urls.py             # Định tuyến ứng dụng (/cart, /cart/add, /cart/remove)
│   └── views.py            # API xử lý xem, thêm và xóa mặt hàng trong giỏ
├── Dockerfile              # Cấu hình đóng gói container chạy Django Cart Service
├── manage.py               # Lệnh điều hành Django
└── requirements.txt        # Thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `core/models.py`:
  - `Cart`: Đại diện cho giỏ hàng của người dùng, liên kết logic thông qua trường `user_id = models.IntegerField(unique=True)`.
  - `CartItem`: Đại diện cho một dòng sản phẩm trong giỏ hàng, liên kết tới `Cart` qua quan hệ khóa ngoại (ForeignKey) và liên kết logic với Product Service qua `product_id = models.IntegerField()`. Có thêm trường `quantity = models.IntegerField(default=1)`.
- `core/serializers.py`:
  - `CartItemSerializer`: Định nghĩa cấu trúc trả về cho mỗi sản phẩm trong giỏ hàng.
  - `CartSerializer`: Tổng hợp giỏ hàng của người dùng, bao gồm thông tin ID giỏ hàng, `user_id` và danh sách các `items` liên quan.
- `core/views.py`:
  - `CartView`: Lấy thông tin giỏ hàng hiện tại của người dùng. Nếu chưa có giỏ hàng, tự động gọi `get_or_create` để tạo mới.
  - `AddToCartView`: Thêm sản phẩm vào giỏ hàng, xử lý cộng dồn số lượng nếu sản phẩm đã có sẵn trong giỏ.
  - `RemoveFromCartView`: Thực hiện xóa liên kết `CartItem` tương ứng với sản phẩm.

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
Dịch vụ kết nối tới cơ sở dữ liệu MySQL (`cart-db`) chạy cổng mặc định `3306` nội bộ.

### Sơ đồ các bảng dữ liệu:

#### 1. Bảng giỏ hàng (`core_cart`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID tự tăng |
| `user_id` | Integer | Unique, Not Null | ID người dùng (Khóa ngoại logic) |

#### 2. Bảng sản phẩm trong giỏ (`core_cartitem`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID tự tăng |
| `cart_id` | Integer | Foreign Key -> `core_cart(id)` | Liên kết tới giỏ hàng |
| `product_id` | Integer | Not Null | ID sản phẩm (Khóa ngoại logic) |
| `quantity` | Integer | Default: `1` | Số lượng sản phẩm thêm |

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- **API Gateway**: Chuyển tiếp các yêu cầu tương tác giỏ hàng từ Frontend của khách hàng.

### Outbound (Gửi yêu cầu):
- Dịch vụ này hoạt động độc lập và **không gửi** yêu cầu HTTP REST tới các backend service khác. 
- *Lưu ý: Mối liên kết tới `User` và `Product` được thiết lập ở mức logic mã nguồn (ID kiểu Integer) chứ không ràng buộc khóa ngoại cứng ở mức database.*

---

## 7. Danh sách API Endpoints (API Routes)

| Method | Endpoint | Quyền truy cập | Body / Payload | Response chính |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` (Xem giỏ hàng) | JWT (IsAuthenticated) | Không có | `{"id", "user_id", "items": [{"id", "product_id", "quantity"}]}` |
| `POST` | `/add` (Thêm vào giỏ) | JWT (IsAuthenticated) | `{"product_id", "quantity"}` | `{"detail": "item added"}` |
| `DELETE` | `/remove` (Xóa khỏi giỏ) | JWT (IsAuthenticated) | `{"product_id"}` | `{"detail": "item removed"}` |

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8002`.
- **Ánh xạ ra ngoài (Host)**: Cổng `3308` cho database MySQL `cart-db`.
- **Biến môi trường cần thiết**:
  - `CART_DB_NAME`, `CART_DB_USER`, `CART_DB_PASSWORD`: Thông tin cấu hình kết nối MySQL.
  - `CART_DB_HOST`: Host database (trong docker compose là `cart-db`).
  - `CART_DB_PORT`: Cổng MySQL (mặc định `3306`).
