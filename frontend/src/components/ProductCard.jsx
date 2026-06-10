function domainLabel(domain) {
  if (domain === "electronics") return "Điện tử";
  if (domain === "book") return "Sách";
  if (domain === "fashion") return "Thời trang";
  return "Khác";
}

function ProductCard({ product, formatCurrency, onAddToCart, onViewDetail, compact = false }) {
  const finalPrice = product.final_price ?? product.price;
  const isDiscounted = (product.discount_percent || 0) > 0;
  const isOutOfStock = (product.stock || 0) <= 0;

  return (
    <article 
      className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${
        compact ? "p-2" : "p-3"
      }`}
    >
      {/* Phần hình ảnh */}
      <div 
        className="relative rounded-xl overflow-hidden cursor-pointer group aspect-square bg-gray-50 flex items-center justify-center"
        onClick={() => onViewDetail(product)} 
        role="button" 
        tabIndex={0}
      >
        <img
          src={product.image_url || "https://via.placeholder.com/700x500?text=Product"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isDiscounted && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow">
            -{product.discount_percent}%
          </span>
        )}
      </div>

      {/* Phần nội dung */}
      <div className="flex flex-col flex-grow mt-3">
        
        {/* Meta Line (Domain & Sold count) */}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">
            {domainLabel(product.domain)}
          </span>
          <span className="text-gray-400">Đã bán {product.sold_count || 0}</span>
        </div>

        {/* Tên sản phẩm */}
        <h4 
          title={product.name}
          className="font-bold text-gray-900 text-sm line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer mb-1 leading-snug"
          onClick={() => onViewDetail(product)}
        >
          {product.name}
        </h4>

        {/* Mô tả ngắn */}
        <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
          {product.short_description || product.description || "Không có mô tả chi tiết cho sản phẩm này."}
        </p>

        {/* Cụm Giá cả & Đánh giá (Đẩy xuống dưới bằng mt-auto) */}
        <div className="mt-auto space-y-2">
          {/* Cột giá */}
          <div className="flex items-baseline gap-2">
            <span className="text-red-600 text-lg font-extrabold tracking-tight">
              {formatCurrency(finalPrice)}
            </span>
            {isDiscounted && (
              <span className="text-gray-400 line-through text-xs">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="flex items-center text-amber-500">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold ml-1 text-gray-700">
                {Number(product.rating_avg || 0).toFixed(1)}
              </span>
            </div>
            <span>·</span>
            <span>{product.rating_count || 0} đánh giá</span>
          </div>

          {/* Nút hành động */}
          <div className="flex gap-2 pt-2">
            <button 
              className="flex-1 py-2 px-3 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all"
              onClick={() => onViewDetail(product)}
            >
              Chi tiết
            </button>
            <button 
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product.id)}
            >
              {isOutOfStock ? "Hết hàng" : "Mua ngay"}
            </button>
          </div>
        </div>

      </div>
    </article>
  );
}

export default ProductCard;
