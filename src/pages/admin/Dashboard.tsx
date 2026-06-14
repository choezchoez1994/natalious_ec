import { ACard, ASectionTitle } from "../../components/form";
import { Sparkle } from "../../components/icons";
import { Spinner } from "../../components/ui";
import { useCatalog } from "../../store/CatalogContext";
import { computeMetrics } from "../../lib/metrics";
import { money } from "../../lib/format";

export function KpiCard({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="nat-kpi" data-tone={tone || "ink"}>
      <div className="nat-kpi-val">{value}</div>
      <div className="nat-kpi-label">{label}</div>
      {sub && <div className="nat-kpi-sub">{sub}</div>}
    </div>
  );
}

export function Dashboard({ onGoTab }: { onGoTab: (t: any) => void }) {
  const { products, categories, loading } = useCatalog();
  if (loading) return <Spinner />;
  const m = computeMetrics(products);

  const seen: Record<string, boolean> = {};
  const alerts = [...m.out, ...m.low]
    .filter((p) => (seen[p.id] ? false : (seen[p.id] = true)))
    .sort((a, b) => a.stock - b.stock);

  const cats = categories.map((c) => ({
    ...c,
    units: products.filter((p) => p.category_id === c.id).reduce((x, p) => x + p.stock, 0),
  }));
  const maxUnits = Math.max(1, ...cats.map((c) => c.units));

  return (
    <div>
      <ASectionTitle kicker="Panel" title="Resumen de inventario" right={<button className="nat-btn-primary" style={{ padding: "10px 18px" }} onClick={() => onGoTab("inventory")}>Ir a inventario</button>} />

      <div className="nat-kpi-grid nat-kpi-6">
        <KpiCard label="Productos" value={m.total} sub={m.featured + " destacados"} tone="ink" />
        <KpiCard label="Activos" value={m.active} sub={m.inactive ? m.inactive + " inactivos" : "Todos activos"} tone="teal" />
        <KpiCard label="Agotados" value={m.outCount} sub={m.outCount ? "Sin stock" : "Ninguno"} tone={m.outCount ? "danger" : "ink"} />
        <KpiCard label="Stock bajo" value={m.lowCount} sub={m.lowCount ? "Requiere reposición" : "Sin alertas"} tone={m.lowCount ? "warn" : "ink"} />
        <KpiCard label="Stock total" value={m.units} sub={money(m.value) + " en inventario"} tone="teal" />
        <KpiCard label="Bloqueados" value={m.blockedSizes + m.blockedColors} sub={m.blockedSizes + " tallas · " + m.blockedColors + " colores"} tone={m.blockedSizes + m.blockedColors ? "warn" : "ink"} />
      </div>

      <div className="nat-admin-2col" style={{ marginTop: 18 }}>
        <ACard>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: "var(--ink)", whiteSpace: "nowrap" }}>Alertas de stock</h3>
            {alerts.length > 0 && <span className="nat-count-pill">{alerts.length}</span>}
          </div>
          {alerts.length === 0 ? (
            <div className="nat-empty" style={{ padding: "26px 10px" }}>
              <div className="nat-empty-mark"><Sparkle size={20} color="var(--teal)" /></div>
              <h4 style={{ margin: "12px 0 3px", fontFamily: "'Bodoni Moda',serif", fontStyle: "italic", fontSize: 18, color: "var(--ink)" }}>Todo en orden</h4>
              <p style={{ margin: 0, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6 }}>No hay productos por reponer. ✦</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.map((p) => (
                <div key={p.id} className="nat-alert-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: p.soldOut ? "#9a3b32" : "#9a7320", fontWeight: 600 }}>
                      {p.soldOut ? "Agotado · 0 u." : "Quedan " + p.stock + " u. (mín. " + p.min_stock + ")"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "none" }}>
                    <button className="nat-mini" onClick={() => onGoTab("movements")}>Reponer</button>
                    <button className="nat-mini is-ghost" onClick={() => onGoTab("inventory")}>Inventario</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ACard>

        <ACard>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>Unidades por categoría</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cats.map((c) => (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{c.name}</span>
                  <span style={{ color: "var(--ink)", opacity: 0.6, whiteSpace: "nowrap", flex: "none" }}>{c.units} u.</span>
                </div>
                <div className="nat-bar"><div className="nat-bar-fill" style={{ width: (c.units / maxUnits) * 100 + "%" }} /></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Valor del inventario</span>
            <span style={{ fontFamily: "'Bodoni Moda',serif", fontWeight: 700, fontSize: 24, color: "var(--teal)" }}>{money(m.value)}</span>
          </div>
        </ACard>
      </div>
    </div>
  );
}
