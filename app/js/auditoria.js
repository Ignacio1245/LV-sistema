let auditoria = [];

function guardarAuditoria() {
  dataStore.guardarLista("auditoria", auditoria);
}

function cargarAuditoria() {
  const auditoriaGuardada =
    dataStore.leerLista("auditoria");

  if (!auditoriaGuardada) {
    return;
  }

  const datosAuditoria =
    auditoriaGuardada;

  if (Array.isArray(datosAuditoria)) {
    auditoria = datosAuditoria;
  }
}

function registrarAuditoria(modulo, accion, detalle) {
  const ahora = new Date();

  const registroAuditoria = {
    usuarioIdSupabase: usuarioActual ? usuarioActual.idSupabase : null,
    fecha: ahora.toLocaleDateString("es-AR"),
    hora: ahora.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    fechaIso: ahora.toISOString(),
    usuario: usuarioActual ? usuarioActual.nombre : "Sistema",
    rol: usuarioActual ? usuarioActual.rol : "-",
    modulo: modulo,
    accion: accion,
    detalle: detalle || "-"
  };

  auditoria.unshift(registroAuditoria);

  if (auditoria.length > 500) {
    auditoria = auditoria.slice(0, 500);
  }

  guardarAuditoria();
  guardarAuditoriaOperacionSupabase(registroAuditoria);
  renderizarAuditoria();

  if (typeof actualizarDashboard === "function") {
    actualizarDashboard();
  }
}

function obtenerFechaAuditoriaParaFiltro(fechaAuditoria) {
  if (!fechaAuditoria) {
    return "";
  }

  if (fechaAuditoria.includes("-")) {
    return fechaAuditoria;
  }

  const partesFecha =
    fechaAuditoria.split("/");

  if (partesFecha.length !== 3) {
    return "";
  }

  return partesFecha[2] + "-" +
    partesFecha[1].padStart(2, "0") + "-" +
    partesFecha[0].padStart(2, "0");
}

function renderizarOpcionesAuditoria() {
  if (!dom.auditoriaUsuarioFiltro) {
    return;
  }

  const usuarioSeleccionado = dom.auditoriaUsuarioFiltro.value || "TODOS";
  const moduloSeleccionado = dom.auditoriaModuloFiltro.value || "TODOS";
  const accionSeleccionada = dom.auditoriaAccionFiltro.value || "TODAS";

  const usuarios =
    [...new Set(auditoria.map(function (registro) {
      return registro.usuario || "Sistema";
    }))].sort();

  const modulos =
    [...new Set(auditoria.map(function (registro) {
      return registro.modulo || "-";
    }))].sort();

  const acciones =
    [...new Set(auditoria.map(function (registro) {
      return registro.accion || "-";
    }))].sort();

  dom.auditoriaUsuarioFiltro.innerHTML =
    `<option value="TODOS">Todos los usuarios</option>` +
    usuarios.map(function (usuario) {
      return `<option value="${usuario}">${usuario}</option>`;
    }).join("");

  dom.auditoriaModuloFiltro.innerHTML =
    `<option value="TODOS">Todos los modulos</option>` +
    modulos.map(function (modulo) {
      return `<option value="${modulo}">${modulo}</option>`;
    }).join("");

  dom.auditoriaAccionFiltro.innerHTML =
    `<option value="TODAS">Todas las acciones</option>` +
    acciones.map(function (accion) {
      return `<option value="${accion}">${accion}</option>`;
    }).join("");

  dom.auditoriaUsuarioFiltro.value = usuarios.includes(usuarioSeleccionado) ? usuarioSeleccionado : "TODOS";
  dom.auditoriaModuloFiltro.value = modulos.includes(moduloSeleccionado) ? moduloSeleccionado : "TODOS";
  dom.auditoriaAccionFiltro.value = acciones.includes(accionSeleccionada) ? accionSeleccionada : "TODAS";
}

