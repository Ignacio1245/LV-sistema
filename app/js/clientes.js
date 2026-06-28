let filtroEstadoClientes = "activos";
let clienteEditando = null;

function clienteActivo(cliente) {
  return cliente.activo !== false;
}

function obtenerSiguienteCodigoCliente() {
  if (clientes.length === 0) {
    return 1;
  }

  const codigos =
    clientes.map(function (cliente) {
      return Number(cliente.codigo) || 0;
    });

  return Math.max.apply(null, codigos) + 1;
}

function completarSiguienteCodigoCliente() {
  if (!dom.clientCodeInput || dom.clientCodeInput.value !== "") {
    return;
  }

  dom.clientCodeInput.value = obtenerSiguienteCodigoCliente();
}

function cambiarFiltroEstadoClientes(filtroNuevo) {
  filtroEstadoClientes = filtroNuevo;

  document.querySelectorAll("[data-client-status-filter]").forEach(function (boton) {
    boton.classList.toggle(
      "active",
      boton.dataset.clientStatusFilter === filtroNuevo
    );
  });

  renderizarClientes();
}

function obtenerDatosComercialesClienteDesdeFormulario() {
  return {
    razonSocial: dom.clientRazonSocialInput.value.trim(),
    nombreFantasia: dom.clientNombreFantasiaInput.value.trim(),
    localidad: dom.clientLocalidadInput.value.trim(),
    codigoPostal: dom.clientCodigoPostalInput.value.trim(),
    telefonoParticular: dom.clientTelefonoParticularInput.value.trim(),
    telefonoMovil: dom.clientTelefonoMovilInput.value.trim(),
    email: dom.clientEmailInput.value.trim(),
    listaPrecios: dom.clientListaPreciosInput.value.trim(),
    posicionZona: Number(dom.clientPosicionZonaInput.value) || 0,
    vendedorAsignado: dom.clientVendedorAsignadoInput.value,
    condicionIva: dom.clientCondicionIvaInput.value,
    horarioAtencion: dom.clientHorarioAtencionInput.value.trim(),
    observaciones: dom.clientObservacionesInput.value.trim()
  };
}

function agregarCliente(event) {
  event.preventDefault();

  if (!tienePermiso("clientes")) {
    alert("Tu rol no tiene permiso para modificar clientes.");
    return;
  }

  const codigo = Number(dom.clientCodeInput.value);
  const nombre = dom.clientNameInput.value.trim();
  const telefono = dom.clientPhoneInput.value.trim() || "-";
  const direccion = dom.clientAddressInput.value.trim() || "-";
  const zona = dom.clientZoneInput.value;

  if (!Number.isInteger(codigo) || codigo <= 0) {
    alert("El codigo del cliente debe ser un numero entero mayor a 0.");
    return;
  }

  if (nombre === "") {
    alert("El nombre del cliente es obligatorio.");
    return;
  }

  if (zona === "") {
    alert("Seleccione una zona creada.");
    return;
  }

  const codigoRepetido = clientes.some(function (cliente) {
    return cliente.codigo === codigo &&
      cliente.codigo !== clienteEditando;
  });

  if (codigoRepetido) {
    alert("Ya existe un cliente con ese codigo.");
    return;
  }

  if (clienteEditando !== null) {
    const clienteActual =
      clientes.find(function (cliente) {
        return cliente.codigo === clienteEditando;
      });

    if (!clienteActual) {
      alert("No se encontro el cliente para editar.");
      clienteEditando = null;
      return;
    }

    const codigoAnterior =
      clienteActual.codigo;

    clienteActual.codigo = codigo;
    clienteActual.nombre = nombre;
    clienteActual.telefono = telefono;
    clienteActual.direccion = direccion;
    clienteActual.zona = zona;
    Object.assign(clienteActual, obtenerDatosComercialesClienteDesdeFormulario());

    pedidos.forEach(function (pedido) {
      if (pedido.cliente && pedido.cliente.codigo === codigoAnterior) {
        pedido.cliente = {
          ...pedido.cliente,
          codigo: codigo,
          nombre: nombre,
          telefono: telefono,
          direccion: direccion,
          zona: zona
        };
      }
    });

    clienteEditando = null;
    dom.clientForm.reset();
    dom.clientSubmitButton.textContent = "Agregar cliente";
    completarSiguienteCodigoCliente();
    dom.clientCodeInput.focus();
    renderizarClientes();
    renderizarClientesConDeuda();
    renderizarZonas();
    actualizarDashboard();
    guardarClientes();
    guardarPedidos();
    guardarClienteOperacionSupabase(clienteActual);

    registrarAuditoria(
      "Clientes",
      "Edito cliente",
      codigoAnterior + " > " + codigo + " - " + nombre
    );

    return;
  }

  const clienteNuevo = {
    codigo: codigo,
    nombre: nombre,
    saldo: 0,
    telefono: telefono,
    direccion: direccion,
    zona: zona,
    activo: true,
    historial: [],
    ...obtenerDatosComercialesClienteDesdeFormulario()
  };

  clientes.push(clienteNuevo);

  dom.clientForm.reset();
  completarSiguienteCodigoCliente();
  dom.clientCodeInput.focus();
  renderizarClientes();
  renderizarZonas();
  actualizarDashboard();
  guardarClientes();
  guardarClienteOperacionSupabase(clienteNuevo);
}

function datosClienteValidos(codigo, nombre) {
  return Number.isInteger(codigo) &&
    codigo > 0 &&
    nombre !== "";
}

function actualizarEstadoImportacionClientes(mensaje, tipo) {
  if (!dom.clientesImportacionEstado) {
    return;
  }

  dom.clientesImportacionEstado.textContent = mensaje;
  dom.clientesImportacionEstado.classList.remove("sync-ok", "sync-error", "sync-working");

  if (tipo) {
    dom.clientesImportacionEstado.classList.add(tipo);
  }
}

function crearMapaColumnasClientesImportacion(encabezados) {
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
    codigo: buscarColumnas(["codigo", "cod", "codcliente", "codref"]),
    nombre: buscarColumnas(["nombre", "cliente", "razonsocial", "fantasia"]),
    telefono: buscarColumnas(["telefono", "tel", "celular", "movil"]),
    direccion: buscarColumnas(["direccion", "domicilio"]),
    zona: buscarColumnas(["zona"]),
    saldo: buscarColumnas(["saldo", "deuda", "cuentacorriente", "ctacte"]),
    listaPrecios: buscarColumnas(["lista", "listaprecios", "listadeprecios"]),
    vendedorAsignado: buscarColumnas(["vendedor", "vendedorasignado"]),
    observaciones: buscarColumnas(["observaciones", "observacion", "notas"]),
    horarioAtencion: buscarColumnas(["horario", "horarioatencion"]),
    email: buscarColumnas(["email", "mail"]),
    localidad: buscarColumnas(["localidad"]),
    nombreFantasia: buscarColumnas(["nombrefantasia", "fantasia"]),
    razonSocial: buscarColumnas(["razonsocial", "firma"])
  };
}

