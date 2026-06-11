let productoEditando = null;

function obtenerSiguienteCodigoProducto() {
    if (productos.length === 0) {
        return 1;
    }

    const codigos =
        productos.map(function (producto) {
            return Number(producto.codigo) || 0;
        });

    return Math.max.apply(null, codigos) + 1;
}

function completarSiguienteCodigoProducto() {
    if (!dom.productCodeInput || dom.productCodeInput.value !== "") {
        return;
    }

    dom.productCodeInput.value = obtenerSiguienteCodigoProducto();
}
let filtroEstadoProductos = "activos";

function cambiarFiltroEstadoProductos(filtroNuevo) {
    filtroEstadoProductos = filtroNuevo;

    document.querySelectorAll("[data-product-status-filter]").forEach(function (boton) {
        boton.classList.toggle(
            "active",
            boton.dataset.productStatusFilter === filtroNuevo
        );
    });

    renderizarProductos();
}

function validarFormularioProducto(codigo, nombre, precio, stock) {
    if (!Number.isInteger(codigo) || codigo <= 0) {
        alert("El codigo del producto debe ser un numero entero mayor a 0.");
        return false;
    }

    if (nombre === "") {
        alert("El nombre del producto es obligatorio.");
        return false;
    }

    if (Number.isNaN(precio) || precio < 0) {
        alert("El precio del producto no puede ser negativo.");
        return false;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        alert("El stock debe ser un numero entero mayor o igual a 0.");
        return false;
    }

    return true;
}

function datosProductoValidos(codigo, nombre, precio, stock) {
    return Number.isInteger(codigo) &&
        codigo > 0 &&
        nombre !== "" &&
        !Number.isNaN(precio) &&
        precio >= 0 &&
        Number.isInteger(stock) &&
        stock >= 0;
}

function limpiarFormularioProducto() {
    productoEditando = null;
    dom.productForm.reset();
    dom.productCodeInput.disabled = false;
    dom.productSubmitButton.textContent = "Agregar producto";
    completarSiguienteCodigoProducto();
}

function agregarProducto(event) {
    event.preventDefault();

    const codigo = Number(dom.productCodeInput.value);
    const nombre = dom.productNameInput.value.trim();
    const precio = Number(dom.productPriceInput.value);
    const stock = Number(dom.productStockInput.value);
    const proveedor = asegurarProveedorPorNombre(dom.productProviderInput.value);

    const formularioValido =
        validarFormularioProducto(codigo, nombre, precio, stock);

    if (!formularioValido) {
        return;
    }

    if (productoEditando) {
        const codigoEditado =
            productoEditando.codigo;

        productoEditando.nombre = nombre;
        productoEditando.precio = precio;
        productoEditando.stock = stock;
        productoEditando.proveedor = proveedor;

        limpiarFormularioProducto();
        renderizarProductos();
        renderizarProveedores();
        actualizarDashboard();
        actualizarStockTotal();
        guardarProductos();

        registrarAuditoria(
            "Productos",
            "Edito producto",
            codigoEditado + " - " + nombre
        );

        return;
    }

    const codigoRepetido =
        productos.some(function (producto) {
            return producto.codigo === codigo;
        });

    if (codigoRepetido) {
        alert("Ya existe un producto con ese codigo.");
        return;
    }

    productos.push({
        codigo: codigo,
        nombre: nombre,
        precio: precio,
        stock: stock,
        proveedor: proveedor,
        activo: true,
        movimientosStock: []
    });

    limpiarFormularioProducto();
    dom.productCodeInput.focus();
    renderizarProductos();
    renderizarProveedores();
    actualizarDashboard();
    actualizarStockTotal();
    guardarProductos();

    registrarAuditoria(
        "Productos",
        "Creo producto",
        codigo + " - " + nombre + " | Stock " + stock
    );
}

