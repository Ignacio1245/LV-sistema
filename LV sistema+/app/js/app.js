const dom = {
  /*login*/
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginUserInput: document.querySelector("#loginUserInput"),
  loginPasswordInput: document.querySelector("#loginPasswordInput"),
  loginStatus: document.querySelector("#loginStatus"),

  /*menu*/
  pageTitle: document.querySelector("#pageTitle"),
  currentUserBadge: document.querySelector("#currentUserBadge"),
  sidebarToggleButton: document.querySelector("#sidebarToggleButton"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  menuLinks: document.querySelectorAll(".menu a[data-page]"),
  quickAccessButtons: document.querySelectorAll("[data-quick-page]"),
  quickActionButtons: document.querySelectorAll("[data-quick-action]"),
  dashboardPage: document.querySelector("#dashboardPage"),
  ventasPage: document.querySelector("#ventasPage"),
  clientesPage: document.querySelector("#clientesPage"),
  vendedoresPage: document.querySelector("#vendedoresPage"),
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
  respaldoPage: document.querySelector("#respaldoPage"),

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
  supabaseAuthStatus: document.querySelector("#supabaseAuthStatus"),
  supabaseSyncStatus: document.querySelector("#supabaseSyncStatus"),
  usuarioForm: document.querySelector("#usuarioForm"),
  usuarioEditandoCodigoInput: document.querySelector("#usuarioEditandoCodigoInput"),
  usuarioNombreInput: document.querySelector("#usuarioNombreInput"),
  usuarioEmailInput: document.querySelector("#usuarioEmailInput"),
  usuarioPasswordInput: document.querySelector("#usuarioPasswordInput"),
  usuarioNuevoRolInput: document.querySelector("#usuarioNuevoRolInput"),
  usuarioCancelarEdicionButton: document.querySelector("#usuarioCancelarEdicionButton"),
  usuarioSubmitButton: document.querySelector("#usuarioSubmitButton"),
  rolForm: document.querySelector("#rolForm"),
  rolNombreInput: document.querySelector("#rolNombreInput"),
  rolPermisosInputs: document.querySelectorAll("[data-role-permission]"),
  rolesSistemaTable: document.querySelector("#rolesSistemaTable"),
  rolCancelarEdicionButton: document.querySelector("#rolCancelarEdicionButton"),
  rolSubmitButton: document.querySelector("#rolSubmitButton"),
  usuariosSistemaTable: document.querySelector("#usuariosSistemaTable"),
  usuarioRolInput: document.querySelector("#usuarioRolInput"),
  logoutButton: document.querySelector("#logoutButton"),
  listaPrecioForm: document.querySelector("#listaPrecioForm"),
  listaPrecioNombreInput: document.querySelector("#listaPrecioNombreInput"),
  listaPrecioPorcentajeInput: document.querySelector("#listaPrecioPorcentajeInput"),
  listasPreciosTable: document.querySelector("#listasPreciosTable"),
  listasPreciosBloque: document.querySelector("#listasPreciosBloque"),
  baseModuleContent: document.querySelector("#listasPage .base-module-content"),
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
  zonaSubmitButton: document.querySelector("#zonaSubmitButton"),
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
  proveedorSubmitButton: document.querySelector("#proveedorSubmitButton"),
  cancelarEdicionProveedorButton: document.querySelector("#cancelarEdicionProveedorButton"),
  proveedorPagoForm: document.querySelector("#proveedorPagoForm"),
  proveedorPagoNombreInput: document.querySelector("#proveedorPagoNombreInput"),
  proveedorPagoImporteInput: document.querySelector("#proveedorPagoImporteInput"),
  proveedorPagoMedioInput: document.querySelector("#proveedorPagoMedioInput"),
  proveedorPagoMedioOtroLabel: document.querySelector("#proveedorPagoMedioOtroLabel"),
  proveedorPagoMedioOtroInput: document.querySelector("#proveedorPagoMedioOtroInput"),
  proveedorPagoComprobanteInput: document.querySelector("#proveedorPagoComprobanteInput"),
  proveedorPagoObservacionInput: document.querySelector("#proveedorPagoObservacionInput"),
  proveedorPagoPreview: document.querySelector("#proveedorPagoPreview"),
  buscarProveedorPagoInput: document.querySelector("#buscarProveedorPagoInput"),
  proveedoresPagosTable: document.querySelector("#proveedoresPagosTable"),
  proveedoresPagosTotalResumen: document.querySelector("#proveedoresPagosTotalResumen"),
  proveedoresPagosImporteResumen: document.querySelector("#proveedoresPagosImporteResumen"),
  proveedoresPagosProveedoresResumen: document.querySelector("#proveedoresPagosProveedoresResumen"),
  proveedorPagoFechaDesdeFiltro: document.querySelector("#proveedorPagoFechaDesdeFiltro"),
  proveedorPagoFechaHastaFiltro: document.querySelector("#proveedorPagoFechaHastaFiltro"),
  proveedorPagoMedioFiltro: document.querySelector("#proveedorPagoMedioFiltro"),
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
  stockAlertasTable: document.querySelector("#stockAlertasTable"),
  stockAlertasSinStockResumen: document.querySelector("#stockAlertasSinStockResumen"),
  stockAlertasBajoMinimoResumen: document.querySelector("#stockAlertasBajoMinimoResumen"),
  stockAlertasInactivosResumen: document.querySelector("#stockAlertasInactivosResumen"),
  stockAlertasRevisarResumen: document.querySelector("#stockAlertasRevisarResumen"),
  stockReposicionProductosResumen: document.querySelector("#stockReposicionProductosResumen"),
  stockReposicionUnidadesResumen: document.querySelector("#stockReposicionUnidadesResumen"),
  stockReposicionCostoResumen: document.querySelector("#stockReposicionCostoResumen"),
  stockReposicionSugeridaResumen: document.querySelector("#stockReposicionSugeridaResumen"),
  stockValorVentaResumen: document.querySelector("#stockValorVentaResumen"),
  stockValorCostoResumen: document.querySelector("#stockValorCostoResumen"),
  stockValorMargenResumen: document.querySelector("#stockValorMargenResumen"),
  stockValorUnidadesResumen: document.querySelector("#stockValorUnidadesResumen"),
  stockValorizadoRubrosResumen: document.querySelector("#stockValorizadoRubrosResumen"),
  buscarAuditoriaInput: document.querySelector("#buscarAuditoriaInput"),
  auditoriaFechaDesdeFiltro: document.querySelector("#auditoriaFechaDesdeFiltro"),
  auditoriaFechaHastaFiltro: document.querySelector("#auditoriaFechaHastaFiltro"),
  auditoriaUsuarioFiltro: document.querySelector("#auditoriaUsuarioFiltro"),
  auditoriaModuloFiltro: document.querySelector("#auditoriaModuloFiltro"),
  auditoriaAccionFiltro: document.querySelector("#auditoriaAccionFiltro"),
  limpiarFiltrosAuditoriaButton: document.querySelector("#limpiarFiltrosAuditoriaButton"),
  exportarAuditoriaButton: document.querySelector("#exportarAuditoriaButton"),
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
  exportarInformeButton: document.querySelector("#exportarInformeButton"),
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
  informeCobradoPeriodo: document.querySelector("#informeCobradoPeriodo"),
  informePendientePeriodo: document.querySelector("#informePendientePeriodo"),
  informePorcentajeCobrado: document.querySelector("#informePorcentajeCobrado"),
  informeCostoEstimado: document.querySelector("#informeCostoEstimado"),
  informeGananciaEstimada: document.querySelector("#informeGananciaEstimada"),
  informeMargenEstimado: document.querySelector("#informeMargenEstimado"),
  informeProductosSinCosto: document.querySelector("#informeProductosSinCosto"),
  informesMensualesTable: document.querySelector("#informesMensualesTable"),
  informeAnualCantidadActualTitulo: document.querySelector("#informeAnualCantidadActualTitulo"),
  informeAnualTotalActualTitulo: document.querySelector("#informeAnualTotalActualTitulo"),
  informeAnualCantidadAnteriorTitulo: document.querySelector("#informeAnualCantidadAnteriorTitulo"),
  informeAnualTotalAnteriorTitulo: document.querySelector("#informeAnualTotalAnteriorTitulo"),
  informeComparativoAnualTable: document.querySelector("#informeComparativoAnualTable"),
  informeVentasEstado: document.querySelector("#informeVentasEstado"),
  informeProductosVendidos: document.querySelector("#informeProductosVendidos"),
  informeVentasVendedor: document.querySelector("#informeVentasVendedor"),
  informeVentasZona: document.querySelector("#informeVentasZona"),
  informeVentasProveedor: document.querySelector("#informeVentasProveedor"),
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
  exportarPedidosButton: document.querySelector("#exportarPedidosButton"),
  pedidosResultadoContador: document.querySelector("#pedidosResultadoContador"),
  pedidoMenuNuevoButton: document.querySelector("#pedidoMenuNuevoButton"),
  pedidoMenuFilterButtons: document.querySelectorAll("[data-order-menu-filter]"),
  pedidoMenuPendingCount: document.querySelector("#pedidoMenuPendingCount"),
  pedidoMenuDraftCount: document.querySelector("#pedidoMenuDraftCount"),
  pedidoMenuAttendedCount: document.querySelector("#pedidoMenuAttendedCount"),
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
  sellerStatusFilterButtons: document.querySelectorAll("[data-seller-status-filter]"),
  buscarVendedorInput: document.querySelector("#buscarVendedorInput"),
  vendedoresTable: document.querySelector("#vendedoresTable"),
  vendedorForm: document.querySelector("#vendedorForm"),
  vendedorNombreInput: document.querySelector("#vendedorNombreInput"),
  vendedorTelefonoInput: document.querySelector("#vendedorTelefonoInput"),
  vendedorEmailInput: document.querySelector("#vendedorEmailInput"),
  vendedorZonaInput: document.querySelector("#vendedorZonaInput"),
  vendedorTipoInput: document.querySelector("#vendedorTipoInput"),
  vendedorSubmitButton: document.querySelector("#vendedorSubmitButton"),
  cancelarEdicionVendedorButton: document.querySelector("#cancelarEdicionVendedorButton"),
  vendedoresActivosResumen: document.querySelector("#vendedoresActivosResumen"),
  vendedoresClientesResumen: document.querySelector("#vendedoresClientesResumen"),
  vendedoresPedidosResumen: document.querySelector("#vendedoresPedidosResumen"),
  vendedoresZonasResumen: document.querySelector("#vendedoresZonasResumen"),
  vendedoresRendimientoResumen: document.querySelector("#vendedoresRendimientoResumen"),
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
  observacionPedidoInput: document.querySelector("#observacionPedidoInput"),
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
  clientSubmitButton: document.querySelector("#clientSubmitButton"),
  clientsTable: document.querySelector("#clientsTable"),
  clientesImportacionArchivo: document.querySelector("#clientesImportacionArchivo"),
  clientesImportacionTexto: document.querySelector("#clientesImportacionTexto"),
  clientesImportacionEstado: document.querySelector("#clientesImportacionEstado"),
  importarClientesButton: document.querySelector("#importarClientesButton"),
  exportarClientesButton: document.querySelector("#exportarClientesButton"),
  clientMenuButtons: document.querySelectorAll("[data-client-section]"),
  clientesListadoBloque: document.querySelector("#clientesListadoBloque"),
  clienteAltaBloque: document.querySelector("#clienteAltaBloque"),
  clientesImportacionBloque: document.querySelector("#clientesImportacionBloque"),
  clientesCuentaBloque: document.querySelector("#clientesCuentaBloque"),
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
  dashboardDatosIncompletosLista: document.querySelector("#dashboardDatosIncompletosLista"),
  dashboardCobranzaLista: document.querySelector("#dashboardCobranzaLista"),
  dashboardReposicionLista: document.querySelector("#dashboardReposicionLista"),
  porCobrar: document.querySelector("#porCobrar"),
  clientesConDeuda: document.querySelector("#clientesConDeuda"),
  buscarCuentaClienteInput: document.querySelector("#buscarCuentaClienteInput"),
  cuentaSaldoFiltro: document.querySelector("#cuentaSaldoFiltro"),
  cuentaClientesConDeudaCantidad: document.querySelector("#cuentaClientesConDeudaCantidad"),
  cuentaClientesConDeudaTotal: document.querySelector("#cuentaClientesConDeudaTotal"),
  cuentaTotalDeuda: document.querySelector("#cuentaTotalDeuda"),
  cuentaTotalAFavor: document.querySelector("#cuentaTotalAFavor"),
  exportarCuentaClientesButton: document.querySelector("#exportarCuentaClientesButton"),
  accountMenuButtons: document.querySelectorAll("[data-account-section]"),
  cuentaDeudoresBloque: document.querySelector("#cuentaDeudoresBloque"),
  registrarPagoForm: document.querySelector("#registrarPagoForm"),
  pagoClienteInput: document.querySelector("#pagoClienteInput"),
  pagoImporteInput: document.querySelector("#pagoImporteInput"),
  pagoClienteResultado: document.querySelector("#pagoClienteResultado"),
  registrarNotaCreditoForm: document.querySelector("#registrarNotaCreditoForm"),
  notaCreditoClienteInput: document.querySelector("#notaCreditoClienteInput"),
  notaCreditoPedidoInput: document.querySelector("#notaCreditoPedidoInput"),
  notaCreditoTipoInput: document.querySelector("#notaCreditoTipoInput"),
  notaCreditoImporteInput: document.querySelector("#notaCreditoImporteInput"),
  notaCreditoMotivoInput: document.querySelector("#notaCreditoMotivoInput"),
  notaCreditoResultado: document.querySelector("#notaCreditoResultado"),
  notaCreditoProductosTable: document.querySelector("#notaCreditoProductosTable"),

  /*Producto*/
  productForm: document.querySelector("#productForm"),
  productCodeInput: document.querySelector("#productCodeInput"),
  productBarcodeInput: document.querySelector("#productBarcodeInput"),
  productNameInput: document.querySelector("#productNameInput"),
  productPriceInput: document.querySelector("#productPriceInput"),
  productMarginList1Input: document.querySelector("#productMarginList1Input"),
  productPriceList2Input: document.querySelector("#productPriceList2Input"),
  productMarginList2Input: document.querySelector("#productMarginList2Input"),
  productPriceList3Input: document.querySelector("#productPriceList3Input"),
  productMarginList3Input: document.querySelector("#productMarginList3Input"),
  productPriceList4Input: document.querySelector("#productPriceList4Input"),
  productMarginList4Input: document.querySelector("#productMarginList4Input"),
  productPurchasePriceInput: document.querySelector("#productPurchasePriceInput"),
  productStockInput: document.querySelector("#productStockInput"),
  productMinimumStockInput: document.querySelector("#productMinimumStockInput"),
  productStockModeInput: document.querySelector("#productStockModeInput"),
  productUnitsPerBulkInput: document.querySelector("#productUnitsPerBulkInput"),
  productBulkStockInput: document.querySelector("#productBulkStockInput"),
  productUnitStockInput: document.querySelector("#productUnitStockInput"),
  productBulkSaleModeInput: document.querySelector("#productBulkSaleModeInput"),
  productWeightUnitInput: document.querySelector("#productWeightUnitInput"),
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
  productosTableHead: document.querySelector("#productosTableHead"),
  productosVistaInput: document.querySelector("#productosVistaInput"),
  productSubmitButton: document.querySelector("#productSubmitButton"),
  productosResultadoContador: document.querySelector("#productosResultadoContador"),
  productosPaginacion: document.querySelector("#productosPaginacion"),
  productosPaginaAnteriorButton: document.querySelector("#productosPaginaAnteriorButton"),
  productosPaginaSiguienteButton: document.querySelector("#productosPaginaSiguienteButton"),
  productosPaginacionInfo: document.querySelector("#productosPaginacionInfo"),
  productosImportacionArchivo: document.querySelector("#productosImportacionArchivo"),
  productosImportacionTexto: document.querySelector("#productosImportacionTexto"),
  productosImportacionEstado: document.querySelector("#productosImportacionEstado"),
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
  priceImportFileInput: document.querySelector("#priceImportFileInput"),
  priceImportButton: document.querySelector("#priceImportButton"),
  priceImportStatus: document.querySelector("#priceImportStatus"),
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
let seccionDatosBaseActual = "precios";
let vendedorEditando = null;

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

function crearFilaDashboard(textoPrincipal, textoDetalle) {
  return `
    <div class="dashboard-alert-row">
      <span>${escaparTextoHtml(textoPrincipal)}</span>
      <strong>${escaparTextoHtml(textoDetalle)}</strong>
    </div>
  `;
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
    return obtenerStockTotalProducto(primero) - obtenerStockTotalProducto(segundo);
  }).slice(0, 5);
}

