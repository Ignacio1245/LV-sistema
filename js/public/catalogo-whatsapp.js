const CLAVE_PEDIDOS_PENDIENTES_CATALOGO = "lv_catalogo_pedidos_pendientes";
const CLAVE_BORRADOR_CATALOGO = "lv_catalogo_borrador_actual";
const CLAVE_ENVIO_CATALOGO = "lv_catalogo_envio_v2";
let idBorradorCatalogo = "";
const referenciaVendedorCatalogoToken =
  new URLSearchParams(window.location.search).get("ref") || "";
let vendedorOrigenCatalogo = null;
let referenciaVendedorCatalogoInvalida = false;

let productosCatalogo = [];
let carritoCatalogo = [];
let pedidoCatalogoEnCurso = false;
let pedidoCatalogoConfirmado = false;
let catalogoActualizandoAlVolver = false;
let ultimaActualizacionCatalogoAlVolver = 0;
let canalActualizacionCatalogoSupabase = null;
let temporizadorActualizacionCatalogoSupabase = null;
let catalogoDatosPendientesDeActualizar = false;
let catalogoRecargandoPorCambioSupabase = false;
let ultimaTablaActualizacionCatalogoSupabase = "";
let rubroCatalogoActual = "TODOS";
let ordenCatalogoActual = "relevancia";
let temporizadorAvisoCatalogo = null;
let confirmarVaciadoCatalogoHasta = 0;
const INTERVALO_ACTUALIZACION_CATALOGO_AL_VOLVER = 20000;
const TABLAS_ACTUALIZACION_CATALOGO_SUPABASE = [
  "productos",
  "listas_precios"
];

const catalogoDom = {
  estadoConexion: document.getElementById("catalogoEstadoConexion"),
  busquedaProducto: document.getElementById("catalogoBusquedaProducto"),
  limpiarBusqueda: document.getElementById("catalogoLimpiarBusqueda"),
  filtrosRubros: document.getElementById("catalogoFiltrosRubros"),
  ordenProductos: document.getElementById("catalogoOrdenProductos"),
  cantidadResultados: document.getElementById("catalogoCantidadResultados"),
  listaProductos: document.getElementById("catalogoListaProductos"),
  itemsCarrito: document.getElementById("catalogoItemsCarrito"),
  totalPedido: document.getElementById("catalogoTotalPedido"),
  carritoCantidad: document.getElementById("catalogoCarritoCantidad"),
  cerrarCarrito: document.getElementById("catalogoCerrarCarrito"),
  carritoFondo: document.getElementById("catalogoCarritoFondo"),
  vaciarCarrito: document.getElementById("catalogoVaciarCarrito"),
  aviso: document.getElementById("catalogoAviso"),
  resumenMovil: document.getElementById("catalogoResumenMovil"),
  resumenMovilDetalle: document.getElementById("catalogoResumenMovilDetalle"),
  formularioCliente: document.getElementById("catalogoFormularioCliente"),
  nombreCliente: document.getElementById("catalogoNombreCliente"),
  direccionCliente: document.getElementById("catalogoDireccionCliente"),
  telefonoCliente: document.getElementById("catalogoTelefonoCliente"),
  codigoCliente: document.getElementById("catalogoCodigoCliente"),
  resultado: document.getElementById("catalogoResultadoPedido"),
  resultadoTexto: document.getElementById("catalogoResultadoTexto"),
  resultadoWhatsapp: document.getElementById("catalogoResultadoWhatsapp"),
  telefonoDestino: document.getElementById("catalogoTelefonoDestino"),
  comentarioCliente: document.getElementById("catalogoComentarioCliente"),
  botonCopiarPedido: document.getElementById("catalogoBotonCopiarPedido"),
  botonEnviarWhatsapp: document.getElementById("catalogoBotonEnviarWhatsapp"),
  contactoAyuda: document.getElementById("catalogoContactoAyuda")
};

function mostrarAvisoCatalogo(mensaje, tipo) {
  if (!catalogoDom.aviso) {
    return;
  }

  catalogoDom.aviso.textContent = mensaje;
  catalogoDom.aviso.dataset.tipo = tipo || "ok";
  catalogoDom.aviso.classList.add("catalogo-aviso-visible");
  window.clearTimeout(temporizadorAvisoCatalogo);
  temporizadorAvisoCatalogo = window.setTimeout(function () {
    catalogoDom.aviso.classList.remove("catalogo-aviso-visible");
  }, 2200);
}

function guardarBorradorCatalogo() {
  try {
    localStorage.setItem(CLAVE_BORRADOR_CATALOGO, JSON.stringify({
      actualizado: new Date().toISOString(),
      id: idBorradorCatalogo,
      items: carritoCatalogo.map(function (itemCarrito) {
        return {
          codigo: itemCarrito.producto.codigo,
          cantidad: itemCarrito.cantidad
        };
      }),
      cliente: {
        nombre: catalogoDom.nombreCliente.value.trim(),
        direccion: catalogoDom.direccionCliente.value.trim(),
        telefono: catalogoDom.telefonoCliente.value.trim(),
        codigo: catalogoDom.codigoCliente.value.trim(),
        comentario: catalogoDom.comentarioCliente.value.trim()
      }
    }));
  } catch (error) {
    console.warn("No se pudo guardar el borrador del catalogo:", error);
  }
}

function leerBorradorCatalogo() {
  try {
    const borrador = JSON.parse(localStorage.getItem(CLAVE_BORRADOR_CATALOGO) || "null");
    return borrador && typeof borrador === "object" ? borrador : null;
  } catch (error) {
    return null;
  }
}

function restaurarDatosClienteCatalogo() {
  const borrador = leerBorradorCatalogo();
  const cliente = borrador && borrador.cliente ? borrador.cliente : {};
  idBorradorCatalogo = borrador && borrador.id ? borrador.id : crypto.randomUUID();
  catalogoDom.nombreCliente.value = cliente.nombre || "";
  catalogoDom.direccionCliente.value = cliente.direccion || "";
  catalogoDom.telefonoCliente.value = cliente.telefono || "";
  catalogoDom.codigoCliente.value = cliente.codigo || "";
  catalogoDom.comentarioCliente.value = cliente.comentario || "";
}

function restaurarCarritoCatalogo() {
  const borrador = leerBorradorCatalogo();
  const itemsGuardados = borrador && Array.isArray(borrador.items) ? borrador.items : [];

  carritoCatalogo = itemsGuardados.map(function (itemGuardado) {
    const producto = productosCatalogo.find(function (productoCatalogo) {
      return String(productoCatalogo.codigo) === String(itemGuardado.codigo);
    });
    if (!producto) {
      return null;
    }

    const cantidad = Math.min(
      obtenerCantidadMaximaProducto(producto),
      normalizarCantidadCatalogo(producto, itemGuardado.cantidad)
    );
    return cantidad > 0 ? { producto: producto, cantidad: cantidad } : null;
  }).filter(Boolean);
}

function leerPedidosPendientesCatalogo() {
  try {
    const pedidosPendientes =
      JSON.parse(localStorage.getItem(CLAVE_PEDIDOS_PENDIENTES_CATALOGO) || "[]");

    return Array.isArray(pedidosPendientes)
      ? pedidosPendientes.filter(function (pedidoPendiente) {
        return pedidoPendiente &&
          typeof pedidoPendiente === "object" &&
          pedidoPendiente.firma &&
          pedidoPendiente.pedido;
      })
      : [];
  } catch (error) {
    return [];
  }
}

