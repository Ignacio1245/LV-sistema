-- Lectura publica segura para el catalogo de clientes.
-- No expone costos, proveedores, historial, movimientos ni datos administrativos.

create or replace function public.obtener_catalogo_publico()
returns table (
  codigo integer,
  codigo_real text,
  nombre text,
  precio_base numeric,
  stock numeric,
  rubro text,
  marca text,
  tipo text,
  detalle text,
  pack numeric,
  unidad text,
  precios_lista jsonb,
  activo boolean,
  mostrar_catalogo boolean,
  imagen_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    productos.codigo,
    productos.codigo_real,
    productos.nombre,
    productos.precio_base,
    productos.stock,
    productos.rubro,
    productos.marca,
    productos.tipo,
    productos.detalle,
    productos.pack,
    productos.unidad,
    productos.precios_lista,
    productos.activo,
    productos.mostrar_catalogo,
    productos.imagen_url
  from productos
  where productos.activo = true
    and productos.mostrar_catalogo = true
    and productos.stock > 0
  order by productos.nombre asc;
$$;

revoke all on function public.obtener_catalogo_publico() from public;
grant execute on function public.obtener_catalogo_publico() to anon;
grant execute on function public.obtener_catalogo_publico() to authenticated;