function textoVacio(valor) {
  return !valor || String(valor).trim() === "" || String(valor).trim() === "-";
}

function obtenerDatosIncompletosParaDashboard() {
  const datosIncompletos = [];

  clientes.filter(clienteActivo).forEach(function (cliente) {
    const camposFaltantes = [];

    if (textoVacio(cliente.nombre)) {
      camposFaltantes.push("nombre");
    }

    if (textoVacio(cliente.direccion)) {
      camposFaltantes.push("direccion");
    }

    if (textoVacio(cliente.telefono)) {
      camposFaltantes.push("telefono");
    }

    if (textoVacio(cliente.zona)) {
      camposFaltantes.push("zona");
    }

    if (camposFaltantes.length > 0) {
      datosIncompletos.push({
        tipo: "Cliente",
        texto: (cliente.codigo || "-") + " - " + (cliente.nombre || "Sin nombre"),
        detalle: camposFaltantes.join(", ")
      });
    }
  });

  productos.filter(productoActivo).forEach(function (producto) {
    const camposFaltantes = [];

    if (textoVacio(producto.nombre)) {
      camposFaltantes.push("nombre");
    }

    if ((Number(producto.precio) || 0) <= 0) {
      camposFaltantes.push("precio");
    }

    if (textoVacio(producto.rubro) || producto.rubro === "Sin rubro") {
      camposFaltantes.push("rubro");
    }

    if (textoVacio(producto.proveedor) || producto.proveedor === "Sin proveedor") {
      camposFaltantes.push("proveedor");
    }

    if (camposFaltantes.length > 0) {
      datosIncompletos.push({
        tipo: "Producto",
        texto: (producto.codigo || "-") + " - " + (producto.nombre || "Sin nombre"),
        detalle: camposFaltantes.join(", ")
      });
    }
  });

  proveedores.filter(proveedorActivo).forEach(function (proveedor) {
    const camposFaltantes = [];

    if (textoVacio(proveedor.nombre)) {
      camposFaltantes.push("nombre");
    }

    if (textoVacio(proveedor.telefono)) {
      camposFaltantes.push("telefono");
    }

    if (textoVacio(proveedor.contacto)) {
      camposFaltantes.push("contacto");
    }

    if (camposFaltantes.length > 0) {
      datosIncompletos.push({
        tipo: "Proveedor",
        texto: proveedor.nombre || "Sin nombre",
        detalle: camposFaltantes.join(", ")
      });
    }
  });

  if (rubros.filter(rubroActivo).length === 0) {
    datosIncompletos.push({
      tipo: "Datos base",
      texto: "Rubros",
      detalle: "sin rubros activos"
    });
  }

  if (zonas.filter(zonaActiva).length === 0) {
    datosIncompletos.push({
      tipo: "Datos base",
      texto: "Zonas",
      detalle: "sin zonas activas"
    });
  }

  return datosIncompletos.slice(0, 6);
}

