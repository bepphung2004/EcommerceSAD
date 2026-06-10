# HỒ SƠ THIẾT KẾ KIẾN TRÚC & BIỂU ĐỒ HỆ THỐNG (SYSTEM DIAGRAMS)

Tài liệu này cung cấp các biểu đồ thiết kế hệ thống chi tiết sử dụng mã nguồn **Mermaid.js** để minh họa trực quan kiến trúc Microservices của **QuickMall**. 

Hệ thống được phát triển trên kiến trúc phân tán (Distributed Microservices Architecture) tích hợp trí tuệ nhân tạo (AI Context Engine) bao gồm 7 dịch vụ độc lập, giao tiếp với nhau qua Gateway API thống nhất.

---

## 1. BIỂU ĐỒ LỚP (CLASS DIAGRAMS) CHO TỪNG BỘ BỒI CẢNH (BOUNDED CONTEXT)

Mỗi Context/Service sở hữu một cơ sở dữ liệu riêng biệt đảm bảo tính độc lập dữ liệu tối đa. Dưới đây là các lớp thực thể (Entity Classes) được định nghĩa chi tiết trong từng dịch vụ.

### 1.1 Dịch Vụ Người Dùng (user-service Context)
Quản lý hồ sơ người dùng và cơ chế kiểm soát truy cập dựa trên vai trò (RBAC - Role-Based Access Control) với các actor: `admin`, `staff`, `customer`.

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string password
        +string role
        +datetime created_at
        +datetime updated_at
        +register() bool
        +login() string
    }
```

### 1.2 Dịch Vụ Sản Phẩm (product-service Context)
Lưu trữ thông tin chi tiết về sản phẩm. Đặc biệt sử dụng thiết kế phân cấp loại hình hàng hóa chuyên biệt thông qua liên kết `One-to-One` nối dài từ thực thể sản phẩm chung sang các bảng đặc tả tên miền (`domain`).

```mermaid
classDiagram
    class Category {
        +int id
        +string name
        +string slug
    }
    
    class Product {
        +int id
        +string name
        +string slug
        +string sku
        +string short_description
        +string description
        +string brand
        +string image_url
        +float price
        +int discount_percent
        +int stock
        +int sold_count
        +float rating_avg
        +int rating_count
        +bool is_active
        +string domain
        +Category category
        +get_final_price() float
    }
    
    class Book {
        +Product product
        +string author
        +string publisher
        +string isbn
        +int pages
        +string language
        +int published_year
    }
    
    class Electronics {
        +Product product
        +string brand
        +int warranty
        +string model_name
        +string ram
        +string storage
        +string chip
        +string screen_size
        +string battery
        +string origin
    }
    
    class Fashion {
        +Product product
        +string size
        +string color
        +string material
        +string gender
        +string style
    }

    Product "*" --> "1" Category : belongs to
    Book --|> Product : extends (OneToOne)
    Electronics --|> Product : extends (OneToOne)
    Fashion --|> Product : extends (OneToOne)
```

### 1.3 Dịch Vụ Giỏ Hàng (cart-service Context)
Thực hiện các thao tác tạm thời liên quan đến việc chọn lọc hàng hóa của người dùng trước khi tiến hành thanh toán.

```mermaid
classDiagram
    class Cart {
        +int id
        +int user_id
        +datetime created_at
        +datetime updated_at
        +add_item(product_id, quantity) bool
        +remove_item(product_id) bool
        +clear() bool
    }
    
    class CartItem {
        +int id
        +Cart cart
        +int product_id
        +int quantity
        +datetime created_at
    }
    
    Cart "1" *-- "*" CartItem : contains
