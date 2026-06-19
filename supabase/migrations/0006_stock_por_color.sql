-- ============================================================
-- 0006_stock_por_color.sql
-- Migra el inventario de "stock por talla" a "stock por COLOR + TALLA".
--   Cada fila de product_sizes pasa a ser una VARIANTE: (product_id, color, talla).
--   color = ''  -> producto sin colores (legacy / compatibilidad).
-- Galería de imágenes por color: product_images.color ('' = imagen general/fallback).
-- IDEMPOTENTE y TRANSACCIONAL. Ejecutar DESPUÉS de 0005_clientes.sql,
--   y ANTES del script de datos 0007_data_excel.sql.
-- Las 86 filas actuales de product_sizes quedan con color='' (las reemplaza
--   producto a producto el script de datos del Excel, preservando el total).
-- ============================================================
begin;

-- ----------------------------------------------------------------
-- 1) product_sizes: añadir color y mover el unique a (product_id, color, name)
-- ----------------------------------------------------------------
alter table product_sizes
  add column if not exists color text not null default '';

-- El unique viejo (product_id, name) impide dos tallas iguales en colores distintos.
-- Nombre generado por "unique (product_id, name)" = product_sizes_product_id_name_key.
-- (Si en tu BD difiere, verifícalo con:
--   select conname from pg_constraint where conrelid='product_sizes'::regclass and contype='u';)
alter table product_sizes
  drop constraint if exists product_sizes_product_id_name_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_sizes_pid_color_name_key'
  ) then
    alter table product_sizes
      add constraint product_sizes_pid_color_name_key
      unique (product_id, color, name);
  end if;
end $$;

create index if not exists idx_product_sizes_pid_color
  on product_sizes(product_id, color);

-- ----------------------------------------------------------------
-- 2) product_images: galería por color ('' = imagen general / fallback)
-- ----------------------------------------------------------------
alter table product_images
  add column if not exists color text not null default '';

create index if not exists idx_product_images_pid_color
  on product_images(product_id, color);

-- (las imágenes actuales quedan con color='' = generales: NO se tocan)

-- ----------------------------------------------------------------
-- 3) nat_available_stock: nueva firma con color (3 args)
--    Resuelve el stock de una variante (product_id, color, talla).
--    Usa products.stock_general solo si NO hay color y NO hay talla.
-- ----------------------------------------------------------------
create or replace function nat_available_stock(p_pid text, p_color text, p_talla text)
returns int language sql stable as $$
  select case
    when (p_talla is null or p_talla = '') and (p_color is null or p_color = '')
      then coalesce((select stock_general from products where id = p_pid), 0)
    else coalesce((
      select stock from product_sizes
      where product_id = p_pid
        and color = coalesce(p_color, '')
        and name  = coalesce(p_talla, '')
    ), 0)
  end;
$$;

-- Compat: la firma vieja de 2 args sigue existiendo y delega con color=''.
-- (no la borramos para no romper llamadas externas / frontend legacy)
create or replace function nat_available_stock(p_pid text, p_talla text)
returns int language sql stable as $$
  select nat_available_stock(p_pid, '', p_talla);
$$;

-- nat_product_total_stock y nat_apply_auto_state: SIN CAMBIO
--   (ya suman todas las filas de product_sizes -> todos los colores y tallas).