function obtenerListasParaRestablecerSistema() {
  return [
    "clientes",
    "productos",
    "pedidos",
    "zonas",
    "rubros",
    "proveedores",
    "proveedorPagos",
    "vendedoresSistema",
    "compras",
    "listasPrecios",
    "informesMensuales",
    "auditoria",
    "configuracion",
    "usuariosSistema",
    "rolesPersonalizados",
    "usuarioActual"
  ];
}

function puedeRestablecerDatosSistema() {
  return tienePermiso("configuracion") ||
    (usuarioActual && usuarioActual.email === "admin@local");
}

function restablecerDatosLocalesSistema() {
  if (!puedeRestablecerDatosSistema()) {
    alert("Tu rol no tiene permiso para restablecer datos.");
    return;
  }

  const primeraConfirmacion =
    confirm(
      "Esto borra la copia local de clientes, productos, pedidos, cuenta corriente, proveedores, compras, auditoria, usuarios y configuracion. Continuar?"
    );

  if (!primeraConfirmacion) {
    return;
  }

  const segundaConfirmacion =
    confirm(
      "Confirmacion final: despues de borrar vas a tener que volver a cargar o importar los datos. Borrar ahora?"
    );

  if (!segundaConfirmacion) {
    return;
  }

  obtenerListasParaRestablecerSistema().forEach(function (nombreDeLista) {
    dataStore.borrarLista(nombreDeLista);
  });

  location.reload();
}

function obtenerClientesDeudoresParaDashboard() {
  return clientes.filter(function (cliente) {
    return clienteActivo(cliente) && Number(cliente.saldo) > 0;
  }).sort(function (primero, segundo) {
    return Number(segundo.saldo) - Number(primero.saldo);
  }).slice(0, 5);
}

function obtenerUltimosMovimientosDashboard() {
  if (!Array.isArray(auditoria)) {
    return [];
  }

  return auditoria.slice(0, 8);
}

function renderizarCentroControlDashboard() {
  const pedidosPendientes = obtenerPedidosPendientesParaDashboard();
  const productosCriticos = obtenerProductosCriticosParaDashboard();
  const datosIncompletos = obtenerDatosIncompletosParaDashboard();
  const clientesDeudores = obtenerClientesDeudoresParaDashboard();
  const ultimosMovimientos = obtenerUltimosMovimientosDashboard();
  const alertasTotales =
    pedidosPendientes.length + productosCriticos.length + datosIncompletos.length + clientesDeudores.length;

  dom.dashboardPrioridadResumen.textContent =
    alertasTotales === 0
      ? "Sin alertas importantes"
      : alertasTotales + " prioridades para revisar";

  renderizarListaDashboard(
    dom.dashboardPedidosPendientesLista,
    pedidosPendientes,
    function (pedido) {
      const clientePedido = pedido.cliente ? pedido.cliente.nombre : "Sin cliente";

      return crearFilaDashboard(
        "Pedido #" + pedido.id + " | " + clientePedido,
        formatearDinero(pedido.total)
      );
    },
    "No hay pedidos pendientes."
  );

  renderizarListaDashboard(
    dom.dashboardStockCriticoLista,
    productosCriticos,
    function (producto) {
      return crearFilaDashboard(
        producto.codigo + " - " + producto.nombre,
        "Stock " + formatearStockProducto(producto)
      );
    },
    "No hay productos criticos."
  );

  renderizarListaDashboard(
    dom.dashboardDatosIncompletosLista,
    datosIncompletos,
    function (datoIncompleto) {
      return crearFilaDashboard(
        datoIncompleto.tipo + ": " + datoIncompleto.texto,
        datoIncompleto.detalle
      );
    },
    "No hay datos incompletos."
  );

  renderizarListaDashboard(
    dom.dashboardCobranzaLista,
    clientesDeudores,
    function (cliente) {
      return crearFilaDashboard(
        cliente.codigo + " - " + cliente.nombre,
        formatearDinero(cliente.saldo)
      );
    },
    "No hay saldos pendientes."
  );

  renderizarListaDashboard(
    dom.dashboardReposicionLista,
    ultimosMovimientos,
    function (movimiento) {
      return crearFilaDashboard(
        movimiento.fecha + " " + movimiento.hora + " | " + movimiento.modulo,
        movimiento.accion
      );
    },
    "Sin movimientos registrados."
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
      return total + (Number(cliente.saldo) || 0);
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
  if (dom.productosMovimientosBloque) {
    dom.productosMovimientosBloque.classList.toggle("hidden", true);
  }

  if (seccionActual === "precios") {
    renderizarPanelPreciosProductos();
  }

  if (seccionActual === "alta") {
    actualizarVistaStockProductoFormulario();
    dom.productCodeInput.focus();
  }

  if (seccionActual === "importar") {
    dom.productosImportacionTexto.focus();
  }

  if (seccionActual === "movimientos" && dom.buscarMovimientoProductoInput) {
    renderizarMovimientosProductos();
    dom.buscarMovimientoProductoInput.focus();
  }
}

function mostrarSeccionCliente(seccion) {
  const seccionActual = seccion || "listado";
  const mostrarListado = seccionActual === "listado";

  if (
    dom.clientesCuentaBloque &&
    dom.clientesPage &&
    dom.clientesCuentaBloque.parentElement !== document.querySelector(".client-module-content")
  ) {
    document.querySelector(".client-module-content").appendChild(dom.clientesCuentaBloque);
  }

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
  dom.clientesCuentaBloque.classList.toggle("hidden", seccionActual !== "cuenta");

  if (seccionActual === "alta") {
    dom.clientCodeInput.focus();
  }

  if (seccionActual === "importar") {
    dom.clientesImportacionTexto.focus();
  }

  if (seccionActual === "cuenta") {
    mostrarSeccionCuenta("deudores");
    renderizarClientesConDeuda();
    dom.buscarCuentaClienteInput.focus();
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
  dom.registrarNotaCreditoForm.classList.toggle("hidden", seccionActual !== "nota");

  if (seccionActual === "pago") {
    actualizarVistaPagoCliente();
    dom.pagoClienteInput.focus();
  }

  if (seccionActual === "nota") {
    actualizarVistaNotaCreditoCliente();
    dom.notaCreditoClienteInput.focus();
  }
}

function moverStockRapidoAMovimientos() {
  const destino =
    document.querySelector("#stockRapidoMovimientosDestino");

  if (!destino || destino.dataset.preparado === "true" || !dom.stockScannerInput) {
    return;
  }

  destino.dataset.preparado = "true";
}

function mostrarSeccionMovimientos(seccion) {
  const seccionActual =
    seccion || "resumen";
  const resumenBloque =
    document.querySelector("#movimientosResumenBloque");
  const stockBloque =
    document.querySelector("#movimientosStockRapidoBloque");
  const alertasBloque =
    document.querySelector("#movimientosAlertasBloque");
  const valorizadoBloque =
    document.querySelector("#movimientosValorizadoBloque");

  document.querySelectorAll("[data-movement-section]").forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.movementSection === seccionActual
    );
  });

  if (resumenBloque) {
    resumenBloque.classList.toggle("hidden", seccionActual !== "resumen");
  }

  if (stockBloque) {
    stockBloque.classList.toggle("hidden", seccionActual !== "stock");
  }

  if (alertasBloque) {
    alertasBloque.classList.toggle("hidden", seccionActual !== "alertas");
  }

  if (valorizadoBloque) {
    valorizadoBloque.classList.toggle("hidden", seccionActual !== "valorizado");
  }

  if (seccionActual === "stock") {
    moverStockRapidoAMovimientos();
    dom.stockScannerInput.focus();
    actualizarVistaScannerStock();
  } else if (seccionActual === "alertas") {
    renderizarAlertasStock();
  } else if (seccionActual === "valorizado") {
    renderizarStockValorizado();
  } else {
    renderizarMovimientosGenerales();
  }
}

