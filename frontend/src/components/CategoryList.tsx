import type { Category } from "../types";

export default function CategoryList({ categories, activeId, onSelect }: { categories: Category[]; activeId: string; onSelect: (id: string) => void }) {
  return <div className="category-list" aria-label="Kategórie menu"><button className={activeId === "all" ? "selected" : ""} onClick={() => onSelect("all")}>Všetko</button>{categories.map((category) => <button key={category.id} className={activeId === category.id ? "selected" : ""} onClick={() => onSelect(category.id)}>{category.name}</button>)}</div>;
}
