let proveedorEditando = null;
let filtroEstadoProveedores = "activos";

function obtenerSiguienteCodigoProveedor() {
  if (proveedores.length === 0) {
    return 1;
  }

  const codigos =
    proveedores.map(function (proveedor) {
      return Number(proveedor.codigo) || 0;
    });

  return Math.max.apply(null, codigos) + 1;
}

function proveedorActivo(proveedor) {
  return proveedor.activo !== false;
}

function contarProductosPorProveedor(nombreProveedor) {
  return productos.filter(function (producto) {
    return normalizarTexto(producto.proveedor || "Sin proveedor") === normalizarTexto(nombreProveedor);
  }).length;
}

function asegurarProveedorPorNombre(nombreProveedor) {
  const nombreLimpio =
    nombreProveedor && nombreProveedor.trim() !== "" ? nombreProveedor.trim() : "Sin proveedor";

  const proveedorExistente =
    proveedores.find(function (proveedor) {
      return normalizarTexto(proveedor.nombre) === normalizarTexto(nombreLimpio);
    });

  if (proveedorExistente) {
    return proveedorExistente.nombre;
  }

  const nuevoProveedor = {
    codigo: obtenerSiguienteCodigoProveedor(),
    nombre: nombreLimpio,
    telefono: "-",
    contacto: "-",
    observacion: "Creado automaticamente",
    activo: true
  };

  proveedores.push(nuevoProveedor);
  guardarProveedores();

  return nuevoProveedor.nombre;
}

function renderizarOpcionesProveedoresActivos() {
  if (!dom.proveedoresActivosLista) {
    return;
  }

  dom.proveedoresActivosLista.innerHTML =
    proveedores.filter(proveedorActivo).map(function (proveedor) {
      return `<option value="${proveedor.nombre}"></option>`;
    }).join("");
}

