-- ============================================================
-- natalious · datos de ejemplo (seed)
-- Ejecutar DESPUÉS de 0001_init.sql.
-- ============================================================

-- ---------- Catálogos configurables ----------
insert into cat_product_states (id, label, sort) values
  ('disponible', 'Disponible', 0),
  ('bajo pedido', 'Bajo pedido', 1),
  ('agotado', 'Agotado', 2),
  ('inactivo', 'Inactivo', 3)
on conflict (id) do nothing;

insert into cat_order_states (id, label, color, bg, sort) values
  ('Pendiente', 'Pendiente', '#9a7320', 'rgba(184,134,47,0.14)', 0),
  ('Enviado', 'Enviado', '#3f7d56', 'rgba(63,125,86,0.14)', 1),
  ('Suspendido', 'Suspendido', '#3c5963', 'rgba(90,125,138,0.16)', 2),
  ('Cancelado', 'Cancelado', '#9a3b32', 'rgba(154,59,50,0.12)', 3)
on conflict (id) do nothing;

insert into cat_payment_methods (id, label, sort) values
  ('Transferencia bancaria', 'Transferencia bancaria', 0),
  ('Efectivo', 'Efectivo', 1),
  ('Pago contra entrega', 'Pago contra entrega', 2),
  ('Otro', 'Otro', 3)
on conflict (id) do nothing;

insert into cat_payment_statuses (id, label, sort) values
  ('Pendiente', 'Pendiente', 0),
  ('Pagado', 'Pagado', 1),
  ('Parcial', 'Parcial', 2),
  ('Rechazado', 'Rechazado', 3)
on conflict (id) do nothing;

insert into cat_movement_reasons (id, label, is_sale, is_defect, is_loss, sort) values
  ('venta', 'Venta', true, false, false, 0),
  ('baja_falla', 'Baja por falla', false, true, false, 1),
  ('danado', 'Producto dañado', false, true, false, 2),
  ('merma', 'Merma', false, false, true, 3),
  ('perdida', 'Pérdida', false, false, true, 4),
  ('cambio', 'Cambio', false, false, false, 5),
  ('devolucion_proveedor', 'Devolución a proveedor', false, false, false, 6),
  ('donacion', 'Donación', false, false, false, 7),
  ('otro', 'Otro motivo', false, false, false, 8)
on conflict (id) do nothing;

insert into cat_channels (id, label, sort) values
  ('Sitio web / carrito', 'Sitio web / carrito', 0),
  ('Facebook', 'Facebook', 1),
  ('Instagram', 'Instagram', 2),
  ('TikTok', 'TikTok', 3),
  ('WhatsApp', 'WhatsApp', 4),
  ('Referido', 'Referido', 5),
  ('Local físico', 'Local físico', 6),
  ('Otro', 'Otro', 7)
on conflict (id) do nothing;

insert into cat_cities (name, sort) values
  ('Guayaquil', 0), ('Quito', 1), ('Cuenca', 2), ('Daule', 3),
  ('Durán', 4), ('Samborondón', 5), ('Manta', 6), ('Machala', 7), ('Ambato', 8)
on conflict do nothing;

insert into cat_banks (name, sort) values
  ('Banco Pichincha', 0), ('Banco Guayaquil', 1), ('Banco del Pacífico', 2),
  ('Produbanco', 3), ('Banco Bolivariano', 4), ('Banco Internacional', 5),
  ('Cooperativa JEP', 6), ('Banco del Austro', 7)
on conflict do nothing;

-- ---------- Categorías ----------
insert into categories (id, name, tagline, sort) values
  ('flare', 'Flare', 'Caída y vuelo', 0),
  ('wide', 'Wide Leg', 'Basta ancha', 1),
  ('leggins', 'Leggins', 'Segunda piel', 2),
  ('faldas', 'Faldas', 'Con short interno', 3),
  ('sets', 'Sets', 'Look completo', 4)
on conflict (id) do nothing;

-- ---------- Tablas de medidas ----------
insert into size_charts (key, title, cols, rows, sort) values
  ('inferior', 'Parte inferior · leggins, shorts, enterizos',
   '["Talla","Cintura","Cadera"]'::jsonb,
   '[["S","62 – 70","94 – 104"],["M","70 – 78","105 – 112"],["L","78 – 86","112 – 118"]]'::jsonb, 0),
  ('superior', 'Parte superior · jackets largas y cortas',
   '["Talla","Cintura","Cadera"]'::jsonb,
   '[["S","84 – 89","68 – 79"],["M","90 – 95","80 – 89"],["L","96 – 102","90 – 98"]]'::jsonb, 1)
