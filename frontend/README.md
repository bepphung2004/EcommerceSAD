# Frontend Service (Ứng dụng Client Web)

## 1. Giới thiệu chung (Overview)
Frontend Service là ứng dụng giao diện web Single Page Application (SPA) viết bằng React và Vite. Đây là nơi khách hàng thực hiện các hoạt động mua sắm trực tuyến (xem sản phẩm, thêm hàng vào giỏ, thanh toán đơn hàng, xem trạng thái giao nhận và trao đổi với trợ lý AI) và là nơi nhân viên/quản trị viên theo dõi các đơn hàng và vận đơn trên dashboard.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Giao diện người dùng (User Interface)**: Cung cấp giao diện responsive, thân thiện và hiệu ứng chuyển động mượt mà cho khách hàng và quản trị viên.
- **Quản lý trạng thái ứng dụng (State Management)**: Khởi tạo và quản trị các trạng thái dùng chung tại tệp tin gốc `App.jsx`:
  - Trạng thái đăng nhập (`token`, `currentUserId`, `userRole`).
  - Trạng thái giỏ hàng (`cart`, `cartItems`).
  - Trạng thái danh sách đơn hàng (`orders`), trạng thái thanh toán và vận chuyển liên quan.
  - Trạng thái hội thoại chatbot AI.
- **Tương tác API (API Fetching)**: Định nghĩa hàm tiện ích `apiFetch` trong `api.js` để tự động đính kèm Token JWT vào header `Authorization: Bearer <token>` và gửi yêu cầu tới API Gateway.
- **Trợ lý Tư vấn AI (Floating AI Chatbot)**: Tích hợp widget chat nổi bật ở góc dưới màn hình, hiển thị danh sách câu hỏi gợi ý nhanh, lịch sử hội thoại đẹp mắt, thẻ sản phẩm đề xuất trực quan và trạng thái phản hồi động.

---

## 3. Công nghệ sử dụng (Technology Stack)
- **React 18** (JavaScript).
- **Vite**: Công cụ build và chạy môi trường phát triển tốc độ cao.
- **Tailwind CSS**: Dùng cho các class tiện ích định hình bố cục nhanh, responsive.
- **Vanilla CSS**: Cấu hình hệ thống thiết kế (Design System tokens) tại `index.css` với các màu sắc chủ đạo HSL, kiểu chữ tùy chỉnh (Be Vietnam Pro, Plus Jakarta Sans) và các hiệu ứng chuyển động nâng cao.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
frontend/
├── src/
│   ├── components/         # Các component giao diện nhỏ tái sử dụng
│   │   ├── AIChatAssistant.jsx       # Trợ lý chat AI (Markdown parsing, product slider)
│   │   ├── ProductCard.jsx           # Thẻ hiển thị thông tin sản phẩm
│   │   ├── ProductDetailModal.jsx    # Modal xem chi tiết sản phẩm
│   │   ├── RecommendationRail.jsx    # Thanh trượt các sản phẩm gợi ý cá nhân hóa
│   │   └── ...
│   ├── pages/              # Các trang chính trong hệ thống
│   │   ├── ShopPage.jsx              # Trang cửa hàng chính (chứa danh mục, sản phẩm, nút Chat AI)
│   │   ├── CartPage.jsx              # Trang giỏ hàng và nhập thông tin thanh toán/địa chỉ
│   │   ├── PaymentsPage.jsx          # Trang lịch sử giao dịch và tài khoản ví
│   │   └── ...
│   ├── api.js              # Định nghĩa hàm apiFetch giao tiếp với API Gateway
│   ├── App.jsx             # Gốc quản lý State, điều phối API và cấu hình Cổng định tuyến
│   ├── index.css           # Cấu hình màu sắc, kiểu chữ và CSS Base toàn hệ thống
│   └── main.jsx            # Điểm gắn kết React vào file index.html
├── Dockerfile              # Cấu hình đóng gói container chạy môi trường Vite Dev
├── index.html              # Điểm vào HTML chính của trình duyệt
├── package.json            # Khai báo thư viện và script chạy (`npm run dev`)
└── vite.config.js          # Cấu hình môi trường build và máy chủ phát triển Vite
```

### Chi tiết tệp tin cốt lõi:
- `src/api.js`:
  - `apiFetch(endpoint, options)`: Đọc token JWT trong `localStorage`. Tự động chèn token vào header đối với các request. Xử lý chuẩn hóa URL trỏ tới API Gateway.
- `src/App.jsx`:
  - Khai báo các router sử dụng mô phỏng định tuyến dạng rẽ nhánh điều kiện dựa trên trạng thái `loggedIn` và `userRole` (chuyển hướng admin/staff vào trang quản lý và customer vào trang cửa hàng).
  - Định nghĩa các hàm nghiệp vụ chính: `addToCart()`, `removeFromCart()`, `createOrder()`, `askChatbot()`.
- `src/index.css`:
  - Chứa cấu hình biến màu sắc `--primary` (màu cam thương hiệu), các định dạng thẻ nền gradient nổi bật, và định nghĩa hiệu ứng chuyển động bong bóng.

---

## 5. Luồng hoạt động & Giao tiếp (Communication Flow)

### Inbound (Nhận yêu cầu):
- Nhận các tương tác click chuột, nhập văn bản, chọn danh mục, gửi câu hỏi từ người dùng trên giao diện trình duyệt.

### Outbound (Gửi yêu cầu):
- **API Gateway**: Gửi toàn bộ các request HTTP API đến `http://localhost/api/` (thông qua cổng Nginx chuyển tiếp sang Gateway `http://gateway:8080`).
- *Lưu ý: Địa chỉ URL API cơ sở được chỉ định bằng biến môi trường `VITE_API_BASE_URL` khi Docker Compose khởi chạy.*

