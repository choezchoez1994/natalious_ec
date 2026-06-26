import { useRef, useState } from "react";
import { ACard, ASectionTitle, AField, ASelect, AToggle, LocalInput } from "../../components/form";
import { ImageSlot } from "../../components/ImageSlot";
import { EmptyState, Spinner } from "../../components/ui";
import { useConfirm } from "../../components/ConfirmDialog";
import { TrashIcon } from "../../components/icons";
import { useCatalog } from "../../store/CatalogContext";
import {
  addSlide,
  clearCategoryImage,
  deleteSlide,
  moveSlide,
  setCarouselConfig,
  setCategoryImage,
  setSlideImage,
  updateSlide,
} from "../../services/carousel";
import type { Category, Slide } from "../../lib/types";

const LINK_TYPES = [
  { id: "producto", label: "Producto" },
  { id: "categoria", label: "Categoría" },
  { id: "cart", label: "Carrito" },
  { id: "url", label: "URL personalizada" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "none", label: "Sin botón" },
];

function SlideCard({ s, index, total, reload }: { s: Slide; index: number; total: number; reload: () => Promise<void> }) {
  const { products, categories } = useCatalog();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upd = async (patch: Partial<Slide>) => {
    await updateSlide(s.id, patch);
    await reload();
  };
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await setSlideImage(s, file);
      await reload();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <ACard style={{ padding: 0, overflow: "hidden", opacity: s.active ? 1 : 0.62 }}>
      <div className="nat-slidecard">
        <div className="nat-slidecard-img">
          <div style={{ height: 7, background: "var(--teal)" }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: "block", width: "100%", border: "none", padding: 0, cursor: "pointer", background: "none" }} title="Cambiar imagen">
            <ImageSlot url={s.image_url} ratio="12 / 5" placeholder={busy ? "Subiendo…" : "Subir imagen de la diapositiva"} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick} />
          <p className="nat-editor-sub" style={{ padding: "8px 12px 12px", margin: 0 }}>Recomendado: panorámica <strong>2.4:1</strong> (1920 × 800 px), motivo centrado en la zona segura del medio. JPG/WebP &lt; 500 KB.</p>
        </div>

        <div className="nat-slidecard-form">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="nat-slide-order">#{index + 1}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="nat-iconbtn" disabled={index === 0} onClick={async () => { await moveSlide(s.id, -1); await reload(); }} title="Subir">↑</button>
                <button className="nat-iconbtn" disabled={index === total - 1} onClick={async () => { await moveSlide(s.id, 1); await reload(); }} title="Bajar">↓</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AToggle on={s.active} onChange={(v) => upd({ active: v })} labels={["Activa", "Inactiva"]} />
              <button className="nat-iconbtn is-danger" title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar diapositiva", message: "¿Eliminar esta diapositiva del carrusel?", confirmLabel: "Eliminar", danger: true })) { await deleteSlide(s.id, s.image_path); await reload(); } }}>
                <TrashIcon />
              </button>
            </div>
          </div>

          <AField label="Título"><LocalInput value={s.title} onCommit={(v) => upd({ title: v })} /></AField>
          <AField label="Subtítulo"><LocalInput value={s.subtitle} onCommit={(v) => upd({ subtitle: v })} /></AField>

          <div className="nat-admin-2col" style={{ gap: 14 }}>
            <AField label="Texto del botón"><LocalInput value={s.cta_label} onCommit={(v) => upd({ cta_label: v })} /></AField>
            <AField label="Destino del botón">
              <ASelect value={s.link_type} onChange={(e) => upd({ link_type: (e.target as HTMLSelectElement).value as Slide["link_type"], link_value: "" })}>
                {LINK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </ASelect>
            </AField>
          </div>

          {s.link_type === "producto" && (
            <AField label="Producto destino">
              <ASelect value={s.link_value} onChange={(e) => upd({ link_value: (e.target as HTMLSelectElement).value })}>
                <option value="">— Elige un producto —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </ASelect>
            </AField>
          )}
          {s.link_type === "categoria" && (
            <AField label="Categoría destino">
              <ASelect value={s.link_value} onChange={(e) => upd({ link_value: (e.target as HTMLSelectElement).value })}>
                <option value="">— Elige una categoría —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </ASelect>
            </AField>
          )}
          {s.link_type === "url" && (
            <AField label="URL de destino" hint="Ej. https://… (se abre en una pestaña nueva).">
              <LocalInput value={s.link_value} onCommit={(v) => upd({ link_value: v })} placeholder="https://" />
            </AField>
          )}
          {s.link_type === "whatsapp" && (
            <AField label="Mensaje de WhatsApp" hint="Opcional. Si lo dejas vacío usamos uno con el título.">
              <LocalInput value={s.link_value} onCommit={(v) => upd({ link_value: v })} />
            </AField>
          )}

          <div className="nat-admin-2col" style={{ gap: 14 }}>
            <AField label="Publicar desde" hint="Opcional"><input type="date" className="nat-input" value={s.start_date ?? ""} onChange={(e) => upd({ start_date: e.target.value || null })} /></AField>
            <AField label="Publicar hasta" hint="Opcional"><input type="date" className="nat-input" value={s.end_date ?? ""} onChange={(e) => upd({ end_date: e.target.value || null })} /></AField>
          </div>
        </div>
      </div>
    </ACard>
  );
}

