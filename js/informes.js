function obtenerMesActualParaInput() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");

  return ahora.getFullYear() + "-" + mes;
}

function obtenerPedidosDelMes(mesFiltro) {
  return pedidos.filter(function (pedido) {
    const fechaPedido =
      obtenerFechaPedidoParaFiltro(pedido.fecha);

    return fechaPedido.slice(0, 7) === mesFiltro;
  });
}

function obtenerRubroProductoPedido(item) {
  if (item.producto && item.producto.rubro) {
    return item.producto.rubro;
  }

  const productoActual =
    productos.find(function (producto) {
      return item.producto && producto.codigo === item.producto.codigo;
    });

  return productoActual && productoActual.rubro
    ? productoActual.rubro
    : "Sin rubro";
}

function pedidoTieneRubro(pedido, rubro) {
  if (rubro === "TODOS") {
    return true;
  }

  return pedido.items.some(function (item) {
    return obtenerRubroProductoPedido(item) === rubro;
  });
}

function pedidoEsFacturable(pedido) {
  return pedido.estado !== "CANCELADO" && pedido.estado !== "BORRADOR";
}

function obtenerVendedorPedido(pedido) {
  return pedido.vendedor || "Sin vendedor";
}

function obtenerZonaPedido(pedido) {
  if (pedido.zona) {
    return pedido.zona;
  }

  const clienteActual =
    clientes.find(function (cliente) {
      return pedido.cliente && cliente.codigo === pedido.cliente.codigo;
    });

  return clienteActual && clienteActual.zona
    ? clienteActual.zona
    : "Sin zona";
}

function obtenerClienteTextoPedido(pedido) {
  if (!pedido.cliente) {
    return "Sin cliente";
  }

  return pedido.cliente.codigo + " - " + pedido.cliente.nombre;
}

function obtenerUltimoCostoProducto(codigoProducto) {
  const compraProducto =
    compras.find(function (compra) {
      return String(compra.productoCodigo) === String(codigoProducto) &&
        Number(compra.costoUnitario) > 0;
    });

  if (compraProducto) {
    return Number(compraProducto.costoUnitario) || 0;
  }

  const productoActual =
    productos.find(function (producto) {
      return String(producto.codigo) === String(codigoProducto);
    });

  return productoActual
    ? Number(productoActual.precioCompra) || 0
    : 0;
}

function obtenerProductoActualInforme(item) {
  if (!item || !item.producto) {
    return null;
  }

  return productos.find(function (producto) {
    return String(producto.codigo) === String(item.producto.codigo);
  }) || item.producto;
}

function obtenerProveedorProductoPedido(item) {
  const productoActual =
    obtenerProductoActualInforme(item);

  return productoActual && productoActual.proveedor
    ? productoActual.proveedor
    : "Sin proveedor";
}

function obtenerSubtotalItemInforme(item) {
  const subtotalGuardado =
    Number(item.subtotal);

  if (!Number.isNaN(subtotalGuardado) && subtotalGuardado > 0) {
    return subtotalGuardado;
  }

  const precio =
    typeof item.precioUnitario === "number"
      ? item.precioUnitario
      : item.producto ? Number(item.producto.precio) || 0 : 0;
  const cantidad =
    Number(item.cantidad) || 0;

  return precio * cantidad;
}

function calcularMargenPedidosInforme(pedidosFacturables) {
  const productosSinCosto = new Set();
  let ventaTotal = 0;
  let costoTotal = 0;

  pedidosFacturables.forEach(function (pedido) {
    pedido.items.forEach(function (item) {
      const codigoProducto =
        item.producto ? item.producto.codigo : "";
      const cantidad =
        Number(item.cantidad) || 0;
      const subtotal =
        obtenerSubtotalItemInforme(item);
      const costoUnitario =
        obtenerUltimoCostoProducto(codigoProducto);

      ventaTotal += subtotal;

      if (costoUnitario > 0) {
        costoTotal += costoUnitario * cantidad;
      } else if (codigoProducto !== "") {
        productosSinCosto.add(codigoProducto);
      }
    });
  });

  const gananciaEstimada =
    ventaTotal - costoTotal;
  const margenEstimado =
    ventaTotal > 0
      ? (gananciaEstimada / ventaTotal) * 100
      : 0;

  return {
    costoTotal: costoTotal,
    gananciaEstimada: gananciaEstimada,
    margenEstimado: margenEstimado,
    productosSinCosto: productosSinCosto.size
  };
}

