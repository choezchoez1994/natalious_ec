import { useEffect, useState } from "react";
import { ACard, ASectionTitle } from "../../components/form";
import { Spinner } from "../../components/ui";
import { KpiCard } from "./Dashboard";
import { useCatalog } from "../../store/CatalogContext";
import { fetchMovements } from "../../services/inventory";
import { fetchOrders } from "../../services/orders";
import { money } from "../../lib/format";
import type { Movement, Order } from "../../lib/types";

function groupTotals(rows: { key: string; total: number; count: number }[]) {
  const map: Record<string, { total: number; count: number }> = {};
  rows.forEach((r) => {
    const k = r.key || "—";
    map[k] = { total: (map[k]?.total ?? 0) + r.total, count: (map[k]?.count ?? 0) + r.count };
  });
  return Object.entries(map).map(([k, v]) => ({ k, ...v })).sort((a, b) => b.total - a.total);
}

function RankRow({ n, name, val, muted, danger }: { n?: number; name: string; val: string; muted?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
      {n != null && (
        <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--teal)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 12, flex: "none" }}>{n}</span>
      )}
      <span style={{ flex: 1, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
      <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: danger ? "#9a3b32" : muted ? "rgba(31,23,32,0.55)" : "var(--teal)", flex: "none" }}>{val}</span>
    </div>
  );
}

function Empty({ t }: { t: string }) {
  return <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.55, margin: 0 }}>{t}</p>;
}

