# Usuarios con Supabase Auth

Esta app no debe guardar la clave secreta de Supabase en el navegador.
Por eso el alta y la baja real de accesos se hace con Edge Functions seguras:

`supabase/functions/crear-usuario-sistema/index.ts`
`supabase/functions/eliminar-usuario-sistema/index.ts`

## Que hace

- Recibe email y contrasena provisoria.
- Verifica que quien esta logueado sea usuario activo del sistema.
- Verifica que su rol tenga permiso `configuracion`.
- Crea el usuario en Supabase Auth con email confirmado.
- Elimina el acceso de Auth cuando borras un usuario desde el sistema.
- No manda email de confirmacion, por eso evita el limite de emails.

## Activacion rapida

Abrir:

`supabase/scripts/deploy-usuarios.bat`

Ese script pide:

- Supabase Access Token.
- `service_role` / Secret key.

Despues vincula el proyecto, guarda el secreto seguro y despliega las funciones.

## Pasos manuales en Supabase

1. Instalar o abrir Supabase CLI.
2. Iniciar sesion:

```bash
supabase login
```

3. Vincular el proyecto:

```bash
supabase link --project-ref aofoacncvivxxwnusboi
```

4. Guardar la clave secreta `service_role` como secret de funciones:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=PEGAR_SERVICE_ROLE_KEY
```

La `service_role key` esta en Supabase:

`Project Settings > API > Project API keys > service_role`

5. Desplegar las funciones:

```bash
supabase functions deploy crear-usuario-sistema
supabase functions deploy eliminar-usuario-sistema
```

Despues de eso, crear y eliminar usuarios desde la pantalla de configuracion tambien crea o elimina el acceso de login.
