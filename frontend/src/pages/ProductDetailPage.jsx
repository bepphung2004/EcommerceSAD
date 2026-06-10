import { useParams, useNavigate } from "react-router-dom";

function ProductDetailPage({ formatCurrency, onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow p-8 border border-gray-100 max-w-4xl mx-auto my-8">
      <button 
        onClick={() => navigate("/shop")} 
        className="mb-6 inline-flex items-center text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
      >
        ← Quay lại Cửa hàng
      </button>
      
      <div className="text-center py-12">
        <span className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 inline-flex items-center justify-center text-2xl font-bold mb-4">
          i
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chi tiết sản phẩm #{id}</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Trang chi tiết sản phẩm này đang được phát triển ở Bước tiếp theo. Cảm ơn sự kiên nhẫn của bạn!
        </p>
        <button 
          onClick={() => onAddToCart(id)} 
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/10 transition-all"
        >
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}

export default ProductDetailPage;