function calcularCobranzaPedidosInforme(pedidosFacturables) {
  let cobrado = 0;
  let pendiente = 0;

  pedidosFacturables.forEach(function (pedido) {
    const totalPedido =
      Number(pedido.total) || 0;
    const pagadoPedido =
      typeof pedido.importePagado === "number"
        ? Number(pedido.importePagado) || 0
        : pedido.estadoCobro === "COBRADO"
          ? totalPedido
          : 0;
    const saldoPedido =
      typeof pedido.saldoPendiente === "number"
        ? Number(pedido.saldoPendiente) || 0
        : Math.max(0, totalPedido - pagadoPedido);

    cobrado += Math.min(totalPedido, pagadoPedido);
    pendiente += saldoPedido;
  });

  const totalCobranza =
    cobrado + pendiente;

  return {
    cobrado: cobrado,
    pendiente: pendiente,
    porcentajeCobrado: totalCobranza > 0 ? (cobrado / totalCobranza) * 100 : 0
  };
}

function obtenerTextoMesInforme(mesFiltro) {
  if (!mesFiltro) {
    return "Periodo sin definir";
  }

  const partesFecha = mesFiltro.split("-");
  const fecha = new Date(
    Number(partesFecha[0]),
    Number(partesFecha[1]) - 1,
    1
  );

  return fecha.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });
}

function obtenerFiltrosAplicadosInforme() {
  const filtros = [];

  if (dom.informesVendedorFiltro.value !== "TODOS") {
    filtros.push("Vendedor: " + dom.informesVendedorFiltro.value);
  }

  if (dom.informesZonaFiltro.value !== "TODAS") {
    filtros.push("Zona: " + dom.informesZonaFiltro.value);
  }

  if (dom.informesClienteFiltro.value !== "TODOS") {
    filtros.push("Cliente: " + dom.informesClienteFiltro.value);
  }

  if (dom.informesRubroFiltro.value !== "TODOS") {
    filtros.push("Rubro: " + dom.informesRubroFiltro.value);
  }

  if (dom.informesEstadoFiltro.value !== "TODOS") {
    filtros.push("Estado: " + dom.informesEstadoFiltro.value);
  }

  return filtros;
}

function obtenerResumenOperativoInforme(pedidosDelMes) {
  const clientesVendidos = new Set();
  const productosVendidos = new Set();
  let unidadesVendidas = 0;
  let pedidosCuentaCorriente = 0;

  pedidosDelMes.forEach(function (pedido) {
    if (!pedidoEsFacturable(pedido)) {
      return;
    }

    clientesVendidos.add(obtenerClienteTextoPedido(pedido));

    if (pedido.formaPago === "CUENTA_CORRIENTE") {
      pedidosCuentaCorriente += 1;
    }

    pedido.items.forEach(function (item) {
      if (item.producto && item.producto.codigo !== undefined) {
        productosVendidos.add(item.producto.codigo);
      }

      unidadesVendidas += Number(item.cantidad) || 0;
    });
  });

  return {
    clientesVendidos: clientesVendidos.size,
    productosDistintos: productosVendidos.size,
    unidadesVendidas: unidadesVendidas,
    pedidosCuentaCorriente: pedidosCuentaCorriente
  };
}

function renderizarEncabezadoEjecutivoInforme(mesFiltro, pedidosDelMes) {
  const filtrosAplicados = obtenerFiltrosAplicadosInforme();
  const resumenOperativo = obtenerResumenOperativoInforme(pedidosDelMes);
  const nombreEmpresa =
    CONFIG.empresa || CONFIG.impresionTitulo || "LV Sistema";
  const fechaGeneracion =
    new Date().toLocaleDateString("es-AR");

  dom.informeEmpresaNombre.textContent = nombreEmpresa;
  dom.informeTituloEjecutivo.textContent =
    "Informe comercial - " + obtenerTextoMesInforme(mesFiltro);
  dom.informeSubtituloEjecutivo.textContent =
    "Generado el " + fechaGeneracion + ". Datos calculados segun los filtros seleccionados.";

  dom.informeFiltrosAplicados.innerHTML =
    filtrosAplicados.length === 0
      ? `<span>Sin filtros especiales</span>`
      : filtrosAplicados.map(function (filtro) {
        return `<span>${filtro}</span>`;
      }).join("");

  dom.informeClientesVendidos.textContent =
    resumenOperativo.clientesVendidos;
  dom.informeUnidadesVendidas.textContent =
    resumenOperativo.unidadesVendidas;
  dom.informeProductosDistintos.textContent =
    resumenOperativo.productosDistintos;
  dom.informePedidosCuenta.textContent =
    resumenOperativo.pedidosCuentaCorriente;
}

function agruparPedidosPorEstado(pedidosDelMes) {
  const estados = {};

  pedidosDelMes.forEach(function (pedido) {
    if (!estados[pedido.estado]) {
      estados[pedido.estado] = {
        cantidad: 0,
        total: 0
      };
    }

    estados[pedido.estado].cantidad += 1;
    estados[pedido.estado].total += Number(pedido.total) || 0;
  });

  return Object.keys(estados).map(function (estado) {
    return {
      nombre: estado,
      cantidad: estados[estado].cantidad,
      total: estados[estado].total
    };
  }).sort(function (primero, segundo) {
    return segundo.total - primero.total;
  });
}

