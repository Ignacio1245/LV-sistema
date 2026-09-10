let productoEditando = null;
let importacionProductosPendiente = null;

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
        // La vista por defecto no mostraba ni precio ni stock, que son
        // justamente los dos datos que mas se miran de un producto: habia que
        // cambiar el selector de vista para poder verlos.
        descripcion: ["Codigo", "Descripcion", "Rubro", "Precio", "Stock", "Estado", "Acciones"],
        precio: ["Codigo", "Producto", "Lista 1", "Listas", "Compra", "Acciones"],
        stock: ["Codigo", "Producto", "Stock", "Minimo", "Estado", "Acciones"],
        stock_valorizado: ["Codigo", "Producto", "Stock", "Precio", "Valor stock", "Acciones"],
        margenes: ["Codigo", "Producto", "Compra", "Margenes", "Listas", "Acciones"],
        revision_precios: ["Codigo", "Producto", "Problema", "Precio", "Acciones"],
        proveedores: ["Codigo", "Producto", "Proveedor", "Alternativo", "Rubro", "Acciones"]
    };
    const columnas =
        columnasPorVista[vista] || columnasPorVista.descripcion;

    dom.productosTableHead.innerHTML = html`
        <tr>${columnas.map(function (columna) {
            return html`<th>${columna}</th>`;
        })}</tr>`;
}

