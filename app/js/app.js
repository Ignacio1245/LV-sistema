const dom = {
  /*menu*/
  pageTitle: document.querySelector("#pageTitle"),
  currentUserBadge: document.querySelector("#currentUserBadge"),
  sidebarToggleButton: document.querySelector("#sidebarToggleButton"),
  menuLinks: document.querySelectorAll(".menu a[data-page]"),
  dashboardPage: document.querySelector("#dashboardPage"),
  ventasPage: document.querySelector("#ventasPage"),
  clientesPage: document.querySelector("#clientesPage"),
  zonasPage: document.querySelector("#zonasPage"),
  proveedoresPage: document.querySelector("#proveedoresPage"),
  productosPage: document.querySelector("#productosPage"),
  cuentaPage: document.querySelector("#cuentaPage"),
  comprasPage: document.querySelector("#comprasPage"),
  movimientosPage: document.querySelector("#movimientosPage"),
  auditoriaPage: document.querySelector("#auditoriaPage"),
  informesPage: document.querySelector("#informesPage"),

  /*configuracion*/
  configuracionPage: document.querySelector("#configuracionPage"),
  configForm: document.querySelector("#configForm"),
  empresaInput: document.querySelector("#empresaInput"),
  cuitInput: document.querySelector("#cuitInput"),
  whatsappInput: document.querySelector("#whatsappInput"),
  aliasInput: document.querySelector("#aliasInput"),
  stockMinimoInput: document.querySelector("#stockMinimoInput"),
  usuarioForm: document.querySelector("#usuarioForm"),
  usuarioNombreInput: document.querySelector("#usuarioNombreInput"),
  usuarioNuevoRolInput: document.querySelector("#usuarioNuevoRolInput"),
  usuariosSistemaTable: document.querySelector("#usuariosSistemaTable"),
  usuarioRolInput: document.querySelector("#usuarioRolInput"),
  zonaForm: document.querySelector("#zonaForm"),
  zonaNombreInput: document.querySelector("#zonaNombreInput"),
  zonaDescripcionInput: document.querySelector("#zonaDescripcionInput"),
  buscarZonaInput: document.querySelector("#buscarZonaInput"),
  zonasTable: document.querySelector("#zonasTable"),
  zonasActivasResumen: document.querySelector("#zonasActivasResumen"),
  zonasClientesResumen: document.querySelector("#zonasClientesResumen"),
  zonasSinAsignarResumen: document.querySelector("#zonasSinAsignarResumen"),
  zonasActivasLista: document.querySelector("#zonasActivasLista"),
  proveedorForm: document.querySelector("#proveedorForm"),
  proveedorNombreInput: document.querySelector("#proveedorNombreInput"),
  proveedorTelefonoInput: document.querySelector("#proveedorTelefonoInput"),
  proveedorContactoInput: document.querySelector("#proveedorContactoInput"),
  proveedorObservacionInput: document.querySelector("#proveedorObservacionInput"),
  buscarProveedorInput: document.querySelector("#buscarProveedorInput"),
  proveedoresTable: document.querySelector("#proveedoresTable"),
  proveedoresActivosResumen: document.querySelector("#proveedoresActivosResumen"),
  proveedoresProductosResumen: document.querySelector("#proveedoresProductosResumen"),
  proveedoresSinAsignarResumen: document.querySelector("#proveedoresSinAsignarResumen"),
  proveedoresActivosLista: document.querySelector("#proveedoresActivosLista"),
  compraForm: document.querySelector("#compraForm"),
  compraProveedorInput: document.querySelector("#compraProveedorInput"),
  compraProductoInput: document.querySelector("#compraProductoInput"),
  compraCantidadInput: document.querySelector("#compraCantidadInput"),
  compraCostoInput: document.querySelector("#compraCostoInput"),
  compraComprobanteInput: document.querySelector("#compraComprobanteInput"),
  compraPreview: document.querySelector("#compraPreview"),
  productosCompraLista: document.querySelector("#productosCompraLista"),
  buscarCompraInput: document.querySelector("#buscarCompraInput"),
  comprasTable: document.querySelector("#comprasTable"),
  comprasTotalResumen: document.querySelector("#comprasTotalResumen"),
  comprasUnidadesResumen: document.querySelector("#comprasUnidadesResumen"),
  comprasValorResumen: document.querySelector("#comprasValorResumen"),
  buscarMovimientoGeneralInput: document.querySelector("#buscarMovimientoGeneralInput"),
  movimientoTipoFiltro: document.querySelector("#movimientoTipoFiltro"),
  movimientosGeneralesTable: document.querySelector("#movimientosGeneralesTable"),
  movimientosTotalResumen: document.querySelector("#movimientosTotalResumen"),
  movimientosEntradasResumen: document.querySelector("#movimientosEntradasResumen"),
  movimientosSalidasResumen: document.querySelector("#movimientosSalidasResumen"),
  movimientosNetoResumen: document.querySelector("#movimientosNetoResumen"),
  buscarAuditoriaInput: document.querySelector("#buscarAuditoriaInput"),
  limpiarAuditoriaButton: document.querySelector("#limpiarAuditoriaButton"),
  auditoriaTable: document.querySelector("#auditoriaTable"),
  auditoriaTotalResumen: document.querySelector("#auditoriaTotalResumen"),
  auditoriaUltimaResumen: document.querySelector("#auditoriaUltimaResumen"),
  auditoriaUsuarioResumen: document.querySelector("#auditoriaUsuarioResumen"),
  informesMesFiltro: document.querySelector("#informesMesFiltro"),
  informesMesActualButton: document.querySelector("#informesMesActualButton"),
  informeFacturacion: document.querySelector("#informeFacturacion"),
  informePedidos: document.querySelector("#informePedidos"),
  informeTicketPromedio: document.querySelector("#informeTicketPromedio"),
  informeCuentaCorriente: document.querySelector("#informeCuentaCorriente"),
  informeVentasEstado: document.querySelector("#informeVentasEstado"),
  informeProductosVendidos: document.querySelector("#informeProductosVendidos"),
  informeVentasVendedor: document.querySelector("#informeVentasVendedor"),
  informeVentasZona: document.querySelector("#informeVentasZona"),
  informeVentasCliente: document.querySelector("#informeVentasCliente"),
  informeClientesDeuda: document.querySelector("#informeClientesDeuda"),
  informeStockCritico: document.querySelector("#informeStockCritico"),
  informeDetalleVendedorZonaCliente: document.querySelector("#informeDetalleVendedorZonaCliente"),

  /*boton*/
  resetDataButton: document.querySelector("#resetDataButton"),
  pedidoFormPanel: document.querySelector("#pedidoFormPanel"),
  cantidadInput: document.querySelector("#cantidadInput"),
  agregarPedidoButton: document.querySelector("#agregarPedidoButton"),

  /*Busqueda*/
  buscarProductoTabla: document.querySelector("#buscarProductoTabla"),
  buscarClienteTabla: document.querySelector("#buscarClienteTabla"),
  buscarPedidoTabla: document.querySelector("#buscarPedidoTabla"),
  pedidoFechaFiltro: document.querySelector("#pedidoFechaFiltro"),
  pedidoMesFiltro: document.querySelector("#pedidoMesFiltro"),
  limpiarFiltrosPedidoButton: document.querySelector("#limpiarFiltrosPedidoButton"),
  pedidosResultadoContador: document.querySelector("#pedidosResultadoContador"),
  pedidoMenuNuevoButton: document.querySelector("#pedidoMenuNuevoButton"),
  pedidoMenuFilterButtons: document.querySelectorAll("[data-order-menu-filter]"),
  pedidoMenuTotalCount: document.querySelector("#pedidoMenuTotalCount"),
  pedidoMenuPendingCount: document.querySelector("#pedidoMenuPendingCount"),
  pedidoMenuDraftCount: document.querySelector("#pedidoMenuDraftCount"),
  pedidoMenuAttendedCount: document.querySelector("#pedidoMenuAttendedCount"),
  pedidoMenuDeliveredCount: document.querySelector("#pedidoMenuDeliveredCount"),
  pedidoMenuAccountCount: document.querySelector("#pedidoMenuAccountCount"),
  pedidoMenuPaidCount: document.querySelector("#pedidoMenuPaidCount"),
  pedidoMenuCancelledCount: document.querySelector("#pedidoMenuCancelledCount"),
  pedidoResumenBorradores: document.querySelector("#pedidoResumenBorradores"),
  pedidoResumenPendientes: document.querySelector("#pedidoResumenPendientes"),
  pedidoResumenPendientesCantidad: document.querySelector("#pedidoResumenPendientesCantidad"),
  pedidoResumenEntrega: document.querySelector("#pedidoResumenEntrega"),
  pedidoResumenEntregaCantidad: document.querySelector("#pedidoResumenEntregaCantidad"),
  pedidoResumenCuenta: document.querySelector("#pedidoResumenCuenta"),
  pedidoResumenCuentaCantidad: document.querySelector("#pedidoResumenCuentaCantidad"),
  productStatusFilterButtons: document.querySelectorAll("[data-product-status-filter]"),
  clientStatusFilterButtons: document.querySelectorAll("[data-client-status-filter]"),
  clienteResultado: document.querySelector("#clienteResultado"),
  productoResultado: document.querySelector("#productoResultado"),
  clienteSearchResults: document.querySelector("#clienteSearchResults"),
  productoSearchResults: document.querySelector("#productoSearchResults"),
  clienteSearchInput: document.querySelector("#clienteSearchInput"),
  productoSearchInput: document.querySelector("#productoSearchInput"),

  /*Pedidos*/
  selectedClientCard: document.querySelector("#selectedClientCard"),
  selectedClientName: document.querySelector("#selectedClientName"),
  selectedClientDetails: document.querySelector("#selectedClientDetails"),
  pedidoFormTitle: document.querySelector("#pedidoFormTitle"),
  pedidoFormSubtitle: document.querySelector("#pedidoFormSubtitle"),
  pedidoProductCatalog: document.querySelector("#pedidoProductCatalog"),
  pedidoItemCount: document.querySelector("#pedidoItemCount"),
  pedidoNumeroPreview: document.querySelector("#pedidoNumeroPreview"),
  pedidoVendedorPreview: document.querySelector("#pedidoVendedorPreview"),
  pedidoItemsTable: document.querySelector("#pedidoItemsTable"),
  pedidoTotal: document.querySelector("#pedidoTotal"),
  guardarBorradorPedidoButton: document.querySelector("#guardarBorradorPedidoButton"),
  guardarPedidoButton: document.querySelector("#guardarPedidoButton"),
  volverPedidosButton: document.querySelector("#volverPedidosButton"),
  pedidoAtendidoButton: document.querySelector("#pedidoAtendidoButton"),
  imprimirPedidoButton: document.querySelector("#imprimirPedidoButton"),
  borrarPedidoActualButton: document.querySelector("#borrarPedidoActualButton"),
  formaPagoInput: document.querySelector("#formaPagoInput"),
  agregarObservacionButton: document.querySelector("#agregarObservacionButton"),
  observacionesPedidoLista: document.querySelector("#observacionesPedidoLista"),
  productosHabitualesCliente: document.querySelector("#productosHabitualesCliente"),
  pedidosTable: document.querySelector("#pedidosTable"),

  /*clientes*/
  clientForm: document.querySelector("#clientForm"),
  clientCodeInput: document.querySelector("#clientCodeInput"),
  clientNameInput: document.querySelector("#clientNameInput"),
  clientPhoneInput: document.querySelector("#clientPhoneInput"),
  clientAddressInput: document.querySelector("#clientAddressInput"),
  clientZoneInput: document.querySelector("#clientZoneInput"),
  clientsTable: document.querySelector("#clientsTable"),
  clientesImportacionTexto: document.querySelector("#clientesImportacionTexto"),
  importarClientesButton: document.querySelector("#importarClientesButton"),
  clientMenuButtons: document.querySelectorAll("[data-client-section]"),
  clientesListadoBloque: document.querySelector("#clientesListadoBloque"),
  clienteAltaBloque: document.querySelector("#clienteAltaBloque"),
  clientesImportacionBloque: document.querySelector("#clientesImportacionBloque"),
  clientesResumenBloque: document.querySelector("#clientesResumenBloque"),
  clientesTablaBloque: document.querySelector("#clientesTablaBloque"),
  clientesResultadoContador: document.querySelector("#clientesResultadoContador"),
  clientesActivosResumen: document.querySelector("#clientesActivosResumen"),
  clientesInactivosResumen: document.querySelector("#clientesInactivosResumen"),
  clientesTotalResumen: document.querySelector("#clientesTotalResumen"),

  /*clientes*/
  cantidadClientes: document.querySelector("#cantidadClientes"),
  cantidadProductos: document.querySelector("#cantidadProductos"),

  /*cuentas*/
  pedidosAtendidosDashboard: document.querySelector("#pedidosAtendidosDashboard"),
  pedidosPendientesDashboard: document.querySelector("#pedidosPendientesDashboard"),
  porCobrar: document.querySelector("#porCobrar"),
  clientesConDeuda: document.querySelector("#clientesConDeuda"),
  buscarCuentaClienteInput: document.querySelector("#buscarCuentaClienteInput"),
  cuentaClientesConDeudaCantidad: document.querySelector("#cuentaClientesConDeudaCantidad"),
  cuentaClientesConDeudaTotal: document.querySelector("#cuentaClientesConDeudaTotal"),
  accountMenuButtons: document.querySelectorAll("[data-account-section]"),
  cuentaDeudoresBloque: document.querySelector("#cuentaDeudoresBloque"),
  registrarPagoForm: document.querySelector("#registrarPagoForm"),
  pagoClienteInput: document.querySelector("#pagoClienteInput"),
  pagoImporteInput: document.querySelector("#pagoImporteInput"),
  pagoClienteResultado: document.querySelector("#pagoClienteResultado"),
  pagoTotalButton: document.querySelector("#pagoTotalButton"),

  /*Producto*/
  productForm: document.querySelector("#productForm"),
  productCodeInput: document.querySelector("#productCodeInput"),
  productNameInput: document.querySelector("#productNameInput"),
  productPriceInput: document.querySelector("#productPriceInput"),
  productStockInput: document.querySelector("#productStockInput"),
  productProviderInput: document.querySelector("#productProviderInput"),
  productsTable: document.querySelector("#productsTable"),
  productSubmitButton: document.querySelector("#productSubmitButton"),
  productosResultadoContador: document.querySelector("#productosResultadoContador"),
  productosImportacionTexto: document.querySelector("#productosImportacionTexto"),
  importarProductosButton: document.querySelector("#importarProductosButton"),
  productosActivosResumen: document.querySelector("#productosActivosResumen"),
  productosInactivosResumen: document.querySelector("#productosInactivosResumen"),
  productosBajoStockResumen: document.querySelector("#productosBajoStockResumen"),
  productosSinStockResumen: document.querySelector("#productosSinStockResumen"),
  productosValorStockResumen: document.querySelector("#productosValorStockResumen"),
  productMenuButtons: document.querySelectorAll("[data-product-section]"),
  productosListadoBloque: document.querySelector("#productosListadoBloque"),
  productoAltaBloque: document.querySelector("#productoAltaBloque"),
  productosImportacionBloque: document.querySelector("#productosImportacionBloque"),
  productosMovimientosBloque: document.querySelector("#productosMovimientosBloque"),
  buscarMovimientoProductoInput: document.querySelector("#buscarMovimientoProductoInput"),
  movimientosProductosTable: document.querySelector("#movimientosProductosTable"),
  movimientosProductosTotal: document.querySelector("#movimientosProductosTotal"),
  movimientosProductosUnidades: document.querySelector("#movimientosProductosUnidades"),
  movimientosProductosUltimo: document.querySelector("#movimientosProductosUltimo"),
  productosResumenBloque: document.querySelector("#productosResumenBloque"),
  productosTablaBloque: document.querySelector("#productosTablaBloque"),

  /*Remito*/
  estadoCuentaModal: document.querySelector("#estadoCuentaModal"),
  estadoCuentaContenido: document.querySelector("#estadoCuentaContenido"),
  cerrarEstadoCuenta: document.querySelector("#cerrarEstadoCuenta"),
  detallePedidoModal: document.querySelector("#detallePedidoModal"),
  detallePedidoTitulo: document.querySelector("#detallePedidoTitulo"),
  detallePedidoContenido: document.querySelector("#detallePedidoContenido"),
  cerrarDetallePedido: document.querySelector("#cerrarDetallePedido"),
  movimientosStockModal: document.querySelector("#movimientosStockModal"),
  movimientosStockTitulo: document.querySelector("#movimientosStockTitulo"),
  movimientosStockContenido: document.querySelector("#movimientosStockContenido"),
  cerrarMovimientosStock: document.querySelector("#cerrarMovimientosStock"),
};