-- ----------------------------------------------------------------
-- 4) nat_create_order (pública anon) — misma firma; valida por (pid, color, talla)
-- ----------------------------------------------------------------
create or replace function nat_create_order(p_cliente jsonb, p_pago jsonb, p_canal text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_pid text; v_talla text; v_color text; v_qty int;
  v_total numeric := 0; v_order_id uuid; v_numero text;
  v_cost numeric; v_subtotal numeric; v_backorder boolean; v_avail int;
  v_canton_cod text; v_parr_cod text; v_envio numeric := 0;
  v_tienda jsonb; v_parr_tienda text; v_tipo text; v_dir_retiro text := '';
  v_cliente jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Tu carrito está vacío.');
  end if;

  v_canton_cod := p_cliente->>'cantonCod';
  v_parr_cod   := p_cliente->>'parroquiaCod';
  if v_canton_cod is null or not exists (select 1 from dpa_cantones where codigo = v_canton_cod) then
    return jsonb_build_object('ok', false, 'error', 'Selecciona una zona de envío válida.');
  end if;

  -- Validación de stock por VARIANTE (producto + color + talla)
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid   := v_item->>'productId';
    v_talla := coalesce(v_item->>'talla', '');
    v_color := coalesce(v_item->>'color', '');
    v_qty   := (v_item->>'cantidad')::int;
    select backorder into v_backorder from products where id = v_pid;
    if not coalesce(v_backorder, false) then
      v_avail := nat_available_stock(v_pid, v_color, v_talla);
      if v_avail < v_qty then
        return jsonb_build_object('ok', false, 'error',
          'Sin stock suficiente de ' || coalesce(v_item->>'productName', 'un producto') || '.');
      end if;
    end if;
  end loop;

  select tienda into v_tienda from app_config where id = 1;
  v_parr_tienda := v_tienda->>'parroquiaCod';
  if coalesce(p_cliente->>'tipoEntrega', 'servientrega') = 'retiro'
     and v_parr_tienda is not null and v_parr_tienda <> '' and v_parr_cod = v_parr_tienda then
    v_tipo := 'retiro';
    v_envio := 0;
    v_dir_retiro := coalesce(v_tienda->>'direccion', '');
  else
    v_tipo := 'servientrega';
    select coalesce(
             nullif((select valor_envio from dpa_parroquias where codigo = v_parr_cod), 0),
             (select valor_envio from dpa_cantones where codigo = v_canton_cod),
             0)
      into v_envio;
  end if;
  v_cliente := p_cliente || jsonb_build_object('tipoEntrega', v_tipo, 'direccionRetiro', v_dir_retiro);

  -- registrar/actualizar al cliente antes de enlazar la orden (FK)
  perform nat_upsert_cliente(v_cliente);

  v_numero := 'NAT-' || lpad(nextval('nat_order_seq')::text, 4, '0');
  insert into orders (numero_orden, cliente, cedula, canal_origen, pago, estado)
    values (v_numero, v_cliente, nullif(v_cliente->>'cedula', ''), coalesce(p_canal, 'Sitio web / carrito'), coalesce(p_pago, '{}'::jsonb), 'Pendiente')
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

  update orders set subtotal = v_total, valor_envio = v_envio, total = v_total + v_envio where id = v_order_id;
  insert into order_history (order_id, estado_anterior, estado_nuevo, usuario, observacion)
    values (v_order_id, '', 'Pendiente', 'Cliente', 'Orden generada');

  return jsonb_build_object('ok', true, 'numero', v_numero, 'orderId', v_order_id);
end;
$$;

-- ----------------------------------------------------------------
-- 5) nat_update_order_state — misma firma; descuenta/revierte por (pid, color, talla)
-- ----------------------------------------------------------------
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

  -- Pasar a "Enviado": valida y DESCUENTA por (pid, color, talla)
  if p_new_state = 'Enviado' and v_prev <> 'Enviado' then
    for v_it in select * from order_items where order_id = p_order_id loop
      if nat_available_stock(v_it.product_id, v_it.color, v_it.talla) < v_it.cantidad
         and not coalesce((select backorder from products where id = v_it.product_id), false) then
        return jsonb_build_object('ok', false, 'error', 'Sin stock suficiente para enviar (' || v_it.product_name || ').');
      end if;
    end loop;

    for v_it in select * from order_items where order_id = p_order_id loop
      v_cur := nat_available_stock(v_it.product_id, v_it.color, v_it.talla);
      v_next := greatest(0, v_cur - v_it.cantidad);
      if coalesce(v_it.talla, '') = '' and coalesce(v_it.color, '') = '' then
        update products set stock_general = v_next, updated_at = now() where id = v_it.product_id;
      else
        update product_sizes set stock = v_next
          where product_id = v_it.product_id
            and color = coalesce(v_it.color, '')
            and name  = coalesce(v_it.talla, '');
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

  -- "Enviado" -> "Cancelado": REVIERTE por (pid, color, talla)
  if p_new_state = 'Cancelado' and v_prev = 'Enviado' then
    for v_it in select * from order_items where order_id = p_order_id loop
      v_cur := nat_available_stock(v_it.product_id, v_it.color, v_it.talla);
      v_next := v_cur + v_it.cantidad;
      if coalesce(v_it.talla, '') = '' and coalesce(v_it.color, '') = '' then
        update products set stock_general = v_next, updated_at = now() where id = v_it.product_id;
      else
        update product_sizes set stock = v_next
          where product_id = v_it.product_id
            and color = coalesce(v_it.color, '')
            and name  = coalesce(v_it.talla, '');
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

