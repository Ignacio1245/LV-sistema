-- Reparacion segura para que SUPERADMIN nunca quede sin permisos.
-- No borra datos. Solo actualiza el rol base y la funcion usada por RLS.

update roles
set
  permisos = '{
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
  activo = true
where upper(trim(nombre)) = 'SUPERADMIN';

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
      and (
        upper(trim(roles.nombre)) = 'SUPERADMIN'
        or coalesce((roles.permisos ->> nombre_permiso)::boolean, false) = true
      )
  );
$$;
