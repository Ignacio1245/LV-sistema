let usuariosSistema = [
    {
        codigo: 1,
        nombre: "Ignacio",
        rol: "SUPERADMIN",
        activo: true
    },
    {
        codigo: 2,
        nombre: "Vendedor",
        rol: "VENDEDOR",
        activo: true
    }
];

let usuarioActual = {
    codigo: 1,
    nombre: "Ignacio",
    rol: "SUPERADMIN"
};

function obtenerSiguienteCodigoUsuario() {
    if (usuariosSistema.length === 0) {
        return 1;
    }

    const codigos =
        usuariosSistema.map(function (usuario) {
            return Number(usuario.codigo) || 0;
        });

    return Math.max.apply(null, codigos) + 1;
}

function guardarUsuariosSistema() {
    localStorage.setItem(
        "usuariosSistema",
        JSON.stringify(usuariosSistema)
    );
}

function cargarUsuariosSistema() {
    const usuariosGuardados = localStorage.getItem("usuariosSistema");

    if (!usuariosGuardados) {
        return;
    }

    const datosUsuarios = JSON.parse(usuariosGuardados);

    if (!Array.isArray(datosUsuarios)) {
        return;
    }

    usuariosSistema = datosUsuarios.map(function (usuario, indice) {
        return {
            codigo: Number(usuario.codigo) || indice + 1,
            nombre: usuario.nombre || "Usuario",
            rol: ROLES[usuario.rol] ? usuario.rol : "VENDEDOR",
            activo: usuario.activo !== false
        };
    });
}

function guardarUsuarioActual() {
    localStorage.setItem(
        "usuarioActual",
        JSON.stringify(usuarioActual)
    );
}

function cargarUsuarioActual() {
    const usuarioGuardado = localStorage.getItem("usuarioActual");

    if (!usuarioGuardado) {
        return;
    }

    const datosUsuario = JSON.parse(usuarioGuardado);

    const usuarioEncontrado =
        usuariosSistema.find(function (usuario) {
            return usuario.codigo === Number(datosUsuario.codigo) && usuario.activo;
        });

    if (usuarioEncontrado) {
        usuarioActual.codigo = usuarioEncontrado.codigo;
        usuarioActual.nombre = usuarioEncontrado.nombre;
        usuarioActual.rol = usuarioEncontrado.rol;
        return;
    }

    const primerUsuarioActivo =
        usuariosSistema.find(function (usuario) {
            return usuario.activo;
        });

    if (primerUsuarioActivo) {
        usuarioActual.codigo = primerUsuarioActivo.codigo;
        usuarioActual.nombre = primerUsuarioActivo.nombre;
        usuarioActual.rol = primerUsuarioActivo.rol;
        guardarUsuarioActual();
    }
}

function renderizarUsuarioActual() {
    if (dom.usuarioRolInput) {
        dom.usuarioRolInput.innerHTML =
            usuariosSistema.filter(function (usuario) {
                return usuario.activo;
            }).map(function (usuario) {
                return `
          <option value="${usuario.codigo}">
            ${usuario.nombre} | ${usuario.rol}
          </option>
        `;
            }).join("");

        dom.usuarioRolInput.value = String(usuarioActual.codigo);
    }
}

