let productoEditando = null;

function obtenerVistaProductosActual() {
    return dom.productosVistaInput ? dom.productosVistaInput.value : "descripcion";
}

function renderizarEncabezadoProductos() {
    if (!dom.productosTableHead) {
        return;
    }

    const vista =
        obtenerVistaProductosActual();
    const columnasPorVista = {
        descripcion: ["Codigo", "Descripcion", "Rubro", "Estado", "Acciones"],
        precio: ["Codigo", "Producto", "Lista 1", "Listas", "Compra", "Acciones"],
        stock: ["Codigo", "Producto", "Stock", "Minimo", "Estado", "Acciones"],
        stock_valorizado: ["Codigo", "Producto", "Stock", "Precio", "Valor stock", "Acciones"],
        margenes: ["Codigo", "Producto", "Compra", "Margenes", "Listas", "Acciones"],
        proveedores: ["Codigo", "Producto", "Proveedor", "Alternativo", "Rubro", "Acciones"]
    };
    const columnas =
        columnasPorVista[vista] || columnasPorVista.descripcion;

    dom.productosTableHead.innerHTML =
        "<tr>" +
        columnas.map(function (columna) {
            return "<th>" + columna + "</th>";
        }).join("") +
        "</tr>";
}

function obtenerBotonesAccionProducto(producto, accionEstado) {
    return `
        <button class="btn btn-secondary" onclick="editarProducto(${producto.codigo})">Editar</button>
        <button class="btn btn-secondary" onclick="cambiarEstadoProducto(${producto.codigo})">${accionEstado}</button>
        <button class="btn btn-danger" onclick="eliminarProducto(${producto.codigo})">Eliminar</button>
    `;
}

function obtenerTextoMargenesProducto(producto) {
    const margenes =
        obtenerMargenesProducto(producto);

    return ["Lista 1", "Lista 2", "Lista 3", "Lista 4"]
        .map(function (lista) {
            return lista + ": " + (Number(margenes[lista]) || 0) + "%";
        })
        .join(" | ");
}

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
let paginaProductosActual = 1;
const productosPorPagina = 50;

function cambiarFiltroEstadoProductos(filtroNuevo) {
    filtroEstadoProductos = filtroNuevo;
    reiniciarPaginaProductos();

    document.querySelectorAll("[data-product-status-filter]").forEach(function (boton) {
        boton.classList.toggle(
            "active",
            boton.dataset.productStatusFilter === filtroNuevo
        );
    });

    renderizarProductos();
}

function reiniciarPaginaProductos() {
    paginaProductosActual = 1;
}

