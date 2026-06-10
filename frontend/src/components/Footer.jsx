import { ShieldCheck, Server, Database, Globe, Network, Cpu, FileText } from "lucide-react";

function Footer({ userRole }) {
  const isAdminOrStaff = userRole === "admin" || userRole === "staff";

  if (isAdminOrStaff) {
    /* WORKSPACE FOOTER: Clean, professional, system-oriented for Administrative users */
    return (
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900 mt-auto font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-slate-900 pb-6 mb-6">
            
            {/* Column 1: System Branding */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center font-extrabold text-white bg-indigo-600 text-sm shadow-md shadow-indigo-500/20">
                Q
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-white text-sm tracking-wide">QuickMall Workspace</h4>
                  <span className="text-[8px] font-extrabold bg-indigo-950 text-indigo-400 border border-indigo-900 px-1 rounded">V1.0</span>
                </div>
                <p className="text-[10px] text-slate-500">Hệ thống phân phối vi dịch vụ tích hợp AI</p>
              </div>
            </div>

            {/* Column 2: Live Service Indicators */}
            <div className="flex flex-wrap items-center gap-4 justify-start md:justify-center text-[10px] font-semibold">
              <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-slate-300">
                <Server className="w-3 h-3 text-emerald-400 shrink-0" />
                API Gateway: <span className="text-emerald-400">Online</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-slate-300">
                <Cpu className="w-3 h-3 text-indigo-400 shrink-0" />
                AI-Service: <span className="text-indigo-400">Ready</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-slate-300">
                <Database className="w-3 h-3 text-blue-400 shrink-0" />
                Databases: <span className="text-blue-400">Connected</span>
              </span>
            </div>

            {/* Column 3: Security & Role notification */}
            <div className="flex items-center gap-2 justify-start md:justify-end text-[10px] text-indigo-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Chế độ giám sát: <span className="font-bold uppercase tracking-wider text-white bg-indigo-950 border border-indigo-900 px-2 py-0.5 rounded-full">{userRole === "admin" ? "Admin" : "Staff"}</span></span>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 gap-3">
            <p>© {new Date().getFullYear()} QuickMall Operations Control Center. Bảo lưu mọi quyền.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 transition-colors flex items-center gap-1"><Network className="w-3 h-3" /> Microservices Architecture</span>
              <span className="hover:text-slate-400 transition-colors flex items-center gap-1"><FileText className="w-3 h-3" /> Logs & Audits</span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  /* STOREFRONT FOOTER: Premium, e-commerce centered for Customer users */
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl inline-flex items-center justify-center font-extrabold text-white bg-gradient-to-tr from-blue-600 to-indigo-500 text-lg shadow-md shadow-blue-500/20">
                Q
              </span>
              <div>
                <h3 className="font-extrabold text-white text-lg tracking-wide">QuickMall</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Smart Shopping Platform</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              QuickMall - Nền tảng mua sắm trực tuyến thông minh, tối ưu hóa trải nghiệm khách hàng với tốc độ vượt trội và gợi ý mua sắm cá nhân hóa từ AI.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 pt-1.5 border-t border-slate-800/80">
              <p>📍 Cầu Giấy, Hà Nội, Việt Nam</p>
              <p>📞 Hotline: 1900 6789 (8:00 - 22:00)</p>
              <p>✉️ Hỗ trợ: support@quickmall.vn</p>
            </div>
          </div>

          {/* Cột 2: Hỗ trợ khách hàng */}
          <div>
            <h4 className="font-extrabold text-white mb-4 uppercase tracking-wider text-[10px] text-slate-200">Hỗ Trợ Khách Hàng</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <a href="#faq" className="hover:text-blue-400 transition-colors duration-200 block">Trung tâm trợ giúp & FAQs</a>
              </li>
              <li>
                <a href="#tracking" className="hover:text-blue-400 transition-colors duration-200 block">Theo dõi đơn hàng</a>
              </li>
              <li>
                <a href="#returns" className="hover:text-blue-400 transition-colors duration-200 block">Chính sách đổi trả & hoàn tiền</a>
              </li>
              <li>
                <a href="#warranty" className="hover:text-blue-400 transition-colors duration-200 block">Chính sách bảo hành sản phẩm</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-blue-400 transition-colors duration-200 block">Liên hệ hỗ trợ kỹ thuật</a>
              </li>
            </ul>
          </div>

          {/* Cột 3: Chính sách & Quy định */}
          <div>
            <h4 className="font-extrabold text-white mb-4 uppercase tracking-wider text-[10px] text-slate-200">Chính Sách & Quy Định</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <a href="#terms" className="hover:text-blue-400 transition-colors duration-200 block">Điều khoản dịch vụ</a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-blue-400 transition-colors duration-200 block">Chính sách bảo mật thông tin</a>
              </li>
              <li>
                <a href="#shipping-policy" className="hover:text-blue-400 transition-colors duration-200 block">Quy chế hoạt động sàn</a>
              </li>
              <li>
                <a href="#dispute" className="hover:text-blue-400 transition-colors duration-200 block">Giải quyết tranh chấp khiếu nại</a>
              </li>
              <li>
                <a href="#copyright" className="hover:text-blue-400 transition-colors duration-200 block">Bản quyền & Sở hữu trí tuệ</a>
              </li>
            </ul>
          </div>

          {/* Cột 4: Phương thức thanh toán & Vận chuyển */}
          <div className="space-y-6">
            <div>
              <h4 className="font-extrabold text-white mb-3 uppercase tracking-wider text-[10px] text-slate-200">Thanh Toán An Toàn</h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">Visa / Mastercard</span>
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">Ví Momo</span>
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">ZaloPay</span>
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">COD</span>
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-3 uppercase tracking-wider text-[10px] text-slate-200">Đối Tác Vận Chuyển</h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">Giao Hàng Nhanh</span>
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">Ninja Van</span>
                <span className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded text-slate-300 border border-slate-700">GrabExpress</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} QuickMall Microservices E-Commerce. Bảo lưu mọi quyền.</p>
          <div className="flex gap-4">
            <a href="#fb" className="hover:text-white transition-colors duration-200">Facebook</a>
            <a href="#yt" className="hover:text-white transition-colors duration-200">Youtube</a>
            <a href="#tw" className="hover:text-white transition-colors duration-200">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
