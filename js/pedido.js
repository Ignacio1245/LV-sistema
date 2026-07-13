let pedidoActual = {
    cliente: null,
    items: [],
    formaPago: "CUENTA_CORRIENTE",
    observaciones: []
};
let pedidoEditando = null;
let pedidoEntregaPendiente = null;
let productoCargaRapidaPedido = null;
let cantidadCargaRapidaPedido = 1;
let guardandoPedidoEnCurso = false;
const pedidosOperacionEnCurso = new Set();

function limpiarPedidoActual() {
    pedidoActual = {
        cliente: null,
        items: [],
        formaPago: "CUENTA_CORRIENTE",
        observaciones: []
    };
}

function pedidoActualTieneDatos() {
    return pedidoActual.items.length > 0 ||
        pedidoActual.cliente ||
        pedidoActual.observaciones.length > 0 ||
        dom.clienteSearchInput.value.trim() !== "" ||
        dom.productoSearchInput.value.trim() !== "" ||
        pedidoEditando !== null;
}

function advertirSalidaConPedidoSinGuardar(event) {
    if (!pedidoActualTieneDatos()) {
        return;
    }

    event.preventDefault();
    event.returnValue = "";
}

function obtenerSiguienteNumeroPedido() {

    if (pedidos.length === 0) {
        return 1;
    }

    const numerosDePedidos =
        pedidos.map(function (pedido) {

            return Number(pedido.numero) || 0;

        });

    return Math.max.apply(null, numerosDePedidos) + 1;

}

function limpiarFormularioPedido() {

    dom.clienteSearchInput.value = "";
    dom.productoSearchInput.value = "";
    dom.cantidadInput.value = 1;
    dom.formaPagoInput.value = "CUENTA_CORRIENTE";
    clienteSeleccionado = null;
    productoSeleccionado = null;
    actualizarVistaBusqueda();
    actualizarClientePedidoSeleccionado();
    renderizarProductosHabitualesCliente();
    renderizarCatalogoProductosPedido();

}

function obtenerTextoFormaPago(formaPago) {
    const mapaFormasDePago = {
        CUENTA_CORRIENTE: "Cuenta corriente",
        EFECTIVO: "Efectivo",
        TRANSFERENCIA: "Transferencia"
    };

    return mapaFormasDePago[formaPago] || "Cuenta corriente";
}

function obtenerFormaPagoActual() {
    if (!dom.formaPagoInput) {
        return "CUENTA_CORRIENTE";
    }

    return dom.formaPagoInput.value || "CUENTA_CORRIENTE";
}

function actualizarEncabezadoFormularioPedido() {
    if (!dom.pedidoFormTitle || !dom.pedidoFormSubtitle) {
        return;
    }

    if (!pedidoEditando) {
        dom.pedidoFormTitle.textContent = "Nuevo pedido";
        dom.pedidoFormSubtitle.textContent =
            "Arma el pedido en orden: cliente, productos y cierre.";
        dom.guardarPedidoButton.textContent = "Guardar venta";
        dom.guardarBorradorPedidoButton.textContent = "Guardar borrador";
        return;
    }

    const numeroPedido =
        pedidoEditando.numero || pedidoEditando.id;

    if (pedidoEditando.estado === "BORRADOR") {
        dom.pedidoFormTitle.textContent =
            "Editando borrador #" + numeroPedido;
        dom.pedidoFormSubtitle.textContent =
            "Completa los datos y guardalo como pendiente cuando este listo.";
        dom.guardarPedidoButton.textContent = "Pasar a pendiente";
        dom.guardarBorradorPedidoButton.textContent = "Guardar borrador";
        return;
    }

    dom.pedidoFormTitle.textContent =
        "Editando pedido #" + numeroPedido;
    dom.pedidoFormSubtitle.textContent =
        "Estas modificando un pedido guardado. Revisa cliente, productos y forma de pago.";
    dom.guardarPedidoButton.textContent = "Guardar cambios";
    dom.guardarBorradorPedidoButton.textContent = "Guardar como borrador";
}

function borrarPedidoActual() {
    if (pedidoActualTieneDatos()) {
        const confirmar =
            confirm("Limpiar el pedido actual?");

        if (!confirmar) {
            return;
        }
    }

    limpiarPedidoActual();
    pedidoEditando = null;
    limpiarFormularioPedido();
    renderizarPedidoActual();
}

function guardarYAtenderPedidoActual() {
    const pedidoGuardado =
        guardarPedido();

    if (!pedidoGuardado) {
        return;
    }

    if (pedidoGuardado.estado !== "PENDIENTE") {
        alert("Solo se puede atender un pedido pendiente.");
        return;
    }

    atenderPedido(pedidoGuardado.id);
}

function actualizarClientePedidoSeleccionado() {

    if (!dom.selectedClientName || !dom.selectedClientDetails) {
        return;
    }

    const cliente =
        clienteSeleccionado ||
        buscarCliente(dom.clienteSearchInput.value);

    if (!cliente) {
        dom.selectedClientName.textContent = "Ninguno";
        dom.selectedClientDetails.textContent = "Elegilo para comenzar el pedido.";
        if (dom.pedidoListaPreview) {
            dom.pedidoListaPreview.textContent = "Lista 1";
        }
        renderizarProductosHabitualesCliente();
        renderizarCatalogoProductosPedido();
        return;
    }

    dom.selectedClientName.textContent =
        cliente.codigo + " - " + cliente.nombre;

    dom.selectedClientDetails.textContent =
        cliente.direccion + " | Zona: " + (cliente.zona || "Sin zona") +
        " | Saldo: " + formatearDinero(cliente.saldo || 0);

    if (dom.pedidoListaPreview) {
        dom.pedidoListaPreview.textContent =
            cliente.listaPrecios || "Lista 1";
    }

    renderizarProductosHabitualesCliente();
    renderizarCatalogoProductosPedido();

}

function obtenerCantidadProductoEnPedido(codigoProducto) {

    const itemEncontrado =
        pedidoActual.items.find(function (item) {

            return item.producto.codigo === codigoProducto;

        });

    if (!itemEncontrado) {
        return 0;
    }

    return itemEncontrado.cantidad;

}

function obtenerStockDisponibleParaPedido(producto) {

    return obtenerStockVendible(producto, pedidoEditando ? pedidoEditando.id : null) - obtenerCantidadProductoEnPedido(producto.codigo);

}

function formatearCantidadPedido(producto, cantidad) {
    const cantidadNumerica =
        Number(cantidad) || 0;

    if (productoEsPeso(producto)) {
        return cantidadNumerica.toLocaleString("es-AR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        }) + " " + obtenerUnidadStockProducto(producto);
    }

    if (productoManejaBultos(producto)) {
        const unidadesPorBulto =
            Math.max(1, enteroProductoSeguro(producto.unidadesPorBulto));

        if (producto.ventaSoloBulto && cantidadNumerica % unidadesPorBulto === 0) {
            const bultos = cantidadNumerica / unidadesPorBulto;
            return bultos + " b (" + enteroProductoSeguro(cantidadNumerica) + " u)";
        }

        return enteroProductoSeguro(cantidadNumerica) + " u";
    }

    return enteroProductoSeguro(cantidadNumerica) + " u";
}

function obtenerIncrementoPedidoProducto(producto) {
    if (productoEsPeso(producto)) {
        return 0.1;
    }

    if (productoManejaBultos(producto) && producto.ventaSoloBulto) {
        return 1;
    }

    return 1;
}

function validarCantidadPedidoProducto(producto, cantidad) {
    const cantidadNumerica =
        Number(cantidad);

    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
        return {
            valido: false,
            mensaje: "Cantidad invalida."
        };
    }

    if (productoEsPeso(producto)) {
        return {
            valido: true,
            cantidad: Math.round(cantidadNumerica * 1000) / 1000
        };
    }

    if (!Number.isInteger(cantidadNumerica)) {
        return {
            valido: false,
            mensaje: "Este producto se vende por unidades enteras."
        };
    }

    if (productoManejaBultos(producto) && producto.ventaSoloBulto) {
        const unidadesPorBulto =
            Math.max(1, enteroProductoSeguro(producto.unidadesPorBulto));

        return {
            valido: true,
            cantidad: cantidadNumerica * unidadesPorBulto
        };
    }

    return {
        valido: true,
        cantidad: cantidadNumerica
    };
}

