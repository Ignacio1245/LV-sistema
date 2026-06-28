# Guia de codigo legible

Este sistema tiene que poder mantenerse sin depender de memoria tecnica rara. La regla principal es usar nombres claros en castellano.

## Reglas

- Usar variables descriptivas: `clienteSeleccionado`, `pedidoEntregaPendiente`, `productosFiltrados`.
- Evitar abreviaturas oscuras como `cli`, `prod`, `tmp`, `x`, salvo indices muy chicos.
- Separar responsabilidades:
  - Pantalla y eventos: `app.js` y modulos de negocio.
  - Datos locales: `storage.js` y `data-store.js`.
  - Supabase: `supabase-data.js`, `supabase-repository.js`, `supabase-mappers.js`.
  - Reglas de permisos: `config/permisos.js` y `config/usuarios.js`.
- Las funciones que modifican datos deben revisar permisos con `tienePermiso(...)`.
- Si una funcion toca Supabase, su nombre debe decirlo: `guardarClienteSupabase`, `guardarPedidoOperacionSupabase`.
- Si una funcion convierte formatos, debe vivir en `supabase-mappers.js`.

## Nombres recomendados

- `cliente`, `clientesFiltrados`, `clienteEditando`.
- `producto`, `productosSinStock`, `productoSeleccionado`.
- `pedido`, `pedidoActual`, `pedidoEntregaPendiente`.
- `usuario`, `usuarioActual`, `usuariosSistema`.
- `saldoAnterior`, `saldoPosterior`, `importePagado`.
- `stockAnterior`, `stockFinal`, `cantidadMovimiento`.

## Antes de terminar un cambio

Ejecutar:

```powershell
node tools\verificar-sistema.js
```

Ese verificador revisa sintaxis, referencias HTML, permisos en funciones sensibles, columnas Supabase, datos iniciales, RLS y retornos criticos.
