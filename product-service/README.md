# Product Service (Dịch vụ Sản phẩm & Danh mục)

## 1. Giới thiệu chung (Overview)
Product Service quản lý danh mục sản phẩm (Product Catalog) của hệ thống thương mại điện tử. Nó chịu trách nhiệm định nghĩa danh mục, lưu trữ các thông tin chung của sản phẩm (sku, tên, giá, số lượng tồn kho) cùng thông tin cấu trúc đặc thù cho từng nhóm ngành hàng khác nhau thông qua cơ chế đa hình dữ liệu (Polymorphic Models).

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Quản lý danh mục (Category Management)**: Cho phép thêm, sửa, xóa và truy vấn các phân loại sản phẩm.
- **Quản lý sản phẩm (Product Catalog)**: CRUD sản phẩm chung với các trường cơ bản như tên, mô tả, giá bán, giảm giá, số lượng tồn kho (`stock`), số lượng đã bán (`sold_count`) và đánh giá trung bình.
- **Đa hình hóa ngành hàng (Domain Polymorphism)**: Mở rộng thông tin chi tiết bằng mối quan hệ 1-1 đối với ba nhóm ngành hàng chính:
  - **`book` (Sách)**: Tác giả, Nhà xuất bản, ISBN, số trang, ngôn ngữ, năm xuất bản.
  - **`electronics` (Điện tử)**: RAM, bộ nhớ trong, chip xử lý, kích thước màn hình, bảo hành, hãng sản xuất.
  - **`fashion` (Thời trang)**: Kích thước (size), màu sắc, chất liệu, giới tính phù hợp, phong cách.
- **Bảo mật truy cập**: Cung cấp quyền đọc dữ liệu công khai (Public Read) và chỉ cho phép nhân viên/quản trị viên thực hiện các thay đổi ghi dữ liệu (Write operations).

---

## 3. Công nghệ sử dụng (Technology Stack)
- **Django (Python 3.11)** & **Django REST Framework (DRF)**.
- **PostgreSQL 16**: Cơ sở dữ liệu chính lưu trữ bảng sản phẩm (`product-db`). Đây là service duy nhất trong hệ thống sử dụng PostgreSQL, đảm bảo tính phân tách cơ sở dữ liệu.
- **psycopg2-binary**: Thư viện driver kết nối Django tới PostgreSQL.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
product-service/
├── config/
│   ├── settings.py         # Cấu hình Django (kết nối PostgreSQL, DRF settings)
│   ├── urls.py             # Định tuyến cấp dự án
│   └── ...
├── core/
│   ├── migrations/         # Di cư dữ liệu PostgreSQL
│   ├── models.py           # Định nghĩa Category, Product, Book, Electronics, Fashion
│   ├── serializers.py      # Tuần tự hóa sản phẩm động dựa trên domain
│   ├── urls.py             # Định tuyến cấp ứng dụng (/products/ và /categories/)
│   └── views.py            # API ViewSets cho sản phẩm và danh mục
├── Dockerfile              # Cấu hình đóng gói container chạy Django Product Service
├── manage.py               # Lệnh điều hành Django
└── requirements.txt        # Thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `core/models.py`:
  - `Category`: Lưu tên danh mục.
  - `Product`: Bảng chứa thông tin chung, định nghĩa trường `domain` chứa một trong ba loại (`book`, `electronics`, `fashion`).
  - `Book`, `Electronics`, `Fashion`: Liên kết thông qua trường `product = models.OneToOneField(Product, on_delete=models.CASCADE)`.
- `core/serializers.py`:
  - Đọc động trường `domain` của sản phẩm để gộp (serialize) các thông tin tương ứng từ bảng quan hệ 1-1 (ví dụ: nếu `domain == 'electronics'`, trường dữ liệu trả về sẽ tự động đính kèm thông tin RAM, chip xử lý).
