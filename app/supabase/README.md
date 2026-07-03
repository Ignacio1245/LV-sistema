# Supabase

Carpetas:

- `sql`: esquemas, ajustes, politicas RLS y limpiezas puntuales.
- `functions`: funciones seguras para acciones que no deben vivir en el navegador.
- `scripts`: scripts locales para desplegar funciones.
- `docs`: notas de uso y pasos de configuracion.

Orden recomendado si arrancas una base de cero:

1. Ejecutar `sql/schema-inicial.sql`.
2. Ejecutar `sql/integridad-produccion.sql`.
3. Ejecutar `sql/rls-basico.sql`.
4. Ejecutar `sql/rls-escritura-autenticada.sql`.
5. Ejecutar `sql/admin-inicial.sql` cambiando el email del administrador.
6. Ejecutar `sql/catalogo-publico.sql` para habilitar lectura segura del catalogo de clientes.
7. Ejecutar `scripts/deploy-usuarios.bat` para desplegar funciones de usuarios.
8. Cuando usuarios y roles ya esten probados, ejecutar `sql/rls-por-roles.sql` para pasar de permisos amplios a permisos reales por rol.

Si ya tenias la base creada, ejecutar tambien:

- `sql/limpiar-usuarios-duplicados.sql`
- `sql/schema-ajustes-js.sql`
- `sql/integridad-produccion.sql`
- `sql/catalogo-publico.sql`

`sql/integridad-produccion.sql` agrega indices y restricciones `NOT VALID`: protege registros nuevos sin romper una base vieja que todavia pueda tener datos para limpiar.

`sql/schema-ajustes-js.sql` debe ejecutarse tambien sobre bases ya creadas. Mantiene la base alineada con el JavaScript actual; por ejemplo agrega `pedidos.estado_cobro` y `pedidos.fecha_entrega` para conservar la informacion de cobro y entrega al recargar desde Supabase.

`sql/rls-por-roles.sql` usa el email de Supabase Auth para buscar el usuario activo en `usuarios.email` y leer permisos desde `roles.permisos`. Antes de ejecutarlo, confirma que el administrador pueda iniciar sesion y que su email coincida exactamente con el usuario del sistema.

`sql/catalogo-publico.sql` crea la funcion `obtener_catalogo_publico()`. Esa funcion es la unica lectura publica pensada para clientes: devuelve productos activos, con stock y `mostrar_catalogo = true`, sin costos ni campos internos.
