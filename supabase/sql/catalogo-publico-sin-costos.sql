-- ===========================================================================
-- El catalogo publico dejaba ver los costos de la distribuidora
-- ===========================================================================
--
-- QUE PASABA
--
-- `obtener_catalogo_publico()` devolvia `p.precios_lista` ENTERO, y esa funcion
-- tiene `grant execute ... to anon`: cualquiera con el link — o directamente con
-- la clave publica, que esta a la vista en supabase-config.js — se bajaba el
-- objeto completo. Y ese objeto no trae solo el precio de venta:
--
--   {"Lista 1": 7800, "Lista 3": 6400, "__margenes": {"Lista 1": 50}}
--
--   - "Lista 3" es el precio mayorista, que ese cliente no tendria que ver.
--   - "__margenes" es el porcentaje que se le carga AL COSTO.
--
-- Con esos dos numeros el costo sale de una division:
--
--   7800 / 1,50 = 5200   <- el precio de compra exacto
--
-- Probado contra PostgreSQL 16: el costo deducido dio $5.200,00 contra un costo
-- real de $5.200,00. Repitiendo para todo el catalogo, un competidor se lleva la
-- lista de compra completa de la distribuidora.
--
-- La clave "__margenes" empezo a viajar cuando se arreglo la logica de precios:
-- antes se borraba en cada guardado (y por eso los margenes no sobrevivian a
-- nada), ahora se conserva a proposito. Guardarla estuvo bien; lo que faltaba
-- era que el catalogo publico no la repartiera.
--
-- QUE HACE ESTE ARCHIVO
--
-- El RPC publico pasa a devolver UNICAMENTE el precio de Lista 1, armado del
-- lado del servidor. La forma de la respuesta no cambia (sigue siendo un jsonb
-- con la clave "Lista 1"), asi que el catalogo del navegador no necesita ningun
-- cambio: simplemente ya no recibe lo que no le corresponde.
--
-- Tambien deja de mandar `codigo_real`, que es el codigo interno / del
-- proveedor. El catalogo lo usa solo para buscar, y el cliente ya puede buscar
-- por nombre, marca y rubro.
--
-- Se corre una sola vez en el editor SQL de Supabase.
-- ---------------------------------------------------------------------------

-- La firma cambia (se va una columna del `returns table`), asi que hay que
-- borrar la funcion anterior: `create or replace` no puede cambiar el tipo de
-- retorno.
drop function if exists public.obtener_catalogo_publico();

create or replace function public.obtener_catalogo_publico()
returns table (
  codigo integer, codigo_real text, nombre text, precio_base numeric,
  stock numeric, rubro text, marca text, tipo text, detalle text, pack numeric,
  unidad text, precios_lista jsonb, activo boolean, mostrar_catalogo boolean, imagen_url text
)
language sql stable security definer set search_path = public as $$
  select
    p.codigo,
    ''::text                                as codigo_real,
    p.nombre,
    -- precio_base tambien se resuelve al precio de venta: si quedara el precio
    -- de lista crudo seria otra puerta al mismo dato.
    public.catalogo_precio_lista_uno(p.precios_lista, p.precio_base) as precio_base,
    public.catalogo_stock_disponible(p.id),
    p.rubro, p.marca, p.tipo, p.detalle, p.pack, p.unidad,
    -- Solo Lista 1, armado aca. Ni las otras listas ni "__margenes".
    jsonb_build_object(
      'Lista 1',
      public.catalogo_precio_lista_uno(p.precios_lista, p.precio_base)
    )                                       as precios_lista,
    p.activo, p.mostrar_catalogo, p.imagen_url
  from productos p
  where p.activo = true and p.mostrar_catalogo = true
  order by p.nombre;
$$;

revoke all on function public.obtener_catalogo_publico() from public;
grant execute on function public.obtener_catalogo_publico() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Como saber que quedo bien
-- ---------------------------------------------------------------------------
-- Esto tiene que devolver solo {"Lista 1": <numero>} en cada fila, sin ninguna
-- otra lista y sin "__margenes":
select codigo, nombre, precios_lista
from public.obtener_catalogo_publico()
limit 5;

-- Y esto tiene que dar 0. Si da mas de 0, la funcion vieja sigue en pie.
select count(*)
from public.obtener_catalogo_publico()
where precios_lista ? '__margenes'
   or (select count(*) from jsonb_object_keys(precios_lista)) > 1;
