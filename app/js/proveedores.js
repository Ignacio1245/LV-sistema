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
      return textoBusqueda === "" ||
        normalizarTexto(proveedor.nombre).includes(textoBusqueda) ||
        normalizarTexto(proveedor.telefono || "").includes(textoBusqueda) ||
        normalizarTexto(proveedor.contacto || "").includes(textoBusqueda) ||
        normalizarTexto(proveedor.observacion || "").includes(textoBusqueda);
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
          <td>${proveedor.codigo}</td>
          <td>${proveedor.nombre}</td>
          <td>${proveedor.telefono || "-"}</td>
          <td>${proveedor.contacto || "-"}</td>
          <td>${contarProductosPorProveedor(proveedor.nombre)}</td>
          <td>
            <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
          </td>
          <td>
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

function agregarProveedor(event) {
  event.preventDefault();

  const nombre =
    dom.proveedorNombreInput.value.trim();

  if (nombre === "") {
    alert("El nombre del proveedor es obligatorio.");
    return;
  }

  const existeProveedor =
    proveedores.some(function (proveedor) {
      return normalizarTexto(proveedor.nombre) === normalizarTexto(nombre);
    });

  if (existeProveedor) {
    alert("Ya existe un proveedor con ese nombre.");
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
  dom.proveedorForm.reset();
  renderizarProveedores();

  registrarAuditoria(
    "Proveedores",
    "Creo proveedor",
    nuevoProveedor.codigo + " - " + nuevoProveedor.nombre
  );
}

function cambiarEstadoProveedor(codigo) {
  const proveedor =
    proveedores.find(function (proveedorGuardado) {
      return proveedorGuardado.codigo === codigo;
    });

  if (!proveedor) {
    return;
  }

  proveedor.activo = !proveedorActivo(proveedor);

  guardarProveedores();
  renderizarProveedores();

  registrarAuditoria(
    "Proveedores",
    proveedor.activo ? "Activo proveedor" : "Desactivo proveedor",
    proveedor.codigo + " - " + proveedor.nombre
  );
}

function eliminarProveedor(codigo) {
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
  renderizarProveedores();

  registrarAuditoria(
    "Proveedores",
    "Elimino proveedor",
    proveedor.codigo + " - " + proveedor.nombre
  );
}
