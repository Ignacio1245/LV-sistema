# Estado de cierre - Administracion

Fecha de trabajo: 28/06/2026

## Etapas cerradas

1. Productos
   - Alta, edicion, filtros, importacion y precios revisados.
   - Corregido el menu interno que quedaba tapado por la barra superior.

2. Stock / Movimientos
   - Entradas, salidas y ajustes revisados.
   - Busqueda de productos mejorada para aceptar valores tipo `codigo - nombre`.
   - Compras y movimientos aceptan decimales solo cuando el producto es por peso/litros.

3. Clientes
   - Alta, edicion, baja segura, filtros, importacion y cuenta revisados.
   - Al editar un cliente usado en un pedido abierto, se actualiza la seleccion actual.

4. Pedidos
   - Guardado, atencion, entrega, cobro, cuenta corriente, reapertura y eliminacion revisados.
   - Se evita que un fallo deje bloqueado el guardado o la atencion.
   - Se bloquea eliminar pedidos atendidos o entregados para no romper stock/cuenta.

5. Cuenta corriente
   - Pagos, saldos a favor, notas de credito y devolucion de stock revisados.
   - Se puede cobrar a clientes inactivos si tienen saldo.

6. Auditoria
   - Se escapan textos antes de mostrarlos en tabla.
   - Limpiar auditoria exige permiso.

7. Importar / Exportar
   - Respaldo completo protegido por permiso de configuracion.
   - Restauracion exige archivo completo y confirmacion `RESTAURAR`.
   - Importaciones de clientes/productos aceptan `;`, tab y coma.

8. Datos falsos
   - Se agrego una prueba automatica en `tools/probar-datos-falsos.js`.

9. Seguridad final
   - Verificador ampliado con reglas de permisos, Supabase, respaldo, auditoria, pedidos, cuenta y busquedas.
   - `supabase/sql/rls-basico.sql` ahora se puede ejecutar mas de una vez porque borra politicas antes de crearlas.

## Comandos de prueba

Desde la carpeta `app`:

```bash
node tools/verificar-sistema.js
node tools/probar-datos-falsos.js
```

Resultado esperado:

```text
Sistema verificado OK
Prueba con datos falsos OK
```

## Login

Si todavia no cargaste emails reales en Usuarios:

```text
admin@local
admin123
```

Si ya cargaste un email real, el acceso local se desactiva a proposito. En ese caso se entra con el email y clave de Supabase Auth.

## Supabase

Para seguridad por roles, usar principalmente:

```text
supabase/sql/rls-por-roles.sql
```

Si aparece un error de politica repetida, volver a correr el archivo actualizado. Los SQL principales tienen `drop policy if exists` antes de crear politicas.
