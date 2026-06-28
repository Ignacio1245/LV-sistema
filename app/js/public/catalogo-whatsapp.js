const telefonoDistribuidoraDesdeUrl =
  new URLSearchParams(window.location.search).get("wsp") || "";

let productosCatalogo = [];
let carritoCatalogo = [];

const catalogoDom = {
  estadoConexion: document.getElementById("catalogoEstadoConexion"),
  busquedaProducto: document.getElementById("catalogoBusquedaProducto"),
  listaProductos: document.getElementById("catalogoListaProductos"),
  itemsCarrito: document.getElementById("catalogoItemsCarrito"),
  totalPedido: document.getElementById("catalogoTotalPedido"),
  formularioCliente: document.getElementById("catalogoFormularioCliente"),
  nombreCliente: document.getElementById("catalogoNombreCliente"),
  direccionCliente: document.getElementById("catalogoDireccionCliente"),
  telefonoDestino: document.getElementById("catalogoTelefonoDestino"),
  comentarioCliente: document.getElementById("catalogoComentarioCliente"),
  botonCopiarPedido: document.getElementById("catalogoBotonCopiarPedido")
};

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

  return productoActivoSegunSistema && obtenerStockCatalogo(producto) > 0;
}

function hayProductosConMarcaCatalogo(listaProductos) {
  return listaProductos.some(function (producto) {
    return producto.mostrarCatalogo === true;
  });
}

function filtrarProductosVisiblesCatalogo(listaProductos) {
  const usarMarcaCatalogo =
    hayProductosConMarcaCatalogo(listaProductos);

  return listaProductos.filter(function (producto) {
    if (!productoEstaActivoParaCatalogo(producto)) {
      return false;
    }

    if (!usarMarcaCatalogo) {
      return true;
    }

    return producto.mostrarCatalogo === true;
  });
}

async function cargarProductosCatalogo() {
  try {
    if (typeof supabaseEstaConfigurado === "function" && supabaseEstaConfigurado()) {
      const productosDesdeSupabase =
        typeof obtenerProductosCatalogoPublicoSupabase === "function"
          ? await obtenerProductosCatalogoPublicoSupabase()
          : await obtenerProductosSupabase();

      productosCatalogo =
        filtrarProductosVisiblesCatalogo(productosDesdeSupabase);
      catalogoDom.estadoConexion.textContent =
        "Productos desde Supabase";
      return;
    }
  } catch (error) {
    console.warn("No se pudo cargar Supabase para catalogo:", error);
  }

  productosCatalogo =
    filtrarProductosVisiblesCatalogo(Array.isArray(productos) ? productos : []);
  catalogoDom.estadoConexion.textContent =
    "Modo prueba local";
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
  return productosCatalogo.filter(function (producto) {
    return productoCoincideConBusqueda(producto, catalogoDom.busquedaProducto.value);
  });
}

function formatearPrecioCatalogo(valor) {
  if (typeof formatearDinero === "function") {
    return formatearDinero(Number(valor) || 0);
  }

  return "$" + (Number(valor) || 0).toLocaleString("es-AR");
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

  if (productosFiltrados.length === 0) {
    const mensajeVacio = document.createElement("p");
    mensajeVacio.className = "catalogo-lista-vacia";
    mensajeVacio.textContent = "No hay productos para mostrar con esa busqueda.";
    catalogoDom.listaProductos.appendChild(mensajeVacio);
    return;
  }

  productosFiltrados.forEach(function (producto) {
    const tarjetaProducto = document.createElement("article");
    tarjetaProducto.className = "catalogo-producto";

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
    metaProducto.innerHTML =
      "<span>" + (producto.rubro || "Sin rubro") + "</span>" +
      "<strong class=\"catalogo-producto-precio\">" + formatearPrecioCatalogo(producto.precio) + "</strong>";

    const stockProducto = document.createElement("span");
    stockProducto.textContent =
      typeof formatearStockProducto === "function"
        ? formatearStockProducto(producto)
        : obtenerStockCatalogo(producto) + " u";

    const botonAgregar = document.createElement("button");
    botonAgregar.type = "button";
    botonAgregar.textContent = "Agregar";
    botonAgregar.addEventListener("click", function () {
      agregarProductoAlCarrito(producto);
    });

    cuerpoProducto.appendChild(nombreProducto);
    cuerpoProducto.appendChild(detalleProducto);
    cuerpoProducto.appendChild(metaProducto);
    cuerpoProducto.appendChild(stockProducto);
    cuerpoProducto.appendChild(botonAgregar);

    tarjetaProducto.appendChild(crearImagenProductoCatalogo(producto));
    tarjetaProducto.appendChild(cuerpoProducto);
    catalogoDom.listaProductos.appendChild(tarjetaProducto);
  });
}

function buscarItemCarrito(producto) {
  return carritoCatalogo.find(function (itemCarrito) {
    return itemCarrito.producto.codigo === producto.codigo;
  });
}

function obtenerCantidadMaximaProducto(producto) {
  return Math.max(1, Math.floor(obtenerStockCatalogo(producto)));
}