on conflict (key) do nothing;

-- ---------- Productos ----------
insert into products (id, name, category_id, short_desc, long_desc, price, mayor, featured, state, min_stock, charts) values
  ('flare-premium', 'Flare Pants Premium', 'flare', 'El flare que más vuela',
   E'Flare deportivo en tela suplex de alta calidad\nBolsillos prácticos para mayor comodidad\nCaída perfecta y ajuste natural\nSin efecto transparencia',
   18, 16, true, 'disponible', 6, '{inferior}'),
  ('flare-rib', 'Flare Pants Rib', 'flare', 'Tela rib que moldea',
   E'Moldea tu figura con tela rib premium\nEfecto scrunch que levanta y resalta\nCintura avispa para un look más estilizado\nIncluye bolsillos (comodidad + estilo)',
   18, 17, false, 'disponible', 6, '{inferior}'),
  ('wide-leg', 'Wide Leg (Basta Ancha)', 'wide', 'Basta ancha, look limpio',
   E'Tela premium, ultra suave y cómoda\nAjuste natural sin push up\nCompresión abdominal que define y estiliza tu cintura',
   18, 17, true, 'disponible', 6, '{inferior}'),
  ('leggins-acampanados', 'Leggins Acampanados', 'leggins', 'Triple realce, push up',
   E'Tela nylon + spandex que se adapta a tu cuerpo\nPush up que levanta y estiliza\nTriple realce que resalta tu figura\nComodidad total con máxima elasticidad',
   12, 11, false, 'disponible', 6, '{inferior}'),
  ('basica', 'Leggin Básica', 'leggins', 'El básico que no falta',
   E'El esencial de uso diario que combina con todo\nTela suave con cintura alta que ajusta sin marcar\nVersátil para entrenar o estar en casa',
   8, null, false, 'disponible', 6, '{inferior}'),
  ('faldas-bolsillo', 'Faldas con Bolsillo', 'faldas', 'Con short interno',
   E'Falda deportiva con short interno integrado\nBolsillos laterales prácticos\nTela con caída y movimiento\nIdeal para el día a día activo',
   15, null, false, 'disponible', 6, '{inferior}'),
  ('set-yoga', 'Set Yoga Flare', 'sets', 'Top + flare a juego',
   E'Conjunto top + flare perfectamente a juego\nTela suplex de alto rendimiento\nSujeción cómoda y favorecedora\nLook completo listo para entrenar',
   20, 18, true, 'disponible', 6, '{inferior,superior}')
on conflict (id) do nothing;

-- Costos (solo admin). cost = round(price * 0.55, 2)
insert into product_costs (product_id, cost) values
  ('flare-premium', 9.90), ('flare-rib', 9.90), ('wide-leg', 9.90),
  ('leggins-acampanados', 6.60), ('basica', 4.40), ('faldas-bolsillo', 8.25), ('set-yoga', 11.00)
on conflict (product_id) do nothing;

-- Stock por talla. Productos con stock bajo: flare-rib, leggins-acampanados (4/4/4 = 12); resto 12/12/12 = 36
insert into product_sizes (product_id, name, stock, sort) values
  ('flare-premium', 'S', 12, 0), ('flare-premium', 'M', 12, 1), ('flare-premium', 'L', 12, 2),
  ('flare-rib', 'S', 4, 0), ('flare-rib', 'M', 4, 1), ('flare-rib', 'L', 4, 2),
  ('wide-leg', 'S', 12, 0), ('wide-leg', 'M', 12, 1), ('wide-leg', 'L', 12, 2),
  ('leggins-acampanados', 'S', 4, 0), ('leggins-acampanados', 'M', 4, 1), ('leggins-acampanados', 'L', 4, 2),
  ('basica', 'S', 12, 0), ('basica', 'M', 12, 1), ('basica', 'L', 12, 2),
  ('faldas-bolsillo', 'S', 12, 0), ('faldas-bolsillo', 'M', 12, 1), ('faldas-bolsillo', 'L', 12, 2),
  ('set-yoga', 'S', 12, 0), ('set-yoga', 'M', 12, 1), ('set-yoga', 'L', 12, 2)
