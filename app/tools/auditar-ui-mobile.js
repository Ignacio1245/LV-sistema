const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const https = require("https");
const os = require("os");
const path = require("path");

const CHROME_PATH = process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.argv[2] || "http://127.0.0.1:5600";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(BASE_URL).hostname)) {
  throw new Error("La auditoria interactiva solo puede ejecutarse contra un servidor local aislado.");
}
const OUTPUT_PATH = path.join(os.tmpdir(), "lv-sistema-mobile-audit");
const MOBILE_COMPACTO = { width: 360, height: 800, deviceScaleFactor: 1, mobile: true };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 1, mobile: true };
const TABLET = { width: 768, height: 1024, deviceScaleFactor: 1, mobile: true };
const DESKTOP = { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false };

function esperar(ms) {
  return new Promise(function (resolver) {
    setTimeout(resolver, ms);
  });
}

function solicitarJson(url, method) {
  return new Promise(function (resolver, rechazar) {
    const solicitud = http.request(url, { method: method || "GET" }, function (respuesta) {
      let cuerpo = "";
      respuesta.setEncoding("utf8");
      respuesta.on("data", function (parte) { cuerpo += parte; });
      respuesta.on("end", function () {
        try {
          resolver(JSON.parse(cuerpo));
        } catch (error) {
          rechazar(new Error("Respuesta CDP invalida: " + cuerpo.slice(0, 200)));
        }
      });
    });
    solicitud.on("error", rechazar);
    solicitud.end();
  });
}

async function obtenerPuertoDevTools(carpetaPerfil) {
  const archivo = path.join(carpetaPerfil, "DevToolsActivePort");
  for (let intento = 0; intento < 100; intento += 1) {
    if (fs.existsSync(archivo)) {
      try {
        const puerto = Number(fs.readFileSync(archivo, "utf8").split(/\r?\n/)[0]);
        if (puerto > 0) return puerto;
      } catch (errorLectura) {
        if (errorLectura.code !== "EBUSY" && errorLectura.code !== "EACCES") {
          throw errorLectura;
        }
      }
    }
    await esperar(100);
  }
  throw new Error("Chrome no publico el puerto de depuracion.");
}

function solicitarTexto(url, redirecciones) {
  const cantidadRedirecciones = Number(redirecciones) || 0;
  return new Promise(function (resolver, rechazar) {
    const clienteHttp = url.startsWith("https:") ? https : http;
    const solicitud = clienteHttp.get(url, { headers: { "Cache-Control": "no-cache" } }, function (respuesta) {
      if (respuesta.statusCode >= 300 && respuesta.statusCode < 400 && respuesta.headers.location) {
        respuesta.resume();
        if (cantidadRedirecciones >= 5) {
          rechazar(new Error("Demasiadas redirecciones al consultar " + url));
          return;
        }
        resolver(solicitarTexto(new URL(respuesta.headers.location, url).href, cantidadRedirecciones + 1));
        return;
      }
      let cuerpo = "";
      respuesta.setEncoding("utf8");
      respuesta.on("data", function (parte) { cuerpo += parte; });
      respuesta.on("end", function () {
        resolver({
          url: url,
          estado: respuesta.statusCode || 0,
          tipo: respuesta.headers["content-type"] || "",
          datos: cuerpo
        });
      });
    });
    solicitud.setTimeout(10000, function () {
      solicitud.destroy(new Error("Tiempo agotado al consultar " + url));
    });
    solicitud.on("error", rechazar);
  });
}

class ClienteCdp {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.id = 1;
    this.pendientes = new Map();
  }

  async conectar() {
    const cliente = this;
    await new Promise(function (resolver, rechazar) {
      const socket = new WebSocket(cliente.url);
      socket.addEventListener("open", function () {
        cliente.socket = socket;
        resolver();
      });
      socket.addEventListener("error", function () {
        rechazar(new Error("No se pudo conectar con Chrome DevTools."));
      });
      socket.addEventListener("message", function (evento) {
        const mensaje = JSON.parse(String(evento.data));
        if (!mensaje.id || !cliente.pendientes.has(mensaje.id)) return;
        const pendiente = cliente.pendientes.get(mensaje.id);
        cliente.pendientes.delete(mensaje.id);
        if (mensaje.error) {
          pendiente.rechazar(new Error(mensaje.error.message || "Error CDP"));
        } else {
          pendiente.resolver(mensaje.result || {});
        }
      });
    });
  }

  enviar(method, params) {
    const cliente = this;
    const id = this.id;
    this.id += 1;
    return new Promise(function (resolver, rechazar) {
      cliente.pendientes.set(id, { resolver: resolver, rechazar: rechazar });
      cliente.socket.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    });
  }

  cerrar() {
    if (this.socket) this.socket.close();
  }
}

