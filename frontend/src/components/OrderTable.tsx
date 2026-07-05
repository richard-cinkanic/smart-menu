import type { Order, OrderStatus } from "../types";
import { allOrderStatuses, getOrderStatusLabel } from "../utils/orderStatus";

function formatProducts(order: Order) {
  return order.items.map((item) => `${item.quantity}x ${item.product.name}`).join(", ");
}

export default function OrderTable({ orders, onStatusChange }: { orders: Order[]; onStatusChange?: (orderId: string, status: OrderStatus) => void }) {
  return (
    <div className="table-scroll">
      <table className="order-table restaurant-order-table">
        <thead>
          <tr>
            <th>ID objednávky</th>
            <th>Dátum a čas</th>
            <th>Stôl</th>
            <th>Zákazník</th>
            <th>Produkty</th>
            <th>Celková cena</th>
            <th>Stav</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td data-label="ID objednávky"><span className="mono-id">{order.id.slice(0, 8)}</span></td>
              <td data-label="Dátum a čas">{new Date(order.createdAt).toLocaleString("sk-SK")}</td>
              <td data-label="Stôl">{order.table?.number ? `Stôl ${order.table.number}` : "-"}</td>
              <td data-label="Zákazník">{order.customer?.email ?? "Hosť"}</td>
              <td data-label="Produkty" className="products-cell">{formatProducts(order)}</td>
              <td data-label="Celková cena"><strong>{order.totalPrice.toFixed(2)} €</strong></td>
              <td data-label="Stav">
                {onStatusChange ? (
                  <select className={`status-select status-${order.status.toLowerCase()}`} value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}>
                    {allOrderStatuses.map((status) => <option key={status} value={status}>{getOrderStatusLabel(status)}</option>)}
                  </select>
                ) : (
                  <span className={`status-pill status-${order.status.toLowerCase()}`}>{getOrderStatusLabel(order.status)}</span>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-table">Žiadne objednávky pre aktuálne filtre.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
