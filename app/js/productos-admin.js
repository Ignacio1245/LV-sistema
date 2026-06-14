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

function obtenerListasPreciosAActualizar() {
    const listaSeleccionada =
        dom.priceUpdateListaInput.value || "TODAS";

    if (listaSeleccionada === "TODAS") {
        return obtenerNombresListasPreciosActivas();
    }

    return [listaSeleccionada];
}

function contarClientesPorListaPrecio(nombreLista) {
    return clientes.filter(function (cliente) {
        return cliente.listaPrecios === nombreLista;
    }).length;
}

function renderizarOpcionesListasPreciosClientes() {
    if (!dom.clientListaPreciosInput) {
        return;
    }

    const listaActual =
        dom.clientListaPreciosInput.value || "";
    const listasActivas =
        obtenerNombresListasPreciosActivas();

    dom.clientListaPreciosInput.innerHTML =
        `<option value="">Seleccionar lista</option>` +
        listasActivas.map(function (lista) {
            return `<option value="${lista}">${lista}</option>`;
        }).join("");

    dom.clientListaPreciosInput.value =
        listasActivas.includes(listaActual) ? listaActual : "";
}

function renderizarListasPrecios() {
    if (!dom.listasPreciosTable) {
        return;
    }

    if (listasPrecios.length === 0) {
        dom.listasPreciosTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">Todavia no hay listas de precios creadas.</td>
            </tr>
        `;
        return;
    }

    dom.listasPreciosTable.innerHTML =
        listasPrecios.map(function (lista) {
            const clientesAsignados =
                contarClientesPorListaPrecio(lista.nombre);
            const textoEstado =
                listaPrecioActiva(lista) ? "Activa" : "Inactiva";
            const claseEstado =
                listaPrecioActiva(lista) ? "stock-ok" : "stock-inactive";
            const accion =
                listaPrecioActiva(lista) ? "Desactivar" : "Activar";

            return `
                <tr>
                    <td>${lista.codigo}</td>
                    <td><strong>${lista.nombre}</strong></td>
                    <td>${clientesAsignados}</td>
                    <td><span class="stock-pill ${claseEstado}">${textoEstado}</span></td>
                    <td>
                        <button class="btn btn-secondary" onclick="cambiarEstadoListaPrecio(${lista.codigo})">
                            ${accion}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    renderizarOpcionesListasPreciosClientes();
    renderizarOpcionesPanelPrecios();
}

function agregarListaPrecio(event) {
    event.preventDefault();

    const nombre =
        dom.listaPrecioNombreInput.value.trim();

    if (nombre === "") {
        alert("Ingrese un nombre para la lista de precios.");
        return;
    }

    const listaExistente =
        listasPrecios.some(function (lista) {
            return normalizarTexto(lista.nombre) === normalizarTexto(nombre);
        });

    if (listaExistente) {
        alert("Ya existe una lista de precios con ese nombre.");
        return;
    }

    const nuevaLista = {
        codigo: obtenerSiguienteCodigoListaPrecio(),
        nombre: nombre,
        activo: true
    };

    listasPrecios.push(nuevaLista);

    productos.forEach(function (producto) {
        const preciosLista =
            obtenerPreciosListaProducto(producto);

        preciosLista[nombre] = Number(producto.precio) || 0;
        producto.preciosLista = preciosLista;
    });

    guardarListasPrecios();
    guardarProductos();
    dom.listaPrecioForm.reset();
    renderizarListasPrecios();
    renderizarProductos();
    renderizarPanelPreciosProductos();

    registrarAuditoria(
        "Listas",
        "Creo lista de precios",
        nuevaLista.codigo + " - " + nuevaLista.nombre
    );
}

function cambiarEstadoListaPrecio(codigo) {
    const lista =
        listasPrecios.find(function (listaGuardada) {
            return listaGuardada.codigo === codigo;
        });

    if (!lista) {
        alert("No se encontro la lista de precios.");
        return;
    }

    if (lista.nombre === "Lista 1" && lista.activo) {
        alert("Lista 1 queda siempre activa porque es la lista base del sistema.");
        return;
    }

    if (lista.activo && contarClientesPorListaPrecio(lista.nombre) > 0) {
        alert("No se puede desactivar porque hay clientes usando esta lista.");
        return;
    }

    lista.activo = !lista.activo;
    guardarListasPrecios();
    renderizarListasPrecios();
    renderizarPanelPreciosProductos();

    registrarAuditoria(
        "Listas",
        lista.activo ? "Activo lista de precios" : "Desactivo lista de precios",
        lista.codigo + " - " + lista.nombre
    );
}

function obtenerProductosParaActualizacionPrecios() {
    const rubroSeleccionado =
        dom.priceUpdateRubroInput.value || "TODOS";
    const proveedorSeleccionado =
        dom.priceUpdateProveedorInput.value || "TODOS";

    return productos.filter(function (producto) {
        const coincideRubro =
            rubroSeleccionado === "TODOS" ||
            producto.rubro === rubroSeleccionado;

        const coincideProveedor =
            proveedorSeleccionado === "TODOS" ||
            producto.proveedor === proveedorSeleccionado ||
            producto.proveedorAlternativo === proveedorSeleccionado;

        return coincideRubro && coincideProveedor;
    });
}

function calcularPrecioConPorcentaje(precioActual, porcentaje) {
    return Math.round((precioActual + (precioActual * porcentaje / 100)) * 100) / 100;
}

function renderizarOpcionesPanelPrecios() {
    if (!dom.priceUpdateRubroInput) {
        return;
    }

    const rubroActual =
        dom.priceUpdateRubroInput.value || "TODOS";
    const proveedorActual =
        dom.priceUpdateProveedorInput.value || "TODOS";
    const listaActual =
        dom.priceUpdateListaInput.value || "TODAS";
    const listasActivas =
        obtenerNombresListasPreciosActivas();

    const rubrosDisponibles =
        [...new Set(productos.map(function (producto) {
            return producto.rubro || "Sin rubro";
        }))].sort();

    const proveedoresDisponibles =
        [...new Set(productos.flatMap(function (producto) {
            return [
                producto.proveedor || "Sin proveedor",
                producto.proveedorAlternativo || ""
            ];
        }).filter(function (proveedor) {
            return proveedor !== "";
        }))].sort();

    dom.priceUpdateRubroInput.innerHTML =
        `<option value="TODOS">Todos los rubros</option>` +
        rubrosDisponibles.map(function (rubro) {
            return `<option value="${rubro}">${rubro}</option>`;
        }).join("");

    dom.priceUpdateProveedorInput.innerHTML =
        `<option value="TODOS">Todos los proveedores</option>` +
        proveedoresDisponibles.map(function (proveedor) {
            return `<option value="${proveedor}">${proveedor}</option>`;
        }).join("");

    dom.priceUpdateListaInput.innerHTML =
        `<option value="TODAS">Todas las listas</option>` +
        listasActivas.map(function (lista) {
            return `<option value="${lista}">${lista}</option>`;
        }).join("");

    dom.priceUpdateRubroInput.value =
        rubrosDisponibles.includes(rubroActual) ? rubroActual : "TODOS";
    dom.priceUpdateProveedorInput.value =
        proveedoresDisponibles.includes(proveedorActual) ? proveedorActual : "TODOS";
    dom.priceUpdateListaInput.value =
        listaActual === "TODAS" || listasActivas.includes(listaActual)
            ? listaActual
            : "TODAS";
}

function actualizarVistaActualizacionPrecios() {
    if (!dom.priceUpdatePreview) {
        return;
    }

    const porcentaje =
        Number(dom.priceUpdatePercentInput.value);
    const productosFiltrados =
        obtenerProductosParaActualizacionPrecios();
    const listas =
        obtenerListasPreciosAActualizar();

    if (Number.isNaN(porcentaje)) {
        dom.priceUpdatePreview.textContent =
            productosFiltrados.length + " productos coinciden con los filtros. Ingresa un porcentaje.";
        return;
    }

    dom.priceUpdatePreview.innerHTML =
        "<strong>" + productosFiltrados.length + " productos</strong>" +
        "<span>" + listas.join(", ") + " | Porcentaje: " + porcentaje + "%</span>";
}

function renderizarHistorialPreciosProductos() {
    if (!dom.priceHistoryTable) {
        return;
    }

    const movimientosPrecios = [];

    productos.forEach(function (producto) {
        if (!Array.isArray(producto.historialPrecios)) {
            producto.historialPrecios = [];
        }

        producto.historialPrecios.forEach(function (movimiento) {
            movimientosPrecios.push({
                producto: producto.codigo + " - " + producto.nombre,
                fecha: movimiento.fecha,
                lista: movimiento.lista,
                anterior: movimiento.anterior,
                nuevo: movimiento.nuevo,
                motivo: movimiento.motivo || "-"
            });
        });
    });

    movimientosPrecios.reverse();

    if (movimientosPrecios.length === 0) {
        dom.priceHistoryTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Todavia no hay cambios de precios registrados.</td>
            </tr>
        `;
        return;
    }

    dom.priceHistoryTable.innerHTML =
        movimientosPrecios.slice(0, 80).map(function (movimiento) {
            return `
                <tr>
                    <td>${movimiento.fecha}</td>
                    <td>${movimiento.producto}</td>
                    <td>${movimiento.lista}</td>
                    <td>${formatearDinero(movimiento.anterior)}</td>
                    <td>${formatearDinero(movimiento.nuevo)}</td>
                    <td>${movimiento.motivo}</td>
                </tr>
            `;
        }).join("");
}

function renderizarPanelPreciosProductos() {
    renderizarOpcionesPanelPrecios();
    actualizarVistaActualizacionPrecios();
    renderizarHistorialPreciosProductos();
}

function aplicarActualizacionMasivaPrecios(event) {
    event.preventDefault();

    const porcentaje =
        Number(dom.priceUpdatePercentInput.value);

    if (Number.isNaN(porcentaje) || porcentaje === 0) {
        alert("Ingrese un porcentaje distinto de 0. Puede ser negativo para bajar precios.");
        return;
    }

    const productosFiltrados =
        obtenerProductosParaActualizacionPrecios();
    const listas =
        obtenerListasPreciosAActualizar();

    if (productosFiltrados.length === 0) {
        alert("No hay productos para actualizar con esos filtros.");
        return;
    }

    const confirmar =
        confirm(
            "Actualizar " + productosFiltrados.length + " productos?\n" +
            "Listas: " + listas.join(", ") + "\n" +
            "Porcentaje: " + porcentaje + "%"
        );

    if (!confirmar) {
        return;
    }

    const fecha =
        new Date().toLocaleDateString("es-AR");

    productosFiltrados.forEach(function (producto) {
        const preciosLista =
            obtenerPreciosListaProducto(producto);

        if (!Array.isArray(producto.historialPrecios)) {
            producto.historialPrecios = [];
        }

        listas.forEach(function (lista) {
            const precioAnterior =
                Number(preciosLista[lista]) || 0;
            const precioNuevo =
                calcularPrecioConPorcentaje(precioAnterior, porcentaje);

            preciosLista[lista] = precioNuevo;

            producto.historialPrecios.push({
                fecha: fecha,
                lista: lista,
                anterior: precioAnterior,
                nuevo: precioNuevo,
                motivo: "Actualizacion masiva " + porcentaje + "%"
            });
        });

        producto.preciosLista = preciosLista;
        producto.precio = preciosLista["Lista 1"];
    });

    guardarProductos();
    renderizarProductos();
    renderizarCatalogoProductosPedido();
    renderizarPanelPreciosProductos();
    actualizarDashboard();

    registrarAuditoria(
        "Productos",
        "Actualizo precios",
        productosFiltrados.length + " productos | " + listas.join(", ") + " | " + porcentaje + "%"
    );

    dom.priceUpdatePercentInput.value = "";
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
    const codigoReal = dom.productBarcodeInput.value.trim();
    const nombre = dom.productNameInput.value.trim();
    const precio = Number(dom.productPriceInput.value);
    const precioLista2 = Number(dom.productPriceList2Input.value) || 0;
    const precioLista3 = Number(dom.productPriceList3Input.value) || 0;
    const precioLista4 = Number(dom.productPriceList4Input.value) || 0;
    const precioCompra = Number(dom.productPurchasePriceInput.value) || 0;
    const stock = Number(dom.productStockInput.value);
    const stockMinimo = Number(dom.productMinimumStockInput.value) || 0;
    const rubro = asegurarRubroPorNombre(dom.productCategoryInput.value);
    const tipo = dom.productTypeInput.value.trim();
    const marca = dom.productBrandInput.value.trim();
    const detalle = dom.productDetailInput.value.trim();
    const pack = Number(dom.productPackInput.value) || 0;
    const unidad = dom.productUnitInput.value.trim();
    const iva = Number(dom.productIvaInput.value) || 0;
    const bonificacionVenta = Number(dom.productSaleDiscountInput.value) || 0;
    const proveedor = asegurarProveedorPorNombre(dom.productProviderInput.value);
    const proveedorAlternativo = dom.productAltProviderInput.value.trim();

    const formularioValido =
        validarFormularioProducto(codigo, nombre, precio, stock);

    if (!formularioValido) {
        return;
    }

    if (productoEditando) {
        const codigoEditado =
            productoEditando.codigo;
        const preciosAnteriores =
            obtenerPreciosListaProducto(productoEditando);
        const preciosNuevos =
            obtenerPreciosListaProducto(productoEditando);

        preciosNuevos["Lista 1"] = precio;
        preciosNuevos["Lista 2"] = precioLista2 > 0 ? precioLista2 : precio;
        preciosNuevos["Lista 3"] = precioLista3 > 0 ? precioLista3 : precio;
        preciosNuevos["Lista 4"] = precioLista4 > 0 ? precioLista4 : precio;

        if (!Array.isArray(productoEditando.historialPrecios)) {
            productoEditando.historialPrecios = [];
        }

        productoEditando.nombre = nombre;
        productoEditando.precio = precio;
        productoEditando.preciosLista = preciosNuevos;
        Object.keys(preciosNuevos).forEach(function (lista) {
            if (Number(preciosAnteriores[lista]) === Number(preciosNuevos[lista])) {
                return;
            }

            productoEditando.historialPrecios.push({
                fecha: new Date().toLocaleDateString("es-AR"),
                lista: lista,
                anterior: preciosAnteriores[lista],
                nuevo: preciosNuevos[lista],
                motivo: "Edicion manual"
            });
        });
        productoEditando.codigoReal = codigoReal;
        productoEditando.precioCompra = precioCompra;
        productoEditando.stock = stock;
        productoEditando.stockMinimo = stockMinimo;
        productoEditando.rubro = rubro;
        productoEditando.tipo = tipo;
        productoEditando.marca = marca;
        productoEditando.detalle = detalle;
        productoEditando.pack = pack;
        productoEditando.unidad = unidad;
        productoEditando.iva = iva;
        productoEditando.bonificacionVenta = bonificacionVenta;
        productoEditando.proveedor = proveedor;
        productoEditando.proveedorAlternativo = proveedorAlternativo;

        actualizarEstadoAutomaticoPorStock(productoEditando, true);

        limpiarFormularioProducto();
        renderizarProductos();
        renderizarRubros();
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

    const preciosProductoNuevo =
        crearPreciosListaBase(precio);

    preciosProductoNuevo["Lista 1"] = precio;
    preciosProductoNuevo["Lista 2"] = precioLista2 > 0 ? precioLista2 : precio;
    preciosProductoNuevo["Lista 3"] = precioLista3 > 0 ? precioLista3 : precio;
    preciosProductoNuevo["Lista 4"] = precioLista4 > 0 ? precioLista4 : precio;

    productos.push({
        codigo: codigo,
        codigoReal: codigoReal,
        nombre: nombre,
        precio: precio,
        preciosLista: preciosProductoNuevo,
        precioCompra: precioCompra,
        stock: stock,
        stockMinimo: stockMinimo,
        rubro: rubro,
        tipo: tipo,
        marca: marca,
        detalle: detalle,
        pack: pack,
        unidad: unidad,
        iva: iva,
        bonificacionVenta: bonificacionVenta,
        proveedor: proveedor,
        proveedorAlternativo: proveedorAlternativo,
        activo: true,
        movimientosStock: [],
        historialPrecios: [
            {
                fecha: new Date().toLocaleDateString("es-AR"),
                lista: "Lista 1",
                anterior: 0,
                nuevo: precio,
                motivo: "Alta de producto"
            }
        ]
    });

    actualizarEstadoAutomaticoPorStock(productos[productos.length - 1], true);

    limpiarFormularioProducto();
    dom.productCodeInput.focus();
    renderizarProductos();
    renderizarRubros();
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
        const rubro = asegurarRubroPorNombre(columnas[4] || "Sin rubro");
        const proveedor = asegurarProveedorPorNombre(columnas[5] || "Sin proveedor");

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
            productoExistente.preciosLista =
                crearPreciosListaBase(precio);
            productoExistente.stock = stock;
            productoExistente.rubro = rubro;
            productoExistente.proveedor = proveedor;
            productoExistente.codigoReal = productoExistente.codigoReal || "";
            productoExistente.stockMinimo = Number(productoExistente.stockMinimo) || 0;

            if (typeof productoExistente.activo !== "boolean") {
                productoExistente.activo = true;
            }

            if (!Array.isArray(productoExistente.movimientosStock)) {
                productoExistente.movimientosStock = [];
            }

            actualizarEstadoAutomaticoPorStock(productoExistente, false);
            actualizados += 1;
            return;
        }

        productos.push({
            codigo: codigo,
            nombre: nombre,
            precio: precio,
            preciosLista: crearPreciosListaBase(precio),
            stock: stock,
            rubro: rubro,
            proveedor: proveedor,
            activo: true,
            movimientosStock: []
        });

        actualizarEstadoAutomaticoPorStock(productos[productos.length - 1], false);
        creados += 1;
    });

    dom.productosImportacionTexto.value = "";
    completarSiguienteCodigoProducto();
    renderizarProductos();
    renderizarRubros();
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
    dom.productBarcodeInput.value = producto.codigoReal || "";
    dom.productNameInput.value = producto.nombre;
    dom.productPriceInput.value = producto.precio;
    dom.productPriceList2Input.value =
        producto.preciosLista && producto.preciosLista["Lista 2"] !== producto.precio
            ? producto.preciosLista["Lista 2"]
            : "";
    dom.productPriceList3Input.value =
        producto.preciosLista && producto.preciosLista["Lista 3"] !== producto.precio
            ? producto.preciosLista["Lista 3"]
            : "";
    dom.productPriceList4Input.value =
        producto.preciosLista && producto.preciosLista["Lista 4"] !== producto.precio
            ? producto.preciosLista["Lista 4"]
            : "";
    dom.productPurchasePriceInput.value = producto.precioCompra || "";
    dom.productStockInput.value = producto.stock;
    dom.productMinimumStockInput.value = producto.stockMinimo || "";
    dom.productCategoryInput.value = producto.rubro || "Sin rubro";
    dom.productTypeInput.value = producto.tipo || "";
    dom.productBrandInput.value = producto.marca || "";
    dom.productDetailInput.value = producto.detalle || "";
    dom.productPackInput.value = producto.pack || "";
    dom.productUnitInput.value = producto.unidad || "";
    dom.productIvaInput.value = producto.iva || "";
    dom.productSaleDiscountInput.value = producto.bonificacionVenta || "";
    dom.productProviderInput.value = producto.proveedor || "Sin proveedor";
    dom.productAltProviderInput.value = producto.proveedorAlternativo || "";
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
    renderizarRubros();
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
            return Number(producto.stock) <= 0;
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
                normalizarTexto(producto.codigoReal || "").includes(textoBusqueda) ||
                normalizarTexto(producto.nombre).includes(textoBusqueda) ||
                normalizarTexto(producto.marca || "").includes(textoBusqueda) ||
                normalizarTexto(producto.tipo || "").includes(textoBusqueda) ||
                normalizarTexto(producto.detalle || "").includes(textoBusqueda) ||
                normalizarTexto(producto.rubro || "").includes(textoBusqueda) ||
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
        <td colspan="9" class="empty-table">
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
        const preciosLista =
            obtenerPreciosListaProducto(producto);
        const listasSecundarias =
            obtenerNombresListasPreciosActivas()
                .filter(function (lista) {
                    return lista !== "Lista 1";
                })
                .slice(0, 3)
                .map(function (lista) {
                    return lista + ": " + formatearDinero(preciosLista[lista]);
                })
                .join(" | ");

        row.innerHTML = `
      <td>${producto.codigo}</td>
      <td>
        <strong>${producto.nombre}</strong>
        <small>${producto.codigoReal || producto.marca || "-"}</small>
      </td>
      <td>
        ${formatearDinero(producto.precio)}
        <small>${listasSecundarias || "Sin listas secundarias"}</small>
        <small>Compra: ${formatearDinero(producto.precioCompra || 0)}</small>
      </td>
      <td>${producto.rubro || "Sin rubro"}<br><small>${producto.tipo || "-"}</small></td>
      <td>${producto.proveedor || "Sin proveedor"}<br><small>${producto.proveedorAlternativo || "-"}</small></td>
      <td>${producto.stock}<br><small>Min: ${obtenerStockMinimoProducto(producto)}</small></td>
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

function renderizarOpcionesProductosStock() {
    if (!dom.productosStockLista) {
        return;
    }

    dom.productosStockLista.innerHTML =
        productos.map(function (producto) {
            const codigoReal =
                producto.codigoReal ? " | " + producto.codigoReal : "";

            return `<option value="${producto.codigo} - ${producto.nombre}${codigoReal}"></option>`;
        }).join("");
}

function buscarProductoParaMovimientoStock(busqueda) {
    const texto =
        normalizarTexto(busqueda || "");

    if (texto === "") {
        return null;
    }

    return productos.find(function (producto) {
        return String(producto.codigo) === texto ||
            normalizarTexto(producto.codigoReal || "") === texto ||
            normalizarTexto(producto.nombre || "").includes(texto);
    }) || null;
}

function calcularStockFinalMovimiento(producto, tipoMovimiento, cantidadMovimiento) {
    const stockActual =
        Number(producto.stock) || 0;

    if (tipoMovimiento === "ENTRADA") {
        return stockActual + cantidadMovimiento;
    }

    if (tipoMovimiento === "SALIDA") {
        return stockActual - cantidadMovimiento;
    }

    return cantidadMovimiento;
}

function actualizarVistaMovimientoStock() {
    if (!dom.stockMovementPreview) {
        return;
    }

    const producto =
        buscarProductoParaMovimientoStock(dom.stockProductInput.value);

    if (!producto) {
        dom.stockMovementPreview.textContent =
            "Elegi un producto para ver como queda el stock.";
        return;
    }

    const cantidad =
        Number(dom.stockMovementQuantityInput.value);
    const tipoMovimiento =
        dom.stockMovementTypeInput.value;

    if (Number.isNaN(cantidad) || cantidad < 0) {
        dom.stockMovementPreview.textContent =
            "Ingrese una cantidad valida.";
        return;
    }

    const stockFinal =
        calcularStockFinalMovimiento(producto, tipoMovimiento, cantidad);

    dom.stockMovementPreview.innerHTML =
        "<strong>" + producto.codigo + " - " + producto.nombre + "</strong>" +
        "<span>Stock actual: " + producto.stock + " | Stock final: " + stockFinal + "</span>" +
        "<span>Estado actual: " + obtenerEstadoStockProducto(producto).texto + "</span>";
}

function actualizarVistaScannerStock() {
    const producto =
        buscarProductoParaMovimientoStock(dom.stockScannerInput.value);

    if (!producto) {
        dom.stockScannerResult.textContent =
            dom.stockScannerInput.value.trim() === ""
                ? "Escanea o escribe un producto para cargar un movimiento de stock."
                : "Sin coincidencias exactas todavia.";
        return;
    }

    dom.stockScannerResult.innerHTML =
        "<strong>" + producto.codigo + " - " + producto.nombre + "</strong>" +
        "<span>Stock: " + producto.stock + " | Minimo: " + obtenerStockMinimoProducto(producto) +
        " | Estado: " + obtenerEstadoStockProducto(producto).texto + "</span>";
}

function renderizarMovimientosProductos() {
    if (!dom.movimientosProductosTable) {
        return;
    }

    renderizarOpcionesProductosStock();

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

function buscarProductoDesdeScannerStock() {
    const texto =
        normalizarTexto(dom.stockScannerInput.value || "");

    if (texto === "") {
        dom.stockScannerResult.textContent =
            "Escanea o escribe un producto para ver stock y movimientos.";
        return;
    }

    const producto =
        productos.find(function (productoGuardado) {
            return String(productoGuardado.codigo) === texto ||
                normalizarTexto(productoGuardado.codigoReal || "") === texto ||
                normalizarTexto(productoGuardado.nombre || "").includes(texto);
        });

    if (!producto) {
        dom.stockScannerResult.textContent =
            "No se encontro producto para: " + dom.stockScannerInput.value;
        return;
    }

    dom.buscarMovimientoProductoInput.value =
        String(producto.codigo);
    dom.stockProductInput.value =
        producto.codigo + " - " + producto.nombre;
    dom.stockScannerResult.innerHTML =
        "<strong>" + producto.codigo + " - " + producto.nombre + "</strong>" +
        "<span>Stock actual: " + producto.stock + " | Estado: " +
        obtenerEstadoStockProducto(producto).texto + "</span>";

    actualizarVistaMovimientoStock();
    renderizarMovimientosProductos();
}

function aplicarMovimientoStock(producto, tipoMovimiento, cantidadMovimiento, motivoMovimiento) {
    if (!producto) {
        alert("Seleccione un producto valido.");
        return false;
    }

    if (!Number.isInteger(cantidadMovimiento) || cantidadMovimiento < 0) {
        alert("La cantidad debe ser un numero entero mayor o igual a 0.");
        return false;
    }

    if (tipoMovimiento !== "AJUSTE" && cantidadMovimiento === 0) {
        alert("Para entradas o salidas la cantidad debe ser mayor a 0.");
        return false;
    }

    const stockAnterior =
        Number(producto.stock) || 0;
    const stockFinal =
        calcularStockFinalMovimiento(producto, tipoMovimiento, cantidadMovimiento);

    if (stockFinal < 0) {
        alert("La salida deja stock negativo. Stock actual: " + stockAnterior + ".");
        return false;
    }

    if (!Array.isArray(producto.movimientosStock)) {
        producto.movimientosStock = [];
    }

    const cantidadRegistrada =
        tipoMovimiento === "AJUSTE"
            ? stockFinal - stockAnterior
            : tipoMovimiento === "SALIDA"
                ? -cantidadMovimiento
                : cantidadMovimiento;

    producto.stock = stockFinal;

    producto.movimientosStock.push({
        fecha: new Date().toLocaleDateString("es-AR"),
        tipo: tipoMovimiento === "ENTRADA"
            ? "Entrada manual"
            : tipoMovimiento === "SALIDA"
                ? "Salida manual"
                : "Ajuste de stock",
        pedido: motivoMovimiento || "Movimiento manual",
        cantidad: cantidadRegistrada,
        stockFinal: producto.stock
    });

    reactivarProductoSiCorrespondePorStock(producto);
    actualizarEstadoAutomaticoPorStock(producto, true);
    avisarStockMinimoSiCorresponde(producto);

    guardarProductos();
    renderizarProductos();
    renderizarCatalogoProductosPedido();
    renderizarMovimientosGenerales();
    actualizarStockTotal();
    actualizarDashboard();

    registrarAuditoria(
        "Stock",
        "Movimiento manual",
        producto.codigo + " - " + producto.nombre +
        " | " + tipoMovimiento +
        " | " + cantidadRegistrada +
        " | Stock " + stockAnterior + " > " + producto.stock
    );

    return true;
}

function registrarMovimientoManualStock(event) {
    event.preventDefault();

    const producto =
        buscarProductoParaMovimientoStock(dom.stockProductInput.value);
    const tipoMovimiento =
        dom.stockMovementTypeInput.value;
    const cantidadMovimiento =
        Number(dom.stockMovementQuantityInput.value);
    const motivoMovimiento =
        dom.stockMovementNoteInput.value.trim();

    const movimientoRegistrado =
        aplicarMovimientoStock(
            producto,
            tipoMovimiento,
            cantidadMovimiento,
            motivoMovimiento
        );

    if (!movimientoRegistrado) {
        return;
    }

    dom.stockMovementForm.reset();
    dom.stockScannerInput.value = "";
    dom.stockScannerResult.textContent =
        "Movimiento registrado. Escanea otro producto para continuar.";
    actualizarVistaMovimientoStock();
}

function registrarMovimientoRapidoStock(tipoMovimiento) {
    const producto =
        buscarProductoParaMovimientoStock(dom.stockScannerInput.value);
    const cantidadMovimiento =
        Number(dom.stockQuickQuantityInput.value);
    const motivoMovimiento =
        dom.stockQuickNoteInput.value.trim() || "Scanner stock";

    const movimientoRegistrado =
        aplicarMovimientoStock(
            producto,
            tipoMovimiento,
            cantidadMovimiento,
            motivoMovimiento
        );

    if (!movimientoRegistrado) {
        return;
    }

    dom.stockProductInput.value =
        producto.codigo + " - " + producto.nombre;
    dom.stockMovementTypeInput.value = tipoMovimiento;
    dom.stockMovementQuantityInput.value = "";
    dom.stockMovementNoteInput.value = "";
    dom.stockQuickQuantityInput.value = "";
    dom.stockQuickNoteInput.value = "";
    dom.stockScannerResult.innerHTML =
        "<strong>Movimiento registrado</strong>" +
        "<span>" + producto.codigo + " - " + producto.nombre +
        " | Stock actual: " + producto.stock + "</span>";
    actualizarVistaMovimientoStock();
    dom.stockScannerInput.focus();
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
    producto.bajaAutomaticaStock = false;

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
