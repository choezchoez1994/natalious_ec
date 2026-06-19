-- ============================================================
-- 0007_data_excel.sql  (GENERADO por gen_0007.py)
-- Carga el inventario real por COLOR + TALLA desde Natalious.xlsx.
-- Reemplaza colores y variantes de cada producto; preserva imágenes,
-- órdenes, clientes y configuración. Ejecutar DESPUÉS de 0006.
-- ============================================================
begin;

-- Jacket tela rib  (7 variantes)
update products set price=15.0, updated_at=now() where id='jacket-tela-rib';
delete from product_sizes where product_id='jacket-tela-rib';
delete from product_colors where product_id='jacket-tela-rib';
insert into product_colors (product_id,name,hex,sort) values
  ('jacket-tela-rib','Negro','#111111',0),
  ('jacket-tela-rib','Beige','#E3D2A8',1),
  ('jacket-tela-rib','Chocolate','#4A2C2A',2);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('jacket-tela-rib','Negro','M',2,0),
  ('jacket-tela-rib','Negro','L',3,1),
  ('jacket-tela-rib','Negro','XL',2,2),
  ('jacket-tela-rib','Beige','M',0,3),
  ('jacket-tela-rib','Beige','L',2,4),
  ('jacket-tela-rib','Beige','XL',2,5),
  ('jacket-tela-rib','Chocolate','XL',2,6);
select nat_apply_auto_state('jacket-tela-rib');

