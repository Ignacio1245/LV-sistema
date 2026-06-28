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
  const accionesResumen =
    movimientos.reduce(function (resumen, movimiento) {
      const accion =
        movimiento.tipo || "Sin accion";

      if (!resumen[accion]) {
        resumen[accion] = {
          accion: accion,
          movimientos: 0,
          unidades: 0
        };
      }

      resumen[accion].movimientos += 1;
      resumen[accion].unidades += movimiento.cantidad;

      return resumen;
    }, {});
  const movimientosAccionesResumen =
    document.querySelector("#movimientosAccionesResumen");

  dom.movimientosTotalResumen.textContent = movimientos.length;
  dom.movimientosEntradasResumen.textContent = entradas;
  dom.movimientosSalidasResumen.textContent = salidas;
  dom.movimientosNetoResumen.textContent = neto;

  if (movimientosAccionesResumen) {
    const acciones =
      Object.values(accionesResumen).sort(function (primero, segundo) {
        return segundo.movimientos - primero.movimientos;
      });

    movimientosAccionesResumen.innerHTML =
      acciones.length > 0
        ? acciones.map(function (accion) {
          return `
            <div class="report-row">
              <span>${accion.accion}</span>
              <strong>${accion.movimientos} mov. | ${accion.unidades} unidades</strong>
            </div>
          `;
        }).join("")
        : `<div class="empty-table">Sin acciones para mostrar.</div>`;
  }

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

function obtenerProductosConAlertaStock() {
  return productos.filter(function (producto) {
    const stock =
      obtenerStockTotalProducto(producto);
    const minimo =
      obtenerStockMinimoProducto(producto);

    return producto.activo === false || stock <= 0 || stock <= minimo;
  }).sort(function (primero, segundo) {
    return obtenerStockTotalProducto(primero) - obtenerStockTotalProducto(segundo);
  });
}