function cambiarPaginaProductos(direccion) {
    paginaProductosActual += direccion;

    if (paginaProductosActual < 1) {
        paginaProductosActual = 1;
    }

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

function obtenerPorcentajeListaPrecio(nombreLista) {
    const nombreNormalizado =
        normalizarNombreListaPrecio(nombreLista);
    const lista =
        listasPrecios.find(function (listaGuardada) {
            return normalizarNombreListaPrecio(listaGuardada.nombre) === nombreNormalizado;
        });

    return lista ? Number(lista.porcentaje) || 0 : 0;
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

let listaPreciosGeneradaActual = [];

function obtenerValoresSeleccionadosMultiple(select) {
    if (!select) {
        return [];
    }

    return Array.from(select.selectedOptions).map(function (option) {
        return option.value;
    });
}

function renderizarOpcionesGeneradorListasPrecios() {
    if (!dom.listaPreciosGeneradorRubros || !dom.listaPreciosGeneradorMarcas || !dom.listaPreciosGeneradorListas) {
        return;
    }

    const rubrosSeleccionados =
        obtenerValoresSeleccionadosMultiple(dom.listaPreciosGeneradorRubros);
    const marcasSeleccionadas =
        obtenerValoresSeleccionadosMultiple(dom.listaPreciosGeneradorMarcas);
    const listasSeleccionadas =
        obtenerValoresSeleccionadosMultiple(dom.listaPreciosGeneradorListas);
    const rubrosDisponibles =
        Array.from(new Set(productos.filter(productoActivo).map(function (producto) {
            return producto.rubro || "Sin rubro";
        }))).sort(function (a, b) { return a.localeCompare(b, "es"); });
    const marcasDisponibles =
        Array.from(new Set(productos.filter(productoActivo).map(function (producto) {
            return producto.marca || producto.proveedor || "Sin marca";
        }))).sort(function (a, b) { return a.localeCompare(b, "es"); });
    const listasDisponibles =
        obtenerNombresListasPreciosActivas();

    dom.listaPreciosGeneradorRubros.innerHTML =
        rubrosDisponibles.map(function (rubro) {
            const seleccionado =
                rubrosSeleccionados.includes(rubro) ? " selected" : "";
            return `<option value="${escaparTextoHtml(rubro)}"${seleccionado}>${escaparTextoHtml(rubro)}</option>`;
        }).join("");

    dom.listaPreciosGeneradorMarcas.innerHTML =
        marcasDisponibles.map(function (marca) {
            const seleccionado =
                marcasSeleccionadas.includes(marca) ? " selected" : "";
            return `<option value="${escaparTextoHtml(marca)}"${seleccionado}>${escaparTextoHtml(marca)}</option>`;
        }).join("");

    dom.listaPreciosGeneradorListas.innerHTML =
        listasDisponibles.map(function (lista) {
            const seleccionado =
                listasSeleccionadas.includes(lista) || (listasSeleccionadas.length === 0 && lista === listasDisponibles[0])
                    ? " selected"
                    : "";
            return `<option value="${escaparTextoHtml(lista)}"${seleccionado}>${escaparTextoHtml(lista)}</option>`;
        }).join("");
}

function renderizarListasPrecios() {
    if (!dom.listasPreciosTable) {
        return;
    }

    renderizarOpcionesGeneradorListasPrecios();

    if (listasPrecios.length === 0) {
        dom.listasPreciosTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Todavia no hay listas de precios creadas.</td>
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
                    <td>
                        <input
                            class="compact-number-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value="${Number(lista.porcentaje) || 0}"
                            onchange="actualizarPorcentajeListaPrecio(${lista.codigo}, this.value)"
                        >
                    </td>
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

function obtenerProductosParaGenerarListaPrecios() {
    const rubrosSeleccionados =
        obtenerValoresSeleccionadosMultiple(dom.listaPreciosGeneradorRubros);
    const marcasSeleccionadas =
        obtenerValoresSeleccionadosMultiple(dom.listaPreciosGeneradorMarcas);

    return productos.filter(function (producto) {
        const rubroProducto =
            producto.rubro || "Sin rubro";
        const marcaProducto =
            producto.marca || producto.proveedor || "Sin marca";
        const coincideRubro =
            rubrosSeleccionados.length === 0 || rubrosSeleccionados.includes(rubroProducto);
        const coincideMarca =
            marcasSeleccionadas.length === 0 || marcasSeleccionadas.includes(marcaProducto);

        return productoActivo(producto) && coincideRubro && coincideMarca;
    }).sort(function (productoA, productoB) {
        return String(productoA.nombre || "").localeCompare(String(productoB.nombre || ""), "es");
    });
}

function obtenerListasParaGenerarListaPrecios() {
    const listasSeleccionadas =
        obtenerValoresSeleccionadosMultiple(dom.listaPreciosGeneradorListas);
    const listasActivas =
        obtenerNombresListasPreciosActivas();

    return listasSeleccionadas.length > 0
        ? listasSeleccionadas
        : listasActivas.slice(0, 1);
}

function generarListaPrecios() {
    if (!dom.listaPreciosGeneradaHead || !dom.listaPreciosGeneradaBody) {
        return;
    }

    const listas =
        obtenerListasParaGenerarListaPrecios();
    const productosFiltrados =
        obtenerProductosParaGenerarListaPrecios();

    listaPreciosGeneradaActual =
        productosFiltrados.map(function (producto) {
            return {
                producto: producto,
                listas: listas
            };
        });

    dom.listaPreciosGeneradaHead.innerHTML = `
        <tr>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Rubro</th>
            <th>Marca</th>
            ${listas.map(function (lista) {
                return `<th>${escaparTextoHtml(lista)}</th>`;
            }).join("")}
        </tr>
    `;

    if (listaPreciosGeneradaActual.length === 0) {
        dom.listaPreciosGeneradaBody.innerHTML = `
            <tr>
                <td colspan="${4 + listas.length}" class="empty-table">Sin productos para esa seleccion.</td>
            </tr>
        `;
        return;
    }

    dom.listaPreciosGeneradaBody.innerHTML =
        listaPreciosGeneradaActual.map(function (fila) {
            const producto =
                fila.producto;

            return `
                <tr>
                    <td>${escaparTextoHtml(producto.codigo)}</td>
                    <td>${escaparTextoHtml(producto.nombre)}</td>
                    <td>${escaparTextoHtml(producto.rubro || "Sin rubro")}</td>
                    <td>${escaparTextoHtml(producto.marca || producto.proveedor || "-")}</td>
                    ${listas.map(function (lista) {
                        return `<td>${formatearDinero(obtenerPrecioProductoPorLista(producto, lista))}</td>`;
                    }).join("")}
                </tr>
            `;
        }).join("");
}

function exportarListaPreciosCsv() {
    const listas =
        obtenerListasParaGenerarListaPrecios();

    if (listaPreciosGeneradaActual.length === 0) {
        generarListaPrecios();
    }

    if (listaPreciosGeneradaActual.length === 0) {
        alert("No hay productos para exportar.");
        return;
    }

    const filas =
        listaPreciosGeneradaActual.map(function (fila) {
            const producto =
                fila.producto;
            const precios =
                listas.map(function (lista) {
                    return formatearMoneda(obtenerPrecioProductoPorLista(producto, lista));
                });

            return [
                producto.codigo,
                producto.nombre,
                producto.rubro || "",
                producto.marca || producto.proveedor || ""
            ].concat(precios);
        });

    descargarCsv(
        "lista-precios.csv",
        ["Codigo", "Producto", "Rubro", "Marca"].concat(listas),
        filas
    );
}

function imprimirListaPreciosGenerada() {
    const listas =
        obtenerListasParaGenerarListaPrecios();

    if (listaPreciosGeneradaActual.length === 0) {
        generarListaPrecios();
    }

    if (listaPreciosGeneradaActual.length === 0) {
        alert("No hay productos para imprimir.");
        return;
    }

    const filas =
        listaPreciosGeneradaActual.map(function (fila) {
            const producto =
                fila.producto;

            return `
                <tr>
                    <td>${escaparTextoHtml(producto.codigo)}</td>
                    <td>${escaparTextoHtml(producto.nombre)}</td>
                    <td>${escaparTextoHtml(producto.rubro || "Sin rubro")}</td>
                    <td>${escaparTextoHtml(producto.marca || producto.proveedor || "-")}</td>
                    ${listas.map(function (lista) {
                        return `<td>${formatearDinero(obtenerPrecioProductoPorLista(producto, lista))}</td>`;
                    }).join("")}
                </tr>
            `;
        }).join("");
    const ventana =
        window.open("", "_blank");

    if (!ventana) {
        alert("El navegador bloqueo la ventana de impresion.");
        return;
    }

    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Lista de precios</title>
            <style>
                body { font-family: Arial, sans-serif; color: #172033; }
                h1 { font-size: 22px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cbd5e1; padding: 7px; font-size: 12px; text-align: left; }
                th { background: #eef2f7; }
            </style>
        </head>
        <body>
            <h1>${escaparTextoHtml(CONFIG.empresa || "Lista de precios")}</h1>
            <table>
                <thead>
                    <tr>
                        <th>Codigo</th>
                        <th>Producto</th>
                        <th>Rubro</th>
                        <th>Marca</th>
                        ${listas.map(function (lista) {
                            return `<th>${escaparTextoHtml(lista)}</th>`;
                        }).join("")}
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </body>
        </html>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
}

function limpiarSeleccionGeneradorListasPrecios() {
    [dom.listaPreciosGeneradorRubros, dom.listaPreciosGeneradorMarcas, dom.listaPreciosGeneradorListas]
        .forEach(function (select) {
            if (!select) {
                return;
            }

            Array.from(select.options).forEach(function (option) {
                option.selected = false;
            });
        });

    listaPreciosGeneradaActual = [];
    renderizarOpcionesGeneradorListasPrecios();
    generarListaPrecios();
}

function actualizarPorcentajeListaPrecio(codigo, porcentajeNuevo) {
    const lista =
        listasPrecios.find(function (listaGuardada) {
            return Number(listaGuardada.codigo) === Number(codigo);
        });

    if (!lista) {
        alert("No se encontro la lista de precios.");
        return;
    }

    lista.porcentaje = Math.max(Number(porcentajeNuevo) || 0, 0);
    const productosActualizados =
        recalcularPreciosProductosPorLista(lista);

    guardarListasPrecios();
    if (productosActualizados > 0) {
        guardarProductos();
        renderizarProductos();
    }
    programarSincronizacionAutomatica("datosBase");
    if (productosActualizados > 0) {
        programarSincronizacionAutomatica("productos");
    }

    registrarAuditoria(
        "Listas",
        "Actualizo margen de lista",
        lista.nombre + " - " + lista.porcentaje + "% | Productos recalculados: " + productosActualizados
    );
}

function recalcularPreciosProductosPorLista(lista) {
    if (!lista || !lista.nombre) {
        return 0;
    }

    let productosActualizados = 0;

    productos.forEach(function (producto) {
        const precioCompra =
            Number(producto.precioCompra) || 0;

        if (precioCompra <= 0) {
            return;
        }

        const margenesProducto =
            obtenerMargenesProducto(producto);
        const margenPropio =
            Number(obtenerValorPorNombreLista(margenesProducto, lista.nombre)) || 0;
        const margenAplicado =
            margenPropio > 0 ? margenPropio : Number(lista.porcentaje) || 0;
        const precioNuevo =
            calcularPrecioProductoConMargen(precioCompra, margenAplicado);

        if (precioNuevo <= 0) {
            return;
        }

        const preciosLista =
            { ...obtenerPreciosListaProducto(producto) };
        const precioAnterior =
            Number(obtenerValorPorNombreLista(preciosLista, lista.nombre)) || 0;

        if (precioAnterior === precioNuevo) {
            return;
        }

        preciosLista[lista.nombre] = precioNuevo;
        guardarMargenesEnPreciosLista(preciosLista, margenesProducto);

        if (normalizarNombreListaPrecio(lista.nombre) === "lista1") {
            producto.precio = precioNuevo;
        }

        producto.preciosLista = preciosLista;

        if (!Array.isArray(producto.historialPrecios)) {
            producto.historialPrecios = [];
        }

        producto.historialPrecios.push({
            fecha: new Date().toLocaleDateString("es-AR"),
            lista: lista.nombre,
            anterior: precioAnterior,
            nuevo: precioNuevo,
            motivo: "Cambio de margen general de lista"
        });

        productosActualizados++;
    });

    return productosActualizados;
}

function recalcularPreciosProductoPorCosto(producto, motivo) {
    if (!producto) {
        return 0;
    }

    const precioCompra =
        Number(producto.precioCompra) || 0;

    if (precioCompra <= 0) {
        return 0;
    }

    const listasActivas =
        listasPrecios.filter(function (lista) {
            return lista && lista.activo !== false;
        });

    const preciosLista =
        { ...obtenerPreciosListaProducto(producto) };
    const margenesProducto =
        obtenerMargenesProducto(producto);
    let preciosActualizados = 0;

    listasActivas.forEach(function (lista) {
        const margenPropio =
            Number(obtenerValorPorNombreLista(margenesProducto, lista.nombre)) || 0;
        const margenAplicado =
            margenPropio > 0 ? margenPropio : Number(lista.porcentaje) || 0;
        const precioNuevo =
            calcularPrecioProductoConMargen(precioCompra, margenAplicado);

        if (precioNuevo <= 0) {
            return;
        }

        const precioAnterior =
            Number(obtenerValorPorNombreLista(preciosLista, lista.nombre)) || 0;

        if (precioAnterior === precioNuevo) {
            return;
        }

        preciosLista[lista.nombre] = precioNuevo;

        if (normalizarNombreListaPrecio(lista.nombre) === "lista1") {
            producto.precio = precioNuevo;
        }

        if (!Array.isArray(producto.historialPrecios)) {
            producto.historialPrecios = [];
        }

        producto.historialPrecios.push({
            fecha: new Date().toLocaleDateString("es-AR"),
            lista: lista.nombre,
            anterior: precioAnterior,
            nuevo: precioNuevo,
            motivo: motivo || "Cambio de costo"
        });

        preciosActualizados++;
    });

    producto.preciosLista =
        guardarMargenesEnPreciosLista(preciosLista, margenesProducto);

    return preciosActualizados;
}

function agregarListaPrecio(event) {
    event.preventDefault();

    if (!tienePermiso("rubros")) {
        alert("Tu rol no tiene permiso para modificar listas de precios.");
        return;
    }

    const nombre =
        dom.listaPrecioNombreInput.value.trim();
    const porcentaje =
        dom.listaPrecioPorcentajeInput
            ? Number(dom.listaPrecioPorcentajeInput.value) || 0
            : 0;

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
        porcentaje: porcentaje,
        activo: true
    };

    listasPrecios.push(nuevaLista);

    productos.forEach(function (producto) {
        const preciosLista =
            obtenerPreciosListaProducto(producto);

        preciosLista[nombre] =
            calcularPrecioProductoConMargen(producto.precioCompra, porcentaje) ||
            Number(producto.precio) ||
            0;
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
    if (!tienePermiso("rubros")) {
        alert("Tu rol no tiene permiso para modificar listas de precios.");
        return;
    }

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
        "<span>" + listas.join(", ") + " | Porcentaje: " + porcentaje + "%</span>" +
        (listas.includes("Lista 1")
            ? "<small>Las listas que heredan Lista 1 acompanian el cambio.</small>"
            : "");
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

    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para actualizar precios.");
        return;
    }

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

            if (lista === "Lista 1") {
                obtenerNombresListasPreciosActivas().forEach(function (listaSecundaria) {
                    if (listaSecundaria === "Lista 1") {
                        return;
                    }

                    const precioSecundarioAnterior =
                        Number(preciosLista[listaSecundaria]) || 0;
                    const veniaHeredandoListaUno =
                        precioSecundarioAnterior <= 0 ||
                        precioSecundarioAnterior === precioAnterior;

                    if (!veniaHeredandoListaUno) {
                        return;
                    }

                    preciosLista[listaSecundaria] = precioNuevo;
                    producto.historialPrecios.push({
                        fecha: fecha,
                        lista: listaSecundaria,
                        anterior: precioSecundarioAnterior,
                        nuevo: precioNuevo,
                        motivo: "Herencia Lista 1 " + porcentaje + "%"
                    });
                });
            }
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

function actualizarEstadoImportacionPrecios(mensaje, tipo) {
    if (!dom.priceImportStatus) {
        return;
    }

    dom.priceImportStatus.textContent = mensaje;
    dom.priceImportStatus.classList.remove("sync-ok", "sync-error", "sync-working");

    if (tipo) {
        dom.priceImportStatus.classList.add(tipo);
    }
}

function crearMapaColumnasPreciosImportacion(encabezados) {
    const nombres =
        encabezados.map(normalizarEncabezadoImportacion);

    function buscarColumnas(posiblesNombres) {
        for (const posibleNombre of posiblesNombres) {
            const indice =
                nombres.indexOf(posibleNombre);

            if (indice >= 0) {
                return indice;
            }
        }

        return -1;
    }

    const mapa = {
        codigo: buscarColumnas(["codigo", "cod", "codref", "codigoproducto"]),
        lista: buscarColumnas(["lista", "listaprecios", "listadeprecios"]),
        precio: buscarColumnas(["precio", "precioventa", "pu", "punitario"]),
        preciosPorLista: {}
    };

    listasPrecios.forEach(function (lista) {
        const nombreLista =
            normalizarEncabezadoImportacion(lista.nombre);
        const alternativas = [
            nombreLista,
            nombreLista.replace("lista", "l"),
            "precio" + nombreLista,
            "precio" + nombreLista.replace("lista", "l")
        ];
        const indice =
            buscarColumnas(alternativas);

        if (indice >= 0) {
            mapa.preciosPorLista[lista.nombre] = indice;
        }
    });

    return mapa;
}

function obtenerPrecioImportado(columnas, indice) {
    if (indice < 0 || indice >= columnas.length) {
        return null;
    }

    const valor =
        limpiarValorImportacion(columnas[indice]);

    if (valor === "") {
        return null;
    }

    const precio =
        obtenerNumeroImportacion(valor, null);

    if (precio === null || Number.isNaN(precio) || precio < 0) {
        return null;
    }

    return precio;
}

function obtenerListaPrecioValida(nombreLista) {
    const nombreNormalizado =
        normalizarTexto(nombreLista || "");
    const listaEncontrada =
        listasPrecios.find(function (lista) {
            return normalizarTexto(lista.nombre) === nombreNormalizado;
        });

    return listaEncontrada ? listaEncontrada.nombre : "Lista 1";
}

async function importarPreciosDesdeArchivo() {
    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para importar precios.");
        return;
    }

    try {
        const archivo =
            dom.priceImportFileInput &&
            dom.priceImportFileInput.files &&
            dom.priceImportFileInput.files.length > 0
                ? dom.priceImportFileInput.files[0]
                : null;

        if (!archivo) {
            actualizarEstadoImportacionPrecios("Seleccione un archivo CSV de precios.", "sync-error");
            return;
        }

        actualizarEstadoImportacionPrecios("Leyendo archivo de precios...", "sync-working");

        const texto =
            await leerArchivoProductosComoTexto(archivo);
        const lineas =
            texto.trim().split(/\r?\n/).filter(function (linea) {
                return linea.trim() !== "";
            });

        if (lineas.length === 0) {
            actualizarEstadoImportacionPrecios("El archivo de precios esta vacio.", "sync-error");
            return;
        }

        const separador =
            detectarSeparadorImportacion(lineas[0] || "");
        const primeraLinea =
            parsearLineaCsvImportacion(lineas[0], separador);
        const tieneEncabezado =
            !Number.isInteger(Number(primeraLinea[0])) ||
            normalizarEncabezadoImportacion(primeraLinea[0]).includes("cod");
        const mapaColumnas =
            tieneEncabezado ? crearMapaColumnasPreciosImportacion(primeraLinea) : null;
        const lineasDatos =
            tieneEncabezado ? lineas.slice(1) : lineas;
        const fecha =
            new Date().toLocaleDateString("es-AR");

        let productosActualizados = 0;
        let preciosActualizados = 0;
        let noEncontrados = 0;
        let errores = 0;

        ejecutarSinProgramarSincronizacion(function () {
            lineasDatos.forEach(function (linea) {
                const columnas =
                    parsearLineaCsvImportacion(linea, separador);
                const indiceCodigo =
                    mapaColumnas && mapaColumnas.codigo >= 0 ? mapaColumnas.codigo : 0;
                const codigo =
                    Number(limpiarValorImportacion(columnas[indiceCodigo]));

                if (!Number.isInteger(codigo) || codigo <= 0) {
                    errores += 1;
                    return;
                }

                const producto =
                    productos.find(function (productoGuardado) {
                        return productoGuardado.codigo === codigo;
                    });

                if (!producto) {
                    noEncontrados += 1;
                    return;
                }

                const preciosLista =
                    obtenerPreciosListaProducto(producto);
                const cambios = [];

                if (
                    mapaColumnas &&
                    Object.keys(mapaColumnas.preciosPorLista).length > 0
                ) {
                    Object.keys(mapaColumnas.preciosPorLista).forEach(function (lista) {
                        const precio =
                            obtenerPrecioImportado(columnas, mapaColumnas.preciosPorLista[lista]);

                        if (precio !== null) {
                            cambios.push({
                                lista: lista,
                                precio: precio
                            });
                        }
                    });
                } else {
                    const indiceLista =
                        mapaColumnas && mapaColumnas.lista >= 0 ? mapaColumnas.lista : -1;
                    const indicePrecio =
                        mapaColumnas && mapaColumnas.precio >= 0 ? mapaColumnas.precio : 1;
                    const lista =
                        indiceLista >= 0
                            ? obtenerListaPrecioValida(columnas[indiceLista])
                            : "Lista 1";
                    const precio =
                        obtenerPrecioImportado(columnas, indicePrecio);

                    if (precio !== null) {
                        cambios.push({
                            lista: lista,
                            precio: precio
                        });
                    }
                }

                if (cambios.length === 0) {
                    errores += 1;
                    return;
                }

                if (!Array.isArray(producto.historialPrecios)) {
                    producto.historialPrecios = [];
                }

                cambios.forEach(function (cambio) {
                    const precioAnterior =
                        Number(preciosLista[cambio.lista]) || 0;

                    preciosLista[cambio.lista] = cambio.precio;
                    producto.historialPrecios.push({
                        fecha: fecha,
                        lista: cambio.lista,
                        anterior: precioAnterior,
                        nuevo: cambio.precio,
                        motivo: "Importacion CSV precios"
                    });
                    preciosActualizados += 1;
                });

                producto.preciosLista = preciosLista;
                producto.precio = Number(preciosLista["Lista 1"]) || Number(producto.precio) || 0;
                productosActualizados += 1;
            });

            guardarProductos();
        });

        if (dom.priceImportFileInput) {
            dom.priceImportFileInput.value = "";
        }

        renderizarProductos();
        renderizarCatalogoProductosPedido();
        renderizarPanelPreciosProductos();
        actualizarDashboard();

        registrarAuditoria(
            "Productos",
            "Importo precios",
            "Productos: " + productosActualizados +
            " | Precios: " + preciosActualizados +
            " | No encontrados: " + noEncontrados +
            " | Errores: " + errores
        );

        actualizarEstadoImportacionPrecios(
            "Importacion local terminada. Productos actualizados: " + productosActualizados +
            " | Precios cargados: " + preciosActualizados +
            " | No encontrados: " + noEncontrados +
            " | Errores: " + errores +
            " | No se subio nada a Supabase.",
            errores > 0 || noEncontrados > 0 ? "sync-error" : "sync-ok"
        );
    } catch (error) {
        console.error("Error importando precios:", error);
        actualizarEstadoImportacionPrecios(
            error.message || "No se pudieron importar precios.",
            "sync-error"
        );
    }
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

    if (!Number.isFinite(stock) || stock < 0) {
        alert("El stock debe ser un numero mayor o igual a 0.");
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
        Number.isFinite(stock) &&
        stock >= 0;
}

function limpiarFormularioProducto() {
    productoEditando = null;
    dom.productForm.reset();
    dom.productCodeInput.disabled = false;
    dom.productSubmitButton.textContent = "Agregar producto";
    completarSiguienteCodigoProducto();
    actualizarVistaStockProductoFormulario();
}

function obtenerDatosStockFormularioProducto() {
    const tipoStock =
        dom.productStockModeInput ? dom.productStockModeInput.value : "simple";
    const unidadesPorBulto =
        Math.max(1, Number(dom.productUnitsPerBulkInput && dom.productUnitsPerBulkInput.value) || 1);
    const stockBultos =
        Math.max(0, Math.floor(Number(dom.productBulkStockInput && dom.productBulkStockInput.value) || 0));
    const stockUnidades =
        Math.max(0, Math.floor(Number(dom.productUnitStockInput && dom.productUnitStockInput.value) || 0));
    const stockManual =
        Number(dom.productStockInput.value);

    if (tipoStock === "bultos") {
        return {
            tipoStock: "bultos",
            stock: stockBultos * unidadesPorBulto + stockUnidades,
            unidadesPorBulto: unidadesPorBulto,
            stockBultos: stockBultos,
            stockUnidades: stockUnidades,
            ventaSoloBulto: dom.productBulkSaleModeInput && dom.productBulkSaleModeInput.value === "bulto",
            unidadPeso: ""
        };
    }

    if (tipoStock === "peso") {
        return {
            tipoStock: "peso",
            stock: Math.max(0, Number.isNaN(stockManual) ? 0 : stockManual),
            unidadesPorBulto: 0,
            stockBultos: 0,
            stockUnidades: 0,
            ventaSoloBulto: false,
            unidadPeso: dom.productWeightUnitInput ? dom.productWeightUnitInput.value : "kg"
        };
    }

    return {
        tipoStock: "simple",
        stock: Math.max(0, Math.floor(Number.isNaN(stockManual) ? 0 : stockManual)),
        unidadesPorBulto: 0,
        stockBultos: 0,
        stockUnidades: 0,
        ventaSoloBulto: false,
        unidadPeso: ""
    };
}

function actualizarVistaStockProductoFormulario() {
    if (!dom.productStockModeInput || !dom.productStockInput) {
        return;
    }

    const tipoStock =
        dom.productStockModeInput.value || "simple";
    const usaBultos =
        tipoStock === "bultos";
    const usaPeso =
        tipoStock === "peso";

    document.querySelectorAll(".stock-bulk-field").forEach(function (campo) {
        campo.classList.toggle("hidden", !usaBultos);
    });

    document.querySelectorAll(".stock-weight-field").forEach(function (campo) {
        campo.classList.toggle("hidden", !usaPeso);
    });

    dom.productStockInput.disabled = usaBultos;
    dom.productStockInput.step = usaPeso ? "0.001" : "1";
    dom.productMinimumStockInput.step = usaPeso ? "0.001" : "1";

    if (usaBultos) {
        const datosStock =
            obtenerDatosStockFormularioProducto();
        dom.productStockInput.value = datosStock.stock;
    }
}

function calcularPrecioProductoConMargen(precioCompra, margen) {
    const compra =
        Number(precioCompra) || 0;
    const porcentaje =
        Number(margen) || 0;

    if (compra <= 0 || porcentaje <= 0) {
        return 0;
    }

    return Math.round((compra + (compra * porcentaje / 100)) * 100) / 100;
}

function completarPrecioListaPorMargen(nombreLista, inputMargen, inputPrecio) {
    if (!inputMargen || !inputPrecio) {
        return;
    }

    const margenProducto =
        Number(inputMargen.value) || 0;
    const margenLista =
        margenProducto > 0 ? margenProducto : obtenerPorcentajeListaPrecio(nombreLista);
    const precioCalculado =
        calcularPrecioProductoConMargen(
            dom.productPurchasePriceInput.value,
            margenLista
        );

    if (precioCalculado <= 0) {
        return;
    }

    inputPrecio.value = precioCalculado;
}

function actualizarPreciosProductoPorMargenes() {
    completarPrecioListaPorMargen("Lista 1", dom.productMarginList1Input, dom.productPriceInput);
    completarPrecioListaPorMargen("Lista 2", dom.productMarginList2Input, dom.productPriceList2Input);
    completarPrecioListaPorMargen("Lista 3", dom.productMarginList3Input, dom.productPriceList3Input);
    completarPrecioListaPorMargen("Lista 4", dom.productMarginList4Input, dom.productPriceList4Input);
}

function obtenerMargenesFormularioProducto() {
    return {
        "Lista 1": Number(dom.productMarginList1Input.value) || 0,
        "Lista 2": Number(dom.productMarginList2Input.value) || 0,
        "Lista 3": Number(dom.productMarginList3Input.value) || 0,
        "Lista 4": Number(dom.productMarginList4Input.value) || 0
    };
}

function guardarMargenesEnPreciosLista(preciosLista, margenesLista) {
    preciosLista.__margenes = margenesLista;
    return preciosLista;
}

function obtenerMargenesProducto(producto) {
    if (
        producto &&
        producto.preciosLista &&
        typeof producto.preciosLista.__margenes === "object"
    ) {
        return producto.preciosLista.__margenes;
    }

    return {};
}

function agregarProducto(event) {
    event.preventDefault();

    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para modificar productos.");
        return;
    }

    actualizarPreciosProductoPorMargenes();

    const codigo = Number(dom.productCodeInput.value);
    const codigoReal = dom.productBarcodeInput.value.trim();
    const nombre = dom.productNameInput.value.trim();
    const precio = Number(dom.productPriceInput.value);
    const precioLista2 = Number(dom.productPriceList2Input.value) || 0;
    const precioLista3 = Number(dom.productPriceList3Input.value) || 0;
    const precioLista4 = Number(dom.productPriceList4Input.value) || 0;
    const precioCompra = Number(dom.productPurchasePriceInput.value) || 0;
    const datosStock =
        obtenerDatosStockFormularioProducto();
    const stock = datosStock.stock;
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
    const margenesLista =
        obtenerMargenesFormularioProducto();

    const formularioValido =
        validarFormularioProducto(codigo, nombre, precio, stock);

    if (!formularioValido) {
        return;
    }

    if (productoEditando) {
        const codigoEditado =
            productoEditando.codigo;
        const preciosAnteriores =
            { ...obtenerPreciosListaProducto(productoEditando) };
        const preciosNuevos =
            { ...preciosAnteriores };

        preciosNuevos["Lista 1"] = precio;
        preciosNuevos["Lista 2"] = precioLista2 > 0 ? precioLista2 : precio;
        preciosNuevos["Lista 3"] = precioLista3 > 0 ? precioLista3 : precio;
        preciosNuevos["Lista 4"] = precioLista4 > 0 ? precioLista4 : precio;
        guardarMargenesEnPreciosLista(preciosNuevos, margenesLista);

        if (!Array.isArray(productoEditando.historialPrecios)) {
            productoEditando.historialPrecios = [];
        }

        productoEditando.nombre = nombre;
        productoEditando.precio = precio;
        productoEditando.preciosLista = preciosNuevos;
        Object.keys(preciosNuevos).forEach(function (lista) {
            if (lista === "__margenes") {
                return;
            }

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
        Object.assign(productoEditando, datosStock);
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
        const productoGuardadoOnline =
            productoEditando;

        limpiarFormularioProducto();
        renderizarProductos();
        renderizarRubros();
        renderizarProveedores();
        actualizarDashboard();
        actualizarStockTotal();
        guardarProductos();
        guardarProductoOperacionSupabase(productoGuardadoOnline);

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
    guardarMargenesEnPreciosLista(preciosProductoNuevo, margenesLista);

    const productoNuevo = {
        codigo: codigo,
        codigoReal: codigoReal,
        nombre: nombre,
        precio: precio,
        preciosLista: preciosProductoNuevo,
        precioCompra: precioCompra,
        ...datosStock,
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
    };

    productos.push(productoNuevo);

    actualizarEstadoAutomaticoPorStock(productoNuevo, true);

    limpiarFormularioProducto();
    dom.productCodeInput.focus();
    renderizarProductos();
    renderizarRubros();
    renderizarProveedores();
    actualizarDashboard();
    actualizarStockTotal();
    guardarProductos();
    guardarProductoOperacionSupabase(productoNuevo);

    registrarAuditoria(
        "Productos",
        "Creo producto",
        codigo + " - " + nombre + " | Stock " + stock
    );
}

function actualizarEstadoImportacionProductos(mensaje, tipo) {
    if (!dom.productosImportacionEstado) {
        return;
    }

    dom.productosImportacionEstado.textContent = mensaje;
    dom.productosImportacionEstado.classList.remove("sync-ok", "sync-error", "sync-working");

    if (tipo) {
        dom.productosImportacionEstado.classList.add(tipo);
    }
}

function leerArchivoProductosComoTexto(archivo) {
    return new Promise(function (resolve, reject) {
        const lector = new FileReader();

        lector.onload = function () {
            resolve(String(lector.result || ""));
        };

        lector.onerror = function () {
            reject(new Error("No se pudo leer el archivo seleccionado."));
        };

        lector.readAsText(archivo, "UTF-8");
    });
}

function limpiarValorImportacion(valor) {
    return String(valor || "")
        .replace(/^\uFEFF/, "")
        .trim();
}

function normalizarEncabezadoImportacion(valor) {
    return limpiarValorImportacion(valor)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function parsearLineaCsvImportacion(linea, separador) {
    const columnas = [];
    let valorActual = "";
    let dentroDeComillas = false;

    for (let indice = 0; indice < linea.length; indice += 1) {
        const caracter = linea[indice];
        const siguienteCaracter = linea[indice + 1];

        if (caracter === "\"" && siguienteCaracter === "\"") {
            valorActual += "\"";
            indice += 1;
            continue;
        }

        if (caracter === "\"") {
            dentroDeComillas = !dentroDeComillas;
            continue;
        }

        if (caracter === separador && !dentroDeComillas) {
            columnas.push(limpiarValorImportacion(valorActual));
            valorActual = "";
            continue;
        }

        valorActual += caracter;
    }

    columnas.push(limpiarValorImportacion(valorActual));
    return columnas;
}

function detectarSeparadorImportacion(linea) {
    const separadores = [";", "\t", ","];
    let mejorSeparador = "\t";
    let mayorCantidadColumnas = 1;

    separadores.forEach(function (separador) {
        const cantidadColumnas =
            parsearLineaCsvImportacion(linea, separador).length;

        if (cantidadColumnas > mayorCantidadColumnas) {
            mayorCantidadColumnas = cantidadColumnas;
            mejorSeparador = separador;
        }
    });

    return mejorSeparador;
}

function obtenerNumeroImportacion(valor, valorPorDefecto) {
    const texto =
        limpiarValorImportacion(valor).replace(/\./g, "").replace(",", ".");
    const numero =
        Number(texto);

    if (Number.isNaN(numero)) {
        return valorPorDefecto;
    }

    return numero;
}

function crearMapaColumnasImportacion(encabezados) {
    const nombres =
        encabezados.map(normalizarEncabezadoImportacion);

    function buscarColumnas(posiblesNombres) {
        for (const posibleNombre of posiblesNombres) {
            const indice =
                nombres.indexOf(posibleNombre);

            if (indice >= 0) {
                return indice;
            }
        }

        return -1;
    }

    return {
        codigo: buscarColumnas(["codref", "codigo", "cod", "codigoref"]),
        codigoReal: buscarColumnas(["codreal", "codigoreal", "barcode", "barras", "codigobarras"]),
        nombre: buscarColumnas(["producto", "nombre", "descripcion", "desc"]),
        precio: buscarColumnas(["precio", "precioventa", "pu", "pventa", "lista1", "l1"]),
        precioLista2: buscarColumnas(["lista2", "l2", "preciolista2", "preciosl2"]),
        precioLista3: buscarColumnas(["lista3", "l3", "preciolista3", "preciosl3"]),
        precioLista4: buscarColumnas(["lista4", "l4", "preciolista4", "preciosl4"]),
        precioCompra: buscarColumnas(["compra", "preciocompra", "costo", "costounitario", "prcompra"]),
        stock: buscarColumnas(["stock", "cantidad"]),
        stockMinimo: buscarColumnas(["stockminimo", "minimo", "stockmin", "puntoreposicion"]),
        rubro: buscarColumnas(["rubro"]),
        proveedor: buscarColumnas(["proveedor"]),
        categoria: buscarColumnas(["categoria", "tipo"]),
        marca: buscarColumnas(["marca"]),
        pack: buscarColumnas(["pack", "bulto", "unidadesporbulto"]),
        unidad: buscarColumnas(["unidad", "medida", "presentacion"]),
        iva: buscarColumnas(["iva"]),
        bonificacionVenta: buscarColumnas(["bonificacionventa", "bonifventa", "descuentoventa", "descventa"])
    };
}

function obtenerValorColumnaImportacion(columnas, mapa, nombre, indiceAlternativo) {
    const indice =
        mapa && mapa[nombre] >= 0 ? mapa[nombre] : indiceAlternativo;

    if (indice < 0 || indice >= columnas.length) {
        return "";
    }

    return limpiarValorImportacion(columnas[indice]);
}

function importarProductosDesdeTextoPlano(texto) {
    const textoLimpio =
        texto.trim();

    if (textoLimpio === "") {
        actualizarEstadoImportacionProductos("Pegue productos o seleccione un archivo CSV.", "sync-error");
        return;
    }

    const lineas =
        textoLimpio.split(/\r?\n/).filter(function (linea) {
            return linea.trim() !== "";
        });

    const separador =
        detectarSeparadorImportacion(lineas[0] || "");

    const primeraLinea =
        parsearLineaCsvImportacion(lineas[0], separador);
    const tieneEncabezado =
        !Number.isInteger(Number(primeraLinea[0])) ||
        normalizarEncabezadoImportacion(primeraLinea[0]).includes("cod");
    const mapaColumnas =
        tieneEncabezado ? crearMapaColumnasImportacion(primeraLinea) : null;
    const lineasDatos =
        tieneEncabezado ? lineas.slice(1) : lineas;

    let creados = 0;
    let actualizados = 0;
    let errores = 0;

    ejecutarSinProgramarSincronizacion(function () {
        lineasDatos.forEach(function (linea) {
        const columnas =
            parsearLineaCsvImportacion(linea, separador);

        if (columnas.length < 2) {
            errores += 1;
            return;
        }

        const codigo = Number(obtenerValorColumnaImportacion(columnas, mapaColumnas, "codigo", 0));
        const codigoReal =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "codigoReal", -1);
        const nombre = obtenerValorColumnaImportacion(columnas, mapaColumnas, "nombre", 1);
        const precioTexto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "precio", 2);
        const precioLista2Texto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "precioLista2", -1);
        const precioLista3Texto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "precioLista3", -1);
        const precioLista4Texto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "precioLista4", -1);
        const precioCompraTexto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "precioCompra", -1);
        const stockTexto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "stock", 3);
        const stockMinimoTexto = obtenerValorColumnaImportacion(columnas, mapaColumnas, "stockMinimo", -1);
        const rubro = asegurarRubroPorNombre(
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "rubro", 4) || "Sin rubro"
        );
        const proveedor = asegurarProveedorPorNombre(
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "proveedor", 5) || "Sin proveedor"
        );
        const categoria =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "categoria", -1);
        const marca =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "marca", -1);
        const packTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "pack", -1);
        const unidad =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "unidad", -1);
        const ivaTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "iva", -1);
        const bonificacionVentaTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "bonificacionVenta", -1);

        const productoExistente =
            productos.find(function (producto) {
                return producto.codigo === codigo;
            });
        const precioCompra = precioCompraTexto !== ""
            ? obtenerNumeroImportacion(precioCompraTexto, 0)
            : productoExistente ? Number(productoExistente.precioCompra) || 0 : 0;
        const precio = precioTexto !== ""
            ? obtenerNumeroImportacion(precioTexto, 0)
            : precioCompra > 0
                ? calcularPrecioProductoConMargen(precioCompra, obtenerPorcentajeListaPrecio("Lista 1"))
            : productoExistente ? Number(productoExistente.precio) || 0 : 0;
        const precioLista2 = precioLista2Texto !== ""
            ? obtenerNumeroImportacion(precioLista2Texto, 0)
            : precioCompra > 0
                ? calcularPrecioProductoConMargen(precioCompra, obtenerPorcentajeListaPrecio("Lista 2"))
                : precio;
        const precioLista3 = precioLista3Texto !== ""
            ? obtenerNumeroImportacion(precioLista3Texto, 0)
            : precioCompra > 0
                ? calcularPrecioProductoConMargen(precioCompra, obtenerPorcentajeListaPrecio("Lista 3"))
                : precio;
        const precioLista4 = precioLista4Texto !== ""
            ? obtenerNumeroImportacion(precioLista4Texto, 0)
            : precioCompra > 0
                ? calcularPrecioProductoConMargen(precioCompra, obtenerPorcentajeListaPrecio("Lista 4"))
                : precio;
        const stock = stockTexto !== ""
            ? Math.max(0, Math.round(obtenerNumeroImportacion(stockTexto, 0) * 1000) / 1000)
            : productoExistente ? Number(productoExistente.stock) || 0 : 0;
        const stockMinimo = stockMinimoTexto !== ""
            ? Math.max(0, Math.round(obtenerNumeroImportacion(stockMinimoTexto, 0) * 1000) / 1000)
            : productoExistente ? Number(productoExistente.stockMinimo) || 0 : 0;

        if (!datosProductoValidos(codigo, nombre, precio, stock)) {
            errores += 1;
            return;
        }

        if (productoExistente) {
            const preciosListaExistentes =
                obtenerPreciosListaProducto(productoExistente);
            const preciosListaActualizados =
                { ...preciosListaExistentes };

            if (precioTexto !== "") {
                preciosListaActualizados["Lista 1"] = precio;
            }

            preciosListaActualizados["Lista 2"] = precioLista2 > 0 ? precioLista2 : precio;
            preciosListaActualizados["Lista 3"] = precioLista3 > 0 ? precioLista3 : precio;
            preciosListaActualizados["Lista 4"] = precioLista4 > 0 ? precioLista4 : precio;

            productoExistente.nombre = nombre;
            productoExistente.precio = precio;
            productoExistente.preciosLista =
                preciosListaActualizados;
            productoExistente.stock = stock;
            productoExistente.rubro = rubro;
            productoExistente.proveedor = proveedor;
            productoExistente.tipo = categoria || productoExistente.tipo || "";
            productoExistente.marca = marca || productoExistente.marca || "";
            productoExistente.codigoReal = codigoReal || productoExistente.codigoReal || "";
            productoExistente.precioCompra = precioCompra;
            productoExistente.stockMinimo = stockMinimo;
            productoExistente.pack = packTexto !== "" ? obtenerNumeroImportacion(packTexto, 0) : Number(productoExistente.pack) || 0;
            productoExistente.unidad = unidad || productoExistente.unidad || "";
            productoExistente.iva = ivaTexto !== "" ? obtenerNumeroImportacion(ivaTexto, 0) : Number(productoExistente.iva) || 0;
            productoExistente.bonificacionVenta = bonificacionVentaTexto !== "" ? obtenerNumeroImportacion(bonificacionVentaTexto, 0) : Number(productoExistente.bonificacionVenta) || 0;

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
            codigoReal: codigoReal,
            nombre: nombre,
            precio: precio,
            preciosLista: {
                "Lista 1": precio,
                "Lista 2": precioLista2 > 0 ? precioLista2 : precio,
                "Lista 3": precioLista3 > 0 ? precioLista3 : precio,
                "Lista 4": precioLista4 > 0 ? precioLista4 : precio
            },
            stock: stock,
            rubro: rubro,
            proveedor: proveedor,
            tipo: categoria,
            marca: marca,
            detalle: "",
            precioCompra: precioCompra,
            stockMinimo: stockMinimo,
            pack: packTexto !== "" ? obtenerNumeroImportacion(packTexto, 0) : 0,
            unidad: unidad,
            iva: ivaTexto !== "" ? obtenerNumeroImportacion(ivaTexto, 0) : 0,
            bonificacionVenta: bonificacionVentaTexto !== "" ? obtenerNumeroImportacion(bonificacionVentaTexto, 0) : 0,
            proveedorAlternativo: "",
            activo: true,
            movimientosStock: [],
            historialPrecios: []
        });

        creados += 1;
    });
    });

    dom.productosImportacionTexto.value = "";
    if (dom.productosImportacionArchivo) {
        dom.productosImportacionArchivo.value = "";
    }

    completarSiguienteCodigoProducto();
    renderizarProductos();
    renderizarRubros();
    renderizarProveedores();
    actualizarDashboard();
    actualizarStockTotal();
    renderizarCatalogoProductosPedido();
    ejecutarSinProgramarSincronizacion(function () {
        guardarProductos();
        guardarRubros();
        guardarProveedores();
    });
    programarSincronizacionAutomatica("productos");
    programarSincronizacionAutomatica("datosBase");

    registrarAuditoria(
        "Productos",
        "Importo productos",
        "Creados: " + creados + " | Actualizados: " + actualizados + " | Errores: " + errores
    );

    actualizarEstadoImportacionProductos(
        "Importacion local terminada. Creados: " + creados +
        " | Actualizados: " + actualizados +
        " | Errores: " + errores +
        " | Sincronizacion online programada.",
        errores > 0 ? "sync-error" : "sync-ok"
    );
}

