import { supabase } from "../lib/supabase";
import type { ChartRow, SocialConfig, TiendaConfig, WaConfig } from "../lib/types";

export async function setWA(patch: Partial<WaConfig>): Promise<void> {
  const { data } = await supabase.from("app_config").select("wa").eq("id", 1).maybeSingle();
  const merged = { ...(data?.wa ?? {}), ...patch };
  await supabase.from("app_config").upsert({ id: 1, wa: merged }, { onConflict: "id" });
}

export async function setSocial(patch: Partial<SocialConfig>): Promise<void> {
  const { data } = await supabase.from("app_config").select("social").eq("id", 1).maybeSingle();
  const merged = { ...(data?.social ?? {}), ...patch };
  await supabase.from("app_config").upsert({ id: 1, social: merged }, { onConflict: "id" });
}

export async function setTienda(patch: Partial<TiendaConfig>): Promise<void> {
  const { data } = await supabase.from("app_config").select("tienda").eq("id", 1).maybeSingle();
  const merged = { ...(data?.tienda ?? {}), ...patch };
  await supabase.from("app_config").upsert({ id: 1, tienda: merged }, { onConflict: "id" });
}

// ---------- tablas de medidas (globales) ----------
export async function saveChart(chart: ChartRow): Promise<void> {
  await supabase
    .from("size_charts")
    .update({ title: chart.title, cols: chart.cols, rows: chart.rows })
    .eq("key", chart.key);
}
