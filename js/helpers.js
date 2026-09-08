
// Importes en pantalla, siempre con dos decimales.
//
// toLocaleString sin opciones muestra hasta 3 decimales y sin minimo, asi que
// los importes salian con distinta cantidad de digitos segun el valor:
//
//   ticket promedio 14778,3333  ->  "$14.778,333"   (se lee como 14 millones)
//   1234,5                      ->  "$1.234,5"
//   1000                        ->  "$1.000"
//   -3500,25                    ->  "$-3.500,25"    (el menos del lado que no va)
//
// Con dos decimales fijos todas las columnas de plata quedan alineadas y no hay
// forma de confundir los miles con los centavos.
function formatearDinero(numero) {
  const numeroSeguro =
    Number(numero);

  if (!Number.isFinite(numeroSeguro)) {
    return "$0,00";
  }

  const importe =
    Math.abs(numeroSeguro).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  // El signo va antes del simbolo: -$3.500,00, no $-3.500,00.
  return (numeroSeguro < 0 ? "-$" : "$") + importe;
}

// Redondeo a centavos.
//
// JavaScript no puede representar exactamente los decimales: 0.1 sumado y
// restado diez veces no vuelve a dar 0, sino 2.77e-17. Eso se ve como "$0" en
// pantalla, pero un cliente que pago todo seguia apareciendo en la lista de
// deudores porque "saldo > 0" daba verdadero. Lo mismo con los subtotales:
// 333,33 x 3 con 10% de descuento daba 899,991, y como la base guarda
// numeric(14,2) el total que mostraba el navegador no coincidia con el
// guardado.
//
// Se usa Math.round sobre el valor por 100 en vez de toFixed para no pasar por
// texto en cada operacion.
function redondearDinero(numero) {
  const numeroSeguro =
    Number(numero);

  if (!Number.isFinite(numeroSeguro)) {
    return 0;
  }

  return Math.round((numeroSeguro + Number.EPSILON) * 100) / 100;
}

// Importes para las exportaciones a CSV.
//
// Faltaba: se llamaba desde exportarClientesCsv, exportarCuentaClientesCsv,
// exportarPedidosCsv y exportarListaPreciosCsv, pero no estaba definida en
// ningun archivo, asi que esos cuatro botones de exportar tiraban
// "formatearMoneda is not defined" y no descargaban nada.
//
// No usa formatearDinero porque eso devuelve "$1.500" con separador de miles,
// y Excel lo lee como texto. Con coma decimal y sin simbolo, la columna entra
// como numero (el CSV ya usa ";" de separador, que es la convencion de Excel
// en español).
function formatearMoneda(numero) {
  const numeroSeguro =
    Number(numero);

  if (!Number.isFinite(numeroSeguro)) {
    return "0,00";
  }

  return numeroSeguro.toFixed(2).replace(".", ",");
}

function normalizarTexto(texto) {
  return texto.trim().toLowerCase();
}

function escaparTextoHtml(valor) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- HTML seguro por defecto -------------------------------------------------
// El catalogo publico deja que cualquier persona de internet cargue el nombre,
// la direccion y el comentario de un cliente. Ese texto despues se muestra en el
// panel de administracion, asi que TODO lo que se interpole en HTML tiene que
// escaparse. Para no depender de acordarse en cada template, se usa la etiqueta
// html`` que escapa sola, y crudo() marca lo poco que si es HTML armado por el
// sistema.
//
//   contenedor.innerHTML = html`<td>${cliente.nombre}</td>`;   // escapado
//   contenedor.innerHTML = html`<tr>${crudo(filasArmadas)}</tr>`; // sin escapar
//
// Si en el navegador aparece HTML escrito como texto (por ejemplo "<button>"),
// es porque falta un crudo() en esa interpolacion.

function HtmlSeguro(texto) {
  this.texto = String(texto);
}

HtmlSeguro.prototype.toString = function () {
  return this.texto;
};

function crudo(valor) {
  if (valor instanceof HtmlSeguro) {
    return valor;
  }

  return new HtmlSeguro(valor === null || valor === undefined ? "" : valor);
}

function valorParaHtmlSeguro(valor) {
  if (valor instanceof HtmlSeguro) {
    return valor.texto;
  }

  if (Array.isArray(valor)) {
    return valor.map(valorParaHtmlSeguro).join("");
  }

  return escaparTextoHtml(valor);
}

