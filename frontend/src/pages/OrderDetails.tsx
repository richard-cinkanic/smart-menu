import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import { api } from "../api/client";
import type { Order } from "../types";

function generateEPCQRText(iban: string, recipientName: string, amount: number, variableSymbol: string) {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    "",
    recipientName,
    iban,
    `EUR${amount.toFixed(2)}`,
    "",
    variableSymbol,
    `Objednavka ${variableSymbol}`
  ].join("\n");
}

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isAdminPreview = new URLSearchParams(location.search).get("preview") === "admin";
  const [order, setOrder] = useState<Order | null>(null);
  const [isQRDrawerOpen, setIsQRDrawerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Order>(`/orders/${id}`).then((response) => setOrder(response.data));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const refreshOrder = () => {
      api.get<Order>(`/orders/${id}`).then((response) => setOrder(response.data));
    };

    window.addEventListener("smartmenuai-order-history-updated", refreshOrder);
    return () => window.removeEventListener("smartmenuai-order-history-updated", refreshOrder);
  }, [id]);

  const qrText = order
    ? generateEPCQRText("SK1209000000001234567890", "Smart Menu s.r.o.", order.totalPrice, order.id.slice(0, 8))
    : "";

  return (
    <section className="guest-history-page order-detail-page">
      <div className="cart-page-heading">
        <p className="eyebrow">Detail objednávky</p>
        <h1>Objednávka</h1>
        <div className="cart-links">
          <Link to={isAdminPreview ? "/my-orders?preview=admin" : "/my-orders"} className="cart-history-link">Moje objednávky</Link>
        </div>
      </div>

      {order ? (
        <div className="guest-history-list">
          <article className="history-row order-detail-card">
            <div className="history-order-main">
              <strong>Objednávka #{order.id.slice(0, 8)}</strong>
              <span>{new Date(order.createdAt).toLocaleString("sk-SK")}</span>
              <ul className="history-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.quantity}x {item.product.name}</span>
                    <strong>{(item.price * item.quantity).toFixed(2)} €</strong>
                  </li>
                ))}
              </ul>
            </div>

            <strong className="order-total-box">{order.totalPrice.toFixed(2)} €</strong>
            <OrderStatusTimeline status={order.status} />

            <div className="payment-actions">
              <button type="button" className="apple-pay-localized">
                Zaplatiť cez  Pay
              </button>
              <button type="button" className="qr-trigger-btn" onClick={() => setIsQRDrawerOpen(true)}>
                <span>📱</span> Zaplatiť QR kódom
              </button>
            </div>
          </article>
        </div>
      ) : (
        <p className="empty-cart-message">Načítavam objednávku...</p>
      )}

      <div className={`qr-drawer-overlay ${isQRDrawerOpen ? "active" : ""}`} onClick={() => setIsQRDrawerOpen(false)} />
      <div className={`qr-drawer ${isQRDrawerOpen ? "active" : ""}`}>
        <div className="qr-drawer-content">
          <h3>Platba QR kódom</h3>
          <p>Naskenujte kód vo vašej bankovej aplikácii pre rýchlu platbu prevodom.</p>

          {order && (
            <div className="qr-code-box">
              <QRCodeSVG value={qrText} size={220} includeMargin />
            </div>
          )}

          {order && (
            <p className="qr-payment-meta">
              Suma: <b>{order.totalPrice.toFixed(2)} €</b> | VS: <b>{order.id.slice(0, 8)}</b>
            </p>
          )}

          <button className="qr-close-btn" onClick={() => setIsQRDrawerOpen(false)}>
            Zatvoriť
          </button>
        </div>
      </div>
    </section>
  );
}
