import { useState } from "react";

function AIChatAssistant({ defaultQuery, onAsk, onReloadRecommend, chatAnswer, suggestedProducts = [], onViewDetail }) {
  const [query, setQuery] = useState(defaultQuery !== undefined ? defaultQuery : "");
  const quickIntents = [
    "Laptop học tập dưới 700 USD",
    "Sách lập trình dễ hiểu",
    "Giày chạy bộ giá tốt",
  ];

  return (
    <section className="panel-section ai-assistant">
      <div className="section-head">
        <div>
          <p className="section-eyebrow">Trợ lý mua sắm</p>
          <h3>AI Assistant</h3>
        </div>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        placeholder="Ví dụ: Tôi cần laptop văn phòng dưới 700 USD"
      />

      <div className="quick-intents">
        {quickIntents.map((intent) => (
          <button key={intent} className="chip" onClick={() => setQuery(intent)}>
            {intent}
          </button>
        ))}
      </div>

      <div className="assistant-actions">
        <button className="btn ghost" onClick={() => onReloadRecommend(query)}>Làm mới gợi ý</button>
        <button className="btn" onClick={() => onAsk(query)}>Hỏi AI</button>
      </div>

      <div className="chat-answer-box">
        <h4>Kết quả tư vấn</h4>
        <p>{chatAnswer || "AI sẽ phân tích nhu cầu và trả về danh sách phù hợp nhất."}</p>
      </div>

      <div className="ai-picked-products">
        <h4>Sản phẩm AI đề xuất</h4>
        {suggestedProducts.length === 0 ? (
          <p className="muted">Chưa có sản phẩm được chọn từ AI.</p>
        ) : (
          <div className="picked-list">
            {suggestedProducts.map((p) => (
              <button key={p.id} className="picked-item" onClick={() => onViewDetail?.(p)}>
                <img src={p.image_url || "https://via.placeholder.com/120x90?text=P"} alt={p.name} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AIChatAssistant;