function guardarPedidosPendientesCatalogo(pedidosPendientes) {
  localStorage.setItem(
    CLAVE_PEDIDOS_PENDIENTES_CATALOGO,
    JSON.stringify(Array.isArray(pedidosPendientes) ? pedidosPendientes.slice(0, 25) : [])
  );
}

function obtenerCantidadPedidosPendientesCatalogo() {
  return leerPedidosPendientesCatalogo().length;
}

function actualizarEstadoCatalogo(mensaje) {
  const cantidadPendiente =
    obtenerCantidadPedidosPendientesCatalogo();

  catalogoDom.estadoConexion.textContent =
    mensaje + (cantidadPendiente > 0
      ? " | " + cantidadPendiente + " pedido" + (cantidadPendiente === 1 ? "" : "s") + " pendiente" + (cantidadPendiente === 1 ? "" : "s")
      : "");
}
function obtenerStockCatalogo(producto) {
  if (typeof obtenerStockTotalProducto === "function") {
    return obtenerStockTotalProducto(producto);
  }

  return Math.max(0, Number(producto.stock) || 0);
}

function productoEstaActivoParaCatalogo(producto) {
  const productoActivoSegunSistema =
    typeof productoActivo === "function"
      ? productoActivo(producto)
      : producto.activo !== false;

  return productoActivoSegunSistema;
}

function hayProductosConMarcaCatalogo(listaProductos) {
  return listaProductos.some(function (producto) {
    return producto.mostrarCatalogo === true;
  });
}

function filtrarProductosVisiblesCatalogo(listaProductos) {
  return listaProductos.filter(function (producto) {
    return productoEstaActivoParaCatalogo(producto) && producto.mostrarCatalogo !== false;
  });
}

async function cargarProductosCatalogo() {
  let falloConexionSupabase =
    false;

  try {
    if (typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado()) {
      const productosDesdeSupabase =
        typeof obtenerProductosCatalogoPublicoSupabase === "function"
          ? await obtenerProductosCatalogoPublicoSupabase()
          : await obtenerProductosSupabase();

      productosCatalogo =
        filtrarProductosVisiblesCatalogo(productosDesdeSupabase);
      actualizarEstadoCatalogo("Productos desde Supabase");
      return;
    }
  } catch (error) {
    console.warn("No se pudo cargar Supabase para catalogo:", error);
    actualizarEstadoCatalogo("No se pudo actualizar. Verifica tu conexion y reintenta.");
    throw error;
  }

  productosCatalogo =
    filtrarProductosVisiblesCatalogo(Array.isArray(productos) ? productos : []);
  actualizarEstadoCatalogo(
    falloConexionSupabase
      ? "Sin conexion con Supabase. Reintenta en unos minutos."
      : "Modo prueba local"
  );
}

function normalizarTextoCatalogo(texto) {
  if (typeof normalizarTexto === "function") {
    return normalizarTexto(String(texto || ""));
  }

  return String(texto || "").trim().toLowerCase();
}

function productoCoincideConBusqueda(producto, busqueda) {
  const texto =
    normalizarTextoCatalogo(busqueda);

  if (texto === "") {
    return true;
  }

  const camposProducto = [
    producto.codigo,
    producto.codigoReal,
    producto.nombre,
    producto.marca,
    producto.rubro,
    producto.detalle,
    producto.tipo
  ];

  return camposProducto.some(function (campo) {
    return normalizarTextoCatalogo(campo).includes(texto);
  });
}

function obtenerProductosFiltradosCatalogo() {
  const productosFiltrados = productosCatalogo.filter(function (producto) {
    const coincideRubro =
      rubroCatalogoActual === "TODOS" ||
      normalizarTextoCatalogo(producto.rubro || "Sin rubro") === normalizarTextoCatalogo(rubroCatalogoActual);
    return coincideRubro && productoCoincideConBusqueda(producto, catalogoDom.busquedaProducto.value);
  });

  return productosFiltrados.sort(function (productoA, productoB) {
    if (ordenCatalogoActual === "precio-asc") {
      return obtenerPrecioProductoCatalogo(productoA) - obtenerPrecioProductoCatalogo(productoB);
    }
    if (ordenCatalogoActual === "precio-desc") {
      return obtenerPrecioProductoCatalogo(productoB) - obtenerPrecioProductoCatalogo(productoA);
    }
    if (ordenCatalogoActual === "nombre") {
      return String(productoA.nombre || "").localeCompare(String(productoB.nombre || ""), "es", { sensitivity: "base" });
    }
    return 0;
  });
}

function obtenerRubrosCatalogo() {
  return Array.from(new Set(productosCatalogo.map(function (producto) {
    return producto.rubro || "Sin rubro";
  }))).sort(function (rubroA, rubroB) {
    return rubroA.localeCompare(rubroB, "es", { sensitivity: "base" });
  });
}

function renderizarFiltrosRubrosCatalogo() {
  if (!catalogoDom.filtrosRubros) {
    return;
  }

  const rubros = ["TODOS"].concat(obtenerRubrosCatalogo());
  catalogoDom.filtrosRubros.innerHTML = "";
  rubros.forEach(function (rubro) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = rubro === "TODOS" ? "Todos" : rubro;
    boton.classList.toggle("activo", rubro === rubroCatalogoActual);
    boton.setAttribute("aria-pressed", rubro === rubroCatalogoActual ? "true" : "false");
    boton.addEventListener("click", function () {
      rubroCatalogoActual = rubro;
      renderizarFiltrosRubrosCatalogo();
      renderizarProductosCatalogo();
    });
    catalogoDom.filtrosRubros.appendChild(boton);
  });
}

function formatearPrecioCatalogo(valor) {
  if (typeof formatearDinero === "function") {
    return formatearDinero(Number(valor) || 0);
  }

  return "$" + (Number(valor) || 0).toLocaleString("es-AR");
}

function escaparTextoCatalogo(valor) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function crearImagenProductoCatalogo(producto) {
  if (producto.imagenUrl) {
    const imagen = document.createElement("img");
    imagen.className = "catalogo-producto-imagen";
    imagen.src = producto.imagenUrl;
    imagen.alt = producto.nombre;
    imagen.loading = "lazy";
    return imagen;
  }

  const inicialProducto = document.createElement("div");
  inicialProducto.className = "catalogo-producto-sin-imagen";
  inicialProducto.textContent =
    String(producto.nombre || "P").charAt(0).toUpperCase();
  return inicialProducto;
}

