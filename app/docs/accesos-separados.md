# Accesos separados del sistema

El sistema final debe quedar dividido en tres entradas, usando la misma base Supabase pero con pantallas y permisos distintos.

## 1. Panel administrativo

Entrada actual:

- `index.html`

Uso:

- Administracion general.
- Productos, stock, precios, compras y proveedores.
- Clientes, cuenta corriente, pedidos, auditoria e informes.
- Usuarios y roles.

Regla:

- Nunca mezclar pantallas publicas de clientes dentro del panel administrativo.
- Todo cambio sensible debe validar `tienePermiso(...)` en frontend y RLS en Supabase.

## 2. Link para vendedores moviles

Entrada creada:

- `vendedores.html`
- `js/mobile/vendedores-mobile.js`

Uso:

- Ver clientes asignados.
- Crear pedidos rapido.
- Buscar clientes.
- Buscar productos.
- Copiar el pedido o enviarlo por WhatsApp.
- Iniciar sesion con Supabase Auth cuando el sistema esta online.

Parametro util:

- `vendedores.html?wsp=5491123456789` deja cargado el WhatsApp de destino.

Permisos:

- Rol `VENDEDOR`.
- Lectura de productos activos y clientes asignados.
- Escritura de pedidos.
- Sin acceso a compras, proveedores, costos, auditoria ni configuracion.
- En frontend, si el usuario logueado es `VENDEDOR`, se filtra por `cliente.vendedorAsignado`.

Datos minimos:

- `clientes`
- `productos`
- `pedidos`
- `pedido_items`
- `listas_precios`

## 3. Link simple para clientes por WhatsApp

Entrada creada:

- `catalogo.html`
- `js/public/catalogo-whatsapp.js`

Uso:

- Catalogo muy simple.
- Buscar productos.
- Agregar cantidades.
- Boton final para mandar pedido por WhatsApp.
- Boton para copiar el pedido si el cliente no tiene WhatsApp configurado.

Parametro util:

- `catalogo.html?wsp=5491123456789` deja cargado el WhatsApp de destino.

Regla clave:

- No debe permitir editar base de datos.
- No necesita login administrativo.
- En Supabase lee por `obtener_catalogo_publico()`.
- Solo muestra productos con `mostrar_catalogo = true`, activos y con stock vendible.
- El pedido se envia por WhatsApp como texto; si luego se quiere guardar online, debe pasar por una funcion segura o revision interna.

Formato sugerido de mensaje:

```text
Hola, quiero hacer este pedido:
- Producto 1 x 2
- Producto 2 x 1

Nombre:
Direccion:
Comentario:
```

## Separacion de codigo

Para no romper el panel principal:

- Codigo compartido reutilizable:
  - `js/helpers.js`
  - `js/productos.js`
  - `js/database/supabase-mappers.js`
  - `js/database/supabase-repository.js`
- Codigo exclusivo del panel:
  - `js/app.js`
  - `js/productos-admin.js`
  - `js/config/usuarios.js`
- Codigo futuro exclusivo movil/publico:
  - `js/mobile/vendedores-mobile.js`
  - `js/public/catalogo-whatsapp.js`

## Orden recomendado

1. Terminar y verificar panel administrativo.
2. Activar RLS por roles en Supabase.
3. Probar `vendedores.html` con datos reales de clientes y productos.
4. Probar `catalogo.html` con productos activos, stock y `mostrar_catalogo`.
5. Cuando este estable, reemplazar el envio por WhatsApp por guardado seguro en Supabase si hace falta.