function renderizarUsuariosSistema() {
    if (!dom.usuariosSistemaTable) {
        return;
    }

    renderizarUsuarioActual();

    if (usuariosSistema.length === 0) {
        dom.usuariosSistemaTable.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table">No hay usuarios cargados.</td>
      </tr>
    `;
        return;
    }

    dom.usuariosSistemaTable.innerHTML =
        usuariosSistema.map(function (usuario) {
            const estadoTexto =
                usuario.activo ? "Activo" : "Inactivo";

            const estadoClase =
                usuario.activo ? "stock-ok" : "stock-inactive";

            const botonEstado =
                usuario.activo ? "Desactivar" : "Activar";

            return `
      <tr>
        <td>${usuario.codigo}</td>
        <td>${usuario.nombre}</td>
        <td>${usuario.rol}</td>
        <td>
          <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
        </td>
        <td>
          <button class="btn btn-secondary" onclick="usarUsuarioSistema(${usuario.codigo})">
            Usar
          </button>
          <button class="btn btn-secondary" onclick="cambiarEstadoUsuarioSistema(${usuario.codigo})">
            ${botonEstado}
          </button>
          <button class="btn btn-danger" onclick="eliminarUsuarioSistema(${usuario.codigo})">
            Eliminar
          </button>
        </td>
      </tr>
    `;
        }).join("");
}

function agregarUsuarioSistema(event) {
    event.preventDefault();

    const nombre =
        dom.usuarioNombreInput.value.trim();

    const rol =
        dom.usuarioNuevoRolInput.value;

    if (nombre === "") {
        alert("El nombre del usuario es obligatorio.");
        return;
    }

    const nuevoUsuario = {
        codigo: obtenerSiguienteCodigoUsuario(),
        nombre: nombre,
        rol: rol,
        activo: true
    };

    usuariosSistema.push(nuevoUsuario);

    guardarUsuariosSistema();
    registrarAuditoria(
        "Usuarios",
        "Creo usuario",
        nuevoUsuario.codigo + " - " + nuevoUsuario.nombre + " | " + nuevoUsuario.rol
    );
    dom.usuarioForm.reset();
    renderizarUsuariosSistema();
}

function usarUsuarioSistema(codigo) {
    const usuario =
        usuariosSistema.find(function (usuarioGuardado) {
            return usuarioGuardado.codigo === codigo;
        });

    if (!usuario || !usuario.activo) {
        alert("No se puede usar un usuario inactivo.");
        return;
    }

    usuarioActual.codigo = usuario.codigo;
    usuarioActual.nombre = usuario.nombre;
    usuarioActual.rol = usuario.rol;

    guardarUsuarioActual();
    registrarAuditoria(
        "Usuarios",
        "Cambio usuario actual",
        usuario.codigo + " - " + usuario.nombre + " | " + usuario.rol
    );
    renderizarUsuariosSistema();
    aplicarPermisosDeUsuario();
    mostrarPagina("dashboard");
}

function cambiarEstadoUsuarioSistema(codigo) {
    const usuario =
        usuariosSistema.find(function (usuarioGuardado) {
            return usuarioGuardado.codigo === codigo;
        });

    if (!usuario) {
        return;
    }

    if (usuario.codigo === usuarioActual.codigo && usuario.activo) {
        alert("No podes desactivar el usuario que estas usando.");
        return;
    }

    usuario.activo = !usuario.activo;

    guardarUsuariosSistema();
    registrarAuditoria(
        "Usuarios",
        usuario.activo ? "Activo usuario" : "Desactivo usuario",
        usuario.codigo + " - " + usuario.nombre
    );
    renderizarUsuariosSistema();
}

function eliminarUsuarioSistema(codigo) {
    const usuario =
        usuariosSistema.find(function (usuarioGuardado) {
            return usuarioGuardado.codigo === codigo;
        });

    if (!usuario) {
        return;
    }

    if (usuario.codigo === usuarioActual.codigo) {
        alert("No podes eliminar el usuario que estas usando.");
        return;
    }

    const confirmar =
        confirm("Eliminar usuario " + usuario.nombre + "?");

    if (!confirmar) {
        return;
    }

    usuariosSistema =
        usuariosSistema.filter(function (usuarioGuardado) {
            return usuarioGuardado.codigo !== codigo;
        });

    guardarUsuariosSistema();
    registrarAuditoria(
        "Usuarios",
        "Elimino usuario",
        usuario.codigo + " - " + usuario.nombre
    );
    renderizarUsuariosSistema();
}

function tienePermiso(modulo){
    const permisosDelRol = ROLES[usuarioActual.rol];

    if (!permisosDelRol) {
        return false;
    }

    return permisosDelRol[modulo] === true;
}
