function obtenerSiguienteCodigoZona() {
  if (zonas.length === 0) {
    return 1;
  }

  const codigos = zonas.map(function (zona) {
      return Number(zona.codigo) || 0;
    });

  return Math.max.apply(null, codigos) + 1;
}

function zonaActiva(zona) {
  return zona.activo !== false;
}

function contarClientesPorZona(nombreZona) {
  return clientes.filter(function (cliente) {
    return normalizarTexto(cliente.zona || "Sin zona") === normalizarTexto(nombreZona);
  }).length;
}

function asegurarZonaPorNombre(nombreZona) {
  const nombreLimpio = nombreZona && nombreZona.trim() !== "" ? nombreZona.trim() : "Sin zona";

  const zonaExistente = zonas.find(function (zona) {
      return normalizarTexto(zona.nombre) === normalizarTexto(nombreLimpio);
    });

  if (zonaExistente) {
    return zonaExistente.nombre;
  }

  const nuevaZona = {
    codigo: obtenerSiguienteCodigoZona(),
    nombre: nombreLimpio,
    descripcion: "Creada automaticamente",
    activo: true
  };

  zonas.push(nuevaZona);
  guardarZonas();

  return nuevaZona.nombre;
}

function renderizarOpcionesZonasActivas() {
  const opcionesZonas =
    zonas.filter(zonaActiva).map(function (zona) {
      return `<option value="${zona.nombre}">${zona.nombre}</option>`;
    }).join("");

  if (dom.clientZoneInput) {
    const zonaSeleccionada =
      dom.clientZoneInput.value;

    dom.clientZoneInput.innerHTML =
      `<option value="">Seleccionar zona</option>` + opcionesZonas;

    dom.clientZoneInput.value =
      zonas.some(function (zona) {
        return zonaActiva(zona) && zona.nombre === zonaSeleccionada;
      })
        ? zonaSeleccionada
        : "";
  }
}

function renderizarZonas() {
  if (!dom.zonasTable) {
    return;
  }

  const textoBusqueda =
    normalizarTexto(dom.buscarZonaInput.value || "");

  const zonasFiltradas =
    zonas.filter(function (zona) {
      return textoBusqueda === "" ||
        normalizarTexto(zona.nombre).includes(textoBusqueda) ||
        normalizarTexto(zona.descripcion || "").includes(textoBusqueda);
    }).sort(function (primero, segundo) {
      return primero.codigo - segundo.codigo;
    });

  const zonasActivas =
    zonas.filter(zonaActiva).length;

  const clientesAsignados =
    clientes.filter(function (cliente) {
      return cliente.zona && cliente.zona !== "Sin zona";
    }).length;

  const clientesSinZona =
    clientes.length - clientesAsignados;

  dom.zonasActivasResumen.textContent = zonasActivas;
  dom.zonasClientesResumen.textContent = clientesAsignados;
  dom.zonasSinAsignarResumen.textContent = clientesSinZona;

  renderizarOpcionesZonasActivas();

  if (zonasFiltradas.length === 0) {
    dom.zonasTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">
          No hay zonas para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  dom.zonasTable.innerHTML =
    zonasFiltradas.map(function (zona) {
      const estadoTexto = zonaActiva(zona) ? "Activo" : "Inactivo";
      const estadoClase = zonaActiva(zona) ? "stock-ok" : "stock-inactive";
      const accionEstado = zonaActiva(zona) ? "Desactivar" : "Activar";

      return `
        <tr>
          <td>${zona.codigo}</td>
          <td>${zona.nombre}</td>
          <td>${zona.descripcion || "-"}</td>
          <td>${contarClientesPorZona(zona.nombre)}</td>
          <td>
            <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="cambiarEstadoZona(${zona.codigo})">
              ${accionEstado}
            </button>
            <button class="btn btn-danger" onclick="eliminarZona(${zona.codigo})">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join("");
}

function agregarZona(event) {
  event.preventDefault();

  const nombre =
    dom.zonaNombreInput.value.trim();

  const descripcion =
    dom.zonaDescripcionInput.value.trim() || "-";

  if (nombre === "") {
    alert("El nombre de la zona es obligatorio.");
    return;
  }

  const existeZona =
    zonas.some(function (zona) {
      return normalizarTexto(zona.nombre) === normalizarTexto(nombre);
    });

  if (existeZona) {
    alert("Ya existe una zona con ese nombre.");
    return;
  }

  const nuevaZona = {
    codigo: obtenerSiguienteCodigoZona(),
    nombre: nombre,
    descripcion: descripcion,
    activo: true
  };

  zonas.push(nuevaZona);
  guardarZonas();
  dom.zonaForm.reset();
  renderizarZonas();

  registrarAuditoria(
    "Zonas",
    "Creo zona",
    nuevaZona.codigo + " - " + nuevaZona.nombre
  );
}

function cambiarEstadoZona(codigo) {
  const zona =
    zonas.find(function (zonaGuardada) {
      return zonaGuardada.codigo === codigo;
    });

  if (!zona) {
    return;
  }

  zona.activo = !zonaActiva(zona);

  guardarZonas();
  renderizarZonas();

  registrarAuditoria(
    "Zonas",
    zona.activo ? "Activo zona" : "Desactivo zona",
    zona.codigo + " - " + zona.nombre
  );
}

function eliminarZona(codigo) {
  const zona =
    zonas.find(function (zonaGuardada) {
      return zonaGuardada.codigo === codigo;
    });

  if (!zona) {
    return;
  }

  const clientesEnZona =
    contarClientesPorZona(zona.nombre);

  if (clientesEnZona > 0) {
    alert("No se puede eliminar una zona con clientes asignados. Desactivala si no la queres usar mas.");
    return;
  }

  const confirmar =
    confirm("Eliminar zona " + zona.nombre + "?");

  if (!confirmar) {
    return;
  }

  zonas =
    zonas.filter(function (zonaGuardada) {
      return zonaGuardada.codigo !== codigo;
    });

  guardarZonas();
  renderizarZonas();

  registrarAuditoria(
    "Zonas",
    "Elimino zona",
    zona.codigo + " - " + zona.nombre
  );
}
