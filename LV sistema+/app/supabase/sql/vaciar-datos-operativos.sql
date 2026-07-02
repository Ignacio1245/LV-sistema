-- Vacia datos operativos de Supabase sin borrar accesos.
-- Conserva roles, usuarios y configuracion_empresa para no perder el ingreso al sistema.
-- Si alguna tabla todavia no existe, la saltea.

do $$
declare
  tablas_operativas text[] := array[
    'pagos_cliente',
    'movimientos_stock',
    'pedido_items',
    'pedidos',
    'producto_precios',
    'productos',
    'clientes',
    'compras',
    'proveedor_pagos',
    'vendedores',
    'proveedores',
    'rubros',
    'zonas',
    'listas_precios',
    'auditoria'
  ];
  tablas_existentes text;
begin
  select string_agg(format('%I.%I', schemaname, tablename), ', ')
  into tablas_existentes
  from pg_tables
  where schemaname = 'public'
    and tablename = any(tablas_operativas);

  if tablas_existentes is null then
    raise notice 'No se encontraron tablas operativas para vaciar.';
    return;
  end if;

  execute 'truncate table ' || tablas_existentes || ' restart identity cascade';
  raise notice 'Datos operativos vaciados: %', tablas_existentes;
end $$;