function renderizarProductosCatalogo() {
  const productosFiltrados =
    obtenerProductosFiltradosCatalogo();

  catalogoDom.listaProductos.innerHTML = "";
  if (catalogoDom.cantidadResultados) {
    catalogoDom.cantidadResultados.textContent =
      productosFiltrados.length + " producto" + (productosFiltrados.length === 1 ? "" : "s") + " disponible" + (productosFiltrados.length === 1 ? "" : "s");
  }
  if (catalogoDom.limpiarBusqueda) {
    catalogoDom.limpiarBusqueda.classList.toggle("visible", catalogoDom.busquedaProducto.value.trim() !== "");
  }

  if (productosFiltrados.length === 0) {
    const mensajeVacio = document.createElement("p");
    mensajeVacio.className = "catalogo-lista-vacia";
    mensajeVacio.innerHTML =
      "<strong>No encontramos productos</strong><span>Proba otra palabra o volve a ver todo el catalogo.</span>";
    const botonVerTodos = document.createElement("button");
    botonVerTodos.type = "button";
    botonVerTodos.textContent = "Ver todos los productos";
    botonVerTodos.addEventListener("click", limpiarFiltrosCatalogo);
    catalogoDom.listaProductos.appendChild(mensajeVacio);
    catalogoDom.listaProductos.appendChild(botonVerTodos);
    return;
  }

  productosFiltrados.forEach(function (producto) {
    const tarjetaProducto = document.createElement("article");
    tarjetaProducto.className = "catalogo-producto";
    const itemEnCarrito = buscarItemCarrito(producto);
    tarjetaProducto.classList.toggle("catalogo-producto-en-carrito", Boolean(itemEnCarrito));

    const cuerpoProducto = document.createElement("div");
    cuerpoProducto.className = "catalogo-producto-cuerpo";

    const nombreProducto = document.createElement("h3");
    nombreProducto.textContent = producto.nombre;

    const detalleProducto = document.createElement("p");
    detalleProducto.className = "catalogo-producto-detalle";
    detalleProducto.textContent =
      [producto.marca, producto.detalle].filter(Boolean).join(" - ");

    const metaProducto = document.createElement("div");
    metaProducto.className = "catalogo-producto-meta";
    const rubroProducto = document.createElement("span");
    rubroProducto.textContent =
      producto.rubro || "Sin rubro";
    const precioProducto = document.createElement("strong");
    precioProducto.className = "catalogo-producto-precio";
    precioProducto.textContent =
      formatearPrecioCatalogo(obtenerPrecioProductoCatalogo(producto));
    metaProducto.appendChild(rubroProducto);
    metaProducto.appendChild(precioProducto);

    const stockProducto = document.createElement("span");
    stockProducto.className = "catalogo-producto-stock";
    stockProducto.textContent =
      typeof formatearStockProducto === "function"
        ? formatearStockProducto(producto)
        : obtenerStockCatalogo(producto) + " u";

    stockProducto.classList.toggle("stock-bajo", obtenerStockCatalogo(producto) <= 5);

    const controlesProducto = document.createElement("div");
    controlesProducto.className = "catalogo-producto-accion";
    const sinStock = obtenerCantidadMaximaProducto(producto) <= 0;
    if (sinStock) {
      const botonSinStock = document.createElement("button");
      botonSinStock.type = "button";
      botonSinStock.textContent = "Sin stock";
      botonSinStock.disabled = true;
      controlesProducto.appendChild(botonSinStock);
      tarjetaProducto.classList.add("catalogo-producto-sin-stock");
    } else if (itemEnCarrito) {
      const botonRestar = document.createElement("button");
      botonRestar.type = "button";
      botonRestar.textContent = "−";
      botonRestar.setAttribute("aria-label", "Restar " + producto.nombre);
      botonRestar.addEventListener("click", function () {
        cambiarCantidadCarrito(producto, -obtenerIncrementoCantidadCatalogo(producto));
      });
      const cantidadActual = document.createElement("strong");
      cantidadActual.textContent = formatearCantidadCatalogo(producto, itemEnCarrito.cantidad);
      cantidadActual.setAttribute("aria-label", "Cantidad en el pedido");
      const botonSumar = document.createElement("button");
      botonSumar.type = "button";
      botonSumar.textContent = "+";
      botonSumar.setAttribute("aria-label", "Sumar " + producto.nombre);
      botonSumar.addEventListener("click", function () {
        cambiarCantidadCarrito(producto, obtenerIncrementoCantidadCatalogo(producto));
      });
      controlesProducto.appendChild(botonRestar);
      controlesProducto.appendChild(cantidadActual);
      controlesProducto.appendChild(botonSumar);
    } else {
      const botonAgregar = document.createElement("button");
      botonAgregar.type = "button";
      botonAgregar.textContent = "Agregar al pedido";
      botonAgregar.addEventListener("click", function () {
        agregarProductoAlCarrito(producto, obtenerIncrementoCantidadCatalogo(producto));
      });
      controlesProducto.appendChild(botonAgregar);
    }

    cuerpoProducto.appendChild(nombreProducto);
    cuerpoProducto.appendChild(detalleProducto);
    cuerpoProducto.appendChild(metaProducto);
    cuerpoProducto.appendChild(stockProducto);
    cuerpoProducto.appendChild(controlesProducto);

    tarjetaProducto.appendChild(crearImagenProductoCatalogo(producto));
    tarjetaProducto.appendChild(cuerpoProducto);
    catalogoDom.listaProductos.appendChild(tarjetaProducto);
  });
}

function limpiarFiltrosCatalogo() {
  rubroCatalogoActual = "TODOS";
  ordenCatalogoActual = "relevancia";
  catalogoDom.busquedaProducto.value = "";
  if (catalogoDom.ordenProductos) {
    catalogoDom.ordenProductos.value = "relevancia";
  }
  renderizarFiltrosRubrosCatalogo();
  renderizarProductosCatalogo();
  catalogoDom.busquedaProducto.focus();
}

function buscarItemCarrito(producto) {
  return carritoCatalogo.find(function (itemCarrito) {
    return String(itemCarrito.producto.codigo) === String(producto.codigo);
  });
}

function reconciliarCarritoCatalogoConProductosActuales() {
  if (!Array.isArray(carritoCatalogo) || carritoCatalogo.length === 0) {
    return;
  }

  const productosPorCodigo = {};

  productosCatalogo.forEach(function (producto) {
    productosPorCodigo[String(producto.codigo)] = producto;
  });

  carritoCatalogo = carritoCatalogo.map(function (itemCarrito) {
    const productoActualizado =
      productosPorCodigo[String(itemCarrito.producto && itemCarrito.producto.codigo)];

    if (!productoActualizado) {
      return null;
    }

    const cantidadMaxima =
      obtenerCantidadMaximaProducto(productoActualizado);
    const cantidadActualizada =
      normalizarCantidadCatalogo(
        productoActualizado,
        Math.min(Number(itemCarrito.cantidad) || 0, cantidadMaxima)
      );

    if (cantidadActualizada <= 0) {
      return null;
    }

    return {
      producto: productoActualizado,
      cantidad: cantidadActualizada
    };
  }).filter(Boolean);
}

function obtenerCantidadMaximaProducto(producto) {
  return normalizarCantidadCatalogo(producto, obtenerStockCatalogo(producto));
}

function obtenerPrecioProductoCatalogo(producto) {
  if (typeof obtenerPrecioProductoPorLista === "function") {
    return obtenerPrecioProductoPorLista(producto, "Lista 1");
  }

  return Number(producto.precio) || 0;
}

function normalizarCantidadCatalogo(producto, cantidad) {
  const cantidadNumerica =
    Number(cantidad);

  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
    return 0;
  }

  if (typeof productoEsPeso === "function" && productoEsPeso(producto)) {
    return Math.round(cantidadNumerica * 1000) / 1000;
  }

  const paso = producto.tipoStock === "bultos" && producto.ventaSoloBulto
    ? Math.max(1, Math.floor(Number(producto.unidadesPorBulto) || 1)) : 1;
  return Math.floor(cantidadNumerica / paso) * paso;
}

function obtenerIncrementoCantidadCatalogo(producto) {
  if (producto.tipoStock === "bultos" && producto.ventaSoloBulto) {
    return Math.max(1, Math.floor(Number(producto.unidadesPorBulto) || 1));
  }
  return typeof productoEsPeso === "function" && productoEsPeso(producto) ? 0.1 : 1;
}

