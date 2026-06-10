# Báo Cáo Phân Tích Hệ Thống E-Commerce Microservices

Báo cáo này cung cấp cái nhìn chi tiết về cấu trúc thư mục, hạ tầng triển khai, quản lý cơ sở dữ liệu, API & phân quyền, cơ chế giao tiếp nội bộ và kiến trúc dịch vụ AI trong hệ thống E-Commerce Microservices hiện tại.

---

### 1. Kiến trúc thư mục (Directory Structure)

Dưới đây là sơ đồ cây thư mục cấp cao của toàn bộ dự án (không bao gồm các thư mục build/cache như `__pycache__` hay `node_modules`):

```text
ecom-final/
├── ai-service/
│   ├── Dockerfile
│   ├── main.py                     # Mã nguồn chính của FastAPI AI Service (LSTM, FAISS, Neo4j)
│   └── requirements.txt
├── cart-service/
│   ├── config/
│   │   ├── settings.py             # Cấu hình kết nối MySQL
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py               # Models: Cart, CartItem
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py                # APIs: Thêm/Xóa/Xem giỏ hàng
│   ├── Dockerfile
│   └── manage.py
├── frontend/                       # Client web application (Vite + React/TypeScript)
├── gateway/
│   ├── Dockerfile
│   ├── main.py                     # API Gateway (FastAPI, JWT check, RBAC rules)
│   ├── nginx.conf                  # Nginx Reverse Proxy
│   └── requirements.txt
├── infrastructure/
│   └── docker-compose.yml          # File điều phối Docker Compose toàn bộ hệ thống
├── order-service/
│   ├── config/
│   │   ├── settings.py             # Cấu hình kết nối MySQL
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py               # Models: Order, OrderItem
│   │   ├── views.py                # APIs: Tạo & Xem đơn hàng, xử lý gọi chéo API thanh toán/vận chuyển
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── payment-service/
│   ├── config/
│   │   ├── settings.py             # Cấu hình kết nối MySQL
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py               # Models: Payment
│   │   ├── views.py                # APIs: Mô phỏng thanh toán
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── product-service/
│   ├── config/
│   │   ├── settings.py             # Cấu hình kết nối PostgreSQL
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py               # Models: Category, Product, Book, Electronics, Fashion
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── shipping-service/
│   ├── config/
│   │   ├── settings.py             # Cấu hình kết nối MySQL
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py               # Models: Shipment
│   │   ├── views.py                # APIs: Tạo & Xem trạng thái vận chuyển
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── user-service/
│   ├── config/
│   │   ├── settings.py             # Cấu hình kết nối MySQL
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py               # Models: User (Kế thừa AbstractUser và lưu trữ vai trò người dùng)
│   │   ├── views.py                # APIs: Đăng ký, Đăng nhập (JWT), Xem danh sách user
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── .env                            # Tệp cấu hình biến môi trường cục bộ
├── .env.example                    # Tệp ví dụ cấu hình biến môi trường
├── local-dev.sh                    # Script bash khởi chạy nhanh môi trường dev
└── local-dev.ps1                   # Script powershell khởi chạy nhanh môi trường dev
```

**Xác nhận sự tồn tại của các thư mục core:**
- `gateway/` (Tồn tại)
- `user-service/` (Tồn tại)
- `product-service/` (Tồn tại)
- `cart-service/` (Tồn tại)
- `order-service/` (Tồn tại)
- `payment-service/` (Tồn tại)
- `shipping-service/` (Tồn tại)
- `ai-service/` (Tồn tại)
- `infrastructure/` (Tồn tại)

---

### 2. Hạ tầng và Triển khai (Infrastructure & Deployment)

