let usuariosSistema = [
    {
        codigo: 1,
        nombre: "Ignacio",
        rol: "SUPERADMIN",
        email: "",
        activo: true
    },
    {
        codigo: 2,
        nombre: "Vendedor",
        rol: "VENDEDOR",
        email: "",
        activo: true
    }
];

let usuarioActual = {
    codigo: 1,
    nombre: "Ignacio",
    rol: "SUPERADMIN"
};

const PERMISOS_ROL = [
    "productos",
    "rubros",
    "zonas",
    "proveedores",
    "compras",
    "movimientos",
    "clientes",
    "ventas",
    "cuentaCorriente",
    "configuracion",
    "impresion",
    "auditoria",
    "informes"
];

let usuarioEditandoCodigo = null;
let rolEditandoNombre = null;

function obtenerNombreRolDesdeTexto(texto) {
    return normalizarTexto(texto)
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
}

function guardarRolesPersonalizados() {
    const rolesPersonalizados = {};

    Object.keys(ROLES).forEach(function (nombreRol) {
        if (["SUPERADMIN"].includes(nombreRol)) {
            return;
        }

        rolesPersonalizados[nombreRol] = ROLES[nombreRol];
    });

    dataStore.guardarLista(
        "rolesPersonalizados",
        rolesPersonalizados
    );

    programarSincronizacionAutomatica("administracion");
}

function cargarRolesPersonalizados() {
    const rolesGuardados =
        dataStore.leerLista("rolesPersonalizados");

    if (!rolesGuardados) {
        return;
    }

    const datosRoles =
        rolesGuardados;

    Object.keys(datosRoles).forEach(function (nombreRol) {
        const permisos = {};

        PERMISOS_ROL.forEach(function (permiso) {
            permisos[permiso] = datosRoles[nombreRol][permiso] === true;
        });

        ROLES[nombreRol] = permisos;
    });
}

function renderizarOpcionesRolesUsuario() {
    if (!dom.usuarioNuevoRolInput) {
        return;
    }

    const rolActual =
        dom.usuarioNuevoRolInput.value || "VENDEDOR";

    dom.usuarioNuevoRolInput.innerHTML =
        Object.keys(ROLES).map(function (nombreRol) {
            return `<option value="${nombreRol}">${nombreRol}</option>`;
        }).join("");

    dom.usuarioNuevoRolInput.value =
        ROLES[rolActual] ? rolActual : "VENDEDOR";
}

function renderizarOpcionesVendedoresCliente() {
    if (!dom.clientVendedorAsignadoInput) {
        return;
    }

    const vendedorSeleccionado =
        dom.clientVendedorAsignadoInput.value;

    const vendedoresDisponibles =
        typeof obtenerVendedoresComerciales === "function"
            ? obtenerVendedoresComerciales()
            : usuariosSistema;

    dom.clientVendedorAsignadoInput.innerHTML =
        `<option value="">Seleccionar vendedor</option>` +
        vendedoresDisponibles.filter(function (vendedor) {
            return vendedor.activo;
        }).map(function (vendedor) {
            const detalle =
                vendedor.zona ? " | " + vendedor.zona : vendedor.tipo ? " | " + vendedor.tipo : "";
            return `<option value="${vendedor.nombre}">${vendedor.nombre}${detalle}</option>`;
        }).join("");

    const existeVendedor =
        vendedoresDisponibles.some(function (vendedor) {
            return vendedor.activo && vendedor.nombre === vendedorSeleccionado;
        });

    dom.clientVendedorAsignadoInput.value =
        existeVendedor ? vendedorSeleccionado : "";
}

