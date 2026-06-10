import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, LogOut, Search, ShieldAlert, BadgeInfo, UserCircle, Briefcase } from "lucide-react";

function Header({ cartCount, onLogout, searchKeyword, setSearchKeyword, userRole }) {
  const isAdminOrStaff = userRole === "admin" || userRole === "staff";

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
        
        {/* LOGO & BRAND (Left Column) */}
        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
          <Link to={isAdminOrStaff ? "/admin" : "/shop"} className="flex items-center gap-3 group">
            <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center font-extrabold text-white text-lg shadow-md transition-transform duration-300 group-hover:scale-105 ${
              isAdminOrStaff 
                ? "bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/20" 
                : "bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/20"
            }`}>
              Q
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-gray-900 text-lg tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                  QuickMall
                </h1>
                {isAdminOrStaff && (
                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Portal
                  </span>
                )}
              </div>
              <span className="text-[9px] text-gray-400 font-medium">
                {isAdminOrStaff ? "Hệ thống Quản trị & Vận hành" : "Microservices Storefront"}
              </span>
            </div>
          </Link>
          
          {/* Mobile logout or info (visible only on mobile) */}
          <div className="flex items-center gap-2 md:hidden">
            {isAdminOrStaff ? (
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${
                userRole === "admin" 
                  ? "bg-rose-50 text-rose-700 border-rose-100" 
                  : "bg-teal-50 text-teal-700 border-teal-100"
              }`}>
                {userRole === "admin" ? "Quản trị" : "Nhân viên"}
              </span>
            ) : (
              cartCount > 0 && (
                <Link to="/cart" className="relative p-1.5 bg-blue-50 text-blue-600 rounded-full">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                </Link>
              )
            )}
          </div>
        </div>

        {/* SEARCH BAR (Middle Column - CUSTOMERS ONLY) */}
        {!isAdminOrStaff ? (
          <div className="w-full md:w-5/12 lg:w-4/12">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm tên sản phẩm cần mua..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-full py-2 pl-4 pr-10 text-xs sm:text-sm transition-all outline-none bg-gray-50/70 hover:bg-gray-100/50"
              />
              <div className="absolute right-1 top-1">
                <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 transition-colors duration-200">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* System Status Info bar for Admin & Staff (Replacing Search Bar) */
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Gateway Online
            </span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-indigo-600">Phân hệ: {userRole === "admin" ? "Toàn quyền hệ thống" : "Nhân viên tác nghiệp"}</span>
          </div>
        )}

        {/* NAVIGATION LINKS & USER PROFILE (Right Column) */}
        <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap items-center justify-end gap-3 sm:gap-4 mt-1 md:mt-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-gray-50">
          
          <nav className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold w-full md:w-auto justify-center md:justify-end">
            {isAdminOrStaff ? (
              /* ADMIN & STAFF NAV: Workspace ONLY */
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full font-extrabold text-xs uppercase flex items-center gap-1.5 transition-all shadow-sm ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-indigo-600/10"
                      : "text-indigo-600 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50"
                  }`
                }
              >
                <Briefcase className="w-3.5 h-3.5" />
                Bàn làm việc vận hành
              </NavLink>
            ) : (
              /* CUSTOMER NAV: Storefront pages ONLY */
              <>
                <NavLink
                  to="/shop"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-transparent"
                    }`
                  }
                >
                  Cửa hàng
                </NavLink>
                
                <NavLink
                  to="/cart"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full relative flex items-center gap-1 transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-transparent"
                    }`
                  }
                >
                  Giỏ hàng
                  {cartCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
                
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-transparent"
                    }`
                  }
                >
                  Đơn hàng
                </NavLink>
                
                <NavLink
                  to="/payments"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full transition-all hidden lg:inline-block ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-transparent"
                    }`
                  }
                >
                  Thanh toán
                </NavLink>

                <NavLink
                  to="/shipping"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full transition-all hidden lg:inline-block ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50 border border-transparent"
                    }`
                  }
                >
                  Vận chuyển
                </NavLink>
              </>
            )}
          </nav>
          
          <span className="hidden md:inline-block text-gray-200">|</span>

          {/* USER PROFILE INFO & LOGOUT */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User Profile info */}
            <div className="hidden sm:flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 leading-none">Xin chào,</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-bold text-gray-800 leading-none">Tài khoản</span>
                  {isAdminOrStaff ? (
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border leading-none ${
                      userRole === "admin" 
                        ? "bg-rose-50 text-rose-600 border-rose-200" 
                        : "bg-teal-50 text-teal-600 border-teal-200"
                    }`}>
                      {userRole === "admin" ? "Quản trị" : "Nhân viên"}
                    </span>
                  ) : (
                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border bg-green-50 text-green-600 border-green-200 leading-none">
                      Khách
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-extrabold py-2 px-3.5 rounded-full transition-all duration-200 flex items-center gap-1 shadow-sm active:scale-95 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}

export default Header;
