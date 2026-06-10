import { useState, useEffect } from "react";
import { Trash2, ShoppingBag, ArrowLeft, MapPin, CreditCard, Home, Landmark, Navigation } from "lucide-react";

function CartPage({ cartItems, shippingAddress, setShippingAddress, formatCurrency, onCreateOrder, onRemoveItem, onGoShop }) {
  const total = cartItems.reduce((sum, i) => sum + i.subtotal, 0);

  // Khởi tạo các trường địa chỉ chi tiết
  const [houseNumber, setHouseNumber] = useState("");
  const [ward, setWard] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("Hà Nội");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [walletInfo, setWalletInfo] = useState("");

  // Giải mã địa chỉ hiện có nếu có định dạng để điền lại vào form
  useEffect(() => {
    if (shippingAddress && shippingAddress !== "Hà Nội" && !houseNumber && !ward && !district) {
      const parts = shippingAddress.split(",").map((p) => p.trim());
      if (parts.length >= 4) {
        setHouseNumber(parts[0] || "");
        setWard(parts[1] || "");
        setDistrict(parts[2] || "");
        setCity(parts[3] || "Hà Nội");
      } else if (parts.length > 0) {
        setHouseNumber(shippingAddress);
      }
    }
  }, [shippingAddress]);

  // Đồng bộ hóa ngược lại biến địa chỉ tổng trong App.jsx khi người dùng gõ
  useEffect(() => {
    const combined = [houseNumber, ward, district, city]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(", ");
    setShippingAddress(combined || "Hà Nội");
  }, [houseNumber, ward, district, city]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Giỏ hàng của bạn</h2>
          <p className="text-xs text-gray-500 mt-1">Đang chọn {cartItems.length} sản phẩm</p>
        </div>
        <button 
          onClick={onGoShop}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục mua sắm
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm max-w-lg mx-auto my-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Hãy khám phá các danh mục sản phẩm của QuickMall và thêm các mặt hàng yêu thích vào giỏ hàng.
          </p>
          <button 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all text-sm"
            onClick={onGoShop}
          >
            Khám phá Cửa hàng ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <article 
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex gap-4 items-center"
              >
                {/* Thumbnail */}
                <img 
                  src={item.product?.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop"} 
                  alt={item.product?.name || "Sản phẩm"} 
                  className="w-24 h-24 object-cover rounded-xl border border-gray-100 shadow-sm shrink-0"
                />
                
                {/* Info (Vertical Alignment) */}
                <div className="flex flex-col flex-grow min-w-0">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                    {item.product?.domain || "Sản phẩm"}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate leading-snug mb-1">
                    {item.product?.name || `Sản phẩm #${item.product_id}`}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Đơn giá: <span className="font-semibold text-gray-700">{formatCurrency(item.unitPrice)}</span></span>
                    <span>Số lượng: <span className="font-semibold text-gray-700">{item.quantity}</span></span>
                  </div>
                </div>

                {/* Subtotal & Actions */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <strong className="text-gray-900 text-base sm:text-lg font-extrabold">
                    {formatCurrency(item.subtotal)}
                  </strong>
                  <button 
                    onClick={() => onRemoveItem(item.product_id)}
                    className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors text-xs font-semibold hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-1 sticky top-24 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-gray-900 text-base border-b pb-3 border-gray-100">
              Tóm tắt đơn hàng
            </h3>

            {/* Form địa chỉ nhận hàng Chuyên nghiệp */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-blue-600" />
                Địa chỉ nhận hàng chi tiết
              </label>
              
              <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Home className="w-3 h-3 text-gray-400" /> Số nhà, ngõ ngách, tên đường
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="Ví dụ: Số 20, Ngõ 15, Đường Cầu Giấy"
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-gray-400" /> Phường / Xã / Thị trấn
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Ví dụ: Phường Dịch Vọng"
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-gray-400" /> Quận / Huyện / Thị xã
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ví dụ: Quận Cầu Giấy"
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" /> Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ví dụ: Hà Nội"
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Preview Địa chỉ hiển thị */}
              <div className="text-[11px] bg-blue-50/50 text-blue-800 p-3 rounded-xl border border-blue-100/50 leading-relaxed">
                <span className="font-bold block text-[10px] uppercase text-blue-600 mb-0.5">Địa chỉ ghi nhận:</span>
                {houseNumber || ward || district || city ? (
                  <span className="font-medium italic">
                    {[houseNumber, ward, district, city].filter(Boolean).join(", ")}
                  </span>
                ) : (
                  <span className="text-gray-400">Vui lòng điền thông tin địa chỉ...</span>
                )}
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === "COD"
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>💵 COD</span>
                    <span className="text-[9px] text-gray-400 font-normal">Nhận hàng thanh toán</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Momo")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === "Momo"
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>📱 Ví điện tử</span>
                    <span className="text-[9px] text-gray-400 font-normal">Ví Momo / Thẻ (Demo)</span>
                  </button>
                </div>

                {/* Trường nhập thông tin ví khi chọn Momo */}
                {paymentMethod === "Momo" && (
                  <div className="mt-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5 animate-fade-in">
                    <label className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                      Số điện thoại / Số tài khoản ví *
                    </label>
                    <input
                      type="text"
                      required
                      value={walletInfo}
                      onChange={(e) => setWalletInfo(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      className="w-full bg-white border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm font-semibold text-indigo-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết tính tiền */}
            <div className="space-y-2 text-xs border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính ({cartItems.length} món)</span>
                <span className="font-semibold text-gray-800">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-semibold">Miễn phí</span>
              </div>
            </div>

            {/* Tổng cộng */}
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Tổng thanh toán</span>
                <strong className="text-2xl font-extrabold text-red-600 tracking-tight">
                  {formatCurrency(total)}
                </strong>
              </div>

              <button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm group"
                onClick={() => {
                  if (paymentMethod === "Momo" && !walletInfo.trim()) {
                    alert("Vui lòng nhập số tài khoản hoặc số điện thoại ví điện tử!");
                    return;
                  }
                  onCreateOrder(paymentMethod, walletInfo);
                }}
              >
                <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Đặt hàng ngay
              </button>
              <p className="text-[10px] text-center text-gray-400">
                Nhấp đặt hàng đồng nghĩa với việc bạn đồng ý với Điều khoản mua sắm của QuickMall.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default CartPage;
