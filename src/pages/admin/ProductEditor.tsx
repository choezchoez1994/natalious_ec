import { useEffect, useRef, useState } from "react";
import {
  ACard,
  AField,
  AInput,
  ASelect,
  AStepper,
  AToggle,
  LocalInput,
  PriceField,
} from "../../components/form";
import { ImageSlot } from "../../components/ImageSlot";
import { ProductCard } from "../../components/ProductCard";
import { ChevronLeft } from "../../components/icons";
import { useCatalog } from "../../store/CatalogContext";
import {
  addColor,
  addProductImage,
  addSize,
  deleteProduct,
  removeColor,
  removeProductImage,
  removeSize,
  setCost,
  setPrincipalImage,
  setProductCharts,
  setSizeBlocked,
  updateColor,
  updateProduct,
} from "../../services/products";
import { adjustStock } from "../../services/inventory";
import { saveChart } from "../../services/settings";
import { money } from "../../lib/format";
import type { ChartRow, EffectiveProduct } from "../../lib/types";

function MarginRow({ label, sale, cost }: { label: string; sale: number | null; cost: number }) {
  if (sale == null || sale <= 0) return null;
  const margin = sale - cost;
  const pct = sale > 0 ? Math.round((margin / sale) * 100) : 0;
  const danger = margin < 0;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13 }}>
      <span style={{ color: "var(--ink)", opacity: 0.6 }}>{label}</span>
      <strong style={{ color: danger ? "#9a3b32" : "var(--ink)" }}>{money(margin)} · {pct}%</strong>
    </div>
  );
}

function StockField({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [v, setV] = useState(String(value ?? 0));
  useEffect(() => setV(String(value ?? 0)), [value]);
  const commit = () => {
    const n = parseInt(v || "0", 10);
    if (n !== value) onCommit(n);
  };
  return (
    <div className="nat-priceinput" style={{ paddingLeft: 12 }}>
      <input
        value={v}
        inputMode="numeric"
        onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        style={{ width: 56 }}
      />
      <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 12, opacity: 0.6 }}>u.</span>
    </div>
  );
}

