function obtenerFechaArchivoRespaldo() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  const hora = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");

  return anio + mes + dia + "-" + hora + minutos;
}

function clonarDatosRespaldo(datos) {
  return JSON.parse(JSON.stringify(datos));
}

function contarListaRespaldo(lista) {
  return Array.isArray(lista) ? lista.length : 0;
}

function crearDatosRespaldoSistema() {
  const informesMensuales =
    typeof obtenerInformesMensualesGuardados === "function"
      ? obtenerInformesMensualesGuardados()
      : [];

  return {
    sistema: "LV Sistema",
    version: "1.0",
    generadoEn: new Date().toISOString(),
    generadoPor: usuarioActual
      ? {
          codigo: usuarioActual.codigo,
          nombre: usuarioActual.nombre,
          email: usuarioActual.email || "",
          rol: usuarioActual.rol
        }
      : null,
    resumen: {
      clientes: contarListaRespaldo(clientes),
      productos: contarListaRespaldo(productos),
      pedidos: contarListaRespaldo(pedidos),
      auditoria: contarListaRespaldo(auditoria)
    },
    datos: {
      clientes: clonarDatosRespaldo(clientes),
      productos: clonarDatosRespaldo(productos),
      pedidos: clonarDatosRespaldo(pedidos),
      zonas: clonarDatosRespaldo(zonas),
      rubros: clonarDatosRespaldo(rubros),
      proveedores: clonarDatosRespaldo(proveedores),
      proveedorPagos: clonarDatosRespaldo(proveedorPagos),
      vendedoresSistema: clonarDatosRespaldo(vendedoresSistema),
      compras: clonarDatosRespaldo(compras),
      listasPrecios: clonarDatosRespaldo(listasPrecios),
      informesMensuales: clonarDatosRespaldo(informesMensuales),
      auditoria: clonarDatosRespaldo(auditoria),
      configuracion: clonarDatosRespaldo(CONFIG),
      usuariosSistema: clonarDatosRespaldo(usuariosSistema),
      roles: clonarDatosRespaldo(ROLES)
    }
  };
}

function actualizarTextoElemento(id, texto) {
  const elemento = document.querySelector("#" + id);

  if (!elemento) {
    return;
  }

  elemento.textContent = texto;
}

function renderizarRespaldo() {
  actualizarTextoElemento("respaldoClientesTotal", contarListaRespaldo(clientes));
  actualizarTextoElemento("respaldoProductosTotal", contarListaRespaldo(productos));
  actualizarTextoElemento("respaldoPedidosTotal", contarListaRespaldo(pedidos));
  actualizarTextoElemento("respaldoAuditoriaTotal", contarListaRespaldo(auditoria));
}

function descargarArchivoRespaldo(nombreArchivo, contenido) {
  const blob =
    new Blob([contenido], { type: "application/json;charset=utf-8" });
  const url =
    URL.createObjectURL(blob);
  const enlace =
    document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
}

function exportarRespaldoSistema() {
  const respaldo =
    crearDatosRespaldoSistema();
  const contenido =
    JSON.stringify(respaldo, null, 2);
  const nombreArchivo =
    "lv-sistema-respaldo-" + obtenerFechaArchivoRespaldo() + ".json";

  descargarArchivoRespaldo(nombreArchivo, contenido);
  renderizarRespaldo();

  actualizarTextoElemento(
    "respaldoEstado",
    "Respaldo generado: " + nombreArchivo
  );

  registrarAuditoria(
    "Respaldo",
    "Exporto respaldo",
    nombreArchivo
  );
}

function obtenerResumenValidacionRespaldo(respaldo) {
  if (!respaldo || typeof respaldo !== "object") {
    return {
      valido: false,
      mensaje: "El archivo no tiene formato de respaldo valido."
    };
  }

  if (respaldo.sistema !== "LV Sistema" || !respaldo.datos) {
    return {
      valido: false,
      mensaje: "El archivo no parece ser un respaldo de LV Sistema."
    };
  }

  return {
    valido: true,
    mensaje:
      "Respaldo valido. Clientes: " +
      contarListaRespaldo(respaldo.datos.clientes) +
      " | Productos: " +
      contarListaRespaldo(respaldo.datos.productos) +
      " | Pedidos: " +
      contarListaRespaldo(respaldo.datos.pedidos) +
      " | Pagos proveedores: " +
      contarListaRespaldo(respaldo.datos.proveedorPagos) +
      " | Vendedores: " +
      contarListaRespaldo(respaldo.datos.vendedoresSistema) +
      " | Informes mensuales: " +
      contarListaRespaldo(respaldo.datos.informesMensuales) +
      " | Fecha: " +
      (respaldo.generadoEn || "-")
  };
}

