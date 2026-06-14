# natalious · Catálogo + Panel

Tienda boutique de ropa deportiva (athleisure) **fuerte, bella y auténtica**, hecha en
Ecuador. Catálogo público + panel de administración construido sobre el diseño
*“Catálogo Natalious”*.

**Stack:** React + TypeScript + Vite + Tailwind CSS + React Router + Supabase
(Auth · PostgreSQL · Storage).

---

## ✨ Funcionalidades

### Tienda pública
- **Inicio** con carrusel principal (autoplay, flechas, puntos y swipe en móvil),
  barra de confianza, destacados y accesos por categoría.
- **Catálogo** con filtro por categoría.
- **Categorías** con carrusel de tarjetas grandes (imágenes por categoría).
- **Detalle de producto**: galería con lightbox, selección de color y talla, tabla de
  medidas, stock por talla y botón “Agregar al carrito”. El **costo de compra nunca se
  muestra** en el catálogo público.
- **Carrito** (persistente en `localStorage`) → **checkout** con datos del cliente y de
  pago → **generación de orden**.
- Botón de **carrito** en la cabecera (reemplaza al de WhatsApp). WhatsApp queda como
  **contacto secundario** en el footer y en la ficha de producto.

### Panel de administración (`/admin`, con login de Supabase Auth)
- **Resumen**: KPIs, alertas de stock, unidades por categoría, valor de inventario.
- **Órdenes**: detalle del cliente, datos de pago, productos e historial. Cambiar el
  estado a **Enviado descuenta el inventario por talla** y registra la venta;
  **Cancelar** una orden enviada **revierte** el stock.
- **Inventario**: lista, búsqueda, filtros y editor de producto (slug, precios, costo,
  **márgenes estimados** normal/promo/mayor, imágenes en Storage, **stock por talla**,
  colores como opciones visuales, tabla de medidas, destacado, bajo pedido,
  activo/inactivo).
- **Movimientos (Kardex)**: ingresos (compra, ajuste, devolución, reposición…), salidas
  no-venta (daño, merma, pérdida…) y **venta manual** desde inventario con datos de
  cliente, ciudad, canal y pago.
- **Reportes**: órdenes por ciudad/canal, ventas por forma de pago (transferencia/
  efectivo), pagos pendientes, más vendidos, sell-through, ventas por variante/color/
  talla, salidas por motivo, ingresos y utilidad.
- **Carrusel**: diapositivas del hero (destino producto/categoría/carrito/URL/WhatsApp) +
  imágenes del carrusel de categorías.
- **Catálogos configurables**: estados de producto y de orden, métodos y estados de
  pago, motivos de movimiento (ingreso/salida), canales, tallas, provincias, ciudades
  (con provincia) y bancos.
- **Ajustes**: WhatsApp (número, plantillas, vista previa de chat), redes y gestión
  completa de **categorías** (crear, orden, activa, visible en carrusel, nº de productos).

### Roles
- Autenticación con Supabase Auth. La tabla `profiles` guarda el rol (`admin`); el panel
  `/admin` está protegido y exige rol de administradora. Mantén desactivados los registros
  públicos para que solo las cuentas que crees manualmente accedan.

### Reglas de negocio implementadas
- Flujo de compra: **producto → carrito → datos del cliente → generar orden → panel →
  gestionar estado → afectar inventario**.
- El inventario se descuenta **solo** al pasar una orden a **Enviado** o al registrar
  una **venta manual** desde Movimientos.
- Stock gestionado por **producto + talla**. Los **colores son seleccionables y se
  guardan en la orden, pero no controlan stock**.
- Si una talla llega a 0 queda agotada; si **todas** las tallas llegan a 0, el producto
  se marca **agotado** automáticamente.

---

## 🚀 Puesta en marcha

### 1. Requisitos
- Node 18+ (probado con Node 22)
- Una cuenta de [Supabase](https://supabase.com) y un proyecto creado.

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar la base de datos (Supabase)
En el panel de Supabase → **SQL Editor**, ejecuta **en este orden**:

1. `supabase/migrations/0001_init.sql` — tablas, funciones (RPC), RLS y buckets de Storage.
2. `supabase/seed.sql` — catálogos, categorías, productos de ejemplo y configuración.
3. `supabase/migrations/0002_expand.sql` — slug, provincias/ciudades, catálogo de tallas,
   razones de ingreso, roles (`profiles`) y la función de **venta manual**.

> El orden importa: `0002` se apoya en los datos creados por `seed.sql` (asocia ciudades a
> provincias y completa los `slug`).
>
> Los buckets `product-images`, `carousel-images` y `category-images` se crean y se hacen
> públicos automáticamente desde la migración `0001`.

### 4. Crear la cuenta de administradora
En Supabase → **Authentication → Users → Add user**, crea un usuario con correo y
contraseña. Con ese correo entrarás al panel en `/admin`. Un *trigger* crea
automáticamente su fila en `profiles` con rol `admin`.

> **Seguridad:** cualquier usuario *autenticado* tiene permisos de administración (RLS
> `to authenticated`). En **Authentication → Providers → Email**, **desactiva los
> registros públicos (“Enable signups”)** para que solo las cuentas que crees
> manualmente puedan iniciar sesión.

### 5. Variables de entorno
```bash
cp .env.example .env
```
Completa con los datos de **Settings → API** de tu proyecto:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

### 6. Ejecutar
```bash
npm run dev       # desarrollo (http://localhost:5173)
npm run build     # build de producción
npm run preview   # previsualizar el build
```

---

## 🗂️ Estructura

```
supabase/
  migrations/0001_init.sql   Esquema, RPC, RLS, Storage
  seed.sql                   Datos de ejemplo
src/
  lib/         supabase client, tipos, lógica de producto efectivo (stock por talla),
               métricas, formato, enlaces de WhatsApp
  services/    acceso a datos (productos, órdenes, inventario, carrusel, catálogos,
               ajustes, storage)
  store/       contextos React (CatalogContext, CartContext, AuthContext)
  components/  UI compartida (ImageSlot, ProductCard, carruseles, layout, formularios)
  pages/       tienda pública (Home, Catalog, ProductDetail, Cart)
  pages/admin/ panel (AdminApp + Dashboard, Orders, Inventory, ProductEditor,
               Movements, Reports, CarouselAdmin, CatalogsAdmin, Settings)
```

---

## 🔐 Notas sobre seguridad / RLS

- **Lectura pública** (anon): productos, tallas, colores, imágenes, categorías,
  carrusel, tablas de medidas, configuración y catálogos (para el checkout).
- **El costo de compra** vive en la tabla `product_costs`, accesible **solo para
  usuarios autenticados** — nunca se expone al catálogo público.
- Las **órdenes se crean** mediante la función `nat_create_order` (`SECURITY DEFINER`),
  por lo que el cliente anónimo nunca escribe directamente en las tablas ni puede leer
  órdenes ajenas.
- Las operaciones que **afectan inventario** (`nat_update_order_state`,
  `nat_register_movement`, `nat_adjust_stock`) exigen sesión autenticada.

---

## 📝 Notas de implementación

- El diseño original (prototipo HTML/JS) usaba un stock general simplificado. Esta
  implementación sigue el requerimiento explícito de **stock por talla** y mueve el
  costo a una tabla aparte para protegerlo. El aspecto visual se mantiene fiel al diseño
  *“Catálogo Natalious”* (paleta `#ffe0ff`, tipografías Bodoni Moda + Hanken Grotesk,
  tarjetas de producto con fondo blanco suave, carruseles de imágenes grandes).
- El carrito vive en `localStorage`; las órdenes y el inventario viven en Supabase.