#### Tóm tắt cấu hình từ `infrastructure/docker-compose.yml`:
- **Services & Ports mapping**:
  - `nginx`: Map port `80:80` (hoặc biến `NGINX_PORT`). Reverse proxy phân phối request tới Frontend hoặc API Gateway.
  - `gateway`: Map port `8080:8080` (hoặc biến `GATEWAY_PORT`).
  - `frontend`: Map port `3000:3000` (hoặc biến `FRONTEND_PORT`).
  - `user-service`: Chạy nội bộ trên cổng `8000`. Phụ thuộc vào database `user-db`.
  - `product-service`: Chạy nội bộ trên cổng `8001`. Phụ thuộc vào database `product-db`.
  - `cart-service`: Chạy nội bộ trên cổng `8002`. Phụ thuộc vào database `cart-db`.
  - `order-service`: Chạy nội bộ trên cổng `8003`. Phụ thuộc vào database `order-db`.
  - `payment-service`: Chạy nội bộ trên cổng `8004`. Phụ thuộc vào database `payment-db`.
  - `shipping-service`: Chạy nội bộ trên cổng `8005`. Phụ thuộc vào database `shipping-db`.
  - `ai-service`: Chạy nội bộ trên cổng `8006`. Phụ thuộc vào Graph DB `neo4j`.
  - `neo4j` (Graph Database): Map ports `7474:7474` (HTTP Console) và `7687:7687` (Bolt protocol).
  - `user-db` (MySQL 8.0): Map port `3307:3306`.
  - `product-db` (PostgreSQL 16): Map port `5433:5432`.
  - `cart-db` (MySQL 8.0): Map port `3308:3306`.
  - `order-db` (MySQL 8.0): Map port `3309:3306`.
  - `payment-db` (MySQL 8.0): Map port `3310:3306`.
  - `shipping-db` (MySQL 8.0): Map port `3311:3306`.
- **Networks & Volumes**:
  - Sử dụng chung mạng mặc định tự động khởi tạo bởi Docker Compose.
  - Không định nghĩa phân vùng persistent volumes tĩnh bên ngoài trong file compose, các database khởi chạy trực tiếp dựa trên biến môi trường từ tệp tin `.env`.

#### Phân tích file `gateway/nginx.conf`:
- **Routing Rules (Location Blocks)**:
  - `location = /healthz`: Trả về trực tiếp văn bản `'ok'` với mã trạng thái `200` để kiểm tra sức khỏe của Nginx.
  - `location /api/`: Chuyển tiếp (proxy_pass) toàn bộ các request có tiền tố `/api/` tới upstream `gateway_api` (`http://gateway:8080`).
  - `location /`: Chuyển tiếp các yêu cầu còn lại tới frontend (`http://frontend:3000`).

#### Đánh giá Dockerfile các dịch vụ:
- **Base image cho các Django services** (`user-service`, `product-service`, `cart-service`, `order-service`, `payment-service`, `shipping-service`):
  - Sử dụng base image **`python:3.11-slim`**.
  - Các service sử dụng MySQL (`user-service`, `cart-service`, `order-service`, `payment-service`, `shipping-service`) được cài thêm các thư viện hệ thống cần thiết qua `apt-get` phục vụ cho việc build driver MySQL: `default-libmysqlclient-dev`, `gcc`, và `pkg-config`.
- **Base image cho FastAPI (AI service & API Gateway)**:
  - Sử dụng base image **`python:3.11-slim`**.

---

### 3. Nguyên tắc Database Isolation & Models

#### Rà soát cấu hình database của từng service:
- **PostgreSQL**: Chỉ duy nhất **`product-service`** cấu hình kết nối tới PostgreSQL (`django.db.backends.postgresql`), cổng `5432` tại host `product-db`.
- **MySQL**: Tất cả các dịch vụ còn lại bao gồm **`user-service`**, **`cart-service`**, **`order-service`**, **`payment-service`**, và **`shipping-service`** đều sử dụng cơ sở dữ liệu MySQL (`django.db.backends.mysql`), cổng `3306` tại các host db tương ứng.
- **Kết luận**: Hệ thống tuân thủ nghiêm ngặt nguyên lý **Database Isolation per Service** trong kiến trúc Microservices, mỗi service sở hữu một schema và instance database riêng biệt, tránh chia sẻ dữ liệu trực tiếp ở tầng lưu trữ.

#### Trích xuất cấu trúc Models:

##### 1. User Service (`user-service/core/models.py`)
- `User` (Kế thừa `AbstractUser` từ Django Auth):
  - `role`: `CharField(max_length=20, choices=ROLE_CHOICES, default="customer")`
  - Lựa chọn vai trò: `admin` (Admin), `staff` (Staff), `customer` (Customer).

##### 2. Product Service (`product-service/core/models.py`)
- `Category`:
  - `name`: `CharField(max_length=100)`