function actualizarControlCantidadPorProducto(producto) {
    if (!dom.cantidadInput || !producto) {
        return;
    }

    const incremento =
        obtenerIncrementoPedidoProducto(producto);

    dom.cantidadInput.step =
        productoEsPeso(producto) ? "0.001" : String(incremento);
    dom.cantidadInput.min =
        String(incremento);

    if (
        !Number.isFinite(Number(dom.cantidadInput.value)) ||
        Number(dom.cantidadInput.value) < incremento
    ) {
        dom.cantidadInput.value = incremento;
    }

    if (
        productoManejaBultos(producto) &&
        producto.ventaSoloBulto &&
        Number(dom.cantidadInput.value) % incremento !== 0
    ) {
        dom.cantidadInput.value = incremento;
    }
}

function normalizarDescuentoPedido(descuento) {
    const descuentoNumerico = Number(descuento);

    if (Number.isNaN(descuentoNumerico) || descuentoNumerico < 0) {
        return 0;
    }

    if (descuentoNumerico > 100) {
        return 100;
    }

    return descuentoNumerico;
}

function obtenerListaPreciosPedidoActual() {
    const cliente =
        pedidoActual.cliente ||
        clienteSeleccionado ||
        buscarCliente(dom.clienteSearchInput.value);

    return cliente && cliente.listaPrecios
        ? cliente.listaPrecios
        : "Lista 1";
}

function obtenerPrecioUnitarioItemPedido(item) {
    if (typeof item.precioUnitario === "number") {
        return item.precioUnitario;
    }

    return obtenerPrecioProductoPorLista(
        item.producto,
        item.listaPrecios || obtenerListaPreciosPedidoActual()
    );
}

function calcularSubtotalItemPedido(producto, cantidad, descuentoPorcentaje) {
    const descuentoNormalizado =
        normalizarDescuentoPedido(descuentoPorcentaje);

    const precioUnitario =
        obtenerPrecioProductoPorLista(producto, obtenerListaPreciosPedidoActual());

    const subtotalSinDescuento =
        precioUnitario * cantidad;

    const importeDescuento =
        subtotalSinDescuento * descuentoNormalizado / 100;

    return subtotalSinDescuento - importeDescuento;
}

function actualizarSubtotalItemPedido(item) {
    item.descuentoPorcentaje =
        normalizarDescuentoPedido(item.descuentoPorcentaje || 0);
    item.listaPrecios =
        item.listaPrecios || obtenerListaPreciosPedidoActual();
    item.precioUnitario =
        typeof item.precioUnitario === "number"
            ? item.precioUnitario
            : obtenerPrecioProductoPorLista(item.producto, item.listaPrecios);

    item.subtotal =
        (item.precioUnitario * item.cantidad) -
        ((item.precioUnitario * item.cantidad) * item.descuentoPorcentaje / 100);
}

function obtenerCantidadSugeridaCargaRapida(producto) {
    const incremento =
        obtenerIncrementoPedidoProducto(producto);
    const cantidadActual =
        Number(dom.cantidadInput.value);

    if (!Number.isFinite(cantidadActual) || cantidadActual < incremento) {
        return incremento;
    }

    return cantidadActual;
}

function actualizarResumenCargaRapidaPedido() {
    if (!productoCargaRapidaPedido) {
        return;
    }

    const precioUnitario =
        obtenerPrecioProductoPorLista(productoCargaRapidaPedido, obtenerListaPreciosPedidoActual());
    const cantidadIngresada =
        Number(dom.pedidoRapidoCantidadInput.value);
    const cantidadValidada =
        validarCantidadPedidoProducto(productoCargaRapidaPedido, cantidadIngresada);
    const cantidadParaCalculo =
        cantidadValidada.valido ? cantidadValidada.cantidad : 0;
    const bonificacion =
        normalizarDescuentoPedido(dom.pedidoRapidoBonificacionInput.value);
    const subtotal =
        (precioUnitario * cantidadParaCalculo) -
        ((precioUnitario * cantidadParaCalculo) * bonificacion / 100);

    dom.pedidoRapidoPrecioPreview.textContent =
        "Precio: " + formatearDinero(precioUnitario) +
        " | Disponible: " + formatearCantidadPedido(
            productoCargaRapidaPedido,
            obtenerStockVendible(productoCargaRapidaPedido, pedidoEditando ? pedidoEditando.id : null)
        );
    dom.pedidoRapidoSubtotalPreview.textContent =
        "Subtotal: " + formatearDinero(subtotal) +
        (bonificacion > 0 ? " | Bonificacion: " + bonificacion + "%" : "");
}

function mostrarPasoCargaRapidaPedido(paso) {
    const mostrandoCantidad =
        paso === "cantidad";

    dom.pedidoRapidoCantidadForm.classList.toggle("hidden", !mostrandoCantidad);
    dom.pedidoRapidoBonificacionForm.classList.toggle("hidden", mostrandoCantidad);
    actualizarResumenCargaRapidaPedido();

    setTimeout(function () {
        const inputParaFoco =
            mostrandoCantidad
                ? dom.pedidoRapidoCantidadInput
                : dom.pedidoRapidoBonificacionInput;

        inputParaFoco.focus();
        inputParaFoco.select();
    }, 0);
}

function iniciarCargaRapidaProducto(producto) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para modificar pedidos.");
        return;
    }

    if (!productoDisponibleParaPedido(producto)) {
        alert(obtenerMensajeProductoNoDisponible(producto));
        return;
    }

    productoSeleccionado = producto;
    productoCargaRapidaPedido = producto;
    cantidadCargaRapidaPedido =
        obtenerCantidadSugeridaCargaRapida(producto);

    dom.productoSearchInput.value =
        producto.codigo + " - " + producto.nombre;
    dom.productoSearchResults.classList.add("hidden");
    actualizarControlCantidadPorProducto(producto);
    dom.pedidoRapidoCantidadInput.step =
        productoEsPeso(producto) ? "0.001" : String(obtenerIncrementoPedidoProducto(producto));
    dom.pedidoRapidoCantidadInput.min =
        String(obtenerIncrementoPedidoProducto(producto));
    dom.pedidoRapidoCantidadInput.value =
        cantidadCargaRapidaPedido;
    dom.pedidoRapidoBonificacionInput.value =
        0;
    dom.pedidoRapidoTitulo.textContent =
        producto.codigo + " - " + producto.nombre;
    dom.pedidoRapidoProductoDetalle.textContent =
        obtenerListaPreciosPedidoActual() + " | " +
        formatearDinero(obtenerPrecioProductoPorLista(producto, obtenerListaPreciosPedidoActual()));
    dom.pedidoRapidoModal.classList.remove("hidden");

    mostrarPasoCargaRapidaPedido("cantidad");
}

function cerrarCargaRapidaPedido() {
    productoCargaRapidaPedido = null;
    cantidadCargaRapidaPedido = 1;

    if (dom.pedidoRapidoModal) {
        dom.pedidoRapidoModal.classList.add("hidden");
    }

    if (dom.productoSearchInput) {
        dom.productoSearchInput.focus();
    }
}

function confirmarCantidadCargaRapidaPedido(event) {
    event.preventDefault();

    if (!productoCargaRapidaPedido) {
        cerrarCargaRapidaPedido();
        return;
    }

    const cantidadIngresada =
        Number(dom.pedidoRapidoCantidadInput.value);
    const cantidadValidada =
        validarCantidadPedidoProducto(productoCargaRapidaPedido, cantidadIngresada);

    if (!cantidadValidada.valido) {
        alert(cantidadValidada.mensaje);
        return;
    }

    cantidadCargaRapidaPedido =
        cantidadIngresada;
    mostrarPasoCargaRapidaPedido("bonificacion");
}

function limpiarProductoDespuesDeAgregarPedido() {
    dom.productoSearchInput.value = "";
    dom.cantidadInput.value = 1;
    dom.cantidadInput.step = "1";
    dom.cantidadInput.min = "1";
    productoSeleccionado = null;
    actualizarVistaBusqueda();
    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();
    dom.productoSearchInput.focus();
}