function obtenerValorClienteImportacion(columnas, mapa, nombre, indiceAlternativo) {
  const indice =
    mapa && mapa[nombre] >= 0 ? mapa[nombre] : indiceAlternativo;

  if (indice < 0 || indice >= columnas.length) {
    return "";
  }

  return limpiarValorImportacion(columnas[indice]);
}

function crearHistorialSaldoInicialCliente(saldoInicial) {
  if (saldoInicial === 0) {
    return [];
  }

  return [
    {
      fecha: new Date().toLocaleDateString("es-AR"),
      tipo: "Saldo inicial importado",
      importe: saldoInicial
    }
  ];
}

function importarClientesDesdeTextoPlano(texto) {
  const textoLimpio =
    texto.trim();

  if (textoLimpio === "") {
    actualizarEstadoImportacionClientes("Pegue clientes o seleccione un archivo CSV.", "sync-error");
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
    tieneEncabezado ? crearMapaColumnasClientesImportacion(primeraLinea) : null;
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

    const codigo = Number(obtenerValorClienteImportacion(columnas, mapaColumnas, "codigo", 0));
    const nombre = obtenerValorClienteImportacion(columnas, mapaColumnas, "nombre", 1);
    const telefono = obtenerValorClienteImportacion(columnas, mapaColumnas, "telefono", 2) || "-";
    const direccion = obtenerValorClienteImportacion(columnas, mapaColumnas, "direccion", 3) || "-";
    const zona = asegurarZonaPorNombre(
      obtenerValorClienteImportacion(columnas, mapaColumnas, "zona", 4) || "Sin zona"
    );
    const saldoInicial =
      obtenerNumeroImportacion(
        obtenerValorClienteImportacion(columnas, mapaColumnas, "saldo", 5),
        0
      );
    const datosComerciales = {
      razonSocial: obtenerValorClienteImportacion(columnas, mapaColumnas, "razonSocial", -1),
      nombreFantasia: obtenerValorClienteImportacion(columnas, mapaColumnas, "nombreFantasia", -1),
      localidad: obtenerValorClienteImportacion(columnas, mapaColumnas, "localidad", -1),
      codigoPostal: "",
      telefonoParticular: "",
      telefonoMovil: "",
      email: obtenerValorClienteImportacion(columnas, mapaColumnas, "email", -1),
      listaPrecios: obtenerValorClienteImportacion(columnas, mapaColumnas, "listaPrecios", -1),
      posicionZona: 0,
      vendedorAsignado: obtenerValorClienteImportacion(columnas, mapaColumnas, "vendedorAsignado", -1),
      condicionIva: "",
      horarioAtencion: obtenerValorClienteImportacion(columnas, mapaColumnas, "horarioAtencion", -1),
      observaciones: obtenerValorClienteImportacion(columnas, mapaColumnas, "observaciones", -1)
    };

    if (!datosClienteValidos(codigo, nombre)) {
      errores += 1;
      return;
    }

    const clienteExistente =
      clientes.find(function (cliente) {
        return cliente.codigo === codigo;
      });

    if (clienteExistente) {
      const saldoAnterior =
        Number(clienteExistente.saldo) || 0;
      clienteExistente.nombre = nombre;
      clienteExistente.telefono = telefono;
      clienteExistente.direccion = direccion;
      clienteExistente.zona = zona;
      clienteExistente.saldo = saldoInicial;
      Object.assign(clienteExistente, datosComerciales);

      if (typeof clienteExistente.activo !== "boolean") {
        clienteExistente.activo = true;
      }

      if (!Array.isArray(clienteExistente.historial)) {
        clienteExistente.historial = [];
      }

      if (saldoAnterior !== saldoInicial) {
        clienteExistente.historial.push({
          fecha: new Date().toLocaleDateString("es-AR"),
          tipo: "Ajuste de saldo por importacion",
          importe: saldoInicial - saldoAnterior
        });
      }
      actualizados += 1;
      return;
    }

    clientes.push({
      codigo: codigo,
      nombre: nombre,
      saldo: saldoInicial,
      telefono: telefono,
      direccion: direccion,
      zona: zona,
      activo: true,
      historial: crearHistorialSaldoInicialCliente(saldoInicial),
      ...datosComerciales
    });

    creados += 1;
  });
  });

  dom.clientesImportacionTexto.value = "";
  if (dom.clientesImportacionArchivo) {
    dom.clientesImportacionArchivo.value = "";
  }

  completarSiguienteCodigoCliente();
  renderizarClientes();
  renderizarZonas();
  renderizarClientesConDeuda();
  actualizarDashboard();
  ejecutarSinProgramarSincronizacion(function () {
    guardarClientes();
  });
  programarSincronizacionAutomatica("clientes");

  actualizarEstadoImportacionClientes(
    "Importacion local terminada. Creados: " + creados +
    " | Actualizados: " + actualizados +
    " | Errores: " + errores +
    " | Sincronizacion online programada.",
    errores > 0 ? "sync-error" : "sync-ok"
  );
}

async function importarClientesDesdeTexto() {
  if (!tienePermiso("clientes")) {
    alert("Tu rol no tiene permiso para importar clientes.");
    return;
  }

  try {
    actualizarEstadoImportacionClientes("Leyendo clientes para importar...", "sync-working");

    const archivo =
      dom.clientesImportacionArchivo &&
      dom.clientesImportacionArchivo.files &&
      dom.clientesImportacionArchivo.files.length > 0
        ? dom.clientesImportacionArchivo.files[0]
        : null;
    const texto =
      archivo
        ? await leerArchivoProductosComoTexto(archivo)
        : dom.clientesImportacionTexto.value;

    importarClientesDesdeTextoPlano(texto);
  } catch (error) {
    console.error("Error importando clientes:", error);
    actualizarEstadoImportacionClientes(error.message || "No se pudo importar clientes.", "sync-error");
  }
}

function seleccionarCliente(cliente) {
  if (!clienteActivo(cliente)) {
    alert("Este cliente esta inactivo. Activelo antes de cargarle un pedido.");
    return;
  }

  clienteSeleccionado = cliente;
  dom.clienteSearchInput.value = cliente.codigo + " - " + cliente.nombre;
  dom.clienteSearchResults.classList.add("hidden");
  actualizarVistaBusqueda();
  actualizarClientePedidoSeleccionado();
  renderizarCatalogoProductosPedido();

  if (dom.productoSearchInput) {
    dom.productoSearchInput.focus();
  }
}

