function obtenerItemsParaImprimirPedido(pedido) {
    return pedido.items.map(function (item) {
        const descuentoTexto =
            item.descuentoPorcentaje > 0
                ? item.descuentoPorcentaje + "%"
                : "-";

        return `
      <tr>
        <td>${escaparTextoHtml(item.producto.codigo)}</td>
        <td>${escaparTextoHtml(item.producto.nombre)}</td>
        <td>${escaparTextoHtml(item.cantidad)}</td>
        <td>${descuentoTexto}</td>
        <td>${formatearDinero(typeof item.precioUnitario === "number" ? item.precioUnitario : item.producto.precio)}</td>
        <td>${formatearDinero(item.subtotal)}</td>
      </tr>
    `;
    }).join("");
}

function obtenerNotasCreditoParaImprimirPedido(pedido) {
    const notasCredito =
        Array.isArray(pedido.notaCredito) ? pedido.notaCredito : [];

    if (notasCredito.length === 0) {
        return "";
    }

    const filas =
        notasCredito.flatMap(function (nota) {
            return (nota.items || []).map(function (item) {
                const textoProducto =
                    item.producto
                        ? item.producto.codigo + " - " + item.producto.nombre
                        : "Producto";

                return `
                  <tr>
                    <td>${escaparTextoHtml(nota.fecha || "-")}</td>
                    <td>${escaparTextoHtml(nota.motivo || "Nota de credito")}</td>
                    <td>${escaparTextoHtml(textoProducto)}</td>
                    <td>${escaparTextoHtml(item.cantidad)}</td>
                    <td>${formatearDinero(item.subtotal || 0)}</td>
                  </tr>
                `;
            });
        }).join("");

    return `
      <div class="box">
        <strong>Notas de credito aplicadas</strong>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Motivo</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Credito</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;
}

function obtenerQrComprobanteHtml(totalComprobante) {
    const textoQrPago =
        CONFIG.impresionQrTexto || CONFIG.alias || "";

    if (!CONFIG.impresionMostrarQr || !textoQrPago) {
        return "";
    }

    const textoQr =
        encodeURIComponent(textoQrPago);
    const totalPago =
        Number(totalComprobante) || 0;

    return `
      <div class="qr-box qr-box-mercado-pago">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${textoQr}" alt="QR Mercado Pago">
        <strong>Mercado Pago</strong>
        <span>Escanea y paga el total</span>
        <b>${formatearDinero(totalPago)}</b>
        <small>${escaparTextoHtml(textoQrPago)}</small>
      </div>
    `;
}

function imprimirPedido(pedidoParaImprimir) {
    const observacionesHtml =
        pedidoParaImprimir.observaciones.length === 0
            ? "<p>Sin observaciones</p>"
            : "<ul>" + pedidoParaImprimir.observaciones.map(function (observacion) {
                return "<li>" + escaparTextoHtml(observacion) + "</li>";
            }).join("") + "</ul>";

    const ventana =
        window.open("", "_blank", "width=900,height=700");

    if (!ventana) {
        alert("El navegador bloqueo la ventana de impresion.");
        return;
    }

    const tituloComprobante =
        CONFIG.impresionTitulo || CONFIG.empresa || "LV Sistema";

    const subtituloComprobante =
        CONFIG.impresionSubtitulo || "Distribuidora";

    const pieComprobante =
        CONFIG.impresionPie || "";

    ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Pedido #${escaparTextoHtml(pedidoParaImprimir.numero)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 28px; color: #102033; }
        h1 { margin: 0 0 6px; }
        .muted { color: #667085; }
        .header { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border: 1px solid #d8e1ec; padding: 10px; text-align: left; }
        th { background: #f3f6fa; }
        .total { margin-top: 20px; text-align: right; font-size: 24px; font-weight: 800; }
        .box { border: 1px solid #d8e1ec; border-radius: 8px; padding: 14px; margin-top: 18px; }
        .brand { text-align: right; }
        .qr-box { display: grid; gap: 6px; justify-items: center; border: 1px solid #d8e1ec; border-radius: 8px; padding: 10px; margin-top: 10px; max-width: 160px; }
        .qr-box img { width: 120px; height: 120px; }
        .qr-box span { color: #667085; font-size: 12px; text-align: center; word-break: break-word; }
        .qr-box b { color: #102033; font-size: 15px; }
        .qr-box small { color: #667085; font-size: 11px; text-align: center; word-break: break-word; }
        .footer { margin-top: 22px; color: #667085; font-size: 13px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>Pedido #${escaparTextoHtml(pedidoParaImprimir.numero)}</h1>
          <div class="muted">Fecha: ${escaparTextoHtml(pedidoParaImprimir.fecha)}</div>
        </div>
        <div class="brand">
          <strong>${escaparTextoHtml(tituloComprobante)}</strong><br>
          <span class="muted">${escaparTextoHtml(subtituloComprobante)}</span><br>
          ${CONFIG.cuit ? `<span class="muted">CUIT: ${escaparTextoHtml(CONFIG.cuit)}</span><br>` : ""}
          ${CONFIG.whatsapp ? `<span class="muted">WhatsApp: ${escaparTextoHtml(CONFIG.whatsapp)}</span><br>` : ""}
          ${obtenerQrComprobanteHtml(pedidoParaImprimir.total)}
        </div>
      </div>

      <div class="box">
        <strong>Cliente:</strong> ${escaparTextoHtml(pedidoParaImprimir.cliente.codigo)} - ${escaparTextoHtml(pedidoParaImprimir.cliente.nombre)}<br>
        <strong>Direccion:</strong> ${escaparTextoHtml(pedidoParaImprimir.cliente.direccion)}<br>
        <strong>Forma de pago:</strong> ${escaparTextoHtml(obtenerTextoFormaPago(pedidoParaImprimir.formaPago))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Desc.</th>
            <th>P.U</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${obtenerItemsParaImprimirPedido(pedidoParaImprimir)}
        </tbody>
      </table>

      <div class="total">Total: ${formatearDinero(pedidoParaImprimir.total)}</div>

      ${obtenerNotasCreditoParaImprimirPedido(pedidoParaImprimir)}

      <div class="box">
        <strong>Observaciones</strong>
        ${observacionesHtml}
      </div>

      ${pieComprobante ? `<div class="footer">${escaparTextoHtml(pieComprobante)}</div>` : ""}
    </body>
    </html>
  `);

    ventana.document.close();
    ventana.focus();
    ventana.print();
}