function obtenerProductosMasVendidos(pedidosDelMes) {
  const productosVendidos = {};

  pedidosDelMes.forEach(function (pedido) {
    if (!pedidoEsFacturable(pedido)) {
      return;
    }

    pedido.items.forEach(function (item) {
      if (!item.producto) {
        return;
      }

      const codigo = item.producto.codigo;

      if (!productosVendidos[codigo]) {
        productosVendidos[codigo] = {
          codigo: codigo,
          nombre: item.producto.nombre,
          unidades: 0,
          total: 0
        };
      }

      productosVendidos[codigo].unidades += Number(item.cantidad) || 0;
      productosVendidos[codigo].total += Number(item.subtotal) || 0;
    });
  });

  return Object.values(productosVendidos)
    .sort(function (primero, segundo) {
      return segundo.unidades - primero.unidades;
    })
    .slice(0, 5);
}

function obtenerVentasPorProveedor(pedidosDelMes) {
  const proveedoresVendidos = {};

  pedidosDelMes.forEach(function (pedido) {
    if (!pedidoEsFacturable(pedido)) {
      return;
    }

    pedido.items.forEach(function (item) {
      const proveedor =
        obtenerProveedorProductoPedido(item);
      const cantidad =
        Number(item.cantidad) || 0;
      const subtotal =
        obtenerSubtotalItemInforme(item);

      if (!proveedoresVendidos[proveedor]) {
        proveedoresVendidos[proveedor] = {
          nombre: proveedor,
          productos: new Set(),
          unidades: 0,
          total: 0
        };
      }

      if (item.producto && item.producto.codigo !== undefined) {
        proveedoresVendidos[proveedor].productos.add(item.producto.codigo);
      }

      proveedoresVendidos[proveedor].unidades += cantidad;
      proveedoresVendidos[proveedor].total += subtotal;
    });
  });

  return Object.values(proveedoresVendidos)
    .map(function (proveedor) {
      return {
        nombre: proveedor.nombre,
        productos: proveedor.productos.size,
        unidades: proveedor.unidades,
        total: proveedor.total
      };
    })
    .sort(function (primero, segundo) {
      return segundo.total - primero.total;
    })
    .slice(0, 8);
}

function agruparVentasPorValor(pedidosDelMes, obtenerClave) {
  const grupos = {};

  pedidosDelMes.forEach(function (pedido) {
    if (!pedidoEsFacturable(pedido)) {
      return;
    }

    const clave = obtenerClave(pedido);

    if (!grupos[clave]) {
      grupos[clave] = {
        nombre: clave,
        pedidos: 0,
        unidades: 0,
        total: 0
      };
    }

    grupos[clave].pedidos += 1;
    grupos[clave].total += Number(pedido.total) || 0;
    grupos[clave].unidades += pedido.items.reduce(function (total, item) {
      return total + (Number(item.cantidad) || 0);
    }, 0);
  });

  return Object.values(grupos).sort(function (primero, segundo) {
    return segundo.total - primero.total;
  });
}

function obtenerDetalleVendedorZonaCliente(pedidosDelMes) {
  const grupos = {};

  pedidosDelMes.forEach(function (pedido) {
    if (!pedidoEsFacturable(pedido)) {
      return;
    }

    const vendedor = obtenerVendedorPedido(pedido);
    const zona = obtenerZonaPedido(pedido);
    const cliente = obtenerClienteTextoPedido(pedido);
    const clave = vendedor + "|" + zona + "|" + cliente;

    if (!grupos[clave]) {
      grupos[clave] = {
        vendedor: vendedor,
        zona: zona,
        cliente: cliente,
        pedidos: 0,
        unidades: 0,
        total: 0,
        productos: {}
      };
    }

    grupos[clave].pedidos += 1;
    grupos[clave].total += Number(pedido.total) || 0;

    pedido.items.forEach(function (item) {
      if (!item.producto) {
        return;
      }

      const codigoProducto = item.producto.codigo;
      const cantidad =
        Number(item.cantidad) || 0;
      const costoUnitario =
        obtenerUltimoCostoProducto(codigoProducto);

      if (!grupos[clave].productos[codigoProducto]) {
        grupos[clave].productos[codigoProducto] = {
          nombre: item.producto.nombre,
          unidades: 0
        };
      }

      grupos[clave].productos[codigoProducto].unidades += cantidad;
      grupos[clave].unidades += cantidad;
      grupos[clave].costo = (grupos[clave].costo || 0) + (costoUnitario * cantidad);
    });

    grupos[clave].ganancia =
      grupos[clave].total - (grupos[clave].costo || 0);
  });

  return Object.values(grupos).sort(function (primero, segundo) {
    return segundo.total - primero.total;
  });
}

