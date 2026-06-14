import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImageSlot } from "../components/ImageSlot";
import { ProductCard } from "../components/ProductCard";
import { StockTag } from "../components/ProductCard";
import { AvailBadge, ColorChips, FeatStar, PriceBlock, SectionHead, Spinner } from "../components/ui";
import { Sparkle, Icon, ChevronLeft } from "../components/icons";
import { useCatalog } from "../store/CatalogContext";
import { useCart } from "../store/CartContext";
import { availableStock } from "../lib/effective";
import { waLinkProduct } from "../lib/wa";
import type { ChartRow } from "../lib/types";

function SizeTable({ chart }: { chart: ChartRow | undefined }) {
  if (!chart) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ margin: "0 0 9px", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, fontSize: 13.5, color: "var(--ink)" }}>{chart.title}</h4>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontFamily: "'Hanken Grotesk', sans-serif", border: "1px solid var(--ink)", borderRadius: 6, overflow: "hidden" }}>
        <thead>
          <tr>
            {chart.cols.map((c) => (
              <th key={c} style={{ background: "var(--ink)", color: "var(--paper)", fontWeight: 800, fontSize: 12.5, padding: "9px 10px", textAlign: c === "Talla" ? "center" : "left" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? "rgba(0,0,0,0.04)" : "transparent" }}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: "9px 10px", fontSize: 13, fontWeight: j === 0 ? 800 : 500, color: "var(--ink)", textAlign: j === 0 ? "center" : "left", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 9 }}>{children}</div>;
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { productById, publicProducts, categories, charts, config, loading } = useCatalog();
  const { addToCart } = useCart();

  const p = id ? productById(id) : undefined;

  const needColor = !!p && !p.noColors && p.effColors.length > 0;
  const needSize = !!p && !p.noSizes && p.effSizes.length > 0;

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [lb, setLb] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);
  const [qty, setQty] = useState(1);
  const [addMsg, setAddMsg] = useState<{ ok: boolean; t: string } | null>(null);

  useEffect(() => {
    if (!p) return;
    setColor(needColor ? p.effColors.find((c) => !c.blocked)?.name ?? null : null);
    setSize(needSize ? p.effSizes.find((s) => s.available)?.name ?? null : null);
    setActiveImg(p.principalImage);
    setWarn(false);
    setQty(1);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  useEffect(() => {
    if (!lb) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLb(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lb]);

  const related = useMemo(() => (p ? publicProducts.filter((x) => x.id !== p.id).slice(0, 4) : []), [p, publicProducts]);

  if (loading) return <Spinner />;
  if (!p) {
    return (
      <div className="nat-shell" style={{ padding: "40px 18px" }}>
        <p style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Producto no encontrado.</p>
        <button className="nat-btn-ghost" onClick={() => navigate("/catalogo")}>Volver al catálogo</button>
      </div>
    );
  }

  const estado = p.stock > 0 ? "Disponible" : p.backorderActive ? "Bajo pedido" : "Agotado";
  const sizeStock = size ? availableStock(p, size) : p.stock;
  const maxQty = p.backorderActive ? 99999 : sizeStock;
  const cat = categories.find((c) => c.id === p.category_id);
  const gallery = p.images;
  const waHref = waLinkProduct(config.wa, p, { color: color || "Único", size: size || "Única", estado });

  const addCart = () => {
    if ((needColor && !color) || (needSize && !size)) {
      setWarn(true);
      return;
    }
    const res = addToCart(p, needSize ? size ?? "" : "", needColor ? color ?? "" : "", qty);
    if (res.ok) {
      setAddMsg({ ok: true, t: "Agregado al carrito ✓" });
      setWarn(false);
      setTimeout(() => setAddMsg(null), 2000);
    } else {
      setAddMsg({ ok: false, t: res.error ?? "No se pudo agregar." });
    }
  };

  return (
    <div>
      <div className="nat-shell" style={{ padding: "14px 18px 0" }}>
        <button onClick={() => navigate("/catalogo")} className="nat-back">
          <ChevronLeft /> Catálogo
        </button>
      </div>

      <div className="nat-shell nat-detail" style={{ padding: "14px 18px 8px" }}>
        <div className="nat-detail-media">
          <div className="nat-detail-mainimg">
            <div className="nat-mainimg-bar" />
            {p.featured && <div style={{ position: "absolute", top: 16, right: 12, zIndex: 3 }}><FeatStar /></div>}
            <div style={{ position: "absolute", top: 16, left: 12, zIndex: 3 }}><StockTag p={p} /></div>
            <button className="nat-mainimg-stage" onClick={() => activeImg && setLb(activeImg)} title="Ampliar imagen">
              <ImageSlot url={activeImg} fit="contain" fill placeholder={p.name} />
              <span className="nat-zoomhint">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.4-3.4M11 8.4v5.2M8.4 11h5.2" /></svg>
                Ampliar
              </span>
            </button>
          </div>
          {gallery.length > 1 && (
            <div className="nat-thumbs">
              {gallery.map((g) => (
                <button key={g.id} onClick={() => setActiveImg(g.url)} className={"nat-thumb" + (activeImg === g.url ? " is-active" : "")}>
                  <ImageSlot url={g.url} ratio="1 / 1" placeholder={p.name} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="nat-detail-info">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--teal)" }}>{cat?.name ?? ""}</span>
            <AvailBadge availKey={p.avail} stock={p.stock} />
          </div>
          <h1 style={{ margin: "10px 0 5px", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1.12, letterSpacing: "-0.015em", textTransform: "uppercase", color: "var(--ink)" }}>{p.name}</h1>
          <p style={{ margin: "0 0 16px", fontFamily: "'Bodoni Moda', serif", fontStyle: "italic", fontSize: 16, color: "var(--ink)", opacity: 0.65 }}>{p.tagline}</p>

          <div style={{ marginBottom: 16 }}><PriceBlock p={p} big /></div>

          {needColor && (
            <div style={{ marginBottom: 18 }}>
              <Label>Color: <strong>{color || "elige una opción"}</strong></Label>
              <ColorChips colors={p.effColors} selectable selected={color} onSelect={(n) => { setColor(n); setWarn(false); }} size={30} />
            </div>
          )}

          {needSize && (
            <div style={{ marginBottom: 16 }}>
              <Label>Talla</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {p.effSizes.map((s) => {
                  const dis = s.blocked || (s.stock <= 0 && !p.backorderActive);
                  return (
                    <button
                      key={s.name}
                      onClick={() => { if (!dis) { setSize(s.name); setQty(1); setWarn(false); } }}
                      disabled={dis}
                      title={s.blocked ? s.reason || "No disponible" : s.stock <= 0 ? "Agotada" : ""}
                      className={"nat-size" + (size === s.name ? " is-active" : "") + (dis ? " is-dis" : "")}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {warn && (
            <div className="nat-stockhint is-out" style={{ marginBottom: 14 }}>
              Selecciona {needColor && !color ? "un color" : ""}
              {needColor && !color && needSize && !size ? " y " : ""}
              {needSize && !size ? "una talla" : ""} antes de agregar.
            </div>
          )}
          {addMsg && <div className={"nat-movemsg " + (addMsg.ok ? "ok" : "err")} style={{ marginBottom: 12 }}>{addMsg.t}</div>}

          <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 10 }}>
            <div className="nat-qty nat-qty--lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => (q >= maxQty ? q : q + 1))} disabled={qty >= maxQty} aria-label="Más">+</button>
            </div>
            <button className={"nat-btn-primary" + (p.soldOut && !p.backorderActive ? " is-off" : "")} style={{ flex: 1 }} onClick={addCart} disabled={p.soldOut && !p.backorderActive}>
              {p.soldOut && !p.backorderActive ? "Agotado" : "Agregar al carrito"}
            </button>
          </div>
          {!p.backorderActive && p.stock > 0 && (
            <p style={{ margin: "0 0 10px", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, color: "var(--ink)", opacity: 0.55, textAlign: "center" }}>
              {size ? sizeStock + " unidades en talla " + size : p.stock + " unidades disponibles en stock"}
            </p>
          )}
          {config.wa.enabled && (
            <a href={waHref} target="_blank" rel="noreferrer" className="nat-btn-wa-sec">
              {Icon.whatsapp(false)} Consultar por WhatsApp
            </a>
          )}
          <p style={{ margin: "10px 0 0", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, color: "var(--ink)", opacity: 0.55, textAlign: "center" }}>
            {config.wa.replyNote} {config.wa.hours}.
          </p>

          {p.bullets.length > 0 && (
            <ul style={{ listStyle: "none", margin: "24px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {p.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14.5, lineHeight: 1.45, color: "var(--ink)" }}>
                  <Sparkle size={12} color="var(--teal)" style={{ marginTop: 4, flex: "none" }} /><span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {p.charts && p.charts.length > 0 && !p.noSizes && (
        <section className="nat-shell" style={{ padding: "26px 18px 8px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "22px 20px" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <Sparkle size={14} color="var(--teal)" />
              <h2 style={{ margin: "6px 0 0", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--ink)" }}>Tabla de medidas</h2>
              <p style={{ margin: "4px 0 0", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12.5, color: "var(--ink)", opacity: 0.6 }}>Medidas en centímetros</p>
            </div>
            <div className="nat-tables">
              {p.charts.map((c) => <SizeTable key={c} chart={charts[c]} />)}
            </div>
          </div>
        </section>
      )}

      <section className="nat-shell" style={{ padding: "22px 18px 8px" }}>
        <SectionHead kicker="También" title="Te puede gustar" />
        <div className="nat-grid" style={{ marginTop: 16 }}>
          {related.map((r) => (
            <ProductCard key={r.id} p={r} onOpen={() => navigate("/producto/" + r.id)} />
          ))}
          {related.length === 0 && <p style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: "var(--ink)", opacity: 0.6 }}>Pronto más modelos.</p>}
        </div>
      </section>

      {lb && (
        <div className="nat-lightbox" onClick={() => setLb(null)}>
          <button className="nat-lightbox-close" onClick={() => setLb(null)} aria-label="Cerrar">✕</button>
          <img src={lb} alt={p.name} className="nat-lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
