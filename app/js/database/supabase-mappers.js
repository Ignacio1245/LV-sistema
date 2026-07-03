function mapearProductoDesdeSupabase(producto) {
  if (!producto || typeof producto !== "object") {
    return null;
  }

  const preciosLista =
    producto.precios_lista || {};
  const stockConfig =
    preciosLista && typeof preciosLista.__stockConfig === "object"
      ? preciosLista.__stockConfig
      : {};

  return {
    idSupabase: producto.id,
    codigo: Number(producto.codigo) || 0,
    codigoReal: producto.codigo_real || producto.codigoReal || "",
    nombre: producto.nombre || "Producto",
    precio: Number(producto.precio_base || producto.precio) || 0,
    precioCompra: Number(producto.precio_compra) || 0,
    stock: Number(producto.stock) || 0,
    stockMinimo: Number(producto.stock_minimo) || 0,
    tipoStock: stockConfig.tipoStock || "simple",
    unidadesPorBulto: Number(stockConfig.unidadesPorBulto) || 0,
    stockBultos: Number(stockConfig.stockBultos) || 0,
    stockUnidades: Number(stockConfig.stockUnidades) || 0,
    ventaSoloBulto: stockConfig.ventaSoloBulto === true,
    unidadPeso: stockConfig.unidadPeso || "kg",
    rubro: producto.rubro || "Sin rubro",
    proveedor: producto.proveedor || "Sin proveedor",
    marca: producto.marca || "",
    tipo: producto.tipo || "",
    detalle: producto.detalle || "",
    pack: Number(producto.pack) || 0,
    unidad: producto.unidad || "",
    iva: Number(producto.iva) || 0,
    proveedorAlternativo: producto.proveedor_alternativo || "",
    bonificacionVenta: Number(producto.bonificacion_venta) || 0,
    activo: producto.activo !== false,
    bajaAutomaticaStock: producto.baja_automatica_stock === true,
    imagenUrl: producto.imagen_url || "",
    mostrarCatalogo: producto.mostrar_catalogo === true,
    preciosLista: preciosLista,
    movimientosStock: Array.isArray(producto.movimientos_stock)
      ? producto.movimientos_stock
      : [],
    historialPrecios: Array.isArray(producto.historial_precios)
      ? producto.historial_precios
      : []
  };
}

function mapearProductoParaSupabase(producto) {
  const preciosLista =
    producto.preciosLista && typeof producto.preciosLista === "object"
      ? { ...producto.preciosLista }
      : {};

  preciosLista.__stockConfig = {
    tipoStock: producto.tipoStock || "simple",
    unidadesPorBulto: Number(producto.unidadesPorBulto) || 0,
    stockBultos: Number(producto.stockBultos) || 0,
    stockUnidades: Number(producto.stockUnidades) || 0,
    ventaSoloBulto: producto.ventaSoloBulto === true,
    unidadPeso: producto.unidadPeso || "kg"
  };

  return {
    codigo: Number(producto.codigo) || 0,
    codigo_real: producto.codigoReal || "",
    nombre: producto.nombre || "Producto",
    precio_base: Number(producto.precio) || 0,
    precio_compra: Number(producto.precioCompra) || 0,
    stock: Number(producto.stock) || 0,
    stock_minimo: Number(producto.stockMinimo) || 0,
    rubro: producto.rubro || "Sin rubro",
    proveedor: producto.proveedor || "Sin proveedor",
    proveedor_alternativo: producto.proveedorAlternativo || "",
    marca: producto.marca || "",
    tipo: producto.tipo || "",
    detalle: producto.detalle || "",
    pack: Number(producto.pack) || 0,
    unidad: producto.unidad || "",
    iva: Number(producto.iva) || 0,
    bonificacion_venta: Number(producto.bonificacionVenta) || 0,
    precios_lista: preciosLista,
    historial_precios: Array.isArray(producto.historialPrecios)
      ? producto.historialPrecios
      : [],
    movimientos_stock: Array.isArray(producto.movimientosStock)
      ? producto.movimientosStock
      : [],
    activo: producto.activo !== false,
    baja_automatica_stock: producto.bajaAutomaticaStock === true,
    imagen_url: producto.imagenUrl || "",
    mostrar_catalogo: producto.mostrarCatalogo === true
  };
}

