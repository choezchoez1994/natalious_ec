import { supabase } from "../lib/supabase";
import type { Movement } from "../lib/types";
import type { RpcResult } from "./orders";

export interface MovementInput {
  productId: string;
  kind: "ingreso" | "salida";
  qty: number;
  reason: string;
  customReason?: string;
  color?: string;
  size?: string;
  date?: string;
  note?: string;
  responsable?: string;
  force?: boolean;
}

export async function registerMovement(mv: MovementInput): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("nat_register_movement", {
    p_product_id: mv.productId,
    p_kind: mv.kind,
    p_qty: mv.qty,
    p_reason: mv.reason,
    p_custom_reason: mv.customReason ?? "",
    p_color: mv.color ?? "",
    p_size: mv.size ?? "",
    p_date: mv.date ?? null,
    p_note: mv.note ?? "",
    p_responsable: mv.responsable ?? "Administradora",
    p_force: mv.force ?? false,
  });
  if (error) return { ok: false, error: error.message };
  return data as RpcResult;
}

/** Ajusta el stock de una variante (color + talla) a un valor exacto (registra movimiento). */
export async function adjustStock(
  productId: string,
  color: string,
  size: string,
  newStock: number,
  note?: string
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("nat_adjust_stock", {
    p_product_id: productId,
    p_color: color,
    p_size: size,
    p_new_stock: newStock,
    p_note: note ?? "Ajuste manual",
  });
  if (error) return { ok: false, error: error.message };
  return data as RpcResult;
}

export interface ManualSaleInput {
  productId: string;
  size: string;
  color?: string;
  qty: number;
  precioVenta: number;
  cliente: Record<string, string>;
  pago: Record<string, unknown>;
  canal: string;
  note?: string;
  force?: boolean;
}

/** Venta manual desde inventario: descuenta stock y cuenta como venta. */
export async function manualSale(s: ManualSaleInput): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("nat_manual_sale", {
    p_product_id: s.productId,
    p_size: s.size,
    p_color: s.color ?? "",
    p_qty: s.qty,
    p_precio_venta: s.precioVenta,
    p_cliente: s.cliente,
    p_pago: s.pago,
    p_canal: s.canal,
    p_note: s.note ?? "",
    p_force: s.force ?? false,
  });
  if (error) return { ok: false, error: error.message };
  return data as RpcResult;
}

export async function fetchMovements(): Promise<Movement[]> {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .order("ts", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Movement[];
}
