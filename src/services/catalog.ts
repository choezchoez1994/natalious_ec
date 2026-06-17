import { supabase } from "../lib/supabase";
import { effective } from "../lib/effective";
import type {
  AppConfig,
  Catalogs,
  Category,
  ChartRow,
  EffectiveProduct,
  RawProduct,
  Slide,
} from "../lib/types";

export interface CatalogData {
  products: EffectiveProduct[];
  rawById: Record<string, RawProduct>;
  categories: Category[];
  charts: Record<string, ChartRow>;
  slides: Slide[];
  config: AppConfig;
  catalogs: Catalogs;
}

const DEFAULT_CONFIG: AppConfig = {
  carousel: { autoplay: true, intervalSec: 5 },
  wa: {
    number: "593959915283",
    enabled: true,
    greeting: "¡Hola natalious! ✦",
    template:
      "Me interesa: {producto} ({precio}). Color: {color} · Talla: {talla}. ¿Tienen disponible?",
    generalTemplate: "Quiero más información del catálogo. ✦",
    hours: "Lun a Sáb · 9:00 – 19:00",
    replyNote: "Respondemos en minutos en horario de atención.",
  },
  social: {
    hashtags: "#natalious #ropadeportiva #athleisure #ecuador",
    handleIg: "@natalious.ec",
    handleTk: "@natalious.ec",
  },
  tienda: {
    provinciaCod: "",
    provinciaNombre: "",
    cantonCod: "",
    cantonNombre: "",
    parroquiaCod: "",
    parroquiaNombre: "",
    direccion: "",
  },
};

/** Carga todo lo que necesita la tienda y el panel en paralelo. */
export async function fetchCatalog(): Promise<CatalogData> {
  const [
    productsRes,
    sizesRes,
    colorsRes,
    imagesRes,
    costsRes,
    categoriesRes,
    chartsRes,
    slidesRes,
    configRes,
    productStatesRes,
    orderStatesRes,
    payMethodsRes,
    payStatusesRes,
    moveReasonsRes,
    channelsRes,
    banksRes,
    catSizesRes,
    provinciasRes,
    cantonesRes,
    parroquiasRes,
  ] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("product_sizes").select("*"),
    supabase.from("product_colors").select("*"),
    supabase.from("product_images").select("*"),
    supabase.from("product_costs").select("*"),
    supabase.from("categories").select("*").order("sort"),
    supabase.from("size_charts").select("*").order("sort"),
    supabase.from("slides").select("*").order("sort"),
    supabase.from("app_config").select("*").eq("id", 1).maybeSingle(),
    supabase.from("cat_product_states").select("*").order("sort"),
    supabase.from("cat_order_states").select("*").order("sort"),
    supabase.from("cat_payment_methods").select("*").order("sort"),
    supabase.from("cat_payment_statuses").select("*").order("sort"),
    supabase.from("cat_movement_reasons").select("*").order("sort"),
    supabase.from("cat_channels").select("*").order("sort"),
    supabase.from("cat_banks").select("*").order("sort"),
    supabase.from("cat_sizes").select("*").order("sort"),
    supabase.from("dpa_provincias").select("*").order("nombre"),
    supabase.from("dpa_cantones").select("*").order("nombre"),
    supabase.from("dpa_parroquias").select("*").order("nombre"),
  ]);

  const firstErr = [productsRes, sizesRes, colorsRes, imagesRes, categoriesRes].find(
    (r) => r.error
  );
  if (firstErr?.error) throw firstErr.error;

  const sizes = sizesRes.data ?? [];
  const colors = colorsRes.data ?? [];
  const images = imagesRes.data ?? [];
  const costs = costsRes.data ?? [];
  const costById: Record<string, number> = {};
  costs.forEach((c: { product_id: string; cost: number }) => (costById[c.product_id] = c.cost));

  const rawById: Record<string, RawProduct> = {};
  const products: EffectiveProduct[] = (productsRes.data ?? []).map((p: any) => {
    const raw: RawProduct = {
      ...p,
      charts: p.charts ?? [],
      sizes: sizes.filter((s: any) => s.product_id === p.id),
      colors: colors.filter((c: any) => c.product_id === p.id),
      images: images.filter((i: any) => i.product_id === p.id),
      cost: costById[p.id] ?? 0,
    };
    rawById[p.id] = raw;
    return effective(raw);
  });
  products.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const charts: Record<string, ChartRow> = {};
  (chartsRes.data ?? []).forEach((c: any) => {
    charts[c.key] = { key: c.key, title: c.title, cols: c.cols, rows: c.rows, sort: c.sort };
  });

  const cfgRow = configRes.data as any;
  const config: AppConfig = cfgRow
    ? {
        carousel: { ...DEFAULT_CONFIG.carousel, ...(cfgRow.carousel ?? {}) },
        wa: { ...DEFAULT_CONFIG.wa, ...(cfgRow.wa ?? {}) },
        social: { ...DEFAULT_CONFIG.social, ...(cfgRow.social ?? {}) },
        tienda: { ...DEFAULT_CONFIG.tienda, ...(cfgRow.tienda ?? {}) },
      }
    : DEFAULT_CONFIG;

  const catalogs: Catalogs = {
    productStates: productStatesRes.data ?? [],
    orderStates: orderStatesRes.data ?? [],
    paymentMethods: payMethodsRes.data ?? [],
    paymentStatuses: payStatusesRes.data ?? [],
    movementReasons: moveReasonsRes.data ?? [],
    channels: channelsRes.data ?? [],
    banks: banksRes.data ?? [],
    sizes: catSizesRes.data ?? [],
    provincias: provinciasRes.data ?? [],
    cantones: cantonesRes.data ?? [],
    parroquias: parroquiasRes.data ?? [],
  };

  return {
    products,
    rawById,
    categories: categoriesRes.data ?? [],
    charts,
    slides: slidesRes.data ?? [],
    config,
    catalogs,
  };
}
