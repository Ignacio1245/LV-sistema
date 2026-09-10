-- Por que un usuario no puede entrar.
--
-- Para entrar al sistema hacen falta DOS cosas, y es facil que quede solo una:
--
--   1. Un acceso en Supabase Auth (auth.users), con el email confirmado.
--   2. Una fila en public.usuarios, activa, con rol, y con el MISMO email.
--
-- El mensaje "Tu acceso existe pero no esta confirmado" que aparece en el
-- celular es el caso 1 a medias: el acceso existe pero le falta la
-- confirmacion. Pasa cuando el usuario se creo desde el panel de Supabase (que
-- manda un mail de confirmacion a un dominio como @lv.local, que no existe, asi
-- que ese mail no llega nunca) en vez de crearse desde la pantalla de Usuarios
-- del sistema, que usa la funcion segura y lo deja confirmado de una.
--
-- Se corre en el editor SQL de Supabase. La primera consulta no cambia nada:
-- solo dice que le pasa a cada uno.

-- ---------------------------------------------------------------------------
-- 1) DIAGNOSTICO: que le falta a cada usuario
-- ---------------------------------------------------------------------------
select
  coalesce(u.codigo::text, '-')                        as codigo,
  coalesce(u.nombre, '(no esta en Usuarios)')          as nombre,
  coalesce(u.email, a.email)                           as email,
  coalesce(r.nombre, '(sin rol)')                      as rol,
  case
    when a.id is null then
      'NO PUEDE ENTRAR: no tiene acceso en Supabase Auth. Crealo desde Usuarios del sistema con una clave provisoria.'
    when a.email_confirmed_at is null then
      'NO PUEDE ENTRAR: el acceso existe pero no esta confirmado. Lo arregla el paso 2 de este archivo.'
    when a.banned_until is not null and a.banned_until > now() then
      'NO PUEDE ENTRAR: el acceso esta bloqueado en Supabase hasta ' || a.banned_until
    when u.id is null then
      'NO PUEDE ENTRAR: tiene acceso pero no figura en Usuarios del sistema. Agregalo desde la pantalla de Usuarios con ese mismo email.'
    when u.activo is not true then
      'NO PUEDE ENTRAR: esta INACTIVO en Usuarios. Activalo desde la pantalla de Usuarios.'
    when u.rol_id is null or r.id is null then
      'NO PUEDE ENTRAR: no tiene rol asignado. Asignale uno desde Usuarios.'
    when r.activo is not true then
      'NO PUEDE ENTRAR: su rol (' || r.nombre || ') esta desactivado.'
    else
      'OK: puede entrar.'
  end                                                  as diagnostico
from public.usuarios u
full outer join auth.users a
  on lower(trim(a.email)) = lower(trim(u.email))
left join public.roles r
  on r.id = u.rol_id
order by
  case when a.id is null or a.email_confirmed_at is null or u.id is null
         or u.activo is not true or u.rol_id is null then 0 else 1 end,
  coalesce(u.codigo, 999999);

-- ---------------------------------------------------------------------------
-- 2) REPARACION: confirmar los accesos que quedaron sin confirmar
-- ---------------------------------------------------------------------------
-- Solo toca los que ya existen como usuario del sistema, para no confirmar de
-- paso alguna cuenta suelta que no tenga nada que ver.
--
-- Descomentar y ejecutar:
--
-- update auth.users a
-- set email_confirmed_at = now()
-- where a.email_confirmed_at is null
--   and exists (
--     select 1 from public.usuarios u
--     where lower(trim(u.email)) = lower(trim(a.email))
--       and u.activo = true
--   );

-- ---------------------------------------------------------------------------
-- 3) Emails que quedaron escritos distinto en cada lado
-- ---------------------------------------------------------------------------
-- El sistema arma el email interno como usuario@lv.local. Si en Supabase Auth
-- quedo uno con un punto de mas o de menos, los dos existen pero no se cruzan
-- nunca. Esta consulta muestra los pares sospechosos comparando el email sin
-- puntos ni simbolos.
select
  u.codigo,
  u.nombre,
  u.email                        as email_en_usuarios,
  a.email                        as email_en_supabase_auth,
  'Escriben el mismo usuario de forma distinta. Dejalos iguales: lo mas simple es corregir el email en la pantalla de Usuarios y volver a guardar con una clave provisoria.' as que_hacer
from public.usuarios u
join auth.users a
  on regexp_replace(lower(trim(a.email)), '[^a-z0-9@]', '', 'g')
   = regexp_replace(lower(trim(u.email)), '[^a-z0-9@]', '', 'g')
where lower(trim(a.email)) <> lower(trim(u.email));

-- ---------------------------------------------------------------------------
-- 4) Resumen
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.usuarios where activo = true)                    as usuarios_activos,
  (select count(*) from auth.users)                                             as accesos_en_supabase,
  (select count(*) from auth.users where email_confirmed_at is null)            as accesos_sin_confirmar,
  (select count(*) from public.usuarios u where u.activo = true
     and not exists (select 1 from auth.users a
                     where lower(trim(a.email)) = lower(trim(u.email))))        as activos_sin_acceso;