function obtenerTextoProductosDetalle(productosDetalle) {
  return Object.values(productosDetalle)
    .sort(function (primero, segundo) {
      return segundo.unidades - primero.unidades;
    })
    .slice(0, 4)
    .map(function (producto) {
      return producto.nombre + " (" + producto.unidades + ")";
    })
    .join(", ");
}

function obtenerClientesConMasDeuda() {
  return clientes.filter(function (cliente) {
    return Number(cliente.saldo) > 0;
  }).sort(function (primero, segundo) {
    return segundo.saldo - primero.saldo;
  }).slice(0, 5);
}

function obtenerProductosStockCritico() {
  return productos.filter(function (producto) {
    const estadoStock =
      obtenerEstadoStockProducto(producto);

    return productoActivo(producto) &&
      (estadoStock.clase === "stock-low" || estadoStock.clase === "stock-empty");
  }).sort(function (primero, segundo) {
    return primero.stock - segundo.stock;
  }).slice(0, 5);
}

function renderizarListaInforme(contenedor, items, renderItem, mensajeVacio) {
  if (items.length === 0) {
    contenedor.innerHTML =
      `<div class="report-empty">${mensajeVacio}</div>`;
    return;
  }

  contenedor.innerHTML =
    items.map(renderItem).join("");
}

function agruparPedidosInformePorDia(pedidosFiltrados) {
  const dias = {};

  pedidosFiltrados.forEach(function (pedido) {
    if (!pedidoEsFacturable(pedido)) {
      return;
    }

    const fechaFiltro =
      obtenerFechaPedidoParaFiltro(pedido.fecha);

    if (!dias[fechaFiltro]) {
      dias[fechaFiltro] = {
        dia: fechaFiltro,
        cantidad: 0,
        total: 0
      };
    }

    dias[fechaFiltro].cantidad += 1;
    dias[fechaFiltro].total += Number(pedido.total) || 0;
  });

  return Object.values(dias)
    .sort(function (diaA, diaB) {
      return diaB.dia.localeCompare(diaA.dia);
    });
}

