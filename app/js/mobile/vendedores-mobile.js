const telefonoVendedorDesdeUrl =
  new URLSearchParams(window.location.search).get("wsp") || "";

let clientesVendedor = [];
let productosVendedor = [];
let clienteSeleccionadoVendedor = null;
let itemsPedidoVendedor = [];
let usuarioSistemaVendedorActual = null;

const vendedorDom = {
  login: document.getElementById("vendedorLogin"),
  contenido: document.getElementById("vendedorContenido"),
  loginForm: document.getElementById("vendedorLoginForm"),
  loginEmail: document.getElementById("vendedorLoginEmail"),
  loginPassword: document.getElementById("vendedorLoginPassword"),
  loginEstado: document.getElementById("vendedorLoginEstado"),
  estadoConexion: document.getElementById("vendedorEstadoConexion"),
  botonSalir: document.getElementById("vendedorBotonSalir"),
  nombreVendedor: document.getElementById("vendedorNombre"),
  busquedaCliente: document.getElementById("vendedorBusquedaCliente"),
  resultadosClientes: document.getElementById("vendedorResultadosClientes"),
  clienteSeleccionado: document.getElementById("vendedorClienteSeleccionado"),
  busquedaProducto: document.getElementById("vendedorBusquedaProducto"),
  resultadosProductos: document.getElementById("vendedorResultadosProductos"),
  itemsPedido: document.getElementById("vendedorItemsPedido"),
  totalPedido: document.getElementById("vendedorTotalPedido"),
  formaPago: document.getElementById("vendedorFormaPago"),
  telefonoDestino: document.getElementById("vendedorTelefonoDestino"),
  observacion: document.getElementById("vendedorObservacion"),
  botonLimpiar: document.getElementById("vendedorBotonLimpiar"),
  botonCopiar: document.getElementById("vendedorBotonCopiar"),
  botonWhatsapp: document.getElementById("vendedorBotonWhatsapp")
};

function vendedorUsaSupabaseConAuth() {
  return typeof supabaseAuthDisponible === "function" && supabaseAuthDisponible();
}

function mostrarLoginVendedor(mensaje) {
  vendedorDom.login.classList.remove("vendedores-oculto");
  vendedorDom.contenido.classList.add("vendedores-oculto");
  vendedorDom.loginEstado.textContent =
    mensaje || "Usa el acceso que te dieron en el panel administrativo.";
}

function mostrarContenidoVendedor() {
  vendedorDom.login.classList.add("vendedores-oculto");
  vendedorDom.contenido.classList.remove("vendedores-oculto");
}

async function prepararSesionVendedor() {
  if (!vendedorUsaSupabaseConAuth()) {
    vendedorDom.botonSalir.classList.add("vendedores-oculto");
    mostrarContenidoVendedor();
    return true;
  }

  vendedorDom.botonSalir.classList.remove("vendedores-oculto");

  try {
    await cargarSesionSupabase();

    if (usuarioSupabaseAutenticado()) {
      vendedorDom.nombreVendedor.value =
        obtenerEmailSesionSupabase();
      mostrarContenidoVendedor();
      return true;
    }

    mostrarLoginVendedor();
    return false;
  } catch (error) {
    console.warn("No se pudo revisar la sesion del vendedor:", error);
    mostrarLoginVendedor("No se pudo conectar con Supabase. Revisa internet y volve a intentar.");
    return false;
  }
}

async function iniciarSesionVendedorDesdeFormulario(evento) {
  evento.preventDefault();

  if (!vendedorUsaSupabaseConAuth()) {
    mostrarContenidoVendedor();
    await cargarDatosVendedor();
    renderizarItemsPedidoVendedor();
    return;
  }

  try {
    vendedorDom.loginEstado.textContent = "Ingresando...";
    await iniciarSesionSupabase(
      vendedorDom.loginEmail.value.trim(),
      vendedorDom.loginPassword.value
    );

    vendedorDom.nombreVendedor.value =
      obtenerEmailSesionSupabase();
    mostrarContenidoVendedor();
    await cargarDatosVendedor();
    renderizarItemsPedidoVendedor();
  } catch (error) {
    vendedorDom.loginEstado.textContent =
      "No se pudo ingresar: " + (error.message || "error");
  }
}

