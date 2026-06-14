-- ============================================================
-- natalious · esquema inicial
-- Catálogo boutique + panel admin. Stock por producto + talla.
-- Los colores son visuales (no controlan stock).
-- El costo de compra vive en una tabla aparte, solo visible para admin.
-- ============================================================

-- ----------------------------------------------------------------
-- Catálogos configurables
-- ----------------------------------------------------------------
create table if not exists cat_product_states (
  id    text primary key,
  label text not null,
  sort  int default 0
);

create table if not exists cat_order_states (
  id    text primary key,
  label text not null,
  color text default '#666',
  bg    text default 'rgba(0,0,0,0.08)',
  sort  int default 0
);

create table if not exists cat_payment_methods (
  id    text primary key,
  label text not null,
  sort  int default 0
);

create table if not exists cat_payment_statuses (
  id    text primary key,
  label text not null,
  sort  int default 0
);

create table if not exists cat_movement_reasons (
  id        text primary key,
  label     text not null,
  is_sale   boolean default false,
  is_defect boolean default false,
  is_loss   boolean default false,
  sort      int default 0
);

create table if not exists cat_channels (
  id    text primary key,
  label text not null,
  sort  int default 0
);

create table if not exists cat_cities (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  sort int default 0
);

create table if not exists cat_banks (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  sort int default 0
);

-- ----------------------------------------------------------------
-- Categorías (con imagen para el carrusel de categorías)
-- ----------------------------------------------------------------
create table if not exists categories (
  id         text primary key,
  name       text not null,
  tagline    text default '',
  image_url  text,
  image_path text,
  sort       int default 0
);

-- ----------------------------------------------------------------
-- Productos
-- ----------------------------------------------------------------
create table if not exists products (
  id            text primary key default gen_random_uuid()::text,
  name          text not null default 'Nuevo producto',
  category_id   text references categories(id) on delete set null,
  short_desc    text default '',
  long_desc     text default '',
  price         numeric(10,2) default 0,
  promo         numeric(10,2),
  mayor         numeric(10,2),
  featured      boolean default false,
  state         text default 'disponible',
  backorder     boolean default false,
  min_stock     int default 6,
  stock_general int default 0,            -- usado solo si el producto no tiene tallas
  charts        text[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Costo de compra: SEPARADO para que nunca llegue al catálogo público.
create table if not exists product_costs (
  product_id text primary key references products(id) on delete cascade,
  cost       numeric(10,2) default 0
);

-- Stock por TALLA (núcleo del inventario)
create table if not exists product_sizes (
  id         uuid primary key default gen_random_uuid(),
  product_id text references products(id) on delete cascade,
  name       text not null,
  stock      int not null default 0,
  blocked    boolean default false,
  reason     text default '',
  sort       int default 0,
  unique (product_id, name)
);

-- Colores (opciones visuales, sin stock)
create table if not exists product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id text references products(id) on delete cascade,
  name       text not null,
  hex        text default '#999999',
  blocked    boolean default false,
  reason     text default '',
  sort       int default 0,
  unique (product_id, name)
);

-- Imágenes (Supabase Storage: bucket product-images)
create table if not exists product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   text references products(id) on delete cascade,
  url          text,
  storage_path text,
  is_principal boolean default false,
  sort         int default 0,
  created_at   timestamptz default now()
);

-- Tablas de medidas (globales, configurables)
create table if not exists size_charts (
  key   text primary key,
  title text not null,
  cols  jsonb not null default '[]',
  rows  jsonb not null default '[]',
  sort  int default 0
);

-- Carrusel principal (bucket carousel-images)
create table if not exists slides (
  id         uuid primary key default gen_random_uuid(),
  active     boolean default true,
  sort       int default 0,
  image_url  text,
  image_path text,
  title      text default '',
  subtitle   text default '',
  cta_label  text default 'Ver más',
  link_type  text default 'none',   -- producto | categoria | whatsapp | none
  link_value text default '',
  start_date date,
  end_date   date
);

