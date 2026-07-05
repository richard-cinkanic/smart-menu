import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CartLine, OrderStatus } from "../types";
import { readGuestCart, readGuestOrderHistory } from "../utils/guestStorage";
import { getOrderStatusLabel } from "../utils/orderStatus";

type StoredOrder = {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  itemCount: number;
};

const activeStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

export default function FloatingCartWidget() {
  const [cart, setCart] = useState<CartLine[]>(readGuestCart);
  const [orders, setOrders] = useState<StoredOrder[]>(() => readGuestOrderHistory<StoredOrder>());
  const location = useLocation();
  const isGuestArea = ["/", "/menu", "/cart"].includes(location.pathname) || location.pathname.startsWith("/products/");
  const canShowLiveOrderStatus = ["/", "/menu"].includes(location.pathname) || location.pathname.startsWith("/products/");
  const isAdminPreview = new URLSearchParams(location.search).get("preview") === "admin";
  const cartTarget = isAdminPreview ? "/cart?preview=admin" : "/cart";
  const activeOrders = useMemo(
    () => orders.filter((order) => activeStatuses.includes(order.status)),
    [orders]
  );
  const activeOrder = activeOrders[0];
  const myOrdersTarget = isAdminPreview ? "/my-orders?preview=admin" : "/my-orders";
  const activeOrderDetailTarget = activeOrder
    ? isAdminPreview ? `/my-orders/${activeOrder.id}?preview=admin` : `/my-orders/${activeOrder.id}`
    : cartTarget;
  const activeOrderTarget = activeOrders.length === 1 ? activeOrderDetailTarget : activeOrders.length > 1 ? myOrdersTarget : cartTarget;
  const quantity = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [cart]);

  useEffect(() => {
    const refreshCart = () => setCart(readGuestCart());
    const refreshOrders = () => setOrders(readGuestOrderHistory<StoredOrder>());
    const refreshAll = () => {
      refreshCart();
      refreshOrders();
    };

    window.addEventListener("storage", refreshAll);
    window.addEventListener("smartmenuai-cart-updated", refreshCart);
    window.addEventListener("smartmenuai-order-history-updated", refreshOrders);
    return () => {
      window.removeEventListener("storage", refreshAll);
      window.removeEventListener("smartmenuai-cart-updated", refreshCart);
      window.removeEventListener("smartmenuai-order-history-updated", refreshOrders);
    };
  }, []);

  if (!isGuestArea || location.pathname === "/cart") return null;

  function renderLiveOrderStatus(isStacked = false) {
    if (!canShowLiveOrderStatus || activeOrders.length === 0) return null;

    const primaryOrder = activeOrders[0];
    const status = activeOrders.length > 1 ? "Zobraziť stav" : getOrderStatusLabel(primaryOrder.status);
    const compactText = activeOrders.length > 1 ? `${activeOrders.length} objednávky · Stav` : `Objednávka · ${status}`;
    const statusClass = activeOrders.length > 1 ? "status-multiple" : `status-${primaryOrder.status.toLowerCase()}`;

    return (
      <Link
        to={activeOrderTarget}
        className={`floating-order-status floating-order-status-compact ${statusClass}${isStacked ? " floating-order-status-stacked" : ""}`}
        aria-label="Zobraziť stav objednávky"
      >
        <span className="floating-order-dot" aria-hidden="true" />
        <strong>{compactText}</strong>
      </Link>
    );
  }

  if (quantity === 0) {
    if (activeOrders.length > 0) return renderLiveOrderStatus();

    return (
      <Link to={cartTarget} className="floating-cart floating-cart-empty" aria-label="Otvoriť prázdny košík">
        <span className="floating-cart-text">Košík je prázdny</span>
      </Link>
    );
  }

  return (
    <>
      {renderLiveOrderStatus(true)}
      <Link to={cartTarget} className="floating-cart" aria-label="Zobraziť košík">
        <span className="floating-cart-text">🛒 Košík</span>
        <span className="floating-cart-total">€{total.toFixed(2)}</span>
      </Link>
    </>
  );
}
