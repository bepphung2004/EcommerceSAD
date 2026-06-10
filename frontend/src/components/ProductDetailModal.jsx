function ProductDetailModal({ product, formatCurrency, onClose, onAddToCart }) {
  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-grid">
          <img src={product.image_url || "https://via.placeholder.com/900x700?text=Product"} alt={product.name} />
          <div>
            <p className="modal-domain">{product.domain}</p>
            <h3>{product.name}</h3>
            <p className="modal-desc">{product.description || product.short_description || "Không có mô tả"}</p>
            <div className="modal-price">{formatCurrency(product.final_price ?? product.price)}</div>
            <ul className="feature-list">
              <li>Tồn kho: {product.stock || 0}</li>
              <li>Đã bán: {product.sold_count || 0}</li>
              <li>Đánh giá: {Number(product.rating_avg || 0).toFixed(1)} / 5</li>
              <li>Lượt đánh giá: {product.rating_count || 0}</li>
            </ul>
            <button className="btn" disabled={(product.stock || 0) <= 0} onClick={() => onAddToCart(product.id)}>
              {(product.stock || 0) <= 0 ? "Hết hàng" : "Mua ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
