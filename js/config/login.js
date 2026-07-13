let sesionSistemaActiva = false;
const EMAIL_ACCESO_LOCAL_INICIAL = "admin@local";
const CLAVE_ACCESO_LOCAL_INICIAL = "admin123";

function sistemaAutenticado() {
  return sesionSistemaActiva === true;
}

function normalizarEmailLogin(email) {
  return normalizarTexto(String(email || "").trim());
}

function buscarUsuarioPorEmail(email) {
  const emailNormalizado =
    normalizarEmailLogin(email);

  return usuariosSistema.find(function (usuario) {
    if (!usuario || typeof usuario !== "object") {
      return false;
    }

    return usuario.activo &&
      usuario.email &&
      normalizarEmailLogin(usuario.email) === emailNormalizado;
  });
}

function obtenerEmailInternoLoginSistema(usuarioOEmail) {
  if (typeof obtenerEmailInternoUsuarioSistema === "function") {
    return obtenerEmailInternoUsuarioSistema(usuarioOEmail);
  }

  const valor =
    String(usuarioOEmail || "").trim();

  if (valor.includes("@")) {
    return valor.toLowerCase();
  }

  const usuarioNormalizado =
    normalizarTexto(valor)
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

  return usuarioNormalizado ? usuarioNormalizado + "@lv.local" : "";
}

function hayUsuariosConEmailConfigurado() {
  return usuariosSistema.some(function (usuario) {
    return usuario &&
      usuario.activo &&
      typeof usuario.email === "string" &&
      usuario.email.trim() !== "";
  });
}

function obtenerAdministradorLocalInicial() {
  const superadminActivo =
    usuariosSistema.find(function (usuario) {
      return usuario &&
        usuario.activo &&
        usuario.rol === "SUPERADMIN";
    });

  return superadminActivo || usuariosSistema.find(function (usuario) {
    return usuario && usuario.activo;
  });
}

function puedeUsarAccesoLocalInicial() {
  return !hayUsuariosConEmailConfigurado();
}

function credencialesLocalesInicialesValidas(email, password) {
  const emailNormalizado =
    normalizarEmailLogin(email);
  const usuarioNormalizado =
    normalizarEmailLogin(email).replace(/@.*$/, "");

  return (
    emailNormalizado === normalizarEmailLogin(EMAIL_ACCESO_LOCAL_INICIAL) ||
    usuarioNormalizado === "admin"
  ) &&
    password === CLAVE_ACCESO_LOCAL_INICIAL;
}

function obtenerMensajeAccesoLocalInicial() {
  return "Acceso inicial local: admin o " + EMAIL_ACCESO_LOCAL_INICIAL +
    " / " + CLAVE_ACCESO_LOCAL_INICIAL +
    ". Despues configura usuarios con email en Supabase.";
}

function iniciarSesionLocalInicial(email, password) {
  if (!puedeUsarAccesoLocalInicial()) {
    return false;
  }

  if (!credencialesLocalesInicialesValidas(email, password)) {
    return false;
  }

  const usuarioLocal =
    obtenerAdministradorLocalInicial();

  if (!usuarioLocal) {
    throw new Error("No hay usuarios locales activos para iniciar.");
  }

  aplicarUsuarioSistemaAutenticado(usuarioLocal);
  desactivarSincronizacionAutomaticaSupabase();
  actualizarEstadoLogin("Sesion local iniciada. Configura Supabase y usuarios reales.", "sync-working");
  actualizarEstadoSincronizacionSupabase(
    "Modo local inicial: los cambios quedan en este navegador hasta iniciar sesion Supabase.",
    "sync-working"
  );

  registrarAuditoria(
    "Usuarios",
    "Inicio sesion local inicial",
    usuarioLocal.codigo + " - " + usuarioLocal.nombre + " | " + usuarioLocal.rol
  );

  mostrarPagina("dashboard");
  return true;
}

function actualizarEstadoLogin(mensaje, tipo) {
  if (!dom.loginStatus) {
    return;
  }

  dom.loginStatus.textContent = mensaje;
  dom.loginStatus.classList.remove("sync-ok", "sync-error", "sync-working");

  if (tipo) {
    dom.loginStatus.classList.add(tipo);
  }
}

function mostrarLoginSistema(mensaje) {
  sesionSistemaActiva = false;
  document.body.classList.add("login-required");

  if (mensaje) {
    actualizarEstadoLogin(mensaje, "sync-working");
  } else if (puedeUsarAccesoLocalInicial()) {
    actualizarEstadoLogin(obtenerMensajeAccesoLocalInicial(), "sync-working");
  }

  if (dom.loginUserInput) {
    dom.loginUserInput.focus();
  }
}

function ocultarLoginSistema() {
  document.body.classList.remove("login-required");
}

function aplicarUsuarioSistemaAutenticado(usuario) {
  usuarioActual.codigo = Number(usuario.codigo) || 0;
  usuarioActual.nombre = usuario.nombre || "Usuario";
  usuarioActual.rol = usuario.rol || "VENDEDOR";
  sesionSistemaActiva = true;
  guardarUsuarioActual();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  aplicarPermisosDeUsuario();
  ocultarLoginSistema();
}

async function cargarAccesosParaLoginDesdeSupabase() {
  const rolesSupabase =
    await obtenerRolesSupabase();
  const usuariosSupabase =
    await obtenerUsuariosSupabase();

  if (Array.isArray(rolesSupabase)) {
    rolesSupabase.forEach(function (rol) {
      if (!rol || !rol.nombre) {
        return;
      }

      ROLES[rol.nombre] = rol.permisos || {};
    });
  }

  if (Array.isArray(usuariosSupabase) && usuariosSupabase.length > 0) {
    usuariosSistema = usuariosSupabase.filter(function (usuario) {
      return usuario && typeof usuario === "object";
    });
    limpiarUsuariosSistemaDuplicados();
  }
}

