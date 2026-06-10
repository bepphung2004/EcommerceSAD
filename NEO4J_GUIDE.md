# Hướng Dẫn Sử Dụng & Truy Vấn Neo4j Knowledge Graph

Tài liệu này giải thích chi tiết cách hệ thống gợi ý tích hợp và sử dụng **Neo4j** làm cơ sở dữ liệu đồ thị tri thức (Knowledge Graph DB), đồng thời cung cấp các mẫu truy vấn Cypher quan trọng để quản trị viên và kỹ sư AI khai thác dữ liệu trực quan.

---

## 1. Kiến Trúc Tích Hợp Neo4j & AI Service

Hệ thống gợi ý sản phẩm hoạt động dưới dạng **Động cơ AI lai (Hybrid AI Engine)** kết hợp 4 thành phần điểm số độc lập:
1. **LSTM Model**: Dự đoán hành vi theo thời gian (chuỗi tương tác gần nhất).
2. **FAISS RAG**: Tìm kiếm ngữ nghĩa sản phẩm bằng cách khớp vector TF-IDF.
3. **Intent heuristic filter**: Lọc và phạt các ngành hàng không khớp với mục đích tìm kiếm.
4. **Knowledge Graph (Neo4j)**: Phân tích các mối quan hệ đồ thị giữa khách hàng (`User`) và sản phẩm (`Product`).

### Cơ chế đồng bộ hóa (Sync & Fallback):
- **Khi AI Service khởi động**: Hàm `initialize()` tải tập dữ liệu hành vi lịch sử và danh mục sản phẩm từ `product-service`, sau đó đồng bộ hóa trực tiếp xuống Neo4j thông qua Bolt Protocol (`bolt://neo4j:7687`).
- **Cơ chế Fallback (Dự phòng thông minh)**: Để đảm bảo tốc độ phản hồi real-time tối ưu (< 5ms) và hệ thống vẫn chạy ổn định ngay cả khi Neo4j dừng hoạt động, `ai-service` duy trì một đồ thị đệm trong bộ nhớ (in-memory cached graph). Mọi điểm số gợi ý thời gian thực sẽ được truy vấn nhanh từ bộ nhớ đệm này.

---

## 2. Thiết Kế Đồ Thị (Graph Schema Design)

Mô hình đồ thị tri thức trong dự án bao gồm:

### Điểm nút (Nodes):
- **User** `{id: Integer}`: Đại diện cho người dùng/khách hàng.
- **Product** `{id: Integer, name: String, category: String, price: Float}`: Đại diện cho sản phẩm.

### Mối liên kết (Relationships / Edges):
- `(u:User)-[:VIEW {weight: Integer}]->(p:Product)`: Khách hàng xem sản phẩm. Trọng số `weight` tăng dần theo số lần xem.
- `(u:User)-[:BUY {weight: Integer}]->(p:Product)`: Khách hàng thêm sản phẩm vào giỏ hàng hoặc mua sản phẩm.
- `(p1:Product)-[:SIMILAR {weight: Float}]->(p2:Product)`: Mối quan hệ tương đồng giữa 2 sản phẩm (cùng danh mục ngành hàng hoặc thường được mua chung).

---

## 3. Cách Kết Nối Neo4j Browser Console

Để truy cập bảng điều khiển trực quan hóa đồ thị:
1. Mở trình duyệt và truy cập: **[http://localhost:7474](http://localhost:7474)**
2. Đăng nhập bằng các thông số cấu hình dưới đây:
   - **Connection URL**: `bolt://localhost:7687`
   - **Username**: `neo4j`
   - **Password**: `neo4j_password`

---

## 4. Thư Viện Câu Lệnh Truy Vấn Cypher Quan Trọng

Dưới đây là các câu lệnh bạn có thể copy trực tiếp vào Neo4j Browser để thực thi:

### Nhóm 1: Xem Toàn Cảnh Cấu Trúc (General Graph & Schema)

#### 1.1 Xem toàn bộ đồ thị (Nodes & Links)
Vẽ toàn bộ đồ thị tri thức hiện có trong hệ thống (bao gồm các nút User, Product và tất cả các đường nối):
```cypher
MATCH (n) RETURN n
```
*(Nếu đồ thị quá lớn, khuyến nghị giới hạn số lượng hiển thị để trình duyệt mượt mà: `MATCH (n) RETURN n LIMIT 150`)*

#### 1.2 Trực quan hóa sơ đồ lớp (Schema Visualization)
Chỉ hiển thị thiết kế mô hình đồ thị (quan hệ giữa lớp `User` và lớp `Product`) mà không hiển thị từng nút dữ liệu cụ thể:
```cypher
CALL db.schema.visualization()
```

---

### Nhóm 2: Xem Chi Tiết Người Dùng Làm Trung Tâm (User-Centric Scene)

#### 2.1 Xem lịch sử tương tác trực tiếp của một User cụ thể
Tìm xem User có ID bằng `3` đã thực hiện hành vi `VIEW` hay `BUY` với những sản phẩm nào:
```cypher
MATCH (u:User {id: 3})-[r]->(p:Product)
RETURN u, r, p
```

#### 2.2 Xem đường đi đề xuất của thuật toán (2-Hop Recommendation Path)
Trực quan hóa cơ chế gợi ý: User $\rightarrow$ Sản phẩm đã tương tác $\rightarrow$ Các sản phẩm tương đồng được đề xuất kế cận:
```cypher
MATCH (u:User {id: 3})-[r:BUY|VIEW]->(p1:Product)-[s:SIMILAR]->(p2:Product)
RETURN u, r, p1, s, p2
```

#### 2.3 Xem hành vi tương tác chung giữa nhiều User (Collaborative View)
Hiển thị các sản phẩm được mua chung bởi các khách hàng khác nhau:
```cypher
MATCH (u1:User)-[r1:BUY]->(p:Product)<-[r2:BUY]-(u2:User)
WHERE u1.id <> u2.id
RETURN u1, r1, p, r2, u2 LIMIT 50
```

---

### Nhóm 3: Xem Điểm Nóng Sản Phẩm (Product-Hotspot Scene)

#### 3.1 Bảng xếp hạng sản phẩm "Hot" nhất (Top Interacted)
Truy vấn thống kê tổng hợp số lượng người tương tác và tổng trọng số hành vi trên từng sản phẩm:
```cypher
MATCH (u:User)-[r]->(p:Product)
RETURN p.id AS ID, p.name AS TenSanPham, p.category AS DanhMuc, count(u) AS SoNguoiTuongTac, sum(r.weight) AS TongTrongSo
ORDER BY TongTrongSo DESC
LIMIT 10
```

#### 3.2 Đồ thị bao quanh cụm sản phẩm phổ biến nhất
Vẽ đồ thị tập trung bao quanh 5 sản phẩm thu hút lượng tương tác cao nhất hệ thống:
```cypher
MATCH (u:User)-[r]->(p:Product)
WITH p, count(u) AS interaction_count
ORDER BY interaction_count DESC
LIMIT 5
MATCH (u2:User)-[r2]->(p)
RETURN u2, r2, p
```

#### 3.3 Mạng lưới tương đồng SIMILAR giữa các sản phẩm
Vẽ mạng lưới tương đồng giữa các sản phẩm để xem sự phân cụm theo ngành hàng:
```cypher
MATCH (p1:Product)-[r:SIMILAR]->(p2:Product)
RETURN p1, r, p2 LIMIT 40
```
