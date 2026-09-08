-- El numero de pedido lo asigna Postgres, no el navegador.
--
-- El problema
-- -----------
-- obtenerSiguienteNumeroPedido() calculaba el numero en el navegador con
-- Math.max(pedidos en memoria) + 1. Con dos vendedores guardando al mismo
-- tiempo, los dos llegan al mismo numero y el segundo choca contra el unique
-- de pedidos.numero:
--
--   vendedor A calculo #15001  ->  guardado
--   vendedor B calculo #15001  ->  ERROR: duplicate key value violates
--                                  unique constraint "pedidos_numero_key"
--
-- Los datos no se corrompen (para eso esta el unique), pero al vendedor B se
-- le cae el pedido con un error de Postgres incomprensible, parado frente al
-- cliente.
--
-- La solucion es la que ya usaba crear_pedido_catalogo_publico: tomar el
-- numero adentro de la transaccion, con lock, y reintentar si otro se adelanto.
-- Se usa el mismo advisory lock (773, 1) que el catalogo, asi los pedidos del
-- catalogo y los del panel se serializan entre si en vez de pelearse.
--
-- Se numera con max()+1 y no con una secuencia a proposito: una secuencia deja
-- huecos cuando una transaccion se cancela, y en un talonario de pedidos los
-- huecos se prestan a confusion.

create or replace function public.crear_pedido_numerado(pedido jsonb)
returns table (id uuid, numero integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  numero_nuevo integer;
  id_nuevo uuid;
  intentos integer := 0;
  cliente_id_pedido uuid := nullif(pedido ->> 'cliente_id', '')::uuid;
  vendedor_pedido text := coalesce(pedido ->> 'vendedor', 'Sin vendedor');
begin
  if not public.usuario_tiene_permiso('ventas') then
    raise exception 'Tu rol no tiene permiso para cargar pedidos.';
  end if;

  if not public.usuario_puede_escribir_pedido(vendedor_pedido, cliente_id_pedido) then
    raise exception 'Tu usuario no puede cargar pedidos para este cliente.';
  end if;

  -- Serializa la toma de numero con el catalogo publico.
  perform pg_advisory_xact_lock(773, 1);

  loop
    numero_nuevo := greatest(1, coalesce((select max(p.numero) + 1 from pedidos p), 1));

    begin
      insert into pedidos (
        numero, cliente_id, vendedor_id, vendedor, zona, estado, forma_pago,
        estado_cobro, total, pagado, saldo_generado, fecha, fecha_entrega,
        observaciones, nota_credito, origen
      )
      values (
        numero_nuevo,
        cliente_id_pedido,
        nullif(pedido ->> 'vendedor_id', '')::uuid,
        vendedor_pedido,
        coalesce(pedido ->> 'zona', 'Sin zona'),
        coalesce(nullif(pedido ->> 'estado', ''), 'BORRADOR'),
        coalesce(pedido ->> 'forma_pago', 'CUENTA_CORRIENTE'),
        coalesce(pedido ->> 'estado_cobro', ''),
        coalesce((pedido ->> 'total')::numeric, 0),
        coalesce((pedido ->> 'pagado')::numeric, 0),
        coalesce((pedido ->> 'saldo_generado')::numeric, 0),
        coalesce((pedido ->> 'fecha')::timestamptz, now()),
        nullif(pedido ->> 'fecha_entrega', '')::timestamptz,
        coalesce(pedido -> 'observaciones', '[]'::jsonb),
        coalesce(pedido -> 'nota_credito', '[]'::jsonb),
        coalesce(pedido ->> 'origen', 'administracion')
      )
      returning pedidos.id, pedidos.numero into id_nuevo, numero_nuevo;

      exit;
    exception when unique_violation then
      -- Otro se adelanto con ese numero: se vuelve a leer el maximo.
      intentos := intentos + 1;

      if intentos > 25 then
        raise exception 'No se pudo reservar el numero de pedido. Volve a intentar.';
      end if;
    end;
  end loop;

  return query select id_nuevo, numero_nuevo;
end;
$$;
revoke all on function public.crear_pedido_numerado(jsonb) from public, anon;
grant execute on function public.crear_pedido_numerado(jsonb) to authenticated;

-- Numero sugerido para mostrar en pantalla mientras se arma el pedido.
-- Es solo informativo: el numero definitivo lo asigna crear_pedido_numerado al
-- guardar, asi que si dos vendedores ven el mismo sugerido no pasa nada.
create or replace function public.siguiente_numero_pedido_sugerido()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(1, coalesce((select max(p.numero) + 1 from pedidos p), 1))
  where public.usuario_sistema_activo();
$$;
revoke all on function public.siguiente_numero_pedido_sugerido() from public, anon;
grant execute on function public.siguiente_numero_pedido_sugerido() to authenticated;
