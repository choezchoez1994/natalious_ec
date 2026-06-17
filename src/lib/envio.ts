import type { Canton, Parroquia } from "./types";

/**
 * Costo de envío efectivo de una zona: el de la parroquia si es > 0,
 * en su defecto el del cantón (0 = entrega local sin costo, p.ej. Guayaquil).
 * Sólo para mostrar en la UI; el servidor recalcula el valor real al persistir.
 */
export function envioEfectivo(
  canton?: Canton | null,
  parroquia?: Parroquia | null
): number {
  if (parroquia && parroquia.valor_envio > 0) return parroquia.valor_envio;
  return canton?.valor_envio ?? 0;
}