function agregarProductoCargaRapidaPedido(event) {
    if (event) {
        event.preventDefault();
    }

    if (!productoCargaRapidaPedido) {
        cerrarCargaRapidaPedido();
        return;
    }

    const bonificacion =
        normalizarDescuentoPedido(dom.pedidoRapidoBonificacionInput.value);
    const productoAgregado =
        agregarItemPedido(
            productoCargaRapidaPedido,
            cantidadCargaRapidaPedido,
            bonificacion
        );

    if (!productoAgregado) {
        return;
    }

    cerrarCargaRapidaPedido();
    limpiarProductoDespuesDeAgregarPedido();
}

function agregarProductoSinBonificacionCargaRapida() {
    dom.pedidoRapidoBonificacionInput.value = 0;
    agregarProductoCargaRapidaPedido();
}

function renderizarCatalogoProductosPedido() {

    if (!dom.pedidoProductCatalog) {
        return;
    }

    const textoBusqueda =
        dom.productoSearchInput.value.trim().toLowerCase();

    const productosFiltrados =
        productos.filter(function (producto) {
            const coincideBusqueda =
                textoBusqueda === "" ||
                String(producto.codigo).includes(textoBusqueda) ||
                producto.nombre.toLowerCase().includes(textoBusqueda);

            return productoActivo(producto) && coincideBusqueda;
        });

    dom.pedidoProductCatalog.innerHTML = "";

    if (productosFiltrados.length === 0) {
        dom.pedidoProductCatalog.innerHTML = `
      <div class="empty-catalog">
        No hay productos que coincidan con la busqueda.
      </div>
    `;
        return;
    }

    productosFiltrados.forEach(function (producto) {
        const stockDisponible =
            obtenerStockDisponibleParaPedido(producto);

        const card = document.createElement("article");
        card.className = "product-catalog-card";

        const estadoStock =
            obtenerEstadoStockProducto(producto);

        if (stockDisponible <= 0) {
            card.classList.add("without-stock");
        }

        card.innerHTML = `
      <div>
        <span class="product-code">#${producto.codigo}</span>
        <h4>${producto.nombre}</h4>
        <p>${formatearDinero(obtenerPrecioProductoPorLista(producto, obtenerListaPreciosPedidoActual()))}</p>
        <small>${obtenerListaPreciosPedidoActual()}</small>
        <small class="stock-pill ${estadoStock.clase}">${estadoStock.texto}</small>
      </div>
      <div class="product-card-footer">
        <span>Disponible: ${formatearStockProducto(producto)}</span>
        <button class="btn btn-atender" type="button" ${stockDisponible <= 0 ? "disabled" : ""}>
          Agregar
        </button>
      </div>
    `;

        const botonAgregar =
            card.querySelector("button");

        botonAgregar.addEventListener("click", function () {
            iniciarCargaRapidaProducto(producto);
        });

        dom.pedidoProductCatalog.appendChild(card);
    });

}

function agregarItemPedido(producto, cantidad, descuentoPorcentaje) {
    const cantidadValidada =
        validarCantidadPedidoProducto(producto, cantidad);
    const descuentoAplicado =
        descuentoPorcentaje === undefined || descuentoPorcentaje === null
            ? null
            : normalizarDescuentoPedido(descuentoPorcentaje);

    if (!cantidadValidada.valido) {
        alert(cantidadValidada.mensaje);
        return false;
    }

    cantidad =
        cantidadValidada.cantidad;

    if (!productoDisponibleParaPedido(producto)) {
        alert(obtenerMensajeProductoNoDisponible(producto));
        return false;
    }

    const cantidadActual =
        obtenerCantidadProductoEnPedido(producto.codigo);

    const nuevaCantidad =
        cantidadActual + cantidad;

    const stockVendible =
        obtenerStockVendible(producto, pedidoEditando ? pedidoEditando.id : null);

    if (nuevaCantidad > stockVendible) {
        alert(
            "No podes agregar mas de " +
            formatearCantidadPedido(producto, stockVendible) +
            " de " +
            producto.nombre +
            "."
        );
        return false;
    }

    const existente = pedidoActual.items.find(function (item) {

        return item.producto.codigo === producto.codigo;

    });

    if (existente) {

        existente.cantidad += cantidad;

        if (descuentoAplicado !== null) {
            existente.descuentoPorcentaje = descuentoAplicado;
        }

        actualizarSubtotalItemPedido(existente);

        return true;

    }

    const listaPrecios =
        obtenerListaPreciosPedidoActual();
    const descuentoNuevo =
        descuentoAplicado === null ? 0 : descuentoAplicado;

    pedidoActual.items.push({

        producto: producto,
        cantidad: cantidad,
        listaPrecios: listaPrecios,
        precioUnitario: obtenerPrecioProductoPorLista(producto, listaPrecios),
        descuentoPorcentaje: descuentoNuevo,
        subtotal: calcularSubtotalItemPedido(producto, cantidad, descuentoNuevo)

    });

    return true;

}

function calcularTotalPedido() {

    return pedidoActual.items.reduce(

        function (total, item) {

            return total + item.subtotal;

        },

        0

    );

}

function agregarProductoAlPedidoActual() {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para modificar pedidos.");
        return;
    }

    const producto =
        productoSeleccionado ||
        buscarProducto(dom.productoSearchInput.value);

    const cantidad =
        Number(dom.cantidadInput.value);

    if (!producto) {

        alert("Seleccione un producto");

        return;

    }

    const productoAgregado = agregarItemPedido(
        producto,
        cantidad
    );

    if (!productoAgregado) {
        return;
    }

    dom.productoSearchInput.value = "";
    dom.cantidadInput.value = 1;
    dom.cantidadInput.step = "1";
    dom.cantidadInput.min = "1";
    productoSeleccionado = null;
    actualizarVistaBusqueda();
    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();

}