function formatearCantidadCatalogo(producto, cantidad) {
  if (typeof productoEsPeso === "function" && productoEsPeso(producto)) {
    return (Number(cantidad) || 0).toLocaleString("es-AR", {
      maximumFractionDigits: 3
    }) + " " + (producto.unidadPeso || "kg");
  }

  return String(Math.floor(Number(cantidad) || 0));
}

function marcarCarritoCatalogoPendiente() {
  pedidoCatalogoConfirmado = false;
}

function agregarProductoAlCarrito(producto, cantidad) {
  if (carritoCatalogo.length === 0) idBorradorCatalogo = crypto.randomUUID();
  const itemExistente =
    buscarItemCarrito(producto);
  const cantidadMaxima =
    obtenerCantidadMaximaProducto(producto);
  const cantidadNormalizada =
    normalizarCantidadCatalogo(producto, cantidad || obtenerIncrementoCantidadCatalogo(producto));

  if (cantidadMaxima <= 0) {
    mostrarAvisoCatalogo("Este producto no tiene stock disponible.", "aviso");
    return;
  }

  if (cantidadNormalizada <= 0) {
    alert("Ingrese una cantidad valida.");
    return;
  }

  if (itemExistente) {
    const cantidadAnterior = itemExistente.cantidad;
    itemExistente.cantidad =
      Math.min(cantidadMaxima, itemExistente.cantidad + cantidadNormalizada);
    if (itemExistente.cantidad === cantidadAnterior) {
      mostrarAvisoCatalogo("Ya agregaste todo el stock disponible.", "aviso");
      return;
    }
  } else {
    carritoCatalogo.push({
      producto: producto,
      cantidad: Math.min(cantidadMaxima, cantidadNormalizada)
    });
  }

  marcarCarritoCatalogoPendiente();
  guardarBorradorCatalogo();
  renderizarCarritoCatalogo();
  renderizarProductosCatalogo();
  mostrarAvisoCatalogo(producto.nombre + " agregado.");
}

function cambiarCantidadCarrito(producto, cambio) {
  const itemExistente =
    buscarItemCarrito(producto);

  if (!itemExistente) {
    return;
  }

  itemExistente.cantidad =
    normalizarCantidadCatalogo(producto, itemExistente.cantidad + cambio);

  if (itemExistente.cantidad <= 0) {
    carritoCatalogo = carritoCatalogo.filter(function (itemCarrito) {
      return itemCarrito.producto.codigo !== producto.codigo;
    });
  } else {
    itemExistente.cantidad =
      Math.min(obtenerCantidadMaximaProducto(producto), itemExistente.cantidad);
  }

  marcarCarritoCatalogoPendiente();
  guardarBorradorCatalogo();
  renderizarCarritoCatalogo();
  renderizarProductosCatalogo();
}

function establecerCantidadCarrito(producto, cantidad) {
  const itemExistente =
    buscarItemCarrito(producto);

  if (!itemExistente) {
    return;
  }

  const cantidadNormalizada =
    normalizarCantidadCatalogo(producto, cantidad);

  if (cantidadNormalizada <= 0) {
    carritoCatalogo = carritoCatalogo.filter(function (itemCarrito) {
      return itemCarrito.producto.codigo !== producto.codigo;
    });
  } else {
    itemExistente.cantidad =
      Math.min(obtenerCantidadMaximaProducto(producto), cantidadNormalizada);
  }

  marcarCarritoCatalogoPendiente();
  guardarBorradorCatalogo();
  renderizarCarritoCatalogo();
  renderizarProductosCatalogo();
}

function calcularTotalCatalogo() {
  return carritoCatalogo.reduce(function (centavos, itemCarrito) {
    return centavos + Math.round(itemCarrito.cantidad * obtenerPrecioProductoCatalogo(itemCarrito.producto) * 100);
  }, 0) / 100;
}

function actualizarResumenMovilCatalogo() {
  if (!catalogoDom.resumenMovil || !catalogoDom.resumenMovilDetalle) {
    return;
  }

  const cantidadProductos =
    carritoCatalogo.length;
  const etiquetaProductos =
    cantidadProductos === 1 ? "producto" : "productos";

  catalogoDom.resumenMovilDetalle.textContent =
    cantidadProductos + " " + etiquetaProductos + " · " +
    formatearPrecioCatalogo(calcularTotalCatalogo());
  catalogoDom.resumenMovil.classList.toggle(
    "catalogo-resumen-movil-activo",
    cantidadProductos > 0
  );
  if (catalogoDom.carritoCantidad) {
    catalogoDom.carritoCantidad.textContent =
      cantidadProductos + " " + etiquetaProductos;
  }
  if (catalogoDom.vaciarCarrito) {
    catalogoDom.vaciarCarrito.hidden = cantidadProductos === 0;
  }
}

function renderizarCarritoCatalogo() {
  catalogoDom.itemsCarrito.innerHTML = "";
  catalogoDom.totalPedido.textContent =
    formatearPrecioCatalogo(calcularTotalCatalogo());
  actualizarResumenMovilCatalogo();

  if (carritoCatalogo.length === 0) {
    const mensajeVacio = document.createElement("p");
    mensajeVacio.className = "catalogo-carrito-vacio";
    mensajeVacio.textContent = "Todavia no agregaste productos.";
    catalogoDom.itemsCarrito.appendChild(mensajeVacio);
    return;
  }

  carritoCatalogo.forEach(function (itemCarrito) {
    const item = document.createElement("div");
    item.className = "catalogo-item-carrito";

    const nombre = document.createElement("strong");
    nombre.textContent = itemCarrito.producto.nombre;

    const encabezado = document.createElement("div");
    encabezado.className = "catalogo-item-carrito-encabezado";
    const botonQuitar = document.createElement("button");
    botonQuitar.type = "button";
    botonQuitar.className = "catalogo-item-quitar";
    botonQuitar.textContent = "Quitar";
    botonQuitar.setAttribute("aria-label", "Quitar " + itemCarrito.producto.nombre);
    botonQuitar.addEventListener("click", function () {
      carritoCatalogo = carritoCatalogo.filter(function (itemGuardado) {
        return itemGuardado.producto.codigo !== itemCarrito.producto.codigo;
      });
      marcarCarritoCatalogoPendiente();
      guardarBorradorCatalogo();
      renderizarCarritoCatalogo();
      renderizarProductosCatalogo();
      mostrarAvisoCatalogo("Producto quitado del pedido.", "aviso");
    });
    encabezado.appendChild(nombre);
    encabezado.appendChild(botonQuitar);

    const subtotal = document.createElement("span");
    subtotal.textContent =
      formatearPrecioCatalogo(itemCarrito.cantidad * obtenerPrecioProductoCatalogo(itemCarrito.producto));

    const controlCantidad = document.createElement("div");
    controlCantidad.className = "catalogo-control-cantidad";

    const botonRestar = document.createElement("button");
    botonRestar.type = "button";
    botonRestar.textContent = "-";
    botonRestar.addEventListener("click", function () {
      cambiarCantidadCarrito(
        itemCarrito.producto,
        -obtenerIncrementoCantidadCatalogo(itemCarrito.producto)
      );
    });

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.step = typeof productoEsPeso === "function" && productoEsPeso(itemCarrito.producto) ? "0.001" : String(obtenerIncrementoCantidadCatalogo(itemCarrito.producto));
    cantidad.min = cantidad.step;
    cantidad.value = String(itemCarrito.cantidad);
    cantidad.inputMode = "decimal";
    cantidad.setAttribute("aria-label", "Cantidad de " + itemCarrito.producto.nombre);
    cantidad.addEventListener("change", function () {
      establecerCantidadCarrito(itemCarrito.producto, Number(cantidad.value));
    });

    const botonSumar = document.createElement("button");
    botonSumar.type = "button";
    botonSumar.textContent = "+";
    botonSumar.addEventListener("click", function () {
      cambiarCantidadCarrito(
        itemCarrito.producto,
        obtenerIncrementoCantidadCatalogo(itemCarrito.producto)
      );
    });

    controlCantidad.appendChild(botonRestar);
    controlCantidad.appendChild(cantidad);
    controlCantidad.appendChild(botonSumar);

    const precioUnitario = document.createElement("small");
    precioUnitario.textContent =
      formatearCantidadCatalogo(itemCarrito.producto, itemCarrito.cantidad) + " × " +
      formatearPrecioCatalogo(obtenerPrecioProductoCatalogo(itemCarrito.producto));

    item.appendChild(encabezado);
    item.appendChild(subtotal);
    item.appendChild(precioUnitario);
    item.appendChild(controlCantidad);
    catalogoDom.itemsCarrito.appendChild(item);
  });
}