async function agregarRolPersonalizado(event) {
    event.preventDefault();

    if (!tienePermiso("configuracion")) {
        alert("No tenes permiso para crear roles.");
        return;
    }

    if (!usuarioSupabaseAutenticado()) {
        alert("No hay sesion online activa. Volve a iniciar sesion para crear roles.");
        return;
    }

    const nombreRol =
        obtenerNombreRolDesdeTexto(dom.rolNombreInput.value);

    if (nombreRol === "") {
        alert("Ingrese un nombre para el rol.");
        return;
    }

    if (rolEditandoNombre === null && ROLES[nombreRol]) {
        alert("Ya existe un rol con ese nombre.");
        return;
    }

    if (rolEditandoNombre !== null && rolEditandoNombre !== nombreRol && ROLES[nombreRol]) {
        alert("Ya existe otro rol con ese nombre.");
        return;
    }

    const permisos = {};

    PERMISOS_ROL.forEach(function (permiso) {
        permisos[permiso] = false;
    });

    dom.rolPermisosInputs.forEach(function (input) {
        permisos[input.dataset.rolePermission] = input.checked;
    });

    if (rolEditandoNombre !== null && rolEditandoNombre !== nombreRol) {
        usuariosSistema.forEach(function (usuario) {
            if (usuario.rol === rolEditandoNombre) {
                usuario.rol = nombreRol;
            }
        });
        delete ROLES[rolEditandoNombre];
    }

    ROLES[nombreRol] = permisos;
    guardarRolesPersonalizados();
    guardarUsuariosSistema();
    const rolGuardadoOnline =
        await guardarRolOperacionSupabase(nombreRol);

    if (!rolGuardadoOnline) {
        alert("El rol quedo guardado localmente, pero no se pudo sincronizar con Supabase.");
        renderizarRolesSistema();
        return;
    }

    renderizarOpcionesRolesUsuario();
    renderizarRolesSistema();
    renderizarUsuariosSistema();

    registrarAuditoria(
        "Usuarios",
        rolEditandoNombre === null ? "Creo rol" : "Edito rol",
        nombreRol
    );

    dom.rolForm.reset();
    cancelarEdicionRolSistema();
}

function obtenerRolesBaseSistema() {
    return ["SUPERADMIN"];
}

