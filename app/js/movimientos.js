function obtenerMovimientosGeneralesFiltrados() {
  const textoBusqueda =
    normalizarTexto(dom.buscarMovimientoGeneralInput.value || "");

  const filtroTipo =
    dom.movimientoTipoFiltro.value || "TODOS";

  return obtenerMovimientosProductos().filter(function (movimiento) {
    const esEntrada =
      movimiento.cantidad > 0;

    const coincideTipo =
      filtroTipo === "TODOS" ||
      (filtroTipo === "ENTRADAS" && esEntrada) ||
      (filtroTipo === "SALIDAS" && !esEntrada);

    const textoMovimiento =
      [
        movimiento.fecha,
        movimiento.tipo,
        movimiento.pedido,
        movimiento.productoCodigo,
        movimiento.productoNombre
      ].join(" ");

    const coincideBusqueda =
      textoBusqueda === "" ||
      normalizarTexto(textoMovimiento).includes(textoBusqueda);

    return coincideTipo && coincideBusqueda;
  });
}

function renderizarMovimientosGenerales() {
  if (!dom.movimientosGeneralesTable) {
    return;
  }

  const movimientos =
    obtenerMovimientosGeneralesFiltrados();

  const entradas =
    movimientos.reduce(function (total, movimiento) {
      return movimiento.cantidad > 0 ? total + movimiento.cantidad : total;
    }, 0);

  const salidas =
    movimientos.reduce(function (total, movimiento) {
      return movimiento.cantidad < 0 ? total + Math.abs(movimiento.cantidad) : total;
    }, 0);

  const neto =
    movimientos.reduce(function (total, movimiento) {
      return total + movimiento.cantidad;
    }, 0);

  dom.movimientosTotalResumen.textContent = movimientos.length;
  dom.movimientosEntradasResumen.textContent = entradas;
  dom.movimientosSalidasResumen.textContent = salidas;
  dom.movimientosNetoResumen.textContent = neto;

  if (movimientos.length === 0) {
    dom.movimientosGeneralesTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          No hay movimientos para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  dom.movimientosGeneralesTable.innerHTML =
    movimientos.map(function (movimiento) {
      const referencia =
        movimiento.pedido ? "#" + movimiento.pedido : "-";

      const cantidadClase =
        movimiento.cantidad >= 0 ? "movement-positive" : "movement-negative";

      return `
        <tr>
          <td>${movimiento.fecha}</td>
          <td>${movimiento.productoCodigo}</td>
          <td>${movimiento.productoNombre}</td>
          <td>${movimiento.tipo}</td>
          <td>${referencia}</td>
          <td class="${cantidadClase}">${movimiento.cantidad}</td>
          <td>${movimiento.stockFinal}</td>
        </tr>
      `;
    }).join("");
}
