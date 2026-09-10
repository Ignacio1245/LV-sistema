-- ===========================================================================
-- El numero de pago: que no se pisen entre dos cajas, y que el celular pueda
-- cobrar de una vez.
-- ===========================================================================
--
-- QUE ESTABA MAL
--
-- 1) La columna pagos_cliente.codigo_pago es `integer` (maximo 2.147.483.647).
--    El celular arma el codigo con Date.now() + 3 digitos, que da 16 digitos:
--
--        insert ... codigo_pago = 1789456123456789
--        ERROR:  integer out of range
--
--    O sea que TODA cobranza cargada desde el celular fallaba en la base.
--
-- 2) En la computadora el codigo se calculaba como "el mayor del historial + 1".
--    Ese numero es tambien la llave de idempotencia del servidor: si ya existe,
--    la funcion devuelve ya_estaba = true y NO aplica el movimiento.
--
--    Con dos mostradores cobrandole al mismo cliente casi a la vez, los dos
--    calculan el mismo numero. El primero cobra; al segundo le sale "Este pago
--    ya estaba registrado", el operador cierra el formulario, y esa plata que
--    tiene en la mano nunca se descuenta de la cuenta.
--
-- QUE HACE ESTE ARCHIVO
--
-- Agranda la columna a bigint para que entre un codigo unico por cobro (una
-- marca de tiempo con milisegundos + un sufijo al azar) en vez de un contador
-- que dos equipos pueden repetir. La idempotencia se mantiene igual: el mismo
-- cobro reintentado manda el mismo codigo y no se duplica.
--
-- Se corre una sola vez en el editor SQL de Supabase. No borra ni cambia
-- ningun pago existente: los codigos viejos siguen siendo validos.
-- ---------------------------------------------------------------------------

-- 1) La columna
alter table public.pagos_cliente
  alter column codigo_pago type bigint;

-- 2) La funcion atomica tiene el parametro en integer. Cambiar el tipo de un
--    parametro crea una funcion NUEVA en vez de reemplazar la vieja, asi que
--    primero se borra la anterior por su firma exacta.
drop function if exists public.registrar_movimiento_cuenta_atomico(
  uuid, numeric, text, text, integer, uuid
);

create or replace function public.registrar_movimiento_cuenta_atomico(
  cliente_id_param uuid,
  delta_saldo numeric,
  medio_pago_param text,
  observacion_param text,
  codigo_pago_param bigint default null,
  pedido_id_param uuid default null
)
returns table (saldo_cliente numeric, ya_estaba boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  cliente_actual record;
  existente record;
  delta numeric(14,2);
begin
  select c.* into cliente_actual from clientes c where c.id = cliente_id_param for update;

  if not found then
    raise exception 'No se encontro el cliente.';
  end if;

  if not public.usuario_puede_escribir_cliente(cliente_actual.vendedor_asignado) then
    raise exception 'Tu usuario no puede registrar movimientos de este cliente.';
  end if;

  delta := round(coalesce(delta_saldo, 0), 2);

  if codigo_pago_param is not null then
    select p.* into existente from pagos_cliente p
    where p.cliente_id = cliente_id_param and p.codigo_pago = codigo_pago_param;

    if found then
      -- Ya se habia aplicado (reintento del mismo cobro): se devuelve el saldo
      -- actual sin tocarlo.
      return query select cliente_actual.saldo, true;
      return;
    end if;
  end if;

  insert into pagos_cliente (cliente_id, pedido_id, codigo_pago, importe, medio_pago, observacion, fecha)
  values (
    cliente_id_param, pedido_id_param, codigo_pago_param, abs(delta),
    coalesce(nullif(trim(medio_pago_param), ''), case when delta < 0 then 'PAGO_CLIENTE' else 'CUENTA_CORRIENTE' end),
    coalesce(observacion_param, 'Movimiento de cuenta'), now()
  );

  update clientes set saldo = round(coalesce(saldo, 0) + delta, 2)
  where id = cliente_id_param;

  return query select c.saldo, false from clientes c where c.id = cliente_id_param;
end;
$$;

revoke all on function public.registrar_movimiento_cuenta_atomico(uuid, numeric, text, text, bigint, uuid) from public, anon;
grant execute on function public.registrar_movimiento_cuenta_atomico(uuid, numeric, text, text, bigint, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Como saber que quedo bien
-- ---------------------------------------------------------------------------
-- Esto tiene que decir "bigint":
select data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'pagos_cliente'
  and column_name = 'codigo_pago';

-- Y esto tiene que devolver UNA sola fila (no dos versiones de la funcion):
select p.oid::regprocedure as firma
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'registrar_movimiento_cuenta_atomico';
