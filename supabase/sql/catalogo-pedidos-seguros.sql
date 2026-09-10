-- ===========================================================================
-- Pedidos del catalogo publico: identidad y limite
-- ===========================================================================
--
-- Dos problemas distintos, los dos en el mismo camino: el RPC que cualquiera
-- puede llamar desde el link del catalogo.
--
-- ---------------------------------------------------------------------------
-- PROBLEMA 1: se puede colgar un pedido en la cuenta de un cliente real
-- ---------------------------------------------------------------------------
--
-- Para vincular el pedido a una ficha existente, el RPC pedia:
--
--   nombre coincide  AND  (direccion coincide  OR  telefono coincide)
--
-- El telefono esta en un OR, asi que alcanza con nombre + direccion. Y
-- `catalogo_normalizar_texto` baja todo a minusculas y saca los simbolos, o sea
-- que "Kiosco El Sol" matchea "KIOSCO EL SOL.".
--
-- Cualquiera que haya visto un remito en un mostrador tiene esos dos datos.
-- Entra al catalogo, carga $400.000 de mercaderia, pone ese nombre y esa
-- direccion y su propio telefono: el pedido entra a la bandeja como pedido
-- legitimo de ese kiosco, a CUENTA CORRIENTE, con el vendedor y la zona del
-- cliente victima. La mercaderia sale y la deuda queda en la ficha del kiosco.
--
-- Arreglo: para pegarse a una ficha que ya existe hay que acertar el TELEFONO.
-- El nombre y la direccion no alcanzan. Si el telefono no coincide, el pedido
-- no se pierde: se crea una ficha nueva (el mismo camino que ya usaba un
-- cliente que pide por primera vez) y queda para revisar en Administracion.
--
-- ---------------------------------------------------------------------------
-- PROBLEMA 2: se pueden crear pedidos sin ningun limite
-- ---------------------------------------------------------------------------
--
-- No hay tope por telefono ni por link. Cada llamada inserta un cliente y un
-- pedido. Dos consecuencias:
--
--   a) Un script deja miles de fichas basura y miles de pedidos PENDIENTES en
--      la bandeja de Ventas, para borrar a mano.
--
--   b) Peor: `catalogo_stock_disponible` resta las cantidades de los pedidos
--      PENDIENTES. Con unos pocos pedidos que pidan todo el stock de cada
--      producto, el catalogo entero queda en "Sin stock" para los clientes de
--      verdad. Denegacion de inventario, sin autenticarse, desde una pestaña.
--
-- Arreglo: un tope por telefono y por hora. Alto para que un cliente real nunca
-- lo toque, bajo para que un script no sirva de nada.
--
-- Se corre una sola vez en el editor SQL de Supabase.
-- ---------------------------------------------------------------------------

-- Cuantos pedidos puede mandar un mismo telefono por hora desde el catalogo.
-- Un cliente que corrige y reintenta hace 2 o 3; nunca 6.
create or replace function public.catalogo_limite_pedidos_por_hora()
returns integer language sql immutable as $$ select 6 $$;

create or replace function public.catalogo_control_limite_pedidos(telefono_normalizado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pedidos_recientes integer;
begin
  if telefono_normalizado is null or telefono_normalizado = '' then
    return;
  end if;

  select count(*) into pedidos_recientes
  from pedidos pe
  join clientes c on c.id = pe.cliente_id
  where pe.fecha > now() - interval '1 hour'
    and pe.vendedor = 'Catalogo clientes'
    and public.catalogo_normalizar_telefono(c.telefono) = telefono_normalizado;

  if pedidos_recientes >= public.catalogo_limite_pedidos_por_hora() then
    raise exception 'Ya enviaste varios pedidos en la ultima hora. Comunicate con tu vendedor para cargar este.';
  end if;
end;
$$;

revoke all on function public.catalogo_control_limite_pedidos(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Como aplicar los dos cambios sobre la funcion que ya esta
-- ---------------------------------------------------------------------------
--
-- crear_pedido_catalogo_publico es larga y esta en catalogo-publico.sql. Lo que
-- hay que cambiar son dos puntos:
--
-- 1) La busqueda de la ficha existente. Donde dice:
--
--      select c.* into cliente_actual from clientes c
--        where public.catalogo_normalizar_texto(c.nombre) = public.catalogo_normalizar_texto(nombre_cliente)
--        and (public.catalogo_normalizar_texto(c.direccion) = public.catalogo_normalizar_texto(direccion_cliente)
--          or telefono_cliente in (
--            public.catalogo_normalizar_telefono(c.telefono),
--            public.catalogo_normalizar_telefono(c.telefono_movil),
--            public.catalogo_normalizar_telefono(c.telefono_particular)
--          ));
--
--    tiene que decir (el telefono deja de ser opcional):
--
--      select c.* into cliente_actual from clientes c
--        where public.catalogo_normalizar_texto(c.nombre) = public.catalogo_normalizar_texto(nombre_cliente)
--        and telefono_cliente in (
--          public.catalogo_normalizar_telefono(c.telefono),
--          public.catalogo_normalizar_telefono(c.telefono_movil),
--          public.catalogo_normalizar_telefono(c.telefono_particular)
--        );
--
--    Y el conteo de `coincidencias` de unas lineas mas arriba, igual.
--
-- 2) El tope. Justo despues de normalizar el telefono del pedido, agregar:
--
--      perform public.catalogo_control_limite_pedidos(telefono_cliente);
--
-- El bloque de abajo hace los dos cambios solo, sobre la definicion que este
-- instalada, sin que haya que reescribir la funcion a mano.
-- ---------------------------------------------------------------------------

