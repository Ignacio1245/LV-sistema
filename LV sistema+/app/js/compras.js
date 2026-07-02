function buscarProductoParaCompra(busqueda) {
  const texto =
    normalizarTexto(busqueda || "");

  if (texto === "") {
    return null;
  }

  const codigoBuscado =
    obtenerCodigoDesdeBusquedaProducto(busqueda);

  return productos.find(function (producto) {
    return String(producto.codigo) === texto ||
      String(producto.codigo) === codigoBuscado ||
      normalizarTexto(producto.nombre).includes(texto);
  }) || null;
}

function renderizarOpcionesProductosCompra() {
  if (!dom.productosCompraLista) {
    return;
  }

  dom.productosCompraLista.innerHTML =
    productos.filter(productoActivo).map(function (producto) {
      return `<option value="${producto.codigo} - ${producto.nombre}"></option>`;
    }).join("");
}

function actualizarVistaCompra() {
  if (!dom.compraPreview) {
    return;
  }

  const producto =
    buscarProductoParaCompra(dom.compraProductoInput.value);

  if (!producto) {
    dom.compraPreview.innerHTML =
      "Elegi un producto para ver stock actual y proveedor.";
    return;
  }

  if (!dom.compraProveedorInput.value) {
    dom.compraProveedorInput.value = producto.proveedor || "Sin proveedor";
  }

  dom.compraPreview.innerHTML = `
    <strong>${producto.codigo} - ${producto.nombre}</strong>
    <span>Stock actual: ${formatearStockProducto(producto)}</span>
    <b>Proveedor: ${producto.proveedor || "Sin proveedor"}</b>
  `;
}

function registrarCompra(event) {
  event.preventDefault();

  if (!tienePermiso("compras")) {
    alert("Tu rol no tiene permiso para registrar compras.");
    return;
  }

  const producto =
    buscarProductoParaCompra(dom.compraProductoInput.value);

  if (!producto) {
    alert("No se encontro el producto.");
    return;
  }

  const cantidad =
    Number(dom.compraCantidadInput.value);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    alert("La cantidad debe ser un numero mayor a 0.");
    return;
  }

  if (!productoEsPeso(producto) && !Number.isInteger(cantidad)) {
    alert("Este producto se compra por unidades enteras.");
    return;
  }

  const proveedor =
    asegurarProveedorPorNombre(dom.compraProveedorInput.value || producto.proveedor || "Sin proveedor");

  const costoUnitario =
    Number(dom.compraCostoInput.value) || 0;

  const comprobante =
    dom.compraComprobanteInput.value.trim() || "-";

  const stockAnterior =
    obtenerStockTotalProducto(producto);
  const costoAnterior =
    Number(producto.precioCompra) || 0;

  reconstruirStockProductoDesdeTotal(producto, stockAnterior + cantidad);
  producto.proveedor = proveedor;
  reactivarProductoSiCorrespondePorStock(producto);

  let preciosActualizados = 0;
  if (costoUnitario > 0 && costoUnitario !== costoAnterior) {
    producto.precioCompra = costoUnitario;
    producto.ultimoCostoCompra = costoUnitario;
    producto.fechaUltimaCompra = new Date().toLocaleDateString("es-AR");
    preciosActualizados =
      recalcularPreciosProductoPorCosto(producto, "Compra con costo nuevo");
  }

  if (!Array.isArray(producto.movimientosStock)) {
    producto.movimientosStock = [];
  }

  const fecha =
    new Date().toLocaleDateString("es-AR");

  producto.movimientosStock.push({
    fecha: fecha,
    tipo: "Entrada por compra",
    pedido: comprobante,
    cantidad: cantidad,
    stockFinal: obtenerStockTotalProducto(producto)
  });

  const compra = {
    id: Date.now(),
    fecha: fecha,
    proveedor: proveedor,
    productoCodigo: producto.codigo,
    productoNombre: producto.nombre,
    cantidad: cantidad,
    costoUnitario: costoUnitario,
    total: cantidad * costoUnitario,
    comprobante: comprobante,
    costoAnterior: costoAnterior,
    preciosActualizados: preciosActualizados
  };

  compras.unshift(compra);

  guardarProductos();
  guardarProveedores();
  guardarCompras();

  renderizarCompras();
  renderizarProductos();
  renderizarMovimientosGenerales();
  renderizarProveedores();
  actualizarStockTotal();
  actualizarDashboard();
  renderizarCatalogoProductosPedido();
  guardarProductoOperacionSupabase(producto);

  registrarAuditoria(
    "Compras",
    "Registro compra",
    proveedor + " | " + producto.codigo + " - " + producto.nombre + " | " + cantidad + " unidades | costo " + formatearDinero(costoUnitario) + " | listas actualizadas: " + preciosActualizados
  );

  dom.compraForm.reset();
  actualizarVistaCompra();
}

function renderizarCompras() {
  if (!dom.comprasTable) {
    return;
  }

  renderizarOpcionesProductosCompra();
  renderizarOpcionesProveedoresActivos();

  const textoBusqueda =
    normalizarTexto(dom.buscarCompraInput.value || "");

  const comprasFiltradas =
    compras.filter(function (compra) {
      const textoCompra =
        [
          compra.fecha,
          compra.proveedor,
          compra.productoCodigo,
          compra.productoNombre,
          compra.comprobante
        ].join(" ");

      return textoBusqueda === "" ||
        normalizarTexto(textoCompra).includes(textoBusqueda);
    });

  const unidades =
    comprasFiltradas.reduce(function (total, compra) {
      return total + (Number(compra.cantidad) || 0);
    }, 0);

  const valor =
    comprasFiltradas.reduce(function (total, compra) {
      return total + (Number(compra.total) || 0);
    }, 0);

  dom.comprasTotalResumen.textContent = comprasFiltradas.length;
  dom.comprasUnidadesResumen.textContent = unidades;
  dom.comprasValorResumen.textContent = formatearDinero(valor);

  if (comprasFiltradas.length === 0) {
    dom.comprasTable.innerHTML = `
      <tr>
        <td colspan="9" class="empty-table">
          No hay compras para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  dom.comprasTable.innerHTML =
    comprasFiltradas.map(function (compra) {
      return `
        <tr>
          <td>${compra.fecha}</td>
          <td>${compra.proveedor}</td>
          <td>${compra.productoCodigo} - ${compra.productoNombre}</td>
          <td>${compra.cantidad}</td>
          <td>${formatearDinero(compra.costoUnitario)}</td>
          <td>${Number(compra.costoAnterior) > 0 ? formatearDinero(compra.costoAnterior) : "-"}</td>
          <td>${Number(compra.preciosActualizados) || 0} actualizadas</td>
          <td>${formatearDinero(compra.total)}</td>
          <td>${compra.comprobante}</td>
        </tr>
      `;
    }).join("");
}