```

### 1.4 Dịch Vụ Đơn Hàng (order-service Context)
Quản lý toàn bộ vòng đời của đơn hàng trong hệ thống. Cung cấp bộ lọc đơn hàng theo vai trò thực hiện (Admin & Staff được quyền xem toàn bộ hệ thống đơn hàng, khách hàng thường chỉ thấy đơn hàng của chính mình).

```mermaid
classDiagram
    class Order {
        +int id
        +int user_id
        +string address
        +float total_price
        +string status
        +datetime created_at
        +datetime updated_at
        +create_order() object
        +update_status(new_status) bool
    }
    
    class OrderItem {
        +int id
        +Order order
        +int product_id
        +int quantity
        +float price
    }
    
    Order "1" *-- "*" OrderItem : contains
```

### 1.5 Dịch Vụ Thanh Toán (payment-service Context)
Đảm nhận việc xử lý dòng tiền thông qua các cổng thanh toán tích hợp (COD, Momo, Thẻ ngân hàng).

```mermaid
classDiagram
    class Payment {
        +int id
        +int order_id
        +float amount
        +string payment_channel
        +string status
        +string transaction_id
        +datetime created_at
        +process_payment() bool
        +get_status() string
    }
```

### 1.6 Dịch Vụ Giao Hàng (shipping-service Context)
Giám sát và cập nhật lộ trình di chuyển của hàng hóa sau khi được bộ phận Staff phê duyệt xuất kho.

```mermaid
classDiagram
    class Shipment {
        +int id
        +int order_id
        +string carrier
        +string tracking_number
        +string status
        +string address
        +datetime updated_at
        +datetime created_at
        +create_shipment() object
        +update_tracking(new_status) bool
    }
```

### 1.7 Dịch Vụ Trí Tuệ Nhân Tạo (ai-service Context)
Động cơ AI lai thông minh (Hybrid AI Engine), kết hợp mô hình học sâu LSTM xử lý chuỗi hành vi, cơ sở dữ liệu đồ thị Neo4j kết nối các điểm nút liên quan và cơ chế tìm kiếm ngữ nghĩa FAISS RAG phục vụ tư vấn trực tiếp.

```mermaid
classDiagram
    class HybridAIEngine {
        +List products
        +dict user_histories
        +LSTMModel lstm_model
        +faiss_Index rag_index
        +driver neo4j_driver
        +initialize() void
        +recommend(user_id, query, top_k) dict
        +chatbot(user_id, query) dict
    }
    
    class LSTMModel {
        +nn_LSTM lstm
        +nn_Linear fc
        +forward(x) tensor
    }
    
    class ProductAI {
        +int product_id
        +string name
        +string category
        +float price
        +string description
    }
    
    HybridAIEngine *-- LSTMModel : integrates
    HybridAIEngine o-- ProductAI : catalog reference
```

---

## 2. BIỂU ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS) CHO CÁC LUỒNG CHỨC NĂNG CHÍNH

Dưới đây là 4 luồng nghiệp vụ cốt lõi thể hiện sự tương tác thời gian thực giữa các thành phần trong hệ thống QuickMall từ Client đến các lớp Database.

### Luồng 1: Đăng ký & Đăng nhập Hệ thống (Authentication Flow)
Mô tả tiến trình xác thực thông tin tài khoản và phân phối JWT token dựa trên vai trò để định tuyến giao diện người dùng.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant UserService as user-service
    participant UserDB as user-db

    Customer->>Frontend: Nhập thông tin đăng nhập
    Frontend->>Gateway: POST /api/auth/login
    Gateway->>UserService: POST /auth/login
    UserService->>UserDB: Truy vấn thông tin tài khoản
    UserDB-->>UserService: Trả về bản ghi User thông tin vai trò (role)
    
    alt Thông tin xác thực chính xác
        UserService-->>Gateway: HTTP 200 (Trả về JWT Access Token chứa claim: user_id, role)
        Gateway-->>Frontend: Trả về JWT Token & Thông tin User
        Frontend-->>Customer: Đăng nhập thành công, tự động điều hướng sang trang tương ứng (Shop/Admin)
    else Thông tin xác thực sai
        UserService-->>Gateway: HTTP 401 Unauthorized
        Gateway-->>Frontend: Trả về mã lỗi 401
        Frontend-->>Customer: Hiển thị thông báo tài khoản/mật khẩu sai
    end
```

