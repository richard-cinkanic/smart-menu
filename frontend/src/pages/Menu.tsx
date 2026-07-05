import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AiRecommendationWidget from "../components/AiRecommendationWidget";
import CategoryList from "../components/CategoryList";
import ProductCard from "../components/ProductCard";
import { api } from "../api/client";
import type { CartLine, Category, OrderStatus, Product } from "../types";
import { readGuestCart, readGuestOrderHistory, saveGuestCart } from "../utils/guestStorage";
import { markAiRecommendationUsed } from "../utils/upsellRecommendations";
import { toast } from "react-hot-toast";

type RestaurantTable = { id: string; number: number };
type AddToCartSource = "menu" | "ai" | "lastOrder" | "cartRecommendation";
type AddToCartOptions = { source?: AddToCartSource; showUpsell?: boolean };
type StoredOrder = { id: string; status: OrderStatus };

const activeOrderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

const categoryLabels: Record<string, string> = {
  Breakfast: "Raňajky",
  Lunch: "Obed",
  Drinks: "Nápoje"
};

const cafeCategoryOrder = ["Káva", "Čaje", "Nealkoholické nápoje", "Nealkoholické miešané nápoje", "Pivo", "Víno", "Miešané nápoje", "Dezerty"];

function localizeCategories(categories: Category[]) {
  return categories
    .map((category) => ({ ...category, name: categoryLabels[category.name] ?? category.name }))
    .sort((a, b) => {
      const orderA = cafeCategoryOrder.indexOf(a.name);
      const orderB = cafeCategoryOrder.indexOf(b.name);
      if (orderA !== -1 || orderB !== -1) return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
      return a.name.localeCompare(b.name, "sk");
    });
}

export default function Menu() {
  const location = useLocation();
  const isAdminPreview = new URLSearchParams(location.search).get("preview") === "admin";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartLines, setCartLines] = useState<CartLine[]>(() => readGuestCart() as CartLine[]);
  const [orders, setOrders] = useState<StoredOrder[]>(() => readGuestOrderHistory<StoredOrder>());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tableNumber = params.get("table");
    const tableId = params.get("tableId");

    if (tableNumber) {
      localStorage.setItem("smartmenuai_table_number", tableNumber);
      window.dispatchEvent(new Event("smartmenuai-table-updated"));
      api.get<RestaurantTable>(`/tables/by-number/${tableNumber}`).then((response) => {
        localStorage.setItem("smartmenuai_table_id", response.data.id);
        localStorage.setItem("smartmenuai_table_number", String(response.data.number));
        window.dispatchEvent(new Event("smartmenuai-table-updated"));
      });
    }

    if (tableId) {
      localStorage.setItem("smartmenuai_table_id", tableId);
      api.get<RestaurantTable>(`/tables/${tableId}`).then((response) => {
        localStorage.setItem("smartmenuai_table_number", String(response.data.number));
        window.dispatchEvent(new Event("smartmenuai-table-updated"));
      });
    }
    Promise.all([api.get<Product[]>("/products"), api.get<Category[]>("/categories")]).then(([productResponse, categoryResponse]) => {
      setProducts(productResponse.data);
      setCategories(categoryResponse.data);
    });
  }, [location.search]);

  const localizedCategories = useMemo(() => {
    const categoryIdsWithProducts = new Set(products.map((product) => product.categoryId));
    return localizeCategories(categories.filter((category) => categoryIdsWithProducts.has(category.id)));
  }, [categories, products]);
  const filteredProducts = useMemo(() => activeCategory === "all" ? products : products.filter((product) => product.categoryId === activeCategory), [activeCategory, products]);
  const activeCategoryName = localizedCategories.find((category) => category.id === activeCategory)?.name ?? "Menu";
  const hasCartItems = cartLines.length > 0;
  const hasActiveOrders = orders.some((order) => activeOrderStatuses.includes(order.status));

  useEffect(() => {
    if (activeCategory === "all" && localizedCategories.length > 0) setActiveCategory(localizedCategories[0].id);
  }, [activeCategory, localizedCategories]);

  useEffect(() => {
    function syncCart() {
      setCartLines(readGuestCart() as CartLine[]);
    }

    window.addEventListener("smartmenuai-cart-updated", syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener("smartmenuai-cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    function syncOrders() {
      setOrders(readGuestOrderHistory<StoredOrder>());
    }

    window.addEventListener("smartmenuai-order-history-updated", syncOrders);
    window.addEventListener("storage", syncOrders);
    return () => {
      window.removeEventListener("smartmenuai-order-history-updated", syncOrders);
      window.removeEventListener("storage", syncOrders);
    };
  }, []);

  function addToCart(product: Product, quantity = 1, options: AddToCartOptions = {}) {
    const source = options.source ?? "menu";
    const cart = readGuestCart() as CartLine[];
    const existing = cart.find((line) => line.product.id === product.id);
    const nextCart = existing ? cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line) : [...cart, { product, quantity }];
    saveGuestCart(nextCart);
    setCartLines(nextCart);

    if (source === "ai") markAiRecommendationUsed();
    if (source === "menu" || source === "cartRecommendation") toast.success(quantity > 1 ? `${quantity}× ${product.name} pridané do košíka` : `${product.name} pridané do košíka`);
  }

  return (
    <section className={isAdminPreview ? "menu-page admin-preview-mode" : "menu-page"}>
      {isAdminPreview && (
        <div className="admin-preview-bar">
          <div>
            <strong>Admin náhľad menu</strong>
            <span>Takto zákazník vidí ponuku po naskenovaní QR kódu.</span>
          </div>
          <Link to="/admin/dashboard" className="admin-preview-link">Späť do adminu</Link>
        </div>
      )}

      <div className="section-heading menu-heading">
        <div>
          <p className="eyebrow">Aktuálne menu</p>
          <h1>{activeCategoryName}</h1>
        </div>
        <p className="recommendation">Objednávka priamo od stola</p>
      </div>

      <div className="sticky-category-bar">
        <CategoryList categories={localizedCategories} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
      </div>

      <AiRecommendationWidget
        products={products}
        cartProductIds={cartLines.map((line) => line.product.id)}
        onAdd={addToCart}
        hideBubble={hasActiveOrders}
        bubbleText={hasCartItems ? "Ešte niečo?" : "Na čo máte chuť?"}
      />
    </section>
  );
}
