const dom = {
  /*menu*/
  pageTitle: document.querySelector("#pageTitle"),
  currentUserBadge: document.querySelector("#currentUserBadge"),
  sidebarToggleButton: document.querySelector("#sidebarToggleButton"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  menuLinks: document.querySelectorAll(".menu a[data-page]"),
  quickAccessButtons: document.querySelectorAll("[data-quick-page]"),
  dashboardPage: document.querySelector("#dashboardPage"),
  ventasPage: document.querySelector("#ventasPage"),
  clientesPage: document.querySelector("#clientesPage"),
  listasPage: document.querySelector("#listasPage"),
  rubrosPage: document.querySelector("#rubrosPage"),
  zonasPage: document.querySelector("#zonasPage"),
  proveedoresPage: document.querySelector("#proveedoresPage"),
  productosPage: document.querySelector("#productosPage"),
  cuentaPage: document.querySelector("#cuentaPage"),
  comprasPage: document.querySelector("#comprasPage"),
  movimientosPage: document.querySelector("#movimientosPage"),
  auditoriaPage: document.querySelector("#auditoriaPage"),
  informesPage: document.querySelector("#informesPage"),
  impresionPage: document.querySelector("#impresionPage"),

  /*configuracion*/
  configuracionPage: document.querySelector("#configuracionPage"),
  configForm: document.querySelector("#configForm"),
  empresaInput: document.querySelector("#empresaInput"),
  cuitInput: document.querySelector("#cuitInput"),
  whatsappInput: document.querySelector("#whatsappInput"),
  aliasInput: document.querySelector("#aliasInput"),
  stockMinimoInput: document.querySelector("#stockMinimoInput"),
  impresionForm: document.querySelector("#impresionForm"),
  impresionTituloInput: document.querySelector("#impresionTituloInput"),
  impresionSubtituloInput: document.querySelector("#impresionSubtituloInput"),
  impresionPieInput: document.querySelector("#impresionPieInput"),
  impresionMostrarQrInput: document.querySelector("#impresionMostrarQrInput"),
  impresionQrTextoInput: document.querySelector("#impresionQrTextoInput"),
  impresionPreviewTitulo: document.querySelector("#impresionPreviewTitulo"),
  impresionPreviewSubtitulo: document.querySelector("#impresionPreviewSubtitulo"),
  impresionPreviewQr: document.querySelector("#impresionPreviewQr"),
  cargarSupabaseButton: document.querySelector("#cargarSupabaseButton"),
  sincronizarDatosBaseButton: document.querySelector("#sincronizarDatosBaseButton"),
  sincronizarAdministracionButton: document.querySelector("#sincronizarAdministracionButton"),
  sincronizarClientesProductosButton: document.querySelector("#sincronizarClientesProductosButton"),
  sincronizarPedidosButton: document.querySelector("#sincronizarPedidosButton"),
  sincronizarCuentaButton: document.querySelector("#sincronizarCuentaButton"),
  supabaseSyncStatus: document.querySelector("#supabaseSyncStatus"),
  usuarioForm: document.querySelector("#usuarioForm"),
  usuarioNombreInput: document.querySelector("#usuarioNombreInput"),
  usuarioNuevoRolInput: document.querySelector("#usuarioNuevoRolInput"),
  rolForm: document.querySelector("#rolForm"),
  rolNombreInput: document.querySelector("#rolNombreInput"),
  rolPermisosInputs: document.querySelectorAll("[data-role-permission]"),
  usuariosSistemaTable: document.querySelector("#usuariosSistemaTable"),
  usuarioRolInput: document.querySelector("#usuarioRolInput"),
  listaPrecioForm: document.querySelector("#listaPrecioForm"),
  listaPrecioNombreInput: document.querySelector("#listaPrecioNombreInput"),
  listasPreciosTable: document.querySelector("#listasPreciosTable"),
  listasPreciosBloque: document.querySelector("#listasPreciosBloque"),
  baseModuleContent: document.querySelector(".base-module-content"),
  baseDataMenuButtons: document.querySelectorAll("[data-base-section]"),
  rubroForm: document.querySelector("#rubroForm"),
  rubroNombreInput: document.querySelector("#rubroNombreInput"),
  rubroDescripcionInput: document.querySelector("#rubroDescripcionInput"),
  rubroSubmitButton: document.querySelector("#rubroSubmitButton"),
  cancelarEdicionRubroButton: document.querySelector("#cancelarEdicionRubroButton"),
  buscarRubroInput: document.querySelector("#buscarRubroInput"),
  rubrosTable: document.querySelector("#rubrosTable"),
  rubrosActivosResumen: document.querySelector("#rubrosActivosResumen"),
  rubrosProductosResumen: document.querySelector("#rubrosProductosResumen"),
  rubrosSinAsignarResumen: document.querySelector("#rubrosSinAsignarResumen"),
  rubrosActivosLista: document.querySelector("#rubrosActivosLista"),
  zonaForm: document.querySelector("#zonaForm"),
  zonaNombreInput: document.querySelector("#zonaNombreInput"),
  zonaDescripcionInput: document.querySelector("#zonaDescripcionInput"),
  buscarZonaInput: document.querySelector("#buscarZonaInput"),
  zonasTable: document.querySelector("#zonasTable"),
  zonasActivasResumen: document.querySelector("#zonasActivasResumen"),
  zonasClientesResumen: document.querySelector("#zonasClientesResumen"),
  zonasSinAsignarResumen: document.querySelector("#zonasSinAsignarResumen"),
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
  auditoriaFechaDesdeFiltro: document.querySelector("#auditoriaFechaDesdeFiltro"),
  auditoriaFechaHastaFiltro: document.querySelector("#auditoriaFechaHastaFiltro"),
  auditoriaUsuarioFiltro: document.querySelector("#auditoriaUsuarioFiltro"),
  auditoriaModuloFiltro: document.querySelector("#auditoriaModuloFiltro"),
  auditoriaAccionFiltro: document.querySelector("#auditoriaAccionFiltro"),
  limpiarFiltrosAuditoriaButton: document.querySelector("#limpiarFiltrosAuditoriaButton"),
  limpiarAuditoriaButton: document.querySelector("#limpiarAuditoriaButton"),
  auditoriaTable: document.querySelector("#auditoriaTable"),
  auditoriaTotalResumen: document.querySelector("#auditoriaTotalResumen"),
  auditoriaUltimaResumen: document.querySelector("#auditoriaUltimaResumen"),
  auditoriaUsuarioResumen: document.querySelector("#auditoriaUsuarioResumen"),
  informesMesFiltro: document.querySelector("#informesMesFiltro"),
  informesVendedorFiltro: document.querySelector("#informesVendedorFiltro"),
  informesZonaFiltro: document.querySelector("#informesZonaFiltro"),
  informesClienteFiltro: document.querySelector("#informesClienteFiltro"),
  informesRubroFiltro: document.querySelector("#informesRubroFiltro"),
  informesEstadoFiltro: document.querySelector("#informesEstadoFiltro"),
  informesMesActualButton: document.querySelector("#informesMesActualButton"),
  limpiarFiltrosInformesButton: document.querySelector("#limpiarFiltrosInformesButton"),
  imprimirInformeButton: document.querySelector("#imprimirInformeButton"),
  informeEmpresaNombre: document.querySelector("#informeEmpresaNombre"),
  informeTituloEjecutivo: document.querySelector("#informeTituloEjecutivo"),
  informeSubtituloEjecutivo: document.querySelector("#informeSubtituloEjecutivo"),
  informeFiltrosAplicados: document.querySelector("#informeFiltrosAplicados"),
  informeClientesVendidos: document.querySelector("#informeClientesVendidos"),
  informeUnidadesVendidas: document.querySelector("#informeUnidadesVendidas"),
  informeProductosDistintos: document.querySelector("#informeProductosDistintos"),
  informePedidosCuenta: document.querySelector("#informePedidosCuenta"),
  informeFacturacion: document.querySelector("#informeFacturacion"),
  informePedidos: document.querySelector("#informePedidos"),
  informeTicketPromedio: document.querySelector("#informeTicketPromedio"),
  informeCuentaCorriente: document.querySelector("#informeCuentaCorriente"),
  informeCostoEstimado: document.querySelector("#informeCostoEstimado"),
  informeGananciaEstimada: document.querySelector("#informeGananciaEstimada"),
  informeMargenEstimado: document.querySelector("#informeMargenEstimado"),
  informeProductosSinCosto: document.querySelector("#informeProductosSinCosto"),
  informesMensualesTable: document.querySelector("#informesMensualesTable"),
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
  limpiarFiltrosPedidoButton: document.querySelector("#limpiarFiltrosPedidoButton"),
  pedidosResultadoContador: document.querySelector("#pedidosResultadoContador"),
  pedidoMenuNuevoButton: document.querySelector("#pedidoMenuNuevoButton"),
  pedidoMenuFilterButtons: document.querySelectorAll("[data-order-menu-filter]"),
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
  pedidoListaPreview: document.querySelector("#pedidoListaPreview"),
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
  clientRazonSocialInput: document.querySelector("#clientRazonSocialInput"),
  clientNombreFantasiaInput: document.querySelector("#clientNombreFantasiaInput"),
  clientLocalidadInput: document.querySelector("#clientLocalidadInput"),
  clientCodigoPostalInput: document.querySelector("#clientCodigoPostalInput"),
  clientTelefonoParticularInput: document.querySelector("#clientTelefonoParticularInput"),
  clientTelefonoMovilInput: document.querySelector("#clientTelefonoMovilInput"),
  clientEmailInput: document.querySelector("#clientEmailInput"),
  clientListaPreciosInput: document.querySelector("#clientListaPreciosInput"),
  clientPosicionZonaInput: document.querySelector("#clientPosicionZonaInput"),
  clientVendedorAsignadoInput: document.querySelector("#clientVendedorAsignadoInput"),
  clientCondicionIvaInput: document.querySelector("#clientCondicionIvaInput"),
  clientHorarioAtencionInput: document.querySelector("#clientHorarioAtencionInput"),
  clientObservacionesInput: document.querySelector("#clientObservacionesInput"),
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
  dashboardPrioridadResumen: document.querySelector("#dashboardPrioridadResumen"),
  dashboardPedidosPendientesLista: document.querySelector("#dashboardPedidosPendientesLista"),
  dashboardStockCriticoLista: document.querySelector("#dashboardStockCriticoLista"),
  dashboardCobranzaLista: document.querySelector("#dashboardCobranzaLista"),
  dashboardReposicionLista: document.querySelector("#dashboardReposicionLista"),
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
  productBarcodeInput: document.querySelector("#productBarcodeInput"),
  productNameInput: document.querySelector("#productNameInput"),
  productPriceInput: document.querySelector("#productPriceInput"),
  productPriceList2Input: document.querySelector("#productPriceList2Input"),
  productPriceList3Input: document.querySelector("#productPriceList3Input"),
  productPriceList4Input: document.querySelector("#productPriceList4Input"),
  productPurchasePriceInput: document.querySelector("#productPurchasePriceInput"),
  productStockInput: document.querySelector("#productStockInput"),
  productMinimumStockInput: document.querySelector("#productMinimumStockInput"),
  productCategoryInput: document.querySelector("#productCategoryInput"),
  productTypeInput: document.querySelector("#productTypeInput"),
  productBrandInput: document.querySelector("#productBrandInput"),
  productDetailInput: document.querySelector("#productDetailInput"),
  productPackInput: document.querySelector("#productPackInput"),
  productUnitInput: document.querySelector("#productUnitInput"),
  productIvaInput: document.querySelector("#productIvaInput"),
  productSaleDiscountInput: document.querySelector("#productSaleDiscountInput"),
  productProviderInput: document.querySelector("#productProviderInput"),
  productAltProviderInput: document.querySelector("#productAltProviderInput"),
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
  productosPreciosBloque: document.querySelector("#productosPreciosBloque"),
  priceUpdateForm: document.querySelector("#priceUpdateForm"),
  priceUpdateRubroInput: document.querySelector("#priceUpdateRubroInput"),
  priceUpdateProveedorInput: document.querySelector("#priceUpdateProveedorInput"),
  priceUpdateListaInput: document.querySelector("#priceUpdateListaInput"),
  priceUpdatePercentInput: document.querySelector("#priceUpdatePercentInput"),
  priceUpdatePreview: document.querySelector("#priceUpdatePreview"),
  priceHistoryTable: document.querySelector("#priceHistoryTable"),
  productosMovimientosBloque: document.querySelector("#productosMovimientosBloque"),
  buscarMovimientoProductoInput: document.querySelector("#buscarMovimientoProductoInput"),
  stockScannerInput: document.querySelector("#stockScannerInput"),
  stockScannerResult: document.querySelector("#stockScannerResult"),
  stockQuickQuantityInput: document.querySelector("#stockQuickQuantityInput"),
  stockQuickNoteInput: document.querySelector("#stockQuickNoteInput"),
  stockQuickActionButtons: document.querySelectorAll("[data-stock-quick-action]"),
  stockMovementForm: document.querySelector("#stockMovementForm"),
  stockProductInput: document.querySelector("#stockProductInput"),
  productosStockLista: document.querySelector("#productosStockLista"),
  stockMovementTypeInput: document.querySelector("#stockMovementTypeInput"),
  stockMovementQuantityInput: document.querySelector("#stockMovementQuantityInput"),
  stockMovementNoteInput: document.querySelector("#stockMovementNoteInput"),
  stockMovementPreview: document.querySelector("#stockMovementPreview"),
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
  entregaPedidoModal: document.querySelector("#entregaPedidoModal"),
  entregaPedidoForm: document.querySelector("#entregaPedidoForm"),
  entregaPedidoResumen: document.querySelector("#entregaPedidoResumen"),
  entregaPagoInput: document.querySelector("#entregaPagoInput"),
  entregaSaldoPreview: document.querySelector("#entregaSaldoPreview"),
  entregaSinPagoButton: document.querySelector("#entregaSinPagoButton"),
  entregaPagoTotalButton: document.querySelector("#entregaPagoTotalButton"),
  cancelarEntregaPedidoButton: document.querySelector("#cancelarEntregaPedidoButton"),
  cerrarEntregaPedido: document.querySelector("#cerrarEntregaPedido"),
  movimientosStockModal: document.querySelector("#movimientosStockModal"),
  movimientosStockTitulo: document.querySelector("#movimientosStockTitulo"),
  movimientosStockContenido: document.querySelector("#movimientosStockContenido"),
  cerrarMovimientosStock: document.querySelector("#cerrarMovimientosStock"),
};

let filtroEstadoPedidos = "PENDIENTE";

function renderizarListaDashboard(contenedor, items, crearFila, mensajeVacio) {
  if (!contenedor) {
    return;
  }

  if (items.length === 0) {
    contenedor.innerHTML =
      `<div class="dashboard-empty">${mensajeVacio}</div>`;
    return;
  }

  contenedor.innerHTML =
    items.map(crearFila).join("");
}

function obtenerPedidosPendientesParaDashboard() {
  return pedidos.filter(function (pedido) {
    return pedido.estado === "PENDIENTE";
  }).sort(function (primero, segundo) {
    return segundo.id - primero.id;
  }).slice(0, 5);
}

function obtenerProductosCriticosParaDashboard() {
  return productos.filter(function (producto) {
    const estadoStock = obtenerEstadoStockProducto(producto);

    return productoActivo(producto) &&
      (estadoStock.clase === "stock-low" || estadoStock.clase === "stock-empty");
  }).sort(function (primero, segundo) {
    return Number(primero.stock) - Number(segundo.stock);
  }).slice(0, 5);
}

function obtenerClientesDeudoresParaDashboard() {
  return clientes.filter(function (cliente) {
    return clienteActivo(cliente) && Number(cliente.saldo) > 0;
  }).sort(function (primero, segundo) {
    return Number(segundo.saldo) - Number(primero.saldo);
  }).slice(0, 5);
}

function renderizarCentroControlDashboard() {
  const pedidosPendientes = obtenerPedidosPendientesParaDashboard();
  const productosCriticos = obtenerProductosCriticosParaDashboard();
  const clientesDeudores = obtenerClientesDeudoresParaDashboard();
  const alertasTotales =
    pedidosPendientes.length + productosCriticos.length + clientesDeudores.length;

  dom.dashboardPrioridadResumen.textContent =
    alertasTotales === 0
      ? "Sin alertas importantes"
      : alertasTotales + " prioridades para revisar";

  renderizarListaDashboard(
    dom.dashboardPedidosPendientesLista,
    pedidosPendientes,
    function (pedido) {
      const clientePedido = pedido.cliente ? pedido.cliente.nombre : "Sin cliente";

      return `
        <div class="dashboard-alert-row">
          <span>Pedido #${pedido.id} | ${clientePedido}</span>
          <strong>${formatearDinero(pedido.total)}</strong>
        </div>
      `;
    },
    "No hay pedidos pendientes."
  );

  renderizarListaDashboard(
    dom.dashboardStockCriticoLista,
    productosCriticos,
    function (producto) {
      return `
        <div class="dashboard-alert-row">
          <span>${producto.codigo} - ${producto.nombre}</span>
          <strong>Stock ${producto.stock}</strong>
        </div>
      `;
    },
    "No hay productos criticos."
  );

  renderizarListaDashboard(
    dom.dashboardCobranzaLista,
    clientesDeudores,
    function (cliente) {
      return `
        <div class="dashboard-alert-row">
          <span>${cliente.codigo} - ${cliente.nombre}</span>
          <strong>${formatearDinero(cliente.saldo)}</strong>
        </div>
      `;
    },
    "No hay saldos pendientes."
  );

  renderizarListaDashboard(
    dom.dashboardReposicionLista,
    productosCriticos,
    function (producto) {
      const stockMinimo = Number(CONFIG.stockMinimo) || 0;
      const cantidadSugerida = Math.max(stockMinimo * 2 - Number(producto.stock), stockMinimo);

      return `
        <div class="dashboard-alert-row">
          <span>${producto.codigo} - ${producto.nombre}</span>
          <strong>Comprar ${cantidadSugerida}</strong>
        </div>
      `;
    },
    "Sin reposiciones urgentes."
  );
}

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

  renderizarCentroControlDashboard();
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

function obtenerPedidosPorEstadosDeCobro(estadosDeCobro) {
  return pedidos.filter(function (pedido) {
    return estadosDeCobro.includes(pedido.estadoCobro) ||
      estadosDeCobro.includes(pedido.estado);
  });
}

function sumarTotalPedidosPorEstados(estados) {
  return obtenerPedidosPorEstados(estados).reduce(function (total, pedido) {
    return total + (Number(pedido.total) || 0);
  }, 0);
}

function sumarSaldoPedidosPorEstadosDeCobro(estadosDeCobro) {
  return obtenerPedidosPorEstadosDeCobro(estadosDeCobro).reduce(function (total, pedido) {
    if (typeof pedido.saldoPendiente === "number") {
      return total + pedido.saldoPendiente;
    }

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
    obtenerPedidosPorEstadosDeCobro(["CUENTA_CORRIENTE"]);

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
    formatearDinero(sumarSaldoPedidosPorEstadosDeCobro(["CUENTA_CORRIENTE"]));
  dom.pedidoResumenCuentaCantidad.textContent =
    obtenerTextoCantidadPedidos(pedidosCuentaCorriente.length);
}

function actualizarMenuPedidos() {
  if (!dom.pedidoMenuPendingCount) {
    return;
  }

  dom.pedidoMenuPendingCount.textContent = contarPedidosPorEstado("PENDIENTE");
  dom.pedidoMenuDraftCount.textContent = contarPedidosPorEstado("BORRADOR");
  dom.pedidoMenuAttendedCount.textContent = contarPedidosPorEstado("ATENDIDO");
  dom.pedidoMenuDeliveredCount.textContent = contarPedidosPorEstado("ENTREGADO");

  if (dom.pedidoMenuAccountCount) {
    dom.pedidoMenuAccountCount.textContent =
      obtenerPedidosPorEstadosDeCobro(["CUENTA_CORRIENTE"]).length;
  }

  if (dom.pedidoMenuPaidCount) {
    dom.pedidoMenuPaidCount.textContent =
      obtenerPedidosPorEstadosDeCobro(["COBRADO"]).length;
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
  dom.productosPreciosBloque.classList.toggle("hidden", seccionActual !== "precios");
  dom.productosMovimientosBloque.classList.toggle("hidden", seccionActual !== "movimientos");

  if (seccionActual === "precios") {
    renderizarPanelPreciosProductos();
  }

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

function actualizarEstadoSincronizacionSupabase(mensaje, tipo) {
  if (!dom.supabaseSyncStatus) {
    return;
  }

  dom.supabaseSyncStatus.textContent = mensaje;
  dom.supabaseSyncStatus.classList.remove("sync-ok", "sync-error", "sync-working");

  if (tipo) {
    dom.supabaseSyncStatus.classList.add(tipo);
  }
}

async function ejecutarAccionSupabase(nombreAccion, accion, requiereConfirmacion) {
  if (requiereConfirmacion) {
    const confirmar =
      confirm(
        nombreAccion + "\n\n" +
        "Esto enviara datos de la empresa a Supabase. Continuar?"
      );

    if (!confirmar) {
      return;
    }
  }

  try {
    actualizarEstadoSincronizacionSupabase(nombreAccion + " en curso...", "sync-working");
    const resultado =
      await accion();

    actualizarEstadoSincronizacionSupabase(
      nombreAccion + " terminado. " + JSON.stringify(resultado),
      "sync-ok"
    );
  } catch (error) {
    console.error(nombreAccion + " fallo:", error);
    actualizarEstadoSincronizacionSupabase(
      nombreAccion + " fallo. Revisa consola o permisos de Supabase.",
      "sync-error"
    );
  }
}

async function cargarTodoDesdeSupabase() {
  await cargarDatosBaseDesdeSupabase();
  await cargarAdministracionDesdeSupabase();
  await cargarClientesDesdeSupabase();
  await cargarProductosDesdeSupabase();
  await cargarPedidosDesdeSupabase();

  return "Datos cargados desde Supabase";
}

async function sincronizarClientesYProductosConSupabase() {
  const clientesCantidad =
    await sincronizarClientesLocalesConSupabase();
  const productosCantidad =
    await sincronizarProductosLocalesConSupabase();

  return {
    clientes: clientesCantidad,
    productos: productosCantidad
  };
}

function mostrarSeccionDatosBase(seccion) {
  const seccionActual = seccion || "precios";

  if (dom.baseModuleContent) {
    if (dom.rubrosPage.parentElement !== dom.baseModuleContent) {
      dom.baseModuleContent.appendChild(dom.rubrosPage);
    }

    if (dom.zonasPage.parentElement !== dom.baseModuleContent) {
      dom.baseModuleContent.appendChild(dom.zonasPage);
    }
  }

  dom.baseDataMenuButtons.forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.baseSection === seccionActual
    );
  });

  dom.listasPreciosBloque.classList.toggle("hidden", seccionActual !== "precios");
  dom.rubrosPage.classList.toggle("hidden", seccionActual !== "rubros");
  dom.zonasPage.classList.toggle("hidden", seccionActual !== "zonas");

  if (seccionActual === "precios") {
    renderizarListasPrecios();
    dom.listaPrecioNombreInput.focus();
  }

  if (seccionActual === "rubros") {
    renderizarRubros();
    dom.rubroNombreInput.focus();
  }

  if (seccionActual === "zonas") {
    renderizarZonas();
    dom.zonaNombreInput.focus();
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
    listas: "rubros",
    rubros: "rubros",
    zonas: "zonas",
    proveedores: "proveedores",
    productos: "productos",
    cuenta: "cuentaCorriente",
    compras: "compras",
    movimientos: "movimientos",
    configuracion: "configuracion",
    impresion: "impresion",
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
    listas: "Listas",
    rubros: "Rubros",
    zonas: "Zonas",
    proveedores: "Proveedores",
    productos: "Productos",
    cuenta: "Cuenta Corriente",
    compras: "Compras",
    movimientos: "Movimientos",
    configuracion: "Configuracion",
    impresion: "Impresion",
    auditoria: "Auditoria",
    informes: "Informes"
  };

  dom.pageTitle.textContent = titulos[nombre];
  dom.dashboardPage.classList.add("hidden");
  dom.ventasPage.classList.add("hidden");
  dom.clientesPage.classList.add("hidden");
  dom.listasPage.classList.add("hidden");
  dom.rubrosPage.classList.add("hidden");
  dom.zonasPage.classList.add("hidden");
  dom.proveedoresPage.classList.add("hidden");
  dom.productosPage.classList.add("hidden");
  dom.cuentaPage.classList.add("hidden");
  dom.comprasPage.classList.add("hidden");
  dom.movimientosPage.classList.add("hidden");
  dom.configuracionPage.classList.add("hidden");
  dom.impresionPage.classList.add("hidden");
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

  dom.quickAccessButtons.forEach(function (button) {
    button.classList.toggle(
      "active",
      button.dataset.quickPage === nombre
    );
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

  if (nombre === "listas") {
    dom.listasPage.classList.remove("hidden");
    mostrarSeccionDatosBase("precios");
  }

  if (nombre === "rubros") {
    dom.rubrosPage.classList.remove("hidden");
    renderizarRubros();
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

  if (nombre === "impresion") {
    dom.impresionPage.classList.remove("hidden");
    renderizarConfiguracionImpresion();
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

function obtenerContenedorApp() {
  return document.querySelector(".app");
}

let sidebarColapsadoActual = true;

function actualizarEstadoSidebar(colapsado) {
  const app =
    obtenerContenedorApp();

  sidebarColapsadoActual = colapsado;

  app.classList.toggle("sidebar-collapsed", colapsado);

  dom.sidebarToggleButton.setAttribute(
    "aria-label",
    colapsado ? "Abrir menu" : "Cerrar menu"
  );
  dom.sidebarToggleButton.setAttribute(
    "aria-expanded",
    String(!colapsado)
  );
}

function alternarSidebar() {
  const app =
    obtenerContenedorApp();
  const estaColapsado =
    app.classList.contains("sidebar-collapsed");

  actualizarEstadoSidebar(!estaColapsado);
}

function inicializarSidebar() {
  actualizarEstadoSidebar(sidebarColapsadoActual);
}

function configurarEventos() {

  dom.sidebarToggleButton.addEventListener(
    "click",
    alternarSidebar
  );

  dom.sidebarBackdrop.addEventListener(
    "click",
    function () {
      actualizarEstadoSidebar(true);
    }
  );

  dom.menuLinks.forEach(function (link) {

    link.addEventListener("click", function () {

      mostrarPagina(link.dataset.page);
      actualizarEstadoSidebar(true);

    });

  });

  dom.quickAccessButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      mostrarPagina(button.dataset.quickPage);
      actualizarEstadoSidebar(true);

    });

  });

  dom.baseDataMenuButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionDatosBase(boton.dataset.baseSection);
    });
  });

  dom.configForm.addEventListener(
    "submit",
    guardarFormularioConfiguracion
  );

  dom.impresionForm.addEventListener(
    "submit",
    guardarFormularioImpresion
  );

  dom.cargarSupabaseButton.addEventListener(
    "click",
    function () {
      ejecutarAccionSupabase(
        "Cargar datos desde Supabase",
        cargarTodoDesdeSupabase,
        false
      );
    }
  );

  dom.sincronizarDatosBaseButton.addEventListener(
    "click",
    function () {
      ejecutarAccionSupabase(
        "Subir datos base a Supabase",
        sincronizarDatosBaseLocalesConSupabase,
        true
      );
    }
  );

  dom.sincronizarAdministracionButton.addEventListener(
    "click",
    function () {
      ejecutarAccionSupabase(
        "Subir administracion a Supabase",
        sincronizarAdministracionLocalConSupabase,
        true
      );
    }
  );

  dom.sincronizarClientesProductosButton.addEventListener(
    "click",
    function () {
      ejecutarAccionSupabase(
        "Subir clientes y productos a Supabase",
        sincronizarClientesYProductosConSupabase,
        true
      );
    }
  );

  dom.sincronizarPedidosButton.addEventListener(
    "click",
    function () {
      ejecutarAccionSupabase(
        "Subir pedidos a Supabase",
        sincronizarPedidosLocalesConSupabase,
        true
      );
    }
  );

  dom.sincronizarCuentaButton.addEventListener(
    "click",
    function () {
      ejecutarAccionSupabase(
        "Subir cuenta corriente a Supabase",
        sincronizarCuentaCorrienteLocalConSupabase,
        true
      );
    }
  );

  [
    dom.impresionTituloInput,
    dom.impresionSubtituloInput,
    dom.impresionPieInput,
    dom.impresionMostrarQrInput,
    dom.impresionQrTextoInput
  ].forEach(function (input) {
    input.addEventListener("input", actualizarVistaPreviaImpresion);
    input.addEventListener("change", actualizarVistaPreviaImpresion);
  });

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

  dom.rolForm.addEventListener(
    "submit",
    agregarRolPersonalizado
  );

  dom.listaPrecioForm.addEventListener(
    "submit",
    agregarListaPrecio
  );

  dom.rubroForm.addEventListener(
    "submit",
    agregarRubro
  );

  dom.cancelarEdicionRubroButton.addEventListener(
    "click",
    cancelarEdicionRubro
  );

  dom.buscarRubroInput.addEventListener(
    "input",
    renderizarRubros
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

  [
    dom.auditoriaFechaDesdeFiltro,
    dom.auditoriaFechaHastaFiltro,
    dom.auditoriaUsuarioFiltro,
    dom.auditoriaModuloFiltro,
    dom.auditoriaAccionFiltro
  ].forEach(function (input) {
    input.addEventListener("change", renderizarAuditoria);
  });

  dom.limpiarFiltrosAuditoriaButton.addEventListener(
    "click",
    limpiarFiltrosAuditoria
  );

  dom.limpiarAuditoriaButton.addEventListener(
    "click",
    limpiarAuditoria
  );

  dom.informesMesFiltro.addEventListener(
    "change",
    renderizarInformes
  );

  [
    dom.informesVendedorFiltro,
    dom.informesZonaFiltro,
    dom.informesClienteFiltro,
    dom.informesRubroFiltro,
    dom.informesEstadoFiltro
  ].forEach(function (input) {
    input.addEventListener("change", renderizarInformes);
  });

  dom.informesMesActualButton.addEventListener(
    "click",
    mostrarInformesMesActual
  );

  dom.limpiarFiltrosInformesButton.addEventListener(
    "click",
    limpiarFiltrosInformes
  );

  dom.imprimirInformeButton.addEventListener(
    "click",
    function () {
      window.print();
    }
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

      [
        "clientes",
        "productos",
        "pedidos",
        "configuracion",
        "usuarioActual",
        "usuariosSistema",
        "auditoria",
        "rubros",
        "listasPrecios",
        "zonas",
        "proveedores",
        "compras",
        "informesMensuales"
      ].forEach(function (nombreDeLista) {
        dataStore.borrarLista(nombreDeLista);
      });

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
      filtroEstadoPedidos = "PENDIENTE";
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

  dom.stockScannerInput.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      buscarProductoDesdeScannerStock();
    }
  );

  dom.stockScannerInput.addEventListener(
    "input",
    actualizarVistaScannerStock
  );

  dom.stockQuickActionButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      registrarMovimientoRapidoStock(boton.dataset.stockQuickAction);
    });
  });

  [
    dom.stockProductInput,
    dom.stockMovementTypeInput,
    dom.stockMovementQuantityInput
  ].forEach(function (input) {
    input.addEventListener("input", actualizarVistaMovimientoStock);
    input.addEventListener("change", actualizarVistaMovimientoStock);
  });

  dom.stockMovementForm.addEventListener(
    "submit",
    registrarMovimientoManualStock
  );

  [
    dom.priceUpdateRubroInput,
    dom.priceUpdateProveedorInput,
    dom.priceUpdateListaInput,
    dom.priceUpdatePercentInput
  ].forEach(function (input) {
    input.addEventListener("input", actualizarVistaActualizacionPrecios);
    input.addEventListener("change", actualizarVistaActualizacionPrecios);
  });

  dom.priceUpdateForm.addEventListener(
    "submit",
    aplicarActualizacionMasivaPrecios
  );

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

  dom.entregaPedidoModal.addEventListener(
    "click",
    function (e) {
      if (e.target === dom.entregaPedidoModal) {
        cerrarEntregaPedidoModal();
      }
    }
  );

  dom.cerrarEntregaPedido.addEventListener(
    "click",
    cerrarEntregaPedidoModal
  );

  dom.cancelarEntregaPedidoButton.addEventListener(
    "click",
    cerrarEntregaPedidoModal
  );

  dom.entregaPagoInput.addEventListener(
    "input",
    actualizarVistaEntregaPedido
  );

  dom.entregaSinPagoButton.addEventListener(
    "click",
    function () {
      dom.entregaPagoInput.value = 0;
      actualizarVistaEntregaPedido();
    }
  );

  dom.entregaPagoTotalButton.addEventListener(
    "click",
    function () {
      if (!pedidoEntregaPendiente) {
        return;
      }

      dom.entregaPagoInput.value = Number(pedidoEntregaPendiente.total) || 0;
      actualizarVistaEntregaPedido();
    }
  );

  dom.entregaPedidoForm.addEventListener(
    "submit",
    confirmarEntregaPedido
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
  cargarRolesPersonalizados();
  cargarUsuariosSistema();
  cargarUsuarioActual();
  cargarAuditoria();
  renderizarConfiguracion();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  renderizarListasPrecios();
  renderizarRubros();
  renderizarZonas();
  renderizarProveedores();
  renderizarCompras();
  renderizarMovimientosGenerales();
  aplicarPermisosDeUsuario();
  inicializarSidebar();
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
