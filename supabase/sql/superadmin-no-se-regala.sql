-- ===========================================================================
-- Solo un SUPERADMIN puede repartir SUPERADMIN
-- ===========================================================================
--
-- QUE PASABA
--
-- La politica de la tabla `usuarios` daba escritura completa a cualquiera con
-- el permiso `configuracion`:
--
--   create policy "usuarios escritura configuracion" on usuarios
--   for all to authenticated
--   using (public.usuario_tiene_permiso('configuracion'))
--   with check (public.usuario_tiene_permiso('configuracion'));
--
-- En la pantalla de Roles, "Configuracion" se lee como "los datos de la empresa
-- y la impresion". Pero con ese permiso, alguien entra a Usuarios, se edita a si
-- mismo, elige SUPERADMIN en el desplegable y guarda. Y el servidor lo dejaba
-- pasar: no era que la unica defensa estuviera en el navegador, es que la
-- defensa del servidor estaba escrita para permitirlo.
--
-- (El navegador ahora tambien lo bloquea, pero eso solo no sirve: el valor se
-- cambia desde la consola o llamando a la API directamente.)
--
-- QUE HACE ESTE ARCHIVO
--
-- Deja la escritura de usuarios como estaba, salvo por una cosa: para que una
-- fila quede con el rol SUPERADMIN, quien escribe tiene que ser SUPERADMIN.
--
-- Lo que NO cambia: un ADMINISTRADOR sigue creando vendedores, cambiando claves
-- y desactivando gente. Solo no puede fabricar superadmins.
--
-- Se corre una sola vez en el editor SQL de Supabase.
-- ---------------------------------------------------------------------------

create or replace function public.usuario_actual_es_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from usuarios u
    join roles r on r.id = u.rol_id
    where lower(trim(u.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      and u.activo = true
      and r.activo = true
      and upper(trim(r.nombre)) = 'SUPERADMIN'
  );
$$;

revoke all on function public.usuario_actual_es_superadmin() from public, anon;
grant execute on function public.usuario_actual_es_superadmin() to authenticated;

-- Es SUPERADMIN el rol al que apunta esta fila?
create or replace function public.rol_es_superadmin(rol_consultado uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from roles r
    where r.id = rol_consultado
      and upper(trim(r.nombre)) = 'SUPERADMIN'
  );
$$;

revoke all on function public.rol_es_superadmin(uuid) from public, anon;
grant execute on function public.rol_es_superadmin(uuid) to authenticated;

drop policy if exists "usuarios escritura configuracion" on usuarios;

create policy "usuarios escritura configuracion" on usuarios
for all to authenticated
using (
  public.usuario_tiene_permiso('configuracion')
  -- Para TOCAR una fila que hoy es SUPERADMIN tambien hay que serlo: si no,
  -- se le podria bajar el rol al dueño y quedarse con el sistema.
  and (not public.rol_es_superadmin(usuarios.rol_id) or public.usuario_actual_es_superadmin())
)
with check (
  public.usuario_tiene_permiso('configuracion')
  -- Y para DEJAR una fila como SUPERADMIN, idem.
  and (not public.rol_es_superadmin(usuarios.rol_id) or public.usuario_actual_es_superadmin())
);

-- ---------------------------------------------------------------------------
-- Como saber que quedo bien
-- ---------------------------------------------------------------------------
-- Tiene que aparecer la politica con las dos funciones nuevas adentro:
select polname,
       pg_get_expr(polqual, polrelid)      as condicion_lectura,
       pg_get_expr(polwithcheck, polrelid) as condicion_escritura
from pg_policy
where polrelid = 'public.usuarios'::regclass
  and polname = 'usuarios escritura configuracion';

-- Y esto, corrido con TU sesion, tiene que decir true si sos el dueño:
select public.usuario_actual_es_superadmin() as soy_superadmin;
