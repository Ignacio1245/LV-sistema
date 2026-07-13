
function formatearDinero(numero) {
  const numeroSeguro =
    Number(numero);

  if (!Number.isFinite(numeroSeguro)) {
    return "$0";
  }

  return "$" + numeroSeguro.toLocaleString("es-AR");
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

  const blob =
    new Blob([contenido], {
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
