import { useState } from "react";
import type { ReactNode } from "react";
import { ACard, ASectionTitle, AInput, AToggle, LocalInput } from "../../components/form";
import { Spinner } from "../../components/ui";
import { useConfirm } from "../../components/ConfirmDialog";
import { useCatalog } from "../../store/CatalogContext";
import {
  addNamedCat,
  addSizeCat,
  addTextCat,
  deleteNamedCat,
  deleteSizeCat,
  deleteTextCat,
  reorderSizeCats,
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
  const confirm = useConfirm();
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>{title}</h3>
      <p className="nat-editor-sub">{hint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row">
            <LocalInput value={it.label} onCommit={async (v) => { await updateTextCat(table, it.id, { label: v }); await reload(); }} />
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar", message: "¿Eliminar “" + it.label + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteTextCat(table, it.id); await reload(); } }}>✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin elementos.</p>}
      </div>
      <AddRow placeholder={"Nuevo en " + title.toLowerCase()} onAdd={async (v) => { await addTextCat(table, v, v); await reload(); }} />
    </ACard>
  );
}

function OrderStatesSection({ items, reload }: { items: OrderStateCat[]; reload: () => Promise<void> }) {
  const confirm = useConfirm();
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>Estados de orden</h3>
      <p className="nat-editor-sub">El color se usa en las etiquetas. “Enviado” descuenta inventario; “Cancelado” lo revierte.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row">
            <input type="color" className="nat-colorinput" style={{ width: 30, height: 30 }} value={it.color} onChange={async (e) => { await updateTextCat("cat_order_states", it.id, { color: e.target.value }); await reload(); }} />
            <LocalInput value={it.label} onCommit={async (v) => { await updateTextCat("cat_order_states", it.id, { label: v }); await reload(); }} />
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar", message: "¿Eliminar “" + it.label + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteTextCat("cat_order_states", it.id); await reload(); } }}>✕</button>
          </div>
        ))}
      </div>
      <AddRow placeholder="Nuevo estado de orden" onAdd={async (v) => { await addTextCat("cat_order_states", v, v, { color: "#8a4f7d", bg: "rgba(138,79,125,0.14)" }); await reload(); }} />
    </ACard>
  );
}

function MovementReasonsSection({ items, reload }: { items: MovementReasonCat[]; reload: () => Promise<void> }) {
  const confirm = useConfirm();
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>Motivos de movimiento</h3>
      <p className="nat-editor-sub">Marca si un motivo cuenta como venta (rotación), baja por daño o pérdida/merma.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <LocalInput value={it.label} onCommit={async (v) => { await updateTextCat("cat_movement_reasons", it.id, { label: v }); await reload(); }} />
              <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar", message: "¿Eliminar “" + it.label + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteTextCat("cat_movement_reasons", it.id); await reload(); } }}>✕</button>
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
  const confirm = useConfirm();
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>{title}</h3>
      <p className="nat-editor-sub">{hint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="nat-opt-row">
            <LocalInput value={it.name} onCommit={async (v) => { await updateNamedCat(table, it.id, v); await reload(); }} />
            <button className="nat-tagx" style={{ width: 28, height: 28, marginLeft: "auto" }} title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar", message: "¿Eliminar “" + it.name + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteNamedCat(table, it.id); await reload(); } }}>✕</button>
          </div>
        ))}
        {items.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin elementos.</p>}
      </div>
      <AddRow placeholder={"Nuevo en " + title.toLowerCase()} onAdd={async (v) => { await addNamedCat(table, v); await reload(); }} />
    </ACard>
  );
}

