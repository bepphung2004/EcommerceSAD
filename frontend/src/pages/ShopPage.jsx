import { useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductDetailModal from "../components/ProductDetailModal";
import RecommendationRail from "../components/RecommendationRail";
import AIChatAssistant from "../components/AIChatAssistant";
import ProductSpotlight from "../components/ProductSpotlight";

function domainLabel(domain) {
  if (domain === "all") return "Tất cả";
  if (domain === "electronics") return "Điện tử";
  if (domain === "book") return "Sách";
  if (domain === "fashion") return "Thời trang";
  return domain;
}

function ShopPage({
  products,
  displayedProducts,
  recommendations,
  selectedDomain,
  setSelectedDomain,
  searchKeyword,
  setSearchKeyword,
  formatCurrency,
  onAddToCart,
  onViewDetail,
  detailProduct,
  onCloseDetail,
  onAskAI,
  onRefreshRecommend,
  chatAnswer,
  chatbotRecommendations = [],
  spotlightProduct,
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const domainCount = {
    all: products.length,
    electronics: products.filter((p) => p.domain === "electronics").length,
    book: products.filter((p) => p.domain === "book").length,
    fashion: products.filter((p) => p.domain === "fashion").length,
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-100 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest bg-blue-100/50 px-2.5 py-0.5 rounded-full">
            Ưu đãi mỗi ngày
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
            QuickMall - Mua sắm thông minh cùng AI
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-lg">
            Trải nghiệm động cơ gợi ý lai thông minh, tìm sản phẩm bằng AI Chatbot và chốt đơn nhanh chóng chỉ trong vài thao tác.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 shrink-0">
          <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center shadow-sm min-w-[75px] sm:min-w-[90px]">
            <strong className="block text-xl font-extrabold text-blue-600">{products.length}</strong>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Sản phẩm</span>
          </div>
          <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center shadow-sm min-w-[75px] sm:min-w-[90px]">
            <strong className="block text-xl font-extrabold text-indigo-600">{domainCount.electronics}</strong>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Điện tử</span>
          </div>
          <div className="bg-white border border-gray-100 p-2.5 rounded-xl text-center shadow-sm min-w-[75px] sm:min-w-[90px]">
            <strong className="block text-xl font-extrabold text-amber-500">{domainCount.book + domainCount.fashion}</strong>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Đời sống</span>
          </div>
        </div>
      </section>

      {/* Main Layout Container */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR (Desktop: 1/4 width, Mobile: full width / collapsible) */}
        <aside className="w-full lg:w-1/4 space-y-6">
          {/* Domain Category Filter */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider border-b pb-3 border-gray-100">
              Danh mục sản phẩm
            </h3>
            
            {/* Desktop vertical list */}
            <div className="hidden lg:flex flex-col gap-1.5">
              {["all", "electronics", "book", "fashion"].map((domain) => {
                const isActive = selectedDomain === domain;
                return (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`flex items-center justify-between w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    <span>{domainLabel(domain)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {domainCount[domain]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile horizontal scroll list */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
              {["all", "electronics", "book", "fashion"].map((domain) => {
                const isActive = selectedDomain === domain;
                return (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      isActive 
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {domainLabel(domain)} ({domainCount[domain]})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spotlight Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <ProductSpotlight
              product={spotlightProduct}
              formatCurrency={formatCurrency}
              onAddToCart={onAddToCart}
              onViewDetail={onViewDetail}
            />
          </div>
        </aside>

        {/* CATALOG / PRODUCT GRID (3/4 width) */}
        <div className="w-full lg:w-3/4 space-y-8">
          
          {/* AI Recommendation Section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm bg-gradient-to-tr from-indigo-50/20 via-white to-white">
            <RecommendationRail
              products={recommendations}
              formatCurrency={formatCurrency}
              onAddToCart={onAddToCart}
              onViewDetail={onViewDetail}
            />
          </div>

          {/* All Products Catalog */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-4 border-gray-100 flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Danh sách sản phẩm</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tìm thấy {displayedProducts.length} sản phẩm phù hợp</p>
              </div>
            </div>

            {displayedProducts.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
                <span className="text-4xl">🔍</span>
                <h4 className="font-bold text-gray-800 mt-4">Không tìm thấy sản phẩm</h4>
                <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto">
                  Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc chọn danh mục khác.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {displayedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    formatCurrency={formatCurrency}
                    onAddToCart={onAddToCart}
                    onViewDetail={onViewDetail}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* FLOATING AI CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window Popup */}
        {isChatOpen && (
          <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-3xl border border-gray-200 shadow-2xl flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
            {/* Header of Chatbox */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">🤖</span>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">Trợ lý Mua sắm AI</h4>
                  <span className="text-[10px] text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-ping"></span>
                    Đang trực tuyến
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold bg-white/10 hover:bg-white/20 w-8 h-8 flex items-center justify-center rounded-full transition-all"
              >
                ×
              </button>
            </div>
            
            {/* Chat Body hosting AIChatAssistant with customized scroll */}
            <div className="flex-grow overflow-y-auto p-2 bg-gray-50">
              <AIChatAssistant
                defaultQuery=""
                onAsk={onAskAI}
                onReloadRecommend={onRefreshRecommend}
                chatAnswer={chatAnswer}
                suggestedProducts={chatbotRecommendations}
                onViewDetail={onViewDetail}
              />
            </div>
          </div>
        )}

        {/* Toggler Badge Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-full shadow-2xl text-white font-bold transition-all duration-300 transform hover:scale-105 ${
            isChatOpen 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30"
          }`}
        >
          {isChatOpen ? (
            <>
              <span>Đóng Trợ lý</span>
              <span className="text-lg">✖</span>
            </>
          ) : (
            <>
              <span className="animate-bounce">💬</span>
              <span>Tư vấn AI</span>
              {recommendations.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-inner animate-pulse">
                  {recommendations.length}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        formatCurrency={formatCurrency}
        onClose={onCloseDetail}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}

export default ShopPage;
