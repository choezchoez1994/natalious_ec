import { supabase } from "../lib/supabase";

/** Edita el costo de envío de un cantón (admin). */
export async function setCantonEnvio(codigo: string, valor: number): Promise<void> {
  await supabase.from("dpa_cantones").update({ valor_envio: valor }).eq("codigo", codigo);
}

/** Edita el costo de envío de una parroquia (admin). */
export async function setParroquiaEnvio(codigo: string, valor: number): Promise<void> {
  await supabase.from("dpa_parroquias").update({ valor_envio: valor }).eq("codigo", codigo);
}
