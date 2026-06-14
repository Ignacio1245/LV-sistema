const CONFIG = {
  empresa: "",
  cuit: "",
  direccion: "",
  whatsapp: "",
  alias: "",
  cbu: "",
  impresionTitulo: "LV Sistema",
  impresionSubtitulo: "Distribuidora",
  impresionPie: "Gracias por su compra.",
  impresionMostrarQr: true,
  impresionQrTexto: "",
  stockMinimo: 10,
  permitirStockNegativo: false
};

function guardarConfiguracion() {
  dataStore.guardarLista(
    "configuracion",
    { ...CONFIG }
  );
}

function cargarConfiguracion() {
  const configuracionGuardada =
    dataStore.leerLista("configuracion");

  if (!configuracionGuardada) {
    return;
  }

  const datosDeConfiguracion =
    configuracionGuardada;

  Object.assign(
    CONFIG,
    datosDeConfiguracion
  );
}

function renderizarConfiguracion() {
  dom.empresaInput.value = CONFIG.empresa;
  dom.cuitInput.value = CONFIG.cuit;
  dom.whatsappInput.value = CONFIG.whatsapp;
  dom.aliasInput.value = CONFIG.alias;
  dom.stockMinimoInput.value = CONFIG.stockMinimo;
  renderizarConfiguracionImpresion();
}

function guardarFormularioConfiguracion(event) {
  event.preventDefault();

  CONFIG.empresa = dom.empresaInput.value.trim();
  CONFIG.cuit = dom.cuitInput.value.trim();
  CONFIG.whatsapp = dom.whatsappInput.value.trim();
  CONFIG.alias = dom.aliasInput.value.trim();
  CONFIG.stockMinimo = Number(dom.stockMinimoInput.value);

  guardarConfiguracion();
  renderizarProductos();
  renderizarCatalogoProductosPedido();

  alert("Configuracion guardada");
}

function renderizarConfiguracionImpresion() {
  if (!dom.impresionForm) {
    return;
  }

  dom.impresionTituloInput.value = CONFIG.impresionTitulo || "LV Sistema";
  dom.impresionSubtituloInput.value = CONFIG.impresionSubtitulo || "Distribuidora";
  dom.impresionPieInput.value = CONFIG.impresionPie || "";
  dom.impresionMostrarQrInput.value = CONFIG.impresionMostrarQr ? "SI" : "NO";
  dom.impresionQrTextoInput.value = CONFIG.impresionQrTexto || "";

  actualizarVistaPreviaImpresion();
}

function actualizarVistaPreviaImpresion() {
  if (!dom.impresionPreviewTitulo) {
    return;
  }

  dom.impresionPreviewTitulo.textContent =
    dom.impresionTituloInput.value.trim() || "LV Sistema";
  dom.impresionPreviewSubtitulo.textContent =
    dom.impresionSubtituloInput.value.trim() || "Distribuidora";

  const mostrarQr =
    dom.impresionMostrarQrInput.value === "SI";

  dom.impresionPreviewQr.textContent =
    mostrarQr ? "QR" : "Sin QR";
  dom.impresionPreviewQr.classList.toggle("muted-preview", !mostrarQr);
}

function guardarFormularioImpresion(event) {
  event.preventDefault();

  CONFIG.impresionTitulo =
    dom.impresionTituloInput.value.trim() || "LV Sistema";
  CONFIG.impresionSubtitulo =
    dom.impresionSubtituloInput.value.trim() || "Distribuidora";
  CONFIG.impresionPie =
    dom.impresionPieInput.value.trim();
  CONFIG.impresionMostrarQr =
    dom.impresionMostrarQrInput.value === "SI";
  CONFIG.impresionQrTexto =
    dom.impresionQrTextoInput.value.trim();

  guardarConfiguracion();
  actualizarVistaPreviaImpresion();

  registrarAuditoria(
    "Impresion",
    "Guardo configuracion",
    CONFIG.impresionTitulo
  );

  alert("Configuracion de impresion guardada");
}