function SizesEditor({ p, presets, reload }: { p: EffectiveProduct; presets: string[]; reload: () => Promise<void> }) {
  const [custom, setCustom] = useState("");
  const present = p.effSizes.map((s) => s.name);

  const add = async (name: string) => {
    await addSize(p.id, name, p.effSizes.length);
    await reload();
  };

  return (
    <div>
      <p className="nat-editor-sub" style={{ marginTop: 0 }}>El stock se gestiona por talla. Si una talla llega a 0 queda agotada; si todas llegan a 0, el producto se marca agotado.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
        {presets.map((s) => {
          const on = present.indexOf(s) >= 0;
          return (
            <button key={s} onClick={async () => { on ? await removeSize(p.id, s) : await add(s); await reload(); }} className={"nat-chip" + (on ? " is-active" : "")}>
              {s}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {p.effSizes.map((s) => (
          <div key={s.name} className="nat-opt-row" data-blocked={s.blocked ? "1" : "0"}>
            <span className="nat-opt-name">{s.name}</span>
            <span className="nat-inv-lbl" style={{ marginLeft: 4 }}>Stock</span>
            <StockField value={s.stock} onCommit={async (n) => { await adjustStock(p.id, s.name, n, "Ajuste desde editor"); await reload(); }} />
            <AToggle on={!s.blocked} onChange={async (av) => { await setSizeBlocked(p.id, s.name, !av); await reload(); }} labels={["Disponible", "Bloqueada"]} />
            {s.blocked && <LocalInput value={s.reason} onCommit={async (v) => { await setSizeBlocked(p.id, s.name, true, v); await reload(); }} placeholder="Motivo (ej. agotada)" />}
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Quitar talla" onClick={async () => { await removeSize(p.id, s.name); await reload(); }}>✕</button>
          </div>
        ))}
        {p.effSizes.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin tallas. Este producto usará el stock general.</p>}
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
        <AInput value={custom} placeholder="Talla personalizada (ej. 38, Único)" onChange={(e) => setCustom(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter" && custom.trim()) { await add(custom.trim()); setCustom(""); } }} />
        <button className="nat-btn-ghost" style={{ padding: "10px 16px", flex: "none" }} onClick={async () => { if (custom.trim()) { await add(custom.trim()); setCustom(""); } }}>Añadir</button>
      </div>
    </div>
  );
}

function ColorsEditor({ p, reload }: { p: EffectiveProduct; reload: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#1d1d1b");
  const add = async () => {
    if (!name.trim()) return;
    await addColor(p.id, name.trim(), hex, p.effColors.length);
    setName("");
    await reload();
  };
  return (
    <div>
      <p className="nat-editor-sub" style={{ marginTop: 0 }}>Los colores son opciones visuales: no controlan stock. Se guardan en cada orden.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {p.effColors.map((c) => (
          <div key={c.name} className="nat-opt-row" data-blocked={c.blocked ? "1" : "0"}>
            <input type="color" value={c.hex} className="nat-colorinput" style={{ width: 30, height: 30 }} onChange={async (e) => { await updateColor(p.id, c.name, { hex: e.target.value }); await reload(); }} />
            <span className="nat-opt-name">{c.name}</span>
            <AToggle on={!c.blocked} onChange={async (av) => { await updateColor(p.id, c.name, { blocked: !av }); await reload(); }} labels={["Disponible", "Bloqueado"]} />
            {c.blocked && <LocalInput value={c.reason} onCommit={async (v) => { await updateColor(p.id, c.name, { reason: v }); await reload(); }} placeholder="Motivo (ej. agotado)" />}
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Quitar color" onClick={async () => { await removeColor(p.id, c.name); await reload(); }}>✕</button>
          </div>
        ))}
        {p.effColors.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin colores. Este producto se venderá sin selección de color.</p>}
      </div>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        <input type="color" value={hex} className="nat-colorinput" onChange={(e) => setHex(e.target.value)} />
        <AInput value={name} placeholder="Nombre del color" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void add(); }} />
        <button className="nat-btn-ghost" style={{ padding: "10px 16px", flex: "none" }} onClick={add}>Añadir</button>
      </div>
    </div>
  );
}

function GalleryEditor({ p, reload }: { p: EffectiveProduct; reload: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    const fallidas: string[] = [];
    try {
      // En secuencia: addProductImage recalcula sort/is_principal según las ya existentes.
      for (const file of files) {
        try {
          await addProductImage(p.id, file);
        } catch (err) {
          fallidas.push(file.name + (err instanceof Error ? ` (${err.message})` : ""));
        }
      }
      await reload();
      if (fallidas.length > 0) alert("No se pudieron subir:\n" + fallidas.join("\n"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="nat-gallery">
      {p.images.map((g, i) => (
        <div key={g.id} className="nat-gallery-item">
          <ImageSlot url={g.url} ratio="1 / 1" radius={8} placeholder={"Imagen " + (i + 1)} />
          <div className="nat-gallery-tools">
            <button className={"nat-gtool" + (g.is_principal ? " is-on" : "")} title="Imagen principal" onClick={async () => { await setPrincipalImage(p.id, g.id); await reload(); }}>★ Principal</button>
            <button className="nat-gtool" onClick={async () => { await removeProductImage(g.id, g.storage_path); await reload(); }}>✕</button>
          </div>
        </div>
      ))}
      <button className="nat-gallery-add" onClick={() => fileRef.current?.click()} disabled={busy}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{busy ? "…" : "+"}</span>
        <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 600 }}>{busy ? "Subiendo" : "Subir imágenes"}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPick} />
    </div>
  );
}

function ChartEditor({ p, charts, reload }: { p: EffectiveProduct; charts: Record<string, ChartRow>; reload: () => Promise<void> }) {
  const keys = ["inferior", "superior"];
  const applied = p.charts || [];
  const toggle = async (k: string) => {
    const next = applied.indexOf(k) >= 0 ? applied.filter((x) => x !== k) : [...applied, k];
    await setProductCharts(p.id, next);
    await reload();
  };
  const editChart = async (key: string, mutate: (c: ChartRow) => ChartRow) => {
    const cur = charts[key];
    if (!cur) return;
    await saveChart(mutate({ ...cur, cols: [...cur.cols], rows: cur.rows.map((r) => [...r]) }));
    await reload();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {keys.map((k) => (
          <button key={k} onClick={() => toggle(k)} className={"nat-chip" + (applied.indexOf(k) >= 0 ? " is-active" : "")}>
            {k === "inferior" ? "Parte inferior" : "Parte superior"}
          </button>
        ))}
      </div>
      {applied.map((k) => {
        const t = charts[k];
        if (!t) return null;
        return (
          <div key={k} style={{ marginBottom: 16 }}>
            <LocalInput value={t.title} onCommit={(v) => editChart(k, (c) => ({ ...c, title: v }))} />
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table className="nat-matrix">
                <thead>
                  <tr>
                    {t.cols.map((c, ci) => (
                      <th key={ci}><LocalInput value={c} onCommit={(v) => editChart(k, (x) => { x.cols[ci] = v; return x; })} /></th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((cell, ci) => (
                        <td key={ci}>
                          <input className="nat-vcell" style={{ width: 78 }} defaultValue={cell} onBlur={(e) => editChart(k, (x) => { x.rows[ri][ci] = e.target.value; return x; })} />
                        </td>
                      ))}
                      <td>{t.rows.length > 1 && <button className="nat-tagx" onClick={() => editChart(k, (x) => { x.rows.splice(ri, 1); return x; })}>✕</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="nat-btn-ghost" style={{ padding: "8px 14px", marginTop: 8, fontSize: 13 }} onClick={() => editChart(k, (x) => { x.rows.push(x.cols.map(() => "")); return x; })}>+ Añadir fila</button>
          </div>
        );
      })}
      {applied.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin tabla de medidas. Activa “Parte inferior” o “Parte superior”.</p>}
    </div>
  );
}

export function ProductEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const { productById, categories, charts, catalogs, reload } = useCatalog();
  const p = productById(id);
  if (!p) {
    onClose();
    return null;
  }
  const upd = async (patch: Record<string, unknown>) => {
    await updateProduct(id, patch);
    await reload();
  };

  return (
    <div className="nat-editor">
      <div className="nat-editor-bar">
        <button className="nat-back" onClick={onClose}>
          <ChevronLeft /> Inventario
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="nat-saved">Guardado automáticamente ✓</span>
          <button className="nat-mini is-danger" onClick={async () => { if (confirm("¿Eliminar “" + p.name + "”?")) { await deleteProduct(id); await reload(); onClose(); } }}>Eliminar</button>
        </div>
      </div>

      <div className="nat-editor-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ACard>
            <h3 className="nat-editor-h">Información general</h3>
            <AField label="Nombre del producto"><LocalInput value={p.name} onCommit={(v) => upd({ name: v })} /></AField>
            <AField label="Slug (URL)" hint="Identificador único para enlaces."><LocalInput value={p.slug ?? ""} onCommit={(v) => upd({ slug: v })} /></AField>
            <div className="nat-admin-2col" style={{ gap: 14 }}>
              <AField label="Categoría">
                <ASelect value={p.category_id ?? ""} onChange={(e) => upd({ category_id: (e.target as HTMLSelectElement).value })}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </ASelect>
              </AField>
              <AField label="Estado">
                <ASelect value={p.state} onChange={(e) => upd({ state: (e.target as HTMLSelectElement).value })}>
                  {catalogs.productStates.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </ASelect>
              </AField>
            </div>
            <AField label="Descripción corta"><LocalInput value={p.short_desc} onCommit={(v) => upd({ short_desc: v })} /></AField>
            <AField label="Descripción larga" hint="Una línea por beneficio."><LocalInput multiline rows={4} value={p.long_desc} onCommit={(v) => upd({ long_desc: v })} /></AField>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span className="nat-inv-lbl">Destacado</span>
                <AToggle on={p.featured} onChange={(v) => upd({ featured: v })} labels={["Sí", "No"]} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span className="nat-inv-lbl">Bajo pedido sin stock</span>
                <AToggle on={p.backorder} onChange={(v) => upd({ backorder: v })} labels={["Sí", "No"]} />
              </div>
            </div>
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Precios y stock</h3>
            <div className="nat-admin-3col">
              <AField label="Precio normal"><PriceField value={p.price} onCommit={(v) => upd({ price: v == null ? 0 : v })} /></AField>
              <AField label="Promocional" hint="Opcional"><PriceField value={p.promo} placeholder="—" onCommit={(v) => upd({ promo: v })} /></AField>
              <AField label="Al por mayor" hint="Opcional"><PriceField value={p.mayor} placeholder="—" onCommit={(v) => upd({ mayor: v })} /></AField>
            </div>
            <div className="nat-admin-2col" style={{ gap: 14, marginTop: 4 }}>
              <AField label="Stock total (por talla)" hint="Edita el stock de cada talla abajo.">
                <div style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 22, color: p.soldOut ? "#9a3b32" : "var(--ink)" }}>{p.stock} u.</div>
              </AField>
              <AField label="Stock mínimo (alerta)"><AStepper value={p.min_stock} onChange={(v) => upd({ min_stock: v })} /></AField>
            </div>
            <AField label="Precio de compra (costo)" hint="Interno · para utilidad y margen. No se muestra al cliente.">
              <PriceField value={p.cost} placeholder="0" onCommit={async (v) => { await setCost(id, v == null ? 0 : v); await reload(); }} />
            </AField>
            <div className="nat-preview-facts" style={{ marginTop: 4 }}>
              <div style={{ marginBottom: 2 }}><span className="nat-inv-lbl">Márgenes estimados</span></div>
              <MarginRow label="Margen normal" sale={p.price} cost={p.cost} />
              <MarginRow label="Margen promocional" sale={p.promo} cost={p.cost} />
              <MarginRow label="Margen al por mayor" sale={p.mayor} cost={p.cost} />
              {(p.price ?? 0) <= 0 && <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "#9a3b32" }}>El precio normal debe ser mayor que 0.</div>}
              {p.promo != null && Number(p.promo) > Number(p.price) && <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "#9a3b32" }}>El precio promocional no puede superar al normal.</div>}
            </div>
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Imágenes</h3>
            <p className="nat-editor-sub">Galería del producto (Supabase Storage). Marca una como principal.</p>
            <p className="nat-editor-sub" style={{ marginTop: -4 }}>Recomendado: vertical <strong>3:4</strong> (1200 × 1600 px), fondo blanco y producto centrado. JPG/WebP &lt; 500 KB. Puedes seleccionar varias a la vez.</p>
            <GalleryEditor p={p} reload={reload} />
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Tallas y stock</h3>
            <SizesEditor p={p} presets={catalogs.sizes.map((s) => s.id)} reload={reload} />
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Colores disponibles</h3>
            <ColorsEditor p={p} reload={reload} />
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Tabla de medidas</h3>
            <p className="nat-editor-sub">Elige qué tablas mostrar y edita los valores (cm).</p>
            <ChartEditor p={p} charts={charts} reload={reload} />
          </ACard>
        </div>

        <div className="nat-editor-preview">
          <div style={{ position: "sticky", top: 80 }}>
            <div className="nat-inv-lbl" style={{ marginBottom: 10 }}>Vista previa</div>
            <div style={{ maxWidth: 230, margin: "0 auto" }}>
              <ProductCard p={p} onOpen={() => {}} />
            </div>
            <div className="nat-preview-facts">
              <div><span>Estado</span><strong>{catalogs.productStates.find((s) => s.id === p.state)?.label}</strong></div>
              <div><span>Stock</span><strong>{p.stock} u.</strong></div>
              <div><span>Tallas activas</span><strong>{p.effSizes.filter((s) => s.available).length}/{p.effSizes.length}</strong></div>
              <div><span>Colores activos</span><strong>{p.effColors.filter((c) => !c.blocked).length}/{p.effColors.length}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