function mapearClienteDesdeSupabase(cliente) {
  if (!cliente || typeof cliente !== "object") {
    return null;
  }

  return {
    idSupabase: cliente.id,
    codigo: Number(cliente.codigo) || 0,
    nombre: cliente.nombre || "Cliente",
    saldo: Number(cliente.saldo) || 0,
    telefono: cliente.telefono || "-",
    direccion: cliente.direccion || "-",
    zona: cliente.zona || "Sin zona",
    activo: cliente.activo !== false,
    historial: [],
    razonSocial: cliente.razon_social || "",
    nombreFantasia: cliente.nombre_fantasia || "",
    localidad: cliente.localidad || "",
    codigoPostal: cliente.codigo_postal || "",
    telefonoParticular: cliente.telefono_particular || "",
    telefonoMovil: cliente.telefono_movil || "",
    email: cliente.email || "",
    listaPrecios: cliente.lista_precios || "",
    posicionZona: Number(cliente.posicion_zona) || 0,
    vendedorAsignado: cliente.vendedor_asignado || "",
    condicionIva: cliente.condicion_iva || "",
    horarioAtencion: cliente.horario_atencion || "",
    observaciones: cliente.observaciones || ""
  };
}

function mapearClienteParaSupabase(cliente) {
  return {
    codigo: Number(cliente.codigo) || 0,
    nombre: cliente.nombre || "Cliente",
    saldo: Number(cliente.saldo) || 0,
    telefono: cliente.telefono || "-",
    direccion: cliente.direccion || "-",
    zona: cliente.zona || "Sin zona",
    activo: cliente.activo !== false,
    razon_social: cliente.razonSocial || "",
    nombre_fantasia: cliente.nombreFantasia || "",
    localidad: cliente.localidad || "",
    codigo_postal: cliente.codigoPostal || "",
    telefono_particular: cliente.telefonoParticular || "",
    telefono_movil: cliente.telefonoMovil || "",
    email: cliente.email || "",
    lista_precios: cliente.listaPrecios || "",
    posicion_zona: Number(cliente.posicionZona) || 0,
    vendedor_asignado: cliente.vendedorAsignado || "",
    condicion_iva: cliente.condicionIva || "",
    horario_atencion: cliente.horarioAtencion || "",
    observaciones: cliente.observaciones || ""
  };
}

function convertirFechaPedidoParaSupabase(fechaPedido) {
  if (!fechaPedido) {
    return new Date().toISOString();
  }

  if (fechaPedido.includes("/")) {
    const partes = fechaPedido.split("/");
    const dia = Number(partes[0]) || 1;
    const mes = (Number(partes[1]) || 1) - 1;
    const anio = Number(partes[2]) || new Date().getFullYear();

    return new Date(anio, mes, dia).toISOString();
  }

  return new Date(fechaPedido).toISOString();
}

function mapearPedidoParaSupabase(pedido) {
  return {
    numero: Number(pedido.numero || pedido.id) || 0,
    cliente_id: pedido.cliente && pedido.cliente.idSupabase
      ? pedido.cliente.idSupabase
      : null,
    vendedor_id: null,
    vendedor: pedido.vendedor || "Sin vendedor",
    zona: pedido.zona || (pedido.cliente ? pedido.cliente.zona : "") || "Sin zona",
    estado: pedido.estado || "PENDIENTE",
    forma_pago: pedido.formaPago || "CUENTA_CORRIENTE",
    estado_cobro: pedido.estadoCobro || "",
    total: Number(pedido.total) || 0,
    pagado: Number(pedido.importePagado) || 0,
    saldo_generado: Number(pedido.saldoPendiente) || 0,
    fecha: convertirFechaPedidoParaSupabase(pedido.fecha),
    fecha_entrega: pedido.fechaEntrega
      ? convertirFechaPedidoParaSupabase(pedido.fechaEntrega)
      : null,
    observaciones: Array.isArray(pedido.observaciones)
      ? pedido.observaciones
      : [],
    nota_credito: Array.isArray(pedido.notaCredito)
      ? pedido.notaCredito
      : []
  };
}

