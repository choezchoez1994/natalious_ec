import type {
  AvailKey,
  EffectiveColor,
  EffectiveProduct,
  EffectiveSize,
  RawProduct,
} from "./types";

/**
 * Calcula el producto "efectivo" a partir de los datos crudos.
 * Reglas de inventario (stock por talla):
 *  - El stock total es la suma del stock de cada talla (o stock_general si no hay tallas).
 *  - Una talla está disponible si NO está bloqueada y su stock > 0.
 *  - Si una talla llega a 0, queda agotada.
 *  - Si todas las tallas llegan a 0, el producto queda agotado.
 *  - Los colores son visuales: nunca controlan stock.
 */
export function effective(p: RawProduct): EffectiveProduct {
  const sizesSorted = [...(p.sizes || [])].sort((a, b) => a.sort - b.sort);
  const colorsSorted = [...(p.colors || [])].sort((a, b) => a.sort - b.sort);

  const noSizes = sizesSorted.length === 0;
  const noColors = colorsSorted.length === 0;

  const stock = noSizes
    ? Math.max(0, p.stock_general || 0)
    : sizesSorted.reduce((s, z) => s + Math.max(0, z.stock || 0), 0);

  const backorderLike = p.backorder || p.state === "bajo pedido";

  let avail: AvailKey;
  if (p.state === "inactivo" || p.state === "agotado") avail = "agotado";
  else if (backorderLike && stock <= 0) avail = "pedido";
  else if (stock <= 0) avail = "agotado";
  else if (stock <= (p.min_stock || 0)) avail = "pocas";
  else avail = "stock";

  const effSizes: EffectiveSize[] = sizesSorted.map((s) => ({
    name: s.name,
    stock: Math.max(0, s.stock || 0),
    blocked: !!s.blocked,
    reason: s.reason || "",
    available: !s.blocked && (s.stock || 0) > 0,
  }));

  const effColors: EffectiveColor[] = colorsSorted.map((c) => ({
    name: c.name,
    hex: c.hex,
    blocked: !!c.blocked,
    reason: c.reason || "",
    soldOut: !!c.blocked,
  }));

  const firstSize =
    (effSizes.find((s) => s.available) || effSizes[0])?.name ?? null;

  const bullets = (p.long_desc || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const images = [...(p.images || [])].sort((a, b) => a.sort - b.sort);
  const principal =
    images.find((i) => i.is_principal)?.url ?? images[0]?.url ?? null;

  const hasPromo =
    p.promo != null && Number(p.promo) > 0 && Number(p.promo) < Number(p.price);

  return {
    ...p,
    sizes: sizesSorted,
    colors: colorsSorted,
    images,
    retail: p.price,
    promoVal: p.promo,
    mayorVal: p.mayor,
    tagline: p.short_desc,
    bullets,
    effSizes,
    effColors,
    noSizes,
    noColors,
    stock,
    avail,
    lowStock: stock > 0 && stock <= (p.min_stock || 0),
    soldOut: stock <= 0 && !backorderLike,
    backorderActive: backorderLike,
    hidden: p.state === "inactivo",
    active: p.state !== "inactivo",
    hasPromo,
    sizeTag: noSizes ? null : firstSize,
    principalImage: principal,
  };
}

/** Stock disponible para una talla concreta (o general si no hay talla). */
export function availableStock(p: EffectiveProduct, talla: string): number {
  if (!talla) return p.noSizes ? p.stock : p.stock;
  const s = p.effSizes.find((z) => z.name === talla);
  return s ? s.stock : 0;
}

export function priceOf(p: EffectiveProduct): number {
  return p.hasPromo && p.promoVal != null ? p.promoVal : p.retail;
}
