const CONFIG = {
  empresa: "",
  cuit: "",
  direccion: "",
  whatsapp: "",
  alias: "",
  cbu: "",
  stockMinimo: 10,
  permitirStockNegativo: false
};

function guardarConfiguracion() {
  localStorage.setItem(
    "configuracion",
    JSON.stringify(CONFIG)
  );
}

function cargarConfiguracion() {
  const configuracionGuardada = localStorage.getItem("configuracion");

  if (!configuracionGuardada) {
    return;
  }

  const datosDeConfiguracion = JSON.parse(configuracionGuardada);

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
