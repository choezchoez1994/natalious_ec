import type { CSSProperties, ReactNode } from "react";
import { Sparkle } from "./icons";
import { money } from "../lib/format";
import { AVAIL } from "../lib/types";
import type { AvailKey, EffectiveProduct } from "../lib/types";

/* Logotipo natalious */
export function Wordmark({
  size = 30,
  light = false,
  withTagline = false,
  align = "center",
}: {
  size?: number;
  light?: boolean;
  withTagline?: boolean;
  align?: "center" | "left";
}) {
  const ink = light ? "var(--paper)" : "var(--ink)";
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center", gap: size * 0.18, lineHeight: 1 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.22 }}>
        <Sparkle size={size * 0.42} color={ink} style={{ transform: "translateY(-0.5em)" }} />
        <span style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: size, color: ink, letterSpacing: "-0.01em" }}>
          natalious
        </span>
        <Sparkle size={size * 0.5} color={ink} style={{ transform: "translateY(0.55em)" }} />
      </span>
      {withTagline && (
        <span style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontStyle: "italic", fontSize: size * 0.34, color: ink, opacity: 0.85 }}>
          Fuerte, bella y auténtica
        </span>
      )}
    </span>
  );
}

export function FeatStar() {
  return (
    <span title="Destacado" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: "var(--paper)", border: "1px solid var(--line)", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
      <Sparkle size={13} color="var(--teal)" />
    </span>
  );
}

export function AvailBadge({ availKey, stock = null }: { availKey: AvailKey; stock?: number | null }) {
  const a = AVAIL[availKey] || AVAIL.stock;
  let label = a.label;
  if (availKey === "pocas" && stock != null) label = "Quedan " + stock;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, background: availKey === "agotado" ? "rgba(154,59,50,0.12)" : "rgba(255,255,255,0.62)", border: "1px solid " + (availKey === "agotado" ? "rgba(154,59,50,0.3)" : "rgba(0,0,0,0.10)"), fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: availKey === "agotado" ? "#8a352d" : "var(--ink)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: a.dot }} />
      {label}
    </span>
  );
}

export function ColorChips({
  colors,
  selectable = false,
  selected,
  onSelect,
  size = 22,
  max,
}: {
  colors: { name: string; hex: string; soldOut: boolean }[];
  selectable?: boolean;
  selected?: string | null;
  onSelect?: (name: string) => void;
  size?: number;
  max?: number;
}) {
  const list = max ? colors.slice(0, max) : colors;
  const rest = max ? colors.length - max : 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
      {list.map((c, i) => {
        const isSel = selectable && selected === c.name;
        return (
          <button
            key={c.name + i}
            type="button"
            title={c.soldOut ? c.name + " · agotado" : c.name}
            disabled={c.soldOut}
            onClick={() => selectable && !c.soldOut && onSelect && onSelect(c.name)}
            style={{
              position: "relative", width: size, height: size, borderRadius: 999,
              background: c.hex, cursor: c.soldOut ? "not-allowed" : selectable ? "pointer" : "default",
              border: isSel ? "2px solid var(--ink)" : "1px solid rgba(0,0,0,0.18)",
              boxShadow: isSel ? "0 0 0 2px var(--paper), 0 0 0 3px var(--ink)" : "inset 0 0 0 1px rgba(255,255,255,0.15)",
              padding: 0, opacity: c.soldOut ? 0.55 : 1, flex: "none",
            }}
          >
            {c.soldOut && (
              <svg viewBox="0 0 24 24" style={{ position: "absolute", inset: -1, width: size + 2, height: size + 2 }}>
                <circle cx="12" cy="12" r="11" fill="rgba(154,59,50,0.92)" />
                <path d="M8 8 L16 16 M16 8 L8 16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        );
      })}
      {rest > 0 && (
        <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11.5, fontWeight: 600, color: "var(--ink)", opacity: 0.6 }}>+{rest}</span>
      )}
    </div>
  );
}

export function PriceBlock({ p, big = false }: { p: EffectiveProduct; big?: boolean }) {
  const main = p.hasPromo && p.promoVal != null ? p.promoVal : p.retail;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontWeight: 700, fontSize: big ? 40 : 22, color: p.hasPromo ? "#9a3b32" : "var(--ink)", lineHeight: 1 }}>{money(main)}</span>
        {p.hasPromo && (
          <span style={{ fontFamily: "'Bodoni Moda', serif", fontWeight: 600, fontSize: big ? 20 : 14, color: "var(--ink)", opacity: 0.5, textDecoration: "line-through" }}>{money(p.retail)}</span>
        )}
      </span>
      {p.mayorVal != null && (
        <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: big ? 14 : 11.5, color: "var(--teal)" }}>Al por mayor: {money(p.mayorVal)}</span>
      )}
    </div>
  );
}

export function SectionHead({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--teal)" }}>
          <Sparkle size={12} />
          <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>{kicker}</span>
        </div>
        <h2 style={{ margin: "5px 0 0", fontFamily: "'Bodoni Moda', serif", fontWeight: 600, fontSize: 28, letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="nat-empty">
      <div className="nat-empty-mark"><Sparkle size={22} color="var(--teal)" /></div>
      <h3 style={{ margin: "14px 0 4px", fontFamily: "'Bodoni Moda', serif", fontStyle: "italic", fontWeight: 600, fontSize: 21, color: "var(--ink)" }}>{title}</h3>
      <p style={{ margin: 0, fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 14, color: "var(--ink)", opacity: 0.62, maxWidth: 320 }}>{body}</p>
      {action && <button onClick={onAction} className="nat-btn-ghost" style={{ marginTop: 16 }}>{action}</button>}
    </div>
  );
}

export function Spinner({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, ...style }}>
      <div className="nat-spinner" />
    </div>
  );
}