-- Configuración general (singleton): carrusel, whatsapp, redes
create table if not exists app_config (
  id       int primary key default 1,
  carousel jsonb default '{"autoplay":true,"intervalSec":5}'::jsonb,
  wa       jsonb default '{}'::jsonb,
  social   jsonb default '{}'::jsonb,
  constraint app_config_single check (id = 1)
);

-- ----------------------------------------------------------------
-- Órdenes
-- ----------------------------------------------------------------
create sequence if not exists nat_order_seq start 1;

create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  numero_orden        text unique,
  fecha               date default current_date,
  cliente             jsonb not null,
  canal_origen        text default 'Sitio web / carrito',
  pago                jsonb default '{}'::jsonb,
  subtotal            numeric(10,2) default 0,
  total               numeric(10,2) default 0,
  estado              text default 'Pendiente',
  observacion_interna text default '',
  created_at          timestamptz default now()
);

create table if not exists order_items (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid references orders(id) on delete cascade,
  product_id             text,
  product_name           text,
  image_url              text,
  talla                  text default '',
  color                  text default '',
  cantidad               int not null,
  precio_unitario        numeric(10,2) not null,
  precio_compra_unitario numeric(10,2) default 0,
  subtotal               numeric(10,2) not null
);

create table if not exists order_history (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references orders(id) on delete cascade,
  fecha           date default current_date,
  estado_anterior text,
  estado_nuevo    text,
  usuario         text,
  observacion     text default '',
  created_at      timestamptz default now()
);

-- ----------------------------------------------------------------
-- Movimientos de inventario (Kardex)
-- ----------------------------------------------------------------
create table if not exists inventory_movements (
  id                     uuid primary key default gen_random_uuid(),
  ts                     timestamptz default now(),
  fecha                  date default current_date,
  kind                   text not null,        -- ingreso | salida
  reason                 text,
  reason_label           text,
  clasificacion          text,                 -- Venta | Baja/Salida | Ingreso
  product_id             text,
  product_name           text,
  color                  text default '—',
  size                   text default '—',
  sku                    text,
  qty                    int not null,
  prev                   int,
  next                   int,
  note                   text default '',
  responsable            text default 'Administradora',
  cliente                jsonb,
  ciudad                 text default '',
  canal_origen           text default '',
  pago                   jsonb,
  order_id               uuid,
  numero_orden           text,
  precio_venta_unitario  numeric(10,2),
  precio_compra_unitario numeric(10,2),
  subtotal_venta         numeric(10,2),
  costo_total            numeric(10,2),
  utilidad_bruta         numeric(10,2),
  margen_porcentaje      int,
  afecta_rotacion        boolean default false,
  cuenta_como_venta      boolean default false
);

create index if not exists idx_product_sizes_product on product_sizes(product_id);
create index if not exists idx_product_colors_product on product_colors(product_id);
create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_history_order on order_history(order_id);
create index if not exists idx_movements_product on inventory_movements(product_id);

-- ============================================================
-- Funciones auxiliares
-- ============================================================
create or replace function nat_sku(p_name text, p_color text, p_size text)
returns text language sql immutable as $$
  select upper(coalesce(nullif(left(regexp_replace(coalesce(p_name,''), '[^a-zA-Z0-9]', '', 'g'), 3), ''), 'NAT'))
      || '-' || upper(coalesce(nullif(left(regexp_replace(coalesce(p_color,''), '[^a-zA-Z0-9]', '', 'g'), 3), ''), 'U'))
      || '-' || coalesce(nullif(p_size, ''), 'U');
$$;

create or replace function nat_product_total_stock(p_pid text)
returns int language sql stable as $$
  select case
    when exists (select 1 from product_sizes where product_id = p_pid)
      then coalesce((select sum(stock) from product_sizes where product_id = p_pid), 0)
    else coalesce((select stock_general from products where id = p_pid), 0)
  end;
$$;

create or replace function nat_available_stock(p_pid text, p_talla text)
returns int language sql stable as $$
  select case
    when p_talla is null or p_talla = ''
      then coalesce((select stock_general from products where id = p_pid), 0)
    else coalesce((select stock from product_sizes where product_id = p_pid and name = p_talla), 0)
  end;