function html(partes, ...valores) {
  let salida = partes[0];

  for (let indice = 0; indice < valores.length; indice += 1) {
    salida += valorParaHtmlSeguro(valores[indice]) + partes[indice + 1];
  }

  return new HtmlSeguro(salida);
}

// Para pasar texto como argumento dentro de un atributo onclick="...".
// Escapar solo como HTML no alcanza: el navegador convierte &#039; de vuelta en
// una comilla y el texto se escaparia del literal de JavaScript.
function literalJsHtml(valor) {
  const textoEscapado =
    String(valor === null || valor === undefined ? "" : valor)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, "\\\"")
      .replace(/\r?\n/g, "\\n");

  return crudo("'" + escaparTextoHtml(textoEscapado) + "'");
}

function obtenerCodigoSiExiste(texto) {
  const coincidencia = texto.trim().match(/^\d+/);

  if (!coincidencia) {
    return null;
  }

  return Number(coincidencia[0]);
}

function buscarPorCodigoONombre(lista, busqueda) {
  const texto = normalizarTexto(busqueda);

  if (texto === "") {
    return null;
  }

  const codigo = obtenerCodigoSiExiste(texto);

  if (codigo !== null) {
    const encontradoPorCodigo = lista.find(function (item) {
      return item.codigo === codigo;
    });

    if (encontradoPorCodigo) {
      return encontradoPorCodigo;
    }
  }

  return lista.find(function (item) {
    return normalizarTexto(item.nombre).includes(texto);
  });
}

function buscarCoincidencias(lista, busqueda) {
  const texto = normalizarTexto(busqueda);

  if (texto === "") {
    return [];
  }

  return lista.filter(function (item) {
    return (
      String(item.codigo).includes(texto) ||
      normalizarTexto(item.codigoReal || "").includes(texto) ||
      normalizarTexto(item.marca || "").includes(texto) ||
      normalizarTexto(item.detalle || "").includes(texto) ||
      normalizarTexto(item.nombre).includes(texto)
    );
  }).slice(0, 5);
}

function buscarCliente(busqueda) {
  const clientesActivos =
    clientes.filter(function (cliente) {
      return cliente.activo !== false;
    });

  return buscarPorCodigoONombre(clientesActivos, busqueda);
}

function obtenerCodigoDesdeBusquedaProducto(busqueda) {
  const codigo =
    obtenerCodigoSiExiste(String(busqueda || ""));

  return codigo === null ? "" : String(codigo);
}

function buscarProducto(busqueda) {
  const productosActivos =
    productos.filter(function (producto) {
      return producto.activo !== false;
    });

  const texto =
    normalizarTexto(busqueda || "");

  if (texto === "") {
    return null;
  }

  const codigoBuscado =
    obtenerCodigoDesdeBusquedaProducto(busqueda);

  return productosActivos.find(function (producto) {
    return String(producto.codigo) === texto ||
      String(producto.codigo) === codigoBuscado ||
      normalizarTexto(producto.codigoReal || "") === texto ||
      normalizarTexto(producto.nombre || "").includes(texto) ||
      normalizarTexto(producto.marca || "").includes(texto) ||
      normalizarTexto(producto.detalle || "").includes(texto);
  }) || null;
}

