
function seleccionarProducto(producto) {
  if (!productoDisponibleParaPedido(producto)) {
    alert(obtenerMensajeProductoNoDisponible(producto));
    return;
  }

  productoSeleccionado = producto;
  dom.productoSearchInput.value = producto.codigo + " - " + producto.nombre;
  actualizarControlCantidadPorProducto(producto);
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

function numeroProductoSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function enteroProductoSeguro(valor) {
  return Math.max(0, Math.floor(numeroProductoSeguro(valor)));
}

function productoEsPeso(producto) {
  return producto && producto.tipoStock === "peso";
}

function productoManejaBultos(producto) {
  return producto && producto.tipoStock === "bultos";
}

function obtenerUnidadStockProducto(producto) {
  if (productoEsPeso(producto)) {
    return producto.unidadPeso || "kg";
  }

  return "u";
}

function obtenerStockTotalProducto(producto) {
  if (!producto) {
    return 0;
  }

  if (productoEsPeso(producto)) {
    return Math.max(0, numeroProductoSeguro(producto.stock));
  }

  if (productoManejaBultos(producto)) {
    const unidadesPorBulto =
      Math.max(1, enteroProductoSeguro(producto.unidadesPorBulto));
    const bultos =
      enteroProductoSeguro(producto.stockBultos);
    const unidades =
      enteroProductoSeguro(producto.stockUnidades);

    return bultos * unidadesPorBulto + unidades;
  }

  return Math.max(0, enteroProductoSeguro(producto.stock));
}

function reconstruirStockProductoDesdeTotal(producto, stockTotal) {
  const total =
    productoEsPeso(producto)
      ? Math.max(0, numeroProductoSeguro(stockTotal))
      : Math.max(0, enteroProductoSeguro(stockTotal));

  producto.stock = total;

  if (!productoManejaBultos(producto)) {
    return producto;
  }

  const unidadesPorBulto =
    Math.max(1, enteroProductoSeguro(producto.unidadesPorBulto));

  producto.stockBultos =
    Math.floor(total / unidadesPorBulto);
  producto.stockUnidades =
    total % unidadesPorBulto;

  return producto;
}

function formatearStockProducto(producto) {
  const stockTotal =
    obtenerStockTotalProducto(producto);

  if (productoEsPeso(producto)) {
    return stockTotal.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }) + " " + obtenerUnidadStockProducto(producto);
  }

  if (productoManejaBultos(producto)) {
    return enteroProductoSeguro(producto.stockBultos) + " b | " +
      enteroProductoSeguro(producto.stockUnidades) + " u" +
      " (" + stockTotal + " u)";
  }

  return stockTotal + " u";
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

function normalizarNombreListaPrecio(nombreLista) {
  return normalizarTexto(String(nombreLista || "")).replace(/[^a-z0-9]/g, "");
}

function obtenerValorPorNombreLista(objeto, nombreLista) {
  if (!objeto || typeof objeto !== "object") {
    return undefined;
  }

  const nombreNormalizado =
    normalizarNombreListaPrecio(nombreLista);
  const claveEncontrada =
    Object.keys(objeto).find(function (clave) {
      return normalizarNombreListaPrecio(clave) === nombreNormalizado;
    });

  return claveEncontrada ? objeto[claveEncontrada] : undefined;
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
  if (!producto.preciosLista || typeof producto.preciosLista !== "object") {
    producto.preciosLista = {};
  }

  const precioBase =
    Number(producto.precio) ||
    Number(obtenerValorPorNombreLista(producto.preciosLista, "Lista 1")) ||
    0;
  const precioListaUno =
    Number(obtenerValorPorNombreLista(producto.preciosLista, "Lista 1")) > 0
      ? Number(obtenerValorPorNombreLista(producto.preciosLista, "Lista 1"))
      : precioBase;
  const preciosLista = {};

  listasPrecios.forEach(function (lista) {
    const precioPropio =
      Number(obtenerValorPorNombreLista(producto.preciosLista, lista.nombre));

    preciosLista[lista.nombre] =
      normalizarNombreListaPrecio(lista.nombre) === "lista1" || precioPropio > 0
        ? (precioPropio > 0 ? precioPropio : precioListaUno)
        : precioListaUno;
  });

  preciosLista["Lista 1"] = precioListaUno;

  return preciosLista;
}