function normalizarListaRespaldo(lista) {
  return Array.isArray(lista) ? lista : [];
}

function aplicarDatosRespaldoSistema(respaldo) {
  const datos =
    respaldo && respaldo.datos ? respaldo.datos : {};

  clientes = normalizarListaRespaldo(datos.clientes);
  productos = normalizarListaRespaldo(datos.productos);
  pedidos = normalizarListaRespaldo(datos.pedidos);
  zonas = normalizarListaRespaldo(datos.zonas);
  rubros = normalizarListaRespaldo(datos.rubros);
  proveedores = normalizarListaRespaldo(datos.proveedores);
  proveedorPagos = normalizarListaRespaldo(datos.proveedorPagos);
  vendedoresSistema = normalizarListaRespaldo(datos.vendedoresSistema);
  compras = normalizarListaRespaldo(datos.compras);
  listasPrecios = normalizarListaRespaldo(datos.listasPrecios);
  auditoria = normalizarListaRespaldo(datos.auditoria);

  if (Array.isArray(datos.informesMensuales)) {
    guardarInformesMensuales(datos.informesMensuales);
  }

  if (datos.configuracion && typeof datos.configuracion === "object") {
    CONFIG = {
      ...CONFIG,
      ...datos.configuracion
    };
  }

  if (Array.isArray(datos.usuariosSistema)) {
    usuariosSistema = datos.usuariosSistema;
  }

  if (datos.roles && typeof datos.roles === "object") {
    Object.keys(ROLES).forEach(function (nombreRol) {
      delete ROLES[nombreRol];
    });

    Object.assign(ROLES, datos.roles);
  }
}

function guardarDatosRestaurados() {
  guardarClientes();
  guardarProductos();
  guardarPedidos();
  guardarZonas();
  guardarRubros();
  guardarProveedores();
  guardarProveedorPagos();
  guardarVendedoresSistema();
  guardarCompras();
  guardarListasPrecios();
  guardarAuditoria();
  guardarConfiguracion();
  guardarUsuariosSistema();
  guardarRolesPersonalizados();
}

function refrescarPantallasDespuesDeRestaurar() {
  renderizarConfiguracion();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  renderizarListasPrecios();
  renderizarRubros();
  renderizarZonas();
  renderizarProveedores();
  renderizarPagosProveedores();
  renderizarVendedores();
  renderizarCompras();
  renderizarMovimientosGenerales();
  renderizarClientes();
  renderizarClientesConDeuda();
  renderizarProductos();
  renderizarPedidos();
  actualizarMenuPedidos();
  renderizarAuditoria();
  renderizarInformes();
  renderizarPedidoActual();
  renderizarCatalogoProductosPedido();
  actualizarClientePedidoSeleccionado();
  renderizarProductosHabitualesCliente();
  actualizarDashboard();
  actualizarStockTotal();
  renderizarRespaldo();
}

function validarArchivoRespaldo(event) {
  const archivo =
    event.target.files && event.target.files[0]
      ? event.target.files[0]
      : null;
  const resultado =
    document.querySelector("#validarRespaldoResultado");

  if (!archivo || !resultado) {
    return;
  }

  const lector =
    new FileReader();

  lector.onload = function () {
    try {
      const respaldo =
        JSON.parse(String(lector.result || ""));
      const validacion =
        obtenerResumenValidacionRespaldo(respaldo);

      resultado.textContent = validacion.mensaje;
      resultado.classList.toggle("sync-ok", validacion.valido);
      resultado.classList.toggle("sync-error", !validacion.valido);
    } catch (error) {
      resultado.textContent =
        "No se pudo leer el archivo: " + (error.message || "error");
      resultado.classList.remove("sync-ok");
      resultado.classList.add("sync-error");
    }
  };

  lector.readAsText(archivo);
}

