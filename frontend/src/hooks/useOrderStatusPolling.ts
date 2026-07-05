import { useEffect } from "react";
import { api } from "../api/client";
import { readGuestOrderHistory, saveGuestOrderHistory } from "../utils/guestStorage";
import { toast } from "react-hot-toast";
import type { OrderStatus } from "../types";

type StoredOrder = {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  itemCount: number;
  items?: Array<{ name: string; quantity: number; price: number }>;
};

const statusTranslations: Record<string, string> = {
  CONFIRMED: "Práve sme potvrdili tvoju objednávku! 🥳",
  PREPARING: "Už chystáme tvoju objednávku! 👩‍🍳",
  READY: "Tvoja objednávka je hotová! ☕",
  COMPLETED: "Objednávka bola vybavená. Ďakujeme! 🍪",
  CANCELLED: "Tvoja objednávka bola bohužiaľ zrušená. 😔"
};

export function useOrderStatusPolling() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const history = readGuestOrderHistory<StoredOrder>();
      // Nájdeme objednávky, ktoré ešte nie sú dokončené
      const activeOrders = history.filter(
        (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
      );

      if (activeOrders.length === 0) return;

      let historyChanged = false;
      const updatedHistory = [...history];

      for (const order of activeOrders) {
        try {
          const response = await api.get(`/orders/${order.id}`);
          const newStatus = response.data.status;

          if (newStatus && newStatus !== order.status) {
            // Stav sa zmenil!
            toast(statusTranslations[newStatus] || "Stav vašej objednávky sa zmenil.", 
              
            );

            // Aktualizujeme históriu
            const index = updatedHistory.findIndex((o) => o.id === order.id);
            if (index !== -1) {
              updatedHistory[index].status = newStatus;
              historyChanged = true;
            }
          }
        } catch (error) {
          console.error(`Failed to poll order ${order.id}`, error);
        }
      }

      if (historyChanged) {
        saveGuestOrderHistory(updatedHistory);
      }
    }, 5000); // Každých 5 sekúnd

    return () => clearInterval(interval);
  }, []);
}
