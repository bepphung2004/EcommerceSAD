import { Truck, MapPin, RefreshCw, Calendar, ClipboardCheck, Box, Check } from "lucide-react";

function ShippingPage({ orders, shippingStatuses, onRefresh }) {
  const shipLabel = {
    processing: "Đang chuẩn bị",
    shipping: "Đang vận chuyển",
    delivered: "Đã giao hàng",
    failed: "Giao thất bại",
  };

  function getStep(status = "processing") {
    if (status === "delivered") return 3;
    if (status === "shipping") return 2;
    return 1;
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700 border border-green-200";
      case "failed":
        return "bg-red-50 text-red-700 border border-red-200";
      case "shipping":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "processing":
      default:
        return "bg-amber-50 text-amber-700 border border-amber-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Theo dõi vận chuyển</h2>
          <p className="text-xs text-gray-500 mt-1">Kiểm tra lộ trình giao hàng và thông tin vận chuyển</p>
        </div>
        <button 
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Cập nhật trạng thái
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có đơn vận chuyển</h3>
          <p className="text-gray-500 text-xs mb-4 max-w-xs mx-auto">
            Bạn chưa phát sinh đơn hàng nào cần vận chuyển. Hãy tiến hành mua sắm để cập nhật.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const shipment = shippingStatuses[order.id];
            const status = shipment?.status || "processing";
            const step = getStep(status);
            const badgeClass = getStatusBadgeStyle(status);

            return (
              <article 
                key={`ship-${order.id}`}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-6"
              >
                {/* Header Card */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Truck className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">Vận đơn #{order.id}</h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "Thời gian chưa rõ"}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                    {shipLabel[status] || status}
                  </div>
                </div>

                {/* TIMELINE TRACKING */}
                <div className="py-2 px-4">
                  <div className="flex items-center justify-between w-full relative">
                    
                    {/* Đường line đứt nối đằng sau */}
                    <div className="absolute left-4 right-4 top-4 h-0.5 bg-gray-200 -z-10"></div>
                    
                    {/* Bước 1: Chuẩn bị */}
                    <div className="flex flex-col items-center gap-2 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow transition-all ${
                        step >= 1 ? "bg-blue-600 text-white animate-pulse" : "bg-gray-200 text-gray-400"
                      }`}>
                        {step > 1 ? <Check className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                      </div>
                      <span className={`text-[11px] font-bold ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                        Chuẩn bị hàng
                      </span>
                    </div>

                    {/* Thanh nối 1-2 */}
                    <div className={`h-0.5 flex-grow mx-2 -mt-6 transition-all ${
                      step >= 2 ? "bg-blue-600" : "bg-gray-200"
                    }`}></div>

                    {/* Bước 2: Đang giao */}
                    <div className="flex flex-col items-center gap-2 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow transition-all ${
                        step >= 2 ? "bg-blue-600 text-white animate-pulse" : "bg-gray-200 text-gray-400"
                      }`}>
                        {step > 2 ? <Check className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      </div>
                      <span className={`text-[11px] font-bold ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                        Đang vận chuyển
                      </span>
                    </div>

                    {/* Thanh nối 2-3 */}
                    <div className={`h-0.5 flex-grow mx-2 -mt-6 transition-all ${
                      step >= 3 ? "bg-blue-600" : "bg-gray-200"
                    }`}></div>

                    {/* Bước 3: Đã nhận */}
                    <div className="flex flex-col items-center gap-2 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow transition-all ${
                        step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        {step >= 3 ? <Check className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                      </div>
                      <span className={`text-[11px] font-bold ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
                        Giao thành công
                      </span>
                    </div>

                  </div>
                </div>

                {/* Metadata & Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                  {/* Địa chỉ giao hàng */}
                  <div className="flex gap-2 items-start text-xs">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">Địa chỉ giao hàng</span>
                      <p className="text-gray-700 font-semibold leading-relaxed">
                        {shipment?.address || "Chưa cập nhật thông tin địa chỉ"}
                      </p>
                    </div>
                  </div>

                  {/* Mã Vận đơn */}
                  <div className="flex gap-2 items-start text-xs md:justify-end">
                    <div className="md:text-right">
                      <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider block mb-0.5">Mã vận đơn</span>
                      <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl text-xs font-mono font-bold inline-block mt-0.5">
                        {shipment?.id ? `LOG-SHP-${shipment.id}` : "ĐANG CHỜ TẠO"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ShippingPage;
