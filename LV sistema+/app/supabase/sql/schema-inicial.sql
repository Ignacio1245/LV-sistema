create extension if not exists pgcrypto;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  permisos jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null,
  email text not null default '',
  rol_id uuid references roles(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create unique index if not exists usuarios_email_unico_idx
on usuarios (lower(trim(email)))
where trim(coalesce(email, '')) <> '';

create table if not exists configuracion_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa text not null default '',
  cuit text not null default '',
  direccion text not null default '',
  whatsapp text not null default '',
  alias text not null default '',
  cbu text not null default '',
  impresion_titulo text not null default 'LV Sistema',
  impresion_subtitulo text not null default 'Distribuidora',
  impresion_pie text not null default 'Gracias por su compra.',
  impresion_mostrar_qr boolean not null default true,
  impresion_qr_texto text not null default '',
  stock_minimo integer not null default 10,
  permitir_stock_negativo boolean not null default false,
  actualizado_en timestamptz not null default now()
);

create table if not exists zonas (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null,
  descripcion text not null default '-',
  activo boolean not null default true
);

create table if not exists rubros (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null,
  descripcion text not null default '-',
  activo boolean not null default true
);

create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null,
  telefono text not null default '-',
  contacto text not null default '-',
  observacion text not null default '-',
  activo boolean not null default true
);

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

create table if not exists listas_precios (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null unique,
  porcentaje numeric(6, 2) not null default 0,
  activo boolean not null default true
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null,
  telefono text not null default '-',
  direccion text not null default '-',
  zona text not null default 'Sin zona',
  zona_id uuid references zonas(id),
  lista_precio_id uuid references listas_precios(id),
  vendedor_id uuid references usuarios(id),
  saldo numeric(14, 2) not null default 0,
  activo boolean not null default true,
  razon_social text not null default '',
  nombre_fantasia text not null default '',
  localidad text not null default '',
  codigo_postal text not null default '',
  telefono_particular text not null default '',
  telefono_movil text not null default '',
  email text not null default '',
  lista_precios text not null default '',
  posicion_zona integer not null default 0,
  vendedor_asignado text not null default '',
  condicion_iva text not null default '',
  horario_atencion text not null default '',
  observaciones text not null default '',
  creado_en timestamptz not null default now()
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  codigo_real text not null default '',
  nombre text not null,
  precio_compra numeric(14, 2) not null default 0,
  precio_base numeric(14, 2) not null default 0,
  stock numeric(14, 3) not null default 0,
  stock_minimo numeric(14, 3) not null default 0,
  rubro text not null default 'Sin rubro',
  rubro_id uuid references rubros(id),
  proveedor text not null default 'Sin proveedor',
  proveedor_id uuid references proveedores(id),
  proveedor_alternativo text not null default '',
  marca text not null default '',
  tipo text not null default '',
  detalle text not null default '',
  pack numeric(14, 2) not null default 0,
  unidad text not null default '',
  iva numeric(6, 2) not null default 0,
  bonificacion_venta numeric(6, 2) not null default 0,
  precios_lista jsonb not null default '{}'::jsonb,
  historial_precios jsonb not null default '[]'::jsonb,
  movimientos_stock jsonb not null default '[]'::jsonb,
  activo boolean not null default true,
  baja_automatica_stock boolean not null default false,
  mostrar_catalogo boolean not null default false,
  imagen_url text not null default '',
  creado_en timestamptz not null default now()
);

create table if not exists producto_precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  lista_precio_id uuid not null references listas_precios(id),
  precio numeric(14, 2) not null default 0,
  actualizado_en timestamptz not null default now(),
  unique(producto_id, lista_precio_id)
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique,
  cliente_id uuid references clientes(id),
  vendedor_id uuid references usuarios(id),
  vendedor text not null default 'Sin vendedor',
  zona text not null default 'Sin zona',
  estado text not null check (estado in ('BORRADOR', 'PENDIENTE', 'ATENDIDO', 'ENTREGADO', 'CANCELADO')),
  forma_pago text not null default 'CUENTA_CORRIENTE',
  estado_cobro text not null default '',
  total numeric(14, 2) not null default 0,
  pagado numeric(14, 2) not null default 0,
  saldo_generado numeric(14, 2) not null default 0,
  fecha timestamptz not null default now(),
  fecha_entrega timestamptz,
  observaciones jsonb not null default '[]'::jsonb,
  nota_credito jsonb not null default '[]'::jsonb
);

create table if not exists pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  cantidad numeric(14, 3) not null,
  lista_precio_id uuid references listas_precios(id),
  lista_precio_nombre text not null default 'Lista 1',
  precio_unitario numeric(14, 2) not null default 0,
  descuento_porcentaje numeric(6, 2) not null default 0,
  subtotal numeric(14, 2) not null default 0
);

create table if not exists pagos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  pedido_id uuid references pedidos(id),
  codigo_pago integer,
  importe numeric(14, 2) not null,
  medio_pago text not null default 'EFECTIVO',
  observacion text not null default '',
  fecha timestamptz not null default now()
);

create unique index if not exists pagos_cliente_codigo_pago_cliente_idx
on pagos_cliente (cliente_id, codigo_pago)
where codigo_pago is not null;

create table if not exists movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id),
  tipo text not null,
  referencia text not null default '',
  cantidad numeric(14, 3) not null,
  stock_final numeric(14, 3) not null,
  fecha timestamptz not null default now()
);

create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  usuario_nombre text not null default 'Sistema',
  usuario_rol text not null default '-',
  modulo text not null,
  accion text not null,
  detalle text not null default '',
  fecha timestamptz not null default now()
);