function mapearPedidoItemParaSupabase(item, pedidoIdSupabase) {
  const itemPedido =
    item && typeof item === "object" ? item : {};
  const productoItem =
    itemPedido.producto ? itemPedido.producto : {};

  return {
    pedido_id: pedidoIdSupabase,
    producto_id: productoItem.idSupabase
      ? productoItem.idSupabase
      : null,
    cantidad: Number(itemPedido.cantidad) || 0,
    lista_precio_id: null,
    lista_precio_nombre: itemPedido.listaPrecios || "Lista 1",
    precio_unitario: Number(itemPedido.precioUnitario || productoItem.precio) || 0,
    descuento_porcentaje: Number(itemPedido.descuentoPorcentaje) || 0,
    subtotal: Number(itemPedido.subtotal) || 0
  };
}

function mapearPedidoItemDesdeSupabase(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const producto =
    mapearProductoDesdeSupabase(item.productos || item.producto);

  if (!producto) {
    return null;
  }

  return {
    producto: producto,
    cantidad: Number(item.cantidad) || 0,
    listaPrecios: item.lista_precio_nombre || "Lista 1",
    precioUnitario: Number(item.precio_unitario) || 0,
    descuentoPorcentaje: Number(item.descuento_porcentaje) || 0,
    subtotal: Number(item.subtotal) || 0
  };
}

function mapearPedidoDesdeSupabase(pedido) {
  if (!pedido || typeof pedido !== "object") {
    return null;
  }

  const clientePedido =
    mapearClienteDesdeSupabase(pedido.clientes || pedido.cliente);

  const itemsPedido =
    Array.isArray(pedido.pedido_items)
      ? pedido.pedido_items
        .map(mapearPedidoItemDesdeSupabase)
        .filter(Boolean)
      : Array.isArray(pedido.items)
        ? pedido.items
        : [];

  const saldoPendiente =
    Number(pedido.saldo_generado) || 0;
  const importePagado =
    Number(pedido.pagado) || 0;

  return {
    idSupabase: pedido.id,
    numero: Number(pedido.numero) || 0,
    id: Number(pedido.numero) || Date.now(),
    cliente: clientePedido,
    vendedor: pedido.vendedor || "Sin vendedor",
    zona: clientePedido && clientePedido.zona
      ? clientePedido.zona
      : pedido.zona || "Sin zona",
    items: itemsPedido,
    formaPago: pedido.forma_pago || "CUENTA_CORRIENTE",
    observaciones: Array.isArray(pedido.observaciones) ? pedido.observaciones : [],
    notaCredito: Array.isArray(pedido.nota_credito) ? pedido.nota_credito : [],
    total: Number(pedido.total) || 0,
    importePagado: importePagado,
    saldoPendiente: saldoPendiente,
    estadoCobro: pedido.estado_cobro || (
      saldoPendiente > 0
        ? "CUENTA_CORRIENTE"
        : importePagado > 0
          ? "COBRADO"
          : ""
    ),
    estado: pedido.estado || "PENDIENTE",
    fecha: pedido.fecha
      ? new Date(pedido.fecha).toLocaleDateString("es-AR")
      : "-",
    fechaEntrega: pedido.fecha_entrega
      ? new Date(pedido.fecha_entrega).toLocaleDateString("es-AR")
      : undefined
  };
}

function convertirFechaMovimientoParaSupabase(fechaMovimiento) {
  if (!fechaMovimiento) {
    return new Date().toISOString();
  }

  return convertirFechaPedidoParaSupabase(fechaMovimiento);
}

