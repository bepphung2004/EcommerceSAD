function ProductSpotlight({ product, formatCurrency, onAddToCart, onViewDetail }) {
  if (!product) {
    return (
      <section className="panel-section spotlight-panel">
        <div className="section-head">
          <div>
            <p className="section-eyebrow">Chi tiết sản phẩm</p>
            <h3>Spotlight</h3>
          </div>
        </div>
        <p className="muted">Chọn một sản phẩm ở danh sách bên trái hoặc từ gợi ý AI để xem chi tiết nhanh.</p>
      </section>
    );
  }

  return (
    <section className="panel-section spotlight-panel">
      <div className="section-head">
        <div>
          <p className="section-eyebrow">Chi tiết sản phẩm</p>
          <h3>Spotlight</h3>
        </div>
      </div>

      <div className="spotlight-image-wrap" onClick={() => onViewDetail(product)} role="button" tabIndex={0}>
        <img src={product.image_url || "https://via.placeholder.com/700x500?text=Product"} alt={product.name} className="spotlight-image" />
      </div>

      <p className="spotlight-domain">{product.domain}</p>
      <h4>{product.name}</h4>
      <p className="spotlight-desc">{product.short_description || product.description || "Không có mô tả"}</p>
      <p className="spotlight-price">{formatCurrency(product.final_price ?? product.price)}</p>

      <div className="spotlight-meta">
        <span>Tồn kho: {product.stock || 0}</span>
        <span>Đã bán: {product.sold_count || 0}</span>
      </div>

      <div className="card-actions">
        <button className="btn ghost" onClick={() => onViewDetail(product)}>Xem chi tiết đầy đủ</button>
        <button className="btn" onClick={() => onAddToCart(product.id)} disabled={(product.stock || 0) <= 0}>
          {(product.stock || 0) <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </section>
  );
}

export default ProductSpotlight;
