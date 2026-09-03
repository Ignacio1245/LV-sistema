-- Catalogo: validacion atomica, clientes existentes e idempotencia de envios.
-- No modifica ni fusiona clientes/pedidos existentes.
create table if not exists public.catalogo_solicitudes (
  solicitud_id uuid primary key,
  payload jsonb not null,
  pedido_id uuid not null references public.pedidos(id),
  creado_en timestamptz not null default now()
);
alter table public.catalogo_solicitudes enable row level security;
revoke all on public.catalogo_solicitudes from public, anon, authenticated;

create or replace function public.catalogo_normalizar_texto(valor text)
returns text language sql immutable set search_path = public as $$
  select regexp_replace(translate(lower(trim(coalesce(valor, ''))),
    'áéíóúüñ', 'aeiouun'), '[^a-z0-9]', '', 'g');
$$;
create or replace function public.catalogo_normalizar_telefono(valor text)
returns text language sql immutable set search_path = public as $$
  select case
    when length(n) = 13 and n like '549%' then substring(n from 4)
    when length(n) = 12 and n like '54%' then substring(n from 3)
    else n end
  from (select regexp_replace(coalesce(valor, ''), '[^0-9]', '', 'g') n) t;
$$;
revoke all on function public.catalogo_normalizar_texto(text) from public, anon, authenticated;
revoke all on function public.catalogo_normalizar_telefono(text) from public, anon, authenticated;

create or replace function public.catalogo_precio_lista_uno(precios jsonb, base numeric)
returns numeric language sql immutable set search_path = public as $$
  select case when coalesce(valor, 0) > 0 then valor else coalesce(base, 0) end
  from (select (
    select nullif(e.value, '')::numeric from jsonb_each_text(coalesce(precios, '{}'::jsonb)) e
    where lower(regexp_replace(e.key, '[^a-zA-Z0-9]', '', 'g')) = 'lista1'
    order by (e.key = 'Lista 1') desc limit 1
  ) valor) t;
$$;
revoke all on function public.catalogo_precio_lista_uno(jsonb, numeric) from public, anon, authenticated;

