# Ambiente de desarrollo — natalious

Guía para montar un **Supabase de desarrollo en la nube** (separado de producción)
y correr la app localmente contra él. Así puedes probar cambios de esquema, RPCs e
inventario sin tocar los datos reales.

> Producción sigue intacta. El frontend usa `.env.development` en `npm run dev` y
> `.env` (producción) en `npm run build`, así no se mezclan.

---

## 1. Crear el proyecto Supabase de desarrollo

1. Entra a <https://supabase.com/dashboard> → **New project** (ej. nombre `natalious-dev`).
2. Elige región y una contraseña de base de datos. Espera a que termine de aprovisionar.
3. En **Settings → API** copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Configurar el frontend

```bash
cd natalious_ec
cp .env.development.example .env.development   # y completa URL + anon key del proyecto DEV
npm install
```

`.env.development` está ignorado por git (no se commitea). En `npm run dev` Vite usa
ese archivo; en `npm run build` usa `.env` (producción).

## 3. Inicializar la base de datos (SQL Editor del proyecto DEV)

En el **SQL Editor** del proyecto de desarrollo, abre y ejecuta **en este orden**
(cada archivo está en `supabase/migrations/` salvo `seed.sql` en `supabase/`):

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `migrations/0001_init.sql` | Tablas base, RLS, RPCs, buckets de Storage |
| 2 | `migrations/0002_expand.sql` | slug, tallas, roles, catálogos (tallas, motivos) |
| 3 | `migrations/0003_geo_envio.sql` | Tablas de geografía (DPA) |
| 4 | `migrations/0003b_dpa_data.sql` | Datos DPA (provincias/cantones/parroquias) |
| 5 | `migrations/0004_tienda_entrega.sql` | Config de tienda y entrega |
| 6 | `migrations/0005_clientes.sql` | Tabla y RPCs de clientes |
| 7 | `migrations/0006_stock_por_color.sql` | **Stock por color + talla** + galería por color |
| 8 | `supabase/seed.sql` | Catálogos, app_config, tablas de medidas, slides, categorías base |
| 9 | `migrations/dev_seed_inventario.sql` | **Inventario real del Excel** (reemplaza los productos de ejemplo del seed) |

> El paso 8 (`seed.sql`) también inserta productos de ejemplo; el paso 9 los borra y
> carga el catálogo real (41 productos, variantes color+talla). Mantén el orden.

Verifica al final:

```sql
select count(*) productos, (select count(*) from product_sizes) variantes,
       (select coalesce(sum(stock),0) from product_sizes) stock_total
from products;
-- esperado: 41 productos, 412 variantes, 451 unidades
```

## 4. Crear la cuenta de administradora

1. **Authentication → Users → Add user** (marca **Auto Confirm User**).
   Usa un correo/clave de prueba.
2. El trigger de `profiles` asigna el rol automáticamente. Si el panel `/admin` dice
   "Sin permisos", asígnalo a mano:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'TU-CORREO-DEV');
```

## 5. Levantar la app

```bash
npm run dev        # http://localhost:5173  (panel en /admin)
```

Inicia sesión en `/admin` con la cuenta del paso 4.

## 6. (Opcional) Chat IA — Edge Function

Si quieres probar el Chat IA en dev, despliega la función y su secret en el proyecto DEV:

```bash
supabase link --project-ref <ref-del-proyecto-dev>
supabase secrets set GROQ_API_KEY=gsk_...        # clave de https://console.groq.com/keys
supabase functions deploy chat-ia
```

---

## Notas

- **Regenerar el inventario de dev** desde el Excel (si lo actualizas):
  `cd Migracion && python gen_dev_seed.py` → regenera `dev_seed_inventario.sql`. Vuelve a
  correr ese script (hace `delete from products` y recarga).
- **No** subas `.env.development` (lleva llaves). Solo se versiona `.env.development.example`.
- El script de dev usa los **mismos `product_id`** que producción, para que las pruebas
  sean comparables entre entornos.
- Buckets de Storage (`product-images`, `carousel-images`, `category-images`) se crean en
  `0001_init.sql`; si subes imágenes en dev, quedan en el Storage del proyecto DEV.
