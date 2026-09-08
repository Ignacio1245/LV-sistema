let rubroEditando = null;

function obtenerSiguienteCodigoRubro() {
  if (rubros.length === 0) {
    return 1;
  }

  const codigos =
    rubros.map(function (rubro) {
      return Number(rubro.codigo) || 0;
    });

  return Math.max.apply(null, codigos) + 1;
}

function rubroActivo(rubro) {
  return rubro.activo !== false;
}

function contarProductosPorRubro(nombreRubro) {
  return productos.filter(function (producto) {
    return normalizarTexto(producto.rubro || "Sin rubro") === normalizarTexto(nombreRubro);
  }).length;
}

function asegurarRubroPorNombre(nombreRubro) {
  const nombreLimpio =
    nombreRubro && nombreRubro.trim() !== "" ? nombreRubro.trim() : "Sin rubro";

  const rubroExistente =
    rubros.find(function (rubro) {
      return normalizarTexto(rubro.nombre) === normalizarTexto(nombreLimpio);
    });

  if (rubroExistente) {
    return rubroExistente.nombre;
  }

  const nuevoRubro = {
    codigo: obtenerSiguienteCodigoRubro(),
    nombre: nombreLimpio,
    descripcion: "Creado automaticamente",
    activo: true
  };

  rubros.push(nuevoRubro);
  guardarRubros();

  return nuevoRubro.nombre;
}

function reconstruirRubrosDesdeProductos() {
  let huboCambios = false;

  productos.forEach(function (producto) {
    const nombreRubro =
      producto.rubro && producto.rubro.trim() !== "" ? producto.rubro.trim() : "";

    if (nombreRubro === "" || normalizarTexto(nombreRubro) === normalizarTexto("Sin rubro")) {
      return;
    }

    const existe =
      rubros.some(function (rubro) {
        return normalizarTexto(rubro.nombre) === normalizarTexto(nombreRubro);
      });

    if (existe) {
      return;
    }

    rubros.push({
      codigo: obtenerSiguienteCodigoRubro(),
      nombre: nombreRubro,
      descripcion: "Creado desde productos",
      activo: true
    });
    huboCambios = true;
  });

  if (huboCambios) {
    guardarRubros();
  }
}

function renderizarOpcionesRubrosActivos() {
  if (!dom.rubrosActivosLista) {
    return;
  }

  dom.rubrosActivosLista.innerHTML =
    rubros.filter(rubroActivo).map(function (rubro) {
      return html`<option value="${rubro.nombre}"></option>`;
    }).join("");
}