function formatearDiaInforme(fechaIso) {
  if (!fechaIso) {
    return "-";
  }

  const partes =
    fechaIso.split("-");

  if (partes.length === 3) {
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  return fechaIso;
}

function renderizarInformePorDias(pedidosFiltrados) {
  if (!dom.informeVentasPorDiaTable || !dom.informeDetallePedidosDiaTable) {
    return;
  }

  const pedidosFacturables =
    pedidosFiltrados.filter(pedidoEsFacturable);
  const totalFiltrado =
    pedidosFacturables.reduce(function (total, pedido) {
      return total + (Number(pedido.total) || 0);
    }, 0);
  const dias =
    agruparPedidosInformePorDia(pedidosFiltrados);

  if (dom.informeDiasResumen) {
    dom.informeDiasResumen.textContent =
      "Pedidos filtrados: " + pedidosFacturables.length +
      " | Total: " + formatearDinero(totalFiltrado);
  }

  if (dias.length === 0) {
    dom.informeVentasPorDiaTable.innerHTML = `
      <tr>
        <td colspan="3" class="empty-table">Sin ventas por dia para el filtro seleccionado.</td>
      </tr>
    `;
  } else {
    dom.informeVentasPorDiaTable.innerHTML =
      dias.map(function (dia) {
        return `
          <tr>
            <td>${formatearDiaInforme(dia.dia)}</td>
            <td>${dia.cantidad}</td>
            <td>${formatearDinero(dia.total)}</td>
          </tr>
        `;
      }).join("");
  }

  const pedidosOrdenados =
    pedidosFacturables.slice().sort(function (pedidoA, pedidoB) {
      return obtenerFechaPedidoParaFiltro(pedidoB.fecha)
        .localeCompare(obtenerFechaPedidoParaFiltro(pedidoA.fecha));
    });

  if (pedidosOrdenados.length === 0) {
    dom.informeDetallePedidosDiaTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">Sin pedidos para el filtro seleccionado.</td>
      </tr>
    `;
    return;
  }

  dom.informeDetallePedidosDiaTable.innerHTML =
    pedidosOrdenados.map(function (pedido) {
      return `
        <tr>
          <td>#${pedido.numero || pedido.id || "-"}</td>
          <td>${pedido.fecha || "-"}</td>
          <td>${pedido.estado || "-"}</td>
          <td>${obtenerClienteTextoPedido(pedido)}</td>
          <td>${obtenerVendedorPedido(pedido)}</td>
          <td>${formatearDinero(Number(pedido.total) || 0)}</td>
        </tr>
      `;
    }).join("");
}

function obtenerInformesMensualesGuardados() {
  const informesGuardados =
    dataStore.leerLista("informesMensuales");

  if (!informesGuardados) {
    return [];
  }

  return Array.isArray(informesGuardados) ? informesGuardados : [];
}

function guardarInformesMensuales(informesMensuales) {
  dataStore.guardarLista(
    "informesMensuales",
    informesMensuales
  );
}

function guardarResumenMensualInforme(mesFiltro, pedidosCantidad, facturacion, resumenMargen) {
  const informesMensuales =
    obtenerInformesMensualesGuardados().filter(function (informe) {
      return informe.mes !== mesFiltro;
    });

  informesMensuales.unshift({
    mes: mesFiltro,
    pedidos: pedidosCantidad,
    facturacion: facturacion,
    costo: resumenMargen.costoTotal,
    ganancia: resumenMargen.gananciaEstimada,
    margen: resumenMargen.margenEstimado,
    actualizado: new Date().toLocaleDateString("es-AR")
  });

  informesMensuales.sort(function (primero, segundo) {
    return segundo.mes.localeCompare(primero.mes);
  });

  guardarInformesMensuales(informesMensuales.slice(0, 24));
}

function renderizarInformesMensualesGuardados() {
  const informesMensuales =
    obtenerInformesMensualesGuardados();

  if (!dom.informesMensualesTable) {
    return;
  }

  if (informesMensuales.length === 0) {
    dom.informesMensualesTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">
          Todavia no hay informes mensuales guardados.
        </td>
      </tr>
    `;
    return;
  }

  dom.informesMensualesTable.innerHTML =
    informesMensuales.map(function (informe) {
      return `
        <tr>
          <td>${obtenerTextoMesInforme(informe.mes)}</td>
          <td>${informe.pedidos}</td>
          <td>${formatearDinero(informe.facturacion)}</td>
          <td>${formatearDinero(informe.costo)}</td>
          <td>${formatearDinero(informe.ganancia)}</td>
          <td>${Number(informe.margen || 0).toFixed(1)}%</td>
        </tr>
      `;
    }).join("");
}

function obtenerResumenMesAnualInforme(anio, mesNumero) {
  const mesTexto =
    String(mesNumero).padStart(2, "0");
  const claveMes =
    anio + "-" + mesTexto;
  const pedidosMes =
    pedidos.filter(function (pedido) {
      return obtenerFechaPedidoParaFiltro(pedido.fecha).slice(0, 7) === claveMes &&
        pedidoEsFacturable(pedido);
    });

  return {
    cantidad: pedidosMes.length,
    total: pedidosMes.reduce(function (suma, pedido) {
      return suma + (Number(pedido.total) || 0);
    }, 0)
  };
}

function renderizarComparativoAnualInforme(mesFiltro) {
  if (!dom.informeComparativoAnualTable) {
    return;
  }

  const anioActual =
    Number((mesFiltro || obtenerMesActualParaInput()).slice(0, 4));
  const anioAnterior =
    anioActual - 1;
  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ];
  let totalCantidadActual = 0;
  let totalCantidadAnterior = 0;
  let totalImporteActual = 0;
  let totalImporteAnterior = 0;

  dom.informeAnualCantidadActualTitulo.textContent =
    "Cant. " + anioActual;
  dom.informeAnualTotalActualTitulo.textContent =
    "Total " + anioActual;
  dom.informeAnualCantidadAnteriorTitulo.textContent =
    "Cant. " + anioAnterior;
  dom.informeAnualTotalAnteriorTitulo.textContent =
    "Total " + anioAnterior;

  const filas =
    nombresMeses.map(function (nombreMes, indice) {
      const mesNumero =
        indice + 1;
      const actual =
        obtenerResumenMesAnualInforme(anioActual, mesNumero);
      const anterior =
        obtenerResumenMesAnualInforme(anioAnterior, mesNumero);
      const variacion =
        anterior.total > 0
          ? ((actual.total - anterior.total) / anterior.total) * 100
          : actual.total > 0
            ? 100
            : 0;
      const tendencia =
        variacion >= 0 ? "Sube" : "Baja";
      const tendenciaClase =
        variacion >= 0 ? "stock-ok" : "stock-empty";

      totalCantidadActual += actual.cantidad;
      totalCantidadAnterior += anterior.cantidad;
      totalImporteActual += actual.total;
      totalImporteAnterior += anterior.total;

      return `
        <tr>
          <td>${nombreMes}</td>
          <td>${actual.cantidad}</td>
          <td>${formatearDinero(actual.total)}</td>
          <td>${anterior.cantidad}</td>
          <td>${formatearDinero(anterior.total)}</td>
          <td>${variacion.toFixed(2)}%</td>
          <td><span class="stock-pill ${tendenciaClase}">${tendencia}</span></td>
        </tr>
      `;
    });
  const variacionTotal =
    totalImporteAnterior > 0
      ? ((totalImporteActual - totalImporteAnterior) / totalImporteAnterior) * 100
      : totalImporteActual > 0
        ? 100
        : 0;

  filas.push(`
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>${totalCantidadActual}</strong></td>
      <td><strong>${formatearDinero(totalImporteActual)}</strong></td>
      <td><strong>${totalCantidadAnterior}</strong></td>
      <td><strong>${formatearDinero(totalImporteAnterior)}</strong></td>
      <td><strong>${variacionTotal.toFixed(2)}%</strong></td>
      <td><span class="stock-pill ${variacionTotal >= 0 ? "stock-ok" : "stock-empty"}">${variacionTotal >= 0 ? "Sube" : "Baja"}</span></td>
    </tr>
  `);

  dom.informeComparativoAnualTable.innerHTML =
    filas.join("");
}