- `Product`:
  - `sku`: `CharField(max_length=40, unique=True)`
  - `slug`: `SlugField(max_length=280, unique=True)`
  - `name`: `CharField(max_length=255)`
  - `short_description`: `CharField(max_length=255, blank=True)`
  - `description`: `TextField(blank=True)`
  - `brand`: `CharField(max_length=120, blank=True)`
  - `image_url`: `URLField(blank=True)`
  - `price`: `FloatField()`
  - `discount_percent`: `PositiveSmallIntegerField(default=0)`
  - `stock`: `IntegerField()`
  - `sold_count`: `PositiveIntegerField(default=0)`
  - `rating_avg`: `FloatField(default=0)`
  - `rating_count`: `PositiveIntegerField(default=0)`
  - `is_active`: `BooleanField(default=True)`
  - `category`: `ForeignKey(Category, on_delete=models.CASCADE)`
  - `domain`: `CharField(max_length=20, choices=DOMAIN_CHOICES)` với các lựa chọn: `book` (Sách), `electronics` (Điện tử), `fashion` (Thời trang).
- `Book` (Quan hệ `OneToOneField` với `Product`):
  - `author`, `publisher`, `isbn`: `CharField`
  - `pages`, `published_year`: `PositiveIntegerField`
  - `language`: `CharField(blank=True)`
- `Electronics` (Quan hệ `OneToOneField` với `Product`):
  - `brand`, `model_name`, `ram`, `storage`, `chip`, `screen_size`, `battery`, `origin`: `CharField`
  - `warranty`: `IntegerField()`
- `Fashion` (Quan hệ `OneToOneField` với `Product`):
  - `size`, `color`, `material`, `gender`, `style`: `CharField`

##### 3. Cart Service (`cart-service/core/models.py`)
- `Cart`:
  - `user_id`: `IntegerField(unique=True)` (Liên kết logic sang User Service)
- `CartItem`:
  - `cart`: `ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")`
  - `product_id`: `IntegerField()` (Liên kết logic sang Product Service)
  - `quantity`: `IntegerField(default=1)`

##### 4. Order Service (`order-service/core/models.py`)
- `Order`:
  - `user_id`: `IntegerField()` (Liên kết logic sang User Service)
  - `total_price`: `FloatField(default=0)`
  - `status`: `CharField(max_length=50, choices=STATUS_CHOICES, default="pending")`
  - Lựa chọn trạng thái: `pending` (Chờ xử lý), `paid` (Đã thanh toán), `failed` (Thất bại), `shipping` (Đang giao), `delivered` (Đã nhận hàng).
- `OrderItem`:
  - `order`: `ForeignKey(Order, on_delete=models.CASCADE, related_name="items")`
  - `product_id`: `IntegerField()` (Liên kết logic sang Product Service)
  - `quantity`: `IntegerField()`
  - `price`: `FloatField()`

##### 5. Payment Service (`payment-service/core/models.py`)
- `Payment`:
  - `order_id`: `IntegerField()` (Liên kết logic sang Order Service)
  - `amount`: `FloatField()`
  - `status`: `CharField(max_length=50, choices=STATUS_CHOICES, default="pending")`
  - Lựa chọn trạng thái: `pending` (Đang xử lý), `success` (Thành công), `failed` (Thất bại).

##### 6. Shipping Service (`shipping-service/core/models.py`)
- `Shipment`:
  - `order_id`: `IntegerField()` (Liên kết logic sang Order Service)
  - `address`: `TextField()`
  - `status`: `CharField(max_length=50, choices=STATUS_CHOICES, default="processing")`
  - Lựa chọn trạng thái: `processing` (Đang xử lý), `shipping` (Đang giao hàng), `delivered` (Đã giao hàng).

---

### 4. API Endpoints & Phân quyền (API & Security)

#### Danh sách API Routes phân tách theo từng Service:

