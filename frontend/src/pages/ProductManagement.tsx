import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import ProductVisual from "../components/ProductVisual";
import type { Category, Product } from "../types";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  available: boolean;
};

const cafeCategoryOrder = [
  "Káva",
  "Čaje",
  "Nealkoholické nápoje",
  "Nealkoholické miešané nápoje",
  "Pivo",
  "Víno",
  "Miešané nápoje",
  "Dezerty"
];

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  categoryId: "",
  available: true
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function sortCategories(categories: Category[]) {
  return [...categories].sort((a, b) => {
    const orderA = cafeCategoryOrder.indexOf(a.name);
    const orderB = cafeCategoryOrder.indexOf(b.name);
    if (orderA !== -1 || orderB !== -1) return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    return a.name.localeCompare(b.name, "sk");
  });
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [priceError, setPriceError] = useState("");

  async function loadData() {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get<Product[]>("/products/admin/all"),
      api.get<Category[]>("/categories")
    ]);
    const sortedCategories = sortCategories(categoryResponse.data);
    setProducts(productResponse.data);
    setCategories(sortedCategories);
    setForm((current) => ({ ...current, categoryId: current.categoryId || sortedCategories[0]?.id || "" }));
  }

  useEffect(() => { loadData(); }, []);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !value || product.name.toLowerCase().includes(value);
      const matchesCategory = selectedCategoryId === "all" || product.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId]);

  const groupedProducts = useMemo(() => categories.map((category) => ({
    category,
    products: filteredProducts.filter((product) => product.categoryId === category.id)
  })).filter((group) => group.products.length > 0), [categories, filteredProducts]);

  const availableCount = products.filter((product) => product.available).length;
  const unavailableCount = products.length - availableCount;

  function resetForm() {
    setEditingProductId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
    setPriceError("");
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      available: product.available
    });
    setPriceError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, imageUrl }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.price.trim() || Number.isNaN(price) || price <= 0) {
      setPriceError("Cena musí byť väčšia ako 0 €.");
      return;
    }
    setPriceError("");
    const payload = { ...form, price };
    if (editingProductId) await api.put(`/products/${editingProductId}`, payload);
    else await api.post("/products", payload);
    resetForm();
    loadData();
  }

  async function remove(id: string) {
    await api.delete(`/products/${id}`);
    loadData();
  }

  return (
    <section className="product-management-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Café/bar administrácia</p>
          <h1>Správa ponuky</h1>
        </div>
        <div className="menu-stats">
          <span>{products.length} produktov</span>
          <span>{availableCount} dostupných</span>
          <span>{unavailableCount} nedostupných</span>
        </div>
      </div>

      <form className="product-editor" onSubmit={submit}>
        <div className="editor-fields">
          <input placeholder="Názov produktu" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <div className="field-with-error">
            <input
              placeholder="Cena v €"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(event) => {
                setForm({ ...form, price: event.target.value });
                if (Number(event.target.value) > 0) setPriceError("");
              }}
              required
            />
            {priceError && <span className="form-error">{priceError}</span>}
          </div>
          <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={form.available ? "available" : "unavailable"} onChange={(event) => setForm({ ...form, available: event.target.value === "available" })}>
            <option value="available">Dostupné</option>
            <option value="unavailable">Nedostupné</option>
          </select>
          <textarea placeholder="Popis produktu" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </div>

        <div className="image-upload-panel">
          <div className="image-preview">
            {form.imageUrl ? <img src={form.imageUrl} alt="Náhľad produktu" /> : <span>Náhľad obrázka</span>}
          </div>
          <label className="upload-button">
            Nahrať obrázok
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <p>Obrázok sa uloží ako lokálny náhľad v databáze, vhodné pre demo a prezentáciu.</p>
        </div>

        <div className="editor-actions">
          <button>{editingProductId ? "Uložiť zmeny" : "Pridať produkt"}</button>
          {editingProductId && <button type="button" className="secondary-action" onClick={resetForm}>Zrušiť úpravu</button>}
        </div>
      </form>

      <div className="product-admin-toolbar">
        <div className="admin-category-filter" aria-label="Filtrovať podľa kategórie">
          <button className={selectedCategoryId === "all" ? "selected" : ""} onClick={() => setSelectedCategoryId("all")}>Všetky</button>
          {categories.map((category) => (
            <button key={category.id} className={selectedCategoryId === category.id ? "selected" : ""} onClick={() => setSelectedCategoryId(category.id)}>
              {category.name}
            </button>
          ))}
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hľadať podľa názvu produktu" />
      </div>

      <div className="category-product-groups">
        {groupedProducts.map((group) => (
          <section key={group.category.id} className="category-product-group">
            <div className="category-group-heading">
              <h2>{group.category.name}</h2>
              <span>{group.products.length} položiek</span>
            </div>
            <div className="admin-product-list">
              {group.products.map((product) => (
                <article key={product.id} className="admin-product-row">
                  <div className="admin-product-visual">
                    <ProductVisual product={product} />
                  </div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <span>{product.category?.name ?? group.category.name}</span>
                  </div>
                  <strong>{product.price.toFixed(2)} €</strong>
                  <span className={product.available ? "availability available" : "availability unavailable"}>{product.available ? "Dostupné" : "Nedostupné"}</span>
                  <div className="row-actions">
                    <button onClick={() => editProduct(product)}>Upraviť</button>
                    <button onClick={() => remove(product.id)} className="danger-button">Vymazať</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {groupedProducts.length === 0 && <p className="empty-table">Nenašli sa žiadne produkty.</p>}
      </div>
    </section>
  );
}
