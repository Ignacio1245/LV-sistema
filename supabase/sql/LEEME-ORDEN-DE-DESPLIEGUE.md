# Orden de despliegue

Los cuatro archivos nuevos son **idempotentes**: se pueden correr mas de una vez
sin duplicar datos ni romper nada. Se probaron sobre una base PostgreSQL 16
limpia, corriendo todo el esquema del proyecto de cero.

## 1. Primero el SQL, despues el frontend

El frontend nuevo funciona con el SQL viejo (cae al metodo anterior y deja un
aviso en la consola del navegador), pero conviene el orden natural:

```sql
-- en el editor SQL de Supabase, uno por uno y en este orden
catalogo-texto-seguro.sql
indices-rendimiento.sql
operaciones-atomicas.sql
historial-fuera-del-producto.sql
```

`historial-fuera-del-producto.sql` es el unico que mueve datos existentes.
Conviene sacar un backup antes (Supabase → Database → Backups), aunque no borra
nada: copia los JSONB a las tablas y despues recorta los arrays a los ultimos
100 movimientos.

## 2. Despues subir `app/`

Todos los `?v=` de index.html, catalogo.html, vendedores.html y css/styles.css
pasaron a `20260908-seguro1`. Eso obliga a los navegadores y a los celulares de
los vendedores a bajar la version nueva en vez de usar la cacheada. **Si mas
adelante tocas un .js o un .css, hay que volver a cambiar ese numero**, si no
los celulares siguen con el archivo viejo.

## 3. Como verificar que quedo bien

Despues de desplegar, en el panel:

- Entra a **Clientes** y a **Cuenta corriente**: si en algun lado aparece texto
  como `<button>` escrito a la vista, falta un `crudo()` en ese template.
  Avisame cual y lo corrijo.
- Abri **Productos → ver movimientos** de un producto con historial largo:
  tiene que mostrar el historial completo (lo trae de la tabla, no del
  producto).
- Atende y entrega un pedido de prueba: el saldo del cliente y el stock los
  calcula ahora Postgres.

## Que hace cada archivo

| Archivo | Que resuelve |
|---|---|
| `catalogo-texto-seguro.sql` | El catalogo publico rechaza nombres y direcciones con `<` o `>`. Segundo cerrojo del arreglo de XSS. |
| `indices-rendimiento.sql` | Los indices que faltaban. El mas importante es `pedido_items(producto_id)`: sin el, cada apertura del catalogo recorria la tabla entera de items una vez por producto. |
| `operaciones-atomicas.sql` | Saldo de cuenta corriente, stock e items de pedido calculados dentro de una transaccion con la fila bloqueada. Es el arreglo del problema multiusuario. |
| `historial-fuera-del-producto.sql` | Pasa el historial de los JSONB del producto a tablas propias y recorta los arrays de la fila. |

## Pendiente que dejo sin aplicar, a proposito

La tabla `usuarios` la puede leer entera cualquier usuario activo, incluido un
VENDEDOR: ve los emails y los roles de todos. Es una fuga de poca gravedad
(datos de gente que ya trabaja ahi) y ajustarla toca el camino de login, que no
puedo probar sin las credenciales reales. La politica mas ajustada seria:

```sql
drop policy if exists "usuarios lectura usuario activo" on usuarios;
create policy "usuarios lectura usuario activo" on usuarios
for select to authenticated using (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  or public.usuario_tiene_permiso('configuracion')
  or public.usuario_tiene_permiso('ventas')
);
```

Si la aplicas, proba entrar con un usuario VENDEDOR **antes** de dejarla puesta:
si el login falla, se vuelve atras con el `create policy` original que esta en
`rls-por-roles.sql`.