function imprimirPedidoActual() {
    const cliente =
        clienteSeleccionado ||
        buscarCliente(dom.clienteSearchInput.value);

    if (!cliente) {
        alert("Seleccione un cliente para imprimir.");
        return;
    }

    if (pedidoActual.items.length === 0) {
        alert("Agregue productos antes de imprimir.");
        return;
    }

    const pedidoParaImprimir = {
        numero: pedidoEditando
            ? pedidoEditando.numero || pedidoEditando.id
            : obtenerSiguienteNumeroPedido(),
        cliente: cliente,
        items: pedidoActual.items,
        total: calcularTotalPedido(),
        formaPago: obtenerFormaPagoActual(),
        observaciones: pedidoActual.observaciones,
        fecha: new Date().toLocaleDateString("es-AR")
    };

    imprimirPedido(pedidoParaImprimir);
}

function imprimirPedidoGuardado(id) {
    const pedido =
        pedidos.find(function (pedidoGuardado) {
            return pedidoGuardado.id === id;
        });

    if (!pedido) {
        alert("No se encontro el pedido.");
        return;
    }

    imprimirPedido({
        numero: pedido.numero || pedido.id,
        cliente: pedido.cliente,
        items: pedido.items || [],
        total: pedido.total || 0,
        formaPago: pedido.formaPago || "CUENTA_CORRIENTE",
        observaciones: pedido.observaciones || [],
        notaCredito: pedido.notaCredito || [],
        fecha: pedido.fecha || new Date().toLocaleDateString("es-AR")
    });
}
