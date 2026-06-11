# Gateway Service (API Gateway)

## 1. Giới thiệu chung (Overview)
Gateway Service là cổng vào duy nhất (Single Entry Point) cho tất cả các luồng API từ phía client (Frontend) gửi tới hệ thống E-Commerce Microservices. Gateway đảm nhận vai trò định tuyến (routing), bảo mật xác thực (JWT authentication) và phân quyền kiểm soát truy cập (RBAC - Role-Based Access Control) tập trung, giúp che giấu và bảo vệ cấu trúc hạ tầng mạng nội bộ của các microservices phía sau.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Định tuyến ngược (Reverse Proxying)**: Chuyển tiếp các yêu cầu HTTP từ client tới đúng microservice đích dựa trên đường dẫn URL.
- **Xác thực JWT tập trung (JWT Authentication)**: Kiểm tra tính hợp lệ của JSON Web Token trong header `Authorization` đối với tất cả các API private.
- **Kiểm soát truy cập dựa trên vai trò (RBAC)**: Đối chiếu vai trò của người dùng (`role` trong JWT payload) với danh sách các quyền được phép truy cập của từng endpoint.
- **CORS Management**: Cấp quyền chia sẻ tài nguyên nguồn chéo cho Frontend từ mọi origin (`*`).
- **Nginx Reverse Proxy**: Tách biệt luồng hiển thị tĩnh của Frontend (cổng `3000`) và luồng API Gateway (cổng `8080`) thông qua máy chủ Nginx ở mức ngoài cùng (cổng `80`).

---

## 3. Công nghệ sử dụng (Technology Stack)
- **FastAPI (Python 3.11)**: Framework web bất đồng bộ tốc độ cao để viết định tuyến và middleware kiểm soát quyền lực.
- **Uvicorn**: ASGI web server chạy ứng dụng FastAPI.
- **PyJWT**: Thư viện dùng để giải mã và xác thực token JWT.
- **Httpx**: Thư viện HTTP client bất đồng bộ dùng để chuyển tiếp các request tới các service nội bộ.
- **Nginx**: Web server làm nhiệm vụ Reverse Proxy ở rìa ngoài cùng hệ thống.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
gateway/
├── Dockerfile          # Cấu hình đóng gói container chạy API Gateway
├── main.py             # Mã nguồn chính xử lý kiểm tra JWT, RBAC và Proxying
├── nginx.conf          # Cấu hình Nginx định tuyến luồng web/API cấp ngoài cùng
└── requirements.txt    # Danh sách thư viện Python cần cài đặt
```

### Chi tiết tệp tin cốt lõi:
- `main.py`:
  - Khởi tạo FastAPI app.
  - Định nghĩa bản đồ định tuyến `SERVICE_MAP` để ánh xạ prefix API sang địa chỉ của các service nội bộ.
  - Chứa hàm `get_token_payload` giải mã JWT bằng `JWT_SECRET_KEY` từ biến môi trường.
  - Chứa hàm `is_public` để định nghĩa các API không yêu cầu token (GET sản phẩm/danh mục, POST đăng nhập/đăng ký).
  - Chứa hàm `check_rbac` thực thi các quy tắc kiểm soát quyền lực của `ROLE_RULES`.
  - Phương thức `proxy_request` sử dụng `httpx.AsyncClient` chuyển tiếp body, query và headers tới service đích một cách bất đồng bộ.
- `nginx.conf`:
  - Lắng nghe trên cổng `80` (hỗ trợ cả IPv4 và IPv6 loopback).
  - `/healthz`: Endpoint check sức khỏe Nginx trả về `ok`.
  - `/api/`: Chuyển tiếp toàn bộ request chứa tiền tố `/api/` tới API Gateway (`gateway:8080`).
  - `/`: Chuyển tiếp các yêu cầu còn lại (tĩnh/giao diện) tới Frontend (`frontend:3000`).

---

## 5. Cơ sở dữ liệu (Database)
Gateway **không sử dụng cơ sở dữ liệu**. Việc kiểm tra tính hợp lệ của người dùng dựa hoàn toàn vào cơ chế ký số đối xứng của JWT token.

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- Nhận tất cả các request của client gửi từ **Frontend** hoặc các tool kiểm thử API thông qua cổng **Nginx** (`80`).

### Outbound (Gửi yêu cầu):
Gateway đóng vai trò chuyển tiếp yêu cầu tới các microservice đích thông qua giao thức HTTP REST (đồng bộ) dựa trên bản đồ ánh xạ sau:
- **user-service** (auth & users): `http://user-service:8000`
- **product-service** (products & categories): `http://product-service:8001`
- **cart-service** (cart): `http://cart-service:8002`
- **order-service** (orders): `http://order-service:8003`
- **payment-service** (payment): `http://payment-service:8004`
- **shipping-service** (shipping): `http://shipping-service:8005`
- **ai-service** (recommend & chatbot): `http://ai-service:8006`

---

## 7. Quy tắc phân quyền RBAC & Public APIs

### 1. Danh sách các API công khai (Public APIs):
Các yêu cầu sau đây được Gateway chuyển tiếp trực tiếp mà không cần header `Authorization`:
- `GET /api/products/*` (Xem danh sách/chi tiết sản phẩm)
- `GET /api/categories/*` (Xem danh sách/chi tiết danh mục)
- `POST /api/auth/register` (Đăng ký tài khoản)
- `POST /api/auth/login` (Đăng nhập)

### 2. Phân quyền vai trò (Role Rules):
Sau khi giải mã token JWT, Gateway bóc tách trường `role` và kiểm tra quyền:
- **`admin`**: Được phép truy cập tất cả các endpoint (`{"*"}`).
- **`staff`**: Được truy cập các nghiệp vụ quản lý: `products`, `categories`, `orders`, `payment`, `shipping`, `users`. (Không được truy cập giỏ hàng `cart` hoặc AI `recommend`/`chatbot`).
- **`customer`**: Được truy cập các nghiệp vụ mua sắm: `products`, `categories`, `cart`, `orders`, `payment`, `shipping`, `recommend`, `chatbot`. (Không được truy cập quản lý người dùng `users`).

---

## 8. Khởi chạy & Môi trường (Deployment & Docker)
- **Port mặc định của Gateway**: `8080` (được ánh xạ ra ngoài qua docker-compose).
- **Biến môi trường cần thiết**:
  - `JWT_SECRET_KEY`: Khóa bí mật dùng để giải mã chữ ký JWT (đồng bộ với `user-service`). Mặc định: `super-secret-jwt-key`.
  - `JWT_ALGORITHM`: Thuật toán ký token. Mặc định: `HS256`.
  - `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `CART_SERVICE_URL`, `ORDER_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `SHIPPING_SERVICE_URL`, `AI_SERVICE_URL`: URL nội bộ của các container đích tương ứng.
