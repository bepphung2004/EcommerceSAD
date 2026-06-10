# Báo cáo bổ sung dự án E-Commerce Microservices + AI Service

## Chương 2. Phát triển Hệ E-Commerce Microservices

### 2.1 Xác định yêu cầu

#### 2.1.1 Functional Requirements
- Quản lý sản phẩm đa domain: book, electronics, fashion.
- Quản lý người dùng theo vai trò: admin, staff, customer.
- Quản lý giỏ hàng (cart): xem giỏ, thêm sản phẩm, xóa sản phẩm.
- Quản lý đơn hàng (order): tạo đơn, xem danh sách đơn theo user.
- Thanh toán (payment): tạo bản ghi thanh toán, truy vấn trạng thái.
- Giao hàng (shipping): tạo shipment, truy vấn trạng thái vận chuyển.
- Tìm kiếm và gợi ý sản phẩm:
  - Tìm kiếm theo frontend.
  - Gợi ý/Chatbot bằng AI service.

#### 2.1.2 Non-functional Requirements
- Scalability: scale từng service độc lập theo tải.
- High Availability: service tách biệt, có thể restart từng phần.
- Security: JWT authentication, RBAC tại gateway.
- Maintainability: tách theo bounded context, code độc lập theo service.

### 2.2 Phân rã hệ thống theo DDD

#### 2.2.1 Bounded Context
- User Context -> user-service.
- Product Context -> product-service.
- Cart Context -> cart-service.
- Order Context -> order-service.
- Payment Context -> payment-service.
- Shipping Context -> shipping-service.
- AI Context -> ai-service.

#### 2.2.2 Nguyên tắc
- Mỗi bounded context có model và API riêng.
- Mỗi service dùng database riêng, không truy cập trực tiếp DB của service khác.
- Giao tiếp liên service qua HTTP REST.
- API Gateway làm entry point cho frontend.
- JWT xác thực và phân quyền tập trung ở gateway + kiểm tra tại service.

### 2.3 Thiết kế Product Service (Django)

#### 2.3.1 Phân loại sản phẩm
- Book: sách kỹ thuật, sách học thuật.
- Electronics: laptop, smartphone, tai nghe.
- Fashion: áo thun, giày, balo.

#### 2.3.2 Model tổng quát
- Category: phân loại danh mục tổng.
- Product: model lõi dùng chung cho mọi domain, chứa thông tin cơ bản và thương mại:
  - sku, slug, name, short_description, description
  - brand, image_url
  - price, discount_percent, stock, sold_count
  - rating_avg, rating_count, is_active
  - category (FK), domain (book/electronics/fashion)

#### 2.3.3 Chi tiết theo domain
- Book
  - product (OneToOne), author, publisher, isbn, pages, language, published_year.
- Electronics
  - product (OneToOne), brand, warranty, model_name, ram, storage, chip, screen_size, battery, origin.
- Fashion
  - product (OneToOne), size, color, material, gender, style.

#### 2.3.4 API
- GET/POST /categories/
- GET/PUT/PATCH/DELETE /categories/{id}/
- GET/POST /products/
- GET/PUT/PATCH/DELETE /products/{id}/
- Quyền: đọc public, ghi cần xác thực.

### 2.4 Thiết kế User Service (Django)

#### 2.4.1 Phân loại người dùng
- Admin: quyền toàn hệ thống.
- Staff: vận hành nghiệp vụ (quản lý đơn, giao hàng, sản phẩm...).
- Customer: mua sắm, cart, order, payment, shipping, AI recommend/chatbot.

#### 2.4.2 Model
- User kế thừa AbstractUser.
- Thuộc tính bổ sung chính: role (admin/staff/customer).
- Trường kế thừa từ Django: username, email, password, is_active...

#### 2.4.3 Phân quyền (RBAC)
- Admin:
  - Toàn quyền trên mọi prefix API.
- Staff:
  - products, categories, orders, payment, shipping, users.
- Customer:
  - products, categories, cart, orders, payment, shipping, recommend, chatbot.

#### 2.4.4 API
- POST /auth/register
- POST /auth/login
- GET /users/

### 2.5 Thiết kế Cart Service

#### 2.5.1 Model
- Cart: user_id (unique).
- CartItem: cart (FK), product_id, quantity.

#### 2.5.2 Logic
- Mỗi user một cart.
- Add item:
  - nếu item chưa tồn tại trong cart thì tạo mới.
  - nếu đã tồn tại thì cộng dồn quantity.