| Service | Method | Path | Phân quyền (Gateway Level) | Chi tiết chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **Gateway** | `GET` | `/health` | Public | Kiểm tra sức khỏe Gateway |
| **User** | `POST` | `/api/auth/register` | Public | Đăng ký tài khoản mới |
| **User** | `POST` | `/api/auth/login` | Public | Đăng nhập lấy JWT Token |
| **User** | `GET` | `/api/users/` | Yêu cầu JWT (Admin, Staff) | Xem danh sách người dùng |
| **Product** | `GET` | `/api/categories/` | Public | Lấy danh sách danh mục |
| **Product** | `POST` | `/api/categories/` | Yêu cầu JWT (Admin, Staff) | Tạo mới danh mục sản phẩm |
| **Product** | `GET` | `/api/categories/<id>/` | Public | Lấy thông tin chi tiết danh mục |
| **Product** | `PUT`/`PATCH`/`DELETE` | `/api/categories/<id>/` | Yêu cầu JWT (Admin, Staff) | Cập nhật/Xóa danh mục |
| **Product** | `GET` | `/api/products/` | Public | Lấy danh sách sản phẩm |
| **Product** | `POST` | `/api/products/` | Yêu cầu JWT (Admin, Staff) | Tạo mới sản phẩm |
| **Product** | `GET` | `/api/products/<id>/` | Public | Lấy thông tin chi tiết sản phẩm |
| **Product** | `PUT`/`PATCH`/`DELETE` | `/api/products/<id>/` | Yêu cầu JWT (Admin, Staff) | Cập nhật/Xóa sản phẩm |
| **Cart** | `GET` | `/api/cart/` | Yêu cầu JWT (Customer, Admin) | Xem giỏ hàng cá nhân |
| **Cart** | `POST` | `/api/cart/add` | Yêu cầu JWT (Customer, Admin) | Thêm sản phẩm vào giỏ |
| **Cart** | `DELETE` | `/api/cart/remove` | Yêu cầu JWT (Customer, Admin) | Xóa sản phẩm khỏi giỏ |
| **Order** | `GET` | `/api/orders/` | Yêu cầu JWT (Customer, Staff, Admin) | Xem lịch sử đơn hàng cá nhân |
| **Order** | `POST` | `/api/orders/` | Yêu cầu JWT (Customer, Admin) | Tạo đơn hàng mới |
| **Payment** | `POST` | `/api/payment/pay` | Yêu cầu JWT (Internal / Client authorized) | Thực hiện thanh toán |
| **Payment** | `GET` | `/api/payment/status` | Yêu cầu JWT (Internal / Client authorized) | Kiểm tra trạng thái thanh toán |
| **Shipping** | `POST` | `/api/shipping/create` | Yêu cầu JWT (Internal / Client authorized) | Tạo đơn vận chuyển mới |
| **Shipping** | `GET` | `/api/shipping/status` | Yêu cầu JWT (Internal / Client authorized) | Kiểm tra trạng thái vận chuyển |
| **AI** | `GET` | `/api/recommend` | Yêu cầu JWT (Customer, Admin) | Nhận gợi ý sản phẩm cá nhân hóa |
| **AI** | `POST` | `/api/chatbot` | Yêu cầu JWT (Customer, Admin) | Nhắn tin chatbot tư vấn sản phẩm |

#### Logic xác thực JWT (JSON Web Token):
- **Tạo Token (Đăng nhập)**:
  Nằm tại `user-service/core/serializers.py` bằng cách kế thừa `TokenObtainPairSerializer` của thư viện SimpleJWT:
  ```python
  class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
      @classmethod
      def get_token(cls, user):
          token = super().get_token(user)
          # Nhúng thêm vai trò và tên người dùng vào Payload của JWT
          token["role"] = user.role
          token["username"] = user.username
          return token
  ```
- **Xác thực Token (API Gateway Middleware)**:
  Nằm tại `gateway/main.py` trong hàm `route_request`. Khi nhận một request không public:
  1. Gateway kiểm tra sự tồn tại của header `Authorization` bắt đầu bằng chuỗi `Bearer `.
  2. Hàm `get_token_payload(token)` giải mã token bằng thư viện PyJWT:
     ```python
     def get_token_payload(token: str) -> Dict:
         try:
             return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
         except jwt.InvalidTokenError as exc:
             raise HTTPException(status_code=401, detail="Invalid token")
     ```
  3. Sau khi giải mã, thông tin `role` từ payload được sử dụng để đối chiếu phân quyền RBAC.

#### Logic phân quyền RBAC (Role-Based Access Control):
- **Quy tắc phân quyền tại Gateway** (`gateway/main.py`):
  Các luật phân quyền dựa trên tiền tố của request path và role giải mã được từ token:
  ```python
  ROLE_RULES = {
      "admin": {"*"}, # Admin có toàn quyền
      "staff": {"products", "categories", "orders", "payment", "shipping", "users"},
      "customer": {"products", "categories", "cart", "orders", "payment", "shipping", "recommend", "chatbot"},
  }
  ```
