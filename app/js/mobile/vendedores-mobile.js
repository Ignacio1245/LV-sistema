const telefonoVendedorDesdeUrl =
  new URLSearchParams(window.location.search).get("wsp") || "";
const CLAVE_TELEFONO_VENDEDOR = "lv_vendedores_telefono_destino";

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
  botonWhatsapp: document.getElementById("vendedorBotonWhatsapp"),
  estadoEnvio: document.getElementById("vendedorEstadoEnvio")
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

function obtenerTextoFormaPagoVendedor(formaPago) {
  const textosFormaPago = {
    CUENTA_CORRIENTE: "Cuenta corriente",
    EFECTIVO: "Contado",
    TRANSFERENCIA: "Transferencia"
  };

  return textosFormaPago[formaPago] || "Cuenta corriente";
}

function escaparTextoVendedor(valor) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function obtenerStockVendedor(producto) {
  if (typeof obtenerStockTotalProducto === "function") {
    return obtenerStockTotalProducto(producto);
  }

  return Math.max(0, Number(producto.stock) || 0);
}

function obtenerListaPrecioVendedorActual() {
  return clienteSeleccionadoVendedor && clienteSeleccionadoVendedor.listaPrecios
    ? clienteSeleccionadoVendedor.listaPrecios
    : "Lista 1";
}

function obtenerPrecioProductoVendedor(producto) {
  if (typeof obtenerPrecioProductoPorLista === "function") {
    return obtenerPrecioProductoPorLista(producto, obtenerListaPrecioVendedorActual());
  }

  return Number(producto.precio) || 0;
}

function productoEsPesoVendedor(producto) {
  return typeof productoEsPeso === "function" && productoEsPeso(producto);
}

function obtenerIncrementoCantidadVendedor(producto) {
  return productoEsPesoVendedor(producto) ? 0.1 : 1;
}

function obtenerCantidadMaximaVendedor(producto) {
  const stock =
    obtenerStockVendedor(producto);

  return productoEsPesoVendedor(producto)
    ? Math.max(0, stock)
    : Math.max(0, Math.floor(stock));
}

function normalizarCantidadVendedor(producto, cantidad) {
  const cantidadNumerica =
    Number(cantidad);

  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
    return 0;
  }

  if (productoEsPesoVendedor(producto)) {
    return Math.round(cantidadNumerica * 1000) / 1000;
  }

  return Math.floor(cantidadNumerica);
}

function formatearCantidadVendedor(producto, cantidad) {
  if (productoEsPesoVendedor(producto)) {
    return (Number(cantidad) || 0).toLocaleString("es-AR", {
      maximumFractionDigits: 3
    }) + " " + (producto.unidadPeso || "kg");
  }

  return String(Math.floor(Number(cantidad) || 0));
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
      "<strong>" + escaparTextoVendedor(cliente.codigo) + " - " + escaparTextoVendedor(cliente.nombre) + "</strong>" +
      "<span>" + escaparTextoVendedor(cliente.direccion || "Sin direccion") + " | " + escaparTextoVendedor(cliente.zona || "Sin zona") + "</span>";
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
    const tarjetaProducto = document.createElement("article");
    tarjetaProducto.className = "vendedores-producto";
    tarjetaProducto.innerHTML =
      "<strong>" + escaparTextoVendedor(producto.codigo) + " - " + escaparTextoVendedor(producto.nombre) + "</strong>" +
      "<span>" + escaparTextoVendedor(producto.marca || producto.rubro || "Sin rubro") + "</span>" +
      "<div class=\"vendedores-producto-meta\">" +
      "<span>Stock: " + escaparTextoVendedor(formatearCantidadVendedor(producto, obtenerStockVendedor(producto))) + "</span>" +
      "<strong>" + formatearDineroVendedor(obtenerPrecioProductoVendedor(producto)) + "</strong>" +
      "</div>";

    const controlesProducto = document.createElement("div");
    controlesProducto.className = "vendedores-producto-controles";

    const cantidadProducto = document.createElement("input");
    cantidadProducto.type = "number";
    cantidadProducto.min = String(obtenerIncrementoCantidadVendedor(producto));
    cantidadProducto.step = productoEsPesoVendedor(producto) ? "0.001" : "1";
    cantidadProducto.value = String(obtenerIncrementoCantidadVendedor(producto));
    cantidadProducto.inputMode = "decimal";
    cantidadProducto.setAttribute("aria-label", "Cantidad");

    const botonAgregar = document.createElement("button");
    botonAgregar.type = "button";
    botonAgregar.className = "vendedores-principal";
    botonAgregar.textContent = "Agregar";

    botonAgregar.addEventListener("click", function () {
      agregarProductoPedidoVendedor(producto, Number(cantidadProducto.value));
    });

    cantidadProducto.addEventListener("keydown", function (evento) {
      if (evento.key !== "Enter") {
        return;
      }

      evento.preventDefault();
      agregarProductoPedidoVendedor(producto, Number(cantidadProducto.value));
    });

    controlesProducto.appendChild(cantidadProducto);
    controlesProducto.appendChild(botonAgregar);
    tarjetaProducto.appendChild(controlesProducto);
    vendedorDom.resultadosProductos.appendChild(tarjetaProducto);
  });
}

