-- Activa cambios en vivo para que admin, vendedores y catalogo vean datos recientes.
-- Pegar en Supabase SQL Editor despues del schema/RLS.

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'clientes',
    'productos',
    'pedidos',
    'pedido_items',
    'pagos_cliente',
    'movimientos_stock',
    'listas_precios',
    'vendedores',
    'proveedores',
    'rubros',
    'zonas',
    'compras',
    'usuarios',
    'roles',
    'configuracion_empresa'
  ] loop
    if to_regclass('public.' || tabla) is not null and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tabla
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tabla);
    end if;
  end loop;
end $$;