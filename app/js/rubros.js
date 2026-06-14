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

function renderizarOpcionesRubrosActivos() {
  if (!dom.rubrosActivosLista) {
    return;
  }

  dom.rubrosActivosLista.innerHTML =
    rubros.filter(rubroActivo).map(function (rubro) {
      return `<option value="${rubro.nombre}"></option>`;
    }).join("");
}

function renderizarRubros() {
  if (!dom.rubrosTable) {
    return;
  }

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
    dom.rubrosTable.innerHTML = `
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
      const estadoTexto = rubroActivo(rubro) ? "Activo" : "Inactivo";
      const estadoClase = rubroActivo(rubro) ? "stock-ok" : "stock-inactive";
      const accionEstado = rubroActivo(rubro) ? "Desactivar" : "Activar";

      return `
        <tr>
          <td>${rubro.codigo}</td>
          <td>${rubro.nombre}</td>
          <td>${rubro.descripcion || "-"}</td>
          <td>${contarProductosPorRubro(rubro.nombre)}</td>
          <td>
            <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
          </td>
          <td>
            <button class="btn btn-secondary" onclick="editarRubro(${rubro.codigo})">
              Editar
            </button>
            <button class="btn btn-secondary" onclick="cambiarEstadoRubro(${rubro.codigo})">
              ${accionEstado}
            </button>
            <button class="btn btn-danger" onclick="eliminarRubro(${rubro.codigo})">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join("");
}

function agregarRubro(event) {
  event.preventDefault();

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
    actualizarRubroEditado(nombre, descripcion);
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
  dom.rubroForm.reset();
  renderizarRubros();

  registrarAuditoria(
    "Rubros",
    "Creo rubro",
    nuevoRubro.codigo + " - " + nuevoRubro.nombre
  );
}

function actualizarRubroEditado(nombre, descripcion) {
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
  cancelarEdicionRubro();
  renderizarRubros();
  renderizarProductos();
  renderizarOpcionesRubrosActivos();

  registrarAuditoria(
    "Rubros",
    "Edito rubro",
    rubro.codigo + " - " + nombreAnterior + " > " + rubro.nombre
  );
}

function editarRubro(codigo) {
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
  dom.rubroNombreInput.focus();
}

function cancelarEdicionRubro() {
  rubroEditando = null;
  dom.rubroForm.reset();
  dom.rubroSubmitButton.textContent = "Agregar rubro";
  dom.cancelarEdicionRubroButton.classList.add("hidden");
}

function cambiarEstadoRubro(codigo) {
  const rubro =
    rubros.find(function (rubroGuardado) {
      return rubroGuardado.codigo === codigo;
    });

  if (!rubro) {
    return;
  }

  rubro.activo = !rubroActivo(rubro);

  guardarRubros();
  renderizarRubros();

  registrarAuditoria(
    "Rubros",
    rubro.activo ? "Activo rubro" : "Desactivo rubro",
    rubro.codigo + " - " + rubro.nombre
  );
}

function eliminarRubro(codigo) {
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
    alert("No se puede eliminar un rubro con productos asignados. Desactivalo si no lo queres usar mas.");
    return;
  }

  const confirmar =
    confirm("Eliminar rubro " + rubro.nombre + "?");

  if (!confirmar) {
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
