-- ============================================================
-- 0005_clientes.sql
-- Registro de clientes (personas que compran). La cédula es la identidad.
-- - nat_create_order y nat_manual_sale hacen upsert del cliente.
-- - nat_buscar_cliente permite autocompletar por cédula (checkout y panel).
-- Datos sensibles: la tabla NO es de lectura pública; el acceso del público
-- es sólo vía la RPC nat_buscar_cliente (security definer).
-- Ejecutar DESPUÉS de 0004_tienda_entrega.sql.
-- ============================================================

create table if not exists clientes (
  cedula           text primary key,
  nombres          text default '',
  apellidos        text default '',
  correo           text default '',
  celular          text default '',
  direccion        text default '',
  provincia_cod    text default '',
  provincia_nombre text default '',
  canton_cod       text default '',
  canton_nombre    text default '',
  parroquia_cod    text default '',
  parroquia_nombre text default '',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table orders add column if not exists cedula text references clientes(cedula) on delete set null;
create index if not exists ix_orders_cedula on orders(cedula);

-- RLS: sólo admin (authenticated) puede leer/escribir directo. El público entra por RPC.
alter table clientes enable row level security;
drop policy if exists "admin_all_clientes" on clientes;
create policy "admin_all_clientes" on clientes for all to authenticated using (true) with check (true);

-- ---------- upsert interno de cliente (lo llaman las RPC) ----------
create or replace function nat_upsert_cliente(p_cliente jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_cliente->>'cedula', '') = '' then return; end if;
  insert into clientes (cedula, nombres, apellidos, correo, celular, direccion,
                        provincia_cod, provincia_nombre, canton_cod, canton_nombre,
                        parroquia_cod, parroquia_nombre, updated_at)
  values (
    p_cliente->>'cedula',
    coalesce(p_cliente->>'nombres', ''), coalesce(p_cliente->>'apellidos', ''),
    coalesce(p_cliente->>'correo', ''), coalesce(p_cliente->>'celular', ''),
    coalesce(p_cliente->>'direccion', ''),
    coalesce(p_cliente->>'provinciaCod', ''), coalesce(p_cliente->>'provinciaNombre', ''),
    coalesce(p_cliente->>'cantonCod', ''), coalesce(p_cliente->>'cantonNombre', ''),
    coalesce(p_cliente->>'parroquiaCod', ''), coalesce(p_cliente->>'parroquiaNombre', ''),
    now()
  )
  on conflict (cedula) do update set
    nombres = excluded.nombres, apellidos = excluded.apellidos,
    correo = excluded.correo, celular = excluded.celular, direccion = excluded.direccion,
    provincia_cod = excluded.provincia_cod, provincia_nombre = excluded.provincia_nombre,
    canton_cod = excluded.canton_cod, canton_nombre = excluded.canton_nombre,
    parroquia_cod = excluded.parroquia_cod, parroquia_nombre = excluded.parroquia_nombre,
    updated_at = now();
end;
$$;

-- ---------- búsqueda por cédula (autocompletar) ----------
create or replace function nat_buscar_cliente(p_cedula text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if coalesce(p_cedula, '') = '' then return null; end if;
  select to_jsonb(c) into v from clientes c where cedula = p_cedula;
  return v;
end;
$$;

grant execute on function nat_buscar_cliente(text) to anon, authenticated;

-- ============================================================
-- nat_create_order: registra/actualiza el cliente y enlaza la orden.
-- ============================================================
create or replace function nat_create_order(p_cliente jsonb, p_pago jsonb, p_canal text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_pid text; v_talla text; v_qty int;
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

-- ============================================================
-- nat_manual_sale: registra/actualiza al cliente también (venta presencial).
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