### Luồng 2: Mua sắm & Thêm Giỏ Hàng (Shopping & Add to Cart)
Mô tả cách thức người dùng tìm kiếm sản phẩm và thêm vào giỏ hàng cá nhân lưu trữ trong MySQL độc lập.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant ProductService as product-service
    participant ProductDB as product-db
    participant CartService as cart-service
    participant CartDB as cart-db

    Customer->>Frontend: Mở trang Shop (Mua sắm)
    Frontend->>Gateway: GET /api/products/
    Gateway->>ProductService: GET /products/
    ProductService->>ProductDB: Truy vấn các sản phẩm đang hiển thị (31 sản phẩm)
    ProductDB-->>ProductService: Danh sách sản phẩm đầy đủ thông tin
    ProductService-->>Gateway: Phản hồi danh sách sản phẩm
    Gateway-->>Frontend: Trả về dữ liệu sản phẩm
    Frontend-->>Customer: Hiển thị sản phẩm dạng lưới ( aspect-square, badges giá)

    Customer->>Frontend: Bấm chọn "Thêm vào giỏ"
    Frontend->>Gateway: POST /api/cart/add (product_id, quantity)
    Gateway->>CartService: POST /cart/add (Kèm JWT Header)
    CartService->>CartDB: Cập nhật CartItem (cart_id, product_id, quantity)
    CartDB-->>CartService: Xác nhận thành công
    CartService-->>Gateway: Trả về chi tiết giỏ hàng cập nhật
    Gateway-->>Frontend: Phản hồi cấu trúc giỏ hàng mới
    Frontend-->>Customer: Hiển thị Toast thông báo, tăng số lượng badge trên Header
```

### Luồng 3: Thanh toán & Xử lý Đơn hàng (Checkout & Fulfillment)
Tiến trình giao dịch mua bán, xử lý tự động chuỗi thanh toán, giao nhận, và cơ chế phê duyệt trạng thái từ vai trò Staff.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    actor AdminStaff as Admin/Staff
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant CartService as cart-service
    participant OrderService as order-service
    participant OrderDB as order-db
    participant PaymentService as payment-service
    participant PaymentDB as payment-db
    participant ShippingService as shipping-service
    participant ShippingDB as shipping-db

    Customer->>Frontend: Mở Giỏ hàng, nhập địa chỉ nhận hàng & Bấm "Tạo đơn hàng"
    Frontend->>Gateway: POST /api/orders/ (items, address)
    Gateway->>OrderService: POST /orders/ (JWT Token)
    OrderService->>OrderDB: Tạo bản ghi Order & OrderItem (status: pending)
    OrderDB-->>OrderService: Trả về mã định danh đơn hàng (#123)
    
    OrderService->>Gateway: Kích hoạt luồng thanh toán và vận chuyển tự động
    Gateway->>PaymentService: POST /payment/ (order_id, amount)
    PaymentService->>PaymentDB: Tạo Payment (status: pending)
    PaymentDB-->>PaymentService: Phản hồi OK
    
    Gateway->>ShippingService: POST /shipping/ (order_id, address)
    ShippingService->>ShippingDB: Tạo Shipment hành trình (status: pending)
    ShippingDB-->>ShippingService: Phản hồi OK

    OrderService-->>Gateway: Đơn hàng hoàn tất khởi tạo (#123)
    Gateway-->>Frontend: Trả về mã đơn hàng thành công
    Frontend-->>Customer: Chuyển hướng sang danh sách đơn hàng, hiển thị lộ trình Timeline đang chờ duyệt

    Note over AdminStaff, ShippingService: Luồng Quản trị & Phê duyệt vận chuyển (Admin/Staff)
    AdminStaff->>Frontend: Vào "Bàn làm việc" (Admin Panel), chọn tab "Đơn hàng", duyệt thanh toán/vận chuyển
    Frontend->>Gateway: PATCH /api/orders/123/status (body: status: processing/shipping/delivered)
    Gateway->>OrderService: PATCH /orders/123/status
    OrderService->>OrderDB: Cập nhật trạng thái đơn hàng
    OrderDB-->>OrderService: Bản ghi cập nhật thành công
    
    OrderService->>Gateway: Đồng bộ trạng thái sang các service liên quan
    Gateway->>PaymentService: PATCH /payment/status?order_id=123 (status: completed)
    PaymentService->>PaymentDB: Xác nhận thanh toán hoàn tất
    
    Gateway->>ShippingService: PATCH /shipping/status?order_id=123 (status: shipping/delivered)
    ShippingService->>ShippingDB: Cập nhật hành trình vận chuyển tương ứng
    
    OrderService-->>Gateway: Toàn bộ quy trình hoàn tất cập nhật
    Gateway-->>Frontend: Đồng bộ dữ liệu mới thành công
    Frontend-->>AdminStaff: Cập nhật bảng dữ liệu quản lý thời gian thực dạng Glassmorphism
```