function renderizarPedidoActual() {

    dom.pedidoItemsTable.innerHTML = "";

    pedidoActual.formaPago = obtenerFormaPagoActual();
    actualizarEncabezadoFormularioPedido();

    if (dom.pedidoNumeroPreview) {
        dom.pedidoNumeroPreview.textContent =
            pedidoEditando
                ? "#" + (pedidoEditando.numero || pedidoEditando.id)
                : "#" + obtenerSiguienteNumeroPedido();
    }

    if (dom.pedidoVendedorPreview) {
        dom.pedidoVendedorPreview.textContent =
            usuarioActual ? usuarioActual.nombre : "Actual";
    }

    renderizarObservacionesPedidoActual();

    if (pedidoActual.items.length === 0) {

        dom.pedidoItemsTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          Todavia no agregaste productos al pedido.
        </td>
      </tr>
    `;

        dom.pedidoTotal.textContent = formatearDinero(0);

        if (dom.pedidoItemCount) {
            dom.pedidoItemCount.textContent = "0 unidades cargadas";
        }

        return;

    }

    pedidoActual.items.forEach(function (item) {

        actualizarSubtotalItemPedido(item);

        const row =
            document.createElement("tr");

        row.innerHTML = `
      <td>${item.producto.codigo}</td>
      <td>${item.producto.nombre}</td>
      <td>
        <div class="quantity-control">
          <button class="btn btn-secondary" onclick="restarUnidadPedidoActual(${item.producto.codigo})">-</button>
          <span>${formatearCantidadPedido(item.producto, item.cantidad)}</span>
          <button class="btn btn-secondary" onclick="sumarUnidadPedidoActual(${item.producto.codigo})">+</button>
        </div>
      </td>
      <td>
        <input
          class="discount-input"
          type="number"
          min="0"
          max="100"
          value="${item.descuentoPorcentaje}"
          onchange="cambiarDescuentoProductoPedido(${item.producto.codigo}, this.value)"
        >
      </td>
      <td>
        ${formatearDinero(obtenerPrecioUnitarioItemPedido(item))}
        <small>${item.listaPrecios || "Lista 1"}</small>
      </td>
      <td>${formatearDinero(item.subtotal)}</td>
      <td>
        <button class="btn btn-secondary" onclick="quitarProductoDelPedidoActual(${item.producto.codigo})">
          Quitar
        </button>
      </td>
    `;

        dom.pedidoItemsTable
            .appendChild(row);

    });

    dom.pedidoTotal.textContent =
        formatearDinero(
            calcularTotalPedido()
        );

    const cantidadTotalItems =
        pedidoActual.items.reduce(function (total, item) {
            return total + item.cantidad;
        }, 0);

    if (dom.pedidoItemCount) {
        dom.pedidoItemCount.textContent =
            cantidadTotalItems === 1
                ? "1 unidad cargada"
                : cantidadTotalItems + " unidades cargadas";
    }

}

function guardarPedido(estadoPedido) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para guardar pedidos.");
        return null;
    }

    if (guardandoPedidoEnCurso) {
        alert("El pedido ya se esta guardando. Espera un segundo.");
        return null;
    }

    guardandoPedidoEnCurso = true;

    try {
    const estadoFinal =
        typeof estadoPedido === "string"
            ? estadoPedido
            : pedidoEditando && pedidoEditando.estado !== "BORRADOR"
                ? pedidoEditando.estado
                : "PENDIENTE";

    pedidoActual.cliente =
        clienteSeleccionado ||
        buscarCliente(
            dom.clienteSearchInput.value
        );

    if (!pedidoActual.cliente) {

        alert("Seleccione un cliente");
        guardandoPedidoEnCurso = false;

        return;

    }

    if (!clienteActivo(pedidoActual.cliente)) {

        alert("El cliente seleccionado esta inactivo.");
        guardandoPedidoEnCurso = false;

        return;

    }

    if (pedidoActual.items.length === 0 && estadoFinal !== "BORRADOR") {

        alert("Agregue productos");
        guardandoPedidoEnCurso = false;

        return;

    }
    if (pedidoEditando) {
        const pedidoGuardado =
            pedidoEditando;

        pedidoGuardado.cliente =
            pedidoActual.cliente;

        if (!pedidoGuardado.vendedor) {
            pedidoGuardado.vendedor =
                usuarioActual ? usuarioActual.nombre : "Sin vendedor";
        }

        pedidoGuardado.zona =
            pedidoActual.cliente.zona || pedidoGuardado.zona || "Sin zona";

        pedidoGuardado.items =
            pedidoActual.items.map(function (item) {
                actualizarSubtotalItemPedido(item);

                return {
                    producto: item.producto,
                    cantidad: item.cantidad,
                    listaPrecios: item.listaPrecios || obtenerListaPreciosPedidoActual(),
                    precioUnitario: obtenerPrecioUnitarioItemPedido(item),
                    descuentoPorcentaje: item.descuentoPorcentaje,
                    subtotal: item.subtotal
                };
            });

        pedidoGuardado.formaPago =
            obtenerFormaPagoActual();

        pedidoGuardado.observaciones =
            [...pedidoActual.observaciones];

        pedidoGuardado.total =
            calcularTotalPedido();

        pedidoGuardado.estado =
            estadoFinal;

        guardarPedidos();
        guardarPedidoOperacionSupabase(pedidoGuardado);

        registrarAuditoria(
            "Pedidos",
            estadoFinal === "BORRADOR" ? "Guardo borrador" : "Actualizo pedido",
            "#" + (pedidoGuardado.numero || pedidoGuardado.id) + " | " + pedidoGuardado.cliente.nombre + " | " + formatearDinero(pedidoGuardado.total)
        );

        renderizarPedidos();
        actualizarDashboard();
        renderizarProductosHabitualesCliente();

        limpiarPedidoActual();

        pedidoEditando = null;

        limpiarFormularioPedido();
        renderizarPedidoActual();

        alert(
            estadoFinal === "BORRADOR"
                ? "Borrador guardado"
                : "Pedido actualizado"
        );

        volverAlListadoDePedidos();

        guardandoPedidoEnCurso = false;
        return pedidoGuardado;
    }

    const nuevoPedido = {

        numero: obtenerSiguienteNumeroPedido(),

        id: Date.now(),

        cliente: pedidoActual.cliente,

        vendedor: usuarioActual ? usuarioActual.nombre : "Sin vendedor",

        zona: pedidoActual.cliente.zona || "Sin zona",

        items: pedidoActual.items.map(function (item) {
            actualizarSubtotalItemPedido(item);

            return {
                producto: item.producto,
                cantidad: item.cantidad,
                listaPrecios: item.listaPrecios || obtenerListaPreciosPedidoActual(),
                precioUnitario: obtenerPrecioUnitarioItemPedido(item),
                descuentoPorcentaje: item.descuentoPorcentaje,
                subtotal: item.subtotal
            };
        }),

        formaPago: obtenerFormaPagoActual(),

        observaciones: [...pedidoActual.observaciones],

        total: calcularTotalPedido(),

        estado: estadoFinal,

        fecha:
            new Date()
                .toLocaleDateString("es-AR")

    };

    pedidos.unshift(nuevoPedido);

    guardarPedidos();
    guardarPedidoOperacionSupabase(nuevoPedido);

    registrarAuditoria(
        "Pedidos",
        estadoFinal === "BORRADOR" ? "Creo borrador" : "Creo pedido",
        "#" + nuevoPedido.numero + " | " + nuevoPedido.cliente.nombre + " | " + formatearDinero(nuevoPedido.total)
    );

    renderizarPedidos();
    actualizarDashboard();
    renderizarProductosHabitualesCliente();

    limpiarPedidoActual();

    limpiarFormularioPedido();
    renderizarPedidoActual();

    alert(
        estadoFinal === "BORRADOR"
            ? "Borrador guardado"
            : "Pedido creado"
    );

    volverAlListadoDePedidos();

    guardandoPedidoEnCurso = false;
    return nuevoPedido;
    } finally {
        guardandoPedidoEnCurso = false;
    }

}

function guardarBorradorPedidoActual() {
    return guardarPedido("BORRADOR");
}

function obtenerFechaPedidoParaFiltro(fechaPedido) {
    if (!fechaPedido) {
        return "";
    }

    if (fechaPedido.includes("-")) {
        return fechaPedido;
    }

    const partesFecha =
        fechaPedido.split("/");

    if (partesFecha.length !== 3) {
        return "";
    }

    const dia =
        partesFecha[0].padStart(2, "0");

    const mes =
        partesFecha[1].padStart(2, "0");

    const anio =
        partesFecha[2];

    return anio + "-" + mes + "-" + dia;
}

function obtenerPedidosFiltrados() {
    const textoBusqueda =
        dom.buscarPedidoTabla
            ? dom.buscarPedidoTabla.value.trim().toLowerCase()
            : "";

    const filtroEstado =
        filtroEstadoPedidos || "TODOS";

    const filtroFecha =
        dom.pedidoFechaFiltro
            ? dom.pedidoFechaFiltro.value
            : "";

    const pedidosFiltrados =
        pedidos.filter(function (pedido) {
            const numeroPedido =
                String(pedido.numero || pedido.id);

            const codigoCliente =
                pedido.cliente && pedido.cliente.codigo !== undefined
                    ? String(pedido.cliente.codigo)
                    : "";

            const nombreCliente =
                pedido.cliente ? pedido.cliente.nombre : "";

            const formaPago =
                obtenerTextoFormaPago(pedido.formaPago || "CUENTA_CORRIENTE");

            const totalPedido =
                String(pedido.total || 0);

            const fechaPedidoFiltro =
                obtenerFechaPedidoParaFiltro(pedido.fecha);

            const coincideBusqueda =
                textoBusqueda === "" ||
                numeroPedido.includes(textoBusqueda) ||
                codigoCliente.includes(textoBusqueda) ||
                normalizarTexto(nombreCliente).includes(textoBusqueda) ||
                normalizarTexto(pedido.estado).includes(textoBusqueda) ||
                normalizarTexto(pedido.estadoCobro || "").includes(textoBusqueda) ||
                normalizarTexto(pedido.fecha || "").includes(textoBusqueda) ||
                normalizarTexto(formaPago).includes(textoBusqueda) ||
                totalPedido.includes(textoBusqueda);

            const coincideEstado =
                filtroEstado === "TODOS" ||
                pedido.estado === filtroEstado ||
                pedido.estadoCobro === filtroEstado;

            const coincideFecha =
                filtroFecha === "" ||
                fechaPedidoFiltro === filtroFecha;

            return coincideBusqueda && coincideEstado && coincideFecha;
        }).sort(function (primero, segundo) {
            return (segundo.numero || segundo.id) - (primero.numero || primero.id);
        });

    return pedidosFiltrados;
}

function renderizarPedidos() {

    dom.pedidosTable.innerHTML = "";

    actualizarMenuPedidos();

    const pedidosFiltrados =
        obtenerPedidosFiltrados();

    if (dom.pedidosResultadoContador) {
        const totalFiltrado =
            pedidosFiltrados.reduce(function (total, pedido) {
                return total + (Number(pedido.total) || 0);
            }, 0);

        dom.pedidosResultadoContador.textContent =
            pedidosFiltrados.length === 1
                ? "Mostrando 1 pedido | Total " + formatearDinero(totalFiltrado)
                : "Mostrando " + pedidosFiltrados.length + " pedidos | Total " + formatearDinero(totalFiltrado);
    }

    if (pedidosFiltrados.length === 0) {

        dom.pedidosTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          No hay pedidos para mostrar.
        </td>
      </tr>
    `;

        return;

    }

    pedidosFiltrados.forEach(function (pedido) {

        const row =
            document.createElement("tr");
        const clientePedidoTexto =
            pedido.cliente && pedido.cliente.codigo !== undefined
                ? pedido.cliente.codigo + " - " + pedido.cliente.nombre
                : "Sin cliente";

        row.innerHTML = `

      <td>
        #${pedido.numero || pedido.id}
      </td>

      <td>
        ${clientePedidoTexto}
      </td>

      <td>
        ${obtenerTextoFormaPago(pedido.formaPago || "CUENTA_CORRIENTE")}
        ${typeof pedido.importePagado === "number"
                ? `<small class="payment-detail">
            Pago: ${formatearDinero(pedido.importePagado)}
            ${pedido.saldoPendiente > 0
                    ? " | Saldo: " + formatearDinero(pedido.saldoPendiente)
                    : ""}
            | ${pedido.estadoCobro === "CUENTA_CORRIENTE" ? "Cuenta corriente" : "Cobrado"}
          </small>`
                : ""
            }
      </td>

      <td>
        ${formatearDinero(pedido.total)}
      </td>

      <td>
        <span class="status ${pedido.estado.toLowerCase()}">
          ${pedido.estado}
        </span>
        ${pedido.estadoCobro
                ? `<small class="payment-detail">
            ${pedido.estadoCobro === "CUENTA_CORRIENTE" ? "Cuenta corriente" : "Cobrado"}
          </small>`
                : ""
            }
      </td>

      <td>
        ${pedido.fecha}
      </td>

      <td>

        ${pedido.estado === "BORRADOR"
                ? `
            <button class="btn btn-secondary" onclick="editarPedido(${pedido.id})">
              Editar
            </button>

            <button class="btn btn-danger" onclick="eliminarPedido(${pedido.id})">
              Eliminar
            </button>
          `
                : ""
            }

        ${pedido.estado === "PENDIENTE"
                ? `
            <button class="btn btn-atender" onclick="atenderPedido(${pedido.id})">
              Atender
            </button>

            <button class="btn btn-danger" onclick="cancelarPedido(${pedido.id})">
              Cancelar
            </button>
            <button class="btn btn-secondary" onclick="editarPedido(${pedido.id})">
              Editar
            </button>
          `
                : ""
            }

        ${pedido.estado === "ATENDIDO"
                ? `
            <button class="btn btn-entregar" onclick="entregarPedido(${pedido.id})">
              Entregar
            </button>
            <button class="btn btn-secondary" onclick="reabrirPedidoAtendido(${pedido.id})">
              Reabrir
            </button>
          `
                : ""
            }

        ${pedido.estado === "ENTREGADO" && typeof pedido.importePagado !== "number"
                ? `
            <button class="btn btn-cobrado" onclick="cobrarPedido(${pedido.id})">
              Marcar cobrado
            </button>

            <button class="btn btn-cc" onclick="pasarACuentaCorriente(${pedido.id})">
              A cuenta
            </button>
          `
                : ""
            }

        <button class="btn btn-secondary" onclick="verDetallePedido(${pedido.id})">
          Ver
        </button>
        <button class="btn btn-secondary" onclick="imprimirPedidoGuardado(${pedido.id})">
          Imprimir
        </button>
        ${pedido.estado === "CANCELADO"
                ? `
      <button class="btn btn-danger" onclick="eliminarPedido(${pedido.id})">
        Eliminar
      </button>
    `
                : ""
            }

      </td>
    `;

        dom.pedidosTable.appendChild(row);

    });

}

