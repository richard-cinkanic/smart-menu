import type { Product } from "../types";

function initialsFor(product: Product) {
  const source = product.category?.name || product.name;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function ProductVisual({ product }: { product: Product }) {
  if (!product.imageUrl?.trim()) {
    return <div className="product-image-placeholder" aria-hidden="true"><span>{initialsFor(product)}</span></div>;
  }

  return (
    <>
      <img src={product.imageUrl} alt="" onError={(event) => {
        event.currentTarget.style.display = "none";
        event.currentTarget.nextElementSibling?.removeAttribute("hidden");
      }} />
      <div className="product-image-placeholder" hidden aria-hidden="true"><span>{initialsFor(product)}</span></div>
    </>
  );
}