function renderizarOpcionesInformes() {
  if (!dom.informesVendedorFiltro) {
    return;
  }

  const vendedorActual = dom.informesVendedorFiltro.value || "TODOS";
  const zonaActual = dom.informesZonaFiltro.value || "TODAS";
  const clienteActual = dom.informesClienteFiltro.value || "TODOS";
  const rubroActual = dom.informesRubroFiltro.value || "TODOS";

  const vendedores =
    [...new Set(pedidos.map(obtenerVendedorPedido))].sort();

  const zonasDisponibles =
    zonas.filter(zonaActiva).map(function (zona) {
      return zona.nombre;
    }).sort();

  const clientesDisponibles =
    clientes.filter(clienteActivo).map(function (cliente) {
      return cliente.codigo + " - " + cliente.nombre;
    }).sort();

  const rubrosDisponibles =
    rubros.filter(rubroActivo).map(function (rubro) {
      return rubro.nombre;
    }).sort();

  dom.informesVendedorFiltro.innerHTML =
    `<option value="TODOS">Todos los vendedores</option>` +
    vendedores.map(function (vendedor) {
      return `<option value="${vendedor}">${vendedor}</option>`;
    }).join("");

  dom.informesZonaFiltro.innerHTML =
    `<option value="TODAS">Todas las zonas</option>` +
    zonasDisponibles.map(function (zona) {
      return `<option value="${zona}">${zona}</option>`;
    }).join("");

  dom.informesClienteFiltro.innerHTML =
    `<option value="TODOS">Todos los clientes</option>` +
    clientesDisponibles.map(function (cliente) {
      return `<option value="${cliente}">${cliente}</option>`;
    }).join("");

  dom.informesRubroFiltro.innerHTML =
    `<option value="TODOS">Todos los rubros</option>` +
    rubrosDisponibles.map(function (rubro) {
      return `<option value="${rubro}">${rubro}</option>`;
    }).join("");

  dom.informesVendedorFiltro.value = vendedores.includes(vendedorActual) ? vendedorActual : "TODOS";
  dom.informesZonaFiltro.value = zonasDisponibles.includes(zonaActual) ? zonaActual : "TODAS";
  dom.informesClienteFiltro.value = clientesDisponibles.includes(clienteActual) ? clienteActual : "TODOS";
  dom.informesRubroFiltro.value = rubrosDisponibles.includes(rubroActual) ? rubroActual : "TODOS";
}

function aplicarFiltrosInformes(pedidosDelMes) {
  const filtroVendedor =
    dom.informesVendedorFiltro.value || "TODOS";

  const filtroZona =
    dom.informesZonaFiltro.value || "TODAS";

  const filtroCliente =
    dom.informesClienteFiltro.value || "TODOS";

  const filtroRubro =
    dom.informesRubroFiltro.value || "TODOS";

  const filtroEstado =
    dom.informesEstadoFiltro.value || "TODOS";

  return pedidosDelMes.filter(function (pedido) {
    const coincideVendedor =
      filtroVendedor === "TODOS" ||
      obtenerVendedorPedido(pedido) === filtroVendedor;

    const coincideZona =
      filtroZona === "TODAS" ||
      obtenerZonaPedido(pedido) === filtroZona;

    const coincideCliente =
      filtroCliente === "TODOS" ||
      obtenerClienteTextoPedido(pedido) === filtroCliente;

    const coincideRubro =
      pedidoTieneRubro(pedido, filtroRubro);

    const coincideEstado =
      filtroEstado === "TODOS" ||
      pedido.estado === filtroEstado ||
      pedido.estadoCobro === filtroEstado;

    return coincideVendedor && coincideZona && coincideCliente && coincideRubro && coincideEstado;
  });
}