function obtenerBotonesAccionProducto(producto, accionEstado) {
    // "Movimientos" abre el historial de stock del producto. La pantalla estaba
    // entera y andando (el modal, la tabla, la carga del historial completo
    // desde Supabase), pero ningun boton la abria: la funcion que la muestra no
    // la llamaba nadie. Era una funcion terminada e inalcanzable.
    return html`
        <button class="btn btn-secondary" onclick="editarProducto(${producto.codigo})">Editar</button>
        <button class="btn btn-secondary" onclick="verMovimientosStock(${producto.codigo})">Movimientos</button>
        <button class="btn btn-secondary" onclick="cambiarEstadoProducto(${producto.codigo})">${accionEstado}</button>
        <button class="btn btn-danger btn-eliminar" onclick="eliminarProducto(${producto.codigo})">Eliminar</button>
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

function obtenerProblemasPrecioProducto(producto) {
    const problemas = [];

    if (!producto) {
        return ["producto invalido"];
    }

    const precioListaUno =
        Number(producto.precio) ||
        Number(obtenerValorPorNombreLista(producto.preciosLista, "Lista 1")) ||
        0;
    const precioCompra =
        Number(producto.precioCompra) || 0;
    const listasActivas =
        listasPrecios.filter(listaPrecioActiva);

    if (precioListaUno <= 0) {
        problemas.push("Lista 1 sin precio");
    }

    if (listasActivas.length === 0) {
        problemas.push("sin listas activas");
        return problemas;
    }

    listasActivas.forEach(function (lista) {
        const nombreNormalizado =
            normalizarNombreListaPrecio(lista.nombre);
        const esListaUno =
            nombreNormalizado === "lista1";
        const precioGuardado =
            Number(obtenerValorPorNombreLista(producto.preciosLista, lista.nombre)) || 0;
        const listaTieneMargen =
            (Number(lista.porcentaje) || 0) > 0;
        const productoTieneBaseParaCalcular =
            precioCompra > 0 || precioListaUno > 0;

        if (esListaUno) {
            return;
        }

        if (precioGuardado <= 0 && productoTieneBaseParaCalcular && listaTieneMargen) {
            problemas.push(lista.nombre + " sin calcular");
        }
    });

    return [...new Set(problemas)].slice(0, 5);
}

function productoTienePreciosARevisar(producto) {
    return productoActivo(producto) && obtenerProblemasPrecioProducto(producto).length > 0;
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

    if (lista && lista.porcentaje !== undefined && lista.porcentaje !== null && lista.porcentaje !== "") {
        const porcentajeLista =
            Number(lista.porcentaje);

        if (Number.isFinite(porcentajeLista)) {
            return porcentajeLista;
        }
    }

    if (typeof obtenerPorcentajePredeterminadoListaPrecio === "function") {
        return obtenerPorcentajePredeterminadoListaPrecio(nombreLista, null);
    }

    return 0;
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
        html`<option value="">Seleccionar lista</option>` +
        listasActivas.map(function (lista) {
            return html`<option value="${lista}">${lista}</option>`;
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
            return html`<option value="${rubro}"${crudo(seleccionado)}>${rubro}</option>`;
        }).join("");

    dom.listaPreciosGeneradorMarcas.innerHTML =
        marcasDisponibles.map(function (marca) {
            const seleccionado =
                marcasSeleccionadas.includes(marca) ? " selected" : "";
            return html`<option value="${marca}"${crudo(seleccionado)}>${marca}</option>`;
        }).join("");

    dom.listaPreciosGeneradorListas.innerHTML =
        listasDisponibles.map(function (lista) {
            const seleccionado =
                listasSeleccionadas.includes(lista) || (listasSeleccionadas.length === 0 && lista === listasDisponibles[0])
                    ? " selected"
                    : "";
            return html`<option value="${lista}"${crudo(seleccionado)}>${lista}</option>`;
        }).join("");
}

function renderizarListasPrecios() {
    if (!dom.listasPreciosTable) {
        return;
    }

    renderizarOpcionesGeneradorListasPrecios();

    if (listasPrecios.length === 0) {
        dom.listasPreciosTable.innerHTML = html`
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

            return html`
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

    dom.listaPreciosGeneradaHead.innerHTML = html`
        <tr>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Rubro</th>
            <th>Marca</th>
            ${listas.map(function (lista) {
                return html`<th>${lista}</th>`;
            }).join("")}
        </tr>
    `;

    if (listaPreciosGeneradaActual.length === 0) {
        dom.listaPreciosGeneradaBody.innerHTML = html`
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

            return html`
                <tr>
                    <td>${producto.codigo}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.rubro || "Sin rubro"}</td>
                    <td>${producto.marca || producto.proveedor || "-"}</td>
                    ${listas.map(function (lista) {
                        return html`<td>${formatearDinero(obtenerPrecioProductoPorLista(producto, lista))}</td>`;
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

    registrarAuditoria(
        "Productos",
        "Exporto lista precios CSV",
        "Productos exportados: " + listaPreciosGeneradaActual.length
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

            return html`
                <tr>
                    <td>${producto.codigo}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.rubro || "Sin rubro"}</td>
                    <td>${producto.marca || producto.proveedor || "-"}</td>
                    ${listas.map(function (lista) {
                        return html`<td>${formatearDinero(obtenerPrecioProductoPorLista(producto, lista))}</td>`;
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

    ventana.document.write(html`
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
            <h1>${CONFIG.empresa || "Lista de precios"}</h1>
            <table>
                <thead>
                    <tr>
                        <th>Codigo</th>
                        <th>Producto</th>
                        <th>Rubro</th>
                        <th>Marca</th>
                        ${listas.map(function (lista) {
                            return html`<th>${lista}</th>`;
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

    const porcentajeAnterior =
        Number(lista.porcentaje) || 0;

    lista.porcentaje = Math.max(Number(porcentajeNuevo) || 0, 0);

    // Cambiar el porcentaje de una lista reescribe el precio de TODOS los
    // productos de esa lista. Antes pasaba en silencio: se tocaba un numero en
    // la pantalla de listas y se movia el catalogo entero sin avisar.
    const productosQueCambian =
        lista.porcentaje > 0 ? contarProductosAfectadosPorLista(lista) : 0;

    if (productosQueCambian > 0) {
        const aceptado =
            confirm(
                "Cambiar el margen de " + lista.nombre + " de " + porcentajeAnterior + "% a " +
                lista.porcentaje + "% va a reescribir el precio de " + productosQueCambian +
                " producto(s), pisando los precios cargados a mano.\n\n" +
                "Los productos que tengan su propio margen usan ese, no el de la lista.\n\n" +
                "¿Recalcular ahora?"
            );

        if (!aceptado) {
            lista.porcentaje = porcentajeAnterior;
            renderizarListasPrecios();
            return;
        }
    }

    const productosActualizados =
        lista.porcentaje > 0 ? recalcularPreciosProductosPorLista(lista) : 0;

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

// El margen propio del producto, si lo tiene. Devuelve null cuando no hay
// ninguno cargado, para poder distinguirlo de un margen 0 (vender al costo).
function obtenerMargenListaProducto(margenesProducto, nombreLista) {
    const valor =
        obtenerValorPorNombreLista(margenesProducto, nombreLista);

    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    const numero =
        Number(valor);

    return Number.isFinite(numero) ? numero : null;
}

// Despues de mover precios a mano (aumento masivo, importacion de precios), el
// margen atado tiene que seguir diciendo la verdad. Si el producto estaba al 40%
// sobre el costo y se le aplico un +12%, dejar el 40% guardado haria que la
// proxima compra le baje el precio de vuelta al viejo: exactamente lo que no
// queremos que pase solo.
function sincronizarMargenesAtadosConPrecios(producto, preciosLista, margenesPrevios) {
    const margenes =
        margenesPrevios || { ...obtenerMargenesProducto(producto) };
    const costo =
        Number(producto && producto.precioCompra) || 0;

    Object.keys(margenes).forEach(function (nombreLista) {
        const precioFinal =
            Number(obtenerValorPorNombreLista(preciosLista, nombreLista)) || 0;
        const margenReal =
            calcularMargenSobreCosto(costo, precioFinal);

        if (margenReal !== null) {
            margenes[nombreLista] = margenReal;
        }
    });

    return guardarMargenesEnPreciosLista(preciosLista, margenes);
}

function contarProductosAfectadosPorLista(lista) {
    if (!lista || !lista.nombre) {
        return 0;
    }

    return productos.filter(function (producto) {
        const precioCompra =
            Number(producto.precioCompra) || 0;

        if (precioCompra <= 0) {
            return false;
        }

        const margenPropio =
            obtenerMargenListaProducto(obtenerMargenesProducto(producto), lista.nombre);
        const margenAplicado =
            margenPropio !== null ? margenPropio : Number(lista.porcentaje);
        const precioNuevo =
            calcularPrecioProductoConMargen(precioCompra, margenAplicado);

        if (precioNuevo === null) {
            return false;
        }

        const precioAnterior =
            Number(obtenerValorPorNombreLista(obtenerPreciosListaProducto(producto), lista.nombre)) || 0;

        return precioAnterior !== precioNuevo;
    }).length;
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
            obtenerMargenListaProducto(margenesProducto, lista.nombre);
        const margenAplicado =
            margenPropio !== null ? margenPropio : Number(lista.porcentaje);
        const precioNuevo =
            calcularPrecioProductoConMargen(precioCompra, margenAplicado);

        if (precioNuevo === null) {
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

// Se llama sola cuando una compra trae un costo distinto al anterior.
//
// Antes reescribia todas las listas con "costo x porcentaje de la lista", asi
// que una compra te borraba los precios cargados a mano y los reemplazaba por
// los de la lista. Ahora la regla es: se mantiene el margen que el producto
// tenia de verdad. Si el precio era el costo + 45%, con el costo nuevo sigue
// siendo costo + 45%, aunque la lista diga 30%.
//
// Si no se puede saber que margen tenia (no habia costo anterior), no se toca
// el precio: es preferible que quede el precio viejo a inventarle uno.
function recalcularPreciosProductoPorCosto(producto, motivo, costoAnterior) {
    if (!producto) {
        return 0;
    }

    const precioCompra =
        Number(producto.precioCompra) || 0;

    if (precioCompra <= 0) {
        return 0;
    }

    const costoPrevio =
        Number(costoAnterior) || 0;

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
        const precioVigente =
            Number(obtenerValorPorNombreLista(preciosLista, lista.nombre)) || 0;
        const margenPropio =
            obtenerMargenListaProducto(margenesProducto, lista.nombre);
        const margenHistorico =
            precioVigente > 0 ? calcularMargenSobreCosto(costoPrevio, precioVigente) : null;
        const margenAplicado =
            margenPropio !== null
                ? margenPropio
                : margenHistorico !== null
                    ? margenHistorico
                    : precioVigente > 0
                        ? null                       // habia precio pero no se sabe con que margen: se respeta
                        : Number(lista.porcentaje);  // lista sin precio: recien ahi vale el porcentaje de la lista

        if (margenAplicado === null) {
            return;
        }

        const precioNuevo =
            calcularPrecioProductoConMargen(precioCompra, margenAplicado);

        if (precioNuevo === null) {
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

        // Con porcentaje cargado se calcula desde el costo; sin porcentaje la
        // lista nueva arranca copiando el precio actual, no en cero ni al costo.
        const precioCalculado =
            porcentaje > 0
                ? calcularPrecioProductoConMargen(producto.precioCompra, porcentaje)
                : null;

        preciosLista[nombre] =
            precioCalculado !== null
                ? precioCalculado
                : Number(producto.precio) || 0;
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
    const precio =
        Number(precioActual);
    const ajuste =
        Number(porcentaje);

    if (!Number.isFinite(precio) || !Number.isFinite(ajuste)) {
        return Number.isFinite(precio) ? precio : 0;
    }

    return redondearDinero(precio * (1 + (ajuste / 100)));
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
        html`<option value="TODOS">Todos los rubros</option>` +
        rubrosDisponibles.map(function (rubro) {
            return html`<option value="${rubro}">${rubro}</option>`;
        }).join("");

    dom.priceUpdateProveedorInput.innerHTML =
        html`<option value="TODOS">Todos los proveedores</option>` +
        proveedoresDisponibles.map(function (proveedor) {
            return html`<option value="${proveedor}">${proveedor}</option>`;
        }).join("");

    dom.priceUpdateListaInput.innerHTML =
        html`<option value="TODAS">Todas las listas</option>` +
        listasActivas.map(function (lista) {
            return html`<option value="${lista}">${lista}</option>`;
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

    dom.priceUpdatePreview.innerHTML = html`
        <strong>${productosFiltrados.length} productos</strong>
        <span>${listas.join(", ")} | Porcentaje: ${porcentaje}%</span>
        ${listas.includes("Lista 1")
            ? html`<small>Las listas que heredan Lista 1 acompanian el cambio.</small>`
            : ""}`;
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
        dom.priceHistoryTable.innerHTML = html`
            <tr>
                <td colspan="6" class="empty-table">Todavia no hay cambios de precios registrados.</td>
            </tr>
        `;
        return;
    }

    dom.priceHistoryTable.innerHTML =
        movimientosPrecios.slice(0, 80).map(function (movimiento) {
            return html`
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

async function aplicarActualizacionMasivaPrecios(event) {
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

    if (!generarRespaldoAutomaticoAntesDeOperacion("actualizacion-masiva-precios")) {
        return;
    }

    const fecha =
        new Date().toLocaleDateString("es-AR");

    const tocaListaUno =
        listas.some(function (lista) {
            return normalizarNombreListaPrecio(lista) === "lista1";
        });

    productosFiltrados.forEach(function (producto) {
        const preciosLista =
            obtenerPreciosListaProducto(producto);
        const margenesProducto =
            { ...obtenerMargenesProducto(producto) };

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

        sincronizarMargenesAtadosConPrecios(producto, preciosLista, margenesProducto);

        producto.preciosLista = preciosLista;

        // Solo se mueve el precio principal si el aumento realmente toco la
        // Lista 1. Antes se reasignaba siempre, aunque el filtro fuera Lista 3.
        if (tocaListaUno) {
            producto.precio = Number(obtenerValorPorNombreLista(preciosLista, "Lista 1")) || producto.precio;
        }
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

    await sincronizarImportacionProductosAhora(
        actualizarEstadoImportacionPrecios,
        "Actualizacion masiva aplicada. Productos: " + productosFiltrados.length + " | Listas: " + listas.join(", ") + " | Porcentaje: " + porcentaje + "%",
        "sync-ok"
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
        precio: buscarColumnas(["precio", "precioventa", "pv", "pu", "punitario"]),
        preciosPorLista: {}
    };

    listasPrecios.forEach(function (lista, indiceLista) {
        const numeroLista =
            indiceLista + 1;
        const nombreLista =
            normalizarEncabezadoImportacion(lista.nombre);
        const alternativas = [
            nombreLista,
            nombreLista.replace("lista", "l"),
            "pv" + numeroLista,
            "pventa" + numeroLista,
            "precio" + numeroLista,
            "precioventa" + numeroLista,
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

        const confirmarImportacion =
            confirm(
                "Importar precios desde CSV?\n" +
                "Filas a revisar: " + lineasDatos.length + "\n" +
                "Antes se descargara un respaldo automatico."
            );

        if (!confirmarImportacion) {
            actualizarEstadoImportacionPrecios("Importacion de precios cancelada.", "sync-working");
            return;
        }

        if (!generarRespaldoAutomaticoAntesDeOperacion("importacion-precios")) {
            actualizarEstadoImportacionPrecios("No se aplico la importacion porque no se pudo generar el respaldo.", "sync-error");
            return;
        }

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

                sincronizarMargenesAtadosConPrecios(producto, preciosLista);

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

        await sincronizarImportacionProductosAhora(
            actualizarEstadoImportacionPrecios,
            "Importacion de precios terminada. Productos actualizados: " + productosActualizados +
            " | Precios cargados: " + preciosActualizados +
            " | No encontrados: " + noEncontrados +
            " | Errores: " + errores,
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
    renderizarResumenPreciosProducto();
    if (
        typeof cerrarEditorCompacto === "function" &&
        dom.productForm.classList.contains("editor-compacto-activo")
    ) {
        cerrarEditorCompacto(true);
    }
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

// ---------------------------------------------------------------------------
// PRECIOS DEL FORMULARIO DE PRODUCTO
//
// La regla es una sola: lo que escribis manda.
//
// Como estaba antes: el formulario recalculaba solo, con costo x porcentaje de
// la lista, y PISABA lo escrito. Peor todavia, lo volvia a hacer al apretar
// Guardar, asi que escribias Lista 1 $1.500 y se guardaba $1.400 sin avisar.
// Ademas era inconsistente: sin precio de compra cargado no pisaba nada, asi
// que el mismo producto se comportaba de dos formas distintas.
//
// Como quedo:
//   - Escribis un precio  -> se guarda ese precio. Nada lo toca.
//   - Escribis un margen  -> se calcula el precio de esa lista con ese margen.
//   - Campo de precio vacio -> se completa solo con el porcentaje de la lista,
//     que es la ayuda que sirve al dar de alta un producto nuevo.
//   - Boton "Recalcular por margen" -> unico lugar donde se pisan precios ya
//     escritos, y avisa antes.
// ---------------------------------------------------------------------------

const LISTAS_FORMULARIO_PRECIO = [
    { nombre: "Lista 1", campoPrecio: "productPriceInput", campoMargen: "productMarginList1Input" },
    { nombre: "Lista 2", campoPrecio: "productPriceList2Input", campoMargen: "productMarginList2Input" },
    { nombre: "Lista 3", campoPrecio: "productPriceList3Input", campoMargen: "productMarginList3Input" },
    { nombre: "Lista 4", campoPrecio: "productPriceList4Input", campoMargen: "productMarginList4Input" }
];

// Evita que precio -> margen -> precio se persigan en circulo.
let sincronizandoPreciosFormulario = false;

function calcularPrecioProductoConMargen(precioCompra, margen) {
    const compra =
        Number(precioCompra);
    const porcentaje =
        Number(margen);

    // Devuelve null, no 0, cuando no se puede calcular. Antes devolvia 0 y
    // quien llamaba no podia distinguir "no se puede" de "el precio es cero",
    // asi que margen 0 (vender al costo) y margen negativo (liquidacion) eran
    // imposibles de expresar.
    if (!Number.isFinite(compra) || compra <= 0) {
        return null;
    }

    if (!Number.isFinite(porcentaje) || porcentaje <= -100) {
        return null;
    }

    return redondearDinero(compra * (1 + (porcentaje / 100)));
}

// Cuanto se le cargo al costo. Es el numero que va en el campo Margen.
function calcularMargenSobreCosto(precioCompra, precioVenta) {
    const compra =
        Number(precioCompra);
    const venta =
        Number(precioVenta);

    if (!Number.isFinite(compra) || compra <= 0) {
        return null;
    }

    if (!Number.isFinite(venta) || venta <= 0) {
        return null;
    }

    return Math.round(((venta - compra) / compra) * 1000) / 10;
}

// Cuanto de la venta queda como ganancia. NO es lo mismo que el margen sobre
// costo y es la confusion mas cara del rubro: 40% sobre el costo deja 28,6% de
// la venta, no 40%. Se muestra al lado del precio para que se vea siempre.
function calcularGananciaSobreVenta(precioCompra, precioVenta) {
    const compra =
        Number(precioCompra);
    const venta =
        Number(precioVenta);

    if (!Number.isFinite(compra) || compra <= 0) {
        return null;
    }

    if (!Number.isFinite(venta) || venta <= 0) {
        return null;
    }

    return Math.round(((venta - compra) / venta) * 1000) / 10;
}

function formatearPorcentajePrecio(valor) {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
        return "";
    }

    const numero =
        Math.round(Number(valor) * 10) / 10;

    return (numero > 0 ? "+" : "") + String(numero).replace(".", ",") + "%";
}

// Para la importacion por CSV: cuando la fila no trae precio, se calcula desde
// el costo SOLO si la lista tiene un porcentaje cargado. Si no, se deja el
// precio que ya tenia el producto.
function precioImportacionPorMargen(precioCompra, nombreLista, precioSiNoSePuede) {
    const porcentaje =
        Number(obtenerPorcentajeListaPrecio(nombreLista)) || 0;

    if (porcentaje <= 0) {
        return Number(precioSiNoSePuede) || 0;
    }

    const precioCalculado =
        calcularPrecioProductoConMargen(precioCompra, porcentaje);

    return precioCalculado === null ? Number(precioSiNoSePuede) || 0 : precioCalculado;
}

function obtenerCostoFormularioProducto() {
    if (!dom.productPurchasePriceInput) {
        return 0;
    }

    return Number(dom.productPurchasePriceInput.value) || 0;
}

function escribirPrecioListaDesdeMargen(fila, margen) {
    const inputPrecio =
        dom[fila.campoPrecio];
    const precioCalculado =
        calcularPrecioProductoConMargen(obtenerCostoFormularioProducto(), margen);

    if (!inputPrecio || precioCalculado === null) {
        return false;
    }

    inputPrecio.value = precioCalculado;
    return true;
}

// Se dispara al escribir un precio. A proposito NO toca el campo de margen: el
// campo de margen significa "quiero esta lista atada a este porcentaje", y si
// se llenara solo, cualquier cambio de costo despues movería el precio sin que
// nadie lo haya pedido. El margen real se ve en el cartel de abajo.
function sincronizarMargenesDesdePrecios() {
    renderizarResumenPreciosProducto();
}

// Se dispara al escribir un margen: solo toca la lista de ese campo.
function sincronizarPrecioDesdeMargen(fila) {
    if (sincronizandoPreciosFormulario) {
        return;
    }

    const inputMargen =
        dom[fila.campoMargen];

    if (!inputMargen) {
        return;
    }

    const textoMargen =
        String(inputMargen.value).trim();

    sincronizandoPreciosFormulario = true;

    if (textoMargen !== "") {
        escribirPrecioListaDesdeMargen(fila, Number(textoMargen));
    }

    sincronizandoPreciosFormulario = false;
    renderizarResumenPreciosProducto();
}

// Se dispara al cambiar el precio de compra. Completa lo que esta vacio y
// recalcula lo que tiene margen escrito, pero jamas pisa un precio suelto.
function actualizarPreciosProductoPorMargenes() {
    if (sincronizandoPreciosFormulario) {
        return;
    }

    sincronizandoPreciosFormulario = true;

    LISTAS_FORMULARIO_PRECIO.forEach(function (fila) {
        const inputPrecio =
            dom[fila.campoPrecio];
        const inputMargen =
            dom[fila.campoMargen];

        if (!inputPrecio) {
            return;
        }

        const margenEscrito =
            inputMargen ? String(inputMargen.value).trim() : "";
        const precioEscrito =
            String(inputPrecio.value).trim();

        if (margenEscrito !== "") {
            escribirPrecioListaDesdeMargen(fila, Number(margenEscrito));
            return;
        }

        if (precioEscrito === "") {
            // Ayuda para el alta: se completa el vacio con el porcentaje que
            // tiene configurada la lista. Si la lista no tiene porcentaje,
            // queda vacio y lo escribe la persona.
            const porcentajeLista =
                obtenerPorcentajeListaPrecio(fila.nombre);

            if (Number(porcentajeLista) > 0) {
                escribirPrecioListaDesdeMargen(fila, porcentajeLista);
            }

            return;
        }

        // Tiene precio escrito a mano y ningun margen atado: no se toca. El
        // cartel de abajo muestra como quedo el margen con el costo nuevo.
    });

    sincronizandoPreciosFormulario = false;
    renderizarResumenPreciosProducto();
}

// Unico lugar donde se pisan precios ya escritos, y solo si la persona acepta.
function recalcularPreciosFormularioPorMargen() {
    const costo =
        obtenerCostoFormularioProducto();

    if (costo <= 0) {
        alert("Cargá primero el precio de compra para poder calcular por margen.");

        if (dom.productPurchasePriceInput) {
            dom.productPurchasePriceInput.focus();
        }

        return;
    }

    const listasConPrecio =
        LISTAS_FORMULARIO_PRECIO.filter(function (fila) {
            const inputPrecio = dom[fila.campoPrecio];
            return inputPrecio && String(inputPrecio.value).trim() !== "";
        });

    if (listasConPrecio.length > 0) {
        const aceptado =
            confirm(
                "Se van a reemplazar los precios ya cargados por costo + margen.\n\n" +
                listasConPrecio.map(function (fila) {
                    const margen =
                        String(dom[fila.campoMargen] ? dom[fila.campoMargen].value : "").trim();
                    const porcentaje =
                        margen !== "" ? Number(margen) : obtenerPorcentajeListaPrecio(fila.nombre);
                    const precioNuevo =
                        calcularPrecioProductoConMargen(costo, porcentaje);

                    return fila.nombre + ": " + formatearDinero(Number(dom[fila.campoPrecio].value) || 0) +
                        " -> " + (precioNuevo === null ? "sin cambio" : formatearDinero(precioNuevo));
                }).join("\n") +
                "\n\n¿Reemplazar?"
            );

        if (!aceptado) {
            return;
        }
    }

    sincronizandoPreciosFormulario = true;

    LISTAS_FORMULARIO_PRECIO.forEach(function (fila) {
        const inputMargen =
            dom[fila.campoMargen];
        const margenEscrito =
            inputMargen ? String(inputMargen.value).trim() : "";
        const porcentaje =
            margenEscrito !== "" ? Number(margenEscrito) : obtenerPorcentajeListaPrecio(fila.nombre);

        if (!Number.isFinite(Number(porcentaje))) {
            return;
        }

        if (escribirPrecioListaDesdeMargen(fila, porcentaje) && inputMargen && margenEscrito === "") {
            inputMargen.value = Number(porcentaje);
        }
    });

    sincronizandoPreciosFormulario = false;
    renderizarResumenPreciosProducto();
}

// El cartelito debajo de los precios. Existe por una razon concreta: nadie
// tiene por que saber de memoria que "40% de margen" deja 28,6% de la venta,
// ni darse cuenta de que un precio quedo por debajo del costo.
function renderizarResumenPreciosProducto() {
    if (!dom.productPriceSummary) {
        return;
    }

    const costo =
        obtenerCostoFormularioProducto();

    if (costo <= 0) {
        dom.productPriceSummary.innerHTML = String(
            html`<span class="precio-resumen-vacio">Cargá el precio de compra y acá vas a ver cuánto ganás en cada lista.</span>`
        );
        return;
    }

    const filas =
        LISTAS_FORMULARIO_PRECIO.map(function (fila) {
            const inputPrecio =
                dom[fila.campoPrecio];
            const precio =
                inputPrecio ? Number(inputPrecio.value) || 0 : 0;

            if (precio <= 0) {
                return null;
            }

            const margen =
                calcularMargenSobreCosto(costo, precio);
            const ganancia =
                calcularGananciaSobreVenta(costo, precio);
            const bajoCosto =
                precio < costo;

            return html`<li class="${bajoCosto ? "precio-resumen-alerta" : ""}">
                <strong>${fila.nombre}</strong>
                <span>${formatearDinero(precio)}</span>
                <span>${formatearPorcentajePrecio(margen)} sobre el costo</span>
                <span>${bajoCosto
                    ? "PERDÉS " + formatearDinero(costo - precio) + " por unidad"
                    : "ganás " + String(ganancia).replace(".", ",") + "% de la venta (" + formatearDinero(precio - costo) + ")"}</span>
            </li>`;
        }).filter(Boolean);

    if (filas.length === 0) {
        dom.productPriceSummary.innerHTML = String(
            html`<span class="precio-resumen-vacio">Costo ${formatearDinero(costo)}. Escribí un precio o un margen para ver la ganancia.</span>`
        );
        return;
    }

    dom.productPriceSummary.innerHTML = String(
        html`<p class="precio-resumen-costo">Costo ${formatearDinero(costo)}</p>
        <ul class="precio-resumen-listas">${filas}</ul>`
    );
}

function confirmarPreciosBajoCostoProducto(precioCompra, preciosLista) {
    const costo =
        Number(precioCompra) || 0;

    if (costo <= 0) {
        return true;
    }

    const listasEnPerdida =
        Object.keys(preciosLista || {}).filter(function (nombreLista) {
            const precio = Number(preciosLista[nombreLista]) || 0;
            return precio > 0 && precio < costo;
        });

    if (listasEnPerdida.length === 0) {
        return true;
    }

    return confirm(
        "Ojo: hay precios por debajo del costo de compra (" + formatearDinero(costo) + ").\n\n" +
        listasEnPerdida.map(function (nombreLista) {
            const precio = Number(preciosLista[nombreLista]) || 0;
            return nombreLista + ": " + formatearDinero(precio) +
                " (perdés " + formatearDinero(costo - precio) + " por unidad)";
        }).join("\n") +
        "\n\n¿Guardar igual?"
    );
}

function obtenerMargenesFormularioProducto() {
    const margenes = {};

    LISTAS_FORMULARIO_PRECIO.forEach(function (fila) {
        const inputMargen =
            dom[fila.campoMargen];
        const texto =
            inputMargen ? String(inputMargen.value).trim() : "";

        if (texto === "") {
            return;
        }

        const numero =
            Number(texto);

        if (Number.isFinite(numero)) {
            margenes[fila.nombre] = numero;
        }
    });

    return margenes;
}

function guardarMargenesEnPreciosLista(preciosLista, margenesLista) {
    // Sin margenes cargados no se guarda la clave: un objeto vacio daba a
    // entender que el producto tenia margenes propios en 0.
    if (!margenesLista || Object.keys(margenesLista).length === 0) {
        delete preciosLista.__margenes;
        return preciosLista;
    }

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

function productoDebeConfirmarGuardadoOnline() {
    return typeof puedeGuardarOperacionEnSupabase === "function" &&
        puedeGuardarOperacionEnSupabase();
}

function avisarProductoSinConfirmacionOnline(accion) {
    if (!productoDebeConfirmarGuardadoOnline()) {
        return;
    }

    alert(
        accion + " quedo guardado localmente, pero Supabase no confirmo todo. " +
        "Actualiza datos y revisa la conexion antes de seguir operando."
    );
}

async function confirmarGuardadoProductoOnline(producto, accion) {
    if (typeof guardarProductoOperacionSupabase !== "function") {
        return true;
    }

    const productoGuardadoOnline =
        await guardarProductoOperacionSupabase(producto);

    if (productoDebeConfirmarGuardadoOnline() && !productoGuardadoOnline) {
        avisarProductoSinConfirmacionOnline(accion);
        return false;
    }

    return true;
}
async function agregarProducto(event) {
    event.preventDefault();

    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para modificar productos.");
        return;
    }

    // Aca antes se llamaba a actualizarPreciosProductoPorMargenes(), que pisaba
    // los precios escritos justo antes de leerlos. Ese era el bug: guardabas
    // $1.500 y quedaba $1.400. Guardar no recalcula nada.

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
    const bonificacionVenta = 0;
    const proveedor = asegurarProveedorPorNombre(dom.productProviderInput.value);
    const proveedorAlternativo = dom.productAltProviderInput.value.trim();

    const formularioValido =
        validarFormularioProducto(codigo, nombre, precio, stock);

    if (!formularioValido) {
        return;
    }

    // Vender bajo costo puede ser a proposito (liquidacion), asi que no se
    // bloquea: se avisa. Lo que no puede pasar es que se guarde sin que nadie
    // lo haya visto.
    // Solo las listas que la persona completo de verdad. Las que quedan vacias
    // copian el precio de Lista 1, y avisar cuatro veces por el mismo precio
    // solo hace que el cartel se lea menos.
    const preciosParaControl = { "Lista 1": precio };

    if (precioLista2 > 0) {
        preciosParaControl["Lista 2"] = precioLista2;
    }

    if (precioLista3 > 0) {
        preciosParaControl["Lista 3"] = precioLista3;
    }

    if (precioLista4 > 0) {
        preciosParaControl["Lista 4"] = precioLista4;
    }

    if (!confirmarPreciosBajoCostoProducto(precioCompra, preciosParaControl)) {
        return;
    }

    const margenesFormulario =
        obtenerMargenesFormularioProducto();

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
        guardarMargenesEnPreciosLista(preciosNuevos, margenesFormulario);

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

        const productoConfirmadoOnline =
            await confirmarGuardadoProductoOnline(productoGuardadoOnline, "El producto");

        if (!productoConfirmadoOnline) {
            return;
        }

        registrarAuditoria(
            "Productos",
            "Edito producto",
            codigoEditado + " - " + nombre
        );
        if (typeof mostrarAvisoPractico === "function") {
            mostrarAvisoPractico("Producto actualizado correctamente.");
        }

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
    guardarMargenesEnPreciosLista(preciosProductoNuevo, margenesFormulario);

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
        mostrarCatalogo: true,
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

    const productoConfirmadoOnline =
        await confirmarGuardadoProductoOnline(productoNuevo, "El producto");

    if (!productoConfirmadoOnline) {
        return;
    }

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

function limpiarPrevisualizacionImportacionProductos() {
    importacionProductosPendiente = null;

    if (dom.productosImportacionPreview) {
        dom.productosImportacionPreview.classList.add("hidden");
        dom.productosImportacionPreview.innerHTML =
            "Cargue un CSV para revisar altas, actualizaciones, errores y columnas detectadas antes de aplicar.";
    }

    if (dom.importarProductosButton) {
        dom.importarProductosButton.textContent = "Revisar importacion";
    }
}

function analizarImportacionProductos(texto) {
    const textoLimpio =
        texto.trim();

    if (textoLimpio === "") {
        throw new Error("Pegue productos o seleccione un archivo CSV.");
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
    const codigosVistos = new Set();
    const codigosDuplicados = [];
    const erroresDetalle = [];
    const ejemplos = [];
    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    let filasIgnoradas = 0;
    let stockPreservado = 0;
    let preciosPreservados = 0;

    lineasDatos.forEach(function (linea, indiceLinea) {
        const columnas =
            parsearLineaCsvImportacion(linea, separador);

        if (columnas.length < 2) {
            errores += 1;
            filasIgnoradas += 1;
            erroresDetalle.push("Linea " + (indiceLinea + 1) + ": faltan columnas minimas.");
            return;
        }

        const codigo =
            Number(obtenerValorColumnaImportacion(columnas, mapaColumnas, "codigo", 0));
        const nombre =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "nombre", 1);
        const precioTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "precio", 2);
        const precioCompraTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "precioCompra", -1);
        const stockTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "stock", 3);
        const productoExistente =
            productos.find(function (producto) {
                return producto.codigo === codigo;
            });
        const precioCompra = precioCompraTexto !== ""
            ? obtenerNumeroImportacion(precioCompraTexto, 0)
            : productoExistente ? Number(productoExistente.precioCompra) || 0 : 0;
        const precio = precioTexto !== ""
            ? obtenerNumeroImportacion(precioTexto, 0)
            : precioImportacionPorMargen(
                precioCompra,
                "Lista 1",
                productoExistente ? Number(productoExistente.precio) || 0 : 0
            );
        const stock = stockTexto !== ""
            ? Math.max(0, Math.round(obtenerNumeroImportacion(stockTexto, 0) * 1000) / 1000)
            : productoExistente ? Number(productoExistente.stock) || 0 : 0;

        if (!datosProductoValidos(codigo, nombre, precio, stock)) {
            errores += 1;
            filasIgnoradas += 1;
            erroresDetalle.push("Linea " + (indiceLinea + 1) + ": codigo, nombre, precio o stock invalido.");
            return;
        }

        if (codigosVistos.has(codigo)) {
            codigosDuplicados.push(codigo);
            filasIgnoradas += 1;
            return;
        }

        codigosVistos.add(codigo);

        if (productoExistente) {
            actualizados += 1;
            if (stockTexto === "") {
                stockPreservado += 1;
            }
            if (precioTexto === "" && precioCompraTexto === "") {
                preciosPreservados += 1;
            }
        } else {
            creados += 1;
        }

        if (ejemplos.length < 5) {
            ejemplos.push((productoExistente ? "Actualiza" : "Crea") + " " + codigo + " - " + nombre);
        }
    });

    const columnasDetectadas =
        tieneEncabezado
            ? primeraLinea.filter(function (columna) { return columna !== ""; })
            : ["Sin encabezado: codigo, nombre, precio, stock, rubro, proveedor"];
    const bloqueado =
        codigosDuplicados.length > 0 || creados + actualizados === 0;

    return {
        firma: obtenerFirmaTextoSistema(texto),
        separador: separador === "\t" ? "tabulacion" : separador,
        tieneEncabezado: tieneEncabezado,
        columnasDetectadas: columnasDetectadas,
        totalFilas: lineasDatos.length,
        creados: creados,
        actualizados: actualizados,
        errores: errores,
        filasIgnoradas: filasIgnoradas,
        stockPreservado: stockPreservado,
        preciosPreservados: preciosPreservados,
        codigosDuplicados: codigosDuplicados,
        erroresDetalle: erroresDetalle,
        ejemplos: ejemplos,
        bloqueado: bloqueado
    };
}

function renderizarPrevisualizacionImportacionProductos(analisis) {
    if (!dom.productosImportacionPreview) {
        return;
    }

    const columnas =
        analisis.columnasDetectadas.map(escaparTextoHtml).join("; ");
    const ejemplos =
        analisis.ejemplos.length > 0
            ? analisis.ejemplos.map(function (ejemplo) {
                return "<li>" + escaparTextoHtml(ejemplo) + "</li>";
            }).join("")
            : "<li>Sin filas validas para mostrar.</li>";
    const errores =
        analisis.erroresDetalle.slice(0, 5).map(function (error) {
            return "<li>" + escaparTextoHtml(error) + "</li>";
        }).join("");
    const duplicados =
        analisis.codigosDuplicados.length > 0
            ? html`<div class="import-preview-warning">Codigos duplicados en el CSV: ${analisis.codigosDuplicados.slice(0, 12).join(", ")}. La importacion queda bloqueada hasta corregirlos.</div>`
            : "";

    dom.productosImportacionPreview.innerHTML = html`
        <h4>Previsualizacion de productos</h4>
        <div class="import-preview-grid">
            <span>Total filas<strong>${analisis.totalFilas}</strong></span>
            <span>Creados<strong>${analisis.creados}</strong></span>
            <span>Actualizados<strong>${analisis.actualizados}</strong></span>
            <span>Ignoradas<strong>${analisis.filasIgnoradas}</strong></span>
            <span>Stock preservado<strong>${analisis.stockPreservado}</strong></span>
            <span>Precios preservados<strong>${analisis.preciosPreservados}</strong></span>
        </div>
        <div class="import-preview-detail">
            <span>Columnas detectadas</span>
            <strong>${columnas || "Sin columnas"}</strong>
        </div>
        ${duplicados}
        ${errores ? html`<ul class="import-preview-list">${errores}</ul>` : ""}
        <ul class="import-preview-list">${ejemplos}</ul>
    `;
    dom.productosImportacionPreview.classList.remove("hidden");
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
    const textoOriginal =
        limpiarValorImportacion(valor)
            .replace(/\s/g, "")
            .replace(/\$/g, "");

    if (textoOriginal === "") {
        return valorPorDefecto;
    }

    const posicionUltimaComa =
        textoOriginal.lastIndexOf(",");
    const posicionUltimoPunto =
        textoOriginal.lastIndexOf(".");
    let texto = textoOriginal;

    if (posicionUltimaComa >= 0 && posicionUltimoPunto >= 0) {
        const separadorDecimal =
            posicionUltimaComa > posicionUltimoPunto ? "," : ".";
        const separadorMiles =
            separadorDecimal === "," ? "." : ",";

        texto = texto
            .split(separadorMiles).join("")
            .replace(separadorDecimal, ".");
    } else if (posicionUltimaComa >= 0) {
        const decimales =
            textoOriginal.length - posicionUltimaComa - 1;

        texto =
            decimales > 0 && decimales <= 2
                ? textoOriginal.replace(/\./g, "").replace(",", ".")
                : textoOriginal.replace(/,/g, "");
    } else if (posicionUltimoPunto >= 0) {
        const decimales =
            textoOriginal.length - posicionUltimoPunto - 1;

        texto =
            decimales > 0 && decimales <= 2
                ? textoOriginal.replace(/,/g, "")
                : textoOriginal.replace(/\./g, "");
    }

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

function obtenerIndiceColumnaImportacion(columnas, mapa, nombre, indiceAlternativo) {
    if (mapa) {
        return mapa[nombre] >= 0 ? mapa[nombre] : -1;
    }

    return indiceAlternativo;
}

function obtenerValorColumnaImportacion(columnas, mapa, nombre, indiceAlternativo) {
    const indice =
        obtenerIndiceColumnaImportacion(columnas, mapa, nombre, indiceAlternativo);

    if (indice < 0 || indice >= columnas.length) {
        return "";
    }

    return limpiarValorImportacion(columnas[indice]);
}

function marcarImportacionProductosPendiente() {
    const tiposPendientes = ["datosBase", "productos"];

    tiposPendientes.forEach(function (tipoPendiente) {
        if (typeof marcarSincronizacionPendiente === "function") {
            marcarSincronizacionPendiente(tipoPendiente);
            return;
        }

        if (typeof programarSincronizacionAutomatica === "function") {
            programarSincronizacionAutomatica(tipoPendiente);
        }
    });
}

async function sincronizarTiposImportacionProductos() {
    const tiposImportacion = ["datosBase", "productos"];

    if (typeof sincronizarTipoLocalConSupabase !== "function") {
        if (typeof sincronizarCambiosPendientesSupabase !== "function") {
            throw new Error("No hay sincronizador Supabase disponible.");
        }

        await sincronizarCambiosPendientesSupabase();
        return tiposImportacion;
    }

    const tiposSincronizados = [];
    const sincronizar = async function () {
        for (const tipoImportacion of tiposImportacion) {
            await sincronizarTipoLocalConSupabase(tipoImportacion);

            if (typeof limpiarSincronizacionPendiente === "function") {
                limpiarSincronizacionPendiente(tipoImportacion);
            }

            tiposSincronizados.push(tipoImportacion);
        }
    };

    if (typeof pausarSincronizacionAutomatica === "function") {
        await pausarSincronizacionAutomatica(sincronizar);
    } else {
        await sincronizar();
    }

    return tiposSincronizados;
}

async function sincronizarImportacionProductosAhora(actualizarEstado, resumen, estadoResumen) {
    marcarImportacionProductosPendiente();

    if (typeof usuarioSupabaseAutenticado === "function" && !usuarioSupabaseAutenticado()) {
        actualizarEstado(
            resumen + " | Guardado local. Pendiente de subir cuando inicies sesion online.",
            "sync-working"
        );
        return;
    }

    try {
        actualizarEstado(resumen + " | Subiendo a Supabase...", "sync-working");
        await sincronizarTiposImportacionProductos();
        actualizarEstado(
            resumen + " | Supabase actualizado.",
            estadoResumen || "sync-ok"
        );
    } catch (error) {
        console.error("No se pudo subir la importacion de productos a Supabase:", error);
        actualizarEstado(
            resumen + " | Guardado local. Pendiente de subir: " + (error.message || "error"),
            "sync-error"
        );
    }
}

async function importarProductosDesdeTextoPlano(texto) {
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
        const rubroTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "rubro", 4);
        const proveedorTexto =
            obtenerValorColumnaImportacion(columnas, mapaColumnas, "proveedor", 5);
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
        const rubro = rubroTexto !== ""
            ? asegurarRubroPorNombre(rubroTexto)
            : productoExistente
                ? productoExistente.rubro
                : asegurarRubroPorNombre("Sin rubro");
        const proveedor = proveedorTexto !== ""
            ? asegurarProveedorPorNombre(proveedorTexto)
            : productoExistente
                ? productoExistente.proveedor
                : asegurarProveedorPorNombre("Sin proveedor");
        const precioCompra = precioCompraTexto !== ""
            ? obtenerNumeroImportacion(precioCompraTexto, 0)
            : productoExistente ? Number(productoExistente.precioCompra) || 0 : 0;
        // Si la columna no viene en el CSV, se respeta el precio que el producto
        // ya tenia en esa lista. Antes las listas 2/3/4 sin columna se pisaban
        // con el precio de Lista 1, asi que importar para actualizar el stock te
        // aplastaba las listas mayoristas.
        const preciosListaExistentesFila =
            productoExistente ? obtenerPreciosListaProducto(productoExistente) : null;
        const precioExistentePorLista = function (nombreLista) {
            if (!preciosListaExistentesFila) {
                return 0;
            }

            return Number(obtenerValorPorNombreLista(preciosListaExistentesFila, nombreLista)) || 0;
        };
        const precio = precioTexto !== ""
            ? obtenerNumeroImportacion(precioTexto, 0)
            : precioImportacionPorMargen(
                precioCompra,
                "Lista 1",
                productoExistente ? Number(productoExistente.precio) || 0 : 0
            );
        const precioLista2 = precioLista2Texto !== ""
            ? obtenerNumeroImportacion(precioLista2Texto, 0)
            : precioExistentePorLista("Lista 2") ||
              precioImportacionPorMargen(precioCompra, "Lista 2", precio);
        const precioLista3 = precioLista3Texto !== ""
            ? obtenerNumeroImportacion(precioLista3Texto, 0)
            : precioExistentePorLista("Lista 3") ||
              precioImportacionPorMargen(precioCompra, "Lista 3", precio);
        const precioLista4 = precioLista4Texto !== ""
            ? obtenerNumeroImportacion(precioLista4Texto, 0)
            : precioExistentePorLista("Lista 4") ||
              precioImportacionPorMargen(precioCompra, "Lista 4", precio);
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

            if (precioTexto !== "" || precioCompraTexto !== "") {
                preciosListaActualizados["Lista 1"] = precio;
            }

            if (precioLista2Texto !== "" || precioCompraTexto !== "") {
                preciosListaActualizados["Lista 2"] = precioLista2 > 0 ? precioLista2 : precio;
            }

            if (precioLista3Texto !== "" || precioCompraTexto !== "") {
                preciosListaActualizados["Lista 3"] = precioLista3 > 0 ? precioLista3 : precio;
            }

            if (precioLista4Texto !== "" || precioCompraTexto !== "") {
                preciosListaActualizados["Lista 4"] = precioLista4 > 0 ? precioLista4 : precio;
            }

            productoExistente.nombre = nombre;
            productoExistente.precio = precio;
            // El costo se asigna antes de tocar los margenes: si no, el margen
            // se recalcularia contra el costo viejo.
            productoExistente.precioCompra = precioCompra;
            sincronizarMargenesAtadosConPrecios(productoExistente, preciosListaActualizados);
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
            productoExistente.bonificacionVenta = 0;

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
            bonificacionVenta: 0,
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
    registrarAuditoria(
        "Productos",
        "Importo productos",
        "Creados: " + creados + " | Actualizados: " + actualizados + " | Errores: " + errores
    );

    const resumenImportacion =
        "Importacion terminada. Creados: " + creados +
        " | Actualizados: " + actualizados +
        " | Errores: " + errores;

    await sincronizarImportacionProductosAhora(
        actualizarEstadoImportacionProductos,
        resumenImportacion,
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
        const analisis =
            analizarImportacionProductos(texto);

        if (!importacionProductosPendiente || importacionProductosPendiente.firma !== analisis.firma) {
            importacionProductosPendiente = analisis;
            renderizarPrevisualizacionImportacionProductos(analisis);
            dom.importarProductosButton.textContent = analisis.bloqueado
                ? "Corrija el CSV y vuelva a revisar"
                : "Confirmar importacion";
            actualizarEstadoImportacionProductos(
                analisis.bloqueado
                    ? "Revise la previsualizacion. Hay errores que bloquean la importacion."
                    : "Previsualizacion lista. Revise el resumen y vuelva a tocar confirmar para aplicar.",
                analisis.bloqueado ? "sync-error" : "sync-working"
            );
            return;
        }

        if (analisis.bloqueado) {
            renderizarPrevisualizacionImportacionProductos(analisis);
            actualizarEstadoImportacionProductos("La importacion esta bloqueada hasta corregir el CSV.", "sync-error");
            return;
        }

        const confirmar =
            confirm(
                "Aplicar importacion de productos?\n" +
                "Creados: " + analisis.creados + " | Actualizados: " + analisis.actualizados + " | Ignoradas: " + analisis.filasIgnoradas + "\n" +
                "Antes se descargara un respaldo automatico."
            );

        if (!confirmar) {
            actualizarEstadoImportacionProductos("Importacion cancelada. La previsualizacion sigue disponible.", "sync-working");
            return;
        }

        if (!generarRespaldoAutomaticoAntesDeOperacion("importacion-productos")) {
            actualizarEstadoImportacionProductos("No se aplico la importacion porque no se pudo generar el respaldo.", "sync-error");
            return;
        }

        await importarProductosDesdeTextoPlano(texto);
        limpiarPrevisualizacionImportacionProductos();
    } catch (error) {
        console.error("Error importando productos:", error);
        actualizarEstadoImportacionProductos(error.message || "No se pudo importar productos.", "sync-error");
    }
}

function actualizarEstadoCorreccionTemporalProductos(mensaje, tipo) {
    if (!dom.productosTemporalEstado) {
        return;
    }

    dom.productosTemporalEstado.textContent = mensaje;
    dom.productosTemporalEstado.classList.remove("sync-ok", "sync-error", "sync-working");

    if (tipo) {
        dom.productosTemporalEstado.classList.add(tipo);
    }
}

function obtenerArchivoCorreccionTemporal(inputArchivo) {
    if (!inputArchivo || !inputArchivo.files || inputArchivo.files.length === 0) {
        return null;
    }

    return inputArchivo.files[0];
}

function buscarIndiceEncabezadoCorreccionTemporal(nombresNormalizados, posiblesNombres) {
    for (const posibleNombre of posiblesNombres) {
        const indice =
            nombresNormalizados.indexOf(posibleNombre);

        if (indice >= 0) {
            return indice;
        }
    }

    return -1;
}

function crearMapaColumnasCorreccionTemporal(encabezados) {
    const nombresNormalizados =
        encabezados.map(normalizarEncabezadoImportacion);

    const mapa = {
        codigo: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["codref", "codigo", "cod", "codigoref", "codigoproducto"]
        ),
        nombre: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["producto", "nombre", "descripcion", "articulo", "detalle"]
        ),
        rubro: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["rubro", "familia", "grupo"]
        ),
        categoria: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["categoria", "tipo", "linea", "subrubro"]
        ),
        marca: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["marca", "laboratorio"]
        ),
        proveedor: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["proveedor", "prov"]
        ),
        precio: buscarIndiceEncabezadoCorreccionTemporal(
            nombresNormalizados,
            ["precio", "precioventa", "pv", "pventa", "lista1", "pv1"]
        ),
        preciosPorLista: {}
    };

    listasPrecios.forEach(function (lista, indiceLista) {
        const numeroLista =
            indiceLista + 1;
        const nombreLista =
            normalizarEncabezadoImportacion(lista.nombre);
        const nombreCorto =
            nombreLista.replace("lista", "l");
        const alternativas = [
            nombreLista,
            nombreCorto,
            "lista" + numeroLista,
            "l" + numeroLista,
            "pv" + numeroLista,
            "pventa" + numeroLista,
            "precio" + numeroLista,
            "precioventa" + numeroLista,
            "precio" + nombreLista,
            "precio" + nombreCorto
        ];
        const indice =
            buscarIndiceEncabezadoCorreccionTemporal(nombresNormalizados, alternativas);

        if (indice >= 0) {
            mapa.preciosPorLista[lista.nombre] = indice;
        }
    });

    return mapa;
}

function normalizarCodigoCorreccionTemporalProducto(valor) {
    const texto =
        limpiarValorImportacion(valor).replace(/\s/g, "");

    if (texto === "") {
        return "";
    }

    const pareceNumerico =
        /^[0-9.,]+$/.test(texto);
    const numero =
        pareceNumerico ? obtenerNumeroImportacion(texto, null) : null;

    if (Number.isInteger(numero) && numero > 0) {
        return String(numero);
    }

    return texto.toLowerCase();
}

function obtenerCodigoNumericoCorreccionTemporal(codigoNormalizado) {
    const numero =
        obtenerNumeroImportacion(codigoNormalizado, null);

    if (!Number.isInteger(numero) || numero <= 0) {
        return null;
    }

    return numero;
}

function buscarProductoPorCodigoCorreccionTemporal(codigoNormalizado) {
    if (codigoNormalizado === "") {
        return null;
    }

    return productos.find(function (producto) {
        return normalizarCodigoCorreccionTemporalProducto(producto.codigo) === codigoNormalizado ||
            normalizarCodigoCorreccionTemporalProducto(producto.codigoReal || "") === codigoNormalizado;
    }) || null;
}

function obtenerPrecioCorreccionTemporal(columnas, indice) {
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

    if (!Number.isFinite(precio) || precio < 0) {
        return null;
    }

    return precio;
}

function obtenerRegistroCorreccionTemporalDesdeColumnas(columnas, mapaColumnas) {
    const codigo =
        obtenerValorColumnaImportacion(columnas, mapaColumnas, "codigo", 0);
    const registro = {
        codigo: codigo,
        nombre: obtenerValorColumnaImportacion(columnas, mapaColumnas, "nombre", 1),
        rubro: obtenerValorColumnaImportacion(columnas, mapaColumnas, "rubro", -1),
        categoria: obtenerValorColumnaImportacion(columnas, mapaColumnas, "categoria", -1),
        marca: obtenerValorColumnaImportacion(columnas, mapaColumnas, "marca", -1),
        proveedor: obtenerValorColumnaImportacion(columnas, mapaColumnas, "proveedor", -1),
        preciosLista: {}
    };

    if (mapaColumnas && Object.keys(mapaColumnas.preciosPorLista).length > 0) {
        Object.keys(mapaColumnas.preciosPorLista).forEach(function (lista) {
            const precio =
                obtenerPrecioCorreccionTemporal(columnas, mapaColumnas.preciosPorLista[lista]);

            if (precio !== null) {
                registro.preciosLista[lista] = precio;
            }
        });
    } else {
        const precio =
            obtenerPrecioCorreccionTemporal(
                columnas,
                mapaColumnas && mapaColumnas.precio >= 0 ? mapaColumnas.precio : 2
            );

        if (precio !== null) {
            registro.preciosLista["Lista 1"] = precio;
        }
    }

    return registro;
}

function leerRegistrosCorreccionTemporalProductos(texto) {
    const textoLimpio =
        String(texto || "").trim();

    if (textoLimpio === "") {
        return {
            registros: [],
            errores: 0
        };
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
        tieneEncabezado ? crearMapaColumnasCorreccionTemporal(primeraLinea) : null;
    const lineasDatos =
        tieneEncabezado ? lineas.slice(1) : lineas;
    const registros = [];
    let errores = 0;

    lineasDatos.forEach(function (linea) {
        const columnas =
            parsearLineaCsvImportacion(linea, separador);
        const registro =
            obtenerRegistroCorreccionTemporalDesdeColumnas(columnas, mapaColumnas);
        const codigoNormalizado =
            normalizarCodigoCorreccionTemporalProducto(registro.codigo);

        if (codigoNormalizado === "") {
            errores += 1;
            return;
        }

        registro.codigoNormalizado = codigoNormalizado;
        registros.push(registro);
    });

    return {
        registros: registros,
        errores: errores
    };
}

function unirRegistroCorreccionTemporal(registroDestino, registroOrigen) {
    ["nombre", "rubro", "categoria", "marca", "proveedor"].forEach(function (campo) {
        const valor =
            limpiarValorImportacion(registroOrigen[campo]);

        if (valor !== "") {
            registroDestino[campo] = valor;
        }
    });

    Object.keys(registroOrigen.preciosLista || {}).forEach(function (lista) {
        registroDestino.preciosLista[lista] = registroOrigen.preciosLista[lista];
    });
}

function agregarRegistrosCorreccionTemporalAlMapa(registrosPorCodigo, resultadoLectura) {
    resultadoLectura.registros.forEach(function (registro) {
        if (!registrosPorCodigo.has(registro.codigoNormalizado)) {
            registrosPorCodigo.set(registro.codigoNormalizado, {
                codigo: registro.codigo,
                codigoNormalizado: registro.codigoNormalizado,
                nombre: "",
                rubro: "",
                categoria: "",
                marca: "",
                proveedor: "",
                preciosLista: {}
            });
        }

        unirRegistroCorreccionTemporal(
            registrosPorCodigo.get(registro.codigoNormalizado),
            registro
        );
    });
}

function asignarTextoProductoCorreccionTemporal(producto, campo, valor) {
    const valorLimpio =
        limpiarValorImportacion(valor);

    if (valorLimpio === "" || String(producto[campo] || "") === valorLimpio) {
        return false;
    }

    producto[campo] = valorLimpio;
    return true;
}

function contarPreciosRegistroCorreccionTemporal(preciosLista) {
    return Object.keys(preciosLista || {}).filter(function (lista) {
        const precio =
            Number(preciosLista[lista]);

        return Number.isFinite(precio) && precio >= 0;
    }).length;
}

function obtenerPrimerPrecioCorreccionTemporal(preciosLista) {
    const precios =
        Object.keys(preciosLista || {}).map(function (lista) {
            return Number(preciosLista[lista]);
        }).filter(function (precio) {
            return Number.isFinite(precio) && precio > 0;
        });

    return precios.length > 0 ? precios[0] : 0;
}

function aplicarPreciosCorreccionTemporalProducto(producto, preciosRegistro, fecha) {
    const listasRegistro =
        Object.keys(preciosRegistro || {});

    if (listasRegistro.length === 0) {
        return 0;
    }

    const preciosLista =
        obtenerPreciosListaProducto(producto);
    const margenesGuardados =
        producto.preciosLista && producto.preciosLista.__margenes
            ? producto.preciosLista.__margenes
            : null;
    let preciosActualizados = 0;

    if (!Array.isArray(producto.historialPrecios)) {
        producto.historialPrecios = [];
    }

    listasRegistro.forEach(function (listaRegistro) {
        const lista =
            obtenerListaPrecioValida(listaRegistro);
        const precioNuevo =
            Number(preciosRegistro[listaRegistro]);

        if (!Number.isFinite(precioNuevo) || precioNuevo < 0) {
            return;
        }

        const precioAnterior =
            Number(preciosLista[lista]) || 0;

        if (Math.abs(precioAnterior - precioNuevo) < 0.01) {
            return;
        }

        preciosLista[lista] = precioNuevo;
        producto.historialPrecios.push({
            fecha: fecha,
            lista: lista,
            anterior: precioAnterior,
            nuevo: precioNuevo,
            motivo: "Correccion temporal CSV"
        });
        preciosActualizados += 1;
    });

    if (preciosActualizados > 0) {
        if (margenesGuardados) {
            preciosLista.__margenes = margenesGuardados;
        }

        producto.preciosLista = preciosLista;
        producto.precio = Number(preciosLista["Lista 1"]) || Number(producto.precio) || 0;
    }

    return preciosActualizados;
}

function aplicarRegistroCorreccionTemporalAProducto(producto, registro, fecha) {
    let datosActualizados = 0;

    if (asignarTextoProductoCorreccionTemporal(producto, "nombre", registro.nombre)) {
        datosActualizados += 1;
    }

    if (registro.rubro && asignarTextoProductoCorreccionTemporal(
        producto,
        "rubro",
        asegurarRubroPorNombre(registro.rubro)
    )) {
        datosActualizados += 1;
    }

    if (asignarTextoProductoCorreccionTemporal(producto, "tipo", registro.categoria)) {
        datosActualizados += 1;
    }

    if (asignarTextoProductoCorreccionTemporal(producto, "marca", registro.marca)) {
        datosActualizados += 1;
    }

    if (registro.proveedor && asignarTextoProductoCorreccionTemporal(
        producto,
        "proveedor",
        asegurarProveedorPorNombre(registro.proveedor)
    )) {
        datosActualizados += 1;
    }

    if (typeof producto.activo !== "boolean") {
        producto.activo = true;
    }

    if (!Array.isArray(producto.movimientosStock)) {
        producto.movimientosStock = [];
    }

    const preciosActualizados =
        aplicarPreciosCorreccionTemporalProducto(producto, registro.preciosLista, fecha);

    return {
        datosActualizados: datosActualizados,
        preciosActualizados: preciosActualizados
    };
}

function crearProductoCorreccionTemporal(registro) {
    const codigo =
        obtenerCodigoNumericoCorreccionTemporal(registro.codigoNormalizado);
    const nombre =
        limpiarValorImportacion(registro.nombre);

    if (codigo === null || nombre === "") {
        return null;
    }

    const preciosLista =
        crearPreciosListaBase(0);
    const primerPrecio =
        obtenerPrimerPrecioCorreccionTemporal(registro.preciosLista);

    Object.keys(registro.preciosLista || {}).forEach(function (listaRegistro) {
        const lista =
            obtenerListaPrecioValida(listaRegistro);
        const precio =
            Number(registro.preciosLista[listaRegistro]);

        if (Number.isFinite(precio) && precio >= 0) {
            preciosLista[lista] = precio;
        }
    });

    if (!Number(preciosLista["Lista 1"]) && primerPrecio > 0) {
        preciosLista["Lista 1"] = primerPrecio;
    }

    return {
        codigo: codigo,
        codigoReal: "",
        nombre: nombre,
        precio: Number(preciosLista["Lista 1"]) || 0,
        preciosLista: preciosLista,
        stock: 0,
        rubro: registro.rubro ? asegurarRubroPorNombre(registro.rubro) : "Sin rubro",
        proveedor: registro.proveedor ? asegurarProveedorPorNombre(registro.proveedor) : "Sin proveedor",
        tipo: limpiarValorImportacion(registro.categoria),
        marca: limpiarValorImportacion(registro.marca),
        detalle: "",
        precioCompra: 0,
        stockMinimo: 0,
        pack: 0,
        unidad: "",
        iva: 0,
        bonificacionVenta: 0,
        proveedorAlternativo: "",
        activo: true,
        movimientosStock: [],
        historialPrecios: []
    };
}

async function corregirProductosDesdeArchivosTemporales() {
    if (!tienePermiso("productos")) {
        alert("Tu rol no tiene permiso para modificar productos.");
        return;
    }

    const archivoNombres =
        obtenerArchivoCorreccionTemporal(dom.productosTemporalNombresArchivo);
    const archivoPrecios =
        obtenerArchivoCorreccionTemporal(dom.productosTemporalPreciosArchivo);

    if (!archivoNombres && !archivoPrecios) {
        actualizarEstadoCorreccionTemporalProductos(
            "Seleccione al menos un CSV para corregir productos.",
            "sync-error"
        );
        return;
    }

    if (dom.productosTemporalButton) {
        dom.productosTemporalButton.disabled = true;
    }

    try {
        actualizarEstadoCorreccionTemporalProductos("Leyendo CSV temporales...", "sync-working");

        const textos =
            await Promise.all([
                archivoNombres ? leerArchivoProductosComoTexto(archivoNombres) : Promise.resolve(""),
                archivoPrecios ? leerArchivoProductosComoTexto(archivoPrecios) : Promise.resolve("")
            ]);
        const lecturaNombres =
            leerRegistrosCorreccionTemporalProductos(textos[0]);
        const lecturaPrecios =
            leerRegistrosCorreccionTemporalProductos(textos[1]);
        const registrosPorCodigo =
            new Map();

        agregarRegistrosCorreccionTemporalAlMapa(registrosPorCodigo, lecturaNombres);
        agregarRegistrosCorreccionTemporalAlMapa(registrosPorCodigo, lecturaPrecios);

        if (registrosPorCodigo.size === 0) {
            actualizarEstadoCorreccionTemporalProductos(
                "No se encontraron productos validos en los CSV.",
                "sync-error"
            );
            return;
        }

        const fecha =
            new Date().toLocaleDateString("es-AR");
        let productosCreados = 0;
        let productosActualizados = 0;
        let camposActualizados = 0;
        let preciosActualizados = 0;
        let productosSinCrear = 0;
        const erroresLectura =
            lecturaNombres.errores + lecturaPrecios.errores;

        const confirmarCorreccion =
            confirm(
                "Aplicar correccion temporal de productos?\n" +
                "Codigos detectados: " + registrosPorCodigo.size + "\n" +
                "Errores de lectura: " + erroresLectura + "\n" +
                "Antes se descargara un respaldo automatico."
            );

        if (!confirmarCorreccion) {
            actualizarEstadoCorreccionTemporalProductos("Correccion temporal cancelada.", "sync-working");
            return;
        }

        if (!generarRespaldoAutomaticoAntesDeOperacion("correccion-temporal-productos")) {
            actualizarEstadoCorreccionTemporalProductos("No se aplico la correccion porque no se pudo generar el respaldo.", "sync-error");
            return;
        }

        ejecutarSinProgramarSincronizacion(function () {
            registrosPorCodigo.forEach(function (registro) {
                const productoExistente =
                    buscarProductoPorCodigoCorreccionTemporal(registro.codigoNormalizado);

                if (productoExistente) {
                    const resultado =
                        aplicarRegistroCorreccionTemporalAProducto(productoExistente, registro, fecha);

                    if (resultado.datosActualizados > 0 || resultado.preciosActualizados > 0) {
                        productosActualizados += 1;
                        camposActualizados += resultado.datosActualizados;
                        preciosActualizados += resultado.preciosActualizados;
                    }

                    return;
                }

                const productoNuevo =
                    crearProductoCorreccionTemporal(registro);

                if (!productoNuevo) {
                    productosSinCrear += 1;
                    return;
                }

                productos.push(productoNuevo);
                productosCreados += 1;
                camposActualizados += 1;
                preciosActualizados += contarPreciosRegistroCorreccionTemporal(registro.preciosLista);
            });

            guardarProductos();
            guardarRubros();
            guardarProveedores();
        });

        if (dom.productosTemporalNombresArchivo) {
            dom.productosTemporalNombresArchivo.value = "";
        }

        if (dom.productosTemporalPreciosArchivo) {
            dom.productosTemporalPreciosArchivo.value = "";
        }

        completarSiguienteCodigoProducto();
        renderizarProductos();
        renderizarRubros();
        renderizarProveedores();
        renderizarCatalogoProductosPedido();
        renderizarPanelPreciosProductos();
        actualizarDashboard();
        actualizarStockTotal();

        registrarAuditoria(
            "Productos",
            "Corrigio CSV temporal",
            "Creados: " + productosCreados +
            " | Actualizados: " + productosActualizados +
            " | Campos: " + camposActualizados +
            " | Precios: " + preciosActualizados +
            " | Sin crear: " + productosSinCrear +
            " | Errores lectura: " + erroresLectura
        );

        const resumenCorreccionTemporal =
            "Correccion terminada. Creados: " + productosCreados +
            " | Actualizados: " + productosActualizados +
            " | Precios cargados: " + preciosActualizados +
            " | Sin crear: " + productosSinCrear +
            " | Errores de lectura: " + erroresLectura;

        await sincronizarImportacionProductosAhora(
            actualizarEstadoCorreccionTemporalProductos,
            resumenCorreccionTemporal,
            productosSinCrear > 0 || erroresLectura > 0 ? "sync-error" : "sync-ok"
        );
    } catch (error) {
        console.error("Error corrigiendo productos con CSV temporales:", error);
        actualizarEstadoCorreccionTemporalProductos(
            error.message || "No se pudo corregir productos con los CSV.",
            "sync-error"
        );
    } finally {
        if (dom.productosTemporalButton) {
            dom.productosTemporalButton.disabled = false;
        }
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

    // Solo se muestran los margenes que el producto tiene atados de verdad. Si
    // el precio se cargo a mano, el campo queda vacio y el precio no se mueve
    // solo; cuanto esta ganando se ve en el cartel de abajo.
    const margenesGuardados =
        obtenerMargenesProducto(producto);

    LISTAS_FORMULARIO_PRECIO.forEach(function (fila) {
        const inputMargen =
            dom[fila.campoMargen];

        if (!inputMargen) {
            return;
        }

        const margenGuardado =
            obtenerMargenListaProducto(margenesGuardados, fila.nombre);

        inputMargen.value = margenGuardado === null ? "" : margenGuardado;
    });

    renderizarResumenPreciosProducto();
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
    dom.productSaleDiscountInput.value = "";
    dom.productProviderInput.value = producto.proveedor || "Sin proveedor";
    dom.productAltProviderInput.value = producto.proveedorAlternativo || "";
    dom.productCodeInput.disabled = true;
    dom.productSubmitButton.textContent = "Guardar cambios";
    actualizarVistaStockProductoFormulario();
    if (typeof abrirEditorCompacto === "function") {
        abrirEditorCompacto(dom.productForm, {
            titulo: "Editar producto",
            subtitulo: producto.codigo + " · " + producto.nombre,
            alCerrar: limpiarFormularioProducto
        });
    } else {
        mostrarSeccionProducto("alta");
    }
    dom.productNameInput.focus();
}

async function eliminarProducto(codigo) {
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

        const productoConfirmadoOnline =
            await confirmarGuardadoProductoOnline(producto, "La baja segura del producto");

        if (!productoConfirmadoOnline) {
            producto.activo = true;
            guardarProductos();
            return;
        }

        registrarAuditoria(
            "Productos",
            "Baja segura producto",
            producto.codigo + " - " + producto.nombre + " | Conserva pedidos/stock/precios"
        );

        alert("El producto tiene historial. Se paso a inactivo para no perder datos.");
        return;
    }

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

    const productoConfirmadoOnline =
        await confirmarGuardadoProductoOnline(producto, "La baja del producto");

    if (!productoConfirmadoOnline) {
        producto.activo = true;
        guardarProductos();
        renderizarProductos();
        actualizarDashboard();
        return;
    }

    registrarAuditoria(
        "Productos",
        "Baja producto",
        producto.codigo + " - " + producto.nombre
    );

    alert("Producto inactivado para mantener sincronizacion e historial.");
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
    const vistaProductosActual =
        obtenerVistaProductosActual();

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

            const coincideRevisionPrecios =
                vistaProductosActual !== "revision_precios" ||
                productoTienePreciosARevisar(producto);

            return coincideEstado && coincideBusqueda && coincideRevisionPrecios;
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

        dom.productsTable.innerHTML = html`
      <tr>
        <td colspan="9" class="empty-table">
          No hay productos para mostrar.
        </td>
      </tr>
    `;
        prepararTablaMovil(dom.productsTable);
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
            html`<span class="stock-pill ${estadoStock.clase}">${estadoStock.texto}</span>`;
        const productoNombre =
            html`<strong>${producto.nombre}</strong><small>${producto.codigoReal || producto.marca || "-"}</small>`;
        const valorStock =
            formatearDinero((Number(producto.precio) || 0) * obtenerStockTotalProducto(producto));

        if (vista === "precio") {
            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearDinero(producto.precio)}</td>
              <td><small>${listasSecundarias || "Sin listas secundarias"}</small></td>
              <td>${formatearDinero(producto.precioCompra || 0)}</td>
              <td>${acciones}</td>
            `;
        } else if (vista === "stock") {
            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearStockProducto(producto)}</td>
              <td>${obtenerStockMinimoProducto(producto)}</td>
              <td>${estado}</td>
              <td>${acciones}</td>
            `;
        } else if (vista === "stock_valorizado") {
            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearStockProducto(producto)}</td>
              <td>${formatearDinero(producto.precio)}</td>
              <td>${valorStock}</td>
              <td>${acciones}</td>
            `;
        } else if (vista === "margenes") {
            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${formatearDinero(producto.precioCompra || 0)}</td>
              <td><small>${obtenerTextoMargenesProducto(producto)}</small></td>
              <td><small>${listasSecundarias || "Sin listas secundarias"}</small></td>
              <td>${acciones}</td>
            `;
        } else if (vista === "revision_precios") {
            const problemasPrecio =
                obtenerProblemasPrecioProducto(producto).join(" | ") || "Sin problemas";

            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td><small>${problemasPrecio}</small></td>
              <td>${formatearDinero(producto.precio)}<br><small>Compra: ${formatearDinero(producto.precioCompra || 0)}</small></td>
              <td>${acciones}</td>
            `;
        } else if (vista === "proveedores") {
            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${producto.proveedor || "Sin proveedor"}</td>
              <td>${producto.proveedorAlternativo || "-"}</td>
              <td>${producto.rubro || "Sin rubro"}<br><small>${producto.tipo || "-"}</small></td>
              <td>${acciones}</td>
            `;
        } else {
            row.innerHTML = html`
              <td>${producto.codigo}</td>
              <td>${productoNombre}</td>
              <td>${producto.rubro || "Sin rubro"}${producto.tipo ? html`<br><small>${producto.tipo}</small>` : ""}</td>
              <td class="money-cell">${formatearDinero(producto.precio)}</td>
              <td>${formatearStockProducto(producto)}</td>
              <td>${estado}</td>
              <td>${acciones}</td>
            `;
        }

        dom.productsTable.appendChild(row);
    });

    prepararTablaMovil(dom.productsTable);

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
                hora: movimiento.hora || "",
                tipo: movimiento.tipo || "Movimiento",
                motivo: movimiento.motivo || movimiento.pedido || "-",
                referencia: movimiento.referencia || movimiento.pedido || "",
                pedido: movimiento.pedido || movimiento.referencia || "",
                usuario: movimiento.usuario || "-",
                cantidad: Number(movimiento.cantidad) || 0,
                stockAnterior: Number(movimiento.stockAnterior) || 0,
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

            return html`<option value="${producto.codigo} - ${producto.nombre}${codigoReal}"></option>`;
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

    dom.stockMovementPreview.innerHTML = html`
        <strong>${producto.codigo} - ${producto.nombre}</strong>
        <span>Stock actual: ${formatearStockProducto(producto)} | Stock final: ${productoEsPeso(producto) ? stockFinal.toLocaleString("es-AR", { maximumFractionDigits: 3 }) : stockFinal}</span>
        <span>Estado actual: ${obtenerEstadoStockProducto(producto).texto}</span>`;
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

    dom.stockScannerResult.innerHTML = html`
        <strong>${producto.codigo} - ${producto.nombre}</strong>
        <span>Stock: ${formatearStockProducto(producto)} | Minimo: ${obtenerStockMinimoProducto(producto)} | Estado: ${obtenerEstadoStockProducto(producto).texto}</span>`;
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
        dom.movimientosProductosTable.innerHTML = html`
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

            return html`
      <tr>
        <td>${movimiento.fecha}${movimiento.hora ? " " + movimiento.hora : ""}</td>
        <td>${movimiento.productoCodigo}</td>
        <td>${movimiento.productoNombre}</td>
        <td>${movimiento.tipo}<br><small>${movimiento.motivo}</small></td>
        <td>${pedidoTexto}<br><small>${movimiento.usuario}</small></td>
        <td>${movimiento.cantidad}</td>
        <td>${movimiento.stockAnterior} > ${movimiento.stockFinal}</td>
      </tr>
    `;
        }).join("");
}

// Pide el historial completo del producto a Supabase y vuelve a dibujar el
// detalle cuando llega. Si no hay sesion online, o falta desplegar el SQL, se
// muestran los movimientos que ya venian en la fila del producto.
async function completarHistorialStockProductoDesdeSupabase(producto) {
    if (!producto ||
        !producto.idSupabase ||
        typeof obtenerMovimientosStockProductoSupabase !== "function" ||
        typeof puedeGuardarOperacionEnSupabase !== "function" ||
        !puedeGuardarOperacionEnSupabase()) {
        return;
    }

    try {
        const movimientos =
            await obtenerMovimientosStockProductoSupabase(producto.idSupabase, 500);

        if (!Array.isArray(movimientos) || movimientos.length === 0) {
            return;
        }

        // Llegan del mas nuevo al mas viejo; el panel los muestra en el orden
        // en que ocurrieron, igual que el array de la fila.
        producto.movimientosStockCompletos =
            movimientos.slice().reverse();

        if (dom.movimientosStockModal &&
            !dom.movimientosStockModal.classList.contains("hidden")) {
            dibujarMovimientosStockProducto(producto, producto.movimientosStockCompletos);
        }
    } catch (error) {
        if (typeof esErrorFuncionSupabaseFaltante === "function" &&
            esErrorFuncionSupabaseFaltante(error)) {
            console.warn(
                "Falta desplegar obtener_movimientos_stock_producto en Supabase. " +
                "Se muestran los movimientos guardados en el producto.",
                error
            );
            return;
        }

        console.warn("No se pudo leer el historial de stock del producto:", error);
    }
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

    dibujarMovimientosStockProducto(
        producto,
        producto.movimientosStockCompletos || producto.movimientosStock
    );

    dom.movimientosStockModal.classList.remove("hidden");

    // La fila del producto solo trae los ultimos movimientos. El historial
    // completo esta en la tabla movimientos_stock y se pide recien al abrir
    // este detalle, para no bajarlo entero en cada inicio de sesion. Cuando
    // llega, se vuelve a dibujar la tabla.
    completarHistorialStockProductoDesdeSupabase(producto);
}

function dibujarMovimientosStockProducto(producto, movimientosAMostrar) {
    const movimientos =
        Array.isArray(movimientosAMostrar) ? movimientosAMostrar : [];

    const filas =
        movimientos.map(function (movimiento) {
            return html`
      <tr>
        <td>${movimiento.fecha}${movimiento.hora ? " " + movimiento.hora : ""}</td>
        <td>${movimiento.tipo}<br><small>${movimiento.motivo || "-"}</small></td>
        <td>${movimiento.pedido ? "#" + movimiento.pedido : "-"}<br><small>${movimiento.usuario || "-"}</small></td>
        <td>${movimiento.cantidad}</td>
        <td>${Number(movimiento.stockAnterior) || 0} > ${Number(movimiento.stockFinal) || 0}</td>
      </tr>
    `;
        }).join("");

    dom.movimientosStockContenido.innerHTML = html`
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
        ${filas ? crudo(filas) : html`<tr><td colspan="5">Sin movimientos registrados</td></tr>`}
      </tbody>
    </table>
  `;
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
    dom.stockScannerResult.innerHTML = html`
        <strong>${producto.codigo} - ${producto.nombre}</strong>
        <span>Stock actual: ${formatearStockProducto(producto)} | Estado: ${obtenerEstadoStockProducto(producto).texto}</span>`;

    actualizarVistaMovimientoStock();
    renderizarMovimientosProductos();
}

async function aplicarMovimientoStock(producto, tipoMovimiento, cantidadMovimiento, motivoMovimiento) {
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

    registrarMovimientoStockProducto(producto, {
        tipo: tipoMovimiento === "ENTRADA"
            ? "Entrada manual"
            : tipoMovimiento === "SALIDA"
                ? "Salida manual"
                : "Ajuste de stock",
        motivo: motivoMovimiento || "Movimiento manual",
        referencia: motivoMovimiento || "Movimiento manual",
        cantidad: cantidadRegistrada,
        stockAnterior: stockAnterior,
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

    const productoConfirmadoOnline =
        await confirmarGuardadoProductoOnline(producto, "El movimiento de stock");

    if (!productoConfirmadoOnline) {
        return false;
    }

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

async function registrarMovimientoManualStock(event) {
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
        await aplicarMovimientoStock(
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

async function registrarMovimientoRapidoStock(tipoMovimiento) {
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
        await aplicarMovimientoStock(
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
    dom.stockScannerResult.innerHTML = html`
        <strong>Movimiento registrado</strong>
        <span>${producto.codigo} - ${producto.nombre} | Stock actual: ${formatearStockProducto(producto)}</span>`;
    actualizarVistaMovimientoStock();
    dom.stockScannerInput.focus();
}

async function cambiarEstadoProducto(codigo) {
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

    const mostrarCatalogoAnterior = producto.mostrarCatalogo;
    producto.activo = !productoActivo(producto);
    producto.bajaAutomaticaStock = false;
    if (productoActivo(producto)) {
        producto.mostrarCatalogo = true;
    }

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

    const productoConfirmadoOnline =
        await confirmarGuardadoProductoOnline(producto, "El cambio de estado del producto");

    if (!productoConfirmadoOnline) {
        producto.activo = !productoActivo(producto);
        producto.mostrarCatalogo = mostrarCatalogoAnterior;
        guardarProductos();
        renderizarProductos();
        renderizarPedidoActual();
        renderizarCatalogoProductosPedido();
        actualizarDashboard();
        return;
    }

    registrarAuditoria(
        "Productos",
        productoActivo(producto) ? "Activo producto" : "Desactivo producto",
        producto.codigo + " - " + producto.nombre
    );
}