function obtenerClientesFiltrados() {
  const textoBusqueda =
    dom.buscarClienteTabla
      ? dom.buscarClienteTabla.value.trim().toLowerCase()
      : "";

  return clientes.filter(function (cliente) {
    const coincideEstado =
      filtroEstadoClientes === "todos" ||
      (filtroEstadoClientes === "activos" && clienteActivo(cliente)) ||
      (filtroEstadoClientes === "inactivos" && !clienteActivo(cliente));

    const coincideBusqueda =
      textoBusqueda === "" ||
      String(cliente.codigo).includes(textoBusqueda) ||
      normalizarTexto(cliente.nombre).includes(textoBusqueda) ||
      normalizarTexto(cliente.razonSocial || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.nombreFantasia || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.email || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.vendedorAsignado || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.telefono || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.telefonoMovil || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.direccion || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.zona || "").includes(textoBusqueda);

    return coincideEstado && coincideBusqueda;
  }).sort(function (primero, segundo) {
      return primero.codigo - segundo.codigo;
    });
}

function renderizarClientes() {
  dom.clientsTable.innerHTML = "";

  const clientesActivosCantidad =
    clientes.filter(function (cliente) {
      return clienteActivo(cliente);
    }).length;

  if (dom.clientesActivosResumen) {
    dom.clientesActivosResumen.textContent = clientesActivosCantidad;
    dom.clientesInactivosResumen.textContent = clientes.length - clientesActivosCantidad;
    dom.clientesTotalResumen.textContent = clientes.length;
  }

  const clientesFiltrados = obtenerClientesFiltrados();

  if (clientesFiltrados.length === 0) {
    if (dom.clientesResultadoContador) {
      dom.clientesResultadoContador.textContent = "Clientes | 0 en total";
    }

    dom.clientsTable.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          No hay clientes para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  if (dom.clientesResultadoContador) {
    dom.clientesResultadoContador.textContent =
      clientesFiltrados.length === 1
        ? "Clientes | 1 en total"
        : "Clientes | " + clientesFiltrados.length + " en total";
  }

  clientesFiltrados.forEach(function (cliente) {
    const row = document.createElement("tr");
    const estadoTexto = clienteActivo(cliente) ? "Activo" : "Inactivo";
    const estadoClase = clienteActivo(cliente) ? "stock-ok" : "stock-inactive";
    const accionEstado = clienteActivo(cliente) ? "Desactivar" : "Activar";

    row.innerHTML = `
      <td>${cliente.codigo}</td>
      <td>
        <strong>${cliente.nombre}</strong>
        <small>${cliente.razonSocial || cliente.nombreFantasia || "-"}</small>
      </td>
      <td>${cliente.telefono}<br><small>${cliente.telefonoMovil || cliente.email || "-"}</small></td>
      <td>${cliente.direccion}<br><small>${cliente.localidad || "-"}</small></td>
      <td>${cliente.zona || "Sin zona"}</td>
      <td>
        <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
      </td>
      <td>
        <button class="btn btn-secondary" onclick="editarCliente(${cliente.codigo})">
          Editar
        </button>
        <button class="btn btn-secondary" onclick="cambiarEstadoCliente(${cliente.codigo})">
          ${accionEstado}
        </button>
        <button class="btn btn-danger" onclick="eliminarCliente(${cliente.codigo})">
          Eliminar
        </button>
      </td>
    `;

    dom.clientsTable.appendChild(row);
  });
}

function exportarClientesCsv() {
  const clientesFiltrados = obtenerClientesFiltrados();

  if (clientesFiltrados.length === 0) {
    alert("No hay clientes para exportar con los filtros actuales.");
    return;
  }

  const filas = clientesFiltrados.map(function (cliente) {
    return [
      cliente.codigo,
      cliente.nombre || "",
      cliente.razonSocial || "",
      cliente.nombreFantasia || "",
      cliente.telefono || "",
      cliente.telefonoMovil || "",
      cliente.email || "",
      cliente.direccion || "",
      cliente.localidad || "",
      cliente.zona || "",
      cliente.listaPrecios || "",
      cliente.vendedorAsignado || "",
      formatearMoneda(cliente.saldo || 0),
      clienteActivo(cliente) ? "Activo" : "Inactivo",
      cliente.horarioAtencion || "",
      cliente.observaciones || ""
    ];
  });

  descargarCsv(
    "clientes.csv",
    [
      "Codigo",
      "Nombre",
      "Razon social",
      "Nombre fantasia",
      "Telefono",
      "Celular",
      "Email",
      "Direccion",
      "Localidad",
      "Zona",
      "Lista",
      "Vendedor",
      "Saldo",
      "Estado",
      "Horario atencion",
      "Observaciones"
    ],
    filas
  );
}

function mostrarResultadosCliente() {
  const clientesActivos =
    clientes.filter(function (cliente) {
      return clienteActivo(cliente);
    });

  const resultados = buscarCoincidencias(clientesActivos, dom.clienteSearchInput.value);

  if (dom.clienteSearchInput.value.trim() === "") {
    dom.clienteSearchResults.classList.add("hidden");
    return;
  }

  renderizarResultados(dom.clienteSearchResults, resultados, "cliente");
}

function cambiarEstadoCliente(codigo) {
  if (!tienePermiso("clientes")) {
    alert("Tu rol no tiene permiso para modificar clientes.");
    return;
  }

  const cliente =
    clientes.find(function (clienteGuardado) {
      return clienteGuardado.codigo === codigo;
    });

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  cliente.activo = !clienteActivo(cliente);

  if (
    clienteSeleccionado &&
    clienteSeleccionado.codigo === cliente.codigo &&
    !clienteActivo(cliente)
  ) {
    limpiarPedidoActual();
    pedidoEditando = null;
    clienteSeleccionado = null;
    dom.clienteSearchInput.value = "";
    actualizarClientePedidoSeleccionado();
    limpiarFormularioPedido();
    renderizarPedidoActual();
  }

  guardarClientes();
  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();
  actualizarVistaBusqueda();
  guardarClienteOperacionSupabase(cliente);

  registrarAuditoria(
    "Clientes",
    clienteActivo(cliente) ? "Activo cliente" : "Desactivo cliente",
    cliente.codigo + " - " + cliente.nombre
  );
}

function editarCliente(codigo) {
  if (!tienePermiso("clientes")) {
    alert("Tu rol no tiene permiso para editar clientes.");
    return;
  }

  const cliente =
    clientes.find(function (clienteGuardado) {
      return clienteGuardado.codigo === codigo;
    });

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  clienteEditando = codigo;
  mostrarSeccionCliente("alta");

  dom.clientCodeInput.value = cliente.codigo;
  dom.clientNameInput.value = cliente.nombre || "";
  dom.clientPhoneInput.value = cliente.telefono || "";
  dom.clientAddressInput.value = cliente.direccion || "";
  dom.clientZoneInput.value = cliente.zona || "";
  dom.clientRazonSocialInput.value = cliente.razonSocial || "";
  dom.clientNombreFantasiaInput.value = cliente.nombreFantasia || "";
  dom.clientLocalidadInput.value = cliente.localidad || "";
  dom.clientCodigoPostalInput.value = cliente.codigoPostal || "";
  dom.clientTelefonoParticularInput.value = cliente.telefonoParticular || "";
  dom.clientTelefonoMovilInput.value = cliente.telefonoMovil || "";
  dom.clientEmailInput.value = cliente.email || "";
  dom.clientListaPreciosInput.value = cliente.listaPrecios || "";
  dom.clientPosicionZonaInput.value = cliente.posicionZona || "";
  dom.clientVendedorAsignadoInput.value = cliente.vendedorAsignado || "";
  dom.clientCondicionIvaInput.value = cliente.condicionIva || "";
  dom.clientHorarioAtencionInput.value = cliente.horarioAtencion || "";
  dom.clientObservacionesInput.value = cliente.observaciones || "";

  dom.clientSubmitButton.textContent = "Guardar cambios";
  dom.clientNameInput.focus();
}

function eliminarCliente(codigo) {
  if (!tienePermiso("clientes")) {
    alert("Tu rol no tiene permiso para eliminar clientes.");
    return;
  }

  const cliente =
    clientes.find(function (clienteGuardado) {
      return clienteGuardado.codigo === codigo;
    });

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  const confirmar =
    confirm("Eliminar cliente " + cliente.codigo + " - " + cliente.nombre + "?");

  if (!confirmar) {
    return;
  }

  const tienePedidos =
    pedidos.some(function (pedido) {
      return pedido.cliente && pedido.cliente.codigo === codigo;
    });
  const tieneSaldo =
    Math.abs(Number(cliente.saldo) || 0) > 0;
  const tieneHistorial =
    Array.isArray(cliente.historial) && cliente.historial.length > 0;

  if (tienePedidos || tieneSaldo || tieneHistorial) {
    cliente.activo = false;
    guardarClienteOperacionSupabase(cliente);

    if (clienteSeleccionado && clienteSeleccionado.codigo === codigo) {
      limpiarPedidoActual();
      pedidoEditando = null;
      clienteSeleccionado = null;
      dom.clienteSearchInput.value = "";
      actualizarClientePedidoSeleccionado();
      limpiarFormularioPedido();
      renderizarPedidoActual();
    }

    guardarClientes();
    renderizarClientes();
    renderizarClientesConDeuda();
    actualizarDashboard();
    actualizarVistaBusqueda();

    registrarAuditoria(
      "Clientes",
      "Baja segura cliente",
      cliente.codigo + " - " + cliente.nombre + " | Conserva pedidos/cuenta"
    );

    alert("El cliente tiene pedidos, cuenta o historial. Se paso a inactivo para no perder datos.");
    return;
  }

  clientes =
    clientes.filter(function (clienteGuardado) {
      return clienteGuardado.codigo !== codigo;
    });
  eliminarClienteOperacionSupabase(cliente);

  if (clienteSeleccionado && clienteSeleccionado.codigo === codigo) {
    limpiarPedidoActual();
    pedidoEditando = null;
    clienteSeleccionado = null;
    dom.clienteSearchInput.value = "";
    actualizarClientePedidoSeleccionado();
    limpiarFormularioPedido();
    renderizarPedidoActual();
  }

  guardarClientes();
  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();
  actualizarVistaBusqueda();

  registrarAuditoria(
    "Clientes",
    "Elimino cliente",
    cliente.codigo + " - " + cliente.nombre
  );
}
function obtenerClientesCuentaFiltrados() {
  const textoBusqueda =
    dom.buscarCuentaClienteInput
      ? normalizarTexto(dom.buscarCuentaClienteInput.value.trim())
      : "";
  const filtroSaldo =
    dom.cuentaSaldoFiltro ? dom.cuentaSaldoFiltro.value : "TODOS";

  return clientes.filter(function (cliente) {
    const saldoCliente =
      Number(cliente.saldo) || 0;
    const tieneSaldo =
      saldoCliente !== 0;
    const coincideSaldo =
      filtroSaldo === "TODOS" ||
      (filtroSaldo === "DEUDA" && saldoCliente > 0) ||
      (filtroSaldo === "A_FAVOR" && saldoCliente < 0);

    const coincideBusqueda =
      textoBusqueda === "" ||
      String(cliente.codigo).includes(textoBusqueda) ||
      normalizarTexto(cliente.nombre).includes(textoBusqueda) ||
      normalizarTexto(cliente.telefono || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.direccion || "").includes(textoBusqueda);

    return tieneSaldo && coincideSaldo && coincideBusqueda;
  }).sort(function (primero, segundo) {
    return Math.abs(segundo.saldo) - Math.abs(primero.saldo);
  });
}

function renderizarClientesConDeuda() {
  const clientesDeudores =
    obtenerClientesCuentaFiltrados();

  const totalDeudaFiltrada =
    clientesDeudores.reduce(function (total, cliente) {
      return total + cliente.saldo;
    }, 0);
  const totalDeudaReal =
    clientesDeudores.reduce(function (total, cliente) {
      const saldoCliente =
        Number(cliente.saldo) || 0;

      return saldoCliente > 0 ? total + saldoCliente : total;
    }, 0);
  const totalAFavorReal =
    clientesDeudores.reduce(function (total, cliente) {
      const saldoCliente =
        Number(cliente.saldo) || 0;

      return saldoCliente < 0 ? total + Math.abs(saldoCliente) : total;
    }, 0);

  if (dom.cuentaClientesConDeudaCantidad) {
    dom.cuentaClientesConDeudaCantidad.textContent =
      clientesDeudores.length;
  }

  if (dom.cuentaClientesConDeudaTotal) {
    dom.cuentaClientesConDeudaTotal.textContent =
      formatearDinero(totalDeudaFiltrada);
  }

  if (dom.cuentaTotalDeuda) {
    dom.cuentaTotalDeuda.textContent =
      formatearDinero(totalDeudaReal);
  }

  if (dom.cuentaTotalAFavor) {
    dom.cuentaTotalAFavor.textContent =
      formatearDinero(totalAFavorReal);
  }

  if (clientesDeudores.length === 0) {
    dom.clientesConDeuda.innerHTML =
      `<div class="empty-table">Sin saldos registrados</div>`;
    return;
  }

  dom.clientesConDeuda.innerHTML = "";

  clientesDeudores.forEach(function (cliente) {

    const fila = document.createElement("div");
    const saldoCliente =
      Number(cliente.saldo) || 0;
    const clasePrioridad =
      saldoCliente < 0
        ? "debt-low"
        : saldoCliente >= 100000
        ? "debt-high"
        : saldoCliente >= 30000
          ? "debt-medium"
          : "debt-low";
    const textoSaldo =
      saldoCliente < 0 ? "A favor " : "";

    fila.className = "debt-row " + clasePrioridad;

    fila.innerHTML = `
      <div class="debt-client">
        <span>${cliente.codigo} - ${cliente.nombre}</span>
        <small>${cliente.telefono} | ${cliente.direccion}</small>
      </div>
      <div class="debt-actions">
        <strong>${textoSaldo}${formatearDinero(Math.abs(saldoCliente))}</strong>
        <button class="btn btn-secondary" onclick="verHistorialCliente(${cliente.codigo})">
          Historial
        </button>
        ${saldoCliente > 0
          ? `<button class="btn btn-cobrado" onclick="abrirRegistroPagoCliente(${cliente.codigo})">
          Registrar pago
        </button>`
          : ""
        }
      </div>
    `;

    dom.clientesConDeuda.appendChild(fila);

  });
}

function exportarCuentaClientesCsv() {
  const clientesFiltrados =
    obtenerClientesCuentaFiltrados();

  if (clientesFiltrados.length === 0) {
    alert("No hay saldos para exportar con los filtros actuales.");
    return;
  }

  const filas =
    clientesFiltrados.map(function (cliente) {
      const saldo =
        Number(cliente.saldo) || 0;

      return [
        cliente.codigo,
        cliente.nombre || "",
        cliente.telefono || "",
        cliente.direccion || "",
        cliente.zona || "",
        cliente.vendedorAsignado || "",
        saldo > 0 ? "Deuda" : "Saldo a favor",
        formatearMoneda(Math.abs(saldo)),
        formatearMoneda(saldo),
        Array.isArray(cliente.historial) ? cliente.historial.length : 0
      ];
    });

  descargarCsv(
    "cuenta-clientes.csv",
    [
      "Codigo",
      "Cliente",
      "Telefono",
      "Direccion",
      "Zona",
      "Vendedor",
      "Tipo saldo",
      "Importe absoluto",
      "Saldo neto",
      "Movimientos"
    ],
    filas
  );
}

function obtenerClienteParaPago() {
  if (!dom.pagoClienteInput) {
    return null;
  }

  return buscarCliente(dom.pagoClienteInput.value);
}

function obtenerClienteParaNotaCredito() {
  if (!dom.notaCreditoClienteInput) {
    return null;
  }

  return buscarCliente(dom.notaCreditoClienteInput.value);
}

function obtenerPedidoParaNotaCredito() {
  const cliente =
    obtenerClienteParaNotaCredito();

  if (!cliente || !dom.notaCreditoPedidoInput) {
    return null;
  }

  const textoPedido =
    dom.notaCreditoPedidoInput.value.trim().replace("#", "");

  if (textoPedido === "") {
    return null;
  }

  return pedidos.find(function (pedido) {
    const coincidePedido =
      String(pedido.numero || pedido.id) === textoPedido ||
      String(pedido.id) === textoPedido;
    const coincideCliente =
      pedido.cliente && pedido.cliente.codigo === cliente.codigo;

    return coincidePedido && coincideCliente;
  }) || null;
}

function obtenerCantidadNotaCreditoItem(indice) {
  const input =
    document.querySelector('[data-nota-credito-item="' + indice + '"]');

  return input ? Number(input.value) || 0 : 0;
}

function calcularNotaCreditoProductos(pedido) {
  if (!pedido || !Array.isArray(pedido.items)) {
    return {
      importe: 0,
      items: []
    };
  }

  const itemsCredito =
    pedido.items.map(function (item, indice) {
      const cantidadPedido =
        Number(item.cantidad) || 0;
      const cantidadCredito =
        Math.min(cantidadPedido, Math.max(0, obtenerCantidadNotaCreditoItem(indice)));
      const precioUnitario =
        Number(item.precioUnitario || (item.producto ? item.producto.precio : 0)) || 0;

      return {
        indice: indice,
        item: item,
        cantidadPedido: cantidadPedido,
        cantidadCredito: cantidadCredito,
        precioUnitario: precioUnitario,
        subtotal: cantidadCredito * precioUnitario
      };
    }).filter(function (itemCredito) {
      return itemCredito.cantidadCredito > 0;
    });

  return {
    importe: itemsCredito.reduce(function (total, itemCredito) {
      return total + itemCredito.subtotal;
    }, 0),
    items: itemsCredito
  };
}

function devolverStockPorNotaCredito(pedido, itemsCredito, motivo) {
  if (!pedido || !Array.isArray(itemsCredito) || itemsCredito.length === 0) {
    return;
  }

  const tipoNota =
    dom.notaCreditoTipoInput ? dom.notaCreditoTipoInput.value : "";
  const debeDevolverStock =
    tipoNota === "NO_ENVIADO" &&
    (pedido.estado === "ATENDIDO" || pedido.estado === "ENTREGADO");

  if (!debeDevolverStock) {
    return;
  }

  itemsCredito.forEach(function (itemCredito) {
    if (!itemCredito.item || !itemCredito.item.producto) {
      return;
    }

    const producto =
      productos.find(function (productoGuardado) {
        return productoGuardado.codigo === itemCredito.item.producto.codigo;
      });

    if (!producto) {
      return;
    }

    if (!Array.isArray(producto.movimientosStock)) {
      producto.movimientosStock = [];
    }

    const stockAnterior =
      obtenerStockTotalProducto(producto);
    const stockFinal =
      stockAnterior + itemCredito.cantidadCredito;

    producto.movimientosStock.push({
      fecha: new Date().toLocaleDateString("es-AR"),
      tipo: "Entrada por nota de credito",
      pedido: pedido.numero || pedido.id,
      cantidad: itemCredito.cantidadCredito,
      stockFinal: stockFinal,
      motivo: motivo
    });

    reconstruirStockProductoDesdeTotal(producto, stockFinal);
    actualizarEstadoAutomaticoPorStock(producto, false);
    guardarProductoOperacionSupabase(producto);
  });
}

function aplicarNotaCreditoEnCobroPedido(pedido, importeCredito, totalAnteriorPedido) {
  if (!pedido || importeCredito <= 0) {
    return {
      saldoAnterior: 0,
      saldoPosterior: 0,
      saldoAFavor: 0
    };
  }

  const saldoAnterior =
    typeof pedido.saldoPendiente === "number"
      ? Number(pedido.saldoPendiente) || 0
      : 0;
  const importePagado =
    typeof pedido.importePagado === "number"
      ? Number(pedido.importePagado) || 0
      : 0;
  const saldoCubierto =
    Math.min(saldoAnterior, importeCredito);
  const saldoPosterior =
    Math.max(0, saldoAnterior - saldoCubierto);
  const saldoAFavorPorCredito =
    Math.max(0, importeCredito - saldoCubierto);
  const saldoAFavorPorPago =
    Math.max(0, importePagado - (Number(pedido.total) || 0));
  const saldoAFavor =
    Math.max(saldoAFavorPorCredito, saldoAFavorPorPago);

  if (typeof pedido.saldoPendiente === "number") {
    pedido.saldoPendiente = saldoPosterior;
  }

  if (pedido.estado === "ENTREGADO") {
    pedido.estadoCobro =
      saldoPosterior > 0 ? "CUENTA_CORRIENTE" : "COBRADO";
  }

  pedido.importeNotaCredito =
    (Number(pedido.importeNotaCredito) || 0) + importeCredito;
  pedido.saldoAFavorNotaCredito =
    saldoAFavor;

  return {
    saldoAnterior: saldoAnterior,
    saldoPosterior: saldoPosterior,
    saldoAFavor: saldoAFavor
  };
}
function actualizarVistaPagoCliente() {
  if (!dom.pagoClienteResultado) {
    return;
  }

  const cliente = obtenerClienteParaPago();

  if (!cliente) {
    dom.pagoClienteResultado.innerHTML =
      "Elegi un cliente para ver su saldo.";
    return;
  }

  const estadoSaldo =
    cliente.saldo > 0
      ? "Saldo pendiente"
      : cliente.saldo < 0
        ? "Saldo a favor"
        : "Sin deuda pendiente";

  dom.pagoClienteResultado.innerHTML = `
    <strong>${cliente.codigo} - ${cliente.nombre}</strong>
    <span>${cliente.telefono || "-"} | ${cliente.direccion || "-"}</span>
    <b>${estadoSaldo}: ${formatearDinero(cliente.saldo || 0)}</b>
  `;
}

function abrirRegistroPagoCliente(codigo) {
  const cliente =
    clientes.find(function (clienteGuardado) {
      return clienteGuardado.codigo === codigo;
    });

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  if (Number(cliente.saldo) <= 0) {
    alert("Este cliente no tiene saldo pendiente.");
    return;
  }

  mostrarSeccionCliente("cuenta");
  mostrarSeccionCuenta("pago");
  dom.pagoClienteInput.value =
    cliente.codigo + " - " + cliente.nombre;
  dom.pagoImporteInput.value =
    Number(cliente.saldo) || "";
  actualizarVistaPagoCliente();
  dom.pagoImporteInput.focus();
  dom.pagoImporteInput.select();
}

function registrarPagoDesdeFormulario(event) {
  event.preventDefault();

  if (!tienePermiso("cuentaCorriente")) {
    alert("Tu rol no tiene permiso para registrar pagos.");
    return;
  }

  const cliente = obtenerClienteParaPago();

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  const importe = Number(dom.pagoImporteInput.value);

  if (Number.isNaN(importe) || importe <= 0) {
    alert("Ingresa un importe valido.");
    return;
  }

  const pagoRegistrado =
    registrarPago(cliente.codigo, importe);

  if (pagoRegistrado) {
    dom.registrarPagoForm.reset();
  }
}

function renderizarProductosNotaCredito() {
  if (!dom.notaCreditoProductosTable) {
    return;
  }

  const pedido =
    obtenerPedidoParaNotaCredito();

  if (!pedido || !Array.isArray(pedido.items) || pedido.items.length === 0) {
    dom.notaCreditoProductosTable.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table">Elegí cliente y pedido para ver productos.</td>
      </tr>
    `;
    dom.notaCreditoImporteInput.value = "";
    return;
  }

  dom.notaCreditoProductosTable.innerHTML =
    pedido.items.map(function (item, indice) {
      const cantidad =
        Number(item.cantidad) || 0;
      const precioUnitario =
        Number(item.precioUnitario || (item.producto ? item.producto.precio : 0)) || 0;
      const cantidadCredito =
        obtenerCantidadNotaCreditoItem(indice);
      const subtotal =
        Math.min(cantidad, Math.max(0, cantidadCredito)) * precioUnitario;

      return `
        <tr>
          <td>${item.producto ? item.producto.codigo + " - " + item.producto.nombre : "Producto sin detalle"}</td>
          <td>${cantidad}</td>
          <td>${formatearDinero(precioUnitario)}</td>
          <td>
            <input data-nota-credito-item="${indice}" type="number" min="0" max="${cantidad}" step="1" value="${cantidadCredito || 0}">
          </td>
          <td>${formatearDinero(subtotal)}</td>
        </tr>
      `;
    }).join("");

  document.querySelectorAll("[data-nota-credito-item]").forEach(function (input) {
    input.addEventListener("input", actualizarVistaNotaCreditoCliente);
  });
}

function actualizarVistaNotaCreditoCliente() {
  if (!dom.notaCreditoResultado) {
    return;
  }

  const cliente = obtenerClienteParaNotaCredito();
  const pedido = obtenerPedidoParaNotaCredito();

  if (!cliente) {
    dom.notaCreditoResultado.innerHTML =
      "Elegi un cliente para ver como queda el saldo.";
    renderizarProductosNotaCredito();
    return;
  }

  renderizarProductosNotaCredito();

  if (!pedido) {
    dom.notaCreditoResultado.innerHTML = `
      <strong>${cliente.codigo} - ${cliente.nombre}</strong>
      <span>Ingrese el numero de pedido para seleccionar productos.</span>
      <b>Saldo actual: ${formatearDinero(Number(cliente.saldo) || 0)}</b>
    `;
    return;
  }

  const calculoCredito =
    calcularNotaCreditoProductos(pedido);
  const importe =
    calculoCredito.importe;
  const saldoActual =
    Number(cliente.saldo) || 0;
  const saldoFinal =
    saldoActual - importe;
  const estadoFinal =
    saldoFinal > 0
      ? "Seguira debiendo"
      : saldoFinal < 0
        ? "Quedara saldo a favor"
        : "Cuenta saldada";

  dom.notaCreditoImporteInput.value =
    importe > 0 ? importe.toFixed(2) : "";

  dom.notaCreditoResultado.innerHTML = `
    <strong>${cliente.codigo} - ${cliente.nombre}</strong>
    <span>Pedido #${pedido.numero || pedido.id} | ${cliente.telefono || "-"} | ${cliente.direccion || "-"}</span>
    <b>Saldo actual: ${formatearDinero(saldoActual)}</b>
    <b>Credito por productos: ${formatearDinero(importe)}</b>
    <b>${estadoFinal}: ${formatearDinero(Math.abs(saldoFinal))}</b>
  `;
}

function registrarNotaCreditoDesdeFormulario(event) {
  event.preventDefault();

  if (!tienePermiso("cuentaCorriente")) {
    alert("Tu rol no tiene permiso para registrar notas de credito.");
    return;
  }

  const cliente = obtenerClienteParaNotaCredito();
  const pedido = obtenerPedidoParaNotaCredito();

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  if (!pedido) {
    alert("Seleccione un pedido valido del cliente.");
    return;
  }

  const calculoCredito =
    calcularNotaCreditoProductos(pedido);
  const importe =
    calculoCredito.importe;
  const motivo =
    dom.notaCreditoMotivoInput.value.trim() || dom.notaCreditoTipoInput.value || "Nota de credito";

  if (Number.isNaN(importe) || importe <= 0) {
    alert("Seleccione al menos un producto y cantidad a acreditar.");
    return;
  }

  const totalAnteriorPedido =
    Number(pedido.total) || 0;

  devolverStockPorNotaCredito(pedido, calculoCredito.items, motivo);

  calculoCredito.items.forEach(function (itemCredito) {
    const itemPedido =
      pedido.items[itemCredito.indice];

    if (!itemPedido) {
      return;
    }

    itemPedido.cantidad =
      Math.max(0, (Number(itemPedido.cantidad) || 0) - itemCredito.cantidadCredito);
    itemPedido.subtotal =
      Math.max(0, (Number(itemPedido.subtotal) || 0) - itemCredito.subtotal);
  });

  pedido.items =
    pedido.items.filter(function (item) {
      return Number(item.cantidad) > 0;
    });
  pedido.total =
    Math.max(0, totalAnteriorPedido - importe);
  const resultadoCobroNotaCredito =
    aplicarNotaCreditoEnCobroPedido(pedido, importe, totalAnteriorPedido);

  pedido.notaCredito =
    pedido.notaCredito || [];
  pedido.notaCredito.push({
    fecha: new Date().toLocaleDateString("es-AR"),
    motivo: motivo,
    importe: importe,
    saldoAnterior: resultadoCobroNotaCredito.saldoAnterior,
    saldoPosterior: resultadoCobroNotaCredito.saldoPosterior,
    saldoAFavor: resultadoCobroNotaCredito.saldoAFavor,
    items: calculoCredito.items.map(function (itemCredito) {
      return {
        producto: itemCredito.item.producto,
        cantidad: itemCredito.cantidadCredito,
        precioUnitario: itemCredito.precioUnitario,
        subtotal: itemCredito.subtotal
      };
    })
  });

  if (!Array.isArray(cliente.historial)) {
    cliente.historial = [];
  }

  const saldoClienteAnterior =
    Number(cliente.saldo) || 0;

  const movimientoCuenta = {
    codigoPago: obtenerSiguienteCodigoPagoCliente(cliente),
    fecha: new Date().toLocaleDateString("es-AR"),
    tipo: "Nota de credito pedido #" + (pedido.numero || pedido.id) + " - " + motivo,
    importe: -importe,
    saldoAnterior: saldoClienteAnterior,
    saldoPosterior: saldoClienteAnterior - importe
  };

  cliente.saldo =
    movimientoCuenta.saldoPosterior;

  cliente.historial.push(movimientoCuenta);

  guardarClientes();
  guardarPedidos();
  guardarProductos();
  guardarClienteOperacionSupabase(cliente);
  guardarMovimientoCuentaOperacionSupabase(cliente, movimientoCuenta);
  guardarPedidoOperacionSupabase(pedido);
  renderizarClientes();
  renderizarClientesConDeuda();
  renderizarPedidos();
  renderizarProductos();
  renderizarMovimientosGenerales();
  actualizarStockTotal();
  actualizarDashboard();

  registrarAuditoria(
    "Cuenta corriente",
    "Registro nota credito",
    cliente.codigo + " - " + cliente.nombre + " | Pedido #" + (pedido.numero || pedido.id) + " | " + formatearDinero(importe) + " | " + motivo
  );

  dom.registrarNotaCreditoForm.reset();
  actualizarVistaNotaCreditoCliente();
}

function obtenerSiguienteCodigoPagoCliente(cliente) {
  if (!cliente || !Array.isArray(cliente.historial)) {
    return 1;
  }

  const codigos =
    cliente.historial.map(function (movimiento) {
      return Number(movimiento.codigoPago) || 0;
    });

  return Math.max(0, ...codigos) + 1;
}

function imprimirComprobantePagoCliente(codigoCliente, codigoPago) {
  const cliente =
    clientes.find(function (clienteGuardado) {
      return Number(clienteGuardado.codigo) === Number(codigoCliente);
    });

  if (!cliente || !Array.isArray(cliente.historial)) {
    alert("No se encontro el pago.");
    return;
  }

  const pago =
    cliente.historial.find(function (movimiento) {
      return Number(movimiento.codigoPago) === Number(codigoPago);
    });

  if (!pago) {
    alert("No se encontro el pago.");
    return;
  }

  const ventana =
    window.open("", "_blank", "width=420,height=620");

  if (!ventana) {
    alert("No se pudo abrir la impresion. Revise el bloqueo de ventanas emergentes.");
    return;
  }

  const nombreEmpresa =
    CONFIG.empresa || CONFIG.impresionTitulo || "LV Sistema";
  const subtituloEmpresa =
    CONFIG.impresionSubtitulo || "Distribuidora";

  ventana.document.write(`
    <html>
      <head>
        <title>Comprobante de cuenta ${pago.codigoPago}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
          .ticket { border: 1px solid #cbd5e1; padding: 18px; max-width: 360px; }
          h1 { font-size: 20px; margin: 0; }
          h2 { font-size: 15px; margin: 14px 0 10px; }
          p { margin: 6px 0; font-size: 13px; }
          .muted { color: #64748b; }
          .total { border-top: 1px solid #cbd5e1; margin-top: 14px; padding-top: 12px; font-size: 20px; font-weight: 700; }
          .firma { margin-top: 42px; border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>${nombreEmpresa}</h1>
          <p class="muted">${subtituloEmpresa}</p>
          <h2>Comprobante de cuenta corriente</h2>
          <p><strong>Nro:</strong> ${pago.codigoPago}</p>
          <p><strong>Fecha:</strong> ${pago.fecha}</p>
          <p><strong>Cliente:</strong> ${cliente.codigo} - ${cliente.nombre}</p>
          <p><strong>Direccion:</strong> ${cliente.direccion || "-"}</p>
          <p><strong>Detalle:</strong> ${pago.tipo || "Pago recibido"}</p>
          ${typeof pago.saldoAnterior === "number"
            ? `<p><strong>Saldo anterior:</strong> ${formatearDinero(pago.saldoAnterior)}</p>`
            : ""}
          ${typeof pago.saldoPosterior === "number"
            ? `<p><strong>Saldo posterior:</strong> ${formatearDinero(pago.saldoPosterior)}</p>`
            : ""}
          <p class="total">Importe: ${formatearDinero(Math.abs(Number(pago.importe) || 0))}</p>
          <div class="firma">Firma / aclaracion</div>
        </div>
        <script>
          window.print();
        </script>
      </body>
    </html>
  `);

  ventana.document.close();
}

function verHistorialCliente(codigo) {
  const clienteEncontrado = clientes.find(function (cliente) {
    return cliente.codigo === codigo;
  });

  if (!clienteEncontrado) {
    alert("No se encontro el cliente.");
    return;
  }

  if (!clienteEncontrado.historial) {
    clienteEncontrado.historial = [];
  }

  const pedidosDelCliente = pedidos.filter(function (pedido) {
    return pedido &&
      pedido.cliente &&
      pedido.cliente.codigo === clienteEncontrado.codigo;
  });

  let filasDeMovimientos = "";
  let filasDePedidos = "";

  clienteEncontrado.historial.forEach(function (movimiento) {
    const accionPago =
      movimiento.codigoPago
        ? `<button class="btn btn-secondary" onclick="imprimirComprobantePagoCliente(${clienteEncontrado.codigo}, ${movimiento.codigoPago})">Imprimir</button>`
        : "-";

    filasDeMovimientos += `
      <tr>
        <td>${movimiento.fecha}</td>
        <td>${movimiento.tipo}</td>
        <td>${formatearDinero(movimiento.importe)}</td>
        <td>${accionPago}</td>
      </tr>
    `;
  });

  pedidosDelCliente.forEach(function (pedido) {
    filasDePedidos += `
      <tr>
        <td>#${pedido.numero || pedido.id}</td>
        <td>${pedido.fecha}</td>
        <td>${formatearDinero(pedido.total)}</td>
        <td>${pedido.estado}</td>
        <td>
          <button class="btn btn-secondary" onclick="verDetallePedido(${pedido.id})">
            Ver
          </button>
          <button class="btn btn-secondary" onclick="imprimirPedidoGuardado(${pedido.id})">
            Imprimir
          </button>
        </td>
      </tr>
    `;
  });

  const saldoCliente =
    Number(clienteEncontrado.saldo) || 0;
  const textoEstadoSaldo =
    saldoCliente > 0
      ? "Debe"
      : saldoCliente < 0
        ? "Saldo a favor"
        : "Al dia";
  const claseEstadoSaldo =
    saldoCliente > 0
      ? "saldo-deuda"
      : saldoCliente < 0
        ? "saldo-favor"
        : "saldo-ok";

  dom.estadoCuentaContenido.innerHTML = `
    <div class="estado-cliente">
      <div>
        <h3>${clienteEncontrado.nombre}</h3>
        <p>${clienteEncontrado.direccion}</p>
      </div>

      <div class="estado-saldo ${claseEstadoSaldo}">
        <span>${textoEstadoSaldo}</span>
        <strong>${formatearDinero(Math.abs(saldoCliente))}</strong>
      </div>
    </div>

    <h3>Movimientos de cuenta</h3>

    <table class="estado-tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Movimiento</th>
          <th>Importe</th>
          <th>Comprobante</th>
        </tr>
      </thead>

      <tbody>
        ${
          filasDeMovimientos ||
          `<tr>
            <td colspan="4">Sin movimientos</td>
          </tr>`
        }
      </tbody>
    </table>

    <h3>Pedidos del cliente</h3>

    <table class="estado-tabla">
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        ${
          filasDePedidos ||
          `<tr>
            <td colspan="5">Sin pedidos</td>
          </tr>`
        }
      </tbody>
    </table>
  `;

  dom.estadoCuentaModal.classList.remove("hidden");
}
function registrarPago(codigo, importeDirecto) {
  if (!tienePermiso("cuentaCorriente")) {
    alert("Tu rol no tiene permiso para registrar pagos.");
    return false;
  }

  const cliente = clientes.find(function (c) {
    return c.codigo === codigo;
  });
  if (!cliente) {
    return false;
  }

  cliente.saldo =
    Number(cliente.saldo) || 0;

  if (cliente.saldo <= 0) {
    alert("Este cliente no tiene saldo pendiente.");
    return false;
  }

  if (importeDirecto === undefined) {
    abrirRegistroPagoCliente(codigo);
    return false;
  }

  const importe =
    Number(importeDirecto);

  if (isNaN(importe) || importe <= 0) {
    return false;
  }

  const importeAplicado =
    importe;
  const saldoAntesDelPago =
    cliente.saldo;

  const saldoDespuesDelPago =
    cliente.saldo - importeAplicado;
  const detalleSaldo =
    saldoDespuesDelPago > 0
      ? "Saldo pendiente: " + formatearDinero(saldoDespuesDelPago)
      : saldoDespuesDelPago < 0
        ? "Saldo a favor: " + formatearDinero(Math.abs(saldoDespuesDelPago))
        : "Cuenta saldada";

  const confirmar =
    confirm(
      "Registrar pago de " + formatearDinero(importeAplicado) +
      " para " + cliente.nombre + "?\n" +
      detalleSaldo
    );

  if (!confirmar) {
    return false;
  }

  cliente.saldo =
    saldoDespuesDelPago;

  if (!cliente.historial) {
    cliente.historial = [];
  }
  const movimientoCuenta = {
    codigoPago: obtenerSiguienteCodigoPagoCliente(cliente),
    fecha: new Date().toLocaleDateString("es-AR"),
    tipo: "Pago recibido",
    importe: -importeAplicado,
    saldoAnterior: saldoAntesDelPago,
    saldoPosterior: saldoDespuesDelPago
  };

  cliente.saldo =
    movimientoCuenta.saldoPosterior;

  cliente.historial.push(movimientoCuenta);
  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();
  guardarClientes();
  guardarClienteOperacionSupabase(cliente);
  guardarMovimientoCuentaOperacionSupabase(cliente, movimientoCuenta);

  registrarAuditoria(
    "Cuenta corriente",
    "Registro pago",
    cliente.codigo + " - " + cliente.nombre + " | " + formatearDinero(importeAplicado)
  );

  if (!dom.estadoCuentaModal.classList.contains("hidden")) {
    verHistorialCliente(cliente.codigo);
  }

  if (dom.pagoClienteResultado) {
    dom.pagoClienteResultado.innerHTML = `
      <strong>Pago registrado</strong>
      <span>${cliente.codigo} - ${cliente.nombre}</span>
      <b>Importe: ${formatearDinero(importeAplicado)}</b>
      <b>${detalleSaldo}</b>
      <button class="btn btn-secondary" type="button" onclick="imprimirComprobantePagoCliente(${cliente.codigo}, ${movimientoCuenta.codigoPago})">
        Imprimir comprobante
      </button>
    `;
  }

  return true;
}