function abrirCarritoCatalogo() {
  if (window.matchMedia("(max-width: 920px)").matches) {
    catalogoDom.itemsCarrito.closest("#catalogoCarrito").classList.add("catalogo-carrito-abierto");
    catalogoDom.carritoFondo.hidden = false;
    document.body.classList.add("catalogo-carrito-movil-abierto");
    catalogoDom.cerrarCarrito.focus();
    return;
  }

  document.getElementById("catalogoCarrito").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarCarritoCatalogo() {
  document.getElementById("catalogoCarrito").classList.remove("catalogo-carrito-abierto");
  catalogoDom.carritoFondo.hidden = true;
  document.body.classList.remove("catalogo-carrito-movil-abierto");
  if (catalogoDom.resumenMovil) {
    catalogoDom.resumenMovil.focus();
  }
}

function vaciarCarritoCatalogo() {
  if (carritoCatalogo.length === 0) {
    return;
  }

  const ahora = Date.now();
  if (ahora > confirmarVaciadoCatalogoHasta) {
    confirmarVaciadoCatalogoHasta = ahora + 4000;
    catalogoDom.vaciarCarrito.textContent = "Toca otra vez para confirmar";
    catalogoDom.vaciarCarrito.classList.add("confirmar");
    mostrarAvisoCatalogo("El pedido todavia no se borro.", "aviso");
    window.setTimeout(function () {
      if (Date.now() > confirmarVaciadoCatalogoHasta) {
        catalogoDom.vaciarCarrito.textContent = "Vaciar pedido";
        catalogoDom.vaciarCarrito.classList.remove("confirmar");
      }
    }, 4100);
    return;
  }

  carritoCatalogo = [];
  confirmarVaciadoCatalogoHasta = 0;
  pedidoCatalogoConfirmado = false;
  catalogoDom.vaciarCarrito.textContent = "Vaciar pedido";
  catalogoDom.vaciarCarrito.classList.remove("confirmar");
  guardarBorradorCatalogo();
  renderizarCarritoCatalogo();
  renderizarProductosCatalogo();
  mostrarAvisoCatalogo("Pedido vaciado.", "aviso");
}

function limpiarTelefonoWhatsApp(telefono) {
  return String(telefono || "").replace(/[^\d]/g, "");
}

async function cargarConfiguracionPublicaCatalogo() {
  let telefono = "";
  vendedorOrigenCatalogo = null;
  referenciaVendedorCatalogoInvalida = false;
  try {
    if (referenciaVendedorCatalogoToken &&
        typeof obtenerEnlaceCatalogoVendedorSupabase === "function" &&
        typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado()) {
      const vendedor = await obtenerEnlaceCatalogoVendedorSupabase(referenciaVendedorCatalogoToken);
      if (!vendedor) {
        referenciaVendedorCatalogoInvalida = true;
      } else {
        const numeroVendedor = limpiarTelefonoWhatsApp(vendedor.whatsapp);
        if (!/^[1-9][0-9]{7,14}$/.test(numeroVendedor)) {
          referenciaVendedorCatalogoInvalida = true;
        } else {
          vendedorOrigenCatalogo = vendedor;
          telefono = numeroVendedor;
        }
      }
    } else if (referenciaVendedorCatalogoToken) {
      referenciaVendedorCatalogoInvalida = true;
    } else if (typeof obtenerConfiguracionCatalogoPublicoSupabase === "function" &&
        typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado()) {
      const configuracion = await obtenerConfiguracionCatalogoPublicoSupabase();
      const numero = limpiarTelefonoWhatsApp(configuracion.whatsapp);
      if (/^[1-9][0-9]{7,14}$/.test(numero)) telefono = numero;
    }
  } catch (error) {
    console.warn("No se pudo consultar el contacto comercial:", error);
    if (referenciaVendedorCatalogoToken) referenciaVendedorCatalogoInvalida = true;
  }
  catalogoDom.telefonoDestino.value = telefono;
  if (catalogoDom.contactoAyuda) {
    if (vendedorOrigenCatalogo) {
      catalogoDom.contactoAyuda.textContent =
        "Este catalogo te lo envio " + vendedorOrigenCatalogo.vendedorNombre +
        ". El pedido queda asignado a ese vendedor y podes enviarle el comprobante por WhatsApp.";
    } else if (referenciaVendedorCatalogoInvalida) {
      catalogoDom.contactoAyuda.textContent =
        "Este enlace de vendedor no es valido. Pedi al vendedor que te comparta uno nuevo.";
    } else {
      catalogoDom.contactoAyuda.textContent = telefono
        ? "Tu pedido llega a la distribuidora. Al confirmar, podes enviar el comprobante a su WhatsApp."
        : "Tu pedido llega directamente a la distribuidora, aunque WhatsApp no este disponible.";
    }
  }
  return telefono;
}

function construirMensajePedidoCatalogo() {
  const lineasProductos =
    carritoCatalogo.map(function (itemCarrito) {
      const subtotal =
        redondearDinero(itemCarrito.cantidad * obtenerPrecioProductoCatalogo(itemCarrito.producto));

      return "- " + formatearCantidadCatalogo(itemCarrito.producto, itemCarrito.cantidad) + " x " +
        itemCarrito.producto.codigo + " - " + itemCarrito.producto.nombre + " (" +
        formatearPrecioCatalogo(subtotal) + ")";
    });

  const nombreCliente =
    catalogoDom.nombreCliente.value.trim() || "Sin nombre";
  const direccionCliente =
    catalogoDom.direccionCliente.value.trim() || "Sin direccion";
  const comentarioCliente =
    catalogoDom.comentarioCliente.value.trim();

  const lineasMensaje = [
    "Hola, quiero hacer este pedido:",
    "",
    "Cliente: " + nombreCliente,
    "Direccion: " + direccionCliente,
    "Telefono: " + catalogoDom.telefonoCliente.value.trim(),
    "",
    lineasProductos.join("\n"),
    "",
    "Total estimado: " + formatearPrecioCatalogo(calcularTotalCatalogo())
  ];

  if (comentarioCliente) {
    lineasMensaje.push("", "Comentario: " + comentarioCliente);
  }

  return lineasMensaje.join("\n");
}

function crearDatosPedidoCatalogoParaAdmin() {
  return {
    origen: "catalogo_publico",
    vendedor_token: vendedorOrigenCatalogo ? referenciaVendedorCatalogoToken : null,
    cliente: {
      nombre: catalogoDom.nombreCliente.value.trim() || "Cliente catalogo",
      direccion: catalogoDom.direccionCliente.value.trim() || "Sin direccion",
      telefono: limpiarTelefonoWhatsApp(catalogoDom.telefonoCliente.value),
      codigo: catalogoDom.codigoCliente.value.trim() || null
    },
    comentario: catalogoDom.comentarioCliente.value.trim(),
    items: carritoCatalogo.map(function (itemCarrito) {
      return {
        codigo: Number(itemCarrito.producto.codigo) || 0,
        cantidad: Number(itemCarrito.cantidad) || 0,
        precio_unitario: obtenerPrecioProductoCatalogo(itemCarrito.producto)
      };
    })
  };
}

function crearFirmaPedidoCatalogo() {
  const itemsFirma =
    carritoCatalogo.map(function (itemCarrito) {
      return [
        Number(itemCarrito.producto.codigo) || 0,
        Number(itemCarrito.cantidad) || 0
      ].join(":");
    }).join("|");

  return [
    idBorradorCatalogo,
    vendedorOrigenCatalogo ? referenciaVendedorCatalogoToken : "distribuidora",
    catalogoDom.nombreCliente.value.trim(),
    catalogoDom.direccionCliente.value.trim(),
    limpiarTelefonoWhatsApp(catalogoDom.telefonoCliente.value),
    catalogoDom.codigoCliente.value.trim(),
    catalogoDom.comentarioCliente.value.trim(),
    itemsFirma
  ].join("||");
}

// Los pendientes de versiones anteriores no se envian automaticamente:
// no tienen un identificador seguro y podrian estar ya guardados en Administracion.
async function sincronizarPedidosPendientesCatalogo() {
  if (obtenerCantidadPedidosPendientesCatalogo() > 0) {
    mostrarResultadoCatalogo("Hay pedidos antiguos pendientes en este dispositivo. Consulta con la distribuidora antes de reenviarlos.");
  }
}

function leerEnvioCatalogo() {
  const contenido = localStorage.getItem(CLAVE_ENVIO_CATALOGO);
  if (!contenido) return null;
  const envio = JSON.parse(contenido);
  if (!envio || !envio.pedido || !envio.pedido.solicitud_id ||
      !["pendiente", "confirmado"].includes(envio.estado)) {
    throw new Error("No se pudo recuperar el envio anterior. No borres los datos del navegador; consulta con la distribuidora.");
  }
  return envio;
}

function guardarEnvioCatalogo(envio) {
  // Si el navegador no permite guardar, no enviamos: se perderia la clave de reintento.
  localStorage.setItem(CLAVE_ENVIO_CATALOGO, JSON.stringify(envio));
}

function envioCorrespondeAlVendedorActual(envio) {
  const tokenEnvio = envio && envio.pedido && envio.pedido.vendedor_token
    ? String(envio.pedido.vendedor_token)
    : "";
  const tokenActual = vendedorOrigenCatalogo ? referenciaVendedorCatalogoToken : "";
  return tokenEnvio === tokenActual;
}

function mostrarResultadoCatalogo(mensaje, enlace) {
  catalogoDom.resultado.hidden = false;
  catalogoDom.resultadoTexto.textContent = mensaje;
  catalogoDom.resultadoWhatsapp.hidden = !enlace;
  if (enlace) catalogoDom.resultadoWhatsapp.href = enlace;
  else catalogoDom.resultadoWhatsapp.removeAttribute("href");
}

function bloquearEdicionCatalogo(bloqueado) {
  catalogoDom.listaProductos.inert = bloqueado;
  catalogoDom.itemsCarrito.inert = bloqueado;
  catalogoDom.vaciarCarrito.disabled = bloqueado;
  catalogoDom.botonCopiarPedido.disabled = bloqueado;
  [catalogoDom.nombreCliente, catalogoDom.direccionCliente, catalogoDom.telefonoCliente,
    catalogoDom.codigoCliente, catalogoDom.telefonoDestino, catalogoDom.comentarioCliente]
    .forEach(function (control) { control.disabled = bloqueado; });
}

function confirmarEnvioCatalogo(envio, resultado) {
  if (envio.estado !== "confirmado" && envio.enlace) {
    envio.enlace += encodeURIComponent("\n\nPedido confirmado #" + resultado.numero + "\nTotal confirmado: " + formatearPrecioCatalogo(resultado.total));
  }
  envio.estado = "confirmado";
  envio.resultado = resultado;
  guardarEnvioCatalogo(envio);
  pedidoCatalogoConfirmado = true;
  carritoCatalogo = [];
  guardarBorradorCatalogo();
  renderizarCarritoCatalogo();
  renderizarProductosCatalogo();
  bloquearEdicionCatalogo(false);
  actualizarEstadoCatalogo("Pedido #" + resultado.numero + " guardado en Administracion");
  mostrarResultadoCatalogo(
    "Pedido #" + resultado.numero + " confirmado. Total: " + formatearPrecioCatalogo(resultado.total) +
    (envio.enlace ? ". Podes enviar el comprobante por WhatsApp sin volver a cargar el pedido." : ". La distribuidora ya lo tiene en su bandeja de pedidos."),
    envio.enlace
  );
  if (catalogoDom.resultado.scrollIntoView) catalogoDom.resultado.scrollIntoView({ block: "nearest" });
}

function restaurarEnvioCatalogo() {
  const envio = leerEnvioCatalogo();
  if (!envio) return;
  if (!envioCorrespondeAlVendedorActual(envio)) {
    if (envio.estado === "pendiente") {
      bloquearEdicionCatalogo(true);
      mostrarResultadoCatalogo("Hay un pedido pendiente creado desde otro enlace. Volve a ese enlace para reintentarlo sin duplicarlo.");
    }
    return;
  }
  if (envio.estado === "pendiente") {
    bloquearEdicionCatalogo(true);
    catalogoDom.botonEnviarWhatsapp.textContent = "Reintentar confirmacion";
    mostrarResultadoCatalogo("Hay un envio sin confirmar. Reintenta para consultar o guardar el mismo pedido, sin duplicarlo.");
    abrirCarritoCatalogo();
  } else {
    // Una interrupcion entre guardar la confirmacion y vaciar el borrador no debe duplicar el pedido.
    if (envio.firma === crearFirmaPedidoCatalogo()) {
      carritoCatalogo = [];
      guardarBorradorCatalogo();
      renderizarCarritoCatalogo();
      renderizarProductosCatalogo();
    }
    mostrarResultadoCatalogo("Ultimo pedido confirmado: #" + envio.resultado.numero + ".", envio.enlace);
  }
}

function esRechazoDefinitivoCatalogo(error) {
  // Solo estos errores de la transaccion garantizan que no se guardo ningun pedido.
  return ["P0001", "22023", "23514", "22P02"].includes(error && error.code);
}

function validarPedidoCatalogo() {
  if (referenciaVendedorCatalogoInvalida) {
    mostrarResultadoCatalogo("Este enlace de vendedor no es valido. Pedi al vendedor que te comparta uno nuevo.");
    return false;
  }
  const controles = [
    [catalogoDom.nombreCliente, catalogoDom.nombreCliente.value.trim().length >= 2 && catalogoDom.nombreCliente.value.trim().length <= 120, "Escribi un nombre de 2 a 120 caracteres."],
    [catalogoDom.direccionCliente, catalogoDom.direccionCliente.value.trim().length >= 3 && catalogoDom.direccionCliente.value.trim().length <= 180, "Completa la direccion de entrega."],
    [catalogoDom.telefonoCliente, /^[0-9]{8,15}$/.test(limpiarTelefonoWhatsApp(catalogoDom.telefonoCliente.value)), "Completa tu telefono con codigo de area."],
    [catalogoDom.codigoCliente, !catalogoDom.codigoCliente.value.trim() || /^[1-9][0-9]{0,9}$/.test(catalogoDom.codigoCliente.value.trim()), "Revisa el codigo de cliente o dejalo vacio."]
  ];
  for (const [control, valido, mensaje] of controles) {
    if (!valido) {
      mostrarResultadoCatalogo(mensaje);
      abrirCarritoCatalogo();
      control.focus();
      return false;
    }
  }
  if (carritoCatalogo.length === 0) {
    mostrarResultadoCatalogo("Agrega al menos un producto antes de enviar el pedido.");
    return false;
  }

  if (catalogoDom.nombreCliente.value.trim() === "") {
    mostrarAvisoCatalogo("Escribi tu nombre o el nombre del negocio.", "error");
    abrirCarritoCatalogo();
    catalogoDom.nombreCliente.focus();
    return false;
  }

  return true;
}

function catalogoTienePedidoSinEnviar() {
  try {
    const envio = leerEnvioCatalogo();
    if (envio && envio.estado === "pendiente") return true;
  } catch (_) { return true; }
  return pedidoCatalogoEnCurso || (carritoCatalogo.length > 0 && !pedidoCatalogoConfirmado);
}

function advertirSalidaCatalogoConPedido(evento) {
  if (!catalogoTienePedidoSinEnviar()) {
    return;
  }

  evento.preventDefault();
  evento.returnValue = "";
  return "";
}

function puedeActualizarCatalogoAlVolver() {
  if (document.hidden || catalogoActualizandoAlVolver) {
    return false;
  }

  if (catalogoTienePedidoSinEnviar()) {
    return false;
  }

  if (Date.now() - ultimaActualizacionCatalogoAlVolver < INTERVALO_ACTUALIZACION_CATALOGO_AL_VOLVER) {
    return false;
  }

  return typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado();
}

async function actualizarCatalogoAlVolver() {
  if (!puedeActualizarCatalogoAlVolver()) {
    return;
  }

  catalogoActualizandoAlVolver = true;
  ultimaActualizacionCatalogoAlVolver = Date.now();

  try {
    actualizarEstadoCatalogo("Actualizando catalogo...");
    await cargarProductosCatalogo();
    reconciliarCarritoCatalogoConProductosActuales();
    catalogoDatosPendientesDeActualizar = false;
    await sincronizarPedidosPendientesCatalogo();
    renderizarProductosCatalogo();
    renderizarCarritoCatalogo();
    actualizarEstadoCatalogo("Catalogo actualizado");
  } catch (error) {
    console.warn("No se pudo actualizar catalogo al volver:", error);
    actualizarEstadoCatalogo("No se pudo actualizar catalogo online");
  } finally {
    catalogoActualizandoAlVolver = false;
  }
}

function puedeEscucharCambiosCatalogoSupabase() {
  return typeof supabaseEstaConfigurado === "function" &&
    supabaseEstaConfigurado() &&
    typeof supabaseClient !== "undefined" &&
    supabaseClient &&
    typeof supabaseClient.channel === "function";
}

function detenerActualizacionTiempoRealCatalogo() {
  clearTimeout(temporizadorActualizacionCatalogoSupabase);
  temporizadorActualizacionCatalogoSupabase = null;

  if (!canalActualizacionCatalogoSupabase) {
    return;
  }

  const canalActual = canalActualizacionCatalogoSupabase;
  canalActualizacionCatalogoSupabase = null;

  try {
    if (typeof supabaseClient !== "undefined" &&
      supabaseClient &&
      typeof supabaseClient.removeChannel === "function") {
      supabaseClient.removeChannel(canalActual);
    }
  } catch (error) {
    console.warn("No se pudo cerrar realtime del catalogo:", error);
  }
}

function iniciarActualizacionTiempoRealCatalogo() {
  if (!puedeEscucharCambiosCatalogoSupabase() || canalActualizacionCatalogoSupabase) {
    return;
  }

  const canal =
    supabaseClient.channel("lv-catalogo-cambios");

  TABLAS_ACTUALIZACION_CATALOGO_SUPABASE.forEach(function (tabla) {
    canal.on(
      "postgres_changes",
      { event: "*", schema: "public", table: tabla },
      function () {
        programarActualizacionCatalogoPorCambioSupabase(tabla);
      }
    );
  });

  canal.subscribe(function (estado) {
    if (estado === "SUBSCRIBED") {
      actualizarEstadoCatalogo("Catalogo en vivo activo");
    }

    if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
      actualizarEstadoCatalogo("Catalogo online activo. Se actualiza al volver a la pantalla");
    }
  });

  canalActualizacionCatalogoSupabase = canal;
}

