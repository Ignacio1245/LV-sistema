-- RESETEO TOTAL DE DATOS DEL NEGOCIO
-- Usar solo cuando quieras dejar la base operativa en cero antes de importar de nuevo.
-- Borra productos, precios/listas, clientes, pedidos, cobranzas, stock, compras,
-- proveedores, vendedores, rubros, zonas y auditoria.
--
-- IMPORTANTE: conserva roles, usuarios y configuracion_empresa para no perder
-- el ingreso al sistema ni los accesos ya creados.
-- Si alguna tabla todavia no existe, la saltea.

DO $$
DECLARE
  tablas_operativas text[] := array[
    'pagos_cliente',
    'movimientos_stock',
    'pedido_items',
    'pedidos',
    'producto_precios',
    'productos',
    'clientes',
    'compras',
    'proveedor_pagos',
    'vendedores',
    'proveedores',
    'rubros',
    'zonas',
    'listas_precios',
    'auditoria'
  ];
  tablas_existentes text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
  INTO tablas_existentes
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = ANY(tablas_operativas);

  IF tablas_existentes IS NULL THEN
    RAISE NOTICE 'No se encontraron tablas operativas para vaciar.';
    RETURN;
  END IF;

  EXECUTE 'TRUNCATE TABLE ' || tablas_existentes || ' RESTART IDENTITY CASCADE';
  RAISE NOTICE 'Datos operativos vaciados: %', tablas_existentes;
END $$;