function renderizarRolesSistema() {
    if (!dom.rolesSistemaTable) {
        return;
    }

    const roles =
        Object.keys(ROLES).sort();

    if (roles.length === 0) {
        dom.rolesSistemaTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table">No hay roles configurados.</td>
            </tr>
        `;
        return;
    }

    dom.rolesSistemaTable.innerHTML =
        roles.map(function (nombreRol) {
            const permisos =
                Object.keys(ROLES[nombreRol] || {})
                    .filter(function (permiso) {
                        return ROLES[nombreRol][permiso] === true;
                    });
            const esBase =
                obtenerRolesBaseSistema().includes(nombreRol);

            return `
                <tr>
                    <td><strong>${nombreRol}</strong></td>
                    <td>${permisos.length > 0 ? permisos.join(", ") : "Sin permisos"}</td>
                    <td>${esBase ? "Base" : "Personalizado"}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="editarRolSistema('${nombreRol}')">
                            Editar
                        </button>
                        <button class="btn btn-danger" onclick="eliminarRolSistema('${nombreRol}')" ${esBase ? "disabled" : ""}>
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
}

function actualizarModoFormularioRol() {
    const editando =
        rolEditandoNombre !== null;

    if (dom.rolSubmitButton) {
        dom.rolSubmitButton.textContent =
            editando ? "Guardar rol" : "Crear rol";
    }

    if (dom.rolCancelarEdicionButton) {
        dom.rolCancelarEdicionButton.classList.toggle("hidden", !editando);
    }
}

function cancelarEdicionRolSistema() {
    rolEditandoNombre = null;
    if (dom.rolForm) {
        dom.rolForm.reset();
    }
    actualizarModoFormularioRol();
}

function editarRolSistema(nombreRol) {
    if (!ROLES[nombreRol]) {
        alert("No se encontro el rol.");
        return;
    }

    rolEditandoNombre = nombreRol;
    dom.rolNombreInput.value = nombreRol;
    dom.rolPermisosInputs.forEach(function (input) {
        input.checked = ROLES[nombreRol][input.dataset.rolePermission] === true;
    });
    actualizarModoFormularioRol();
    dom.rolNombreInput.focus();
}

async function eliminarRolSistema(nombreRol) {
    if (obtenerRolesBaseSistema().includes(nombreRol)) {
        alert("No se pueden eliminar los roles base del sistema.");
        return;
    }

    const usuariosConRol =
        usuariosSistema.filter(function (usuario) {
            return usuario.rol === nombreRol;
        }).length;

    if (usuariosConRol > 0) {
        alert("No se puede eliminar porque hay usuarios usando este rol.");
        return;
    }

    const confirmar =
        confirm("Eliminar rol " + nombreRol + "?");

    if (!confirmar) {
        return;
    }

    delete ROLES[nombreRol];
    guardarRolesPersonalizados();
    await eliminarRolOperacionSupabase(nombreRol);
    renderizarOpcionesRolesUsuario();
    renderizarRolesSistema();

    registrarAuditoria(
        "Usuarios",
        "Elimino rol",
        nombreRol
    );
}

function obtenerSiguienteCodigoUsuario() {
    limpiarUsuariosSistemaDuplicados();

    if (usuariosSistema.length === 0) {
        return 1;
    }

    const codigos =
        usuariosSistema.map(function (usuario) {
            return Number(usuario.codigo) || 0;
        });

    return Math.max.apply(null, codigos) + 1;
}

function normalizarEmailUsuarioSistema(email) {
    if (typeof normalizarEmailLogin === "function") {
        return normalizarEmailLogin(email);
    }

    return String(email || "").trim().toLowerCase();
}

function obtenerClaveUsuarioSistema(usuario) {
    const emailNormalizado =
        normalizarEmailUsuarioSistema(usuario.email);

    if (emailNormalizado) {
        return "email:" + emailNormalizado;
    }

    return "codigo:" + String(Number(usuario.codigo) || 0);
}

function elegirUsuarioSistemaPrincipal(usuarioActualGuardado, usuarioNuevo) {
    if (!usuarioActualGuardado) {
        return usuarioNuevo;
    }

    if (usuarioActualGuardado.activo !== true && usuarioNuevo.activo === true) {
        return usuarioNuevo;
    }

    if (!usuarioActualGuardado.idSupabase && usuarioNuevo.idSupabase) {
        return usuarioNuevo;
    }

    const codigoActual =
        Number(usuarioActualGuardado.codigo) || 0;
    const codigoNuevo =
        Number(usuarioNuevo.codigo) || 0;

    if (codigoActual === 0 || (codigoNuevo > 0 && codigoNuevo < codigoActual)) {
        return usuarioNuevo;
    }

    return usuarioActualGuardado;
}

function limpiarUsuariosSistemaDuplicados() {
    if (!Array.isArray(usuariosSistema)) {
        usuariosSistema = [];
    }

    const usuariosPorClave = {};

    usuariosSistema.forEach(function (usuario, indice) {
        if (!usuario || typeof usuario !== "object") {
            return;
        }

        const usuarioNormalizado = {
            idSupabase: usuario.idSupabase || null,
            rolIdSupabase: usuario.rolIdSupabase || null,
            codigo: Number(usuario.codigo) || indice + 1,
            nombre: usuario.nombre || "Usuario",
            rol: ROLES[usuario.rol] ? usuario.rol : "VENDEDOR",
            email: usuario.email || "",
            activo: usuario.activo !== false
        };

        const clave =
            obtenerClaveUsuarioSistema(usuarioNormalizado);

        usuariosPorClave[clave] =
            elegirUsuarioSistemaPrincipal(
                usuariosPorClave[clave],
                usuarioNormalizado
            );
    });

    usuariosSistema =
        Object.keys(usuariosPorClave)
            .map(function (clave) {
                return usuariosPorClave[clave];
            })
            .sort(function (usuarioA, usuarioB) {
                return (Number(usuarioA.codigo) || 0) - (Number(usuarioB.codigo) || 0);
            });
}

function guardarUsuariosSistema() {
    limpiarUsuariosSistemaDuplicados();

    dataStore.guardarLista(
        "usuariosSistema",
        usuariosSistema
    );

    programarSincronizacionAutomatica("administracion");
}

function cargarUsuariosSistema() {
    const usuariosGuardados =
        dataStore.leerLista("usuariosSistema");

    if (!usuariosGuardados) {
        return;
    }

    const datosUsuarios =
        usuariosGuardados;

    if (!Array.isArray(datosUsuarios)) {
        return;
    }

    usuariosSistema = datosUsuarios
        .filter(function (usuario) {
            return usuario && typeof usuario === "object";
        })
        .map(function (usuario, indice) {
            return {
                idSupabase: usuario.idSupabase || null,
                rolIdSupabase: usuario.rolIdSupabase || null,
                codigo: Number(usuario.codigo) || indice + 1,
                nombre: usuario.nombre || "Usuario",
                rol: ROLES[usuario.rol] ? usuario.rol : "VENDEDOR",
                email: usuario.email || "",
                activo: usuario.activo !== false
            };
        });

    limpiarUsuariosSistemaDuplicados();
}

function guardarUsuarioActual() {
    dataStore.guardarLista(
        "usuarioActual",
        { ...usuarioActual }
    );

    programarSincronizacionAutomatica("administracion");
}

function cargarUsuarioActual() {
    const usuarioGuardado =
        dataStore.leerLista("usuarioActual");

    if (!usuarioGuardado) {
        return;
    }

    const datosUsuario =
        usuarioGuardado;

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
    renderizarOpcionesRolesUsuario();
    renderizarOpcionesVendedoresCliente();

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

    limpiarUsuariosSistemaDuplicados();
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
        <td>
          <strong>${usuario.nombre}</strong>
          <small>${usuario.email || "Sin email asignado"}</small>
        </td>
        <td>${usuario.rol}</td>
        <td>
          <span class="stock-pill ${estadoClase}">${estadoTexto}</span>
        </td>
        <td>
          <button class="btn btn-secondary" onclick="editarUsuarioSistema(${usuario.codigo})">
            Editar
          </button>
          <button class="btn btn-secondary" onclick="enviarRecuperacionUsuarioSistema(${usuario.codigo})">
            Restablecer clave
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

function actualizarModoFormularioUsuario() {
    const editando =
        usuarioEditandoCodigo !== null;

    if (dom.usuarioEditandoCodigoInput) {
        dom.usuarioEditandoCodigoInput.value =
            editando ? String(usuarioEditandoCodigo) : "";
    }

    if (dom.usuarioSubmitButton) {
        dom.usuarioSubmitButton.textContent =
            editando ? "Guardar cambios" : "Agregar usuario";
    }

    if (dom.usuarioCancelarEdicionButton) {
        dom.usuarioCancelarEdicionButton.classList.toggle("hidden", !editando);
    }

    if (dom.usuarioPasswordInput) {
        dom.usuarioPasswordInput.placeholder =
            editando ? "Dejar vacio si no cambia" : "Minimo 6 caracteres";
        dom.usuarioPasswordInput.required = false;
    }
}

function cancelarEdicionUsuarioSistema() {
    usuarioEditandoCodigo = null;
    dom.usuarioForm.reset();
    actualizarModoFormularioUsuario();
}

function editarUsuarioSistema(codigo) {
    if (!tienePermiso("configuracion")) {
        alert("No tenes permiso para editar usuarios.");
        return;
    }

    const usuario =
        usuariosSistema.find(function (usuarioGuardado) {
            return usuarioGuardado.codigo === codigo;
        });

    if (!usuario) {
        return;
    }

    usuarioEditandoCodigo = codigo;
    dom.usuarioNombreInput.value = usuario.nombre || "";
    dom.usuarioEmailInput.value = usuario.email || "";
    dom.usuarioNuevoRolInput.value = ROLES[usuario.rol] ? usuario.rol : "VENDEDOR";

    if (dom.usuarioPasswordInput) {
        dom.usuarioPasswordInput.value = "";
    }

    actualizarModoFormularioUsuario();
    dom.usuarioNombreInput.focus();
}

async function agregarUsuarioSistema(event) {
    event.preventDefault();

    if (!tienePermiso("configuracion")) {
        alert("No tenes permiso para crear usuarios.");
        return;
    }

    if (!usuarioSupabaseAutenticado()) {
        alert("No hay sesion online activa. Volve a iniciar sesion para crear usuarios.");
        return;
    }

    const nombre =
        dom.usuarioNombreInput.value.trim();

    const rol =
        dom.usuarioNuevoRolInput.value;
    const email =
        dom.usuarioEmailInput.value.trim();
    const password =
        dom.usuarioPasswordInput ? dom.usuarioPasswordInput.value : "";
    const codigoEditando =
        usuarioEditandoCodigo;

    if (nombre === "") {
        alert("El nombre del usuario es obligatorio.");
        return;
    }

    if (email === "" || !email.includes("@")) {
        alert("Ingrese un email valido para el usuario.");
        return;
    }

    if (codigoEditando === null && password.length < 6) {
        alert("Ingrese una contrasena provisoria de al menos 6 caracteres.");
        return;
    }

    const emailYaAsignado =
        usuariosSistema.some(function (usuario) {
            return usuario.codigo !== codigoEditando &&
                normalizarEmailUsuarioSistema(usuario.email) === normalizarEmailUsuarioSistema(email);
        });

    if (emailYaAsignado) {
        alert("Ese email ya esta asignado a otro usuario del sistema.");
        return;
    }

    if (codigoEditando !== null) {
        await guardarEdicionUsuarioSistema(codigoEditando, nombre, email, rol, password);
        return;
    }

    try {
        await crearAccesoUsuarioSupabase(email, password);
    } catch (error) {
        console.error("No se pudo crear acceso de usuario:", error);
        alert("No se pudo crear el acceso de login en Supabase: " + (error.message || "error"));
        return;
    }

    const nuevoUsuario = {
        codigo: obtenerSiguienteCodigoUsuario(),
        nombre: nombre,
        rol: rol,
        email: email,
        activo: true
    };

    usuariosSistema.push(nuevoUsuario);

    guardarUsuariosSistema();
    const usuarioGuardadoOnline =
        await guardarUsuarioOperacionSupabase(nuevoUsuario);

    if (!usuarioGuardadoOnline) {
        usuariosSistema =
            usuariosSistema.filter(function (usuario) {
                return usuario.codigo !== nuevoUsuario.codigo;
            });
        guardarUsuariosSistema();
        renderizarUsuariosSistema();
        alert("No se pudo guardar el usuario en Supabase. No quedo creado para evitar datos a medias.");
        return;
    }

    registrarAuditoria(
        "Usuarios",
        "Creo usuario",
        nuevoUsuario.codigo + " - " + nuevoUsuario.nombre + " | " + nuevoUsuario.rol
    );
    dom.usuarioForm.reset();
    if (dom.usuarioPasswordInput) {
        dom.usuarioPasswordInput.value = "";
    }
    renderizarUsuariosSistema();
    renderizarOpcionesVendedoresCliente();
}

async function guardarEdicionUsuarioSistema(codigo, nombre, email, rol, password) {
    const usuario =
        usuariosSistema.find(function (usuarioGuardado) {
            return usuarioGuardado.codigo === codigo;
        });

    if (!usuario) {
        alert("No se encontro el usuario para editar.");
        return;
    }

    if (usuario.rol === "SUPERADMIN" && rol !== "SUPERADMIN" && contarSuperadminsActivos() <= 1) {
        alert("No podes cambiar el rol del ultimo SUPERADMIN activo.");
        return;
    }

    const emailAnterior =
        usuario.email || "";

    const cambioEmail =
        normalizarEmailUsuarioSistema(emailAnterior) !== normalizarEmailUsuarioSistema(email);

    if (cambioEmail && !password) {
        alert("Para cambiar el email de acceso tenes que ingresar una contrasena provisoria para ese nuevo email.");
        return;
    }

    if (cambioEmail && password) {
        try {
            await crearAccesoUsuarioSupabase(email, password);
        } catch (error) {
            console.error("No se pudo crear acceso de usuario:", error);
            alert("No se pudo crear el acceso de login para el nuevo email: " + (error.message || "error"));
            return;
        }
    }

    usuario.nombre = nombre;
    usuario.email = email;
    usuario.rol = rol;

    guardarUsuariosSistema();
    const usuarioGuardadoOnline =
        await guardarUsuarioOperacionSupabase(usuario);

    if (!usuarioGuardadoOnline) {
        alert("No se pudo guardar el usuario en Supabase. Revisa la conexion y permisos.");
        return;
    }

    if (usuario.codigo === usuarioActual.codigo) {
        usuarioActual.nombre = usuario.nombre;
        usuarioActual.rol = usuario.rol;
        guardarUsuarioActual();
        aplicarPermisosDeUsuario();
    }

    registrarAuditoria(
        "Usuarios",
        "Edito usuario",
        usuario.codigo + " - " + usuario.nombre + " | " + usuario.rol
    );

    cancelarEdicionUsuarioSistema();
    renderizarUsuariosSistema();
    renderizarOpcionesVendedoresCliente();
}

async function enviarRecuperacionUsuarioSistema(codigo) {
    if (!tienePermiso("configuracion")) {
        alert("No tenes permiso para restablecer claves.");
        return;
    }

    const usuario =
        usuariosSistema.find(function (usuarioGuardado) {
            return usuarioGuardado.codigo === codigo;
        });

    if (!usuario || !usuario.email) {
        alert("Ese usuario no tiene email de acceso.");
        return;
    }

    const confirmar =
        confirm("Enviar email para restablecer clave a " + usuario.email + "?");

    if (!confirmar) {
        return;
    }

    try {
        await enviarRecuperacionPasswordSupabase(usuario.email);
        registrarAuditoria(
            "Usuarios",
            "Envio restablecimiento de clave",
            usuario.codigo + " - " + usuario.nombre
        );
        alert("Listo. Supabase envio el email de restablecimiento a " + usuario.email + ".");
    } catch (error) {
        console.error("No se pudo enviar restablecimiento:", error);
        alert("No se pudo enviar el restablecimiento: " + (error.message || "error"));
    }
}

function contarSuperadminsActivos() {
    return usuariosSistema.filter(function (usuario) {
        return usuario.activo && usuario.rol === "SUPERADMIN";
    }).length;
}

function cambiarEstadoUsuarioSistema(codigo) {
    if (!tienePermiso("configuracion")) {
        alert("No tenes permiso para modificar usuarios.");
        return;
    }

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

    if (usuario.activo && usuario.rol === "SUPERADMIN" && contarSuperadminsActivos() <= 1) {
        alert("No podes desactivar el ultimo SUPERADMIN activo.");
        return;
    }

    usuario.activo = !usuario.activo;

    guardarUsuariosSistema();
    guardarUsuarioOperacionSupabase(usuario);
    registrarAuditoria(
        "Usuarios",
        usuario.activo ? "Activo usuario" : "Desactivo usuario",
        usuario.codigo + " - " + usuario.nombre
    );
    renderizarUsuariosSistema();
    renderizarOpcionesVendedoresCliente();
}

async function eliminarUsuarioSistema(codigo) {
    if (!tienePermiso("configuracion")) {
        alert("No tenes permiso para eliminar usuarios.");
        return;
    }

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

    if (usuario.activo && usuario.rol === "SUPERADMIN" && contarSuperadminsActivos() <= 1) {
        alert("No podes eliminar el ultimo SUPERADMIN activo.");
        return;
    }

    const confirmar =
        confirm("Eliminar usuario " + usuario.nombre + "?");

    if (!confirmar) {
        return;
    }

    if (usuarioSupabaseAutenticado()) {
        if (usuario.email) {
            try {
                await eliminarAccesoUsuarioSupabase(usuario.email);
            } catch (error) {
                console.error("No se pudo eliminar acceso de usuario:", error);
                alert("No se pudo eliminar el acceso de login en Supabase: " + (error.message || "error"));
                return;
            }
        }

        const eliminadoOnline =
            await eliminarUsuarioOperacionSupabase(usuario);

        if (!eliminadoOnline) {
            alert("No se pudo eliminar el usuario en Supabase. No se borra localmente para evitar diferencias.");
            return;
        }
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
    renderizarOpcionesVendedoresCliente();
}

function tienePermiso(modulo){
    const permisosDelRol = ROLES[usuarioActual.rol];

    if (!permisosDelRol) {
        return false;
    }

    return permisosDelRol[modulo] === true;
}
