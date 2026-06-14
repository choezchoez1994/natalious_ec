import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkle, Icon } from "./icons";
import { ImageSlot } from "./ImageSlot";
import { Wordmark } from "./ui";
import { useCatalog } from "../store/CatalogContext";
import { today } from "../lib/format";
import type { Slide } from "../lib/types";

export function HeroCarousel() {
  const { slides, config } = useCatalog();
  const navigate = useNavigate();
  const t = today();
  const active = slides
    .filter((s) => s.active && (!s.start_date || s.start_date <= t) && (!s.end_date || s.end_date >= t))
    .sort((a, b) => a.sort - b.sort);
  const n = active.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    if (i >= n) setI(0);
  }, [n, i]);
  useEffect(() => {
    if (n <= 1 || paused || !config.carousel.autoplay) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), Math.max(2, config.carousel.intervalSec || 5) * 1000);
    return () => clearInterval(id);
  }, [n, paused, config.carousel.autoplay, config.carousel.intervalSec]);

  if (n === 0) {
    return (
      <div className="nat-carousel nat-carousel--empty">
        <div className="nat-slide-fallback"><span aria-hidden="true">✦</span></div>
        <div className="nat-slide-content"><Wordmark size={40} light withTagline /></div>
      </div>
    );
  }

  const go1 = (d: number) => setI((x) => (x + d + n) % n);

  function slideHref(s: Slide): string | null {
    if (s.link_type === "whatsapp") {
      const msg = config.wa.greeting + " " + (s.link_value || "Me interesa: " + s.title);
      return "https://wa.me/" + config.wa.number.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
    }
    if (s.link_type === "url" && s.link_value) return s.link_value;
    return null;
  }
  function onCta(s: Slide) {
    if (s.link_type === "producto" && s.link_value) navigate("/producto/" + s.link_value);
    else if (s.link_type === "categoria" && s.link_value) navigate("/catalogo/" + s.link_value);
    else if (s.link_type === "cart") navigate("/carrito");
  }

  return (
    <div
      className="nat-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go1(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
      role="region"
      aria-label="Carrusel principal"
    >
      <div className="nat-carousel-track" style={{ transform: "translateX(" + -i * 100 + "%)" }}>
        {active.map((s, idx) => {
          const href = slideHref(s);
          return (
            <div className="nat-slide" key={s.id} aria-hidden={idx !== i}>
              {s.image_url ? <img src={s.image_url} alt="" className="nat-slide-img" /> : <div className="nat-slide-fallback"><span aria-hidden="true">✦</span></div>}
              <div className="nat-slide-scrim" />
              <div className="nat-slide-content">
                <div className="nat-slide-kicker"><Sparkle size={12} color="#fff" /> natalious</div>
                <h2 className="nat-slide-title">{s.title}</h2>
                {s.subtitle && <p className="nat-slide-sub">{s.subtitle}</p>}
                {s.cta_label && s.link_type !== "none" && (
                  href ? (
                    <a className="nat-slide-cta" href={href} target="_blank" rel="noreferrer">{Icon.whatsapp(false)} {s.cta_label}</a>
                  ) : (
                    <button className="nat-slide-cta" onClick={() => onCta(s)}>{s.cta_label} <span style={{ marginLeft: 4 }}>→</span></button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button className="nat-carousel-arrow nat-carousel-arrow--prev" onClick={() => go1(-1)} aria-label="Slide anterior">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button className="nat-carousel-arrow nat-carousel-arrow--next" onClick={() => go1(1)} aria-label="Siguiente slide">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="nat-carousel-dots">
            {active.map((s, idx) => (
              <button key={s.id} className={"nat-dot" + (idx === i ? " is-active" : "")} onClick={() => setI(idx)} aria-label={"Ir a la diapositiva " + (idx + 1)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function perViewCats(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 1024;
  if (w >= 1180) return 4;
  if (w >= 900) return 3;
  if (w >= 560) return 2;
  return 1;
}

export function CategoryCarousel() {
  const { categories, config, publicProducts } = useCatalog();
  const navigate = useNavigate();
  const cats = [...categories].filter((c) => c.active && c.show_in_carousel).sort((a, b) => a.sort - b.sort);
  const [pv, setPv] = useState(perViewCats());
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const gap = 16;
  const maxIdx = Math.max(0, cats.length - pv);

  useEffect(() => {
    const r = () => setPv(perViewCats());
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);
  useEffect(() => {
    if (idx > maxIdx) setIdx(maxIdx);
  }, [pv, idx, maxIdx]);
  useEffect(() => {
    if (!config.carousel.autoplay || paused || cats.length <= pv) return;
    const t = setInterval(() => setIdx((x) => (x >= maxIdx ? 0 : x + 1)), Math.max(2, config.carousel.intervalSec || 5) * 1000);
    return () => clearInterval(t);
  }, [idx, paused, pv, maxIdx, cats.length, config.carousel.autoplay, config.carousel.intervalSec]);

  const go1 = (d: number) => setIdx((x) => {
    const ni = x + d;
    if (ni < 0) return maxIdx;
    if (ni > maxIdx) return 0;
    return ni;
  });

  const trackStyle = { display: "flex", gap: gap + "px", transition: "transform .5s cubic-bezier(.4,0,.2,1)", transform: "translateX(calc(-" + idx + " * (100% + " + gap + "px) / " + pv + "))" };
  const itemStyle = { flex: "0 0 calc((100% - " + gap * (pv - 1) + "px) / " + pv + ")" };
  const pages = maxIdx + 1;

  return (
    <div
      className="nat-catcar-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go1(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
      role="region"
      aria-label="Carrusel de categorías"
    >
      <div className="nat-catcar">
        <div className="nat-catcar-track" style={trackStyle}>
          {cats.map((c) => {
            const items = publicProducts.filter((p) => p.category_id === c.id);
            const cover = c.image_url ?? items[0]?.principalImage ?? null;
            return (
              <button key={c.id} className="nat-catcar-item nat-card" style={{ ...itemStyle, position: "relative", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "var(--ink)", padding: 0, textAlign: "left", color: "var(--paper)" }} onClick={() => navigate("/catalogo/" + c.id)}>
                <div style={{ position: "absolute", inset: 0 }}>
                  <ImageSlot url={cover} fill placeholder={c.name} />
                </div>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 7, background: "var(--teal)", zIndex: 2 }} />
                <div style={{ position: "relative", zIndex: 2, marginTop: "auto", padding: "44px 16px 16px", background: "linear-gradient(to top, rgba(12,12,10,0.9), rgba(12,12,10,0) 100%)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkle size={11} color="var(--paper)" />
                    <span style={{ fontFamily: "'Bodoni Moda', serif", fontStyle: "italic", fontSize: 12, opacity: 0.85 }}>{c.tagline}</span>
                  </div>
                  <h3 style={{ margin: "4px 0 2px", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 800, fontSize: 21, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{c.name}</h3>
                  <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, opacity: 0.8 }}>{items.length} {items.length === 1 ? "modelo" : "modelos"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {pages > 1 && (
        <>
          <button className="nat-catcar-arrow nat-catcar-arrow--prev" onClick={() => go1(-1)} aria-label="Anterior">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button className="nat-catcar-arrow nat-catcar-arrow--next" onClick={() => go1(1)} aria-label="Siguiente">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="nat-catcar-dots">
            {Array.from({ length: pages }).map((_, p) => (
              <button key={p} className={"nat-dot" + (p === idx ? " is-active" : "")} onClick={() => setIdx(p)} aria-label={"Página " + (p + 1)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