-- ----------------------------------------------------------------
-- 6) nat_register_movement — misma firma (ya recibe p_color); ahora lo usa en el UPDATE
-- ----------------------------------------------------------------
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

  v_cur := nat_available_stock(p_product_id, p_color, p_size);
  if p_kind = 'salida' and p_qty > v_cur and not coalesce(p_force, false) then
    return jsonb_build_object('ok', false, 'error',
      'No hay stock suficiente (' || v_cur || ' disponibles). Marca ajuste autorizado para forzar.');
  end if;

  v_next := case when p_kind = 'salida' then greatest(0, v_cur - p_qty) else v_cur + p_qty end;
  if coalesce(p_size, '') = '' and coalesce(p_color, '') = '' then
    update products set stock_general = v_next, updated_at = now() where id = p_product_id;
  else
    update product_sizes set stock = v_next
      where product_id = p_product_id
        and color = coalesce(p_color, '')
        and name  = coalesce(p_size, '');
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

-- ----------------------------------------------------------------
-- 7) nat_manual_sale — misma firma (ya recibe p_color); ahora lo usa en el UPDATE
-- ----------------------------------------------------------------
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

  v_cur := nat_available_stock(p_product_id, p_color, p_size);
  if p_qty > v_cur and not coalesce(p_force, false) then
    return jsonb_build_object('ok', false, 'error', 'No hay stock suficiente (' || v_cur || ' disponibles).');
  end if;

  v_next := greatest(0, v_cur - p_qty);
  if coalesce(p_size, '') = '' and coalesce(p_color, '') = '' then
    update products set stock_general = v_next, updated_at = now() where id = p_product_id;
  else
    update product_sizes set stock = v_next
      where product_id = p_product_id
        and color = coalesce(p_color, '')
        and name  = coalesce(p_size, '');
  end if;
  perform nat_apply_auto_state(p_product_id);

  perform nat_upsert_cliente(p_cliente);

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

-- ----------------------------------------------------------------
-- 8) nat_adjust_stock — CAMBIA FIRMA (+p_color): drop + create + grant
-- ----------------------------------------------------------------
drop function if exists nat_adjust_stock(text, text, int, text);

create or replace function nat_adjust_stock(p_product_id text, p_color text, p_size text, p_new_stock int, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pname text; v_cur int; v_new int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'No autorizado.'); end if;
  select name into v_pname from products where id = p_product_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Producto no encontrado.'); end if;
  v_new := greatest(0, coalesce(p_new_stock, 0));
  v_cur := nat_available_stock(p_product_id, p_color, p_size);
  if v_new = v_cur then return jsonb_build_object('ok', true); end if;

  if coalesce(p_size, '') = '' and coalesce(p_color, '') = '' then
    update products set stock_general = v_new, updated_at = now() where id = p_product_id;
  else
    update product_sizes set stock = v_new
      where product_id = p_product_id
        and color = coalesce(p_color, '')
        and name  = coalesce(p_size, '');
  end if;
  perform nat_apply_auto_state(p_product_id);

  insert into inventory_movements (kind, reason, reason_label, clasificacion, product_id, product_name, color, size, sku, qty, prev, next, note, responsable)
  values (case when v_new > v_cur then 'ingreso' else 'salida' end, 'ajuste', 'Ajuste de stock', 'Ingreso',
          p_product_id, v_pname, coalesce(nullif(p_color, ''), '—'), coalesce(nullif(p_size, ''), '—'),
          nat_sku(v_pname, p_color, p_size), abs(v_new - v_cur), v_cur, v_new,
          coalesce(p_note, 'Ajuste manual'), 'Administradora');
  return jsonb_build_object('ok', true);
end;
$$;

-- ----------------------------------------------------------------
-- 9) Grants
-- ----------------------------------------------------------------
grant execute on function nat_available_stock(text, text, text) to anon, authenticated;
grant execute on function nat_available_stock(text, text)       to anon, authenticated;
grant execute on function nat_adjust_stock(text, text, text, int, text) to authenticated;
-- Las demás RPCs conservan su grant (no cambiaron de firma).

commit;
