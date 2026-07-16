const telefonoVendedorDesdeUrl =
  new URLSearchParams(window.location.search).get("wsp") || "";
const CLAVE_TELEFONO_VENDEDOR = "lv_vendedores_telefono_destino";
const CLAVE_TELEFONO_CATALOGO_VENDEDOR = "lv_catalogo_telefono_destino";
const CLAVE_CLIENTES_RECIENTES_VENDEDOR = "lv_vendedores_clientes_recientes";
const PREFIJO_COBRANZA_PENDIENTE_VENDEDOR = "PENDIENTE_COBRANZA_VENDEDOR";
const MAX_CLIENTES_RECIENTES_VENDEDOR = 6;

let clientesVendedor = [];
let productosVendedor = [];
let clienteSeleccionadoVendedor = null;
let itemsPedidoVendedor = [];
let usuarioSistemaVendedorActual = null;
let moduloVendedorActual = "";
let vendedorMovilAutorizado = true;
let motivoBloqueoVendedorMovil = "";
let pedidoVendedorEnCurso = false;
let firmaUltimoPedidoMovilGuardado = "";
let cobranzaVendedorEnCurso = false;
let ultimosResultadosClientesVendedor = [];
let ultimosResultadosProductosVendedor = [];

const vendedorDom = {
  login: document.getElementById("vendedorLogin"),
  contenido: document.getElementById("vendedorContenido"),
  loginForm: document.getElementById("vendedorLoginForm"),
  loginEmail: document.getElementById("vendedorLoginEmail"),
  loginPassword: document.getElementById("vendedorLoginPassword"),
  loginEstado: document.getElementById("vendedorLoginEstado"),
  estadoConexion: document.getElementById("vendedorEstadoConexion"),
  botonSalir: document.getElementById("vendedorBotonSalir"),
  nombreEncabezado: document.getElementById("vendedorNombreEncabezado"),
  metricaClientes: document.getElementById("vendedorMetricaClientes"),
  metricaProductos: document.getElementById("vendedorMetricaProductos"),
  metricaDeuda: document.getElementById("vendedorMetricaDeuda"),
  metricaPedido: document.getElementById("vendedorMetricaPedido"),
  inicio: document.getElementById("vendedorInicio"),
  moduloVenta: document.getElementById("vendedorModuloVenta"),
  moduloClientes: document.getElementById("vendedorModuloClientes"),
  moduloCatalogo: document.getElementById("vendedorModuloCatalogo"),
  seccionClientes: document.getElementById("vendedorSeccionClientes"),
  flujoPaso: document.getElementById("vendedorFlujoPaso"),
  flujoTitulo: document.getElementById("vendedorFlujoTitulo"),
  botonEnviarCatalogo: document.getElementById("vendedorBotonEnviarCatalogo"),
  nombreVendedor: document.getElementById("vendedorNombre"),
  zonaCliente: document.getElementById("vendedorZonaCliente"),
  busquedaCliente: document.getElementById("vendedorBusquedaCliente"),
  clientesRecientes: document.getElementById("vendedorClientesRecientes"),
  resultadosClientes: document.getElementById("vendedorResultadosClientes"),
  clienteSeleccionado: document.getElementById("vendedorClienteSeleccionado"),
  botonNuevoCliente: document.getElementById("vendedorBotonNuevoCliente"),
  nuevoClienteForm: document.getElementById("vendedorNuevoClienteForm"),
  nuevoClienteNombre: document.getElementById("vendedorNuevoClienteNombre"),
  nuevoClienteTelefono: document.getElementById("vendedorNuevoClienteTelefono"),
  nuevoClienteDireccion: document.getElementById("vendedorNuevoClienteDireccion"),
  nuevoClienteZona: document.getElementById("vendedorNuevoClienteZona"),
  guardarNuevoCliente: document.getElementById("vendedorGuardarNuevoCliente"),
  cancelarNuevoCliente: document.getElementById("vendedorCancelarNuevoCliente"),
  nuevoClienteEstado: document.getElementById("vendedorNuevoClienteEstado"),
  seccionProductos: document.getElementById("vendedorSeccionProductos"),
  seccionCatalogo: document.getElementById("vendedorSeccionCatalogo"),
  seccionPedido: document.getElementById("vendedorSeccionPedido"),
  seccionCobranza: document.getElementById("vendedorSeccionCobranza"),
  busquedaProducto: document.getElementById("vendedorBusquedaProducto"),
  resultadosProductos: document.getElementById("vendedorResultadosProductos"),
  itemsPedido: document.getElementById("vendedorItemsPedido"),
  totalPedido: document.getElementById("vendedorTotalPedido"),
  cantidadItems: document.getElementById("vendedorCantidadItems"),
  cantidadUnidades: document.getElementById("vendedorCantidadUnidades"),
  formaPago: document.getElementById("vendedorFormaPago"),
  telefonoDestino: document.getElementById("vendedorTelefonoDestino"),
  observacion: document.getElementById("vendedorObservacion"),
  botonLimpiar: document.getElementById("vendedorBotonLimpiar"),
  botonCopiar: document.getElementById("vendedorBotonCopiar"),
  botonWhatsapp: document.getElementById("vendedorBotonWhatsapp"),
  estadoEnvio: document.getElementById("vendedorEstadoEnvio"),
  barraPedido: document.getElementById("vendedorBarraPedido"),
  barraItems: document.getElementById("vendedorBarraItems"),
  barraTotal: document.getElementById("vendedorBarraTotal"),
  botonBarraWhatsapp: document.getElementById("vendedorBotonBarraWhatsapp"),
  cobranzaCliente: document.getElementById("vendedorCobranzaCliente"),
  cobranzaSaldo: document.getElementById("vendedorCobranzaSaldo"),
  cobranzaImporte: document.getElementById("vendedorCobranzaImporte"),
  cobranzaMedio: document.getElementById("vendedorCobranzaMedio"),
  cobranzaComprobante: document.getElementById("vendedorCobranzaComprobante"),
  cobranzaObservacion: document.getElementById("vendedorCobranzaObservacion"),
  botonCobrarSaldo: document.getElementById("vendedorBotonCobrarSaldo"),
  botonGuardarCobranza: document.getElementById("vendedorBotonGuardarCobranza"),
  cobranzaEstado: document.getElementById("vendedorCobranzaEstado"),
  botonEnviarCatalogoPanel: document.getElementById("vendedorBotonEnviarCatalogoPanel"),
  botonCopiarCatalogo: document.getElementById("vendedorBotonCopiarCatalogo"),
  catalogoEstado: document.getElementById("vendedorCatalogoEstado")
};

function vendedorUsaSupabaseConAuth() {
  return typeof supabaseAuthDisponible === "function" && supabaseAuthDisponible();
}

function vendedorPermiteModoPruebaLocal() {
  const host =
    window.location.hostname;

  return window.location.protocol === "file:" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "";
}