function prepararSeccionesInformes() {
  document.querySelectorAll("#informesPage .reports-summary").forEach(function (bloque) {
    bloque.dataset.reportPanel = "resumen";
  });

  document.querySelectorAll("#informesPage .report-card").forEach(function (tarjeta) {
    const titulo =
      normalizarTexto(
        tarjeta.querySelector(".report-card-header h4")
          ? tarjeta.querySelector(".report-card-header h4").textContent
          : ""
      );

    if (titulo.includes("mensuales")) {
      tarjeta.dataset.reportPanel = "resumen";
      return;
    }

    if (titulo.includes("comparativo")) {
      tarjeta.dataset.reportPanel = "comparativo";
      return;
    }

    if (titulo.includes("deuda")) {
      tarjeta.dataset.reportPanel = "clientes";
      return;
    }

    if (titulo.includes("stock")) {
      tarjeta.dataset.reportPanel = "stock";
      return;
    }

    if (titulo.includes("detalle")) {
      tarjeta.dataset.reportPanel = "detalle";
      return;
    }

    tarjeta.dataset.reportPanel = "ventas";
  });
}

function mostrarSeccionInformes(seccion) {
  const seccionActual =
    seccion || "resumen";

  prepararSeccionesInformes();

  document.querySelectorAll("[data-report-section]").forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.reportSection === seccionActual
    );
  });

  document.querySelectorAll("#informesPage [data-report-panel]").forEach(function (bloque) {
    bloque.classList.toggle(
      "hidden",
      bloque.dataset.reportPanel !== seccionActual
    );
  });
}

function mostrarSeccionConfiguracion(seccion) {
  const seccionActual =
    seccion || "empresa";
  const bloqueAccesos =
    document.querySelector("#configuracionPage .settings-section");

  document.querySelectorAll("[data-config-section]").forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.configSection === seccionActual
    );
  });

  document.querySelectorAll("[data-config-panel]").forEach(function (bloque) {
    bloque.classList.toggle(
      "hidden",
      bloque.dataset.configPanel !== seccionActual
    );
  });

  if (bloqueAccesos) {
    bloqueAccesos.classList.toggle("hidden", seccionActual === "empresa");
  }

  if (seccionActual === "roles" && typeof renderizarRolesSistema === "function") {
    renderizarRolesSistema();
  }

  if (seccionActual === "accesos") {
    renderizarUsuariosSistema();
  }
}

let filtroEstadoVendedores = "activos";

function mostrarSeccionVendedores(seccion) {
  const seccionActual =
    seccion || "listado";

  document.querySelectorAll("[data-seller-section]").forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.sellerSection === seccionActual
    );
  });

  document.querySelector("#vendedoresListadoBloque").classList.toggle("hidden", seccionActual !== "listado");
  document.querySelector("#vendedoresZonasBloque").classList.toggle("hidden", seccionActual !== "zonas");
  document.querySelector("#vendedoresRendimientoBloque").classList.toggle("hidden", seccionActual !== "rendimiento");

  renderizarVendedores();
}

function contarClientesVendedor(nombreVendedor) {
  return clientes.filter(function (cliente) {
    return normalizarTexto(cliente.vendedorAsignado || "") === normalizarTexto(nombreVendedor);
  }).length;
}

function obtenerPedidosMesVendedor(nombreVendedor) {
  const mesActual =
    new Date().toISOString().slice(0, 7);

  return pedidos.filter(function (pedido) {
    const fechaPedido =
      obtenerFechaPedidoParaFiltro(pedido.fecha);
    const coincideMes =
      fechaPedido && fechaPedido.slice(0, 7) === mesActual;
    const coincideVendedor =
      normalizarTexto(pedido.vendedor || "") === normalizarTexto(nombreVendedor);

    return coincideMes && coincideVendedor;
  });
}

function obtenerSiguienteCodigoVendedor() {
  if (!Array.isArray(vendedoresSistema) || vendedoresSistema.length === 0) {
    return 1;
  }

  const codigos =
    vendedoresSistema.map(function (vendedor) {
      return Number(vendedor.codigo) || 0;
    });

  return Math.max.apply(null, codigos) + 1;
}

function obtenerVendedoresComerciales() {
  if (!Array.isArray(vendedoresSistema)) {
    vendedoresSistema = [];
  }

  return vendedoresSistema;
}

function renderizarOpcionesZonasVendedor() {
  if (!dom.vendedorZonaInput) {
    return;
  }

  const zonaSeleccionada =
    dom.vendedorZonaInput.value;

  dom.vendedorZonaInput.innerHTML =
    `<option value="">Sin zona fija</option>` +
    zonas.filter(zonaActiva).map(function (zona) {
      return `<option value="${zona.nombre}">${zona.nombre}</option>`;
    }).join("");

  dom.vendedorZonaInput.value =
    zonas.some(function (zona) {
      return zonaActiva(zona) && zona.nombre === zonaSeleccionada;
    })
      ? zonaSeleccionada
      : "";
}

function limpiarFormularioVendedor() {
  vendedorEditando = null;
  dom.vendedorForm.reset();
  dom.vendedorSubmitButton.textContent = "Agregar vendedor";
  dom.cancelarEdicionVendedorButton.classList.add("hidden");
}

