-- Ajustes para que la base ya creada coincida con el JavaScript actual.
-- Ejecutar una vez si ya corriste schema-inicial.sql antes de estos cambios.
-- No borra datos.

alter table clientes
  add column if not exists codigo integer,
  add column if not exists nombre text not null default 'Cliente',
  add column if not exists saldo numeric(14, 2) not null default 0,
  add column if not exists telefono text not null default '-',
  add column if not exists direccion text not null default '-',
  add column if not exists zona text not null default 'Sin zona',
  add column if not exists activo boolean not null default true,
  add column if not exists razon_social text not null default '',
  add column if not exists nombre_fantasia text not null default '',
  add column if not exists localidad text not null default '',
  add column if not exists codigo_postal text not null default '',
  add column if not exists telefono_particular text not null default '',
  add column if not exists telefono_movil text not null default '',
  add column if not exists email text not null default '',
  add column if not exists lista_precios text not null default '',
  add column if not exists posicion_zona integer not null default 0,
  add column if not exists vendedor_asignado text not null default '',
  add column if not exists condicion_iva text not null default '',
  add column if not exists horario_atencion text not null default '',
  add column if not exists observaciones text not null default '';

alter table productos
  add column if not exists codigo integer,
  add column if not exists codigo_real text not null default '',
  add column if not exists nombre text not null default 'Producto',
  add column if not exists precio_compra numeric(14, 2) not null default 0,
  add column if not exists precio_base numeric(14, 2) not null default 0,
  add column if not exists stock numeric(14, 3) not null default 0,
  add column if not exists stock_minimo numeric(14, 3) not null default 0,
  add column if not exists rubro text not null default 'Sin rubro',
  add column if not exists proveedor text not null default 'Sin proveedor',
  add column if not exists proveedor_alternativo text not null default '',
  add column if not exists marca text not null default '',
  add column if not exists tipo text not null default '',
  add column if not exists detalle text not null default '',
  add column if not exists pack numeric(14, 2) not null default 0,
  add column if not exists unidad text not null default '',
  add column if not exists iva numeric(6, 2) not null default 0,
  add column if not exists bonificacion_venta numeric(6, 2) not null default 0,
  add column if not exists precios_lista jsonb not null default '{}'::jsonb,
  add column if not exists historial_precios jsonb not null default '[]'::jsonb,
  add column if not exists movimientos_stock jsonb not null default '[]'::jsonb,
  add column if not exists activo boolean not null default true,
  add column if not exists baja_automatica_stock boolean not null default false,
  add column if not exists imagen_url text not null default '',
  add column if not exists mostrar_catalogo boolean not null default false;

alter table productos
  alter column baja_automatica_stock set default false,
  alter column mostrar_catalogo set default false;

alter table usuarios
  add column if not exists email text not null default '';

alter table pedidos
  add column if not exists vendedor text not null default 'Sin vendedor',
  add column if not exists zona text not null default 'Sin zona',
  add column if not exists estado_cobro text not null default '',
  add column if not exists fecha_entrega timestamptz,
  add column if not exists nota_credito jsonb not null default '[]'::jsonb;

alter table pedido_items
  add column if not exists lista_precio_nombre text not null default 'Lista 1';

alter table productos
  alter column stock type numeric(14, 3) using stock::numeric,
  alter column stock_minimo type numeric(14, 3) using stock_minimo::numeric;

alter table pedido_items
  alter column cantidad type numeric(14, 3) using cantidad::numeric;

alter table movimientos_stock
  alter column cantidad type numeric(14, 3) using cantidad::numeric,
  alter column stock_final type numeric(14, 3) using stock_final::numeric;

alter table pagos_cliente
  add column if not exists codigo_pago integer;

create unique index if not exists pagos_cliente_codigo_pago_cliente_idx
on pagos_cliente (cliente_id, codigo_pago)
where codigo_pago is not null;

alter table listas_precios
  add column if not exists porcentaje numeric(6, 2) not null default 0;

create table if not exists proveedor_pagos (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  proveedor text not null default 'Sin proveedor',
  importe numeric(14, 2) not null default 0,
  medio text not null default 'EFECTIVO',
  comprobante text not null default '-',
  observacion text not null default '-',
  fecha timestamptz not null default now()
);

create table if not exists compras (
  id uuid primary key default gen_random_uuid(),
  codigo bigint not null unique,
  proveedor text not null default 'Sin proveedor',
  producto_codigo integer not null default 0,
  producto_nombre text not null default 'Producto',
  cantidad numeric(14, 3) not null default 0,
  costo_unitario numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  comprobante text not null default '-',
  costo_anterior numeric(14, 2) not null default 0,
  precios_actualizados integer not null default 0,
  fecha timestamptz not null default now()
);

create table if not exists vendedores (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null default 'Vendedor',
  telefono text not null default '-',
  email text not null default '',
  zona text not null default '',
  tipo text not null default 'Calle',
  activo boolean not null default true
);

create unique index if not exists usuarios_email_unico_idx
on usuarios (lower(trim(email)))
where trim(coalesce(email, '')) <> '';

create unique index if not exists clientes_codigo_unico_idx
on clientes (codigo)
where codigo is not null;

create unique index if not exists productos_codigo_unico_idx
on productos (codigo)
where codigo is not null;

grant usage on schema public to authenticated;

grant all on table roles to authenticated;
grant all on table usuarios to authenticated;
grant all on table configuracion_empresa to authenticated;
grant all on table zonas to authenticated;
grant all on table rubros to authenticated;
grant all on table proveedores to authenticated;
grant all on table proveedor_pagos to authenticated;
grant all on table compras to authenticated;
grant all on table vendedores to authenticated;
grant all on table listas_precios to authenticated;
grant all on table clientes to authenticated;
grant all on table productos to authenticated;
grant all on table producto_precios to authenticated;
grant all on table pedidos to authenticated;
grant all on table pedido_items to authenticated;
grant all on table pagos_cliente to authenticated;
grant all on table movimientos_stock to authenticated;
grant all on table auditoria to authenticated;
