function mapearProductoDesdeSupabase(producto) {
  return {
    idSupabase: producto.id,
    codigo: Number(producto.codigo) || 0,
    codigoReal: producto.codigo_real || producto.codigoReal || "",
    nombre: producto.nombre || "Producto",
    precio: Number(producto.precio_base || producto.precio) || 0,
    precioCompra: Number(producto.precio_compra) || 0,
    stock: Number(producto.stock) || 0,
    stockMinimo: Number(producto.stock_minimo) || 0,
    rubro: producto.rubro || "Sin rubro",
    proveedor: producto.proveedor || "Sin proveedor",
    marca: producto.marca || "",
    tipo: producto.tipo || "",
    detalle: producto.detalle || "",
    unidad: producto.unidad || "",
    bonificacionVenta: Number(producto.bonificacion_venta) || 0,
    activo: producto.activo !== false,
    bajaAutomaticaStock: producto.baja_automatica_stock === true,
    imagenUrl: producto.imagen_url || "",
    mostrarCatalogo: producto.mostrar_catalogo === true,
    preciosLista: {},
    movimientosStock: [],
    historialPrecios: []
  };
}

function mapearProductoParaSupabase(producto) {
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
    marca: producto.marca || "",
    tipo: producto.tipo || "",
    detalle: producto.detalle || "",
    unidad: producto.unidad || "",
    bonificacion_venta: Number(producto.bonificacionVenta) || 0,
    activo: producto.activo !== false,
    baja_automatica_stock: producto.bajaAutomaticaStock === true,
    imagen_url: producto.imagenUrl || "",
    mostrar_catalogo: producto.mostrarCatalogo === true
  };
}

function mapearClienteDesdeSupabase(cliente) {
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
    estado: pedido.estado || "PENDIENTE",
    forma_pago: pedido.formaPago || "CUENTA_CORRIENTE",
    total: Number(pedido.total) || 0,
    pagado: Number(pedido.importePagado) || 0,
    saldo_generado: Number(pedido.saldoPendiente) || 0,
    fecha: convertirFechaPedidoParaSupabase(pedido.fecha),
    observaciones: Array.isArray(pedido.observaciones)
      ? pedido.observaciones
      : []
  };
}

function mapearPedidoItemParaSupabase(item, pedidoIdSupabase) {
  return {
    pedido_id: pedidoIdSupabase,
    producto_id: item.producto && item.producto.idSupabase
      ? item.producto.idSupabase
      : null,
    cantidad: Number(item.cantidad) || 0,
    lista_precio_id: null,
    precio_unitario: Number(item.precioUnitario || item.producto.precio) || 0,
    descuento_porcentaje: Number(item.descuentoPorcentaje) || 0,
    subtotal: Number(item.subtotal) || 0
  };
}

function mapearPedidoDesdeSupabase(pedido) {
  return {
    idSupabase: pedido.id,
    numero: Number(pedido.numero) || 0,
    id: Number(pedido.numero) || Date.now(),
    cliente: pedido.cliente || null,
    vendedor: pedido.vendedor || "Sin vendedor",
    zona: pedido.zona || "Sin zona",
    items: Array.isArray(pedido.items) ? pedido.items : [],
    formaPago: pedido.forma_pago || "CUENTA_CORRIENTE",
    observaciones: Array.isArray(pedido.observaciones) ? pedido.observaciones : [],
    total: Number(pedido.total) || 0,
    importePagado: Number(pedido.pagado) || 0,
    saldoPendiente: Number(pedido.saldo_generado) || 0,
    estado: pedido.estado || "PENDIENTE",
    fecha: pedido.fecha
      ? new Date(pedido.fecha).toLocaleDateString("es-AR")
      : "-"
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

  return {
    cliente_id: cliente && cliente.idSupabase ? cliente.idSupabase : null,
    pedido_id: movimiento.pedidoIdSupabase || null,
    importe: Math.abs(importeMovimiento),
    medio_pago: importeMovimiento < 0 ? "PAGO_CLIENTE" : "CUENTA_CORRIENTE",
    observacion: movimiento.tipo || "Movimiento de cuenta",
    fecha: convertirFechaMovimientoParaSupabase(movimiento.fecha)
  };
}

function mapearPagoDesdeSupabase(pago) {
  return {
    idSupabase: pago.id,
    clienteIdSupabase: pago.cliente_id || null,
    pedidoIdSupabase: pago.pedido_id || null,
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
  const rol =
    usuario.roles && usuario.roles.nombre
      ? usuario.roles.nombre
      : usuario.rol || "VENDEDOR";

  return {
    idSupabase: usuario.id,
    codigo: Number(usuario.codigo) || 0,
    nombre: usuario.nombre || "Usuario",
    rol: rol,
    rolIdSupabase: usuario.rol_id || null,
    activo: usuario.activo !== false
  };
}

function mapearUsuarioParaSupabase(usuario, rolIdSupabase) {
  return {
    codigo: Number(usuario.codigo) || 0,
    nombre: usuario.nombre || "Usuario",
    rol_id: rolIdSupabase || usuario.rolIdSupabase || null,
    activo: usuario.activo !== false
  };
}

function mapearConfiguracionDesdeSupabase(configuracion) {
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
  return {
    idSupabase: lista.id,
    codigo: Number(lista.codigo) || 0,
    nombre: lista.nombre || "Lista",
    activo: lista.activo !== false
  };
}

function mapearListaPrecioParaSupabase(lista) {
  return {
    codigo: Number(lista.codigo) || 0,
    nombre: lista.nombre || "Lista",
    activo: lista.activo !== false
  };
}
