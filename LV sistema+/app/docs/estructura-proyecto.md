# Estructura del proyecto

Esta app esta separada por responsabilidad. La regla es simple: cada archivo tiene que tener un motivo claro.

## Archivos principales

- `index.html`: estructura visual de todas las pantallas.
- `css/styles.css`: estilos generales de la app.
- `js/app.js`: conecta botones, formularios, navegacion y render inicial.
- `js/data.js`: datos iniciales para trabajar sin base online.
- `js/helpers.js`: funciones generales como formato de dinero y busquedas.

## Datos

- `js/data-store.js`: puerta de entrada para leer y guardar datos. Queda como memoria temporal hasta conectar cada modulo a Supabase.
- `js/storage.js`: carga y normaliza los datos internos de la app.
- `js/supabase-config.js`: configuracion del cliente Supabase.
- `js/supabase-data.js`: consultas a Supabase.
- `js/database/supabase-mappers.js`: convierte datos de Supabase al formato que usa la app y al reves.
- `js/database/supabase-repository.js`: funciones concretas para leer y guardar tablas de Supabase.

## Modulos de negocio

- `js/clientes.js`: clientes, alta, importacion, estado y cuenta del cliente.
- `js/productos.js`: reglas base de producto, stock, listas de precios y disponibilidad.
- `js/productos-admin.js`: administracion de productos, precios, movimientos y stock.
- `js/pedido.js`: pedidos, estados, totales, entrega y cuenta corriente.
- `js/compras.js`: compras a proveedores y entrada de stock.
- `js/proveedores.js`: proveedores.
- `js/rubros.js`: rubros.
- `js/zonas.js`: zonas.
- `js/movimientos.js`: movimientos generales.
- `js/auditoria.js`: registro de acciones.
- `js/informes.js`: informes mensuales, vendedores, zonas, clientes y ganancias estimadas.

## Configuracion

- `js/config/configuracion.js`: datos de empresa e impresion.
- `js/config/permisos.js`: permisos por modulo.
- `js/config/usuarios.js`: usuarios y roles.

## Pedido

- `js/pedido/habituales.js`: productos habituales del cliente.
- `js/pedido/observaciones.js`: observaciones del pedido.
- `js/pedido/impresion.js`: comprobantes e impresion.

## Supabase

- `supabase/schema-inicial.sql`: propuesta de tablas para la base online.
- `docs/plan-supabase.md`: orden recomendado de migracion.

## Regla para seguir agregando cosas

Si una funcion toca datos, primero pensar si va en:

1. `data-store.js`: leer/guardar datos.
2. `supabase-data.js`: consultar Supabase.
3. `supabase-mappers.js`: convertir formatos.
4. El modulo correspondiente: clientes, productos, pedidos, cuenta, informes.

## Orden correcto para Supabase

Cuando una pantalla necesita datos online, el camino deberia ser:

1. La pantalla pide datos a una funcion clara, por ejemplo `cargarProductosDesdeSupabase`.
2. Esa funcion llama al repositorio, por ejemplo `obtenerProductosSupabase`.
3. El repositorio consulta la tabla.
4. El mapper convierte los datos al formato interno.
5. La pantalla renderiza.

Ese orden evita mezclar consultas SQL, renderizado y reglas de negocio en el mismo archivo.

## Documentos importantes

- `docs/guia-codigo-legible.md`: reglas para mantener variables y funciones faciles de entender.
- `docs/accesos-separados.md`: separacion futura entre panel administrativo, vendedores moviles y catalogo WhatsApp.
- `docs/puesta-en-marcha-admin.md`: pasos para entrar primero al panel principal con Supabase y usuario administrador real.