function mapearMovimientoCuentaParaSupabase(cliente, movimiento) {
  const importeMovimiento =
    Number(movimiento.importe) || 0;
  const observacionMovimiento =
    movimiento.tipo || "Movimiento de cuenta";
  const esNotaCredito =
    normalizarTexto(observacionMovimiento).includes("nota de credito");

  return {
    cliente_id: cliente && cliente.idSupabase ? cliente.idSupabase : null,
    pedido_id: movimiento.pedidoIdSupabase || null,
    codigo_pago: Number(movimiento.codigoPago) || null,
    importe: Math.abs(importeMovimiento),
    medio_pago: esNotaCredito
      ? "NOTA_CREDITO"
      : importeMovimiento < 0
        ? "PAGO_CLIENTE"
        : "CUENTA_CORRIENTE",
    observacion: observacionMovimiento,
    fecha: convertirFechaMovimientoParaSupabase(movimiento.fecha)
  };
}

function mapearPagoDesdeSupabase(pago) {
  if (!pago || typeof pago !== "object") {
    return null;
  }

  return {
    idSupabase: pago.id,
    clienteIdSupabase: pago.cliente_id || null,
    pedidoIdSupabase: pago.pedido_id || null,
    codigoPago: Number(pago.codigo_pago) || 0,
    importe: Number(pago.importe) || 0,
    medioPago: pago.medio_pago || "EFECTIVO",
    observacion: pago.observacion || "",
    fecha: pago.fecha
      ? new Date(pago.fecha).toLocaleDateString("es-AR")
      : "-"
  };
}

function mapearAuditoriaParaSupabase(registro) {
  return {
    usuario_id: registro.usuarioIdSupabase || null,
    usuario_nombre: registro.usuario || "Sistema",
    usuario_rol: registro.rol || "-",
    modulo: registro.modulo || "Sistema",
    accion: registro.accion || "Accion",
    detalle: registro.detalle || "-",
    fecha: registro.fechaIso || new Date().toISOString()
  };
}

function mapearAuditoriaDesdeSupabase(registro) {
  if (!registro || typeof registro !== "object") {
    return null;
  }

  const fecha =
    registro.fecha ? new Date(registro.fecha) : new Date();

  return {
    idSupabase: registro.id,
    fecha: fecha.toLocaleDateString("es-AR"),
    hora: fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    usuario: registro.usuario_nombre || "Sistema",
    rol: registro.usuario_rol || "-",
    modulo: registro.modulo || "Sistema",
    accion: registro.accion || "Accion",
    detalle: registro.detalle || "-"
  };
}

function mapearRolDesdeSupabase(rol) {
  if (!rol || typeof rol !== "object") {
    return null;
  }

  return {
    idSupabase: rol.id,
    nombre: rol.nombre,
    permisos: rol.permisos || {},
    activo: rol.activo !== false
  };
}

function mapearRolParaSupabase(nombreRol, permisos) {
  return {
    nombre: nombreRol,
    permisos: permisos || {},
    activo: true
  };
}

function mapearUsuarioDesdeSupabase(usuario) {
  if (!usuario || typeof usuario !== "object") {
    return null;
  }

  const rol =
    usuario.roles && usuario.roles.nombre
      ? usuario.roles.nombre
      : usuario.rol || "VENDEDOR";

  return {
    idSupabase: usuario.id,
    codigo: Number(usuario.codigo) || 0,
    nombre: usuario.nombre || "Usuario",
    email: usuario.email || "",
    rol: rol,
    rolIdSupabase: usuario.rol_id || null,
    activo: usuario.activo !== false
  };
}

function mapearUsuarioParaSupabase(usuario, rolIdSupabase) {
  return {
    codigo: Number(usuario.codigo) || 0,
    nombre: usuario.nombre || "Usuario",
    email: usuario.email || "",
    rol_id: rolIdSupabase || usuario.rolIdSupabase || null,
    activo: usuario.activo !== false
  };
}