- `core/views.py`:
  - `CategoryViewSet` & `ProductViewSet`: Kế thừa `viewsets.ModelViewSet` của DRF để tự động triển khai đầy đủ các phương thức GET, POST, PUT, PATCH, DELETE. Sử dụng `permissions.IsAuthenticatedOrReadOnly` để cho phép truy cập đọc không cần token.

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
Dịch vụ kết nối tới cơ sở dữ liệu PostgreSQL (`product-db`) chạy cổng mặc định `5432` nội bộ.

### Sơ đồ các bảng dữ liệu chính:

#### 1. Bảng sản phẩm (`core_product`):
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | ID tự tăng |
| `sku` | VarChar(40) | Unique, Not Null | Mã SKU định danh |
| `name` | VarChar(255) | Not Null | Tên sản phẩm |
| `price` | Double Precision | Not Null | Giá sản phẩm gốc |
| `discount_percent` | SmallInt | Default: `0` | Phần trăm giảm giá |
| `stock` | Integer | Not Null | Số lượng tồn kho |
| `sold_count` | Integer | Default: `0` | Số lượng đã bán |
| `domain` | VarChar(20) | Choices: `book`, `electronics`, `fashion` | Phân loại ngành hàng |
| `category_id` | Integer | Foreign Key -> `core_category(id)` | Liên kết tới danh mục |

#### 2. Bảng thông tin Sách (`core_book`):
- `product_id` (OneToOne -> `core_product(id)`), `author`, `publisher`, `isbn`, `pages`, `published_year`, `language`.

#### 3. Bảng thông tin Điện tử (`core_electronics`):
- `product_id` (OneToOne -> `core_product(id)`), `brand`, `model_name`, `ram`, `storage`, `chip`, `screen_size`, `battery`, `warranty`, `origin`.

#### 4. Bảng thông tin Thời trang (`core_fashion`):
- `product_id` (OneToOne -> `core_product(id)`), `size`, `color`, `material`, `gender`, `style`.

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- **API Gateway**: Nhận chuyển tiếp các yêu cầu xem sản phẩm/danh mục từ phía client.
- **ai-service**: Gửi yêu cầu HTTP GET tới `/products/` trong quá trình khởi tạo dữ liệu để đồng bộ hóa thông tin danh mục sản phẩm vào chỉ mục FAISS Vector DB và Neo4j Graph DB.

### Outbound (Gửi yêu cầu):
- Dịch vụ này **không gọi** tới bất kỳ dịch vụ backend nào khác.

---

## 7. Danh sách API Endpoints (API Routes)

Cấu hình định tuyến sử dụng `DefaultRouter` của DRF:

| Method | Endpoint | Quyền truy cập | Body / Payload | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/categories/` | Public | Không có | Lấy danh sách danh mục |
| `POST` | `/categories/` | JWT (Admin/Staff) | `{"name"}` | Tạo danh mục mới |
| `GET` | `/products/` | Public | Không có | Lấy danh sách sản phẩm hoạt động |
| `POST` | `/products/` | JWT (Admin/Staff) | JSON chứa thông tin chung + thông tin domain cụ thể | Tạo mới sản phẩm kèm chi tiết ngành hàng |
| `GET` | `/products/<id>/` | Public | Không có | Chi tiết sản phẩm (tự động gộp dữ liệu ngành hàng) |
| `PUT/DELETE` | `/products/<id>/` | JWT (Admin/Staff) | Tương tự tạo mới | Cập nhật hoặc Xóa sản phẩm |

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8001`.
- **Ánh xạ ra ngoài (Host)**: Cổng `5433` cho database PostgreSQL `product-db`.
- **Biến môi trường cần thiết**:
  - `PRODUCT_DB_NAME`, `PRODUCT_DB_USER`, `PRODUCT_DB_PASSWORD`: Thông tin kết nối PostgreSQL.
  - `PRODUCT_DB_HOST`: Tên host database (trong docker compose là `product-db`).
  - `PRODUCT_DB_PORT`: Cổng kết nối PostgreSQL (mặc định `5432`).
