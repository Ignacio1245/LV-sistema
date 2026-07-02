let guardadoSinSincronizar = false;

function ejecutarSinProgramarSincronizacion(accion) {
    guardadoSinSincronizar = true;

    try {
        return accion();
    } finally {
        guardadoSinSincronizar = false;
    }
}

function puedeProgramarSincronizacion() {
    return !guardadoSinSincronizar;
}

function guardarClientes() {
    dataStore.guardarLista(
        "clientes",
        clientes
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("clientes");
}

function guardarProductos() {
    dataStore.guardarLista(
        "productos",
        productos
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("productos");
}

function guardarPedidos() {
    dataStore.guardarLista(
        "pedidos",
        pedidos
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("pedidos");
}

function guardarZonas() {
    dataStore.guardarLista(
        "zonas",
        zonas
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function guardarProveedores() {
    dataStore.guardarLista(
        "proveedores",
        proveedores
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function guardarCompras() {
    dataStore.guardarLista(
        "compras",
        compras
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function guardarProveedorPagos() {
    dataStore.guardarLista(
        "proveedorPagos",
        proveedorPagos
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function guardarVendedoresSistema() {
    dataStore.guardarLista(
        "vendedoresSistema",
        vendedoresSistema
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function guardarRubros() {
    dataStore.guardarLista(
        "rubros",
        rubros
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function guardarListasPrecios() {
    dataStore.guardarLista(
        "listasPrecios",
        listasPrecios
    );

    if (!puedeProgramarSincronizacion()) {
        return;
    }

    programarSincronizacionAutomatica("datosBase");
}

function leerListaGuardada(nombreDeLista) {
    return dataStore.leerLista(nombreDeLista);
}

function asegurarDatosBaseMinimos() {
    listasPrecios = Array.isArray(listasPrecios) ? listasPrecios : [];
    zonas = Array.isArray(zonas) ? zonas : [];
    rubros = Array.isArray(rubros) ? rubros : [];
    proveedores = Array.isArray(proveedores) ? proveedores : [];
}
function cargarDatos() {

    const clientesGuardados = leerListaGuardada("clientes");
    const productosGuardados = leerListaGuardada("productos");
    const pedidosGuardados = leerListaGuardada("pedidos");
    const zonasGuardadas = leerListaGuardada("zonas");
    const proveedoresGuardados = leerListaGuardada("proveedores");
    const proveedorPagosGuardados = leerListaGuardada("proveedorPagos");
    const vendedoresGuardados = leerListaGuardada("vendedoresSistema");
    const comprasGuardadas = leerListaGuardada("compras");
    const rubrosGuardados = leerListaGuardada("rubros");
    const listasPreciosGuardadas = leerListaGuardada("listasPrecios");

    if (listasPreciosGuardadas) {
        listasPrecios = listasPreciosGuardadas;
    }

    listasPrecios.forEach(function (lista, indice) {
        lista.codigo = Number(lista.codigo) || indice + 1;
        lista.nombre = lista.nombre || "Lista " + lista.codigo;
        lista.porcentaje =
            obtenerPorcentajePredeterminadoListaPrecio(lista.nombre, lista.porcentaje);

        if (typeof lista.activo !== "boolean") {
            lista.activo = true;
        }
    });

    if (rubrosGuardados) {
        rubros = rubrosGuardados;

        rubros.forEach(function (rubro, indice) {
            rubro.codigo = Number(rubro.codigo) || indice + 1;
            rubro.nombre = rubro.nombre || "Rubro";
            rubro.descripcion = rubro.descripcion || "-";

            if (typeof rubro.activo !== "boolean") {
                rubro.activo = true;
            }
        });
    }

    if (proveedoresGuardados) {
        proveedores = proveedoresGuardados;

        proveedores.forEach(function (proveedor, indice) {
            proveedor.codigo = Number(proveedor.codigo) || indice + 1;
            proveedor.nombre = proveedor.nombre || "Proveedor";
            proveedor.telefono = proveedor.telefono || "-";
            proveedor.contacto = proveedor.contacto || "-";
            proveedor.observacion = proveedor.observacion || "-";

            if (typeof proveedor.activo !== "boolean") {
                proveedor.activo = true;
            }
        });
    }

    if (proveedorPagosGuardados && Array.isArray(proveedorPagosGuardados)) {
        proveedorPagos = proveedorPagosGuardados.map(function (pago, indice) {
            return {
                codigo: Number(pago.codigo) || indice + 1,
                proveedor: pago.proveedor || "Sin proveedor",
                importe: Number(pago.importe) || 0,
                medio: pago.medio || "EFECTIVO",
                comprobante: pago.comprobante || "-",
                observacion: pago.observacion || "-",
                fecha: pago.fecha || new Date().toLocaleDateString("es-AR"),
                fechaIso: pago.fechaIso || new Date().toISOString()
            };
        });
    }

    if (vendedoresGuardados && Array.isArray(vendedoresGuardados)) {
        vendedoresSistema = vendedoresGuardados.map(function (vendedor, indice) {
            return {
                codigo: Number(vendedor.codigo) || indice + 1,
                nombre: vendedor.nombre || "Vendedor " + (indice + 1),
                telefono: vendedor.telefono || "-",
                email: vendedor.email || "",
                zona: vendedor.zona || "",
                tipo: vendedor.tipo || "Calle",
                activo: vendedor.activo !== false
            };
        });
    }

    if (zonasGuardadas) {
        zonas = zonasGuardadas;

        zonas.forEach(function (zona, indice) {
            zona.codigo = Number(zona.codigo) || indice + 1;
            zona.nombre = zona.nombre || "Zona";
            zona.descripcion = zona.descripcion || "-";

            if (typeof zona.activo !== "boolean") {
                zona.activo = true;
            }
        });
    }

    if (clientesGuardados) {
        clientes = clientesGuardados;

        clientes.forEach(function (cliente) {
            if (!cliente.historial) {
                cliente.historial = [];
            }
            if (typeof cliente.saldo !== "number") {
                cliente.saldo = 0;
            }
            if (typeof cliente.activo !== "boolean") {
                cliente.activo = true;
            }
            if (!cliente.zona) {
                cliente.zona = "Sin zona";
            }
            cliente.razonSocial = cliente.razonSocial || "";
            cliente.nombreFantasia = cliente.nombreFantasia || "";
            cliente.localidad = cliente.localidad || "";
            cliente.codigoPostal = cliente.codigoPostal || "";
            cliente.telefonoParticular = cliente.telefonoParticular || "";
            cliente.telefonoMovil = cliente.telefonoMovil || "";
            cliente.email = cliente.email || "";
            cliente.listaPrecios = cliente.listaPrecios || "";
            cliente.posicionZona = Number(cliente.posicionZona) || 0;
            cliente.vendedorAsignado = cliente.vendedorAsignado || "";
            cliente.condicionIva = cliente.condicionIva || "";
            cliente.horarioAtencion = cliente.horarioAtencion || "";
            cliente.observaciones = cliente.observaciones || "";
        });

        let seCrearonZonasDesdeClientes = false;

        clientes.forEach(function (cliente) {
            const zonaExistente =
                zonas.some(function (zona) {
                    return normalizarTexto(zona.nombre) === normalizarTexto(cliente.zona);
                });

            if (!zonaExistente) {
                zonas.push({
                    codigo: zonas.length + 1,
                    nombre: cliente.zona,
                    descripcion: "Creada desde clientes existentes",
                    activo: true
                });
                seCrearonZonasDesdeClientes = true;
            }
        });

        if (seCrearonZonasDesdeClientes) {
            guardarZonas();
        }
    }

    if (productosGuardados) {
        productos = productosGuardados;
        let seActualizoEstadoProductoPorStock = false;

        productos.forEach(function (producto) {
            if (typeof producto.activo !== "boolean") {
                producto.activo = true;
            }
            if (!Array.isArray(producto.movimientosStock)) {
                producto.movimientosStock = [];
            }
            if (!producto.proveedor) {
                producto.proveedor = "Sin proveedor";
            }
            if (!producto.rubro) {
                producto.rubro = "Sin rubro";
            }
            producto.codigoReal = producto.codigoReal || "";
            producto.preciosLista = obtenerPreciosListaProducto(producto);
            if (!Array.isArray(producto.historialPrecios)) {
                producto.historialPrecios = [];
            }
            producto.precioCompra = Number(producto.precioCompra) || 0;
            producto.stockMinimo = Number(producto.stockMinimo) || 0;
            producto.tipoStock = producto.tipoStock || "simple";
            producto.stock = Number(producto.stock) || 0;
            producto.unidadesPorBulto = Number(producto.unidadesPorBulto) || 0;
            producto.stockBultos = Number(producto.stockBultos) || 0;
            producto.stockUnidades = Number(producto.stockUnidades) || 0;
            producto.ventaSoloBulto = Boolean(producto.ventaSoloBulto);
            producto.unidadPeso = producto.unidadPeso || "kg";
            producto.tipo = producto.tipo || "";
            producto.marca = producto.marca || "";
            producto.detalle = producto.detalle || "";
            producto.pack = Number(producto.pack) || 0;
            producto.unidad = producto.unidad || "";
            producto.iva = Number(producto.iva) || 0;
            producto.bonificacionVenta = Number(producto.bonificacionVenta) || 0;
            producto.proveedorAlternativo = producto.proveedorAlternativo || "";
            seActualizoEstadoProductoPorStock =
                actualizarEstadoAutomaticoPorStock(producto, false) ||
                seActualizoEstadoProductoPorStock;
        });

        if (seActualizoEstadoProductoPorStock) {
            guardarProductos();
        }

        let seCrearonRubrosDesdeProductos = false;

        productos.forEach(function (producto) {
            const rubroExistente =
                rubros.some(function (rubro) {
                    return normalizarTexto(rubro.nombre) === normalizarTexto(producto.rubro);
                });

            if (!rubroExistente) {
                rubros.push({
                    codigo: rubros.length + 1,
                    nombre: producto.rubro,
                    descripcion: "Creado desde productos existentes",
                    activo: true
                });
                seCrearonRubrosDesdeProductos = true;
            }
        });

        if (seCrearonRubrosDesdeProductos) {
            guardarRubros();
        }

        let seCrearonProveedoresDesdeProductos = false;

        productos.forEach(function (producto) {
            const proveedorExistente =
                proveedores.some(function (proveedor) {
                    return normalizarTexto(proveedor.nombre) === normalizarTexto(producto.proveedor);
                });

            if (!proveedorExistente) {
                proveedores.push({
                    codigo: proveedores.length + 1,
                    nombre: producto.proveedor,
                    telefono: "-",
                    contacto: "-",
                    observacion: "Creado desde productos existentes",
                    activo: true
                });
                seCrearonProveedoresDesdeProductos = true;
            }
        });

        if (seCrearonProveedoresDesdeProductos) {
            guardarProveedores();
        }
    }

    if (pedidosGuardados) {
        pedidos = pedidosGuardados;

        pedidos.forEach(function (pedido) {
            if (!Array.isArray(pedido.items)) {
                pedido.items = [];
            }

            if (!pedido.formaPago) {
                pedido.formaPago = "CUENTA_CORRIENTE";
            }

            if (!Array.isArray(pedido.observaciones)) {
                pedido.observaciones = [];
            }

            if (!pedido.vendedor) {
                pedido.vendedor = "Sin vendedor";
            }

            if (!pedido.zona) {
                pedido.zona =
                    pedido.cliente && pedido.cliente.zona
                        ? pedido.cliente.zona
                        : "Sin zona";
            }

            pedido.items.forEach(function (item) {
                if (typeof item.descuentoPorcentaje !== "number") {
                    item.descuentoPorcentaje = 0;
                }
                if (typeof item.precioUnitario !== "number") {
                    item.precioUnitario =
                        item.producto ? Number(item.producto.precio) || 0 : 0;
                }
                if (!item.listaPrecios) {
                    item.listaPrecios = "Lista 1";
                }
                if (typeof item.subtotal !== "number" && item.producto) {
                    item.subtotal =
                        item.precioUnitario * item.cantidad;
                }
            });
        });
    }

    asegurarDatosBaseMinimos();

    if (comprasGuardadas) {
        compras = comprasGuardadas;

        compras.forEach(function (compra) {
            compra.cantidad = Number(compra.cantidad) || 0;
            compra.costoUnitario = Number(compra.costoUnitario) || 0;
            compra.total = Number(compra.total) || compra.cantidad * compra.costoUnitario;
            compra.proveedor = compra.proveedor || "Sin proveedor";
            compra.productoCodigo = Number(compra.productoCodigo) || 0;
            compra.productoNombre = compra.productoNombre || "Producto";
            compra.comprobante = compra.comprobante || "-";
            compra.fecha = compra.fecha || "-";
        });
    }

}
