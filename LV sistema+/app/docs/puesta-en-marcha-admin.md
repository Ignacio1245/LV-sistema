# Puesta en marcha del panel administrativo

Esta guia es para dejar funcionando primero el panel principal (`index.html`).

## 1. Probar en modo local

Mientras todavia no hay usuarios reales en Supabase:

- Email: `admin@local`
- Clave: `admin123`

Este acceso es solo inicial. Sirve para entrar al panel, revisar pantallas y configurar datos base.

## 2. Crear el administrador real en Supabase

La clave no se define en SQL. La clave se elige en Supabase Auth.

Pasos:

1. Entrar a Supabase.
2. Ir a `Authentication`.
3. Ir a `Users`.
4. Crear un usuario con `Add user`.
5. Usar el email real del administrador.
6. Elegir la contrasena ahi mismo.

Despues, en `supabase/sql/admin-inicial.sql`, reemplazar:

```sql
'CAMBIAR_EMAIL_ADMIN@empresa.com'
```

por el mismo email creado en Supabase Auth.

## 3. Ejecutar SQL basico

Si la base esta vacia, ejecutar en este orden:

```text
1. schema-inicial.sql
2. schema-ajustes-js.sql
3. integridad-produccion.sql
4. admin-inicial.sql
5. catalogo-publico.sql
6. rls-basico.sql
7. rls-escritura-autenticada.sql
```

Usar `rls-por-roles.sql` recien cuando ya puedas entrar al panel con el email real.

Si la base ya existia, `schema-ajustes-js.sql` es obligatorio: agrega columnas que usa el panel actual, por ejemplo `pedidos.estado_cobro` y `pedidos.fecha_entrega`.

## 4. Entrar al panel real

En `index.html`, iniciar sesion con:

- Email: el mismo creado en Supabase Auth y cargado en `admin-inicial.sql`.
- Clave: la que elegiste en Supabase Auth.

Si Supabase dice que el login existe pero el sistema no autoriza el email, revisar que el email de `usuarios.email` sea exactamente el mismo.

## 5. Antes de cargar datos reales

Desde el panel:

1. Ir a `Configuracion`.
2. Revisar empresa, WhatsApp, impresion y stock minimo.
3. Ir a `Respaldo`.
4. Descargar un respaldo inicial.

Despues cargar clientes, productos y pedidos.

## 6. Importar planillas

Las importaciones aceptan texto pegado o CSV con separador:

- punto y coma `;`
- tabulacion
- coma `,`

Si un campo tiene comas dentro, usar comillas:

```csv
codigo,nombre,direccion,zona
1001,"Cliente, Sucursal Centro","Calle 123, Local 2",Centro
```

Los importes pueden venir con formato argentino:

```text
1.500,50
```

El sistema lo interpreta como `1500.50`.

Regla importante:

- Si el codigo ya existe, la fila actualiza el registro.
- Si el codigo es nuevo, la fila crea el registro.
- Si el codigo es invalido o menor/igual a cero, la fila se cuenta como error.