function escaparCampoCsv(valor) {
  const texto =
    valor === null || valor === undefined ? "" : String(valor);

  return '"' + texto.replace(/"/g, '""') + '"';
}

function descargarCsv(nombreArchivo, encabezados, filas) {
  const contenido =
    [encabezados].concat(filas).map(function (fila) {
      return fila.map(escaparCampoCsv).join(";");
    }).join("\r\n");

  // El "﻿" del principio es la marca de UTF-8. Sin ella Excel abre el
  // archivo con la codificacion del sistema y los acentos y las eñes salen
  // rotas ("Almacén" queda como "AlmacÃ©n").
  const blob =
    new Blob(["﻿" + contenido], {
      type: "text/csv;charset=utf-8;"
    });
  const url =
    URL.createObjectURL(blob);
  const enlace =
    document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function obtenerFirmaTextoSistema(texto) {
  const textoSeguro =
    String(texto || "");
  let hash = 0;

  for (let indice = 0; indice < textoSeguro.length; indice += 1) {
    hash = ((hash << 5) - hash) + textoSeguro.charCodeAt(indice);
    hash |= 0;
  }

  return textoSeguro.length + ":" + hash;
}
function obtenerFechaHoraArchivoSistema() {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
}

function descargarJsonSistema(nombreArchivo, datos) {
  const blob =
    new Blob([JSON.stringify(datos, null, 2)], {
      type: "application/json;charset=utf-8"
    });
  const url =
    URL.createObjectURL(blob);
  const enlace =
    document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function generarRespaldoAutomaticoAntesDeOperacion(nombreOperacion) {
  if (typeof crearDatosRespaldoSistema !== "function") {
    alert("No se pudo generar el respaldo automatico. No se aplico la operacion.");
    return false;
  }

  try {
    const nombreSeguro =
      typeof normalizarEncabezadoImportacion === "function"
        ? normalizarEncabezadoImportacion(nombreOperacion || "operacion")
        : String(nombreOperacion || "operacion").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const nombreArchivo =
      "lv-sistema-respaldo-antes-" + nombreSeguro + "-" + obtenerFechaHoraArchivoSistema() + ".json";

    descargarJsonSistema(nombreArchivo, crearDatosRespaldoSistema());

    if (typeof registrarAuditoria === "function") {
      registrarAuditoria("Respaldo", "Respaldo automatico", nombreArchivo);
    }

    return true;
  } catch (error) {
    console.error("No se pudo generar respaldo automatico:", error);
    alert("No se pudo generar el respaldo automatico. No se aplico la operacion.");
    return false;
  }
}

let clienteSeleccionado = null;
let productoSeleccionado = null;

function actualizarVistaBusqueda() {
  const cliente = clienteSeleccionado || buscarCliente(dom.clienteSearchInput.value);
  const producto = productoSeleccionado || buscarProducto(dom.productoSearchInput.value);

  dom.clienteResultado.textContent = cliente
    ? "Cliente: " + cliente.codigo + " - " + cliente.nombre
    : "Escribi codigo o nombre y elegi un resultado.";

  dom.productoResultado.textContent = producto
    ? "Producto: " + producto.codigo + " - " + producto.nombre + " | Precio: " + formatearDinero(producto.precio)
    : "Escribi codigo o producto y elegi un resultado.";
}

function renderizarResultados(contenedor, resultados, tipo) {
  contenedor.innerHTML = "";

  if (resultados.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-result";
    empty.textContent = "Sin resultados";
    contenedor.appendChild(empty);
    contenedor.classList.remove("hidden");
    return;
  }

  resultados.forEach(function (item) {
    const button = document.createElement("button");
    const codigo = document.createElement("strong");

    button.type = "button";
    button.className = "search-option";
    codigo.textContent = item.codigo;
    button.appendChild(codigo);
    button.appendChild(document.createTextNode(" - " + item.nombre));

    button.addEventListener("click", function () {
      if (tipo === "cliente") {
        seleccionarCliente(item);
      } else {
        seleccionarProducto(item);
      }
    });

    contenedor.appendChild(button);
  });

  contenedor.classList.remove("hidden");
}

// Mostrar u ocultar la clave.
//
// Un vendedor tipeando la clave en el celular, en la calle y con sol, no ve lo
// que escribe: si se equivoca no tiene forma de darse cuenta salvo por el error
// de "clave incorrecta". El boton "Ver" es lo que ya espera cualquiera que use
// una app en el telefono.
//
// Se engancha por delegacion en el documento, asi funciona en las tres paginas
// sin repetir codigo y sin depender del orden de carga.
document.addEventListener("click", function (evento) {
  const boton =
    evento.target.closest ? evento.target.closest("[data-ver-clave]") : null;

  if (!boton) {
    return;
  }

  const campo =
    document.getElementById(boton.dataset.verClave);

  if (!campo) {
    return;
  }

  const seEstaViendo =
    campo.type === "text";

  campo.type = seEstaViendo ? "password" : "text";
  boton.textContent = seEstaViendo ? "Ver" : "Ocultar";
  boton.setAttribute("aria-pressed", seEstaViendo ? "false" : "true");
  campo.focus();
});
