const ROLES = {

  SUPERADMIN: {
    productos: true,
    rubros: true,
    zonas: true,
    proveedores: true,
    compras: true,
    movimientos: true,
    clientes: true,
    ventas: true,
    cuentaCorriente: true,
    configuracion: true,
    impresion: true,
    auditoria: true,
    informes: true
  },

  ADMINISTRADOR: {
    productos: true,
    rubros: true,
    zonas: true,
    proveedores: true,
    compras: true,
    movimientos: true,
    clientes: true,
    ventas: true,
    cuentaCorriente: true,
    configuracion: false,
    impresion: false,
    auditoria: true,
    informes: true
  },

  VENDEDOR: {
    productos: false,
    rubros: false,
    zonas: false,
    proveedores: false,
    compras: false,
    movimientos: false,
    clientes: true,
    ventas: true,
    cuentaCorriente: false,
    configuracion: false,
    impresion: false,
    auditoria: false,
    informes: false
  }

};