function mapearVendedorDesdeSupabase(vendedor) {
  if (!vendedor || typeof vendedor !== "object") {
    return null;
  }

  return {
    idSupabase: vendedor.id,
    codigo: Number(vendedor.codigo) || 0,
    nombre: vendedor.nombre || "Vendedor",
    telefono: vendedor.telefono || "-",
    email: vendedor.email || "",
    zona: vendedor.zona || "",
    tipo: vendedor.tipo || "Calle",
    activo: vendedor.activo !== false
  };
}

function mapearVendedorParaSupabase(vendedor) {
  return {
    codigo: Number(vendedor.codigo) || 0,
    nombre: vendedor.nombre || "Vendedor",
    telefono: vendedor.telefono || "-",
    email: vendedor.email || "",
    zona: vendedor.zona || "",
    tipo: vendedor.tipo || "Calle",
    activo: vendedor.activo !== false
  };
}

function mapearConfiguracionDesdeSupabase(configuracion) {
  if (!configuracion || typeof configuracion !== "object") {
    return null;
  }

  return {
    idSupabase: configuracion.id,
    empresa: configuracion.empresa || "",
    cuit: configuracion.cuit || "",
    direccion: configuracion.direccion || "",
    whatsapp: configuracion.whatsapp || "",
    alias: configuracion.alias || "",
    cbu: configuracion.cbu || "",
    impresionTitulo: configuracion.impresion_titulo || "LV Sistema",
    impresionSubtitulo: configuracion.impresion_subtitulo || "Distribuidora",
    impresionPie: configuracion.impresion_pie || "Gracias por su compra.",
    impresionMostrarQr: configuracion.impresion_mostrar_qr !== false,
    impresionQrTexto: configuracion.impresion_qr_texto || "",
    stockMinimo: Number(configuracion.stock_minimo) || 10,
    permitirStockNegativo: configuracion.permitir_stock_negativo === true
  };
}

function mapearConfiguracionParaSupabase(configuracion) {
  return {
    empresa: configuracion.empresa || "",
    cuit: configuracion.cuit || "",
    direccion: configuracion.direccion || "",
    whatsapp: configuracion.whatsapp || "",
    alias: configuracion.alias || "",
    cbu: configuracion.cbu || "",
    impresion_titulo: configuracion.impresionTitulo || "LV Sistema",
    impresion_subtitulo: configuracion.impresionSubtitulo || "Distribuidora",
    impresion_pie: configuracion.impresionPie || "",
    impresion_mostrar_qr: configuracion.impresionMostrarQr !== false,
    impresion_qr_texto: configuracion.impresionQrTexto || "",
    stock_minimo: Number(configuracion.stockMinimo) || 10,
    permitir_stock_negativo: configuracion.permitirStockNegativo === true,
    actualizado_en: new Date().toISOString()
  };
}

function mapearEntidadBaseDesdeSupabase(entidad) {
  if (!entidad || typeof entidad !== "object") {
    return null;
  }

  return {
    idSupabase: entidad.id,
    codigo: Number(entidad.codigo) || 0,
    nombre: entidad.nombre || "Sin nombre",
    descripcion: entidad.descripcion || entidad.observacion || "-",
    telefono: entidad.telefono || "-",
    contacto: entidad.contacto || "-",
    observacion: entidad.observacion || entidad.descripcion || "-",
    activo: entidad.activo !== false
  };
}

function mapearZonaParaSupabase(zona) {
  return {
    codigo: Number(zona.codigo) || 0,
    nombre: zona.nombre || "Zona",
    descripcion: zona.descripcion || "-",
    activo: zona.activo !== false
  };
}

function mapearRubroParaSupabase(rubro) {
  return {
    codigo: Number(rubro.codigo) || 0,
    nombre: rubro.nombre || "Rubro",
    descripcion: rubro.descripcion || "-",
    activo: rubro.activo !== false
  };
}

