let editorCompactoActivo = null;
let editorCompactoAlCerrar = null;
let editorCompactoDisparador = null;
let editorCompactoEstadoInicial = "";
let usuarioClaveCodigoActivo = null;
let temporizadorAvisoPractico = null;

function obtenerFondoEditorCompacto() {
  return document.getElementById("editorCompactoFondo");
}

function crearCabeceraEditorCompacto(formulario) {
  let cabecera = formulario.querySelector(":scope > .editor-compacto-cabecera");

  if (cabecera) {
    return cabecera;
  }

  cabecera = document.createElement("div");
  cabecera.className = "editor-compacto-cabecera";
  cabecera.innerHTML =
    "<div><p class=\"eyebrow\">Edicion rapida</p><h3 data-editor-compacto-titulo>Editar</h3><span data-editor-compacto-subtitulo>Modifica solamente lo necesario.</span></div>" +
    "<button type=\"button\" data-editor-compacto-cerrar aria-label=\"Cerrar editor\">×</button>";
  formulario.prepend(cabecera);
  cabecera.querySelector("[data-editor-compacto-cerrar]").addEventListener("click", function () {
    cerrarEditorCompacto();
  });
  return cabecera;
}

function obtenerEstadoEditorCompacto(formulario) {
  if (!formulario) {
    return "";
  }

  return JSON.stringify(
    Array.from(formulario.elements || []).filter(function (control) {
      return !["button", "submit", "reset"].includes(control.type);
    }).map(function (control) {
      if (control.type === "checkbox" || control.type === "radio") {
        return [control.name || control.id, control.value, control.checked];
      }

      if (control.tagName === "SELECT" && control.multiple) {
        return [
          control.name || control.id,
          Array.from(control.selectedOptions).map(function (opcion) {
            return opcion.value;
          })
        ];
      }

      return [control.name || control.id, control.value];
    })
  );
}

function abrirEditorCompacto(formulario, opciones) {
  if (!formulario) {
    return;
  }

  if (editorCompactoActivo && editorCompactoActivo !== formulario) {
    if (cerrarEditorCompacto() === false) {
      return false;
    }
  }

  const configuracion = opciones || {};
  const cabecera = crearCabeceraEditorCompacto(formulario);
  const titulo = cabecera.querySelector("[data-editor-compacto-titulo]");
  const subtitulo = cabecera.querySelector("[data-editor-compacto-subtitulo]");
  const fondo = obtenerFondoEditorCompacto();

  formulario.dataset.editorEstabaOculto = formulario.classList.contains("hidden") ? "si" : "no";
  formulario.classList.remove("hidden");
  formulario.classList.add("editor-compacto-activo");
  formulario.setAttribute("role", "dialog");
  formulario.setAttribute("aria-modal", "true");
  titulo.textContent = configuracion.titulo || "Editar";
  subtitulo.textContent = configuracion.subtitulo || "Modifica solamente lo necesario y guarda.";

  editorCompactoActivo = formulario;
  editorCompactoAlCerrar = typeof configuracion.alCerrar === "function" ? configuracion.alCerrar : null;
  editorCompactoDisparador = document.activeElement;
  editorCompactoEstadoInicial = obtenerEstadoEditorCompacto(formulario);
  document.body.classList.add("editor-compacto-abierto");

  if (fondo) {
    fondo.classList.remove("hidden");
    fondo.setAttribute("aria-hidden", "false");
  }
  return true;
}

