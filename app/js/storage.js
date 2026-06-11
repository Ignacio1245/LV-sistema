function guardarClientes() {
    localStorage.setItem(
        "clientes",
        JSON.stringify(clientes)
    );
}

function guardarProductos() {
    localStorage.setItem(
        "productos",
        JSON.stringify(productos)
    );
}

function guardarPedidos() {
    localStorage.setItem(
        "pedidos",
        JSON.stringify(pedidos)
    );
}

function guardarZonas() {
    localStorage.setItem(
        "zonas",
        JSON.stringify(zonas)
    );
}

function guardarProveedores() {
    localStorage.setItem(
        "proveedores",
        JSON.stringify(proveedores)
    );
}

function guardarCompras() {
    localStorage.setItem(
        "compras",
        JSON.stringify(compras)
    );
}

function leerListaGuardada(nombreDeLista) {
    const datosGuardados = localStorage.getItem(nombreDeLista);

    if (!datosGuardados) {
        return null;
    }

    try {
        return JSON.parse(datosGuardados);
    } catch (error) {
        console.warn("No se pudieron leer los datos guardados de " + nombreDeLista);
        localStorage.removeItem(nombreDeLista);
        return null;
    }
}

function cargarDatos() {

    const clientesGuardados = leerListaGuardada("clientes");
    const productosGuardados = leerListaGuardada("productos");
    const pedidosGuardados = leerListaGuardada("pedidos");
    const zonasGuardadas = leerListaGuardada("zonas");
    const proveedoresGuardados = leerListaGuardada("proveedores");
    const comprasGuardadas = leerListaGuardada("compras");

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
        });

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
                if (typeof item.subtotal !== "number" && item.producto) {
                    item.subtotal =
                        item.producto.precio * item.cantidad;
                }
            });
        });
    }

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
