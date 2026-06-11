# AI Service (Dịch vụ Trí tuệ Nhân tạo & Chatbot)

## 1. Giới thiệu chung (Overview)
AI Service là trái tim thông minh của hệ thống E-Commerce, cung cấp Động cơ gợi ý lai (Hybrid Recommendation Engine) và Trợ lý mua sắm AI (Shopping Chatbot). Nó kết hợp học sâu (Deep Learning), biểu đồ tri thức (Knowledge Graph), tìm kiếm ngữ nghĩa (Semantic Search) và mô hình ngôn ngữ lớn (LLM) để cá nhân hóa tối đa trải nghiệm của khách hàng.

---

## 2. Trách nhiệm của Service (Responsibilities)
- **Gợi ý sản phẩm cá nhân hóa (Hybrid Recommendation)**: Tổ hợp điểm số từ 4 động cơ con để đưa ra danh sách sản phẩm tốt nhất cho người dùng:
  - **Mô hình chuỗi LSTM (Deep Learning)**: Dự đoán sản phẩm khách hàng có khả năng tương tác tiếp theo dựa trên chuỗi lịch sử tương tác trước đó.
  - **Đồ thị tri thức (Knowledge Graph - Neo4j)**: Phân tích các mối quan hệ liên kết như hành vi mua chéo (`BUY`), xem chéo (`VIEW`) của người dùng khác, và mối quan hệ tương đồng giữa các sản phẩm (`SIMILAR`).
  - **Tìm kiếm ngữ nghĩa (RAG FAISS)**: Vectơ hóa mô tả sản phẩm và tìm kiếm các mặt hàng có độ tương đồng ngữ nghĩa cao nhất với câu truy vấn.
  - **So khớp ý định (Intent Matching)**: Chấm điểm độ ưu tiên của sản phẩm dựa trên lọc danh mục và ngân sách khách hàng chỉ định.
- **Trợ lý mua sắm AI (Shopping Chatbot)**: 
  - Đóng vai trò là nhân viên tư vấn bán hàng chuyên nghiệp qua cổng `/chatbot`.
  - Sử dụng mô hình **Gemini 2.5 Flash** để tổng hợp câu trả lời tư vấn bằng Tiếng Việt dựa trên danh sách sản phẩm gợi ý được lấy từ bước RAG.
  - Tích hợp cơ chế **Chatbot nội bộ (Local Fallback)** tự động kích hoạt khi mất kết nối tới máy chủ Google Gemini, đảm bảo hệ thống vẫn đưa ra phản hồi tư vấn mượt mà và gợi ý sản phẩm chính xác dựa trên database nội bộ.

---

## 3. Công nghệ sử dụng (Technology Stack)
- **FastAPI (Python 3.11)**: Web framework bất đồng bộ hiệu năng cao.
- **PyTorch**: Framework xây dựng và huấn luyện mạng nơ-ron LSTM.
- **FAISS (Facebook AI Similarity Search)**: Vector database tìm kiếm láng giềng gần nhất tốc độ cao.
- **Scikit-learn**: Dùng `TfidfVectorizer` để trích xuất đặc trưng văn bản sản phẩm.
- **Neo4j (Graph Database)**: Cơ sở dữ liệu đồ thị lưu trữ các quan hệ mạng thực thể.
- **google-genai (Official SDK)**: Sử dụng mô hình `gemini-2.5-flash` để tổng hợp hội thoại.

---

## 4. Cấu trúc thư mục & Tệp tin (Directory Structure)
```text
ai-service/
├── Dockerfile          # Cấu hình đóng gói container chạy FastAPI AI Service
├── main.py             # Toàn bộ mã nguồn định nghĩa Model, Engine RAG, API routes
└── requirements.txt    # Danh sách thư viện cần thiết (faiss-cpu, torch, google-genai, neo4j, v.v.)
```

### Chi tiết tệp tin cốt lõi:
- `main.py`:
  - Lớp `LSTMModel`: Định nghĩa mạng nơ-ron dự đoán dạng chuỗi sử dụng lớp `nn.LSTM` và `nn.Linear` trong PyTorch.
  - Lớp `HybridAIEngine`: 
    - `initialize()`: Tạo lập tập dữ liệu giả lập hành vi người dùng (`user_behavior.csv`), huấn luyện mô hình LSTM, đồng bộ hóa các nút và liên kết sang Neo4j Graph DB, xây dựng chỉ mục tìm kiếm FAISS.
    - `recommend()`: Tính toán điểm tổng hợp (Weighted sum) từ các mô-đun con để chọn ra Top K sản phẩm.
    - `chatbot()`: Lấy danh sách sản phẩm đề xuất tốt nhất, gửi prompt RAG tới Gemini API qua SDK hoặc tự sinh văn bản tư vấn chuyên nghiệp bằng thuật toán fallback nội bộ nếu lỗi.

---

