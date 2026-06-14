// Datos temporales. Mas adelante estos datos van a venir de Firebase.
let clientes = [
  {
    codigo: 0,
    nombre: "Consumidor final",
    saldo: 0,
    telefono: "-",
    direccion: "-",
    zona: "General",
    activo: true,
    historial: []
  },
  {
    codigo: 1,
    nombre: "Kiosco El Sol",
    saldo: 0,
    telefono: "11 5555-1001",
    direccion: "Av. Principal 123",
    zona: "Centro",
    activo: true,
    historial: []
  },
  {
    codigo: 2,
    nombre: "Despensa Don Luis",
    saldo: 0,
    telefono: "11 5555-1002",
    direccion: "San Martin 456",
    zona: "Norte",
    activo: true,
    historial: []
  },
  {
    codigo: 3,
    nombre: "Maxikiosco Avenida",
    saldo: 0,
    telefono: "11 5555-1003",
    direccion: "Av. Rivadavia 789",
    zona: "Sur",
    activo: true,
    historial: []
  }
];
let productos = [
  {
    codigo: 1,
    nombre: "Azucar",
    precio: 11400,
    stock: 10,
    rubro: "Alimentos",
    proveedor: "Sin proveedor",
    activo: true
  },
  {
    codigo: 2,
    nombre: "Aceite",
    precio: 9500,
    stock: 20,
    rubro: "Alimentos",
    proveedor: "Sin proveedor",
    activo: true
  },
  {
    codigo: 3,
    nombre: "Yerba",
    precio: 7500,
    stock: 30,
    rubro: "Alimentos",
    proveedor: "Sin proveedor",
    activo: true
  },
  {
    codigo: 4,
    nombre: "Harina",
    precio: 4000,
    stock: 40,
    rubro: "Alimentos",
    proveedor: "Sin proveedor",
    activo: true
  }
];
let pedidos = [

];

let zonas = [
  {
    codigo: 1,
    nombre: "General",
    descripcion: "Clientes sin zona especifica",
    activo: true
  },
  {
    codigo: 2,
    nombre: "Centro",
    descripcion: "Zona comercial central",
    activo: true
  },
  {
    codigo: 3,
    nombre: "Norte",
    descripcion: "Reparto zona norte",
    activo: true
  },
  {
    codigo: 4,
    nombre: "Sur",
    descripcion: "Reparto zona sur",
    activo: true
  }
];

let proveedores = [
  {
    codigo: 1,
    nombre: "Sin proveedor",
    telefono: "-",
    contacto: "-",
    observacion: "Productos sin proveedor asignado",
    activo: true
  }
];

let compras = [];

let listasPrecios = [
  {
    codigo: 1,
    nombre: "Lista 1",
    activo: true
  },
  {
    codigo: 2,
    nombre: "Lista 2",
    activo: true
  },
  {
    codigo: 3,
    nombre: "Lista 3",
    activo: true
  },
  {
    codigo: 4,
    nombre: "Lista 4",
    activo: true
  }
];

let rubros = [
  {
    codigo: 1,
    nombre: "Alimentos",
    descripcion: "Productos de almacen",
    activo: true
  },
  {
    codigo: 2,
    nombre: "Sin rubro",
    descripcion: "Productos sin clasificar",
    activo: true
  }
];