### Luồng 4: Gợi ý Cá nhân hóa & Trò chuyện Chatbot AI (AI Recommendation & Chatbot)
Quy trình động cơ AI Service phối hợp FAISS RAG, mạng LSTM hành vi và cơ sở dữ liệu đồ thị Neo4j để đưa ra đề xuất chính xác tuyệt đối, loại bỏ hoàn toàn hiện tượng lệch danh mục ngành hàng.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant AIService as ai-service
    participant ProductService as product-service
    participant Neo4j as Neo4j Graph DB

    Note over Customer, AIService: Luồng 4A: Đề xuất cá nhân hóa tự động khi đăng nhập
    Customer->>Frontend: Đăng nhập thành công vào trang chủ Shop
    Frontend->>Gateway: GET /api/recommend?user_id=1 (Header JWT)
    Gateway->>AIService: GET /recommend?user_id=1
    AIService->>Neo4j: Truy vấn lịch sử tương tác đồ thị của User (BUY/VIEW)
    Neo4j-->>AIService: Trả về các điểm nút sản phẩm liên quan hành vi
    AIService->>AIService: Kết hợp ma trận trọng số LSTM + RAG Vectorizer
    AIService-->>Gateway: Trả về danh sách 6 định danh ID đề xuất cá nhân hóa
    Gateway-->>Frontend: Trả về danh sách chi tiết sản phẩm đề xuất
    Frontend-->>Customer: Hiển thị mượt mà trên RecommendationRail dạng lướt ngang cuốn hút

    Note over Customer, AIService: Luồng 4B: Trò chuyện tư vấn Chatbot AI thông minh
    Customer->>Frontend: Mở cửa sổ "Tư vấn AI", nhập "Tôi cần tìm điện thoại pin trâu"
    Frontend->>Gateway: POST /api/chatbot (body: user_id, query)
    Gateway->>AIService: POST /chatbot (body: user_id, query)
    
    AIService->>AIService: Phân tích cú pháp ngữ cảnh đầu vào (hỗ trợ cả không dấu: "dien thoai")
    Note over AIService: Nhận diện từ khóa "điện thoại" -> Kích hoạt has_phone_kw = True.<br/>Tự động áp dụng nhân hệ số phạt 0.05 đối với các sản phẩm KHÁC điện thoại.
    
    AIService->>AIService: Tìm kiếm ngữ nghĩa tương đồng dựa trên chỉ mục FAISS RAG
    AIService->>AIService: Lọc qua bộ lọc ngưỡng điểm số threshold (base_score >= 0.1)
    Note over AIService: Loại bỏ hoàn toàn máy tính, sách, quần áo lệch phân nhóm phụ ra khỏi kết quả gợi ý.
    
    AIService-->>Gateway: Trả về câu tư vấn thông minh `answer` + mảng 3 ID đề xuất điện thoại khớp nhất
    Gateway-->>Frontend: Phản hồi dữ liệu tư vấn & sản phẩm AI chọn lọc
    Frontend-->>Customer: Cập nhật hội thoại thời gian thực, hiển thị các điện thoại khớp chính xác