- **Kiểm tra quyền tại Gateway**:
  ```python
  def check_rbac(role: str, prefix: str) -> bool:
      allowed = ROLE_RULES.get(role, set())
      return "*" in allowed or prefix in allowed
  ```
- **Kiểm tra quyền ở mức View** (`user-service/core/views.py`):
  ```python
  class UsersView(APIView):
      permission_classes = [permissions.IsAuthenticated]
      def get(self, request):
          # Chỉ Admin hoặc Staff mới được lấy danh sách người dùng
          if request.user.role not in ["admin", "staff"]:
              return Response({"detail": "forbidden"}, status=403)
          ...
  ```

---

### 5. Giao tiếp nội bộ (Inter-service Communication)

- **Phương thức giao tiếp**: Giao tiếp đồng bộ trực tiếp (Synchronous REST Call) qua giao thức HTTP bằng thư viện `requests` của Python.
- **Luồng nghiệp vụ Đặt hàng (Tạo đơn -> Thanh toán -> Vận chuyển)**:
  Định nghĩa tại `order-service/core/views.py` thuộc phương thức `post` của `OrdersView`:

  ```mermaid
  sequenceDiagram
      actor Client
      participant OrderService as Order Service
      participant PaymentService as Payment Service
      participant ShippingService as Shipping Service

      Client->>OrderService: POST /api/orders/ (Address, Items...)
      Note over OrderService: Khởi tạo Order (status="pending")
      
      OrderService->>PaymentService: POST /payment/pay (order_id, amount)
      Note over PaymentService: Tạo Payment (status="success")
      PaymentService-->>OrderService: Trả về trạng thái Payment thành công

      alt Payment thành công
          Note over OrderService: Cập nhật Order (status="paid")
          OrderService->>ShippingService: POST /shipping/create (order_id, address)
          Note over ShippingService: Tạo Shipment (status="processing")
          ShippingService-->>OrderService: Trả về thông tin giao hàng
      else Payment thất bại
          Note over OrderService: Cập nhật Order (status="failed")
      end

      OrderService-->>Client: Trả về thông tin Đơn hàng đã xử lý
  ```

  **Đoạn mã triển khai thực tế (`order-service/core/views.py`):**
  ```python
  # Gửi yêu cầu thanh toán sang Payment Service
  payment_res = requests.post(
      payment_url,
      json={"order_id": order.id, "amount": order.total_price},
      headers={"Authorization": auth_header},
      timeout=5,
  )

  if payment_res.ok:
      # Nếu thanh toán thành công, đổi trạng thái đơn sang 'paid' và tạo yêu cầu giao hàng
      order.status = "paid"
      order.save(update_fields=["status"])
      address = request.data.get("address", "N/A")
      requests.post(
          shipping_url,
          json={"order_id": order.id, "address": address},
          headers={"Authorization": auth_header},
          timeout=5,
      )
  else:
      # Nếu thanh toán thất bại, đổi trạng thái đơn sang 'failed'
      order.status = "failed"
      order.save(update_fields=["status"])
  ```

---

### 6. AI Service (FastAPI/Python)

`ai-service` được xây dựng dựa trên FastAPI để cung cấp một động cơ gợi ý lai (Hybrid Recommendation Engine).

#### Các API Endpoints được expose:
- `GET` `/health`: Trả về trạng thái hoạt động và các thành phần trong pipeline (`["LSTM", "KnowledgeGraph", "RAG"]`) cùng trạng thái kết nối Neo4j.
- `GET` `/recommend?user_id=<id>&query=<text>&top_k=<k>`: Trả về các gợi ý sản phẩm dựa trên hành vi đồ thị, mô hình chuỗi LSTM và sự tương đồng ngữ nghĩa.
- `POST` `/chatbot` (Payload: `ChatbotRequest` chứa `query` và `user_id`): Nhận câu hỏi tự nhiên và trả về câu trả lời định dạng text giới thiệu kèm danh sách ID sản phẩm được đề xuất.

#### Các câu truy vấn Cypher giao tiếp với Neo4j:
- **Xóa toàn bộ dữ liệu đồ thị** (khi đồng bộ lại):
  ```cypher
  MATCH (n) DETACH DELETE n
  ```
- **Tạo nút Product**:
  ```cypher
  MERGE (p:Product {id: $id}) SET p.name = $name, p.category = $category, p.price = $price
  ```
