import { useState } from "react";
import { ASectionTitle, AToggle } from "../../components/form";
import { ImageSlot } from "../../components/ImageSlot";
import { EmptyState, Spinner } from "../../components/ui";
import { useConfirm } from "../../components/ConfirmDialog";
import { TrashIcon } from "../../components/icons";
import { useCatalog } from "../../store/CatalogContext";
import { createProduct, deleteProduct, updateProduct } from "../../services/products";
import { money } from "../../lib/format";
import { ProductEditor } from "./ProductEditor";
import type { EffectiveProduct } from "../../lib/types";

function StatePill({ state }: { state: string }) {
  const map: Record<string, { t: string; c: string; bg: string }> = {
    disponible: { t: "Disponible", c: "#3f7d56", bg: "rgba(63,125,86,0.12)" },
    "bajo pedido": { t: "Bajo pedido", c: "#3c5963", bg: "rgba(90,125,138,0.14)" },
    agotado: { t: "Agotado", c: "#9a3b32", bg: "rgba(154,59,50,0.12)" },
    inactivo: { t: "Inactivo", c: "#7a766c", bg: "rgba(122,118,108,0.14)" },
  };
  const s = map[state] || map.disponible;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: s.bg, color: s.c, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.c }} />
      {s.t}
    </span>
  );
}

function InvItem({ p, onEdit, onChanged }: { p: EffectiveProduct; onEdit: (id: string) => void; onChanged: () => void }) {
  const confirm = useConfirm();
  const sizesAct = p.effSizes.filter((s) => s.available).length;
  const colorsAct = p.effColors.filter((c) => !c.soldOut).length;
  return (
    <div className="nat-invitem" style={{ opacity: p.active ? 1 : 0.6 }}>
      <div className="nat-invitem-thumb">
        <ImageSlot url={p.principalImage} fill placeholder={p.name.slice(0, 2)} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{p.name}</span>
          <StatePill state={p.state} />
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: 7 }}>
          <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 17, color: p.hasPromo ? "#9a3b32" : "var(--ink)" }}>
            {money(p.hasPromo && p.promoVal != null ? p.promoVal : p.retail)}
            {p.hasPromo && <span style={{ fontSize: 13, opacity: 0.5, textDecoration: "line-through", marginLeft: 6 }}>{money(p.retail)}</span>}
          </span>
          <span className={"nat-invmeta" + (p.soldOut ? " is-out" : p.lowStock ? " is-low" : "")}>{p.stock} u.</span>
          <span className="nat-invmeta">{sizesAct}/{p.effSizes.length} tallas</span>
          <span className="nat-invmeta">{colorsAct}/{p.effColors.length} colores</span>
        </div>
      </div>
      <div className="nat-invitem-actions">
        <button className="nat-iconbtn" title={p.featured ? "Quitar destacado" : "Marcar destacado"} data-on={p.featured ? "1" : "0"} onClick={async () => { await updateProduct(p.id, { featured: !p.featured }); onChanged(); }}>★</button>
        <button className="nat-mini" onClick={() => onEdit(p.id)}>Editar</button>
        <AToggle on={p.active} onChange={async (on) => { await updateProduct(p.id, { state: on ? "disponible" : "inactivo" }); onChanged(); }} />
        <button className="nat-iconbtn is-danger" title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar producto", message: "¿Eliminar “" + p.name + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteProduct(p.id); onChanged(); } }}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

export function Inventory() {
  const { products, loading, reload } = useCatalog();
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("todos");

  if (loading) return <Spinner />;
  if (editId) return <ProductEditor id={editId} onClose={() => setEditId(null)} />;

  const newProduct = async () => {
    setBusy(true);
    const id = await createProduct();
    await reload();
    setBusy(false);
    setEditId(id);
  };

  const all = products;
  const tabs = [
    { id: "todos", label: "Todos", n: all.length },
    { id: "active", label: "Activos", n: all.filter((p) => p.active).length },
    { id: "low", label: "Stock bajo", n: all.filter((p) => p.lowStock).length },
    { id: "out", label: "Agotados", n: all.filter((p) => p.avail === "agotado").length },
    { id: "featured", label: "Destacados", n: all.filter((p) => p.featured).length },
    { id: "inactive", label: "Inactivos", n: all.filter((p) => !p.active).length },
  ];
  const reviewTabs = [
    { id: "noimg", label: "Sin imagen", n: all.filter((p) => p.images.length === 0).length },
    { id: "noprice", label: "Precio 0", n: all.filter((p) => p.retail === 0).length },
  ];
  let list = all;
  if (tab === "active") list = all.filter((p) => p.active);
  else if (tab === "low") list = all.filter((p) => p.lowStock);
  else if (tab === "out") list = all.filter((p) => p.avail === "agotado");
  else if (tab === "featured") list = all.filter((p) => p.featured);
  else if (tab === "inactive") list = all.filter((p) => !p.active);
  else if (tab === "noimg") list = all.filter((p) => p.images.length === 0);
  else if (tab === "noprice") list = all.filter((p) => p.retail === 0);
  if (q.trim()) list = list.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <ASectionTitle kicker="Gestión" title="Inventario" right={<button className="nat-btn-primary" style={{ padding: "10px 18px" }} onClick={newProduct} disabled={busy}>{busy ? "Creando…" : "+ Nuevo producto"}</button>} />

      <div className="nat-search" style={{ marginBottom: 14 }}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar modelo…" />
      </div>

      <div className="nat-filterbar" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={"nat-chip" + (tab === t.id ? " is-active" : "")} style={{ flex: "none" }}>
            {t.label} <span style={{ opacity: 0.6 }}>· {t.n}</span>
          </button>
        ))}
        {reviewTabs.map((t, i) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={"nat-chip" + (tab === t.id ? " is-active" : "")} style={{ flex: "none", marginLeft: i === 0 ? "auto" : undefined }}>
            {t.label} <span style={{ opacity: 0.6 }}>· {t.n}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          body={tab === "out" ? "No tienes productos agotados. ✦" : tab === "low" ? "Ningún producto con stock bajo. ✦" : tab === "noimg" ? "Todos los productos tienen imagen cargada. ✦" : tab === "noprice" ? "Ningún producto con precio en $0,00. ✦" : "Crea un producto nuevo o ajusta la búsqueda."}
          action="Ver todos"
          onAction={() => { setTab("todos"); setQ(""); }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((p) => <InvItem key={p.id} p={p} onEdit={setEditId} onChanged={() => reload()} />)}
        </div>
      )}
    </div>
  );
}
