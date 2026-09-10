-- ===========================================================================
-- ¿Está encendido el candado? (correr esto PRIMERO)
-- ===========================================================================
--
-- El sistema tiene un juego completo de politicas de seguridad: que un vendedor
-- solo vea sus clientes, que no pueda tocar precios, que no entre a usuarios.
-- Todas esas politicas estan en `rls-por-roles.sql`.
--
-- Pero una politica no hace NADA si la tabla no tiene "row level security"
-- encendido. Y el `alter table ... enable row level security` no esta en
-- `rls-por-roles.sql`: esta en un archivo aparte, `auditar-rls-produccion.sql`.
--
-- O sea que se puede tener todo el juego de politicas instalado y el candado
-- abierto, sin ninguna señal de que algo ande mal. Comprobado en PostgreSQL 16:
--
--   RLS apagado:  un VENDEDOR lee la tabla clientes entera y la de usuarios
--   RLS encendido: el mismo vendedor ve 0 clientes que no sean suyos
--
-- Con el candado abierto, cualquiera que tenga la app en el celular puede leer
-- y escribir todas las tablas llamando a la API directamente: costos, saldos de
-- todos los clientes, usuarios. No hace falta ser tecnico, alcanza con la clave
-- publica que esta a la vista en supabase-config.js.
--
-- Esta consulta no cambia nada. Solo dice como esta.
-- ---------------------------------------------------------------------------

select
  c.relname                                        as tabla,
  case when c.relrowsecurity then 'ENCENDIDO' else '>>> APAGADO <<<' end as candado,
  (select count(*) from pg_policy p where p.polrelid = c.oid) as politicas
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and c.relname in (
    'roles','usuarios','configuracion_empresa','zonas','rubros','proveedores',
    'proveedor_pagos','compras','vendedores','listas_precios','clientes',
    'productos','producto_precios','pedidos','pedido_items','pagos_cliente',
    'movimientos_stock','auditoria','catalogo_solicitudes',
    'catalogo_enlaces_vendedor','producto_historial_precios'
  )
order by c.relrowsecurity, c.relname;

-- ---------------------------------------------------------------------------
-- COMO LEER EL RESULTADO
-- ---------------------------------------------------------------------------
--
--   candado = ENCENDIDO y politicas > 0   -> esa tabla esta protegida.
--
--   candado = APAGADO y politicas > 0     -> ESTE ES EL CASO MALO.
--                                            Las reglas estan escritas pero no
--                                            se aplican. Corre
--                                            `auditar-rls-produccion.sql`.
--
--   candado = ENCENDIDO y politicas = 0   -> nadie puede tocar esa tabla.
--                                            Corre `rls-por-roles.sql`.
--
-- El resumen de una linea:
select
  count(*) filter (where not c.relrowsecurity) as tablas_sin_candado,
  count(*)                                     as tablas_revisadas,
  case
    when count(*) filter (where not c.relrowsecurity) = 0
      then 'Todo protegido.'
    else 'HAY ' || count(*) filter (where not c.relrowsecurity) ||
         ' TABLA(S) SIN CANDADO. Corre auditar-rls-produccion.sql.'
  end                                          as que_hacer
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and c.relname in (
    'roles','usuarios','configuracion_empresa','zonas','rubros','proveedores',
    'proveedor_pagos','compras','vendedores','listas_precios','clientes',
    'productos','producto_precios','pedidos','pedido_items','pagos_cliente',
    'movimientos_stock','auditoria'
  );
