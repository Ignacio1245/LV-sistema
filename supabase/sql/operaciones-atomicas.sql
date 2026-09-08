-- Operaciones de plata y de stock, resueltas dentro de una sola transaccion.
--
-- El problema que arregla
-- -----------------------
-- Hasta ahora el navegador leia el saldo del cliente (o el stock del producto),
-- calculaba el valor nuevo en memoria y mandaba un UPDATE de la fila completa:
--
--     cliente.saldo = saldoAnterior + saldoPendiente;   // en el navegador
--     await guardarClienteOperacionSupabase(cliente);   // UPDATE de todo
--
-- Con el sistema abierto en varias computadoras y celulares a la vez, dos
-- personas pueden leer el mismo saldo anterior y la segunda escritura pisa a la
-- primera: la plata desaparece sin dejar rastro. Refrescar los datos justo
-- antes achica la ventana pero no la cierra.
--
-- Aca el calculo pasa a Postgres: se bloquea la fila (select ... for update),
-- se lee el valor de verdad, se aplica el cambio y se libera. Dos operaciones
-- simultaneas se encolan en lugar de pisarse. Ademas, como el UPDATE toca solo
-- las columnas que cambian, editar la ficha del cliente desde el panel ya no se
-- pierde cuando el vendedor entrega un pedido al mismo tiempo.
--
-- Todas son SECURITY DEFINER (esquivan RLS), asi que cada una verifica los
-- permisos del usuario adentro, con las mismas funciones que usan las policies.

