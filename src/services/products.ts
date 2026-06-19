import { supabase } from "../lib/supabase";
import { uploadImage, removeImage } from "./storage";
import type { ProductRow } from "../lib/types";

export async function createProduct(): Promise<string> {
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .order("sort")
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: "Nuevo producto",
      category_id: cat?.id ?? null,
      state: "disponible",
      min_stock: 3,
      charts: ["inferior"],
    })
    .select("id")
    .single();
  if (error) throw error;
  const id = data.id as string;

  await supabase.from("products").update({ slug: id }).eq("id", id);
  await supabase.from("product_costs").insert({ product_id: id, cost: 0 });
  // Color inicial + sus tallas (modelo: stock por color + talla)
  await supabase
    .from("product_colors")
    .insert({ product_id: id, name: "Negro", hex: "#1d1d1b", sort: 0 });
  await supabase.from("product_sizes").insert([
    { product_id: id, color: "Negro", name: "S", stock: 0, sort: 0 },
    { product_id: id, color: "Negro", name: "M", stock: 0, sort: 1 },
    { product_id: id, color: "Negro", name: "L", stock: 0, sort: 2 },
  ]);
  return id;
}

export async function updateProduct(id: string, patch: Partial<ProductRow>): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  // Borra imágenes del storage primero
  const { data: imgs } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  for (const i of imgs ?? []) await removeImage("product-images", i.storage_path);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function setCost(id: string, cost: number): Promise<void> {
  const { error } = await supabase
    .from("product_costs")
    .upsert({ product_id: id, cost }, { onConflict: "product_id" });
  if (error) throw error;
}

// ---------- tallas (variantes por color) ----------
export async function addSize(
  productId: string,
  color: string,
  name: string,
  sort: number
): Promise<void> {
  await supabase
    .from("product_sizes")
    .insert({ product_id: productId, color, name, stock: 0, sort });
}
export async function removeSize(productId: string, color: string, name: string): Promise<void> {
  await supabase
    .from("product_sizes")
    .delete()
    .eq("product_id", productId)
    .eq("color", color)
    .eq("name", name);
}
export async function setSizeBlocked(
  productId: string,
  color: string,
  name: string,
  blocked: boolean,
  reason?: string
): Promise<void> {
  const patch: Record<string, unknown> = { blocked };
  if (reason !== undefined) patch.reason = reason;
  await supabase
    .from("product_sizes")
    .update(patch)
    .eq("product_id", productId)
    .eq("color", color)
    .eq("name", name);
}

// ---------- colores ----------
export async function addColor(
  productId: string,
  name: string,
  hex: string,
  sort: number
): Promise<void> {
  await supabase.from("product_colors").insert({ product_id: productId, name, hex, sort });
}
export async function removeColor(productId: string, name: string): Promise<void> {
  // Borra las variantes de stock de ese color
  await supabase.from("product_sizes").delete().eq("product_id", productId).eq("color", name);
  // Conserva las imágenes: las reasigna a "general" (color='') para no perderlas
  await supabase
    .from("product_images")
    .update({ color: "" })
    .eq("product_id", productId)
    .eq("color", name);
  await supabase.from("product_colors").delete().eq("product_id", productId).eq("name", name);
}
export async function updateColor(
  productId: string,
  name: string,
  patch: { hex?: string; blocked?: boolean; reason?: string }
): Promise<void> {
  await supabase.from("product_colors").update(patch).eq("product_id", productId).eq("name", name);
}

// ---------- imágenes ----------
export async function addProductImage(
  productId: string,
  file: File,
  color = ""
): Promise<void> {
  const { url, path } = await uploadImage("product-images", file, productId);
  const { data: existing } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId);
  const isFirst = (existing ?? []).length === 0;
  await supabase.from("product_images").insert({
    product_id: productId,
    color,
    url,
    storage_path: path,
    sort: (existing ?? []).length,
    is_principal: isFirst,
  });
}

export async function removeProductImage(
  imageId: string,
  storagePath: string | null
): Promise<void> {
  await removeImage("product-images", storagePath);
  await supabase.from("product_images").delete().eq("id", imageId);
}

/** Reasigna una imagen a otro color (''=general). */
export async function setImageColor(imageId: string, color: string): Promise<void> {
  await supabase.from("product_images").update({ color }).eq("id", imageId);
}

export async function setPrincipalImage(productId: string, imageId: string): Promise<void> {
  await supabase.from("product_images").update({ is_principal: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_principal: true }).eq("id", imageId);
}

// ---------- tabla de medidas del producto ----------
export async function setProductCharts(id: string, charts: string[]): Promise<void> {
  await updateProduct(id, { charts });
}