function buscarItemPedidoVendedor(producto) {
  return itemsPedidoVendedor.find(function (itemPedido) {
    return itemPedido.producto.codigo === producto.codigo;
  });
}

function agregarProductoPedidoVendedor(producto, cantidad) {
  const itemExistente =
    buscarItemPedidoVendedor(producto);
  const cantidadMaxima =
    obtenerCantidadMaximaVendedor(producto);
  const cantidadNormalizada =
    normalizarCantidadVendedor(producto, cantidad || obtenerIncrementoCantidadVendedor(producto));

  if (cantidadNormalizada <= 0) {
    alert("Ingrese una cantidad valida.");
    return;
  }

  if (cantidadMaxima <= 0) {
    alert("El producto no tiene stock disponible.");
    return;
  }

  if (itemExistente) {
    itemExistente.cantidad =
      Math.min(cantidadMaxima, itemExistente.cantidad + cantidadNormalizada);
  } else {
    itemsPedidoVendedor.push({
      producto: producto,
      cantidad: Math.min(cantidadMaxima, cantidadNormalizada)
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

  itemExistente.cantidad =
    normalizarCantidadVendedor(producto, itemExistente.cantidad + cambio);

  if (itemExistente.cantidad <= 0) {
    itemsPedidoVendedor = itemsPedidoVendedor.filter(function (itemPedido) {
      return itemPedido.producto.codigo !== producto.codigo;
    });
  } else {
    itemExistente.cantidad =
      Math.min(obtenerCantidadMaximaVendedor(producto), itemExistente.cantidad);
  }

  renderizarItemsPedidoVendedor();
}

function establecerCantidadPedidoVendedor(producto, cantidad) {
  const itemExistente =
    buscarItemPedidoVendedor(producto);

  if (!itemExistente) {
    return;
  }

  const cantidadNormalizada =
    normalizarCantidadVendedor(producto, cantidad);

  if (cantidadNormalizada <= 0) {
    itemsPedidoVendedor = itemsPedidoVendedor.filter(function (itemPedido) {
      return itemPedido.producto.codigo !== producto.codigo;
    });
  } else {
    itemExistente.cantidad =
      Math.min(obtenerCantidadMaximaVendedor(producto), cantidadNormalizada);
  }

  renderizarItemsPedidoVendedor();
}

function calcularTotalPedidoVendedor() {
  return itemsPedidoVendedor.reduce(function (total, itemPedido) {
    return total + itemPedido.cantidad * obtenerPrecioProductoVendedor(itemPedido.producto);
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
      formatearDineroVendedor(itemPedido.cantidad * obtenerPrecioProductoVendedor(itemPedido.producto));

    const controlCantidad = document.createElement("div");
    controlCantidad.className = "vendedores-control-cantidad";

    const botonRestar = document.createElement("button");
    botonRestar.type = "button";
    botonRestar.textContent = "-";
    botonRestar.addEventListener("click", function () {
      cambiarCantidadPedidoVendedor(
        itemPedido.producto,
        -obtenerIncrementoCantidadVendedor(itemPedido.producto)
      );
    });

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.min = String(obtenerIncrementoCantidadVendedor(itemPedido.producto));
    cantidad.step = productoEsPesoVendedor(itemPedido.producto) ? "0.001" : "1";
    cantidad.value = String(itemPedido.cantidad);
    cantidad.inputMode = "decimal";
    cantidad.setAttribute("aria-label", "Cantidad de " + itemPedido.producto.nombre);
    cantidad.addEventListener("change", function () {
      establecerCantidadPedidoVendedor(itemPedido.producto, Number(cantidad.value));
    });

    const botonSumar = document.createElement("button");
    botonSumar.type = "button";
    botonSumar.textContent = "+";
    botonSumar.addEventListener("click", function () {
      cambiarCantidadPedidoVendedor(
        itemPedido.producto,
        obtenerIncrementoCantidadVendedor(itemPedido.producto)
      );
    });

    controlCantidad.appendChild(botonRestar);
    controlCantidad.appendChild(cantidad);
    controlCantidad.appendChild(botonSumar);

    item.appendChild(nombreProducto);
    item.appendChild(subtotalProducto);
    item.appendChild(document.createTextNode(
      "Precio: " + formatearDineroVendedor(obtenerPrecioProductoVendedor(itemPedido.producto))
    ));
    item.appendChild(controlCantidad);
    vendedorDom.itemsPedido.appendChild(item);
  });
}

function limpiarTelefonoVendedor(telefono) {
  return String(telefono || "").replace(/[^\d]/g, "");
}

function cargarTelefonoDestinoVendedor() {
  const telefonoDesdeUrl =
    limpiarTelefonoVendedor(telefonoVendedorDesdeUrl);

  if (telefonoDesdeUrl) {
    localStorage.setItem(CLAVE_TELEFONO_VENDEDOR, telefonoDesdeUrl);
    return telefonoDesdeUrl;
  }

  return limpiarTelefonoVendedor(localStorage.getItem(CLAVE_TELEFONO_VENDEDOR));
}

function guardarTelefonoDestinoVendedor() {
  const telefono =
    limpiarTelefonoVendedor(vendedorDom.telefonoDestino.value);

  if (telefono) {
    localStorage.setItem(CLAVE_TELEFONO_VENDEDOR, telefono);
  }
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
        itemPedido.cantidad * obtenerPrecioProductoVendedor(itemPedido.producto);

      return "- " + formatearCantidadVendedor(itemPedido.producto, itemPedido.cantidad) + " x " +
        itemPedido.producto.codigo + " - " + itemPedido.producto.nombre + " (" +
        formatearDineroVendedor(subtotal) + ")";
    });

  const lineasMensaje = [
    "Nuevo pedido movil",
    "",
    "Vendedor: " + vendedor,
    "Cliente: " + (cliente.nombre || "Sin cliente"),
    "Direccion: " + (cliente.direccion || "Sin direccion"),
    "Zona: " + (cliente.zona || "Sin zona"),
    "Forma de pago: " + obtenerTextoFormaPagoVendedor(vendedorDom.formaPago.value),
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

function obtenerFechaPedidoMovil() {
  return new Date().toLocaleDateString("es-AR");
}

async function obtenerNumeroPedidoMovilSupabase() {
  if (typeof obtenerMayorNumeroPedidoSupabase !== "function") {
    return Date.now();
  }

  const mayorNumero =
    await obtenerMayorNumeroPedidoSupabase();

  return mayorNumero + 1;
}

function crearPedidoMovilParaSupabase(numeroPedido) {
  const listaPrecios =
    obtenerListaPrecioVendedorActual();
  const observacion =
    vendedorDom.observacion.value.trim();
  const items =
    itemsPedidoVendedor.map(function (itemPedido) {
      const precioUnitario =
        obtenerPrecioProductoVendedor(itemPedido.producto);

      return {
        producto: itemPedido.producto,
        cantidad: itemPedido.cantidad,
        listaPrecios: listaPrecios,
        precioUnitario: precioUnitario,
        descuentoPorcentaje: 0,
        subtotal: itemPedido.cantidad * precioUnitario
      };
    });

  return {
    id: Number(numeroPedido) || Date.now(),
    numero: Number(numeroPedido) || Date.now(),
    cliente: clienteSeleccionadoVendedor,
    vendedor: vendedorDom.nombreVendedor.value.trim() || "Vendedor movil",
    zona: clienteSeleccionadoVendedor.zona || "Sin zona",
    items: items,
    total: calcularTotalPedidoVendedor(),
    estado: "PENDIENTE",
    estadoCobro: "",
    formaPago: vendedorDom.formaPago.value || "CUENTA_CORRIENTE",
    observaciones: observacion ? [observacion] : [],
    fecha: obtenerFechaPedidoMovil()
  };
}

function esErrorNumeroPedidoDuplicadoVendedor(error) {
  const mensaje =
    String(error && error.message ? error.message : "");

  return error &&
    (error.code === "23505" ||
      mensaje.includes("pedidos_numero") ||
      mensaje.includes("duplicate key"));
}

async function guardarPedidoMovilEnSupabase() {
  if (
    !vendedorUsaSupabaseConAuth() ||
    !usuarioSupabaseAutenticado() ||
    typeof guardarPedidoSupabase !== "function"
  ) {
    return {
      guardado: false,
      motivo: "Sin sesion online"
    };
  }

  let numeroPedido =
    await obtenerNumeroPedidoMovilSupabase();

  for (let intento = 1; intento <= 4; intento += 1) {
    const pedidoMovil =
      crearPedidoMovilParaSupabase(numeroPedido);

    try {
      const pedidoGuardado =
        await guardarPedidoSupabase(pedidoMovil);

      return {
        guardado: true,
        pedido: pedidoGuardado || pedidoMovil
      };
    } catch (error) {
      if (!esErrorNumeroPedidoDuplicadoVendedor(error) || intento === 4) {
        throw error;
      }

      numeroPedido += 1;
    }
  }

  return {
    guardado: false,
    motivo: "No se pudo reservar numero"
  };
}

function abrirWhatsappPedidoVendedor() {
  const telefonoDestino =
    limpiarTelefonoVendedor(vendedorDom.telefonoDestino.value);

  const enlaceWhatsapp =
    "https://wa.me/" + telefonoDestino + "?text=" +
    encodeURIComponent(construirMensajePedidoVendedor());

  window.open(enlaceWhatsapp, "_blank", "noopener");
}

async function enviarPedidoWhatsappVendedor() {
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

  vendedorDom.estadoEnvio.textContent =
    "Guardando pedido...";
  vendedorDom.botonWhatsapp.disabled =
    true;

  try {
    const resultadoGuardado =
      await guardarPedidoMovilEnSupabase();

    vendedorDom.estadoEnvio.textContent =
      resultadoGuardado.guardado
        ? "Pedido guardado online. Abriendo WhatsApp..."
        : "Sin guardado online. Abriendo WhatsApp...";

    abrirWhatsappPedidoVendedor();
  } catch (error) {
    console.error("No se pudo guardar pedido movil:", error);
    const abrirIgual =
      confirm("No se pudo guardar online. Queres abrir WhatsApp igual?");

    if (abrirIgual) {
      vendedorDom.estadoEnvio.textContent =
        "Pedido no guardado online. WhatsApp abierto.";
      abrirWhatsappPedidoVendedor();
    } else {
      vendedorDom.estadoEnvio.textContent =
        "Pedido no enviado. Revisa internet o permisos.";
    }
  } finally {
    vendedorDom.botonWhatsapp.disabled =
      false;
  }
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
  vendedorDom.estadoEnvio.textContent = "";
  renderizarItemsPedidoVendedor();
}

async function iniciarVendedoresMobile() {
  vendedorDom.telefonoDestino.value =
    cargarTelefonoDestinoVendedor();

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
vendedorDom.telefonoDestino.addEventListener("input", guardarTelefonoDestinoVendedor);
vendedorDom.botonLimpiar.addEventListener("click", limpiarPedidoVendedor);
vendedorDom.botonCopiar.addEventListener("click", copiarPedidoVendedor);
vendedorDom.botonWhatsapp.addEventListener("click", enviarPedidoWhatsappVendedor);

iniciarVendedoresMobile();
