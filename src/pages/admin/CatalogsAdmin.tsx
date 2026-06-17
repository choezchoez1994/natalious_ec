import { useState } from "react";
import { ACard, ASectionTitle, AInput, AToggle, LocalInput } from "../../components/form";
import { Spinner } from "../../components/ui";
import { useCatalog } from "../../store/CatalogContext";
import {
  addNamedCat,
  addSizeCat,
  addTextCat,
  deleteNamedCat,
  deleteSizeCat,
  deleteTextCat,
  updateNamedCat,
  updateTextCat,
} from "../../services/catalogs";
import type { CatItem, MovementReasonCat, NamedItem, OrderStateCat } from "../../lib/types";
import type { NamedCatTable, TextCatTable } from "../../services/catalogs";

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "item";
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => Promise<void> }) {
  const [v, setV] = useState("");
  const add = async () => {
    if (!v.trim()) return;
    await onAdd(v.trim());
    setV("");
  };
  return (
    <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
      <AInput value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void add(); }} />
      <button className="nat-btn-ghost" style={{ padding: "10px 16px", flex: "none" }} onClick={add}>Añadir</button>
    </div>
  );
}

function TextCatSection({
  title,
  hint,
  table,
  items,
  reload,
}: {
  title: string;
  hint: string;
  table: TextCatTable;
  items: CatItem[];
  reload: () => Promise<void>;
}) {
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>{title}</h3>
      <p className="nat-editor-sub">{hint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row">
            <LocalInput value={it.label} onCommit={async (v) => { await updateTextCat(table, it.id, { label: v }); await reload(); }} />
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (confirm("¿Eliminar “" + it.label + "”?")) { await deleteTextCat(table, it.id); await reload(); } }}>✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin elementos.</p>}
      </div>
      <AddRow placeholder={"Nuevo en " + title.toLowerCase()} onAdd={async (v) => { await addTextCat(table, v, v); await reload(); }} />
    </ACard>
  );
}

function OrderStatesSection({ items, reload }: { items: OrderStateCat[]; reload: () => Promise<void> }) {
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>Estados de orden</h3>
      <p className="nat-editor-sub">El color se usa en las etiquetas. “Enviado” descuenta inventario; “Cancelado” lo revierte.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row">
            <input type="color" className="nat-colorinput" style={{ width: 30, height: 30 }} value={it.color} onChange={async (e) => { await updateTextCat("cat_order_states", it.id, { color: e.target.value }); await reload(); }} />
            <LocalInput value={it.label} onCommit={async (v) => { await updateTextCat("cat_order_states", it.id, { label: v }); await reload(); }} />
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (confirm("¿Eliminar “" + it.label + "”?")) { await deleteTextCat("cat_order_states", it.id); await reload(); } }}>✕</button>
          </div>
        ))}
      </div>
      <AddRow placeholder="Nuevo estado de orden" onAdd={async (v) => { await addTextCat("cat_order_states", v, v, { color: "#8a4f7d", bg: "rgba(138,79,125,0.14)" }); await reload(); }} />
    </ACard>
  );
}

function MovementReasonsSection({ items, reload }: { items: MovementReasonCat[]; reload: () => Promise<void> }) {
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>Motivos de movimiento</h3>
      <p className="nat-editor-sub">Marca si un motivo cuenta como venta (rotación), baja por daño o pérdida/merma.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <LocalInput value={it.label} onCommit={async (v) => { await updateTextCat("cat_movement_reasons", it.id, { label: v }); await reload(); }} />
              <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (confirm("¿Eliminar “" + it.label + "”?")) { await deleteTextCat("cat_movement_reasons", it.id); await reload(); } }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><AToggle on={it.is_sale} onChange={async (v) => { await updateTextCat("cat_movement_reasons", it.id, { is_sale: v }); await reload(); }} /><span className="nat-toggle-text">Venta</span></label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><AToggle on={it.is_defect} onChange={async (v) => { await updateTextCat("cat_movement_reasons", it.id, { is_defect: v }); await reload(); }} /><span className="nat-toggle-text">Daño</span></label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><AToggle on={it.is_loss} onChange={async (v) => { await updateTextCat("cat_movement_reasons", it.id, { is_loss: v }); await reload(); }} /><span className="nat-toggle-text">Pérdida</span></label>
            </div>
          </div>
        ))}
      </div>
      <AddRow placeholder="Nuevo motivo de salida" onAdd={async (v) => { await addTextCat("cat_movement_reasons", slug(v), v, { is_sale: false, is_defect: false, is_loss: false }); await reload(); }} />
    </ACard>
  );
}

