import { supabase } from "../lib/supabase";

export interface ClienteRow {
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  direccion: string;
  provincia_cod: string;
  provincia_nombre: string;
  canton_cod: string;
  canton_nombre: string;
  parroquia_cod: string;
  parroquia_nombre: string;
}

/** Busca un cliente por cédula (RPC). Devuelve null si no existe. */
export async function buscarCliente(cedula: string): Promise<ClienteRow | null> {
  const { data, error } = await supabase.rpc("nat_buscar_cliente", { p_cedula: cedula });
  if (error || !data) return null;
  return data as ClienteRow;
}
