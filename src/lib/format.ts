// ===== natalious · utilidades de formato =====

export function money(n: number | null | undefined): string {
  return "$" + Number(n ?? 0).toFixed(2).replace(".", ",");
}

export function timeAgo(ts: string | number): string {
  const t = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const d = Math.floor((Date.now() - t) / 1000);
  if (d < 60) return "hace " + d + "s";
  if (d < 3600) return "hace " + Math.floor(d / 60) + " min";
  if (d < 86400) return "hace " + Math.floor(d / 3600) + " h";
  return "hace " + Math.floor(d / 86400) + " d";
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtPhone(n: string): string {
  const d = (n || "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("593"))
    return "+593 " + d.slice(3, 5) + " " + d.slice(5, 8) + " " + d.slice(8);
  return "+" + d;
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return (tpl || "").replace(/\{(\w+)\}/g, (_m, k) => (vars[k] != null ? vars[k] : ""));
}
