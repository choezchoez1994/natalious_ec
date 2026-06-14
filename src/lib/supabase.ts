import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
// Acepta la clave nueva (publishable) o la antigua (anon). Ambas son públicas.
const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

if (!url || !anon) {
  // Aviso temprano y claro en consola si faltan las variables.
  console.error(
    "Faltan variables de entorno de Supabase. Copia .env.example a .env y completa " +
      "VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o VITE_SUPABASE_ANON_KEY)."
  );
}

export const isSupabaseConfigured = Boolean(url && anon);

// Si faltan las variables usamos valores marcador para que createClient no lance
// al importar; la app mostrará la pantalla "Configura Supabase".
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key",
  { auth: { persistSession: true, autoRefreshToken: true } }
);
