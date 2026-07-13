const assert = require("assert");

function formatearDinero(valor) {
  return "$" + (Number(valor) || 0).toLocaleString("es-AR");
}

function limpiarTelefonoWhatsApp(telefono) {
  return String(telefono || "").replace(/[^\d]/g, "");
}

function crearMensajeCatalogo(datosPedido) {
  const lineasProductos =
    datosPedido.items.map(function (item) {
      return "- " + item.cantidad + " x " +
        item.codigo + " - " + item.nombre + " (" + formatearDinero(item.cantidad * item.precio) + ")";
    });

  const lineasMensaje = [
    "Hola, quiero hacer este pedido:",
    "",
    "Cliente: " + datosPedido.cliente,
    "Direccion: " + datosPedido.direccion,
    "",
    lineasProductos.join("\n"),
    "",
    "Total estimado: " + formatearDinero(datosPedido.total)
  ];

  if (datosPedido.comentario) {
    lineasMensaje.push("", "Comentario: " + datosPedido.comentario);
  }

  return lineasMensaje.join("\n");
}

function crearMensajeVendedor(datosPedido) {
  const lineasProductos =
    datosPedido.items.map(function (item) {
      return "- " + item.cantidad + " x " +
        item.codigo + " - " + item.nombre + " (" + formatearDinero(item.cantidad * item.precio) + ")";
    });

  return [
    "Nuevo pedido movil",
    "",
    "Vendedor: " + datosPedido.vendedor,
    "Cliente: " + datosPedido.cliente,
    "Direccion: " + datosPedido.direccion,
    "Zona: " + datosPedido.zona,
    "Forma de pago: " + datosPedido.formaPago,
    "",
    lineasProductos.join("\n"),
    "",
    "Total estimado: " + formatearDinero(datosPedido.total),
    "",
    "Observacion: " + datosPedido.observacion
  ].join("\n");
}

function crearUrlWhatsapp(telefono, mensaje) {
  const telefonoLimpio =
    limpiarTelefonoWhatsApp(telefono);

  assert.ok(telefonoLimpio, "El telefono de WhatsApp es obligatorio");

  return "https://wa.me/" + telefonoLimpio + "?text=" + encodeURIComponent(mensaje);
}

const pedidoCatalogo = {
  cliente: "Kiosco El Sol",
  direccion: "Av. Siempre Viva 742",
  comentario: "Entregar por la tarde",
  items: [
    { codigo: 1, nombre: "Azucar", cantidad: 2, precio: 1500 },
    { codigo: 2, nombre: "Yerba", cantidad: 1, precio: 2200 }
  ],
  total: 5200
};

const mensajeCatalogo =
  crearMensajeCatalogo(pedidoCatalogo);
const urlCatalogo =
  crearUrlWhatsapp("+54 9 11 2345-6789", mensajeCatalogo);

assert.ok(mensajeCatalogo.includes("Hola, quiero hacer este pedido:"));
assert.ok(mensajeCatalogo.includes("Cliente: Kiosco El Sol"));
assert.ok(mensajeCatalogo.includes("- 2 x 1 - Azucar"));
assert.ok(urlCatalogo.startsWith("https://wa.me/5491123456789?text="));

const pedidoVendedor = {
  vendedor: "Fernando",
  cliente: "Almacen Centro",
  direccion: "San Martin 100",
  zona: "Centro",
  formaPago: "Cuenta corriente",
  observacion: "Cobrar saldo anterior",
  items: [
    { codigo: 5, nombre: "Aceite", cantidad: 3, precio: 1800 }
  ],
  total: 5400
};

const mensajeVendedor =
  crearMensajeVendedor(pedidoVendedor);
const urlVendedor =
  crearUrlWhatsapp("5493415555555", mensajeVendedor);

assert.ok(mensajeVendedor.includes("Nuevo pedido movil"));
assert.ok(mensajeVendedor.includes("Vendedor: Fernando"));
assert.ok(mensajeVendedor.includes("Forma de pago: Cuenta corriente"));
assert.ok(urlVendedor.startsWith("https://wa.me/5493415555555?text="));

console.log("Accesos publicos WhatsApp OK");