function guardarVendedorDesdeFormulario(event) {
  event.preventDefault();

  const nombre =
    dom.vendedorNombreInput.value.trim();

  if (nombre === "") {
    alert("El nombre del vendedor es obligatorio.");
    return;
  }

  const existe =
    vendedoresSistema.some(function (vendedor) {
      return normalizarTexto(vendedor.nombre) === normalizarTexto(nombre) &&
        vendedor.codigo !== vendedorEditando;
    });

  if (existe) {
    alert("Ya existe un vendedor con ese nombre.");
    return;
  }

  if (vendedorEditando !== null) {
    const vendedor =
      vendedoresSistema.find(function (vendedorGuardado) {
        return vendedorGuardado.codigo === vendedorEditando;
      });

    if (!vendedor) {
      limpiarFormularioVendedor();
      return;
    }

    const nombreAnterior =
      vendedor.nombre;

    vendedor.nombre = nombre;
    vendedor.telefono = dom.vendedorTelefonoInput.value.trim() || "-";
    vendedor.email = dom.vendedorEmailInput.value.trim();
    vendedor.zona = dom.vendedorZonaInput.value;
    vendedor.tipo = dom.vendedorTipoInput.value || "Calle";

    clientes.forEach(function (cliente) {
      if (normalizarTexto(cliente.vendedorAsignado || "") === normalizarTexto(nombreAnterior)) {
        cliente.vendedorAsignado = vendedor.nombre;
      }
    });

    pedidos.forEach(function (pedido) {
      if (normalizarTexto(pedido.vendedor || "") === normalizarTexto(nombreAnterior)) {
        pedido.vendedor = vendedor.nombre;
      }
    });

    guardarVendedoresSistema();
    guardarClientes();
    guardarPedidos();
    guardarVendedorOperacionSupabase(vendedor);
    limpiarFormularioVendedor();
    renderizarVendedores();
    renderizarOpcionesVendedoresCliente();

    registrarAuditoria(
      "Vendedores",
      "Edito vendedor",
      nombreAnterior + " > " + vendedor.nombre
    );
    return;
  }

  const nuevoVendedor = {
    codigo: obtenerSiguienteCodigoVendedor(),
    nombre: nombre,
    telefono: dom.vendedorTelefonoInput.value.trim() || "-",
    email: dom.vendedorEmailInput.value.trim(),
    zona: dom.vendedorZonaInput.value,
    tipo: dom.vendedorTipoInput.value || "Calle",
    activo: true
  };

  vendedoresSistema.push(nuevoVendedor);
  guardarVendedoresSistema();
  guardarVendedorOperacionSupabase(nuevoVendedor);
  limpiarFormularioVendedor();
  renderizarVendedores();
  renderizarOpcionesVendedoresCliente();

  registrarAuditoria(
    "Vendedores",
    "Creo vendedor",
    nuevoVendedor.codigo + " - " + nuevoVendedor.nombre
  );
}

function editarVendedor(codigo) {
  const vendedor =
    vendedoresSistema.find(function (vendedorGuardado) {
      return vendedorGuardado.codigo === codigo;
    });

  if (!vendedor) {
    alert("Este vendedor viene de usuarios de acceso. Cree un vendedor comercial para editarlo aca.");
    return;
  }

  vendedorEditando = codigo;
  dom.vendedorNombreInput.value = vendedor.nombre;
  dom.vendedorTelefonoInput.value = vendedor.telefono || "";
  dom.vendedorEmailInput.value = vendedor.email || "";
  Array.from(dom.vendedorZonaInput.options).forEach(function (option) {
    option.selected = Array.isArray(vendedor.zonas)
      ? vendedor.zonas.includes(option.value)
      : String(vendedor.zona || "").split(",").map(function (zona) { return zona.trim(); }).includes(option.value);
  });
  dom.vendedorTipoInput.value = vendedor.tipo || "Calle";
  dom.vendedorSubmitButton.textContent = "Guardar vendedor";
  dom.cancelarEdicionVendedorButton.classList.remove("hidden");
  dom.vendedorNombreInput.focus();
}

function alternarEstadoVendedor(codigo) {
  const vendedor =
    vendedoresSistema.find(function (vendedorGuardado) {
      return vendedorGuardado.codigo === codigo;
    });

  if (!vendedor) {
    return;
  }

  vendedor.activo = !vendedor.activo;
  guardarVendedoresSistema();
  guardarVendedorOperacionSupabase(vendedor);
  renderizarVendedores();
  renderizarOpcionesVendedoresCliente();

  registrarAuditoria(
    "Vendedores",
    vendedor.activo ? "Activo vendedor" : "Inactivo vendedor",
    vendedor.codigo + " - " + vendedor.nombre
  );
}

function eliminarVendedor(codigo) {
  const vendedor =
    vendedoresSistema.find(function (vendedorGuardado) {
      return vendedorGuardado.codigo === codigo;
    });

  if (!vendedor) {
    return;
  }

  const tieneClientes =
    contarClientesVendedor(vendedor.nombre) > 0;

  if (tieneClientes) {
    alert("No se puede eliminar un vendedor con clientes asignados. Primero cambia esos clientes.");
    return;
  }

  const confirmar =
    confirm("Eliminar vendedor " + vendedor.nombre + "?");

  if (!confirmar) {
    return;
  }

  vendedoresSistema =
    vendedoresSistema.filter(function (vendedorGuardado) {
      return vendedorGuardado.codigo !== codigo;
    });

  guardarVendedoresSistema();
  eliminarVendedorOperacionSupabase(vendedor);
  renderizarVendedores();
  renderizarOpcionesVendedoresCliente();

  registrarAuditoria(
    "Vendedores",
    "Elimino vendedor",
    vendedor.codigo + " - " + vendedor.nombre
  );
}

function obtenerVendedoresFiltrados() {
  const texto =
    normalizarTexto(dom.buscarVendedorInput ? dom.buscarVendedorInput.value : "");

  return obtenerVendedoresComerciales().filter(function (usuario) {
    const coincideEstado =
      filtroEstadoVendedores === "todos" ||
      (filtroEstadoVendedores === "activos" && usuario.activo) ||
      (filtroEstadoVendedores === "inactivos" && !usuario.activo);
    const textoUsuario =
      [usuario.codigo, usuario.nombre, usuario.email, usuario.tipo, usuario.zona].join(" ");
    const coincideTexto =
      texto === "" || normalizarTexto(textoUsuario).includes(texto);

    return coincideEstado && coincideTexto;
  });
}