$$;

-- Regla: si todas las tallas llegan a 0, el producto pasa a "agotado".
create or replace function nat_apply_auto_state(p_pid text)
returns void language plpgsql as $$
declare v_total int; v_state text;
begin
  select state into v_state from products where id = p_pid;
  if v_state is null or v_state in ('inactivo', 'bajo pedido') then return; end if;
  v_total := nat_product_total_stock(p_pid);
  if v_total <= 0 then
    update products set state = 'agotado', updated_at = now() where id = p_pid;
  elsif v_state = 'agotado' then
    update products set state = 'disponible', updated_at = now() where id = p_pid;
  end if;
end;
$$;

-- ============================================================
-- RPC: generar orden (pública, no descuenta stock)
-- ============================================================
create or replace function nat_create_order(p_cliente jsonb, p_pago jsonb, p_canal text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_pid text; v_talla text; v_qty int;
  v_total numeric := 0; v_order_id uuid; v_numero text;
  v_cost numeric; v_subtotal numeric; v_backorder boolean; v_avail int;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Tu carrito está vacío.');
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := v_item->>'productId';
    v_talla := coalesce(v_item->>'talla', '');
    v_qty := (v_item->>'cantidad')::int;
    select backorder into v_backorder from products where id = v_pid;
    if not coalesce(v_backorder, false) then
      v_avail := nat_available_stock(v_pid, v_talla);
      if v_avail < v_qty then
        return jsonb_build_object('ok', false, 'error',
          'Sin stock suficiente de ' || coalesce(v_item->>'productName', 'un producto') || '.');
      end if;
    end if;
  end loop;

  v_numero := 'NAT-' || lpad(nextval('nat_order_seq')::text, 4, '0');
  insert into orders (numero_orden, cliente, canal_origen, pago, estado)
    values (v_numero, p_cliente, coalesce(p_canal, 'Sitio web / carrito'), coalesce(p_pago, '{}'::jsonb), 'Pendiente')
    returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := v_item->>'productId';
    v_qty := (v_item->>'cantidad')::int;
    v_subtotal := (v_item->>'precioUnitario')::numeric * v_qty;
    select cost into v_cost from product_costs where product_id = v_pid;
    insert into order_items (order_id, product_id, product_name, image_url, talla, color, cantidad, precio_unitario, precio_compra_unitario, subtotal)
      values (v_order_id, v_pid, v_item->>'productName', v_item->>'image',
              coalesce(v_item->>'talla', ''), coalesce(v_item->>'color', ''),
              v_qty, (v_item->>'precioUnitario')::numeric, coalesce(v_cost, 0), v_subtotal);
    v_total := v_total + v_subtotal;
  end loop;

  update orders set subtotal = v_total, total = v_total where id = v_order_id;
  insert into order_history (order_id, estado_anterior, estado_nuevo, usuario, observacion)
    values (v_order_id, '', 'Pendiente', 'Cliente', 'Orden generada');

  return jsonb_build_object('ok', true, 'numero', v_numero, 'orderId', v_order_id);
end;
$$;

-- ============================================================
-- RPC: cambiar estado de orden (admin) — afecta inventario en "Enviado"
-- ============================================================
create or replace function nat_update_order_state(p_order_id uuid, p_new_state text, p_obs text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prev text; v_o orders%rowtype; v_it order_items%rowtype;
  v_cur int; v_next int; v_costu numeric; v_subv numeric; v_costt numeric; v_util numeric; v_marg int; v_pvu numeric;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'No autorizado.'); end if;
  select * into v_o from orders where id = p_order_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Orden no encontrada.'); end if;
  v_prev := v_o.estado;
  if p_new_state = v_prev then return jsonb_build_object('ok', true); end if;

  if p_new_state = 'Enviado' and v_prev <> 'Enviado' then
    for v_it in select * from order_items where order_id = p_order_id loop
      if nat_available_stock(v_it.product_id, v_it.talla) < v_it.cantidad
         and not coalesce((select backorder from products where id = v_it.product_id), false) then
        return jsonb_build_object('ok', false, 'error', 'Sin stock suficiente para enviar (' || v_it.product_name || ').');
      end if;
    end loop;

    for v_it in select * from order_items where order_id = p_order_id loop
      v_cur := nat_available_stock(v_it.product_id, v_it.talla);
      v_next := greatest(0, v_cur - v_it.cantidad);
      if v_it.talla is null or v_it.talla = '' then
        update products set stock_general = v_next, updated_at = now() where id = v_it.product_id;
      else
        update product_sizes set stock = v_next where product_id = v_it.product_id and name = v_it.talla;
      end if;
      perform nat_apply_auto_state(v_it.product_id);

      v_pvu := v_it.precio_unitario; v_costu := coalesce(v_it.precio_compra_unitario, 0);
      v_subv := v_pvu * v_it.cantidad; v_costt := v_costu * v_it.cantidad; v_util := v_subv - v_costt;
      v_marg := case when v_subv > 0 then round(v_util / v_subv * 100) else 0 end;

      insert into inventory_movements (kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable, cliente, ciudad, canal_origen, pago, order_id, numero_orden, precio_venta_unitario, precio_compra_unitario, subtotal_venta, costo_total, utilidad_bruta, margen_porcentaje, afecta_rotacion, cuenta_como_venta)
      values ('salida', 'venta', 'Venta por orden', 'Venta', v_it.product_id, v_it.product_name,
              coalesce(nullif(v_it.color, ''), '—'), coalesce(nullif(v_it.talla, ''), '—'),
              nat_sku(v_it.product_name, v_it.color, v_it.talla), v_it.cantidad, v_cur, v_next,
              'Orden ' || v_o.numero_orden, 'Administradora', v_o.cliente, coalesce(v_o.cliente->>'ciudad', ''),
              v_o.canal_origen, v_o.pago, v_o.id, v_o.numero_orden, v_pvu, v_costu, v_subv, v_costt, v_util, v_marg, true, true);
    end loop;
  end if;

  if p_new_state = 'Cancelado' and v_prev = 'Enviado' then
    for v_it in select * from order_items where order_id = p_order_id loop
      v_cur := nat_available_stock(v_it.product_id, v_it.talla);
      v_next := v_cur + v_it.cantidad;
      if v_it.talla is null or v_it.talla = '' then
        update products set stock_general = v_next, updated_at = now() where id = v_it.product_id;
      else
        update product_sizes set stock = v_next where product_id = v_it.product_id and name = v_it.talla;
      end if;
      perform nat_apply_auto_state(v_it.product_id);
      insert into inventory_movements (kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable, order_id, numero_orden)
      values ('ingreso', 'reverso', 'Reverso de orden', 'Ingreso', v_it.product_id, v_it.product_name,
              coalesce(nullif(v_it.color, ''), '—'), coalesce(nullif(v_it.talla, ''), '—'),
              nat_sku(v_it.product_name, v_it.color, v_it.talla), v_it.cantidad, v_cur, v_next,
              'Reverso orden ' || v_o.numero_orden, 'Administradora', v_o.id, v_o.numero_orden);
    end loop;
  end if;

  update orders set estado = p_new_state, observacion_interna = coalesce(p_obs, observacion_interna) where id = p_order_id;
  insert into order_history (order_id, estado_anterior, estado_nuevo, usuario, observacion)
    values (p_order_id, v_prev, p_new_state, 'Administradora', coalesce(p_obs, ''));
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- RPC: registrar movimiento manual (admin)
-- ============================================================
create or replace function nat_register_movement(
  p_product_id text, p_kind text, p_qty int, p_reason text, p_custom_reason text,
  p_color text, p_size text, p_date date, p_note text, p_responsable text, p_force boolean
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pname text; v_cur int; v_next int; v_isventa boolean;
  v_pvu numeric; v_pcu numeric; v_subv numeric; v_costt numeric; v_util numeric; v_marg int;
  v_reason_label text;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'No autorizado.'); end if;
  select name into v_pname from products where id = p_product_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Selecciona un producto.'); end if;
  if coalesce(p_qty, 0) <= 0 then return jsonb_build_object('ok', false, 'error', 'Ingresa una cantidad válida.'); end if;

  v_cur := nat_available_stock(p_product_id, p_size);
  if p_kind = 'salida' and p_qty > v_cur and not coalesce(p_force, false) then
    return jsonb_build_object('ok', false, 'error',
      'No hay stock suficiente (' || v_cur || ' disponibles). Marca ajuste autorizado para forzar.');
  end if;

  v_next := case when p_kind = 'salida' then greatest(0, v_cur - p_qty) else v_cur + p_qty end;
  if p_size is null or p_size = '' then
    update products set stock_general = v_next, updated_at = now() where id = p_product_id;
  else
    update product_sizes set stock = v_next where product_id = p_product_id and name = p_size;
  end if;
  perform nat_apply_auto_state(p_product_id);

  v_isventa := (p_kind = 'salida' and p_reason = 'venta');
  select cost into v_pcu from product_costs where product_id = p_product_id;
  v_pcu := coalesce(v_pcu, 0);
  select coalesce(case when promo is not null and promo > 0 and promo < price then promo else price end, 0)
    into v_pvu from products where id = p_product_id;

  if p_kind = 'salida' then
    v_reason_label := case when p_reason = 'otro' and coalesce(p_custom_reason, '') <> '' then p_custom_reason
      else coalesce((select label from cat_movement_reasons where id = p_reason), p_reason) end;
  else
    v_reason_label := 'Ingreso';
  end if;

  if v_isventa then
    v_subv := v_pvu * p_qty; v_costt := v_pcu * p_qty; v_util := v_subv - v_costt;
    v_marg := case when v_subv > 0 then round(v_util / v_subv * 100) else 0 end;
  end if;

  insert into inventory_movements (fecha, kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable, precio_venta_unitario, precio_compra_unitario, subtotal_venta, costo_total, utilidad_bruta, margen_porcentaje, afecta_rotacion, cuenta_como_venta)
  values (coalesce(p_date, current_date), p_kind,
          case when p_kind = 'salida' then coalesce(p_reason, 'otro') else 'ingreso' end,
          v_reason_label,
          case when v_isventa then 'Venta' when p_kind = 'salida' then 'Baja/Salida' else 'Ingreso' end,
          p_product_id, v_pname, coalesce(nullif(p_color, ''), '—'), coalesce(nullif(p_size, ''), '—'),
          nat_sku(v_pname, p_color, p_size), p_qty, v_cur, v_next, coalesce(p_note, ''), coalesce(p_responsable, 'Administradora'),
          case when v_isventa then v_pvu end, case when v_isventa then v_pcu end,
          case when v_isventa then v_subv end, case when v_isventa then v_costt end,
          case when v_isventa then v_util end, case when v_isventa then v_marg end,
          v_isventa, v_isventa);

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- RPC: ajustar stock de una talla a un valor exacto (admin)
-- ============================================================
create or replace function nat_adjust_stock(p_product_id text, p_size text, p_new_stock int, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pname text; v_cur int; v_new int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'No autorizado.'); end if;
  select name into v_pname from products where id = p_product_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Producto no encontrado.'); end if;
  v_new := greatest(0, coalesce(p_new_stock, 0));
  v_cur := nat_available_stock(p_product_id, p_size);
  if v_new = v_cur then return jsonb_build_object('ok', true); end if;

  if p_size is null or p_size = '' then
    update products set stock_general = v_new, updated_at = now() where id = p_product_id;
  else
    update product_sizes set stock = v_new where product_id = p_product_id and name = p_size;
  end if;
  perform nat_apply_auto_state(p_product_id);

  insert into inventory_movements (kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable)
  values (case when v_new > v_cur then 'ingreso' else 'salida' end, 'ajuste', 'Ajuste de stock', 'Ingreso',
          p_product_id, v_pname, '—', coalesce(nullif(p_size, ''), '—'), nat_sku(v_pname, '', p_size),
          abs(v_new - v_cur), v_cur, v_new, coalesce(p_note, 'Ajuste manual'), 'Administradora');
  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table cat_product_states   enable row level security;
alter table cat_order_states     enable row level security;
alter table cat_payment_methods  enable row level security;
alter table cat_payment_statuses enable row level security;
alter table cat_movement_reasons enable row level security;
alter table cat_channels         enable row level security;
alter table cat_cities           enable row level security;
alter table cat_banks            enable row level security;
alter table categories           enable row level security;
alter table products             enable row level security;
alter table product_costs        enable row level security;
alter table product_sizes        enable row level security;
alter table product_colors       enable row level security;
alter table product_images       enable row level security;
alter table size_charts          enable row level security;
alter table slides               enable row level security;
alter table app_config           enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_history        enable row level security;
alter table inventory_movements  enable row level security;

-- Lectura pública (anon + authenticated)
do $$
declare t text;
begin
  foreach t in array array[
    'cat_product_states','cat_order_states','cat_payment_methods','cat_payment_statuses',
    'cat_movement_reasons','cat_channels','cat_cities','cat_banks',
    'categories','products','product_sizes','product_colors','product_images',
    'size_charts','slides','app_config'
  ] loop
    execute format('drop policy if exists "public_read_%1$s" on %1$s;', t);
    execute format('create policy "public_read_%1$s" on %1$s for select using (true);', t);
    execute format('drop policy if exists "admin_all_%1$s" on %1$s;', t);
    execute format('create policy "admin_all_%1$s" on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- product_costs: SOLO admin (nunca público)
drop policy if exists "admin_all_product_costs" on product_costs;
create policy "admin_all_product_costs" on product_costs for all to authenticated using (true) with check (true);

-- Órdenes: el público NO puede leer; solo se crean vía RPC. Admin lee/gestiona todo.
drop policy if exists "admin_all_orders" on orders;
create policy "admin_all_orders" on orders for all to authenticated using (true) with check (true);
drop policy if exists "admin_all_order_items" on order_items;
create policy "admin_all_order_items" on order_items for all to authenticated using (true) with check (true);
drop policy if exists "admin_all_order_history" on order_history;
create policy "admin_all_order_history" on order_history for all to authenticated using (true) with check (true);

-- Movimientos: solo admin
drop policy if exists "admin_all_inventory_movements" on inventory_movements;
create policy "admin_all_inventory_movements" on inventory_movements for all to authenticated using (true) with check (true);

-- Permisos de ejecución de RPCs
grant execute on function nat_create_order(jsonb, jsonb, text, jsonb) to anon, authenticated;
grant execute on function nat_update_order_state(uuid, text, text) to authenticated;
grant execute on function nat_register_movement(text, text, int, text, text, text, text, date, text, text, boolean) to authenticated;
grant execute on function nat_adjust_stock(text, text, int, text) to authenticated;

-- ============================================================
-- Storage buckets (públicos para lectura; escritura solo admin)
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true),
         ('carousel-images', 'carousel-images', true),
         ('category-images', 'category-images', true)
  on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['product-images', 'carousel-images', 'category-images'] loop
    execute format('drop policy if exists "read_%1$s" on storage.objects;', b);
    execute format($p$create policy "read_%1$s" on storage.objects for select using (bucket_id = '%1$s');$p$, b);
    execute format('drop policy if exists "write_%1$s" on storage.objects;', b);
    execute format($p$create policy "write_%1$s" on storage.objects for insert to authenticated with check (bucket_id = '%1$s');$p$, b);
    execute format('drop policy if exists "update_%1$s" on storage.objects;', b);
    execute format($p$create policy "update_%1$s" on storage.objects for update to authenticated using (bucket_id = '%1$s');$p$, b);
    execute format('drop policy if exists "delete_%1$s" on storage.objects;', b);
    execute format($p$create policy "delete_%1$s" on storage.objects for delete to authenticated using (bucket_id = '%1$s');$p$, b);
  end loop;
end $$;