async function cerrarSesionVendedor() {
  if (vendedorUsaSupabaseConAuth()) {
    await cerrarSesionSupabase();
  }

  limpiarPedidoVendedor();
  mostrarLoginVendedor("Sesion cerrada.");
}

function normalizarTextoVendedor(texto) {
  if (typeof normalizarTexto === "function") {
    return normalizarTexto(String(texto || ""));
  }

  return String(texto || "").trim().toLowerCase();
}

function formatearDineroVendedor(valor) {
  if (typeof formatearDinero === "function") {
    return formatearDinero(Number(valor) || 0);
  }

  return "$" + (Number(valor) || 0).toLocaleString("es-AR");
}

function obtenerStockVendedor(producto) {
  if (typeof obtenerStockTotalProducto === "function") {
    return obtenerStockTotalProducto(producto);
  }

  return Math.max(0, Number(producto.stock) || 0);
}

function productoDisponibleVendedor(producto) {
  const activo =
    typeof productoActivo === "function"
      ? productoActivo(producto)
      : producto.activo !== false;

  return activo && obtenerStockVendedor(producto) > 0;
}

function clienteActivoVendedor(cliente) {
  return cliente && cliente.activo !== false;
}

function clienteAsignadoAlVendedorActual(cliente) {
  if (!usuarioSistemaVendedorActual || usuarioSistemaVendedorActual.rol !== "VENDEDOR") {
    return true;
  }

  const vendedorAsignado =
    normalizarTextoVendedor(cliente.vendedorAsignado || "");
  const nombreVendedor =
    normalizarTextoVendedor(usuarioSistemaVendedorActual.nombre || "");
  const emailVendedor =
    normalizarTextoVendedor(usuarioSistemaVendedorActual.email || "");

  return vendedorAsignado !== "" &&
    (vendedorAsignado === nombreVendedor || vendedorAsignado === emailVendedor);
}

async function cargarUsuarioSistemaVendedorActual() {
  usuarioSistemaVendedorActual = null;

  if (!vendedorUsaSupabaseConAuth() || !usuarioSupabaseAutenticado()) {
    return;
  }

  const emailSesion =
    obtenerEmailSesionSupabase();

  usuarioSistemaVendedorActual =
    await obtenerUsuarioSistemaPorEmailSupabase(emailSesion);

  if (usuarioSistemaVendedorActual && usuarioSistemaVendedorActual.nombre) {
    vendedorDom.nombreVendedor.value =
      usuarioSistemaVendedorActual.nombre;
  }
}

async function cargarDatosVendedor() {
  try {
    if (typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado()) {
      await cargarUsuarioSistemaVendedorActual();

      const resultado =
        await Promise.all([
          obtenerClientesSupabase(),
          obtenerProductosSupabase()
        ]);

      clientesVendedor =
        resultado[0]
          .filter(clienteActivoVendedor)
          .filter(clienteAsignadoAlVendedorActual);
      productosVendedor =
        resultado[1].filter(productoDisponibleVendedor);
      vendedorDom.estadoConexion.textContent =
        "Datos desde Supabase";
      return;
    }
  } catch (error) {
    console.warn("No se pudieron cargar datos de Supabase para vendedores:", error);
  }

  clientesVendedor =
    Array.isArray(clientes) ? clientes.filter(clienteActivoVendedor) : [];
  productosVendedor =
    Array.isArray(productos) ? productos.filter(productoDisponibleVendedor) : [];
  vendedorDom.estadoConexion.textContent =
    "Modo prueba local";
}