function cerrarEditorCompacto(sinCancelar) {
  if (!editorCompactoActivo) {
    return true;
  }

  const formulario = editorCompactoActivo;
  const tieneCambios =
    editorCompactoEstadoInicial !== obtenerEstadoEditorCompacto(formulario);

  if (
    !sinCancelar &&
    tieneCambios &&
    !window.confirm("Hay cambios sin guardar. ¿Cerrar igualmente?")
  ) {
    return false;
  }

  const alCerrar = editorCompactoAlCerrar;
  const disparador = editorCompactoDisparador;
  const estabaOculto = formulario.dataset.editorEstabaOculto === "si";
  const fondo = obtenerFondoEditorCompacto();

  editorCompactoActivo = null;
  editorCompactoAlCerrar = null;
  editorCompactoDisparador = null;
  editorCompactoEstadoInicial = "";
  formulario.classList.remove("editor-compacto-activo");
  formulario.removeAttribute("role");
  formulario.removeAttribute("aria-modal");
  delete formulario.dataset.editorEstabaOculto;

  if (estabaOculto) {
    formulario.classList.add("hidden");
  }

  document.body.classList.remove("editor-compacto-abierto");
  if (fondo) {
    fondo.classList.add("hidden");
    fondo.setAttribute("aria-hidden", "true");
  }

  if (!sinCancelar && alCerrar) {
    alCerrar();
  }

  if (disparador && typeof disparador.focus === "function") {
    disparador.focus();
  }
  return true;
}

document.addEventListener("click", function (event) {
  const botonCancelar = event.target.closest(
    "#cancelarEdicionClienteButton, #cancelarEdicionProductoButton, #usuarioCancelarEdicionButton, #rolCancelarEdicionButton, #cancelarEdicionVendedorButton, #cancelarEdicionRubroButton, #cancelarEdicionProveedorButton"
  );

  if (!botonCancelar || !editorCompactoActivo || !editorCompactoActivo.contains(botonCancelar)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  cerrarEditorCompacto();
}, true);

function mostrarAvisoPractico(mensaje, tipo) {
  let aviso = document.getElementById("avisoPracticoGlobal");

  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "avisoPracticoGlobal";
    aviso.className = "aviso-practico-global";
    aviso.setAttribute("role", "status");
    aviso.setAttribute("aria-live", "polite");
    document.body.appendChild(aviso);
  }

  aviso.textContent = mensaje;
  aviso.dataset.tipo = tipo || "ok";
  aviso.classList.add("visible");
  window.clearTimeout(temporizadorAvisoPractico);
  temporizadorAvisoPractico = window.setTimeout(function () {
    aviso.classList.remove("visible");
  }, 2600);
}

function obtenerUsuarioClaveActivo() {
  return usuariosSistema.find(function (usuario) {
    return Number(usuario.codigo) === Number(usuarioClaveCodigoActivo);
  }) || null;
}

function abrirCambioClaveUsuario(codigo) {
  if (!tienePermiso("configuracion")) {
    alert("No tenes permiso para cambiar claves.");
    return;
  }

  const usuario = usuariosSistema.find(function (usuarioGuardado) {
    return Number(usuarioGuardado.codigo) === Number(codigo);
  });
  const modal = document.getElementById("usuarioClaveModal");

  if (!usuario || !usuario.email || !modal) {
    alert("Ese usuario no tiene un email de acceso valido.");
    return;
  }

  usuarioClaveCodigoActivo = usuario.codigo;
  document.getElementById("usuarioClaveNombre").textContent = usuario.nombre + " · " + usuario.email;
  document.getElementById("usuarioClaveNuevaInput").value = "";
  document.getElementById("usuarioClaveNuevaInput").type = "password";
  document.getElementById("usuarioClaveMostrarButton").textContent = "Mostrar";
  document.getElementById("usuarioClaveEstado").textContent = "Podes guardar una clave provisoria o enviar un enlace al email.";
  modal.classList.remove("hidden");
  document.body.classList.add("editor-compacto-abierto");
  document.getElementById("usuarioClaveNuevaInput").focus();
}

function cerrarCambioClaveUsuario() {
  const modal = document.getElementById("usuarioClaveModal");
  usuarioClaveCodigoActivo = null;
  if (modal) {
    modal.classList.add("hidden");
  }
  document.body.classList.remove("editor-compacto-abierto");
}