let filtroEstadoPedidos = "TODOS";
function actualizarDashboard() {

  const pendientes =
    pedidos.filter(function (p) {
      return p.estado === "PENDIENTE";
    }).length;

  const atendidos =
    pedidos.filter(function (p) {
      return p.estado === "ATENDIDO";
    }).length;

  const entregados =
    pedidos.filter(function (p) {
      return p.estado === "ENTREGADO";
    }).length;

  const cuentaCorriente =
    clientes.reduce(function (total, cliente) {
      return total + cliente.saldo;
    }, 0);

  dom.pedidosPendientesDashboard.textContent = pendientes;
  dom.pedidosAtendidosDashboard.textContent = atendidos;
  dom.porCobrar.textContent =
    formatearDinero(cuentaCorriente);

  dom.cantidadClientes.textContent =
    clientes.length;

  dom.cantidadProductos.textContent =
    productos.length;
}

function contarPedidosPorEstado(estado) {
  return pedidos.filter(function (pedido) {
    return pedido.estado === estado;
  }).length;
}

function obtenerPedidosPorEstados(estados) {
  return pedidos.filter(function (pedido) {
    return estados.includes(pedido.estado);
  });
}

function sumarTotalPedidosPorEstados(estados) {
  return obtenerPedidosPorEstados(estados).reduce(function (total, pedido) {
    return total + (Number(pedido.total) || 0);
  }, 0);
}