async function importarProductosDesdeTexto() {
    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para importar productos.");
        return;
    }

    try {
        actualizarEstadoImportacionProductos("Leyendo productos para importar...", "sync-working");

        const archivo =
            dom.productosImportacionArchivo &&
            dom.productosImportacionArchivo.files &&
            dom.productosImportacionArchivo.files.length > 0
                ? dom.productosImportacionArchivo.files[0]
                : null;
        const texto =
            archivo
                ? await leerArchivoProductosComoTexto(archivo)
                : dom.productosImportacionTexto.value;

        importarProductosDesdeTextoPlano(texto);
    } catch (error) {
        console.error("Error importando productos:", error);
        actualizarEstadoImportacionProductos(error.message || "No se pudo importar productos.", "sync-error");
    }
}

function editarProducto(codigo) {
    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para editar productos.");
        return;
    }

    const producto = productos.find(function (productoGuardado) {
        return productoGuardado.codigo === codigo;
    });

    if (!producto) {
        alert("No se encontro el producto que queres editar.");
        limpiarFormularioProducto();
        return;
    }

    productoEditando = producto;
    mostrarSeccionProducto("alta");

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
    const margenesProducto =
        obtenerMargenesProducto(producto);
    dom.productMarginList1Input.value = margenesProducto["Lista 1"] || "";
    dom.productMarginList2Input.value = margenesProducto["Lista 2"] || "";
    dom.productMarginList3Input.value = margenesProducto["Lista 3"] || "";
    dom.productMarginList4Input.value = margenesProducto["Lista 4"] || "";
    dom.productPurchasePriceInput.value = producto.precioCompra || "";
    dom.productStockModeInput.value = producto.tipoStock || "simple";
    dom.productUnitsPerBulkInput.value = producto.unidadesPorBulto || "";
    dom.productBulkStockInput.value = producto.stockBultos || "";
    dom.productUnitStockInput.value = producto.stockUnidades || "";
    dom.productBulkSaleModeInput.value = producto.ventaSoloBulto ? "bulto" : "unidad";
    dom.productWeightUnitInput.value = producto.unidadPeso || "kg";
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
    actualizarVistaStockProductoFormulario();
    dom.productNameInput.focus();
}