function importarProductosDesdeTexto() {
    const texto =
        dom.productosImportacionTexto.value.trim();

    if (texto === "") {
        alert("Pegue productos para importar.");
        return;
    }

    const lineas =
        texto.split(/\r?\n/);

    let creados = 0;
    let actualizados = 0;
    let errores = 0;

    lineas.forEach(function (linea) {
        const separador =
            linea.includes(";") ? ";" : "\t";

        const columnas =
            linea.split(separador).map(function (valor) {
                return valor.trim();
            });

        if (columnas.length < 4) {
            errores += 1;
            return;
        }

        const codigo = Number(columnas[0]);
        const nombre = columnas[1];
        const precio = Number(columnas[2]);
        const stock = Number(columnas[3]);
        const proveedor = asegurarProveedorPorNombre(columnas[4] || "Sin proveedor");

        if (!datosProductoValidos(codigo, nombre, precio, stock)) {
            errores += 1;
            return;
        }

        const productoExistente =
            productos.find(function (producto) {
                return producto.codigo === codigo;
            });

        if (productoExistente) {
            productoExistente.nombre = nombre;
            productoExistente.precio = precio;
            productoExistente.stock = stock;
            productoExistente.proveedor = proveedor;

            if (typeof productoExistente.activo !== "boolean") {
                productoExistente.activo = true;
            }

            if (!Array.isArray(productoExistente.movimientosStock)) {
                productoExistente.movimientosStock = [];
            }

            actualizados += 1;
            return;
        }

        productos.push({
            codigo: codigo,
            nombre: nombre,
            precio: precio,
            stock: stock,
            proveedor: proveedor,
            activo: true,
            movimientosStock: []
        });

        creados += 1;
    });

    dom.productosImportacionTexto.value = "";
    completarSiguienteCodigoProducto();
    renderizarProductos();
    renderizarProveedores();
    actualizarDashboard();
    actualizarStockTotal();
    renderizarCatalogoProductosPedido();
    guardarProductos();

    registrarAuditoria(
        "Productos",
        "Importo productos",
        "Creados: " + creados + " | Actualizados: " + actualizados + " | Errores: " + errores
    );

    alert(
        "Importacion terminada.\n" +
        "Creados: " + creados + "\n" +
        "Actualizados: " + actualizados + "\n" +
        "Errores: " + errores
    );
}

function editarProducto(codigo) {
    const producto = productos.find(function (productoGuardado) {
        return productoGuardado.codigo === codigo;
    });

    if (!producto) {
        alert("No se encontro el producto que queres editar.");
        limpiarFormularioProducto();
        return;
    }

    productoEditando = producto;

    dom.productCodeInput.value = producto.codigo;
    dom.productNameInput.value = producto.nombre;
    dom.productPriceInput.value = producto.precio;
    dom.productStockInput.value = producto.stock;
    dom.productProviderInput.value = producto.proveedor || "Sin proveedor";
    dom.productCodeInput.disabled = true;
    dom.productSubmitButton.textContent = "Guardar cambios";
    dom.productNameInput.focus();
}

function eliminarProducto(codigo) {
    const indice = productos.findIndex(function (producto) {
        return producto.codigo === codigo;
    });

    if (indice === -1) {
        alert("No se encontro el producto que queres eliminar.");
        return;
    }

    const producto =
        productos[indice];

    const confirmar =
        confirm("Eliminar producto " + producto.codigo + " - " + producto.nombre + "?");

    if (!confirmar) {
        return;
    }

    productos.splice(indice, 1);

    if (
        productoSeleccionado &&
        productoSeleccionado.codigo === producto.codigo
    ) {
        productoSeleccionado = null;
        dom.productoSearchInput.value = "";
        actualizarVistaBusqueda();
    }

    limpiarFormularioProducto();
    renderizarProductos();
    renderizarProveedores();
    actualizarDashboard();
    actualizarStockTotal();
    guardarProductos();

    registrarAuditoria(
        "Productos",
        "Elimino producto",
        producto.codigo + " - " + producto.nombre
    );
}