function obtenerAuditoriaFiltrada() {
  const textoBusqueda =
    normalizarTexto(dom.buscarAuditoriaInput.value || "");

  const filtroFechaDesde =
    dom.auditoriaFechaDesdeFiltro.value || "";

  const filtroFechaHasta =
    dom.auditoriaFechaHastaFiltro.value || "";

  const filtroUsuario =
    dom.auditoriaUsuarioFiltro.value || "TODOS";

  const filtroModulo =
    dom.auditoriaModuloFiltro.value || "TODOS";

  const filtroAccion =
    dom.auditoriaAccionFiltro.value || "TODAS";

  return auditoria.filter(function (registro) {
      const textoRegistro =
        [
          registro.fecha,
          registro.hora,
          registro.usuario,
          registro.rol,
          registro.modulo,
          registro.accion,
          registro.detalle
        ].join(" ");

      return textoBusqueda === "" ||
        normalizarTexto(textoRegistro).includes(textoBusqueda);
    }).filter(function (registro) {
      const fechaRegistro =
        obtenerFechaAuditoriaParaFiltro(registro.fecha);

      const coincideFechaDesde =
        filtroFechaDesde === "" ||
        (fechaRegistro !== "" && fechaRegistro >= filtroFechaDesde);

      const coincideFechaHasta =
        filtroFechaHasta === "" ||
        (fechaRegistro !== "" && fechaRegistro <= filtroFechaHasta);

      const coincideUsuario =
        filtroUsuario === "TODOS" ||
        registro.usuario === filtroUsuario;

      const coincideModulo =
        filtroModulo === "TODOS" ||
        registro.modulo === filtroModulo;

      const coincideAccion =
        filtroAccion === "TODAS" ||
        registro.accion === filtroAccion;

      return coincideFechaDesde && coincideFechaHasta && coincideUsuario && coincideModulo && coincideAccion;
    });
}

function renderizarAuditoria() {
  if (!dom.auditoriaTable) {
    return;
  }

  renderizarOpcionesAuditoria();

  const registrosFiltrados =
    obtenerAuditoriaFiltrada();

  dom.auditoriaTotalResumen.textContent = registrosFiltrados.length;
  dom.auditoriaUltimaResumen.textContent =
    auditoria.length > 0 ? auditoria[0].fecha + " " + auditoria[0].hora : "-";
  dom.auditoriaUsuarioResumen.textContent =
    usuarioActual ? usuarioActual.nombre : "-";

  if (registrosFiltrados.length === 0) {
    dom.auditoriaTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">
          No hay acciones para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  dom.auditoriaTable.innerHTML =
    registrosFiltrados.map(function (registro) {
      return `
      <tr>
        <td>${registro.fecha}</td>
        <td>${registro.hora}</td>
        <td>${registro.usuario}</td>
        <td>${registro.modulo}</td>
        <td>${registro.accion}</td>
        <td>${registro.detalle}</td>
      </tr>
    `;
    }).join("");
}

function limpiarFiltrosAuditoria() {
  dom.buscarAuditoriaInput.value = "";
  dom.auditoriaFechaDesdeFiltro.value = "";
  dom.auditoriaFechaHastaFiltro.value = "";
  dom.auditoriaUsuarioFiltro.value = "TODOS";
  dom.auditoriaModuloFiltro.value = "TODOS";
  dom.auditoriaAccionFiltro.value = "TODAS";
  renderizarAuditoria();
}

function exportarAuditoriaCsv() {
  const registros =
    obtenerAuditoriaFiltrada();

  if (registros.length === 0) {
    alert("No hay auditoria para exportar con esos filtros.");
    return;
  }

  descargarCsv(
    "auditoria-lv-sistema.csv",
    ["Fecha", "Hora", "Usuario", "Rol", "Modulo", "Accion", "Detalle"],
    registros.map(function (registro) {
      return [
        registro.fecha || "",
        registro.hora || "",
        registro.usuario || "",
        registro.rol || "",
        registro.modulo || "",
        registro.accion || "",
        registro.detalle || ""
      ];
    })
  );
}

function limpiarAuditoria() {
  const confirmar =
    confirm("Seguro que queres borrar el registro de auditoria?");

  if (!confirmar) {
    return;
  }

  auditoria = [];
  guardarAuditoria();
  renderizarAuditoria();
}
