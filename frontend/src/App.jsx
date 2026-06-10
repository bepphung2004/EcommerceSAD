import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentsPage from "./pages/PaymentsPage";
import ShippingPage from "./pages/ShippingPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [username, setUsername] = useState("customer");
  const [password, setPassword] = useState("customer123");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [shippingAddress, setShippingAddress] = useState("Hà Nội");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [shippingStatuses, setShippingStatuses] = useState({});
  const [recommendationIds, setRecommendationIds] = useState([]);
  const [detailProduct, setDetailProduct] = useState(null);
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatbotRecommendationIds, setChatbotRecommendationIds] = useState([]);

  const loggedIn = Boolean(token);

  const currentUserId = useMemo(() => {
    if (!token) return 1;
    try {
      const payloadPart = token.split(".")[1] || "";
      const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
      const decoded = JSON.parse(atob(padded));
      return decoded?.user_id || 1;
    } catch {
      return 1;
    }
  }, [token]);

  const userRole = useMemo(() => {
    if (!token) return "customer";
    try {
      const payloadPart = token.split(".")[1] || "";
      const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
      const decoded = JSON.parse(atob(padded));
      return decoded?.role || "customer";
    } catch {
      return "customer";
    }
  }, [token]);

  const productMap = useMemo(
    () =>
      products.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {}),
    [products],
  );

  const displayedProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchDomain = selectedDomain === "all" || p.domain === selectedDomain;
        const matchKeyword = p.name.toLowerCase().includes(searchKeyword.trim().toLowerCase());
        return matchDomain && matchKeyword;
      }),
    [products, selectedDomain, searchKeyword],
  );

  const cartItems = useMemo(
    () =>
      (cart?.items || []).map((item) => {
        const product = productMap[item.product_id];
        const unitPrice = product?.final_price ?? product?.price ?? 0;
        return {
          ...item,
          product,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      }),
    [cart, productMap],
  );

  const recommendations = useMemo(
    () => recommendationIds.map((id) => productMap[id]).filter(Boolean),
    [recommendationIds, productMap],
  );

  const chatbotRecommendations = useMemo(
    () => chatbotRecommendationIds.map((id) => productMap[id]).filter(Boolean),
    [chatbotRecommendationIds, productMap],
  );

  const spotlightProduct = useMemo(() => {
    if (detailProduct) return detailProduct;
    if (recommendations.length) return recommendations[0];
    if (displayedProducts.length) return displayedProducts[0];
    return null;
  }, [detailProduct, recommendations, displayedProducts]);

  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value || 0);
  }

  async function loadProducts() {
    try {
      const data = await apiFetch("/products/");
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadCart() {
    if (!loggedIn) {
      setCart(null);
      return;
    }

    try {
      const data = await apiFetch("/cart/");
      setCart(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadOrders() {
    if (!loggedIn) {
      setOrders([]);
      return;
    }
    try {
      const data = await apiFetch("/orders/");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function login() {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("token", data.access);
      setToken(data.access);
      setMessage(`Xin chào ${username}, đăng nhập thành công.`);
      
      // Giải mã vai trò để tự động chuyển hướng chính xác
      let role = "customer";
      try {
        const payloadPart = data.access.split(".")[1] || "";
        const decoded = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
        role = decoded?.role || "customer";
      } catch {
        role = "customer";
      }

      if (role === "admin" || role === "staff") {
        navigate("/admin");
      } else {
        navigate("/shop");
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function register() {
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, role: "customer" }),
      });
      setMessage("Đăng ký thành công, vui lòng đăng nhập.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function addToCart(productId) {
    try {
      await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      await loadCart();
      setMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function removeFromCart(productId) {
    try {
      await apiFetch("/cart/remove", {
        method: "DELETE",
        body: JSON.stringify({ product_id: productId }),
      });
      await loadCart();
      setMessage("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createOrder(paymentMethod = "COD", walletDetails = "") {
    try {
      const items = cartItems.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        price: it.unitPrice,
      }));
      const order = await apiFetch("/orders/", {
        method: "POST",
        body: JSON.stringify({ 
          items, 
          address: shippingAddress || "Hà Nội",
          payment_method: paymentMethod,
          wallet_details: walletDetails
        }),
      });
      setMessage(`Đơn hàng #${order.id} đã được tạo thành công.`);
      await loadCart();
      await loadOrders();
      await refreshPaymentStatuses();
      await refreshShippingStatuses();
      navigate("/orders");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadRecommendations(query = "") {
    try {
      const q = encodeURIComponent(query || "");
      const data = await apiFetch(`/recommend?user_id=${currentUserId}&query=${q}&top_k=6`);
      setRecommendationIds(data.recommendations || []);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function askChatbot(query) {
    try {
      const data = await apiFetch("/chatbot", {
        method: "POST",
        body: JSON.stringify({ user_id: currentUserId, query }),
      });
      setChatAnswer(data.answer || "");
      setChatbotRecommendationIds(data.recommendations || []);
      return data;
    } catch (err) {
      setMessage(err.message);
      throw err;
    }
  }

  async function refreshPaymentStatuses() {
    if (!orders.length) {
      setPaymentStatuses({});
      return;
    }
    try {
      const entries = await Promise.all(
        orders.map(async (order) => {
          try {
            const pay = await apiFetch(`/payment/status?order_id=${order.id}`);
            return [order.id, pay];
          } catch {
            return [order.id, null];
          }
        }),
      );
      setPaymentStatuses(Object.fromEntries(entries));
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function refreshShippingStatuses() {
    if (!orders.length) {
      setShippingStatuses({});
      return;
    }
    try {
      const entries = await Promise.all(
        orders.map(async (order) => {
          try {
            const shipment = await apiFetch(`/shipping/status?order_id=${order.id}`);
            return [order.id, shipment];
          } catch {
            return [order.id, null];
          }
        }),
      );
      setShippingStatuses(Object.fromEntries(entries));
    } catch (err) {
      setMessage(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setCart(null);
    setChatAnswer("");
    setChatbotRecommendationIds([]);
    setMessage("Bạn đã đăng xuất.");
    navigate("/login");
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadCart();
  }, [loggedIn]);

  useEffect(() => {
    loadOrders();
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      loadRecommendations();
    }
  }, [loggedIn, currentUserId]);

  useEffect(() => {
    if (loggedIn && orders.length) {
      refreshPaymentStatuses();
      refreshShippingStatuses();
    }
  }, [loggedIn, orders.length]);

  useEffect(() => {
    if (!loggedIn && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [loggedIn, location.pathname, navigate]);

  // Tự động ẩn thông báo sau 3.5 giây để tránh che mất nội dung và AI chat widget
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              username={username}
              password={password}
              setUsername={setUsername}
              setPassword={setPassword}
              onLogin={login}
              onRegister={register}
            />
          }
        />

        <Route
          element={
            <MainLayout
              cartCount={cartItems.length}
              onLogout={logout}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              userRole={userRole}
            />
          }
        >
          <Route
            path="/shop"
            element={
              loggedIn ? (
                userRole === "admin" || userRole === "staff" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <ShopPage
                    products={products}
                    displayedProducts={displayedProducts}
                    recommendations={recommendations}
                    selectedDomain={selectedDomain}
                    setSelectedDomain={setSelectedDomain}
                    searchKeyword={searchKeyword}
                    setSearchKeyword={setSearchKeyword}
                    formatCurrency={formatCurrency}
                    onAddToCart={addToCart}
                    onViewDetail={setDetailProduct}
                    detailProduct={detailProduct}
                    onCloseDetail={() => setDetailProduct(null)}
                    onAskAI={askChatbot}
                    onRefreshRecommend={loadRecommendations}
                    chatAnswer={chatAnswer}
                    chatbotRecommendations={chatbotRecommendations}
                    spotlightProduct={spotlightProduct}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/product/:id"
            element={
              loggedIn ? (
                userRole === "admin" || userRole === "staff" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <ProductDetailPage
                    formatCurrency={formatCurrency}
                    onAddToCart={addToCart}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/cart"
            element={
              loggedIn ? (
                userRole === "admin" || userRole === "staff" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <CartPage
                    cartItems={cartItems}
                    shippingAddress={shippingAddress}
                    setShippingAddress={setShippingAddress}
                    formatCurrency={formatCurrency}
                    onCreateOrder={createOrder}
                    onRemoveItem={removeFromCart}
                    onGoShop={() => navigate("/shop")}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/orders"
            element={
              loggedIn ? (
                userRole === "admin" || userRole === "staff" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <OrdersPage
                    orders={orders}
                    products={products}
                    formatCurrency={formatCurrency}
                    onReload={loadOrders}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/payments"
            element={
              loggedIn ? (
                userRole === "admin" || userRole === "staff" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <PaymentsPage
                    orders={orders}
                    paymentStatuses={paymentStatuses}
                    formatCurrency={formatCurrency}
                    onRefresh={refreshPaymentStatuses}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/shipping"
            element={
              loggedIn ? (
                userRole === "admin" || userRole === "staff" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <ShippingPage
                    orders={orders}
                    shippingStatuses={shippingStatuses}
                    onRefresh={refreshShippingStatuses}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              loggedIn && (userRole === "admin" || userRole === "staff") ? (
                <AdminDashboardPage 
                  userRole={userRole}
                  formatCurrency={formatCurrency}
                />
              ) : (
                <Navigate to="/shop" replace />
              )
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={loggedIn ? (userRole === "admin" || userRole === "staff" ? "/admin" : "/shop") : "/login"} replace />} />
      </Routes>

      {/* Toast Notification thiết kế góc dưới bên phải hiện đại, không che khuất AI Chatbot */}
      {message && (
        <div className="fixed bottom-24 right-6 z-[9999] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-semibold max-w-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping shrink-0"></span>
            <span className="flex-grow">{message}</span>
            <button 
              onClick={() => setMessage("")} 
              className="text-slate-400 hover:text-white transition-colors font-bold text-sm leading-none ml-1 p-0.5"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
