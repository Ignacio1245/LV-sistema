const assert = require("assert");

function crearProductoFalso() {
  return {
    codigo: 100,
    nombre: "Producto falso",
    precio: 1500,
    precioCompra: 900,
    stock: 20,
    stockMinimo: 2,
    activo: true,
    movimientosStock: []
  };
}

function crearClienteFalso() {
  return {
    codigo: 10,
    nombre: "Cliente falso",
    saldo: 0,
    activo: true,
    historial: []
  };
}

function obtenerStockTotalProducto(producto) {
  return Math.max(0, Math.floor(Number(producto.stock) || 0));
}

function reconstruirStockProductoDesdeTotal(producto, stockTotal) {
  producto.stock = Math.max(0, Math.floor(Number(stockTotal) || 0));
  return producto;
}

function crearPedidoFalso(cliente, producto, cantidad) {
  return {
    id: 1,
    numero: 1,
    cliente: cliente,
    items: [
      {
        producto: producto,
        cantidad: cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * cantidad
      }
    ],
    total: producto.precio * cantidad,
    estado: "PENDIENTE",
    estadoCobro: "",
    formaPago: "CUENTA_CORRIENTE",
    fecha: "28/6/2026"
  };
}

function atenderPedidoFalso(pedido, producto) {
  assert.strictEqual(pedido.estado, "PENDIENTE");

  const cantidadPedida =
    Number(pedido.items[0].cantidad) || 0;
  const stockAnterior =
    obtenerStockTotalProducto(producto);
  const stockFinal =
    stockAnterior - cantidadPedida;

  assert.ok(stockFinal >= producto.stockMinimo, "El pedido no debe romper el stock minimo");

  reconstruirStockProductoDesdeTotal(producto, stockFinal);
  producto.movimientosStock.push({
    tipo: "Salida por pedido",
    cantidad: -cantidadPedida,
    stockFinal: stockFinal
  });

  pedido.estado = "ATENDIDO";
}

function entregarPedidoFalso(pedido, cliente, importePagado) {
  assert.strictEqual(pedido.estado, "ATENDIDO");

  const saldoPendiente =
    pedido.total - importePagado;

  assert.ok(saldoPendiente >= 0, "El pago no puede superar el total");

  pedido.estado = "ENTREGADO";
  pedido.importePagado = importePagado;
  pedido.saldoPendiente = saldoPendiente;
  pedido.estadoCobro = saldoPendiente > 0 ? "CUENTA_CORRIENTE" : "COBRADO";

  if (saldoPendiente > 0) {
    cliente.saldo += saldoPendiente;
    cliente.historial.push({
      tipo: "Pedido entregado a cuenta",
      importe: saldoPendiente
    });
  }
}

function registrarPagoFalso(cliente, importePagado) {
  assert.ok(importePagado > 0, "El pago debe ser positivo");

  const saldoAnterior =
    cliente.saldo;

  cliente.saldo -= importePagado;
  cliente.historial.push({
    tipo: "Pago recibido",
    importe: -importePagado,
    saldoAnterior: saldoAnterior,
    saldoPosterior: cliente.saldo
  });
}

function registrarNotaCreditoFalsa(pedido, cliente, producto, cantidadDevuelta) {
  const itemPedido =
    pedido.items[0];
  const importeCredito =
    itemPedido.precioUnitario * cantidadDevuelta;

  itemPedido.cantidad -= cantidadDevuelta;
  itemPedido.subtotal -= importeCredito;
  pedido.total -= importeCredito;
  pedido.saldoPendiente = Math.max(0, (pedido.saldoPendiente || 0) - importeCredito);
  pedido.estadoCobro = pedido.saldoPendiente > 0 ? "CUENTA_CORRIENTE" : "COBRADO";

  cliente.saldo -= importeCredito;
  cliente.historial.push({
    tipo: "Nota de credito",
    importe: -importeCredito
  });

  reconstruirStockProductoDesdeTotal(producto, obtenerStockTotalProducto(producto) + cantidadDevuelta);
  producto.movimientosStock.push({
    tipo: "Entrada por nota de credito",
    cantidad: cantidadDevuelta,
    stockFinal: obtenerStockTotalProducto(producto)
  });
}

function crearRespaldoFalso(cliente, producto, pedido) {
  return {
    sistema: "LV Sistema",
    datos: {
      clientes: [cliente],
      productos: [producto],
      pedidos: [pedido],
      zonas: [],
      rubros: [],
      proveedores: [],
      listasPrecios: [],
      auditoria: [],
      usuariosSistema: [],
      configuracion: {},
      roles: {}
    }
  };
}

function ejecutarPruebaConDatosFalsos() {
  const productoFalso =
    crearProductoFalso();
  const clienteFalso =
    crearClienteFalso();
  const pedidoFalso =
    crearPedidoFalso(clienteFalso, productoFalso, 5);

  atenderPedidoFalso(pedidoFalso, productoFalso);
  assert.strictEqual(productoFalso.stock, 15);
  assert.strictEqual(pedidoFalso.estado, "ATENDIDO");

  entregarPedidoFalso(pedidoFalso, clienteFalso, 3000);
  assert.strictEqual(pedidoFalso.estado, "ENTREGADO");
  assert.strictEqual(pedidoFalso.estadoCobro, "CUENTA_CORRIENTE");
  assert.strictEqual(clienteFalso.saldo, 4500);

  registrarPagoFalso(clienteFalso, 2000);
  assert.strictEqual(clienteFalso.saldo, 2500);

  registrarNotaCreditoFalsa(pedidoFalso, clienteFalso, productoFalso, 1);
  assert.strictEqual(productoFalso.stock, 16);
  assert.strictEqual(clienteFalso.saldo, 1000);
  assert.strictEqual(pedidoFalso.saldoPendiente, 3000);

  const respaldoFalso =
    crearRespaldoFalso(clienteFalso, productoFalso, pedidoFalso);

  assert.strictEqual(respaldoFalso.sistema, "LV Sistema");
  assert.strictEqual(respaldoFalso.datos.clientes.length, 1);
  assert.strictEqual(respaldoFalso.datos.productos.length, 1);
  assert.strictEqual(respaldoFalso.datos.pedidos.length, 1);

  console.log("Prueba con datos falsos OK");
}

ejecutarPruebaConDatosFalsos();
