import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import ProductVisual from "../components/ProductVisual";
import type { Product } from "../types";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) api.get<Product>(`/products/${id}`).then((response) => setProduct(response.data));
  }, [id]);

  if (!product) return <p>Načítavam položku...</p>;

  return (
    <section className="details-layout">
      <div className="details-visual">
        <ProductVisual product={product} />
      </div>
      <div>
        <p className="eyebrow">{product.category?.name ?? "Položka menu"}</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <strong className="price-large">{product.price.toFixed(2)} €</strong>
        <Link to="/menu" className="primary-action">Späť na menu</Link>
      </div>
    </section>
  );
}
