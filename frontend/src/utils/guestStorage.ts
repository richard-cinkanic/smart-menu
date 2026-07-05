import type { CartLine } from "../types";

const guestCartKey = "smartmenuai_guest_cart";
const legacyCartKey = "smartmenuai_cart";
const guestHistoryKey = "smartmenuai_guest_order_history";
const legacyHistoryKey = "smartmenuai_order_history";

function migrateLegacyValue(newKey: string, oldKey: string) {
  const current = localStorage.getItem(newKey);
  const legacy = localStorage.getItem(oldKey);
  if (!current && legacy) localStorage.setItem(newKey, legacy);
}

export function readGuestCart() {
  migrateLegacyValue(guestCartKey, legacyCartKey);
  return JSON.parse(localStorage.getItem(guestCartKey) ?? "[]") as CartLine[];
}

export function saveGuestCart(cart: CartLine[]) {
  localStorage.setItem(guestCartKey, JSON.stringify(cart));
  localStorage.removeItem(legacyCartKey);
  window.dispatchEvent(new Event("smartmenuai-cart-updated"));
}

export function readGuestOrderHistory<T>() {
  migrateLegacyValue(guestHistoryKey, legacyHistoryKey);
  return JSON.parse(localStorage.getItem(guestHistoryKey) ?? "[]") as T[];
}

export function saveGuestOrderHistory<T>(history: T[]) {
  localStorage.setItem(guestHistoryKey, JSON.stringify(history));
  localStorage.removeItem(legacyHistoryKey);
  window.dispatchEvent(new Event("smartmenuai-order-history-updated"));
}