export function Reports() {
  const { products } = useCatalog();
  const [mv, setMv] = useState<Movement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMovements(), fetchOrders()])
      .then(([m, o]) => { setMv(m); setOrders(o); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const sales = mv.filter((m) => m.kind === "salida" && m.reason === "venta");
  const defects = mv.filter((m) => m.reason === "baja_falla" || m.reason === "danado");
  const losses = mv.filter((m) => m.reason === "merma" || m.reason === "perdida");

  const soldByProduct: Record<string, number> = {};
  sales.forEach((m) => (soldByProduct[m.product_id] = (soldByProduct[m.product_id] || 0) + m.qty));
  const ranked = products.map((p) => ({ p, units: soldByProduct[p.id] || 0 })).sort((a, b) => b.units - a.units);
  const top = ranked.filter((r) => r.units > 0).slice(0, 6);
  const low = ranked.slice().sort((a, b) => a.units - b.units).slice(0, 6);
  const noMov = products.filter((p) => !(soldByProduct[p.id] > 0));

  const byVariant: Record<string, number> = {};
  sales.forEach((m) => {
    const k = m.product_name + "|" + m.color + "|" + m.size;
    byVariant[k] = (byVariant[k] || 0) + m.qty;
  });
  const variantRows = Object.entries(byVariant)
    .map(([k, u]) => {
      const [n, c, s] = k.split("|");
      return { n, c, s, u };
    })
    .sort((a, b) => b.u - a.u)
    .slice(0, 10);

  const byColor: Record<string, number> = {};
  const bySize: Record<string, number> = {};
  sales.forEach((m) => {
    if (m.color && m.color !== "—") byColor[m.color] = (byColor[m.color] || 0) + m.qty;
    if (m.size && m.size !== "—") bySize[m.size] = (bySize[m.size] || 0) + m.qty;
  });
  const colorRows = Object.entries(byColor).map(([k, u]) => ({ k, u })).sort((a, b) => b.u - a.u).slice(0, 8);
  const sizeRows = Object.entries(bySize).map(([k, u]) => ({ k, u })).sort((a, b) => b.u - a.u).slice(0, 8);

  const byReason: Record<string, number> = {};
  mv.filter((m) => m.kind === "salida").forEach((m) => (byReason[m.reason_label] = (byReason[m.reason_label] || 0) + m.qty));
  const reasonRows = Object.entries(byReason).map(([l, u]) => ({ l, u })).sort((a, b) => b.u - a.u);
  const maxReason = Math.max(1, ...reasonRows.map((r) => r.u));

  const totalSold = sales.reduce((s, m) => s + m.qty, 0);
  const totalDefect = defects.reduce((s, m) => s + m.qty, 0);
  const totalLoss = losses.reduce((s, m) => s + m.qty, 0);
  const utilidad = sales.reduce((s, m) => s + (m.utilidad_bruta ?? 0), 0);
  const ingresos = sales.reduce((s, m) => s + (m.subtotal_venta ?? 0), 0);
  const stockActual = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter((p) => p.lowStock || p.soldOut);

  const sellThrough = (sold: number, stk: number) => (stk + sold > 0 ? Math.round((sold / (sold + stk)) * 100) : 0);

  // ---- analítica de órdenes y pagos ----
  const byEstado = (e: string) => orders.filter((o) => o.estado === e).length;
  const sentOrders = orders.filter((o) => o.estado === "Enviado");
  const soldOrdersTotal = sentOrders.reduce((s, o) => s + o.total, 0);
  const pendingPayment = orders.filter((o) => (o.pago?.estadoPago ?? "Pendiente") !== "Pagado" && o.estado !== "Cancelado");
  const ordersByCity = groupTotals(orders.map((o) => ({ key: o.cliente?.ciudad ?? "—", total: o.total, count: 1 })));
  const ordersByChannel = groupTotals(orders.map((o) => ({ key: o.canal_origen ?? "—", total: o.total, count: 1 })));
  const salesByPayment = groupTotals(sentOrders.map((o) => ({ key: o.pago?.formaPago || "Sin definir", total: o.total, count: 1 })));
  const transferTotal = sentOrders.filter((o) => o.pago?.formaPago === "Transferencia bancaria").reduce((s, o) => s + o.total, 0);
  const cashTotal = sentOrders.filter((o) => o.pago?.formaPago === "Efectivo").reduce((s, o) => s + o.total, 0);
  const withReceipt = orders.filter((o) => (o.pago?.numeroComprobante ?? "").trim() !== "").length;

  return (
    <div>
      <ASectionTitle kicker="Tienda" title="Órdenes y pagos" />
      <div className="nat-kpi-grid nat-kpi-6">
        <KpiCard label="Pendientes" value={byEstado("Pendiente")} sub="Órdenes" tone="warn" />
        <KpiCard label="Enviadas" value={byEstado("Enviado")} sub="Órdenes" tone="teal" />
        <KpiCard label="Suspendidas" value={byEstado("Suspendido")} sub="Órdenes" tone="ink" />
        <KpiCard label="Canceladas" value={byEstado("Cancelado")} sub="Órdenes" tone={byEstado("Cancelado") ? "danger" : "ink"} />
        <KpiCard label="Vendido (enviadas)" value={money(soldOrdersTotal)} sub={sentOrders.length + " órdenes"} tone="teal" />
        <KpiCard label="Pago pendiente" value={pendingPayment.length} sub={withReceipt + " con comprobante"} tone={pendingPayment.length ? "warn" : "ink"} />
      </div>

      <div className="nat-admin-2col" style={{ marginTop: 18 }}>
        <ACard>
          <h3 className="nat-rep-h">Órdenes por ciudad</h3>
          {ordersByCity.length === 0 ? <Empty t="Sin órdenes todavía." /> : ordersByCity.slice(0, 8).map((r) => <RankRow key={r.k} name={r.k} val={r.count + " · " + money(r.total)} />)}
        </ACard>
        <ACard>
          <h3 className="nat-rep-h">Órdenes por canal</h3>
          {ordersByChannel.length === 0 ? <Empty t="Sin órdenes todavía." /> : ordersByChannel.slice(0, 8).map((r) => <RankRow key={r.k} name={r.k} val={r.count + " · " + money(r.total)} />)}
        </ACard>
      </div>

      <ACard style={{ marginTop: 16 }}>
        <h3 className="nat-rep-h">Ventas por forma de pago <span style={{ fontWeight: 500, fontSize: 12, opacity: 0.55 }}>· órdenes enviadas</span></h3>
        {salesByPayment.length === 0 ? <Empty t="Sin ventas enviadas." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {salesByPayment.map((r) => <RankRow key={r.k} name={r.k} val={r.count + " · " + money(r.total)} />)}
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 6, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13 }}>
              <span>Transferencia: <strong>{money(transferTotal)}</strong></span>
              <span>Efectivo: <strong>{money(cashTotal)}</strong></span>
            </div>
          </div>
        )}
      </ACard>

      <ASectionTitle kicker="Inventario" title="Reportes de rotación" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        La rotación comercial cuenta solo salidas tipo <strong>Venta</strong>. Bajas, mermas y pérdidas se reportan por separado.
      </p>

      <div className="nat-kpi-grid nat-kpi-6">
        <KpiCard label="Unidades vendidas" value={totalSold} sub="Solo ventas" tone="teal" />
        <KpiCard label="Ingresos por venta" value={money(ingresos)} sub={money(utilidad) + " utilidad"} tone="teal" />
        <KpiCard label="Bajas falla/daño" value={totalDefect} sub={defects.length + " movs."} tone={totalDefect ? "danger" : "ink"} />
        <KpiCard label="Mermas / pérdidas" value={totalLoss} sub={losses.length + " movs."} tone={totalLoss ? "warn" : "ink"} />
        <KpiCard label="Stock actual" value={stockActual} sub="Unidades activas" tone="ink" />
        <KpiCard label="Sin venta" value={noMov.length} sub="Sin rotación" tone={noMov.length ? "warn" : "ink"} />
      </div>

      <div className="nat-admin-2col" style={{ marginTop: 18 }}>
        <ACard>
          <h3 className="nat-rep-h">Más vendidos</h3>
          {top.length === 0 ? <Empty t="Aún no hay ventas registradas." /> : top.map((r, i) => <RankRow key={r.p.id} n={i + 1} name={r.p.name} val={r.units + " u."} />)}
        </ACard>
        <ACard>
          <h3 className="nat-rep-h">Menor rotación</h3>
          {low.map((r) => <RankRow key={r.p.id} name={r.p.name} val={r.units + " u."} muted />)}
        </ACard>
      </div>

      <ACard style={{ marginTop: 16 }}>
        <h3 className="nat-rep-h">Salidas por motivo</h3>
        {reasonRows.length === 0 ? <Empty t="Sin salidas registradas." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {reasonRows.map((r) => (
              <div key={r.l}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.l}</span>
                  <span style={{ color: "var(--ink)", opacity: 0.6 }}>{r.u} u.</span>
                </div>
                <div className="nat-bar"><div className="nat-bar-fill" style={{ width: (r.u / maxReason) * 100 + "%", background: r.l.startsWith("Venta") ? "var(--teal)" : "#9a7320" }} /></div>
              </div>
            ))}
          </div>
        )}
      </ACard>

      <ACard style={{ marginTop: 16 }}>
        <h3 className="nat-rep-h">Unidades vendidas por variante (producto · color · talla)</h3>
        {variantRows.length === 0 ? <Empty t="Sin ventas por variante todavía." /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="nat-rep-table">
              <thead><tr><th>Producto</th><th>Color</th><th>Talla</th><th style={{ textAlign: "right" }}>Vendidas</th></tr></thead>
              <tbody>
                {variantRows.map((r, i) => (
                  <tr key={i}><td>{r.n}</td><td>{r.c}</td><td>{r.s}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{r.u}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ACard>

      <div className="nat-admin-2col" style={{ marginTop: 16 }}>
        <ACard>
          <h3 className="nat-rep-h">Colores más vendidos</h3>
          {colorRows.length === 0 ? <Empty t="Registra color en las ventas para ver este dato." /> : colorRows.map((r) => <RankRow key={r.k} name={r.k} val={r.u + " u."} />)}
        </ACard>
        <ACard>
          <h3 className="nat-rep-h">Tallas más vendidas</h3>
          {sizeRows.length === 0 ? <Empty t="Registra talla en las ventas para ver este dato." /> : sizeRows.map((r) => <RankRow key={r.k} name={"Talla " + r.k} val={r.u + " u."} />)}
        </ACard>
      </div>

      <ACard style={{ marginTop: 16 }}>
        <h3 className="nat-rep-h">Sell-through por producto <span style={{ fontWeight: 500, fontSize: 12, opacity: 0.55 }}>· vendidas / (vendidas + stock)</span></h3>
        {top.length === 0 ? <Empty t="Sin ventas para calcular sell-through." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {ranked.filter((r) => r.units > 0).slice(0, 8).map((r) => {
              const st = sellThrough(r.units, r.p.stock);
              return (
                <div key={r.p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.p.name}</span>
                    <span style={{ color: "var(--ink)", opacity: 0.6 }}>{st}% · {r.units} vend.</span>
                  </div>
                  <div className="nat-bar"><div className="nat-bar-fill" style={{ width: st + "%" }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </ACard>

      <div className="nat-admin-2col" style={{ marginTop: 16 }}>
        <ACard>
          <h3 className="nat-rep-h">Stock bajo / agotado</h3>
          {lowStock.length === 0 ? <Empty t="Todo en orden ✦" /> : lowStock.map((p) => <RankRow key={p.id} name={p.name} val={p.stock + " u."} danger={p.soldOut} muted />)}
        </ACard>
        <ACard>
          <h3 className="nat-rep-h">Productos sin movimiento</h3>
          {noMov.length === 0 ? <Empty t="Todos han rotado ✦" /> : noMov.slice(0, 8).map((p) => <RankRow key={p.id} name={p.name} val="0 ventas" muted />)}
        </ACard>
      </div>
    </div>
  );
}
