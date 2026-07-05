import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CartItem from "../components/CartItem";
import { api } from "../api/client";
import type { CartLine, Order, OrderStatus, Product } from "../types";
import { readGuestCart, readGuestOrderHistory, saveGuestCart, saveGuestOrderHistory } from "../utils/guestStorage";
import { getOrCreateDeviceId } from "../utils/deviceStorage";
import { usePush } from "../hooks/usePush";
import {
  getCartRecommendation,
  type UpsellRecommendation
} from "../utils/upsellRecommendations";

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

type RestaurantTable = { id: string; number: number };

export default function Cart() {
  const [cart, setCart] = useState<CartLine[]>(readGuestCart);
  const [history, setHistory] = useState<StoredOrder[]>(() => readGuestOrderHistory<StoredOrder>());
  const [products, setProducts] = useState<Product[]>([]);
  const [cartRecommendation, setCartRecommendation] = useState<UpsellRecommendation | null>(null);
  const [dismissedRecommendationIds, setDismissedRecommendationIds] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminPreview = new URLSearchParams(location.search).get("preview") === "admin";
  const menuTarget = isAdminPreview ? "/?preview=admin" : "/menu";
  const historyTarget = isAdminPreview ? "/order-history?preview=admin" : "/order-history";
  const total = useMemo(() => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  function saveCart(nextCart: CartLine[]) {
    setCart(nextCart);
    saveGuestCart(nextCart);
  }

  useEffect(() => {
    api.get<Product[]>("/products").then((response) => setProducts(response.data));
  }, []);

  useEffect(() => {
    if (cart.length === 0 || products.length === 0) {
      setCartRecommendation(null);
      return;
    }

    const recommendation = getCartRecommendation({ products, cart });
    if (!recommendation || dismissedRecommendationIds.includes(recommendation.product.id)) {
      setCartRecommendation(null);
      return;
    }

    setCartRecommendation(recommendation);
  }, [cart, products, dismissedRecommendationIds]);

  function saveOrderHistory(order: Order) {
    const nextHistory = [
      {
        id: order.id,
        createdAt: order.createdAt,
        totalPrice: order.totalPrice,
        status: order.status,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        }))
      },
      ...history
    ].slice(0, 8);
    setHistory(nextHistory);
    saveGuestOrderHistory(nextHistory);
  }

  const { requestPushPermission } = usePush();

  async function submitOrder() {
    await requestPushPermission(); // Vypýta si povolenie (ak ho ešte nemáme), až po kliknutí používateľom
    let tableId = localStorage.getItem("smartmenuai_table_id");
    const tableNumber = localStorage.getItem("smartmenuai_table_number");

    if (!tableId && tableNumber) {
      const tableResponse = await api.get<RestaurantTable>(`/tables/by-number/${tableNumber}`);
      tableId = tableResponse.data.id;
      localStorage.setItem("smartmenuai_table_id", tableId);
      localStorage.setItem("smartmenuai_table_number", String(tableResponse.data.number));
      window.dispatchEvent(new Event("smartmenuai-table-updated"));
    }

    const response = await api.post<Order>("/orders", {
      tableId,
      items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      deviceId: getOrCreateDeviceId()  // priradenie objednávky k zariadeniu pre push notifikácie
    });
    saveOrderHistory(response.data);
    saveCart([]);
    navigate(`/order-confirmation/${response.data.id}${isAdminPreview ? "?preview=admin" : ""}`);
  }

  return (
    <section className="cart-page">
      <div className="cart-page-heading">
        <p className="eyebrow">Objednávka</p>
        <h1>Košík</h1>
        <div className="cart-links">
          <Link to={historyTarget} className="cart-history-link">História objednávok</Link>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart-message">
          <strong>Košík je prázdny</strong>
          <span>Vyberte si nápoj alebo dezert z menu.</span>
          <Link to={menuTarget} className="primary-action empty-cart-action">Otvoriť menu</Link>
        </div>
      ) : (
        <>
          <div className="cart-items-list">
            {cart.map((line) => (
              <CartItem
                key={line.product.id}
                line={line}
                onQuantityChange={(quantity) => saveCart(cart.map((item) => item.product.id === line.product.id ? { ...item, quantity } : item))}
                onRemove={() => saveCart(cart.filter((item) => item.product.id !== line.product.id))}
              />
            ))}
          </div>

          {cartRecommendation && (
            <section className="cart-recommendation-card">
              <div>
                <span>Ešte by sa Vám mohlo páčiť</span>
                <strong>{cartRecommendation.product.name}</strong>
                <p>{cartRecommendation.reason}</p>
              </div>
              <div className="cart-recommendation-actions">
                <b>{cartRecommendation.product.price.toFixed(2)} €</b>
                <button
                  type="button"
                  onClick={() => {
                    const existing = cart.find((line) => line.product.id === cartRecommendation.product.id);
                    const nextCart = existing
                      ? cart.map((line) => line.product.id === cartRecommendation.product.id ? { ...line, quantity: line.quantity + 1 } : line)
                      : [...cart, { product: cartRecommendation.product, quantity: 1 }];
                    saveCart(nextCart);
                    setDismissedRecommendationIds((current) => [...current, cartRecommendation.product.id]);
                    setCartRecommendation(null);
                  }}
                >
                  Pridať
                </button>
                <button
                  type="button"
                  className="cart-recommendation-close"
                  onClick={() => {
                    setDismissedRecommendationIds((current) => [...current, cartRecommendation.product.id]);
                    setCartRecommendation(null);
                  }}
                >
                  Zavrieť
                </button>
              </div>
            </section>
          )}

          <section className="cart-summary">
            <div className="summary-total"><span>Spolu</span><strong>{total.toFixed(2)} €</strong></div>
          </section>

          <div className="cart-submit-bar">
            <div>
              <span>{itemCount} položiek</span>
              <strong>{total.toFixed(2)} €</strong>
            </div>
            <button onClick={submitOrder}>Odoslať objednávku</button>
          </div>
        </>
      )}
    </section>
  );
}
