
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

function obtenerStockVendible(producto) {
  return Math.max(
    producto.stock - obtenerStockMinimoConfigurado(),
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