function obtenerTextoCantidadPedidos(cantidad) {
  return cantidad === 1 ? "1 pedido" : cantidad + " pedidos";
}

function actualizarResumenPedidos() {
  if (!dom.pedidoResumenBorradores) {
    return;
  }

  const pedidosPendientes =
    obtenerPedidosPorEstados(["PENDIENTE"]);

  const pedidosEnEntrega =
    obtenerPedidosPorEstados(["ATENDIDO", "ENTREGADO"]);

  const pedidosCuentaCorriente =
    obtenerPedidosPorEstados(["CUENTA_CORRIENTE"]);

  dom.pedidoResumenBorradores.textContent =
    contarPedidosPorEstado("BORRADOR");

  dom.pedidoResumenPendientes.textContent =
    formatearDinero(sumarTotalPedidosPorEstados(["PENDIENTE"]));
  dom.pedidoResumenPendientesCantidad.textContent =
    obtenerTextoCantidadPedidos(pedidosPendientes.length);

  dom.pedidoResumenEntrega.textContent =
    formatearDinero(sumarTotalPedidosPorEstados(["ATENDIDO", "ENTREGADO"]));
  dom.pedidoResumenEntregaCantidad.textContent =
    obtenerTextoCantidadPedidos(pedidosEnEntrega.length);

  dom.pedidoResumenCuenta.textContent =
    formatearDinero(sumarTotalPedidosPorEstados(["CUENTA_CORRIENTE"]));
  dom.pedidoResumenCuentaCantidad.textContent =
    obtenerTextoCantidadPedidos(pedidosCuentaCorriente.length);
}

