-- Saca el historial de adentro de la fila del producto.
--
-- El problema
-- -----------
-- productos.movimientos_stock y productos.historial_precios son arrays JSONB
-- que crecen sin limite dentro de la propia fila del producto. Cada venta
-- reescribe el array entero (Postgres reescribe la fila completa en cada
-- UPDATE), y obtenerProductosSupabase() se baja todos los productos con todo
-- su historial en cada inicio de sesion. Con 2.000 productos y un ano de
-- movimientos son varios MB por login, en el celular de cada vendedor.
--
-- Ademas la tabla movimientos_stock ya existia: el historial estaba duplicado,
-- y la copia de adentro del producto era la unica que se usaba.
--
-- Que hace este archivo
-- ---------------------
-- 1. Crea producto_historial_precios (equivalente a movimientos_stock pero
--    para cambios de precio).
-- 2. Pasa a las tablas todo lo que hoy vive en los JSONB.
-- 3. Recorta los arrays de la fila a los ultimos 100 movimientos.
--
-- Por que recortar y no vaciar: los informes y el listado de movimientos del
-- panel leen producto.movimientosStock en memoria. Dejando los ultimos 100 esos
-- informes siguen andando igual, la fila deja de crecer, y el historial
-- completo queda en las tablas, que es de donde lo lee el detalle del producto
-- (obtenerMovimientosStockProductoSupabase en supabase-repository.js).

create table if not exists public.producto_historial_precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  lista_precio_nombre text not null default 'Lista 1',
  precio_anterior numeric(14, 2) not null default 0,
  precio_nuevo numeric(14, 2) not null default 0,
  motivo text not null default '',
  usuario text not null default 'Sistema',
  fecha timestamptz not null default now()
);

create index if not exists producto_historial_precios_producto_fecha_idx
  on public.producto_historial_precios (producto_id, fecha desc);

alter table public.producto_historial_precios enable row level security;

drop policy if exists "historial precios lectura" on public.producto_historial_precios;
create policy "historial precios lectura" on public.producto_historial_precios
for select to authenticated using (public.usuario_sistema_activo());

drop policy if exists "historial precios escritura" on public.producto_historial_precios;
create policy "historial precios escritura" on public.producto_historial_precios
for all to authenticated
using (public.usuario_tiene_permiso('productos'))
with check (public.usuario_tiene_permiso('productos'));

-- Convierte "31/12/2026" + "14:35" a timestamptz sin romperse si el texto
-- viene en otro formato: en ese caso devuelve el valor de respaldo.
create or replace function public.fecha_historial_a_timestamp(fecha_texto text, hora_texto text, respaldo timestamptz)
returns timestamptz
language plpgsql
immutable
set search_path = public
as $$
declare
  fecha_limpia text := trim(coalesce(fecha_texto, ''));
begin
  -- Sin texto de fecha no hay nada que interpretar. Hace falta cortar aca
  -- porque to_timestamp(' 00:00', 'DD/MM/YYYY HH24:MI') no falla: devuelve el
  -- año 1 antes de Cristo, y esos movimientos quedarian ordenados al principio
  -- de todo el historial en vez de tomar la fecha de respaldo.
  if fecha_limpia = '' then
    return respaldo;
  end if;

  return to_timestamp(
    fecha_limpia || ' ' || coalesce(nullif(trim(coalesce(hora_texto, '')), ''), '00:00'),
    'DD/MM/YYYY HH24:MI'
  );
exception when others then
  return respaldo;
end;
$$;
revoke all on function public.fecha_historial_a_timestamp(text, text, timestamptz) from public, anon, authenticated;

-- 1) Movimientos de stock que solo estaban en el JSONB -----------------------
-- Se insertan solo los que no tienen ya una fila equivalente, para poder
-- correr este archivo mas de una vez sin duplicar.
insert into public.movimientos_stock (producto_id, tipo, referencia, cantidad, stock_final, fecha)
select
  p.id,
  coalesce(nullif(m ->> 'tipo', ''), 'Movimiento'),
  coalesce(nullif(m ->> 'referencia', ''), coalesce(m ->> 'motivo', '')),
  coalesce((m ->> 'cantidad')::numeric, 0),
  coalesce((m ->> 'stockFinal')::numeric, 0),
  public.fecha_historial_a_timestamp(m ->> 'fecha', m ->> 'hora', p.creado_en) as fecha_movimiento
