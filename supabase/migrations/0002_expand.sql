-- ============================================================
-- natalious · ampliación del esquema
-- slug, geografía (provincias/ciudades), catálogo de tallas,
-- razones de ingreso, roles (profiles), venta manual.
-- Aditiva: segura de ejecutar sobre 0001_init.sql.
-- ============================================================

-- ---------- productos: slug ----------
alter table products add column if not exists slug text;
update products set slug = id where slug is null or slug = '';
create unique index if not exists idx_products_slug on products(slug);

-- ---------- categorías: activo + visible en carrusel ----------
alter table categories add column if not exists active boolean default true;
alter table categories add column if not exists show_in_carousel boolean default true;

-- ---------- geografía ----------
create table if not exists provinces (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  sort int default 0
);
alter table cat_cities add column if not exists province_id uuid references provinces(id) on delete set null;

-- ---------- catálogo de tallas ----------
create table if not exists cat_sizes (
  id    text primary key,
  label text not null,
  sort  int default 0
);

-- ---------- razones de movimiento: distinguir ingreso/salida ----------
alter table cat_movement_reasons add column if not exists kind text default 'salida'; -- ingreso | salida

-- ---------- roles / profiles ----------
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text default '',
  role       text default 'admin', -- admin | staff
  created_at timestamptz default now()
);

create or replace function nat_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  -- Si no existe fila en profiles, se asume admin (única cuenta creada manualmente).
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), auth.uid() is not null);
$$;

-- Crea automáticamente el profile al registrarse un usuario de Auth.
create or replace function nat_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'admin')
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function nat_handle_new_user();

alter table profiles enable row level security;
alter table provinces enable row level security;
alter table cat_sizes enable row level security;

drop policy if exists "profiles_self_read" on profiles;
create policy "profiles_self_read" on profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_self_upsert" on profiles;
create policy "profiles_self_upsert" on profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles for update to authenticated using (id = auth.uid());

drop policy if exists "public_read_provinces" on provinces;
create policy "public_read_provinces" on provinces for select using (true);
drop policy if exists "admin_all_provinces" on provinces;
create policy "admin_all_provinces" on provinces for all to authenticated using (true) with check (true);

drop policy if exists "public_read_cat_sizes" on cat_sizes;
create policy "public_read_cat_sizes" on cat_sizes for select using (true);
drop policy if exists "admin_all_cat_sizes" on cat_sizes;
create policy "admin_all_cat_sizes" on cat_sizes for all to authenticated using (true) with check (true);

