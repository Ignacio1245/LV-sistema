
function seleccionarProducto(producto) {
  if (!productoDisponibleParaPedido(producto)) {
    alert("Este producto no esta activo para vender o no tiene stock disponible.");
    return;
  }

  productoSeleccionado = producto;
  dom.productoSearchInput.value = producto.codigo + " - " + producto.nombre;
  dom.productoSearchResults.classList.add("hidden");
  actualizarVistaBusqueda();
  renderizarCatalogoProductosPedido();
}

function obtenerStockMinimoConfigurado() {
  const stockMinimo = Number(CONFIG.stockMinimo);

  if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
    return 0;
  }

  return stockMinimo;
}

function obtenerStockMinimoProducto(producto) {
  const stockMinimoProducto =
    Number(producto.stockMinimo);

  if (!Number.isNaN(stockMinimoProducto) && stockMinimoProducto > 0) {
    return stockMinimoProducto;
  }

  return obtenerStockMinimoConfigurado();
}

function listaPrecioActiva(lista) {
  return lista.activo !== false;
}

function obtenerNombresListasPreciosActivas() {
  return listasPrecios
    .filter(listaPrecioActiva)
    .map(function (lista) {
      return lista.nombre;
    });
}

function obtenerSiguienteCodigoListaPrecio() {
  if (listasPrecios.length === 0) {
    return 1;
  }

  const codigos =
    listasPrecios.map(function (lista) {
      return Number(lista.codigo) || 0;
    });

  return Math.max.apply(null, codigos) + 1;
}

function crearPreciosListaBase(precioBase) {
  const preciosLista = {};

  listasPrecios.forEach(function (lista) {
    preciosLista[lista.nombre] = precioBase;
  });

  return preciosLista;
}

function obtenerPreciosListaProducto(producto) {
  const precioBase =
    Number(producto.precio) || 0;

  if (!producto.preciosLista || typeof producto.preciosLista !== "object") {
    producto.preciosLista = {};
  }

  const preciosLista = {};

  listasPrecios.forEach(function (lista) {
    preciosLista[lista.nombre] =
      Number(producto.preciosLista[lista.nombre]) || precioBase;
  });

  if (!preciosLista["Lista 1"]) {
    preciosLista["Lista 1"] = precioBase;
  }

  return preciosLista;
}

function obtenerPrecioProductoPorLista(producto, listaPrecios) {
  const lista =
    listaPrecios || "Lista 1";
  const preciosLista =
    obtenerPreciosListaProducto(producto);

  return preciosLista[lista] || preciosLista["Lista 1"];
}

function obtenerStockVendible(producto) {
  return Math.max(
    producto.stock - obtenerStockMinimoProducto(producto),
    0
  );
}

function productoActivo(producto) {
  return producto.activo !== false;
}

function productoDisponibleParaPedido(producto) {
  return productoActivo(producto) && obtenerStockVendible(producto) > 0;
}

function obtenerEstadoStockProducto(producto) {
  if (!productoActivo(producto)) {
    return {
      texto: "Inactivo",
      clase: "stock-inactive"
    };
  }

  if (producto.stock <= 0) {
    return {
      texto: "Inactivo por stock",
      clase: "stock-empty"
    };
  }

  if (!productoDisponibleParaPedido(producto)) {
    return {
      texto: "Stock minimo",
      clase: "stock-low"
    };
  }

  return {
    texto: "Activo",
    clase: "stock-ok"
  };
}

function actualizarEstadoAutomaticoPorStock(producto, mostrarAlerta) {
  if (!producto || !productoActivo(producto)) {
    return false;
  }

  if ((Number(producto.stock) || 0) > 0) {
    return false;
  }

  producto.activo = false;
  producto.bajaAutomaticaStock = true;

  if (!Array.isArray(producto.movimientosStock)) {
    producto.movimientosStock = [];
  }

  producto.movimientosStock.push({
    fecha: new Date().toLocaleDateString("es-AR"),
    tipo: "Baja automatica sin stock",
    pedido: "Stock 0",
    cantidad: 0,
    stockFinal: 0
  });

  registrarAuditoria(
    "Productos",
    "Baja automatica por stock 0",
    producto.codigo + " - " + producto.nombre
  );

  if (mostrarAlerta) {
    alert(
      "El producto " + producto.codigo + " - " + producto.nombre +
      " llego a stock 0 y se paso a inactivo."
    );
  }

  return true;
}

function reactivarProductoSiCorrespondePorStock(producto) {
  if (!producto || productoActivo(producto)) {
    return false;
  }

  if (!producto.bajaAutomaticaStock || (Number(producto.stock) || 0) <= 0) {
    return false;
  }

  producto.activo = true;
  producto.bajaAutomaticaStock = false;

  registrarAuditoria(
    "Productos",
    "Reactivo producto por ingreso de stock",
    producto.codigo + " - " + producto.nombre + " | Stock " + producto.stock
  );

  return true;
}

function avisarStockMinimoSiCorresponde(producto) {
  if (!producto || !productoActivo(producto)) {
    return;
  }

  const stockActual =
    Number(producto.stock) || 0;
  const stockMinimo =
    obtenerStockMinimoProducto(producto);

  if (stockActual <= 0 || stockMinimo <= 0 || stockActual > stockMinimo) {
    return;
  }

  alert(
    "Atencion: " + producto.codigo + " - " + producto.nombre +
    " quedo en stock minimo.\nStock actual: " + stockActual +
    " | Minimo: " + stockMinimo
  );
}

function actualizarStockTotal() {
  const stockTotal = productos.reduce(function(total, producto) {
    return total + producto.stock;
  }, 0);

  document.querySelector("#stockTotal").textContent = stockTotal;
}
function mostrarResultadosProducto() {
  const productosActivos =
    productos.filter(function (producto) {
      return productoActivo(producto);
    });

  const resultados = buscarCoincidencias(productosActivos, dom.productoSearchInput.value);

  if (dom.productoSearchInput.value.trim() === "") {
    dom.productoSearchResults.classList.add("hidden");
    return;
  }

  renderizarResultados(dom.productoSearchResults, resultados, "producto");
}
