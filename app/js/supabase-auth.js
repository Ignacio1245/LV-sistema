let sesionSupabase = null;

function supabaseAuthDisponible() {
  return Boolean(
    supabaseEstaConfigurado() &&
    supabaseClient &&
    supabaseClient.auth
  );
}

function usuarioSupabaseAutenticado() {
  return Boolean(sesionSupabase && sesionSupabase.user);
}

function obtenerEmailSesionSupabase() {
  if (!usuarioSupabaseAutenticado()) {
    return "";
  }

  return sesionSupabase.user.email || "";
}

function actualizarVistaAuthSupabase() {
  if (typeof dom === "undefined" || !dom.supabaseAuthStatus) {
    return;
  }

  const emailSesion =
    obtenerEmailSesionSupabase();
  const haySesion =
    Boolean(emailSesion);

  dom.supabaseAuthStatus.textContent = haySesion
    ? "Sesion Supabase activa: " + emailSesion
    : "Sin sesion Supabase. Inicia sesion para guardar automaticamente en la nube.";

  dom.supabaseAuthStatus.classList.remove("sync-ok", "sync-error", "sync-working");
  dom.supabaseAuthStatus.classList.add(haySesion ? "sync-ok" : "sync-working");

}

async function cargarSesionSupabase() {
  if (!supabaseAuthDisponible()) {
    sesionSupabase = null;
    actualizarVistaAuthSupabase();
    return null;
  }

  const respuesta =
    await supabaseClient.auth.getSession();

  if (respuesta.error) {
    throw respuesta.error;
  }

  sesionSupabase =
    respuesta.data.session;
  actualizarVistaAuthSupabase();

  return sesionSupabase;
}

async function iniciarSesionSupabase(email, password) {
  if (!supabaseAuthDisponible()) {
    throw new Error("Supabase no esta configurado.");
  }

  if (!email || !password) {
    throw new Error("Completa email y contrasena de Supabase.");
  }

  const respuesta =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (respuesta.error) {
    throw respuesta.error;
  }

  sesionSupabase =
    respuesta.data.session;
  actualizarVistaAuthSupabase();

  return sesionSupabase;
}

async function cerrarSesionSupabase() {
  if (!supabaseAuthDisponible()) {
    sesionSupabase = null;
    actualizarVistaAuthSupabase();
    return;
  }

  const respuesta =
    await supabaseClient.auth.signOut();

  if (respuesta.error) {
    throw respuesta.error;
  }

  sesionSupabase = null;
  actualizarVistaAuthSupabase();
}

async function enviarRecuperacionPasswordSupabase(email) {
  if (!supabaseAuthDisponible()) {
    throw new Error("Supabase no esta configurado.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido.");
  }

  const respuesta =
    await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

  if (respuesta.error) {
    throw respuesta.error;
  }

  return true;
}

function crearClienteAuthAisladoSupabase() {
  if (!supabaseAuthDisponible()) {
    throw new Error("Supabase no esta configurado.");
  }

  return window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}

async function crearAccesoUsuarioConFuncionSupabase(email, password) {
  if (!usuarioSupabaseAutenticado()) {
    throw new Error("Inicia sesion como administrador para crear accesos.");
  }

  const respuesta =
    await fetch(SUPABASE_URL + "/functions/v1/crear-usuario-sistema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + sesionSupabase.access_token
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

  if (respuesta.status === 404) {
    throw new Error("Falta desplegar la funcion segura crear-usuario-sistema en Supabase.");
  }

  let datos = null;

  try {
    datos = await respuesta.json();
  } catch (_error) {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new Error(
      (datos && datos.error) ||
      "No se pudo crear el acceso del usuario."
    );
  }

  return datos;
}

async function eliminarAccesoUsuarioSupabase(email) {
  if (!usuarioSupabaseAutenticado()) {
    throw new Error("Inicia sesion como administrador para eliminar accesos.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido.");
  }

  const respuesta =
    await fetch(SUPABASE_URL + "/functions/v1/eliminar-usuario-sistema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + sesionSupabase.access_token
      },
      body: JSON.stringify({
        email: email
      })
    });

  if (respuesta.status === 404) {
    throw new Error("Falta desplegar la funcion segura eliminar-usuario-sistema en Supabase.");
  }

  let datos = null;

  try {
    datos = await respuesta.json();
  } catch (_error) {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new Error(
      (datos && datos.error) ||
      "No se pudo eliminar el acceso del usuario."
    );
  }

  return datos;
}

async function crearAccesoUsuarioSupabase(email, password) {
  if (!email || !password) {
    throw new Error("Completa email y contrasena del usuario.");
  }

  try {
    return await crearAccesoUsuarioConFuncionSupabase(email, password);
  } catch (errorFuncion) {
    const mensajeFuncion =
      errorFuncion.message || "";

    if (!mensajeFuncion.includes("Falta desplegar")) {
      throw errorFuncion;
    }
  }

  const clienteAuth =
    crearClienteAuthAisladoSupabase();

  const respuesta =
    await clienteAuth.auth.signUp({
      email: email,
      password: password
    });

  if (respuesta.error) {
    const mensajeError =
      respuesta.error.message || "";

    const usuarioYaExiste =
      mensajeError.toLowerCase().includes("already") ||
      mensajeError.toLowerCase().includes("registered") ||
      mensajeError.toLowerCase().includes("exists");

    if (usuarioYaExiste) {
      return {
        usuarioExistente: true
      };
    }

    if (mensajeError.toLowerCase().includes("email rate limit")) {
      throw new Error("Supabase bloqueo temporalmente los emails de Auth. Desplega la funcion crear-usuario-sistema o espera a que se libere el limite.");
    }

    throw respuesta.error;
  }

  return respuesta.data;
}

if (supabaseAuthDisponible()) {
  supabaseClient.auth.onAuthStateChange(function (_evento, session) {
    sesionSupabase = session;
    actualizarVistaAuthSupabase();
  });
}