async function reanudarSesionSistemaDesdeSupabase() {
  if (!usuarioSupabaseAutenticado()) {
    return false;
  }

  await cargarAccesosParaLoginDesdeSupabase();

  const usuario =
    buscarUsuarioPorEmail(obtenerEmailSesionSupabase());

  if (!usuario) {
    await cerrarSesionSupabase();
    mostrarLoginSistema("La sesion online existe, pero el email no esta autorizado en Usuarios.");
    return false;
  }

  aplicarUsuarioSistemaAutenticado(usuario);
  actualizarEstadoLogin("Sesion restaurada.", "sync-ok");
  return true;
}

function cargarDatosOperativosDespuesDelLogin() {
  cargarTodoDesdeSupabaseAutomatico()
    .then(function (resultado) {
      const errores =
        resultado && Array.isArray(resultado.errores)
          ? resultado.errores
          : [];

      if (errores.length > 0) {
        actualizarEstadoSincronizacionSupabase(
          "Sesion iniciada. Algunos datos no cargaron: " + errores.join(" | "),
          "sync-error"
        );
        return;
      }

      actualizarEstadoSincronizacionSupabase(
        "Sesion iniciada. Datos cargados desde Supabase.",
        "sync-ok"
      );
    })
    .catch(function (error) {
      console.error("No se pudieron cargar datos operativos despues del login:", error);
      actualizarEstadoSincronizacionSupabase(
        "Sesion iniciada, pero algunos datos no cargaron. Revisa Supabase.",
        "sync-error"
      );
    });
}

function obtenerMensajeLoginParaUsuario(error) {
  const mensaje =
    String(error && error.message ? error.message : "");
  const mensajeNormalizado =
    mensaje.toLowerCase();

  if (mensajeNormalizado.includes("invalid login credentials")) {
    return "Usuario o clave incorrectos. Si cambiaste la clave desde admin, volve a guardar ese usuario para actualizar el acceso.";
  }

  if (mensajeNormalizado.includes("email not confirmed") ||
      mensajeNormalizado.includes("not confirmed")) {
    return "El acceso existe en Supabase pero no esta confirmado. Hay que guardar el usuario desde admin con la funcion segura desplegada.";
  }

  if (mensajeNormalizado.includes("falta desplegar")) {
    return mensaje;
  }

  return mensaje || "No se pudo iniciar sesion.";
}

async function iniciarSesionSistema(usuarioOEmail, password) {
  let etapaLogin =
    "validacion";

  try {
    const emailLogin =
      obtenerEmailInternoLoginSistema(usuarioOEmail);

    if (!emailLogin || !emailLogin.includes("@")) {
      throw new Error("Ingrese un usuario o email valido.");
    }

    if (!password) {
      throw new Error("Ingrese la clave.");
    }

    etapaLogin = "acceso local inicial";
    if (iniciarSesionLocalInicial(emailLogin, password)) {
      return;
    }

    etapaLogin = "Supabase Auth";
    await iniciarSesionSupabase(emailLogin, password);

    etapaLogin = "carga de accesos desde Supabase";
    await cargarAccesosParaLoginDesdeSupabase();

    etapaLogin = "activar sincronizacion";
    activarSincronizacionAutomaticaSupabase();

    etapaLogin = "buscar usuario interno";
    const usuario =
      buscarUsuarioPorEmail(emailLogin);

    if (!usuario) {
      await cerrarSesionSupabase();
      throw new Error("El login de Supabase existe, pero ese usuario no esta creado en Usuarios del sistema.");
    }

    etapaLogin = "asignar usuario actual";
    aplicarUsuarioSistemaAutenticado(usuario);

    etapaLogin = "registrar auditoria";
    registrarAuditoria(
      "Usuarios",
      "Inicio sesion",
      usuarioActual.codigo + " - " + usuarioActual.nombre + " | " + usuarioActual.rol
    );

    etapaLogin = "renderizar sistema";
    mostrarPagina("dashboard");
    cargarDatosOperativosDespuesDelLogin();
  } catch (error) {
    console.error("Error de login en etapa " + etapaLogin + ":", error);
    throw new Error("No se pudo ingresar en etapa: " + etapaLogin + ". " + obtenerMensajeLoginParaUsuario(error));
  }
}

async function iniciarSesionSistemaDesdeFormulario(event) {
  event.preventDefault();

  const email =
    dom.loginUserInput.value.trim();
  const password =
    dom.loginPasswordInput.value;

  actualizarEstadoLogin("Validando acceso...", "sync-working");

  try {
    await iniciarSesionSistema(email, password);
    dom.loginPasswordInput.value = "";
    actualizarEstadoLogin("Sesion iniciada.", "sync-ok");
  } catch (error) {
    console.warn("No se pudo iniciar sesion:", error);
    actualizarEstadoLogin(error.message || "No se pudo iniciar sesion.", "sync-error");
    dom.loginPasswordInput.value = "";
    dom.loginPasswordInput.focus();
  }
}

async function cerrarSesionSistema() {
  registrarAuditoria(
    "Usuarios",
    "Cerro sesion",
    usuarioActual.nombre + " | " + usuarioActual.rol
  );

  if (usuarioSupabaseAutenticado()) {
    try {
      await cerrarSesionSupabase();
    } catch (error) {
      console.warn("No se pudo cerrar Supabase:", error);
    }
  }

  mostrarLoginSistema("Sesion cerrada. Volve a ingresar para usar el sistema.");
}
