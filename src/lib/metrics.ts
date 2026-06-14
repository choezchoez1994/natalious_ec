import type { EffectiveProduct } from "./types";

export interface Metrics {
  total: number;
  active: number;
  inactive: number;
  out: EffectiveProduct[];
  outCount: number;
  low: EffectiveProduct[];
  lowCount: number;
  featured: number;
  units: number;
  value: number;
  blockedSizes: number;
  blockedColors: number;
}

export function computeMetrics(all: EffectiveProduct[]): Metrics {
  const active = all.filter((p) => p.active);
  const out = active.filter((p) => p.avail === "agotado");
  const low = active.filter((p) => p.lowStock);
  const units = active.reduce((s, p) => s + p.stock, 0);
  const value = active.reduce((s, p) => s + p.stock * (p.hasPromo && p.promoVal != null ? p.promoVal : p.retail), 0);
  const blockedSizes = all.reduce((s, p) => s + p.effSizes.filter((z) => z.blocked).length, 0);
  const blockedColors = all.reduce((s, p) => s + p.effColors.filter((c) => c.blocked).length, 0);
  return {
    total: all.length,
    active: active.length,
    inactive: all.length - active.length,
    out,
    outCount: out.length,
    low,
    lowCount: low.length,
    featured: active.filter((p) => p.featured).length,
    units,
    value,
    blockedSizes,
    blockedColors,
  };
}
