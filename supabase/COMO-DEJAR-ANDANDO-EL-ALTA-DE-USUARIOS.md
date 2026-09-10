# Crear vendedores sin confirmación: cómo dejarlo andando

## No hay nada que cambiar en el sistema

Ya está hecho como lo querés. La función `crear-usuario-sistema` usa:

```ts
admin.createUser({ email, password, email_confirm: true })
```

`email_confirm: true` significa **el acceso nace confirmado**. No se manda ningún
mail, no hay que verificar nada en ningún lado. El admin pone la clave y el
vendedor entra con esa clave.

Y para cambiarla, el panel ya tiene el botón **Cambiar clave** en cada fila de
Configuración → Usuarios. Ese botón hace:

```ts
admin.updateUserById(id, { password, email_confirm: true })
```

O sea: cambia la clave **y de paso confirma el acceso**.

## El único problema

Esa función vive en tu repo pero **no está desplegada** en tu proyecto de
Supabase. Como el sistema no tiene otra forma de crear accesos, los usuarios
quedan a medias y el celular pide una confirmación que nunca puede llegar
(el email interno es `nombre@lv.local`, un dominio que no existe).

Se despliega **una sola vez** y no se toca nunca más.

## Opción A — desde la terminal (una línea)

En la carpeta del proyecto:

```
supabase functions deploy crear-usuario-sistema
supabase functions deploy eliminar-usuario-sistema
```

La segunda es para poder borrar accesos desde el panel; si no la desplegás,
crear y cambiar clave igual andan.

No hace falta configurar ninguna clave secreta: Supabase le pasa solo a las
funciones el `SUPABASE_URL`, el `SUPABASE_ANON_KEY` y el
`SUPABASE_SERVICE_ROLE_KEY`.

## Opción B — desde la web, sin instalar nada

1. Entrá a tu proyecto en supabase.com
2. **Edge Functions** → **Deploy a new function** → **Via editor**
3. Nombre: `crear-usuario-sistema` (tal cual, con guiones)
4. Borrá el código de ejemplo y pegá el contenido de
   `app/supabase/functions/crear-usuario-sistema/index.ts`
5. Deploy

Repetí con `eliminar-usuario-sistema` si querés poder borrar accesos.

## Después de desplegar

Los vendedores que ya cargaste y quedaron trabados **se arreglan desde el
panel**, sin tocar SQL:

> Configuración → Usuarios → botón **Cambiar clave** → poné una clave → Guardar

Eso les setea la clave y les confirma el acceso de una. El vendedor entra con
esa clave.

Los nuevos, directamente: Configuración → Usuarios → nombre, usuario, clave
provisoria, rol Vendedor → Agregar. Entra y listo.

## Cómo saber que quedó bien

Al entrar a Configuración → Usuarios, si la función no responde aparece una
franja roja avisando. Si no aparece nada, está desplegada y andando.

## Si algo no cierra

`app/supabase/sql/diagnostico-accesos.sql`, pegado en el editor SQL de Supabase,
te dice usuario por usuario qué le falta (sin acceso / sin confirmar / inactivo /
sin rol / OK). No cambia nada, solo informa.
