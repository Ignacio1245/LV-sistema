-- Configurar primer administrador del sistema.
-- 1. Crea este mismo email en Supabase Auth.
-- 2. En Supabase Auth elegis la contrasena. Este SQL no crea contrasena.
-- 3. Reemplaza el email de abajo por el email real del dueno.
-- 4. Ejecuta este SQL una sola vez.

insert into roles (nombre, permisos, activo)
values (
  'SUPERADMIN',
  '{
    "productos": true,
    "rubros": true,
    "zonas": true,
    "proveedores": true,
    "compras": true,
    "movimientos": true,
    "clientes": true,
    "ventas": true,
    "cuentaCorriente": true,
    "configuracion": true,
    "impresion": true,
    "auditoria": true,
    "informes": true
  }'::jsonb,
  true
)
on conflict (nombre) do update set
  permisos = excluded.permisos,
  activo = true;

insert into usuarios (codigo, nombre, email, rol_id, activo)
select
  1,
  'Administrador',
  'ignaciovas11@gmail.com',
  roles.id,
  true
from roles
where roles.nombre = 'SUPERADMIN'
on conflict (codigo) do update set
  nombre = excluded.nombre,
  email = excluded.email,
  rol_id = excluded.rol_id,
  activo = true;