function SizesSection({ items, reload }: { items: CatItem[]; reload: () => Promise<void> }) {
  const confirm = useConfirm();
  // Mueve una talla una posición (delta -1 = arriba, +1 = abajo) y persiste el nuevo orden.
  const move = async (idx: number, delta: number) => {
    const next = idx + delta;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((s) => s.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    await reorderSizeCats(ids);
    await reload();
  };
  return (
    <ACard>
      <h3 className="nat-editor-h" style={{ marginBottom: 4 }}>Tallas</h3>
      <p className="nat-editor-sub">Tallas disponibles para asignar a productos (S, M, L, …). El orden definido aquí es el que se usa en el catálogo público y en inventario.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, idx) => (
          <div key={it.id} className="nat-opt-row" style={{ gap: 6 }}>
            <span className="nat-opt-name">{it.label}</span>
            <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
              <button className="nat-btn-ghost" style={{ width: 28, height: 28, padding: 0, flex: "none", opacity: idx === 0 ? 0.35 : 1 }} title="Subir" disabled={idx === 0} onClick={() => move(idx, -1)}>↑</button>
              <button className="nat-btn-ghost" style={{ width: 28, height: 28, padding: 0, flex: "none", opacity: idx === items.length - 1 ? 0.35 : 1 }} title="Bajar" disabled={idx === items.length - 1} onClick={() => move(idx, 1)}>↓</button>
              <button className="nat-tagx" style={{ width: 28, height: 28 }} title="Eliminar" onClick={async () => { if (await confirm({ title: "Eliminar talla", message: "¿Eliminar talla “" + it.label + "”?", confirmLabel: "Eliminar", danger: true })) { await deleteSizeCat(it.id); await reload(); } }}>✕</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="nat-editor-sub" style={{ margin: 0 }}>Sin tallas.</p>}
      </div>
      <AddRow placeholder="Nueva talla (ej. XXL, 38)" onAdd={async (v) => { await addSizeCat(v.toUpperCase(), v.toUpperCase()); await reload(); }} />
    </ACard>
  );
}

type GroupKey = "productos" | "ordenes" | "pagos" | "contacto";

export function CatalogsAdmin() {
  const { catalogs, loading, reload } = useCatalog();
  const [group, setGroup] = useState<GroupKey>("productos");
  if (loading) return <Spinner />;

  const groups: { key: GroupKey; label: string; desc: string; count: number; render: () => ReactNode }[] = [
    {
      key: "productos",
      label: "Productos",
      desc: "Estados que puede tener un producto y las tallas disponibles para asignar.",
      count: catalogs.productStates.length + catalogs.sizes.length,
      render: () => (
        <>
          <TextCatSection title="Estados de producto" hint="disponible, bajo pedido, agotado, inactivo." table="cat_product_states" items={catalogs.productStates} reload={reload} />
          <SizesSection items={catalogs.sizes} reload={reload} />
        </>
      ),
    },
    {
      key: "ordenes",
      label: "Órdenes e inventario",
      desc: "Estados por los que pasa una orden y motivos que justifican los movimientos de stock.",
      count: catalogs.orderStates.length + catalogs.movementReasons.length,
      render: () => (
        <>
          <OrderStatesSection items={catalogs.orderStates} reload={reload} />
          <MovementReasonsSection items={catalogs.movementReasons} reload={reload} />
        </>
      ),
    },
    {
      key: "pagos",
      label: "Pagos",
      desc: "Cómo y en qué estado se cobra, y los bancos de origen para transferencias.",
      count: catalogs.paymentMethods.length + catalogs.paymentStatuses.length + catalogs.banks.length,
      render: () => (
        <>
          <TextCatSection title="Métodos de pago" hint="transferencia, efectivo, contra entrega, otro." table="cat_payment_methods" items={catalogs.paymentMethods} reload={reload} />
          <TextCatSection title="Estados de pago" hint="pendiente, pagado, parcial, rechazado." table="cat_payment_statuses" items={catalogs.paymentStatuses} reload={reload} />
          <NamedCatSection title="Bancos" hint="Banco de origen para transferencias." table="cat_banks" items={catalogs.banks} reload={reload} />
        </>
      ),
    },
    {
      key: "contacto",
      label: "Contacto",
      desc: "De dónde llega cada cliente: sitio web, redes, referido, local físico, etc.",
      count: catalogs.channels.length,
      render: () => (
        <TextCatSection title="Canales de contacto" hint="sitio web, redes, referido, local físico, etc." table="cat_channels" items={catalogs.channels} reload={reload} />
      ),
    },
  ];

  const active = groups.find((g) => g.key === group) ?? groups[0];

  return (
    <div>
      <ASectionTitle kicker="Configuración" title="Catálogos configurables" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        Listas reutilizables del sistema. Elige un grupo para editar sus catálogos.
      </p>

      <div style={{ overflowX: "auto", paddingBottom: 4, marginBottom: 18 }}>
        <div className="nat-seg" role="tablist" style={{ minWidth: "min-content" }}>
          {groups.map((g) => (
            <button
              key={g.key}
              role="tab"
              aria-selected={g.key === group}
              className={"nat-seg-btn" + (g.key === group ? " is-active" : "")}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}
              onClick={() => setGroup(g.key)}
            >
              {g.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "1px 7px",
                  background: g.key === group ? "rgba(255,255,255,0.22)" : "rgba(22,21,15,0.08)",
                }}
              >
                {g.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.55, margin: "0 0 16px" }}>
        {active.desc}
      </p>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "start" }}>
        {active.render()}
      </div>
    </div>
  );
}