function actualizarMenuPedidos() {
  if (!dom.pedidoMenuTotalCount) {
    return;
  }

  dom.pedidoMenuTotalCount.textContent = pedidos.length;
  dom.pedidoMenuPendingCount.textContent = contarPedidosPorEstado("PENDIENTE");
  dom.pedidoMenuDraftCount.textContent = contarPedidosPorEstado("BORRADOR");
  dom.pedidoMenuAttendedCount.textContent = contarPedidosPorEstado("ATENDIDO");
  dom.pedidoMenuDeliveredCount.textContent = contarPedidosPorEstado("ENTREGADO");

  if (dom.pedidoMenuAccountCount) {
    dom.pedidoMenuAccountCount.textContent = contarPedidosPorEstado("CUENTA_CORRIENTE");
  }

  if (dom.pedidoMenuPaidCount) {
    dom.pedidoMenuPaidCount.textContent = contarPedidosPorEstado("COBRADO");
  }

  if (dom.pedidoMenuCancelledCount) {
    dom.pedidoMenuCancelledCount.textContent = contarPedidosPorEstado("CANCELADO");
  }

  dom.pedidoMenuFilterButtons.forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.orderMenuFilter === filtroEstadoPedidos
    );
  });

  actualizarResumenPedidos();
}

function cambiarFiltroPedidosDesdeMenu(filtroEstado) {
  filtroEstadoPedidos = filtroEstado;
  renderizarPedidos();
}

