import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { CategoryCarousel } from "../components/Carousels";
import { SectionHead, EmptyState, Spinner } from "../components/ui";
import { useCatalog } from "../store/CatalogContext";

export function Catalog() {
  const { publicProducts, categories, loading } = useCatalog();
  const { category } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState(category ?? "todos");
  const [stockFilter, setStockFilter] = useState<"todos" | "stock" | "pocas" | "agotado" | "pedido">("todos");
  const [sizeFilter, setSizeFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  useEffect(() => {
    setFilter(category ?? "todos");
  }, [category]);

  if (loading) return <Spinner />;

  // opciones de tallas/colores presentes en el catálogo
  const sizeOptions = Array.from(
    new Set(publicProducts.flatMap((p) => p.effSizes.map((s) => s.name)))
  ).sort();
  const colorOptions = Array.from(
    new Set(publicProducts.flatMap((p) => p.effColors.map((c) => c.name)))
  ).sort();

  let list = filter === "todos" ? publicProducts : publicProducts.filter((p) => p.category_id === filter);
  if (stockFilter !== "todos") list = list.filter((p) => p.avail === stockFilter);
  if (sizeFilter) list = list.filter((p) => p.effSizes.some((s) => s.name === sizeFilter && s.available));
  if (colorFilter) list = list.filter((p) => p.effColors.some((c) => c.name === colorFilter && !c.blocked));
  list = list.slice().sort((a, b) => (a.soldOut === b.soldOut ? 0 : a.soldOut ? 1 : -1));

  const filters = [{ id: "todos", name: "Todos" }, ...categories.filter((c) => c.active)];
  const catName = categories.find((c) => c.id === filter)?.name ?? "Catálogo";
  const hasExtraFilters = stockFilter !== "todos" || sizeFilter !== "" || colorFilter !== "";

  return (
    <div className="nat-shell" style={{ padding: "26px 18px 8px" }}>
      <SectionHead
        kicker={list.length + (list.length === 1 ? " modelo" : " modelos")}
        title={filter === "todos" ? "Catálogo" : catName}
      />
      <div className="nat-filterbar" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "18px 0 4px", paddingBottom: 4 }}>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => navigate(f.id === "todos" ? "/catalogo" : "/catalogo/" + f.id)}
            className={"nat-chip" + (filter === f.id ? " is-active" : "")}
            style={{ flex: "none" }}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "6px 0 4px" }}>
        <select className="nat-input" style={{ width: "auto", padding: "8px 30px 8px 12px", fontSize: 13 }} value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}>
          <option value="todos">Disponibilidad: todas</option>
          <option value="stock">En stock</option>
          <option value="pocas">Pocas unidades</option>
          <option value="pedido">Bajo pedido</option>
          <option value="agotado">Agotado</option>
        </select>
        <select className="nat-input" style={{ width: "auto", padding: "8px 30px 8px 12px", fontSize: 13 }} value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
          <option value="">Talla: todas</option>
          {sizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="nat-input" style={{ width: "auto", padding: "8px 30px 8px 12px", fontSize: 13 }} value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
          <option value="">Color: todos</option>
          {colorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {hasExtraFilters && (
          <button className="nat-link" onClick={() => { setStockFilter("todos"); setSizeFilter(""); setColorFilter(""); }}>Limpiar filtros</button>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState
          title="Aún no hay modelos aquí"
          body="Estamos preparando nuevas piezas para esta categoría. Escríbenos y te avisamos cuando lleguen."
          action="Ver todo el catálogo"
          onAction={() => navigate("/catalogo")}
        />
      ) : (
        <div className="nat-grid" style={{ marginTop: 16 }}>
          {list.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={() => navigate("/producto/" + p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Categories() {
  const { loading } = useCatalog();
  if (loading) return <Spinner />;
  return (
    <div className="nat-shell" style={{ padding: "26px 18px 8px" }}>
      <SectionHead kicker="Colección" title="Categorías" />
      <div style={{ marginTop: 18 }}>
        <CategoryCarousel />
      </div>
    </div>
  );
}