- Remove item:
  - xóa item theo product_id.
- View cart:
  - trả cart và danh sách items.

#### 2.5.3 API
- GET /cart/
- POST /cart/add
- DELETE /cart/remove

### 2.6 Thiết kế Order Service

#### 2.6.1 Model
- Order:
  - user_id, total_price, status.
  - status: pending, paid, failed, shipping, delivered.
- OrderItem:
  - order (FK), product_id, quantity, price.

#### 2.6.2 Workflow
- User tạo order với danh sách items.
- Service tính total_price từ sum(price * quantity).
- Gọi payment-service để thanh toán.
- Nếu payment thành công:
  - cập nhật order.status = paid.
  - gọi shipping-service tạo shipment.
- Nếu payment thất bại:
  - cập nhật order.status = failed.

### 2.7 Thiết kế Payment Service

#### 2.7.1 Model
- Payment:
  - order_id, amount, status.

#### 2.7.2 Trạng thái
- pending
- success
- failed

#### 2.7.3 API
- POST /payment/pay
- GET /payment/status?order_id=...

### 2.8 Thiết kế Shipping Service

#### 2.8.1 Model
- Shipment:
  - order_id, address, status.

#### 2.8.2 Trạng thái
- processing
- shipping
- delivered

#### 2.8.3 API
- POST /shipping/create
- GET /shipping/status?order_id=...

### 2.9 Luồng hệ thống tổng thể
- User login -> nhận JWT token.
- Frontend gọi API qua gateway với Bearer token.
- User duyệt sản phẩm, thêm cart, tạo order.
- Order service gọi payment + shipping.
- AI service phục vụ recommend/chatbot theo query và lịch sử.

### 2.10 Hướng dẫn thực hành

#### 2.10.1 Class Diagram
- Tách class theo bounded context:
  - User: User.
  - Product: Category, Product, Book, Electronics, Fashion.
  - Cart: Cart, CartItem.
  - Order: Order, OrderItem.
  - Payment: Payment.
  - Shipping: Shipment.
- Quan hệ chính:
  - Category 1-n Product.
  - Product 1-1 Book/Electronics/Fashion.
  - Cart 1-n CartItem.
  - Order 1-n OrderItem.

#### 2.10.2 Mapping Class Diagram sang Database
- Mỗi class domain thành table độc lập.
- Quan hệ 1-n thành FK ở bảng con.
- Quan hệ 1-1 theo OneToOne key.
- Enum status/role mapping về CharField choices.

#### 2.10.3 Thiết kế Database cho từng Service

1. Product Service Database (PostgreSQL)

```sql
CREATE TABLE category (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE product (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(40) UNIQUE NOT NULL,
  slug VARCHAR(280) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_description VARCHAR(255),
  description TEXT,
  brand VARCHAR(120),
  image_url VARCHAR(500),
  price DOUBLE PRECISION NOT NULL,
  discount_percent SMALLINT NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL,
  sold_count INTEGER NOT NULL DEFAULT 0,
  rating_avg DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  domain VARCHAR(20) NOT NULL CHECK (domain IN ('book', 'electronics', 'fashion')),
  category_id BIGINT NOT NULL REFERENCES category(id) ON DELETE CASCADE
);

CREATE TABLE book (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT UNIQUE NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255) NOT NULL,
  isbn VARCHAR(20) NOT NULL,
  pages INTEGER NOT NULL DEFAULT 0,
  language VARCHAR(80),
  published_year INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE electronics (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT UNIQUE NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  warranty INTEGER NOT NULL,
  model_name VARCHAR(120),
  ram VARCHAR(40),
  storage VARCHAR(40),
  chip VARCHAR(120),
  screen_size VARCHAR(30),
  battery VARCHAR(60),
  origin VARCHAR(80)
);

CREATE TABLE fashion (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT UNIQUE NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  material VARCHAR(80),
  gender VARCHAR(30),
  style VARCHAR(80)
);
```

2. User Service Database (MySQL)

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(150) NOT NULL UNIQUE,
  email VARCHAR(254),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  date_joined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

3. Cart Service (MySQL)

```sql
CREATE TABLE cart (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE
);

CREATE TABLE cart_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);
```

4. Order Service (MySQL)