---

## 6. Các trang giao diện chính (Key Pages)

- **`/shop` (Cửa hàng)**:
  - Xem danh mục sản phẩm (Tất cả, Điện tử, Sách, Thời trang).
  - Tìm kiếm sản phẩm theo tên.
  - Hiển thị danh sách gợi ý cá nhân hóa dựa trên hành vi mua hàng của bạn (lấy từ RAG/LSTM/Neo4j).
  - Widget nổi chat với Trợ lý AI ở góc phải màn hình.
- **`/cart` (Giỏ hàng)**:
  - Xem và chỉnh sửa số lượng mặt hàng trong giỏ.
  - Chọn hình thức thanh toán (Tiền mặt COD hoặc Ví điện tử).
  - Nếu chọn Ví điện tử, bắt buộc nhập SĐT/Tài khoản ví.
  - Nhập địa chỉ nhận hàng và thực hiện Đặt hàng.
- **`/payments` (Lịch sử thanh toán)**:
  - Hiển thị danh sách hóa đơn thanh toán của người dùng.
  - Dịch các trạng thái giao dịch sang Tiếng Việt kèm màu sắc chỉ thị trực quan: xanh (Thành công), vàng (Chờ thanh toán), đỏ (Thất bại).
  - Hiển thị thông tin kênh thanh toán và chi tiết tài khoản ví đã dùng.
- **`/admin` (Quản trị)**:
  - Dành riêng cho tài khoản có vai trò `admin` hoặc `staff`.
  - Quản lý danh sách sản phẩm, danh mục.
  - Quản lý danh sách đơn hàng toàn hệ thống, thực hiện cập nhật trạng thái đơn (sang Đang giao hàng `shipping`, Đã giao hàng `delivered` hoặc Thất bại `failed`).

---

## 7. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy dev**: `3000`.
- **Lệnh chạy**: `npm run dev` (Khởi chạy máy chủ phát triển Vite bên trong container, lắng nghe cổng và hỗ trợ Hot Module Replacement).
- **Biến môi trường**:
  - `VITE_API_BASE_URL`: Điểm cuối API cơ sở của Gateway. Trong môi trường docker compose mặc định trỏ tới `http://127.0.0.1/api` hoặc `http://localhost/api`.
