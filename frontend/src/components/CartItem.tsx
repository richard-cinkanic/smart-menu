import type { CartLine } from "../types";
import ProductVisual from "./ProductVisual";

export default function CartItem({ line, onQuantityChange, onRemove }: { line: CartLine; onQuantityChange: (quantity: number) => void; onRemove: () => void }) {
  const itemTotal = line.product.price * line.quantity;

  return (
    <article className="cart-item">
      <div className="cart-item-visual"><ProductVisual product={line.product} /></div>
      <div className="cart-item-main">
        <div>
          <h3>{line.product.name}</h3>
          <p>{line.product.price.toFixed(2)} € / ks</p>
        </div>
      </div>
      <button className="remove-text-button" onClick={onRemove}>Odstrániť</button>
      <div className="quantity-control" aria-label={`Množstvo pre ${line.product.name}`}>
        <button type="button" onClick={() => onQuantityChange(Math.max(1, line.quantity - 1))}>−</button>
        <span>{line.quantity}</span>
        <button type="button" onClick={() => onQuantityChange(line.quantity + 1)}>+</button>
      </div>
      <strong className="cart-item-total">{itemTotal.toFixed(2)} €</strong>
    </article>
  );
}
