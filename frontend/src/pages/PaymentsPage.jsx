import { CreditCard, CheckCircle2, XCircle, Clock, RefreshCw, Calendar, Tag } from "lucide-react";

function PaymentsPage({ orders, paymentStatuses, formatCurrency, onRefresh }) {
  const paymentLabel = {
    pending: "Chờ thanh toán",
    success: "Thanh toán thành công",
    paid: "Đã thanh toán",
    failed: "Thanh toán lỗi",
  };

  const getPaymentStyle = (status) => {
    switch (status) {
      case "success":
      case "paid":
        return {
          badge: "bg-green-50 text-green-700 border border-green-200",
          icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        };
      case "failed":
        return {
          badge: "bg-red-50 text-red-700 border border-red-200",
          icon: <XCircle className="w-4 h-4 text-red-600" />,
        };
      case "pending":
      default:
        return {
          badge: "bg-amber-50 text-amber-700 border border-amber-200",
          icon: <Clock className="w-4 h-4 text-amber-600 animate-pulse" />,
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Trạng thái thanh toán</h2>
          <p className="text-xs text-gray-500 mt-1">Theo dõi các giao dịch hóa đơn và kênh thanh toán</p>
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
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có giao dịch nào</h3>
          <p className="text-gray-500 text-xs mb-4 max-w-xs mx-auto">
            Bạn chưa có dữ liệu giao dịch thanh toán nào phát sinh. Hãy tiến hành đặt đơn để xem tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const pay = paymentStatuses[order.id];
            const status = pay?.status || "pending";
            const { badge, icon } = getPaymentStyle(status);

            return (
              <article 
                key={`pay-${order.id}`} 
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">Giao dịch đơn #{order.id}</h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "Thời gian chưa rõ"}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge}`}>
                    {icon}
                    <span>{paymentLabel[status] || status}</span>
                  </div>
                </div>

                {/* Content: Details & Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kênh thanh toán */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Kênh thanh toán</span>
                    <div>
                      <strong className="text-gray-900 text-sm font-extrabold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {pay?.method === "COD" ? "Thanh toán khi nhận hàng (COD)" : (pay?.method || "Thanh toán bằng COD (Tiền mặt)")}
                      </strong>
                      {pay?.wallet_details && (
                        <p className="text-[11px] text-indigo-600 font-semibold mt-1 pl-3.5">
                          SĐT/Tài khoản ví: {pay.wallet_details}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Mã Giao dịch */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mã giao dịch</span>
                    <span className="text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl text-xs font-mono font-bold w-fit flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      {pay?.id ? `PAY-REF-${pay.id}` : "CHƯA PHÁT SINH"}
                    </span>
                  </div>
                </div>

                {/* Footer Payment */}
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">Giao dịch được xử lý bảo mật bởi QuickMall Gateway</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Số tiền giao dịch:</span>
                    <strong className="text-lg sm:text-xl font-extrabold text-red-600 tracking-tight">
                      {formatCurrency(pay?.amount ?? order.total_price)}
                    </strong>
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

export default PaymentsPage;
