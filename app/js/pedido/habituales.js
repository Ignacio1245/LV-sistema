function obtenerClienteActualDelPedido() {
    return clienteSeleccionado ||
        buscarCliente(dom.clienteSearchInput.value);
}

function obtenerProductosHabitualesCliente(cliente) {
    if (!cliente) {
        return [];
    }

    const resumenProductos = {};

    pedidos.forEach(function (pedido) {
        if (!pedido.cliente || pedido.cliente.codigo !== cliente.codigo) {
            return;
        }

        pedido.items.forEach(function (item) {
            const codigoProducto =
                item.producto.codigo;

            const productoActual =
                productos.find(function (producto) {
                    return producto.codigo === codigoProducto;
                });

            if (!productoActual || !productoActivo(productoActual)) {
                return;
            }

            if (!resumenProductos[codigoProducto]) {
                resumenProductos[codigoProducto] = {
                    producto: productoActual,
                    cantidadVeces: 0,
                    unidades: 0
                };
            }

            resumenProductos[codigoProducto].cantidadVeces += 1;
            resumenProductos[codigoProducto].unidades += item.cantidad;
        });
    });

    return Object.values(resumenProductos)
        .sort(function (primero, segundo) {
            if (segundo.cantidadVeces !== primero.cantidadVeces) {
                return segundo.cantidadVeces - primero.cantidadVeces;
            }

            return segundo.unidades - primero.unidades;
        })
        .slice(0, 6);
}

function renderizarProductosHabitualesCliente() {
    if (!dom.productosHabitualesCliente) {
        return;
    }

    const cliente =
        obtenerClienteActualDelPedido();

    dom.productosHabitualesCliente.innerHTML = "";

    if (!cliente) {
        dom.productosHabitualesCliente.innerHTML =
            "<p>Elegi un cliente para ver sus productos habituales.</p>";
        return;
    }

    const productosHabituales =
        obtenerProductosHabitualesCliente(cliente);

    if (productosHabituales.length === 0) {
        dom.productosHabitualesCliente.innerHTML =
            "<p>Este cliente todavia no tiene compras anteriores.</p>";
        return;
    }

    productosHabituales.forEach(function (habitual) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "frequent-product-button";
        boton.innerHTML = `
      <span>
        <strong>${habitual.producto.nombre}</strong>
        <small>${habitual.cantidadVeces} compras | ${habitual.unidades} unidades</small>
      </span>
      <b>+</b>
    `;

        boton.addEventListener("click", function () {
            agregarProductoHabitualAlPedido(habitual.producto.codigo);
        });

        dom.productosHabitualesCliente.appendChild(boton);
    });
}

function agregarProductoHabitualAlPedido(codigoProducto) {
    const producto =
        productos.find(function (productoGuardado) {
            return productoGuardado.codigo === codigoProducto;
        });

    if (!producto) {
        alert("No se encontro el producto.");
        return;
    }

    if (typeof iniciarCargaRapidaProducto === "function") {
        iniciarCargaRapidaProducto(producto);
        return;
    }

    const productoAgregado =
        agregarItemPedido(producto, 1);

    if (!productoAgregado) {
        return;
    }

    productoSeleccionado = null;
    dom.productoSearchInput.value = "";
    dom.cantidadInput.value = 1;
    actualizarVistaBusqueda();
    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();
}
