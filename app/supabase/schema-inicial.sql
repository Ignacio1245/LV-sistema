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
  rol_id uuid references roles(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

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

create table if not exists listas_precios (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null unique,
  activo boolean not null default true
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  codigo integer not null unique,
  nombre text not null,
  telefono text not null default '-',
  direccion text not null default '-',
  zona_id uuid references zonas(id),
  lista_precio_id uuid references listas_precios(id),
  vendedor_id uuid references usuarios(id),
  saldo numeric(14, 2) not null default 0,
  activo boolean not null default true,
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
  stock integer not null default 0,
  stock_minimo integer not null default 0,
  rubro_id uuid references rubros(id),
  proveedor_id uuid references proveedores(id),
  marca text not null default '',
  tipo text not null default '',
  detalle text not null default '',
  unidad text not null default '',
  bonificacion_venta numeric(6, 2) not null default 0,
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
  estado text not null check (estado in ('BORRADOR', 'PENDIENTE', 'ATENDIDO', 'ENTREGADO', 'CANCELADO')),
  forma_pago text not null default 'CUENTA_CORRIENTE',
  total numeric(14, 2) not null default 0,
  pagado numeric(14, 2) not null default 0,
  saldo_generado numeric(14, 2) not null default 0,
  fecha timestamptz not null default now(),
  observaciones jsonb not null default '[]'::jsonb
);

create table if not exists pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  cantidad integer not null,
  lista_precio_id uuid references listas_precios(id),
  precio_unitario numeric(14, 2) not null default 0,
  descuento_porcentaje numeric(6, 2) not null default 0,
  subtotal numeric(14, 2) not null default 0
);

create table if not exists pagos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  pedido_id uuid references pedidos(id),
  importe numeric(14, 2) not null,
  medio_pago text not null default 'EFECTIVO',
  observacion text not null default '',
  fecha timestamptz not null default now()
);

create table if not exists movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id),
  tipo text not null,
  referencia text not null default '',
  cantidad integer not null,
  stock_final integer not null,
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
