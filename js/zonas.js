let zonaEditando = null;

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

function reconstruirZonasDesdeClientes() {
  let huboCambios = false;

  clientes.forEach(function (cliente) {
    const nombreZona =
      cliente.zona && cliente.zona.trim() !== "" ? cliente.zona.trim() : "";

    if (nombreZona === "" || normalizarTexto(nombreZona) === normalizarTexto("Sin zona")) {
      return;
    }

    const existe =
      zonas.some(function (zona) {
        return normalizarTexto(zona.nombre) === normalizarTexto(nombreZona);
      });

    if (existe) {
      return;
    }

    zonas.push({
      codigo: obtenerSiguienteCodigoZona(),
      nombre: nombreZona,
      descripcion: "Creada desde clientes",
      activo: true
    });
    huboCambios = true;
  });

  if (huboCambios) {
    guardarZonas();
  }
}

function renderizarOpcionesZonasActivas() {
  const zonasActivas =
    zonas.filter(zonaActiva);
  const opcionesZonas =
    zonasActivas.map(function (zona) {
      return `<option value="${zona.nombre}">${zona.nombre}</option>`;
    }).join("");
  const opcionSinZona =
    zonasActivas.length === 0
      ? `<option value="Sin zona">Sin zona</option>`
      : "";

  if (dom.clientZoneInput) {
    const zonaSeleccionada =
      dom.clientZoneInput.value;

    dom.clientZoneInput.innerHTML =
      `<option value="">Seleccionar zona</option>` + opcionSinZona + opcionesZonas;

    dom.clientZoneInput.value =
      zonaSeleccionada === "Sin zona" && zonasActivas.length === 0
        ? "Sin zona"
        : zonas.some(function (zona) {
        return zonaActiva(zona) && zona.nombre === zonaSeleccionada;
      })
        ? zonaSeleccionada
        : zonasActivas.length === 0 ? "Sin zona" : "";
  }
}

function renderizarZonas() {
  if (!dom.zonasTable) {
    return;
  }

  reconstruirZonasDesdeClientes();

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
      return `
        <tr>
          <td>${escaparTextoHtml(zona.codigo)}</td>
          <td>${escaparTextoHtml(zona.nombre)}</td>
          <td>${escaparTextoHtml(zona.descripcion || "-")}</td>
          <td>${contarClientesPorZona(zona.nombre)}</td>
          <td>
            <span class="stock-pill stock-ok">Activa</span>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="editarZona(${zona.codigo})">
              Editar
            </button>
            <button class="btn btn-danger" onclick="eliminarZona(${zona.codigo})">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join("");
}

function zonaDebeConfirmarGuardadoOnline() {
  return typeof puedeGuardarOperacionEnSupabase === "function" &&
    puedeGuardarOperacionEnSupabase();
}

function avisarZonaSinConfirmacionOnline(accion) {
  if (!zonaDebeConfirmarGuardadoOnline()) {
    return;
  }

  alert(
    accion + " quedo guardada localmente, pero Supabase no confirmo todo. " +
    "Actualiza datos y revisa la conexion antes de seguir operando."
  );
}

async function confirmarGuardadoZonaOnline(zona, accion) {
  if (typeof guardarZonaOperacionSupabase !== "function") {
    return true;
  }

  const zonaGuardadaOnline =
    await guardarZonaOperacionSupabase(zona);

  if (zonaDebeConfirmarGuardadoOnline() && !zonaGuardadaOnline) {
    avisarZonaSinConfirmacionOnline(accion);
    return false;
  }

  return true;
}

async function confirmarEliminacionZonaOnline(zona, accion) {
  if (typeof eliminarZonaOperacionSupabase !== "function") {
    return true;
  }

  const zonaEliminadaOnline =
    await eliminarZonaOperacionSupabase(zona);

  if (zonaDebeConfirmarGuardadoOnline() && !zonaEliminadaOnline) {
    avisarZonaSinConfirmacionOnline(accion);
    return false;
  }

  return true;
}
async function agregarZona(event) {
  event.preventDefault();

  if (!tienePermiso("zonas")) {
    alert("Tu rol no tiene permiso para modificar zonas.");
    return;
  }

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
      return normalizarTexto(zona.nombre) === normalizarTexto(nombre) &&
        zona.codigo !== zonaEditando;
    });

  if (existeZona) {
    alert("Ya existe una zona con ese nombre.");
    return;
  }

  if (zonaEditando !== null) {
    const zona =
      zonas.find(function (zonaGuardada) {
        return zonaGuardada.codigo === zonaEditando;
      });

    if (!zona) {
      zonaEditando = null;
      return;
    }

    const nombreAnterior =
      zona.nombre;

    zona.nombre = nombre;
    zona.descripcion = descripcion;

    clientes.forEach(function (cliente) {
      if (normalizarTexto(cliente.zona || "") === normalizarTexto(nombreAnterior)) {
        cliente.zona = nombre;
      }
    });

    zonaEditando = null;
    dom.zonaForm.reset();
    dom.zonaSubmitButton.textContent = "Agregar zona";
    guardarZonas();
    guardarClientes();

    const zonaConfirmadaOnline =
      await confirmarGuardadoZonaOnline(zona, "La zona");

    if (!zonaConfirmadaOnline) {
      return;
    }

    renderizarZonas();
    renderizarClientes();

    registrarAuditoria(
      "Zonas",
      "Edito zona",
      zona.codigo + " - " + nombreAnterior + " > " + zona.nombre
    );

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

  const zonaConfirmadaOnline =
    await confirmarGuardadoZonaOnline(nuevaZona, "La zona");

  if (!zonaConfirmadaOnline) {
    return;
  }

  dom.zonaForm.reset();
  renderizarZonas();

  registrarAuditoria(
    "Zonas",
    "Creo zona",
    nuevaZona.codigo + " - " + nuevaZona.nombre
  );
}

function editarZona(codigo) {
  if (!tienePermiso("zonas")) {
    alert("Tu rol no tiene permiso para editar zonas.");
    return;
  }

  const zona =
    zonas.find(function (zonaGuardada) {
      return zonaGuardada.codigo === codigo;
    });

  if (!zona) {
    return;
  }

  zonaEditando = codigo;
  dom.zonaNombreInput.value = zona.nombre;
  dom.zonaDescripcionInput.value = zona.descripcion || "";
  dom.zonaSubmitButton.textContent = "Guardar cambios";
  dom.zonaNombreInput.focus();
}

async function eliminarZona(codigo) {
  if (!tienePermiso("zonas")) {
    alert("Tu rol no tiene permiso para eliminar zonas.");
    return;
  }

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
    alert("No se puede eliminar una zona con clientes asignados. Primero cambia esos clientes a otra zona.");
    return;
  }

  const confirmar =
    confirm("Eliminar zona " + zona.nombre + "?");

  if (!confirmar) {
    return;
  }

  const zonaEliminadaOnline =
    await confirmarEliminacionZonaOnline(zona, "La eliminacion de la zona");

  if (!zonaEliminadaOnline) {
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
