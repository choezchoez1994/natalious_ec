import type { EffectiveProduct, WaConfig } from "./types";
import { money, fillTemplate } from "./format";

function base(wa: WaConfig, text: string): string {
  return "https://wa.me/" + (wa.number || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(text);
}

export function waLinkGeneral(wa: WaConfig): string {
  return base(wa, (wa.greeting || "") + " " + (wa.generalTemplate || ""));
}

export function waLinkProduct(
  wa: WaConfig,
  p: EffectiveProduct,
  sel: { color?: string; size?: string; estado?: string }
): string {
  const precio = p.hasPromo && p.promoVal != null ? money(p.promoVal) : money(p.retail);
  const vars: Record<string, string> = {
    producto: p.name,
    precio,
    mayor: p.mayorVal != null ? money(p.mayorVal) : "",
    color: sel.color || "",
    talla: sel.size || p.sizeTag || "",
    estado: sel.estado || "",
  };
  let msg = (wa.greeting || "") + " " + fillTemplate(wa.template || "", vars);
  if (sel.estado && msg.indexOf(sel.estado) < 0) msg += " · " + sel.estado;
  return base(wa, msg);
}
