const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const raiz = path.resolve(__dirname, "..");
const jsPath = path.join(raiz, "js");

function listarHtml(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true })
    .filter(function (entrada) {
      return entrada.isFile() && entrada.name.endsWith(".html");
    })
    .map(function (entrada) {
      return path.join(carpeta, entrada.name);
    });
}

function listarJavascript(carpeta) {
  const archivos = [];

  fs.readdirSync(carpeta, { withFileTypes: true }).forEach(function (entrada) {
    const ruta = path.join(carpeta, entrada.name);

    if (entrada.isDirectory()) {
      archivos.push(...listarJavascript(ruta));
      return;
    }

    if (entrada.name.endsWith(".js")) {
      archivos.push(ruta);
    }
  });

  return archivos;
}

function validarSintaxisJavascript(archivos) {
  archivos.forEach(function (archivo) {
    childProcess.execFileSync("node", ["--check", archivo], {
      stdio: "pipe"
    });
  });
}

function crearResumenReferencias(html, archivosJavascript) {
  const textoJavascript =
    archivosJavascript.map(function (archivo) {
      return fs.readFileSync(archivo, "utf8");
    }).join("\n");

  const ids =
    [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(function (match) {
      return match[1];
    });

  const idsDuplicados =
    [...new Set(ids.filter(function (id, indice) {
      return ids.indexOf(id) !== indice;
    }))];

  const referencias =
    [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(function (match) {
        return match[1];
      })
      .filter(function (referencia) {
        return !referencia.startsWith("http") &&
          !referencia.startsWith("#") &&
          !referencia.startsWith("data:");
      });

  const referenciasFaltantes =
    [...new Set(referencias.map(function (referencia) {
      return referencia.split("?")[0];
    }).filter(function (referencia) {
      return !fs.existsSync(path.join(raiz, referencia));
    }))];

  const funcionesClick =
    [...html.matchAll(/onclick=["']\s*([A-Za-z_$][\w$]*)\s*\(/g)]
      .map(function (match) {
        return match[1];
      });

  const funcionesFaltantes =
    [...new Set(funcionesClick.filter(function (nombreFuncion) {
      const patron = new RegExp(
        "(?:function|async\\s+function)\\s+" + nombreFuncion + "\\s*\\(" +
        "|(?:const|let|var)\\s+" + nombreFuncion + "\\s*=" +
        "|window\\." + nombreFuncion + "\\s*="
      );

      return !patron.test(textoJavascript);
    }))];

  return {
    idsDuplicados: idsDuplicados,
    referenciasFaltantes: referenciasFaltantes,
    funcionesFaltantes: funcionesFaltantes
  };
}

function fallarSiHayErrores(resumen) {
  const errores = [];

  if (resumen.idsDuplicados.length > 0) {
    errores.push("IDs duplicados: " + resumen.idsDuplicados.join(", "));
  }

  if (resumen.referenciasFaltantes.length > 0) {
    errores.push("Archivos faltantes: " + resumen.referenciasFaltantes.join(", "));
  }

  if (resumen.funcionesFaltantes.length > 0) {
    errores.push("Funciones faltantes: " + resumen.funcionesFaltantes.join(", "));
  }

  if (errores.length > 0) {
    throw new Error(errores.join("\n"));
  }
}

function obtenerCuerpoFuncion(texto, nombreFuncion) {
  const inicio =
    texto.indexOf("function " + nombreFuncion + "(");

  if (inicio === -1) {
    return "";
  }

  const inicioCuerpo =
    texto.indexOf("{", inicio);

  if (inicioCuerpo === -1) {
    return "";
  }

  let profundidad = 0;

  for (let indice = inicioCuerpo; indice < texto.length; indice += 1) {
    const caracter =
      texto[indice];

    if (caracter === "{") {
      profundidad += 1;
    }

    if (caracter === "}") {
      profundidad -= 1;
    }

    if (profundidad === 0) {
      return texto.slice(inicioCuerpo + 1, indice);
    }
  }

  return "";
}

function validarGuardasDePermisos(raizProyecto) {
  const funcionesSensibles = [
    ["js/clientes.js", "agregarCliente"],
    ["js/clientes.js", "importarClientesDesdeTexto"],
    ["js/clientes.js", "cambiarEstadoCliente"],
    ["js/clientes.js", "editarCliente"],
    ["js/clientes.js", "eliminarCliente"],
    ["js/clientes.js", "registrarPagoDesdeFormulario"],
    ["js/clientes.js", "registrarNotaCreditoDesdeFormulario"],
    ["js/clientes.js", "registrarPago"],
    ["js/rubros.js", "agregarRubro"],
    ["js/rubros.js", "actualizarRubroEditado"],
    ["js/rubros.js", "editarRubro"],
    ["js/rubros.js", "eliminarRubro"],
    ["js/zonas.js", "agregarZona"],
    ["js/zonas.js", "editarZona"],
    ["js/zonas.js", "eliminarZona"],
    ["js/proveedores.js", "registrarPagoProveedor"],
    ["js/proveedores.js", "agregarProveedor"],
    ["js/proveedores.js", "editarProveedor"],
    ["js/proveedores.js", "cambiarEstadoProveedor"],
    ["js/proveedores.js", "eliminarProveedor"],
    ["js/compras.js", "registrarCompra"],
    ["js/productos-admin.js", "agregarListaPrecio"],
    ["js/productos-admin.js", "cambiarEstadoListaPrecio"],
    ["js/productos-admin.js", "aplicarActualizacionMasivaPrecios"],
    ["js/productos-admin.js", "importarPreciosDesdeArchivo"],
    ["js/productos-admin.js", "agregarProducto"],
    ["js/productos-admin.js", "importarProductosDesdeTexto"],
    ["js/productos-admin.js", "editarProducto"],
    ["js/productos-admin.js", "eliminarProducto"],
    ["js/productos-admin.js", "registrarMovimientoManualStock"],
    ["js/productos-admin.js", "registrarMovimientoRapidoStock"],
    ["js/productos-admin.js", "cambiarEstadoProducto"],
    ["js/pedido.js", "agregarProductoAlPedidoActual"],
    ["js/pedido.js", "guardarPedido"],
    ["js/pedido.js", "atenderPedido"],
    ["js/pedido.js", "entregarPedido"],
    ["js/pedido.js", "confirmarEntregaPedido"],
    ["js/pedido.js", "cobrarPedido"],
    ["js/pedido.js", "pasarACuentaCorriente"],
    ["js/pedido.js", "cancelarPedido"],
    ["js/pedido.js", "reabrirPedidoAtendido"],
    ["js/pedido.js", "editarPedido"],
    ["js/pedido.js", "eliminarPedido"]
  ];

  const faltantes =
    funcionesSensibles.filter(function (item) {
      const archivo =
        path.join(raizProyecto, item[0]);
      const nombreFuncion =
        item[1];
      const texto =
        fs.readFileSync(archivo, "utf8");
      const cuerpo =
        obtenerCuerpoFuncion(texto, nombreFuncion);

      return !cuerpo || !cuerpo.includes("tienePermiso(");
    });

  if (faltantes.length > 0) {
    throw new Error(
      "Funciones sensibles sin guarda de permisos: " +
      faltantes.map(function (item) {
        return item[0] + ":" + item[1];
      }).join(", ")
    );
  }
}

function obtenerColumnasSupabase(raizProyecto) {
  const archivosSql = [
    path.join(raizProyecto, "supabase", "sql", "schema-inicial.sql"),
    path.join(raizProyecto, "supabase", "sql", "schema-ajustes-js.sql")
  ];
  const tablas = {};

  archivosSql.forEach(function (archivoSql) {
    const sql =
      fs.readFileSync(archivoSql, "utf8");

    [...sql.matchAll(/create table if not exists\s+(\w+)\s*\(([\s\S]*?)\n\);/g)]
      .forEach(function (match) {
        const nombreTabla =
          match[1];
        const cuerpo =
          match[2];

        if (!tablas[nombreTabla]) {
          tablas[nombreTabla] = new Set(["id"]);
        }

        cuerpo.split(/\n/).forEach(function (linea) {
          const columna =
            linea.trim().match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+/);

          if (
            columna &&
            !["primary", "unique", "foreign", "check", "constraint"].includes(columna[1].toLowerCase())
          ) {
            tablas[nombreTabla].add(columna[1]);
          }
        });
      });

    [...sql.matchAll(/alter table\s+(\w+)\s+([\s\S]*?);/g)]
      .forEach(function (match) {
        const nombreTabla =
          match[1];
        const cuerpo =
          match[2];

        if (!tablas[nombreTabla]) {
          tablas[nombreTabla] = new Set(["id"]);
        }

        [...cuerpo.matchAll(/add column if not exists\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)]
          .forEach(function (columna) {
            tablas[nombreTabla].add(columna[1]);
          });
      });
  });

  return tablas;
}

function validarColumnasSupabase(raizProyecto) {
  const tablas =
    obtenerColumnasSupabase(raizProyecto);
  const columnasUsadas = {
    roles: ["id", "nombre", "permisos", "activo"],
    usuarios: ["id", "codigo", "nombre", "email", "rol_id", "activo"],
    configuracion_empresa: ["id", "empresa", "cuit", "direccion", "whatsapp", "alias", "cbu", "impresion_titulo", "impresion_subtitulo", "impresion_pie", "impresion_mostrar_qr", "impresion_qr_texto", "stock_minimo", "permitir_stock_negativo", "actualizado_en"],
    zonas: ["id", "codigo", "nombre", "descripcion", "activo"],
    rubros: ["id", "codigo", "nombre", "descripcion", "activo"],
    proveedores: ["id", "codigo", "nombre", "telefono", "contacto", "observacion", "activo"],
    proveedor_pagos: ["id", "codigo", "proveedor", "importe", "medio", "comprobante", "observacion", "fecha"],
    compras: ["id", "codigo", "proveedor", "producto_codigo", "producto_nombre", "cantidad", "costo_unitario", "total", "comprobante", "costo_anterior", "precios_actualizados", "fecha"],
    vendedores: ["id", "codigo", "nombre", "telefono", "email", "zona", "tipo", "activo"],
    listas_precios: ["id", "codigo", "nombre", "porcentaje", "activo"],
    clientes: ["id", "codigo", "nombre", "saldo", "telefono", "direccion", "zona", "activo", "razon_social", "nombre_fantasia", "localidad", "codigo_postal", "telefono_particular", "telefono_movil", "email", "lista_precios", "posicion_zona", "vendedor_asignado", "condicion_iva", "horario_atencion", "observaciones"],
    productos: ["id", "codigo", "codigo_real", "nombre", "precio_base", "precio_compra", "stock", "stock_minimo", "rubro", "proveedor", "proveedor_alternativo", "marca", "tipo", "detalle", "pack", "unidad", "iva", "bonificacion_venta", "precios_lista", "historial_precios", "movimientos_stock", "activo", "baja_automatica_stock", "imagen_url", "mostrar_catalogo"],
    pedidos: ["id", "numero", "cliente_id", "vendedor_id", "vendedor", "zona", "estado", "forma_pago", "estado_cobro", "total", "pagado", "saldo_generado", "fecha", "fecha_entrega", "observaciones", "nota_credito"],
    pedido_items: ["id", "pedido_id", "producto_id", "cantidad", "lista_precio_id", "lista_precio_nombre", "precio_unitario", "descuento_porcentaje", "subtotal"],
    pagos_cliente: ["id", "cliente_id", "pedido_id", "codigo_pago", "importe", "medio_pago", "observacion", "fecha"],
    movimientos_stock: ["id", "producto_id", "tipo", "referencia", "cantidad", "stock_final", "fecha"],
    auditoria: ["id", "usuario_id", "usuario_nombre", "usuario_rol", "modulo", "accion", "detalle", "fecha"]
  };

  const faltantes = [];

  Object.keys(columnasUsadas).forEach(function (nombreTabla) {
    const columnasTabla =
      tablas[nombreTabla] || new Set();

    columnasUsadas[nombreTabla].forEach(function (nombreColumna) {
      if (!columnasTabla.has(nombreColumna)) {
        faltantes.push(nombreTabla + "." + nombreColumna);
      }
    });
  });

  if (faltantes.length > 0) {
    throw new Error("Columnas usadas por JS que no existen en SQL: " + faltantes.join(", "));
  }
}

function validarDatosIniciales(raizProyecto) {
  const dataPath =
    path.join(raizProyecto, "js", "data.js");
  const texto =
    fs.readFileSync(dataPath, "utf8");
  const listas = [
    "clientes",
    "productos",
    "zonas",
    "proveedores",
    "listasPrecios",
    "rubros"
  ];
  const errores = [];

  listas.forEach(function (nombreLista) {
    const patron =
      new RegExp("let\\s+" + nombreLista + "\\s*=\\s*\\[([\\s\\S]*?)\\];");
    const match =
      texto.match(patron);

    if (!match) {
      return;
    }

    const codigos =
      [...match[1].matchAll(/codigo:\s*(-?\d+)/g)].map(function (codigo) {
        return Number(codigo[1]);
      });
    const codigosNoPositivos =
      codigos.filter(function (codigo) {
        return codigo <= 0;
      });
    const codigosDuplicados =
      [...new Set(codigos.filter(function (codigo, indice) {
        return codigos.indexOf(codigo) !== indice;
      }))];

    if (codigosNoPositivos.length > 0) {
      errores.push(nombreLista + " con codigos no positivos: " + codigosNoPositivos.join(", "));
    }

    if (codigosDuplicados.length > 0) {
      errores.push(nombreLista + " con codigos duplicados: " + codigosDuplicados.join(", "));
    }
  });

  [
    "Consumidor final",
    "Kiosco El Sol",
    "Despensa Don Luis",
    "Maxikiosco Avenida",
    "Azucar",
    "Aceite",
    "Yerba",
    "Harina",
    "General",
    "Centro",
    "Norte",
    "Sur",
    "Alimentos",
    "Productos de almacen",
    "Productos sin clasificar",
    "Productos sin proveedor asignado"
  ].forEach(function (datoDemo) {
    if (texto.includes(datoDemo)) {
      errores.push("data.js no debe cargar dato demo: " + datoDemo);
    }
  });

  [
    "clientes",
    "productos",
    "pedidos",
    "zonas",
    "proveedores",
    "compras",
    "proveedorPagos",
    "vendedoresSistema",
    "listasPrecios",
    "rubros"
  ].forEach(function (nombreLista) {
    const patronListaVacia =
      new RegExp("let\\s+" + nombreLista + "\\s*=\\s*\\[\\s*\\];");

    if (!patronListaVacia.test(texto)) {
      errores.push("data.js debe iniciar " + nombreLista + " en cero");
    }
  });

  if (errores.length > 0) {
    throw new Error("Datos iniciales invalidos: " + errores.join(" | "));
  }
}

function validarPoliticasRlsProduccion(raizProyecto) {
  const rlsPath =
    path.join(raizProyecto, "supabase", "sql", "rls-por-roles.sql");
  const sql =
    fs.readFileSync(rlsPath, "utf8");
  const reglasNecesarias = [
    ["clientes escritura ventas", /clientes escritura permiso[\s\S]*usuario_tiene_permiso\('ventas'\)/],
    ["pagos cliente escritura ventas", /pagos cliente escritura permiso[\s\S]*usuario_tiene_permiso\('ventas'\)/],
    ["pedidos escritura ventas", /pedidos escritura ventas[\s\S]*usuario_tiene_permiso\('ventas'\)/],
    ["productos escritura ventas", /productos escritura permiso[\s\S]*usuario_tiene_permiso\('ventas'\)/]
  ];
  const faltantes =
    reglasNecesarias.filter(function (regla) {
      return !regla[1].test(sql);
    }).map(function (regla) {
      return regla[0];
    });

  if (faltantes.length > 0) {
    throw new Error("RLS de produccion desalineado con flujos de venta: " + faltantes.join(", "));
  }
}

function validarRetornosCriticos(raizProyecto) {
  const helpersPath =
    path.join(raizProyecto, "js", "helpers.js");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const helpers =
    fs.readFileSync(helpersPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const funcionesConRetorno = [
    ["js/pedido.js", "obtenerPedidosFiltrados", "pedidosFiltrados"]
  ];
  const faltantes =
    funcionesConRetorno.filter(function (item) {
      const texto =
        fs.readFileSync(path.join(raizProyecto, item[0]), "utf8");
      const cuerpo =
        obtenerCuerpoFuncion(texto, item[1]);

      return !cuerpo || !new RegExp("return\\s+" + item[2] + "\\s*;").test(cuerpo);
    });

  if (faltantes.length > 0) {
    throw new Error(
      "Funciones criticas sin retorno esperado: " +
      faltantes.map(function (item) {
        return item[0] + ":" + item[1];
      }).join(", ")
    );
  }

  if (!helpers.includes("Number.isFinite(numeroSeguro)") || !helpers.includes('return "$0";')) {
    throw new Error("formatearDinero debe tolerar valores invalidos sin romper pantallas");
  }

  if (!app.includes("return total + (Number(cliente.saldo) || 0);")) {
    throw new Error("actualizarDashboard debe sumar saldo de clientes como numero seguro");
  }
}

function validarEstilosSeparados(raizProyecto) {
  const stylesPath =
    path.join(raizProyecto, "css", "styles.css");
  const styles =
    fs.readFileSync(stylesPath, "utf8");
  const archivosCssAdmin = [
    "01-base-layout.css",
    "02-pedidos-ventas.css",
    "03-tablas-formularios.css",
    "04-modulos-admin.css",
    "05-responsive-print.css",
    "06-tema-final.css"
  ];
  const errores = [];

  if (!styles.includes("Indice de estilos del sistema administrativo")) {
    errores.push("css/styles.css debe ser el indice de estilos");
  }

  archivosCssAdmin.forEach(function (archivoCss) {
    const rutaCss =
      path.join(raizProyecto, "css", "admin", archivoCss);

    if (!fs.existsSync(rutaCss)) {
      errores.push("Falta css/admin/" + archivoCss);
      return;
    }

    if (!styles.includes('admin/' + archivoCss)) {
      errores.push("styles.css no importa css/admin/" + archivoCss);
    }
  });

  if (errores.length > 0) {
    throw new Error("Estilos no separados correctamente: " + errores.join(" | "));
  }
}

function validarSincronizacionMultiEquipo(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const supabaseDataPath =
    path.join(raizProyecto, "js", "supabase-data.js");
  const repositorioPath =
    path.join(raizProyecto, "js", "database", "supabase-repository.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const supabaseData =
    fs.readFileSync(supabaseDataPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const errores = [];

  if (html.includes("refreshOnlineDataButton") ||
      html.includes("syncPendingDataButton") ||
      html.includes("supabaseSyncStatus") ||
      html.includes("resetDataButton") ||
      html.includes("newSaleButton")) {
    errores.push("la barra superior debe dejar visible solo Salir, sin controles tecnicos");
  }

  if (!html.includes("logoutButton")) {
    errores.push("la barra superior debe conservar el boton Salir");
  }

  if (!app.includes("actualizarDatosDesdeSupabaseManual") ||
      !app.includes("renderizarPantallasDespuesDeActualizarDatos") ||
      !app.includes("pausarSincronizacionAutomatica(cargarDatosOnline)")) {
    errores.push("app.js debe permitir refrescar datos Supabase para uso multi-computadora");
  }

  if (!app.includes("actualizarDatosOnlineAlCambiarApartado") ||
      !app.includes("ultimaActualizacionOnlinePorCambioDeApartado") ||
      !app.includes("actualizandoDatosPorCambioDeApartado") ||
      !app.includes("actualizarDatosOnlineAlCambiarApartado(nombre)")) {
    errores.push("app.js debe refrescar datos online al cambiar de apartado");
  }

  if (!app.includes("sincronizarCambiosPendientesSupabase") ||
      !app.includes("haySincronizacionPendiente") ||
      !app.includes("await sincronizarCambiosPendientesSupabase();")) {
    errores.push("app.js debe subir pendientes automaticamente antes de refrescar desde Supabase");
  }

  if (!supabaseData.includes("marcarSincronizacionPendiente") ||
      !supabaseData.includes("limpiarSincronizacionPendiente") ||
      !supabaseData.includes("sincronizarCambiosPendientesSupabase") ||
      !supabaseData.includes("sincronizacionPendiente")) {
    errores.push("supabase-data.js debe registrar y subir cambios pendientes de sincronizacion");
  }

  if (!repositorio.includes("function obtenerMayorNumeroPedidoSupabase") ||
      !repositorio.includes('supabaseClient.from("pedidos").insert(pedidoSupabase)') ||
      repositorio.includes('from("pedidos").upsert(pedidoSupabase, { onConflict: "numero" })')) {
    errores.push("pedidos nuevos en Supabase deben insertarse sin upsert para no pisar otra PC");
  }

  if (!supabaseData.includes("function esErrorNumeroPedidoDuplicado") ||
      !supabaseData.includes("guardarPedidoSupabaseConReintento") ||
      !supabaseData.includes("asegurarNumeroPedidoNuevoSupabase")) {
    errores.push("guardado de pedidos debe reintentar con otro numero si otra PC ya uso el mismo");
  }

  [
    "productos = productosSupabase;",
    "clientes = clientesSupabase;",
    "pedidos = pedidosSupabase;",
    "zonas = zonasSupabase;",
    "rubros = rubrosSupabase;",
    "proveedores = proveedoresSupabase;",
    "vendedoresSistema = vendedoresSupabase;",
    "listasPrecios = listasSupabase;",
    "proveedorPagos = proveedorPagosSupabase;",
    "compras = comprasSupabase;",
    "auditoria = auditoriaSupabase;"
  ].forEach(function (textoEsperado) {
    if (!supabaseData.includes(textoEsperado)) {
      errores.push("carga Supabase debe reemplazar local aunque venga vacio: " + textoEsperado);
    }
  });

  if (errores.length > 0) {
    throw new Error("Sincronizacion multi-equipo incompleta: " + errores.join(" | "));
  }
}

function validarCatalogoPublicoProduccion(raizProyecto) {
  const sqlPath =
    path.join(raizProyecto, "supabase", "sql", "catalogo-publico.sql");
  const repositorioPath =
    path.join(raizProyecto, "js", "database", "supabase-repository.js");
  const catalogoPath =
    path.join(raizProyecto, "js", "public", "catalogo-whatsapp.js");

  const sql =
    fs.readFileSync(sqlPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const catalogo =
    fs.readFileSync(catalogoPath, "utf8");

  const errores = [];

  if (!sql.includes("security definer")) {
    errores.push("catalogo-publico.sql debe usar security definer para lectura anonima controlada");
  }

  if (!sql.includes("grant execute on function public.obtener_catalogo_publico() to anon")) {
    errores.push("catalogo-publico.sql debe otorgar execute a anon");
  }

  if (/\bprecio_compra\b|\bproductos\.proveedor\b|\bproveedor_id\b/.test(sql)) {
    errores.push("catalogo-publico.sql no debe exponer costos ni proveedores");
  }

  if (!repositorio.includes('rpc("obtener_catalogo_publico")')) {
    errores.push("supabase-repository.js debe consultar obtener_catalogo_publico");
  }

  if (!catalogo.includes("obtenerProductosCatalogoPublicoSupabase")) {
    errores.push("catalogo-whatsapp.js debe usar la consulta publica del catalogo");
  }

  if (errores.length > 0) {
    throw new Error("Catalogo publico inseguro o incompleto: " + errores.join(" | "));
  }
}

function validarVendedoresMobileProduccion(raizProyecto) {
  const vendedoresPath =
    path.join(raizProyecto, "js", "mobile", "vendedores-mobile.js");
  const repositorioPath =
    path.join(raizProyecto, "js", "database", "supabase-repository.js");
  const vendedores =
    fs.readFileSync(vendedoresPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const errores = [];

  if (!vendedores.includes("iniciarSesionSupabase")) {
    errores.push("vendedores-mobile.js debe iniciar sesion con Supabase Auth");
  }

  if (!vendedores.includes("clienteAsignadoAlVendedorActual")) {
    errores.push("vendedores-mobile.js debe filtrar clientes asignados al vendedor");
  }

  if (!repositorio.includes("obtenerUsuarioSistemaPorEmailSupabase")) {
    errores.push("supabase-repository.js debe poder leer el usuario actual por email");
  }

  if (errores.length > 0) {
    throw new Error("Vendedores mobile inseguro o incompleto: " + errores.join(" | "));
  }
}

function validarImportacionesRobustas(raizProyecto) {
  const productosAdminPath =
    path.join(raizProyecto, "js", "productos-admin.js");
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const productosAdmin =
    fs.readFileSync(productosAdminPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const errores = [];

  if (!productosAdmin.includes("function detectarSeparadorImportacion")) {
    errores.push("productos-admin.js debe detectar separador de importacion");
  }

  if (!productosAdmin.includes('[";", "\\t", ","]')) {
    errores.push("la importacion debe aceptar punto y coma, tabulacion y coma");
  }

  if (!clientes.includes("detectarSeparadorImportacion")) {
    errores.push("clientes.js debe usar detectarSeparadorImportacion");
  }

  if (!productosAdmin.includes("guardarRubros();") ||
      !productosAdmin.includes("guardarProveedores();") ||
      !productosAdmin.includes('programarSincronizacionAutomatica("datosBase")')) {
    errores.push("importacion de productos debe guardar y sincronizar rubros/proveedores creados");
  }

  if (!clientes.includes("guardarZonas();") ||
      !clientes.includes('programarSincronizacionAutomatica("datosBase")')) {
    errores.push("importacion de clientes debe guardar y sincronizar zonas creadas");
  }

  if (errores.length > 0) {
    throw new Error("Importaciones poco robustas: " + errores.join(" | "));
  }
}

function validarBusquedaStockYCompras(raizProyecto) {
  const helpersPath =
    path.join(raizProyecto, "js", "helpers.js");
  const indexPath =
    path.join(raizProyecto, "index.html");
  const comprasPath =
    path.join(raizProyecto, "js", "compras.js");
  const movimientosPath =
    path.join(raizProyecto, "js", "movimientos.js");
  const productosAdminPath =
    path.join(raizProyecto, "js", "productos-admin.js");
  const helpers =
    fs.readFileSync(helpersPath, "utf8");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const compras =
    fs.readFileSync(comprasPath, "utf8");
  const movimientos =
    fs.readFileSync(movimientosPath, "utf8");
  const productosAdmin =
    fs.readFileSync(productosAdminPath, "utf8");
  const errores = [];

  if (!helpers.includes("function obtenerCodigoDesdeBusquedaProducto")) {
    errores.push("helpers.js debe extraer codigo desde busquedas tipo codigo - nombre");
  }

  if (!compras.includes("obtenerCodigoDesdeBusquedaProducto(busqueda)")) {
    errores.push("compras.js debe aceptar productos elegidos desde datalist");
  }

  if (!productosAdmin.includes("obtenerCodigoDesdeBusquedaProducto(busqueda)")) {
    errores.push("productos-admin.js debe aceptar productos elegidos desde datalist en stock");
  }

  if (!compras.includes("!productoEsPeso(producto) && !Number.isInteger(cantidad)")) {
    errores.push("compras.js debe bloquear cantidades decimales para productos por unidad");
  }

  if (!movimientos.includes("const esSalida") || !movimientos.includes("movimiento.cantidad < 0")) {
    errores.push("movimientos.js debe tratar como salida solo cantidades negativas");
  }

  if (!html.includes('id="stockMovementQuantityInput" type="number" min="0" step="0.001"')) {
    errores.push("stockMovementQuantityInput debe permitir decimales para productos por peso");
  }

  if (!html.includes('id="compraCantidadInput" type="number" min="0.001" step="0.001"')) {
    errores.push("compraCantidadInput debe permitir decimales para productos por peso");
  }

  if (errores.length > 0) {
    throw new Error("Busqueda de productos en stock/compras incompleta: " + errores.join(" | "));
  }
}

function validarDashboardAdministrativo(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const estilosPath =
    path.join(raizProyecto, "css", "styles.css");
  const temaFinalPath =
    path.join(raizProyecto, "css", "admin", "06-tema-final.css");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const estilos =
    fs.readFileSync(estilosPath, "utf8") +
    (fs.existsSync(temaFinalPath) ? fs.readFileSync(temaFinalPath, "utf8") : "");
  const errores = [];

  if (!html.includes("dashboardDatosIncompletosLista")) {
    errores.push("Inicio debe tener tarjeta de datos incompletos");
  }

  if (!html.includes("dashboardInicioRapidoPanel")) {
    errores.push("Inicio debe tener panel de arranque rapido");
  }

  if (!estilos.includes(".dashboard-start-panel") || estilos.includes(".dashboard-control-card:nth-child(3)")) {
    errores.push("panel principal debe mostrar arranque rapido y no ocultar datos incompletos");
  }

  if (!app.includes("dashboardDatosIncompletosLista: document.querySelector")) {
    errores.push("app.js debe registrar dashboardDatosIncompletosLista en dom");
  }

  if (!app.includes("function obtenerDatosIncompletosParaDashboard")) {
    errores.push("dashboard debe calcular datos incompletos");
  }

  if (!app.includes("function crearFilaDashboard")) {
    errores.push("dashboard debe centralizar filas escapadas");
  }

  if (!app.includes("escaparTextoHtml(textoPrincipal)") || !app.includes("escaparTextoHtml(textoDetalle)")) {
    errores.push("dashboard debe escapar textos dinamicos");
  }

  [
    "clientes.filter(clienteActivo)",
    "productos.filter(productoActivo)",
    "proveedores.filter(proveedorActivo)",
    "rubros.filter(rubroActivo)",
    "zonas.filter(zonaActiva)"
  ].forEach(function (textoEsperado) {
    if (!app.includes(textoEsperado)) {
      errores.push("dashboard debe revisar " + textoEsperado);
    }
  });

  if (errores.length > 0) {
    throw new Error("Dashboard administrativo incompleto: " + errores.join(" | "));
  }
}

function validarRestablecimientoDatos(raizProyecto) {
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const sqlVaciarPath =
    path.join(raizProyecto, "supabase", "sql", "vaciar-datos-operativos.sql");
  const app =
    fs.readFileSync(appPath, "utf8");
  const sqlVaciar =
    fs.existsSync(sqlVaciarPath) ? fs.readFileSync(sqlVaciarPath, "utf8") : "";
  const errores = [];

  if (!app.includes("function obtenerListasParaRestablecerSistema")) {
    errores.push("app.js debe centralizar las listas a restablecer");
  }

  if (!app.includes("function restablecerDatosLocalesSistema")) {
    errores.push("app.js debe tener funcion dedicada para restablecer datos locales");
  }

  [
    "clientes",
    "productos",
    "pedidos",
    "zonas",
    "rubros",
    "proveedores",
    "proveedorPagos",
    "vendedoresSistema",
    "compras",
    "listasPrecios",
    "informesMensuales",
    "auditoria",
    "configuracion",
    "usuariosSistema",
    "rolesPersonalizados",
    "usuarioActual"
  ].forEach(function (nombreDeLista) {
    if (!app.includes('"' + nombreDeLista + '"')) {
      errores.push("restablecimiento debe borrar " + nombreDeLista);
    }
  });

  if (!app.includes("puedeRestablecerDatosSistema()")) {
    errores.push("boton de restablecimiento debe usar permiso centralizado");
  }

  if (!app.includes("segundaConfirmacion")) {
    errores.push("restablecimiento debe pedir confirmacion final");
  }

  if (!sqlVaciar) {
    errores.push("debe existir SQL para vaciar datos operativos en Supabase");
  }

  [
    "pagos_cliente",
    "movimientos_stock",
    "pedido_items",
    "pedidos",
    "producto_precios",
    "productos",
    "clientes",
    "compras",
    "proveedor_pagos",
    "vendedores",
    "proveedores",
    "rubros",
    "zonas",
    "listas_precios",
    "auditoria"
  ].forEach(function (tabla) {
    if (!sqlVaciar.includes(tabla)) {
      errores.push("SQL de vaciado debe incluir tabla " + tabla);
    }
  });

  if (/\b(roles|usuarios|configuracion_empresa)\b/.test(sqlVaciar.replace(/--.*$/gm, ""))) {
    errores.push("SQL de vaciado no debe borrar roles, usuarios ni configuracion_empresa");
  }

  if (errores.length > 0) {
    throw new Error("Restablecimiento de datos incompleto: " + errores.join(" | "));
  }
}

function validarClientesAdministracion(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const zonasPath =
    path.join(raizProyecto, "js", "zonas.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const zonas =
    fs.readFileSync(zonasPath, "utf8");
  const errores = [];

  if (!html.includes('id="clientCodeInput" type="number" min="1"')) {
    errores.push("clientCodeInput debe exigir codigos mayores a 0 desde la pantalla");
  }

  if (!clientes.includes('registrarAuditoria(\n    "Clientes",\n    "Creo cliente"')) {
    errores.push("el alta de clientes debe quedar auditada");
  }

  if (!clientes.includes("clienteSeleccionado = clienteActual")) {
    errores.push("editar cliente debe actualizar el cliente seleccionado en pedido");
  }

  if (!clientes.includes("? normalizarTexto(dom.buscarClienteTabla.value)")) {
    errores.push("la busqueda de clientes debe usar normalizarTexto");
  }

  if (!clientes.includes('dom.clientZoneInput.value || "Sin zona"')) {
    errores.push("alta de cliente debe permitir cargar sin zona cuando el sistema arranca en cero");
  }

  [
    "cliente.nombre",
    "cliente.telefono",
    "cliente.direccion",
    "cliente.zona || \"Sin zona\""
  ].forEach(function (textoEsperado) {
    if (!clientes.includes("escaparTextoHtml(" + textoEsperado)) {
      errores.push("listado de clientes debe escapar " + textoEsperado);
    }
  });

  if (!zonas.includes('value="Sin zona"') || !zonas.includes("zonasActivas.length === 0")) {
    errores.push("selector de zonas debe ofrecer Sin zona cuando no hay zonas creadas");
  }

  if (errores.length > 0) {
    throw new Error("Clientes administracion incompleto: " + errores.join(" | "));
  }
}

function validarDatosBaseAdministracion(raizProyecto) {
  const rubrosPath =
    path.join(raizProyecto, "js", "rubros.js");
  const zonasPath =
    path.join(raizProyecto, "js", "zonas.js");
  const rubros =
    fs.readFileSync(rubrosPath, "utf8");
  const zonas =
    fs.readFileSync(zonasPath, "utf8");
  const errores = [];

  [
    ["rubros.js", rubros, "rubro.nombre"],
    ["rubros.js", rubros, "rubro.descripcion || \"-\""],
    ["zonas.js", zonas, "zona.nombre"],
    ["zonas.js", zonas, "zona.descripcion || \"-\""]
  ].forEach(function (regla) {
    if (!regla[1].includes("escaparTextoHtml(" + regla[2])) {
      errores.push(regla[0] + " debe escapar " + regla[2]);
    }
  });

  if (errores.length > 0) {
    throw new Error("Datos base administracion incompleto: " + errores.join(" | "));
  }
}

function validarProveedoresAdministracion(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const proveedoresPath =
    path.join(raizProyecto, "js", "proveedores.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const proveedores =
    fs.readFileSync(proveedoresPath, "utf8");
  const errores = [];

  [
    "proveedor.nombre",
    "proveedor.telefono || \"-\"",
    "proveedor.contacto || \"-\""
  ].forEach(function (textoEsperado) {
    if (!proveedores.includes("escaparTextoHtml(" + textoEsperado)) {
      errores.push("listado de proveedores debe escapar " + textoEsperado);
    }
  });

  if (!html.includes("data-provider-status-filter") ||
      !app.includes("providerStatusFilterButtons") ||
      !proveedores.includes('let filtroEstadoProveedores = "activos"') ||
      !proveedores.includes('filtroEstadoProveedores === "inactivos"')) {
    errores.push("proveedores debe tener filtro de activos, inactivos y todos");
  }

  if (errores.length > 0) {
    throw new Error("Proveedores administracion incompleto: " + errores.join(" | "));
  }
}

function validarPedidosOperativos(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const pedidoPath =
    path.join(raizProyecto, "js", "pedido.js");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const productosPath =
    path.join(raizProyecto, "js", "productos.js");
  const habitualesPath =
    path.join(raizProyecto, "js", "pedido", "habituales.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const pedido =
    fs.readFileSync(pedidoPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const productos =
    fs.readFileSync(productosPath, "utf8");
  const habituales =
    fs.readFileSync(habitualesPath, "utf8");
  const cuerpoGuardar =
    obtenerCuerpoFuncion(pedido, "guardarPedido");
  const cuerpoAtender =
    obtenerCuerpoFuncion(pedido, "atenderPedido");
  const cuerpoEliminar =
    obtenerCuerpoFuncion(pedido, "eliminarPedido");
  const errores = [];

  if (!cuerpoGuardar.includes("try {") || !cuerpoGuardar.includes("finally")) {
    errores.push("guardarPedido debe liberar el bloqueo de guardado con try/finally");
  }

  if (!cuerpoGuardar.includes("guardandoPedidoEnCurso = false;")) {
    errores.push("guardarPedido debe resetear guardandoPedidoEnCurso al terminar");
  }

  if (!cuerpoAtender.includes("try {") || !cuerpoAtender.includes("finally")) {
    errores.push("atenderPedido debe limpiar operaciones en curso con try/finally");
  }

  if (!cuerpoAtender.includes("pedidosOperacionEnCurso.delete(claveOperacion)")) {
    errores.push("atenderPedido debe liberar la clave de operacion al terminar");
  }

  if (!cuerpoEliminar.includes('["ATENDIDO", "ENTREGADO"].includes(pedidoEliminado.estado)')) {
    errores.push("eliminarPedido debe bloquear pedidos atendidos o entregados");
  }

  if (!pedido.includes("function advertirSalidaConPedidoSinGuardar") ||
      !pedido.includes("event.returnValue") ||
      !app.includes('"beforeunload"') ||
      !app.includes("advertirSalidaConPedidoSinGuardar")) {
    errores.push("pedidos debe advertir antes de cerrar con un pedido sin guardar");
  }

  if (!html.includes("pedidoRapidoModal") ||
      !html.includes("pedidoRapidoCantidadInput") ||
      !html.includes("pedidoRapidoBonificacionInput") ||
      !pedido.includes("function iniciarCargaRapidaProducto") ||
      !pedido.includes("function confirmarCantidadCargaRapidaPedido") ||
      !pedido.includes("function agregarProductoCargaRapidaPedido") ||
      !pedido.includes("descuentoPorcentaje") ||
      !app.includes("confirmarCantidadCargaRapidaPedido") ||
      !app.includes("iniciarCargaRapidaProducto(productoSeleccionado)") ||
      !productos.includes("iniciarCargaRapidaProducto(producto)") ||
      !habituales.includes("iniciarCargaRapidaProducto(producto)")) {
    errores.push("pedidos debe tener carga rapida por producto con cantidad y bonificacion");
  }

  if (errores.length > 0) {
    throw new Error("Pedidos operativos incompletos: " + errores.join(" | "));
  }
}

function validarCuentaCorriente(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const errores = [];

  if (!html.includes('id="pagoImporteInput" type="number" min="0.01" step="0.01"')) {
    errores.push("pagoImporteInput debe permitir importes con centavos");
  }

  if (!clientes.includes("function buscarClienteParaCuenta")) {
    errores.push("cuenta corriente debe buscar clientes aunque esten inactivos");
  }

  if (!clientes.includes("return buscarClienteParaCuenta(dom.pagoClienteInput.value)")) {
    errores.push("pagos deben usar buscarClienteParaCuenta");
  }

  if (!clientes.includes("return buscarClienteParaCuenta(dom.notaCreditoClienteInput.value)")) {
    errores.push("notas de credito deben usar buscarClienteParaCuenta");
  }

  if (!clientes.includes('productoEsPeso(item.producto) ? "0.001" : "1"')) {
    errores.push("notas de credito deben permitir decimales solo en productos por peso");
  }

  if (!clientes.includes("itemsUnidadConDecimal")) {
    errores.push("notas de credito deben bloquear decimales para productos por unidad");
  }

  if (!clientes.includes("reactivarProductoSiCorrespondePorStock(producto)")) {
    errores.push("nota de credito con devolucion debe reactivar producto si vuelve a tener stock");
  }

  if (errores.length > 0) {
    throw new Error("Cuenta corriente incompleta: " + errores.join(" | "));
  }
}

function validarImpresionesAdministrativas(raizProyecto) {
  const helpersPath =
    path.join(raizProyecto, "js", "helpers.js");
  const impresionPath =
    path.join(raizProyecto, "js", "pedido", "impresion.js");
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const proveedoresPath =
    path.join(raizProyecto, "js", "proveedores.js");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const indexPath =
    path.join(raizProyecto, "index.html");
  const helpers =
    fs.readFileSync(helpersPath, "utf8");
  const impresion =
    fs.readFileSync(impresionPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const proveedores =
    fs.readFileSync(proveedoresPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const errores = [];

  if (!helpers.includes("function escaparTextoHtml")) {
    errores.push("helpers.js debe tener un escape HTML global para pantallas administrativas");
  }

  if (helpers.includes('button.innerHTML = "<strong>" + item.codigo')) {
    errores.push("resultados de busqueda no deben armar HTML con nombres de clientes/productos");
  }

  [
    "item.producto.nombre",
    "pedidoParaImprimir.cliente.nombre",
    "pedidoParaImprimir.cliente.direccion",
    "pieComprobante",
    "textoQrPago"
  ].forEach(function (textoEsperado) {
    if (!impresion.includes("escaparTextoHtml(" + textoEsperado)) {
      errores.push("impresion de pedidos debe escapar " + textoEsperado);
    }
  });

  if (!impresion.includes("CONFIG.impresionQrTexto || CONFIG.alias ||") ||
      !impresion.includes("<strong>Mercado Pago</strong>") ||
      !impresion.includes("Escanea y paga el total") ||
      !impresion.includes("obtenerQrComprobanteHtml(pedidoParaImprimir.total)") ||
      !impresion.includes("formatearDinero(totalPago)")) {
    errores.push("impresion de pedidos debe mostrar QR fijo de Mercado Pago con fallback al alias y total del comprobante");
  }

  [
    "cliente.nombre",
    "cliente.direccion || \"-\"",
    "pago.tipo || \"Pago recibido\"",
    "clienteEncontrado.nombre",
    "movimiento.tipo",
    "pedido.estado"
  ].forEach(function (textoEsperado) {
    if (!clientes.includes("escaparTextoHtml(" + textoEsperado)) {
      errores.push("cuenta corriente debe escapar " + textoEsperado);
    }
  });

  [
    "CONFIG.empresa || \"LV Sistema\"",
    "pago.proveedor",
    "pago.medio",
    "pago.comprobante || \"-\"",
    "pago.observacion || \"-\""
  ].forEach(function (textoEsperado) {
    if (!proveedores.includes("escaparTextoHtml(" + textoEsperado)) {
      errores.push("comprobante proveedor debe escapar " + textoEsperado);
    }
  });

  if (!html.includes('option value="OTRO"') ||
      !html.includes("proveedorPagoMedioOtroInput") ||
      !app.includes("proveedorPagoMedioOtroInput: document.querySelector") ||
      !proveedores.includes("function obtenerMedioPagoProveedorActual")) {
    errores.push("proveedores debe permitir cargar otro medio de pago desde el formulario");
  }

  if (!proveedores.includes("escaparTextoHtml(pago.medio)") ||
      !proveedores.includes("escaparTextoHtml(medioPago)")) {
    errores.push("proveedores debe escapar medio de pago personalizado");
  }

  if (errores.length > 0) {
    throw new Error("Impresiones administrativas inseguras: " + errores.join(" | "));
  }
}

function validarAuditoriaAdministracion(raizProyecto) {
  const auditoriaPath =
    path.join(raizProyecto, "js", "auditoria.js");
  const auditoria =
    fs.readFileSync(auditoriaPath, "utf8");
  const cuerpoLimpiar =
    obtenerCuerpoFuncion(auditoria, "limpiarAuditoria");
  const errores = [];

  if (!auditoria.includes("function escaparTextoAuditoria")) {
    errores.push("auditoria.js debe escapar texto antes de renderizar HTML");
  }

  if (!auditoria.includes("escaparTextoAuditoria(registro.detalle)")) {
    errores.push("renderizarAuditoria debe escapar el detalle");
  }

  if (!cuerpoLimpiar.includes('tienePermiso("auditoria")')) {
    errores.push("limpiarAuditoria debe validar permiso de auditoria");
  }

  if (errores.length > 0) {
    throw new Error("Auditoria administracion incompleta: " + errores.join(" | "));
  }
}

function validarImportarExportarRespaldo(raizProyecto) {
  const respaldoPath =
    path.join(raizProyecto, "js", "respaldo.js");
  const respaldo =
    fs.readFileSync(respaldoPath, "utf8");
  const cuerpoExportar =
    obtenerCuerpoFuncion(respaldo, "exportarRespaldoSistema");
  const cuerpoRestaurar =
    obtenerCuerpoFuncion(respaldo, "restaurarRespaldoSistema");
  const cuerpoValidar =
    obtenerCuerpoFuncion(respaldo, "obtenerResumenValidacionRespaldo");
  const errores = [];

  if (!cuerpoExportar.includes('tienePermiso("configuracion")')) {
    errores.push("exportarRespaldoSistema debe validar permiso de configuracion");
  }

  if (!cuerpoRestaurar.includes('tienePermiso("configuracion")')) {
    errores.push("restaurarRespaldoSistema debe validar permiso de configuracion");
  }

  [
    "clientes",
    "productos",
    "pedidos",
    "zonas",
    "rubros",
    "proveedores",
    "listasPrecios",
    "auditoria",
    "usuariosSistema"
  ].forEach(function (lista) {
    if (!cuerpoValidar.includes('"' + lista + '"')) {
      errores.push("validacion de respaldo debe exigir " + lista);
    }
  });

  if (!cuerpoValidar.includes("respaldo.datos.configuracion") || !cuerpoValidar.includes("respaldo.datos.roles")) {
    errores.push("validacion de respaldo debe exigir configuracion y roles");
  }

  if (errores.length > 0) {
    throw new Error("Importar/exportar respaldo incompleto: " + errores.join(" | "));
  }
}

function validarSqlSupabaseIdempotente(raizProyecto) {
  const archivosSql = [
    path.join(raizProyecto, "supabase", "sql", "rls-basico.sql"),
    path.join(raizProyecto, "supabase", "sql", "rls-por-roles.sql")
  ];
  const errores = [];

  archivosSql.forEach(function (archivoSql) {
    const sql =
      fs.readFileSync(archivoSql, "utf8");
    const politicasCreadas =
      [...sql.matchAll(/create policy "([^"]+)"/g)].map(function (match) {
        return match[1];
      });

    politicasCreadas.forEach(function (nombrePolitica) {
      if (!sql.includes('drop policy if exists "' + nombrePolitica + '"')) {
        errores.push(path.basename(archivoSql) + " sin drop policy para: " + nombrePolitica);
      }
    });
  });

  if (errores.length > 0) {
    throw new Error("SQL Supabase no idempotente: " + errores.join(" | "));
  }
}

function validarAccesosPublicosYMoviles(raizProyecto) {
  const catalogoPath =
    path.join(raizProyecto, "js", "public", "catalogo-whatsapp.js");
  const vendedoresPath =
    path.join(raizProyecto, "js", "mobile", "vendedores-mobile.js");
  const catalogo =
    fs.readFileSync(catalogoPath, "utf8");
  const vendedores =
    fs.readFileSync(vendedoresPath, "utf8");
  const errores = [];

  if (!catalogo.includes("function escaparTextoCatalogo")) {
    errores.push("catalogo-whatsapp.js debe tener helper de escape para textos publicos");
  }

  if (!catalogo.includes("createElement(\"span\")") || !catalogo.includes("precioProducto.textContent")) {
    errores.push("catalogo-whatsapp.js debe renderizar rubro/precio con nodos seguros");
  }

  if (!vendedores.includes("function escaparTextoVendedor")) {
    errores.push("vendedores-mobile.js debe escapar textos antes de usar innerHTML");
  }

  if (!vendedores.includes("escaparTextoVendedor(cliente.nombre)") ||
      !vendedores.includes("escaparTextoVendedor(producto.nombre)")) {
    errores.push("vendedores-mobile.js debe escapar nombres de clientes y productos");
  }

  if (!catalogo.includes("obtenerProductosCatalogoPublicoSupabase")) {
    errores.push("catalogo-whatsapp.js debe usar la funcion publica segura de Supabase");
  }

  if (!catalogo.includes("establecerCantidadCarrito") ||
      !catalogo.includes("normalizarCantidadCatalogo") ||
      !catalogo.includes("formatearCantidadCatalogo")) {
    errores.push("catalogo-whatsapp.js debe permitir cantidades editables y seguras");
  }

  if (!vendedores.includes("clienteAsignadoAlVendedorActual")) {
    errores.push("vendedores-mobile.js debe filtrar clientes asignados al vendedor");
  }

  if (!vendedores.includes("guardarPedidoMovilEnSupabase") ||
      !vendedores.includes("crearPedidoMovilParaSupabase") ||
      !vendedores.includes("guardarPedidoSupabase") ||
      !vendedores.includes("establecerCantidadPedidoVendedor") ||
      !vendedores.includes("normalizarCantidadVendedor")) {
    errores.push("vendedores-mobile.js debe guardar pedidos online y permitir cantidad editable");
  }

  if (errores.length > 0) {
    throw new Error("Accesos publicos/moviles incompletos: " + errores.join(" | "));
  }
}

const archivosJavascript = listarJavascript(jsPath);
const archivosHtml = listarHtml(raiz);

validarSintaxisJavascript(archivosJavascript);

archivosHtml.forEach(function (archivoHtml) {
  const html =
    fs.readFileSync(archivoHtml, "utf8");
  const resumen =
    crearResumenReferencias(html, archivosJavascript);

  fallarSiHayErrores(resumen);
});

validarGuardasDePermisos(raiz);
validarColumnasSupabase(raiz);
validarDatosIniciales(raiz);
validarPoliticasRlsProduccion(raiz);
validarRetornosCriticos(raiz);
validarEstilosSeparados(raiz);
validarSincronizacionMultiEquipo(raiz);
validarCatalogoPublicoProduccion(raiz);
validarVendedoresMobileProduccion(raiz);
validarImportacionesRobustas(raiz);
validarBusquedaStockYCompras(raiz);
validarDashboardAdministrativo(raiz);
validarRestablecimientoDatos(raiz);
validarClientesAdministracion(raiz);
validarDatosBaseAdministracion(raiz);
validarProveedoresAdministracion(raiz);
validarPedidosOperativos(raiz);
validarCuentaCorriente(raiz);
validarImpresionesAdministrativas(raiz);
validarAuditoriaAdministracion(raiz);
validarImportarExportarRespaldo(raiz);
validarSqlSupabaseIdempotente(raiz);
validarAccesosPublicosYMoviles(raiz);

console.log("Sistema verificado OK");
console.log("HTML revisados: " + archivosHtml.length);
console.log("JS revisados: " + archivosJavascript.length);
