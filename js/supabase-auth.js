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

// La funcion segura es la UNICA forma que tiene el sistema de crear un acceso
// dejandolo confirmado. Si no esta desplegada, hay que decirlo con todas las
// letras: antes solo se detectaba el 404, y cuando el proyecto no tiene ninguna
// funcion desplegada el navegador ni siquiera llega a la respuesta (falla el
// preflight de CORS y fetch tira "Failed to fetch"). El admin veia
// "No se pudo crear el acceso: Failed to fetch", que no le dice que hacer.
function esFuncionSupabaseNoDesplegada(respuestaOError) {
  if (respuestaOError instanceof Error) {
    const mensaje =
      String(respuestaOError.message || "").toLowerCase();

    return mensaje.includes("failed to fetch") ||
      mensaje.includes("networkerror") ||
      mensaje.includes("network request failed") ||
      mensaje.includes("load failed");
  }

  const estado =
    Number(respuestaOError && respuestaOError.status) || 0;

  // 404: no existe. 546: la funcion se cayo al arrancar (no desplegada del
  // todo). 502/503/504: el gateway de funciones no encuentra a quien responder.
  return estado === 404 || estado === 546 ||
    estado === 502 || estado === 503 || estado === 504;
}

const AVISO_FUNCION_SEGURA =
  "Falta desplegar la funcion segura crear-usuario-sistema en Supabase. " +
  "Sin esa funcion no se puede crear el acceso confirmado: el usuario queda " +
  "sin poder entrar desde el celular. Desplegala con: " +
  "supabase functions deploy crear-usuario-sistema";

async function crearAccesoUsuarioConFuncionSupabase(email, password) {
  if (!usuarioSupabaseAutenticado()) {
    throw new Error("Inicia sesion como administrador para crear accesos.");
  }

  let respuesta = null;

  try {
    respuesta =
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
  } catch (errorRed) {
    if (esFuncionSupabaseNoDesplegada(errorRed)) {
      throw new Error(AVISO_FUNCION_SEGURA);
    }

    throw errorRed;
  }

  if (esFuncionSupabaseNoDesplegada(respuesta)) {
    throw new Error(AVISO_FUNCION_SEGURA);
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

    throw new Error(AVISO_FUNCION_SEGURA);
  }
}

if (supabaseAuthDisponible()) {
  supabaseClient.auth.onAuthStateChange(function (_evento, session) {
    sesionSupabase = session;
    actualizarVistaAuthSupabase();
  });
}
