alter table roles enable row level security;
alter table usuarios enable row level security;
alter table configuracion_empresa enable row level security;
alter table zonas enable row level security;
alter table rubros enable row level security;
alter table proveedores enable row level security;
alter table proveedor_pagos enable row level security;
alter table compras enable row level security;
alter table vendedores enable row level security;
alter table listas_precios enable row level security;
alter table clientes enable row level security;
alter table productos enable row level security;
alter table producto_precios enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table pagos_cliente enable row level security;
alter table movimientos_stock enable row level security;
alter table auditoria enable row level security;

-- Etapa inicial de desarrollo.
-- Ajustar antes de producción: estas politicas permiten operar a usuarios autenticados.

create policy "lectura autenticada roles" on roles
for select to authenticated using (true);

create policy "lectura autenticada usuarios" on usuarios
for select to authenticated using (true);

create policy "lectura autenticada configuracion" on configuracion_empresa
for select to authenticated using (true);

create policy "lectura autenticada datos base" on zonas
for select to authenticated using (true);

create policy "lectura autenticada rubros" on rubros
for select to authenticated using (true);

create policy "lectura autenticada proveedores" on proveedores
for select to authenticated using (true);

create policy "lectura autenticada proveedor pagos" on proveedor_pagos
for select to authenticated using (true);

create policy "lectura autenticada compras" on compras
for select to authenticated using (true);

create policy "lectura autenticada vendedores" on vendedores
for select to authenticated using (true);

create policy "lectura autenticada listas" on listas_precios
for select to authenticated using (true);

create policy "lectura autenticada clientes" on clientes
for select to authenticated using (true);

create policy "lectura autenticada productos" on productos
for select to authenticated using (true);

create policy "lectura autenticada precios" on producto_precios
for select to authenticated using (true);

create policy "lectura autenticada pedidos" on pedidos
for select to authenticated using (true);

create policy "lectura autenticada pedido items" on pedido_items
for select to authenticated using (true);

create policy "lectura autenticada pagos" on pagos_cliente
for select to authenticated using (true);

create policy "lectura autenticada movimientos stock" on movimientos_stock
for select to authenticated using (true);

create policy "lectura autenticada auditoria" on auditoria
for select to authenticated using (true);
