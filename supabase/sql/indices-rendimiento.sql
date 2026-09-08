-- Indices que faltaban.
--
-- Hasta ahora las unicas entradas eran las claves primarias y los unique de
-- codigo. Todo lo demas (buscar los items de un pedido, los pedidos de un
-- cliente, los pagos de una cuenta) resolvia recorriendo la tabla entera.
--
-- El caso mas caro es catalogo_stock_disponible: se ejecuta una vez por
-- producto cada vez que alguien abre el catalogo publico, y adentro suma
-- pedido_items filtrando por producto_id. Sin indice eso es un recorrido
-- completo de pedido_items por cada producto del catalogo.
--
-- create index if not exists es idempotente: se puede correr mas de una vez.
-- concurrently no se usa para que ande dentro del bloque de migracion.

-- Items y pedidos ------------------------------------------------------------
create index if not exists pedido_items_pedido_id_idx
  on public.pedido_items (pedido_id);

create index if not exists pedido_items_producto_id_idx
  on public.pedido_items (producto_id);

create index if not exists pedidos_cliente_id_idx
  on public.pedidos (cliente_id);

create index if not exists pedidos_vendedor_id_idx
  on public.pedidos (vendedor_id);

create index if not exists pedidos_estado_fecha_idx
  on public.pedidos (estado, fecha desc);

-- Reserva de stock del catalogo: solo interesan los pedidos pendientes.
create index if not exists pedidos_pendientes_idx
  on public.pedidos (id) where estado = 'PENDIENTE';

create index if not exists pedidos_origen_idx
  on public.pedidos (origen) where origen = 'catalogo';

-- Cuenta corriente -----------------------------------------------------------
create index if not exists pagos_cliente_cliente_id_fecha_idx
  on public.pagos_cliente (cliente_id, fecha desc);

-- Stock ----------------------------------------------------------------------
create index if not exists movimientos_stock_producto_fecha_idx
  on public.movimientos_stock (producto_id, fecha desc);

-- Catalogo publico -----------------------------------------------------------
create index if not exists productos_catalogo_idx
  on public.productos (nombre) where activo = true and mostrar_catalogo = true;

-- Claves foraneas sin indice (frenan los borrados y los joins) ----------------
create index if not exists productos_rubro_id_idx on public.productos (rubro_id);
create index if not exists productos_proveedor_id_idx on public.productos (proveedor_id);
create index if not exists clientes_zona_id_idx on public.clientes (zona_id);
create index if not exists clientes_vendedor_id_idx on public.clientes (vendedor_id);
create index if not exists clientes_lista_precio_id_idx on public.clientes (lista_precio_id);
create index if not exists usuarios_rol_id_idx on public.usuarios (rol_id);
create index if not exists producto_precios_lista_idx on public.producto_precios (lista_precio_id);

-- Las politicas RLS de vendedor comparan lower(trim(email)) en cada fila.
create index if not exists vendedores_email_normalizado_idx
  on public.vendedores (lower(trim(email))) where activo = true;

create index if not exists clientes_vendedor_asignado_idx
  on public.clientes (lower(trim(vendedor_asignado)));

-- Auditoria: siempre se leen los ultimos 500 por fecha descendente.
create index if not exists auditoria_fecha_idx
  on public.auditoria (fecha desc);

-- Listados que se ordenan por fecha ------------------------------------------
create index if not exists compras_fecha_idx on public.compras (fecha desc);
create index if not exists proveedor_pagos_fecha_idx on public.proveedor_pagos (fecha desc);

analyze;
