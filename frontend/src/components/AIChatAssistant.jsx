import { useState, useEffect, useRef } from "react";

function AIChatAssistant({
  chatHistory = [],
  onAsk,
  isLoading,
  onViewDetail,
  formatCurrency,
}) {
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef(null);

  const quickIntents = [
    "Laptop văn phòng dưới 700 USD",
    "Sách lập trình dễ hiểu",
    "Giày chạy bộ giá tốt",
  ];

  const format = formatCurrency || ((val) => `$${val}`);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onAsk(query.trim());
    setQuery("");
  };

  const handleIntentClick = (intent) => {
    if (isLoading) return;
    onAsk(intent);
  };

  const parseInlineStyles = (str) => {
    const parts = str.split("**");
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-gray-900">{part}</strong>;
      }
      return part;
    });
  };

  const parseMarkdown = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    let inList = false;
    let inNumberedList = false;
    let listItems = [];
    const elements = [];

    const flushLists = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-5 my-2 space-y-1 text-gray-700">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      if (inNumberedList && listItems.length > 0) {
        elements.push(
          <ol key={`numlist-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1 text-gray-700">
            {listItems}
          </ol>
        );
        listItems = [];
        inNumberedList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushLists();
        return;
      }

      // Check bullet list
      const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        if (inNumberedList) flushLists();
        inList = true;
        listItems.push(
          <li key={`li-${idx}`} className="text-sm text-gray-700">
            {parseInlineStyles(bulletMatch[1])}
          </li>
        );
        return;
      }

      // Check numbered list
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        if (inList) flushLists();
        inNumberedList = true;
        listItems.push(
          <li key={`num-li-${idx}`} className="text-sm text-gray-700">
            {parseInlineStyles(numberedMatch[2])}
          </li>
        );
        return;
      }

      flushLists();
      elements.push(
        <p key={`p-${idx}`} className="text-sm text-gray-700 leading-relaxed mb-2">
          {parseInlineStyles(trimmed)}
        </p>
      );
    });

    flushLists();
    return elements;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Scrollable Chat History */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {chatHistory.map((msg) => {
          const isAI = msg.sender === "ai";
          return (
            <div key={msg.id} className={`flex flex-col ${isAI ? "items-start" : "items-end"} space-y-1`}>
              <span className="text-[10px] text-gray-400 font-semibold px-2">
                {isAI ? "QuickMall AI" : "Bạn"}
              </span>

              {/* Message bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  isAI
                    ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                }`}
              >
                <div className={`space-y-1 ${isAI ? "text-gray-800" : "text-white"}`}>
                  {isAI ? (
                    parseMarkdown(msg.text)
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>

              {/* Inline Product Recommendations */}
              {isAI && msg.products && msg.products.length > 0 && (
                <div className="w-full max-w-[95%] mt-2 pl-2 space-y-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    🎁 Sản phẩm gợi ý:
                  </span>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {msg.products.map((p) => {
                      const finalPrice = p.final_price ?? p.price;
                      return (
                        <div
                          key={p.id}
                          className="flex-shrink-0 w-[200px] bg-white border border-gray-100 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50 mb-2 flex items-center justify-center">
                              <img
                                src={p.image_url || "https://via.placeholder.com/200x120?text=Product"}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h5
                              className="font-bold text-xs text-gray-800 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
                              onClick={() => onViewDetail?.(p)}
                            >
                              {p.name}
                            </h5>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-blue-600 font-extrabold text-xs">
                              {format(finalPrice)}
                            </span>
                            <button
                              onClick={() => onViewDetail?.(p)}
                              className="text-[10px] font-extrabold text-gray-500 bg-gray-100 hover:bg-blue-600 hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[10px] text-gray-400 font-semibold px-2">QuickMall AI</span>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggest chips */}
      <div className="px-3 pt-2 pb-1.5 bg-gray-50 border-t border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickIntents.map((intent) => (
            <button
              key={intent}
              onClick={() => handleIntentClick(intent)}
              disabled={isLoading}
              className="flex-shrink-0 whitespace-nowrap text-xs bg-white text-gray-600 border border-gray-200 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none px-3 py-1.5 rounded-full transition-all shadow-sm font-medium"
            >
              {intent}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? "AI đang phản hồi..." : "Đặt câu hỏi cho AI..."}
          className="flex-grow bg-gray-100 hover:bg-gray-50 focus:bg-white text-gray-700 text-sm px-4 py-2.5 rounded-full outline-none border border-transparent focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="w-10 h-10 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full flex items-center justify-center transition-all shadow hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 transform rotate-45 translate-x-[-1px] translate-y-[1px] fill-current" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default AIChatAssistant;
