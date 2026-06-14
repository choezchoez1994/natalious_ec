import { Sparkle } from "./icons";
import { ImageSlot } from "./ImageSlot";
import { ColorChips } from "./ui";
import { money } from "../lib/format";
import { AVAIL } from "../lib/types";
import type { EffectiveProduct } from "../lib/types";

export function ImgTag({ p }: { p: EffectiveProduct }) {
  let tag: { t: string; cls: string } | null = null;
  if (p.hasPromo) tag = { t: "Oferta", cls: "promo" };
  else if (p.soldOut) tag = { t: "Agotado", cls: "out" };
  else if (p.avail === "pedido") tag = { t: "Bajo pedido", cls: "pedido" };
  else if (p.lowStock) tag = { t: "Últimas " + p.stock, cls: "low" };
  if (!tag) return null;
  return <span className={"nat-imgtag is-" + tag.cls}>{tag.t}</span>;
}

export function StockTag({ p }: { p: EffectiveProduct }) {
  const tags: { t: string; bg: string; fg: string; pulse?: boolean }[] = [];
  if (p.hasPromo) tags.push({ t: "Oferta", bg: "var(--ink)", fg: "#fff" });
  if (p.soldOut) tags.push({ t: "Agotado", bg: "rgba(154,59,50,0.92)", fg: "#fff" });
  else if (p.avail === "pedido") tags.push({ t: "Bajo pedido", bg: "#5a7d8a", fg: "#fff" });
  else if (p.lowStock) tags.push({ t: "Últimas " + p.stock, bg: "rgba(184,134,47,0.95)", fg: "#fff", pulse: true });
  if (!tags.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
      {tags.map((tg, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999, background: tg.bg, color: tg.fg, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.03em" }}>
          {tg.pulse && <span className="nat-pulse" />} {tg.t}
        </span>
      ))}
    </div>
  );
}

function AvailMini({ p }: { p: EffectiveProduct }) {
  const a = AVAIL[p.avail] || AVAIL.stock;
  const label = p.avail === "pocas" ? "Pocas" : a.label;
  return (
    <span className="nat-availmini">
      <span className="nat-availmini-dot" style={{ background: a.dot }} />
      {label}
    </span>
  );
}

export function ProductCard({ p, onOpen }: { p: EffectiveProduct; onOpen: () => void }) {
  return (
    <article onClick={onOpen} className="nat-pcard">
      <div className="nat-pcard-media">
        <span className="nat-pcard-teal" />
        <div className="nat-pcard-img" style={{ filter: p.soldOut ? "grayscale(0.5) opacity(0.86)" : "none" }}>
          <ImageSlot url={p.principalImage} fill placeholder={p.name} />
        </div>
        <ImgTag p={p} />
        {p.featured && (
          <span className="nat-pcard-feat">
            <Sparkle size={11} color="var(--teal)" />
          </span>
        )}
        {p.sizeTag && <span className="nat-sizechip">{p.sizeTag}</span>}
      </div>
      <div className="nat-pcard-body">
        <h3 className="nat-pcard-name">{p.name}</h3>
        {p.tagline && <p className="nat-pcard-desc">{p.tagline}</p>}
        <div className="nat-pcard-price">
          <span className={"nat-price-now" + (p.hasPromo ? " is-promo" : "")}>
            {money(p.hasPromo && p.promoVal != null ? p.promoVal : p.retail)}
          </span>
          {p.hasPromo && <span className="nat-price-old">{money(p.retail)}</span>}
          {p.mayorVal != null && <span className="nat-price-mayor">Mayor {money(p.mayorVal)}</span>}
        </div>
        <div className="nat-pcard-foot">
          <ColorChips colors={p.effColors} size={15} max={4} />
          <AvailMini p={p} />
        </div>
      </div>
    </article>
  );
}
