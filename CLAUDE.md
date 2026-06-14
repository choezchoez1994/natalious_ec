# CLAUDE.md — natalious (catálogo + panel)

Instrucciones específicas de este proyecto. Prevalecen sobre el `CLAUDE.md` global,
salvo el idioma (siempre español).

## Qué es

Tienda boutique de ropa deportiva **natalious** ("fuerte, bella y auténtica", Ecuador):
catálogo público + panel de administración. Construido a partir del diseño
*"Catálogo Natalious"* (prototipo HTML/JS) reimplementado como app real.

## Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** + estilos `nat-*` portados del diseño (`src/index.css`)
- **React Router** (rutas públicas + `/admin`)
- **Supabase**: Auth, PostgreSQL, Storage
- Sin librería de estado externa: contextos de React (`src/store/`)

## Comandos

```bash
npm run dev        # desarrollo  -> http://localhost:5173  (panel en /admin)
npm run build      # tsc -b && vite build  (a dist/)
npm run preview    # previsualiza el build
npm run typecheck  # solo chequeo de tipos (tsc -b --noEmit)
```

> **No hay suite de tests ni linter configurados** (no existe `npm test`, ESLint ni
> similar). La validación real es `npm run build`: corre `tsc -b && vite build`, así que
> compila tipos + bundle. Córrelo tras cambios no triviales antes de dar por terminado.

## Arquitectura

```
src/
  lib/        supabase client, tipos, lógica de "producto efectivo" (stock por talla),
              métricas, formato, enlaces de WhatsApp
  services/   capa de acceso a datos (1 archivo por dominio). TODA query a Supabase
              vive aquí, nunca en componentes
  store/      contextos: CatalogContext (datos), CartContext (localStorage), AuthContext (sesión + rol)
  components/ UI compartida (ImageSlot, ProductCard, carruseles, layout, formularios)
  pages/      tienda pública (Home, Catalog, ProductDetail, Cart)
  pages/admin/ panel (AdminApp + Dashboard, Orders, Inventory, ProductEditor,
               Movements, Reports, CarouselAdmin, CatalogsAdmin, Settings)
supabase/
  migrations/0001_init.sql   esquema, RLS, RPC, buckets de Storage
  migrations/0002_expand.sql slug, provincias/ciudades, tallas, roles, venta manual
  seed.sql                   datos de ejemplo
```

Patrón de datos: los componentes mutan vía `services/*` y luego llaman `reload()` del
`CatalogContext` para refrescar. El "producto efectivo" (`src/lib/effective.ts`) calcula
disponibilidad, stock total, etc., desde los datos crudos.

**Flujo de carga (un solo punto):** `fetchCatalog()` (`src/services/catalog.ts`) arma un
único objeto `CatalogData` (productos efectivos + categorías + slides + `config` +
`catalogs`). Toda la UI lo consume con `useCatalog()`. Atajos del contexto:
`publicProducts` ya filtra `active` (úsalo en vistas públicas, no `products`), y
`productById(id)` resuelve por id. Mutar con `services/*` → `reload()` para reflejar cambios.

**Estados de disponibilidad** (`effective(p).avail`, usados en toda la UI):
`stock` (disponible) · `pocas` (stock > 0 y ≤ `min_stock`) · `agotado` (stock 0 sin
backorder, o estado `inactivo`/`agotado`) · `pedido` (backorder/"bajo pedido" con stock 0).

## Reglas de negocio (no romper)

- **Stock por producto + talla.** Los colores son visuales y NO controlan stock.
- `nat_create_order` **NO descuenta stock**: solo crea la orden (RPC pública). El descuento
  ocurre al pasar la orden a **Enviado** (`nat_update_order_state`) o en una **venta manual**
  (`nat_manual_sale`). Cancelar una orden enviada **revierte** el stock.
- Si una talla llega a 0 queda agotada; si todas llegan a 0, el producto se marca agotado.
- **Datos sensibles fuera de vistas públicas:** el costo de compra (`product_costs`) está
  restringido por RLS a usuarios autenticados — nunca lo muestres en público. El precio
  mayorista (`mayor`) tampoco va en la tienda pública (solo retail/promo).
- Cada cambio de stock genera un movimiento en el Kardex (no editar stock sin movimiento).
- Las operaciones que afectan inventario son **RPCs** (`nat_create_order`,
  `nat_update_order_state`, `nat_register_movement`, `nat_adjust_stock`, `nat_manual_sale`).

## Convenciones

- **Código y UI en español** (nombres, textos, comentarios, mensajes de commit).
- Estilos: clases `nat-*` del diseño + Tailwind para utilidades. Paleta base `#ffe0ff`,
  tipografías Bodoni Moda + Hanken Grotesk. Tarjetas de producto con fondo blanco suave.
- No dejar placeholders tipo "browse files" en vistas públicas.
- Mantén la capa de servicios limpia: nada de `supabase.from(...)` dentro de componentes.

## Supabase

- Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (o `_ANON_KEY`) en `.env`
  (ignorado por git). Ver `.env.example`.
- Ejecutar migraciones en el **SQL Editor** del panel en orden: `0001` → `seed.sql` → `0002`.
- Proyecto actual: `hamychstgaobyhnzmrsb`. Buckets: `product-images`, `carousel-images`,
  `category-images`.
- Admin: cuentas se crean en Authentication → Users (Auto Confirm). Registros públicos
  desactivados. El panel `/admin` exige rol `admin` (tabla `profiles`, asignado por trigger).

## Git / commits

- Mensajes en español, formato `tipo: descripción` (feat, fix, refactor, docs, chore).
- **NO** agregar `Co-Authored-By` en los commits (preferencia del usuario).
- Nunca commitear `.env`.