-- Enterizo sin mangas  (7 variantes)
update products set price=17.0, updated_at=now() where id='enterizo-sin-mangas';
delete from product_sizes where product_id='enterizo-sin-mangas';
delete from product_colors where product_id='enterizo-sin-mangas';
insert into product_colors (product_id,name,hex,sort) values
  ('enterizo-sin-mangas','Negro','#111111',0),
  ('enterizo-sin-mangas','Marrón','#7B3F00',1),
  ('enterizo-sin-mangas','Gris claro','#CCCCCC',2),
  ('enterizo-sin-mangas','Gris oscuro','#555555',3),
  ('enterizo-sin-mangas','Vino','#6E1423',4),
  ('enterizo-sin-mangas','Blanco','#FFFFFF',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('enterizo-sin-mangas','Negro','S',2,0),
  ('enterizo-sin-mangas','Negro','M',0,1),
  ('enterizo-sin-mangas','Marrón','S',2,2),
  ('enterizo-sin-mangas','Gris claro','S',1,3),
  ('enterizo-sin-mangas','Gris oscuro','S',0,4),
  ('enterizo-sin-mangas','Vino','S',0,5),
  ('enterizo-sin-mangas','Blanco','M',0,6);
select nat_apply_auto_state('enterizo-sin-mangas');

-- Enterizo con mangas  (11 variantes)
update products set price=13.0, updated_at=now() where id='enterizo-con-mangas';
delete from product_sizes where product_id='enterizo-con-mangas';
delete from product_colors where product_id='enterizo-con-mangas';
insert into product_colors (product_id,name,hex,sort) values
  ('enterizo-con-mangas','Beige','#E3D2A8',0),
  ('enterizo-con-mangas','Azul oscuro','#0D47A1',1),
  ('enterizo-con-mangas','Oscuro','#333333',2),
  ('enterizo-con-mangas','Rosa','#F48FB1',3),
  ('enterizo-con-mangas','Gris oscuro','#555555',4),
  ('enterizo-con-mangas','Rojo oscuro','#8B1A1A',5),
  ('enterizo-con-mangas','Chocolate','#4A2C2A',6),
  ('enterizo-con-mangas','Verde','#2E7D32',7),
  ('enterizo-con-mangas','Rojo tomate','#E64A2E',8),
  ('enterizo-con-mangas','Lila','#B57EDC',9);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('enterizo-con-mangas','Beige','S',0,0),
  ('enterizo-con-mangas','Azul oscuro','S',0,1),
  ('enterizo-con-mangas','Oscuro','S',0,2),
  ('enterizo-con-mangas','Oscuro','M',0,3),
  ('enterizo-con-mangas','Rosa','M',0,4),
  ('enterizo-con-mangas','Gris oscuro','M',0,5),
  ('enterizo-con-mangas','Rojo oscuro','M',0,6),
  ('enterizo-con-mangas','Chocolate','M',0,7),
  ('enterizo-con-mangas','Verde','L',1,8),
  ('enterizo-con-mangas','Rojo tomate','L',0,9),
  ('enterizo-con-mangas','Lila','L',1,10);
select nat_apply_auto_state('enterizo-con-mangas');

-- Short líneas blancas  (11 variantes)
update products set price=9.0, updated_at=now() where id='short-lineas-blancas';
delete from product_sizes where product_id='short-lineas-blancas';
delete from product_colors where product_id='short-lineas-blancas';
insert into product_colors (product_id,name,hex,sort) values
  ('short-lineas-blancas','Rosa','#F48FB1',0),
  ('short-lineas-blancas','Café','#6F4E37',1),
  ('short-lineas-blancas','Azul oscuro','#0D47A1',2),
  ('short-lineas-blancas','Gris claro','#CCCCCC',3),
  ('short-lineas-blancas','Gris oscuro','#555555',4),
  ('short-lineas-blancas','Negro','#111111',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('short-lineas-blancas','Rosa','S',1,0),
  ('short-lineas-blancas','Rosa','M',1,1),
  ('short-lineas-blancas','Café','S',1,2),
  ('short-lineas-blancas','Azul oscuro','S',0,3),
  ('short-lineas-blancas','Azul oscuro','M',0,4),
  ('short-lineas-blancas','Gris claro','S',1,5),
  ('short-lineas-blancas','Gris claro','M',0,6),
  ('short-lineas-blancas','Gris oscuro','S',1,7),
  ('short-lineas-blancas','Gris oscuro','M',0,8),
  ('short-lineas-blancas','Negro','S',1,9),
  ('short-lineas-blancas','Negro','M',2,10);
select nat_apply_auto_state('short-lineas-blancas');

-- Leggin corte en V  (12 variantes)
update products set price=10.0, updated_at=now() where id='leggin-corte-en-v';
delete from product_sizes where product_id='leggin-corte-en-v';
delete from product_colors where product_id='leggin-corte-en-v';
insert into product_colors (product_id,name,hex,sort) values
  ('leggin-corte-en-v','Gris oscuro','#555555',0),
  ('leggin-corte-en-v','Gris medio','#8A8A8A',1),
  ('leggin-corte-en-v','Gris claro','#CCCCCC',2),
  ('leggin-corte-en-v','Vino - morado','#6D214F',3),
  ('leggin-corte-en-v','Beige','#E3D2A8',4),
  ('leggin-corte-en-v','Café','#6F4E37',5),
  ('leggin-corte-en-v','Azul','#1E88E5',6),
  ('leggin-corte-en-v','Verde','#2E7D32',7),
  ('leggin-corte-en-v','Rosa','#F48FB1',8),
  ('leggin-corte-en-v','Marrón claro','#A9745B',9);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('leggin-corte-en-v','Gris oscuro','S',1,0),
  ('leggin-corte-en-v','Gris oscuro','M',1,1),
  ('leggin-corte-en-v','Gris oscuro','L',1,2),
  ('leggin-corte-en-v','Gris medio','S',1,3),
  ('leggin-corte-en-v','Gris claro','S',1,4),
  ('leggin-corte-en-v','Vino - morado','S',1,5),
  ('leggin-corte-en-v','Beige','M',1,6),
  ('leggin-corte-en-v','Café','M',2,7),
  ('leggin-corte-en-v','Azul','M',1,8),
  ('leggin-corte-en-v','Verde','L',0,9),
  ('leggin-corte-en-v','Rosa','L',2,10),
  ('leggin-corte-en-v','Marrón claro','L',0,11);
select nat_apply_auto_state('leggin-corte-en-v');

-- Leggin basta ancha  (17 variantes)
update products set price=10.0, updated_at=now() where id='leggin-basta-ancha';
delete from product_sizes where product_id='leggin-basta-ancha';
delete from product_colors where product_id='leggin-basta-ancha';
insert into product_colors (product_id,name,hex,sort) values
  ('leggin-basta-ancha','Amarillo patito','#FFE74C',0),
  ('leggin-basta-ancha','Café','#6F4E37',1),
  ('leggin-basta-ancha','Rosa','#F48FB1',2),
  ('leggin-basta-ancha','Oscuro','#333333',3),
  ('leggin-basta-ancha','Lila','#B57EDC',4),
  ('leggin-basta-ancha','Verde','#2E7D32',5),
  ('leggin-basta-ancha','Rojo','#D32F2F',6),
  ('leggin-basta-ancha','Gris','#9E9E9E',7),
  ('leggin-basta-ancha','Vino','#6E1423',8),
  ('leggin-basta-ancha','Azul','#1E88E5',9),
  ('leggin-basta-ancha','Negro','#111111',10),
  ('leggin-basta-ancha','Beige','#E3D2A8',11);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('leggin-basta-ancha','Amarillo patito','S',0,0),
  ('leggin-basta-ancha','Café','S',0,1),
  ('leggin-basta-ancha','Café','L',1,2),
  ('leggin-basta-ancha','Rosa','S',0,3),
  ('leggin-basta-ancha','Rosa','L',1,4),
  ('leggin-basta-ancha','Oscuro','S',0,5),
  ('leggin-basta-ancha','Lila','S',0,6),
  ('leggin-basta-ancha','Lila','L',1,7),
  ('leggin-basta-ancha','Verde','S',0,8),
  ('leggin-basta-ancha','Verde','L',1,9),
  ('leggin-basta-ancha','Rojo','M',2,10),
  ('leggin-basta-ancha','Gris','M',0,11),
  ('leggin-basta-ancha','Vino','M',2,12),
  ('leggin-basta-ancha','Azul','M',1,13),
  ('leggin-basta-ancha','Negro','M',0,14),
  ('leggin-basta-ancha','Negro','L',1,15),
  ('leggin-basta-ancha','Beige','L',1,16);
select nat_apply_auto_state('leggin-basta-ancha');

-- Short push up  (12 variantes)
update products set price=8.06, updated_at=now() where id='short-push-up';
delete from product_sizes where product_id='short-push-up';
delete from product_colors where product_id='short-push-up';
insert into product_colors (product_id,name,hex,sort) values
  ('short-push-up','Azul eléctrico','#2979FF',0),
  ('short-push-up','Lila','#B57EDC',1),
  ('short-push-up','Blanco','#FFFFFF',2),
  ('short-push-up','Café','#6F4E37',3),
  ('short-push-up','Negro','#111111',4),
  ('short-push-up','Rojo','#D32F2F',5),
  ('short-push-up','Gris oscuro','#555555',6),
  ('short-push-up','Gris claro','#CCCCCC',7),
  ('short-push-up','Celeste','#7EC8E3',8),
  ('short-push-up','Beige','#E3D2A8',9);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('short-push-up','Azul eléctrico','S',1,0),
  ('short-push-up','Lila','S',1,1),
  ('short-push-up','Lila','M',1,2),
  ('short-push-up','Blanco','S',1,3),
  ('short-push-up','Café','S',1,4),
  ('short-push-up','Negro','S',1,5),
  ('short-push-up','Rojo','S',0,6),
  ('short-push-up','Rojo','M',1,7),
  ('short-push-up','Gris oscuro','M',0,8),
  ('short-push-up','Gris claro','M',1,9),
  ('short-push-up','Celeste','M',1,10),
  ('short-push-up','Beige','M',1,11);
select nat_apply_auto_state('short-push-up');

-- Licra acalanada tubo  (11 variantes)
update products set price=10.0, updated_at=now() where id='licra-acalanada-tubo';
delete from product_sizes where product_id='licra-acalanada-tubo';
delete from product_colors where product_id='licra-acalanada-tubo';
insert into product_colors (product_id,name,hex,sort) values
  ('licra-acalanada-tubo','Gris','#9E9E9E',0),
  ('licra-acalanada-tubo','Negro','#111111',1),
  ('licra-acalanada-tubo','Rojo','#D32F2F',2),
  ('licra-acalanada-tubo','Rosa','#F48FB1',3),
  ('licra-acalanada-tubo','Lila','#B57EDC',4),
  ('licra-acalanada-tubo','Azul oscuro','#0D47A1',5),
  ('licra-acalanada-tubo','Café','#6F4E37',6),
  ('licra-acalanada-tubo','Verde','#2E7D32',7),
  ('licra-acalanada-tubo','Vino','#6E1423',8);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('licra-acalanada-tubo','Gris','S',0,0),
  ('licra-acalanada-tubo','Negro','S',1,1),
  ('licra-acalanada-tubo','Negro','M',2,2),
  ('licra-acalanada-tubo','Negro','L',1,3),
  ('licra-acalanada-tubo','Rojo','S',1,4),
  ('licra-acalanada-tubo','Rosa','M',1,5),
  ('licra-acalanada-tubo','Lila','M',1,6),
  ('licra-acalanada-tubo','Azul oscuro','M',1,7),
  ('licra-acalanada-tubo','Café','M',1,8),
  ('licra-acalanada-tubo','Verde','L',1,9),
  ('licra-acalanada-tubo','Vino','L',1,10);
select nat_apply_auto_state('licra-acalanada-tubo');

-- Licra tubo - push up  (9 variantes)
update products set price=8.0, updated_at=now() where id='licra-tubo-push-up';
delete from product_sizes where product_id='licra-tubo-push-up';
delete from product_colors where product_id='licra-tubo-push-up';
insert into product_colors (product_id,name,hex,sort) values
  ('licra-tubo-push-up','Gris oscuro','#555555',0),
  ('licra-tubo-push-up','Lila','#B57EDC',1),
  ('licra-tubo-push-up','Celeste','#7EC8E3',2),
  ('licra-tubo-push-up','Verde','#2E7D32',3),
  ('licra-tubo-push-up','Vino','#6E1423',4),
  ('licra-tubo-push-up','Café','#6F4E37',5),
  ('licra-tubo-push-up','Azul','#1E88E5',6),
  ('licra-tubo-push-up','Gris claro','#CCCCCC',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('licra-tubo-push-up','Gris oscuro','S',1,0),
  ('licra-tubo-push-up','Gris oscuro','M',0,1),
  ('licra-tubo-push-up','Lila','S',2,2),
  ('licra-tubo-push-up','Celeste','S',1,3),
  ('licra-tubo-push-up','Verde','S',2,4),
  ('licra-tubo-push-up','Vino','S',1,5),
  ('licra-tubo-push-up','Café','M',2,6),
  ('licra-tubo-push-up','Azul','M',0,7),
  ('licra-tubo-push-up','Gris claro','M',0,8);
select nat_apply_auto_state('licra-tubo-push-up');

-- Licra acalanada en V  (3 variantes)
update products set price=10.0, updated_at=now() where id='licra-acalanada-en-v';
delete from product_sizes where product_id='licra-acalanada-en-v';
delete from product_colors where product_id='licra-acalanada-en-v';
insert into product_colors (product_id,name,hex,sort) values
  ('licra-acalanada-en-v','Negro','#111111',0);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('licra-acalanada-en-v','Negro','S',0,0),
  ('licra-acalanada-en-v','Negro','M',5,1),
  ('licra-acalanada-en-v','Negro','L',3,2);
select nat_apply_auto_state('licra-acalanada-en-v');

-- Licra tubo con push up  (3 variantes)
update products set price=10.0, updated_at=now() where id='licra-tubo-con-push-up';
delete from product_sizes where product_id='licra-tubo-con-push-up';
delete from product_colors where product_id='licra-tubo-con-push-up';
insert into product_colors (product_id,name,hex,sort) values
  ('licra-tubo-con-push-up','Negro','#111111',0);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('licra-tubo-con-push-up','Negro','S',4,0),
  ('licra-tubo-con-push-up','Negro','M',5,1),
  ('licra-tubo-con-push-up','Negro','L',3,2);
select nat_apply_auto_state('licra-tubo-con-push-up');

-- Enterizo Premium  (11 variantes)
update products set price=15.0, updated_at=now() where id='enterizo-premium';
delete from product_sizes where product_id='enterizo-premium';
delete from product_colors where product_id='enterizo-premium';
insert into product_colors (product_id,name,hex,sort) values
  ('enterizo-premium','Azul verdoso','#2E8B8B',0),
  ('enterizo-premium','Gris','#9E9E9E',1),
  ('enterizo-premium','Negro','#111111',2),
  ('enterizo-premium','Rosa','#F48FB1',3),
  ('enterizo-premium','Celeste','#7EC8E3',4),
  ('enterizo-premium','Café','#6F4E37',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('enterizo-premium','Azul verdoso','S',0,0),
  ('enterizo-premium','Azul verdoso','M',0,1),
  ('enterizo-premium','Gris','S',0,2),
  ('enterizo-premium','Gris','L',1,3),
  ('enterizo-premium','Negro','S',0,4),
  ('enterizo-premium','Negro','M',2,5),
  ('enterizo-premium','Negro','L',0,6),
  ('enterizo-premium','Rosa','M',1,7),
  ('enterizo-premium','Celeste','M',0,8),
  ('enterizo-premium','Café','M',1,9),
  ('enterizo-premium','Café','L',0,10);
select nat_apply_auto_state('enterizo-premium');

-- Top cierre multicolor  (6 variantes)
update products set price=5.11, updated_at=now() where id='top-cierre-multicolor';
delete from product_sizes where product_id='top-cierre-multicolor';
delete from product_colors where product_id='top-cierre-multicolor';
insert into product_colors (product_id,name,hex,sort) values
  ('top-cierre-multicolor','Azul','#1E88E5',0),
  ('top-cierre-multicolor','Café','#6F4E37',1),
  ('top-cierre-multicolor','Negro','#111111',2),
  ('top-cierre-multicolor','Verde','#2E7D32',3),
  ('top-cierre-multicolor','Beige','#E3D2A8',4),
  ('top-cierre-multicolor','Fucsia','#E91E63',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('top-cierre-multicolor','Azul','Standard',1,0),
  ('top-cierre-multicolor','Café','Standard',2,1),
  ('top-cierre-multicolor','Negro','Standard',2,2),
  ('top-cierre-multicolor','Verde','Standard',2,3),
  ('top-cierre-multicolor','Beige','Standard',2,4),
  ('top-cierre-multicolor','Fucsia','Standard',2,5);
select nat_apply_auto_state('top-cierre-multicolor');

-- Top blusa  (10 variantes)
update products set price=8.0, updated_at=now() where id='top-blusa';
delete from product_sizes where product_id='top-blusa';
delete from product_colors where product_id='top-blusa';
insert into product_colors (product_id,name,hex,sort) values
  ('top-blusa','Negro','#111111',0),
  ('top-blusa','Verde','#2E7D32',1),
  ('top-blusa','Rosa','#F48FB1',2),
  ('top-blusa','Celeste','#7EC8E3',3),
  ('top-blusa','Palo rosa','#E8B4BC',4),
  ('top-blusa','Azul','#1E88E5',5),
  ('top-blusa','Rojo','#D32F2F',6),
  ('top-blusa','Azul océano','#006994',7),
  ('top-blusa','Beige','#E3D2A8',8),
  ('top-blusa','Blanco','#FFFFFF',9);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('top-blusa','Negro','Standard',2,0),
  ('top-blusa','Verde','Standard',1,1),
  ('top-blusa','Rosa','Standard',1,2),
  ('top-blusa','Celeste','Standard',1,3),
  ('top-blusa','Palo rosa','Standard',1,4),
  ('top-blusa','Azul','Standard',1,5),
  ('top-blusa','Rojo','Standard',1,6),
  ('top-blusa','Azul océano','Standard',1,7),
  ('top-blusa','Beige','Standard',1,8),
  ('top-blusa','Blanco','Standard',0,9);
select nat_apply_auto_state('top-blusa');

-- Wide leg  (11 variantes)
update products set price=18.0, updated_at=now() where id='wide-leg';
delete from product_sizes where product_id='wide-leg';
delete from product_colors where product_id='wide-leg';
insert into product_colors (product_id,name,hex,sort) values
  ('wide-leg','Negro','#111111',0),
  ('wide-leg','Blanco','#FFFFFF',1),
  ('wide-leg','Azul','#1E88E5',2),
  ('wide-leg','Café','#6F4E37',3),
  ('wide-leg','Gris','#9E9E9E',4),
  ('wide-leg','Rojo','#D32F2F',5),
  ('wide-leg','Verde','#2E7D32',6),
  ('wide-leg','Amarillo/Beige','#EAD9A0',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('wide-leg','Negro','S',0,0),
  ('wide-leg','Negro','M',0,1),
  ('wide-leg','Blanco','S',1,2),
  ('wide-leg','Azul','S',0,3),
  ('wide-leg','Café','S',0,4),
  ('wide-leg','Café','M',0,5),
  ('wide-leg','Gris','S',0,6),
  ('wide-leg','Gris','M',0,7),
  ('wide-leg','Rojo','M',0,8),
  ('wide-leg','Verde','M',0,9),
  ('wide-leg','Amarillo/Beige','M',0,10);
select nat_apply_auto_state('wide-leg');

-- Top blusa tira gruesa multicolor  (8 variantes)
update products set price=8.0, updated_at=now() where id='top-blusa-tira-gruesa-multicolor';
delete from product_sizes where product_id='top-blusa-tira-gruesa-multicolor';
delete from product_colors where product_id='top-blusa-tira-gruesa-multicolor';
insert into product_colors (product_id,name,hex,sort) values
  ('top-blusa-tira-gruesa-multicolor','Negro','#111111',0),
  ('top-blusa-tira-gruesa-multicolor','Verde','#2E7D32',1),
  ('top-blusa-tira-gruesa-multicolor','Coral','#FF7F50',2),
  ('top-blusa-tira-gruesa-multicolor','Celeste','#7EC8E3',3),
  ('top-blusa-tira-gruesa-multicolor','Azul océano','#006994',4),
  ('top-blusa-tira-gruesa-multicolor','Café','#6F4E37',5),
  ('top-blusa-tira-gruesa-multicolor','Blanco','#FFFFFF',6),
  ('top-blusa-tira-gruesa-multicolor','Lila','#B57EDC',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('top-blusa-tira-gruesa-multicolor','Negro','Standard',3,0),
  ('top-blusa-tira-gruesa-multicolor','Verde','Standard',1,1),
  ('top-blusa-tira-gruesa-multicolor','Coral','Standard',1,2),
  ('top-blusa-tira-gruesa-multicolor','Celeste','Standard',0,3),
  ('top-blusa-tira-gruesa-multicolor','Azul océano','Standard',1,4),
  ('top-blusa-tira-gruesa-multicolor','Café','Standard',1,5),
  ('top-blusa-tira-gruesa-multicolor','Blanco','Standard',2,6),
  ('top-blusa-tira-gruesa-multicolor','Lila','Standard',1,7);
select nat_apply_auto_state('top-blusa-tira-gruesa-multicolor');

-- Top cierre unicolor  (5 variantes)
update products set price=8.0, updated_at=now() where id='top-cierre-unicolor';
delete from product_sizes where product_id='top-cierre-unicolor';
delete from product_colors where product_id='top-cierre-unicolor';
insert into product_colors (product_id,name,hex,sort) values
  ('top-cierre-unicolor','Negro','#111111',0),
  ('top-cierre-unicolor','Palo rosa','#E8B4BC',1),
  ('top-cierre-unicolor','Azul','#1E88E5',2),
  ('top-cierre-unicolor','Blanco','#FFFFFF',3),
  ('top-cierre-unicolor','Lila','#B57EDC',4);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('top-cierre-unicolor','Negro','Standard',4,0),
  ('top-cierre-unicolor','Palo rosa','Standard',2,1),
  ('top-cierre-unicolor','Azul','Standard',2,2),
  ('top-cierre-unicolor','Blanco','Standard',2,3),
  ('top-cierre-unicolor','Lila','Standard',2,4);
select nat_apply_auto_state('top-cierre-unicolor');

-- Top rasgada  (6 variantes)
update products set price=8.0, updated_at=now() where id='top-rasgada';
delete from product_sizes where product_id='top-rasgada';
delete from product_colors where product_id='top-rasgada';
insert into product_colors (product_id,name,hex,sort) values
  ('top-rasgada','Negro','#111111',0),
  ('top-rasgada','Beige','#E3D2A8',1),
  ('top-rasgada','Verde claro','#81C784',2),
  ('top-rasgada','Blanco','#FFFFFF',3),
  ('top-rasgada','Azul obscuro','#0D47A1',4),
  ('top-rasgada','Rosa','#F48FB1',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('top-rasgada','Negro','Standard',2,0),
  ('top-rasgada','Beige','Standard',2,1),
  ('top-rasgada','Verde claro','Standard',2,2),
  ('top-rasgada','Blanco','Standard',2,3),
  ('top-rasgada','Azul obscuro','Standard',2,4),
  ('top-rasgada','Rosa','Standard',2,5);
select nat_apply_auto_state('top-rasgada');

-- Top rasgada con cierre  (6 variantes)
update products set price=8.0, updated_at=now() where id='top-rasgada-con-cierre';
delete from product_sizes where product_id='top-rasgada-con-cierre';
delete from product_colors where product_id='top-rasgada-con-cierre';
insert into product_colors (product_id,name,hex,sort) values
  ('top-rasgada-con-cierre','Negro','#111111',0),
  ('top-rasgada-con-cierre','Gris obscuro','#555555',1),
  ('top-rasgada-con-cierre','Verde obscuro','#1B5E20',2),
  ('top-rasgada-con-cierre','Blanco','#FFFFFF',3),
  ('top-rasgada-con-cierre','Azul obscuro','#0D47A1',4),
  ('top-rasgada-con-cierre','Roja','#D32F2F',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('top-rasgada-con-cierre','Negro','Standard',2,0),
  ('top-rasgada-con-cierre','Gris obscuro','Standard',2,1),
  ('top-rasgada-con-cierre','Verde obscuro','Standard',2,2),
  ('top-rasgada-con-cierre','Blanco','Standard',2,3),
  ('top-rasgada-con-cierre','Azul obscuro','Standard',2,4),
  ('top-rasgada-con-cierre','Roja','Standard',2,5);
select nat_apply_auto_state('top-rasgada-con-cierre');

-- Conjunto top manga larga y flare corte avispa  (12 variantes)
delete from product_sizes where product_id='conjunto-top-manga-larga-y-flare-corte-avispa';
delete from product_colors where product_id='conjunto-top-manga-larga-y-flare-corte-avispa';
insert into product_colors (product_id,name,hex,sort) values
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Fucsia','#E91E63',0),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Gris obscuro','#555555',1),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Negro','#111111',2),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Beige','#E3D2A8',3),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Café','#6F4E37',4),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Azul marino','#1A237E',5),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Verde militar','#4B5320',6),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Rosa','#F48FB1',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Fucsia','S',1,0),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Gris obscuro','S',1,1),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Gris obscuro','M',1,2),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Gris obscuro','L',1,3),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Negro','S',1,4),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Negro','L',1,5),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Beige','S',1,6),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Beige','M',1,7),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Café','M',1,8),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Azul marino','M',1,9),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Verde militar','L',0,10),
  ('conjunto-top-manga-larga-y-flare-corte-avispa','Rosa','L',1,11);
select nat_apply_auto_state('conjunto-top-manga-larga-y-flare-corte-avispa');

-- Jacket premium  (8 variantes)
delete from product_sizes where product_id='jacket-premium';
delete from product_colors where product_id='jacket-premium';
insert into product_colors (product_id,name,hex,sort) values
  ('jacket-premium','Rosa','#F48FB1',0),
  ('jacket-premium','Café','#6F4E37',1),
  ('jacket-premium','Negro','#111111',2),
  ('jacket-premium','Beige','#E3D2A8',3),
  ('jacket-premium','Negra','#111111',4);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('jacket-premium','Rosa','S',1,0),
  ('jacket-premium','Café','S',1,1),
  ('jacket-premium','Café','M',0,2),
  ('jacket-premium','Negro','S',0,3),
  ('jacket-premium','Beige','S',0,4),
  ('jacket-premium','Beige','M',0,5),
  ('jacket-premium','Negra','M',0,6),
  ('jacket-premium','Negra','L',1,7);
select nat_apply_auto_state('jacket-premium');

-- Flare tela rib  (12 variantes)
delete from product_sizes where product_id='flare-tela-rib';
delete from product_colors where product_id='flare-tela-rib';
insert into product_colors (product_id,name,hex,sort) values
  ('flare-tela-rib','Verde','#2E7D32',0),
  ('flare-tela-rib','Café','#6F4E37',1),
  ('flare-tela-rib','Gris','#9E9E9E',2),
  ('flare-tela-rib','Negro','#111111',3),
  ('flare-tela-rib','Crema','#F3E9D2',4),
  ('flare-tela-rib','Blanco','#FFFFFF',5),
  ('flare-tela-rib','Azul marino','#1A237E',6);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('flare-tela-rib','Verde','S',2,0),
  ('flare-tela-rib','Verde','M',2,1),
  ('flare-tela-rib','Café','S',2,2),
  ('flare-tela-rib','Gris','S',1,3),
  ('flare-tela-rib','Gris','M',2,4),
  ('flare-tela-rib','Negro','S',3,5),
  ('flare-tela-rib','Negro','M',2,6),
  ('flare-tela-rib','Crema','S',1,7),
  ('flare-tela-rib','Crema','M',1,8),
  ('flare-tela-rib','Blanco','S',2,9),
  ('flare-tela-rib','Blanco','M',2,10),
  ('flare-tela-rib','Azul marino','M',3,11);
select nat_apply_auto_state('flare-tela-rib');

-- Enterizo moldeador  (11 variantes)
delete from product_sizes where product_id='enterizo-moldeador';
delete from product_colors where product_id='enterizo-moldeador';
insert into product_colors (product_id,name,hex,sort) values
  ('enterizo-moldeador','Negra','#111111',0),
  ('enterizo-moldeador','Verde militar','#4B5320',1),
  ('enterizo-moldeador','Celeste','#7EC8E3',2),
  ('enterizo-moldeador','Café','#6F4E37',3),
  ('enterizo-moldeador','Negro','#111111',4),
  ('enterizo-moldeador','Vino','#6E1423',5),
  ('enterizo-moldeador','Gris','#9E9E9E',6);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('enterizo-moldeador','Negra','S',0,0),
  ('enterizo-moldeador','Negra','L',1,1),
  ('enterizo-moldeador','Verde militar','S',1,2),
  ('enterizo-moldeador','Celeste','S',0,3),
  ('enterizo-moldeador','Celeste','M',0,4),
  ('enterizo-moldeador','Celeste','L',1,5),
  ('enterizo-moldeador','Café','S',1,6),
  ('enterizo-moldeador','Café','M',1,7),
  ('enterizo-moldeador','Negro','M',0,8),
  ('enterizo-moldeador','Vino','M',1,9),
  ('enterizo-moldeador','Gris','M',0,10);
select nat_apply_auto_state('enterizo-moldeador');

-- Short corte corazón  (10 variantes)
delete from product_sizes where product_id='short-corte-corazon';
delete from product_colors where product_id='short-corte-corazon';
insert into product_colors (product_id,name,hex,sort) values
  ('short-corte-corazon','Negra','#111111',0),
  ('short-corte-corazon','Gris','#9E9E9E',1),
  ('short-corte-corazon','Azul eléctrico','#2979FF',2),
  ('short-corte-corazon','Azul marino','#1A237E',3),
  ('short-corte-corazon','Verde militar','#4B5320',4),
  ('short-corte-corazon','Fucsia','#E91E63',5),
  ('short-corte-corazon','Café','#6F4E37',6),
  ('short-corte-corazon','Beige','#E3D2A8',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('short-corte-corazon','Negra','S',2,0),
  ('short-corte-corazon','Gris','S',1,1),
  ('short-corte-corazon','Gris','M',2,2),
  ('short-corte-corazon','Azul eléctrico','S',1,3),
  ('short-corte-corazon','Azul marino','S',0,4),
  ('short-corte-corazon','Verde militar','S',0,5),
  ('short-corte-corazon','Verde militar','M',1,6),
  ('short-corte-corazon','Fucsia','M',1,7),
  ('short-corte-corazon','Café','M',0,8),
  ('short-corte-corazon','Beige','M',1,9);
select nat_apply_auto_state('short-corte-corazon');

-- Blusa compresora  (12 variantes)
delete from product_sizes where product_id='52e9e88a-13b7-4c4c-adcb-435278dfffee';
delete from product_colors where product_id='52e9e88a-13b7-4c4c-adcb-435278dfffee';
insert into product_colors (product_id,name,hex,sort) values
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Negra','#111111',0),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Rosada','#F4A6C0',1),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Menta','#A8E4C0',2),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Morado','#6A1B9A',3),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Beige','#E3D2A8',4),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Azul','#1E88E5',5),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Lila','#B57EDC',6),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Celeste grisáceo','#A9C0CC',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Negra','S',0,0),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Negra','M',0,1),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Negra','L',0,2),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Rosada','S',0,3),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Rosada','M',0,4),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Menta','S',0,5),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Menta','L',0,6),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Morado','M',0,7),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Beige','M',0,8),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Azul','M',0,9),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Lila','L',0,10),
  ('52e9e88a-13b7-4c4c-adcb-435278dfffee','Celeste grisáceo','L',0,11);
select nat_apply_auto_state('52e9e88a-13b7-4c4c-adcb-435278dfffee');

-- Falda con tablones  [NUEVO]  (12 variantes)
insert into products (id,name,slug,category_id,price,state,min_stock,charts) values ('falda-con-tablones','Falda con tablones','falda-con-tablones','faldas',0,'disponible',3,'{inferior}') on conflict (id) do nothing;
insert into product_costs (product_id,cost) values ('falda-con-tablones',0) on conflict (product_id) do nothing;
delete from product_sizes where product_id='falda-con-tablones';
delete from product_colors where product_id='falda-con-tablones';
insert into product_colors (product_id,name,hex,sort) values
  ('falda-con-tablones','Negra','#111111',0),
  ('falda-con-tablones','Azul marino','#1A237E',1),
  ('falda-con-tablones','Gris','#9E9E9E',2),
  ('falda-con-tablones','Azul océano','#006994',3),
  ('falda-con-tablones','Rosa','#F48FB1',4),
  ('falda-con-tablones','Lila','#B57EDC',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('falda-con-tablones','Negra','S/M',0,0),
  ('falda-con-tablones','Negra','L/XL',0,1),
  ('falda-con-tablones','Azul marino','S/M',0,2),
  ('falda-con-tablones','Azul marino','L/XL',0,3),
  ('falda-con-tablones','Gris','S/M',0,4),
  ('falda-con-tablones','Gris','L/XL',0,5),
  ('falda-con-tablones','Azul océano','S/M',0,6),
  ('falda-con-tablones','Azul océano','L/XL',0,7),
  ('falda-con-tablones','Rosa','S/M',0,8),
  ('falda-con-tablones','Rosa','L/XL',0,9),
  ('falda-con-tablones','Lila','S/M',0,10),
  ('falda-con-tablones','Lila','L/XL',0,11);
select nat_apply_auto_state('falda-con-tablones');

-- Conjunto top con cierre y flare pants  [NUEVO]  (11 variantes)
insert into products (id,name,slug,category_id,price,state,min_stock,charts) values ('conjunto-top-con-cierre-y-flare-pants','Conjunto top con cierre y flare pants','conjunto-top-con-cierre-y-flare-pants','sets',0,'disponible',3,'{inferior}') on conflict (id) do nothing;
insert into product_costs (product_id,cost) values ('conjunto-top-con-cierre-y-flare-pants',0) on conflict (product_id) do nothing;
delete from product_sizes where product_id='conjunto-top-con-cierre-y-flare-pants';
delete from product_colors where product_id='conjunto-top-con-cierre-y-flare-pants';
insert into product_colors (product_id,name,hex,sort) values
  ('conjunto-top-con-cierre-y-flare-pants','Beige','#E3D2A8',0),
  ('conjunto-top-con-cierre-y-flare-pants','Café','#6F4E37',1),
  ('conjunto-top-con-cierre-y-flare-pants','Azul océano','#006994',2),
  ('conjunto-top-con-cierre-y-flare-pants','Negra','#111111',3),
  ('conjunto-top-con-cierre-y-flare-pants','Café claro','#A9745B',4),
  ('conjunto-top-con-cierre-y-flare-pants','Gris','#9E9E9E',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('conjunto-top-con-cierre-y-flare-pants','Beige','S',0,0),
  ('conjunto-top-con-cierre-y-flare-pants','Beige','M',0,1),
  ('conjunto-top-con-cierre-y-flare-pants','Café','S',0,2),
  ('conjunto-top-con-cierre-y-flare-pants','Café','M',0,3),
  ('conjunto-top-con-cierre-y-flare-pants','Azul océano','S',0,4),
  ('conjunto-top-con-cierre-y-flare-pants','Azul océano','L',0,5),
  ('conjunto-top-con-cierre-y-flare-pants','Negra','S',0,6),
  ('conjunto-top-con-cierre-y-flare-pants','Negra','M',0,7),
  ('conjunto-top-con-cierre-y-flare-pants','Negra','L',0,8),
  ('conjunto-top-con-cierre-y-flare-pants','Café claro','M',0,9),
  ('conjunto-top-con-cierre-y-flare-pants','Gris','L',0,10);
select nat_apply_auto_state('conjunto-top-con-cierre-y-flare-pants');

-- Vestido con short  (10 variantes)
delete from product_sizes where product_id='vestido-con-short';
delete from product_colors where product_id='vestido-con-short';
insert into product_colors (product_id,name,hex,sort) values
  ('vestido-con-short','Celeste obscura','#4A90A4',0),
  ('vestido-con-short','Café','#6F4E37',1),
  ('vestido-con-short','Rosa','#F48FB1',2),
  ('vestido-con-short','Negra','#111111',3),
  ('vestido-con-short','Lila','#B57EDC',4),
  ('vestido-con-short','Celeste Claro','#B3E5FC',5),
  ('vestido-con-short','Verde aqua','#2EC4B6',6),
  ('vestido-con-short','Gris','#9E9E9E',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('vestido-con-short','Celeste obscura','S',1,0),
  ('vestido-con-short','Café','S',2,1),
  ('vestido-con-short','Rosa','S',2,2),
  ('vestido-con-short','Rosa','M',0,3),
  ('vestido-con-short','Negra','S',3,4),
  ('vestido-con-short','Negra','M',3,5),
  ('vestido-con-short','Lila','S',2,6),
  ('vestido-con-short','Celeste Claro','M',1,7),
  ('vestido-con-short','Verde aqua','M',0,8),
  ('vestido-con-short','Gris','L',1,9);
select nat_apply_auto_state('vestido-con-short');

-- Set yoga  (11 variantes)
update products set price=20.0, updated_at=now() where id='set-yoga';
delete from product_sizes where product_id='set-yoga';
delete from product_colors where product_id='set-yoga';
insert into product_colors (product_id,name,hex,sort) values
  ('set-yoga','Marrón','#7B3F00',0),
  ('set-yoga','Gris','#9E9E9E',1),
  ('set-yoga','Rojo','#D32F2F',2),
  ('set-yoga','Rosa','#F48FB1',3),
  ('set-yoga','Azul','#1E88E5',4),
  ('set-yoga','Negro','#111111',5),
  ('set-yoga','Café','#6F4E37',6),
  ('set-yoga','Blanco + negro','#BFBFBF',7);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('set-yoga','Marrón','S',1,0),
  ('set-yoga','Gris','S',1,1),
  ('set-yoga','Gris','M',1,2),
  ('set-yoga','Rojo','S',1,3),
  ('set-yoga','Rosa','S',1,4),
  ('set-yoga','Azul','S',1,5),
  ('set-yoga','Azul','M',1,6),
  ('set-yoga','Negro','S',1,7),
  ('set-yoga','Negro','M',2,8),
  ('set-yoga','Café','M',1,9),
  ('set-yoga','Blanco + negro','M',0,10);
select nat_apply_auto_state('set-yoga');

-- Short animal print  (12 variantes)
delete from product_sizes where product_id='short-animal-print';
delete from product_colors where product_id='short-animal-print';
insert into product_colors (product_id,name,hex,sort) values
  ('short-animal-print','Marrón','#7B3F00',0),
  ('short-animal-print','Gris','#9E9E9E',1),
  ('short-animal-print','Beige','#E3D2A8',2),
  ('short-animal-print','Rosa','#F48FB1',3),
  ('short-animal-print','Azul','#1E88E5',4),
  ('short-animal-print','Café','#6F4E37',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('short-animal-print','Marrón','S',2,0),
  ('short-animal-print','Marrón','M',2,1),
  ('short-animal-print','Gris','S',2,2),
  ('short-animal-print','Gris','M',2,3),
  ('short-animal-print','Beige','S',2,4),
  ('short-animal-print','Beige','M',2,5),
  ('short-animal-print','Rosa','S',1,6),
  ('short-animal-print','Rosa','M',2,7),
  ('short-animal-print','Azul','S',2,8),
  ('short-animal-print','Azul','M',1,9),
  ('short-animal-print','Café','S',2,10),
  ('short-animal-print','Café','M',2,11);
select nat_apply_auto_state('short-animal-print');

-- Set Serena  (9 variantes)
delete from product_sizes where product_id='set-serena';
delete from product_colors where product_id='set-serena';
insert into product_colors (product_id,name,hex,sort) values
  ('set-serena','Azul','#1E88E5',0),
  ('set-serena','Negro','#111111',1),
  ('set-serena','Café','#6F4E37',2),
  ('set-serena','Azul obscuro','#0D47A1',3),
  ('set-serena','Rosa','#F48FB1',4),
  ('set-serena','Verde','#2E7D32',5),
  ('set-serena','Rojo','#D32F2F',6);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('set-serena','Azul','S',0,0),
  ('set-serena','Negro','S',2,1),
  ('set-serena','Negro','M',1,2),
  ('set-serena','Negro','L',1,3),
  ('set-serena','Café','M',0,4),
  ('set-serena','Azul obscuro','M',1,5),
  ('set-serena','Rosa','M',0,6),
  ('set-serena','Verde','L',1,7),
  ('set-serena','Rojo','L',1,8);
select nat_apply_auto_state('set-serena');

-- Set Corto Push Up  (11 variantes)
delete from product_sizes where product_id='set-corto-push-up';
delete from product_colors where product_id='set-corto-push-up';
insert into product_colors (product_id,name,hex,sort) values
  ('set-corto-push-up','Azul obscuro','#0D47A1',0),
  ('set-corto-push-up','Negro','#111111',1),
  ('set-corto-push-up','Vino','#6E1423',2),
  ('set-corto-push-up','Azul','#1E88E5',3),
  ('set-corto-push-up','Verde','#2E7D32',4),
  ('set-corto-push-up','Rojo','#D32F2F',5),
  ('set-corto-push-up','Gris','#9E9E9E',6),
  ('set-corto-push-up','Rosado','#F4A6C0',7),
  ('set-corto-push-up','Café','#6F4E37',8);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('set-corto-push-up','Azul obscuro','S',1,0),
  ('set-corto-push-up','Negro','S',1,1),
  ('set-corto-push-up','Negro','M',2,2),
  ('set-corto-push-up','Negro','L',0,3),
  ('set-corto-push-up','Vino','S',1,4),
  ('set-corto-push-up','Azul','M',1,5),
  ('set-corto-push-up','Verde','M',1,6),
  ('set-corto-push-up','Rojo','M',1,7),
  ('set-corto-push-up','Gris','M',1,8),
  ('set-corto-push-up','Rosado','L',1,9),
  ('set-corto-push-up','Café','L',1,10);
select nat_apply_auto_state('set-corto-push-up');

-- Set Corto Realce  (12 variantes)
delete from product_sizes where product_id='set-corto-realce';
delete from product_colors where product_id='set-corto-realce';
insert into product_colors (product_id,name,hex,sort) values
  ('set-corto-realce','Azul elétrico','#2979FF',0),
  ('set-corto-realce','Negro','#111111',1),
  ('set-corto-realce','Café','#6F4E37',2),
  ('set-corto-realce','Amarillo claro','#FFF59D',3),
  ('set-corto-realce','Azul','#1E88E5',4),
  ('set-corto-realce','Verde','#2E7D32',5),
  ('set-corto-realce','Vino','#6E1423',6),
  ('set-corto-realce','Rosa','#F48FB1',7),
  ('set-corto-realce','Rojo','#D32F2F',8),
  ('set-corto-realce','Gris','#9E9E9E',9);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('set-corto-realce','Azul elétrico','S',1,0),
  ('set-corto-realce','Negro','S',0,1),
  ('set-corto-realce','Negro','M',1,2),
  ('set-corto-realce','Café','S',0,3),
  ('set-corto-realce','Amarillo claro','S',1,4),
  ('set-corto-realce','Azul','M',1,5),
  ('set-corto-realce','Azul','L',1,6),
  ('set-corto-realce','Verde','M',1,7),
  ('set-corto-realce','Vino','M',1,8),
  ('set-corto-realce','Rosa','M',1,9),
  ('set-corto-realce','Rojo','L',1,10),
  ('set-corto-realce','Gris','L',1,11);
select nat_apply_auto_state('set-corto-realce');

-- Falda lisa con bolsillo  (10 variantes)
delete from product_sizes where product_id='falda-lisa-con-bolsillo';
delete from product_colors where product_id='falda-lisa-con-bolsillo';
insert into product_colors (product_id,name,hex,sort) values
  ('falda-lisa-con-bolsillo','Gris','#9E9E9E',0),
  ('falda-lisa-con-bolsillo','Negro','#111111',1),
  ('falda-lisa-con-bolsillo','Café','#6F4E37',2),
  ('falda-lisa-con-bolsillo','Crema','#F3E9D2',3),
  ('falda-lisa-con-bolsillo','Blanco','#FFFFFF',4);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('falda-lisa-con-bolsillo','Gris','S',1,0),
  ('falda-lisa-con-bolsillo','Gris','M',1,1),
  ('falda-lisa-con-bolsillo','Negro','S',2,2),
  ('falda-lisa-con-bolsillo','Negro','M',2,3),
  ('falda-lisa-con-bolsillo','Café','S',1,4),
  ('falda-lisa-con-bolsillo','Café','M',1,5),
  ('falda-lisa-con-bolsillo','Crema','S',1,6),
  ('falda-lisa-con-bolsillo','Crema','M',1,7),
  ('falda-lisa-con-bolsillo','Blanco','S',1,8),
  ('falda-lisa-con-bolsillo','Blanco','M',1,9);
select nat_apply_auto_state('falda-lisa-con-bolsillo');

-- Set Emma fit  (10 variantes)
update products set price=20.0, updated_at=now() where id='set-emma-fit';
delete from product_sizes where product_id='set-emma-fit';
delete from product_colors where product_id='set-emma-fit';
insert into product_colors (product_id,name,hex,sort) values
  ('set-emma-fit','Rosa','#F48FB1',0),
  ('set-emma-fit','Celeste','#7EC8E3',1),
  ('set-emma-fit','Negro','#111111',2),
  ('set-emma-fit','Morado','#6A1B9A',3),
  ('set-emma-fit','Vino','#6E1423',4),
  ('set-emma-fit','Azul','#1E88E5',5),
  ('set-emma-fit','Lila','#B57EDC',6),
  ('set-emma-fit','Café','#6F4E37',7),
  ('set-emma-fit','Verde','#2E7D32',8);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('set-emma-fit','Rosa','S',2,0),
  ('set-emma-fit','Celeste','S',1,1),
  ('set-emma-fit','Negro','S',2,2),
  ('set-emma-fit','Negro','M',4,3),
  ('set-emma-fit','Morado','S',1,4),
  ('set-emma-fit','Vino','M',1,5),
  ('set-emma-fit','Azul','M',1,6),
  ('set-emma-fit','Lila','L',2,7),
  ('set-emma-fit','Café','L',1,8),
  ('set-emma-fit','Verde','L',2,9);
select nat_apply_auto_state('set-emma-fit');

-- Flare pant premium  (21 variantes)
update products set price=18.0, updated_at=now() where id='flare-pant-premium';
delete from product_sizes where product_id='flare-pant-premium';
delete from product_colors where product_id='flare-pant-premium';
insert into product_colors (product_id,name,hex,sort) values
  ('flare-pant-premium','Fucsia','#E91E63',0),
  ('flare-pant-premium','Vino','#6E1423',1),
  ('flare-pant-premium','Verde limón','#9ACD32',2),
  ('flare-pant-premium','Lila','#B57EDC',3),
  ('flare-pant-premium','Negro','#111111',4),
  ('flare-pant-premium','Verde oliva','#808000',5),
  ('flare-pant-premium','Rojo','#D32F2F',6),
  ('flare-pant-premium','Caqui','#C3B091',7),
  ('flare-pant-premium','Gris','#9E9E9E',8),
  ('flare-pant-premium','Azul marino','#1A237E',9),
  ('flare-pant-premium','Verde olivo','#808000',10),
  ('flare-pant-premium','Azul oscuro','#0D47A1',11);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('flare-pant-premium','Fucsia','S',1,0),
  ('flare-pant-premium','Fucsia','L',1,1),
  ('flare-pant-premium','Fucsia','XL',1,2),
  ('flare-pant-premium','Vino','S',0,3),
  ('flare-pant-premium','Vino','M',2,4),
  ('flare-pant-premium','Vino','XL',1,5),
  ('flare-pant-premium','Verde limón','S',1,6),
  ('flare-pant-premium','Verde limón','L',1,7),
  ('flare-pant-premium','Lila','S',1,8),
  ('flare-pant-premium','Lila','M',1,9),
  ('flare-pant-premium','Lila','L',1,10),
  ('flare-pant-premium','Negro','S',1,11),
  ('flare-pant-premium','Negro','XL',1,12),
  ('flare-pant-premium','Verde oliva','M',2,13),
  ('flare-pant-premium','Rojo','L',1,14),
  ('flare-pant-premium','Caqui','L',1,15),
  ('flare-pant-premium','Gris','L',1,16),
  ('flare-pant-premium','Gris','XL',1,17),
  ('flare-pant-premium','Azul marino','L',1,18),
  ('flare-pant-premium','Verde olivo','XL',1,19),
  ('flare-pant-premium','Azul oscuro','XL',0,20);
select nat_apply_auto_state('flare-pant-premium');

-- Jacket manga corta  (12 variantes)
delete from product_sizes where product_id='jacket-manga-corta';
delete from product_colors where product_id='jacket-manga-corta';
insert into product_colors (product_id,name,hex,sort) values
  ('jacket-manga-corta','Beige','#E3D2A8',0),
  ('jacket-manga-corta','Vino','#6E1423',1),
  ('jacket-manga-corta','Gris','#9E9E9E',2),
  ('jacket-manga-corta','Verde olivo','#808000',3),
  ('jacket-manga-corta','Rojo','#D32F2F',4),
  ('jacket-manga-corta','Verde oliva','#808000',5),
  ('jacket-manga-corta','Negro','#111111',6),
  ('jacket-manga-corta','Roja','#D32F2F',7),
  ('jacket-manga-corta','Negra','#111111',8);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('jacket-manga-corta','Beige','S',2,0),
  ('jacket-manga-corta','Beige','L',2,1),
  ('jacket-manga-corta','Vino','S',2,2),
  ('jacket-manga-corta','Vino','L',2,3),
  ('jacket-manga-corta','Gris','S',2,4),
  ('jacket-manga-corta','Gris','M',2,5),
  ('jacket-manga-corta','Verde olivo','S',2,6),
  ('jacket-manga-corta','Rojo','M',2,7),
  ('jacket-manga-corta','Verde oliva','M',2,8),
  ('jacket-manga-corta','Negro','M',2,9),
  ('jacket-manga-corta','Roja','L',2,10),
  ('jacket-manga-corta','Negra','L',2,11);
select nat_apply_auto_state('jacket-manga-corta');

-- Enterizo con escote  (10 variantes)
update products set price=14.29, updated_at=now() where id='enterizo-con-escote';
delete from product_sizes where product_id='enterizo-con-escote';
delete from product_colors where product_id='enterizo-con-escote';
insert into product_colors (product_id,name,hex,sort) values
  ('enterizo-con-escote','Negro','#111111',0),
  ('enterizo-con-escote','Azul','#1E88E5',1),
  ('enterizo-con-escote','Beige','#E3D2A8',2),
  ('enterizo-con-escote','Rosado barbie','#FF69B4',3),
  ('enterizo-con-escote','Café','#6F4E37',4),
  ('enterizo-con-escote','Negra','#111111',5);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('enterizo-con-escote','Negro','S',2,0),
  ('enterizo-con-escote','Negro','M',2,1),
  ('enterizo-con-escote','Azul','S',0,2),
  ('enterizo-con-escote','Azul','L',1,3),
  ('enterizo-con-escote','Beige','S',1,4),
  ('enterizo-con-escote','Beige','M',1,5),
  ('enterizo-con-escote','Rosado barbie','S',1,6),
  ('enterizo-con-escote','Rosado barbie','M',1,7),
  ('enterizo-con-escote','Café','M',0,8),
  ('enterizo-con-escote','Negra','L',1,9);
select nat_apply_auto_state('enterizo-con-escote');

-- Jacket black and white  (6 variantes)
delete from product_sizes where product_id='jacket-black-and-white';
delete from product_colors where product_id='jacket-black-and-white';
insert into product_colors (product_id,name,hex,sort) values
  ('jacket-black-and-white','Negro','#111111',0),
  ('jacket-black-and-white','Blanco','#FFFFFF',1),
  ('jacket-black-and-white','Negra','#111111',2);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('jacket-black-and-white','Negro','S',6,0),
  ('jacket-black-and-white','Negro','M',6,1),
  ('jacket-black-and-white','Blanco','S',4,2),
  ('jacket-black-and-white','Blanco','M',2,3),
  ('jacket-black-and-white','Blanco','L',2,4),
  ('jacket-black-and-white','Negra','L',4,5);
select nat_apply_auto_state('jacket-black-and-white');

-- Short con bolsillo  (10 variantes)
update products set price=10.82, updated_at=now() where id='short-con-bolsillo';
delete from product_sizes where product_id='short-con-bolsillo';
delete from product_colors where product_id='short-con-bolsillo';
insert into product_colors (product_id,name,hex,sort) values
  ('short-con-bolsillo','Gris obscuro','#555555',0),
  ('short-con-bolsillo','Celeste','#7EC8E3',1),
  ('short-con-bolsillo','Gris claro','#CCCCCC',2),
  ('short-con-bolsillo','Rosado','#F4A6C0',3),
  ('short-con-bolsillo','Café','#6F4E37',4);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('short-con-bolsillo','Gris obscuro','S',2,0),
  ('short-con-bolsillo','Gris obscuro','M',2,1),
  ('short-con-bolsillo','Celeste','S',1,2),
  ('short-con-bolsillo','Celeste','M',1,3),
  ('short-con-bolsillo','Gris claro','S',1,4),
  ('short-con-bolsillo','Gris claro','M',1,5),
  ('short-con-bolsillo','Rosado','S',1,6),
  ('short-con-bolsillo','Rosado','M',1,7),
  ('short-con-bolsillo','Café','S',1,8),
  ('short-con-bolsillo','Café','M',1,9);
select nat_apply_auto_state('short-con-bolsillo');

-- Blusa deportiva  (14 variantes)
delete from product_sizes where product_id='blusa-deportiva';
delete from product_colors where product_id='blusa-deportiva';
insert into product_colors (product_id,name,hex,sort) values
  ('blusa-deportiva','Lila','#B57EDC',0),
  ('blusa-deportiva','Azul marino','#1A237E',1),
  ('blusa-deportiva','Café','#6F4E37',2),
  ('blusa-deportiva','Negro','#111111',3),
  ('blusa-deportiva','Verde claro','#81C784',4),
  ('blusa-deportiva','Verde militar','#4B5320',5),
  ('blusa-deportiva','Rosado','#F4A6C0',6),
  ('blusa-deportiva','Crema','#F3E9D2',7),
  ('blusa-deportiva','Celeste','#7EC8E3',8),
  ('blusa-deportiva','Vino','#6E1423',9);
insert into product_sizes (product_id,color,name,stock,sort) values
  ('blusa-deportiva','Lila','XS/S',2,0),
  ('blusa-deportiva','Lila','S/M',2,1),
  ('blusa-deportiva','Azul marino','XS/S',2,2),
  ('blusa-deportiva','Azul marino','S/M',2,3),
  ('blusa-deportiva','Café','XS/S',3,4),
  ('blusa-deportiva','Negro','XS/S',3,5),
  ('blusa-deportiva','Verde claro','XS/S',2,6),
  ('blusa-deportiva','Verde militar','XS/S',1,7),
  ('blusa-deportiva','Verde militar','S/M',2,8),
  ('blusa-deportiva','Rosado','XS/S',2,9),
  ('blusa-deportiva','Rosado','S/M',2,10),
  ('blusa-deportiva','Crema','S/M',3,11),
  ('blusa-deportiva','Celeste','S/M',2,12),
  ('blusa-deportiva','Vino','S/M',1,13);
select nat_apply_auto_state('blusa-deportiva');

commit;

-- Productos NUEVOS creados (sin imagen, súbeles foto en el panel):
--   - Falda con tablones
--   - Conjunto top con cierre y flare pants