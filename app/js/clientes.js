let filtroEstadoClientes = "activos";

function clienteActivo(cliente) {
  return cliente.activo !== false;
}

function obtenerSiguienteCodigoCliente() {
  if (clientes.length === 0) {
    return 0;
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

function agregarCliente(event) {
  event.preventDefault();

  const codigo = Number(dom.clientCodeInput.value);
  const nombre = dom.clientNameInput.value.trim();
  const telefono = dom.clientPhoneInput.value.trim() || "-";
  const direccion = dom.clientAddressInput.value.trim() || "-";
  const zona = asegurarZonaPorNombre(dom.clientZoneInput.value);

  if (!Number.isInteger(codigo) || codigo < 0) {
    alert("El codigo del cliente debe ser un numero entero mayor o igual a 0.");
    return;
  }

  if (nombre === "") {
    alert("El nombre del cliente es obligatorio.");
    return;
  }

  const codigoRepetido = clientes.some(function (cliente) {
    return cliente.codigo === codigo;
  });

  if (codigoRepetido) {
    alert("Ya existe un cliente con ese codigo.");
    return;
  }

  clientes.push({
    codigo: codigo,
    nombre: nombre,
    saldo: 0,
    telefono: telefono,
    direccion: direccion,
    zona: zona,
    activo: true,
    historial: []
  });

  dom.clientForm.reset();
  completarSiguienteCodigoCliente();
  dom.clientCodeInput.focus();
  renderizarClientes();
  renderizarZonas();
  actualizarDashboard();
  guardarClientes();
}

function datosClienteValidos(codigo, nombre) {
  return Number.isInteger(codigo) &&
    codigo >= 0 &&
    nombre !== "";
}

function importarClientesDesdeTexto() {
  const texto =
    dom.clientesImportacionTexto.value.trim();

  if (texto === "") {
    alert("Pegue clientes para importar.");
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

    if (columnas.length < 2) {
      errores += 1;
      return;
    }

    const codigo = Number(columnas[0]);
    const nombre = columnas[1];
    const telefono = columnas[2] || "-";
    const direccion = columnas[3] || "-";
    const zona = asegurarZonaPorNombre(columnas[4] || "Sin zona");

    if (!datosClienteValidos(codigo, nombre)) {
      errores += 1;
      return;
    }

    const clienteExistente =
      clientes.find(function (cliente) {
        return cliente.codigo === codigo;
      });

    if (clienteExistente) {
      clienteExistente.nombre = nombre;
      clienteExistente.telefono = telefono;
      clienteExistente.direccion = direccion;
      clienteExistente.zona = zona;

      if (typeof clienteExistente.activo !== "boolean") {
        clienteExistente.activo = true;
      }

      if (!Array.isArray(clienteExistente.historial)) {
        clienteExistente.historial = [];
      }

      actualizados += 1;
      return;
    }

    clientes.push({
      codigo: codigo,
      nombre: nombre,
      saldo: 0,
      telefono: telefono,
      direccion: direccion,
      zona: zona,
      activo: true,
      historial: []
    });

    creados += 1;
  });

  dom.clientesImportacionTexto.value = "";
  completarSiguienteCodigoCliente();
  renderizarClientes();
  renderizarZonas();
  renderizarClientesConDeuda();
  actualizarDashboard();
  guardarClientes();

  alert(
    "Importacion terminada.\n" +
    "Creados: " + creados + "\n" +
    "Actualizados: " + actualizados + "\n" +
    "Errores: " + errores
  );
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

  if (dom.productoSearchInput) {
    dom.productoSearchInput.focus();
  }
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

  const textoBusqueda =
    dom.buscarClienteTabla
      ? dom.buscarClienteTabla.value.trim().toLowerCase()
      : "";

  const clientesFiltrados =
    clientes.filter(function (cliente) {
      const coincideEstado =
        filtroEstadoClientes === "todos" ||
        (filtroEstadoClientes === "activos" && clienteActivo(cliente)) ||
        (filtroEstadoClientes === "inactivos" && !clienteActivo(cliente));

      const coincideBusqueda =
        textoBusqueda === "" ||
        String(cliente.codigo).includes(textoBusqueda) ||
        normalizarTexto(cliente.nombre).includes(textoBusqueda) ||
        normalizarTexto(cliente.telefono || "").includes(textoBusqueda) ||
        normalizarTexto(cliente.direccion || "").includes(textoBusqueda) ||
        normalizarTexto(cliente.zona || "").includes(textoBusqueda);

      return coincideEstado && coincideBusqueda;
    }).sort(function (primero, segundo) {
      return primero.codigo - segundo.codigo;
    });

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
      <td>${cliente.nombre}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.direccion}</td>
      <td>${cliente.zona || "Sin zona"}</td>
      <td>
        <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
      </td>
      <td>
        <button class="btn btn-secondary" onclick="verHistorialCliente(${cliente.codigo})">
          Historial
        </button>
        <button class="btn btn-secondary" onclick="cambiarEstadoCliente(${cliente.codigo})">
          ${accionEstado}
        </button>
      </td>
    `;

    dom.clientsTable.appendChild(row);
  });
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
  const cliente =
    clientes.find(function (clienteGuardado) {
      return clienteGuardado.codigo === codigo;
    });

  if (!cliente) {
    alert("No se encontro el cliente.");
    return;
  }

  const accion =
    clienteActivo(cliente) ? "desactivar" : "activar";

  const confirmar =
    confirm("Seguro que queres " + accion + " " + cliente.codigo + " - " + cliente.nombre + "?");

  if (!confirmar) {
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
  actualizarDashboard();
  actualizarVistaBusqueda();
}
function renderizarClientesConDeuda() {
  const textoBusqueda =
    dom.buscarCuentaClienteInput
      ? normalizarTexto(dom.buscarCuentaClienteInput.value.trim())
      : "";

  const clientesDeudores = clientes.filter(function (cliente) {
    const tieneDeuda =
      cliente.saldo > 0;

    const coincideBusqueda =
      textoBusqueda === "" ||
      String(cliente.codigo).includes(textoBusqueda) ||
      normalizarTexto(cliente.nombre).includes(textoBusqueda) ||
      normalizarTexto(cliente.telefono || "").includes(textoBusqueda) ||
      normalizarTexto(cliente.direccion || "").includes(textoBusqueda);

    return tieneDeuda && coincideBusqueda;
  }).sort(function (primero, segundo) {
    return segundo.saldo - primero.saldo;
  });

  const totalDeudaFiltrada =
    clientesDeudores.reduce(function (total, cliente) {
      return total + cliente.saldo;
    }, 0);

  if (dom.cuentaClientesConDeudaCantidad) {
    dom.cuentaClientesConDeudaCantidad.textContent =
      clientesDeudores.length;
  }

  if (dom.cuentaClientesConDeudaTotal) {
    dom.cuentaClientesConDeudaTotal.textContent =
      formatearDinero(totalDeudaFiltrada);
  }

  if (clientesDeudores.length === 0) {
    dom.clientesConDeuda.innerHTML =
      `<div class="empty-table">Sin deudas registradas</div>`;
    return;
  }

  dom.clientesConDeuda.innerHTML = "";

  clientesDeudores.forEach(function (cliente) {

    const fila = document.createElement("div");
    const clasePrioridad =
      cliente.saldo >= 100000
        ? "debt-high"
        : cliente.saldo >= 30000
          ? "debt-medium"
          : "debt-low";

    fila.className = "debt-row " + clasePrioridad;

    fila.innerHTML = `
      <div class="debt-client">
        <span>${cliente.codigo} - ${cliente.nombre}</span>
        <small>${cliente.telefono} | ${cliente.direccion}</small>
      </div>
      <div class="debt-actions">
        <strong>${formatearDinero(cliente.saldo)}</strong>
        <button class="btn btn-secondary" onclick="verHistorialCliente(${cliente.codigo})">
          Historial
        </button>
        <button class="btn btn-cobrado" onclick="registrarPago(${cliente.codigo})">
          Registrar pago
        </button>
        <button class="btn btn-secondary" onclick="registrarPagoTotal(${cliente.codigo})">
          Pagar total
        </button>
      </div>
    `;

    dom.clientesConDeuda.appendChild(fila);

  });
}

function obtenerClienteParaPago() {
  if (!dom.pagoClienteInput) {
    return null;
  }

  return buscarCliente(dom.pagoClienteInput.value);
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
      : "Sin deuda pendiente";

  dom.pagoClienteResultado.innerHTML = `
    <strong>${cliente.codigo} - ${cliente.nombre}</strong>
    <span>${cliente.telefono || "-"} | ${cliente.direccion || "-"}</span>
    <b>${estadoSaldo}: ${formatearDinero(cliente.saldo || 0)}</b>
  `;
}

function usarSaldoTotalComoPago() {
  const cliente = obtenerClienteParaPago();

  if (!cliente) {
    alert("Primero elegi un cliente.");
    return;
  }

  dom.pagoImporteInput.value = cliente.saldo || 0;
}

function registrarPagoDesdeFormulario(event) {
  event.preventDefault();

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
    actualizarVistaPagoCliente();
  }
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
    return pedido.cliente.codigo === clienteEncontrado.codigo;
  });

  let filasDeMovimientos = "";
  let filasDePedidos = "";

  clienteEncontrado.historial.forEach(function (movimiento) {
    filasDeMovimientos += `
      <tr>
        <td>${movimiento.fecha}</td>
        <td>${movimiento.tipo}</td>
        <td>${formatearDinero(movimiento.importe)}</td>
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
      </tr>
    `;
  });

  dom.estadoCuentaContenido.innerHTML = `
    <div class="estado-cliente">
      <div>
        <h3>${clienteEncontrado.nombre}</h3>
        <p>${clienteEncontrado.direccion}</p>
      </div>

      <div class="estado-saldo">
        ${formatearDinero(clienteEncontrado.saldo)}
      </div>
    </div>

    <h3>Movimientos de cuenta</h3>

    <table class="estado-tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Movimiento</th>
          <th>Importe</th>
        </tr>
      </thead>

      <tbody>
        ${
          filasDeMovimientos ||
          `<tr>
            <td colspan="3">Sin movimientos</td>
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
        </tr>
      </thead>

      <tbody>
        ${
          filasDePedidos ||
          `<tr>
            <td colspan="4">Sin pedidos</td>
          </tr>`
        }
      </tbody>
    </table>
  `;

  dom.estadoCuentaModal.classList.remove("hidden");
}
function registrarPago(codigo, importeDirecto) {
  const cliente = clientes.find(function (c) {
    return c.codigo === codigo;
  });
  if (!cliente) {
    return false;
  }
  if (cliente.saldo <= 0) {
    alert("Este cliente no tiene saldo pendiente.");
    return false;
  }

  const importe = importeDirecto !== undefined
    ? Number(importeDirecto)
    : Number(prompt("Ingrese importe abonado. Saldo actual: " + formatearDinero(cliente.saldo)));

  if (isNaN(importe) || importe <= 0) {
    return false;
  }

  const importeAplicado =
    Math.min(importe, cliente.saldo);

  const confirmar =
    confirm("Registrar pago de " + formatearDinero(importeAplicado) + " para " + cliente.nombre + "?");

  if (!confirmar) {
    return false;
  }

  cliente.saldo -= importeAplicado;

  if (cliente.saldo < 0)
    cliente.saldo = 0;

  if (!cliente.historial) {
    cliente.historial = [];
  }
  cliente.historial.push({
    fecha: new Date().toLocaleDateString("es-AR"),
    tipo: "Pago recibido",
    importe: -importeAplicado
  })
  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();
  guardarClientes();

  registrarAuditoria(
    "Cuenta corriente",
    "Registro pago",
    cliente.codigo + " - " + cliente.nombre + " | " + formatearDinero(importeAplicado)
  );

  if (!dom.estadoCuentaModal.classList.contains("hidden")) {
    verHistorialCliente(cliente.codigo);
  }

  return true;
}

function registrarPagoTotal(codigo) {
  const cliente = clientes.find(function (c) {
    return c.codigo === codigo;
  });

  if (!cliente) {
    return;
  }

  registrarPago(codigo, cliente.saldo);
}

