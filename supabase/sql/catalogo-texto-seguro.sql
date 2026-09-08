-- Defensa en profundidad para el catalogo publico.
--
-- El nombre, la direccion y el comentario que llegan del catalogo los escribe
-- cualquier persona de internet, y despues se muestran en el panel de
-- administracion. El frontend ya escapa todo con la etiqueta html`` de
-- helpers.js; esto agrega el segundo cerrojo: que el texto con signos de
-- marcado no llegue a entrar a la base.
--
-- Se valida en crear_pedido_catalogo_vendedor, que es la unica funcion con
-- permiso de ejecucion para anon (crear_pedido_catalogo_publico tiene el grant
-- revocado desde catalogo-vendedor-enlace.sql).

create or replace function public.catalogo_texto_sin_marcado(valor text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(valor, '') !~ '[<>]'
     and coalesce(valor, '') not ilike '%&#%'
     and coalesce(valor, '') !~* '(javascript|data)\s*:';
$$;
revoke all on function public.catalogo_texto_sin_marcado(text) from public, anon, authenticated;

create or replace function public.crear_pedido_catalogo_vendedor(pedido jsonb)
returns table(numero integer, total numeric, cliente_codigo integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado record;
  enlace record;
  usuario_vendedor uuid;
  token_texto text := nullif(trim(coalesce(pedido ->> 'vendedor_token', '')), '');
  campo text;
begin
  -- Texto declarado por el cliente: sin signos de marcado ni esquemas de URL
  -- ejecutables. Se rechaza en lugar de limpiar para que el pedido no quede
  -- guardado con datos distintos a los que la persona escribio.
  foreach campo in array array[
    pedido #>> '{cliente,nombre}',
    pedido #>> '{cliente,direccion}',
    pedido #>> '{cliente,telefono}',
    pedido #>> '{cliente,codigo}',
    pedido ->> 'comentario'
  ]
  loop
    if not public.catalogo_texto_sin_marcado(campo) then
      raise exception 'Los datos no pueden contener los signos < o >. Reescribilos sin simbolos.';
    end if;
  end loop;

  if token_texto is not null then
    if token_texto !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'El enlace del vendedor no es valido.';
    end if;

    select e.*, v.nombre, v.email into enlace
    from catalogo_enlaces_vendedor e
    join vendedores v on v.id = e.vendedor_id
    where e.token = token_texto::uuid and not e.revocado and v.activo = true;

    if not found then
      raise exception 'El enlace del vendedor vencio o fue desactivado.';
    end if;
  end if;

  select * into resultado from public.crear_pedido_catalogo_publico(pedido);

  if token_texto is not null then
    select u.id into usuario_vendedor
    from usuarios u
    where u.activo = true and lower(trim(u.email)) = lower(trim(enlace.email))
    limit 1;

    update pedidos set vendedor = enlace.nombre, vendedor_id = usuario_vendedor
    where pedidos.numero = resultado.numero;
  end if;

  return query select resultado.numero, resultado.total, resultado.cliente_codigo;
end;
$$;
revoke all on function public.crear_pedido_catalogo_publico(jsonb) from anon, authenticated;
revoke all on function public.crear_pedido_catalogo_vendedor(jsonb) from public;
grant execute on function public.crear_pedido_catalogo_vendedor(jsonb) to anon, authenticated;

-- Deja rastro de los clientes que ya estaban cargados con signos de marcado,
-- para poder revisarlos a mano desde el panel.
do $$
declare
  sospechosos integer;
begin
  select count(*) into sospechosos
  from clientes
  where not public.catalogo_texto_sin_marcado(nombre)
     or not public.catalogo_texto_sin_marcado(direccion)
     or not public.catalogo_texto_sin_marcado(observaciones);

  if sospechosos > 0 then
    raise notice 'Hay % cliente(s) con < o > en nombre, direccion u observaciones. Revisalos en el panel.', sospechosos;
  end if;
end;
$$;