on conflict (product_id, name) do nothing;

-- Colores (visuales). blocked = agotado en el diseño original
insert into product_colors (product_id, name, hex, blocked, reason, sort) values
  ('flare-premium', 'Negro', '#1d1d1b', false, '', 0),
  ('flare-premium', 'Azul marino', '#27314a', false, '', 1),
  ('flare-premium', 'Verde menta', '#b8c7a6', false, '', 2),
  ('flare-premium', 'Vino', '#6e2436', false, '', 3),
  ('flare-premium', 'Fucsia', '#bd285c', false, '', 4),
  ('flare-rib', 'Terracota', '#b5582f', true, 'Agotada', 0),
  ('flare-rib', 'Verde', '#4d5d44', false, '', 1),
  ('flare-rib', 'Blanco', '#efece2', false, '', 2),
  ('flare-rib', 'Negro', '#1d1d1b', false, '', 3),
  ('flare-rib', 'Beige', '#cdbf9f', false, '', 4),
  ('flare-rib', 'Gris', '#8b8b85', false, '', 5),
  ('flare-rib', 'Azul marino', '#27314a', false, '', 6),
  ('wide-leg', 'Café', '#5a4634', false, '', 0),
  ('wide-leg', 'Beige', '#cdbf9f', false, '', 1),
  ('wide-leg', 'Rojo', '#b23a2e', false, '', 2),
  ('wide-leg', 'Celeste', '#9db6c5', false, '', 3),
  ('leggins-acampanados', 'Beige', '#cdbf9f', true, 'Agotada', 0),
  ('leggins-acampanados', 'Café', '#5a4634', false, '', 1),
  ('leggins-acampanados', 'Negro', '#1d1d1b', true, 'Agotada', 2),
  ('leggins-acampanados', 'Lila', '#b6a0c8', false, '', 3),
  ('leggins-acampanados', 'Verde', '#4d5d44', false, '', 4),
  ('basica', 'Negro', '#1d1d1b', false, '', 0),
  ('basica', 'Gris', '#8b8b85', false, '', 1),
  ('basica', 'Azul marino', '#27314a', false, '', 2),
  ('basica', 'Vino', '#6e2436', false, '', 3),
  ('faldas-bolsillo', 'Negro', '#1d1d1b', false, '', 0),
  ('faldas-bolsillo', 'Beige', '#cdbf9f', false, '', 1),
  ('faldas-bolsillo', 'Café', '#5a4634', false, '', 2),
  ('faldas-bolsillo', 'Verde', '#4d5d44', false, '', 3),
  ('set-yoga', 'Negro', '#1d1d1b', false, '', 0),
  ('set-yoga', 'Beige', '#cdbf9f', false, '', 1),
  ('set-yoga', 'Gris', '#8b8b85', false, '', 2)
on conflict (product_id, name) do nothing;

-- ---------- Carrusel principal ----------
insert into slides (active, sort, title, subtitle, cta_label, link_type, link_value) values
  (true, 0, 'Flare Pants Premium', 'Caída perfecta en tela suplex de alta calidad', 'Ver producto', 'producto', 'flare-premium'),
  (true, 1, 'Fuerte, bella y auténtica', 'Athleisure premium hecho en Ecuador', 'Ver catálogo', 'categoria', 'flare'),
  (true, 2, 'Pídelo por WhatsApp', 'Te asesoramos con tu talla y colores disponibles', 'Escríbenos', 'whatsapp', '')
on conflict do nothing;

-- ---------- Configuración general ----------
insert into app_config (id, carousel, wa, social) values (
  1,
  '{"autoplay": true, "intervalSec": 5}'::jsonb,
  '{
     "number": "593959915283",
     "enabled": true,
     "greeting": "¡Hola natalious! ✦",
     "template": "Me interesa: {producto} ({precio}). Color: {color} · Talla: {talla}. ¿Tienen disponible?",
     "generalTemplate": "Quiero más información del catálogo. ✦",
     "hours": "Lun a Sáb · 9:00 – 19:00",
     "replyNote": "Respondemos en minutos en horario de atención."
   }'::jsonb,
  '{
     "hashtags": "#natalious #ropadeportiva #athleisure #ecuador #fuertebellayautentica #gymgirl #flarepants",
     "handleIg": "@natalious.ec",
     "handleTk": "@natalious.ec"
   }'::jsonb
) on conflict (id) do nothing;