```sql
CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_price DOUBLE NOT NULL DEFAULT 0,
  status ENUM('pending', 'paid', 'failed', 'shipping', 'delivered') NOT NULL DEFAULT 'pending'
);

CREATE TABLE order_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  price DOUBLE NOT NULL,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

5. Payment Service (MySQL)

```sql
CREATE TABLE payment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  amount DOUBLE NOT NULL,
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending'
);
```

6. Shipping Service (MySQL)

```sql
CREATE TABLE shipment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  address TEXT NOT NULL,
  status ENUM('processing', 'shipping', 'delivered') NOT NULL DEFAULT 'processing'
);
```

## Chương 3. AI Service cho tư vấn sản phẩm

### 3.1 Mục tiêu
Xây dựng hệ thống AI gợi ý sản phẩm dựa trên:
- Hành vi người dùng (view, click, add_to_cart, search).
- Quan hệ sản phẩm (similarity graph).
- Ngữ cảnh truy vấn (chatbot query).

Output:
- Danh sách sản phẩm đề xuất.
- Chatbot tư vấn.

### 3.2 Kiến trúc AI Service
AI Service là microservice độc lập (FastAPI):
- Input: user behavior, user query.
- Processing:
  - LSTM model.
  - Knowledge Graph (in-memory + Neo4j sync).
  - RAG (TF-IDF + FAISS).
- Output: recommendation list hoặc chatbot response.

### 3.3 Thu thập dữ liệu

#### 3.3.1 User Behavior Data
- user_id
- product_id
- action (view, click, add_to_cart, search)
- timestamp
- query (với hành vi search)

#### 3.3.2 Dataset
Cấu trúc CSV:
- user_id, product_id, action, timestamp, query

Dữ liệu được sinh tổng hợp nếu chưa có file behavior.

### 3.4 Mô hình LSTM (Sequence Modeling)

#### 3.4.1 Ý tưởng
Dự đoán sản phẩm tiếp theo dựa trên chuỗi hành vi gần nhất của user.

#### 3.4.2 Model chi tiết

```py
import torch.nn as nn


class LSTMModel(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 64, output_dim: int = 100):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.fc(out)


Giải thích:
- Input: tensor one-hot theo sequence hành vi, đã padding về seq_len = 5.
- LSTM học ngữ cảnh chuỗi; lấy hidden state bước cuối để dự đoán next-item.
- Linear layer ánh xạ sang không gian product classes.

#### 3.4.3 Training

```python
import os
import torch
import torch.nn as nn


def train_lstm(model: LSTMModel, x_train: torch.Tensor, y_train: torch.Tensor):
  criterion = nn.CrossEntropyLoss()
  optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

  model.train()
  epochs = int(os.getenv("LSTM_EPOCHS", "18"))

  for _ in range(epochs):
    optimizer.zero_grad()
    output = model(x_train)
    loss = criterion(output, y_train)
    loss.backward()
    optimizer.step()

  model.eval()
  return model
```

Gợi ý dữ liệu train:
- `x_train`: shape `(batch, seq_len, input_dim)`.
- `y_train`: class index của sản phẩm tiếp theo.

### 3.5 Knowledge Graph với Neo4j

#### 3.5.1 Mô hình đồ thị
- Node:
  - User(id)
  - Product(id, name, category, price)
- Edge:
  - BUY (từ hành vi add_to_cart)
  - VIEW (từ view/click)
  - SIMILAR (theo nhóm category)

#### 3.5.2 Ví dụ Cypher
- Tạo node product:
  - MERGE (p:Product {id: $id}) SET p.name = $name, p.category = $category, p.price = $price
- Tạo quan hệ user-view:
  - MATCH (u:User {id: $uid}), (p:Product {id: $pid})
    MERGE (u)-[r:VIEW]->(p)
    SET r.weight = coalesce(r.weight, 0) + 1
- Tạo quan hệ tương tự:
  - MATCH (a:Product {id: $src}), (b:Product {id: $dst})
    MERGE (a)-[r:SIMILAR]->(b)
    SET r.weight = $w

#### 3.5.3 Truy vấn gợi ý

```cypher
// Top sản phẩm gợi ý cho 1 user dựa trên BUY/VIEW + SIMILAR
MATCH (u:User {id: $user_id})-[r1:BUY|VIEW]->(p1:Product)-[r2:SIMILAR]->(p2:Product)
WHERE NOT (u)-[:BUY|VIEW]->(p2)
WITH p2,
     sum(coalesce(r1.weight, 1.0) * coalesce(r2.weight, 1.0)) AS score
RETURN p2.id AS product_id,
       p2.name AS product_name,
       p2.category AS category,
       score
ORDER BY score DESC
LIMIT $top_k;
```