function renderizarProductos() {
    dom.productsTable.innerHTML = "";

    const productosActivosCantidad =
        productos.filter(function (producto) {
            return productoActivo(producto);
        }).length;

    const productosBajoStockCantidad =
        productos.filter(function (producto) {
            const estadoStock =
                obtenerEstadoStockProducto(producto);

            return productoActivo(producto) && estadoStock.clase === "stock-low";
        }).length;

    const productosSinStockCantidad =
        productos.filter(function (producto) {
            return productoActivo(producto) && producto.stock <= 0;
        }).length;

    const valorStockTotal =
        productos.reduce(function (total, producto) {
            if (!productoActivo(producto)) {
                return total;
            }

            return total + ((Number(producto.precio) || 0) * (Number(producto.stock) || 0));
        }, 0);

    if (dom.productosActivosResumen) {
        dom.productosActivosResumen.textContent = productosActivosCantidad;
        dom.productosInactivosResumen.textContent = productos.length - productosActivosCantidad;
        dom.productosBajoStockResumen.textContent = productosBajoStockCantidad;
        dom.productosSinStockResumen.textContent = productosSinStockCantidad;
        dom.productosValorStockResumen.textContent = formatearDinero(valorStockTotal);
    }

    const textoBusqueda = dom.buscarProductoTabla.value.trim().toLowerCase();

    const productosFiltrados =
        productos.filter(function (producto) {
            const coincideEstado =
                filtroEstadoProductos === "todos" ||
                (filtroEstadoProductos === "activos" && productoActivo(producto)) ||
                (filtroEstadoProductos === "inactivos" && !productoActivo(producto));

            const coincideBusqueda =
                textoBusqueda === "" ||
                String(producto.codigo).includes(textoBusqueda) ||
                normalizarTexto(producto.nombre).includes(textoBusqueda) ||
                normalizarTexto(producto.proveedor || "").includes(textoBusqueda);

            return coincideEstado && coincideBusqueda;
        }).sort(function (primero, segundo) {
            return primero.codigo - segundo.codigo;
        });

    if (productosFiltrados.length === 0) {
        if (dom.productosResultadoContador) {
            dom.productosResultadoContador.textContent =
                "Productos | 0 en total";
        }

        dom.productsTable.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">
          No hay productos para mostrar.
        </td>
      </tr>
    `;
        renderizarMovimientosProductos();
        return;
    }

    if (dom.productosResultadoContador) {
        dom.productosResultadoContador.textContent =
            productosFiltrados.length === 1
                ? "Productos | 1 en total"
                : "Productos | " + productosFiltrados.length + " en total";
    }

    productosFiltrados.forEach(function (producto) {
        const row = document.createElement("tr");
        const estadoStock = obtenerEstadoStockProducto(producto);
        const accionEstado =
            productoActivo(producto) ? "Desactivar" : "Activar";

        row.innerHTML = `
      <td>${producto.codigo}</td>
      <td>${producto.nombre}</td>
      <td>${formatearDinero(producto.precio)}</td>
      <td>${producto.proveedor || "Sin proveedor"}</td>
      <td>${producto.stock}</td>
      <td>${formatearDinero((Number(producto.precio) || 0) * (Number(producto.stock) || 0))}</td>
      <td>
        <span class="stock-pill ${estadoStock.clase}">
          ${estadoStock.texto}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary" onclick="editarProducto(${producto.codigo})">
          Editar
        </button>
        <button class="btn btn-secondary" onclick="verMovimientosStock(${producto.codigo})">
          Movimientos
        </button>
        <button class="btn btn-secondary" onclick="cambiarEstadoProducto(${producto.codigo})">
          ${accionEstado}
        </button>
        <button class="btn btn-danger" onclick="eliminarProducto(${producto.codigo})">
          Eliminar
        </button>
      </td>
    `;

        dom.productsTable.appendChild(row);
    });

    renderizarMovimientosProductos();
}

function obtenerMovimientosProductos() {
    const movimientos = [];

    productos.forEach(function (producto) {
        if (!Array.isArray(producto.movimientosStock)) {
            producto.movimientosStock = [];
        }

        producto.movimientosStock.forEach(function (movimiento, indice) {
            movimientos.push({
                fecha: movimiento.fecha || "-",
                tipo: movimiento.tipo || "Movimiento",
                pedido: movimiento.pedido || "",
                cantidad: Number(movimiento.cantidad) || 0,
                stockFinal: Number(movimiento.stockFinal) || 0,
                productoCodigo: producto.codigo,
                productoNombre: producto.nombre,
                orden: indice
            });
        });
    });

    return movimientos.reverse();
}

function renderizarMovimientosProductos() {
    if (!dom.movimientosProductosTable) {
        return;
    }

    const textoBusqueda =
        normalizarTexto(dom.buscarMovimientoProductoInput.value || "");

    const movimientos =
        obtenerMovimientosProductos().filter(function (movimiento) {
            const textoMovimiento =
                [
                    movimiento.fecha,
                    movimiento.tipo,
                    movimiento.pedido,
                    movimiento.productoCodigo,
                    movimiento.productoNombre
                ].join(" ");

            return textoBusqueda === "" ||
                normalizarTexto(textoMovimiento).includes(textoBusqueda);
        });

    const totalUnidades =
        movimientos.reduce(function (total, movimiento) {
            return total + Math.abs(movimiento.cantidad);
        }, 0);

    dom.movimientosProductosTotal.textContent = movimientos.length;
    dom.movimientosProductosUnidades.textContent = totalUnidades;
    dom.movimientosProductosUltimo.textContent =
        movimientos.length > 0 ? movimientos[0].fecha : "-";

    if (movimientos.length === 0) {
        dom.movimientosProductosTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          No hay movimientos para mostrar.
        </td>
      </tr>
    `;
        return;
    }

    dom.movimientosProductosTable.innerHTML =
        movimientos.map(function (movimiento) {
            const pedidoTexto =
                movimiento.pedido ? "#" + movimiento.pedido : "-";

            return `
      <tr>
        <td>${movimiento.fecha}</td>
        <td>${movimiento.productoCodigo}</td>
        <td>${movimiento.productoNombre}</td>
        <td>${movimiento.tipo}</td>
        <td>${pedidoTexto}</td>
        <td>${movimiento.cantidad}</td>
        <td>${movimiento.stockFinal}</td>
      </tr>
    `;
        }).join("");
}