function mostrarSeccionProducto(seccion) {
  const seccionActual = seccion || "listado";
  const mostrarListado = seccionActual === "listado";

  dom.productMenuButtons.forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.productSection === seccionActual
    );
  });

  dom.productosListadoBloque.classList.toggle("hidden", !mostrarListado);
  dom.productosResultadoContador.classList.toggle("hidden", !mostrarListado);
  dom.productosResumenBloque.classList.toggle("hidden", !mostrarListado);
  dom.productosTablaBloque.classList.toggle("hidden", !mostrarListado);
  dom.productForm.classList.toggle("hidden", seccionActual !== "alta");
  dom.productosImportacionBloque.classList.toggle("hidden", seccionActual !== "importar");
  dom.productosMovimientosBloque.classList.toggle("hidden", seccionActual !== "movimientos");

  if (seccionActual === "alta") {
    dom.productCodeInput.focus();
  }

  if (seccionActual === "importar") {
    dom.productosImportacionTexto.focus();
  }

  if (seccionActual === "movimientos") {
    renderizarMovimientosProductos();
    dom.buscarMovimientoProductoInput.focus();
  }
}

function mostrarSeccionCliente(seccion) {
  const seccionActual = seccion || "listado";
  const mostrarListado = seccionActual === "listado";

  dom.clientMenuButtons.forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.clientSection === seccionActual
    );
  });

  dom.clientesListadoBloque.classList.toggle("hidden", !mostrarListado);
  dom.clientesResultadoContador.classList.toggle("hidden", !mostrarListado);
  dom.clientesResumenBloque.classList.toggle("hidden", !mostrarListado);
  dom.clientesTablaBloque.classList.toggle("hidden", !mostrarListado);
  dom.clientForm.classList.toggle("hidden", seccionActual !== "alta");
  dom.clientesImportacionBloque.classList.toggle("hidden", seccionActual !== "importar");

  if (seccionActual === "alta") {
    dom.clientCodeInput.focus();
  }

  if (seccionActual === "importar") {
    dom.clientesImportacionTexto.focus();
  }
}

function mostrarSeccionCuenta(seccion) {
  const seccionActual = seccion || "deudores";

  dom.accountMenuButtons.forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.accountSection === seccionActual
    );
  });

  dom.cuentaDeudoresBloque.classList.toggle("hidden", seccionActual !== "deudores");
  dom.registrarPagoForm.classList.toggle("hidden", seccionActual !== "pago");

  if (seccionActual === "pago") {
    actualizarVistaPagoCliente();
    dom.pagoClienteInput.focus();
  }
}