## 5. Cơ sở dữ liệu (Database Schema / Models)
AI Service kết nối với cơ sở dữ liệu đồ thị **Neo4j 5.23** (chạy trên cổng `7687` bolt và `7474` HTTP).

### Đồ thị tri thức bao gồm:
- **Thực thể (Nodes)**:
  - `:User` (Các thuộc tính: `id`)
  - `:Product` (Các thuộc tính: `id`, `name`, `category`, `price`)
- **Mối quan hệ (Edges / Relationships)**:
  - `(u:User)-[:VIEW|BUY]->(p:Product)` (Thuộc tính: `weight` biểu thị số lần tương tác).
  - `(p1:Product)-[:SIMILAR]->(p2:Product)` (Thuộc tính: `weight` biểu thị điểm tương đồng nội dung).

---

## 6. Giao tiếp liên dịch vụ (Inter-service Communication)

### Inbound (Nhận yêu cầu):
- **API Gateway**: Chuyển tiếp các yêu cầu của khách hàng tới `/api/recommend` và `/api/chatbot`.

### Outbound (Gửi yêu cầu):
- **product-service**: Gửi yêu cầu HTTP GET tới `http://product-service:8001/products/` khi khởi động để lấy danh mục sản phẩm phục vụ cho việc sinh cơ sở dữ liệu giả lập và huấn luyện mô hình.
- **Neo4j Database**: Kết nối Bolt qua địa chỉ `bolt://neo4j:7687` để thực hiện đồng bộ và truy vấn đồ thị.
- **Gemini API (Google Cloud)**: Gửi request HTTPS tới API Gemini thông qua thư viện `google-genai` SDK để tổng hợp câu trả lời chatbot.

---

## 7. Chi tiết Thuật toán RAG & LSTM

### 1. Vectơ hóa ngữ nghĩa sản phẩm (FAISS Index):
Sản phẩm được ghép chuỗi văn bản dạng: `"{name}. {description}. Danh mục: {category}."`.
Sử dụng TF-IDF để chuyển thành vector kích thước 256 chiều, chuẩn hóa L2 và thêm vào chỉ mục tích vô hướng `faiss.IndexFlatIP`. Khi người dùng nhập câu hỏi, câu hỏi được chuyển đổi thành vector tương tự và truy vấn cosin similarity qua FAISS.

### 2. Mô hình dự đoán chuỗi LSTM:
Mô hình PyTorch tiếp nhận chuỗi lịch sử tối đa 5 sản phẩm người dùng đã tương tác gần đây (dạng vector one-hot), đi qua lớp LSTM ẩn 64 chiều, và lớp tuyến tính (Linear) đầu ra để dự đoán xác suất tương tác tiếp theo với từng sản phẩm.

### 3. Phân rã Trọng số Gợi ý lai:
Điểm cuối cùng của sản phẩm $P$ được tính bằng:
$$\text{Score}(P) = w_{\text{lstm}} \cdot S_{\text{lstm}} + w_{\text{graph}} \cdot S_{\text{graph}} + w_{\text{rag}} \cdot S_{\text{rag}} + w_{\text{intent}} \cdot S_{\text{intent}}$$
- Khi khách hàng có nhập từ khóa tìm kiếm cụ thể: Hệ thống tăng trọng số $w_{\text{rag}}$ và $w_{\text{intent}}$, hạ thấp điểm gợi ý theo lịch sử.
- Khi khách hàng lướt xem chung: Hệ thống tăng mạnh trọng số $w_{\text{lstm}}$ và $w_{\text{graph}}$ để gợi ý cá nhân hóa cao.

---

## 8. Danh sách API Endpoints (API Routes)

| Method | Endpoint | Quyền truy cập | Tham số đầu vào | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Không có | Lấy trạng thái hệ thống, Neo4j, số lượng bản ghi huấn luyện |
| `GET` | `/recommend` | JWT (Bất kỳ ai) | Query: `user_id`, `query`, `top_k` | Trả về mảng danh sách ID sản phẩm được đề xuất |
| `POST` | `/chatbot` | JWT (Bất kỳ ai) | Body: `{"query", "user_id"}` | Trả về text tư vấn dạng Markdown + danh sách ID đề xuất |

---

## 9. Khởi chạy & Môi trường (Deployment & Docker)
- **Cổng chạy nội bộ**: `8006`.
- **Biến môi trường cần thiết**:
  - `GEMINI_API_KEY`: API key của Google Gemini để kích hoạt chatbot thông minh Gemini 2.5 Flash.
  - `NEO4J_URL`: bolt URL kết nối Neo4j (mặc định: `bolt://neo4j:7687`).
  - `NEO4J_USER` / `NEO4J_PASSWORD`: Tài khoản đăng nhập đồ thị (mặc định: `neo4j` / `neo4j_password`).
  - `AI_REBUILD_DATASET`: Set `1` để ép buộc sinh lại tập dữ liệu hành vi và huấn luyện lại LSTM khi khởi động.
