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

-- Crea un pedido desde el catalogo publico sin abrir escritura directa a tablas.
-- Valida que los productos sigan publicados, activos y con stock antes de guardar.
create or replace function public.crear_pedido_catalogo_publico(pedido jsonb)
returns table (
  numero integer,
  total numeric,
  cliente_codigo integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cliente_nombre text := left(trim(coalesce(pedido #>> '{cliente,nombre}', 'Cliente catalogo')), 120);
  cliente_direccion text := left(trim(coalesce(pedido #>> '{cliente,direccion}', 'Sin direccion')), 180);
  cliente_telefono text := left(trim(coalesce(pedido #>> '{cliente,telefono}', '-')), 60);
  comentario_cliente text := left(trim(coalesce(pedido ->> 'comentario', '')), 400);
  cliente_id_generado uuid;
  cliente_codigo_generado integer;
  numero_pedido integer;
  pedido_id_generado uuid;
  item_pedido jsonb;
  producto_pedido record;
  codigo_producto integer;
  cantidad_producto numeric(14, 3);
  precio_unitario numeric(14, 2);
  subtotal_item numeric(14, 2);
  total_pedido numeric(14, 2) := 0;
  intentos integer := 0;
begin
  if jsonb_typeof(pedido -> 'items') <> 'array' or jsonb_array_length(pedido -> 'items') = 0 then
    raise exception 'El pedido de catalogo no tiene productos.';
  end if;

  if cliente_nombre = '' then
    cliente_nombre := 'Cliente catalogo';
  end if;

  if cliente_direccion = '' then
    cliente_direccion := 'Sin direccion';
  end if;

  for item_pedido in
    select value from jsonb_array_elements(pedido -> 'items')
  loop
    if coalesce(item_pedido ->> 'codigo', '') !~ '^[0-9]+$' then
      raise exception 'Producto de catalogo invalido.';
    end if;

    if coalesce(item_pedido ->> 'cantidad', '') !~ '^[0-9]+(\.[0-9]+)?$' then
      raise exception 'Cantidad de catalogo invalida.';
    end if;

    codigo_producto := (item_pedido ->> 'codigo')::integer;
    cantidad_producto := (item_pedido ->> 'cantidad')::numeric;

    select
      productos.id,
      productos.codigo,
      productos.nombre,
      productos.precio_base,
      productos.stock,
      productos.precios_lista
    into producto_pedido
    from productos
    where productos.codigo = codigo_producto
      and productos.activo = true
      and productos.mostrar_catalogo = true
      and productos.stock > 0;

    if producto_pedido.id is null then
      raise exception 'Producto no disponible en catalogo: %', codigo_producto;
    end if;

    if cantidad_producto <= 0 or cantidad_producto > producto_pedido.stock then
      raise exception 'Cantidad sin stock para producto: %', codigo_producto;
    end if;

    precio_unitario :=
      coalesce(
        nullif(producto_pedido.precios_lista ->> 'Lista 1', '')::numeric,
        producto_pedido.precio_base,
        0
      );

    total_pedido :=
      total_pedido + round(cantidad_producto * precio_unitario, 2);
  end loop;

  select clientes.id, clientes.codigo
  into cliente_id_generado, cliente_codigo_generado
  from clientes
  where lower(trim(clientes.nombre)) = lower(cliente_nombre)
    and lower(trim(clientes.direccion)) = lower(cliente_direccion)
  order by clientes.codigo asc
  limit 1;

  if cliente_id_generado is null then
    intentos := 0;

    loop
      cliente_codigo_generado :=
        greatest(900000, coalesce((select max(clientes.codigo) + 1 from clientes), 900000));

      begin
        insert into clientes (
          codigo,
          nombre,
          telefono,
          direccion,
          zona,
          activo,
          observaciones
        )
        values (
          cliente_codigo_generado,
          cliente_nombre,
          coalesce(nullif(cliente_telefono, ''), '-'),
          cliente_direccion,
          'Catalogo',
          true,
          'Creado automaticamente desde catalogo publico'
        )
        returning clientes.id, clientes.codigo
        into cliente_id_generado, cliente_codigo_generado;

        exit;
      exception
        when unique_violation then
          intentos := intentos + 1;

          if intentos > 20 then
            raise exception 'No se pudo reservar codigo de cliente para catalogo.';
          end if;
      end;
    end loop;
  end if;

  intentos := 0;

  loop
    numero_pedido :=
      greatest(1, coalesce((select max(pedidos.numero) + 1 from pedidos), 1));

    begin
      insert into pedidos (
        numero,
        cliente_id,
        vendedor,
        zona,
        estado,
        forma_pago,
        estado_cobro,
        total,
        pagado,
        saldo_generado,
        observaciones
      )
      values (
        numero_pedido,
        cliente_id_generado,
        'Catalogo clientes',
        'Catalogo',
        'PENDIENTE',
        'CUENTA_CORRIENTE',
        '',
        total_pedido,
        0,
        0,
        case
          when comentario_cliente <> '' then
            jsonb_build_array(
              'Pedido desde catalogo publico',
              'Direccion: ' || cliente_direccion,
              'Telefono: ' || coalesce(nullif(cliente_telefono, ''), '-'),
              'Comentario: ' || comentario_cliente
            )
          else
            jsonb_build_array(
              'Pedido desde catalogo publico',
              'Direccion: ' || cliente_direccion,
              'Telefono: ' || coalesce(nullif(cliente_telefono, ''), '-')
            )
        end
      )
      returning pedidos.id, pedidos.numero
      into pedido_id_generado, numero_pedido;

      exit;
    exception
      when unique_violation then
        intentos := intentos + 1;

        if intentos > 20 then
          raise exception 'No se pudo reservar numero de pedido para catalogo.';
        end if;
    end;
  end loop;

  for item_pedido in
    select value from jsonb_array_elements(pedido -> 'items')
  loop
    codigo_producto := (item_pedido ->> 'codigo')::integer;
    cantidad_producto := (item_pedido ->> 'cantidad')::numeric;

    select
      productos.id,
      productos.codigo,
      productos.nombre,
      productos.precio_base,
      productos.stock,
      productos.precios_lista
    into producto_pedido
    from productos
    where productos.codigo = codigo_producto
      and productos.activo = true
      and productos.mostrar_catalogo = true
      and productos.stock > 0;

    precio_unitario :=
      coalesce(
        nullif(producto_pedido.precios_lista ->> 'Lista 1', '')::numeric,
        producto_pedido.precio_base,
        0
      );
    subtotal_item :=
      round(cantidad_producto * precio_unitario, 2);

    insert into pedido_items (
      pedido_id,
      producto_id,
      cantidad,
      lista_precio_nombre,
      precio_unitario,
      descuento_porcentaje,
      subtotal
    )
    values (
      pedido_id_generado,
      producto_pedido.id,
      cantidad_producto,
      'Lista 1',
      precio_unitario,
      0,
      subtotal_item
    );
  end loop;

  insert into auditoria (
    usuario_nombre,
    usuario_rol,
    modulo,
    accion,
    detalle
  )
  values (
    'Catalogo publico',
    'cliente',
    'catalogo',
    'crear_pedido',
    'Pedido #' || numero_pedido || ' desde catalogo publico'
  );

  return query
  select numero_pedido, total_pedido, cliente_codigo_generado;
end;
$$;

revoke all on function public.crear_pedido_catalogo_publico(jsonb) from public;
grant execute on function public.crear_pedido_catalogo_publico(jsonb) to anon;
grant execute on function public.crear_pedido_catalogo_publico(jsonb) to authenticated;