function abrirNuevoPedidoDesdeMenu() {
  if (pedidoActualTieneDatos()) {
    const confirmar =
      confirm("Ya hay un pedido en curso. Queres descartarlo y empezar uno nuevo?");

    if (!confirmar) {
      return;
    }
  }

  limpiarPedidoActual();
  pedidoEditando = null;
  limpiarFormularioPedido();
  renderizarPedidoActual();
  renderizarCatalogoProductosPedido();

  mostrarPagina("ventas");

  dom.ventasPage.classList.add("hidden");

  if (dom.pedidoFormPanel) {
    dom.pedidoFormPanel.classList.remove("hidden");
  }

  dom.clienteSearchInput.focus();
}

function volverAlListadoDePedidos() {
  mostrarPagina("ventas");
  renderizarPedidos();
}

function obtenerModuloDesdePagina(nombrePagina) {
  const mapaDeModulos = {
    dashboard: null,
    ventas: "ventas",
    clientes: "clientes",
    zonas: "zonas",
    proveedores: "proveedores",
    productos: "productos",
    cuenta: "cuentaCorriente",
    compras: "compras",
    movimientos: "movimientos",
    configuracion: "configuracion",
    auditoria: "auditoria",
    informes: "informes"
  };

  return mapaDeModulos[nombrePagina];
}

function usuarioPuedeVerPagina(nombrePagina) {
  const modulo = obtenerModuloDesdePagina(nombrePagina);

  if (!modulo) {
    return true;
  }

  return tienePermiso(modulo);
}

