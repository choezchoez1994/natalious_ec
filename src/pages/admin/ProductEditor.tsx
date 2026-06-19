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
import { useConfirm } from "../../components/ConfirmDialog";
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
  setImageColor,
  setPrincipalImage,
  setProductCharts,
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

/** Paleta de colores del producto (compartida por todas las tallas). */
function PaletteEditor({
  p,
  reload,
  onAddColor,
  confirmRemove,
}: {
  p: EffectiveProduct;
  reload: () => Promise<void>;
  onAddColor: (name: string, hex: string) => Promise<void>;
  confirmRemove: (name: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#1d1d1b");
  const add = async () => {
    if (!name.trim()) return;
    await onAddColor(name.trim(), hex);
    setName("");
  };
  return (
    <div>
      <p className="nat-editor-sub" style={{ marginTop: 0 }}>Colores del producto. Se usan en todas las tallas; abajo defines el stock por talla y color.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {p.effColors.map((c) => (
          <div key={c.name} className="nat-opt-row" data-blocked={c.blocked ? "1" : "0"}>
            <input type="color" value={c.hex} className="nat-colorinput" style={{ width: 30, height: 30 }} onChange={async (e) => { await updateColor(p.id, c.name, { hex: e.target.value }); await reload(); }} />
            <span className="nat-opt-name">{c.name}</span>
            <span className={"nat-inv-lbl" + (c.soldOut ? " is-out" : "")} style={{ marginLeft: 4 }}>{c.stock} u.</span>
            <AToggle on={!c.blocked} onChange={async (av) => { await updateColor(p.id, c.name, { blocked: !av }); await reload(); }} labels={["Disponible", "Bloqueado"]} />
            {c.blocked && <LocalInput value={c.reason} onCommit={async (v) => { await updateColor(p.id, c.name, { reason: v }); await reload(); }} placeholder="Motivo (ej. agotado)" />}
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Quitar color" onClick={async () => { if (await confirmRemove(c.name)) { await removeColor(p.id, c.name); await reload(); } }}>✕</button>
          </div>
        ))}
        {p.effColors.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin colores. Agrega al menos uno para registrar stock.</p>}
      </div>
      <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 10 }}>
        <input type="color" value={hex} className="nat-colorinput" onChange={(e) => setHex(e.target.value)} />
        <AInput value={name} placeholder="Nuevo color" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void add(); }} />
        <button className="nat-btn-ghost" style={{ padding: "10px 16px", flex: "none" }} onClick={add}>Añadir color</button>
      </div>
    </div>
  );
}

/** Bloque de una talla: sus colores con stock. */
function SizeBlock({
  p,
  sz,
  reload,
  onRemove,
}: {
  p: EffectiveProduct;
  sz: EffectiveProduct["effSizes"][number];
  reload: () => Promise<void>;
  onRemove: () => void;
}) {
  const present = sz.colors.map((c) => c.name);
  const addables = p.effColors.filter((c) => present.indexOf(c.name) < 0);
  return (
    <div className="nat-colorblock">
      <div className="nat-colorblock-head" data-blocked={!sz.available ? "1" : "0"}>
        <span className="nat-opt-name" style={{ fontWeight: 700 }}>Talla {sz.name}</span>
        <span className={"nat-inv-lbl" + (!sz.available ? " is-out" : "")} style={{ marginLeft: 4 }}>{sz.stock} u.</span>
        <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Quitar talla" onClick={onRemove}>✕</button>
      </div>
      <div className="nat-colorblock-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sz.colors.map((c) => (
            <div key={c.name} className="nat-opt-row" data-blocked={c.blocked ? "1" : "0"}>
              <span style={{ width: 18, height: 18, borderRadius: 999, background: c.hex, border: "1px solid rgba(0,0,0,0.15)", flex: "none" }} />
              <span className="nat-opt-name">{c.name}</span>
              <span className="nat-inv-lbl" style={{ marginLeft: 4 }}>Stock</span>
              <StockField value={c.stock} onCommit={async (n) => { await adjustStock(p.id, c.name, sz.name, n, "Ajuste desde editor"); await reload(); }} />
              <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Quitar color de esta talla" onClick={async () => { await removeSize(p.id, c.name, sz.name); await reload(); }}>✕</button>
            </div>
          ))}
          {sz.colors.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin colores en esta talla.</p>}
        </div>
        {addables.length > 0 && (
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 10 }}>
            <span className="nat-inv-lbl">Agregar color</span>
            <ASelect
              value=""
              onChange={async (e) => { const v = (e.target as HTMLSelectElement).value; if (v) { await addSize(p.id, v, sz.name, 0); await reload(); } }}
              style={{ flex: "none", minWidth: 150 }}
            >
              <option value="">— Elige color —</option>
              {addables.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </ASelect>
          </div>
        )}
      </div>
    </div>
  );
}

