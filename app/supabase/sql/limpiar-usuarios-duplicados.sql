-- Limpia usuarios repetidos por email y evita que vuelva a pasar.
-- Conserva el usuario activo con codigo mas bajo.

with usuarios_repetidos as (
  select
    id,
    row_number() over (
      partition by lower(trim(email))
      order by activo desc, codigo asc
    ) as fila
  from usuarios
  where trim(coalesce(email, '')) <> ''
)
delete from usuarios
where id in (
  select id
  from usuarios_repetidos
  where fila > 1
);

create unique index if not exists usuarios_email_unico_idx
on usuarios (lower(trim(email)))
where trim(coalesce(email, '')) <> '';