function leerArchivoJsonRespaldo(archivo) {
  return new Promise(function (resolve, reject) {
    const lector =
      new FileReader();

    lector.onload = function () {
      try {
        resolve(JSON.parse(String(lector.result || "")));
      } catch (error) {
        reject(error);
      }
    };

    lector.onerror = function () {
      reject(new Error("No se pudo leer el archivo."));
    };

    lector.readAsText(archivo);
  });
}

async function obtenerRespaldoSeleccionadoParaRestaurar() {
  const input =
    document.querySelector("#restaurarRespaldoInput");
  const archivo =
    input && input.files && input.files[0]
      ? input.files[0]
      : null;

  if (!archivo) {
    throw new Error("Selecciona un archivo de respaldo.");
  }

  return await leerArchivoJsonRespaldo(archivo);
}

async function previsualizarRespaldoARestaurar() {
  const resultado =
    document.querySelector("#restaurarRespaldoResultado");

  if (!resultado) {
    return;
  }

  try {
    const respaldo =
      await obtenerRespaldoSeleccionadoParaRestaurar();
    const validacion =
      obtenerResumenValidacionRespaldo(respaldo);

    resultado.textContent = validacion.mensaje;
    resultado.classList.toggle("sync-ok", validacion.valido);
    resultado.classList.toggle("sync-error", !validacion.valido);
  } catch (error) {
    resultado.textContent =
      "No se pudo revisar el respaldo: " + (error.message || "error");
    resultado.classList.remove("sync-ok");
    resultado.classList.add("sync-error");
  }
}

async function restaurarRespaldoSistema() {
  const resultado =
    document.querySelector("#restaurarRespaldoResultado");
  const confirmacionInput =
    document.querySelector("#restaurarRespaldoConfirmacionInput");
  const confirmacionTexto =
    confirmacionInput ? confirmacionInput.value.trim().toUpperCase() : "";

  if (confirmacionTexto !== "RESTAURAR") {
    alert("Para restaurar escribi RESTAURAR en el campo de confirmacion.");
    return;
  }

  const confirmar =
    confirm("Esto reemplaza los datos actuales del sistema por el respaldo seleccionado. Continuar?");

  if (!confirmar) {
    return;
  }

  try {
    const respaldo =
      await obtenerRespaldoSeleccionadoParaRestaurar();
    const validacion =
      obtenerResumenValidacionRespaldo(respaldo);

    if (!validacion.valido) {
      throw new Error(validacion.mensaje);
    }

    aplicarDatosRespaldoSistema(respaldo);
    guardarDatosRestaurados();

    registrarAuditoria(
      "Respaldo",
      "Restauro respaldo",
      "Fecha respaldo: " + (respaldo.generadoEn || "-")
    );

    refrescarPantallasDespuesDeRestaurar();

    if (resultado) {
      resultado.textContent = "Respaldo restaurado correctamente.";
      resultado.classList.remove("sync-error");
      resultado.classList.add("sync-ok");
    }
  } catch (error) {
    if (resultado) {
      resultado.textContent =
        "No se pudo restaurar: " + (error.message || "error");
      resultado.classList.remove("sync-ok");
      resultado.classList.add("sync-error");
    }
  }
}

function inicializarRespaldo() {
  const exportarButton =
    document.querySelector("#exportarRespaldoButton");
  const validarInput =
    document.querySelector("#validarRespaldoInput");
  const restaurarButton =
    document.querySelector("#restaurarRespaldoButton");
  const restaurarInput =
    document.querySelector("#restaurarRespaldoInput");

  if (exportarButton) {
    exportarButton.addEventListener("click", exportarRespaldoSistema);
  }

  if (validarInput) {
    validarInput.addEventListener("change", validarArchivoRespaldo);
  }

  if (restaurarButton) {
    restaurarButton.addEventListener("click", restaurarRespaldoSistema);
  }

  if (restaurarInput) {
    restaurarInput.addEventListener("change", previsualizarRespaldoARestaurar);
  }
}