create or replace function public.catalogo_stock_disponible(producto_id_consulta uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select greatest(0, p.stock - greatest(0, coalesce(nullif(p.stock_minimo, 0),
    (select ce.stock_minimo from configuracion_empresa ce limit 1), 10)) - coalesce((
    select sum(i.cantidad) from pedido_items i
    join pedidos pe on pe.id = i.pedido_id
    where i.producto_id = p.id and pe.estado = 'PENDIENTE'
  ), 0)) from productos p where p.id = producto_id_consulta;
$$;
revoke all on function public.catalogo_stock_disponible(uuid) from public, anon, authenticated;

create or replace function public.obtener_catalogo_publico()
returns table (
  codigo integer, codigo_real text, nombre text, precio_base numeric,
  stock numeric, rubro text, marca text, tipo text, detalle text, pack numeric,
  unidad text, precios_lista jsonb, activo boolean, mostrar_catalogo boolean, imagen_url text
)
language sql stable security definer set search_path = public as $$
  select p.codigo, p.codigo_real, p.nombre, p.precio_base,
    public.catalogo_stock_disponible(p.id), p.rubro, p.marca, p.tipo, p.detalle,
    p.pack, p.unidad, p.precios_lista, p.activo, p.mostrar_catalogo, p.imagen_url
  from productos p
  where p.activo = true and p.mostrar_catalogo = true order by p.nombre;
$$;
revoke all on function public.obtener_catalogo_publico() from public;
grant execute on function public.obtener_catalogo_publico() to anon, authenticated;

create or replace function public.crear_pedido_catalogo_publico(pedido jsonb)
returns table (numero integer, total numeric, cliente_codigo integer)
language plpgsql security definer set search_path = public as $$
declare
  solicitud uuid;
  anterior record;
  cliente_actual record;
  cliente_id_elegido uuid;
  cliente_codigo_elegido integer;
  nombre_cliente text := trim(coalesce(pedido #>> '{cliente,nombre}', ''));
  direccion_cliente text := trim(coalesce(pedido #>> '{cliente,direccion}', ''));
  telefono_cliente text := public.catalogo_normalizar_telefono(pedido #>> '{cliente,telefono}');
  codigo_cliente text := nullif(trim(pedido #>> '{cliente,codigo}'), '');
  coincidencias integer;
  item jsonb;
  producto_actual record;
  cantidad numeric;
  precio numeric;
  total_calculado numeric(14,2) := 0;
  items_validados jsonb := '[]'::jsonb;
  pedido_id_nuevo uuid;
  numero_nuevo integer;
  intentos integer := 0;
begin
  if coalesce(pedido ->> 'solicitud_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Actualiza el catalogo antes de enviar el pedido.';
  end if;
  solicitud := (pedido ->> 'solicitud_id')::uuid;
  -- Serializa altas del catalogo: misma solicitud, clientes y numeracion.
  perform pg_advisory_xact_lock(773, 1);
  select s.payload, s.pedido_id into anterior
  from catalogo_solicitudes s where s.solicitud_id = solicitud;
  if found then
    if anterior.payload <> pedido then
      raise exception using errcode = '22000', message = 'El identificador corresponde a otro contenido. Consulta con la distribuidora.';
    end if;
    return query select pe.numero, pe.total, c.codigo
      from pedidos pe join clientes c on c.id = pe.cliente_id
      where pe.id = anterior.pedido_id;
    return;
  end if;

  if jsonb_typeof(pedido -> 'items') is distinct from 'array' then
    raise exception 'El pedido no contiene una lista de productos valida.';
  end if;
  if jsonb_array_length(pedido -> 'items') not between 1 and 200 then
    raise exception 'El pedido debe tener entre 1 y 200 productos.';
  end if;
  if length(nombre_cliente) not between 2 and 120 or length(direccion_cliente) not between 3 and 180
     or telefono_cliente !~ '^[0-9]{8,15}$' then
    raise exception 'Completa nombre, direccion y telefono del cliente.';
  end if;
  if length(coalesce(pedido ->> 'comentario', '')) > 400 then
    raise exception 'El comentario puede tener hasta 400 caracteres.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(pedido -> 'items') x
    group by x ->> 'codigo' having count(*) > 1
  ) then
    raise exception 'Hay productos repetidos. Actualiza el pedido.';
  end if;

  -- Bloqueo ordenado y valores del servidor: no confiamos en precios ni stock del navegador.
  for item in select value from jsonb_array_elements(pedido -> 'items') order by value ->> 'codigo'
  loop
    if coalesce(item ->> 'codigo', '') !~ '^[1-9][0-9]{0,9}$'
       or coalesce(item ->> 'cantidad', '') !~ '^[0-9]{1,10}(\.[0-9]{1,3})?$'
       or coalesce(item ->> 'precio_unitario', '') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' then
      raise exception 'Producto, precio o cantidad invalidos. Actualiza el catalogo.';
    end if;
    select p.* into producto_actual from productos p
      where p.codigo::text = item ->> 'codigo' for update;
    if not found or not producto_actual.activo or not producto_actual.mostrar_catalogo then
      raise exception 'Un producto ya no esta disponible. Revisa el pedido.';
    end if;
    cantidad := (item ->> 'cantidad')::numeric;
    if cantidad <= 0 or cantidad > public.catalogo_stock_disponible(producto_actual.id) then
      raise exception 'Stock insuficiente para %. Revisa la cantidad.', producto_actual.nombre;
    end if;
    if coalesce(producto_actual.precios_lista #>> '{__stockConfig,tipoStock}', 'simple') <> 'peso'
       and trunc(cantidad) <> cantidad then
      raise exception 'El producto % se vende por unidades enteras.', producto_actual.nombre;
    end if;
    if coalesce(producto_actual.precios_lista #>> '{__stockConfig,ventaSoloBulto}', 'false') = 'true'
       and coalesce(producto_actual.precios_lista #>> '{__stockConfig,tipoStock}', '') = 'bultos'
       and mod(cantidad, greatest(1, coalesce(nullif(producto_actual.precios_lista #>> '{__stockConfig,unidadesPorBulto}', '')::numeric, 1))) <> 0 then
      raise exception 'El producto % se vende por bultos completos.', producto_actual.nombre;
    end if;
    precio := public.catalogo_precio_lista_uno(producto_actual.precios_lista, producto_actual.precio_base);
    if precio < 0 or precio <> (item ->> 'precio_unitario')::numeric then
      raise exception 'Cambio el precio de %. Revisa el total y confirma de nuevo.', producto_actual.nombre;
    end if;
    total_calculado := total_calculado + round(cantidad * precio, 2);
    items_validados := items_validados || jsonb_build_array(jsonb_build_object(
      'producto_id', producto_actual.id, 'cantidad', cantidad,
      'precio', precio, 'subtotal', round(cantidad * precio, 2)
    ));
  end loop;

  if codigo_cliente is not null then
    if codigo_cliente !~ '^[1-9][0-9]{0,9}$' then
      raise exception 'Revisa el codigo y el telefono del cliente.';
    end if;
    select c.* into cliente_actual from clientes c
      where c.codigo::text = codigo_cliente and telefono_cliente in (
        public.catalogo_normalizar_telefono(c.telefono),
        public.catalogo_normalizar_telefono(c.telefono_movil),
        public.catalogo_normalizar_telefono(c.telefono_particular)
      );
    if not found then
      raise exception 'No pudimos vincular el codigo y telefono. Consulta con la distribuidora.';
    end if;
  else
    select count(*) into coincidencias from clientes c
      where public.catalogo_normalizar_texto(c.nombre) = public.catalogo_normalizar_texto(nombre_cliente)
      and (public.catalogo_normalizar_texto(c.direccion) = public.catalogo_normalizar_texto(direccion_cliente)
        or telefono_cliente in (
          public.catalogo_normalizar_telefono(c.telefono),
          public.catalogo_normalizar_telefono(c.telefono_movil),
          public.catalogo_normalizar_telefono(c.telefono_particular)
        ));
    if coincidencias > 1 then
      raise exception 'Hay mas de una ficha posible. Ingresa tu codigo de cliente o consulta con la distribuidora.';
    end if;
    select c.* into cliente_actual from clientes c
      where public.catalogo_normalizar_texto(c.nombre) = public.catalogo_normalizar_texto(nombre_cliente)
      and (public.catalogo_normalizar_texto(c.direccion) = public.catalogo_normalizar_texto(direccion_cliente)
        or telefono_cliente in (
          public.catalogo_normalizar_telefono(c.telefono),
          public.catalogo_normalizar_telefono(c.telefono_movil),
          public.catalogo_normalizar_telefono(c.telefono_particular)
        ));
  end if;

  if cliente_actual.id is not null then
    if not cliente_actual.activo then
      raise exception 'No se puede tomar el pedido con esta ficha. Consulta con la distribuidora.';
    end if;
    cliente_id_elegido := cliente_actual.id;
    cliente_codigo_elegido := cliente_actual.codigo;
  else
    loop
      cliente_codigo_elegido := greatest(900000, coalesce((select max(c.codigo) + 1 from clientes c), 900000));
      begin
        insert into clientes(codigo, nombre, telefono, direccion, zona, activo, observaciones)
          values(cliente_codigo_elegido, nombre_cliente, telefono_cliente, direccion_cliente, 'Catalogo', true,
            'Creado desde catalogo publico; datos declarados por el cliente')
          returning id into cliente_id_elegido;
        exit;
      exception when unique_violation then
        intentos := intentos + 1;
        if intentos > 20 then raise exception 'No se pudo reservar el codigo de cliente.'; end if;
      end;
    end loop;
  end if;

  intentos := 0;
  loop
    numero_nuevo := greatest(1, coalesce((select max(pe.numero) + 1 from pedidos pe), 1));
    begin
      insert into pedidos(numero, cliente_id, vendedor_id, vendedor, zona, estado,
        forma_pago, estado_cobro, total, pagado, saldo_generado, observaciones)
      values(numero_nuevo, cliente_id_elegido, cliente_actual.vendedor_id,
        coalesce(nullif(cliente_actual.vendedor_asignado, ''), 'Catalogo clientes'),
        coalesce(nullif(cliente_actual.zona, ''), 'Catalogo'), 'PENDIENTE', 'CUENTA_CORRIENTE', '',
        total_calculado, 0, 0,
        jsonb_build_array('Pedido desde catalogo publico', 'Direccion de entrega: ' || direccion_cliente,
          'Telefono de contacto: ' || telefono_cliente, 'Comentario: ' || coalesce(pedido ->> 'comentario', '')))
      returning id into pedido_id_nuevo;
      exit;
    exception when unique_violation then
      intentos := intentos + 1;
      if intentos > 20 then raise exception 'No se pudo reservar el numero de pedido.'; end if;
    end;
  end loop;

  insert into pedido_items(pedido_id, producto_id, cantidad, lista_precio_nombre, precio_unitario, descuento_porcentaje, subtotal)
    select pedido_id_nuevo, (v ->> 'producto_id')::uuid, (v ->> 'cantidad')::numeric, 'Lista 1',
      (v ->> 'precio')::numeric, 0, (v ->> 'subtotal')::numeric
    from jsonb_array_elements(items_validados) v;
  insert into catalogo_solicitudes(solicitud_id, payload, pedido_id) values(solicitud, pedido, pedido_id_nuevo);
  insert into auditoria(usuario_nombre, usuario_rol, modulo, accion, detalle)
    values('Catalogo publico', 'cliente', 'catalogo', 'crear_pedido', 'Pedido #' || numero_nuevo);
  return query select numero_nuevo, total_calculado, cliente_codigo_elegido;
end;
$$;
revoke all on function public.crear_pedido_catalogo_publico(jsonb) from public;
grant execute on function public.crear_pedido_catalogo_publico(jsonb) to anon, authenticated;