function generarClaveProvisoriaUsuario() {
  const mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minusculas = "abcdefghijkmnopqrstuvwxyz";
  const numeros = "23456789";
  const todos = mayusculas + minusculas + numeros;
  const valores = new Uint32Array(8);
  window.crypto.getRandomValues(valores);
  const clave =
    mayusculas[valores[0] % mayusculas.length] +
    minusculas[valores[1] % minusculas.length] +
    numeros[valores[2] % numeros.length] +
    Array.from(valores.slice(3)).map(function (valor) {
      return todos[valor % todos.length];
    }).join("");
  const input = document.getElementById("usuarioClaveNuevaInput");
  input.value = clave;
  input.type = "text";
  document.getElementById("usuarioClaveMostrarButton").textContent = "Ocultar";
  document.getElementById("usuarioClaveEstado").textContent = "Clave generada. Copiala y toca Guardar.";
  input.select();
}

function alternarVisibilidadClaveUsuario() {
  const input = document.getElementById("usuarioClaveNuevaInput");
  const boton = document.getElementById("usuarioClaveMostrarButton");
  const mostrar = input.type === "password";
  input.type = mostrar ? "text" : "password";
  boton.textContent = mostrar ? "Ocultar" : "Mostrar";
}

function bloquearAccionesClaveUsuario(bloquear) {
  ["usuarioClaveGuardarButton", "usuarioClaveEmailButton", "usuarioClaveGenerarButton"].forEach(function (id) {
    const boton = document.getElementById(id);
    if (boton) {
      boton.disabled = bloquear;
    }
  });
}

async function guardarClaveProvisoriaUsuario(evento) {
  evento.preventDefault();
  const usuario = obtenerUsuarioClaveActivo();
  const clave = document.getElementById("usuarioClaveNuevaInput").value;
  const estado = document.getElementById("usuarioClaveEstado");

  if (!usuario) {
    cerrarCambioClaveUsuario();
    return;
  }
  if (clave.length < 6) {
    estado.textContent = "La clave necesita al menos 6 caracteres.";
    document.getElementById("usuarioClaveNuevaInput").focus();
    return;
  }

  try {
    bloquearAccionesClaveUsuario(true);
    estado.textContent = "Guardando la nueva clave...";
    await crearAccesoUsuarioSupabase(usuario.email, clave);
    registrarAuditoria("Usuarios", "Cambio clave provisoria", usuario.codigo + " - " + usuario.nombre);
    cerrarCambioClaveUsuario();
    mostrarAvisoPractico("Clave actualizada para " + usuario.nombre + ".");
  } catch (error) {
    estado.textContent = "No se pudo cambiar: " + (error.message || "error");
  } finally {
    bloquearAccionesClaveUsuario(false);
  }
}

async function enviarEnlaceClaveUsuario() {
  const usuario = obtenerUsuarioClaveActivo();
  const estado = document.getElementById("usuarioClaveEstado");

  if (!usuario) {
    cerrarCambioClaveUsuario();
    return;
  }

  try {
    bloquearAccionesClaveUsuario(true);
    estado.textContent = "Enviando enlace...";
    await enviarRecuperacionPasswordSupabase(usuario.email);
    registrarAuditoria("Usuarios", "Envio restablecimiento de clave", usuario.codigo + " - " + usuario.nombre);
    cerrarCambioClaveUsuario();
    mostrarAvisoPractico("Enlace enviado a " + usuario.email + ".");
  } catch (error) {
    estado.textContent = "No se pudo enviar: " + (error.message || "error");
  } finally {
    bloquearAccionesClaveUsuario(false);
  }
}

const PLANTILLAS_PERMISOS_PRACTICAS = {
  vendedor: ["ventas", "clientes"],
  cobranza: ["clientes", "cuentaCorriente", "informes"],
  stock: ["productos", "rubros", "zonas", "proveedores", "compras", "movimientos"],
  administracion: ["productos", "rubros", "zonas", "proveedores", "compras", "movimientos", "clientes", "ventas", "cuentaCorriente", "auditoria", "informes"]
};

function actualizarResumenPermisosPracticos() {
  const resumen = document.getElementById("rolPermisosResumen");
  if (!resumen) {
    return;
  }
  const cantidad = Array.from(document.querySelectorAll("[data-role-permission]")).filter(function (input) {
    return input.checked;
  }).length;
  resumen.textContent = cantidad + " permiso" + (cantidad === 1 ? "" : "s") + " seleccionado" + (cantidad === 1 ? "" : "s");
}

