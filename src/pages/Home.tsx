import { Link, useNavigate } from "react-router-dom";
import { HeroCarousel } from "../components/Carousels";
import { ProductCard } from "../components/ProductCard";
import { SectionHead, Spinner } from "../components/ui";
import { Sparkle, BenefitIcon } from "../components/icons";
import { useCatalog } from "../store/CatalogContext";

function TrustBar() {
  const items = ["Envíos a todo Ecuador", "Pago contra entrega", "Atención por WhatsApp", "Precio al por mayor"];
  return (
    <div className="nat-trustbar">
      {items.map((t, i) => (
        <span key={i} className="nat-trust-item">
          <Sparkle size={10} color="var(--teal)" /> {t}
        </span>
      ))}
    </div>
  );
}

export function Home() {
  const { publicProducts, categories, loading } = useCatalog();
  const navigate = useNavigate();
  if (loading) return <Spinner />;

  const feat = publicProducts.filter((p) => p.featured);
  const destacados = (feat.length ? feat : publicProducts).slice(0, 3);

  const benefits = [
    { ic: "truck", t: "Envíos a todo Ecuador", s: "Coordinamos tu entrega" },
    { ic: "ruler", t: "Asesoría de tallas", s: "Te ayudamos a elegir" },
    { ic: "chat", t: "Atención por WhatsApp", s: "Respuesta rápida" },
    { ic: "spark", t: "Nuevas colecciones", s: "Catálogo actualizado" },
  ];

  return (
    <div>
      <section style={{ background: "var(--bg)" }}>
        <div className="nat-carousel-wrap">
          <HeroCarousel />
        </div>
        <div style={{ height: 18 }} />
        <TrustBar />
      </section>

      <section className="nat-shell" style={{ padding: "34px 18px 8px" }}>
        <SectionHead
          kicker="Selección"
          title="Destacados"
          right={<Link to="/catalogo" className="nat-link" style={{ textDecoration: "none" }}>Ver todo →</Link>}
        />
        <div className="nat-grid" style={{ marginTop: 18 }}>
          {destacados.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={() => navigate("/producto/" + p.id)} />
          ))}
        </div>
      </section>

      <section className="nat-shell" style={{ padding: "30px 18px 10px" }}>
        <SectionHead kicker="Explora" title="Por categoría" />
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 16 }}>
          {categories.filter((c) => c.active).map((c) => (
            <button key={c.id} onClick={() => navigate("/catalogo/" + c.id)} className="nat-chip">{c.name}</button>
          ))}
        </div>
      </section>

      <section className="nat-shell" style={{ padding: "8px 18px 34px" }}>
        <div className="nat-benefits">
          {benefits.map((b, i) => (
            <div key={i} className="nat-benefit">
              <span className="nat-benefit-ic">{BenefitIcon[b.ic]}</span>
              <div style={{ minWidth: 0 }}>
                <div className="nat-benefit-t">{b.t}</div>
                <div className="nat-benefit-s">{b.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