function renderizarProveedores() {
  if (!dom.proveedoresTable) {
    return;
  }

  const textoBusqueda =
    normalizarTexto(dom.buscarProveedorInput.value || "");

  const proveedoresFiltrados =
    proveedores.filter(function (proveedor) {
      const coincideEstado =
        filtroEstadoProveedores === "todos" ||
        (filtroEstadoProveedores === "activos" && proveedorActivo(proveedor)) ||
        (filtroEstadoProveedores === "inactivos" && !proveedorActivo(proveedor));
      const coincideTexto =
        textoBusqueda === "" ||
        normalizarTexto(proveedor.nombre).includes(textoBusqueda) ||
        normalizarTexto(proveedor.telefono || "").includes(textoBusqueda) ||
        normalizarTexto(proveedor.contacto || "").includes(textoBusqueda) ||
        normalizarTexto(proveedor.observacion || "").includes(textoBusqueda);

      return coincideEstado && coincideTexto;
    }).sort(function (primero, segundo) {
      return primero.codigo - segundo.codigo;
    });

  const proveedoresActivos =
    proveedores.filter(proveedorActivo).length;

  const productosAsignados =
    productos.filter(function (producto) {
      return producto.proveedor && producto.proveedor !== "Sin proveedor";
    }).length;

  dom.proveedoresActivosResumen.textContent = proveedoresActivos;
  dom.proveedoresProductosResumen.textContent = productosAsignados;
  dom.proveedoresSinAsignarResumen.textContent = productos.length - productosAsignados;

  renderizarOpcionesProveedoresActivos();

  if (proveedoresFiltrados.length === 0) {
    dom.proveedoresTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          No hay proveedores para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  dom.proveedoresTable.innerHTML =
    proveedoresFiltrados.map(function (proveedor) {
      const estadoTexto = proveedorActivo(proveedor) ? "Activo" : "Inactivo";
      const estadoClase = proveedorActivo(proveedor) ? "stock-ok" : "stock-inactive";
      const accionEstado = proveedorActivo(proveedor) ? "Desactivar" : "Activar";

      return `
        <tr>
          <td>${escaparTextoHtml(proveedor.codigo)}</td>
          <td>${escaparTextoHtml(proveedor.nombre)}</td>
          <td>${escaparTextoHtml(proveedor.telefono || "-")}</td>
          <td>${escaparTextoHtml(proveedor.contacto || "-")}</td>
          <td>${contarProductosPorProveedor(proveedor.nombre)}</td>
          <td>
            <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="editarProveedor(${proveedor.codigo})">
              Editar
            </button>
            <button class="btn btn-secondary" onclick="cambiarEstadoProveedor(${proveedor.codigo})">
              ${accionEstado}
            </button>
            <button class="btn btn-danger" onclick="eliminarProveedor(${proveedor.codigo})">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join("");
}

function limpiarFormularioProveedor() {
  proveedorEditando = null;
  dom.proveedorForm.reset();
  dom.proveedorSubmitButton.textContent = "Agregar proveedor";
  dom.cancelarEdicionProveedorButton.classList.add("hidden");
}

function obtenerSiguienteCodigoProveedorPago() {
  if (!Array.isArray(proveedorPagos) || proveedorPagos.length === 0) {
    return 1;
  }

  return Math.max.apply(null, proveedorPagos.map(function (pago) {
    return Number(pago.codigo) || 0;
  })) + 1;
}

function mostrarSeccionProveedores(seccion) {
  const seccionActual =
    seccion || "listado";

  document.querySelectorAll("[data-provider-section]").forEach(function (boton) {
    boton.classList.toggle("active", boton.dataset.providerSection === seccionActual);
  });

  document.querySelector("#proveedoresListadoBloque").classList.toggle("hidden", seccionActual !== "listado");
  document.querySelector("#proveedoresPagoBloque").classList.toggle("hidden", seccionActual !== "pago");
  document.querySelector("#proveedoresHistorialBloque").classList.toggle("hidden", seccionActual !== "historial");

  if (seccionActual === "listado") {
    renderizarProveedores();
  }

  if (seccionActual === "pago") {
    actualizarVistaPagoProveedor();
    dom.proveedorPagoNombreInput.focus();
  }

  if (seccionActual === "historial") {
    renderizarPagosProveedores();
  }
}

function obtenerProveedorPagoSeleccionado() {
  const texto =
    normalizarTexto(dom.proveedorPagoNombreInput.value || "");

  return proveedores.find(function (proveedor) {
    return normalizarTexto(proveedor.nombre) === texto ||
      String(proveedor.codigo) === dom.proveedorPagoNombreInput.value.trim();
  });
}

function obtenerMedioPagoProveedorActual() {
  const medioSeleccionado =
    dom.proveedorPagoMedioInput.value || "EFECTIVO";

  if (medioSeleccionado !== "OTRO") {
    return medioSeleccionado;
  }

  return dom.proveedorPagoMedioOtroInput.value.trim();
}

function actualizarVistaMedioPagoProveedor() {
  const usaOtroMedio =
    dom.proveedorPagoMedioInput &&
    dom.proveedorPagoMedioInput.value === "OTRO";

  if (dom.proveedorPagoMedioOtroLabel) {
    dom.proveedorPagoMedioOtroLabel.classList.toggle("hidden", !usaOtroMedio);
  }

  if (!usaOtroMedio && dom.proveedorPagoMedioOtroInput) {
    dom.proveedorPagoMedioOtroInput.value = "";
  }
}

function actualizarVistaPagoProveedor() {
  if (!dom.proveedorPagoPreview) {
    return;
  }

  actualizarVistaMedioPagoProveedor();

  const proveedor =
    obtenerProveedorPagoSeleccionado();
  const importe =
    Number(dom.proveedorPagoImporteInput.value) || 0;
  const medioPago =
    obtenerMedioPagoProveedorActual() || "Sin definir";

  if (!proveedor) {
    dom.proveedorPagoPreview.textContent =
      "Elegi un proveedor para registrar el pago.";
    return;
  }

  dom.proveedorPagoPreview.innerHTML = `
    <b>${escaparTextoHtml(proveedor.nombre)}</b><br>
    Importe a registrar: <b>${formatearDinero(importe)}</b><br>
    Medio: ${escaparTextoHtml(medioPago)}
  `;
}

function registrarPagoProveedor(event) {
  event.preventDefault();

  if (!tienePermiso("proveedores")) {
    alert("Tu rol no tiene permiso para registrar pagos de proveedores.");
    return;
  }

  const proveedor =
    obtenerProveedorPagoSeleccionado();
  const importe =
    Number(dom.proveedorPagoImporteInput.value) || 0;

  if (!proveedor) {
    alert("Seleccione un proveedor valido.");
    return;
  }

  if (importe <= 0) {
    alert("Ingrese un importe mayor a cero.");
    return;
  }

  const medioPago =
    obtenerMedioPagoProveedorActual();

  if (!medioPago) {
    alert("Ingrese el medio de pago.");
    return;
  }

  const pago = {
    codigo: obtenerSiguienteCodigoProveedorPago(),
    proveedor: proveedor.nombre,
    importe: importe,
    medio: medioPago,
    comprobante: dom.proveedorPagoComprobanteInput.value.trim() || "-",
    observacion: dom.proveedorPagoObservacionInput.value.trim() || "-",
    fecha: new Date().toLocaleDateString("es-AR"),
    fechaIso: new Date().toISOString()
  };

  proveedorPagos.unshift(pago);
  guardarProveedorPagos();
  guardarProveedorPagoOperacionSupabase(pago);
  dom.proveedorPagoForm.reset();
  actualizarVistaMedioPagoProveedor();
  dom.proveedorPagoPreview.innerHTML = `
    <strong>Pago registrado: ${escaparTextoHtml(pago.proveedor)}</strong>
    <span>${escaparTextoHtml(pago.fecha)} | ${escaparTextoHtml(pago.medio)} | ${escaparTextoHtml(pago.comprobante)}</span>
    <b>${formatearDinero(pago.importe)}</b>
    <button class="secondary-button" type="button" onclick="imprimirComprobantePagoProveedor(${pago.codigo})">
      Imprimir comprobante
    </button>
  `;
  renderizarPagosProveedores();

  registrarAuditoria(
    "Proveedores",
    "Registro pago",
    pago.proveedor + " | " + formatearDinero(pago.importe) + " | " + pago.medio
  );
}

function obtenerFechaPagoProveedorParaFiltro(pago) {
  if (!pago) {
    return "";
  }

  if (pago.fechaIso) {
    return String(pago.fechaIso).slice(0, 10);
  }

  if (pago.fecha && pago.fecha.includes("/")) {
    const partes = pago.fecha.split("/");
    const dia = String(partes[0] || "1").padStart(2, "0");
    const mes = String(partes[1] || "1").padStart(2, "0");
    const anio = partes[2] || new Date().getFullYear();
    return anio + "-" + mes + "-" + dia;
  }

  return "";
}

function obtenerPagosProveedoresFiltrados() {
  const texto =
    normalizarTexto(dom.buscarProveedorPagoInput ? dom.buscarProveedorPagoInput.value : "");
  const fechaDesde =
    dom.proveedorPagoFechaDesdeFiltro ? dom.proveedorPagoFechaDesdeFiltro.value : "";
  const fechaHasta =
    dom.proveedorPagoFechaHastaFiltro ? dom.proveedorPagoFechaHastaFiltro.value : "";
  const medio =
    dom.proveedorPagoMedioFiltro ? dom.proveedorPagoMedioFiltro.value : "TODOS";

  return proveedorPagos.filter(function (pago) {
    const textoPago =
      [pago.fecha, pago.proveedor, pago.medio, pago.comprobante, pago.observacion].join(" ");
    const fechaPago =
      obtenerFechaPagoProveedorParaFiltro(pago);
    const coincideTexto =
      texto === "" || normalizarTexto(textoPago).includes(texto);
    const coincideDesde =
      !fechaDesde || (fechaPago && fechaPago >= fechaDesde);
    const coincideHasta =
      !fechaHasta || (fechaPago && fechaPago <= fechaHasta);
    const coincideMedio =
      medio === "TODOS" || pago.medio === medio;

    return coincideTexto && coincideDesde && coincideHasta && coincideMedio;
  });
}

function renderizarPagosProveedores() {
  if (!dom.proveedoresPagosTable) {
    return;
  }

  const pagos =
    obtenerPagosProveedoresFiltrados();
  const total =
    pagos.reduce(function (suma, pago) {
      return suma + (Number(pago.importe) || 0);
    }, 0);
  const proveedoresPagados =
    new Set(pagos.map(function (pago) {
      return pago.proveedor;
    })).size;

  dom.proveedoresPagosTotalResumen.textContent = pagos.length;
  dom.proveedoresPagosImporteResumen.textContent = formatearDinero(total);
  dom.proveedoresPagosProveedoresResumen.textContent = proveedoresPagados;

  if (pagos.length === 0) {
    dom.proveedoresPagosTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">No hay pagos de proveedores para mostrar.</td>
      </tr>
    `;
    return;
  }

  dom.proveedoresPagosTable.innerHTML =
    pagos.map(function (pago) {
      return `
        <tr>
          <td>${escaparTextoHtml(pago.fecha)}</td>
          <td>${escaparTextoHtml(pago.proveedor)}</td>
          <td>${escaparTextoHtml(pago.medio)}</td>
          <td>${escaparTextoHtml(pago.comprobante || "-")}</td>
          <td>${formatearDinero(pago.importe)}</td>
          <td>${escaparTextoHtml(pago.observacion || "-")}</td>
          <td>
            <button class="btn btn-secondary" onclick="imprimirComprobantePagoProveedor(${pago.codigo})">
              Imprimir
            </button>
          </td>
        </tr>
      `;
    }).join("");
}

function imprimirComprobantePagoProveedor(codigoPago) {
  const pago =
    proveedorPagos.find(function (pagoGuardado) {
      return pagoGuardado.codigo === codigoPago;
    });

  if (!pago) {
    alert("No se encontro el pago.");
    return;
  }

  const ventana =
    window.open("", "_blank", "width=420,height=650");

  if (!ventana) {
    alert("No se pudo abrir la impresion. Revise el bloqueo de ventanas emergentes.");
    return;
  }

  ventana.document.write(`
    <html>
      <head>
        <title>Comprobante pago proveedor</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 20px; }
          .ticket { border: 1px solid #cbd5e1; padding: 18px; max-width: 360px; }
          h1 { font-size: 18px; margin: 0 0 4px; }
          h2 { font-size: 14px; margin: 0 0 18px; color: #475569; }
          .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
          .row span { color: #64748b; }
          .total { font-size: 22px; font-weight: 800; }
          .firma { margin-top: 44px; border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>${escaparTextoHtml(CONFIG.empresa || "LV Sistema")}</h1>
          <h2>Comprobante de pago a proveedor</h2>
          <div class="row"><span>Nro.</span><strong>${escaparTextoHtml(pago.codigo)}</strong></div>
          <div class="row"><span>Fecha</span><strong>${escaparTextoHtml(pago.fecha)}</strong></div>
          <div class="row"><span>Proveedor</span><strong>${escaparTextoHtml(pago.proveedor)}</strong></div>
          <div class="row"><span>Medio</span><strong>${escaparTextoHtml(pago.medio)}</strong></div>
          <div class="row"><span>Comprobante</span><strong>${escaparTextoHtml(pago.comprobante || "-")}</strong></div>
          <div class="row"><span>Observacion</span><strong>${escaparTextoHtml(pago.observacion || "-")}</strong></div>
          <div class="row"><span>Total pagado</span><strong class="total">${formatearDinero(pago.importe)}</strong></div>
          <div class="firma">Firma y aclaracion proveedor</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  ventana.document.close();
}

function agregarProveedor(event) {
  event.preventDefault();

  if (!tienePermiso("proveedores")) {
    alert("Tu rol no tiene permiso para modificar proveedores.");
    return;
  }

  const nombre =
    dom.proveedorNombreInput.value.trim();

  if (nombre === "") {
    alert("El nombre del proveedor es obligatorio.");
    return;
  }

  const existeProveedor =
    proveedores.some(function (proveedor) {
      return normalizarTexto(proveedor.nombre) === normalizarTexto(nombre) &&
        proveedor.codigo !== proveedorEditando;
    });

  if (existeProveedor) {
    alert("Ya existe un proveedor con ese nombre.");
    return;
  }

  if (proveedorEditando !== null) {
    const proveedor =
      proveedores.find(function (proveedorGuardado) {
        return proveedorGuardado.codigo === proveedorEditando;
      });

    if (!proveedor) {
      limpiarFormularioProveedor();
      return;
    }

    const nombreAnterior =
      proveedor.nombre;

    proveedor.nombre = nombre;
    proveedor.telefono = dom.proveedorTelefonoInput.value.trim() || "-";
    proveedor.contacto = dom.proveedorContactoInput.value.trim() || "-";
    proveedor.observacion = dom.proveedorObservacionInput.value.trim() || "-";

    productos.forEach(function (producto) {
      if (normalizarTexto(producto.proveedor || "") === normalizarTexto(nombreAnterior)) {
        producto.proveedor = proveedor.nombre;
      }
    });

    guardarProveedores();
    guardarProductos();
    guardarProveedorOperacionSupabase(proveedor);
    limpiarFormularioProveedor();
    renderizarProveedores();
    renderizarProductos();

    registrarAuditoria(
      "Proveedores",
      "Edito proveedor",
      nombreAnterior + " > " + proveedor.nombre
    );
    return;
  }

  const nuevoProveedor = {
    codigo: obtenerSiguienteCodigoProveedor(),
    nombre: nombre,
    telefono: dom.proveedorTelefonoInput.value.trim() || "-",
    contacto: dom.proveedorContactoInput.value.trim() || "-",
    observacion: dom.proveedorObservacionInput.value.trim() || "-",
    activo: true
  };

  proveedores.push(nuevoProveedor);
  guardarProveedores();
  guardarProveedorOperacionSupabase(nuevoProveedor);
  limpiarFormularioProveedor();
  renderizarProveedores();

  registrarAuditoria(
    "Proveedores",
    "Creo proveedor",
    nuevoProveedor.codigo + " - " + nuevoProveedor.nombre
  );
}

function editarProveedor(codigo) {
  if (!tienePermiso("proveedores")) {
    alert("Tu rol no tiene permiso para editar proveedores.");
    return;
  }

  const proveedor =
    proveedores.find(function (proveedorGuardado) {
      return proveedorGuardado.codigo === codigo;
    });

  if (!proveedor) {
    return;
  }

  proveedorEditando = codigo;
  dom.proveedorNombreInput.value = proveedor.nombre || "";
  dom.proveedorTelefonoInput.value = proveedor.telefono || "";
  dom.proveedorContactoInput.value = proveedor.contacto || "";
  dom.proveedorObservacionInput.value = proveedor.observacion || "";
  dom.proveedorSubmitButton.textContent = "Guardar proveedor";
  dom.cancelarEdicionProveedorButton.classList.remove("hidden");
  dom.proveedorNombreInput.focus();
}

function cambiarEstadoProveedor(codigo) {
  if (!tienePermiso("proveedores")) {
    alert("Tu rol no tiene permiso para modificar proveedores.");
    return;
  }

  const proveedor =
    proveedores.find(function (proveedorGuardado) {
      return proveedorGuardado.codigo === codigo;
    });

  if (!proveedor) {
    return;
  }

  proveedor.activo = !proveedorActivo(proveedor);

  guardarProveedores();
  guardarProveedorOperacionSupabase(proveedor);
  renderizarProveedores();

  registrarAuditoria(
    "Proveedores",
    proveedor.activo ? "Activo proveedor" : "Desactivo proveedor",
    proveedor.codigo + " - " + proveedor.nombre
  );
}

function eliminarProveedor(codigo) {
  if (!tienePermiso("proveedores")) {
    alert("Tu rol no tiene permiso para eliminar proveedores.");
    return;
  }

  const proveedor =
    proveedores.find(function (proveedorGuardado) {
      return proveedorGuardado.codigo === codigo;
    });

  if (!proveedor) {
    return;
  }

  const productosDelProveedor =
    contarProductosPorProveedor(proveedor.nombre);

  if (productosDelProveedor > 0) {
    alert("No se puede eliminar un proveedor con productos asignados. Desactivalo si no lo queres usar mas.");
    return;
  }

  const confirmar =
    confirm("Eliminar proveedor " + proveedor.nombre + "?");

  if (!confirmar) {
    return;
  }

  proveedores =
    proveedores.filter(function (proveedorGuardado) {
      return proveedorGuardado.codigo !== codigo;
    });

  guardarProveedores();
  eliminarProveedorOperacionSupabase(proveedor);
  renderizarProveedores();

  registrarAuditoria(
    "Proveedores",
    "Elimino proveedor",
    proveedor.codigo + " - " + proveedor.nombre
  );
}
