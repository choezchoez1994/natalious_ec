import { supabase } from "../lib/supabase";
import type { CartItem, Cliente, Order, Pago } from "../lib/types";

export interface RpcResult {
  ok: boolean;
  error?: string;
  numero?: string;
  orderId?: string;
}

/** Genera una orden (RPC pública). No descuenta stock. */
export async function createOrder(
  cliente: Cliente,
  pago: Pago,
  canal: string,
  items: CartItem[]
): Promise<RpcResult> {
  const payload = items.map((i) => ({
    productId: i.productId,
    productName: i.productName,
    image: i.image,
    talla: i.talla,
    color: i.color,
    cantidad: i.cantidad,
    precioUnitario: i.precioUnitario,
  }));
  const { data, error } = await supabase.rpc("nat_create_order", {
    p_cliente: cliente,
    p_pago: pago,
    p_canal: canal,
    p_items: payload,
  });
  if (error) return { ok: false, error: error.message };
  return data as RpcResult;
}

export async function fetchOrders(): Promise<Order[]> {
  const [ordersRes, itemsRes, histRes] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
    supabase.from("order_history").select("*").order("created_at"),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  const items = itemsRes.data ?? [];
  const hist = histRes.data ?? [];
  return (ordersRes.data ?? []).map((o: any) => ({
    ...o,
    items: items.filter((i: any) => i.order_id === o.id),
    historial: hist.filter((h: any) => h.order_id === o.id),
  })) as Order[];
}

/** Cambia el estado (RPC admin). Afecta inventario en "Enviado". */
export async function updateOrderState(
  orderId: string,
  newState: string,
  obs: string
): Promise<RpcResult> {
  const { data, error } = await supabase.rpc("nat_update_order_state", {
    p_order_id: orderId,
    p_new_state: newState,
    p_obs: obs,
  });
  if (error) return { ok: false, error: error.message };
  return data as RpcResult;
}

export async function setOrderPago(orderId: string, pago: Partial<Pago>): Promise<void> {
  const { data } = await supabase.from("orders").select("pago").eq("id", orderId).single();
  const merged = { ...(data?.pago ?? {}), ...pago };
  await supabase.from("orders").update({ pago: merged }).eq("id", orderId);
}

export async function setOrderCanal(orderId: string, canal: string): Promise<void> {
  await supabase.from("orders").update({ canal_origen: canal }).eq("id", orderId);
}

export async function setOrderObs(orderId: string, obs: string): Promise<void> {
  await supabase.from("orders").update({ observacion_interna: obs }).eq("id", orderId);
}
