-- Limpia usuarios repetidos por email y evita que vuelva a pasar.
-- Conserva el usuario activo con codigo mas bajo.
-- Antes de borrar guarda una copia en usuarios_duplicados_respaldo.

create extension if not exists pgcrypto;

create table if not exists usuarios_duplicados_respaldo (
  respaldo_id uuid primary key default gen_random_uuid(),
  usuario_original_id uuid,
  codigo integer,
  nombre text,
  email text,
  rol_id uuid,
  activo boolean,
  creado_en timestamptz,
  respaldado_en timestamptz not null default now(),
  motivo text not null default 'email duplicado'
);

with usuarios_repetidos as (
  select
    id,
    row_number() over (
      partition by lower(trim(email))
      order by activo desc, codigo asc
    ) as fila
  from usuarios
  where trim(coalesce(email, '')) <> ''
),
usuarios_a_respaldar as (
  select usuarios.*
  from usuarios
  join usuarios_repetidos on usuarios_repetidos.id = usuarios.id
  where usuarios_repetidos.fila > 1
),
respaldo as (
  insert into usuarios_duplicados_respaldo (
    usuario_original_id,
    codigo,
    nombre,
    email,
    rol_id,
    activo,
    creado_en
  )
  select
    id,
    codigo,
    nombre,
    email,
    rol_id,
    activo,
    creado_en
  from usuarios_a_respaldar
  returning usuario_original_id
)
delete from usuarios
where id in (
  select usuario_original_id
  from respaldo
);

create unique index if not exists usuarios_email_unico_idx
on usuarios (lower(trim(email)))
where trim(coalesce(email, '')) <> '';