function renderizarVendedores() {
  if (!dom.vendedoresTable) {
    return;
  }

  const vendedores =
    obtenerVendedoresFiltrados();
  const vendedoresComerciales =
    obtenerVendedoresComerciales();
  const activos =
    vendedoresComerciales.filter(function (usuario) {
      return usuario.activo;
    }).length;
  const clientesAsignados =
    vendedoresComerciales.reduce(function (total, usuario) {
      return total + contarClientesVendedor(usuario.nombre);
    }, 0);
  const pedidosMes =
    vendedoresComerciales.reduce(function (total, usuario) {
      return total + obtenerPedidosMesVendedor(usuario.nombre).length;
    }, 0);

  dom.vendedoresActivosResumen.textContent = activos;
  dom.vendedoresClientesResumen.textContent = clientesAsignados;
  dom.vendedoresPedidosResumen.textContent = pedidosMes;

  if (vendedores.length === 0) {
    dom.vendedoresTable.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">No hay vendedores para mostrar.</td>
      </tr>
    `;
  } else {
    dom.vendedoresTable.innerHTML =
      vendedores.map(function (usuario) {
        const pedidosDelMes =
          obtenerPedidosMesVendedor(usuario.nombre);
        const estadoClase =
          usuario.activo ? "stock-ok" : "stock-inactive";

        return `
          <tr>
            <td>${usuario.codigo}</td>
            <td><strong>${usuario.nombre}</strong></td>
            <td>${usuario.email || "-"}</td>
            <td>${usuario.tipo || "-"}</td>
            <td>${Array.isArray(usuario.zonas) && usuario.zonas.length > 0 ? usuario.zonas.join(", ") : (usuario.zona || "-")}</td>
            <td>${contarClientesVendedor(usuario.nombre)}</td>
            <td>${pedidosDelMes.length}</td>
            <td><span class="stock-pill ${estadoClase}">${usuario.activo ? "Activo" : "Inactivo"}</span></td>
            <td>
              <button class="btn btn-secondary" onclick="editarVendedor(${usuario.codigo})">
                Editar
              </button>
              <button class="btn btn-secondary" onclick="alternarEstadoVendedor(${usuario.codigo})">
                ${usuario.activo ? "Inac" : "Activar"}
              </button>
              <button class="btn btn-danger" onclick="eliminarVendedor(${usuario.codigo})">
                Borrar
              </button>
            </td>
          </tr>
        `;
      }).join("");
  }

  if (dom.vendedoresZonasResumen) {
    dom.vendedoresZonasResumen.innerHTML =
      vendedoresComerciales.map(function (usuario) {
        const zonasAsignadas =
          clientes.filter(function (cliente) {
            return normalizarTexto(cliente.vendedorAsignado || "") === normalizarTexto(usuario.nombre);
          }).reduce(function (zonasAcumuladas, cliente) {
            const zona =
              cliente.zona || "Sin zona";
            zonasAcumuladas[zona] = (zonasAcumuladas[zona] || 0) + 1;
            return zonasAcumuladas;
          }, {});
        const detalle =
          Object.keys(zonasAsignadas).length > 0
            ? Object.keys(zonasAsignadas).map(function (zona) {
              return zona + ": " + zonasAsignadas[zona];
            }).join(" | ")
            : "Sin zonas asignadas";

        return `
          <div class="report-row">
            <span>${usuario.nombre}</span>
            <strong>${detalle}</strong>
          </div>
        `;
      }).join("");
  }

  if (dom.vendedoresRendimientoResumen) {
    dom.vendedoresRendimientoResumen.innerHTML =
      vendedoresComerciales.map(function (usuario) {
        const pedidosDelMes =
          obtenerPedidosMesVendedor(usuario.nombre);
        const total =
          pedidosDelMes.reduce(function (suma, pedido) {
            return suma + (Number(pedido.total) || 0);
          }, 0);

        return `
          <div class="report-row">
            <span>${usuario.nombre}</span>
            <strong>${pedidosDelMes.length} pedidos | ${formatearDinero(total)}</strong>
          </div>
        `;
      }).join("");
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
  const esInicioSesion =
    nombreAccion === "Iniciar sesion Supabase";
  const esAccionLocal =
    nombreAccion === "Validar datos locales";

  if (
    !esInicioSesion &&
    !esAccionLocal &&
    typeof usuarioSupabaseAutenticado === "function" &&
    !usuarioSupabaseAutenticado()
  ) {
    actualizarEstadoSincronizacionSupabase(
      "Inicia sesion Supabase antes de cargar o subir datos.",
      "sync-error"
    );
    actualizarVistaAuthSupabase();
    return;
  }

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

    if (resultado && resultado.administracion && resultado.administracion.errores.length > 0) {
      actualizarEstadoSincronizacionSupabase(
        nombreAccion + " con errores. " + resultado.administracion.errores.join(" | "),
        "sync-error"
      );
      return;
    }

    if (resultado && Array.isArray(resultado.errores) && resultado.errores.length > 0) {
      actualizarEstadoSincronizacionSupabase(
        nombreAccion + " con errores. " + resultado.errores.join(" | "),
        "sync-error"
      );
      return;
    }

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
  const resultado = {
    datosBase: await cargarDatosBaseDesdeSupabase(),
    administracion: await cargarAdministracionDesdeSupabase(),
    clientes: await cargarClientesDesdeSupabase(),
    productos: await cargarProductosDesdeSupabase(),
    pedidos: await cargarPedidosDesdeSupabase()
  };

  resultado.errores = []
    .concat(obtenerErroresResultadoSupabase(resultado.datosBase))
    .concat(obtenerErroresResultadoSupabase(resultado.administracion))
    .concat(obtenerErroresResultadoSupabase(resultado.clientes))
    .concat(obtenerErroresResultadoSupabase(resultado.productos))
    .concat(obtenerErroresResultadoSupabase(resultado.pedidos));

  return resultado;
}

async function sincronizarClientesYProductosConSupabase() {
  const validacion =
    validarDatosLocalesParaSupabase();

  if (validacion.errores.length > 0) {
    throw new Error("No se puede subir: " + validacion.errores.join(" | "));
  }

  const clientesCantidad =
    await sincronizarClientesLocalesConSupabase();
  const productosCantidad =
    await sincronizarProductosLocalesConSupabase();

  return {
    clientes: clientesCantidad,
    productos: productosCantidad
  };
}

async function sincronizarPedidosValidadosConSupabase() {
  const validacion =
    validarDatosLocalesParaSupabase();

  if (validacion.errores.length > 0) {
    throw new Error("No se puede subir pedidos: " + validacion.errores.join(" | "));
  }

  return await sincronizarPedidosLocalesConSupabase();
}

async function sincronizarCuentaValidaConSupabase() {
  const validacion =
    validarDatosLocalesParaSupabase();

  if (validacion.errores.length > 0) {
    throw new Error("No se puede subir cuenta corriente: " + validacion.errores.join(" | "));
  }

  return await sincronizarCuentaCorrienteLocalConSupabase();
}

function obtenerDuplicadosPorCodigo(lista) {
  const vistos = {};
  const duplicados = [];

  lista.forEach(function (item) {
    const codigo =
      String(item.codigo);

    if (vistos[codigo]) {
      duplicados.push(codigo);
      return;
    }

    vistos[codigo] = true;
  });

  return [...new Set(duplicados)];
}

function validarDatosLocalesParaSupabase() {
  const errores = [];
  const advertencias = [];

  const productosDuplicados =
    obtenerDuplicadosPorCodigo(productos);
  const clientesDuplicados =
    obtenerDuplicadosPorCodigo(clientes);

  if (productosDuplicados.length > 0) {
    errores.push("Productos con codigo repetido: " + productosDuplicados.slice(0, 10).join(", "));
  }

  if (clientesDuplicados.length > 0) {
    errores.push("Clientes con codigo repetido: " + clientesDuplicados.slice(0, 10).join(", "));
  }

  const productosCodigoInvalido =
    productos.filter(function (producto) {
      return !Number.isInteger(Number(producto.codigo)) || Number(producto.codigo) <= 0;
    }).length;
  const clientesCodigoInvalido =
    clientes.filter(function (cliente) {
      return !Number.isInteger(Number(cliente.codigo)) || Number(cliente.codigo) <= 0;
    }).length;

  if (productosCodigoInvalido > 0) {
    errores.push("Productos con codigo invalido/no positivo: " + productosCodigoInvalido);
  }

  if (clientesCodigoInvalido > 0) {
    errores.push("Clientes con codigo invalido/no positivo: " + clientesCodigoInvalido);
  }

  const productosSinNombre =
    productos.filter(function (producto) {
      return !producto.nombre || producto.nombre.trim() === "";
    }).length;
  const productosPrecioCero =
    productos.filter(function (producto) {
      return Number(producto.precio) <= 0;
    }).length;
  const productosStockCero =
    productos.filter(function (producto) {
      return obtenerStockTotalProducto(producto) <= 0;
    }).length;
  const productosSinRubro =
    productos.filter(function (producto) {
      return !producto.rubro || producto.rubro === "Sin rubro";
    }).length;
  const productosSinListaUno =
    productos.filter(function (producto) {
      const preciosLista =
        obtenerPreciosListaProducto(producto);

      return Number(preciosLista["Lista 1"]) <= 0;
    }).length;
  const productosConStockDecimal =
    productos.filter(function (producto) {
      const stock =
        Number(producto.stock) || 0;
      const stockMinimo =
        Number(producto.stockMinimo) || 0;

      return !Number.isInteger(stock) || !Number.isInteger(stockMinimo);
    }).length;

  if (productosSinNombre > 0) {
    errores.push("Productos sin nombre: " + productosSinNombre);
  }

  if (productosPrecioCero > 0) {
    advertencias.push("Productos con precio 0: " + productosPrecioCero);
  }

  if (productosStockCero > 0) {
    advertencias.push("Productos con stock 0: " + productosStockCero);
  }

  if (productosSinRubro > 0) {
    advertencias.push("Productos sin rubro real: " + productosSinRubro);
  }

  if (productosSinListaUno > 0) {
    advertencias.push("Productos sin precio Lista 1: " + productosSinListaUno);
  }

  if (productosConStockDecimal > 0) {
    advertencias.push(
      "Productos con stock decimal: " + productosConStockDecimal +
      ". Supabase debe tener schema-ajustes-js.sql actualizado."
    );
  }

  const clientesSinNombre =
    clientes.filter(function (cliente) {
      return !cliente.nombre || cliente.nombre.trim() === "";
    }).length;
  const clientesSinZona =
    clientes.filter(function (cliente) {
      return !cliente.zona || cliente.zona === "Sin zona";
    }).length;
  const clientesConSaldo =
    clientes.filter(function (cliente) {
      return Number(cliente.saldo) !== 0;
    }).length;

  if (clientesSinNombre > 0) {
    errores.push("Clientes sin nombre: " + clientesSinNombre);
  }

  if (clientesSinZona > 0) {
    advertencias.push("Clientes sin zona real: " + clientesSinZona);
  }

  if (clientesConSaldo > 0) {
    advertencias.push("Clientes con saldo inicial/cuenta: " + clientesConSaldo);
  }

  const pedidosSinCliente =
    pedidos.filter(function (pedido) {
      return !pedido.cliente;
    }).length;
  const pedidosSinItems =
    pedidos.filter(function (pedido) {
      return !Array.isArray(pedido.items) || pedido.items.length === 0;
    }).length;
  const pedidosConItemsIncompletos =
    pedidos.filter(function (pedido) {
      return Array.isArray(pedido.items) && pedido.items.some(function (item) {
        return !item.producto ||
          item.producto.codigo === undefined ||
          Number(item.cantidad) <= 0 ||
          Number(obtenerPrecioUnitarioItemPedido(item)) < 0;
      });
    }).length;
  const pedidosNumeroDuplicado =
    obtenerDuplicadosPorCodigo(
      pedidos.map(function (pedido) {
        return {
          codigo: Number(pedido.numero || pedido.id) || 0
        };
      })
    );
  const pedidosNumeroInvalido =
    pedidos.filter(function (pedido) {
      return !Number.isInteger(Number(pedido.numero || pedido.id)) || Number(pedido.numero || pedido.id) <= 0;
    }).length;
  const pedidosConCantidadDecimal =
    pedidos.filter(function (pedido) {
      return Array.isArray(pedido.items) && pedido.items.some(function (item) {
        const cantidad =
          Number(item.cantidad) || 0;

        return !Number.isInteger(cantidad);
      });
    }).length;
  const clientesSaldoInvalido =
    clientes.filter(function (cliente) {
      return !Number.isFinite(Number(cliente.saldo));
    }).length;

  if (pedidosSinCliente > 0) {
    errores.push("Pedidos sin cliente: " + pedidosSinCliente);
  }

  if (pedidosSinItems > 0) {
    errores.push("Pedidos sin productos: " + pedidosSinItems);
  }

  if (pedidosConItemsIncompletos > 0) {
    errores.push("Pedidos con productos incompletos: " + pedidosConItemsIncompletos);
  }

  if (pedidosNumeroDuplicado.length > 0) {
    errores.push("Pedidos con numero repetido: " + pedidosNumeroDuplicado.slice(0, 10).join(", "));
  }

  if (pedidosNumeroInvalido > 0) {
    errores.push("Pedidos con numero invalido/no positivo: " + pedidosNumeroInvalido);
  }

  if (pedidosConCantidadDecimal > 0) {
    advertencias.push(
      "Pedidos con cantidades decimales: " + pedidosConCantidadDecimal +
      ". Supabase debe tener pedido_items.cantidad como numeric."
    );
  }

  if (clientesSaldoInvalido > 0) {
    errores.push("Clientes con saldo invalido: " + clientesSaldoInvalido);
  }

  return {
    productos: productos.length,
    clientes: clientes.length,
    pedidos: pedidos.length,
    zonas: zonas.length,
    rubros: rubros.length,
    proveedores: proveedores.length,
    listasPrecios: listasPrecios.length,
    errores: errores,
    advertencias: advertencias
  };
}

function validarDatosLocalesDesdePanel() {
  const validacion =
    validarDatosLocalesParaSupabase();
  const partes = [
    "Productos: " + validacion.productos,
    "Clientes: " + validacion.clientes,
    "Pedidos: " + validacion.pedidos,
    "Zonas: " + validacion.zonas,
    "Rubros: " + validacion.rubros,
    "Proveedores: " + validacion.proveedores,
    "Listas: " + validacion.listasPrecios
  ];

  if (validacion.errores.length > 0) {
    partes.push("Errores: " + validacion.errores.join(" | "));
  }

  if (validacion.advertencias.length > 0) {
    partes.push("Advertencias: " + validacion.advertencias.join(" | "));
  }

  return {
    resumen: partes.join(" | "),
    errores: validacion.errores,
    advertencias: validacion.advertencias
  };
}

function mantenerSincronizacionManualSupabase() {
  desactivarSincronizacionAutomaticaSupabase();
}

function mostrarSeccionDatosBase(seccion) {
  const seccionActual = seccion || "precios";
  seccionDatosBaseActual = seccionActual;

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
  if (!tienePermiso("ventas")) {
    alert("Tu rol no tiene permiso para crear pedidos.");
    return;
  }

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
    vendedores: "configuracion",
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
    respaldo: "configuracion",
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

function obtenerModuloDesdeAccionRapida(accion) {
  const mapaDeAcciones = {
    "nuevo-pedido": "ventas",
    "nota-credito": "cuentaCorriente"
  };

  return mapaDeAcciones[accion] || null;
}

function usuarioPuedeEjecutarAccionRapida(accion) {
  const modulo =
    obtenerModuloDesdeAccionRapida(accion);

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

  dom.quickAccessButtons.forEach(function (button) {
    const pagina =
      button.dataset.quickPage;

    button.classList.toggle("hidden", !usuarioPuedeVerPagina(pagina));
  });

  dom.quickActionButtons.forEach(function (button) {
    const accion =
      button.dataset.quickAction;

    button.classList.toggle("hidden", !usuarioPuedeEjecutarAccionRapida(accion));
  });

  dom.resetDataButton.style.display =
    puedeRestablecerDatosSistema() ? "inline-flex" : "none";
}

function mostrarPagina(nombre) {
  if (typeof sistemaAutenticado === "function" && !sistemaAutenticado()) {
    if (typeof mostrarLoginSistema === "function") {
      mostrarLoginSistema();
    }
    return;
  }

  const paginaSolicitada =
    nombre;

  if (nombre === "rubros" || nombre === "zonas") {
    seccionDatosBaseActual = nombre;
    nombre = "listas";
  }

  const seccionClienteInicial =
    nombre === "cuenta" ? "cuenta" : null;

  if (!usuarioPuedeVerPagina(paginaSolicitada)) {
    alert("Tu rol no tiene permiso para ver este modulo.");
    nombre = "dashboard";
  }

  const tituloPagina =
    paginaSolicitada;

  if (nombre === "cuenta") {
    nombre = "clientes";
  }

  const titulos = {
    dashboard: "Escritorio",
    ventas: "Pedidos",
    clientes: "Clientes",
    vendedores: "Vendedores",
    listas: "Datos base",
    rubros: "Rubros",
    zonas: "Zonas",
    proveedores: "Proveedores",
    productos: "Productos",
    cuenta: "Cuenta Corriente",
    compras: "Compras",
    movimientos: "Movimientos",
    configuracion: "Configuracion",
    impresion: "Impresion",
    respaldo: "Respaldo",
    auditoria: "Auditoria",
    informes: "Informes"
  };

  dom.pageTitle.textContent = titulos[tituloPagina] || titulos[nombre];
  dom.dashboardPage.classList.add("hidden");
  dom.ventasPage.classList.add("hidden");
  dom.clientesPage.classList.add("hidden");
  dom.vendedoresPage.classList.add("hidden");
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
  dom.respaldoPage.classList.add("hidden");
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
    mostrarSeccionCliente(seccionClienteInicial || "listado");
  }

  if (nombre === "vendedores") {
    dom.vendedoresPage.classList.remove("hidden");
    renderizarOpcionesZonasVendedor();
    mostrarSeccionVendedores("listado");
  }

  if (nombre === "listas") {
    dom.listasPage.classList.remove("hidden");
    mostrarSeccionDatosBase(seccionDatosBaseActual);
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
    mostrarSeccionProveedores("listado");
  }

  if (nombre === "productos") {
    dom.productosPage.classList.remove("hidden");
  }

  if (nombre === "compras") {
    dom.comprasPage.classList.remove("hidden");
    renderizarCompras();
    actualizarVistaCompra();
  }

  if (nombre === "movimientos") {
    dom.movimientosPage.classList.remove("hidden");
    moverStockRapidoAMovimientos();
    mostrarSeccionMovimientos("resumen");
  }

  if (nombre === "configuracion") {
    dom.configuracionPage.classList.remove("hidden");
    mostrarSeccionConfiguracion("empresa");
  }

  if (nombre === "impresion") {
    dom.impresionPage.classList.remove("hidden");
    renderizarConfiguracionImpresion();
  }

  if (nombre === "respaldo") {
    dom.respaldoPage.classList.remove("hidden");
    if (typeof renderizarRespaldo === "function") {
      renderizarRespaldo();
    }
  }

  if (nombre === "auditoria") {
    dom.auditoriaPage.classList.remove("hidden");
    renderizarAuditoria();
  }

  if (nombre === "informes") {
    dom.informesPage.classList.remove("hidden");
    renderizarInformes();
    mostrarSeccionInformes("resumen");
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

  dom.quickActionButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      if (button.dataset.quickAction === "nuevo-pedido") {
        abrirNuevoPedidoDesdeMenu();
      }

      if (button.dataset.quickAction === "nota-credito") {
        if (!tienePermiso("cuentaCorriente")) {
          alert("Tu rol no tiene permiso para registrar notas de credito.");
          return;
        }

        mostrarPagina("cuenta");
        mostrarSeccionCuenta("nota");
      }

      actualizarEstadoSidebar(true);

    });

  });

  dom.baseDataMenuButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionDatosBase(boton.dataset.baseSection);
    });
  });

  document.querySelectorAll("[data-config-section]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionConfiguracion(boton.dataset.configSection);
    });
  });

  document.querySelectorAll("[data-provider-section]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionProveedores(boton.dataset.providerSection);
    });
  });

  document.querySelectorAll("[data-seller-section]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionVendedores(boton.dataset.sellerSection);
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

  if (dom.loginForm) {
    dom.loginForm.addEventListener(
      "submit",
      iniciarSesionSistemaDesdeFormulario
    );
  }

  if (dom.logoutButton) {
    dom.logoutButton.addEventListener(
      "click",
      cerrarSesionSistema
    );
  }

  dom.usuarioForm.addEventListener(
    "submit",
    agregarUsuarioSistema
  );

  if (dom.usuarioCancelarEdicionButton) {
    dom.usuarioCancelarEdicionButton.addEventListener(
      "click",
      cancelarEdicionUsuarioSistema
    );
  }

  dom.rolForm.addEventListener(
    "submit",
    agregarRolPersonalizado
  );

  if (dom.rolCancelarEdicionButton) {
    dom.rolCancelarEdicionButton.addEventListener(
      "click",
      cancelarEdicionRolSistema
    );
  }

  if (dom.vendedorForm) {
    dom.vendedorForm.addEventListener(
      "submit",
      guardarVendedorDesdeFormulario
    );
  }

  if (dom.cancelarEdicionVendedorButton) {
    dom.cancelarEdicionVendedorButton.addEventListener(
      "click",
      limpiarFormularioVendedor
    );
  }

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

  dom.cancelarEdicionProveedorButton.addEventListener(
    "click",
    limpiarFormularioProveedor
  );

  if (dom.proveedorPagoForm) {
    dom.proveedorPagoForm.addEventListener(
      "submit",
      registrarPagoProveedor
    );
  }

  [
    dom.proveedorPagoNombreInput,
    dom.proveedorPagoImporteInput,
    dom.proveedorPagoMedioInput,
    dom.proveedorPagoMedioOtroInput
  ].forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", actualizarVistaPagoProveedor);
    input.addEventListener("change", actualizarVistaPagoProveedor);
  });

  dom.buscarProveedorInput.addEventListener(
    "input",
    renderizarProveedores
  );

  if (dom.buscarProveedorPagoInput) {
    dom.buscarProveedorPagoInput.addEventListener(
      "input",
      renderizarPagosProveedores
    );
  }

  if (dom.buscarVendedorInput) {
    dom.buscarVendedorInput.addEventListener(
      "input",
      renderizarVendedores
    );
  }

  dom.sellerStatusFilterButtons.forEach(function (boton) {
    boton.addEventListener("click", function () {
      filtroEstadoVendedores = boton.dataset.sellerStatusFilter;
      dom.sellerStatusFilterButtons.forEach(function (botonInterno) {
        botonInterno.classList.toggle("active", botonInterno === boton);
      });
      renderizarVendedores();
    });
  });

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

  document.querySelectorAll("[data-movement-section]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionMovimientos(boton.dataset.movementSection);
    });
  });

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

  dom.exportarAuditoriaButton.addEventListener(
    "click",
    exportarAuditoriaCsv
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

  dom.exportarInformeButton.addEventListener(
    "click",
    exportarInformeCsv
  );

  document.querySelectorAll("[data-report-section]").forEach(function (boton) {
    boton.addEventListener("click", function () {
      mostrarSeccionInformes(boton.dataset.reportSection);
    });
  });

  dom.resetDataButton.addEventListener(
    "click",
    restablecerDatosLocalesSistema
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
    function () {
      reiniciarPaginaProductos();
      renderizarProductos();
    }
  );

  if (dom.buscarMovimientoProductoInput) {
    dom.buscarMovimientoProductoInput.addEventListener(
      "input",
      renderizarMovimientosProductos
    );
  }

  dom.buscarClienteTabla.addEventListener(
    "input",
    renderizarClientes
  );

  if (dom.exportarClientesButton) {
    dom.exportarClientesButton.addEventListener(
      "click",
      exportarClientesCsv
    );
  }

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

  if (dom.cuentaSaldoFiltro) {
    dom.cuentaSaldoFiltro.addEventListener(
      "change",
      renderizarClientesConDeuda
    );
  }

  if (dom.exportarCuentaClientesButton) {
    dom.exportarCuentaClientesButton.addEventListener(
      "click",
      exportarCuentaClientesCsv
    );
  }

  dom.pagoClienteInput.addEventListener(
    "input",
    actualizarVistaPagoCliente
  );

  dom.registrarPagoForm.addEventListener(
    "submit",
    registrarPagoDesdeFormulario
  );

  dom.notaCreditoClienteInput.addEventListener(
    "input",
    actualizarVistaNotaCreditoCliente
  );

  dom.notaCreditoPedidoInput.addEventListener(
    "input",
    actualizarVistaNotaCreditoCliente
  );

  dom.notaCreditoTipoInput.addEventListener(
    "change",
    actualizarVistaNotaCreditoCliente
  );

  dom.notaCreditoMotivoInput.addEventListener(
    "input",
    actualizarVistaNotaCreditoCliente
  );

  dom.registrarNotaCreditoForm.addEventListener(
    "submit",
    registrarNotaCreditoDesdeFormulario
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

  if (dom.exportarPedidosButton) {
    dom.exportarPedidosButton.addEventListener(
      "click",
      exportarPedidosCsv
    );
  }

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

  if (dom.productosVistaInput) {
    dom.productosVistaInput.addEventListener("change", renderizarProductos);
  }

  dom.productosPaginaAnteriorButton.addEventListener(
    "click",
    function () {
      cambiarPaginaProductos(-1);
    }
  );

  dom.productosPaginaSiguienteButton.addEventListener(
    "click",
    function () {
      cambiarPaginaProductos(1);
    }
  );

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

  dom.priceImportButton.addEventListener(
    "click",
    importarPreciosDesdeArchivo
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

      if (productoSeleccionado) {
        actualizarControlCantidadPorProducto(productoSeleccionado);
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

  [
    dom.productPurchasePriceInput,
    dom.productMarginList1Input,
    dom.productMarginList2Input,
    dom.productMarginList3Input,
    dom.productMarginList4Input
  ].forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", actualizarPreciosProductoPorMargenes);
  });

  [
    dom.productStockModeInput,
    dom.productUnitsPerBulkInput,
    dom.productBulkStockInput,
    dom.productUnitStockInput
  ].forEach(function (input) {
    if (!input) {
      return;
    }

    input.addEventListener("input", actualizarVistaStockProductoFormulario);
    input.addEventListener("change", actualizarVistaStockProductoFormulario);
  });

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

  dom.observacionPedidoInput.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      agregarObservacionPedidoActual();
    }
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

async function iniciarApp() {

  cargarDatos();

  cargarConfiguracion();
  cargarRolesPersonalizados();
  cargarUsuariosSistema();
  cargarUsuarioActual();
  cargarAuditoria();

  let haySesionSupabase =
    false;

  try {
    await cargarSesionSupabase();
    haySesionSupabase = usuarioSupabaseAutenticado();
  } catch (error) {
    console.warn("No se pudo revisar la sesion de Supabase:", error);
    actualizarEstadoSincronizacionSupabase(
      "No se pudo revisar la sesion Supabase. Revisa conexion o credenciales.",
      "sync-error"
    );
  }

  if (haySesionSupabase) {
    mostrarLoginSistema("Por seguridad volve a ingresar la clave para usar el sistema.");
    actualizarEstadoSincronizacionSupabase(
      "Sesion Supabase detectada. Inicia sesion para cargar datos y activar guardado automatico.",
      "sync-working"
    );
  } else {
    actualizarEstadoSincronizacionSupabase(
      "Inicia sesion Supabase para activar la sincronizacion automatica.",
      "sync-working"
    );
  }

  renderizarConfiguracion();
  actualizarVistaAuthSupabase();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  if (typeof renderizarRolesSistema === "function") {
    renderizarRolesSistema();
  }
  renderizarListasPrecios();
  renderizarRubros();
  renderizarZonas();
  renderizarProveedores();
  renderizarPagosProveedores();
  renderizarCompras();
  renderizarMovimientosGenerales();
  renderizarAlertasStock();
  renderizarStockValorizado();
  aplicarPermisosDeUsuario();
  inicializarSidebar();
  inicializarRespaldo();
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
