import { supabase } from "../lib/supabase";

export type Bucket = "product-images" | "carousel-images" | "category-images";

function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rnd}${ext || ".jpg"}`;
}

export interface UploadResult {
  path: string;
  url: string;
}

/** Sube un archivo al bucket indicado y devuelve la URL pública. */
export async function uploadImage(
  bucket: Bucket,
  file: File,
  folder = ""
): Promise<UploadResult> {
  const path = (folder ? folder.replace(/\/+$/, "") + "/" : "") + safeName(file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeImage(bucket: Bucket, path: string | null): Promise<void> {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
