import { useEffect, useState } from "react";
import { ACard, ASectionTitle, AField, ATextarea, ASelect, LocalInput, PriceField } from "../../components/form";
import { ImageSlot } from "../../components/ImageSlot";
import { EmptyState, Spinner } from "../../components/ui";
import { Sparkle, ChevronLeft } from "../../components/icons";
import { useCatalog } from "../../store/CatalogContext";
import {
  fetchOrders,
  updateOrderState,
  setOrderObs,
  setOrderPago,
  setOrderCanal,
} from "../../services/orders";
import { money } from "../../lib/format";
import type { Order, OrderStateCat } from "../../lib/types";

function OrderBadge({ estado, states }: { estado: string; states: OrderStateCat[] }) {
  const s = states.find((x) => x.id === estado) ?? { color: "#666", bg: "rgba(0,0,0,0.08)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: s.bg, color: s.color, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.color }} />
      {estado}
    </span>
  );
}

export function Orders() {
  const { catalogs, reload } = useCatalog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState("todos");

  const refresh = async () => {
    setLoading(true);
    try {
      setOrders(await fetchOrders());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  if (loading) return <Spinner />;

  if (openId) {
    const o = orders.find((x) => x.id === openId);
    if (!o) {
      setOpenId(null);
      return null;
    }
    return (
      <OrderDetail
        order={o}
        states={catalogs.orderStates}
        payMethods={catalogs.paymentMethods.map((m) => m.id)}
        payStates={catalogs.paymentStatuses.map((m) => m.id)}
        channels={catalogs.channels.map((m) => m.id)}
        onBack={() => setOpenId(null)}
        onChanged={async () => {
          await refresh();
          await reload();
        }}
      />
    );
  }

  const tabs: [string, string][] = [
    ["todos", "Todas"],
    ["Pendiente", "Pendientes"],
    ["Enviado", "Enviadas"],
    ["Suspendido", "Suspendidas"],
    ["Cancelado", "Canceladas"],
  ];
  const list = tab === "todos" ? orders : orders.filter((o) => o.estado === tab);

  return (
    <div>
      <ASectionTitle kicker="Tienda" title="Órdenes" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        Pedidos generados por clientes. Marca <strong>Enviado</strong> para descontar inventario por talla y registrar la venta.
      </p>
      <div className="nat-filterbar" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {tabs.map(([id, lb]) => (
          <button key={id} onClick={() => setTab(id)} className={"nat-chip" + (tab === id ? " is-active" : "")} style={{ flex: "none" }}>
            {lb} <span style={{ opacity: 0.6 }}>· {id === "todos" ? orders.length : orders.filter((o) => o.estado === id).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="Sin órdenes" body="Cuando un cliente genere un pedido desde el carrito, aparecerá aquí." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((o) => (
            <div key={o.id} className="nat-invitem" style={{ cursor: "pointer" }} onClick={() => setOpenId(o.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{o.numero_orden}</span>
                  <OrderBadge estado={o.estado} states={catalogs.orderStates} />
                </div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.6, margin: "3px 0 6px" }}>
                  {o.cliente.nombres} {o.cliente.apellidos} · {o.cliente.ciudad || "—"} · {o.cliente.celular}
                </div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.7, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>{o.canal_origen || "—"}</span>
                  <span>· {o.pago?.formaPago || "Pago sin definir"}</span>
                  <span>· Pago: {o.pago?.estadoPago || "Pendiente"}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 19, color: "var(--ink)" }}>{money(o.total)}</span>
                <button className="nat-mini" onClick={(e) => { e.stopPropagation(); setOpenId(o.id); }}>Ver detalle</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetail({
  order,
  states,
  payMethods,
  payStates,
  channels,
  onBack,
  onChanged,
}: {
  order: Order;
  states: OrderStateCat[];
  payMethods: string[];
  payStates: string[];
  channels: string[];
  onBack: () => void;
  onChanged: () => Promise<void>;
}) {
  const [obs, setObs] = useState(order.observacion_interna ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const c = order.cliente ?? {};
  const pg = order.pago ?? {};

  const change = async (st: string) => {
    if (st === order.estado) return;
    if (st === "Cancelado" && order.estado === "Enviado" && !confirm("Esta orden ya fue enviada. Cancelarla generará un reverso de inventario. ¿Continuar?")) return;
    const res = await updateOrderState(order.id, st, obs);
    if (!res.ok) setMsg({ ok: false, t: res.error ?? "Error" });
    else {
      setMsg({ ok: true, t: "Orden actualizada a " + st });
      await onChanged();
    }
    setTimeout(() => setMsg(null), 2600);
  };

  const updPago = async (patch: Record<string, unknown>) => {
    await setOrderPago(order.id, patch as any);
    await onChanged();
  };

  return (
    <div>
      <div className="nat-editor-bar">
        <button className="nat-back" onClick={onBack}>
          <ChevronLeft /> Órdenes
        </button>
        <OrderBadge estado={order.estado} states={states} />
      </div>

      <div className="nat-admin-2col" style={{ alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ACard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <h3 className="nat-editor-h" style={{ margin: 0 }}>{order.numero_orden}</h3>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.6 }}>{order.fecha}</span>
            </div>
            <div className="nat-ord-client">
              <div><span>Cliente</span><strong>{c.nombres} {c.apellidos}</strong></div>
              <div><span>Cédula</span><strong>{c.cedula}</strong></div>
              <div><span>Celular</span><strong>{c.celular}</strong></div>
              <div><span>Correo</span><strong>{c.correo}</strong></div>
              <div><span>Ciudad</span><strong>{c.ciudad || "—"}</strong></div>
              <div><span>Canal de origen</span><strong>{order.canal_origen || "—"}</strong></div>
              <div style={{ gridColumn: "1 / -1" }}><span>Dirección</span><strong>{c.direccion}</strong></div>
            </div>
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Datos de pago</h3>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Forma de pago">
                <ASelect value={pg.formaPago || ""} onChange={(e) => updPago({ formaPago: (e.target as HTMLSelectElement).value })}>
                  <option value="">—</option>
                  {payMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                </ASelect>
              </AField>
              <AField label="Estado de pago">
                <ASelect value={pg.estadoPago || "Pendiente"} onChange={(e) => updPago({ estadoPago: (e.target as HTMLSelectElement).value })}>
                  {payStates.map((s) => <option key={s} value={s}>{s}</option>)}
                </ASelect>
              </AField>
            </div>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Banco de origen"><LocalInput value={pg.bancoOrigen || ""} onCommit={(v) => updPago({ bancoOrigen: v })} /></AField>
              <AField label="N° comprobante"><LocalInput value={pg.numeroComprobante || ""} onCommit={(v) => updPago({ numeroComprobante: v })} /></AField>
            </div>
            <div className="nat-admin-2col" style={{ gap: 12 }}>
              <AField label="Valor pagado"><PriceField value={pg.valorPagado ?? 0} onCommit={(v) => updPago({ valorPagado: v == null ? 0 : v })} /></AField>
              <AField label="Fecha de pago"><LocalInput value={pg.fechaPago || ""} onCommit={(v) => updPago({ fechaPago: v })} placeholder="AAAA-MM-DD" /></AField>
            </div>
            <AField label="Observación del pago"><LocalInput value={pg.observacionPago || ""} onCommit={(v) => updPago({ observacionPago: v })} /></AField>
            <AField label="Canal de origen">
              <ASelect value={order.canal_origen || ""} onChange={async (e) => { await setOrderCanal(order.id, (e.target as HTMLSelectElement).value); await onChanged(); }}>
                <option value="">—</option>
                {channels.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </ASelect>
            </AField>
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Productos</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {order.items.map((i) => (
                <div key={i.id} className="nat-cartline" style={{ padding: 10 }}>
                  <div className="nat-cartline-img" style={{ width: 52, height: 52 }}><ImageSlot url={i.image_url} ratio="1 / 1" radius={8} placeholder={i.product_name} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{i.product_name}</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.6 }}>
                      {i.color ? i.color + " · " : ""}{i.talla ? "Talla " + i.talla + " · " : ""}{i.cantidad} × {money(i.precio_unitario)}
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 16, color: "var(--ink)", flex: "none" }}>{money(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Total</span>
              <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 24, color: "var(--teal)" }}>{money(order.total)}</span>
            </div>
          </ACard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ACard>
            <h3 className="nat-editor-h">Estado de la orden</h3>
            <p className="nat-editor-sub">El inventario se descuenta al marcar <strong>Enviado</strong>.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {states.map((s) => (
                <button key={s.id} onClick={() => change(s.id)} disabled={s.id === order.estado} className="nat-statebtn" style={{ borderColor: s.color, color: s.id === order.estado ? "#fff" : s.color, background: s.id === order.estado ? s.color : "transparent" }}>
                  {s.id}
                </button>
              ))}
            </div>
            {msg && <div className={"nat-movemsg " + (msg.ok ? "ok" : "err")} style={{ marginTop: 12 }}>{msg.t}</div>}
            <AField label="Observación interna" hint="Se guarda al cambiar de estado o al salir del campo.">
              <ATextarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} onBlur={() => setOrderObs(order.id, obs)} />
            </AField>
          </ACard>

          <ACard>
            <h3 className="nat-editor-h">Historial</h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[...order.historial].reverse().map((h, i) => (
                <div key={h.id || i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < order.historial.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <Sparkle size={10} color="var(--teal)" />
                  <span style={{ flex: 1, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)" }}>{h.estado_anterior ? h.estado_anterior + " → " : ""}{h.estado_nuevo}{h.observacion ? " · " + h.observacion : ""}</span>
                  <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, color: "var(--ink)", opacity: 0.5 }}>{h.fecha}</span>
                </div>
              ))}
            </div>
          </ACard>
        </div>
      </div>
    </div>
  );
}