/** Editor de inventario: paleta de colores + tallas con stock por color (talla → color). */
function SizesByColorEditor({
  p,
  presets,
  reload,
  confirmRemoveColor,
  confirmRemoveSize,
}: {
  p: EffectiveProduct;
  presets: string[];
  reload: () => Promise<void>;
  confirmRemoveColor: (name: string) => Promise<boolean>;
  confirmRemoveSize: (name: string) => Promise<boolean>;
}) {
  const [custom, setCustom] = useState("");
  const presentSizes = p.effSizes.map((s) => s.name);

  // agregar color a la paleta: crea su variante (stock 0) en todas las tallas existentes
  const addColorEverywhere = async (name: string, hex: string) => {
    await addColor(p.id, name, hex, p.effColors.length);
    for (const s of p.effSizes) await addSize(p.id, name, s.name, 0);
    await reload();
  };

  // agregar talla: crea variante (stock 0) para cada color de la paleta
  const addTalla = async (name: string) => {
    if (presentSizes.indexOf(name) >= 0) return;
    const sort = p.effSizes.length;
    if (p.effColors.length === 0) await addSize(p.id, "", name, sort);
    else for (const c of p.effColors) await addSize(p.id, c.name, name, sort);
    await reload();
  };

  const removeTalla = async (sz: EffectiveProduct["effSizes"][number]) => {
    for (const c of sz.colors) await removeSize(p.id, c.name, sz.name);
    await reload();
  };

  return (
    <div>
      <PaletteEditor p={p} reload={reload} onAddColor={addColorEverywhere} confirmRemove={confirmRemoveColor} />

      <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }} />

      <p className="nat-editor-sub" style={{ marginTop: 0 }}>
        Para cada talla, ingresa el stock por color. Si una variante llega a 0 queda agotada; si todas
        llegan a 0, el producto se marca agotado.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
        {presets.map((s) => {
          const on = presentSizes.indexOf(s) >= 0;
          return (
            <button
              key={s}
              onClick={async () => {
                if (on) { const sz = p.effSizes.find((x) => x.name === s); if (sz && (await confirmRemoveSize(s))) await removeTalla(sz); }
                else await addTalla(s);
              }}
              className={"nat-chip" + (on ? " is-active" : "")}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {p.effSizes.map((sz) => (
          <SizeBlock key={sz.name} p={p} sz={sz} reload={reload} onRemove={async () => { if (await confirmRemoveSize(sz.name)) await removeTalla(sz); }} />
        ))}
        {p.effSizes.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin tallas. Agrega una con los presets o el campo de abajo.</p>}
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
        <AInput value={custom} placeholder="Talla personalizada (ej. 38, Único)" onChange={(e) => setCustom(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter" && custom.trim()) { await addTalla(custom.trim()); setCustom(""); } }} />
        <button className="nat-btn-ghost" style={{ padding: "10px 16px", flex: "none" }} onClick={async () => { if (custom.trim()) { await addTalla(custom.trim()); setCustom(""); } }}>Añadir talla</button>
      </div>
    </div>
  );
}

function GalleryEditor({ p, reload }: { p: EffectiveProduct; reload: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // color al que se asignan las imágenes nuevas ('' = general)
  const [uploadColor, setUploadColor] = useState("");

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    const fallidas: string[] = [];
    try {
      // En secuencia: addProductImage recalcula sort/is_principal según las ya existentes.
      for (const file of files) {
        try {
          await addProductImage(p.id, file, uploadColor);
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
    <div>
      {p.effColors.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span className="nat-inv-lbl">Subir al color</span>
          <ASelect value={uploadColor} onChange={(e) => setUploadColor((e.target as HTMLSelectElement).value)} style={{ flex: "none", minWidth: 140 }}>
            <option value="">General (todos)</option>
            {p.effColors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </ASelect>
        </div>
      )}
      <div className="nat-gallery">
        {p.images.map((g, i) => (
          <div key={g.id} className="nat-gallery-item">
            <ImageSlot url={g.url} ratio="1 / 1" radius={8} placeholder={"Imagen " + (i + 1)} />
            <div className="nat-gallery-tools">
              <button className={"nat-gtool" + (g.is_principal ? " is-on" : "")} title="Imagen principal (catálogo)" onClick={async () => { await setPrincipalImage(p.id, g.id); await reload(); }}>★ Principal</button>
              <button className="nat-gtool" onClick={async () => { await removeProductImage(g.id, g.storage_path); await reload(); }}>✕</button>
            </div>
            {p.effColors.length > 0 && (
              <ASelect
                value={g.color || ""}
                onChange={async (e) => { await setImageColor(g.id, (e.target as HTMLSelectElement).value); await reload(); }}
                style={{ marginTop: 6, fontSize: 12, padding: "6px 8px" }}
              >
                <option value="">General (todos)</option>
                {p.effColors.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </ASelect>
            )}
          </div>
        ))}
        <button className="nat-gallery-add" onClick={() => fileRef.current?.click()} disabled={busy}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{busy ? "…" : "+"}</span>
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 600 }}>{busy ? "Subiendo" : "Subir imágenes"}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPick} />
      </div>
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
  const confirm = useConfirm();
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
          <button className="nat-mini is-danger" onClick={async () => { if (await confirm({ title: "Eliminar producto", message: "¿Eliminar “" + p.name + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteProduct(id); await reload(); onClose(); } }}>Eliminar</button>
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
              <AField label="Stock total (color + talla)" hint="Edita el stock por color y talla abajo.">
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
            <h3 className="nat-editor-h">Tallas, colores y stock</h3>
            <SizesByColorEditor
              p={p}
              presets={catalogs.sizes.map((s) => s.id)}
              reload={reload}
              confirmRemoveColor={(name) => confirm({ title: "Quitar color", message: "¿Quitar el color “" + name + "”? Se eliminará su stock en todas las tallas; sus imágenes pasarán a “General”.", confirmLabel: "Quitar", danger: true })}
              confirmRemoveSize={(name) => confirm({ title: "Quitar talla", message: "¿Quitar la talla “" + name + "”? Se eliminará su stock en todos los colores.", confirmLabel: "Quitar", danger: true })}
            />
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Imágenes</h3>
            <p className="nat-editor-sub">Galería del producto. Asigna cada imagen a un color (o “General”) y marca la principal que se muestra en el catálogo.</p>
            <p className="nat-editor-sub" style={{ marginTop: -4 }}>Recomendado: vertical <strong>3:4</strong> (1200 × 1600 px), fondo blanco y producto centrado. JPG/WebP &lt; 500 KB. Puedes seleccionar varias a la vez.</p>
            <GalleryEditor p={p} reload={reload} />
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
              <div><span>Colores activos</span><strong>{p.effColors.filter((c) => !c.soldOut).length}/{p.effColors.length}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
