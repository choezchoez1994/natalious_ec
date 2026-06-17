-- ============================================================
-- 0003_geo_envio.sql
-- Jerarquía geográfica del INEC (provincia → cantón → parroquia)
-- + costo de envío (Servientrega) sumado al total de la orden.
-- Ejecutar DESPUÉS de 0002_expand.sql y ANTES de 0003b_dpa_data.sql.
-- ============================================================

-- ---------- Tablas DPA (PK = código INEC, text) ----------
create table if not exists dpa_provincias (
  codigo text primary key,                 -- '09'
  nombre text not null,
  sort   int default 0
);

create table if not exists dpa_cantones (
  codigo        text primary key,          -- '0901'
  nombre        text not null,
  provincia_cod text not null references dpa_provincias(codigo) on delete cascade,
  valor_envio   numeric(10,2) not null default 0,
  sort          int default 0
);

create table if not exists dpa_parroquias (
  codigo      text primary key,            -- '090150'
  nombre      text not null,
  canton_cod  text not null references dpa_cantones(codigo) on delete cascade,
  valor_envio numeric(10,2) not null default 0,
  sort        int default 0
);

create index if not exists ix_dpa_cantones_prov    on dpa_cantones(provincia_cod);
create index if not exists ix_dpa_parroquias_canton on dpa_parroquias(canton_cod);

-- ---------- RLS: lectura pública, escritura sólo autenticados ----------
alter table dpa_provincias enable row level security;
alter table dpa_cantones   enable row level security;
alter table dpa_parroquias enable row level security;

do $$
declare t text;
begin
  foreach t in array array['dpa_provincias','dpa_cantones','dpa_parroquias'] loop
    execute format('drop policy if exists "public_read_%1$s" on %1$s;', t);
    execute format('create policy "public_read_%1$s" on %1$s for select using (true);', t);
    execute format('drop policy if exists "admin_all_%1$s" on %1$s;', t);
    execute format('create policy "admin_all_%1$s" on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------- Orden: costo de envío como columna de primera clase ----------
alter table orders add column if not exists valor_envio numeric(10,2) not null default 0;

-- ============================================================
-- RPC: generar orden (pública) — ahora suma el envío server-side.
-- El envío se calcula desde los códigos de la zona en p_cliente:
-- parroquia.valor_envio si > 0, en su defecto canton.valor_envio.
-- ============================================================
create or replace function nat_create_order(p_cliente jsonb, p_pago jsonb, p_canal text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb; v_pid text; v_talla text; v_qty int;
  v_total numeric := 0; v_order_id uuid; v_numero text;
  v_cost numeric; v_subtotal numeric; v_backorder boolean; v_avail int;
  v_canton_cod text; v_parr_cod text; v_envio numeric := 0;
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

  -- envío efectivo: parroquia si > 0, en su defecto el del cantón, si no 0
  select coalesce(
           nullif((select valor_envio from dpa_parroquias where codigo = v_parr_cod), 0),
           (select valor_envio from dpa_cantones where codigo = v_canton_cod),
           0)
    into v_envio;

  update orders set subtotal = v_total, valor_envio = v_envio, total = v_total + v_envio where id = v_order_id;
  insert into order_history (order_id, estado_anterior, estado_nuevo, usuario, observacion)
    values (v_order_id, '', 'Pendiente', 'Cliente', 'Orden generada');

  return jsonb_build_object('ok', true, 'numero', v_numero, 'orderId', v_order_id);
end;
$$;

-- ============================================================
-- RPC: corregir la zona de una orden (admin) y recalcular envío + total.
-- El subtotal se re-suma desde order_items (fuente de verdad).
-- ============================================================
create or replace function nat_update_order_zone(
  p_order_id uuid, p_provincia_cod text, p_canton_cod text, p_parroquia_cod text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_sub numeric; v_envio numeric := 0; v_cli jsonb;
  v_pn text; v_cn text; v_prn text;
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

  select coalesce(
           nullif((select valor_envio from dpa_parroquias where codigo = p_parroquia_cod), 0),
           (select valor_envio from dpa_cantones where codigo = p_canton_cod),
           0)
    into v_envio;

  select cliente into v_cli from orders where id = p_order_id;
  v_cli := coalesce(v_cli, '{}'::jsonb) || jsonb_build_object(
    'provinciaCod', p_provincia_cod, 'provinciaNombre', coalesce(v_pn, ''),
    'cantonCod',    p_canton_cod,    'cantonNombre',    coalesce(v_cn, ''),
    'parroquiaCod', p_parroquia_cod, 'parroquiaNombre', coalesce(v_prn, ''),
    'ciudad', coalesce(v_cn, ''));

  update orders set cliente = v_cli, valor_envio = v_envio, subtotal = v_sub, total = v_sub + v_envio
   where id = p_order_id;

  insert into order_history (order_id, estado_anterior, estado_nuevo, usuario, observacion)
    values (p_order_id, '', '', 'Administradora', 'Zona/envío corregido');

  return jsonb_build_object('ok', true, 'valorEnvio', v_envio, 'total', v_sub + v_envio);
end;
$$;

grant execute on function nat_update_order_zone(uuid, text, text, text) to authenticated;

-- ---------- Retiro de la geografía legacy (reemplazada por dpa_*) ----------
drop table if exists cat_cities;
drop table if exists provinces;