function exportarPedidosCsv() {
    const pedidosFiltrados =
        obtenerPedidosFiltrados();

    if (pedidosFiltrados.length === 0) {
        alert("No hay pedidos para exportar con los filtros actuales.");
        return;
    }

    const filas =
        pedidosFiltrados.map(function (pedido) {
            return [
                pedido.numero || pedido.id,
                pedido.fecha || "",
                pedido.cliente ? pedido.cliente.codigo : "",
                pedido.cliente ? pedido.cliente.nombre : "Sin cliente",
                pedido.vendedor || "",
                pedido.zona || "",
                pedido.estado || "",
                pedido.estadoCobro || "",
                obtenerTextoFormaPago(pedido.formaPago || "CUENTA_CORRIENTE"),
                formatearMoneda(pedido.total || 0),
                typeof pedido.importePagado === "number" ? formatearMoneda(pedido.importePagado) : "",
                typeof pedido.saldoPendiente === "number" ? formatearMoneda(pedido.saldoPendiente) : "",
                Array.isArray(pedido.items)
                    ? pedido.items.reduce(function (total, item) {
                        return total + (Number(item.cantidad) || 0);
                    }, 0)
                    : 0,
                Array.isArray(pedido.items)
                    ? pedido.items.map(function (item) {
                        return (item.producto ? item.producto.nombre : "Producto") +
                            " x " + (Number(item.cantidad) || 0);
                    }).join(" | ")
                    : ""
            ];
        });

    descargarCsv(
        "pedidos.csv",
        [
            "Pedido",
            "Fecha",
            "Codigo cliente",
            "Cliente",
            "Vendedor",
            "Zona",
            "Estado",
            "Estado cobro",
            "Forma de pago",
            "Total",
            "Pagado",
            "Saldo",
            "Unidades",
            "Detalle productos"
        ],
        filas
    );
}

function atenderPedido(id) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para atender pedidos.");
        return;
    }

    const claveOperacion = "atender-" + id;
    if (pedidosOperacionEnCurso.has(claveOperacion)) {
        return;
    }
    pedidosOperacionEnCurso.add(claveOperacion);

    try {
    const pedido =
        pedidos.find(function (p) {

            return p.id === id;

        });

    if (!pedido) {
        return;
    }

    if (pedido.estado !== "PENDIENTE") {

        alert("Solo se pueden atender pedidos pendientes.");

        return;

    }

    if (!pedido.cliente) {
        alert("Este pedido no tiene cliente asignado. Reabrilo y elegi un cliente antes de atender.");
        return;
    }

    if (
        !Array.isArray(pedido.items) ||
        pedido.items.length === 0 ||
        pedido.items.some(function (item) {
            return !item ||
                !item.producto ||
                !validarCantidadPedidoProducto(item.producto, item.cantidad).valido ||
                Number(item.cantidad) <= 0;
        })
    ) {
        alert("Este pedido tiene productos incompletos. Reabrilo y revisa el detalle antes de atender.");
        return;
    }

    const productosSinStock =
        pedido.items.map(function (item) {

            const producto =
                productos.find(function (productoGuardado) {

                    return productoGuardado.codigo === item.producto.codigo;

                });

            if (!producto || !productoActivo(producto)) {
                return {
                    nombre: item.producto.nombre,
                    pedido: item.cantidad,
                    disponible: 0
                };
            }

            const disponible =
                obtenerStockVendible(producto, pedidoEditando ? pedidoEditando.id : null);

            if (disponible >= item.cantidad) {
                return null;
            }

            return {
                nombre: producto.nombre,
                pedido: item.cantidad,
                disponible: disponible
            };

        }).filter(function (faltante) {
            return faltante !== null;
        });

    if (productosSinStock.length > 0) {

        alert(
            "No hay stock suficiente:\n\n" +
            productosSinStock.map(function (faltante) {
                return "- " + faltante.nombre +
                    " | Pedido: " + faltante.pedido +
                    " | Disponible: " + faltante.disponible +
                    " | Faltan: " + (faltante.pedido - faltante.disponible);
            }).join("\n")
        );

        return;

    }

    pedido.items.forEach(function (item) {

        const producto =
            productos.find(function (productoGuardado) {

                return productoGuardado.codigo === item.producto.codigo;

            });

        if (!Array.isArray(producto.movimientosStock)) {
            producto.movimientosStock = [];
        }

        const stockAnterior =
            obtenerStockTotalProducto(producto);
        const stockFinal =
            Math.max(0, stockAnterior - item.cantidad);

        producto.movimientosStock.push({
            fecha: new Date().toLocaleDateString("es-AR"),
            tipo: "Salida por pedido",
            pedido: pedido.numero || pedido.id,
            cantidad: -item.cantidad,
            stockFinal: stockFinal
        });

        reconstruirStockProductoDesdeTotal(producto, stockFinal);
        actualizarEstadoAutomaticoPorStock(producto, true);
        avisarStockMinimoSiCorresponde(producto);

    });

    pedido.estado = "ATENDIDO";

    guardarPedidos();
    guardarProductos();
    guardarProductosPedidoOperacionSupabase(pedido);
    guardarPedidoOperacionSupabase(pedido);

    registrarAuditoria(
        "Pedidos",
        "Atendio pedido",
        "#" + (pedido.numero || pedido.id) + " | " + pedido.cliente.nombre
    );

    renderizarPedidos();
    renderizarProductos();
    renderizarMovimientosGenerales();
    actualizarStockTotal();
    actualizarDashboard();
    verDetallePedido(pedido.id);
    } finally {
        pedidosOperacionEnCurso.delete(claveOperacion);
    }

}

