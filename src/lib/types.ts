// ===== natalious · tipos del dominio =====

export interface Category {
  id: string;
  name: string;
  tagline: string;
  image_url: string | null;
  image_path: string | null;
  sort: number;
  active: boolean;
  show_in_carousel: boolean;
}

export interface SizeRow {
  id: string;
  product_id: string;
  color: string; // '' = producto sin colores (compat). Variante = (product_id, color, name)
  name: string;
  stock: number;
  blocked: boolean;
  reason: string;
  sort: number;
}

export interface ColorRow {
  id: string;
  product_id: string;
  name: string;
  hex: string;
  blocked: boolean;
  reason: string;
  sort: number;
}

export interface ImageRow {
  id: string;
  product_id: string;
  color: string; // '' = imagen general/fallback; si no, pertenece a ese color
  url: string | null;
  storage_path: string | null;
  is_principal: boolean;
  sort: number;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category_id: string | null;
  short_desc: string;
  long_desc: string;
  price: number;
  promo: number | null;
  mayor: number | null;
  featured: boolean;
  state: string; // disponible | bajo pedido | agotado | inactivo
  backorder: boolean;
  min_stock: number;
  stock_general: number;
  charts: string[];
  created_at: string;
  updated_at: string;
}

export interface RawProduct extends ProductRow {
  sizes: SizeRow[];
  colors: ColorRow[];
  images: ImageRow[];
  cost: number; // solo presente para admin (RLS protege product_costs)
}

export type AvailKey = "stock" | "pocas" | "agotado" | "pedido";

export interface EffectiveSizeColor {
  name: string;
  hex: string;
  stock: number;
  blocked: boolean;
  reason: string;
  available: boolean; // !blocked && stock > 0
}

export interface EffectiveSize {
  name: string;
  stock: number; // suma del stock de sus colores
  blocked: boolean;
  reason: string;
  available: boolean; // algún color con stock disponible
  colors: EffectiveSizeColor[]; // colores presentes en esta talla (modelo talla → color)
}

export interface EffectiveColor {
  name: string;
  hex: string;
  blocked: boolean;
  reason: string;
  stock: number; // suma del stock del color en todas las tallas
  soldOut: boolean; // blocked || todas bloqueadas || (stock<=0 sin backorder)
  images: ImageRow[]; // imágenes de este color (con fallback a las generales)
}

export interface EffectiveProduct extends RawProduct {
  retail: number;
  promoVal: number | null;
  mayorVal: number | null;
  tagline: string;
  bullets: string[];
  effSizes: EffectiveSize[];
  effColors: EffectiveColor[];
  noSizes: boolean;
  noColors: boolean;
  stock: number; // stock total
  avail: AvailKey;
  lowStock: boolean;
  soldOut: boolean;
  backorderActive: boolean;
  hidden: boolean;
  active: boolean;
  hasPromo: boolean;
  sizeTag: string | null;
  principalImage: string | null; // url de la imagen principal
}

export interface Slide {
  id: string;
  active: boolean;
  sort: number;
  image_url: string | null;
  image_path: string | null;
  title: string;
  subtitle: string;
  cta_label: string;
  link_type: "producto" | "categoria" | "whatsapp" | "url" | "cart" | "none";
  link_value: string;
  start_date: string | null;
  end_date: string | null;
}

export interface ChartRow {
  key: string;
  title: string;
  cols: string[];
  rows: string[][];
  sort: number;
}

export interface WaConfig {
  number: string;
  enabled: boolean;
  greeting: string;
  template: string;
  generalTemplate: string;
  hours: string;
  replyNote: string;
}

export interface SocialConfig {
  hashtags: string;
  handleIg: string;
  handleTk: string;
}

export interface CarouselConfig {
  autoplay: boolean;
  intervalSec: number;
}

export interface TiendaConfig {
  provinciaCod: string;
  provinciaNombre: string;
  cantonCod: string;
  cantonNombre: string;
  parroquiaCod: string;
  parroquiaNombre: string;
  direccion: string;
}

