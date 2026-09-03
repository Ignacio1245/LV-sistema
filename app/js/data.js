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

function obtenerPorcentajePredeterminadoListaPrecio(nombreLista, porcentajeActual) {
  const porcentajeNumerico =
    Number(porcentajeActual);

  if (porcentajeActual !== undefined && porcentajeActual !== null && porcentajeActual !== "" && !Number.isNaN(porcentajeNumerico)) {
    return porcentajeNumerico;
  }

  return 0;
}

let listasPrecios = [];

let rubros = [];