function renderizarRubros() {
  if (!dom.rubrosTable) {
    return;
  }

  reconstruirRubrosDesdeProductos();

  const textoBusqueda =
    normalizarTexto(dom.buscarRubroInput.value || "");

  const rubrosFiltrados =
    rubros.filter(function (rubro) {
      return textoBusqueda === "" ||
        normalizarTexto(rubro.nombre).includes(textoBusqueda) ||
        normalizarTexto(rubro.descripcion || "").includes(textoBusqueda);
    }).sort(function (primero, segundo) {
      return primero.codigo - segundo.codigo;
    });

  const rubrosActivos =
    rubros.filter(rubroActivo).length;

  const productosAsignados =
    productos.filter(function (producto) {
      return producto.rubro && producto.rubro !== "Sin rubro";
    }).length;

  dom.rubrosActivosResumen.textContent = rubrosActivos;
  dom.rubrosProductosResumen.textContent = productosAsignados;
  dom.rubrosSinAsignarResumen.textContent = productos.length - productosAsignados;

  renderizarOpcionesRubrosActivos();

  if (rubrosFiltrados.length === 0) {
    dom.rubrosTable.innerHTML = html`
      <tr>
        <td colspan="6" class="empty-table">
          No hay rubros para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  dom.rubrosTable.innerHTML =
    rubrosFiltrados.map(function (rubro) {
      return html`
        <tr>
          <td>${rubro.codigo}</td>
          <td>${rubro.nombre}</td>
          <td>${rubro.descripcion || "-"}</td>
          <td>${contarProductosPorRubro(rubro.nombre)}</td>
          <td>
            <span class="stock-pill stock-ok">Activo</span>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="editarRubro(${rubro.codigo})">
              Editar
            </button>
            <button class="btn btn-danger btn-eliminar" onclick="eliminarRubro(${rubro.codigo})">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join("");
}

function rubroDebeConfirmarGuardadoOnline() {
  return typeof puedeGuardarOperacionEnSupabase === "function" &&
    puedeGuardarOperacionEnSupabase();
}

function avisarRubroSinConfirmacionOnline(accion) {
  if (!rubroDebeConfirmarGuardadoOnline()) {
    return;
  }

  alert(
    accion + " quedo guardado localmente, pero Supabase no confirmo todo. " +
    "Actualiza datos y revisa la conexion antes de seguir operando."
  );
}

async function confirmarGuardadoRubroOnline(rubro, accion) {
  if (typeof guardarRubroOperacionSupabase !== "function") {
    return true;
  }

  const rubroGuardadoOnline =
    await guardarRubroOperacionSupabase(rubro);

  if (rubroDebeConfirmarGuardadoOnline() && !rubroGuardadoOnline) {
    avisarRubroSinConfirmacionOnline(accion);
    return false;
  }

  return true;
}

async function confirmarEliminacionRubroOnline(rubro, accion) {
  if (typeof eliminarRubroOperacionSupabase !== "function") {
    return true;
  }

  const rubroEliminadoOnline =
    await eliminarRubroOperacionSupabase(rubro);

  if (rubroDebeConfirmarGuardadoOnline() && !rubroEliminadoOnline) {
    avisarRubroSinConfirmacionOnline(accion);
    return false;
  }

  return true;
}
async function agregarRubro(event) {
  event.preventDefault();

  if (!tienePermiso("rubros")) {
    alert("Tu rol no tiene permiso para modificar rubros.");
    return;
  }

  const nombre =
    dom.rubroNombreInput.value.trim();

  const descripcion =
    dom.rubroDescripcionInput.value.trim() || "-";

  if (nombre === "") {
    alert("El nombre del rubro es obligatorio.");
    return;
  }

  const existeRubro =
    rubros.some(function (rubro) {
      return normalizarTexto(rubro.nombre) === normalizarTexto(nombre) &&
        rubro.codigo !== rubroEditando;
    });

  if (existeRubro) {
    alert("Ya existe un rubro con ese nombre.");
    return;
  }

  if (rubroEditando !== null) {
    await actualizarRubroEditado(nombre, descripcion);
    return;
  }

  const nuevoRubro = {
    codigo: obtenerSiguienteCodigoRubro(),
    nombre: nombre,
    descripcion: descripcion,
    activo: true
  };

  rubros.push(nuevoRubro);
  guardarRubros();

  const rubroConfirmadoOnline =
    await confirmarGuardadoRubroOnline(nuevoRubro, "El rubro");

  if (!rubroConfirmadoOnline) {
    return;
  }

  dom.rubroForm.reset();
  renderizarRubros();

  registrarAuditoria(
    "Rubros",
    "Creo rubro",
    nuevoRubro.codigo + " - " + nuevoRubro.nombre
  );
}

async function actualizarRubroEditado(nombre, descripcion) {
  if (!tienePermiso("rubros")) {
    alert("Tu rol no tiene permiso para editar rubros.");
    return;
  }

  const rubro =
    rubros.find(function (rubroGuardado) {
      return rubroGuardado.codigo === rubroEditando;
    });

  if (!rubro) {
    cancelarEdicionRubro();
    return;
  }

  const nombreAnterior =
    rubro.nombre;

  rubro.nombre = nombre;
  rubro.descripcion = descripcion;

  productos.forEach(function (producto) {
    if (normalizarTexto(producto.rubro || "") === normalizarTexto(nombreAnterior)) {
      producto.rubro = nombre;
    }
  });

  guardarRubros();
  guardarProductos();

  const rubroConfirmadoOnline =
    await confirmarGuardadoRubroOnline(rubro, "El rubro");

  if (!rubroConfirmadoOnline) {
    return;
  }

  if (typeof cerrarEditorCompacto === "function") {
    cerrarEditorCompacto(true);
  }
  cancelarEdicionRubro();
  renderizarRubros();
  renderizarProductos();
  renderizarOpcionesRubrosActivos();
  if (typeof mostrarAvisoPractico === "function") {
    mostrarAvisoPractico("Rubro actualizado correctamente.");
  }

  registrarAuditoria(
    "Rubros",
    "Edito rubro",
    rubro.codigo + " - " + nombreAnterior + " > " + rubro.nombre
  );
}

function editarRubro(codigo) {
  if (!tienePermiso("rubros")) {
    alert("Tu rol no tiene permiso para editar rubros.");
    return;
  }

  const rubro =
    rubros.find(function (rubroGuardado) {
      return rubroGuardado.codigo === codigo;
    });

  if (!rubro) {
    return;
  }

  rubroEditando = codigo;
  dom.rubroNombreInput.value = rubro.nombre;
  dom.rubroDescripcionInput.value = rubro.descripcion || "";
  dom.rubroSubmitButton.textContent = "Guardar cambios";
  dom.cancelarEdicionRubroButton.classList.remove("hidden");
  if (typeof abrirEditorCompacto === "function") {
    abrirEditorCompacto(dom.rubroForm, {
      titulo: "Editar rubro",
      subtitulo: rubro.codigo + " · " + rubro.nombre,
      alCerrar: cancelarEdicionRubro
    });
  }
  dom.rubroNombreInput.focus();
}

function cancelarEdicionRubro() {
  rubroEditando = null;
  dom.rubroForm.reset();
  dom.rubroSubmitButton.textContent = "Agregar rubro";
  dom.cancelarEdicionRubroButton.classList.add("hidden");
}

async function eliminarRubro(codigo) {
  if (!tienePermiso("rubros")) {
    alert("Tu rol no tiene permiso para eliminar rubros.");
    return;
  }

  const rubro =
    rubros.find(function (rubroGuardado) {
      return rubroGuardado.codigo === codigo;
    });

  if (!rubro) {
    return;
  }

  const productosDelRubro =
    contarProductosPorRubro(rubro.nombre);

  if (productosDelRubro > 0) {
    alert("No se puede eliminar un rubro con productos asignados. Primero cambia esos productos a otro rubro.");
    return;
  }

  const confirmar =
    confirm("Eliminar rubro " + rubro.nombre + "?");

  if (!confirmar) {
    return;
  }

  const rubroEliminadoOnline =
    await confirmarEliminacionRubroOnline(rubro, "La eliminacion del rubro");

  if (!rubroEliminadoOnline) {
    return;
  }

  rubros =
    rubros.filter(function (rubroGuardado) {
      return rubroGuardado.codigo !== codigo;
    });

  guardarRubros();
  renderizarRubros();

  registrarAuditoria(
    "Rubros",
    "Elimino rubro",
    rubro.codigo + " - " + rubro.nombre
  );
}