function clienteCoincideBusqueda(cliente, busqueda) {
  const texto =
    normalizarTextoVendedor(busqueda);

  if (texto === "") {
    return false;
  }

  return [
    cliente.codigo,
    cliente.nombre,
    cliente.direccion,
    cliente.zona,
    cliente.telefono,
    cliente.nombreFantasia,
    cliente.razonSocial
  ].some(function (campo) {
    return normalizarTextoVendedor(campo).includes(texto);
  });
}

function productoCoincideBusquedaVendedor(producto, busqueda) {
  const texto =
    normalizarTextoVendedor(busqueda);

  if (texto === "") {
    return false;
  }

  return [
    producto.codigo,
    producto.codigoReal,
    producto.nombre,
    producto.marca,
    producto.rubro,
    producto.detalle
  ].some(function (campo) {
    return normalizarTextoVendedor(campo).includes(texto);
  });
}

function renderizarResultadosClientesVendedor() {
  const coincidencias =
    clientesVendedor
      .filter(function (cliente) {
        return clienteCoincideBusqueda(cliente, vendedorDom.busquedaCliente.value);
      })
      .slice(0, 8);

  vendedorDom.resultadosClientes.innerHTML = "";

  if (vendedorDom.busquedaCliente.value.trim() === "") {
    return;
  }

  if (coincidencias.length === 0) {
    vendedorDom.resultadosClientes.innerHTML =
      "<p class=\"vendedores-vacio\">No hay clientes con esa busqueda.</p>";
    return;
  }

  coincidencias.forEach(function (cliente) {
    const botonCliente = document.createElement("button");
    botonCliente.type = "button";
    botonCliente.className = "vendedores-opcion";
    botonCliente.innerHTML =
      "<strong>" + cliente.codigo + " - " + cliente.nombre + "</strong>" +
      "<span>" + (cliente.direccion || "Sin direccion") + " | " + (cliente.zona || "Sin zona") + "</span>";
    botonCliente.addEventListener("click", function () {
      seleccionarClienteVendedor(cliente);
    });
    vendedorDom.resultadosClientes.appendChild(botonCliente);
  });
}

function seleccionarClienteVendedor(cliente) {
  clienteSeleccionadoVendedor = cliente;
  vendedorDom.busquedaCliente.value = cliente.codigo + " - " + cliente.nombre;
  vendedorDom.resultadosClientes.innerHTML = "";
  vendedorDom.clienteSeleccionado.textContent =
    cliente.nombre + " | " + (cliente.direccion || "Sin direccion") + " | " + (cliente.zona || "Sin zona");
}

function renderizarResultadosProductosVendedor() {
  const coincidencias =
    productosVendedor
      .filter(function (producto) {
        return productoCoincideBusquedaVendedor(producto, vendedorDom.busquedaProducto.value);
      })
      .slice(0, 10);

  vendedorDom.resultadosProductos.innerHTML = "";

  if (vendedorDom.busquedaProducto.value.trim() === "") {
    return;
  }

  if (coincidencias.length === 0) {
    vendedorDom.resultadosProductos.innerHTML =
      "<p class=\"vendedores-vacio\">No hay productos con esa busqueda.</p>";
    return;
  }

  coincidencias.forEach(function (producto) {
    const botonProducto = document.createElement("button");
    botonProducto.type = "button";
    botonProducto.className = "vendedores-producto";
    botonProducto.innerHTML =
      "<strong>" + producto.codigo + " - " + producto.nombre + "</strong>" +
      "<span>" + (producto.marca || producto.rubro || "Sin rubro") + "</span>" +
      "<div class=\"vendedores-producto-meta\">" +
      "<span>Stock: " + obtenerStockVendedor(producto) + "</span>" +
      "<strong>" + formatearDineroVendedor(producto.precio) + "</strong>" +
      "</div>";
    botonProducto.addEventListener("click", function () {
      agregarProductoPedidoVendedor(producto);
    });
    vendedorDom.resultadosProductos.appendChild(botonProducto);
  });
}

function buscarItemPedidoVendedor(producto) {
  return itemsPedidoVendedor.find(function (itemPedido) {
    return itemPedido.producto.codigo === producto.codigo;
  });
}

