import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import type { OrderStatus } from "../types";
import { readGuestOrderHistory } from "../utils/guestStorage";
import { activeOrderStatuses } from "../utils/orderStatus";

type StoredOrder = {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  itemCount: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

export default function MyOrders() {
  const location = useLocation();
  const isAdminPreview = new URLSearchParams(location.search).get("preview") === "admin";
  const [orders, setOrders] = useState<StoredOrder[]>(() => readGuestOrderHistory<StoredOrder>());
  const activeOrders = useMemo(
    () => orders.filter((order) => activeOrderStatuses.includes(order.status)),
    [orders]
  );

  useEffect(() => {
    const refreshOrders = () => setOrders(readGuestOrderHistory<StoredOrder>());

    window.addEventListener("smartmenuai-order-history-updated", refreshOrders);
    window.addEventListener("storage", refreshOrders);

    return () => {
      window.removeEventListener("smartmenuai-order-history-updated", refreshOrders);
      window.removeEventListener("storage", refreshOrders);
    };
  }, []);

  return (
    <section className="guest-history-page my-orders-page">
      <div className="cart-page-heading">
        <p className="eyebrow">Live objednávky</p>
        <h1>Moje objednávky</h1>
        <div className="cart-links">
          <Link to={isAdminPreview ? "/order-history?preview=admin" : "/order-history"} className="cart-history-link">História objednávok</Link>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="empty-cart-message">
          <strong>Nemáte aktívnu objednávku</strong>
          <span>Po odoslaní objednávky tu uvidíte jej aktuálny stav.</span>
          <Link to={isAdminPreview ? "/?preview=admin" : "/menu"} className="primary-action empty-cart-action">Otvoriť menu</Link>
        </div>
      ) : (
        <div className="guest-history-list">
          {activeOrders.map((order) => (
            <article key={order.id} className="history-row my-order-card">
              <div className="history-order-main">
                <strong>Objednávka #{order.id.slice(0, 8)}</strong>
                <span>{new Date(order.createdAt).toLocaleString("sk-SK")}</span>
                {order.items && order.items.length > 0 ? (
                  <ul className="history-items">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-${item.name}-${index}`}>
                        <span>{item.quantity}x {item.name}</span>
                        <strong>{(item.price * item.quantity).toFixed(2)} €</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>{order.itemCount} položiek</span>
                )}
              </div>

              <strong className="order-total-box">{order.totalPrice.toFixed(2)} €</strong>
              <OrderStatusTimeline status={order.status} />
              <Link
                to={isAdminPreview ? `/my-orders/${order.id}?preview=admin` : `/my-orders/${order.id}`}
                className="order-detail-link"
              >
                Zobraziť objednávku
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