function programarActualizacionCatalogoPorCambioSupabase(tabla) {
  if (!puedeEscucharCambiosCatalogoSupabase()) {
    detenerActualizacionTiempoRealCatalogo();
    return;
  }

  ultimaTablaActualizacionCatalogoSupabase = tabla || "productos";
  clearTimeout(temporizadorActualizacionCatalogoSupabase);
  temporizadorActualizacionCatalogoSupabase = setTimeout(function () {
    recargarCatalogoPorCambioSupabase();
  }, 900);
}

async function recargarCatalogoPorCambioSupabase() {
  if (catalogoRecargandoPorCambioSupabase || !puedeEscucharCambiosCatalogoSupabase()) {
    return;
  }

  if (catalogoTienePedidoSinEnviar()) {
    catalogoDatosPendientesDeActualizar = true;
    actualizarEstadoCatalogo("Hay cambios nuevos. Se actualiza al terminar el pedido");
    return;
  }

  catalogoRecargandoPorCambioSupabase = true;

  try {
    await cargarProductosCatalogo();
    reconciliarCarritoCatalogoConProductosActuales();
    catalogoDatosPendientesDeActualizar = false;
    renderizarProductosCatalogo();
    renderizarCarritoCatalogo();
    actualizarEstadoCatalogo(
      "Catalogo actualizado en vivo" +
        (ultimaTablaActualizacionCatalogoSupabase ? " (" + ultimaTablaActualizacionCatalogoSupabase + ")" : "")
    );
  } catch (error) {
    console.warn("No se pudo actualizar catalogo por cambio Supabase:", error);
    actualizarEstadoCatalogo("No se pudo actualizar catalogo online");
  } finally {
    catalogoRecargandoPorCambioSupabase = false;
  }
}

