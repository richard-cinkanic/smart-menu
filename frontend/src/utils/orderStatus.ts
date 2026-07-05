import type { OrderStatus } from "../types";

export const activeOrderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
export const allOrderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Nová",
  CONFIRMED: "Potvrdená",
  PREPARING: "Pripravuje sa",
  READY: "Na vydanie",
  COMPLETED: "Vybavená",
  CANCELLED: "Zrušená"
};

export function getOrderStatusLabel(status: OrderStatus) {
  return orderStatusLabels[status];
}