function quitarProductoDelPedidoActual(codigoProducto) {

    pedidoActual.items =
        pedidoActual.items.filter(function (item) {

            return item.producto.codigo !== codigoProducto;

        });

    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();

}

function sumarUnidadPedidoActual(codigoProducto) {

    const item =
        pedidoActual.items.find(function (itemActual) {

            return itemActual.producto.codigo === codigoProducto;

        });

    if (!item) {
        return;
    }

    agregarItemPedido(
        item.producto,
        obtenerIncrementoPedidoProducto(item.producto)
    );
    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();

}

function restarUnidadPedidoActual(codigoProducto) {

    const item =
        pedidoActual.items.find(function (itemActual) {

            return itemActual.producto.codigo === codigoProducto;

        });

    if (!item) {
        return;
    }

    item.cantidad -=
        obtenerIncrementoPedidoProducto(item.producto);

    if (item.cantidad <= 0) {
        quitarProductoDelPedidoActual(codigoProducto);
        return;
    }

    actualizarSubtotalItemPedido(item);

    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();

}

function cambiarDescuentoProductoPedido(codigoProducto, descuentoNuevo) {

    const item =
        pedidoActual.items.find(function (itemActual) {

            return itemActual.producto.codigo === codigoProducto;

        });

    if (!item) {
        return;
    }

    item.descuentoPorcentaje =
        normalizarDescuentoPedido(descuentoNuevo);

    actualizarSubtotalItemPedido(item);
    renderizarPedidoActual();

}

function entregarPedido(id) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para entregar pedidos.");
        return;
    }

    const pedido =
        pedidos.find(function (p) {

            return p.id === id;

        });

    if (!pedido) {
        return;
    }

    if (pedido.estado !== "ATENDIDO") {

        alert("Solo se pueden entregar pedidos atendidos.");

        return;

    }

    if (!pedido.cliente) {
        alert("Este pedido no tiene cliente asignado. No se puede entregar.");
        return;
    }

    pedidoEntregaPendiente = pedido;

    dom.entregaPedidoResumen.innerHTML =
        "<strong>Pedido #" + (pedido.numero || pedido.id) + "</strong>" +
        "<span>Cliente: " + pedido.cliente.nombre + "</span>" +
        "<span>Total: " + formatearDinero(pedido.total) + "</span>";

    dom.entregaPagoInput.value =
        Number(pedido.total) || 0;

    actualizarVistaEntregaPedido();

    dom.entregaPedidoModal.classList.remove("hidden");
    dom.entregaPagoInput.focus();
    dom.entregaPagoInput.select();

}

function cerrarEntregaPedidoModal() {

    pedidoEntregaPendiente = null;

    dom.entregaPedidoModal.classList.add("hidden");
    dom.entregaPedidoForm.reset();

    dom.entregaPedidoResumen.textContent =
        "Selecciona un pedido atendido para entregar.";
    dom.entregaSaldoPreview.textContent =
        "Saldo pendiente: " + formatearDinero(0);
    dom.entregaSaldoPreview.classList.remove(
        "delivery-balance-ok",
        "delivery-balance-debt",
        "delivery-balance-error"
    );

}

function actualizarVistaEntregaPedido() {

    if (!pedidoEntregaPendiente) {
        return;
    }

    const totalPedido =
        Number(pedidoEntregaPendiente.total) || 0;
    const importePagado =
        Number(dom.entregaPagoInput.value);

    dom.entregaSaldoPreview.classList.remove(
        "delivery-balance-ok",
        "delivery-balance-debt",
        "delivery-balance-error"
    );

    if (Number.isNaN(importePagado) || importePagado < 0) {
        dom.entregaSaldoPreview.textContent =
            "Ingrese un importe valido. Puede ser 0.";
        dom.entregaSaldoPreview.classList.add("delivery-balance-error");
        return;
    }

    if (importePagado > totalPedido) {
        dom.entregaSaldoPreview.textContent =
            "El pago no puede superar el total del pedido.";
        dom.entregaSaldoPreview.classList.add("delivery-balance-error");
        return;
    }

    const saldoPendiente =
        totalPedido - importePagado;

    dom.entregaSaldoPreview.textContent =
        saldoPendiente > 0
            ? "Va a cuenta corriente: " + formatearDinero(saldoPendiente)
            : "Queda cobrado completo.";

    dom.entregaSaldoPreview.classList.add(
        saldoPendiente > 0 ? "delivery-balance-debt" : "delivery-balance-ok"
    );

}

function confirmarEntregaPedido(event) {

    if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
    }

    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para entregar pedidos.");
        return;
    }

    if (!pedidoEntregaPendiente) {
        return;
    }

    const pedido =
        pedidoEntregaPendiente;

    if (pedido.estado !== "ATENDIDO") {
        alert("Este pedido ya no esta atendido. Actualiza el listado y revisa el estado.");
        cerrarEntregaPedidoModal();
        return;
    }

    const claveOperacion =
        "entregar:" + pedido.id;

    if (pedidosOperacionEnCurso.has(claveOperacion)) {
        alert("La entrega ya se esta procesando. Espera un segundo.");
        return;
    }

    pedidosOperacionEnCurso.add(claveOperacion);

    try {
    const totalPedido =
        Number(pedido.total) || 0;
    const importePagado =
        Number(dom.entregaPagoInput.value);

    if (Number.isNaN(importePagado) || importePagado < 0) {
        alert("Ingrese un importe valido. Puede ser 0 si no pago.");
        return;
    }

    if (importePagado > totalPedido) {
        alert("El importe pagado no puede superar el total del pedido.");
        return;
    }

    const saldoPendiente =
        totalPedido - importePagado;

    const cliente =
        clientes.find(function (clienteGuardado) {
            if (!pedido.cliente) {
                return false;
            }

            return clienteGuardado.codigo === pedido.cliente.codigo;
        });

    if (!cliente) {
        alert("No se encontro el cliente del pedido.");
        return;
    }

    pedido.fechaEntrega =
        new Date().toLocaleDateString("es-AR");
    pedido.importePagado =
        importePagado;
    pedido.saldoPendiente =
        saldoPendiente;
    pedido.estadoCobro =
        saldoPendiente > 0 ? "CUENTA_CORRIENTE" : "COBRADO";
    pedido.estado =
        "ENTREGADO";

    cliente.saldo =
        Number(cliente.saldo) || 0;

    if (!cliente.historial) {
        cliente.historial = [];
    }

    if (importePagado > 0) {
        const movimientoPagoEntrega = {
            fecha: pedido.fechaEntrega,
            tipo: "Pago al entregar pedido #" + (pedido.numero || pedido.id),
            importe: -importePagado
        };

        cliente.historial.push(movimientoPagoEntrega);
        guardarMovimientoCuentaOperacionSupabase(cliente, movimientoPagoEntrega);
    }

    if (saldoPendiente > 0) {
        cliente.saldo += saldoPendiente;
        const movimientoCuenta = {
            fecha: pedido.fechaEntrega,
            tipo: "Pedido entregado a cuenta #" + (pedido.numero || pedido.id),
            importe: saldoPendiente
        };

        cliente.historial.push(movimientoCuenta);
        guardarMovimientoCuentaOperacionSupabase(cliente, movimientoCuenta);
    }

    guardarClientes();
    guardarPedidos();
    guardarClienteOperacionSupabase(cliente);
    guardarPedidoOperacionSupabase(pedido);

    registrarAuditoria(
        saldoPendiente > 0 ? "Cuenta corriente" : "Pedidos",
        "Entrego pedido",
        "#" + (pedido.numero || pedido.id) +
        " | " + pedido.cliente.nombre +
        " | Pago " + formatearDinero(importePagado) +
        " | Saldo " + formatearDinero(saldoPendiente)
    );

    cerrarEntregaPedidoModal();
    renderizarClientes();
    renderizarClientesConDeuda();
    renderizarPedidos();
    actualizarDashboard();
    verDetallePedido(pedido.id);
    } finally {
        pedidosOperacionEnCurso.delete(claveOperacion);
    }

}

