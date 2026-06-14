import { supabase } from "../lib/supabase";
import { uploadImage, removeImage } from "./storage";
import type { CarouselConfig, Slide } from "../lib/types";

export async function addSlide(): Promise<void> {
  const { data } = await supabase.from("slides").select("sort");
  const nextSort = (data ?? []).reduce((m: number, s: any) => Math.max(m, s.sort), -1) + 1;
  await supabase.from("slides").insert({
    active: true,
    sort: nextSort,
    title: "Nueva diapositiva",
    cta_label: "Ver más",
    link_type: "none",
  });
}

export async function updateSlide(id: string, patch: Partial<Slide>): Promise<void> {
  await supabase.from("slides").update(patch).eq("id", id);
}

export async function deleteSlide(id: string, storagePath: string | null): Promise<void> {
  await removeImage("carousel-images", storagePath);
  await supabase.from("slides").delete().eq("id", id);
}

export async function moveSlide(id: string, dir: number): Promise<void> {
  const { data } = await supabase.from("slides").select("id, sort").order("sort");
  const ordered = (data ?? []) as { id: string; sort: number }[];
  const i = ordered.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ordered.length) return;
  const a = ordered[i].sort;
  await supabase.from("slides").update({ sort: ordered[j].sort }).eq("id", ordered[i].id);
  await supabase.from("slides").update({ sort: a }).eq("id", ordered[j].id);
}

export async function setSlideImage(slide: Slide, file: File): Promise<void> {
  const { url, path } = await uploadImage("carousel-images", file);
  await removeImage("carousel-images", slide.image_path);
  await supabase.from("slides").update({ image_url: url, image_path: path }).eq("id", slide.id);
}

export async function setCarouselConfig(cfg: Partial<CarouselConfig>): Promise<void> {
  const { data } = await supabase.from("app_config").select("carousel").eq("id", 1).maybeSingle();
  const merged = { autoplay: true, intervalSec: 5, ...(data?.carousel ?? {}), ...cfg };
  await supabase.from("app_config").upsert({ id: 1, carousel: merged }, { onConflict: "id" });
}

// ---------- carrusel de categorías (imágenes de categoría) ----------
export async function setCategoryImage(
  categoryId: string,
  currentPath: string | null,
  file: File
): Promise<void> {
  const { url, path } = await uploadImage("category-images", file, categoryId);
  await removeImage("category-images", currentPath);
  await supabase
    .from("categories")
    .update({ image_url: url, image_path: path })
    .eq("id", categoryId);
}

export async function clearCategoryImage(
  categoryId: string,
  currentPath: string | null
): Promise<void> {
  await removeImage("category-images", currentPath);
  await supabase.from("categories").update({ image_url: null, image_path: null }).eq("id", categoryId);
}
