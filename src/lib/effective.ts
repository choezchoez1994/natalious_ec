import type {
  AvailKey,
  EffectiveColor,
  EffectiveProduct,
  EffectiveSize,
  EffectiveSizeColor,
  ImageRow,
  RawProduct,
} from "./types";

/**
 * Calcula el producto "efectivo" a partir de los datos crudos.
 * Reglas de inventario (stock por COLOR + TALLA):
 *  - Cada variante es (color, talla) con su propio stock. Cada color define sus tallas.
 *  - El stock total es la suma del stock de todas las variantes (o stock_general si no hay).
 *  - Una talla está disponible si NO está bloqueada y su stock > 0.
 *  - `effColors[].sizes` lleva las tallas de ese color; `effSizes` es el agregado por nombre
 *    de talla (unión entre colores) para compatibilidad (tabla de medidas, sizeTag).
 *  - Un color está agotado si está bloqueado, todas sus tallas están bloqueadas, o no tiene
 *    stock y el producto no admite backorder.
 */
export function effective(p: RawProduct, sizeRank?: Map<string, number>): EffectiveProduct {
  // Orden canónico de tallas: posición en el catálogo global (cat_sizes), definido por el
  // admin. Las tallas sin entrada en el catálogo (personalizadas) van al final, conservando
  // su orden de inserción (`sort`).
  const rankOf = (name: string) =>
    sizeRank?.has(name) ? (sizeRank.get(name) as number) : Number.MAX_SAFE_INTEGER;
  const sizesAll = [...(p.sizes || [])].sort(
    (a, b) => rankOf(a.name) - rankOf(b.name) || a.sort - b.sort
  );
  const colorsSorted = [...(p.colors || [])].sort((a, b) => a.sort - b.sort);
  const imagesAll = [...(p.images || [])].sort((a, b) => a.sort - b.sort);

  const noColors = colorsSorted.length === 0;
  const backorderLike = p.backorder || p.state === "bajo pedido";

  const generalImages = imagesAll.filter((i) => (i.color || "") === "");
  const imagesOf = (colorName: string): ImageRow[] => {
    const own = imagesAll.filter((i) => (i.color || "") === colorName);
    return own.length ? own : generalImages; // fallback a generales
  };

  const effColors: EffectiveColor[] = colorsSorted.map((c) => {
    const own = sizesAll.filter((s) => (s.color || "") === c.name);
    const cStock = own.reduce((s, z) => s + Math.max(0, z.stock || 0), 0);
    const allBlocked = own.length > 0 && own.every((z) => z.blocked);
    return {
      name: c.name,
      hex: c.hex,
      blocked: !!c.blocked,
      reason: c.reason || "",
      stock: cStock,
      soldOut: !!c.blocked || allBlocked || (cStock <= 0 && !backorderLike),
      images: imagesOf(c.name),
    };
  });

  // effSizes: agrupado por talla; cada talla expone sus colores con stock (modelo talla → color).
  const colorMeta = new Map(colorsSorted.map((c) => [c.name, c]));
  const sizeOrder = new Map<string, number>();
  for (const s of sizesAll) if (!sizeOrder.has(s.name)) sizeOrder.set(s.name, s.sort);

  const byTalla = new Map<string, EffectiveSizeColor[]>();
  for (const s of sizesAll) {
    const cm = colorMeta.get(s.color);
    const blocked = !!s.blocked || !!cm?.blocked;
    const ec: EffectiveSizeColor = {
      name: s.color,
      hex: cm?.hex ?? "#999999",
      stock: Math.max(0, s.stock || 0),
      blocked,
      reason: s.reason || cm?.reason || "",
      available: !blocked && (s.stock || 0) > 0,
    };
    const arr = byTalla.get(s.name) ?? [];
    arr.push(ec);
    byTalla.set(s.name, arr);
  }
  const effSizes: EffectiveSize[] = [...byTalla.entries()]
    .map(([name, colors]) => {
      colors.sort((a, b) => (colorMeta.get(a.name)?.sort ?? 0) - (colorMeta.get(b.name)?.sort ?? 0));
      return {
        name,
        stock: colors.reduce((s, c) => s + c.stock, 0),
        blocked: colors.length > 0 && colors.every((c) => c.blocked),
        reason: "",
        available: colors.some((c) => c.available),
        colors,
      };
    })
    .sort(
      (a, b) =>
        rankOf(a.name) - rankOf(b.name) ||
        (sizeOrder.get(a.name) ?? 0) - (sizeOrder.get(b.name) ?? 0)
    );
  const noSizes = effSizes.length === 0;

  const stock = noSizes
    ? Math.max(0, p.stock_general || 0)
    : effSizes.reduce((s, z) => s + z.stock, 0);

  let avail: AvailKey;
  if (p.state === "inactivo" || p.state === "agotado") avail = "agotado";
  else if (backorderLike && stock <= 0) avail = "pedido";
  else if (stock <= 0) avail = "agotado";
  else if (stock <= (p.min_stock || 0)) avail = "pocas";
  else avail = "stock";

  const firstSize =
    (effSizes.find((s) => s.available) || effSizes[0])?.name ?? null;

  const bullets = (p.long_desc || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const principal =
    imagesAll.find((i) => i.is_principal)?.url ??
    generalImages[0]?.url ??
    imagesAll[0]?.url ??
    null;

  const hasPromo =
    p.promo != null && Number(p.promo) > 0 && Number(p.promo) < Number(p.price);

  return {
    ...p,
    sizes: sizesAll,
    colors: colorsSorted,
    images: imagesAll,
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

/** Stock disponible de una variante (talla + color). Tolerante a productos sin talla/color. */
export function availableStock(p: EffectiveProduct, color: string, talla: string): number {
  if (!talla) {
    if (!color) return p.stock;
    return p.effColors.find((c) => c.name === color)?.stock ?? 0;
  }
  const s = p.effSizes.find((z) => z.name === talla);
  if (!s) return 0;
  if (!color) return s.stock; // talla sin color seleccionado
  return s.colors.find((c) => c.name === color)?.stock ?? 0;
}

export function priceOf(p: EffectiveProduct): number {
  return p.hasPromo && p.promoVal != null ? p.promoVal : p.retail;
}