function marcarFormularioCatalogoPendiente() {
  if (carritoCatalogo.length > 0) {
    pedidoCatalogoConfirmado = false;
  }
}

async function copiarPedidoCatalogo() {
  if (!validarPedidoCatalogo()) {
    return;
  }

  const mensajePedido =
    construirMensajePedidoCatalogo();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(mensajePedido);
    mostrarAvisoCatalogo("Pedido copiado. Ya podes pegarlo donde quieras.");
    return;
  }

  window.prompt("Copia el pedido:", mensajePedido);
}

async function enviarPedidoPorWhatsapp(evento) {
  evento.preventDefault();
  if (pedidoCatalogoEnCurso) return;
  pedidoCatalogoEnCurso = true;
  try {
    if (navigator.locks && navigator.locks.request) {
      await navigator.locks.request("lv-catalogo-enviar", procesarEnvioCatalogo);
    } else {
      await procesarEnvioCatalogo();
    }
  } finally {
    pedidoCatalogoEnCurso = false;
  }
}

async function procesarEnvioCatalogo() {
  let envio;
  try {
    envio = leerEnvioCatalogo();
    if (envio && !envioCorrespondeAlVendedorActual(envio)) {
      mostrarResultadoCatalogo("Este pedido se inicio desde otro enlace. Volve al enlace original para reintentarlo sin duplicarlo.");
      return;
    }
    if (envio && envio.estado === "confirmado" && (carritoCatalogo.length === 0 || envio.firma === crearFirmaPedidoCatalogo())) {
      confirmarEnvioCatalogo(envio, envio.resultado);
      return;
    }
    if (!envio || envio.estado !== "pendiente") {
      if (!validarPedidoCatalogo()) return;
      const telefono = await cargarConfiguracionPublicaCatalogo();
      if (typeof supabaseEstaConfigurado !== "function" || !supabaseEstaConfigurado() ||
          typeof crearPedidoCatalogoPublicoSupabase !== "function") {
        mostrarResultadoCatalogo("No se puede confirmar: el servicio de pedidos no esta configurado.");
        return;
      }
      const pedido = crearDatosPedidoCatalogoParaAdmin();
      pedido.solicitud_id = crypto.randomUUID();
      envio = {
        estado: "pendiente",
        firma: crearFirmaPedidoCatalogo(),
        pedido: pedido,
        enlace: telefono ? "https://wa.me/" + telefono + "?text=" + encodeURIComponent(construirMensajePedidoCatalogo()) : ""
      };
      guardarBorradorCatalogo();
      guardarEnvioCatalogo(envio);
    }
  } catch (error) {
    mostrarResultadoCatalogo("No se envio el pedido. " + error.message);
    return;
  }

  bloquearEdicionCatalogo(true);
  catalogoDom.botonEnviarWhatsapp.disabled = true;
  catalogoDom.botonEnviarWhatsapp.textContent = "Confirmando...";
  catalogoDom.botonEnviarWhatsapp.setAttribute("aria-busy", "true");
  try {
    const resultado = await crearPedidoCatalogoPublicoSupabase(envio.pedido);
    if (!resultado || !Number.isInteger(Number(resultado.numero)) || Number(resultado.numero) <= 0) {
      throw new Error("El servidor no devolvio una confirmacion valida.");
    }
    confirmarEnvioCatalogo(envio, resultado);
    // WhatsApp se abre con un enlace visible: los navegadores bloquean ventanas abiertas despues de esperar la red.
  } catch (error) {
    pedidoCatalogoConfirmado = false;
    if (esRechazoDefinitivoCatalogo(error)) {
      localStorage.removeItem(CLAVE_ENVIO_CATALOGO);
      bloquearEdicionCatalogo(false);
      const mensaje = "Pedido no guardado: " + (error.message || "Revisa los datos.");
      mostrarResultadoCatalogo(mensaje);
      actualizarEstadoCatalogo("Pedido rechazado. Revisa los datos antes de confirmar.");
      try {
        await cargarProductosCatalogo();
        reconciliarCarritoCatalogoConProductosActuales();
        renderizarFiltrosRubrosCatalogo();
        renderizarProductosCatalogo();
        renderizarCarritoCatalogo();
        guardarBorradorCatalogo();
      } catch (_) { /* Conservamos el pedido para corregirlo, sin simular confirmacion. */ }
      mostrarResultadoCatalogo(mensaje);
    } else {
      // Una respuesta perdida puede corresponder a un pedido guardado: mantenemos el mismo ID y payload.
      mostrarResultadoCatalogo("No pudimos confirmar la respuesta del servidor. Toca Reintentar confirmacion: se consulta el mismo envio y no se crea otro pedido.");
      actualizarEstadoCatalogo("Envio sin confirmar");
    }
  } finally {
    catalogoDom.botonEnviarWhatsapp.disabled = false;
    catalogoDom.botonEnviarWhatsapp.removeAttribute("aria-busy");
    try {
      const ultimo = leerEnvioCatalogo();
      catalogoDom.botonEnviarWhatsapp.textContent =
        ultimo && ultimo.estado === "pendiente" ? "Reintentar confirmacion" : "Confirmar pedido";
    } catch (_) {
      catalogoDom.botonEnviarWhatsapp.textContent = "Reintentar confirmacion";
    }
  }
}