function agregarProductoPedidoVendedor(producto) {
  const itemExistente =
    buscarItemPedidoVendedor(producto);
  const cantidadMaxima =
    Math.max(1, Math.floor(obtenerStockVendedor(producto)));

  if (itemExistente) {
    itemExistente.cantidad = Math.min(cantidadMaxima, itemExistente.cantidad + 1);
  } else {
    itemsPedidoVendedor.push({
      producto: producto,
      cantidad: 1
    });
  }

  vendedorDom.busquedaProducto.value = "";
  vendedorDom.resultadosProductos.innerHTML = "";
  renderizarItemsPedidoVendedor();
}

function cambiarCantidadPedidoVendedor(producto, cambio) {
  const itemExistente =
    buscarItemPedidoVendedor(producto);

  if (!itemExistente) {
    return;
  }

  itemExistente.cantidad += cambio;

  if (itemExistente.cantidad <= 0) {
    itemsPedidoVendedor = itemsPedidoVendedor.filter(function (itemPedido) {
      return itemPedido.producto.codigo !== producto.codigo;
    });
  } else {
    itemExistente.cantidad =
      Math.min(Math.max(1, Math.floor(obtenerStockVendedor(producto))), itemExistente.cantidad);
  }

  renderizarItemsPedidoVendedor();
}

function calcularTotalPedidoVendedor() {
  return itemsPedidoVendedor.reduce(function (total, itemPedido) {
    return total + itemPedido.cantidad * (Number(itemPedido.producto.precio) || 0);
  }, 0);
}

function renderizarItemsPedidoVendedor() {
  vendedorDom.itemsPedido.innerHTML = "";
  vendedorDom.totalPedido.textContent =
    formatearDineroVendedor(calcularTotalPedidoVendedor());

  if (itemsPedidoVendedor.length === 0) {
    vendedorDom.itemsPedido.innerHTML =
      "<p class=\"vendedores-vacio\">Todavia no hay productos en el pedido.</p>";
    return;
  }

  itemsPedidoVendedor.forEach(function (itemPedido) {
    const item = document.createElement("div");
    item.className = "vendedores-item";

    const nombreProducto = document.createElement("strong");
    nombreProducto.textContent = itemPedido.producto.nombre;

    const subtotalProducto = document.createElement("span");
    subtotalProducto.textContent =
      formatearDineroVendedor(itemPedido.cantidad * itemPedido.producto.precio);

    const controlCantidad = document.createElement("div");
    controlCantidad.className = "vendedores-control-cantidad";

    const botonRestar = document.createElement("button");
    botonRestar.type = "button";
    botonRestar.textContent = "-";
    botonRestar.addEventListener("click", function () {
      cambiarCantidadPedidoVendedor(itemPedido.producto, -1);
    });

    const cantidad = document.createElement("output");
    cantidad.textContent = itemPedido.cantidad;

    const botonSumar = document.createElement("button");
    botonSumar.type = "button";
    botonSumar.textContent = "+";
    botonSumar.addEventListener("click", function () {
      cambiarCantidadPedidoVendedor(itemPedido.producto, 1);
    });

    controlCantidad.appendChild(botonRestar);
    controlCantidad.appendChild(cantidad);
    controlCantidad.appendChild(botonSumar);

    item.appendChild(nombreProducto);
    item.appendChild(subtotalProducto);
    item.appendChild(controlCantidad);
    vendedorDom.itemsPedido.appendChild(item);
  });
}

function limpiarTelefonoVendedor(telefono) {
  return String(telefono || "").replace(/[^\d]/g, "");
}

