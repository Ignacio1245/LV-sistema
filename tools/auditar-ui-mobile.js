const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const https = require("https");
const os = require("os");
const path = require("path");

const CHROME_PATH = process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.argv[2] || "http://127.0.0.1:5600";
const OUTPUT_PATH = path.join(os.tmpdir(), "lv-sistema-mobile-audit");
const MOBILE_COMPACTO = { width: 360, height: 800, deviceScaleFactor: 1, mobile: true };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 1, mobile: true };
const TABLET = { width: 768, height: 1024, deviceScaleFactor: 1, mobile: true };

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
    const visibles = [...document.querySelectorAll("body *")].filter((elemento) => {
      const estilo = getComputedStyle(elemento);
      const rect = elemento.getBoundingClientRect();
      return estilo.display !== "none" && estilo.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const selector = (elemento) => elemento.id
      ? "#" + elemento.id
      : elemento.tagName.toLowerCase() + ([...elemento.classList].length ? "." + [...elemento.classList].slice(0, 3).join(".") : "");
    const controlesPequenos = visibles
      .filter((elemento) => elemento.matches("button, a, input:not([type=hidden]), select, textarea"))
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

async function auditarCatalogo(cliente) {
  await navegar(
    cliente,
    BASE_URL + "/catalogo.html",
    MOBILE,
    "typeof renderizarProductosCatalogo === 'function' && typeof renderizarCarritoCatalogo === 'function'"
  );
  await evaluar(cliente, `(() => {
    productosCatalogo = [
      { codigo: 101, nombre: "Yerba mate tradicional 1 kg", marca: "Marca Norte", detalle: "Paquete", rubro: "Almacen", stock: 25, precio: 4250, precioBase: 4250, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" },
      { codigo: 102, nombre: "Aceite de girasol 1,5 l", marca: "Campo", detalle: "Botella", rubro: "Almacen", stock: 12, precio: 3100, precioBase: 3100, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" },
      { codigo: 103, nombre: "Galletitas surtidas", marca: "Dulce", detalle: "Pack x 6", rubro: "Golosinas", stock: 40, precio: 5800, precioBase: 5800, activo: true, mostrarCatalogo: true, tipo: "UNIDAD" }
    ];
    renderizarProductosCatalogo();
    carritoCatalogo = [{ producto: productosCatalogo[0], cantidad: 2 }];
    renderizarCarritoCatalogo();
    actualizarEstadoCatalogo("Catalogo actualizado");
    window.scrollTo(0, 0);
  })()`);
  return [await capturar(cliente, "catalogo-mobile")];
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
    await cliente.enviar("Runtime.enable");
    const resultados = [];
    const auditoriaCompacta = await auditarAdmin(cliente, MOBILE_COMPACTO, "compacto");
    const auditoriaMovil = await auditarAdmin(cliente, MOBILE, "mobile");
    const auditoriaTablet = await auditarAdmin(cliente, TABLET, "tablet");
    resultados.push(...auditoriaCompacta);
    resultados.push(...auditoriaMovil);
    resultados.push(...auditoriaTablet);
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