async function evaluar(cliente, expresion) {
  const respuesta = await cliente.enviar("Runtime.evaluate", {
    expression: expresion,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (respuesta.exceptionDetails) {
    const excepcion = respuesta.exceptionDetails.exception;
    throw new Error((excepcion && excepcion.description) || respuesta.exceptionDetails.text);
  }
  return respuesta.result ? respuesta.result.value : undefined;
}

async function navegar(cliente, url, viewport, condicion) {
  await cliente.enviar("Emulation.setDeviceMetricsOverride", viewport);
  await cliente.enviar("Page.navigate", { url: url });
  for (let intento = 0; intento < 100; intento += 1) {
    const lista = await evaluar(
      cliente,
      "document.readyState === 'complete' && Boolean(" + condicion + ")"
    );
    if (lista) {
      await esperar(300);
      return;
    }
    await esperar(100);
  }
  throw new Error("La pagina no termino de iniciar: " + url);
}

async function auditarAplicacionInstalable(ruta, manifestEsperado) {
  const pagina = await solicitarTexto(BASE_URL + ruta);
  if (pagina.estado !== 200) {
    throw new Error("Pagina no disponible en " + ruta + ": HTTP " + pagina.estado);
  }
  const coincidenciaManifest = pagina.datos.match(/<link\s+[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (!coincidenciaManifest) {
    throw new Error("No se encontro manifest en " + ruta);
  }
  const urlManifest = new URL(coincidenciaManifest[1], pagina.url).href;
  if (!urlManifest.endsWith(manifestEsperado)) {
    throw new Error("Manifest incorrecto en " + ruta + ": " + urlManifest);
  }
  const resultado = await solicitarTexto(urlManifest);
  if (resultado.estado !== 200) {
    throw new Error("Manifest no disponible en " + ruta + ": HTTP " + resultado.estado);
  }
  const manifest = JSON.parse(resultado.datos || "{}");
  if (!manifest.start_url || !Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    throw new Error("Manifest incompleto en " + ruta);
  }
  return {
    ruta: ruta,
    manifest: manifestEsperado,
    nombre: manifest.short_name || manifest.name,
    inicio: manifest.start_url,
    iconos: manifest.icons.length,
    tipoContenido: resultado.tipo
  };
}

function expresionAuditoria(nombre) {
  return `(() => {
    const ancho = window.innerWidth;
    const raiz = document.documentElement;
    const editorActivo = document.querySelector(".editor-compacto-activo");
    const modalActivo = [...document.querySelectorAll(".modal")].find((elemento) => !elemento.classList.contains("hidden"));
    const carritoCatalogoActivo = document.querySelector("#catalogoCarrito.catalogo-carrito-abierto");
    const superficieActiva = editorActivo || modalActivo || carritoCatalogoActivo || document.body;
    const visibles = [...superficieActiva.querySelectorAll("*")].filter((elemento) => {
      const estilo = getComputedStyle(elemento);
      const rect = elemento.getBoundingClientRect();
      return estilo.display !== "none" && estilo.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const selector = (elemento) => elemento.id
      ? "#" + elemento.id
      : elemento.tagName.toLowerCase() + ([...elemento.classList].length ? "." + [...elemento.classList].slice(0, 3).join(".") : "");
    const controlesPequenos = visibles
      .filter((elemento) => elemento.matches("button, a, input:not([type=hidden]), select, textarea"))
      .filter((elemento) => {
        if (!elemento.matches('input[type="checkbox"], input[type="radio"]')) return true;
        const etiqueta = elemento.closest("label");
        if (!etiqueta) return true;
        const rectEtiqueta = etiqueta.getBoundingClientRect();
        return rectEtiqueta.width < 40 || rectEtiqueta.height < 40;
      })
      .map((elemento) => ({ selector: selector(elemento), ancho: Math.round(elemento.getBoundingClientRect().width), alto: Math.round(elemento.getBoundingClientRect().height) }))
      .filter((control) => control.alto < 40 || control.ancho < 40)
      .slice(0, 30);
    const nombreAccesible = (elemento) => {
      const ariaLabel = elemento.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
      const ariaLabelledby = elemento.getAttribute("aria-labelledby");
      if (ariaLabelledby) {
        const texto = ariaLabelledby.split(/\\s+/).map((id) => {
          const referencia = document.getElementById(id);
          return referencia ? referencia.textContent.trim() : "";
        }).filter(Boolean).join(" ");
        if (texto) return texto;
      }
      if (elemento.labels && elemento.labels.length) {
        const texto = [...elemento.labels].map((label) => label.textContent.trim()).filter(Boolean).join(" ");
        if (texto) return texto;
      }
      if (elemento.matches("button, a")) return elemento.textContent.trim();
      if (elemento.matches("input[type=submit], input[type=button]")) return elemento.value.trim();
      return "";
    };
    const controlesSinNombre = visibles
      .filter((elemento) => elemento.matches("button, a[href], input:not([type=hidden]), select, textarea"))
      .filter((elemento) => !nombreAccesible(elemento))
      .map((elemento) => selector(elemento))
      .slice(0, 30);
    const ids = [...document.querySelectorAll("[id]")].map((elemento) => elemento.id).filter(Boolean);
    const idsDuplicados = [...new Set(ids.filter((id, indice) => ids.indexOf(id) !== indice))].slice(0, 30);
    const fueraDePantalla = visibles
      .map((elemento) => ({ selector: selector(elemento), rect: elemento.getBoundingClientRect() }))
      .filter((dato) => dato.rect.left < -1 || dato.rect.right > ancho + 1)
      .map((dato) => ({ selector: dato.selector, izquierda: Math.round(dato.rect.left), derecha: Math.round(dato.rect.right), ancho: Math.round(dato.rect.width) }))
      .slice(0, 30);
    return {
      vista: ${JSON.stringify(nombre)},
      viewport: { ancho: ancho, alto: window.innerHeight },
      documento: { ancho: raiz.scrollWidth, alto: raiz.scrollHeight },
      desbordeHorizontal: raiz.scrollWidth > ancho + 1,
      fueraDePantalla: fueraDePantalla,
      controlesPequenos: controlesPequenos,
      controlesSinNombre: controlesSinNombre,
      idsDuplicados: idsDuplicados
    };
  })()`;
}

async function capturar(cliente, nombre) {
  const resultado = await evaluar(cliente, expresionAuditoria(nombre));
  const captura = await cliente.enviar("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  const archivo = nombre.replace(/[^a-z0-9_-]+/gi, "-") + ".png";
  fs.writeFileSync(path.join(OUTPUT_PATH, archivo), Buffer.from(captura.data, "base64"));
  return resultado;
}

async function cargarDatosFicticiosAdmin(cliente) {
  await evaluar(cliente, `(() => {
    const productoYerba = {
      codigo: 101,
      codigoReal: "YER-1KG",
      nombre: "Yerba mate tradicional 1 kg",
      marca: "Marca Norte",
      detalle: "Paquete",
      rubro: "Almacen",
      proveedor: "Mayorista Central",
      tipo: "UNIDAD",
      precio: 4250,
      precioCompra: 3000,
      stock: 25,
      stockMinimo: 5,
      activo: true,
      mostrarCatalogo: true,
      preciosLista: { "Lista 1": 4250 },
      movimientosStock: []
    };
    const productoAceite = {
      codigo: 102,
      codigoReal: "ACE-15",
      nombre: "Aceite de girasol 1,5 l",
      marca: "Campo",
      detalle: "Botella",
      rubro: "Almacen",
      proveedor: "Mayorista Central",
      tipo: "UNIDAD",
      precio: 3100,
      precioCompra: 2400,
      stock: 3,
      stockMinimo: 5,
      activo: true,
      mostrarCatalogo: true,
      preciosLista: { "Lista 1": 3100 },
      movimientosStock: []
    };
    const clienteKiosco = {
      codigo: 10,
      nombre: "Kiosco La Esquina",
      razonSocial: "Kiosco La Esquina SRL",
      telefono: "11 4444-5555",
      telefonoMovil: "11 6123-4567",
      email: "compras@kiosco.test",
      direccion: "Av. Principal 1234",
      localidad: "Buenos Aires",
      zona: "Centro",
      listaPrecios: "Lista 1",
      vendedorAsignado: "Vendedor de prueba",
      saldo: 4500,
      activo: true,
      historial: []
    };
    const clienteMercado = {
      codigo: 11,
      nombre: "Mercado del Barrio",
      razonSocial: "Mercado del Barrio",
      telefono: "11 5555-1212",
      telefonoMovil: "11 6555-1212",
      email: "mercado@ejemplo.test",
      direccion: "Calle 9 456",
      localidad: "Buenos Aires",
      zona: "Norte",
      listaPrecios: "Lista 1",
      vendedorAsignado: "Vendedor de prueba",
      saldo: 0,
      activo: true,
      historial: []
    };
    productos.splice(0, productos.length, productoYerba, productoAceite);
    clientes.splice(0, clientes.length, clienteKiosco, clienteMercado);
    pedidos.splice(0, pedidos.length, {
      id: 1001,
      numero: 1001,
      cliente: clienteKiosco,
      items: [{ producto: productoYerba, cantidad: 2, precioUnitario: 4250, subtotal: 8500 }],
      total: 8500,
      estado: "PENDIENTE",
      estadoCobro: "",
      formaPago: "CUENTA_CORRIENTE",
      fecha: "02/09/2026"
    });
    zonas.splice(0, zonas.length, "Centro", "Norte");
    rubros.splice(0, rubros.length, "Almacen");
    if (typeof renderizarClientes === "function") renderizarClientes();
    if (typeof renderizarProductos === "function") renderizarProductos();
    if (typeof renderizarPedidos === "function") renderizarPedidos();
    if (typeof actualizarDashboard === "function") actualizarDashboard();
  })()`);
}

async function auditarInteraccionAdminMovil(cliente, sufijo) {
  return evaluar(cliente, `(() => {
    const app = document.querySelector(".app");
    const botonMas = document.querySelector("#mobileMoreButton");
    const linkProductos = document.querySelector('.menu a[data-page="productos"]');
    const botonPedidos = document.querySelector('[data-mobile-page="ventas"]');
    if (!app || !botonMas || !linkProductos || !botonPedidos) {
      throw new Error("Faltan controles de navegacion movil");
    }

    botonMas.click();
    if (app.classList.contains("sidebar-collapsed")) {
      throw new Error("El boton Mas no abrio el menu");
    }

    linkProductos.click();
    if (!app.classList.contains("sidebar-collapsed") || document.querySelector("#productosPage").classList.contains("hidden")) {
      throw new Error("El menu no se cerro al abrir Productos");
    }

    botonPedidos.click();
    if (document.querySelector("#ventasPage").classList.contains("hidden") || !botonPedidos.classList.contains("active")) {
      throw new Error("La barra inferior no abrio Pedidos");
    }

    const accionesPedidos = Array.from(document.querySelectorAll("#pedidosTable button")).map(function (boton) {
      return boton.textContent.trim().toLowerCase();
    });
    if (accionesPedidos.includes("duplicar") || accionesPedidos.includes("imprimir")) {
      throw new Error("La lista de pedidos todavia muestra Duplicar o Imprimir");
    }

    mostrarPagina("dashboard");
    actualizarEstadoSidebar(true);
    return {
      vista: ${JSON.stringify(sufijo)},
      botonMasAbreMenu: true,
      menuSeCierraAlElegir: true,
      barraNavega: true,
      accionesPedidosSimplificadas: true,
      respuestaTactilDisponible: typeof navigator.vibrate === "function"
    };
  })()`);
}

async function auditarAdmin(cliente, viewport, sufijo) {
  const resultados = [];
  await navegar(
    cliente,
    BASE_URL + "/",
    viewport,
    "typeof mostrarPagina === 'function' && typeof aplicarUsuarioSistemaAutenticado === 'function'"
  );
  const accesoLocalHabilitado = await evaluar(
    cliente,
    "typeof puedeUsarAccesoLocalInicial === 'function' && puedeUsarAccesoLocalInicial()"
  );
  if (accesoLocalHabilitado) {
    throw new Error("El acceso local inicial no debe estar habilitado con Supabase configurado");
  }
  resultados.push(await capturar(cliente, "admin-login-" + sufijo));
  await evaluar(cliente, `(() => {
    const usuario = obtenerAdministradorLocalInicial();
    if (!usuario) throw new Error("No hay administrador local de prueba");
    aplicarUsuarioSistemaAutenticado(usuario);
    desactivarSincronizacionAutomaticaSupabase();
    document.querySelector(".app").classList.add("sidebar-collapsed");
  })()`);
  await cargarDatosFicticiosAdmin(cliente);
  const interaccionMovil = await auditarInteraccionAdminMovil(cliente, sufijo);
  for (const pagina of ["dashboard", "ventas", "clientes", "vendedores", "productos", "listas", "proveedores", "movimientos", "auditoria", "informes", "configuracion", "links", "impresion", "respaldo"]) {
    await evaluar(cliente, `mostrarPagina(${JSON.stringify(pagina)}); window.scrollTo(0, 0);`);
    await esperar(80);
    resultados.push(await capturar(cliente, "admin-" + pagina + "-" + sufijo));
    const selectoresDetalle = {
      ventas: "#pedidosTable",
      clientes: "#clientesTablaBloque",
      productos: "#productosTablaBloque"
    };
    if (selectoresDetalle[pagina]) {
      await evaluar(cliente, `(() => {
        const elemento = document.querySelector(${JSON.stringify(selectoresDetalle[pagina])});
        const destino = elemento && (elemento.closest(".table-wrapper") || elemento);
        if (destino) destino.scrollIntoView({ block: "start" });
      })()`);
      await esperar(80);
      resultados.push(await capturar(cliente, "admin-" + pagina + "-datos-" + sufijo));
    }
  }
  resultados.interaccionMovil = interaccionMovil;
  return resultados;
}

async function auditarVendedores(cliente) {
  const resultados = [];
  await navegar(
    cliente,
    BASE_URL + "/vendedores.html",
    MOBILE,
    "typeof mostrarContenidoVendedor === 'function' && typeof seleccionarModuloVendedor === 'function'"
  );
  resultados.push(await capturar(cliente, "vendedores-login-mobile"));
  await evaluar(cliente, `(() => {
    localStorage.clear();
    mostrarContenidoVendedor();
    vendedorDom.nombreVendedor.value = "Vendedor de prueba";
    if (vendedorDom.nombreEncabezado) vendedorDom.nombreEncabezado.textContent = "Vendedor de prueba";
    clientesVendedor = [
      { codigo: 201, nombre: "Almacen Don Jose", direccion: "Av. Central 245", zona: "Centro", telefono: "5491123456789", listaPrecios: "Lista 1", activo: true, saldo: 18500 },
      { codigo: 202, nombre: "Despensa La Esquina", direccion: "San Martin 810", zona: "Centro", telefono: "5491198765432", listaPrecios: "Lista 1", activo: true, saldo: 0 }
    ];
    productosVendedor = [
      { codigo: 101, nombre: "Yerba mate tradicional 1 kg", marca: "Marca Norte", rubro: "Almacen", stock: 25, precio: 4250, activo: true, tipo: "UNIDAD" },
      { codigo: 102, nombre: "Aceite de girasol 1,5 l", marca: "Campo", rubro: "Almacen", stock: 12, precio: 3100, activo: true, tipo: "UNIDAD" },
      { codigo: 103, nombre: "Galletitas surtidas pack x 6", marca: "Dulce", rubro: "Golosinas", stock: 40, precio: 5800, activo: true, tipo: "UNIDAD" }
    ];
    actualizarVistaVendedorDespuesDeCargarDatos();
    window.scrollTo(0, 0);
  })()`);

  const reglaVisibilidadClientes = await evaluar(cliente, `(() => {
    const usuarioAnterior = usuarioSistemaVendedorActual;
    const autorizadoAnterior = vendedorMovilAutorizado;
    usuarioSistemaVendedorActual = {
      rol: "VENDEDOR",
      nombre: "Vendedor de prueba",
      email: "vendedor@prueba.local",
      vendedorComercial: { nombre: "Vendedor de prueba", email: "vendedor@prueba.local" }
    };
    vendedorMovilAutorizado = true;
    const resultado = {
      sinAsignar: clienteAsignadoAlVendedorActual({ vendedorAsignado: "" }),
      propio: clienteAsignadoAlVendedorActual({ vendedorAsignado: "Vendedor de prueba" }),
      ajeno: clienteAsignadoAlVendedorActual({ vendedorAsignado: "Otro vendedor" })
    };
    usuarioSistemaVendedorActual = usuarioAnterior;
    vendedorMovilAutorizado = autorizadoAnterior;
    return resultado;
  })()`);
  if (!reglaVisibilidadClientes.sinAsignar || !reglaVisibilidadClientes.propio || reglaVisibilidadClientes.ajeno) {
    throw new Error("Regla de clientes vendedor invalida: " + JSON.stringify(reglaVisibilidadClientes));
  }

  resultados.push(await capturar(cliente, "vendedores-inicio-mobile"));

  await evaluar(cliente, `seleccionarModuloVendedor("venta"); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-pedido-cliente-mobile"));

  await evaluar(cliente, `seleccionarClienteVendedor(clientesVendedor[0]); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-pedido-productos-mobile"));

  const estadoProductos = await evaluar(cliente, `(() => ({
    inicioOculto: vendedorDom.inicio.classList.contains("vendedores-oculto"),
    clienteOculto: vendedorDom.seccionClientes.classList.contains("vendedores-oculto"),
    productosVisible: !vendedorDom.seccionProductos.classList.contains("vendedores-oculto"),
    resumenOculto: vendedorDom.seccionPedido.classList.contains("vendedores-oculto"),
    barraVisible: !vendedorDom.barraPedido.classList.contains("vendedores-oculto"),
    bonificacionesEnBusqueda: vendedorDom.resultadosProductos.querySelectorAll(".vendedores-bonificacion").length
  }))()`);
  if (!estadoProductos.inicioOculto || !estadoProductos.clienteOculto || !estadoProductos.productosVisible || !estadoProductos.resumenOculto || !estadoProductos.barraVisible || estadoProductos.bonificacionesEnBusqueda !== 0) {
    throw new Error("Flujo de productos vendedor invalido: " + JSON.stringify(estadoProductos));
  }

  await evaluar(cliente, `agregarProductoPedidoVendedor(productosVendedor[0], 2, 0); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-pedido-producto-agregado-mobile"));

  await evaluar(cliente, `seleccionarPasoPedidoVendedor("resumen"); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-pedido-revisar-mobile"));

  const estadoResumen = await evaluar(cliente, `(() => ({
    productosOculto: vendedorDom.seccionProductos.classList.contains("vendedores-oculto"),
    resumenVisible: !vendedorDom.seccionPedido.classList.contains("vendedores-oculto"),
    barraOculta: vendedorDom.barraPedido.classList.contains("vendedores-oculto"),
    bonificacionesEnRevision: vendedorDom.itemsPedido.querySelectorAll(".vendedores-bonificacion").length,
    botonFinal: vendedorDom.botonWhatsapp.textContent.trim()
  }))()`);
  if (!estadoResumen.productosOculto || !estadoResumen.resumenVisible || !estadoResumen.barraOculta || estadoResumen.bonificacionesEnRevision < 1 || estadoResumen.botonFinal !== "Guardar y enviar") {
    throw new Error("Revision de pedido vendedor invalida: " + JSON.stringify(estadoResumen));
  }

  await evaluar(cliente, `void intentarSeleccionarClienteVendedor(clientesVendedor[1]);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-confirmar-cambio-cliente-mobile"));
  const cambioClienteAvisado = await evaluar(cliente, `(() => ({
    visible: !vendedorDom.confirmacion.classList.contains("vendedores-oculto"),
    titulo: vendedorDom.confirmacionTitulo.textContent,
    aceptar: vendedorDom.confirmacionAceptar.textContent
  }))()`);
  if (!cambioClienteAvisado.visible || !cambioClienteAvisado.titulo.includes("Cambiar") || !cambioClienteAvisado.aceptar.includes("vaciar")) {
    throw new Error("La confirmacion de cambio de cliente no es clara: " + JSON.stringify(cambioClienteAvisado));
  }
  await evaluar(cliente, `vendedorDom.confirmacionAceptar.click();`);
  await esperar(80);
  const cambioClienteSeguro = await evaluar(cliente, `(() => ({
    cliente: clienteSeleccionadoVendedor && clienteSeleccionadoVendedor.codigo,
    items: itemsPedidoVendedor.length
  }))()`);
  if (Number(cambioClienteSeguro.cliente) !== 202 || cambioClienteSeguro.items !== 0) {
    throw new Error("El cambio seguro de cliente fallo: " + JSON.stringify(cambioClienteSeguro));
  }

  await evaluar(cliente, `agregarProductoPedidoVendedor(productosVendedor[1], 1, 0); void solicitarVaciarPedidoVendedor();`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-confirmar-vaciar-pedido-mobile"));
  await evaluar(cliente, `vendedorDom.confirmacionCancelar.click();`);
  await esperar(80);
  const vaciadoCancelado = await evaluar(cliente, `itemsPedidoVendedor.length`);
  if (vaciadoCancelado !== 1) {
    throw new Error("Cancelar Vaciar pedido elimino productos");
  }

  await evaluar(cliente, `volverInicioVendedor(); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-regreso-tareas-mobile"));

  await evaluar(cliente, `seleccionarModuloVendedor("clientes"); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-cobranza-cliente-mobile"));
  await evaluar(cliente, `seleccionarClienteVendedor(clientesVendedor[0]); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-cobranza-mobile"));

  await evaluar(cliente, `seleccionarModuloVendedor("catalogo"); seleccionarClienteVendedor(clientesVendedor[1]); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "vendedores-catalogo-mobile"));
  return resultados;
}

async function auditarEditoresAdmin(cliente) {
  const resultados = [];
  await navegar(
    cliente,
    BASE_URL + "/",
    DESKTOP,
    "typeof abrirEditorCompacto === 'function' && typeof abrirCambioClaveUsuario === 'function'"
  );
  await evaluar(cliente, `(() => {
    const usuario = obtenerAdministradorLocalInicial();
    if (!usuario) throw new Error("No hay administrador local de prueba");
    aplicarUsuarioSistemaAutenticado(usuario);
    desactivarSincronizacionAutomaticaSupabase();
    usuariosSistema.splice(0, usuariosSistema.length,
      { codigo: 1, nombre: "Administrador de prueba", rol: "SUPERADMIN", email: "admin@prueba.local", activo: true },
      { codigo: 2, nombre: "Vendedor de prueba", rol: "VENDEDOR", email: "vendedor@prueba.local", activo: true }
    );
    vendedoresSistema.splice(0, vendedoresSistema.length,
      { codigo: 21, nombre: "Vendedor de prueba", telefono: "11 5555-1234", email: "vendedor", zona: "Centro", tipo: "Calle", activo: true }
    );
    proveedores.splice(0, proveedores.length,
      { codigo: 31, nombre: "Mayorista Central", telefono: "11 4444-1234", contacto: "Juan", observacion: "Entrega semanal", activo: true }
    );
    zonas.splice(0, zonas.length,
      { codigo: 41, nombre: "Centro", descripcion: "Zona centro", activo: true },
      { codigo: 42, nombre: "Norte", descripcion: "Zona norte", activo: true }
    );
    rubros.splice(0, rubros.length,
      { codigo: 51, nombre: "Almacen", descripcion: "Productos de almacen", activo: true }
    );
    window.__confirmacionesEditor = 0;
    window.confirm = function () {
      window.__confirmacionesEditor += 1;
      return true;
    };
    ROLES.REPARTIDOR = obtenerPermisosRolSistema("REPARTIDOR", { ventas: true, clientes: true });
  })()`);
  await cargarDatosFicticiosAdmin(cliente);
  await evaluar(cliente, `(() => {
    zonas.splice(0, zonas.length,
      { codigo: 41, nombre: "Centro", descripcion: "Zona centro", activo: true },
      { codigo: 42, nombre: "Norte", descripcion: "Zona norte", activo: true }
    );
    rubros.splice(0, rubros.length,
      { codigo: 51, nombre: "Almacen", descripcion: "Productos de almacen", activo: true }
    );
  })()`);

  await evaluar(cliente, `mostrarPagina("clientes"); editarCliente(10); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-cliente-desktop"));
  const clienteEstado = await evaluar(cliente, `(() => ({
    modal: dom.clientForm.classList.contains("editor-compacto-activo"),
    listadoVisible: !dom.clientesTablaBloque.classList.contains("hidden"),
    fondoVisible: !document.getElementById("editorCompactoFondo").classList.contains("hidden")
  }))()`);
  if (!clienteEstado.modal || !clienteEstado.listadoVisible || !clienteEstado.fondoVisible) {
    throw new Error("Editor de cliente invalido: " + JSON.stringify(clienteEstado));
  }
  await evaluar(cliente, `cerrarEditorCompacto();`);

  await evaluar(cliente, `mostrarPagina("productos"); editarProducto(101); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-producto-desktop"));
  const productoEstado = await evaluar(cliente, `(() => ({
    modal: dom.productForm.classList.contains("editor-compacto-activo"),
    listadoVisible: !dom.productosTablaBloque.classList.contains("hidden"),
    codigoBloqueado: dom.productCodeInput.disabled
  }))()`);
  if (!productoEstado.modal || !productoEstado.listadoVisible || !productoEstado.codigoBloqueado) {
    throw new Error("Editor de producto invalido: " + JSON.stringify(productoEstado));
  }
  await evaluar(cliente, `cerrarEditorCompacto();`);

  await evaluar(cliente, `mostrarPagina("configuracion"); mostrarSeccionConfiguracion("accesos"); renderizarUsuariosSistema(); editarUsuarioSistema(2); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-usuario-desktop"));
  const usuarioEstado = await evaluar(cliente, `(() => ({
    modal: dom.usuarioForm.classList.contains("editor-compacto-activo"),
    claveOculta: document.getElementById("usuarioPasswordLabel").classList.contains("hidden"),
    rol: dom.usuarioNuevoRolInput.value
  }))()`);
  if (!usuarioEstado.modal || !usuarioEstado.claveOculta || usuarioEstado.rol !== "VENDEDOR") {
    throw new Error("Editor de usuario invalido: " + JSON.stringify(usuarioEstado));
  }
  await evaluar(cliente, `cerrarEditorCompacto(); abrirCambioClaveUsuario(2);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-cambiar-clave-desktop"));
  const claveEstado = await evaluar(cliente, `(() => {
    generarClaveProvisoriaUsuario();
    return {
      modalVisible: !document.getElementById("usuarioClaveModal").classList.contains("hidden"),
      largo: document.getElementById("usuarioClaveNuevaInput").value.length,
      visible: document.getElementById("usuarioClaveNuevaInput").type === "text"
    };
  })()`);
  if (!claveEstado.modalVisible || claveEstado.largo < 8 || !claveEstado.visible) {
    throw new Error("Cambio de clave invalido: " + JSON.stringify(claveEstado));
  }
  await evaluar(cliente, `cerrarCambioClaveUsuario();`);

  await evaluar(cliente, `mostrarSeccionConfiguracion("roles"); renderizarRolesSistema(); editarRolSistema("REPARTIDOR"); aplicarPlantillaPermisosPractica("stock"); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-rol-desktop"));
  const rolEstado = await evaluar(cliente, `(() => ({
    modal: dom.rolForm.classList.contains("editor-compacto-activo"),
    permisos: Array.from(dom.rolPermisosInputs).filter(function (input) { return input.checked; }).map(function (input) { return input.dataset.rolePermission; }),
    resumen: document.getElementById("rolPermisosResumen").textContent
  }))()`);
  if (!rolEstado.modal || !rolEstado.permisos.includes("productos") || rolEstado.permisos.includes("ventas") || !rolEstado.resumen.includes("6 permisos")) {
    throw new Error("Editor de rol invalido: " + JSON.stringify(rolEstado));
  }
  await evaluar(cliente, `cerrarEditorCompacto(true); cancelarEdicionRolSistema();`);

  await evaluar(cliente, `mostrarSeccionConfiguracion("vendedores"); renderizarVendedores(); editarVendedor(21); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-vendedor-desktop"));
  if (!await evaluar(cliente, `dom.vendedorForm.classList.contains("editor-compacto-activo")`)) {
    throw new Error("El vendedor no abrio en editor compacto");
  }
  await evaluar(cliente, `cerrarEditorCompacto();`);

  await evaluar(cliente, `mostrarPagina("proveedores"); renderizarProveedores(); editarProveedor(31); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-proveedor-desktop"));
  if (!await evaluar(cliente, `dom.proveedorForm.classList.contains("editor-compacto-activo")`)) {
    throw new Error("El proveedor no abrio en editor compacto");
  }
  await evaluar(cliente, `cerrarEditorCompacto();`);

  await evaluar(cliente, `mostrarPagina("rubros"); renderizarRubros(); editarRubro(51); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-rubro-desktop"));
  if (!await evaluar(cliente, `dom.rubroForm.classList.contains("editor-compacto-activo")`)) {
    throw new Error("El rubro no abrio en editor compacto");
  }
  await evaluar(cliente, `cerrarEditorCompacto();`);

  await evaluar(cliente, `mostrarPagina("zonas"); renderizarZonas(); editarZona(41); window.scrollTo(0, 0);`);
  await esperar(80);
  resultados.push(await capturar(cliente, "admin-editor-zona-desktop"));
  const proteccionEstado = await evaluar(cliente, `(() => {
    dom.zonaNombreInput.value = "Centro modificado";
    window.confirm = function () {
      window.__confirmacionesEditor += 1;
      return false;
    };
    const cerro = cerrarEditorCompacto();
    const siguioAbierto = dom.zonaForm.classList.contains("editor-compacto-activo");
    window.confirm = function () {
      window.__confirmacionesEditor += 1;
      return true;
    };
    cerrarEditorCompacto();
    return {
      cerro: cerro,
      siguioAbierto: siguioAbierto,
      confirmaciones: window.__confirmacionesEditor
    };
  })()`);
  if (proteccionEstado.cerro !== false || !proteccionEstado.siguioAbierto || proteccionEstado.confirmaciones < 2) {
    throw new Error("La proteccion de cambios sin guardar fallo: " + JSON.stringify(proteccionEstado));
  }

  return resultados;
}

async function auditarCatalogo(cliente) {
  const resultados = [];
  await navegar(
    cliente,
    BASE_URL + "/catalogo.html",
    MOBILE,
    "typeof catalogoInicializacion !== 'undefined'"
  );
  await evaluar(cliente, "catalogoInicializacion");
  await evaluar(cliente, "detenerActualizacionTiempoRealCatalogo();");
  await evaluar(cliente, `(() => {
    localStorage.removeItem(CLAVE_BORRADOR_CATALOGO);
    carritoCatalogo = [];
    productosCatalogo = [
      { codigo: 101, nombre: "Yerba mate tradicional 1 kg", marca: "Marca Norte", detalle: "Paquete", rubro: "Almacen", stock: 25, precio: 4250, precioBase: 4250, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" },
      { codigo: 102, nombre: "Aceite de girasol 1,5 l", marca: "Campo", detalle: "Botella", rubro: "Almacen", stock: 12, precio: 3100, precioBase: 3100, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" },
      { codigo: 103, nombre: "Galletitas surtidas", marca: "Dulce", detalle: "Pack x 6", rubro: "Golosinas", stock: 40, precio: 5800, precioBase: 5800, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" },
      { codigo: 104, nombre: "Producto temporalmente agotado", marca: "Marca", detalle: "Unidad", rubro: "Almacen", stock: 0, precio: 1900, precioBase: 1900, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" }
    ];
    rubroCatalogoActual = "TODOS";
    ordenCatalogoActual = "relevancia";
    catalogoDom.busquedaProducto.value = "";
    renderizarFiltrosRubrosCatalogo();
    renderizarProductosCatalogo();
    renderizarCarritoCatalogo();
    actualizarEstadoCatalogo("Catalogo actualizado");
    window.scrollTo(0, 0);
  })()`);
  resultados.push(await capturar(cliente, "catalogo-productos-mobile"));
  const sinStockEstado = await evaluar(cliente, `(() => ({
    tarjetas: catalogoDom.listaProductos.querySelectorAll(".catalogo-producto-sin-stock").length,
    bloqueados: catalogoDom.listaProductos.querySelectorAll(".catalogo-producto-sin-stock button:disabled").length
  }))()`);
  if (sinStockEstado.tarjetas !== 1 || sinStockEstado.bloqueados !== 1) {
    throw new Error("El producto sin stock no se mostro bloqueado: " + JSON.stringify(sinStockEstado));
  }

  const filtroEstado = await evaluar(cliente, `(() => {
    const botonGolosinas = Array.from(catalogoDom.filtrosRubros.querySelectorAll("button")).find(function (boton) {
      return boton.textContent === "Golosinas";
    });
    if (!botonGolosinas) throw new Error("No se creo el filtro Golosinas");
    botonGolosinas.click();
    return {
      tarjetas: catalogoDom.listaProductos.querySelectorAll(".catalogo-producto").length,
      activo: catalogoDom.filtrosRubros.querySelector("button.activo").textContent
    };
  })()`);
  if (filtroEstado.tarjetas !== 1 || filtroEstado.activo !== "Golosinas") {
    throw new Error("El filtro por rubro fallo: " + JSON.stringify(filtroEstado));
  }

  await evaluar(cliente, `(() => {
    limpiarFiltrosCatalogo();
    agregarProductoAlCarrito(productosCatalogo[0], 2);
    window.scrollTo(0, 0);
  })()`);
  await esperar(80);
  resultados.push(await capturar(cliente, "catalogo-producto-agregado-mobile"));
  const agregadoEstado = await evaluar(cliente, `(() => {
    const cantidad = catalogoDom.listaProductos.querySelector(".catalogo-producto-en-carrito .catalogo-producto-accion strong");
    return {
      cantidadEnTarjeta: cantidad ? cantidad.textContent : "",
      items: carritoCatalogo.length,
      tarjetasAgregadas: catalogoDom.listaProductos.querySelectorAll(".catalogo-producto-en-carrito").length,
      borrador: Boolean(JSON.parse(localStorage.getItem(CLAVE_BORRADOR_CATALOGO) || "null")),
      resumenActivo: catalogoDom.resumenMovil.classList.contains("catalogo-resumen-movil-activo")
    };
  })()`);
  if (agregadoEstado.cantidadEnTarjeta !== "2" || !agregadoEstado.borrador || !agregadoEstado.resumenActivo) {
    throw new Error("Agregar producto o guardar borrador fallo: " + JSON.stringify(agregadoEstado));
  }

  await evaluar(cliente, `abrirCarritoCatalogo();`);
  await esperar(80);
  resultados.push(await capturar(cliente, "catalogo-carrito-mobile"));
  const carritoEstado = await evaluar(cliente, `(() => ({
    abierto: document.getElementById("catalogoCarrito").classList.contains("catalogo-carrito-abierto"),
    fondo: !catalogoDom.carritoFondo.hidden,
    items: catalogoDom.itemsCarrito.querySelectorAll(".catalogo-item-carrito").length
  }))()`);
  if (!carritoEstado.abierto || !carritoEstado.fondo || carritoEstado.items !== 1) {
    throw new Error("El carrito movil fallo: " + JSON.stringify(carritoEstado));
  }

  const confirmacion = await evaluar(cliente, `(async () => {
    catalogoDom.nombreCliente.value = "Cliente de prueba";
    catalogoDom.direccionCliente.value = "Calle de prueba 123";
    catalogoDom.telefonoCliente.value = "1112345678";
    catalogoDom.telefonoDestino.value = "5491112345678";
    let llamadas = 0;
    const original = crearPedidoCatalogoPublicoSupabase;
    const contactoOriginal = obtenerConfiguracionCatalogoPublicoSupabase;
    obtenerConfiguracionCatalogoPublicoSupabase = async function () { return { whatsapp: "5491112345678" }; };
    crearPedidoCatalogoPublicoSupabase = async function () {
      llamadas += 1;
      return { numero: 999, total: 8500, cliente_codigo: 15 };
    };
    try {
      await enviarPedidoPorWhatsapp({ preventDefault() {} });
      await enviarPedidoPorWhatsapp({ preventDefault() {} });
      return { llamadas, items: carritoCatalogo.length, confirmado: leerEnvioCatalogo().estado,
        enlace: catalogoDom.resultadoWhatsapp.href, visible: !catalogoDom.resultado.hidden };
    } finally { crearPedidoCatalogoPublicoSupabase = original; obtenerConfiguracionCatalogoPublicoSupabase = contactoOriginal; }
  })()`);
  if (confirmacion.llamadas !== 1 || confirmacion.items !== 0 || confirmacion.confirmado !== "confirmado" || !confirmacion.visible || !confirmacion.enlace.includes("wa.me")) {
    throw new Error("Confirmacion aislada de catalogo fallo: " + JSON.stringify(confirmacion));
  }
  resultados.push(await capturar(cliente, "catalogo-confirmacion-mobile"));

  await evaluar(cliente, `cerrarCarritoCatalogo();`);
  await cliente.enviar("Emulation.setDeviceMetricsOverride", DESKTOP);
  await esperar(80);
  resultados.push(await capturar(cliente, "catalogo-desktop"));
  return resultados;
}

async function auditarBandejaCatalogo(cliente) {
  await navegar(cliente, BASE_URL + "/", DESKTOP, "typeof abrirBandejaCatalogo === 'function' && typeof aplicarUsuarioSistemaAutenticado === 'function'");
  await evaluar(cliente, `(() => {
    aplicarUsuarioSistemaAutenticado(obtenerAdministradorLocalInicial());
    desactivarSincronizacionAutomaticaSupabase();
    document.querySelector(".app").classList.add("sidebar-collapsed");
  })()`);
  await cargarDatosFicticiosAdmin(cliente);
  await evaluar(cliente, `(() => {
    const base = pedidos[0];
    pedidos.splice(0, pedidos.length,
      { ...base, id: 700, numero: 700, origen: "administracion", estado: "PENDIENTE" },
      { ...base, id: 701, numero: 701, origen: "catalogo", estado: "PENDIENTE", importePagado: 0, estadoCobro: "",
        observaciones: ["Pedido desde catalogo publico", "Direccion de entrega: Av. Central 1234", "Telefono de contacto: 1112345678", "Comentario: Entregar despues de las 16 hs"] },
      { ...base, id: 702, numero: 702, origen: "catalogo", estado: "ATENDIDO", importePagado: 0, estadoCobro: "" },
      { ...base, id: 703, numero: 703, origen: "catalogo", estado: "ENTREGADO", importePagado: 0, estadoCobro: "CUENTA_CORRIENTE", saldoPendiente: 8500 }
    );
    abrirBandejaCatalogo();
  })()`);
  const estado = await evaluar(cliente, `(() => ({
    ids: obtenerPedidosFiltrados().map(p => p.id),
    aviso: !document.getElementById("catalogoPedidosAviso").hidden,
    direccion: dom.pedidosTable.textContent.includes("Av. Central 1234"),
    telefono: dom.pedidosTable.textContent.includes("1112345678"),
    cobro: dom.pedidosTable.textContent.includes("Sin cobro registrado"),
    preparado: dom.pedidosTable.textContent.includes("Marcar preparado")
  }))()`);
  if (JSON.stringify(estado.ids) !== "[701]" || !estado.aviso || !estado.direccion || !estado.telefono || !estado.cobro || !estado.preparado) {
    throw new Error("Bandeja de catalogo incorrecta: " + JSON.stringify(estado));
  }
  const resultados = [await capturar(cliente, "admin-catalogo-desktop")];
  await evaluar(cliente, `document.querySelector('[data-catalogo-estado="ATENDIDO"]').click(); entregarPedido(702);`);
  const pago = await evaluar(cliente, "Number(dom.entregaPagoInput.value)");
  if (pago !== 0) throw new Error("La entrega del catalogo presupone un cobro");
  resultados.push(await capturar(cliente, "admin-catalogo-entrega-desktop"));
  await evaluar(cliente, "cerrarEntregaPedidoModal(); abrirBandejaCatalogo();");
  await cliente.enviar("Emulation.setDeviceMetricsOverride", MOBILE);
  resultados.push(await capturar(cliente, "admin-catalogo-mobile"));
  await evaluar(cliente, "salirBandejaCatalogo();");
  const todos = await evaluar(cliente, "obtenerPedidosFiltrados().map(p=>p.id).sort()");
  if (JSON.stringify(todos) !== "[700,701]") throw new Error("Volver a todas las ventas conserva el filtro de origen");
  return resultados;
}

async function ejecutar() {
  if (!fs.existsSync(CHROME_PATH)) throw new Error("No se encontro Chrome: " + CHROME_PATH);
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "lv-sistema-audit-profile-"));
  const chrome = childProcess.spawn(CHROME_PATH, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    "--user-data-dir=" + perfil,
    "about:blank"
  ], { windowsHide: true, stdio: "ignore" });
  let cliente;
  try {
    const puerto = await obtenerPuertoDevTools(perfil);
    const pagina = await solicitarJson(
      "http://127.0.0.1:" + puerto + "/json/new?" + encodeURIComponent("about:blank"),
      "PUT"
    );
    cliente = new ClienteCdp(pagina.webSocketDebuggerUrl);
    await cliente.conectar();
    await cliente.enviar("Page.enable");
    await cliente.enviar("Network.enable");
    await cliente.enviar("Network.setBlockedURLs", {
      urls: ["*supabase.co*", "*supabase.in*", "*wa.me*", "*api.whatsapp.com*"]
    });
    await cliente.enviar("Runtime.enable");
    const resultados = [];
    const auditoriaCompacta = await auditarAdmin(cliente, MOBILE_COMPACTO, "compacto");
    const auditoriaMovil = await auditarAdmin(cliente, MOBILE, "mobile");
    const auditoriaTablet = await auditarAdmin(cliente, TABLET, "tablet");
    resultados.push(...auditoriaCompacta);
    resultados.push(...auditoriaMovil);
    resultados.push(...auditoriaTablet);
    resultados.push(...await auditarEditoresAdmin(cliente));
    resultados.push(...await auditarBandejaCatalogo(cliente));
    resultados.push(...await auditarVendedores(cliente));
    resultados.push(...await auditarCatalogo(cliente));
    const aplicacionesInstalables = [];
    aplicacionesInstalables.push(await auditarAplicacionInstalable("/admin", "/manifest-admin.webmanifest"));
    aplicacionesInstalables.push(await auditarAplicacionInstalable("/vendedores", "/manifest-vendedores.webmanifest"));
    aplicacionesInstalables.push(await auditarAplicacionInstalable("/catalogo", "/manifest-catalogo.webmanifest"));
    const resumen = {
      fecha: new Date().toISOString(),
      baseUrl: BASE_URL,
      capturas: OUTPUT_PATH,
      vistasRevisadas: resultados.length,
      vistasConDesborde: resultados.filter(function (item) { return item.desbordeHorizontal; }).map(function (item) { return item.vista; }),
      vistasConControlesPequenos: resultados.filter(function (item) { return item.controlesPequenos.length > 0; }).map(function (item) { return { vista: item.vista, controles: item.controlesPequenos }; }),
      vistasConControlesSinNombre: resultados.filter(function (item) { return item.controlesSinNombre.length > 0; }).map(function (item) { return { vista: item.vista, controles: item.controlesSinNombre }; }),
      idsDuplicados: [...new Set(resultados.flatMap(function (item) { return item.idsDuplicados; }))],
      interaccionesMoviles: [auditoriaCompacta.interaccionMovil, auditoriaMovil.interaccionMovil, auditoriaTablet.interaccionMovil],
      aplicacionesInstalables: aplicacionesInstalables,
      resultados: resultados
    };
    fs.writeFileSync(path.join(OUTPUT_PATH, "resumen.json"), JSON.stringify(resumen, null, 2));
    console.log(JSON.stringify({
      fecha: resumen.fecha,
      capturas: resumen.capturas,
      vistasRevisadas: resumen.vistasRevisadas,
      vistasConDesborde: resumen.vistasConDesborde,
      vistasConControlesPequenos: resumen.vistasConControlesPequenos,
      vistasConControlesSinNombre: resumen.vistasConControlesSinNombre,
      idsDuplicados: resumen.idsDuplicados,
      interaccionesMoviles: resumen.interaccionesMoviles,
      aplicacionesInstalables: resumen.aplicacionesInstalables
    }, null, 2));
  } finally {
    if (cliente) cliente.cerrar();
    chrome.kill();
  }
}

ejecutar().catch(function (error) {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