function normalizarUsuarioAccesoVendedor(usuario) {
  return normalizarTextoVendedor(String(usuario || ""))
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function obtenerEmailInternoVendedor(usuarioOEmail) {
  const valor =
    String(usuarioOEmail || "").trim();

  if (valor.includes("@")) {
    return valor.toLowerCase();
  }

  const usuarioNormalizado =
    normalizarUsuarioAccesoVendedor(valor);

  return usuarioNormalizado ? usuarioNormalizado + "@lv.local" : "";
}

function obtenerMensajeLoginVendedor(error) {
  const mensaje =
    String(error && error.message ? error.message : "");
  const mensajeNormalizado =
    mensaje.toLowerCase();

  if (mensajeNormalizado.includes("invalid login credentials")) {
    return "Usuario o clave incorrectos. Pedi al admin que actualice tu clave.";
  }

  if (mensajeNormalizado.includes("email not confirmed") ||
      mensajeNormalizado.includes("not confirmed")) {
    return "Tu acceso existe pero no esta confirmado. Pedi al admin que lo guarde nuevamente.";
  }

  return mensaje || "error";
}

function mostrarLoginVendedor(mensaje) {
  vendedorDom.login.classList.remove("vendedores-oculto");
  vendedorDom.contenido.classList.add("vendedores-oculto");
  vendedorDom.barraPedido.classList.add("vendedores-oculto");
  vendedorDom.loginEstado.textContent =
    mensaje || "Usa tu usuario de vendedor y clave.";
}

function mostrarContenidoVendedor() {
  vendedorDom.login.classList.add("vendedores-oculto");
  vendedorDom.contenido.classList.remove("vendedores-oculto");
  vendedorDom.barraPedido.classList.add("vendedores-oculto");
}

async function prepararSesionVendedor() {
  if (!vendedorUsaSupabaseConAuth()) {
    if (!vendedorPermiteModoPruebaLocal()) {
      vendedorDom.botonSalir.classList.add("vendedores-oculto");
      mostrarLoginVendedor("No se pudo cargar el acceso online. Revisa la configuracion de Supabase.");
      return false;
    }

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
    if (!vendedorPermiteModoPruebaLocal()) {
      vendedorDom.loginEstado.textContent =
        "No se pudo cargar el acceso online. Revisa la configuracion de Supabase.";
      return;
    }

    mostrarContenidoVendedor();
    await cargarDatosVendedor();
    actualizarVistaVendedorDespuesDeCargarDatos();
    return;
  }

  try {
    vendedorDom.loginEstado.textContent = "Ingresando...";
    const emailLogin =
      obtenerEmailInternoVendedor(vendedorDom.loginEmail.value);

    await iniciarSesionSupabase(
      emailLogin,
      vendedorDom.loginPassword.value
    );

    vendedorDom.nombreVendedor.value =
      obtenerEmailSesionSupabase();
    mostrarContenidoVendedor();
    await cargarDatosVendedor();
    actualizarVistaVendedorDespuesDeCargarDatos();
  } catch (error) {
    vendedorDom.loginEstado.textContent =
      "No se pudo ingresar: " + obtenerMensajeLoginVendedor(error);
  }
}

function vendedorTieneTrabajoSinCerrar() {
  const altaClienteVisible =
    vendedorDom.nuevoClienteForm &&
    !vendedorDom.nuevoClienteForm.classList.contains("vendedores-oculto");
  const altaClienteConDatos =
    altaClienteVisible &&
    (
      vendedorDom.nuevoClienteNombre.value.trim() !== "" ||
      vendedorDom.nuevoClienteTelefono.value.trim() !== "" ||
      vendedorDom.nuevoClienteDireccion.value.trim() !== "" ||
      vendedorDom.nuevoClienteZona.value.trim() !== ""
    );

  return itemsPedidoVendedor.length > 0 ||
    pedidoVendedorEnCurso ||
    cobranzaVendedorEnCurso ||
    altaClienteConDatos;
}

function advertirSalidaVendedorConTrabajo(evento) {
  if (!vendedorTieneTrabajoSinCerrar()) {
    return;
  }

  evento.preventDefault();
  evento.returnValue = "";
}

async function cerrarSesionVendedor() {
  if (vendedorTieneTrabajoSinCerrar()) {
    const confirmar =
      confirm("Hay un pedido, cobranza o cliente sin terminar. Salir igual?");

    if (!confirmar) {
      return;
    }
  }

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

function formatearNumeroVendedor(valor) {
  return (Number(valor) || 0).toLocaleString("es-AR", {
    maximumFractionDigits: 3
  });
}

function obtenerTextoProductosVendedor(cantidad) {
  return cantidad === 1 ? "1 producto" : cantidad + " productos";
}

function normalizarDescuentoVendedor(descuento) {
  const descuentoNumerico =
    Number(descuento);

  if (!Number.isFinite(descuentoNumerico) || descuentoNumerico < 0) {
    return 0;
  }

  if (descuentoNumerico > 100) {
    return 100;
  }

  return Math.round(descuentoNumerico * 100) / 100;
}

function obtenerDescuentoPredeterminadoVendedor(producto) {
  return normalizarDescuentoVendedor(producto.bonificacionVenta || 0);
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

function vendedorMovilEsCuentaDeVendedor() {
  return usuarioSistemaVendedorActual &&
    String(usuarioSistemaVendedorActual.rol || "").trim().toUpperCase() === "VENDEDOR";
}

function vendedorMovilPuedeOperar() {
  return vendedorMovilAutorizado !== false;
}

function obtenerMotivoBloqueoVendedorMovil() {
  return motivoBloqueoVendedorMovil ||
    "Tu cuenta no esta habilitada como vendedor movil.";
}

function obtenerNombreVendedorCuentaActual() {
  if (!usuarioSistemaVendedorActual) {
    return vendedorDom.nombreVendedor.value.trim();
  }

  if (
    usuarioSistemaVendedorActual.vendedorComercial &&
    usuarioSistemaVendedorActual.vendedorComercial.nombre
  ) {
    return usuarioSistemaVendedorActual.vendedorComercial.nombre;
  }

  return usuarioSistemaVendedorActual.nombre ||
    usuarioSistemaVendedorActual.email ||
    vendedorDom.nombreVendedor.value.trim();
}

function obtenerAliasAsignacionVendedorActual() {
  if (!usuarioSistemaVendedorActual) {
    return [];
  }

  const alias = [
    usuarioSistemaVendedorActual.nombre,
    usuarioSistemaVendedorActual.email
  ];

  if (usuarioSistemaVendedorActual.vendedorComercial) {
    alias.push(usuarioSistemaVendedorActual.vendedorComercial.nombre);
    alias.push(usuarioSistemaVendedorActual.vendedorComercial.email);
  }

  return alias
    .map(normalizarTextoVendedor)
    .filter(function (valor) {
      return valor !== "";
    });
}

function aplicarVendedorComercialDeCuenta(vendedoresDisponibles) {
  if (!usuarioSistemaVendedorActual || !Array.isArray(vendedoresDisponibles)) {
    vendedorMovilAutorizado = false;
    motivoBloqueoVendedorMovil =
      "No se pudo revisar el padron de vendedores.";
    return false;
  }

  const emailSesion =
    normalizarTextoVendedor(usuarioSistemaVendedorActual.email || obtenerEmailSesionSupabase());
  const nombreUsuario =
    normalizarTextoVendedor(usuarioSistemaVendedorActual.nombre || "");
  const vendedorComercial =
    vendedoresDisponibles.find(function (vendedor) {
      return vendedor.activo !== false &&
        (
          normalizarTextoVendedor(vendedor.email || "") === emailSesion ||
          (
            normalizarTextoVendedor(vendedor.email || "") === "" &&
            normalizarTextoVendedor(vendedor.nombre || "") === nombreUsuario
          )
        );
    });

  if (vendedorComercial) {
    usuarioSistemaVendedorActual.vendedorComercial = vendedorComercial;
    vendedorMovilAutorizado = true;
    motivoBloqueoVendedorMovil = "";
    return true;
  }

  vendedorMovilAutorizado = false;
  motivoBloqueoVendedorMovil =
    "Tu usuario existe, pero no tiene un vendedor activo en Admin > Vendedores.";
  return false;
}

function actualizarCampoVendedorSegunCuenta() {
  const nombreVendedor =
    obtenerNombreVendedorCuentaActual();

  vendedorDom.nombreVendedor.value =
    nombreVendedor || "";
  if (vendedorDom.nombreEncabezado) {
    vendedorDom.nombreEncabezado.textContent =
      nombreVendedor || "Vendedor";
  }
  vendedorDom.nombreVendedor.readOnly =
    vendedorMovilEsCuentaDeVendedor();
  vendedorDom.nombreVendedor.classList.toggle(
    "vendedores-campo-bloqueado",
    vendedorMovilEsCuentaDeVendedor()
  );
}

function actualizarMetricasJornadaVendedor() {
  const clientesConDeuda =
    clientesVendedor.filter(function (cliente) {
      return obtenerSaldoClienteVendedor(cliente) > 0;
    }).length;

  if (vendedorDom.metricaClientes) {
    vendedorDom.metricaClientes.textContent =
      String(clientesVendedor.length);
  }

  if (vendedorDom.metricaProductos) {
    vendedorDom.metricaProductos.textContent =
      String(productosVendedor.length);
  }

  if (vendedorDom.metricaDeuda) {
    vendedorDom.metricaDeuda.textContent =
      String(clientesConDeuda);
  }

  if (vendedorDom.metricaPedido) {
    vendedorDom.metricaPedido.textContent =
      formatearDineroVendedor(calcularTotalPedidoVendedor());
  }
}

function clienteAsignadoAlVendedorActual(cliente) {
  if (!vendedorMovilPuedeOperar()) {
    return false;
  }

  if (!vendedorMovilEsCuentaDeVendedor()) {
    return true;
  }

  const vendedorAsignado =
    normalizarTextoVendedor(cliente.vendedorAsignado || "");

  return vendedorAsignado !== "" &&
    obtenerAliasAsignacionVendedorActual().includes(vendedorAsignado);
}

async function cargarUsuarioSistemaVendedorActual() {
  usuarioSistemaVendedorActual = null;
  vendedorMovilAutorizado = true;
  motivoBloqueoVendedorMovil = "";

  if (!vendedorUsaSupabaseConAuth() || !usuarioSupabaseAutenticado()) {
    return;
  }

  const emailSesion =
    obtenerEmailSesionSupabase();

  usuarioSistemaVendedorActual =
    await obtenerUsuarioSistemaPorEmailSupabase(emailSesion);

  if (!usuarioSistemaVendedorActual) {
    vendedorMovilAutorizado = false;
    motivoBloqueoVendedorMovil =
      "Usuario no encontrado en administracion.";
    actualizarCampoVendedorSegunCuenta();
    return;
  }

  if (usuarioSistemaVendedorActual.activo === false) {
    vendedorMovilAutorizado = false;
    motivoBloqueoVendedorMovil =
      "Tu usuario esta desactivado en administracion.";
    actualizarCampoVendedorSegunCuenta();
    return;
  }

  if (!vendedorMovilEsCuentaDeVendedor()) {
    vendedorMovilAutorizado = false;
    motivoBloqueoVendedorMovil =
      "Tu usuario no tiene rol VENDEDOR.";
  }

  actualizarCampoVendedorSegunCuenta();
}

async function cargarDatosVendedor() {
  try {
    if (typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado()) {
      await cargarUsuarioSistemaVendedorActual();

      if (!vendedorMovilPuedeOperar()) {
        clientesVendedor = [];
        productosVendedor = [];
        vendedorDom.estadoConexion.textContent =
          obtenerMotivoBloqueoVendedorMovil();
        return;
      }

      const resultado =
        await Promise.all([
          obtenerClientesSupabase(),
          obtenerProductosSupabase(),
          typeof obtenerVendedoresSupabase === "function"
            ? obtenerVendedoresSupabase()
            : Promise.resolve([])
        ]);

      aplicarVendedorComercialDeCuenta(resultado[2]);
      actualizarCampoVendedorSegunCuenta();

      if (!vendedorMovilPuedeOperar()) {
        clientesVendedor = [];
        productosVendedor = [];
        vendedorDom.estadoConexion.textContent =
          obtenerMotivoBloqueoVendedorMovil();
        mostrarLoginVendedor(obtenerMotivoBloqueoVendedorMovil());
        return;
      }

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

function obtenerZonaClienteVendedor(cliente) {
  return cliente && cliente.zona ? cliente.zona : "Sin zona";
}

function obtenerZonasClientesVendedor() {
  const zonasVendedor = [];

  clientesVendedor.forEach(function (cliente) {
    const zona =
      obtenerZonaClienteVendedor(cliente);

    if (!zonasVendedor.some(function (zonaGuardada) {
      return normalizarTextoVendedor(zonaGuardada) === normalizarTextoVendedor(zona);
    })) {
      zonasVendedor.push(zona);
    }
  });

  return zonasVendedor.sort(function (primera, segunda) {
    return primera.localeCompare(segunda, "es");
  });
}

function renderizarZonasClientesVendedor() {
  if (!vendedorDom.zonaCliente) {
    vendedorDom.busquedaCliente.disabled = false;
    vendedorDom.busquedaCliente.placeholder =
      "Codigo o nombre del cliente";
    return;
  }

  const zonaActual =
    vendedorDom.zonaCliente.value;
  const zonas =
    obtenerZonasClientesVendedor();

  vendedorDom.zonaCliente.innerHTML =
    "<option value=\"\">Seleccionar zona</option>" +
    zonas.map(function (zona) {
      return "<option value=\"" + escaparTextoVendedor(zona) + "\">" +
        escaparTextoVendedor(zona) +
        "</option>";
    }).join("");

  vendedorDom.zonaCliente.value =
    zonas.some(function (zona) {
      return normalizarTextoVendedor(zona) === normalizarTextoVendedor(zonaActual);
    })
      ? zonaActual
      : "";

  vendedorDom.busquedaCliente.placeholder =
    "Codigo o nombre del cliente";
}

function clienteCoincideZonaVendedor(cliente) {
  const zonaSeleccionada =
    vendedorDom.zonaCliente ? vendedorDom.zonaCliente.value : "";

  if (zonaSeleccionada === "") {
    return true;
  }

  return normalizarTextoVendedor(obtenerZonaClienteVendedor(cliente)) ===
    normalizarTextoVendedor(zonaSeleccionada);
}

function obtenerClientesZonaVendedor() {
  return clientesVendedor.filter(clienteCoincideZonaVendedor);
}

function obtenerCodigosClientesRecientesVendedor() {
  try {
    const codigos =
      JSON.parse(localStorage.getItem(CLAVE_CLIENTES_RECIENTES_VENDEDOR) || "[]");

    return Array.isArray(codigos)
      ? codigos.map(function (codigo) {
        return String(codigo);
      })
      : [];
  } catch (error) {
    return [];
  }
}

function guardarClienteRecienteVendedor(cliente) {
  if (!cliente || cliente.codigo === undefined || cliente.codigo === null) {
    return;
  }

  const codigoCliente =
    String(cliente.codigo);
  const codigos =
    obtenerCodigosClientesRecientesVendedor()
      .filter(function (codigo) {
        return codigo !== codigoCliente;
      });

  codigos.unshift(codigoCliente);
  localStorage.setItem(
    CLAVE_CLIENTES_RECIENTES_VENDEDOR,
    JSON.stringify(codigos.slice(0, MAX_CLIENTES_RECIENTES_VENDEDOR))
  );
}

function obtenerClientesRecientesVendedor() {
  const codigos =
    obtenerCodigosClientesRecientesVendedor();

  return codigos
    .map(function (codigo) {
      return clientesVendedor.find(function (cliente) {
        return String(cliente.codigo) === codigo;
      });
    })
    .filter(Boolean)
    .filter(clienteCoincideZonaVendedor);
}

function renderizarClientesRecientesVendedor() {
  if (!vendedorDom.clientesRecientes) {
    return;
  }

  const busqueda =
    vendedorDom.busquedaCliente.value.trim();
  const clientesRecientes =
    busqueda === "" ? obtenerClientesRecientesVendedor() : [];

  vendedorDom.clientesRecientes.innerHTML = "";

  if (clientesRecientes.length === 0) {
    vendedorDom.clientesRecientes.classList.add("vendedores-oculto");
    return;
  }

  vendedorDom.clientesRecientes.classList.remove("vendedores-oculto");
  vendedorDom.clientesRecientes.innerHTML =
    "<span>Recientes</span>";

  clientesRecientes.forEach(function (cliente) {
    const botonCliente = document.createElement("button");
    botonCliente.type = "button";
    botonCliente.textContent =
      cliente.codigo + " - " + cliente.nombre;
    botonCliente.addEventListener("click", function () {
      seleccionarClienteVendedor(cliente);
    });
    vendedorDom.clientesRecientes.appendChild(botonCliente);
  });
}

function actualizarFlujoVendedor() {
  const hayCliente =
    Boolean(clienteSeleccionadoVendedor);
  const estaEnVenta =
    moduloVendedorActual === "venta";
  const estaEnClientes =
    moduloVendedorActual === "clientes";
  const estaEnCatalogo =
    moduloVendedorActual === "catalogo";
  const hayModulo =
    estaEnVenta || estaEnClientes || estaEnCatalogo;

  vendedorDom.seccionClientes.classList.toggle("vendedores-oculto", !hayModulo);
  vendedorDom.seccionProductos.classList.toggle("vendedores-oculto", !(estaEnVenta && hayCliente));
  vendedorDom.seccionPedido.classList.toggle("vendedores-oculto", !(estaEnVenta && hayCliente));
  vendedorDom.seccionCobranza.classList.toggle("vendedores-oculto", !(estaEnClientes && hayCliente));
  if (vendedorDom.seccionCatalogo) {
    vendedorDom.seccionCatalogo.classList.toggle("vendedores-oculto", !(estaEnCatalogo && hayCliente));
  }
  vendedorDom.barraPedido.classList.toggle("vendedores-oculto", !(estaEnVenta && hayCliente));

  if (vendedorDom.moduloVenta) {
    vendedorDom.moduloVenta.classList.toggle("active", estaEnVenta);
  }

  if (vendedorDom.moduloClientes) {
    vendedorDom.moduloClientes.classList.toggle("active", estaEnClientes);
  }

  if (vendedorDom.moduloCatalogo) {
    vendedorDom.moduloCatalogo.classList.toggle("active", estaEnCatalogo);
  }

  if (vendedorDom.flujoPaso) {
    vendedorDom.flujoPaso.textContent =
      estaEnVenta ? "Venta" : estaEnClientes ? "Cobranza" : estaEnCatalogo ? "Catalogo" : "Paso 1";
  }

  if (vendedorDom.flujoTitulo) {
    vendedorDom.flujoTitulo.textContent =
      estaEnVenta
        ? "Buscar cliente para vender"
        : estaEnClientes
          ? "Buscar cliente para cobrar"
          : estaEnCatalogo
            ? "Buscar cliente para enviar catalogo"
            : "Buscar cliente";
  }

  vendedorDom.botonEnviarCatalogo.disabled =
    !hayCliente;
  if (vendedorDom.botonEnviarCatalogoPanel) {
    vendedorDom.botonEnviarCatalogoPanel.disabled =
      !hayCliente;
  }
  if (vendedorDom.botonCopiarCatalogo) {
    vendedorDom.botonCopiarCatalogo.disabled =
      !hayCliente;
  }
}

function seleccionarModuloVendedor(modulo) {
  const moduloNuevo =
    modulo === "clientes" ? "clientes" : modulo === "catalogo" ? "catalogo" : "venta";

  if (moduloVendedorActual !== moduloNuevo) {
    moduloVendedorActual =
      moduloNuevo;
    reiniciarClientePorCambioZona();
  }

  actualizarFlujoVendedor();
  renderizarZonasClientesVendedor();
  renderizarResultadosClientesVendedor();
  vendedorDom.busquedaCliente.focus();
}

function reiniciarClientePorCambioZona() {
  clienteSeleccionadoVendedor = null;
  itemsPedidoVendedor = [];
  vendedorDom.busquedaCliente.value = "";
  vendedorDom.busquedaProducto.value = "";
  vendedorDom.resultadosClientes.innerHTML = "";
  vendedorDom.resultadosProductos.innerHTML = "";
  vendedorDom.clienteSeleccionado.classList.remove("vendedores-seleccion-activa");
  vendedorDom.clienteSeleccionado.textContent = "Sin cliente seleccionado";
  vendedorDom.estadoEnvio.textContent = "";
  if (vendedorDom.catalogoEstado) {
    vendedorDom.catalogoEstado.textContent = "";
  }
  vendedorDom.cobranzaEstado.textContent = "";
  vendedorDom.cobranzaImporte.value = "";
  vendedorDom.cobranzaComprobante.value = "";
  vendedorDom.cobranzaObservacion.value = "";
  renderizarItemsPedidoVendedor();
  renderizarClientesRecientesVendedor();
  actualizarVistaCobranzaVendedor();
  actualizarFlujoVendedor();
}

function cambiarZonaClienteVendedor() {
  reiniciarClientePorCambioZona();
  renderizarZonasClientesVendedor();
  renderizarResultadosClientesVendedor();
}

function limpiarClienteSeleccionadoPorBusqueda() {
  if (!clienteSeleccionadoVendedor) {
    return;
  }

  const textoClienteSeleccionado =
    clienteSeleccionadoVendedor.codigo + " - " + clienteSeleccionadoVendedor.nombre;

  if (vendedorDom.busquedaCliente.value === textoClienteSeleccionado) {
    return;
  }

  clienteSeleccionadoVendedor = null;
  itemsPedidoVendedor = [];
  vendedorDom.busquedaProducto.value = "";
  vendedorDom.resultadosProductos.innerHTML = "";
  vendedorDom.clienteSeleccionado.classList.remove("vendedores-seleccion-activa");
  vendedorDom.clienteSeleccionado.textContent = "Sin cliente seleccionado";
  vendedorDom.estadoEnvio.textContent = "";
  if (vendedorDom.catalogoEstado) {
    vendedorDom.catalogoEstado.textContent = "";
  }
  vendedorDom.cobranzaEstado.textContent = "";
  vendedorDom.cobranzaImporte.value = "";
  vendedorDom.cobranzaComprobante.value = "";
  vendedorDom.cobranzaObservacion.value = "";
  renderizarItemsPedidoVendedor();
  renderizarClientesRecientesVendedor();
  actualizarVistaCobranzaVendedor();
  actualizarFlujoVendedor();
}

function cambiarBusquedaClienteVendedor() {
  limpiarClienteSeleccionadoPorBusqueda();
  renderizarResultadosClientesVendedor();
}

function obtenerZonaSugeridaNuevoClienteVendedor() {
  const zonaFormulario =
    vendedorDom.nuevoClienteZona ? vendedorDom.nuevoClienteZona.value.trim() : "";

  if (zonaFormulario !== "") {
    return zonaFormulario;
  }

  if (vendedorDom.zonaCliente && vendedorDom.zonaCliente.value) {
    return vendedorDom.zonaCliente.value;
  }

  if (
    usuarioSistemaVendedorActual &&
    usuarioSistemaVendedorActual.vendedorComercial &&
    usuarioSistemaVendedorActual.vendedorComercial.zona
  ) {
    return usuarioSistemaVendedorActual.vendedorComercial.zona;
  }

  return "Sin zona";
}

function mostrarAltaRapidaClienteVendedor() {
  if (!vendedorDom.nuevoClienteForm) {
    return;
  }

  const busquedaActual =
    vendedorDom.busquedaCliente.value.trim();

  vendedorDom.nuevoClienteForm.classList.remove("vendedores-oculto");
  vendedorDom.nuevoClienteNombre.value =
    /^\d+\s*-/.test(busquedaActual) ? "" : busquedaActual;
  vendedorDom.nuevoClienteZona.value =
    obtenerZonaSugeridaNuevoClienteVendedor();
  vendedorDom.nuevoClienteEstado.textContent = "";
  vendedorDom.nuevoClienteNombre.focus();
}

function ocultarAltaRapidaClienteVendedor() {
  if (!vendedorDom.nuevoClienteForm) {
    return;
  }

  vendedorDom.nuevoClienteForm.classList.add("vendedores-oculto");
  vendedorDom.nuevoClienteForm.reset();
  vendedorDom.nuevoClienteEstado.textContent = "";
}

function esErrorCodigoClienteDuplicadoVendedor(error) {
  const mensaje =
    String(error && error.message ? error.message : "");

  return error &&
    (error.code === "23505" ||
      mensaje.includes("clientes_codigo") ||
      mensaje.includes("duplicate key"));
}

async function obtenerSiguienteCodigoClienteVendedor() {
  const mayorCodigoLocal =
    clientesVendedor.reduce(function (mayor, cliente) {
      return Math.max(mayor, Number(cliente.codigo) || 0);
    }, 0);

  if (
    vendedorUsaSupabaseConAuth() &&
    usuarioSupabaseAutenticado() &&
    typeof obtenerMayorCodigoClienteSupabase === "function"
  ) {
    const mayorCodigoOnline =
      await obtenerMayorCodigoClienteSupabase();

    return Math.max(mayorCodigoLocal, mayorCodigoOnline) + 1;
  }

  return mayorCodigoLocal + 1;
}

function crearClienteMovilParaSupabase(codigoCliente) {
  const nombre =
    vendedorDom.nuevoClienteNombre.value.trim();
  const telefono =
    vendedorDom.nuevoClienteTelefono.value.trim();
  const direccion =
    vendedorDom.nuevoClienteDireccion.value.trim();
  const zona =
    obtenerZonaSugeridaNuevoClienteVendedor();

  return {
    codigo: codigoCliente,
    nombre: nombre,
    saldo: 0,
    telefono: telefono || "-",
    direccion: direccion || "-",
    zona: zona || "Sin zona",
    activo: true,
    historial: [],
    listaPrecios: "Lista 1",
    vendedorAsignado: obtenerNombreVendedorCuentaActual() || "",
    observaciones: "Creado desde vendedores movil"
  };
}

async function guardarClienteMovilEnSupabase(clienteNuevo) {
  if (
    !vendedorUsaSupabaseConAuth() ||
    !usuarioSupabaseAutenticado() ||
    typeof insertarClienteNuevoSupabase !== "function"
  ) {
    throw new Error("Sin sesion online. Inicia sesion nuevamente.");
  }

  let clienteParaGuardar =
    { ...clienteNuevo };

  for (let intento = 1; intento <= 5; intento += 1) {
    try {
      const clienteGuardado =
        await insertarClienteNuevoSupabase(clienteParaGuardar);

      if (!clienteGuardado || !clienteGuardado.idSupabase) {
        throw new Error("Supabase no confirmo el alta del cliente.");
      }

      return clienteGuardado;
    } catch (error) {
      if (!esErrorCodigoClienteDuplicadoVendedor(error) || intento === 5) {
        throw error;
      }

      const siguienteCodigoOnline =
        typeof obtenerMayorCodigoClienteSupabase === "function"
          ? await obtenerMayorCodigoClienteSupabase() + 1
          : clienteParaGuardar.codigo + 1;

      clienteParaGuardar = {
        ...clienteParaGuardar,
        codigo: Math.max(clienteParaGuardar.codigo + 1, siguienteCodigoOnline)
      };
    }
  }

  throw new Error("No se pudo reservar codigo de cliente.");
}

function agregarClienteCreadoAVistaVendedor(clienteCreado) {
  const indiceExistente =
    clientesVendedor.findIndex(function (cliente) {
      return Number(cliente.codigo) === Number(clienteCreado.codigo);
    });

  if (indiceExistente >= 0) {
    clientesVendedor[indiceExistente] = clienteCreado;
  } else {
    clientesVendedor.push(clienteCreado);
  }

  clientesVendedor.sort(function (clienteA, clienteB) {
    return (Number(clienteA.codigo) || 0) - (Number(clienteB.codigo) || 0);
  });
}

function buscarClienteVendedorPorReferencia(clienteReferencia) {
  if (!clienteReferencia) {
    return null;
  }

  return clientesVendedor.find(function (cliente) {
    if (clienteReferencia.idSupabase && cliente.idSupabase === clienteReferencia.idSupabase) {
      return true;
    }

    return Number(cliente.codigo) === Number(clienteReferencia.codigo);
  }) || null;
}

async function refrescarDatosVendedorManteniendoCliente(clienteReferencia) {
  if (!vendedorUsaSupabaseConAuth() || !usuarioSupabaseAutenticado()) {
    return null;
  }

  try {
    await cargarDatosVendedor();
    const clienteActualizado =
      buscarClienteVendedorPorReferencia(clienteReferencia);

    actualizarVistaVendedorDespuesDeCargarDatos();

    if (clienteActualizado) {
      seleccionarClienteVendedor(clienteActualizado);
    }

    return clienteActualizado;
  } catch (error) {
    console.warn("No se pudo refrescar datos moviles desde Supabase:", error);
    return null;
  }
}

async function crearClienteDesdeVendedorMovil(evento) {
  evento.preventDefault();

  if (!vendedorMovilPuedeOperar()) {
    alert(obtenerMotivoBloqueoVendedorMovil());
    return;
  }

  const nombre =
    vendedorDom.nuevoClienteNombre.value.trim();

  if (nombre === "") {
    vendedorDom.nuevoClienteEstado.textContent =
      "Ingrese el nombre del cliente.";
    vendedorDom.nuevoClienteNombre.focus();
    return;
  }

  if (vendedorDom.guardarNuevoCliente) {
    vendedorDom.guardarNuevoCliente.disabled = true;
  }

  try {
    vendedorDom.nuevoClienteEstado.textContent =
      "Guardando cliente online...";

    const codigoCliente =
      await obtenerSiguienteCodigoClienteVendedor();
    const clienteNuevo =
      crearClienteMovilParaSupabase(codigoCliente);
    const clienteGuardado =
      await guardarClienteMovilEnSupabase(clienteNuevo);

    agregarClienteCreadoAVistaVendedor(clienteGuardado);
    ocultarAltaRapidaClienteVendedor();
    renderizarZonasClientesVendedor();
    renderizarResultadosClientesVendedor();
    actualizarMetricasJornadaVendedor();
    seleccionarClienteVendedor(clienteGuardado);
    await refrescarDatosVendedorManteniendoCliente(clienteGuardado);

    vendedorDom.estadoConexion.textContent =
      "Cliente creado online: " + clienteGuardado.codigo;
  } catch (error) {
    console.error("No se pudo crear cliente desde vendedor movil:", error);
    vendedorDom.nuevoClienteEstado.textContent =
      "No se pudo guardar online: " + (error.message || "error");
  } finally {
    if (vendedorDom.guardarNuevoCliente) {
      vendedorDom.guardarNuevoCliente.disabled = false;
    }
  }
}

function actualizarVistaVendedorDespuesDeCargarDatos() {
  renderizarZonasClientesVendedor();
  renderizarClientesRecientesVendedor();
  renderizarResultadosClientesVendedor();
  renderizarItemsPedidoVendedor();
  renderizarResultadosProductosVendedor();
  actualizarVistaCobranzaVendedor();
  actualizarCampoVendedorSegunCuenta();
  actualizarMetricasJornadaVendedor();
  actualizarFlujoVendedor();
}

function clienteCoincideBusqueda(cliente, busqueda) {
  const texto =
    normalizarTextoVendedor(busqueda);

  if (texto === "") {
    return true;
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

function obtenerPrioridadClienteBusquedaVendedor(cliente, busqueda) {
  const texto =
    normalizarTextoVendedor(busqueda);
  const codigo =
    String(cliente.codigo || "");
  const codigoNormalizado =
    normalizarTextoVendedor(codigo);
  const nombreNormalizado =
    normalizarTextoVendedor(cliente.nombre || "");
  const fantasiaNormalizada =
    normalizarTextoVendedor(cliente.nombreFantasia || cliente.razonSocial || "");

  if (texto === "") {
    return 50;
  }

  if (codigoNormalizado === texto) {
    return 0;
  }

  if (codigoNormalizado.indexOf(texto) === 0) {
    return 1;
  }

  if (nombreNormalizado.indexOf(texto) === 0) {
    return 2;
  }

  if (fantasiaNormalizada.indexOf(texto) === 0) {
    return 3;
  }

  return 10;
}

function ordenarClientesPorBusquedaVendedor(clienteA, clienteB, busqueda) {
  const prioridadA =
    obtenerPrioridadClienteBusquedaVendedor(clienteA, busqueda);
  const prioridadB =
    obtenerPrioridadClienteBusquedaVendedor(clienteB, busqueda);

  if (prioridadA !== prioridadB) {
    return prioridadA - prioridadB;
  }

  const codigoA =
    Number(clienteA.codigo) || 0;
  const codigoB =
    Number(clienteB.codigo) || 0;

  if (codigoA !== codigoB) {
    return codigoA - codigoB;
  }

  return String(clienteA.nombre || "").localeCompare(String(clienteB.nombre || ""), "es");
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

function obtenerCantidadesRapidasVendedor(producto) {
  const cantidadesBase =
    productoEsPesoVendedor(producto) ? [0.5, 1, 5] : [1, 6, 12];
  const cantidadMaxima =
    obtenerCantidadMaximaVendedor(producto);

  return cantidadesBase
    .filter(function (cantidad) {
      return cantidad <= cantidadMaxima;
    })
    .filter(function (cantidad, indice, lista) {
      return lista.indexOf(cantidad) === indice;
    });
}

function formatearCantidadRapidaVendedor(producto, cantidad) {
  if (productoEsPesoVendedor(producto)) {
    return "+" + formatearNumeroVendedor(cantidad) + (producto.unidadPeso || "kg");
  }

  return "+" + cantidad;
}

function renderizarResultadosClientesVendedor() {
  const busqueda =
    vendedorDom.busquedaCliente.value.trim();

  const coincidencias =
    obtenerClientesZonaVendedor()
      .filter(function (cliente) {
        return clienteCoincideBusqueda(cliente, busqueda);
      })
      .sort(function (clienteA, clienteB) {
        return ordenarClientesPorBusquedaVendedor(clienteA, clienteB, busqueda);
      })
      .slice(0, 12);

  ultimosResultadosClientesVendedor =
    coincidencias;
  vendedorDom.resultadosClientes.innerHTML = "";
  renderizarClientesRecientesVendedor();

  if (clientesVendedor.length === 0) {
    vendedorDom.resultadosClientes.innerHTML =
      "<div class=\"vendedores-vacio\">" +
      "<p>No tenes clientes asignados para mostrar.</p>" +
      "<button type=\"button\" class=\"vendedores-principal\" data-crear-cliente-vendedor>Crear primer cliente</button>" +
      "</div>";
    const botonCrearPrimerCliente =
      vendedorDom.resultadosClientes.querySelector("[data-crear-cliente-vendedor]");

    if (botonCrearPrimerCliente) {
      botonCrearPrimerCliente.addEventListener("click", mostrarAltaRapidaClienteVendedor);
    }
    return;
  }

  if (coincidencias.length === 0) {
    vendedorDom.resultadosClientes.innerHTML =
      "<div class=\"vendedores-vacio\">" +
      "<p>No hay clientes con ese codigo o nombre.</p>" +
      "<button type=\"button\" class=\"vendedores-principal\" data-crear-cliente-vendedor>Crear cliente</button>" +
      "</div>";
    const botonCrearCliente =
      vendedorDom.resultadosClientes.querySelector("[data-crear-cliente-vendedor]");

    if (botonCrearCliente) {
      botonCrearCliente.addEventListener("click", mostrarAltaRapidaClienteVendedor);
    }
    return;
  }

  coincidencias.forEach(function (cliente) {
    const botonCliente = document.createElement("button");
    botonCliente.type = "button";
    botonCliente.className = "vendedores-opcion";
    const saldoCliente =
      obtenerSaldoClienteVendedor(cliente);
    const claseSaldo =
      saldoCliente > 0 ? " deuda" : saldoCliente < 0 ? " favor" : "";
    botonCliente.innerHTML =
      "<div class=\"vendedores-opcion-principal\">" +
      "<strong>" + escaparTextoVendedor(cliente.codigo) + " - " + escaparTextoVendedor(cliente.nombre) + "</strong>" +
      "<span class=\"vendedores-chip" + claseSaldo + "\">" + escaparTextoVendedor(obtenerTextoSaldoVendedor(saldoCliente)) + "</span>" +
      "</div>" +
      "<span>" + escaparTextoVendedor(cliente.direccion || "Sin direccion") + "</span>" +
      "<small>" + escaparTextoVendedor(cliente.zona || "Sin zona") + " | " + escaparTextoVendedor(cliente.listaPrecios || "Lista 1") + "</small>";
    botonCliente.addEventListener("click", function () {
      seleccionarClienteVendedor(cliente);
    });
    vendedorDom.resultadosClientes.appendChild(botonCliente);
  });
}

function seleccionarClienteVendedor(cliente) {
  clienteSeleccionadoVendedor = cliente;
  ocultarAltaRapidaClienteVendedor();
  guardarClienteRecienteVendedor(cliente);
  if (vendedorDom.zonaCliente) {
    vendedorDom.zonaCliente.value =
      obtenerZonaClienteVendedor(cliente);
  }
  vendedorDom.busquedaCliente.value = cliente.codigo + " - " + cliente.nombre;
  vendedorDom.resultadosClientes.innerHTML = "";
  renderizarClientesRecientesVendedor();
  vendedorDom.clienteSeleccionado.classList.add("vendedores-seleccion-activa");
  vendedorDom.clienteSeleccionado.innerHTML =
    "<strong>" + escaparTextoVendedor(cliente.codigo) + " - " + escaparTextoVendedor(cliente.nombre) + "</strong>" +
    "<span>" + escaparTextoVendedor(cliente.direccion || "Sin direccion") + "</span>" +
      "<small>" + escaparTextoVendedor(cliente.zona || "Sin zona") + " | " + escaparTextoVendedor(cliente.listaPrecios || "Lista 1") + "</small>";
  actualizarFlujoVendedor();
  renderizarResultadosProductosVendedor();
  actualizarVistaCobranzaVendedor();

  if (moduloVendedorActual === "venta") {
    vendedorDom.busquedaProducto.focus();
  }

  if (moduloVendedorActual === "clientes") {
    vendedorDom.cobranzaImporte.focus();
  }

  if (moduloVendedorActual === "catalogo" && vendedorDom.botonEnviarCatalogoPanel) {
    vendedorDom.botonEnviarCatalogoPanel.focus();
  }
}

function seleccionarPrimerClienteVendedor(evento) {
  if (evento.key !== "Enter") {
    return;
  }

  if (ultimosResultadosClientesVendedor.length === 0) {
    return;
  }

  evento.preventDefault();
  seleccionarClienteVendedor(ultimosResultadosClientesVendedor[0]);
}

function agregarPrimerProductoVendedor(evento) {
  if (evento.key !== "Enter") {
    return;
  }

  if (!clienteSeleccionadoVendedor || ultimosResultadosProductosVendedor.length === 0) {
    return;
  }

  evento.preventDefault();
  const producto =
    ultimosResultadosProductosVendedor[0];

  agregarProductoPedidoVendedor(
    producto,
    obtenerIncrementoCantidadVendedor(producto),
    obtenerDescuentoPredeterminadoVendedor(producto)
  );
}

function crearControlBonificacionVendedor(valorInicial, alCambiar) {
  const contenedor = document.createElement("div");
  contenedor.className = "vendedores-bonificacion";

  const etiqueta = document.createElement("span");
  etiqueta.className = "vendedores-bonificacion-etiqueta";
  etiqueta.textContent = "Bonificacion";

  const opciones = document.createElement("div");
  opciones.className = "vendedores-bonificacion-opciones";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "100";
  input.step = "0.01";
  input.value = String(normalizarDescuentoVendedor(valorInicial));
  input.inputMode = "decimal";
  input.placeholder = "%";
  input.setAttribute("aria-label", "Bonificacion porcentaje");

  function marcarActiva() {
    const valorActual =
      normalizarDescuentoVendedor(input.value);

    opciones.querySelectorAll("button").forEach(function (boton) {
      boton.classList.toggle(
        "active",
        normalizarDescuentoVendedor(boton.dataset.descuento) === valorActual
      );
    });
  }

  [0, 5, 10, 15].forEach(function (porcentaje) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.dataset.descuento = String(porcentaje);
    boton.textContent = porcentaje + "%";
    boton.addEventListener("click", function () {
      input.value = String(porcentaje);
      marcarActiva();
      alCambiar(input.value);
    });
    opciones.appendChild(boton);
  });

  input.addEventListener("input", function () {
    marcarActiva();
    alCambiar(input.value);
  });

  input.addEventListener("change", function () {
    input.value = String(normalizarDescuentoVendedor(input.value));
    marcarActiva();
    alCambiar(input.value);
  });

  contenedor.appendChild(etiqueta);
  contenedor.appendChild(opciones);
  contenedor.appendChild(input);
  marcarActiva();

  return {
    elemento: contenedor,
    input: input
  };
}

function renderizarResultadosProductosVendedor() {
  if (!clienteSeleccionadoVendedor) {
    ultimosResultadosProductosVendedor = [];
    vendedorDom.resultadosProductos.innerHTML =
      "<p class=\"vendedores-vacio\">Elegi un cliente para armar el pedido.</p>";
    return;
  }

  const busqueda =
    vendedorDom.busquedaProducto.value.trim();
  const coincidencias =
    productosVendedor
      .filter(function (producto) {
        if (busqueda === "") {
          return true;
        }

        return productoCoincideBusquedaVendedor(producto, busqueda);
      })
      .slice(0, busqueda === "" ? 8 : 12);

  ultimosResultadosProductosVendedor =
    coincidencias;
  vendedorDom.resultadosProductos.innerHTML = "";

  if (coincidencias.length === 0) {
    vendedorDom.resultadosProductos.innerHTML =
      productosVendedor.length === 0
        ? "<p class=\"vendedores-vacio\">No hay productos disponibles.</p>"
        : "<p class=\"vendedores-vacio\">No hay productos con esa busqueda.</p>";
    return;
  }

  coincidencias.forEach(function (producto) {
    const tarjetaProducto = document.createElement("article");
    tarjetaProducto.className = "vendedores-producto";
    const itemEnPedido =
      buscarItemPedidoVendedor(producto);
    const descuentoSugerido =
      itemEnPedido
        ? itemEnPedido.descuentoPorcentaje
        : obtenerDescuentoPredeterminadoVendedor(producto);
    if (itemEnPedido) {
      tarjetaProducto.classList.add("vendedores-producto-en-pedido");
    }
    tarjetaProducto.innerHTML =
      "<div class=\"vendedores-producto-cabeza\">" +
      "<strong>" + escaparTextoVendedor(producto.codigo) + " - " + escaparTextoVendedor(producto.nombre) + "</strong>" +
      (itemEnPedido
        ? "<span class=\"vendedores-chip pedido\">En pedido: " + escaparTextoVendedor(formatearCantidadVendedor(producto, itemEnPedido.cantidad)) + "</span>"
        : "") +
      "</div>" +
      "<span>" + escaparTextoVendedor(producto.marca || producto.rubro || "Sin rubro") + "</span>" +
      "<div class=\"vendedores-producto-meta\">" +
      "<span>Stock: " + escaparTextoVendedor(formatearCantidadVendedor(producto, obtenerStockVendedor(producto))) + "</span>" +
      "<strong>" + formatearDineroVendedor(obtenerPrecioProductoVendedor(producto)) + "</strong>" +
      "</div>";

    const controlBonificacionProducto =
      crearControlBonificacionVendedor(descuentoSugerido, function (descuentoNuevo) {
        const itemActual =
          buscarItemPedidoVendedor(producto);

        if (!itemActual) {
          return;
        }

        itemActual.descuentoPorcentaje =
          normalizarDescuentoVendedor(descuentoNuevo);
        renderizarItemsPedidoVendedor();
      });

    const cantidadesRapidas = document.createElement("div");
    cantidadesRapidas.className = "vendedores-cantidades-rapidas";
    obtenerCantidadesRapidasVendedor(producto).forEach(function (cantidadRapida) {
      const botonCantidadRapida = document.createElement("button");
      botonCantidadRapida.type = "button";
      botonCantidadRapida.textContent =
        formatearCantidadRapidaVendedor(producto, cantidadRapida);
      botonCantidadRapida.addEventListener("click", function () {
        agregarProductoPedidoVendedor(producto, cantidadRapida, controlBonificacionProducto.input.value);
      });
      cantidadesRapidas.appendChild(botonCantidadRapida);
    });

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
      agregarProductoPedidoVendedor(producto, Number(cantidadProducto.value), controlBonificacionProducto.input.value);
    });

    cantidadProducto.addEventListener("keydown", function (evento) {
      if (evento.key !== "Enter") {
        return;
      }

      evento.preventDefault();
      agregarProductoPedidoVendedor(producto, Number(cantidadProducto.value), controlBonificacionProducto.input.value);
    });

    controlesProducto.appendChild(cantidadProducto);
    controlesProducto.appendChild(botonAgregar);
    tarjetaProducto.appendChild(cantidadesRapidas);
    tarjetaProducto.appendChild(controlBonificacionProducto.elemento);
    tarjetaProducto.appendChild(controlesProducto);
    vendedorDom.resultadosProductos.appendChild(tarjetaProducto);
  });
}

function buscarItemPedidoVendedor(producto) {
  return itemsPedidoVendedor.find(function (itemPedido) {
    return itemPedido.producto.codigo === producto.codigo;
  });
}

function agregarProductoPedidoVendedor(producto, cantidad, descuentoPorcentaje) {
  const itemExistente =
    buscarItemPedidoVendedor(producto);
  const cantidadMaxima =
    obtenerCantidadMaximaVendedor(producto);
  const cantidadNormalizada =
    normalizarCantidadVendedor(producto, cantidad || obtenerIncrementoCantidadVendedor(producto));
  const descuentoNormalizado =
    normalizarDescuentoVendedor(
      descuentoPorcentaje === undefined || descuentoPorcentaje === null
        ? obtenerDescuentoPredeterminadoVendedor(producto)
        : descuentoPorcentaje
    );

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
    itemExistente.descuentoPorcentaje =
      descuentoNormalizado;
  } else {
    itemsPedidoVendedor.push({
      producto: producto,
      cantidad: Math.min(cantidadMaxima, cantidadNormalizada),
      descuentoPorcentaje: descuentoNormalizado
    });
  }

  vendedorDom.busquedaProducto.value = "";
  vendedorDom.resultadosProductos.innerHTML = "";
  vendedorDom.estadoEnvio.textContent =
    "Agregado: " + producto.nombre;
  renderizarItemsPedidoVendedor();
  renderizarResultadosProductosVendedor();
  vendedorDom.busquedaProducto.focus();
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

function establecerDescuentoPedidoVendedor(producto, descuentoPorcentaje) {
  const itemExistente =
    buscarItemPedidoVendedor(producto);

  if (!itemExistente) {
    return;
  }

  itemExistente.descuentoPorcentaje =
    normalizarDescuentoVendedor(descuentoPorcentaje);

  renderizarItemsPedidoVendedor();
}

function eliminarItemPedidoVendedor(producto) {
  itemsPedidoVendedor = itemsPedidoVendedor.filter(function (itemPedido) {
    return itemPedido.producto.codigo !== producto.codigo;
  });

  renderizarItemsPedidoVendedor();
}

function calcularSubtotalItemVendedor(itemPedido) {
  const precioUnitario =
    obtenerPrecioProductoVendedor(itemPedido.producto);
  const subtotalSinDescuento =
    itemPedido.cantidad * precioUnitario;
  const descuento =
    normalizarDescuentoVendedor(itemPedido.descuentoPorcentaje || 0);

  return subtotalSinDescuento - (subtotalSinDescuento * descuento / 100);
}

function calcularTotalPedidoVendedor() {
  return itemsPedidoVendedor.reduce(function (total, itemPedido) {
    return total + calcularSubtotalItemVendedor(itemPedido);
  }, 0);
}

function calcularCantidadTotalPedidoVendedor() {
  return itemsPedidoVendedor.reduce(function (total, itemPedido) {
    return total + itemPedido.cantidad;
  }, 0);
}

function crearFirmaPedidoVendedorActual() {
  if (!clienteSeleccionadoVendedor || itemsPedidoVendedor.length === 0) {
    return "";
  }

  const itemsFirma =
    itemsPedidoVendedor.map(function (itemPedido) {
      return [
        Number(itemPedido.producto.codigo) || 0,
        Number(itemPedido.cantidad) || 0,
        normalizarDescuentoVendedor(itemPedido.descuentoPorcentaje || 0),
        Number(obtenerPrecioProductoVendedor(itemPedido.producto)) || 0
      ].join(":");
    }).join("|");

  return [
    Number(clienteSeleccionadoVendedor.codigo) || 0,
    vendedorDom.formaPago.value || "CUENTA_CORRIENTE",
    vendedorDom.observacion.value.trim(),
    Math.round(calcularTotalPedidoVendedor() * 100),
    itemsFirma
  ].join("||");
}

async function refrescarDatosPedidoVendedorAntesDeEnviar() {
  if (
    !vendedorUsaSupabaseConAuth() ||
    !usuarioSupabaseAutenticado() ||
    typeof obtenerClientesSupabase !== "function" ||
    typeof obtenerProductosSupabase !== "function"
  ) {
    return true;
  }

  const totalAnterior =
    calcularTotalPedidoVendedor();
  const codigosProductosPedido =
    itemsPedidoVendedor.map(function (itemPedido) {
      return Number(itemPedido.producto.codigo) || 0;
    });

  vendedorDom.estadoEnvio.textContent =
    "Actualizando clientes, precios y stock...";

  const resultado =
    await Promise.all([
      obtenerClientesSupabase(),
      obtenerProductosSupabase()
    ]);

  const clientesActualizados =
    resultado[0]
      .filter(clienteActivoVendedor)
      .filter(clienteAsignadoAlVendedorActual);
  const productosActualizados =
    resultado[1].filter(productoDisponibleVendedor);

  const clienteActualizado =
    clientesActualizados.find(function (cliente) {
      return clienteSeleccionadoVendedor &&
        Number(cliente.codigo) === Number(clienteSeleccionadoVendedor.codigo);
    });

  clientesVendedor =
    clientesActualizados;
  productosVendedor =
    productosActualizados;

  if (!clienteActualizado) {
    clienteSeleccionadoVendedor = null;
    itemsPedidoVendedor = [];
    actualizarVistaVendedorDespuesDeCargarDatos();
    vendedorDom.estadoEnvio.textContent =
      "El cliente ya no esta activo o asignado a tu cuenta. Buscalo de nuevo.";
    return false;
  }

  clienteSeleccionadoVendedor =
    clienteActualizado;

  const avisos = [];
  const itemsActualizados = [];

  itemsPedidoVendedor.forEach(function (itemPedido) {
    const productoActualizado =
      productosActualizados.find(function (producto) {
        return Number(producto.codigo) === Number(itemPedido.producto.codigo);
      });

    if (!productoActualizado) {
      avisos.push(itemPedido.producto.nombre + " ya no esta disponible.");
      return;
    }

    const cantidadMaxima =
      obtenerCantidadMaximaVendedor(productoActualizado);

    if (cantidadMaxima <= 0) {
      avisos.push(productoActualizado.nombre + " quedo sin stock.");
      return;
    }

    let cantidadFinal =
      normalizarCantidadVendedor(productoActualizado, itemPedido.cantidad);

    if (cantidadFinal > cantidadMaxima) {
      cantidadFinal =
        cantidadMaxima;
      avisos.push(productoActualizado.nombre + " bajo stock disponible a " + formatearNumeroVendedor(cantidadMaxima) + ".");
    }

    itemsActualizados.push({
      producto: productoActualizado,
      cantidad: cantidadFinal,
      descuentoPorcentaje: normalizarDescuentoVendedor(itemPedido.descuentoPorcentaje || 0)
    });
  });

  itemsPedidoVendedor =
    itemsActualizados;

  const totalActualizado =
    calcularTotalPedidoVendedor();
  const cambioTotal =
    Math.abs(totalAnterior - totalActualizado) > 0.01;
  const faltanProductos =
    itemsPedidoVendedor.length !== codigosProductosPedido.length;

  actualizarVistaVendedorDespuesDeCargarDatos();

  if (avisos.length > 0 || cambioTotal || faltanProductos) {
    const detalleCambio =
      cambioTotal
        ? " Total anterior " + formatearDineroVendedor(totalAnterior) + ", ahora " + formatearDineroVendedor(totalActualizado) + "."
        : "";

    vendedorDom.estadoEnvio.textContent =
      "Datos actualizados. Revisa el pedido y toca Enviar otra vez." + detalleCambio;

    if (avisos.length > 0) {
      alert("Se actualizaron datos antes de enviar:\n" + avisos.join("\n"));
    }

    return false;
  }

  vendedorDom.estadoEnvio.textContent =
    "Datos verificados online.";
  return true;
}

function actualizarResumenVisualPedidoVendedor() {
  const totalPedido =
    calcularTotalPedidoVendedor();
  const cantidadItems =
    itemsPedidoVendedor.length;
  const cantidadUnidades =
    calcularCantidadTotalPedidoVendedor();
  const totalFormateado =
    formatearDineroVendedor(totalPedido);
  const tieneItems =
    cantidadItems > 0;

  vendedorDom.totalPedido.textContent =
    totalFormateado;
  vendedorDom.cantidadItems.textContent =
    String(cantidadItems);
  vendedorDom.cantidadUnidades.textContent =
    formatearNumeroVendedor(cantidadUnidades);
  vendedorDom.barraItems.textContent =
    obtenerTextoProductosVendedor(cantidadItems);
  vendedorDom.barraTotal.textContent =
    totalFormateado;

  vendedorDom.botonCopiar.disabled =
    !tieneItems;
  vendedorDom.botonWhatsapp.disabled =
    !tieneItems;
  vendedorDom.botonBarraWhatsapp.disabled =
    !tieneItems;

  actualizarMetricasJornadaVendedor();
}

function renderizarItemsPedidoVendedor() {
  vendedorDom.itemsPedido.innerHTML = "";
  actualizarResumenVisualPedidoVendedor();

  if (itemsPedidoVendedor.length === 0) {
    vendedorDom.itemsPedido.innerHTML =
      "<p class=\"vendedores-vacio\">Todavia no hay productos en el pedido.</p>";
    return;
  }

  itemsPedidoVendedor.forEach(function (itemPedido) {
    const item = document.createElement("div");
    item.className = "vendedores-item";

    const encabezadoItem = document.createElement("div");
    encabezadoItem.className = "vendedores-item-encabezado";

    const nombreProducto = document.createElement("strong");
    nombreProducto.textContent =
      itemPedido.producto.codigo + " - " + itemPedido.producto.nombre;

    const subtotalProducto = document.createElement("span");
    subtotalProducto.textContent =
      formatearDineroVendedor(calcularSubtotalItemVendedor(itemPedido));

    const detalleItem = document.createElement("small");
    detalleItem.className = "vendedores-item-detalle";
    detalleItem.textContent =
      "Precio: " + formatearDineroVendedor(obtenerPrecioProductoVendedor(itemPedido.producto)) +
      " | Bonif: " + normalizarDescuentoVendedor(itemPedido.descuentoPorcentaje || 0) + "%" +
      " | Stock: " + formatearCantidadVendedor(itemPedido.producto, obtenerStockVendedor(itemPedido.producto));

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

    const controlDescuento =
      crearControlBonificacionVendedor(
        itemPedido.descuentoPorcentaje || 0,
        function (descuentoNuevo) {
          establecerDescuentoPedidoVendedor(itemPedido.producto, descuentoNuevo);
        }
      );

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className = "vendedores-item-quitar";
    botonEliminar.textContent = "Quitar";
    botonEliminar.addEventListener("click", function () {
      eliminarItemPedidoVendedor(itemPedido.producto);
    });

    encabezadoItem.appendChild(nombreProducto);
    encabezadoItem.appendChild(subtotalProducto);
    encabezadoItem.appendChild(botonEliminar);
    item.appendChild(encabezadoItem);
    item.appendChild(detalleItem);
    item.appendChild(controlDescuento.elemento);
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

function obtenerSaldoClienteVendedor(cliente) {
  return Number(cliente && cliente.saldo) || 0;
}

function obtenerTextoSaldoVendedor(saldo) {
  if (saldo > 0) {
    return "Debe " + formatearDineroVendedor(saldo);
  }

  if (saldo < 0) {
    return "A favor " + formatearDineroVendedor(Math.abs(saldo));
  }

  return "Sin deuda";
}

function actualizarVistaCobranzaVendedor() {
  const cliente =
    clienteSeleccionadoVendedor;
  const hayCliente =
    Boolean(cliente);
  const saldo =
    obtenerSaldoClienteVendedor(cliente);
  const tieneDeuda =
    saldo > 0;

  vendedorDom.cobranzaCliente.textContent =
    hayCliente
      ? cliente.codigo + " - " + cliente.nombre + " | " + obtenerTextoSaldoVendedor(saldo)
      : "Elegi un cliente para ver su saldo.";
  vendedorDom.cobranzaSaldo.textContent =
    formatearDineroVendedor(saldo);
  vendedorDom.botonCobrarSaldo.disabled =
    !tieneDeuda;
  vendedorDom.botonGuardarCobranza.disabled =
    !hayCliente;

  if (tieneDeuda && Number(vendedorDom.cobranzaImporte.value) <= 0) {
    vendedorDom.cobranzaImporte.value =
      String(saldo);
  }
}

function obtenerSiguienteCodigoPagoVendedor() {
  const marcaTiempo =
    Date.now();
  const sufijoAleatorio =
    Math.floor(Math.random() * 1000);

  return Number(
    String(marcaTiempo) + String(sufijoAleatorio).padStart(3, "0")
  );
}

function obtenerTextoMedioCobranzaVendedor(medioPago) {
  const textos = {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    CHEQUE: "Cheque",
    MERCADO_PAGO: "Mercado Pago"
  };

  return textos[medioPago] || medioPago || "Efectivo";
}

function crearMovimientoCobranzaVendedor(cliente, importe) {
  const medioPago =
    vendedorDom.cobranzaMedio.value || "EFECTIVO";
  const comprobante =
    vendedorDom.cobranzaComprobante.value.trim();
  const observacion =
    vendedorDom.cobranzaObservacion.value.trim();
  const saldoAnterior =
    obtenerSaldoClienteVendedor(cliente);
  const detalles = [
    PREFIJO_COBRANZA_PENDIENTE_VENDEDOR,
    "Vendedor: " + obtenerNombreVendedorCuentaActual(),
    "Medio: " + obtenerTextoMedioCobranzaVendedor(medioPago),
    comprobante ? "Comp: " + comprobante : "",
    observacion ? "Obs: " + observacion : ""
  ].filter(Boolean);

  return {
    codigoPago: obtenerSiguienteCodigoPagoVendedor(cliente),
    fecha: new Date().toLocaleDateString("es-AR"),
    tipo: detalles.join(" | "),
    importe: -importe,
    medioPago: "PAGO_CLIENTE",
    saldoAnterior: saldoAnterior,
    saldoPosterior: saldoAnterior
  };
}

async function guardarCobranzaVendedor() {
  if (cobranzaVendedorEnCurso) {
    alert("La cobranza ya se esta enviando.");
    return;
  }

  const cliente =
    clienteSeleccionadoVendedor;

  if (!cliente) {
    alert("Selecciona un cliente antes de cobrar.");
    vendedorDom.busquedaCliente.focus();
    return;
  }

  if (!vendedorUsaSupabaseConAuth() || !usuarioSupabaseAutenticado()) {
    alert("Para guardar cobranzas el vendedor tiene que estar online.");
    return;
  }

  if (typeof guardarMovimientoCuentaSupabase !== "function") {
    alert("No esta disponible el guardado de cuenta corriente.");
    return;
  }

  const importe =
    Number(vendedorDom.cobranzaImporte.value);

  if (!Number.isFinite(importe) || importe <= 0) {
    alert("Ingrese un importe cobrado valido.");
    vendedorDom.cobranzaImporte.focus();
    return;
  }

  cobranzaVendedorEnCurso = true;

  try {
    const confirmar =
      confirm(
        "Enviar cobranza de " + formatearDineroVendedor(importe) +
        " para " + cliente.nombre + "?\n" +
        "Quedara pendiente de aprobacion en admin."
      );

    if (!confirmar) {
      return;
    }

    vendedorDom.botonGuardarCobranza.disabled =
      true;
    vendedorDom.cobranzaEstado.textContent =
      "Enviando cobranza a admin...";

    const movimiento =
      crearMovimientoCobranzaVendedor(cliente, importe);

    const cobranzaGuardada =
      await guardarMovimientoCuentaSupabase(cliente, movimiento);

    if (!cobranzaGuardada || !cobranzaGuardada.idSupabase) {
      throw new Error("Supabase no confirmo la cobranza.");
    }

    await refrescarDatosVendedorManteniendoCliente(cliente);

    vendedorDom.cobranzaEstado.textContent =
      "Cobranza enviada. El admin la aprueba desde Cuenta corriente.";
    vendedorDom.cobranzaImporte.value = "";
    vendedorDom.cobranzaComprobante.value = "";
    vendedorDom.cobranzaObservacion.value = "";
    actualizarVistaCobranzaVendedor();
  } catch (error) {
    console.error("No se pudo guardar cobranza movil:", error);
    vendedorDom.cobranzaEstado.textContent =
      "No se pudo guardar cobranza: " + (error.message || "error");
  } finally {
    cobranzaVendedorEnCurso = false;
    vendedorDom.botonGuardarCobranza.disabled =
      false;
  }
}

function completarCobranzaConSaldoVendedor() {
  if (!clienteSeleccionadoVendedor) {
    alert("Selecciona un cliente antes de cobrar.");
    return;
  }

  const saldo =
    obtenerSaldoClienteVendedor(clienteSeleccionadoVendedor);

  if (saldo <= 0) {
    alert("Este cliente no tiene deuda pendiente.");
    return;
  }

  vendedorDom.cobranzaImporte.value =
    String(saldo);
  vendedorDom.cobranzaImporte.focus();
  vendedorDom.cobranzaImporte.select();
}

function guardarTelefonoDestinoVendedor() {
  const telefono =
    limpiarTelefonoVendedor(vendedorDom.telefonoDestino.value);

  if (telefono) {
    localStorage.setItem(CLAVE_TELEFONO_VENDEDOR, telefono);
    localStorage.setItem(CLAVE_TELEFONO_CATALOGO_VENDEDOR, telefono);
  }
}

function obtenerTelefonoWhatsappClienteVendedor(cliente) {
  if (!cliente) {
    return "";
  }

  const telefonosPosibles = [
    cliente.telefonoMovil,
    cliente.telefonoParticular,
    cliente.telefono
  ];

  for (const telefono of telefonosPosibles) {
    const telefonoLimpio =
      limpiarTelefonoVendedor(telefono);

    if (telefonoLimpio.length >= 8) {
      return telefonoLimpio;
    }
  }

  return "";
}

function obtenerUrlCatalogoVendedor() {
  const rutaCatalogo =
    window.location.protocol === "file:" ? "catalogo.html" : "/catalogo";
  const urlCatalogo =
    new URL(rutaCatalogo, window.location.href);
  const telefonoDistribuidora =
    limpiarTelefonoVendedor(vendedorDom.telefonoDestino.value);

  if (telefonoDistribuidora) {
    urlCatalogo.searchParams.set("wsp", telefonoDistribuidora);
  }

  return urlCatalogo.toString();
}

function construirMensajeCatalogoVendedor() {
  const cliente =
    clienteSeleccionadoVendedor;
  const nombreCliente =
    cliente && cliente.nombre ? cliente.nombre : "";
  const saludo =
    nombreCliente ? "Hola " + nombreCliente + "," : "Hola,";

  return [
    saludo,
    "te paso el catalogo para hacer pedidos:",
    obtenerUrlCatalogoVendedor()
  ].join("\n");
}

async function copiarCatalogoVendedor(mensajeCatalogo) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(mensajeCatalogo);
    vendedorDom.estadoEnvio.textContent =
      "Catalogo copiado.";
    if (vendedorDom.catalogoEstado) {
      vendedorDom.catalogoEstado.textContent =
        "Catalogo copiado.";
    }
    return;
  }

  window.prompt("Copia el catalogo:", mensajeCatalogo);
}

async function copiarLinkCatalogoVendedor() {
  const linkCatalogo =
    obtenerUrlCatalogoVendedor();

  guardarTelefonoDestinoVendedor();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(linkCatalogo);
    if (vendedorDom.catalogoEstado) {
      vendedorDom.catalogoEstado.textContent =
        "Link copiado.";
    }
    vendedorDom.estadoEnvio.textContent =
      "Link de catalogo copiado.";
    return;
  }

  window.prompt("Copia el link del catalogo:", linkCatalogo);
}

async function enviarCatalogoVendedor() {
  if (!clienteSeleccionadoVendedor) {
    alert("Selecciona un cliente para enviar catalogo.");
    vendedorDom.busquedaCliente.focus();
    return;
  }

  const mensajeCatalogo =
    construirMensajeCatalogoVendedor();
  const telefonoCliente =
    obtenerTelefonoWhatsappClienteVendedor(clienteSeleccionadoVendedor);

  guardarTelefonoDestinoVendedor();

  if (telefonoCliente) {
    const enlaceWhatsapp =
      "https://wa.me/" + telefonoCliente + "?text=" + encodeURIComponent(mensajeCatalogo);

    window.open(enlaceWhatsapp, "_blank", "noopener");
    vendedorDom.estadoEnvio.textContent =
      "Catalogo abierto para " + clienteSeleccionadoVendedor.nombre + ".";
    if (vendedorDom.catalogoEstado) {
      vendedorDom.catalogoEstado.textContent =
        "Catalogo abierto para " + clienteSeleccionadoVendedor.nombre + ".";
    }
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Catalogo de productos",
        text: mensajeCatalogo
      });
      vendedorDom.estadoEnvio.textContent =
        "Catalogo compartido.";
      if (vendedorDom.catalogoEstado) {
        vendedorDom.catalogoEstado.textContent =
          "Catalogo compartido.";
      }
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }
  }

  await copiarCatalogoVendedor(mensajeCatalogo);
}

function construirMensajePedidoVendedor() {
  const vendedor =
    obtenerNombreVendedorCuentaActual() || "Sin vendedor";
  const cliente =
    clienteSeleccionadoVendedor || {};
  const observacion =
    vendedorDom.observacion.value.trim();

  const lineasProductos =
    itemsPedidoVendedor.map(function (itemPedido) {
      const subtotal =
        calcularSubtotalItemVendedor(itemPedido);
      const descuento =
        normalizarDescuentoVendedor(itemPedido.descuentoPorcentaje || 0);
      const textoDescuento =
        descuento > 0 ? " | Bonif. " + descuento + "%" : "";

      return "- " + formatearCantidadVendedor(itemPedido.producto, itemPedido.cantidad) + " x " +
        itemPedido.producto.codigo + " - " + itemPedido.producto.nombre + textoDescuento + " (" +
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
        descuentoPorcentaje: normalizarDescuentoVendedor(itemPedido.descuentoPorcentaje || 0),
        subtotal: calcularSubtotalItemVendedor(itemPedido)
      };
    });

  return {
    id: Number(numeroPedido) || Date.now(),
    numero: Number(numeroPedido) || Date.now(),
    cliente: clienteSeleccionadoVendedor,
    vendedor: obtenerNombreVendedorCuentaActual() || "Vendedor movil",
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
  if (pedidoVendedorEnCurso) {
    alert("El pedido ya se esta enviando.");
    return;
  }

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

  pedidoVendedorEnCurso = true;
  vendedorDom.estadoEnvio.textContent =
    "Preparando pedido...";
  vendedorDom.botonWhatsapp.disabled =
    true;
  vendedorDom.botonBarraWhatsapp.disabled =
    true;

  try {
    const datosVerificados =
      await refrescarDatosPedidoVendedorAntesDeEnviar();

    if (!datosVerificados) {
      return;
    }

    if (!validarPedidoVendedor()) {
      return;
    }

    const firmaPedidoActual =
      crearFirmaPedidoVendedorActual();

    if (firmaPedidoActual && firmaPedidoActual === firmaUltimoPedidoMovilGuardado) {
      vendedorDom.estadoEnvio.textContent =
        "Este pedido ya estaba guardado online. Abriendo WhatsApp...";
      abrirWhatsappPedidoVendedor();
      return;
    }

    vendedorDom.estadoEnvio.textContent =
      "Guardando pedido...";

    const resultadoGuardado =
      await guardarPedidoMovilEnSupabase();

    if (resultadoGuardado.guardado) {
      firmaUltimoPedidoMovilGuardado =
        firmaPedidoActual || crearFirmaPedidoVendedorActual();
    }

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
    pedidoVendedorEnCurso = false;
    actualizarResumenVisualPedidoVendedor();
  }
}

function limpiarPedidoVendedor() {
  clienteSeleccionadoVendedor = null;
  itemsPedidoVendedor = [];
  firmaUltimoPedidoMovilGuardado = "";
  vendedorDom.busquedaCliente.value = "";
  vendedorDom.busquedaProducto.value = "";
  vendedorDom.resultadosClientes.innerHTML = "";
  vendedorDom.resultadosProductos.innerHTML = "";
  vendedorDom.clienteSeleccionado.classList.remove("vendedores-seleccion-activa");
  vendedorDom.clienteSeleccionado.textContent = "Sin cliente seleccionado";
  vendedorDom.observacion.value = "";
  vendedorDom.estadoEnvio.textContent = "";
  vendedorDom.cobranzaImporte.value = "";
  vendedorDom.cobranzaComprobante.value = "";
  vendedorDom.cobranzaObservacion.value = "";
  vendedorDom.cobranzaEstado.textContent = "";
  if (vendedorDom.catalogoEstado) {
    vendedorDom.catalogoEstado.textContent = "";
  }
  renderizarItemsPedidoVendedor();
  renderizarClientesRecientesVendedor();
  renderizarResultadosProductosVendedor();
  actualizarVistaCobranzaVendedor();
  actualizarFlujoVendedor();
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
  actualizarVistaVendedorDespuesDeCargarDatos();
}

vendedorDom.loginForm.addEventListener("submit", iniciarSesionVendedorDesdeFormulario);
vendedorDom.botonSalir.addEventListener("click", cerrarSesionVendedor);
vendedorDom.moduloVenta.addEventListener("click", function () {
  seleccionarModuloVendedor("venta");
});
vendedorDom.moduloClientes.addEventListener("click", function () {
  seleccionarModuloVendedor("clientes");
});
vendedorDom.moduloCatalogo.addEventListener("click", function () {
  seleccionarModuloVendedor("catalogo");
});
vendedorDom.zonaCliente.addEventListener("change", cambiarZonaClienteVendedor);
vendedorDom.busquedaCliente.addEventListener("input", cambiarBusquedaClienteVendedor);
vendedorDom.busquedaCliente.addEventListener("keydown", seleccionarPrimerClienteVendedor);
if (vendedorDom.botonNuevoCliente) {
  vendedorDom.botonNuevoCliente.addEventListener("click", mostrarAltaRapidaClienteVendedor);
}
if (vendedorDom.nuevoClienteForm) {
  vendedorDom.nuevoClienteForm.addEventListener("submit", crearClienteDesdeVendedorMovil);
}
if (vendedorDom.cancelarNuevoCliente) {
  vendedorDom.cancelarNuevoCliente.addEventListener("click", ocultarAltaRapidaClienteVendedor);
}
vendedorDom.busquedaProducto.addEventListener("input", renderizarResultadosProductosVendedor);
vendedorDom.busquedaProducto.addEventListener("keydown", agregarPrimerProductoVendedor);
vendedorDom.telefonoDestino.addEventListener("input", guardarTelefonoDestinoVendedor);
vendedorDom.botonLimpiar.addEventListener("click", limpiarPedidoVendedor);
vendedorDom.botonCopiar.addEventListener("click", copiarPedidoVendedor);
vendedorDom.botonWhatsapp.addEventListener("click", enviarPedidoWhatsappVendedor);
vendedorDom.botonBarraWhatsapp.addEventListener("click", enviarPedidoWhatsappVendedor);
vendedorDom.botonEnviarCatalogo.addEventListener("click", enviarCatalogoVendedor);
vendedorDom.botonEnviarCatalogoPanel.addEventListener("click", enviarCatalogoVendedor);
vendedorDom.botonCopiarCatalogo.addEventListener("click", copiarLinkCatalogoVendedor);
vendedorDom.botonCobrarSaldo.addEventListener("click", completarCobranzaConSaldoVendedor);
vendedorDom.botonGuardarCobranza.addEventListener("click", guardarCobranzaVendedor);
window.addEventListener("beforeunload", advertirSalidaVendedorConTrabajo);

iniciarVendedoresMobile();



