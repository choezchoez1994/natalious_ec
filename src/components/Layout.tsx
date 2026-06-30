import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon } from "./icons";
import { Wordmark } from "./ui";
import { useCart } from "../store/CartContext";
import { useCatalog } from "../store/CatalogContext";
import { waLinkGeneral } from "../lib/wa";
import { fmtPhone } from "../lib/format";

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio", to: "/" },
  { id: "catalogo", label: "Catálogo", to: "/catalogo" },
  { id: "categorias", label: "Categorías", to: "/categorias" },
  { id: "carrito", label: "Carrito", to: "/carrito" },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  if (to === "/catalogo") return pathname.startsWith("/catalogo") || pathname.startsWith("/producto");
  return pathname.startsWith(to);
}

function TopBar() {
  const { count } = useCart();
  const { pathname } = useLocation();
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--plum)", color: "var(--paper)" }}>
      <div className="nat-shell" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, padding: "0 18px" }}>
        <Link to="/" style={{ display: "flex" }}>
          <Wordmark size={22} light />
        </Link>
        <nav className="nat-topnav" style={{ gap: 4 }}>
          {NAV_ITEMS.map((it) => {
            const active = isActive(pathname, it.to);
            if (it.id === "carrito") {
              return (
                <Link key={it.id} to={it.to} style={{ display: "inline-flex", alignItems: "center", gap: 7, position: "relative", color: "var(--paper)", padding: "8px 15px", borderRadius: 999, background: active ? "var(--paper)" : "rgba(255,255,255,0.16)", textDecoration: "none", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5 }}>
                  <span style={{ color: active ? "var(--plum)" : "var(--paper)", display: "inline-flex", alignItems: "center", gap: 7 }}>{Icon.carrito(false)} Carrito</span>
                  {count > 0 && <span className="nat-cart-badge">{count}</span>}
                </Link>
              );
            }
            return (
              <NavLink key={it.id} to={it.to} style={{ color: "var(--paper)", opacity: active ? 1 : 0.72, padding: "8px 13px", fontWeight: active ? 700 : 500, fontSize: 13.5, borderBottom: active ? "2px solid var(--paper)" : "2px solid transparent", fontFamily: "'Hanken Grotesk', sans-serif", textDecoration: "none" }}>
                {it.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function BottomNav() {
  const { count } = useCart();
  const { pathname } = useLocation();
  return (
    <nav className="nat-bottomnav" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, background: "var(--paper)", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-around", alignItems: "stretch", paddingBottom: "env(safe-area-inset-bottom, 0px)", boxShadow: "0 -6px 24px rgba(0,0,0,0.06)" }}>
      {NAV_ITEMS.map((it) => {
        const active = isActive(pathname, it.to);
        const common = { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 3, padding: "9px 4px 8px", fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 10.5, fontWeight: active ? 700 : 500, textDecoration: "none", color: active ? "var(--teal)" : "rgba(31,23,32,0.55)" };
        const iconKey = it.id as "inicio" | "catalogo" | "categorias" | "carrito";
        return (
          <Link key={it.id} to={it.to} style={common}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              {Icon[iconKey](active)}
              {it.id === "carrito" && count > 0 && <span className="nat-cart-badge nat-cart-badge--sm">{count}</span>}
            </span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  const { config, categories } = useCatalog();
  const ig = (config.social.handleIg || "@natalious.ec").replace("@", "");
  const tk = (config.social.handleTk || "@natalious.ec").replace("@", "");
  return (
    <footer className="nat-footer">
      <div className="nat-shell nat-footer-inner">
        <div className="nat-footer-brand">
          <Wordmark size={34} light align="left" />
          <p style={{ margin: "16px 0 0", maxWidth: 280, fontFamily: "'Bodoni Moda', serif", fontStyle: "italic", fontSize: 16, color: "var(--paper)", opacity: 0.82, lineHeight: 1.5 }}>
            Fuerte, bella y auténtica. Ropa en tendencia - Envíos seguro.
          </p>
          {config.wa.enabled && (
            <a href={waLinkGeneral(config.wa)} target="_blank" rel="noreferrer" className="nat-btn-wa nat-btn-wa--footer" style={{ marginTop: 22 }}>
              {Icon.whatsapp(false)} Escríbenos por WhatsApp
            </a>
          )}
        </div>
        <div className="nat-footer-cols">
          <div className="nat-footer-col">
            <h4 className="nat-footer-h">Tienda</h4>
            <Link className="nat-footer-meta nat-footlink" to="/" style={{ textDecoration: "none" }}>Inicio</Link>
            <Link className="nat-footer-meta nat-footlink" to="/catalogo" style={{ textDecoration: "none" }}>Catálogo</Link>
            <Link className="nat-footer-meta nat-footlink" to="/categorias" style={{ textDecoration: "none" }}>Categorías</Link>
            {categories.slice(0, 2).map((c) => (
              <Link key={c.id} className="nat-footer-meta nat-footlink" to={"/catalogo/" + c.id} style={{ textDecoration: "none" }}>{c.name}</Link>
            ))}
          </div>
          <div className="nat-footer-col">
            <h4 className="nat-footer-h">Contacto</h4>
            <a className="nat-footer-meta nat-footlink" href={waLinkGeneral(config.wa)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{fmtPhone(config.wa.number)}</a>
            <span className="nat-footer-meta">{config.wa.hours}</span>
          </div>
          <div className="nat-footer-col">
            <h4 className="nat-footer-h">Síguenos</h4>
            <a className="nat-footer-meta nat-footlink" href={"https://instagram.com/" + ig} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>Instagram · {config.social.handleIg}</a>
            <a className="nat-footer-meta nat-footlink" href={"https://tiktok.com/@" + tk} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>TikTok · {config.social.handleTk}</a>
          </div>
        </div>
      </div>
      <div className="nat-shell nat-footer-bottom">
        <span>© {new Date().getFullYear()} natalious</span>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <>
      <TopBar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
