import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle2, XCircle, RefreshCw, Calendar, MapPin, Eye, X, ClipboardList, ShieldCheck } from "lucide-react";

function OrdersPage({ orders, products = [], formatCurrency, onReload }) {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusText = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    paid: "Đã thanh toán",
    shipping: "Đang giao",
    delivered: "Giao thành công",
    failed: "Thất bại",
  };

  const productMap = useMemo(() => {
    return products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [products]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid":
      case "delivered":
        return {
          badge: "bg-green-50 text-green-700 border border-green-200",
          icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
          colorText: "text-green-600"
        };
      case "failed":
        return {
          badge: "bg-red-50 text-red-700 border border-red-200",
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          colorText: "text-red-600"
        };
      case "pending":
      case "processing":
      case "shipping":
      default:
        return {
          badge: "bg-amber-50 text-amber-700 border border-amber-200",
          icon: <Clock className="w-4 h-4 text-amber-600 animate-pulse" />,
          colorText: "text-amber-600"
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lịch sử đơn hàng</h2>
          <p className="text-xs text-gray-500 mt-1">Quản lý và theo dõi tiến trình đơn hàng của bạn</p>
        </div>
        <button 
          onClick={onReload}
          className="inline-flex items-center gap-2 text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-gray-500 text-xs mb-4 max-w-xs mx-auto">
            Bạn chưa đặt mua đơn hàng nào. Hãy quay lại trang cửa hàng để chốt các sản phẩm ưng ý nhất.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const { badge, icon } = getStatusStyle(order.status);
            const totalProducts = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);

            return (
              <article 
                key={order.id} 
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4"
              >
                {/* Header Card */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Package className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">Đơn hàng #{order.id}</h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "Thời gian chưa rõ"}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                    {icon}
                    <span>{statusText[order.status] || order.status}</span>
                  </div>
                </div>

                {/* Body Card (Product List) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Sản phẩm đã mua ({totalProducts}):
                    </p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => navigate("/shipping")}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Theo dõi vận đơn
                      </button>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem chi tiết đơn
                      </button>
                    </div>
                  </div>
                  
                  {/* Danh sách items của đơn */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(order.items || []).slice(0, 2).map((item, idx) => {
                      const prod = productMap[item.product_id];
                      return (
                        <div 
                          key={`${order.id}-${idx}`} 
                          className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex items-center gap-2.5"
                        >
                          <img 
                            src={prod?.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop"} 
                            alt={prod?.name || "Sản phẩm"}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="min-w-0 flex-grow">
                            <h5 className="text-xs font-bold text-gray-900 truncate">
                              {prod?.name || `Sản phẩm #${item.product_id}`}
                            </h5>
                            <p className="text-[10px] text-gray-500">
                              SL: <span className="font-semibold text-gray-700">{item.quantity}</span> · Đơn giá: <span className="font-semibold text-blue-600">{formatCurrency(item.price)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {(order.items || []).length > 2 && (
                      <div className="bg-blue-50/50 border border-blue-100/50 text-blue-600 rounded-xl p-2.5 flex items-center justify-center text-xs font-bold">
                        + {(order.items || []).length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Card */}
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center mt-2">
                  <span className="text-[10px] text-gray-400 font-medium hidden sm:inline-block">Cảm ơn bạn đã tin tưởng mua sắm tại QuickMall</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500 font-medium">Tổng thanh toán:</span>
                    <strong className="text-base sm:text-lg font-extrabold text-red-600 tracking-tight">
                      {formatCurrency(order.total_price)}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-base">Chi tiết đơn hàng #{selectedOrder.id}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Khởi tạo: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("vi-VN") : "N/A"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Order Status Timeline Banner */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái xử lý</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${selectedOrder.status === 'delivered' || selectedOrder.status === 'paid' ? 'bg-green-500 animate-ping' : selectedOrder.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-ping'}`}></span>
                    <strong className="text-sm text-gray-900 capitalize">
                      {statusText[selectedOrder.status] || selectedOrder.status}
                    </strong>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-xs font-extrabold ${getStatusStyle(selectedOrder.status).badge}`}>
                  {statusText[selectedOrder.status] || selectedOrder.status}
                </div>
              </div>

              {/* Delivery Address Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Địa chỉ giao hàng chi tiết
                </h4>
                <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4">
                  <p className="text-xs text-blue-900 font-medium leading-relaxed">
                    {selectedOrder.address || "N/A"}
                  </p>
                </div>
              </div>

              {/* Product Items Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Chi tiết các sản phẩm
                </h4>
                
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {(selectedOrder.items || []).map((item, idx) => {
                    const prod = productMap[item.product_id];
                    return (
                      <div key={idx} className="p-3.5 flex gap-4 items-center bg-white hover:bg-gray-50/50 transition-colors">
                        <img 
                          src={prod?.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop"} 
                          alt={prod?.name || "Sản phẩm"}
                          className="w-14 h-14 object-cover rounded-xl border border-gray-200"
                        />
                        <div className="min-w-0 flex-grow">
                          <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                            {prod?.domain || "QuickMall"}
                          </span>
                          <h5 className="text-xs font-bold text-gray-900 truncate mt-0.5">
                            {prod?.name || `Sản phẩm mã #${item.product_id}`}
                          </h5>
                          <div className="flex gap-4 text-[10px] text-gray-400 mt-1">
                            <span>Đơn giá: <span className="font-semibold text-gray-700">{formatCurrency(item.price)}</span></span>
                            <span>Số lượng: <span className="font-semibold text-gray-700">{item.quantity}</span></span>
                          </div>
                        </div>
                        <strong className="text-xs text-gray-900 font-extrabold shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Summary Invoice Details */}
              <div className="border-t border-gray-100 pt-4 space-y-2.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tổng tiền hàng (tạm tính):</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(selectedOrder.total_price)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Phí dịch vụ & vận chuyển:</span>
                  <span className="text-green-600 font-semibold">Miễn phí (QuickMall SmartShip)</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-gray-100">
                  <span className="text-xs font-bold text-gray-900">Tổng thanh toán thực tế:</span>
                  <strong className="text-xl font-extrabold text-red-600 tracking-tight">
                    {formatCurrency(selectedOrder.total_price)}
                  </strong>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Giao dịch bảo mật 100%
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                Đóng chi tiết
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