export interface AppConfig {
  carousel: CarouselConfig;
  wa: WaConfig;
  social: SocialConfig;
  tienda: TiendaConfig;
}

export interface Cliente {
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  ciudad?: string; // = nombre del cantón (compat con vistas/órdenes viejas)
  direccion: string;
  // Zona geográfica (DPA INEC)
  provinciaCod?: string;
  provinciaNombre?: string;
  cantonCod?: string;
  cantonNombre?: string;
  parroquiaCod?: string;
  parroquiaNombre?: string;
  // Entrega
  tipoEntrega?: "servientrega" | "retiro";
  direccionRetiro?: string; // dirección de la tienda cuando es retiro
}

export interface Pago {
  formaPago: string;
  estadoPago: string;
  bancoOrigen: string;
  numeroComprobante: string;
  valorPagado: number;
  fechaPago: string;
  observacionPago: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  image_url: string | null;
  talla: string;
  color: string;
  cantidad: number;
  precio_unitario: number;
  precio_compra_unitario: number;
  subtotal: number;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  fecha: string;
  estado_anterior: string;
  estado_nuevo: string;
  usuario: string;
  observacion: string;
}

export interface Order {
  id: string;
  numero_orden: string;
  fecha: string;
  cliente: Cliente;
  canal_origen: string;
  pago: Pago;
  subtotal: number;
  valor_envio: number;
  total: number;
  estado: string;
  observacion_interna: string;
  created_at: string;
  items: OrderItem[];
  historial: OrderHistory[];
}

export interface Movement {
  id: string;
  ts: string;
  fecha: string;
  kind: "ingreso" | "salida";
  reason: string;
  reason_label: string;
  clasificacion: string;
  product_id: string;
  product_name: string;
  color: string;
  size: string;
  sku: string;
  qty: number;
  prev: number;
  next: number;
  note: string;
  responsable: string;
  numero_orden: string | null;
  precio_venta_unitario: number | null;
  precio_compra_unitario: number | null;
  subtotal_venta: number | null;
  costo_total: number | null;
  utilidad_bruta: number | null;
  margen_porcentaje: number | null;
}

// Catálogos configurables
export interface CatItem {
  id: string;
  label: string;
  sort: number;
}
export interface OrderStateCat extends CatItem {
  color: string;
  bg: string;
}
export interface NamedItem {
  id: string;
  name: string;
  sort: number;
}

// Geografía DPA (INEC). El código es la PK natural.
export interface Provincia {
  codigo: string;
  nombre: string;
  sort: number;
}
export interface Canton {
  codigo: string;
  nombre: string;
  provincia_cod: string;
  valor_envio: number;
  sort: number;
}
export interface Parroquia {
  codigo: string;
  nombre: string;
  canton_cod: string;
  valor_envio: number;
  sort: number;
}

export interface MovementReasonCat extends CatItem {
  is_sale: boolean;
  is_defect: boolean;
  is_loss: boolean;
  kind: "ingreso" | "salida";
}

export interface Catalogs {
  productStates: CatItem[];
  orderStates: OrderStateCat[];
  paymentMethods: CatItem[];
  paymentStatuses: CatItem[];
  movementReasons: MovementReasonCat[];
  channels: CatItem[];
  banks: NamedItem[];
  sizes: CatItem[];
  provincias: Provincia[];
  cantones: Canton[];
  parroquias: Parroquia[];
}

// Item del carrito (localStorage)
export interface CartItem {
  id: string;
  key: string;
  productId: string;
  productName: string;
  image: string | null;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export const AVAIL: Record<AvailKey, { key: AvailKey; label: string; dot: string }> = {
  stock: { key: "stock", label: "En stock", dot: "#3f7d56" },
  pocas: { key: "pocas", label: "Pocas unidades", dot: "#b8862f" },
  agotado: { key: "agotado", label: "Agotado", dot: "#9a3b32" },
  pedido: { key: "pedido", label: "Bajo pedido", dot: "#5a7d8a" },
};

export const SIZE_PRESET = ["XS", "S", "M", "L", "XL", "XXL"];
