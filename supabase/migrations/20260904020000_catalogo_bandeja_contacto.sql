-- Publica solo el telefono comercial y conserva el origen de los pedidos.
alter table public.pedidos add column if not exists origen text not null default 'administracion';

create or replace function public.marcar_origen_pedido_catalogo()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.observaciones @> '["Pedido desde catalogo publico"]'::jsonb then
    new.origen := 'catalogo';
  end if;
  return new;
end;
$$;
revoke all on function public.marcar_origen_pedido_catalogo() from public, anon, authenticated;
drop trigger if exists pedidos_origen_catalogo on public.pedidos;
create trigger pedidos_origen_catalogo before insert on public.pedidos
for each row execute function public.marcar_origen_pedido_catalogo();

update public.pedidos set origen = 'catalogo'
where origen <> 'catalogo' and observaciones @> '["Pedido desde catalogo publico"]'::jsonb;

create or replace function public.obtener_configuracion_catalogo_publico()
returns table (whatsapp text)
language sql stable security definer set search_path = public as $$
  select regexp_replace(coalesce(c.whatsapp, ''), '[^0-9]', '', 'g')
  from configuracion_empresa c order by c.actualizado_en desc, c.id limit 1;
$$;
revoke all on function public.obtener_configuracion_catalogo_publico() from public;
grant execute on function public.obtener_configuracion_catalogo_publico() to anon, authenticated;
