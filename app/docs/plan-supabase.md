# Plan de orden para Supabase

Este sistema todavia puede funcionar local, pero la base online tiene que entrar por etapas para no romper pedidos, stock ni cuenta corriente.

## 1. Sistema interno primero

Antes de depender de Supabase, dejar cerrados estos flujos:

- Productos activos/inactivos, stock minimo, movimientos y precios por lista.
- Clientes activos/inactivos, zona, vendedor asignado, lista de precios y saldo.
- Pedidos con estados: borrador, pendiente, atendido, entregado, cobrado o cuenta corriente.
- Cuenta corriente con pagos, deuda, historial y comprobante.
- Auditoria para saber quien hizo cada cambio.

## 2. Tablas principales

Tablas base recomendadas:

- `usuarios`
- `roles`
- `clientes`
- `zonas`
- `rubros`
- `proveedores`
- `listas_precios`
- `productos`
- `producto_precios`
- `pedidos`
- `pedido_items`
- `pagos_cliente`
- `movimientos_stock`
- `auditoria`
- `configuracion_empresa`

## 3. Orden de migracion

1. Subir datos base: zonas, rubros, proveedores, listas de precios.
2. Subir productos y precios.
3. Subir clientes.
4. Subir pedidos nuevos.
5. Subir movimientos de stock.
6. Subir cuenta corriente.
7. Activar auditoria online.

## 4. Regla importante

El frontend no deberia escribir directo en muchas tablas sin control. Para operaciones sensibles conviene una funcion central:

- Atender pedido: descuenta stock, registra movimiento y cambia estado.
- Entregar pedido: registra pago o saldo en cuenta corriente.
- Registrar pago: baja saldo y deja historial.
- Ajustar stock: modifica producto, deja movimiento y auditoria.

Auditoria es informacion sensible de la empresa. La tabla y el repositorio pueden quedar preparados, pero el envio automatico a Supabase se activa solo cuando confirmemos:

- Que la tabla `auditoria` existe.
- Que las politicas RLS estan correctas.
- Que el usuario acepta guardar acciones, usuario, rol, modulo, accion, detalle y fecha en Supabase.

## 5. Sincronizacion inicial

La app tiene sincronizacion automatica preparada. Al iniciar intenta cargar desde Supabase y luego programa subida de los modulos principales.

Tambien existen funciones manuales por si hay que forzar una etapa:

- `sincronizarDatosBaseLocalesConSupabase()`
- `sincronizarProductosLocalesConSupabase()`
- `sincronizarClientesLocalesConSupabase()`
- `sincronizarPedidosLocalesConSupabase()`
- `sincronizarCuentaCorrienteLocalConSupabase()`

Usarlas solo despues de confirmar:

- Que las tablas existen.
- Que las columnas coinciden.
- Que las politicas RLS permiten la operacion correcta.
- Que no se esta duplicando informacion vieja.

Orden recomendado:

1. Sincronizar datos base: zonas, rubros, proveedores y listas de precios.
2. Sincronizar clientes.
3. Sincronizar productos.
4. Sincronizar pedidos.
5. Sincronizar cuenta corriente.

Pedidos depende de clientes y productos. Si los pedidos se suben antes, van a quedar sin relaciones completas.
Cuenta corriente depende de clientes. Si se sube antes, los movimientos quedan sin cliente seguro.

Importante: la sincronizacion de cuenta corriente inserta movimientos. No correrla dos veces sobre los mismos datos hasta agregar una marca de sincronizado o un identificador unico por movimiento.

El repositorio evita duplicar movimientos de cuenta cuando coinciden cliente, importe, medio de pago, observacion y fecha.

## 6. Links separados

Cuando la base online este estable:

- Panel administrador: escritorio completo.
- Link vendedores: clientes, pedido rapido, historial y pendientes.
- Link catalogo WhatsApp: productos visibles, busqueda y boton para consultar/pedir.