function construirMensajePedidoVendedor() {
  const vendedor =
    vendedorDom.nombreVendedor.value.trim() || "Sin vendedor";
  const cliente =
    clienteSeleccionadoVendedor || {};
  const observacion =
    vendedorDom.observacion.value.trim();

  const lineasProductos =
    itemsPedidoVendedor.map(function (itemPedido) {
      const subtotal =
        itemPedido.cantidad * (Number(itemPedido.producto.precio) || 0);

      return "- " + itemPedido.cantidad + " x " +
        itemPedido.producto.nombre + " (" +
        formatearDineroVendedor(subtotal) + ")";
    });

  const lineasMensaje = [
    "Nuevo pedido movil",
    "",
    "Vendedor: " + vendedor,
    "Cliente: " + (cliente.nombre || "Sin cliente"),
    "Direccion: " + (cliente.direccion || "Sin direccion"),
    "Zona: " + (cliente.zona || "Sin zona"),
    "Forma de pago: " + vendedorDom.formaPago.value,
    "",
    lineasProductos.join("\n"),
    "",
    "Total estimado: " + formatearDineroVendedor(calcularTotalPedidoVendedor())
  ];

  if (observacion) {
    lineasMensaje.push("", "Observacion: " + observacion);
  }

  return lineasMensaje.join("\n");
}

function validarPedidoVendedor() {
  if (!clienteSeleccionadoVendedor) {
    alert("Selecciona un cliente antes de enviar.");
    vendedorDom.busquedaCliente.focus();
    return false;
  }

  if (itemsPedidoVendedor.length === 0) {
    alert("Agrega al menos un producto al pedido.");
    vendedorDom.busquedaProducto.focus();
    return false;
  }

  return true;
}

async function copiarPedidoVendedor() {
  if (!validarPedidoVendedor()) {
    return;
  }

  const mensajePedido =
    construirMensajePedidoVendedor();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(mensajePedido);
    alert("Pedido copiado.");
    return;
  }

  window.prompt("Copia el pedido:", mensajePedido);
}

function enviarPedidoWhatsappVendedor() {
  if (!validarPedidoVendedor()) {
    return;
  }

  const telefonoDestino =
    limpiarTelefonoVendedor(vendedorDom.telefonoDestino.value);

  if (!telefonoDestino) {
    alert("Carga el WhatsApp de la distribuidora.");
    vendedorDom.telefonoDestino.focus();
    return;
  }

  const enlaceWhatsapp =
    "https://wa.me/" + telefonoDestino + "?text=" +
    encodeURIComponent(construirMensajePedidoVendedor());

  window.open(enlaceWhatsapp, "_blank", "noopener");
}

function limpiarPedidoVendedor() {
  clienteSeleccionadoVendedor = null;
  itemsPedidoVendedor = [];
  vendedorDom.busquedaCliente.value = "";
  vendedorDom.busquedaProducto.value = "";
  vendedorDom.resultadosClientes.innerHTML = "";
  vendedorDom.resultadosProductos.innerHTML = "";
  vendedorDom.clienteSeleccionado.textContent = "Sin cliente seleccionado";
  vendedorDom.observacion.value = "";
  renderizarItemsPedidoVendedor();
}

async function iniciarVendedoresMobile() {
  vendedorDom.telefonoDestino.value =
    limpiarTelefonoVendedor(telefonoVendedorDesdeUrl);

  const puedeCargarDatos =
    await prepararSesionVendedor();

  if (!puedeCargarDatos) {
    return;
  }

  await cargarDatosVendedor();
  renderizarItemsPedidoVendedor();
}

vendedorDom.loginForm.addEventListener("submit", iniciarSesionVendedorDesdeFormulario);
vendedorDom.botonSalir.addEventListener("click", cerrarSesionVendedor);
vendedorDom.busquedaCliente.addEventListener("input", renderizarResultadosClientesVendedor);
vendedorDom.busquedaProducto.addEventListener("input", renderizarResultadosProductosVendedor);
vendedorDom.botonLimpiar.addEventListener("click", limpiarPedidoVendedor);
vendedorDom.botonCopiar.addEventListener("click", copiarPedidoVendedor);
vendedorDom.botonWhatsapp.addEventListener("click", enviarPedidoWhatsappVendedor);

iniciarVendedoresMobile();