function renderizarAlertasStock() {
  if (!dom.stockAlertasTable) {
    return;
  }

  const productosAlerta =
    obtenerProductosConAlertaStock();
  const sinStock =
    productos.filter(function (producto) {
      return obtenerStockTotalProducto(producto) <= 0;
    }).length;
  const bajoMinimo =
    productos.filter(function (producto) {
      const stock = obtenerStockTotalProducto(producto);
      const minimo = obtenerStockMinimoProducto(producto);
      return stock > 0 && stock <= minimo;
    }).length;
  const inactivos =
    productos.filter(function (producto) {
      return producto.activo === false;
    }).length;

  dom.stockAlertasSinStockResumen.textContent = sinStock;
  dom.stockAlertasBajoMinimoResumen.textContent = bajoMinimo;
  dom.stockAlertasInactivosResumen.textContent = inactivos;
  dom.stockAlertasRevisarResumen.textContent = productosAlerta.length;
  renderizarReposicionSugeridaStock(productosAlerta);

  if (productosAlerta.length === 0) {
    dom.stockAlertasTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">No hay alertas de stock.</td>
      </tr>
    `;
    return;
  }

  dom.stockAlertasTable.innerHTML =
    productosAlerta.slice(0, 80).map(function (producto) {
      const estado =
        obtenerEstadoStockProducto(producto);

      return `
        <tr>
          <td>${producto.codigo}</td>
          <td><strong>${producto.nombre}</strong></td>
          <td>${producto.rubro || "Sin rubro"}</td>
          <td>${formatearStockProducto(producto)}</td>
          <td>${obtenerStockMinimoProducto(producto)}</td>
          <td><span class="stock-pill ${estado.clase}">${estado.texto}</span></td>
        </tr>
      `;
    }).join("");
}

function obtenerReposicionSugeridaStock(productosAlerta) {
  return productosAlerta.map(function (producto) {
    const stock =
      obtenerStockTotalProducto(producto);
    const minimo =
      obtenerStockMinimoProducto(producto);
    const cantidadSugerida =
      Math.max(minimo - stock, 0);
    const costoUnitario =
      Number(producto.precioCompra) || 0;

    return {
      producto: producto,
      proveedor: producto.proveedor || "Sin proveedor",
      stock: stock,
      minimo: minimo,
      cantidad: cantidadSugerida,
      costo: cantidadSugerida * costoUnitario
    };
  }).filter(function (item) {
    return item.cantidad > 0;
  });
}

function renderizarReposicionSugeridaStock(productosAlerta) {
  if (!dom.stockReposicionSugeridaResumen) {
    return;
  }

  const reposiciones =
    obtenerReposicionSugeridaStock(productosAlerta);
  const totalUnidades =
    reposiciones.reduce(function (total, item) {
      return total + item.cantidad;
    }, 0);
  const costoEstimado =
    reposiciones.reduce(function (total, item) {
      return total + item.costo;
    }, 0);
  const resumenPorProveedor =
    reposiciones.reduce(function (resumen, item) {
      if (!resumen[item.proveedor]) {
        resumen[item.proveedor] = {
          proveedor: item.proveedor,
          productos: 0,
          unidades: 0,
          costo: 0,
          detalle: []
        };
      }

      resumen[item.proveedor].productos += 1;
      resumen[item.proveedor].unidades += item.cantidad;
      resumen[item.proveedor].costo += item.costo;
      resumen[item.proveedor].detalle.push(
        item.producto.codigo + " - " + item.producto.nombre + " (" + item.cantidad + ")"
      );

      return resumen;
    }, {});

  dom.stockReposicionProductosResumen.textContent = reposiciones.length;
  dom.stockReposicionUnidadesResumen.textContent = totalUnidades;
  dom.stockReposicionCostoResumen.textContent = formatearDinero(costoEstimado);

  const proveedores =
    Object.values(resumenPorProveedor).sort(function (primero, segundo) {
      return segundo.unidades - primero.unidades;
    });

  dom.stockReposicionSugeridaResumen.innerHTML =
    proveedores.length > 0
      ? proveedores.map(function (proveedor) {
        return `
          <div class="report-row">
            <span>
              ${proveedor.proveedor}
              <small>${proveedor.productos} productos | ${proveedor.detalle.slice(0, 3).join(" | ")}</small>
            </span>
            <strong>${proveedor.unidades} un. | ${formatearDinero(proveedor.costo)}</strong>
          </div>
        `;
      }).join("")
      : `<div class="empty-table">No hay reposicion sugerida.</div>`;
}

function renderizarStockValorizado() {
  if (!dom.stockValorizadoRubrosResumen) {
    return;
  }

  const resumen =
    productos.reduce(function (acumulado, producto) {
      const rubro =
        producto.rubro || "Sin rubro";
      const stock =
        obtenerStockTotalProducto(producto);
      const valorVenta =
        stock * (Number(producto.precio) || 0);
      const valorCosto =
        stock * (Number(producto.precioCompra) || 0);

      if (!acumulado[rubro]) {
        acumulado[rubro] = {
          rubro: rubro,
          productos: 0,
          unidades: 0,
          venta: 0,
          costo: 0
        };
      }

      acumulado[rubro].productos += 1;
      acumulado[rubro].unidades += stock;
      acumulado[rubro].venta += valorVenta;
      acumulado[rubro].costo += valorCosto;

      return acumulado;
    }, {});
  const rubrosResumen =
    Object.values(resumen).sort(function (primero, segundo) {
      return segundo.venta - primero.venta;
    });
  const totales =
    rubrosResumen.reduce(function (total, item) {
      total.unidades += item.unidades;
      total.venta += item.venta;
      total.costo += item.costo;
      return total;
    }, { unidades: 0, venta: 0, costo: 0 });

  dom.stockValorVentaResumen.textContent = formatearDinero(totales.venta);
  dom.stockValorCostoResumen.textContent = formatearDinero(totales.costo);
  dom.stockValorMargenResumen.textContent = formatearDinero(totales.venta - totales.costo);
  dom.stockValorUnidadesResumen.textContent = totales.unidades;

  dom.stockValorizadoRubrosResumen.innerHTML =
    rubrosResumen.length > 0
      ? rubrosResumen.map(function (item) {
        return `
          <div class="report-row">
            <span>${item.rubro} <small>${item.productos} productos | ${item.unidades} unidades</small></span>
            <strong>${formatearDinero(item.venta)} venta | ${formatearDinero(item.costo)} costo</strong>
          </div>
        `;
      }).join("")
      : `<div class="empty-table">No hay productos para valorizar.</div>`;
}