function renderizarInformes() {
  if (!dom.informesPage) {
    return;
  }

  renderizarOpcionesInformes();

  if (!dom.informesMesFiltro.value) {
    dom.informesMesFiltro.value = obtenerMesActualParaInput();
  }

  const mesFiltro =
    dom.informesMesFiltro.value;

  const pedidosDelMesSinFiltros =
    obtenerPedidosDelMes(mesFiltro);

  const pedidosDelMes =
    aplicarFiltrosInformes(pedidosDelMesSinFiltros);

  renderizarEncabezadoEjecutivoInforme(mesFiltro, pedidosDelMes);

  const pedidosFacturables =
    pedidosDelMes.filter(function (pedido) {
      return pedidoEsFacturable(pedido);
    });

  const facturacion =
    pedidosFacturables.reduce(function (total, pedido) {
      return total + (Number(pedido.total) || 0);
    }, 0);

  const ticketPromedio =
    pedidosFacturables.length > 0
      ? facturacion / pedidosFacturables.length
      : 0;

  const cuentaCorriente =
    clientes.reduce(function (total, cliente) {
      return total + (Number(cliente.saldo) || 0);
    }, 0);

  const resumenMargen =
    calcularMargenPedidosInforme(pedidosFacturables);
  const resumenCobranza =
    calcularCobranzaPedidosInforme(pedidosFacturables);

  dom.informeFacturacion.textContent = formatearDinero(facturacion);
  dom.informePedidos.textContent = pedidosDelMes.length;
  dom.informeTicketPromedio.textContent = formatearDinero(ticketPromedio);
  dom.informeCuentaCorriente.textContent = formatearDinero(cuentaCorriente);
  if (dom.informeCobradoPeriodo) {
    dom.informeCobradoPeriodo.textContent = formatearDinero(resumenCobranza.cobrado);
  }
  if (dom.informePendientePeriodo) {
    dom.informePendientePeriodo.textContent = formatearDinero(resumenCobranza.pendiente);
  }
  if (dom.informePorcentajeCobrado) {
    dom.informePorcentajeCobrado.textContent =
      resumenCobranza.porcentajeCobrado.toFixed(1) + "%";
  }
  dom.informeCostoEstimado.textContent = formatearDinero(resumenMargen.costoTotal);
  dom.informeGananciaEstimada.textContent = formatearDinero(resumenMargen.gananciaEstimada);
  dom.informeMargenEstimado.textContent =
    resumenMargen.margenEstimado.toFixed(1) + "%";
  dom.informeProductosSinCosto.textContent =
    resumenMargen.productosSinCosto;

  const pedidosFacturablesMensuales =
    pedidosDelMesSinFiltros.filter(function (pedido) {
      return pedidoEsFacturable(pedido);
    });
  const facturacionMensual =
    pedidosFacturablesMensuales.reduce(function (total, pedido) {
      return total + (Number(pedido.total) || 0);
    }, 0);
  const resumenMargenMensual =
    calcularMargenPedidosInforme(pedidosFacturablesMensuales);

  guardarResumenMensualInforme(
    mesFiltro,
    pedidosFacturablesMensuales.length,
    facturacionMensual,
    resumenMargenMensual
  );
  renderizarInformesMensualesGuardados();
  renderizarComparativoAnualInforme(mesFiltro);
  renderizarInformePorDias(pedidosDelMes);

  renderizarListaInforme(
    dom.informeVentasEstado,
    agruparPedidosPorEstado(pedidosDelMes),
    function (estado) {
      return `
        <div class="report-row">
          <span>${estado.nombre}</span>
          <strong>${estado.cantidad} pedidos | ${formatearDinero(estado.total)}</strong>
        </div>
      `;
    },
    "Sin pedidos en este mes."
  );

  renderizarListaInforme(
    dom.informeProductosVendidos,
    obtenerProductosMasVendidos(pedidosDelMes),
    function (producto) {
      return `
        <div class="report-row">
          <span>${producto.codigo} - ${producto.nombre}</span>
          <strong>${producto.unidades} unidades | ${formatearDinero(producto.total)}</strong>
        </div>
      `;
    },
    "Sin ventas de productos en este mes."
  );

  renderizarListaInforme(
    dom.informeVentasVendedor,
    agruparVentasPorValor(pedidosDelMes, obtenerVendedorPedido),
    function (vendedor) {
      return `
        <div class="report-row">
          <span>${vendedor.nombre}</span>
          <strong>${vendedor.pedidos} pedidos | ${vendedor.unidades} un. | ${formatearDinero(vendedor.total)}</strong>
        </div>
      `;
    },
    "Sin ventas por vendedor en este mes."
  );

  renderizarListaInforme(
    dom.informeVentasZona,
    agruparVentasPorValor(pedidosDelMes, obtenerZonaPedido),
    function (zona) {
      return `
        <div class="report-row">
          <span>${zona.nombre}</span>
          <strong>${zona.pedidos} pedidos | ${zona.unidades} un. | ${formatearDinero(zona.total)}</strong>
        </div>
      `;
    },
    "Sin ventas por zona en este mes."
  );

  renderizarListaInforme(
    dom.informeVentasProveedor,
    obtenerVentasPorProveedor(pedidosDelMes),
    function (proveedor) {
      return `
        <div class="report-row">
          <span>${proveedor.nombre} <small>${proveedor.productos} productos</small></span>
          <strong>${proveedor.unidades} un. | ${formatearDinero(proveedor.total)}</strong>
        </div>
      `;
    },
    "Sin ventas por proveedor en este mes."
  );

  renderizarListaInforme(
    dom.informeVentasCliente,
    agruparVentasPorValor(pedidosDelMes, obtenerClienteTextoPedido),
    function (cliente) {
      return `
        <div class="report-row">
          <span>${cliente.nombre}</span>
          <strong>${cliente.pedidos} pedidos | ${cliente.unidades} un. | ${formatearDinero(cliente.total)}</strong>
        </div>
      `;
    },
    "Sin ventas por cliente en este mes."
  );

  renderizarListaInforme(
    dom.informeClientesDeuda,
    obtenerClientesConMasDeuda(),
    function (cliente) {
      return `
        <div class="report-row">
          <span>${cliente.codigo} - ${cliente.nombre}</span>
          <strong>${formatearDinero(cliente.saldo)}</strong>
        </div>
      `;
    },
    "No hay clientes con deuda."
  );

  renderizarListaInforme(
    dom.informeStockCritico,
    obtenerProductosStockCritico(),
    function (producto) {
      return `
        <div class="report-row">
          <span>${producto.codigo} - ${producto.nombre}</span>
          <strong>Stock ${formatearStockProducto(producto)}</strong>
        </div>
      `;
    },
    "No hay productos con stock critico."
  );

  const detalleVendedorZonaCliente =
    obtenerDetalleVendedorZonaCliente(pedidosDelMes);

  if (detalleVendedorZonaCliente.length === 0) {
    dom.informeDetalleVendedorZonaCliente.innerHTML = `
      <tr>
        <td colspan="9" class="empty-table">
          Sin ventas detalladas en este mes.
        </td>
      </tr>
    `;
    return;
  }

  dom.informeDetalleVendedorZonaCliente.innerHTML =
    detalleVendedorZonaCliente.map(function (detalle) {
      return `
        <tr>
          <td>${detalle.vendedor}</td>
          <td>${detalle.zona}</td>
          <td>${detalle.cliente}</td>
          <td>${detalle.pedidos}</td>
          <td>${detalle.unidades}</td>
          <td>${formatearDinero(detalle.total)}</td>
          <td>${formatearDinero(detalle.costo || 0)}</td>
          <td>${formatearDinero(detalle.ganancia || 0)}</td>
          <td>${obtenerTextoProductosDetalle(detalle.productos) || "-"}</td>
        </tr>
      `;
    }).join("");
}

