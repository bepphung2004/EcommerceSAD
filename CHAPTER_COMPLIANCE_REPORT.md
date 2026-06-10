# Chapter Compliance Report (Ecom Final)

## 1) Kết luận nhanh
- Chương 2: Đạt phần lớn yêu cầu kiến trúc và chức năng cốt lõi.
- Chương 3: Đã bổ sung đầy đủ pipeline AI hybrid theo checklist (dataset + LSTM + Graph + RAG + API).
- Chương 4: Đạt checklist triển khai chính (gateway + JWT + Docker + flow order -> payment -> shipping).

## 2) Đối chiếu Chương 2

### Functional Requirements
- Quản lý sản phẩm đa domain: có `Book`, `Electronics`, `Fashion` trong Product Service.
- Quản lý người dùng theo role: có `admin/staff/customer` trong User Service.
- Cart/Order/Payment/Shipping: đã có model + API riêng cho từng service.
- Tìm kiếm và gợi ý sản phẩm: frontend có search theo tên; AI service có API recommend/chatbot.

### Non-functional Requirements
- Scalability: tách microservice + DB riêng từng service.
- High Availability: chạy độc lập theo container, có thể restart từng service.
- Security: JWT stateless + RBAC ở gateway.
- Maintainability: code phân tách theo bounded context.

### DDD và database riêng
- User/Product/Cart/Order/Payment/Shipping tách thành service độc lập.
- Product DB dùng PostgreSQL; các service còn lại dùng MySQL.
- Không share DB giữa các service.

## 3) Đối chiếu Chương 3 (AI Service)

### Đã triển khai
- Dataset hành vi tự sinh: `user_id, product_id, action(view/click/add_to_cart/search), timestamp`.
- LSTM sequence model (PyTorch): train với `CrossEntropyLoss` + `Adam`.
- Knowledge Graph:
  - In-memory graph scoring luôn hoạt động.
  - Neo4j sync hoạt động khi cấu hình `NEO4J_URI/USER/PASSWORD`.
- RAG:
  - TF-IDF embedding mô tả sản phẩm.
  - FAISS IndexFlatIP để retrieve semantic top-k.
- Hybrid score:
  - `final = 0.45 * lstm + 0.35 * graph + 0.20 * rag`.
- API:
  - `GET /recommend?user_id=...&query=...&top_k=...`
  - `POST /chatbot`

### Checklist Chương 3
- Có pipeline AI rõ ràng: Đạt.
- Có model (LSTM): Đạt.
- Có Graph và RAG: Đạt.
- Có API hoạt động: Đạt (sau khi dựng stack thành công).

## 4) Đối chiếu Chương 4
- Có API Gateway: Đạt.
- Có JWT Auth: Đạt.
- Có Docker chạy được: Đạt khi Docker daemon đang bật.
- Có flow `order -> payment -> shipping`: Đạt ở order-service.

## 5) Điều chỉnh đã thực hiện trong lượt này
- Bổ sung Neo4j service vào `docker-compose`.
- Bổ sung biến môi trường Neo4j/AI vào `.env` và `.env.example`.
- Nâng AI service theo full hybrid pipeline và thêm health info cho graph mode.
- Chuyển PyTorch sang CPU wheel (`torch==2.4.1+cpu`) để giảm phụ thuộc CUDA.
- Thêm `restart: on-failure` cho `user-service/cart-service/order-service/payment-service/shipping-service`
  để xử lý race condition khi MySQL chưa sẵn sàng ngay lần boot đầu.

## 6) Kết quả verify runtime thực tế
- Trạng thái service sau khi dựng stack: toàn bộ service chính đã ở trạng thái `Up`
  (`gateway`, `frontend`, `user-service`, `product-service`, `cart-service`, `order-service`, `payment-service`, `shipping-service`, `ai-service`, `neo4j`).
- Gateway health:
  - `GET /health` -> `{"status":"ok"}`
- Login:
  - `POST /api/auth/login` với `customer/customer123` trả về `access/refresh token` hợp lệ.
- AI Recommend:
  - `GET /api/recommend?user_id=1&query=laptop&top_k=3` (kèm Bearer token) trả về danh sách gợi ý và score thành phần `lstm/graph/rag`.
- AI Chatbot:
  - `POST /api/chatbot` (kèm Bearer token) trả về câu trả lời tư vấn + recommendation IDs.
- AI internal health:
  - `GET /health` trong `ai-service` trả về:
    - `pipeline = ["LSTM", "KnowledgeGraph", "RAG"]`
    - `neo4j_enabled = true`

## 7) Ghi chú vận hành
- Nếu Docker chưa bật, các lệnh compose sẽ fail ngay (daemon unavailable).
- Khi Neo4j chưa sẵn sàng, AI service vẫn chạy với graph fallback in-memory.
