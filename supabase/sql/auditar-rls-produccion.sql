-- Auditoria y limpieza de RLS para produccion.
-- No borra datos. Solo revisa y elimina policies amplias de instalacion inicial.
-- Ejecutar despues de rls-por-roles.sql si el Security Advisor sigue mostrando RLS Policy Always True.

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') in ('true', '(true)')
    or coalesce(with_check, '') in ('true', '(true)')
    or policyname like 'lectura autenticada%'
    or policyname like 'trabajo autenticado%'
  )
order by tablename, policyname;

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

drop policy if exists "lectura autenticada roles" on roles;
drop policy if exists "lectura autenticada usuarios" on usuarios;
drop policy if exists "lectura autenticada configuracion" on configuracion_empresa;
drop policy if exists "lectura autenticada datos base" on zonas;
drop policy if exists "lectura autenticada rubros" on rubros;
drop policy if exists "lectura autenticada proveedores" on proveedores;
drop policy if exists "lectura autenticada proveedor pagos" on proveedor_pagos;
drop policy if exists "lectura autenticada compras" on compras;
drop policy if exists "lectura autenticada vendedores" on vendedores;
drop policy if exists "lectura autenticada listas" on listas_precios;
drop policy if exists "lectura autenticada clientes" on clientes;
drop policy if exists "lectura autenticada productos" on productos;
drop policy if exists "lectura autenticada precios" on producto_precios;
drop policy if exists "lectura autenticada pedidos" on pedidos;
drop policy if exists "lectura autenticada pedido items" on pedido_items;
drop policy if exists "lectura autenticada pagos" on pagos_cliente;
drop policy if exists "lectura autenticada movimientos stock" on movimientos_stock;
drop policy if exists "lectura autenticada auditoria" on auditoria;

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

-- Resultado esperado: cero filas. Si aparecen filas, revisar antes de entregar.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') in ('true', '(true)')
    or coalesce(with_check, '') in ('true', '(true)')
    or policyname like 'lectura autenticada%'
    or policyname like 'trabajo autenticado%'
  )
order by tablename, policyname;