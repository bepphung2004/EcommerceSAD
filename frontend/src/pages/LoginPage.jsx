import { useState } from "react";
import { LogIn, UserPlus, ShoppingBag, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

function LoginPage({ username, password, setUsername, setPassword, onLogin, onRegister }) {
  const [activeTab, setActiveTab] = useState("login");

  const quickAccounts = [
    {
      role: "Khách hàng",
      user: "customer",
      pass: "customer123",
      desc: "Trải nghiệm mua sắm, giỏ hàng, thanh toán và theo dõi vận chuyển.",
      color: "from-blue-500 to-indigo-500",
      icon: <ShoppingBag className="w-4 h-4" />
    },
    {
      role: "Quản trị viên",
      user: "admin",
      pass: "admin123",
      desc: "Xem thống kê, quản lý kho hàng, duyệt đơn hàng và danh sách người dùng.",
      color: "from-purple-500 to-pink-500",
      icon: <ShieldCheck className="w-4 h-4" />
    },
    {
      role: "Nhân viên",
      user: "staff",
      pass: "staff123",
      desc: "Xem thống kê kinh doanh, sửa giá/kho hàng và cập nhật đơn vận chuyển.",
      color: "from-teal-500 to-emerald-500",
      icon: <Cpu className="w-4 h-4" />
    }
  ];

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT SIDE: Brand & Value Pitch */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 p-8 sm:p-12 flex flex-col justify-between text-white relative">
          {/* Overlay Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl inline-flex items-center justify-center font-extrabold text-blue-600 bg-white text-lg shadow-lg">
                Q
              </span>
              <div>
                <h1 className="font-extrabold text-white text-xl tracking-tight leading-none">QuickMall</h1>
                <span className="text-[10px] text-blue-200 font-medium">Microservices Platform</span>
              </div>
            </div>

            <div className="pt-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                Nền tảng mua sắm đẳng cấp tích hợp Trợ lý AI
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed font-light">
                Trải nghiệm sàn thương mại điện tử chuyên nghiệp với tốc độ cực nhanh, hệ thống thanh toán & vận chuyển chuẩn hóa, cùng giao diện tương tác cao.
              </p>
            </div>
          </div>

          <div className="relative pt-12 space-y-4 border-t border-white/10 mt-8">
            <div className="flex items-center gap-3 text-xs text-blue-200">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
              <span>Hệ thống Microservices đã sẵn sàng hoạt động</span>
            </div>
            <p className="text-[11px] text-blue-200/70 leading-normal">
              © {new Date().getFullYear()} QuickMall. Giải pháp thiết kế UI/UX tối ưu chuẩn thương mại điện tử hiện đại.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Interactive Login Form & Test Accounts */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-slate-950/40">
          <div className="w-full max-w-md mx-auto space-y-8">
            
            {/* Title / Tab Selector */}
            <div className="space-y-2">
              <div className="flex border-b border-white/5 pb-1">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`pb-3 pr-6 text-lg font-bold border-b-2 transition-all ${
                    activeTab === "login"
                      ? "text-blue-500 border-blue-500"
                      : "text-gray-400 border-transparent hover:text-gray-200"
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`pb-3 px-6 text-lg font-bold border-b-2 transition-all ${
                    activeTab === "register"
                      ? "text-blue-500 border-blue-500"
                      : "text-gray-400 border-transparent hover:text-gray-200"
                  }`}
                >
                  Đăng ký
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {activeTab === "login"
                  ? "Vui lòng nhập tài khoản để truy cập hệ thống của QuickMall"
                  : "Đăng ký tài khoản khách hàng mới để trải nghiệm mua sắm"}
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Tên đăng nhập</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white rounded-xl py-3 px-4 text-sm transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white rounded-xl py-3 px-4 text-sm transition-all outline-none"
                />
              </div>

              <button
                onClick={activeTab === "login" ? onLogin : onRegister}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 text-sm mt-6 active:scale-95"
              >
                {activeTab === "login" ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Đăng nhập hệ thống
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Đăng ký tài khoản
                  </>
                )}
              </button>
            </div>

            {/* QUICK ACCOUNTS ACORDION FOR TESTING */}
            <div className="space-y-3 pt-6 border-t border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                👉 Tài khoản dùng thử hệ thống (Nhấp để điền nhanh)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {quickAccounts.map((acc) => (
                  <button
                    key={acc.user}
                    onClick={() => handleQuickFill(acc.user, acc.pass)}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-3 text-left transition-all duration-200 focus:outline-none flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-gray-200">{acc.role}</span>
                      <span className="text-gray-400 group-hover:text-blue-400 transition-colors">
                        {acc.icon}
                      </span>
                    </div>
                    <div>
                      <code className="text-xs font-mono font-bold text-blue-400">{acc.user}</code>
                      <p className="text-[9px] text-gray-400 leading-tight mt-1 line-clamp-2">
                        {acc.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