async function iniciarCatalogoWhatsapp() {
  restaurarDatosClienteCatalogo();
  await cargarConfiguracionPublicaCatalogo();

  try {
    await cargarProductosCatalogo();
  } catch (_) {
    mostrarResultadoCatalogo("No se pudieron cargar los productos. Revisa la conexion y volve a abrir el catalogo.");
  }
  restaurarCarritoCatalogo();
  reconciliarCarritoCatalogoConProductosActuales();
  await sincronizarPedidosPendientesCatalogo();
  renderizarFiltrosRubrosCatalogo();
  renderizarProductosCatalogo();
  renderizarCarritoCatalogo();
  try {
    restaurarEnvioCatalogo();
  } catch (error) {
    bloquearEdicionCatalogo(true);
    mostrarResultadoCatalogo(error.message);
  }
  iniciarActualizacionTiempoRealCatalogo();
}

catalogoDom.busquedaProducto.addEventListener("input", renderizarProductosCatalogo);
catalogoDom.limpiarBusqueda.addEventListener("click", function () {
  catalogoDom.busquedaProducto.value = "";
  renderizarProductosCatalogo();
  catalogoDom.busquedaProducto.focus();
});
catalogoDom.ordenProductos.addEventListener("change", function () {
  ordenCatalogoActual = catalogoDom.ordenProductos.value || "relevancia";
  renderizarProductosCatalogo();
});
catalogoDom.formularioCliente.addEventListener("submit", enviarPedidoPorWhatsapp);
catalogoDom.botonCopiarPedido.addEventListener("click", copiarPedidoCatalogo);
catalogoDom.resumenMovil.addEventListener("click", abrirCarritoCatalogo);
catalogoDom.cerrarCarrito.addEventListener("click", cerrarCarritoCatalogo);
catalogoDom.carritoFondo.addEventListener("click", cerrarCarritoCatalogo);
catalogoDom.vaciarCarrito.addEventListener("click", vaciarCarritoCatalogo);
[catalogoDom.nombreCliente, catalogoDom.direccionCliente, catalogoDom.telefonoCliente, catalogoDom.codigoCliente, catalogoDom.telefonoDestino, catalogoDom.comentarioCliente]
  .forEach(function (controlFormulario) {
    controlFormulario.addEventListener("input", function () {
      marcarFormularioCatalogoPendiente();
      guardarBorradorCatalogo();
    });
  });
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && document.getElementById("catalogoCarrito").classList.contains("catalogo-carrito-abierto")) {
    cerrarCarritoCatalogo();
  }
});
window.addEventListener("beforeunload", advertirSalidaCatalogoConPedido);
document.addEventListener("visibilitychange", actualizarCatalogoAlVolver);
window.addEventListener("focus", actualizarCatalogoAlVolver);

const catalogoInicializacion = iniciarCatalogoWhatsapp();