from public.productos p
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(p.movimientos_stock) = 'array' then p.movimientos_stock else '[]'::jsonb end
) m
where not exists (
  select 1 from public.movimientos_stock ms
  where ms.producto_id = p.id
    and ms.fecha = public.fecha_historial_a_timestamp(m ->> 'fecha', m ->> 'hora', p.creado_en)
    and ms.cantidad = coalesce((m ->> 'cantidad')::numeric, 0)
    and ms.stock_final = coalesce((m ->> 'stockFinal')::numeric, 0)
);

-- 2) Historial de precios ----------------------------------------------------
insert into public.producto_historial_precios
  (producto_id, lista_precio_nombre, precio_anterior, precio_nuevo, motivo, usuario, fecha)
select
  p.id,
  coalesce(nullif(h ->> 'lista', ''), 'Lista 1'),
  coalesce((h ->> 'precioAnterior')::numeric, 0),
  coalesce((h ->> 'precioNuevo')::numeric, (h ->> 'precio')::numeric, 0),
  coalesce(h ->> 'motivo', ''),
  coalesce(nullif(h ->> 'usuario', ''), 'Sistema'),
  public.fecha_historial_a_timestamp(h ->> 'fecha', h ->> 'hora', p.creado_en)
from public.productos p
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(p.historial_precios) = 'array' then p.historial_precios else '[]'::jsonb end
) h
where not exists (
  select 1 from public.producto_historial_precios ph
  where ph.producto_id = p.id
    and ph.fecha = public.fecha_historial_a_timestamp(h ->> 'fecha', h ->> 'hora', p.creado_en)
    and ph.precio_nuevo = coalesce((h ->> 'precioNuevo')::numeric, (h ->> 'precio')::numeric, 0)
);

-- 3) Recorte de los arrays de la fila ---------------------------------------
-- Se quedan los ultimos 100 de cada uno (el final del array es lo mas
-- reciente, porque el frontend hace push).
update public.productos p
set movimientos_stock = (
  select coalesce(jsonb_agg(valor order by orden), '[]'::jsonb)
  from (
    select valor, orden
    from jsonb_array_elements(p.movimientos_stock) with ordinality as t(valor, orden)
    order by orden desc
    limit 100
  ) ultimos
)
where jsonb_typeof(p.movimientos_stock) = 'array'
  and jsonb_array_length(p.movimientos_stock) > 100;

update public.productos p
set historial_precios = (
  select coalesce(jsonb_agg(valor order by orden), '[]'::jsonb)
  from (
    select valor, orden
    from jsonb_array_elements(p.historial_precios) with ordinality as t(valor, orden)
    order by orden desc
    limit 100
  ) ultimos
)
where jsonb_typeof(p.historial_precios) = 'array'
  and jsonb_array_length(p.historial_precios) > 100;

-- Lectura del historial completo de un producto, para el detalle del panel.
create or replace function public.obtener_movimientos_stock_producto(
  producto_id_param uuid,
  limite integer default 500
)
returns table (
  fecha timestamptz,
  tipo text,
  referencia text,
  cantidad numeric,
  stock_final numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select m.fecha, m.tipo, m.referencia, m.cantidad, m.stock_final
  from movimientos_stock m
  where m.producto_id = producto_id_param
    and (public.usuario_tiene_permiso('movimientos')
      or public.usuario_tiene_permiso('productos')
      or public.usuario_tiene_permiso('ventas'))
  order by m.fecha desc
  limit greatest(1, least(coalesce(limite, 500), 2000));
$$;
revoke all on function public.obtener_movimientos_stock_producto(uuid, integer) from public, anon;
grant execute on function public.obtener_movimientos_stock_producto(uuid, integer) to authenticated;

do $$
declare
  filas_movimientos bigint;
  filas_precios bigint;
begin
  select count(*) into filas_movimientos from public.movimientos_stock;
  select count(*) into filas_precios from public.producto_historial_precios;
  raise notice 'movimientos_stock: % filas | producto_historial_precios: % filas', filas_movimientos, filas_precios;
end;
$$;

analyze;