-- ---------------------------------------------------------------------------
-- Items de un pedido: borrar e insertar en una sola transaccion.
-- Antes se insertaban los nuevos y despues se borraban los viejos con dos
-- llamadas sueltas: si la segunda fallaba, el pedido quedaba con los items
-- duplicados y el total no coincidia con el detalle.
-- ---------------------------------------------------------------------------
create or replace function public.reemplazar_items_pedido(
  pedido_id_param uuid,
  items jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_actual record;
  cantidad_insertada integer := 0;
begin
  select p.* into pedido_actual from pedidos p where p.id = pedido_id_param for update;

  if not found then
    raise exception 'El pedido ya no existe.';
  end if;

  if not public.usuario_puede_escribir_pedido(pedido_actual.vendedor, pedido_actual.cliente_id) then
    raise exception 'Tu usuario no puede modificar este pedido.';
  end if;

  if jsonb_typeof(items) is distinct from 'array' then
    raise exception 'La lista de productos del pedido no es valida.';
  end if;

  delete from pedido_items where pedido_id = pedido_id_param;

  insert into pedido_items (
    pedido_id, producto_id, cantidad, lista_precio_nombre,
    precio_unitario, descuento_porcentaje, subtotal
  )
  select
    pedido_id_param,
    nullif(v ->> 'producto_id', '')::uuid,
    coalesce((v ->> 'cantidad')::numeric, 0),
    coalesce(v ->> 'lista_precio_nombre', 'Lista 1'),
    coalesce((v ->> 'precio_unitario')::numeric, 0),
    coalesce((v ->> 'descuento_porcentaje')::numeric, 0),
    coalesce((v ->> 'subtotal')::numeric, 0)
  from jsonb_array_elements(items) v;

  get diagnostics cantidad_insertada = row_count;
  return cantidad_insertada;
end;
$$;
revoke all on function public.reemplazar_items_pedido(uuid, jsonb) from public, anon;
grant execute on function public.reemplazar_items_pedido(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Atender un pedido: descontar stock y pasar a ATENDIDO, todo junto.
-- Devuelve el stock que quedo en cada producto para que el navegador se
-- sincronice con el valor real en vez de con el que habia calculado.
-- ---------------------------------------------------------------------------
create or replace function public.atender_pedido_atomico(pedido_id_param uuid)
returns table (producto_codigo integer, stock_nuevo numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_actual record;
  item record;
  producto_actual record;
  stock_resultante numeric;
  permite_negativo boolean;
begin
  if not public.usuario_tiene_permiso('ventas') then
    raise exception 'Tu rol no tiene permiso para atender pedidos.';
  end if;

  select p.* into pedido_actual from pedidos p where p.id = pedido_id_param for update;

  if not found then
    raise exception 'El pedido ya no existe.';
  end if;

  if not public.usuario_puede_escribir_pedido(pedido_actual.vendedor, pedido_actual.cliente_id) then
    raise exception 'Tu usuario no puede operar sobre este pedido.';
  end if;

  -- Si otra persona ya lo atendio, se corta aca: no se descuenta dos veces.
  if pedido_actual.estado <> 'PENDIENTE' then
    raise exception 'El pedido ya no esta pendiente (ahora esta %). Actualiza el listado.', pedido_actual.estado;
  end if;

  select coalesce(c.permitir_stock_negativo, false) into permite_negativo
  from configuracion_empresa c order by c.actualizado_en desc, c.id limit 1;
  permite_negativo := coalesce(permite_negativo, false);

  -- Se bloquea siempre en el mismo orden (por id de producto) para que dos
  -- pedidos con productos en comun no se traben mutuamente.
  for item in
    select i.producto_id, sum(i.cantidad) as cantidad
    from pedido_items i
    where i.pedido_id = pedido_id_param and i.producto_id is not null
    group by i.producto_id
    order by i.producto_id
  loop
    select p.* into producto_actual from productos p where p.id = item.producto_id for update;

    if not found then
      raise exception 'Un producto del pedido ya no existe.';
    end if;

    stock_resultante := producto_actual.stock - item.cantidad;

    if stock_resultante < 0 and not permite_negativo then
      raise exception 'Stock insuficiente de %: hay % y el pedido pide %.',
        producto_actual.nombre, producto_actual.stock, item.cantidad;
    end if;

    update productos set stock = stock_resultante where id = producto_actual.id;

    insert into movimientos_stock (producto_id, tipo, referencia, cantidad, stock_final)
    values (
      producto_actual.id,
      'Salida por pedido',
      'Pedido #' || pedido_actual.numero,
      -item.cantidad,
      stock_resultante
    );

    producto_codigo := producto_actual.codigo;
    stock_nuevo := stock_resultante;
    return next;
  end loop;

  update pedidos set estado = 'ATENDIDO' where id = pedido_id_param;

  insert into auditoria (usuario_nombre, usuario_rol, modulo, accion, detalle)
  values (
    coalesce(auth.jwt() ->> 'email', 'Sistema'),
    public.usuario_rol_actual(),
    'Pedidos',
    'Atendio pedido',
    '#' || pedido_actual.numero
  );

  return;
end;
$$;
revoke all on function public.atender_pedido_atomico(uuid) from public, anon;
grant execute on function public.atender_pedido_atomico(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Entregar un pedido: cobro, saldo de cuenta corriente y estado del pedido.
-- Es la operacion donde se movia plata sin proteccion.
-- ---------------------------------------------------------------------------
create or replace function public.entregar_pedido_atomico(
  pedido_id_param uuid,
  importe_pagado numeric
)
returns table (
  saldo_cliente numeric,
  saldo_generado numeric,
  estado_cobro text,
  fecha_entrega timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  pedido_actual record;
  cliente_actual record;
  total_pedido numeric(14,2);
  importe_cobrado numeric(14,2);
  pendiente numeric(14,2);
  cobro text;
  momento timestamptz := now();
begin
  if not public.usuario_tiene_permiso('ventas') then
    raise exception 'Tu rol no tiene permiso para entregar pedidos.';
  end if;

  select p.* into pedido_actual from pedidos p where p.id = pedido_id_param for update;

  if not found then
    raise exception 'El pedido ya no existe.';
  end if;

  if not public.usuario_puede_escribir_pedido(pedido_actual.vendedor, pedido_actual.cliente_id) then
    raise exception 'Tu usuario no puede operar sobre este pedido.';
  end if;

  -- Si otra persona ya lo entrego, no se vuelve a cargar el saldo.
  if pedido_actual.estado <> 'ATENDIDO' then
    raise exception 'El pedido ya no esta atendido (ahora esta %). Actualiza el listado.', pedido_actual.estado;
  end if;

  if pedido_actual.cliente_id is null then
    raise exception 'El pedido no tiene cliente asignado.';
  end if;

  -- El bloqueo del cliente es lo que serializa dos entregas simultaneas.
  select c.* into cliente_actual from clientes c where c.id = pedido_actual.cliente_id for update;

  if not found then
    raise exception 'No se encontro el cliente del pedido.';
  end if;

  total_pedido := round(coalesce(pedido_actual.total, 0), 2);
  importe_cobrado := round(coalesce(importe_pagado, 0), 2);

  if importe_cobrado < 0 then
    raise exception 'El importe pagado no puede ser negativo.';
  end if;

  if importe_cobrado > total_pedido then
    raise exception 'El importe pagado no puede superar el total del pedido.';
  end if;

  pendiente := total_pedido - importe_cobrado;
  cobro := case when pendiente > 0 then 'CUENTA_CORRIENTE' else 'COBRADO' end;

  if importe_cobrado > 0 then
    insert into pagos_cliente (cliente_id, pedido_id, importe, medio_pago, observacion, fecha)
    values (
      cliente_actual.id, pedido_actual.id, importe_cobrado, 'PAGO_ENTREGA',
      'Pago al entregar pedido #' || pedido_actual.numero, momento
    );
  end if;

  if pendiente > 0 then
    insert into pagos_cliente (cliente_id, pedido_id, importe, medio_pago, observacion, fecha)
    values (
      cliente_actual.id, pedido_actual.id, pendiente, 'CUENTA_CORRIENTE',
      'Pedido entregado a cuenta #' || pedido_actual.numero, momento
    );

    -- saldo = saldo + pendiente sobre el valor real de la fila bloqueada,
    -- no sobre el que tenia el navegador.
    update clientes set saldo = round(coalesce(saldo, 0) + pendiente, 2)
    where id = cliente_actual.id;
  end if;

  update pedidos set
    estado = 'ENTREGADO',
    estado_cobro = cobro,
    pagado = importe_cobrado,
    saldo_generado = pendiente,
    fecha_entrega = momento
  where id = pedido_id_param;

  insert into auditoria (usuario_nombre, usuario_rol, modulo, accion, detalle)
  values (
    coalesce(auth.jwt() ->> 'email', 'Sistema'),
    public.usuario_rol_actual(),
    case when pendiente > 0 then 'Cuenta corriente' else 'Pedidos' end,
    'Entrego pedido',
    '#' || pedido_actual.numero || ' | ' || cliente_actual.nombre ||
    ' | Pago ' || importe_cobrado || ' | Saldo ' || pendiente
  );

  return query
    select c.saldo, pendiente, cobro, momento
    from clientes c where c.id = cliente_actual.id;
end;
$$;
revoke all on function public.entregar_pedido_atomico(uuid, numeric) from public, anon;
grant execute on function public.entregar_pedido_atomico(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Movimiento de cuenta corriente suelto (pago, nota de credito, ajuste).
-- delta_saldo es con signo: positivo suma deuda, negativo la baja.
-- codigo_pago_param sirve de llave de idempotencia: si el celular reintenta por
-- mala senal, el mismo movimiento no se aplica dos veces.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_movimiento_cuenta_atomico(
  cliente_id_param uuid,
  delta_saldo numeric,
  medio_pago_param text,
  observacion_param text,
  codigo_pago_param integer default null,
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
      -- Ya se habia aplicado: se devuelve el saldo actual sin tocarlo.
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
revoke all on function public.registrar_movimiento_cuenta_atomico(uuid, numeric, text, text, integer, uuid) from public, anon;
grant execute on function public.registrar_movimiento_cuenta_atomico(uuid, numeric, text, text, integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Movimiento de stock suelto (ajuste manual, entrada por compra).
-- ---------------------------------------------------------------------------
create or replace function public.registrar_movimiento_stock_atomico(
  producto_id_param uuid,
  delta_cantidad numeric,
  tipo_param text,
  referencia_param text default ''
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  producto_actual record;
  stock_resultante numeric;
  permite_negativo boolean;
begin
  if not (public.usuario_tiene_permiso('movimientos') or public.usuario_tiene_permiso('productos')
          or public.usuario_tiene_permiso('compras')) then
    raise exception 'Tu rol no tiene permiso para mover stock.';
  end if;

  select p.* into producto_actual from productos p where p.id = producto_id_param for update;

  if not found then
    raise exception 'El producto ya no existe.';
  end if;

  select coalesce(c.permitir_stock_negativo, false) into permite_negativo
  from configuracion_empresa c order by c.actualizado_en desc, c.id limit 1;

  stock_resultante := coalesce(producto_actual.stock, 0) + coalesce(delta_cantidad, 0);

  if stock_resultante < 0 and not coalesce(permite_negativo, false) then
    raise exception 'El movimiento dejaria el stock de % en %.', producto_actual.nombre, stock_resultante;
  end if;

  update productos set stock = stock_resultante where id = producto_id_param;

  insert into movimientos_stock (producto_id, tipo, referencia, cantidad, stock_final)
  values (producto_id_param, coalesce(tipo_param, 'Ajuste'), coalesce(referencia_param, ''),
          coalesce(delta_cantidad, 0), stock_resultante);

  return stock_resultante;
end;
$$;
revoke all on function public.registrar_movimiento_stock_atomico(uuid, numeric, text, text) from public, anon;
grant execute on function public.registrar_movimiento_stock_atomico(uuid, numeric, text, text) to authenticated;
