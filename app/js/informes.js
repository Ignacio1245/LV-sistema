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
      const codigoProducto = item.producto.codigo;

      if (!grupos[clave].productos[codigoProducto]) {
        grupos[clave].productos[codigoProducto] = {
          nombre: item.producto.nombre,
          unidades: 0
        };
      }

      grupos[clave].productos[codigoProducto].unidades += Number(item.cantidad) || 0;
      grupos[clave].unidades += Number(item.cantidad) || 0;
    });
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

function renderizarInformes() {
  if (!dom.informesPage) {
    return;
  }

  if (!dom.informesMesFiltro.value) {
    dom.informesMesFiltro.value = obtenerMesActualParaInput();
  }

  const mesFiltro =
    dom.informesMesFiltro.value;

  const pedidosDelMes =
    obtenerPedidosDelMes(mesFiltro);

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

  dom.informeFacturacion.textContent = formatearDinero(facturacion);
  dom.informePedidos.textContent = pedidosDelMes.length;
  dom.informeTicketPromedio.textContent = formatearDinero(ticketPromedio);
  dom.informeCuentaCorriente.textContent = formatearDinero(cuentaCorriente);

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
          <strong>Stock ${producto.stock}</strong>
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
        <td colspan="7" class="empty-table">
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
          <td>${obtenerTextoProductosDetalle(detalle.productos) || "-"}</td>
        </tr>
      `;
    }).join("");
}

function mostrarInformesMesActual() {
  dom.informesMesFiltro.value = obtenerMesActualParaInput();
  renderizarInformes();
}
