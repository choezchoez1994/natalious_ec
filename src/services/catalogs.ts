import { supabase } from "../lib/supabase";

// Catálogos con id de texto (estados, métodos de pago, motivos, canales)
export type TextCatTable =
  | "cat_product_states"
  | "cat_order_states"
  | "cat_payment_methods"
  | "cat_payment_statuses"
  | "cat_movement_reasons"
  | "cat_channels";

// Catálogos con id uuid + columna name (bancos)
export type NamedCatTable = "cat_banks";

export async function addTextCat(
  table: TextCatTable,
  id: string,
  label: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const { data } = await supabase.from(table).select("sort");
  const nextSort = (data ?? []).reduce((m: number, r: any) => Math.max(m, r.sort), -1) + 1;
  await supabase.from(table).insert({ id, label, sort: nextSort, ...extra });
}

export async function updateTextCat(
  table: TextCatTable,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  await supabase.from(table).update(patch).eq("id", id);
}

export async function deleteTextCat(table: TextCatTable, id: string): Promise<void> {
  await supabase.from(table).delete().eq("id", id);
}

export async function addNamedCat(table: NamedCatTable, name: string): Promise<void> {
  const { data } = await supabase.from(table).select("sort");
  const nextSort = (data ?? []).reduce((m: number, r: any) => Math.max(m, r.sort), -1) + 1;
  await supabase.from(table).insert({ name, sort: nextSort });
}

export async function updateNamedCat(
  table: NamedCatTable,
  id: string,
  name: string
): Promise<void> {
  await supabase.from(table).update({ name }).eq("id", id);
}

export async function deleteNamedCat(table: NamedCatTable, id: string): Promise<void> {
  await supabase.from(table).delete().eq("id", id);
}

// ---------- tallas (cat_sizes, id de texto) ----------
export async function addSizeCat(id: string, label: string): Promise<void> {
  const { data } = await supabase.from("cat_sizes").select("sort");
  const nextSort = (data ?? []).reduce((m: number, r: any) => Math.max(m, r.sort), -1) + 1;
  await supabase.from("cat_sizes").insert({ id, label, sort: nextSort });
}
export async function deleteSizeCat(id: string): Promise<void> {
  await supabase.from("cat_sizes").delete().eq("id", id);
}
/** Reescribe el orden de las tallas según la secuencia de ids recibida. */
export async function reorderSizeCats(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) => supabase.from("cat_sizes").update({ sort: i }).eq("id", id))
  );
}

// ---------- categorías ----------
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cat"
  );
}

export async function createCategory(name: string): Promise<void> {
  const base = slugify(name);
  const { data } = await supabase.from("categories").select("id, sort");
  const taken = new Set((data ?? []).map((c: any) => c.id));
  let id = base;
  let n = 2;
  while (taken.has(id)) id = base + "-" + n++;
  const nextSort = (data ?? []).reduce((m: number, c: any) => Math.max(m, c.sort), -1) + 1;
  await supabase.from("categories").insert({ id, name, tagline: "", sort: nextSort, active: true, show_in_carousel: true });
}

export async function updateCategory(
  id: string,
  patch: { name?: string; tagline?: string; sort?: number; active?: boolean; show_in_carousel?: boolean }
): Promise<void> {
  await supabase.from("categories").update(patch).eq("id", id);
}

export async function deleteCategory(id: string): Promise<void> {
  await supabase.from("categories").delete().eq("id", id);
}
