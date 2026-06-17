import { useMemo, useState } from "react";
import { ASectionTitle, PriceField } from "../../components/form";
import { Spinner } from "../../components/ui";
import { useCatalog } from "../../store/CatalogContext";
import { setCantonEnvio, setParroquiaEnvio } from "../../services/geo";

export function ShippingZones() {
  const { catalogs, loading, reload } = useCatalog();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const provById = useMemo(() => {
    const m: Record<string, string> = {};
    catalogs.provincias.forEach((p) => (m[p.codigo] = p.nombre));
    return m;
  }, [catalogs.provincias]);

  if (loading) return <Spinner />;

  const term = q.trim().toLowerCase();
  const cantones = catalogs.cantones
    .filter((c) => !term || c.nombre.toLowerCase().includes(term) || (provById[c.provincia_cod] ?? "").toLowerCase().includes(term))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div>
      <ASectionTitle kicker="Configuración" title="Zonas de envío" />
      <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)", opacity: 0.6, margin: "-6px 0 16px" }}>
        Costo de envío por cantón (Servientrega). Si una parroquia tiene un valor mayor a 0, ese
        prevalece sobre el del cantón. Guayaquil y la entrega local quedan en $0.
      </p>

      <div className="nat-search" style={{ marginBottom: 14 }}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cantón o provincia…" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cantones.map((c) => {
          const parroquias = catalogs.parroquias
            .filter((p) => p.canton_cod === c.codigo)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
          const isOpen = open === c.codigo;
          return (
            <div key={c.codigo} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{c.nombre}</div>
                  <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.55 }}>{provById[c.provincia_cod] ?? ""} · {parroquias.length} parroquias</div>
                </div>
                <div style={{ width: 120, flex: "none" }}>
                  <PriceField value={c.valor_envio} onCommit={async (v) => { await setCantonEnvio(c.codigo, v ?? 0); await reload(); }} />
                </div>
                <button className="nat-mini" style={{ flex: "none" }} onClick={() => setOpen(isOpen ? null : c.codigo)}>
                  {isOpen ? "Ocultar" : "Parroquias"}
                </button>
              </div>
              {isOpen && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 7 }}>
                  {parroquias.map((p) => (
                    <div key={p.codigo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, color: "var(--ink)" }}>{p.nombre}</span>
                      <div style={{ width: 120, flex: "none" }}>
                        <PriceField value={p.valor_envio} placeholder="Hereda cantón" onCommit={async (v) => { await setParroquiaEnvio(p.codigo, v ?? 0); await reload(); }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {cantones.length === 0 && <p className="nat-editor-sub">Sin resultados para “{q}”.</p>}
      </div>
    </div>
  );
}