function aplicarPermisosDeUsuario() {
  dom.currentUserBadge.textContent =
    usuarioActual.nombre + " | " + usuarioActual.rol;

  dom.menuLinks.forEach(function (link) {
    const pagina = link.dataset.page;

    if (usuarioPuedeVerPagina(pagina)) {
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
  });

  dom.resetDataButton.style.display =
    tienePermiso("configuracion") ? "inline-flex" : "none";
}

function mostrarPagina(nombre) {
  if (!usuarioPuedeVerPagina(nombre)) {
    alert("Tu rol no tiene permiso para ver este modulo.");
    nombre = "dashboard";
  }

  const titulos = {
    dashboard: "Escritorio",
    ventas: "Pedidos",
    clientes: "Clientes",
    zonas: "Zonas",
    proveedores: "Proveedores",
    productos: "Productos",
    cuenta: "Cuenta Corriente",
    compras: "Compras",
    movimientos: "Movimientos",
    configuracion: "Configuracion",
    auditoria: "Auditoria",
    informes: "Informes"
  };

  dom.pageTitle.textContent = titulos[nombre];
  dom.dashboardPage.classList.add("hidden");
  dom.ventasPage.classList.add("hidden");
  dom.clientesPage.classList.add("hidden");
  dom.zonasPage.classList.add("hidden");
  dom.proveedoresPage.classList.add("hidden");
  dom.productosPage.classList.add("hidden");
  dom.cuentaPage.classList.add("hidden");
  dom.comprasPage.classList.add("hidden");
  dom.movimientosPage.classList.add("hidden");
  dom.configuracionPage.classList.add("hidden");
  dom.auditoriaPage.classList.add("hidden");
  dom.informesPage.classList.add("hidden");
  if (dom.pedidoFormPanel) {
    dom.pedidoFormPanel.classList.add("hidden");
  }

  dom.clienteSearchResults.classList.add("hidden");
  dom.productoSearchResults.classList.add("hidden");

  dom.menuLinks.forEach(function (link) {
    link.classList.remove("active");
  });

  const linkActivo =
    document.querySelector(`.menu a[data-page="${nombre}"]`);

  if (linkActivo) {
    linkActivo.classList.add("active");
  }

  if (nombre === "dashboard") {
    dom.dashboardPage.classList.remove("hidden");
  }

  const botonNuevoPedido =
    document.querySelector("#newSaleButton");
  if (nombre === "ventas") {
    dom.ventasPage.classList.remove("hidden");
    botonNuevoPedido.style.display = "block";
  } else {
    botonNuevoPedido.style.display = "none";
  }


  if (nombre === "clientes") {
    dom.clientesPage.classList.remove("hidden");
  }

  if (nombre === "zonas") {
    dom.zonasPage.classList.remove("hidden");
    renderizarZonas();
  }

  if (nombre === "proveedores") {
    dom.proveedoresPage.classList.remove("hidden");
    renderizarProveedores();
  }

  if (nombre === "productos") {
    dom.productosPage.classList.remove("hidden");
  }

  if (nombre === "cuenta") {
    dom.cuentaPage.classList.remove("hidden");
  }

  if (nombre === "compras") {
    dom.comprasPage.classList.remove("hidden");
    renderizarCompras();
    actualizarVistaCompra();
  }

  if (nombre === "movimientos") {
    dom.movimientosPage.classList.remove("hidden");
    renderizarMovimientosGenerales();
  }

  if (nombre === "configuracion") {
    dom.configuracionPage.classList.remove("hidden");
  }

  if (nombre === "auditoria") {
    dom.auditoriaPage.classList.remove("hidden");
    renderizarAuditoria();
  }

  if (nombre === "informes") {
    dom.informesPage.classList.remove("hidden");
    renderizarInformes();
  }
}

function configurarEventos() {

  dom.sidebarToggleButton.addEventListener(
    "click",
    function () {
      document.querySelector(".app").classList.toggle("sidebar-collapsed");
    }
  );

  dom.menuLinks.forEach(function (link) {

    link.addEventListener("click", function () {

      mostrarPagina(link.dataset.page);

    });

  });

  dom.configForm.addEventListener(
    "submit",
    guardarFormularioConfiguracion
  );

  dom.usuarioRolInput.addEventListener(
    "change",
    function () {
      usarUsuarioSistema(Number(dom.usuarioRolInput.value));
    }
  );

  dom.usuarioForm.addEventListener(
    "submit",
    agregarUsuarioSistema
  );

  dom.zonaForm.addEventListener(
    "submit",
    agregarZona
  );

  dom.buscarZonaInput.addEventListener(
    "input",
    renderizarZonas
  );

  dom.proveedorForm.addEventListener(
    "submit",
    agregarProveedor
  );

  dom.buscarProveedorInput.addEventListener(
    "input",
    renderizarProveedores
  );

  dom.compraForm.addEventListener(
    "submit",
    registrarCompra
  );

  dom.compraProductoInput.addEventListener(
    "input",
    actualizarVistaCompra
  );

  dom.buscarCompraInput.addEventListener(
    "input",
    renderizarCompras
  );

  dom.buscarMovimientoGeneralInput.addEventListener(
    "input",
    renderizarMovimientosGenerales
  );

  dom.movimientoTipoFiltro.addEventListener(
    "change",
    renderizarMovimientosGenerales
  );

  dom.buscarAuditoriaInput.addEventListener(
    "input",
    renderizarAuditoria
  );

  dom.limpiarAuditoriaButton.addEventListener(
    "click",
    limpiarAuditoria
  );

  dom.informesMesFiltro.addEventListener(
    "change",
    renderizarInformes
  );

  dom.informesMesActualButton.addEventListener(
    "click",
    mostrarInformesMesActual
  );

  dom.resetDataButton.addEventListener(
    "click",
    function () {

      const confirmar = confirm(
        "Seguro que quieres borrar todos los datos?"
      );

      if (!confirmar) {
        return;
      }

      localStorage.removeItem("clientes");
      localStorage.removeItem("productos");
      localStorage.removeItem("pedidos");
      localStorage.removeItem("configuracion");
      localStorage.removeItem("usuarioActual");
      localStorage.removeItem("usuariosSistema");
      localStorage.removeItem("auditoria");
      localStorage.removeItem("zonas");
      localStorage.removeItem("proveedores");
      localStorage.removeItem("compras");

      location.reload();

    }
  );

  dom.clienteSearchInput.addEventListener(
    "input",
    function () {

      clienteSeleccionado = null;

      mostrarResultadosCliente();

      actualizarVistaBusqueda();
      actualizarClientePedidoSeleccionado();

    }
  );

  dom.buscarProductoTabla.addEventListener(
    "input",
    renderizarProductos
  );

  dom.buscarMovimientoProductoInput.addEventListener(
    "input",
    renderizarMovimientosProductos
  );

  dom.buscarClienteTabla.addEventListener(
    "input",
    renderizarClientes
  );

  dom.buscarPedidoTabla.addEventListener(
    "input",
    renderizarPedidos
  );

  dom.pedidoFechaFiltro.addEventListener(
    "change",
    function () {
      if (dom.pedidoFechaFiltro.value) {
        dom.pedidoMesFiltro.value = dom.pedidoFechaFiltro.value.slice(0, 7);
      }

      renderizarPedidos();
    }
  );

  dom.pedidoMesFiltro.addEventListener(
    "change",
    renderizarPedidos
  );

  dom.buscarCuentaClienteInput.addEventListener(
    "input",
    renderizarClientesConDeuda
  );

  dom.pagoClienteInput.addEventListener(
    "input",
    actualizarVistaPagoCliente
  );

  dom.pagoTotalButton.addEventListener(
    "click",
    usarSaldoTotalComoPago
  );

  dom.registrarPagoForm.addEventListener(
    "submit",
    registrarPagoDesdeFormulario
  );

  dom.limpiarFiltrosPedidoButton.addEventListener(
    "click",
    function () {
      dom.buscarPedidoTabla.value = "";
      dom.pedidoFechaFiltro.value = "";
      dom.pedidoMesFiltro.value = "";
      filtroEstadoPedidos = "TODOS";
      renderizarPedidos();
    }
  );

  dom.pedidoMenuFilterButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      cambiarFiltroPedidosDesdeMenu(boton.dataset.orderMenuFilter);
    });
  });

  dom.pedidoMenuNuevoButton.addEventListener(
    "click",
    abrirNuevoPedidoDesdeMenu
  );

  dom.productStatusFilterButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      cambiarFiltroEstadoProductos(boton.dataset.productStatusFilter);
    });
  });

  dom.productMenuButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionProducto(boton.dataset.productSection);
    });
  });

  dom.clientStatusFilterButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      cambiarFiltroEstadoClientes(boton.dataset.clientStatusFilter);
    });
  });

  dom.clientMenuButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionCliente(boton.dataset.clientSection);
    });
  });

  dom.accountMenuButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionCuenta(boton.dataset.accountSection);
    });
  });

  dom.productoSearchInput.addEventListener(
    "input",
    function () {

      productoSeleccionado = null;

      mostrarResultadosProducto();

      actualizarVistaBusqueda();
      renderizarCatalogoProductosPedido();

    }
  );

  dom.productoSearchInput.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();

      if (!productoSeleccionado) {
        productoSeleccionado =
          buscarProducto(dom.productoSearchInput.value);
      }

      agregarProductoAlPedidoActual();
    }
  );

  dom.cantidadInput.addEventListener(
    "input",
    actualizarVistaBusqueda
  );

  dom.clientForm.addEventListener(
    "submit",
    agregarCliente
  );

  dom.importarClientesButton.addEventListener(
    "click",
    importarClientesDesdeTexto
  );

  dom.productForm.addEventListener(
    "submit",
    agregarProducto
  );

  dom.importarProductosButton.addEventListener(
    "click",
    importarProductosDesdeTexto
  );

  dom.agregarPedidoButton.addEventListener(
    "click",
    agregarProductoAlPedidoActual
  );

  dom.guardarPedidoButton.addEventListener(
    "click",
    guardarPedido
  );

  dom.guardarBorradorPedidoButton.addEventListener(
    "click",
    guardarBorradorPedidoActual
  );

  dom.pedidoAtendidoButton.addEventListener(
    "click",
    guardarYAtenderPedidoActual
  );

  dom.imprimirPedidoButton.addEventListener(
    "click",
    imprimirPedidoActual
  );

  dom.borrarPedidoActualButton.addEventListener(
    "click",
    borrarPedidoActual
  );

  dom.formaPagoInput.addEventListener(
    "change",
    function () {
      pedidoActual.formaPago = dom.formaPagoInput.value;
      renderizarPedidoActual();
    }
  );

  dom.agregarObservacionButton.addEventListener(
    "click",
    agregarObservacionPedidoActual
  );

  dom.volverPedidosButton.addEventListener(
    "click",
    volverAlListadoDePedidos
  );

  dom.estadoCuentaModal.addEventListener(
    "click",
    function (e) {

      if (e.target === dom.estadoCuentaModal) {

        dom.estadoCuentaModal.classList.add(
          "hidden"
        );

      }

    }
  );

  dom.cerrarEstadoCuenta.addEventListener(
    "click",
    function () {

      dom.estadoCuentaModal.classList.add("hidden");

    }
  );

  dom.detallePedidoModal.addEventListener(
    "click",
    function (e) {
      if (e.target === dom.detallePedidoModal) {
        cerrarDetallePedidoModal();
      }
    }
  );

  dom.cerrarDetallePedido.addEventListener(
    "click",
    function () {
      cerrarDetallePedidoModal();
    }
  );

  dom.movimientosStockModal.addEventListener(
    "click",
    function (e) {
      if (e.target === dom.movimientosStockModal) {
        dom.movimientosStockModal.classList.add("hidden");
      }
    }
  );

  dom.cerrarMovimientosStock.addEventListener(
    "click",
    function () {
      dom.movimientosStockModal.classList.add("hidden");
    }
  );

  document.querySelector("#newSaleButton").addEventListener("click", function () {
    abrirNuevoPedidoDesdeMenu();
  });
}

function iniciarApp() {

  cargarDatos();

  cargarConfiguracion();
  cargarUsuariosSistema();
  cargarUsuarioActual();
  cargarAuditoria();
  renderizarConfiguracion();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  renderizarZonas();
  renderizarProveedores();
  renderizarCompras();
  renderizarMovimientosGenerales();
  aplicarPermisosDeUsuario();
  configurarEventos();
  actualizarVistaBusqueda();
  renderizarClientes();
  completarSiguienteCodigoCliente();
  actualizarDashboard();
  actualizarStockTotal();
  renderizarClientesConDeuda();
  renderizarProductos();
  completarSiguienteCodigoProducto();
  renderizarPedidos();
  actualizarMenuPedidos();
  renderizarAuditoria();
  renderizarInformes();
  renderizarPedidoActual();
  renderizarCatalogoProductosPedido();
  actualizarClientePedidoSeleccionado();
  renderizarProductosHabitualesCliente();
  mostrarPagina("dashboard");
}

iniciarApp();