function aplicarPlantillaPermisosPractica(nombrePlantilla) {
  const permisos = PLANTILLAS_PERMISOS_PRACTICAS[nombrePlantilla];
  if (!permisos) {
    actualizarResumenPermisosPracticos();
    return;
  }
  document.querySelectorAll("[data-role-permission]").forEach(function (input) {
    input.checked = permisos.includes(input.dataset.rolePermission);
  });
  actualizarResumenPermisosPracticos();
}

function marcarPermisosPracticos(valor) {
  document.querySelectorAll("[data-role-permission]").forEach(function (input) {
    input.checked = valor;
  });
  const plantilla = document.getElementById("rolPlantillaInput");
  if (plantilla) {
    plantilla.value = "personalizado";
  }
  actualizarResumenPermisosPracticos();
}

function actualizarAyudaRolUsuario() {
  const selector = document.getElementById("usuarioNuevoRolInput");
  const ayuda = document.getElementById("usuarioRolAyuda");
  if (!selector || !ayuda) {
    return;
  }
  const rol = selector.value;
  const textos = {
    VENDEDOR: "Vendedor: pedidos y clientes.",
    ADMINISTRADOR: "Administrador: operacion general, sin cambiar accesos.",
    SUPERADMIN: "Superadmin: control total, incluidos usuarios y configuracion."
  };
  const permisos = ROLES[rol] || {};
  const cantidad = Object.keys(permisos).filter(function (permiso) { return permisos[permiso] === true; }).length;
  ayuda.textContent = textos[rol] || rol + ": " + cantidad + " modulos habilitados.";
}

function inicializarUiPractica() {
  const fondo = obtenerFondoEditorCompacto();
  if (fondo) {
    fondo.addEventListener("click", function () { cerrarEditorCompacto(); });
  }

  document.addEventListener("keydown", function (evento) {
    if (evento.key !== "Escape") {
      return;
    }
    if (!document.getElementById("usuarioClaveModal").classList.contains("hidden")) {
      cerrarCambioClaveUsuario();
      return;
    }
    cerrarEditorCompacto();
  });

  document.getElementById("cerrarUsuarioClaveModal").addEventListener("click", cerrarCambioClaveUsuario);
  document.getElementById("usuarioClaveModal").addEventListener("click", function (evento) {
    if (evento.target === evento.currentTarget) cerrarCambioClaveUsuario();
  });
  document.getElementById("usuarioClaveForm").addEventListener("submit", guardarClaveProvisoriaUsuario);
  document.getElementById("usuarioClaveGenerarButton").addEventListener("click", generarClaveProvisoriaUsuario);
  document.getElementById("usuarioClaveMostrarButton").addEventListener("click", alternarVisibilidadClaveUsuario);
  document.getElementById("usuarioClaveEmailButton").addEventListener("click", enviarEnlaceClaveUsuario);

  const selectorPlantilla = document.getElementById("rolPlantillaInput");
  selectorPlantilla.addEventListener("change", function () {
    aplicarPlantillaPermisosPractica(selectorPlantilla.value);
  });
  document.getElementById("rolMarcarTodosButton").addEventListener("click", function () { marcarPermisosPracticos(true); });
  document.getElementById("rolLimpiarPermisosButton").addEventListener("click", function () { marcarPermisosPracticos(false); });
  document.querySelectorAll("[data-role-permission]").forEach(function (input) {
    input.addEventListener("change", function () {
      selectorPlantilla.value = "personalizado";
      actualizarResumenPermisosPracticos();
    });
  });

  document.getElementById("usuarioNuevoRolInput").addEventListener("change", actualizarAyudaRolUsuario);
  actualizarResumenPermisosPracticos();
  actualizarAyudaRolUsuario();
}

document.addEventListener("DOMContentLoaded", inicializarUiPractica);
