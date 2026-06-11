const ROLES = {

  SUPERADMIN: {
    productos: true,
    zonas: true,
    proveedores: true,
    compras: true,
    movimientos: true,
    clientes: true,
    ventas: true,
    cuentaCorriente: true,
    configuracion: true,
    auditoria: true,
    informes: true
  },

  ADMINISTRADOR: {
    productos: true,
    zonas: true,
    proveedores: true,
    compras: true,
    movimientos: true,
    clientes: true,
    ventas: true,
    cuentaCorriente: true,
    configuracion: false,
    auditoria: true,
    informes: true
  },

  VENDEDOR: {
    productos: false,
    zonas: false,
    proveedores: false,
    compras: false,
    movimientos: false,
    clientes: true,
    ventas: true,
    cuentaCorriente: false,
    configuracion: false,
    auditoria: false,
    informes: false
  }

};