```

---

### Luồng 5: Quản lý Kho & Cập nhật Sản phẩm (Product Stock Management Flow)
Mô tả quy trình Admin hoặc Staff cập nhật giá bán hoặc số lượng hàng dự trữ trực tiếp trên giao diện Bàn làm việc để đồng bộ tức thời xuống `product-service`.

```mermaid
sequenceDiagram
    autonumber
    actor AdminStaff as Admin / Staff
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant ProductService as product-service
    participant ProductDB as product-db

    AdminStaff->>Frontend: Mở "Bàn làm việc", chọn tab "Sản phẩm"
    Frontend->>Gateway: GET /api/products/ (JWT Header)
    Gateway->>ProductService: GET /products/
    ProductService->>ProductDB: Lấy danh sách toàn bộ sản phẩm
    ProductDB-->>ProductService: Danh sách sản phẩm bao gồm số lượng tồn kho (stock)
    ProductService-->>Gateway: Trả về danh sách sản phẩm
    Gateway-->>Frontend: Trả về danh sách sản phẩm
    Frontend-->>AdminStaff: Hiển thị bảng danh sách sản phẩm quản trị

    AdminStaff->>Frontend: Bấm "Sửa kho" / "Sửa giá", nhập giá trị mới
    Frontend->>Gateway: PATCH /api/products/id/ (body: stock, price)
    Gateway->>ProductService: PATCH /products/id/ (JWT Header)
    ProductService->>ProductDB: Cập nhật stock & price trong PostgreSQL
    ProductDB-->>ProductService: Bản ghi cập nhật thành công
    ProductService-->>Gateway: Phản hồi thông tin sản phẩm mới
    Gateway-->>Frontend: Phản hồi thông tin sản phẩm mới
    Frontend-->>AdminStaff: Cập nhật dữ liệu tức thì lên màn hình bảng và hiển thị Toast thành công