function cobrarPedido(id) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para cobrar pedidos.");
        return;
    }

    const pedido =
        pedidos.find(function (pedidoGuardado) {
            return pedidoGuardado.id === id;
        });

    if (!pedido) {
        return;
    }

    if (pedido.estado !== "ENTREGADO") {
        alert("Solo se pueden cobrar pedidos entregados.");
        return;
    }

    if (
        pedido.estadoCobro === "CUENTA_CORRIENTE" &&
        Number(pedido.saldoPendiente) > 0
    ) {
        alert("Este pedido ya esta en cuenta corriente. Registra el pago desde Cuenta cliente.");
        return;
    }

    const claveOperacion =
        "cobrar:" + pedido.id;

    if (pedidosOperacionEnCurso.has(claveOperacion)) {
        alert("Este cobro ya se esta procesando.");
        return;
    }

    pedidosOperacionEnCurso.add(claveOperacion);

    try {
        const confirmar =
            confirm("Marcar este pedido como cobrado?");

        if (!confirmar) {
            return;
        }

        pedido.estadoCobro = "COBRADO";
        pedido.importePagado = Number(pedido.total) || 0;
        pedido.saldoPendiente = 0;

        guardarPedidos();
        guardarPedidoOperacionSupabase(pedido);

        registrarAuditoria(
            "Pedidos",
            "Cobro pedido",
            "#" + (pedido.numero || pedido.id) + " | " +
            (pedido.cliente ? pedido.cliente.nombre : "Sin cliente") +
            " | " + formatearDinero(pedido.total)
        );

        renderizarPedidos();
        actualizarDashboard();
    } finally {
        pedidosOperacionEnCurso.delete(claveOperacion);
    }
}

function pasarACuentaCorriente(id) {
    if (!tienePermiso("cuentaCorriente")) {
        alert("Tu rol no tiene permiso para pasar pedidos a cuenta corriente.");
        return;
    }

    const pedido =
        pedidos.find(function (pedidoGuardado) {
            return pedidoGuardado.id === id;
        });

    if (!pedido) {
        return;
    }

    if (pedido.estado !== "ENTREGADO") {
        alert("Solo se puede pasar a cuenta corriente un pedido entregado.");
        return;
    }

    if (pedido.estadoCobro === "CUENTA_CORRIENTE") {
        alert("Este pedido ya esta en cuenta corriente.");
        return;
    }

    if (!pedido.cliente) {
        alert("Este pedido no tiene cliente asignado. No se puede pasar a cuenta corriente.");
        return;
    }

    const claveOperacion =
        "cuentaCorriente:" + pedido.id;

    if (pedidosOperacionEnCurso.has(claveOperacion)) {
        alert("Este pase a cuenta corriente ya se esta procesando.");
        return;
    }

    pedidosOperacionEnCurso.add(claveOperacion);

    try {
        const confirmar =
            confirm("Pasar este pedido a cuenta corriente?");

        if (!confirmar) {
            return;
        }

        const cliente =
            clientes.find(function (clienteGuardado) {
                return clienteGuardado.codigo === pedido.cliente.codigo;
            });

        if (!cliente) {
            return;
        }

        const importePendiente =
            typeof pedido.saldoPendiente === "number"
                ? pedido.saldoPendiente
                : pedido.total;

        if (importePendiente <= 0) {
            alert("Este pedido no tiene saldo pendiente para pasar a cuenta.");
            return;
        }

        cliente.saldo += importePendiente;

        if (!cliente.historial) {
            cliente.historial = [];
        }

        const movimientoCuenta = {
            fecha: new Date().toLocaleDateString("es-AR"),
            tipo: "Pedido CC",
            importe: importePendiente
        };

        cliente.historial.push(movimientoCuenta);

        pedido.estadoCobro =
            "CUENTA_CORRIENTE";
        pedido.saldoPendiente =
            importePendiente;

        if (typeof pedido.importePagado !== "number") {
            pedido.importePagado = 0;
        }

        guardarClientes();
        guardarPedidos();
        guardarClienteOperacionSupabase(cliente);
        guardarMovimientoCuentaOperacionSupabase(cliente, movimientoCuenta);
        guardarPedidoOperacionSupabase(pedido);

        registrarAuditoria(
            "Cuenta corriente",
            "Paso pedido a cuenta",
            "#" + (pedido.numero || pedido.id) + " | " + cliente.nombre + " | " + formatearDinero(importePendiente)
        );

        renderizarClientes();
        renderizarClientesConDeuda();
        renderizarPedidos();
        actualizarDashboard();
    } finally {
        pedidosOperacionEnCurso.delete(claveOperacion);
    }
}

function cancelarPedido(id) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para cancelar pedidos.");
        return;
    }

    const pedido =
        pedidos.find(function (pedidoGuardado) {
            return pedidoGuardado.id === id;
        });

    if (!pedido) {
        return;
    }

    if (pedido.estado !== "PENDIENTE") {
        alert("Solo se pueden cancelar pedidos pendientes");
        return;
    }

    const claveOperacion =
        "cancelar:" + pedido.id;

    if (pedidosOperacionEnCurso.has(claveOperacion)) {
        alert("Esta cancelacion ya se esta procesando.");
        return;
    }

    pedidosOperacionEnCurso.add(claveOperacion);

    try {
        pedido.estado = "CANCELADO";

        guardarPedidos();
        guardarPedidoOperacionSupabase(pedido);

        registrarAuditoria(
            "Pedidos",
            "Cancelo pedido",
            "#" + (pedido.numero || pedido.id) + " | " +
            (pedido.cliente ? pedido.cliente.nombre : "Sin cliente")
        );

        renderizarPedidos();
        actualizarDashboard();
    } finally {
        pedidosOperacionEnCurso.delete(claveOperacion);
    }
}