- **Tạo nút User**:
  ```cypher
  MERGE (u:User {id: $id})
  ```
- **Tạo liên kết hành vi (VIEW / BUY) từ User đến Product**:
  ```cypher
  MATCH (u:User {id: $uid}), (p:Product {id: $pid})
  MERGE (u)-[r:BUY|VIEW]->(p)
  SET r.weight = coalesce(r.weight, 0) + 1
  ```
- **Tạo liên kết tương đồng (SIMILAR) giữa các sản phẩm cùng nhóm**:
  ```cypher
  MATCH (a:Product {id: $src}), (b:Product {id: $dst})
  MERGE (a)-[r:SIMILAR]->(b)
  SET r.weight = $w
  ```

#### Khởi tạo và tương tác với Vector DB (FAISS):
- **Khởi tạo**:
  Sử dụng `sklearn.feature_extraction.text.TfidfVectorizer` để vectơ hóa tài liệu mô tả sản phẩm (được ghép nối từ tên, mô tả và danh mục của sản phẩm). Dữ liệu ma trận đặc trưng sau đó được chuẩn hóa L2 và nạp vào chỉ mục tìm kiếm tích vô hướng của FAISS (`faiss.IndexFlatIP`):
  ```python
  docs = [f"{p.name}. {p.description}. Danh mục: {p.category}." for p in self.products]
  self.rag_product_order = [p.product_id for p in self.products]

  vectorizer = TfidfVectorizer(max_features=256, ngram_range=(1, 2))
  matrix = vectorizer.fit_transform(docs).toarray().astype("float32")

  # Chuẩn hóa ma trận vector L2
  norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-8
  matrix = matrix / norms

  # Đưa ma trận vào FAISS Flat IP Index
  index = faiss.IndexFlatIP(matrix.shape[1])
  index.add(matrix)
  ```
- **Truy vấn tìm kiếm tương đồng (Similarity Query)**:
  ```python
  q_vec = self.rag_vectorizer.transform([query]).toarray().astype("float32")
  q_norm = np.linalg.norm(q_vec, axis=1, keepdims=True) + 1e-8
  q_vec = q_vec / q_norm
  sims, ids = self.rag_index.search(q_vec, top_k)
  ```

#### Logic của RAG Pipeline & Cấu trúc LSTM:
- **RAG Pipeline (Mô phỏng cục bộ)**:
  Hệ thống không gọi tới các mô hình ngôn ngữ lớn (LLM) bên ngoài như OpenAI GPT hay Google Gemini. Thay vào đó, nó triển khai pipeline RAG nội bộ:
  1. Trích xuất ngữ cảnh (`category` mục tiêu, `budget` giới hạn, `tokens` từ khoá tìm kiếm) từ query của người dùng thông qua Regex và so khớp từ vựng (`_infer_query_context`).
  2. Thực hiện tính toán độ tương đồng qua FAISS (`_rag_scores`) kết hợp tính điểm ý định mua sắm (`_intent_scores`).
  3. Tổ hợp điểm số từ 4 thành phần: LSTM (`w_lstm`), Đồ thị (`w_graph`), RAG FAISS (`w_rag`), và Điểm ý định (`w_intent`) với các trọng số thay đổi tùy thuộc vào việc có query rõ ràng từ người dùng hay không.
  4. Tạo câu trả lời dạng văn bản tự nhiên bằng cách điền thông tin sản phẩm có điểm số cao nhất vào một biểu mẫu câu trả lời cố định (Template) để phản hồi khách hàng trong API `/chatbot`.
- **Cấu trúc mô hình LSTM (PyTorch)**:
  Mô hình dự đoán hành vi chuỗi tương tác sản phẩm tiếp theo được định nghĩa bằng lớp `LSTMModel`:
  ```python
  class LSTMModel(nn.Module):
      def __init__(self, input_dim: int, hidden_dim: int = 64, output_dim: int = 100):
          super().__init__()
          self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
          self.fc = nn.Linear(hidden_dim, output_dim)

      def forward(self, x):
          # x là tensor one-hot biểu diễn chuỗi lịch sử tương tác sản phẩm (kích thước tối đa 5)
          out, _ = self.lstm(x)
          # Lấy trạng thái ẩn ở bước thời gian cuối cùng
          out = out[:, -1, :]
          # Phân loại đầu ra xác định ID sản phẩm dự kiến tiếp theo
          return self.fc(out)
  ```