function eliminarProducto(codigo) {
    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para eliminar productos.");
        return;
    }

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

    const productoUsadoEnPedidos =
        pedidos.some(function (pedido) {
            return Array.isArray(pedido.items) &&
                pedido.items.some(function (item) {
                    return item.producto && item.producto.codigo === producto.codigo;
                });
        });
    const tieneMovimientos =
        Array.isArray(producto.movimientosStock) && producto.movimientosStock.length > 0;
    const tieneHistorialPrecios =
        Array.isArray(producto.historialPrecios) && producto.historialPrecios.length > 0;

    if (productoUsadoEnPedidos || tieneMovimientos || tieneHistorialPrecios) {
        producto.activo = false;
        producto.bajaAutomaticaStock = false;

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
        guardarProductoOperacionSupabase(producto);

        registrarAuditoria(
            "Productos",
            "Baja segura producto",
            producto.codigo + " - " + producto.nombre + " | Conserva pedidos/stock/precios"
        );

        alert("El producto tiene historial. Se paso a inactivo para no perder datos.");
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
    renderizarEncabezadoProductos();

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
            return obtenerStockTotalProducto(producto) <= 0;
        }).length;

    const valorStockTotal =
        productos.reduce(function (total, producto) {
            if (!productoActivo(producto)) {
                return total;
            }

            return total + ((Number(producto.precio) || 0) * obtenerStockTotalProducto(producto));
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

    const totalPaginas =
        Math.max(1, Math.ceil(productosFiltrados.length / productosPorPagina));

    if (paginaProductosActual > totalPaginas) {
        paginaProductosActual = totalPaginas;
    }

    const indiceInicio =
        (paginaProductosActual - 1) * productosPorPagina;
    const indiceFin =
        indiceInicio + productosPorPagina;
    const productosPagina =
        productosFiltrados.slice(indiceInicio, indiceFin);

    if (productosFiltrados.length === 0) {
        if (dom.productosResultadoContador) {
            dom.productosResultadoContador.textContent =
                "Productos | 0 en total";
        }

        if (dom.productosPaginacion) {
            dom.productosPaginacion.classList.add("hidden");
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

    if (dom.productosPaginacion) {
        dom.productosPaginacion.classList.toggle(
            "hidden",
            productosFiltrados.length <= productosPorPagina
        );
    }

    if (dom.productosPaginacionInfo) {
        dom.productosPaginacionInfo.textContent =
            "Mostrando " + (indiceInicio + 1) + "-" +
            Math.min(indiceFin, productosFiltrados.length) +
            " de " + productosFiltrados.length +
            " | Pagina " + paginaProductosActual + " de " + totalPaginas;
    }

    if (dom.productosPaginaAnteriorButton) {
        dom.productosPaginaAnteriorButton.disabled =
            paginaProductosActual <= 1;
    }

    if (dom.productosPaginaSiguienteButton) {
        dom.productosPaginaSiguienteButton.disabled =
            paginaProductosActual >= totalPaginas;
    }

    productosPagina.forEach(function (producto) {
        const row = document.createElement("tr");
        const estadoStock = obtenerEstadoStockProducto(producto);
        const accionEstado =
            productoActivo(producto) ? "Desactivar" : "Activar";
        const vista =
            obtenerVistaProductosActual();
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

        const acciones =
            obtenerBotonesAccionProducto(producto, accionEstado);
        const estado =
            `<span class="stock-pill ${estadoStock.clase}">${estadoStock.texto}</span>`;
        const productoNombre =
            `<strong>${producto.nombre}</strong><small>${producto.codigoReal || producto.marca || "-"}</small>`;
        const valorStock =
            formatearDinero((Number(producto.precio) || 0) * obtenerStockTotalProducto(producto));

        if (vista === "precio") {
            row.innerHTML = `
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearDinero(producto.precio)}</td>
              <td><small>${listasSecundarias || "Sin listas secundarias"}</small></td>
              <td>${formatearDinero(producto.precioCompra || 0)}</td>
              <td>${acciones}</td>
            `;
        } else if (vista === "stock") {
            row.innerHTML = `
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearStockProducto(producto)}</td>
              <td>${obtenerStockMinimoProducto(producto)}</td>
              <td>${estado}</td>
              <td>${acciones}</td>
            `;
        } else if (vista === "stock_valorizado") {
            row.innerHTML = `
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearStockProducto(producto)}</td>
              <td>${formatearDinero(producto.precio)}</td>
              <td>${valorStock}</td>
              <td>${acciones}</td>
            `;
        } else if (vista === "margenes") {
            row.innerHTML = `
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearDinero(producto.precioCompra || 0)}</td>
              <td><small>${obtenerTextoMargenesProducto(producto)}</small></td>
              <td><small>${listasSecundarias || "Sin listas secundarias"}</small></td>
              <td>${acciones}</td>
            `;
        } else if (vista === "proveedores") {
            row.innerHTML = `
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${producto.proveedor || "Sin proveedor"}</td>
              <td>${producto.proveedorAlternativo || "-"}</td>
              <td>${producto.rubro || "Sin rubro"}<br><small>${producto.tipo || "-"}</small></td>
              <td>${acciones}</td>
            `;
        } else {
            row.innerHTML = `
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${producto.rubro || "Sin rubro"}<br><small>${producto.tipo || "-"}</small></td>
              <td>${estado}</td>
              <td>${acciones}</td>
            `;
        }

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

    const codigoBuscado =
        obtenerCodigoDesdeBusquedaProducto(busqueda);

    return productos.find(function (producto) {
        return String(producto.codigo) === texto ||
            String(producto.codigo) === codigoBuscado ||
            normalizarTexto(producto.codigoReal || "") === texto ||
            normalizarTexto(producto.nombre || "").includes(texto);
    }) || null;
}

function calcularStockFinalMovimiento(producto, tipoMovimiento, cantidadMovimiento) {
    const stockActual =
        obtenerStockTotalProducto(producto);

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

    if (!Number.isFinite(cantidad) || cantidad < 0) {
        dom.stockMovementPreview.textContent =
            "Ingrese una cantidad valida.";
        return;
    }

    if (!productoEsPeso(producto) && !Number.isInteger(cantidad)) {
        dom.stockMovementPreview.textContent =
            "Este producto se maneja por unidades enteras.";
        return;
    }

    const stockFinal =
        calcularStockFinalMovimiento(producto, tipoMovimiento, cantidad);

    dom.stockMovementPreview.innerHTML =
        "<strong>" + producto.codigo + " - " + producto.nombre + "</strong>" +
        "<span>Stock actual: " + formatearStockProducto(producto) + " | Stock final: " +
        (productoEsPeso(producto) ? stockFinal.toLocaleString("es-AR", { maximumFractionDigits: 3 }) : stockFinal) +
        "</span>" +
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
        "<span>Stock: " + formatearStockProducto(producto) + " | Minimo: " + obtenerStockMinimoProducto(producto) +
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
        <p>Stock actual: ${formatearStockProducto(producto)}</p>
      </div>
      <div class="estado-saldo">
        ${formatearDinero((Number(producto.precio) || 0) * obtenerStockTotalProducto(producto))}
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
        "<span>Stock actual: " + formatearStockProducto(producto) + " | Estado: " +
        obtenerEstadoStockProducto(producto).texto + "</span>";

    actualizarVistaMovimientoStock();
    renderizarMovimientosProductos();
}

function aplicarMovimientoStock(producto, tipoMovimiento, cantidadMovimiento, motivoMovimiento) {
    if (!producto) {
        alert("Seleccione un producto valido.");
        return false;
    }

    if (!Number.isFinite(cantidadMovimiento) || cantidadMovimiento < 0) {
        alert("La cantidad debe ser un numero mayor o igual a 0.");
        return false;
    }

    if (!productoEsPeso(producto) && !Number.isInteger(cantidadMovimiento)) {
        alert("Este producto se maneja por unidades enteras.");
        return false;
    }

    if (productoEsPeso(producto)) {
        cantidadMovimiento = Math.round(cantidadMovimiento * 1000) / 1000;
    }

    if (tipoMovimiento !== "AJUSTE" && cantidadMovimiento === 0) {
        alert("Para entradas o salidas la cantidad debe ser mayor a 0.");
        return false;
    }

    const stockAnterior =
        obtenerStockTotalProducto(producto);
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

    reconstruirStockProductoDesdeTotal(producto, stockFinal);

    producto.movimientosStock.push({
        fecha: new Date().toLocaleDateString("es-AR"),
        tipo: tipoMovimiento === "ENTRADA"
            ? "Entrada manual"
            : tipoMovimiento === "SALIDA"
                ? "Salida manual"
                : "Ajuste de stock",
        pedido: motivoMovimiento || "Movimiento manual",
        cantidad: cantidadRegistrada,
        stockFinal: obtenerStockTotalProducto(producto)
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
    guardarProductoOperacionSupabase(producto);

    registrarAuditoria(
        "Stock",
        "Movimiento manual",
        producto.codigo + " - " + producto.nombre +
        " | " + tipoMovimiento +
        " | " + cantidadRegistrada +
        " | Stock " + stockAnterior + " > " + obtenerStockTotalProducto(producto)
    );

    return true;
}

function registrarMovimientoManualStock(event) {
    event.preventDefault();

    if (!tienePermiso("movimientos")) {
        alert("Tu rol no tiene permiso para registrar movimientos de stock.");
        return;
    }

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
    if (!tienePermiso("movimientos")) {
        alert("Tu rol no tiene permiso para registrar movimientos de stock.");
        return;
    }

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
        " | Stock actual: " + formatearStockProducto(producto) + "</span>";
    actualizarVistaMovimientoStock();
    dom.stockScannerInput.focus();
}

function cambiarEstadoProducto(codigo) {
    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para modificar productos.");
        return;
    }

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
    guardarProductoOperacionSupabase(producto);

    registrarAuditoria(
        "Productos",
        productoActivo(producto) ? "Activo producto" : "Desactivo producto",
        producto.codigo + " - " + producto.nombre
    );
}
