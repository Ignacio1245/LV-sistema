// Bandeja de catalogo: usa los mismos pedidos, permisos y acciones de Ventas.
let filtroOrigenPedidos = "TODOS";

function esPedidoCatalogo(pedido) {
  return Boolean(pedido && (pedido.origen === "catalogo" ||
    (Array.isArray(pedido.observaciones) && pedido.observaciones.includes("Pedido desde catalogo publico"))));
}

function obtenerDatosEntregaCatalogo(pedido) {
  const notas = Array.isArray(pedido.observaciones) ? pedido.observaciones : [];
  const buscar = prefijos => {
    const nota = notas.find(n => typeof n === "string" && prefijos.some(p => n.startsWith(p)));
    return nota ? nota.slice(nota.indexOf(":") + 1).trim() : "";
  };
  return {
    direccion: buscar(["Direccion de entrega:", "Direccion:"]) || (pedido.cliente && pedido.cliente.direccion) || "Sin direccion",
    telefono: buscar(["Telefono de contacto:", "Telefono:"]) || (pedido.cliente && pedido.cliente.telefono) || "",
    comentario: buscar(["Comentario:"])
  };
}

function obtenerEtiquetaCobroPedido(pedido) {
  if (pedido.estadoCobro === "COBRADO") return "Cobrado";
  if (pedido.estadoCobro === "CUENTA_CORRIENTE" || Number(pedido.saldoPendiente) > 0) return "Cuenta corriente";
  if (Number(pedido.importePagado) > 0) return "Pago parcial";
  return "Sin cobro registrado";
}

function abrirBandejaCatalogo(estado) {
  if (!tienePermiso("ventas")) return;
  filtroOrigenPedidos = "CATALOGO";
  filtroEstadoPedidos = estado || "PENDIENTE";
  if (dom.buscarPedidoTabla) dom.buscarPedidoTabla.value = "";
  if (dom.pedidoFechaFiltro) dom.pedidoFechaFiltro.value = "";
  mostrarPagina("ventas");
  renderizarPedidos();
}

function salirBandejaCatalogo() {
  filtroOrigenPedidos = "TODOS";
  filtroEstadoPedidos = "PENDIENTE";
  if (dom.buscarPedidoTabla) dom.buscarPedidoTabla.value = "";
  if (dom.pedidoFechaFiltro) dom.pedidoFechaFiltro.value = "";
  renderizarPedidos();
}

function actualizarBandejaCatalogo() {
  const lista = pedidos.filter(esPedidoCatalogo);
  const pendientes = lista.filter(p => p.estado === "PENDIENTE").length;
  const activo = filtroOrigenPedidos === "CATALOGO";
  const aviso = document.getElementById("catalogoPedidosAviso");
  if (aviso) {
    aviso.hidden = pendientes === 0 || !tienePermiso("ventas");
    const texto = "Catalogo · " + pendientes + " por preparar";
    if (aviso.textContent !== texto) aviso.textContent = texto;
  }
  const contador = document.getElementById("catalogoPedidosCount");
  if (contador) contador.textContent = pendientes;
  const menu = document.getElementById("catalogoPedidosMenu");
  if (menu) {
    menu.classList.toggle("active", activo);
    menu.setAttribute("aria-pressed", String(activo));
  }
  const encabezado = document.getElementById("catalogoBandejaHeader");
  if (encabezado) encabezado.hidden = !activo;
  const volver = document.getElementById("catalogoVolverPedidos");
  if (volver) volver.hidden = !activo;
  document.querySelectorAll("#ventasPage .orders-summary-grid, #ventasPage [data-order-menu-filter], #pedidoMenuNuevoButton")
    .forEach(elemento => { elemento.hidden = activo; });
  document.querySelectorAll("[data-catalogo-estado]").forEach(boton => {
    const estado = boton.dataset.catalogoEstado;
    boton.classList.toggle("active", estado === filtroEstadoPedidos);
    boton.setAttribute("aria-pressed", String(estado === filtroEstadoPedidos));
    const total = estado === "TODOS" ? lista.length : lista.filter(p => p.estado === estado).length;
    const numero = boton.querySelector("strong");
    if (numero) numero.textContent = total;
  });
}

document.getElementById("catalogoPedidosMenu").addEventListener("click", () => abrirBandejaCatalogo());
document.getElementById("catalogoPedidosAviso").addEventListener("click", () => abrirBandejaCatalogo());
document.getElementById("catalogoVolverPedidos").addEventListener("click", salirBandejaCatalogo);
document.querySelectorAll("[data-catalogo-estado]").forEach(boton => {
  boton.addEventListener("click", () => {
    filtroEstadoPedidos = boton.dataset.catalogoEstado;
    renderizarPedidos();
  });
});
