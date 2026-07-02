-- Politicas RLS por roles para produccion.
-- Ejecutar cuando ya existan roles, usuarios y emails reales de Supabase Auth.
-- Reemplaza las politicas amplias de rls-escritura-autenticada.sql.

create or replace function public.usuario_sistema_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from usuarios
    where lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      and activo = true
  );
$$;

create or replace function public.usuario_tiene_permiso(nombre_permiso text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from usuarios
    join roles on roles.id = usuarios.rol_id
    where lower(trim(usuarios.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      and usuarios.activo = true
      and roles.activo = true
      and coalesce((roles.permisos ->> nombre_permiso)::boolean, false) = true
  );
$$;

drop policy if exists "trabajo autenticado roles" on roles;
drop policy if exists "trabajo autenticado usuarios" on usuarios;
drop policy if exists "trabajo autenticado configuracion" on configuracion_empresa;
drop policy if exists "trabajo autenticado zonas" on zonas;
drop policy if exists "trabajo autenticado rubros" on rubros;
drop policy if exists "trabajo autenticado proveedores" on proveedores;
drop policy if exists "trabajo autenticado proveedor pagos" on proveedor_pagos;
drop policy if exists "trabajo autenticado compras" on compras;
drop policy if exists "trabajo autenticado vendedores" on vendedores;
drop policy if exists "trabajo autenticado listas" on listas_precios;
drop policy if exists "trabajo autenticado clientes" on clientes;
drop policy if exists "trabajo autenticado productos" on productos;
drop policy if exists "trabajo autenticado precios" on producto_precios;
drop policy if exists "trabajo autenticado pedidos" on pedidos;
drop policy if exists "trabajo autenticado pedido items" on pedido_items;
drop policy if exists "trabajo autenticado pagos" on pagos_cliente;
drop policy if exists "trabajo autenticado movimientos stock" on movimientos_stock;
drop policy if exists "trabajo autenticado auditoria" on auditoria;

drop policy if exists "roles lectura usuario activo" on roles;
drop policy if exists "roles escritura configuracion" on roles;
drop policy if exists "usuarios lectura usuario activo" on usuarios;
drop policy if exists "usuarios escritura configuracion" on usuarios;
drop policy if exists "configuracion lectura usuario activo" on configuracion_empresa;
drop policy if exists "configuracion escritura configuracion" on configuracion_empresa;
drop policy if exists "zonas lectura usuario activo" on zonas;
drop policy if exists "zonas escritura permiso" on zonas;
drop policy if exists "rubros lectura usuario activo" on rubros;
drop policy if exists "rubros escritura permiso" on rubros;
drop policy if exists "listas lectura usuario activo" on listas_precios;
drop policy if exists "listas escritura permiso" on listas_precios;
drop policy if exists "proveedores lectura usuario activo" on proveedores;
drop policy if exists "proveedores escritura permiso" on proveedores;
drop policy if exists "proveedor pagos lectura permiso" on proveedor_pagos;
drop policy if exists "proveedor pagos escritura permiso" on proveedor_pagos;
drop policy if exists "compras lectura permiso" on compras;
drop policy if exists "compras escritura permiso" on compras;
drop policy if exists "vendedores lectura usuario activo" on vendedores;
drop policy if exists "vendedores escritura configuracion" on vendedores;
drop policy if exists "clientes lectura permiso" on clientes;
drop policy if exists "clientes escritura permiso" on clientes;
drop policy if exists "productos lectura usuario activo" on productos;
drop policy if exists "productos escritura permiso" on productos;
drop policy if exists "producto precios lectura usuario activo" on producto_precios;
drop policy if exists "producto precios escritura productos" on producto_precios;
drop policy if exists "pedidos lectura permiso" on pedidos;
drop policy if exists "pedidos escritura ventas" on pedidos;
drop policy if exists "pedido items lectura permiso" on pedido_items;
drop policy if exists "pedido items escritura ventas" on pedido_items;
drop policy if exists "pagos cliente lectura permiso" on pagos_cliente;
drop policy if exists "pagos cliente escritura permiso" on pagos_cliente;
drop policy if exists "movimientos stock lectura permiso" on movimientos_stock;
drop policy if exists "movimientos stock escritura permiso" on movimientos_stock;
drop policy if exists "auditoria lectura permiso" on auditoria;
drop policy if exists "auditoria escritura usuario activo" on auditoria;

create policy "roles lectura usuario activo" on roles
for select to authenticated using (public.usuario_sistema_activo());
create policy "roles escritura configuracion" on roles
for all to authenticated using (public.usuario_tiene_permiso('configuracion')) with check (public.usuario_tiene_permiso('configuracion'));

create policy "usuarios lectura usuario activo" on usuarios
for select to authenticated using (public.usuario_sistema_activo());
create policy "usuarios escritura configuracion" on usuarios
for all to authenticated using (public.usuario_tiene_permiso('configuracion')) with check (public.usuario_tiene_permiso('configuracion'));

create policy "configuracion lectura usuario activo" on configuracion_empresa
for select to authenticated using (public.usuario_sistema_activo());
create policy "configuracion escritura configuracion" on configuracion_empresa
for all to authenticated using (public.usuario_tiene_permiso('configuracion')) with check (public.usuario_tiene_permiso('configuracion'));

create policy "zonas lectura usuario activo" on zonas
for select to authenticated using (public.usuario_sistema_activo());
create policy "zonas escritura permiso" on zonas
for all to authenticated using (public.usuario_tiene_permiso('zonas')) with check (public.usuario_tiene_permiso('zonas'));

create policy "rubros lectura usuario activo" on rubros
for select to authenticated using (public.usuario_sistema_activo());
create policy "rubros escritura permiso" on rubros
for all to authenticated using (public.usuario_tiene_permiso('rubros')) with check (public.usuario_tiene_permiso('rubros'));

create policy "listas lectura usuario activo" on listas_precios
for select to authenticated using (public.usuario_sistema_activo());
create policy "listas escritura permiso" on listas_precios
for all to authenticated using (public.usuario_tiene_permiso('rubros')) with check (public.usuario_tiene_permiso('rubros'));

create policy "proveedores lectura usuario activo" on proveedores
for select to authenticated using (public.usuario_sistema_activo());
create policy "proveedores escritura permiso" on proveedores
for all to authenticated using (public.usuario_tiene_permiso('proveedores')) with check (public.usuario_tiene_permiso('proveedores'));

create policy "proveedor pagos lectura permiso" on proveedor_pagos
for select to authenticated using (public.usuario_tiene_permiso('proveedores'));
create policy "proveedor pagos escritura permiso" on proveedor_pagos
for all to authenticated using (public.usuario_tiene_permiso('proveedores')) with check (public.usuario_tiene_permiso('proveedores'));

create policy "compras lectura permiso" on compras
for select to authenticated using (public.usuario_tiene_permiso('compras'));
create policy "compras escritura permiso" on compras
for all to authenticated using (public.usuario_tiene_permiso('compras')) with check (public.usuario_tiene_permiso('compras'));

create policy "vendedores lectura usuario activo" on vendedores
for select to authenticated using (public.usuario_sistema_activo());
create policy "vendedores escritura configuracion" on vendedores
for all to authenticated using (public.usuario_tiene_permiso('configuracion')) with check (public.usuario_tiene_permiso('configuracion'));

create policy "clientes lectura permiso" on clientes
for select to authenticated using (public.usuario_tiene_permiso('clientes') or public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('cuentaCorriente'));
create policy "clientes escritura permiso" on clientes
for all to authenticated using (public.usuario_tiene_permiso('clientes') or public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('ventas')) with check (public.usuario_tiene_permiso('clientes') or public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('ventas'));

create policy "productos lectura usuario activo" on productos
for select to authenticated using (public.usuario_sistema_activo());
create policy "productos escritura permiso" on productos
for all to authenticated using (public.usuario_tiene_permiso('productos') or public.usuario_tiene_permiso('movimientos') or public.usuario_tiene_permiso('compras') or public.usuario_tiene_permiso('ventas')) with check (public.usuario_tiene_permiso('productos') or public.usuario_tiene_permiso('movimientos') or public.usuario_tiene_permiso('compras') or public.usuario_tiene_permiso('ventas'));

create policy "producto precios lectura usuario activo" on producto_precios
for select to authenticated using (public.usuario_sistema_activo());
create policy "producto precios escritura productos" on producto_precios
for all to authenticated using (public.usuario_tiene_permiso('productos')) with check (public.usuario_tiene_permiso('productos'));

create policy "pedidos lectura permiso" on pedidos
for select to authenticated using (public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('informes'));
create policy "pedidos escritura ventas" on pedidos
for all to authenticated using (public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('cuentaCorriente')) with check (public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('cuentaCorriente'));

create policy "pedido items lectura permiso" on pedido_items
for select to authenticated using (public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('informes'));
create policy "pedido items escritura ventas" on pedido_items
for all to authenticated using (public.usuario_tiene_permiso('ventas')) with check (public.usuario_tiene_permiso('ventas'));

create policy "pagos cliente lectura permiso" on pagos_cliente
for select to authenticated using (public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('clientes') or public.usuario_tiene_permiso('ventas'));
create policy "pagos cliente escritura permiso" on pagos_cliente
for all to authenticated using (public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('ventas')) with check (public.usuario_tiene_permiso('cuentaCorriente') or public.usuario_tiene_permiso('ventas'));

create policy "movimientos stock lectura permiso" on movimientos_stock
for select to authenticated using (public.usuario_tiene_permiso('movimientos') or public.usuario_tiene_permiso('productos') or public.usuario_tiene_permiso('ventas'));
create policy "movimientos stock escritura permiso" on movimientos_stock
for all to authenticated using (public.usuario_tiene_permiso('movimientos') or public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('productos')) with check (public.usuario_tiene_permiso('movimientos') or public.usuario_tiene_permiso('ventas') or public.usuario_tiene_permiso('productos'));

create policy "auditoria lectura permiso" on auditoria
for select to authenticated using (public.usuario_tiene_permiso('auditoria'));
create policy "auditoria escritura usuario activo" on auditoria
for insert to authenticated with check (public.usuario_sistema_activo());
