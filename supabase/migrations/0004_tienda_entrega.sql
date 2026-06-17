-- ============================================================
-- 0004_tienda_entrega.sql
-- Ubicación de la tienda (perfil) + tipo de entrega por orden:
--   - Servientrega: cobra el envío según la zona.
--   - Retiro en tienda: $0, permitido SÓLO si la parroquia del cliente
--     coincide con la parroquia de la tienda. Guarda la dirección de retiro.
-- Ejecutar DESPUÉS de 0003_geo_envio.sql.
-- ============================================================

-- Ubicación + dirección de la tienda (singleton app_config)
alter table app_config add column if not exists tienda jsonb default '{}'::jsonb;

-- ============================================================
-- nat_create_order: ahora resuelve tipo de entrega y envío server-side.
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

  -- tipo de entrega y envío
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

  v_numero := 'NAT-' || lpad(nextval('nat_order_seq')::text, 4, '0');
  insert into orders (numero_orden, cliente, canal_origen, pago, estado)
    values (v_numero, v_cliente, coalesce(p_canal, 'Sitio web / carrito'), coalesce(p_pago, '{}'::jsonb), 'Pendiente')
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
-- nat_update_order_zone: ahora recibe el tipo de entrega (5º parámetro).
-- ============================================================
drop function if exists nat_update_order_zone(uuid, text, text, text);

create or replace function nat_update_order_zone(
  p_order_id uuid, p_provincia_cod text, p_canton_cod text, p_parroquia_cod text, p_tipo_entrega text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_sub numeric; v_envio numeric := 0; v_cli jsonb;
  v_pn text; v_cn text; v_prn text;
  v_tienda jsonb; v_parr_tienda text; v_tipo text; v_dir_retiro text := '';
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'No autorizado.'); end if;
  if not exists (select 1 from orders where id = p_order_id) then
    return jsonb_build_object('ok', false, 'error', 'Orden no encontrada.'); end if;
  if p_canton_cod is null or not exists (select 1 from dpa_cantones where codigo = p_canton_cod) then
    return jsonb_build_object('ok', false, 'error', 'Cantón inválido.'); end if;

  select nombre into v_pn  from dpa_provincias where codigo = p_provincia_cod;
  select nombre into v_cn  from dpa_cantones   where codigo = p_canton_cod;
  select nombre into v_prn from dpa_parroquias where codigo = p_parroquia_cod;

  select coalesce(sum(subtotal), 0) into v_sub from order_items where order_id = p_order_id;

  select tienda into v_tienda from app_config where id = 1;
  v_parr_tienda := v_tienda->>'parroquiaCod';
  if coalesce(p_tipo_entrega, 'servientrega') = 'retiro'
     and v_parr_tienda is not null and v_parr_tienda <> '' and p_parroquia_cod = v_parr_tienda then
    v_tipo := 'retiro';
    v_envio := 0;
    v_dir_retiro := coalesce(v_tienda->>'direccion', '');
  else
    v_tipo := 'servientrega';
    select coalesce(
             nullif((select valor_envio from dpa_parroquias where codigo = p_parroquia_cod), 0),
             (select valor_envio from dpa_cantones where codigo = p_canton_cod),
             0)
      into v_envio;
  end if;

  select cliente into v_cli from orders where id = p_order_id;
  v_cli := coalesce(v_cli, '{}'::jsonb) || jsonb_build_object(
    'provinciaCod', p_provincia_cod, 'provinciaNombre', coalesce(v_pn, ''),
    'cantonCod',    p_canton_cod,    'cantonNombre',    coalesce(v_cn, ''),
    'parroquiaCod', p_parroquia_cod, 'parroquiaNombre', coalesce(v_prn, ''),
    'ciudad', coalesce(v_cn, ''),
    'tipoEntrega', v_tipo, 'direccionRetiro', v_dir_retiro);

  update orders set cliente = v_cli, valor_envio = v_envio, subtotal = v_sub, total = v_sub + v_envio
   where id = p_order_id;

  insert into order_history (order_id, estado_anterior, estado_nuevo, usuario, observacion)
    values (p_order_id, '', '', 'Administradora', 'Zona/entrega corregida');

  return jsonb_build_object('ok', true, 'valorEnvio', v_envio, 'total', v_sub + v_envio, 'tipoEntrega', v_tipo);
end;
$$;

grant execute on function nat_update_order_zone(uuid, text, text, text, text) to authenticated;