```cypher
// Top sản phẩm tương tự từ 1 sản phẩm nguồn (dùng khi user vừa click/search)
MATCH (:Product {id: $source_product_id})-[r:SIMILAR]->(p:Product)
RETURN p.id AS product_id,
       p.name AS product_name,
       p.category AS category,
       coalesce(r.weight, 0) AS score
ORDER BY score DESC
LIMIT $top_k;
```

Ghi chú vận hành:
- Nếu Neo4j chưa sẵn sàng, hệ thống tự fallback sang graph in-memory để không gián đoạn recommend.

### 3.6 RAG (Retrieval-Augmented Generation)

#### 3.6.1 Pipeline
- Chuẩn hóa mô tả sản phẩm thành documents.
- Embedding TF-IDF.
- Index vector bằng FAISS.
- Truy hồi top-k theo query.

#### 3.6.2 Vector Database
- FAISS IndexFlatIP.
- Dùng cosine-like similarity qua vector normalization.

#### 3.6.3 Ví dụ
query = "laptop gia re"
results = vector_db.search(query)
response = LLM.generate(results)

### 3.7 Kết hợp Hybrid Model
- LSTM: dự đoán hành vi kế tiếp.
- Graph: khai thác quan hệ và sở thích.
- RAG: bám ngữ nghĩa query.

Final Recommendation:
- final_score = 0.45 * lstm + 0.35 * graph + 0.20 * rag

### 3.8 Hai dạng AI Service

#### 3.8.1 Recommendation List
Use cases:
- Khi user search sản phẩm.
- Khi cần gợi ý theo ngữ cảnh gần đây.

API:
- GET /recommend?user_id=...&query=...&top_k=...

Output:
- recommendations: danh sách product_id.
- components: top score theo lstm/graph/rag.

#### 3.8.2 Chatbot tư vấn
Input ví dụ:
- toi can laptop gia re

Pipeline:
- recommend top 3 theo hybrid score.
- tạo câu trả lời ngôn ngữ tự nhiên từ danh sách sản phẩm.

API:
- POST /chatbot

Output:
- answer: đoạn tư vấn dạng text.
- recommendations: product_id list.

### 3.9 Triển khai AI Service

#### 3.9.1 Tech stack
- FastAPI
- PyTorch
- Pandas + NumPy
- scikit-learn (TF-IDF)
- FAISS
- Neo4j Python Driver

#### 3.9.2 Kiến trúc
- ai-service chạy độc lập trong Docker.
- Dữ liệu behavior lưu file CSV trong thư mục data.
- Đồng bộ graph qua Neo4j nếu kết nối sẵn sàng.
- Expose endpoint health/recommend/chatbot.

## Chương 4. Xây dựng hệ thống hoàn chỉnh

### 4.1 Kiến trúc tổng thể

#### 4.1.1 Mô hình hệ thống
Hệ thống theo microservices, mỗi service là Django project độc lập (trừ AI/gateway/frontend):
- API Gateway (FastAPI, vai trò reverse proxy + auth gateway)
- user-service (Django)
- product-service (Django)
- cart-service (Django)
- order-service (Django)
- payment-service (Django)
- shipping-service (Django)
- ai-service (FastAPI/Python)
- frontend (React + Vite)

Lưu ý:
- Mẫu lý thuyết có thể nêu Nginx gateway.
- Triển khai thực tế dự án hiện tại dùng FastAPI gateway để xử lý JWT + RBAC + proxy.

#### 4.1.2 Nguyên tắc
- Mỗi service có database riêng.
- Giao tiếp qua REST API.
- Không truy cập DB của service khác.

### 4.2 System Architecture

#### 4.2.1 Overview
The proposed system, named `ecom-final`, is designed as a fully distributed microservice-based e-commerce platform.
The architecture follows modern enterprise design principles to ensure scalability, maintainability, and fault isolation.

Each core business domain is implemented as an independent Django REST microservice, while an API Gateway layer manages routing, authentication, and system-wide policies.
In this implementation, the gateway layer is built with FastAPI (and can be fronted by NGINX in production).

#### 4.2.2 Microservice Architecture
The system consists of the following core services:
- User Service: handles authentication, authorization, and user management.
- Product Service: manages product catalog, categories, and inventory.
- Cart Service: manages user cart and cart items.
- Order Service: processes order lifecycle and orchestrates payment/shipping flow.
- Payment Service: handles payment transactions and payment status.
- Shipping Service: handles shipment creation and delivery tracking.
- AI Service: provides recommendation and chatbot capabilities using LSTM + Graph + RAG.

