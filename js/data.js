// Arranque limpio: los datos reales se cargan desde Supabase, respaldo o importacion.
let clientes = [];
let productos = [];
let pedidos = [

];

let zonas = [];

let proveedores = [];

let compras = [];

let proveedorPagos = [];

let vendedoresSistema = [];

const porcentajesListasPreciosBase = {
  "lista 1": 50,
  "lista 2": 15,
  "lista 3": 20,
  "lista 4": 10
};

function obtenerPorcentajePredeterminadoListaPrecio(nombreLista, porcentajeActual) {
  const porcentajeNumerico =
    Number(porcentajeActual);

  if (porcentajeActual !== undefined && porcentajeActual !== null && porcentajeActual !== "" && !Number.isNaN(porcentajeNumerico)) {
    return porcentajeNumerico;
  }

  return porcentajesListasPreciosBase[normalizarTexto(nombreLista || "")] || 0;
}

let listasPrecios = [];

let rubros = [];