function NamedCatSection({ title, hint, table, items, reload }: { title: string; hint: string; table: NamedCatTable; items: NamedItem[]; reload: () => Promise<void> }) {
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>{title}</h3>
      <p className="nat-editor-sub">{hint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row">
            <LocalInput value={it.name} onCommit={async (v) => { await updateNamedCat(table, it.id, v); await reload(); }} />
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (confirm("¿Eliminar “" + it.name + "”?")) { await deleteNamedCat(table, it.id); await reload(); } }}>✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin elementos.</p>}
      </div>
      <AddRow placeholder={"Nuevo en " + title.toLowerCase()} onAdd={async (v) => { await addNamedCat(table, v); await reload(); }} />
    </ACard>
  );
}

function SizesSection({ items, reload }: { items: CatItem[]; reload: () => Promise<void> }) {
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>Tallas</h3>
      <p className="nat-editor-sub">Tallas disponibles para asignar a productos (S, M, L, …).</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it) => (
          <span key={it.id} className="nat-opt-row" style={{ padding: "6px 8px 6px 12px", gap: 6 }}>
            <span className="nat-opt-name">{it.label}</span>
            <button className="nat-tagx" style={{ width: 24, height: 24 }} title="Eliminar" onClick={async () => { if (confirm("¿Eliminar talla “" + it.label + "”?")) { await deleteSizeCat(it.id); await reload(); } }}>✕</button>
          </span>
        ))}
        {items.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin tallas.</p>}
      </div>
      <AddRow placeholder="Nueva talla (ej. XXL, 38)" onAdd={async (v) => { await addSizeCat(v.toUpperCase(), v.toUpperCase()); await reload(); }} />
    </ACard>
  );
}

export function CatalogsAdmin() {
  const { catalogs, loading, reload } = useCatalog();
  if (loading) return <Spinner />;

  return (
    <div>
      <ASectionTitle kicker="Configuración" title="Catálogos configurables" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        Estados, bancos, métodos de pago, estados de pago, motivos de movimiento y canales de contacto.
      </p>
      <div className="nat-admin-2col" style={{ alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TextCatSection title="Estados de producto" hint="disponible, bajo pedido, agotado, inactivo." table="cat_product_states" items={catalogs.productStates} reload={reload} />
          <OrderStatesSection items={catalogs.orderStates} reload={reload} />
          <MovementReasonsSection items={catalogs.movementReasons} reload={reload} />
          <SizesSection items={catalogs.sizes} reload={reload} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TextCatSection title="Métodos de pago" hint="transferencia, efectivo, contra entrega, otro." table="cat_payment_methods" items={catalogs.paymentMethods} reload={reload} />
          <TextCatSection title="Estados de pago" hint="pendiente, pagado, parcial, rechazado." table="cat_payment_statuses" items={catalogs.paymentStatuses} reload={reload} />
          <TextCatSection title="Canales de contacto" hint="sitio web, redes, referido, local físico, etc." table="cat_channels" items={catalogs.channels} reload={reload} />
          <NamedCatSection title="Bancos" hint="Banco de origen para transferencias." table="cat_banks" items={catalogs.banks} reload={reload} />
        </div>
      </div>
    </div>
  );
}
