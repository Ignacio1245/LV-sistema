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
      return html`<option value="${producto.codigo} - ${producto.nombre}"></option>`;
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

  dom.compraPreview.innerHTML = html`
    <strong>${producto.codigo} - ${producto.nombre}</strong>
    <span>Stock actual: ${formatearStockProducto(producto)}</span>
    <b>Proveedor: ${producto.proveedor || "Sin proveedor"}</b>
  `;
}

async function registrarCompra(event) {
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

  // La entrada de stock se suma EN EL SERVIDOR, con la fila del producto
  // bloqueada.
  //
  // Antes se leia el stock de la memoria de este navegador, se sumaba aca, y
  // despues se subia la fila entera del producto. Eso pisa lo que otros equipos
  // hicieron mientras tanto:
  //
  //   producto con stock 50 en el servidor
  //   10:15 un vendedor atiende 12 desde el celular (via atomica) -> servidor 38
  //   10:20 se registra una compra de 30 -> en memoria calcula 50+30 y manda 80
  //   el stock real deberia ser 68: se inventaron 12 unidades
  //
  // Y de paso esa misma escritura pisaba precios y estado del producto con lo
  // que tuviera en memoria esta computadora.
  let stockDelServidor = null;

  if (typeof registrarMovimientoStockAtomicoSupabase === "function" &&
      producto.idSupabase &&
      typeof puedeGuardarOperacionEnSupabase === "function" &&
      puedeGuardarOperacionEnSupabase()) {
    try {
      stockDelServidor =
        await registrarMovimientoStockAtomicoSupabase(
          producto.idSupabase,
          cantidad,
          "Entrada por compra",
          "Compra a proveedor " + proveedor
        );
    } catch (error) {
      console.error("No se pudo sumar el stock de la compra en el servidor:", error);
      alert(
        "No se pudo registrar la entrada de stock en el servidor, asi que la " +
        "compra no se guardo.\n\n" + (error.message || "Revisa la conexion y volve a intentar.")
      );
      return;
    }
  }

  reconstruirStockProductoDesdeTotal(
    producto,
    stockDelServidor === null ? stockAnterior + cantidad : stockDelServidor
  );
  producto.proveedor = proveedor;
  reactivarProductoSiCorrespondePorStock(producto);

  let preciosActualizados = 0;
  if (costoUnitario > 0 && costoUnitario !== costoAnterior) {
    producto.precioCompra = costoUnitario;
    producto.ultimoCostoCompra = costoUnitario;
    producto.fechaUltimaCompra = new Date().toLocaleDateString("es-AR");
    preciosActualizados =
      recalcularPreciosProductoPorCosto(producto, "Compra con costo nuevo", costoAnterior);
  }

  const fecha =
    new Date().toLocaleDateString("es-AR");

  registrarMovimientoStockProducto(producto, {
    fecha: fecha,
    tipo: "Entrada por compra",
    motivo: "Compra a proveedor " + proveedor,
    referencia: comprobante,
    pedido: comprobante,
    cantidad: cantidad,
    stockAnterior: stockAnterior,
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

  const productoConfirmadoOnline =
    typeof confirmarGuardadoProductoOnline === "function"
      ? await confirmarGuardadoProductoOnline(producto, "La compra")
      : await guardarProductoOperacionSupabase(producto);

  if (
    typeof productoDebeConfirmarGuardadoOnline === "function" &&
    productoDebeConfirmarGuardadoOnline() &&
    !productoConfirmadoOnline
  ) {
    return;
  }

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
    dom.comprasTable.innerHTML = html`
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
      return html`
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