function verDetallePedido(id) {

    const pedido =
        pedidos.find(function (p) {

            return p.id === id;

        });

    if (!pedido) {
        return;
    }

    const filasProductos =
        pedido.items.map(function (item) {
            const descuentoTexto =
                item.descuentoPorcentaje > 0
                    ? item.descuentoPorcentaje + "%"
                    : "-";

            return `
      <tr>
        <td>${item.producto.codigo}</td>
        <td>${item.producto.nombre}</td>
        <td>${formatearCantidadPedido(item.producto, item.cantidad)}</td>
        <td>${descuentoTexto}</td>
        <td>${formatearDinero(obtenerPrecioUnitarioItemPedido(item))}</td>
        <td>${formatearDinero(item.subtotal)}</td>
      </tr>
    `;
        }).join("");

    const observaciones =
        pedido.observaciones && pedido.observaciones.length > 0
            ? pedido.observaciones.join(" | ")
            : "Sin observaciones";
    const notasCredito =
        Array.isArray(pedido.notaCredito) ? pedido.notaCredito : [];
    const filasNotasCredito =
        notasCredito.flatMap(function (nota) {
            return (nota.items || []).map(function (item) {
                return `
                  <tr>
                    <td>${nota.fecha || "-"}</td>
                    <td>${nota.motivo || "Nota de credito"}</td>
                    <td>${item.producto ? item.producto.codigo + " - " + item.producto.nombre : "Producto"}</td>
                    <td>${item.cantidad}</td>
                    <td>${formatearDinero(item.subtotal || 0)}</td>
                  </tr>
                `;
            });
        }).join("");

    const cantidadTotalUnidades =
        pedido.items.reduce(function (total, item) {
            return total + item.cantidad;
        }, 0);
    const clienteDetalle =
        pedido.cliente || {
            codigo: "-",
            nombre: "Sin cliente",
            direccion: "-"
        };

    dom.detallePedidoTitulo.textContent =
        "Pedido #" + (pedido.numero || pedido.id);

    dom.detallePedidoContenido.innerHTML = `
    <div class="pedido-detail-header">
      <div>
        <span class="status ${pedido.estado.toLowerCase()}">${pedido.estado}</span>
        <h3>${clienteDetalle.codigo} - ${clienteDetalle.nombre}</h3>
        <p>${clienteDetalle.direccion || "-"}</p>
      </div>
      <div class="pedido-detail-total">
        <span>Total</span>
        <strong>${formatearDinero(pedido.total)}</strong>
      </div>
    </div>

    <div class="pedido-detail-grid">
      <div>
        <span>Fecha</span>
        <strong>${pedido.fecha}</strong>
      </div>
      <div>
        <span>Forma de pago</span>
        <strong>${obtenerTextoFormaPago(pedido.formaPago || "CUENTA_CORRIENTE")}</strong>
      </div>
      ${typeof pedido.importePagado === "number"
            ? `
        <div>
          <span>Pago al entregar</span>
          <strong>${formatearDinero(pedido.importePagado)}</strong>
        </div>
        <div>
          <span>Saldo pendiente</span>
          <strong>${formatearDinero(pedido.saldoPendiente || 0)}</strong>
        </div>
        <div>
          <span>Estado de cobro</span>
          <strong>${pedido.estadoCobro === "CUENTA_CORRIENTE" ? "Cuenta corriente" : "Cobrado"}</strong>
        </div>
      `
            : ""
        }
      <div>
        <span>Productos</span>
        <strong>${pedido.items.length} tipos | ${cantidadTotalUnidades.toLocaleString("es-AR")} cantidad total</strong>
      </div>
    </div>

    <div class="table-wrapper pedido-detail-table">
      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Desc.</th>
            <th>P.U</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${filasProductos || `<tr><td colspan="6" class="empty-table">Sin productos cargados</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="pedido-detail-notes">
      <span>Observaciones</span>
      <p>${observaciones}</p>
    </div>

    ${notasCredito.length > 0
            ? `
      <div class="table-wrapper pedido-detail-table">
        <h4>Notas de credito aplicadas</h4>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Motivo</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Credito</th>
            </tr>
          </thead>
          <tbody>
            ${filasNotasCredito || `<tr><td colspan="5" class="empty-table">Sin productos acreditados</td></tr>`}
          </tbody>
        </table>
      </div>
    `
            : ""
        }

    <div class="pedido-detail-actions">
      ${pedido.estado === "BORRADOR" || pedido.estado === "PENDIENTE"
            ? `<button class="primary-button" type="button" onclick="editarPedidoDesdeDetalle(${pedido.id})">
                Editar pedido
              </button>`
            : ""
        }
      ${pedido.estado === "ATENDIDO"
            ? `<button class="primary-button" type="button" onclick="reabrirPedidoAtendidoDesdeDetalle(${pedido.id})">
                Reabrir para editar
              </button>`
            : ""
        }
      <button class="secondary-button" type="button" onclick="imprimirPedidoGuardado(${pedido.id})">
        Imprimir comprobante
      </button>
    </div>
  `;

    dom.detallePedidoModal.classList.remove("hidden");

}

function cerrarDetallePedidoModal() {
    dom.detallePedidoModal.classList.add("hidden");
}

function editarPedidoDesdeDetalle(id) {
    cerrarDetallePedidoModal();
    editarPedido(id);
}

function reabrirPedidoAtendidoDesdeDetalle(id) {
    cerrarDetallePedidoModal();
    reabrirPedidoAtendido(id);
}

function reabrirPedidoAtendido(id) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para reabrir pedidos.");
        return;
    }

    const pedido = pedidos.find(function (p) {
        return p.id === id;
    });

    if (!pedido || pedido.estado !== "ATENDIDO") {
        return;
    }

    pedido.items.forEach(function (item) {
        const producto =
            productos.find(function (productoGuardado) {
                return productoGuardado.codigo === item.producto.codigo;
            });

        if (!producto) {
            return;
        }

        if (!Array.isArray(producto.movimientosStock)) {
            producto.movimientosStock = [];
        }

        const stockFinal =
            obtenerStockTotalProducto(producto) + item.cantidad;
        reconstruirStockProductoDesdeTotal(producto, stockFinal);
        reactivarProductoSiCorrespondePorStock(producto);

        producto.movimientosStock.push({
            fecha: new Date().toLocaleDateString("es-AR"),
            tipo: "Reapertura de pedido",
            pedido: pedido.numero || pedido.id,
            cantidad: item.cantidad,
            stockFinal: obtenerStockTotalProducto(producto)
        });
    });

    pedido.estado = "PENDIENTE";

    guardarPedidos();
    guardarProductos();
    guardarProductosPedidoOperacionSupabase(pedido);
    guardarPedidoOperacionSupabase(pedido);

    registrarAuditoria(
        "Pedidos",
        "Reabrio pedido atendido",
        "#" + (pedido.numero || pedido.id) + " | " + pedido.cliente.nombre
    );

    renderizarPedidos();
    renderizarProductos();
    renderizarMovimientosGenerales();
    actualizarStockTotal();
    actualizarDashboard();
    editarPedido(id);
}

function editarPedido(id) {
    if (!tienePermiso("ventas")) {
        alert("Tu rol no tiene permiso para editar pedidos.");
        return;
    }

    const pedido = pedidos.find(function (p) {
        return p.id === id;
    });

    if (!pedido) {
        return;
    }

    if (pedido.estado === "ENTREGADO") {
        alert("Los pedidos entregados no se pueden editar. Solo se pueden ver o imprimir.");
        return;
    }

    if (pedido.estado === "ATENDIDO") {
        reabrirPedidoAtendido(id);
        return;
    }

    if (!pedido.cliente) {
        alert("Este pedido no tiene cliente asignado. Revisalo desde el detalle o cargalo nuevamente.");
        return;
    }

    pedidoEditando = pedido;

    pedidoActual = {
        cliente: pedido.cliente,
        formaPago: pedido.formaPago || "CUENTA_CORRIENTE",
        observaciones: pedido.observaciones ? [...pedido.observaciones] : [],
        items: pedido.items.map(function (item) {
            return {
                producto: item.producto,
                cantidad: item.cantidad,
                listaPrecios: item.listaPrecios || "Lista 1",
                precioUnitario: typeof item.precioUnitario === "number"
                    ? item.precioUnitario
                    : item.producto.precio,
                descuentoPorcentaje: item.descuentoPorcentaje || 0,
                subtotal: item.subtotal
            };
        })
    };

    clienteSeleccionado = pedido.cliente;

    dom.clienteSearchInput.value =
        pedido.cliente.codigo +
        " - " +
        pedido.cliente.nombre;

    dom.formaPagoInput.value =
        pedidoActual.formaPago;

    mostrarPagina("ventas");
    dom.ventasPage.classList.add("hidden");
    dom.pedidoFormPanel.classList.remove("hidden");

    renderizarPedidoActual();

}
function eliminarPedido(id){
  if (!tienePermiso("ventas")) {
    alert("Tu rol no tiene permiso para eliminar pedidos.");
    return;
  }

  const indice =
    pedidos.findIndex(function(p){

      return p.id === id;

    });

  if(indice === -1){
    return;
  }

  const pedidoEliminado =
    pedidos[indice];

  if (["ATENDIDO", "ENTREGADO"].includes(pedidoEliminado.estado)) {
    alert("No se puede eliminar un pedido atendido o entregado. Reabrilo o anulalo con el flujo correspondiente.");
    return;
  }

  const confirmar =
    confirm("Eliminar pedido #" + (pedidoEliminado.numero || pedidoEliminado.id) + "?");

  if(!confirmar){
    return;
  }

  pedidos.splice(indice,1);

  guardarPedidos();

  registrarAuditoria(
    "Pedidos",
    "Elimino pedido",
    "#" + (pedidoEliminado.numero || pedidoEliminado.id) + " | " + pedidoEliminado.cliente.nombre
  );

  renderizarPedidos();
  actualizarDashboard();

}
