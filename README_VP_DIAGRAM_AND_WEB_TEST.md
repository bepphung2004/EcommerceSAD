# Hướng dẫn vẽ VP Diagram + Chạy và Test trực tiếp trên Web

## 1) Vẽ VP Diagram (Visual Paradigm)

## 1.1 Mục tiêu diagram
Tạo 4 nhóm diagram chính cho báo cáo:
- Use Case Diagram
- Class Diagram (theo từng bounded context)
- Sequence Diagram (flow mua hàng)
- Deployment Diagram (microservices + DB + gateway)

## 1.2 Cách vẽ nhanh trong Visual Paradigm
1. Mở Visual Paradigm -> New Project -> đặt tên `ecom-final-microservices`.
2. Tạo package theo context:
- `User Context`
- `Product Context`
- `Cart Context`
- `Order Context`
- `Payment Context`
- `Shipping Context`
- `AI Context`
3. Vẽ Use Case:
- Actor: Admin, Staff, Customer.
- Use case: Đăng ký/Đăng nhập, Xem sản phẩm, Thêm giỏ hàng, Tạo đơn, Thanh toán, Theo dõi giao hàng, Gợi ý AI, Chatbot.
4. Vẽ Class Diagram:
- Product context: `Category`, `Product`, `Book`, `Electronics`, `Fashion`.
- User context: `User(role)`.
- Cart context: `Cart`, `CartItem`.
- Order context: `Order`, `OrderItem`.
- Payment context: `Payment`.
- Shipping context: `Shipment`.
5. Vẽ Sequence Diagram (checkout):
- Customer -> Gateway -> User/Product/Cart/Order/Payment/Shipping/AI.
- Thể hiện rõ flow: login -> add cart -> create order -> payment -> shipping.
6. Vẽ Deployment Diagram:
- Node: `frontend`, `gateway`, `user-service`, `product-service`, `cart-service`, `order-service`, `payment-service`, `shipping-service`, `ai-service`, `neo4j`, `mysql*`, `postgres`.
- Connect qua HTTP REST.
7. Export:
- File -> Export -> Image/PDF cho từng diagram.

## 1.3 Gợi ý nội dung nên thể hiện trong Deployment
- Gateway làm điểm vào duy nhất.
- Mỗi bounded context 1 DB riêng.
- AI service độc lập, tích hợp LSTM + Graph + RAG.
- Frontend React SPA gọi API qua gateway.

## 2) Cách chạy hệ thống

## 2.1 Yêu cầu
- Docker Desktop đang bật.
- Port khả dụng: `3000`, `8080`, `3307-3311`, `5433`, `7474`, `7687`.

## 2.2 Chạy nhanh
```bash
cd "c:/Users/Admin/OneDrive - ptit.edu.vn/Desktop/SAD/ecom-final"
docker compose --env-file .env -f infrastructure/docker-compose.yml up --build -d
```

## 2.3 Seed dữ liệu
```bash
./local-dev.sh seed
```
PowerShell:
```powershell
.\local-dev.ps1 seed
```

## 2.4 Truy cập
- Frontend: http://localhost:3000
- Gateway: http://localhost:8080
- Neo4j Browser: http://localhost:7474

Tài khoản test mặc định:
- `admin / admin123`
- `staff / staff123`
- `customer / customer123`

## 3) Test trực tiếp chức năng trên web

## 3.1 Login
1. Mở `http://localhost:3000/login`.
2. Đăng nhập `customer/customer123`.
3. Kỳ vọng: chuyển sang trang `/shop`.

## 3.2 Mua sắm + Search
1. Ở trang `/shop`, nhập từ khóa vào ô tìm kiếm.
2. Lọc theo tab danh mục: Tất cả/Sách/Điện tử/Thời trang.
3. Bấm `Thêm vào giỏ`.

## 3.3 Cart + Checkout
1. Mở trang `/cart`.
2. Kiểm tra danh sách sản phẩm, tổng tiền, nhập địa chỉ giao hàng.
3. Bấm `Tạo đơn hàng`.
4. Kỳ vọng: đơn được tạo và hệ thống chạy flow `order -> payment -> shipping`.

## 3.4 AI Recommendation
1. Ở trang shop, quan sát block `Trợ lý mua sắm AI`.
2. Hệ thống hiện danh sách ID gợi ý từ API recommend.

## 3.5 AI Chatbot
1. Nhập truy vấn ví dụ: `tôi cần laptop giá rẻ`.
2. Bấm `Hỏi AI`.
3. Kỳ vọng: chatbot trả câu tư vấn có sản phẩm gợi ý.

## 4) Test API nhanh bằng curl

## 4.1 Health
```bash
curl http://localhost:8080/health
```

## 4.2 Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"customer123"}'
```

## 4.3 Recommend
```bash
curl "http://localhost:8080/api/recommend?user_id=1&query=laptop%20gaming&top_k=3" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## 4.4 Chatbot
```bash
curl -X POST http://localhost:8080/api/chatbot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"user_id":1,"query":"tôi cần laptop giá rẻ"}'
```

## 5) Nếu gặp lỗi
- `dockerDesktopLinuxEngine ... cannot find file`: Docker Desktop chưa bật.
- Không login được: kiểm tra gateway/user-service đã `Up`.
- AI graph không có dữ liệu: kiểm tra biến `NEO4J_*` và service `neo4j`.
- Frontend không cập nhật: hard refresh `Ctrl+F5`.
