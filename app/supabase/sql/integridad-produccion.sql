-- Reglas de integridad para usar la base en produccion.
-- Ejecutar despues de schema-inicial.sql y schema-ajustes-js.sql.
-- Las restricciones se crean NOT VALID para no romper una base con datos viejos;
-- desde ese momento protegen filas nuevas y luego se pueden validar una por una.

create extension if not exists pgcrypto;

create index if not exists clientes_zona_id_idx on clientes(zona_id);
create index if not exists clientes_lista_precio_id_idx on clientes(lista_precio_id);
create index if not exists clientes_vendedor_id_idx on clientes(vendedor_id);
create index if not exists productos_rubro_id_idx on productos(rubro_id);
create index if not exists productos_proveedor_id_idx on productos(proveedor_id);
create index if not exists pedidos_cliente_id_idx on pedidos(cliente_id);
create index if not exists pedidos_vendedor_id_idx on pedidos(vendedor_id);
create index if not exists pedido_items_pedido_id_idx on pedido_items(pedido_id);
create index if not exists pedido_items_producto_id_idx on pedido_items(producto_id);
create index if not exists pagos_cliente_cliente_id_idx on pagos_cliente(cliente_id);
create index if not exists movimientos_stock_producto_id_idx on movimientos_stock(producto_id);
create index if not exists auditoria_fecha_idx on auditoria(fecha desc);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'roles_nombre_no_vacio_chk') then
    alter table roles add constraint roles_nombre_no_vacio_chk check (length(trim(nombre)) > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'usuarios_codigo_positivo_chk') then
    alter table usuarios add constraint usuarios_codigo_positivo_chk check (codigo > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'usuarios_nombre_no_vacio_chk') then
    alter table usuarios add constraint usuarios_nombre_no_vacio_chk check (length(trim(nombre)) > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'clientes_codigo_positivo_chk') then
    alter table clientes add constraint clientes_codigo_positivo_chk check (codigo > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'clientes_saldo_valido_chk') then
    alter table clientes add constraint clientes_saldo_valido_chk check (saldo is not null) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'productos_codigo_positivo_chk') then
    alter table productos add constraint productos_codigo_positivo_chk check (codigo > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'productos_importes_no_negativos_chk') then
    alter table productos add constraint productos_importes_no_negativos_chk
      check (precio_compra >= 0 and precio_base >= 0 and stock_minimo >= 0 and pack >= 0 and iva >= 0 and bonificacion_venta >= 0)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listas_precios_codigo_positivo_chk') then
    alter table listas_precios add constraint listas_precios_codigo_positivo_chk check (codigo > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listas_precios_porcentaje_valido_chk') then
    alter table listas_precios add constraint listas_precios_porcentaje_valido_chk check (porcentaje >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pedidos_numero_positivo_chk') then
    alter table pedidos add constraint pedidos_numero_positivo_chk check (numero > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pedidos_importes_no_negativos_chk') then
    alter table pedidos add constraint pedidos_importes_no_negativos_chk check (total >= 0 and pagado >= 0 and saldo_generado >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pedidos_estado_cobro_valido_chk') then
    alter table pedidos add constraint pedidos_estado_cobro_valido_chk
      check (estado_cobro in ('', 'COBRADO', 'CUENTA_CORRIENTE'))
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pedido_items_importes_no_negativos_chk') then
    alter table pedido_items add constraint pedido_items_importes_no_negativos_chk
      check (cantidad > 0 and precio_unitario >= 0 and descuento_porcentaje >= 0 and subtotal >= 0)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pagos_cliente_importe_positivo_chk') then
    alter table pagos_cliente add constraint pagos_cliente_importe_positivo_chk check (importe > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'proveedor_pagos_importe_positivo_chk') then
    alter table proveedor_pagos add constraint proveedor_pagos_importe_positivo_chk check (importe > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'compras_importes_no_negativos_chk') then
    alter table compras add constraint compras_importes_no_negativos_chk
      check (cantidad > 0 and costo_unitario >= 0 and total >= 0 and costo_anterior >= 0 and precios_actualizados >= 0)
      not valid;
  end if;
end $$;

-- Cuando confirmes que los datos viejos estan limpios, podes validar asi:
-- alter table productos validate constraint productos_importes_no_negativos_chk;
-- alter table pedidos validate constraint pedidos_importes_no_negativos_chk;
-- alter table pedidos validate constraint pedidos_estado_cobro_valido_chk;
-- alter table pedido_items validate constraint pedido_items_importes_no_negativos_chk;