function verMovimientosStock(codigo) {
    const producto =
        productos.find(function (productoGuardado) {
            return productoGuardado.codigo === codigo;
        });

    if (!producto) {
        alert("No se encontro el producto.");
        return;
    }

    if (!Array.isArray(producto.movimientosStock)) {
        producto.movimientosStock = [];
    }

    dom.movimientosStockTitulo.textContent =
        "Movimientos: " + producto.codigo + " - " + producto.nombre;

    const filas =
        producto.movimientosStock.map(function (movimiento) {
            return `
      <tr>
        <td>${movimiento.fecha}</td>
        <td>${movimiento.tipo}</td>
        <td>${movimiento.pedido ? "#" + movimiento.pedido : "-"}</td>
        <td>${movimiento.cantidad}</td>
        <td>${movimiento.stockFinal}</td>
      </tr>
    `;
        }).join("");

    dom.movimientosStockContenido.innerHTML = `
    <div class="estado-cliente">
      <div>
        <h3>${producto.nombre}</h3>
        <p>Stock actual: ${producto.stock}</p>
      </div>
      <div class="estado-saldo">
        ${formatearDinero((Number(producto.precio) || 0) * (Number(producto.stock) || 0))}
      </div>
    </div>

    <table class="estado-tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Movimiento</th>
          <th>Pedido</th>
          <th>Cantidad</th>
          <th>Stock final</th>
        </tr>
      </thead>
      <tbody>
        ${filas || `<tr><td colspan="5">Sin movimientos registrados</td></tr>`}
      </tbody>
    </table>
  `;

    dom.movimientosStockModal.classList.remove("hidden");
}

function cambiarEstadoProducto(codigo) {
    const producto =
        productos.find(function (productoGuardado) {
            return productoGuardado.codigo === codigo;
        });

    if (!producto) {
        alert("No se encontro el producto.");
        return;
    }

    const accion =
        productoActivo(producto) ? "desactivar" : "activar";

    const confirmar =
        confirm("Seguro que queres " + accion + " " + producto.codigo + " - " + producto.nombre + "?");

    if (!confirmar) {
        return;
    }

    producto.activo = !productoActivo(producto);

    if (!productoActivo(producto)) {
        pedidoActual.items =
            pedidoActual.items.filter(function (item) {
                return item.producto.codigo !== producto.codigo;
            });
    }

    if (
        productoSeleccionado &&
        productoSeleccionado.codigo === producto.codigo &&
        !productoActivo(producto)
    ) {
        productoSeleccionado = null;
        dom.productoSearchInput.value = "";
    }

    guardarProductos();
    renderizarProductos();
    renderizarPedidoActual();
    renderizarCatalogoProductosPedido();
    actualizarVistaBusqueda();
    actualizarDashboard();

    registrarAuditoria(
        "Productos",
        productoActivo(producto) ? "Activo producto" : "Desactivo producto",
        producto.codigo + " - " + producto.nombre
    );
}