do $$
declare
  definicion text;
  busqueda_vieja text;
  busqueda_nueva text;
  conteo_viejo text;
  conteo_nuevo text;
  ancla_tope text;
begin
  select pg_get_functiondef(p.oid) into definicion
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'crear_pedido_catalogo_publico';

  if definicion is null then
    raise exception 'No esta instalada crear_pedido_catalogo_publico. Corre primero catalogo-publico.sql.';
  end if;

  busqueda_vieja :=
    'and (public.catalogo_normalizar_texto(c.direccion) = public.catalogo_normalizar_texto(direccion_cliente)' || E'\n' ||
    '        or telefono_cliente in (';
  busqueda_nueva := 'and (telefono_cliente in (';

  conteo_viejo :=
    'or (public.catalogo_normalizar_texto(c.direccion) = public.catalogo_normalizar_texto(direccion_cliente)';
  conteo_nuevo := 'and (telefono_cliente is not null and (';

  if position(busqueda_vieja in definicion) = 0
     and position('perform public.catalogo_control_limite_pedidos' in definicion) > 0 then
    raise notice 'Ya estaba aplicado. No se toco nada.';
    return;
  end if;

  definicion := replace(definicion, busqueda_vieja, busqueda_nueva);

  if position('or telefono_cliente in (' in definicion) > 0 then
    raise exception 'No se pudo aplicar el cambio de identidad: la funcion instalada no tiene la forma esperada. Revisa catalogo-publico.sql.';
  end if;

  -- El tope, una sola vez, apenas termino de validarse el telefono del pedido.
  if position('perform public.catalogo_control_limite_pedidos' in definicion) = 0 then
    -- Se engancha despues del control del comentario, que es el ultimo chequeo
    -- de forma: ahi el telefono ya esta validado y todavia no se toco nada.
    ancla_tope :=
      'if length(coalesce(pedido ->> ''comentario'', '''')) > 400 then' || E'\n' ||
      '    raise exception ''El comentario puede tener hasta 400 caracteres.'';' || E'\n' ||
      '  end if;';

    if position(ancla_tope in definicion) = 0 then
      raise exception 'No se pudo aplicar el tope por hora: no se encontro el punto de insercion. Revisa catalogo-publico.sql.';
    end if;

    definicion := replace(
      definicion,
      ancla_tope,
      ancla_tope || E'\n  perform public.catalogo_control_limite_pedidos(telefono_cliente);'
    );
  end if;

  execute definicion;

  -- Se vuelve a leer de la base: no alcanza con que el texto se haya cambiado,
  -- tiene que haber quedado instalado.
  select pg_get_functiondef(p.oid) into definicion
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'crear_pedido_catalogo_publico';

  if position('perform public.catalogo_control_limite_pedidos' in definicion) = 0
     or position('or telefono_cliente in (' in definicion) > 0 then
    raise exception 'El cambio no quedo aplicado. No des esto por hecho: revisalo a mano.';
  end if;

  raise notice 'Listo: el telefono ahora es obligatorio para vincular una ficha, y hay tope por hora.';
end;
$$;

-- ---------------------------------------------------------------------------
-- Como saber que quedo bien
-- ---------------------------------------------------------------------------
-- Las dos consultas tienen que devolver `true`.
select position('perform public.catalogo_control_limite_pedidos' in pg_get_functiondef(p.oid)) > 0
         as tiene_tope_por_hora,
       position('or telefono_cliente in (' in pg_get_functiondef(p.oid)) = 0
         as telefono_obligatorio
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'crear_pedido_catalogo_publico';
