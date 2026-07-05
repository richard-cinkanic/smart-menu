import type { OrderStatus } from "../types";
import { getOrderStatusLabel } from "../utils/orderStatus";

const timelineStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

export default function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = timelineStatuses.indexOf(status);
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const activeIndex = isCompleted ? timelineStatuses.length - 1 : currentIndex;

  return (
    <section className={`order-status-timeline${isCancelled ? " is-cancelled" : ""}`} aria-label="Stav objednávky">
      <div className="timeline-heading">
        <span>Live stav</span>
        <strong>{getOrderStatusLabel(status)}</strong>
      </div>

      <div className="timeline-steps">
        {timelineStatuses.map((step, index) => {
          const isDone = !isCancelled && activeIndex >= index;
          const isCurrent = !isCancelled && status === step;

          return (
            <div key={step} className={`timeline-step${isDone ? " is-done" : ""}${isCurrent ? " is-current" : ""}`}>
              <span className="timeline-dot" />
              <span>{getOrderStatusLabel(step)}</span>
            </div>
          );
        })}
      </div>

      {isCancelled && <p>Objednávka bola zrušená. V prípade otázok kontaktujte obsluhu.</p>}
      {isCompleted && <p>Objednávka bola vybavená. Ďakujeme Vám.</p>}
    </section>
  );
}