function agregarProductoAlCarrito(producto) {
  const itemExistente =
    buscarItemCarrito(producto);
  const cantidadMaxima =
    obtenerCantidadMaximaProducto(producto);

  if (itemExistente) {
    itemExistente.cantidad = Math.min(cantidadMaxima, itemExistente.cantidad + 1);
  } else {
    carritoCatalogo.push({
      producto: producto,
      cantidad: 1
    });
  }

  renderizarCarritoCatalogo();
}

function cambiarCantidadCarrito(producto, cambio) {
  const itemExistente =
    buscarItemCarrito(producto);

  if (!itemExistente) {
    return;
  }

  itemExistente.cantidad += cambio;

  if (itemExistente.cantidad <= 0) {
    carritoCatalogo = carritoCatalogo.filter(function (itemCarrito) {
      return itemCarrito.producto.codigo !== producto.codigo;
    });
  } else {
    itemExistente.cantidad =
      Math.min(obtenerCantidadMaximaProducto(producto), itemExistente.cantidad);
  }

  renderizarCarritoCatalogo();
}

function calcularTotalCatalogo() {
  return carritoCatalogo.reduce(function (total, itemCarrito) {
    return total + itemCarrito.cantidad * (Number(itemCarrito.producto.precio) || 0);
  }, 0);
}

function renderizarCarritoCatalogo() {
  catalogoDom.itemsCarrito.innerHTML = "";
  catalogoDom.totalPedido.textContent =
    formatearPrecioCatalogo(calcularTotalCatalogo());

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

    const subtotal = document.createElement("span");
    subtotal.textContent =
      formatearPrecioCatalogo(itemCarrito.cantidad * itemCarrito.producto.precio);

    const controlCantidad = document.createElement("div");
    controlCantidad.className = "catalogo-control-cantidad";

    const botonRestar = document.createElement("button");
    botonRestar.type = "button";
    botonRestar.textContent = "-";
    botonRestar.addEventListener("click", function () {
      cambiarCantidadCarrito(itemCarrito.producto, -1);
    });

    const cantidad = document.createElement("output");
    cantidad.textContent = itemCarrito.cantidad;

    const botonSumar = document.createElement("button");
    botonSumar.type = "button";
    botonSumar.textContent = "+";
    botonSumar.addEventListener("click", function () {
      cambiarCantidadCarrito(itemCarrito.producto, 1);
    });

    controlCantidad.appendChild(botonRestar);
    controlCantidad.appendChild(cantidad);
    controlCantidad.appendChild(botonSumar);

    item.appendChild(nombre);
    item.appendChild(subtotal);
    item.appendChild(controlCantidad);
    catalogoDom.itemsCarrito.appendChild(item);
  });
}

function limpiarTelefonoWhatsApp(telefono) {
  return String(telefono || "").replace(/[^\d]/g, "");
}

function construirMensajePedidoCatalogo() {
  const lineasProductos =
    carritoCatalogo.map(function (itemCarrito) {
      const subtotal =
        itemCarrito.cantidad * (Number(itemCarrito.producto.precio) || 0);

      return "- " + itemCarrito.cantidad + " x " +
        itemCarrito.producto.nombre + " (" +
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

function validarPedidoCatalogo() {
  if (carritoCatalogo.length === 0) {
    alert("Agrega al menos un producto antes de enviar el pedido.");
    return false;
  }

  return true;
}

async function copiarPedidoCatalogo() {
  if (!validarPedidoCatalogo()) {
    return;
  }

  const mensajePedido =
    construirMensajePedidoCatalogo();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(mensajePedido);
    alert("Pedido copiado.");
    return;
  }

  window.prompt("Copia el pedido:", mensajePedido);
}

function enviarPedidoPorWhatsapp(evento) {
  evento.preventDefault();

  if (!validarPedidoCatalogo()) {
    return;
  }

  const telefonoDestino =
    limpiarTelefonoWhatsApp(catalogoDom.telefonoDestino.value);

  if (!telefonoDestino) {
    alert("Cargame el telefono de WhatsApp de la distribuidora.");
    catalogoDom.telefonoDestino.focus();
    return;
  }

  const mensajePedido =
    construirMensajePedidoCatalogo();
  const enlaceWhatsapp =
    "https://wa.me/" + telefonoDestino + "?text=" + encodeURIComponent(mensajePedido);

  window.open(enlaceWhatsapp, "_blank", "noopener");
}

async function iniciarCatalogoWhatsapp() {
  catalogoDom.telefonoDestino.value =
    limpiarTelefonoWhatsApp(telefonoDistribuidoraDesdeUrl);

  await cargarProductosCatalogo();
  renderizarProductosCatalogo();
  renderizarCarritoCatalogo();
}

catalogoDom.busquedaProducto.addEventListener("input", renderizarProductosCatalogo);
catalogoDom.formularioCliente.addEventListener("submit", enviarPedidoPorWhatsapp);
catalogoDom.botonCopiarPedido.addEventListener("click", copiarPedidoCatalogo);

iniciarCatalogoWhatsapp();
