import ProductCard from "./ProductCard";

function RecommendationRail({ products, formatCurrency, onAddToCart, onViewDetail }) {
  return (
    <section className="panel-section">
      <div className="section-head">
        <div>
          <p className="section-eyebrow">Gợi ý dành cho bạn</p>
          <h3>AI Recommendation</h3>
        </div>
        <span>{products.length} sản phẩm phù hợp</span>
      </div>
      {products.length === 0 ? (
        <p className="muted">Chưa có gợi ý. Hãy nhập nhu cầu ở trợ lý AI để nhận kết quả chính xác hơn.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent snap-x snap-mandatory">
          {products.map((p) => (
            <div key={`rec-${p.id}`} className="w-[200px] sm:w-[240px] md:w-[260px] shrink-0 snap-start">
              <ProductCard
                product={p}
                compact
                formatCurrency={formatCurrency}
                onAddToCart={onAddToCart}
                onViewDetail={onViewDetail}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendationRail;
