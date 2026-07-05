import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingCartWidget from "./components/FloatingCartWidget";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import OrderHistory from "./pages/OrderHistory";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ProductManagement from "./pages/ProductManagement";
import OrderManagement from "./pages/OrderManagement";
import TableManagement from "./pages/TableManagement";
import { useEffect, useLayoutEffect } from "react";
import { usePush } from "./hooks/usePush";
import { useOrderStatusPolling } from "./hooks/useOrderStatusPolling";

import { Toaster, toast } from "react-hot-toast";

function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.scrollingElement?.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    requestAnimationFrame(resetScroll);
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  const location = useLocation();
  const isCustomerShell = !location.pathname.startsWith("/admin");

  usePush(); // Tento hook teraz automaticky zaregistruje SW ak už máme povolenie z minula
  useOrderStatusPolling(); // Nový hook pre polling objednávok bez Push API

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        // Odstránené zobrazenie toastu z push notifikácie, 
        // pretože useOrderStatusPolling() sa stará o zobrazenie toastu pre zmenu stavu.
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className={isCustomerShell ? "app-shell customer-shell" : "app-shell"}>
      <Toaster 
        position="bottom-center" 
        containerStyle={{
          bottom: 100, 
        }}
        toastOptions={{
          duration: 1600,
          success: {
            duration: 1400
          },
          style: {
            background: '#2B160E', 
            color: '#fff',         
            borderRadius: '40px',
            padding: '12px 20px',
          }
        }} 
      />
      <ScrollToTop />
      <Navbar />
      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/home" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-orders/:id" element={<OrderDetails />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/register" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/register" element={<Navigate to="/admin/login" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/orders" element={<OrderManagement />} />
            <Route path="/admin/tables" element={<TableManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <FloatingCartWidget />
      <Footer />
    </div>
  );
}
  