function mostrarInformesMesActual() {
  dom.informesMesFiltro.value = obtenerMesActualParaInput();
  renderizarInformes();
}

function limpiarFiltrosInformes() {
  dom.informesMesFiltro.value = obtenerMesActualParaInput();
  dom.informesVendedorFiltro.value = "TODOS";
  dom.informesZonaFiltro.value = "TODAS";
  dom.informesClienteFiltro.value = "TODOS";
  dom.informesRubroFiltro.value = "TODOS";
  dom.informesEstadoFiltro.value = "TODOS";
  renderizarInformes();
}

function obtenerPedidosFiltradosInformeActual() {
  if (!dom.informesMesFiltro.value) {
    dom.informesMesFiltro.value = obtenerMesActualParaInput();
  }

  return aplicarFiltrosInformes(
    obtenerPedidosDelMes(dom.informesMesFiltro.value)
  );
}

function exportarInformeCsv() {
  const pedidosFiltrados =
    obtenerPedidosFiltradosInformeActual();
  const detalle =
    obtenerDetalleVendedorZonaCliente(pedidosFiltrados);

  if (detalle.length === 0) {
    alert("No hay datos de informe para exportar con esos filtros.");
    return;
  }

  descargarCsv(
    "informe-comercial-" + (dom.informesMesFiltro.value || obtenerMesActualParaInput()) + ".csv",
    [
      "Vendedor",
      "Zona",
      "Cliente",
      "Pedidos",
      "Unidades",
      "Total",
      "Costo estimado",
      "Ganancia estimada",
      "Productos"
    ],
    detalle.map(function (fila) {
      return [
        fila.vendedor,
        fila.zona,
        fila.cliente,
        fila.pedidos,
        fila.unidades,
        fila.total,
        fila.costo || 0,
        fila.ganancia || 0,
        obtenerTextoProductosDetalle(fila.productos)
      ];
    })
  );
}