```

### Luồng 6: Phê duyệt & Xử lý Đơn hàng (Order Fulfillment Flow - Admin/Staff)
Tiến trình Staff/Admin xem toàn bộ đơn hàng của mọi người dùng trong hệ thống (thông qua phân quyền JWT role claim) và cập nhật trạng thái đơn hàng (duyệt thanh toán, giao vận chuyển, hoàn tất).

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff / Admin
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant OrderService as order-service
    participant OrderDB as order-db
    participant PaymentService as payment-service
    participant ShippingService as shipping-service

    Staff->>Frontend: Mở "Bàn làm việc", chọn tab "Đơn hàng"
    Frontend->>Gateway: GET /api/orders/ (JWT Header)
    Gateway->>OrderService: GET /orders/
    Note over OrderService: Kiểm tra vai trò trong JWT. Vì role="staff"/"admin",<br/>hệ thống cho phép lấy TOÀN BỘ đơn hàng thay vì lọc theo khách hàng.
    OrderService->>OrderDB: Query tất cả đơn hàng trong MySQL
    OrderDB-->>OrderService: Trả về danh sách đơn hàng toàn hệ thống
    OrderService-->>Gateway: Phản hồi danh sách đơn hàng
    Gateway-->>Frontend: Trả về danh sách đơn hàng
    Frontend-->>Staff: Hiển thị danh sách đơn hàng với các nút hành động tương ứng

    alt Hành động "Duyệt Thanh toán"
        Staff->>Frontend: Click "Duyệt Thanh toán"
        Frontend->>Gateway: PATCH /api/orders/id/status (body: status="processing")
        Gateway->>OrderService: PATCH /orders/id/status
        OrderService->>OrderDB: Cập nhật status thành processing
        OrderService->>Gateway: Gọi đồng bộ Payment Service
        Gateway->>PaymentService: PATCH /payment/status?order_id=id (status="completed")
    else Hành động "Giao cho Vận chuyển"
        Staff->>Frontend: Click "Giao cho Vận chuyển"
        Frontend->>Gateway: PATCH /api/orders/id/status (body: status="shipping")
        Gateway->>OrderService: PATCH /orders/id/status
        OrderService->>OrderDB: Cập nhật status thành shipping
        OrderService->>Gateway: Gọi đồng bộ Shipping Service
        Gateway->>ShippingService: PATCH /shipping/status?order_id=id (status="shipping")
    else Hành động "Xác nhận Đã giao"
        Staff->>Frontend: Click "Đã giao"
        Frontend->>Gateway: PATCH /api/orders/id/status (body: status="delivered")
        Gateway->>OrderService: PATCH /orders/id/status
        OrderService->>OrderDB: Cập nhật status thành delivered
        OrderService->>Gateway: Gọi đồng bộ Shipping Service
        Gateway->>ShippingService: PATCH /shipping/status?order_id=id (status="delivered")
    end

    OrderService-->>Gateway: Cập nhật trạng thái thành công
    Gateway-->>Frontend: Phản hồi thành công
    Frontend-->>Staff: Cập nhật Timeline đơn hàng, chuyển trạng thái pill màu sắc, vô hiệu hóa nút đã xử lý
```

### Luồng 7: Tra cứu Danh bạ Người dùng (User Directory Flow - Admin Only)
Quy trình bảo mật chỉ cho phép tài khoản có vai trò `admin` xem danh sách toàn bộ các tài khoản người dùng đang đăng ký trong hệ thống, khóa chặt các vai trò có quyền hạn thấp hơn (`staff`, `customer`).

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin (Chỉ có vai trò Admin)
    participant Frontend as Frontend (Vite App)
    participant Gateway as Gateway (Nginx/API)
    participant UserService as user-service
    participant UserDB as user-db

    Admin->>Frontend: Mở "Bàn làm việc", chọn tab "Người dùng"
    Frontend->>Gateway: GET /api/users/ (JWT Header)
    Gateway->>UserService: GET /users/
    
    alt Xác thực vai trò: role == "admin"
        UserService->>UserDB: Truy vấn danh bạ tất cả người dùng (admin, staff, customer)
        UserDB-->>UserService: Trả về danh sách tài khoản
        UserService-->>Gateway: Trả về danh sách người dùng
        Gateway-->>Frontend: Trả về danh sách người dùng
        Frontend-->>Admin: Hiển thị bảng danh sách tài khoản chi tiết
    else Xác thực vai trò: role == "staff" (Bị từ chối)
        UserService-->>Gateway: HTTP 403 Forbidden (Quyền hạn không hợp lệ)
        Gateway-->>Frontend: Trả về lỗi 403
        Frontend-->>Admin: Hiển thị thông báo đỏ "Bạn không có quyền truy cập tab Người dùng"
    end
```

---

## 3. HƯỚNG DẪN TÍCH HỢP VÀ HIỂN THỊ
Để biểu đồ hiển thị một cách đẹp mắt nhất trong tài liệu Markdown này:
1. Bạn có thể sử dụng các trình xem Markdown hỗ trợ Mermaid (như VS Code Markdown Preview, GitHub, Notion).
2. Mã nguồn biểu đồ tuân thủ tiêu chuẩn Mermaid phiên bản mới nhất, sử dụng các ký hiệu liên kết phân cấp trực quan và dễ dàng bảo trì.
