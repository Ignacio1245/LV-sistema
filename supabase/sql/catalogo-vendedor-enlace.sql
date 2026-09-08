-- Enlaces seguros: el vendedor autenticado genera una referencia opaca.
create table if not exists public.catalogo_enlaces_vendedor (
  token uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.vendedores(id),
  creado_en timestamptz not null default now(),
  revocado boolean not null default false
);
create unique index if not exists catalogo_enlace_activo_vendedor_idx
on public.catalogo_enlaces_vendedor(vendedor_id) where revocado = false;
alter table public.catalogo_enlaces_vendedor enable row level security;
revoke all on public.catalogo_enlaces_vendedor from public, anon, authenticated;

create or replace function public.crear_enlace_catalogo_vendedor(vendedor_codigo integer)
returns table(token uuid, vendedor_nombre text, whatsapp text)
language plpgsql security definer set search_path=public,auth as $$
declare
  vendedor_actual record;
  token_actual uuid;
begin
  if auth.jwt() ->> 'email' is null then raise exception 'Inicia sesion para compartir el catalogo.'; end if;
  select v.* into vendedor_actual from vendedores v
  where v.codigo=vendedor_codigo and v.activo=true
    and lower(trim(v.email))=lower(trim(auth.jwt() ->> 'email'));
  if not found then raise exception 'La cuenta no coincide con un vendedor activo.'; end if;
  if public.catalogo_normalizar_telefono(vendedor_actual.telefono) !~ '^[0-9]{8,15}$' then
    raise exception 'Carga un WhatsApp valido en la ficha del vendedor.';
  end if;
  select e.token into token_actual from catalogo_enlaces_vendedor e
    where e.vendedor_id=vendedor_actual.id and not e.revocado limit 1;
  if token_actual is null then
    insert into catalogo_enlaces_vendedor(vendedor_id) values(vendedor_actual.id) returning catalogo_enlaces_vendedor.token into token_actual;
  end if;
  return query select token_actual,vendedor_actual.nombre,public.catalogo_normalizar_telefono(vendedor_actual.telefono);
end;
$$;
revoke all on function public.crear_enlace_catalogo_vendedor(integer) from public,anon;
grant execute on function public.crear_enlace_catalogo_vendedor(integer) to authenticated;

create or replace function public.obtener_enlace_catalogo_vendedor(enlace_token uuid)
returns table(vendedor_nombre text, whatsapp text)
language sql stable security definer set search_path=public as $$
 select v.nombre,public.catalogo_normalizar_telefono(v.telefono)
 from catalogo_enlaces_vendedor e join vendedores v on v.id=e.vendedor_id
 where e.token=enlace_token and not e.revocado and v.activo=true;
$$;
revoke all on function public.obtener_enlace_catalogo_vendedor(uuid) from public;
grant execute on function public.obtener_enlace_catalogo_vendedor(uuid) to anon,authenticated;

create or replace function public.crear_pedido_catalogo_vendedor(pedido jsonb)
returns table(numero integer,total numeric,cliente_codigo integer)
language plpgsql security definer set search_path=public as $$
declare
 resultado record;
 enlace record;
 usuario_vendedor uuid;
 token_texto text:=nullif(trim(coalesce(pedido ->> 'vendedor_token','')),'');
begin
 if token_texto is not null then
   if token_texto !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'El enlace del vendedor no es valido.'; end if;
   select e.*,v.nombre,v.email into enlace from catalogo_enlaces_vendedor e
     join vendedores v on v.id=e.vendedor_id
     where e.token=token_texto::uuid and not e.revocado and v.activo=true;
   if not found then raise exception 'El enlace del vendedor vencio o fue desactivado.'; end if;
 end if;
 select * into resultado from public.crear_pedido_catalogo_publico(pedido);
 if token_texto is not null then
   select u.id into usuario_vendedor from usuarios u where u.activo=true and lower(trim(u.email))=lower(trim(enlace.email)) limit 1;
   update pedidos set vendedor=enlace.nombre,vendedor_id=usuario_vendedor
     where pedidos.numero=resultado.numero;
 end if;
 return query select resultado.numero,resultado.total,resultado.cliente_codigo;
end;
$$;
revoke all on function public.crear_pedido_catalogo_publico(jsonb) from anon,authenticated;
revoke all on function public.crear_pedido_catalogo_vendedor(jsonb) from public;
grant execute on function public.crear_pedido_catalogo_vendedor(jsonb) to anon,authenticated;