function CategoryImageCard({ c, reload }: { c: Category; reload: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await setCategoryImage(c.id, c.image_path, file);
      await reload();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <ACard style={{ padding: 12 }}>
      <button onClick={() => fileRef.current?.click()} style={{ display: "block", width: "100%", border: "none", padding: 0, cursor: "pointer", background: "none", borderRadius: 10, overflow: "hidden" }}>
        <ImageSlot url={c.image_url} ratio="3 / 4" radius={10} placeholder={busy ? "Subiendo…" : c.name} />
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{c.name}</span>
        {c.image_url && <button className="nat-mini is-ghost" onClick={async () => { await clearCategoryImage(c.id, c.image_path); await reload(); }}>Quitar</button>}
      </div>
    </ACard>
  );
}

export function CarouselAdmin() {
  const { slides, categories, config, loading, reload } = useCatalog();
  if (loading) return <Spinner />;
  const ordered = [...slides].sort((a, b) => a.sort - b.sort);
  const today = new Date().toISOString().slice(0, 10);
  const active = ordered.filter((s) => s.active && (!s.start_date || s.start_date <= today) && (!s.end_date || s.end_date >= today)).length;

  return (
    <div>
      <ASectionTitle kicker="Página de inicio" title="Carrusel principal" right={<button className="nat-btn-primary" style={{ padding: "10px 18px" }} onClick={async () => { await addSlide(); await reload(); }}>+ Nueva diapositiva</button>} />

      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        {active} de {ordered.length} diapositivas visibles en la tienda. Sube una imagen a cada diapositiva; el botón puede llevar a un producto, una categoría o abrir WhatsApp.
      </p>

      <ACard style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>Movimiento automático</div>
            <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.55 }}>Aplica al carrusel principal y al de categorías.</div>
          </div>
          <AToggle on={config.carousel.autoplay} onChange={async (v) => { await setCarouselConfig({ autoplay: v }); await reload(); }} labels={["Activo", "Inactivo"]} />
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", opacity: config.carousel.autoplay ? 1 : 0.45, pointerEvents: config.carousel.autoplay ? "auto" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="nat-inv-lbl">Tiempo de cambio</span>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: "var(--teal)" }}>{config.carousel.intervalSec}s</span>
          </div>
          <input type="range" min="2" max="10" step="1" value={config.carousel.intervalSec} style={{ width: "100%", accentColor: "var(--teal)" }} onChange={async (e) => { await setCarouselConfig({ intervalSec: parseInt(e.target.value, 10) }); await reload(); }} />
        </div>
      </ACard>

      {ordered.length === 0 ? (
        <EmptyState title="Sin diapositivas" body="Crea la primera diapositiva para tu carrusel de inicio." action="+ Nueva diapositiva" onAction={async () => { await addSlide(); await reload(); }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ordered.map((s, i) => <SlideCard key={s.id} s={s} index={i} total={ordered.length} reload={reload} />)}
        </div>
      )}

      <ASectionTitle kicker="Categorías" title="Carrusel de categorías" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        Sube una imagen grande para cada categoría. Si no subes ninguna, se usa la foto principal del primer producto.
      </p>
      <div className="nat-catgrid">
        {[...categories].sort((a, b) => a.sort - b.sort).map((c) => <CategoryImageCard key={c.id} c={c} reload={reload} />)}
      </div>
    </div>
  );
}
