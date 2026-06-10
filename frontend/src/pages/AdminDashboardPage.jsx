import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api";
import { 
  TrendingUp, Package, ShoppingCart, Users, Edit2, CheckCircle2, 
  Clock, XCircle, RefreshCw, Eye, Save, AlertCircle, ShieldAlert, Plus, Trash2, X, ClipboardList, Settings
} from "lucide-react";

function AdminDashboardPage({ userRole, formatCurrency }) {
  const isAdmin = userRole === "admin";
  
  // Tab State (Restricted for staff to only 'overview' or 'orders')
  const [activeTab, setActiveTab] = useState("overview");

  // Force redirection if staff somehow accesses prohibited tabs
  useEffect(() => {
    if (!isAdmin && (activeTab === "products" || activeTab === "users")) {
      setActiveTab("overview");
    }
  }, [activeTab, isAdmin]);
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Product Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form States for Creation & Editing
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    domain: "electronics",
    brand: "",
    image_url: "",
    description: "",
    short_description: "",
    discount_percent: 0
  });

  // Load All Services Data
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Products
      const prodData = await apiFetch("/products/");
      const rawProducts = Array.isArray(prodData) ? prodData : prodData.results || [];
      setProducts(rawProducts);

      // 2. Fetch Categories
      const catData = await apiFetch("/categories/");
      setCategories(Array.isArray(catData) ? catData : catData.results || []);

      // 3. Fetch Orders (Both Admin & Staff see all orders to process)
      const ordData = await apiFetch("/orders/");
      const fetchedOrders = Array.isArray(ordData) ? ordData : [];
      setOrders(fetchedOrders);

      // Fetch payment details for each order to determine payment method
      const methodMap = {};
      try {
        await Promise.all(
          fetchedOrders.map(async (order) => {
            try {
              const pay = await apiFetch(`/payment/status?order_id=${order.id}`);
              methodMap[order.id] = pay?.method || "COD";
            } catch {
              methodMap[order.id] = "COD";
            }
          })
        );
      } catch (e) {
        console.error("Failed to load payment methods", e);
      }
      setPaymentMethods(methodMap);

      // 4. Fetch Users (Only if admin role)
      if (isAdmin) {
        const usrData = await apiFetch("/users/");
        setUsers(Array.isArray(usrData) ? usrData : []);
      }
    } catch (err) {
      setError(err.message || "Không thể đồng bộ dữ liệu hệ thống.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [userRole]);

  // Toast auto-clear
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Generate SKU & Slug helper
  const handleGenerateSku = () => {
    const code = Math.floor(100000 + Math.random() * 900000);
    const domainPrefix = productForm.domain.substring(0, 3).toUpperCase();
    setProductForm(prev => ({
      ...prev,
      sku: `${domainPrefix}-${code}`
    }));
  };

  // 1. CREATE PRODUCT (Admin only)
  async function handleCreateProduct(e) {
    e.preventDefault();
    if (!isAdmin) return;
    setError("");
    setMessage("");

    const { name, sku, price, stock, category, domain } = productForm;
    if (!name || !sku || !price || !stock || !category) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
      return;
    }

    // Generate safe unique slug
    const safeSlug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[-\s]+/g, '-') + '-' + Math.floor(Math.random() * 100000);

    try {
      const payload = {
        ...productForm,
        slug: safeSlug,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: parseInt(category),
        discount_percent: parseInt(productForm.discount_percent || 0)
      };

      await apiFetch("/products/", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setMessage(`Đã thêm sản phẩm "${name}" thành công!`);
      setIsCreateModalOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi thêm mới sản phẩm.");
    }
  }

  // 2. OPEN EDIT MODAL
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category?.id || product.category || "",
      domain: product.domain || "electronics",
      brand: product.brand || "",
      image_url: product.image_url || "",
      description: product.description || "",
      short_description: product.short_description || "",
      discount_percent: product.discount_percent || 0
    });
    setIsEditModalOpen(true);
  };

  // 3. UPDATE PRODUCT (Admin only)
  async function handleUpdateProduct(e) {
    e.preventDefault();
    if (!isAdmin || !selectedProduct) return;
    setError("");
    setMessage("");

    const { name, sku, price, stock, category } = productForm;
    if (!name || !sku || !price || !stock || !category) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }

    try {
      const payload = {
        ...productForm,
        price: parseFloat(price),
        stock: parseInt(stock),
        category: parseInt(category),
        discount_percent: parseInt(productForm.discount_percent || 0)
      };

      await apiFetch(`/products/${selectedProduct.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      setMessage(`Đã cập nhật sản phẩm "${name}" thành công!`);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật sản phẩm.");
    }
  }

  // 4. DELETE PRODUCT (Admin only)
  async function handleDeleteProduct(productId, productName) {
    if (!isAdmin) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${productName}"?`)) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await apiFetch(`/products/${productId}/`, {
        method: "DELETE"
      });

      setMessage(`Đã xóa sản phẩm "${productName}" vĩnh viễn khỏi hệ thống.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi xóa sản phẩm.");
    }
  }

  // 5. UPDATE ORDER STATUS (Both Admin & Staff are authorized)
  async function handleUpdateOrderStatus(orderId, newStatus) {
    setError("");
    setMessage("");
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setMessage(`Cập nhật trạng thái đơn hàng #${orderId} thành: ${newStatus}`);
      await loadData();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật trạng thái vận đơn.");
    }
  }

  const resetForm = () => {
    setProductForm({
      name: "",
      sku: "",
      price: "",
      stock: "",
      category: categories[0]?.id || "",
      domain: "electronics",
      brand: "",
      image_url: "",
      description: "",
      short_description: "",
      discount_percent: 0
    });
  };

  // Calculated Stats
  const stats = {
    totalRevenue: orders.filter(o => o.status === "paid" || o.status === "delivered").reduce((sum, o) => sum + o.total_price, 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    totalUsers: users.length || 3, // dynamic user list or default test users
  };

  const statusLabel = {
    pending: "Chờ xác nhận",
    processing: "Đang xử lý",
    paid: "Đã thanh toán",
    shipping: "Đang giao",
    delivered: "Giao thành công",
    failed: "Thất bại",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isAdmin ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-teal-50 text-teal-700 border border-teal-100"
            }`}>
              {isAdmin ? "Toàn quyền Admin" : "Nhân viên Vận hành"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400 font-semibold uppercase">QuickMall Control Panel</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            Bàn làm việc {isAdmin ? "Quản lý" : "Tác nghiệp"}
          </h2>
        </div>
        
        <button 
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl shadow transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại dữ liệu
        </button>
      </div>

      {/* Floating System Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-center gap-2.5 shadow-sm animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="font-bold">{message}</span>
        </div>
      )}

      {/* Dashboard Content Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-1/4 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 shrink-0">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b pb-3 border-gray-100">
            Tính năng hoạt động
          </h3>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "overview" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Tổng quan hệ thống
            </button>

            {isAdmin && (
              /* PRODUCTS MANAGER: ONLY AVAILABLE TO ADMINS */
              <button
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "products" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <Package className="w-4 h-4" />
                Quản lý Sản phẩm (CRUD)
              </button>
            )}

            {/* ORDERS FULFILLMENT: AVAILABLE TO BOTH ADMIN AND STAFF */}
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "orders" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Xử lý Đơn & Vận đơn
            </button>
            
            {isAdmin ? (
              /* USERS DIRECTORY: ONLY AVAILABLE TO ADMINS */
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "users" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <Users className="w-4 h-4" />
                Danh mục Người dùng
              </button>
            ) : (
              <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-300 bg-gray-50/50 cursor-not-allowed">
                <ShieldAlert className="w-4 h-4" />
                Người dùng (Bị khóa)
              </div>
            )}
          </nav>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <div className="w-full lg:w-3/4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Statistical Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <span className="p-3.5 bg-green-50 text-green-600 rounded-2xl shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Doanh thu</span>
                    <strong className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</strong>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <span className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                    <ShoppingCart className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Đơn hàng</span>
                    <strong className="text-lg font-black text-gray-900 tracking-tight">{stats.totalOrders} đơn</strong>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <span className="p-3.5 bg-amber-50 text-amber-500 rounded-2xl shrink-0">
                    <Package className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sản phẩm</span>
                    <strong className="text-lg font-black text-gray-900 tracking-tight">{stats.totalProducts} món</strong>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
                  <span className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                    <Users className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Thành viên</span>
                    <strong className="text-lg font-black text-gray-900 tracking-tight">{stats.totalUsers} Acc</strong>
                  </div>
                </div>
              </div>

              {/* Analytical Charts / Quick Views */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gray-900 text-base">Hạ tầng Vi dịch vụ (Microservices)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-800">Cơ chế cách ly DB</span>
                    <p className="text-xs text-gray-400 mt-1">Sản phẩm: PostgreSQL (port 5433)</p>
                    <p className="text-xs text-gray-400">Các dịch vụ khác: MySQL 8.0</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-800">Trí tuệ nhân tạo (AI)</span>
                    <p className="text-xs text-gray-400 mt-1">LSTM PyTorch + Vector DB FAISS</p>
                    <p className="text-xs text-gray-400">Neo4j Graph Database kết nối</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-800">Kiểm soát truy cập (RBAC)</span>
                    <p className="text-xs text-gray-400 mt-1">Vai trò hiện tại: {userRole.toUpperCase()}</p>
                    <p className="text-xs text-gray-400">Quyền hạn: {isAdmin ? "CRUD, Xem Users, Vận đơn" : "Xử lý Vận đơn & Giao hàng"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CRUD (ADMINS ONLY) */}
          {activeTab === "products" && isAdmin && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              
              <div className="flex justify-between items-center border-b pb-4 border-gray-100 flex-wrap gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Quản lý Sản phẩm (Full CRUD)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Thêm, sửa toàn bộ thông tin hoặc xóa vĩnh viễn sản phẩm</p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Thêm sản phẩm mới
                </button>
              </div>

              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Không tìm thấy sản phẩm.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-bold rounded-l-xl">Sản phẩm</th>
                        <th className="px-4 py-3 font-bold">SKU / Phân hệ</th>
                        <th className="px-4 py-3 font-bold">Giá bán</th>
                        <th className="px-4 py-3 font-bold">Tồn kho</th>
                        <th className="px-4 py-3 font-bold rounded-r-xl text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop"} 
                                alt={p.name} 
                                className="w-12 h-12 object-cover rounded-lg border shadow-sm shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-gray-900 truncate block text-xs sm:text-sm max-w-[200px]" title={p.name}>
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-blue-600 font-semibold uppercase">{p.domain}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-mono text-xs">
                            <div>{p.sku}</div>
                            <div className="text-[10px] text-gray-400">{p.category?.name || "Mặc định"}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-gray-900">{formatCurrency(p.price)}</span>
                            {p.discount_percent > 0 && (
                              <span className="text-[10px] text-green-600 font-bold block">-{p.discount_percent}%</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                              p.stock <= 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-700"
                            }`}>
                              {p.stock} món
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg transition-all inline-flex items-center gap-1 text-xs font-semibold"
                                title="Sửa chi tiết sản phẩm"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-all inline-flex items-center gap-1 text-xs font-semibold"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS FULFILLMENT & SHIPPING (BOTH ADMIN & STAFF) */}
          {activeTab === "orders" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-4 border-gray-100 flex-wrap gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Quản lý Đơn hàng & Vận đơn</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Xử lý duyệt thanh toán và trạng thái giao hàng</p>
                </div>
              </div>

              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Không tìm thấy đơn hàng nào trong hệ thống.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="border border-gray-100 rounded-2xl p-4 hover:shadow transition-all bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <strong className="text-gray-900 font-extrabold text-sm">Đơn hàng #{order.id}</strong>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === "paid" || order.status === "delivered" 
                              ? "bg-green-100 text-green-700" 
                              : order.status === "failed" 
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {statusLabel[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Khách hàng ID: <span className="font-bold text-gray-800">#{order.user_id}</span> <span className="mx-1">·</span> Tổng giá: <strong className="text-red-600 font-extrabold">{formatCurrency(order.total_price)}</strong>
                          <br />
                          📍 Địa chỉ: <span className="italic font-medium text-gray-700">{order.address || "N/A"}</span>
                          <br />
                          💳 Phương thức: <span className="font-bold text-indigo-600">{paymentMethods[order.id] === "COD" ? "Thanh toán khi nhận hàng (COD)" : (paymentMethods[order.id] || "Đang tải...")}</span>
                        </p>
                        
                        {/* Danh sách items của đơn */}
                        <div className="flex flex-wrap gap-1">
                          {(order.items || []).map((it, idx) => (
                            <span key={idx} className="bg-white border border-gray-200 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                              SP #{it.product_id} (SL {it.quantity}) · {formatCurrency(it.price)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Trạng thái duyệt vận đơn của Staff / Admin */}
                      <div className="flex flex-wrap gap-1.5 sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                        {(order.status === "pending" || order.status === "paid") && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "shipping")}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                          >
                            🚚 Giao cho Vận chuyển
                          </button>
                        )}
                        {order.status === "shipping" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                          >
                            📦 Xác nhận Đã giao
                          </button>
                        )}
                        
                        {order.status !== "delivered" && order.status !== "failed" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "failed")}
                            className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-bold py-1.5 px-3 rounded-lg transition-all"
                          >
                            Hủy đơn
                          </button>
                        )}

                        {(order.status === "delivered" || order.status === "failed") && (
                           <span className="text-gray-400 text-xs font-medium italic">Đơn đã hoàn tất xử lý</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS DIRECTORY (ADMINS ONLY) */}
          {activeTab === "users" && isAdmin && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-4 border-gray-100 flex-wrap gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Danh mục Người dùng</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Thông tin tài khoản tải từ user-service</p>
                </div>
              </div>

              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Không có dữ liệu người dùng.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-bold rounded-l-xl">ID / Tài khoản</th>
                        <th className="px-4 py-3 font-bold">Email</th>
                        <th className="px-4 py-3 font-bold rounded-r-xl">Vai trò (Role)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-gray-900">
                            #{u.id} <span className="font-medium text-gray-500 ml-2">{u.username}</span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">{u.email || "chưa điền"}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.role === "admin" 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : u.role === "staff" 
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                : "bg-gray-50 text-gray-500 border border-gray-100"
                            }`}>
                              {u.role || "customer"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* CREATE PRODUCT MODAL (ADMIN ONLY) */}
      {isCreateModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Thêm sản phẩm mới</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="Nhập tên sản phẩm..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Mã SKU *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                      placeholder="Nhập SKU hoặc tạo..."
                      className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="bg-indigo-50 border border-indigo-200 text-indigo-600 px-2.5 rounded-xl text-[10px] font-bold shrink-0 hover:bg-indigo-100"
                    >
                      Tạo SKU
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Ngành hàng (Domain) *</label>
                  <select
                    value={productForm.domain}
                    onChange={(e) => setProductForm({...productForm, domain: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  >
                    <option value="book">Book (Sách)</option>
                    <option value="electronics">Electronics (Điện tử)</option>
                    <option value="fashion">Fashion (Thời trang)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Danh mục *</label>
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Giá bán ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tồn kho *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    placeholder="Số lượng nhập..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Giảm giá (%)</label>
                  <input
                    type="number"
                    value={productForm.discount_percent}
                    onChange={(e) => setProductForm({...productForm, discount_percent: e.target.value})}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Thương hiệu</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                    placeholder="Ví dụ: Apple, Nike..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Hình ảnh URL</label>
                <input
                  type="text"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Mô tả ngắn</label>
                <input
                  type="text"
                  value={productForm.short_description}
                  onChange={(e) => setProductForm({...productForm, short_description: e.target.value})}
                  placeholder="Tóm tắt ngắn gọn sản phẩm..."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Nhập thông số kỹ thuật, mô tả sâu..."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2.5 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL (ADMIN ONLY) */}
      {isEditModalOpen && isAdmin && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Chỉnh sửa chi tiết sản phẩm</h3>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="Nhập tên sản phẩm..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Mã SKU *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    placeholder="Nhập SKU..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Ngành hàng (Domain) *</label>
                  <select
                    value={productForm.domain}
                    onChange={(e) => setProductForm({...productForm, domain: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  >
                    <option value="book">Book (Sách)</option>
                    <option value="electronics">Electronics (Điện tử)</option>
                    <option value="fashion">Fashion (Thời trang)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Danh mục *</label>
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Giá bán ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tồn kho *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    placeholder="Số lượng tồn..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Giảm giá (%)</label>
                  <input
                    type="number"
                    value={productForm.discount_percent}
                    onChange={(e) => setProductForm({...productForm, discount_percent: e.target.value})}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Thương hiệu</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                    placeholder="Nhập hãng sản xuất..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Hình ảnh URL</label>
                <input
                  type="text"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Mô tả ngắn</label>
                <input
                  type="text"
                  value={productForm.short_description}
                  onChange={(e) => setProductForm({...productForm, short_description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2.5 px-3 text-xs outline-none transition-all shadow-sm text-gray-900 font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
