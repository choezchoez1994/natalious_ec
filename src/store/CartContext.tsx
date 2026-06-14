import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, EffectiveProduct } from "../lib/types";
import { availableStock, priceOf } from "../lib/effective";
import { useCatalog } from "./CatalogContext";

const LS_KEY = "natalious.cart.v1";

interface AddResult {
  ok: boolean;
  error?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addToCart: (p: EffectiveProduct, talla: string, color: string, qty: number) => AddResult;
  updateQty: (itemId: string, qty: number) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

let counter = 0;
function uid(): string {
  counter += 1;
  return "ci" + Date.now().toString(36) + counter.toString(36);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { productById } = useCatalog();
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  function addToCart(
    p: EffectiveProduct,
    talla: string,
    color: string,
    qty: number
  ): AddResult {
    if (!p.noColors && p.effColors.length) {
      if (!color) return { ok: false, error: "Selecciona un color." };
      const c = p.effColors.find((x) => x.name === color);
      if (!c || c.blocked) return { ok: false, error: "Ese color no está disponible." };
    }
    if (!p.noSizes && p.effSizes.length) {
      if (!talla) return { ok: false, error: "Selecciona una talla." };
      const s = p.effSizes.find((x) => x.name === talla);
      if (!s || s.blocked) return { ok: false, error: "Esa talla no está disponible." };
    }
    if (p.stock <= 0 && !p.backorderActive) return { ok: false, error: "Producto agotado." };

    const n = Math.max(1, Math.round(qty || 1));
    const key = p.id + "|" + (talla || "") + "|" + (color || "");
    const sizeStock = p.backorderActive ? 99999 : availableStock(p, talla);
    const inCartSameSize = items
      .filter((i) => i.productId === p.id && i.talla === (talla || ""))
      .reduce((a, i) => a + i.cantidad, 0);
    if (!p.backorderActive && inCartSameSize + n > sizeStock) {
      return {
        ok: false,
        error:
          sizeStock <= 0
            ? "Sin stock para esa talla."
            : "Solo quedan " + sizeStock + " unidades de esa talla.",
      };
    }

    const price = priceOf(p);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, cantidad: i.cantidad + n, subtotal: (i.cantidad + n) * i.precioUnitario }
            : i
        );
      }
      return [
        ...prev,
        {
          id: uid(),
          key,
          productId: p.id,
          productName: p.name,
          image: p.principalImage,
          talla: talla || "",
          color: color || "",
          cantidad: n,
          precioUnitario: price,
          subtotal: n * price,
        },
      ];
    });
    return { ok: true };
  }

  function updateQty(itemId: string, qty: number) {
    setItems((prev) => {
      const it = prev.find((x) => x.id === itemId);
      if (!it) return prev;
      let q = Math.round(qty);
      if (q <= 0) return prev.filter((x) => x.id !== itemId);
      const p = productById(it.productId);
      if (p && !p.backorderActive) {
        const max = availableStock(p, it.talla);
        if (q > max) q = max;
      }
      q = Math.max(1, q);
      return prev.map((x) =>
        x.id === itemId ? { ...x, cantidad: q, subtotal: q * x.precioUnitario } : x
      );
    });
  }

  function removeItem(itemId: string) {
    setItems((prev) => prev.filter((x) => x.id !== itemId));
  }

  function clear() {
    setItems([]);
  }

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.cantidad, 0),
      total: items.reduce((s, i) => s + i.subtotal, 0),
      addToCart,
      updateQty,
      removeItem,
      clear,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, productById]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