-- ============================================================
-- nat_register_movement: usa razón con etiqueta también en ingresos
-- (misma firma; reemplaza el cuerpo)
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

  v_reason_label := case
    when p_reason = 'otro' and coalesce(p_custom_reason, '') <> '' then p_custom_reason
    else coalesce((select label from cat_movement_reasons where id = p_reason), p_reason) end;

  if v_isventa then
    v_subv := v_pvu * p_qty; v_costt := v_pcu * p_qty; v_util := v_subv - v_costt;
    v_marg := case when v_subv > 0 then round(v_util / v_subv * 100) else 0 end;
  end if;

  insert into inventory_movements (fecha, kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable, precio_venta_unitario, precio_compra_unitario, subtotal_venta, costo_total, utilidad_bruta, margen_porcentaje, afecta_rotacion, cuenta_como_venta)
  values (coalesce(p_date, current_date), p_kind, coalesce(p_reason, 'otro'), v_reason_label,
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
-- nat_manual_sale: venta manual desde inventario (admin)
-- Descuenta stock por talla, cuenta como venta, guarda cliente/pago/canal.
-- ============================================================
create or replace function nat_manual_sale(
  p_product_id text, p_size text, p_color text, p_qty int, p_precio_venta numeric,
  p_cliente jsonb, p_pago jsonb, p_canal text, p_note text, p_force boolean
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pname text; v_cur int; v_next int; v_pcu numeric; v_pvu numeric;
  v_subv numeric; v_costt numeric; v_util numeric; v_marg int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'No autorizado.'); end if;
  select name into v_pname from products where id = p_product_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Selecciona un producto.'); end if;
  if coalesce(p_qty, 0) <= 0 then return jsonb_build_object('ok', false, 'error', 'Ingresa una cantidad válida.'); end if;
  if coalesce(p_canal, '') = '' then return jsonb_build_object('ok', false, 'error', 'Selecciona el canal de origen.'); end if;

  v_cur := nat_available_stock(p_product_id, p_size);
  if p_qty > v_cur and not coalesce(p_force, false) then
    return jsonb_build_object('ok', false, 'error', 'No hay stock suficiente (' || v_cur || ' disponibles).');
  end if;

  v_next := greatest(0, v_cur - p_qty);
  if p_size is null or p_size = '' then
    update products set stock_general = v_next, updated_at = now() where id = p_product_id;
  else
    update product_sizes set stock = v_next where product_id = p_product_id and name = p_size;
  end if;
  perform nat_apply_auto_state(p_product_id);

  select cost into v_pcu from product_costs where product_id = p_product_id;
  v_pcu := coalesce(v_pcu, 0);
  v_pvu := coalesce(p_precio_venta, 0);
  v_subv := v_pvu * p_qty; v_costt := v_pcu * p_qty; v_util := v_subv - v_costt;
  v_marg := case when v_subv > 0 then round(v_util / v_subv * 100) else 0 end;

  insert into inventory_movements (kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable, cliente, ciudad, canal_origen, pago, precio_venta_unitario, precio_compra_unitario, subtotal_venta, costo_total, utilidad_bruta, margen_porcentaje, afecta_rotacion, cuenta_como_venta)
  values ('salida', 'venta', 'Venta manual', 'Venta', p_product_id, v_pname,
          coalesce(nullif(p_color, ''), '—'), coalesce(nullif(p_size, ''), '—'),
          nat_sku(v_pname, p_color, p_size), p_qty, v_cur, v_next, coalesce(p_note, ''), 'Administradora',
          p_cliente, coalesce(p_cliente->>'ciudad', ''), p_canal, p_pago,
          v_pvu, v_pcu, v_subv, v_costt, v_util, v_marg, true, true);

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function nat_is_admin() to anon, authenticated;
grant execute on function nat_manual_sale(text, text, text, int, numeric, jsonb, jsonb, text, text, boolean) to authenticated;

-- ============================================================
-- Seed adicional
-- ============================================================
insert into cat_sizes (id, label, sort) values
  ('XS', 'XS', 0), ('S', 'S', 1), ('M', 'M', 2), ('L', 'L', 3), ('XL', 'XL', 4), ('XXL', 'XXL', 5)
on conflict (id) do nothing;

-- razones de ingreso
insert into cat_movement_reasons (id, label, is_sale, is_defect, is_loss, sort, kind) values
  ('compra_proveedor', 'Compra a proveedor', false, false, false, 20, 'ingreso'),
  ('ajuste_positivo', 'Ajuste positivo', false, false, false, 21, 'ingreso'),
  ('devolucion_cliente', 'Devolución de cliente', false, false, false, 22, 'ingreso'),
  ('reposicion', 'Reposición', false, false, false, 23, 'ingreso'),
  ('ingreso_otro', 'Otro ingreso', false, false, false, 24, 'ingreso')
on conflict (id) do nothing;

-- marca las razones existentes como salida (por si kind quedó null)
update cat_movement_reasons set kind = 'salida' where kind is null;

-- provincias + asignación de ciudades semilla
insert into provinces (name, sort) values
  ('Guayas', 0), ('Pichincha', 1), ('Azuay', 2), ('Manabí', 3), ('El Oro', 4), ('Tungurahua', 5), ('Imbabura', 6)
on conflict do nothing;

update cat_cities c set province_id = p.id from provinces p
  where p.name = 'Guayas' and c.name in ('Guayaquil', 'Daule', 'Durán', 'Samborondón') and c.province_id is null;
update cat_cities c set province_id = p.id from provinces p
  where p.name = 'Pichincha' and c.name = 'Quito' and c.province_id is null;
update cat_cities c set province_id = p.id from provinces p
  where p.name = 'Azuay' and c.name = 'Cuenca' and c.province_id is null;
update cat_cities c set province_id = p.id from provinces p
  where p.name = 'Manabí' and c.name = 'Manta' and c.province_id is null;
update cat_cities c set province_id = p.id from provinces p
  where p.name = 'El Oro' and c.name = 'Machala' and c.province_id is null;
update cat_cities c set province_id = p.id from provinces p
  where p.name = 'Tungurahua' and c.name = 'Ambato' and c.province_id is null;