Each service is independently deployable and maintains its own database, following the database-per-service principle.

#### 4.2.3 API Gateway
An API Gateway layer is introduced as the single entry point for all client requests.
The gateway is responsible for:
- Routing incoming requests to appropriate microservices.
- Handling authentication using JSON Web Tokens (JWT).
- Enforcing RBAC and security policies.
- Centralizing cross-cutting concerns such as CORS and request forwarding.

In the current system, the API Gateway is implemented using FastAPI reverse-proxy logic.
For production hardening, NGINX can be added as an outer edge proxy in front of FastAPI gateway.

#### 4.2.4 Service Communication
The system adopts a hybrid communication strategy:
- Synchronous communication: RESTful APIs over HTTP for real-time operations.
- Internal orchestration: order-service synchronously calls payment-service and shipping-service.
- Asynchronous extension (future-ready): message queue (Redis/RabbitMQ/Kafka) for event-driven workflows such as notification or analytics.

For example, when an order is created, payment is executed immediately, then shipment is created upon payment success.

#### 4.2.5 Containerization and Deployment
All services are containerized using Docker to ensure consistency across environments.
The system is orchestrated using Docker Compose in development and can be extended to Kubernetes for production deployment.

#### 4.2.6 System Structure
```text
ecom-final/
|-- gateway/
|   |-- main.py                # core routing/auth policy
|   |-- nginx.conf             # optional edge-proxy config (if enabled)
|-- user-service/              # admin/staff/customer
|-- product-service/           # multi-domain catalog: book/electronics/fashion
|-- cart-service/
|-- order-service/
|-- payment-service/
|-- shipping-service/
|-- ai-service/
|-- frontend/
|-- infrastructure/
|   |-- docker-compose.yml
```

#### 4.2.7 Design Principles
The architecture adheres to the following principles:
- Loose Coupling: services interact through APIs only.
- High Cohesion: each service encapsulates one business domain.
- Scalability: each service can be scaled independently.
- Fault Isolation: failure in one service is isolated from others.
- Database-per-Service: no direct cross-service database access.

#### 4.2.8 Security Considerations
Security is enforced through:
- JWT-based authentication.
- API Gateway validation before request forwarding.
- Role-based access control (RBAC) for admin/staff/customer.
- Public-route restriction (only login/register and public product reads).

#### 4.2.9 Discussion
Compared to a monolithic architecture, this microservice design significantly improves flexibility, scalability, and deployment independence.
However, it introduces additional complexity in service coordination, startup ordering, and observability.
These concerns are mitigated through containerization, restart policies, and standardized HTTP communication contracts.

### 4.3 API Gateway (Nginx)

#### 4.3.1 Vai trò
- Đóng vai trò cổng vào hệ thống.
- Định tuyến request đến đúng service.
- Áp policy bảo mật tập trung.

#### 4.3.2 Cấu hình mẫu
- Trong dự án hiện tại, logic tương đương Nginx được triển khai bằng FastAPI gateway:
  - map prefix -> service URL.
  - kiểm tra JWT.
  - check RBAC.
  - forward body/query/header phù hợp.

### 4.4 Authentication (JWT)

#### 4.4.1 Cài đặt
- User service dùng SimpleJWT cho login/register.

#### 4.4.2 Cấu hình
- JWT secret/algorithm cấu hình qua biến môi trường.
- Token payload bổ sung role và username.

#### 4.4.3 Luồng
- User login -> nhận access/refresh token.
- Frontend gửi Bearer token qua gateway.
- Gateway decode token -> kiểm tra quyền -> chuyển tiếp request.

### 4.5 Giao tiếp giữa các Service

#### 4.5.1 REST API call
- Gateway -> tất cả service domain.
- Order -> Payment -> Shipping theo workflow đặt hàng.

### 4.6 Docker hóa hệ thống

#### 4.6.1 Dockerfile (Django)
Mỗi Django service dùng Dockerfile riêng, pattern chính:
- Base image python slim.
- Cài requirements.
- Chạy migrate.
- Chạy server (runserver).

### 4.7 Luồng hệ thống (End-to-End)

#### 4.7.1 Use case: Mua hàng
- Login customer.
- Xem/lọc sản phẩm.
- Add vào cart.
- Tạo order.
- Payment success.
- Tạo shipment.
- Theo dõi trạng thái.