function mapearProveedorParaSupabase(proveedor) {
  return {
    codigo: Number(proveedor.codigo) || 0,
    nombre: proveedor.nombre || "Proveedor",
    telefono: proveedor.telefono || "-",
    contacto: proveedor.contacto || "-",
    observacion: proveedor.observacion || "-",
    activo: proveedor.activo !== false
  };
}

function mapearListaPrecioDesdeSupabase(lista) {
  if (!lista || typeof lista !== "object") {
    return null;
  }

  return {
    idSupabase: lista.id,
    codigo: Number(lista.codigo) || 0,
    nombre: lista.nombre || "Lista",
    porcentaje: obtenerPorcentajePredeterminadoListaPrecio(lista.nombre, lista.porcentaje),
    activo: lista.activo !== false
  };
}

function mapearListaPrecioParaSupabase(lista) {
  return {
    codigo: Number(lista.codigo) || 0,
    nombre: lista.nombre || "Lista",
    porcentaje: Number(lista.porcentaje) || 0,
    activo: lista.activo !== false
  };
}

function mapearProveedorPagoDesdeSupabase(pago) {
  if (!pago || typeof pago !== "object") {
    return null;
  }

  return {
    idSupabase: pago.id,
    codigo: Number(pago.codigo) || 0,
    proveedor: pago.proveedor || "Sin proveedor",
    importe: Number(pago.importe) || 0,
    medio: pago.medio || "EFECTIVO",
    comprobante: pago.comprobante || "-",
    observacion: pago.observacion || "-",
    fecha: pago.fecha
      ? new Date(pago.fecha).toLocaleDateString("es-AR")
      : "-",
    fechaIso: pago.fecha || new Date().toISOString()
  };
}

function mapearProveedorPagoParaSupabase(pago) {
  return {
    codigo: Number(pago.codigo) || 0,
    proveedor: pago.proveedor || "Sin proveedor",
    importe: Number(pago.importe) || 0,
    medio: pago.medio || "EFECTIVO",
    comprobante: pago.comprobante || "-",
    observacion: pago.observacion || "-",
    fecha: pago.fechaIso || new Date().toISOString()
  };
}

function mapearCompraDesdeSupabase(compra) {
  if (!compra || typeof compra !== "object") {
    return null;
  }

  return {
    idSupabase: compra.id,
    id: Number(compra.codigo) || Date.now(),
    fecha: compra.fecha
      ? new Date(compra.fecha).toLocaleDateString("es-AR")
      : "-",
    fechaIso: compra.fecha || new Date().toISOString(),
    proveedor: compra.proveedor || "Sin proveedor",
    productoCodigo: Number(compra.producto_codigo) || 0,
    productoNombre: compra.producto_nombre || "Producto",
    cantidad: Number(compra.cantidad) || 0,
    costoUnitario: Number(compra.costo_unitario) || 0,
    total: Number(compra.total) || 0,
    comprobante: compra.comprobante || "-",
    costoAnterior: Number(compra.costo_anterior) || 0,
    preciosActualizados: Number(compra.precios_actualizados) || 0
  };
}

function mapearCompraParaSupabase(compra) {
  const codigoCompra =
    Number(compra.id || compra.codigo) || Date.now();

  return {
    codigo: codigoCompra,
    proveedor: compra.proveedor || "Sin proveedor",
    producto_codigo: Number(compra.productoCodigo) || 0,
    producto_nombre: compra.productoNombre || "Producto",
    cantidad: Number(compra.cantidad) || 0,
    costo_unitario: Number(compra.costoUnitario) || 0,
    total: Number(compra.total) || 0,
    comprobante: compra.comprobante || "-",
    costo_anterior: Number(compra.costoAnterior) || 0,
    precios_actualizados: Number(compra.preciosActualizados) || 0,
    fecha: compra.fechaIso || new Date().toISOString()
  };
}
