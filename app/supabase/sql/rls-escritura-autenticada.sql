-- Permisos de trabajo para la app interna.
-- Ejecutar despues de schema-inicial.sql y rls-basico.sql.
-- Permite leer, crear, editar y borrar solo a usuarios autenticados en Supabase Auth.

grant usage on schema public to authenticated;

grant all on table roles to authenticated;
grant all on table usuarios to authenticated;
grant all on table configuracion_empresa to authenticated;
grant all on table zonas to authenticated;
grant all on table rubros to authenticated;
grant all on table proveedores to authenticated;
grant all on table proveedor_pagos to authenticated;
grant all on table compras to authenticated;
grant all on table vendedores to authenticated;
grant all on table listas_precios to authenticated;
grant all on table clientes to authenticated;
grant all on table productos to authenticated;
grant all on table producto_precios to authenticated;
grant all on table pedidos to authenticated;
grant all on table pedido_items to authenticated;
grant all on table pagos_cliente to authenticated;
grant all on table movimientos_stock to authenticated;
grant all on table auditoria to authenticated;

drop policy if exists "trabajo autenticado roles" on roles;
create policy "trabajo autenticado roles" on roles
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado usuarios" on usuarios;
create policy "trabajo autenticado usuarios" on usuarios
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado configuracion" on configuracion_empresa;
create policy "trabajo autenticado configuracion" on configuracion_empresa
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado zonas" on zonas;
create policy "trabajo autenticado zonas" on zonas
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado rubros" on rubros;
create policy "trabajo autenticado rubros" on rubros
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado proveedores" on proveedores;
create policy "trabajo autenticado proveedores" on proveedores
for all to authenticated using (true) with check (true);

alter table proveedor_pagos enable row level security;
drop policy if exists "trabajo autenticado proveedor pagos" on proveedor_pagos;
create policy "trabajo autenticado proveedor pagos" on proveedor_pagos
for all to authenticated using (true) with check (true);

alter table compras enable row level security;
drop policy if exists "trabajo autenticado compras" on compras;
create policy "trabajo autenticado compras" on compras
for all to authenticated using (true) with check (true);

alter table vendedores enable row level security;
drop policy if exists "trabajo autenticado vendedores" on vendedores;
create policy "trabajo autenticado vendedores" on vendedores
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado listas" on listas_precios;
create policy "trabajo autenticado listas" on listas_precios
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado clientes" on clientes;
create policy "trabajo autenticado clientes" on clientes
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado productos" on productos;
create policy "trabajo autenticado productos" on productos
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado precios" on producto_precios;
create policy "trabajo autenticado precios" on producto_precios
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado pedidos" on pedidos;
create policy "trabajo autenticado pedidos" on pedidos
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado pedido items" on pedido_items;
create policy "trabajo autenticado pedido items" on pedido_items
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado pagos" on pagos_cliente;
create policy "trabajo autenticado pagos" on pagos_cliente
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado movimientos stock" on movimientos_stock;
create policy "trabajo autenticado movimientos stock" on movimientos_stock
for all to authenticated using (true) with check (true);

drop policy if exists "trabajo autenticado auditoria" on auditoria;
create policy "trabajo autenticado auditoria" on auditoria
for all to authenticated using (true) with check (true);