function obtenerPrecioProductoPorLista(producto, listaPrecios) {
  const lista =
    listaPrecios || "Lista 1";
  const preciosLista =
    obtenerPreciosListaProducto(producto);
  const precioCompatible =
    obtenerValorPorNombreLista(preciosLista, lista);

  return precioCompatible || preciosLista["Lista 1"];
}

function obtenerStockReservadoProducto(producto, pedidoIgnoradoId) {
  if (!producto || !Array.isArray(pedidos)) {
    return 0;
  }

  return pedidos.reduce(function (total, pedido) {
    if (!pedido || pedido.estado !== "PENDIENTE" || pedido.id === pedidoIgnoradoId) {
      return total;
    }

    if (!Array.isArray(pedido.items)) {
      return total;
    }

    return total + pedido.items.reduce(function (subtotal, item) {
      if (!item || !item.producto || item.producto.codigo !== producto.codigo) {
        return subtotal;
      }

      return subtotal + (Number(item.cantidad) || 0);
    }, 0);
  }, 0);
}

function obtenerStockDisponibleProducto(producto, pedidoIgnoradoId) {
  return Math.max(
    obtenerStockTotalProducto(producto) -
      obtenerStockReservadoProducto(producto, pedidoIgnoradoId) -
      obtenerStockMinimoProducto(producto),
    0
  );
}
function obtenerStockVendible(producto, pedidoIgnoradoId) {
  return Math.max(
    obtenerStockTotalProducto(producto) - obtenerStockMinimoProducto(producto),
    0
  );
}

function productoActivo(producto) {
  return producto.activo !== false;
}

function productoDisponibleParaPedido(producto) {
  return productoActivo(producto) && obtenerStockVendible(producto) > 0;
}

function obtenerMensajeProductoNoDisponible(producto) {
  if (!producto) {
    return "Seleccione un producto.";
  }

  if (!productoActivo(producto)) {
    return "Este producto esta inactivo y no se puede vender.";
  }

  const stockTotal =
    obtenerStockTotalProducto(producto);
  const stockMinimo =
    obtenerStockMinimoProducto(producto);
  const stockVendible =
    obtenerStockVendible(producto);

  if (stockVendible <= 0) {
    return "No hay stock vendible para " + producto.nombre +
      ". Stock total: " + formatearStockProducto(producto) +
      ". Stock minimo reservado: " + stockMinimo +
      ". Disponible para vender: 0.";
  }

  return "Este producto no esta disponible para vender.";
}

function obtenerEstadoStockProducto(producto) {
  if (!productoActivo(producto)) {
    return {
      texto: "Inactivo",
      clase: "stock-inactive"
    };
  }

  if (obtenerStockTotalProducto(producto) <= 0) {
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

  if (obtenerStockTotalProducto(producto) > 0) {
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
    stockFinal: obtenerStockTotalProducto(producto)
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

  if (!producto.bajaAutomaticaStock || obtenerStockTotalProducto(producto) <= 0) {
    return false;
  }

  producto.activo = true;
  producto.bajaAutomaticaStock = false;

  registrarAuditoria(
    "Productos",
    "Reactivo producto por ingreso de stock",
    producto.codigo + " - " + producto.nombre + " | Stock " + formatearStockProducto(producto)
  );

  return true;
}

function avisarStockMinimoSiCorresponde(producto) {
  if (!producto || !productoActivo(producto)) {
    return;
  }

  const stockActual =
    obtenerStockTotalProducto(producto);
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
    return total + obtenerStockTotalProducto(producto);
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
