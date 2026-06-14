import { supabase } from "../lib/supabase";
import { computeMetrics } from "../lib/metrics";
import { money } from "../lib/format";
import type { Category, EffectiveProduct, Movement, Order } from "../lib/types";

// ===== natalious · capa de datos del Chat IA =====
// El "snapshot" arma el contexto que se envía al modelo. Reutiliza la misma
// lógica de negocio del panel (computeMetrics, producto efectivo, agregación
// de ventas igual que Reports.tsx) para que las cifras coincidan.
// NO incluye datos personales de clientes (cédula, nombre, teléfono, correo):
// solo agregados y ciudad.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SnapshotInput {
  products: EffectiveProduct[];
  categories: Category[];
  orders: Order[];
  movements: Movement[];
}

const AVAIL_ES: Record<string, string> = {
  stock: "en stock",
  pocas: "pocas unidades",
  agotado: "agotado",
  pedido: "bajo pedido",
};

/** Construye el contexto de negocio (texto) para el modelo. */
export function buildSnapshot({ products, categories, orders, movements }: SnapshotInput): string {
  const catName: Record<string, string> = {};
  categories.forEach((c) => (catName[c.id] = c.name));
  const m = computeMetrics(products);
  const L: string[] = [];

  // ---- Resumen ----
  L.push("=== RESUMEN DE INVENTARIO (natalious) ===");
  L.push(
    `Productos: ${m.total} (activos ${m.active}, inactivos ${m.inactive}). ` +
      `Agotados: ${m.outCount}. Stock bajo: ${m.lowCount}. Destacados: ${m.featured}.`
  );
  L.push(`Unidades en stock: ${m.units}. Valor de inventario (a precio de venta): ${money(m.value)}.`);
  // Listas explícitas para que el modelo no tenga que inferir el criterio.
  L.push(
    `Productos con STOCK BAJO (pocas unidades, stock ≤ stock mínimo): ` +
      (m.low.length ? m.low.map((p) => `${p.name} (${p.stock})`).join(", ") : "ninguno") +
      "."
  );
  L.push(
    `Productos AGOTADOS (stock 0 sin bajo pedido): ` +
      (m.out.length ? m.out.map((p) => p.name).join(", ") : "ninguno") +
      "."
  );
  L.push("");

  // ---- Catálogo ----
  L.push("=== CATÁLOGO (un producto por línea) ===");
  products.forEach((p) => {
    const cat = p.category_id ? catName[p.category_id] ?? p.category_id : "sin categoría";
    const precios = [`venta ${money(p.retail)}`];
    if (p.hasPromo && p.promoVal != null) precios.push(`promo ${money(p.promoVal)}`);
    if (p.mayorVal != null) precios.push(`mayor ${money(p.mayorVal)}`);
    const margen = p.cost > 0 && p.retail > 0 ? Math.round(((p.retail - p.cost) / p.retail) * 100) : null;
    const costoStr = p.cost > 0 ? `costo ${money(p.cost)}${margen != null ? `, margen ${margen}%` : ""}` : "sin costo";
    const tallas = p.effSizes.length
      ? p.effSizes.map((s) => `${s.name}:${s.stock}${s.blocked ? "(bloq)" : ""}`).join(", ")
      : "sin tallas";
    const colores = p.effColors.length ? p.effColors.map((c) => c.name).join(", ") : "sin colores";
    L.push(
      `- [${cat}] ${p.name} — ${precios.join(" / ")} | ${costoStr} | ` +
        `stock ${p.stock} (${AVAIL_ES[p.avail] ?? p.avail})${!p.active ? " [INACTIVO]" : ""}`
    );
    L.push(`    tallas: ${tallas} | colores: ${colores}`);
  });
  L.push("");

  // ---- Órdenes (sin PII) ----
  const estados: Record<string, number> = {};
  orders.forEach((o) => (estados[o.estado] = (estados[o.estado] ?? 0) + 1));
  const sent = orders.filter((o) => o.estado === "Enviado");
  const soldTotal = sent.reduce((s, o) => s + o.total, 0);
  L.push("=== ÓRDENES ===");
  L.push(
    `Total: ${orders.length}. Por estado: ${Object.entries(estados)
      .map(([e, n]) => `${e} ${n}`)
      .join(", ") || "ninguna"}.`
  );
  L.push(`Total vendido (órdenes enviadas): ${money(soldTotal)}.`);
  if (orders.length) {
    L.push("Últimas órdenes:");
    orders.slice(0, 10).forEach((o) => {
      L.push(`- ${o.numero_orden} · ${o.fecha} · ${o.estado} · ${money(o.total)} · ${o.cliente?.ciudad || "—"}`);
    });
  }
  L.push("");

  // ---- Ventas (Kardex) — misma lógica que Reports.tsx ----
  const sales = movements.filter((mv) => mv.kind === "salida" && mv.reason === "venta");
  const defects = movements.filter((mv) => mv.reason === "baja_falla" || mv.reason === "danado");
  const losses = movements.filter((mv) => mv.reason === "merma" || mv.reason === "perdida");

  const soldByProduct: Record<string, { name: string; q: number; ing: number }> = {};
  sales.forEach((mv) => {
    const e = soldByProduct[mv.product_id] ?? { name: mv.product_name, q: 0, ing: 0 };
    e.q += mv.qty;
    e.ing += mv.subtotal_venta ?? 0;
    soldByProduct[mv.product_id] = e;
  });
  const ranked = Object.values(soldByProduct).sort((a, b) => b.q - a.q);
  const totalSold = sales.reduce((s, mv) => s + mv.qty, 0);
  const ingresos = sales.reduce((s, mv) => s + (mv.subtotal_venta ?? 0), 0);
  const utilidad = sales.reduce((s, mv) => s + (mv.utilidad_bruta ?? 0), 0);

  L.push("=== VENTAS (rotación · solo salidas tipo Venta) ===");
  L.push(`Unidades vendidas: ${totalSold}. Ingresos: ${money(ingresos)}. Utilidad bruta: ${money(utilidad)}.`);
  if (ranked.length) {
    L.push(
      "Más vendidos: " +
        ranked
          .slice(0, 8)
          .map((r) => `${r.name} (${r.q} u, ${money(r.ing)})`)
          .join("; ") +
        "."
    );
  }
  const sinVenta = products.filter((p) => !soldByProduct[p.id]).map((p) => p.name);
  if (sinVenta.length) {
    L.push(`Sin ventas: ${sinVenta.slice(0, 15).join(", ")}${sinVenta.length > 15 ? "…" : ""}.`);
  }
  L.push("");

  // ---- Bajas / mermas ----
  L.push("=== BAJAS / MERMAS ===");
  L.push(
    `Bajas por falla/daño: ${defects.reduce((s, mv) => s + mv.qty, 0)} u (${defects.length} movs). ` +
      `Mermas/pérdidas: ${losses.reduce((s, mv) => s + mv.qty, 0)} u (${losses.length} movs).`
  );

  return L.join("\n");
}

/** Envía la pregunta a la Edge Function 'chat-ia' (la clave de Groq vive allí). */
export async function askChat(
  question: string,
  history: ChatMessage[],
  snapshot: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("chat-ia", {
    body: { question, history: history.slice(-6), snapshot },
  });
  if (error) throw new Error(error.message || "No se pudo contactar al asistente.");
  if (!data?.answer) throw new Error(data?.error || "El asistente no devolvió respuesta.");
  return data.answer as string;
}