#### 4.7.2 Sequence logic
- FE -> Gateway: login.
- FE -> Gateway -> Product: list/search.
- FE -> Gateway -> Cart: add/remove/get.
- FE -> Gateway -> Order: create.
- Order -> Payment: pay.
- Order -> Shipping: create shipment.
- FE -> Gateway -> AI: recommend/chatbot.

### 4.10 Đánh giá hệ thống

#### 4.10.1 Hiệu năng
- Query đơn giản theo từng domain chạy ổn trong môi trường local Docker.
- AI pipeline đáp ứng thời gian thực ở mức demo/đồ án.

#### 4.10.2 Khả năng mở rộng
- Có thể scale riêng product-service hoặc ai-service khi tải tăng.
- Có thể thay thế từng service mà không ảnh hưởng toàn bộ hệ thống.

#### 4.10.3 Ưu điểm
- Kiến trúc rõ ràng theo DDD + microservices.
- Bảo mật tập trung JWT + RBAC.
- AI tích hợp hybrid LSTM + Graph + RAG.
- Mỗi service độc lập DB, giảm coupling.

#### 4.10.4 Nhược điểm
- Triển khai/phối hợp nhiều service phức tạp hơn monolith.
- Cần theo dõi kỹ startup order và health-check giữa DB/service.
- Độ trễ network tăng do gọi liên service.

## Phụ lục. Hướng dẫn vẽ VP Diagram cho dự án (thực thể, thuộc tính, quan hệ)

### A. Danh sách thực thể cần vẽ
- User
- Category
- Product
- Book
- Electronics
- Fashion
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Shipment
- ProductNode (cho Knowledge Graph, mức khái niệm)
- UserNode (cho Knowledge Graph, mức khái niệm)

### B. Thuộc tính chi tiết từng thực thể

1. User
- id, username, email, password, role, is_active, date_joined

2. Category
- id, name

3. Product
- id, sku, slug, name, short_description, description
- brand, image_url
- price, discount_percent, stock, sold_count
- rating_avg, rating_count, is_active
- domain
- category_id

4. Book
- id, product_id, author, publisher, isbn, pages, language, published_year

5. Electronics
- id, product_id, brand, warranty, model_name, ram, storage, chip, screen_size, battery, origin

6. Fashion
- id, product_id, size, color, material, gender, style

7. Cart
- id, user_id

8. CartItem
- id, cart_id, product_id, quantity

9. Order
- id, user_id, total_price, status

10. OrderItem
- id, order_id, product_id, quantity, price

11. Payment
- id, order_id, amount, status

12. Shipment
- id, order_id, address, status

13. UserNode (graph)
- id

14. ProductNode (graph)
- id, name, category, price

### C. Quan hệ cần vẽ

#### C.1 Quan hệ trong hệ nghiệp vụ
- Category (1) -> (N) Product
- Product (1) -> (1) Book (optional theo domain)
- Product (1) -> (1) Electronics (optional theo domain)
- Product (1) -> (1) Fashion (optional theo domain)
- User (1) -> (1) Cart
- Cart (1) -> (N) CartItem
- User (1) -> (N) Order
- Order (1) -> (N) OrderItem
- Order (1) -> (N) Payment (thực tế thường lấy bản ghi mới nhất)
- Order (1) -> (N) Shipment (thực tế thường lấy bản ghi mới nhất)

#### C.2 Quan hệ trong Knowledge Graph
- UserNode -[VIEW]-> ProductNode
- UserNode -[BUY]-> ProductNode
- ProductNode -[SIMILAR]-> ProductNode

### D. Cách vẽ nhanh trên Visual Paradigm
1. Tạo Class Diagram cho domain nghiệp vụ.
2. Tạo package theo context: User/Product/Cart/Order/Payment/Shipping/AI.
3. Vẽ entity và thêm attributes theo mục B.
4. Nối association theo mục C, đặt multiplicity rõ ràng (1, 0..1, 0..*, 1..*).
5. Với Product, mô tả specialization:
- Product là class cha.
- Book/Electronics/Fashion là class con theo domain.
6. Tạo thêm diagram riêng cho AI Graph (UserNode, ProductNode, VIEW/BUY/SIMILAR).
7. Export PNG/PDF để đưa vào báo cáo.

### E. Khuyến nghị trình bày báo cáo
- Đặt 3 hình tối thiểu:
  - Domain Class Diagram.
  - Sequence Diagram use case mua hàng.
  - Deployment Diagram microservices + DB + gateway + AI + Neo4j.
- Mỗi hình có mô tả ngắn:
  - Mục tiêu.
  - Thành phần chính.
  - Dữ liệu trao đổi chính.
