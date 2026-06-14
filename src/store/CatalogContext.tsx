import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { fetchCatalog } from "../services/catalog";
import type { CatalogData } from "../services/catalog";
import type { EffectiveProduct } from "../lib/types";

interface CatalogContextValue extends CatalogData {
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  productById: (id: string) => EffectiveProduct | undefined;
  publicProducts: EffectiveProduct[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

const EMPTY: CatalogData = {
  products: [],
  rawById: {},
  categories: [],
  charts: {},
  slides: [],
  config: {
    carousel: { autoplay: true, intervalSec: 5 },
    wa: {
      number: "",
      enabled: true,
      greeting: "",
      template: "",
      generalTemplate: "",
      hours: "",
      replyNote: "",
    },
    social: { hashtags: "", handleIg: "", handleTk: "" },
  },
  catalogs: {
    productStates: [],
    orderStates: [],
    paymentMethods: [],
    paymentStatuses: [],
    movementReasons: [],
    channels: [],
    cities: [],
    banks: [],
    provinces: [],
    sizes: [],
  },
};

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CatalogData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const d = await fetchCatalog();
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<CatalogContextValue>(() => {
    return {
      ...data,
      loading,
      error,
      reload,
      productById: (id: string) => data.products.find((p) => p.id === id),
      publicProducts: data.products.filter((p) => p.active),
    };
  }, [data, loading, error, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog debe usarse dentro de <CatalogProvider>");
  return ctx;
}
