let auditoria = [];

function guardarAuditoria() {
  localStorage.setItem(
    "auditoria",
    JSON.stringify(auditoria)
  );
}

function cargarAuditoria() {
  const auditoriaGuardada =
    localStorage.getItem("auditoria");

  if (!auditoriaGuardada) {
    return;
  }

  const datosAuditoria =
    JSON.parse(auditoriaGuardada);

  if (Array.isArray(datosAuditoria)) {
    auditoria = datosAuditoria;
  }
}

function registrarAuditoria(modulo, accion, detalle) {
  const ahora = new Date();

  auditoria.unshift({
    fecha: ahora.toLocaleDateString("es-AR"),
    hora: ahora.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    usuario: usuarioActual ? usuarioActual.nombre : "Sistema",
    rol: usuarioActual ? usuarioActual.rol : "-",
    modulo: modulo,
    accion: accion,
    detalle: detalle || "-"
  });

  if (auditoria.length > 500) {
    auditoria = auditoria.slice(0, 500);
  }

  guardarAuditoria();
  renderizarAuditoria();
}

function renderizarAuditoria() {
  if (!dom.auditoriaTable) {
    return;
  }

  const textoBusqueda =
    normalizarTexto(dom.buscarAuditoriaInput.value || "");

  const registrosFiltrados =
    auditoria.filter(function (registro) {
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
    });

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
