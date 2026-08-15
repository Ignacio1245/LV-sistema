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
    ["js/app.js", "guardarUsuarioMovilDeVendedor"],
    ["js/app.js", "guardarVendedorDesdeFormulario"],
    ["js/app.js", "editarVendedor"],
    ["js/app.js", "alternarEstadoVendedor"],
    ["js/app.js", "eliminarVendedor"],
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

function validarLoginConUsuarioOEmail(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const loginPath =
    path.join(raizProyecto, "js", "config", "login.js");
  const indexHtml =
    fs.readFileSync(indexPath, "utf8");
  const login =
    fs.readFileSync(loginPath, "utf8");
  const errores = [];

  if (!indexHtml.includes('id="loginUserInput" type="text"')) {
    errores.push("login principal debe aceptar usuario o email sin bloqueo del navegador");
  }

  if (!login.includes("function obtenerEmailInternoLoginSistema") ||
      !login.includes("obtenerEmailInternoUsuarioSistema(usuarioOEmail)") ||
      !login.includes("Ingrese un usuario o email valido.")) {
    errores.push("login principal debe convertir usuario simple a email interno");
  }

  if (!login.includes('usuarioNormalizado === "admin"') ||
      !login.includes("Acceso inicial local: admin o ")) {
    errores.push("login inicial debe aceptar admin/admin123 ademas de admin@local/admin123");
  }

  if (errores.length > 0) {
    throw new Error("Login con usuario o email incompleto: " + errores.join(" | "));
  }
}

function validarAccesosSupabaseConfirmados(raizProyecto) {
  const authPath =
    path.join(raizProyecto, "js", "supabase-auth.js");
  const usuariosPath =
    path.join(raizProyecto, "js", "config", "usuarios.js");
  const funcionCrearPath =
    path.join(raizProyecto, "supabase", "functions", "crear-usuario-sistema", "index.ts");
  const auth =
    fs.readFileSync(authPath, "utf8");
  const usuarios =
    fs.readFileSync(usuariosPath, "utf8");
  const funcionCrear =
    fs.readFileSync(funcionCrearPath, "utf8");
  const cuerpoEditarUsuario =
    obtenerCuerpoFuncion(usuarios, "guardarEdicionUsuarioSistema");
  const errores = [];

  if (!funcionCrear.includes("auth.admin.updateUserById") ||
      !funcionCrear.includes("claveActualizada") ||
      !funcionCrear.includes("email_confirm: true")) {
    errores.push("funcion crear-usuario-sistema debe confirmar email y actualizar clave si el acceso ya existe");
  }

  if (auth.includes(".auth.signUp(")) {
    errores.push("frontend no debe crear accesos con signUp porque pueden quedar sin confirmar");
  }

  if (!auth.includes("Sin esa funcion el acceso puede quedar sin confirmar")) {
    errores.push("frontend debe avisar claramente si falta la funcion segura de usuarios");
  }

  if (!cuerpoEditarUsuario.includes("if (password)") ||
      !cuerpoEditarUsuario.includes("await crearAccesoUsuarioSupabase(email, password)")) {
    errores.push("editar usuario debe actualizar clave de Supabase cuando se ingresa una nueva clave");
  }

  if (errores.length > 0) {
    throw new Error("Accesos Supabase inseguros: " + errores.join(" | "));
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
    ["clientes escritura ventas", /function public\.usuario_puede_escribir_cliente[\s\S]*usuario_tiene_permiso\('ventas'\)[\s\S]*texto_corresponde_usuario_vendedor/],
    ["match vendedor no acepta vacios", /function public\.texto_corresponde_usuario_vendedor[\s\S]*length\(trim\(coalesce\(valor, ''\)\)\) > 0/],
    ["clientes lectura restringida vendedor", /clientes lectura permiso[\s\S]*usuario_puede_acceder_cliente\(vendedor_asignado\)/],
    ["vendedores lectura restringida vendedor", /vendedores lectura usuario activo[\s\S]*usuario_puede_acceder_vendedor\(nombre, email\)/],
    ["pagos cliente escritura restringida vendedor", /pagos cliente escritura permiso[\s\S]*usuario_puede_acceder_pago_cliente\(cliente_id\)/],
    ["pedidos escritura restringida vendedor", /pedidos escritura ventas[\s\S]*usuario_puede_escribir_pedido\(vendedor, cliente_id\)/],
    ["pedido items escritura por pedido permitido", /pedido items escritura ventas[\s\S]*usuario_puede_escribir_pedido\(pedidos\.vendedor, pedidos\.cliente_id\)/],
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
  const mappersPath =
    path.join(raizProyecto, "js", "database", "supabase-mappers.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const supabaseData =
    fs.readFileSync(supabaseDataPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const mappers =
    fs.readFileSync(mappersPath, "utf8");
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

  if (!app.includes("function actualizarDatosOnlineAlVolverAlSistema") ||
      !app.includes("document.hidden") ||
      !app.includes('"visibilitychange"') ||
      !app.includes('"focus"') ||
      !app.includes("actualizarDatosOnlineAlVolverAlSistema")) {
    errores.push("app.js debe refrescar datos online al volver a la pestana del sistema");
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

  if (!supabaseData.includes("function marcarOperacionSupabasePendiente") ||
      !supabaseData.includes("function informarOperacionSinSesionSupabase") ||
      !supabaseData.includes('informarOperacionSinSesionSupabase("clientes")') ||
      !supabaseData.includes('informarOperacionSinSesionSupabase("productos")') ||
      !supabaseData.includes('informarOperacionSinSesionSupabase("pedidos")') ||
      !supabaseData.includes('marcarOperacionSupabasePendiente(\n      "clientes"') ||
      !supabaseData.includes('marcarOperacionSupabasePendiente(\n      "productos"') ||
      !supabaseData.includes('marcarOperacionSupabasePendiente(\n      "pedidos"')) {
    errores.push("operaciones criticas deben quedar pendientes si Supabase falla o no hay sesion");
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
    "compras = comprasSupabase;"
  ].forEach(function (textoEsperado) {
    if (!supabaseData.includes(textoEsperado)) {
      errores.push("carga Supabase debe reemplazar local aunque venga vacio: " + textoEsperado);
    }
  });

  if (!supabaseData.includes('auditoria: "auditoria"') ||
      !supabaseData.includes('if (tipo === "auditoria")') ||
      !supabaseData.includes("function sincronizarAuditoriaLocalConSupabase") ||
      !supabaseData.includes('marcarSincronizacionPendiente("auditoria")')) {
    errores.push("auditoria debe quedar como pendiente y reintentarse si Supabase no la guarda");
  }

  if (!supabaseData.includes("auditoriaLocalPendiente") ||
      !supabaseData.includes(".concat(auditoriaLocalPendiente)") ||
      !supabaseData.includes("function obtenerFechaOrdenAuditoria") ||
      supabaseData.includes("auditoria = auditoriaSupabase;")) {
    errores.push("carga de auditoria Supabase debe conservar registros locales pendientes");
  }

  if (!mappers.includes("fechaIso: fecha.toISOString()")) {
    errores.push("mapper de auditoria debe conservar fechaIso para ordenar y preservar pendientes");
  }

  if (errores.length > 0) {
    throw new Error("Sincronizacion multi-equipo incompleta: " + errores.join(" | "));
  }
}

function validarCatalogoPublicoProduccion(raizProyecto) {
  const sqlPath =
    path.join(raizProyecto, "supabase", "sql", "catalogo-publico.sql");
  const repositorioPath =
    path.join(raizProyecto, "js", "database", "supabase-repository.js");
  const mappersPath =
    path.join(raizProyecto, "js", "database", "supabase-mappers.js");
  const catalogoPath =
    path.join(raizProyecto, "js", "public", "catalogo-whatsapp.js");

  const sql =
    fs.readFileSync(sqlPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const mappers =
    fs.readFileSync(mappersPath, "utf8");
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
  const mappersPath =
    path.join(raizProyecto, "js", "database", "supabase-mappers.js");
  const vendedores =
    fs.readFileSync(vendedoresPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const mappers =
    fs.readFileSync(mappersPath, "utf8");
  const errores = [];

  if (!vendedores.includes("iniciarSesionSupabase")) {
    errores.push("vendedores-mobile.js debe iniciar sesion con Supabase Auth");
  }

  if (!vendedores.includes("clienteAsignadoAlVendedorActual")) {
    errores.push("vendedores-mobile.js debe filtrar clientes asignados al vendedor");
  }

  if (!vendedores.includes("insertarClienteNuevoSupabase") ||
      !vendedores.includes("obtenerMayorCodigoClienteSupabase() + 1") ||
      !vendedores.includes("refrescarDatosVendedorManteniendoCliente")) {
    errores.push("vendedores-mobile.js debe crear clientes online, reintentar codigos y refrescar desde Supabase");
  }

  if (!vendedores.includes('String(marcaTiempo) + String(sufijoAleatorio).padStart(3, "0")') ||
      !vendedores.includes("Supabase no confirmo la cobranza")) {
    errores.push("cobranzas moviles deben usar codigo unico y exigir confirmacion Supabase");
  }

  if (!vendedores.includes("CLAVE_BORRADOR_PEDIDO_VENDEDOR") ||
      !vendedores.includes("function guardarBorradorPedidoVendedor") ||
      !vendedores.includes("function restaurarBorradorPedidoVendedor") ||
      !vendedores.includes("function limpiarBorradorPedidoVendedor") ||
      !vendedores.includes("Borrador de pedido recuperado") ||
      !vendedores.includes('vendedorDom.observacion.addEventListener("input", guardarBorradorPedidoVendedor)')) {
    errores.push("vendedores-mobile.js debe guardar y restaurar borradores de pedido locales");
  }

  if (!vendedores.includes("CLAVE_BORRADOR_CLIENTE_VENDEDOR") ||
      !vendedores.includes("function guardarBorradorClienteVendedor") ||
      !vendedores.includes("function restaurarBorradorClienteVendedor") ||
      !vendedores.includes("Borrador de cliente recuperado") ||
      !vendedores.includes('controlNuevoCliente.addEventListener("input", guardarBorradorClienteVendedor)')) {
    errores.push("vendedores-mobile.js debe guardar borradores de alta rapida de clientes");
  }

  if (!vendedores.includes("function buscarClienteSimilarNuevoClienteVendedor") ||
      !vendedores.includes("function confirmarAltaClienteSimilarVendedor") ||
      !vendedores.includes("Alta cancelada. Usa el cliente existente") ||
      !vendedores.includes("obtenerTelefonoComparableClienteVendedor")) {
    errores.push("vendedores-mobile.js debe advertir duplicados antes de crear clientes desde celular");
  }

  if (!repositorio.includes("obtenerUsuarioSistemaPorEmailSupabase")) {
    errores.push("supabase-repository.js debe poder leer el usuario actual por email");
  }

  if (errores.length > 0) {
    throw new Error("Vendedores mobile inseguro o incompleto: " + errores.join(" | "));
  }
}

function validarRolesYPermisosAdministracion(raizProyecto) {
  const usuariosPath =
    path.join(raizProyecto, "js", "config", "usuarios.js");
  const usuarios =
    fs.readFileSync(usuariosPath, "utf8");
  const errores = [];

  if (!usuarios.includes("function obtenerRolValidoUsuarioSistema") ||
      !usuarios.includes("rol: obtenerRolValidoUsuarioSistema(usuario.rol)")) {
    errores.push("usuarios.js debe normalizar roles antes de aplicar permisos");
  }

  if (!usuarios.includes("rolEsSuperadmin(usuario.rol)") ||
      !usuarios.includes("rolEsSuperadmin(rol)")) {
    errores.push("usuarios.js debe proteger SUPERADMIN con comparacion normalizada");
  }

  if (!usuarios.includes("const rolActualNormalizado") ||
      !usuarios.includes("rolEsSuperadmin(rolActualNormalizado)")) {
    errores.push("tienePermiso debe permitir todo a SUPERADMIN normalizado");
  }

  if (errores.length > 0) {
    throw new Error("Roles/permisos administrativos fragiles: " + errores.join(" | "));
  }
}
function validarImportacionesRobustas(raizProyecto) {
  const productosAdminPath =
    path.join(raizProyecto, "js", "productos-admin.js");
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const helpersPath =
    path.join(raizProyecto, "js", "helpers.js");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const indexPath =
    path.join(raizProyecto, "index.html");
  const productosAdmin =
    fs.readFileSync(productosAdminPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const helpers =
    fs.readFileSync(helpersPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const html =
    fs.readFileSync(indexPath, "utf8");
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
      !productosAdmin.includes("sincronizarImportacionProductosAhora") ||
      !productosAdmin.includes("marcarImportacionProductosPendiente") ||
      !productosAdmin.includes("await sincronizarImportacionProductosAhora")) {
    errores.push("importacion de productos debe guardar, marcar pendientes y subir a Supabase al terminar");
  }

  if (!clientes.includes("guardarZonas();") ||
      !clientes.includes('programarSincronizacionAutomatica("datosBase")')) {
    errores.push("importacion de clientes debe guardar y sincronizar zonas creadas");
  }

  if (!clientes.includes('"id", "codigo"') ||
      !clientes.includes('"nombrefantasia"') ||
      !clientes.includes('"direccin"')) {
    errores.push("importacion de clientes debe reconocer CSV ID; Nombre Fantasia; Direccion; Tel; Lista; Zona");
  }

  if (!html.includes("clientesImportacionPreview") ||
      !html.includes("productosImportacionPreview") ||
      !app.includes("clientesImportacionPreview") ||
      !app.includes("productosImportacionPreview") ||
      !clientes.includes("function analizarImportacionClientes") ||
      !productosAdmin.includes("function analizarImportacionProductos")) {
    errores.push("importaciones deben tener previsualizacion antes de aplicar");
  }

  if (!helpers.includes("function generarRespaldoAutomaticoAntesDeOperacion") ||
      !clientes.includes('generarRespaldoAutomaticoAntesDeOperacion("importacion-clientes")') ||
      !productosAdmin.includes('generarRespaldoAutomaticoAntesDeOperacion("importacion-productos")')) {
    errores.push("importaciones deben generar respaldo automatico antes de aplicar cambios");
  }

  if (!productosAdmin.includes("function obtenerIndiceColumnaImportacion") ||
      !productosAdmin.includes("return mapa[nombre] >= 0 ? mapa[nombre] : -1;") ||
      !clientes.includes("function obtenerIndiceClienteImportacion") ||
      !clientes.includes("return mapa[nombre] >= 0 ? mapa[nombre] : -1;")) {
    errores.push("CSV con encabezado no debe usar fallback posicional para columnas faltantes");
  }

  if (!clientes.includes("telefonoTexto || (clienteExistente ? clienteExistente.telefono") ||
      !clientes.includes("zonaTexto !== \"\"") ||
      !clientes.includes("Object.keys(datosComerciales)") ||
      !productosAdmin.includes("rubroTexto !== \"\"") ||
      !productosAdmin.includes("proveedorTexto !== \"\"")) {
    errores.push("importacion debe preservar campos existentes cuando el CSV no trae la columna");
  }

  if (!clientes.includes("codigosDuplicados") ||
      !productosAdmin.includes("codigosDuplicados") ||
      !clientes.includes("La importacion queda bloqueada") ||
      !productosAdmin.includes("La importacion queda bloqueada")) {
    errores.push("importaciones deben bloquear codigos duplicados dentro del CSV");
  }

  if (!productosAdmin.includes('generarRespaldoAutomaticoAntesDeOperacion("importacion-precios")') ||
      !productosAdmin.includes('generarRespaldoAutomaticoAntesDeOperacion("actualizacion-masiva-precios")') ||
      !productosAdmin.includes('generarRespaldoAutomaticoAntesDeOperacion("correccion-temporal-productos")')) {
    errores.push("importaciones y actualizaciones masivas de precios deben generar respaldo automatico");
  }

  if (!productosAdmin.includes("async function aplicarActualizacionMasivaPrecios") ||
      !productosAdmin.includes("await sincronizarImportacionProductosAhora") ||
      productosAdmin.includes("No se subio nada a Supabase")) {
    errores.push("precios masivos e importados deben marcar pendiente y sincronizar con Supabase");
  }

  if (!html.includes('value="revision_precios"') ||
      !html.includes('data-quick-action="revision-precios"') ||
      !productosAdmin.includes("function obtenerProblemasPrecioProducto") ||
      !productosAdmin.includes("function productoTienePreciosARevisar") ||
      !productosAdmin.includes('vistaProductosActual !== "revision_precios"') ||
      !app.includes('"revision-precios": "productos"') ||
      !app.includes("lista inexistente") ||
      !app.includes("obtenerProblemasPrecioProducto(producto)")) {
    errores.push("dashboard/productos debe detectar listas y precios incompletos despues de importaciones");
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

  if (!html.includes("dashboardEstadoArranquePanel") ||
      !html.includes("dashboardEstadoArranqueLista")) {
    errores.push("Inicio debe tener semaforo de estado de arranque");
  }

  if (!estilos.includes(".dashboard-start-panel") || estilos.includes(".dashboard-control-card:nth-child(3)")) {
    errores.push("panel principal debe mostrar arranque rapido y no ocultar datos incompletos");
  }

  if (!app.includes("dashboardDatosIncompletosLista: document.querySelector")) {
    errores.push("app.js debe registrar dashboardDatosIncompletosLista en dom");
  }

  if (!app.includes("dashboardEstadoArranquePanel: document.querySelector") ||
      !app.includes("dashboardEstadoArranqueLista: document.querySelector")) {
    errores.push("app.js debe registrar controles del semaforo de arranque");
  }

  if (!app.includes("function obtenerDatosIncompletosParaDashboard")) {
    errores.push("dashboard debe calcular datos incompletos");
  }

  if (!app.includes("function obtenerPosiblesDuplicadosClientesDashboard") ||
      !app.includes("function obtenerClaveClienteDuplicadoDashboard") ||
      !app.includes("datosIncompletos.push(...obtenerPosiblesDuplicadosClientesDashboard())") ||
      !app.includes("Posible duplicado")) {
    errores.push("dashboard debe detectar posibles clientes duplicados por telefono o direccion");
  }

  if (!app.includes("function obtenerRevisionesArranqueSistema") ||
      !app.includes("function renderizarEstadoArranqueSistema") ||
      !app.includes("function obtenerResumenArranqueSistema") ||
      !app.includes("haySincronizacionPendiente") ||
      !app.includes("obtenerCantidadUsuariosVendedoresActivos") ||
      !app.includes("renderizarEstadoArranqueSistema(datosIncompletos, productosCriticos)")) {
    errores.push("dashboard debe tener semaforo de arranque para operar con datos reales");
  }

  if (!estilos.includes(".dashboard-readiness-panel") ||
      !estilos.includes(".dashboard-readiness-panel.estado-critico") ||
      !estilos.includes(".dashboard-readiness-row")) {
    errores.push("dashboard debe tener estilos para el semaforo de arranque");
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
  const productosAdminPath =
    path.join(raizProyecto, "js", "productos-admin.js");
  const comprasPath =
    path.join(raizProyecto, "js", "compras.js");
  const habitualesPath =
    path.join(raizProyecto, "js", "pedido", "habituales.js");
  const observacionesPath =
    path.join(raizProyecto, "js", "pedido", "observaciones.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const pedido =
    fs.readFileSync(pedidoPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const productos =
    fs.readFileSync(productosPath, "utf8");
  const productosAdmin =
    fs.readFileSync(productosAdminPath, "utf8");
  const compras =
    fs.readFileSync(comprasPath, "utf8");
  const habituales =
    fs.readFileSync(habitualesPath, "utf8");
  const observaciones =
    fs.readFileSync(observacionesPath, "utf8");
  const cuerpoGuardar =
    obtenerCuerpoFuncion(pedido, "guardarPedido");
  const cuerpoAtender =
    obtenerCuerpoFuncion(pedido, "atenderPedido");
  const cuerpoStockVendible =
    obtenerCuerpoFuncion(productos, "obtenerStockVendible");
  const cuerpoConfirmarEntrega =
    obtenerCuerpoFuncion(pedido, "confirmarEntregaPedido");
  const cuerpoEliminar =
    obtenerCuerpoFuncion(pedido, "eliminarPedido");
  const cuerpoDuplicar =
    obtenerCuerpoFuncion(pedido, "duplicarPedidoGuardado");
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

  if (!cuerpoConfirmarEntrega.includes('"entregar:"') ||
      !cuerpoConfirmarEntrega.includes("pedidosOperacionEnCurso.has(claveOperacion)") ||
      !cuerpoConfirmarEntrega.includes("pedidosOperacionEnCurso.delete(claveOperacion)")) {
    errores.push("confirmarEntregaPedido debe bloquear doble confirmacion de entrega");
  }

  [
    '"cobrar:" + pedido.id',
    '"cuentaCorriente:" + pedido.id',
    '"cancelar:" + pedido.id'
  ].forEach(function (textoEsperado) {
    if (!pedido.includes(textoEsperado)) {
      errores.push("pedidos debe bloquear doble accion para " + textoEsperado);
    }
  });

  if (!cuerpoEliminar.includes('["ATENDIDO", "ENTREGADO"].includes(pedidoEliminado.estado)')) {
    errores.push("eliminarPedido debe bloquear pedidos atendidos o entregados");
  }

  if (!pedido.includes("function duplicarPedidoGuardado") ||
      !pedido.includes("duplicarPedidoGuardado(${pedido.id})") ||
      !pedido.includes("Duplicar pedido") ||
      !cuerpoDuplicar.includes('tienePermiso("ventas")') ||
      !cuerpoDuplicar.includes("obtenerStockDisponibleProducto(producto, null)") ||
      !cuerpoDuplicar.includes("validarCantidadPedidoProducto(producto, cantidadDuplicada)") ||
      !cuerpoDuplicar.includes("pedidoEditando = null") ||
      !cuerpoDuplicar.includes('"Preparo duplicado pedido"')) {
    errores.push("pedidos debe permitir duplicar/repetir ventas usando permisos, stock actual y auditoria");
  }

  if (!pedido.includes("function obtenerFirmaPedidoCliente") ||
      !pedido.includes("function buscarPedidoDuplicadoExacto") ||
      !pedido.includes("function confirmarPedidoDuplicadoExacto") ||
      !pedido.includes("permiteDuplicadoExacto") ||
      !pedido.includes("Confirmo pedido duplicado") ||
      !pedido.includes("firmaControlDuplicado") ||
      !pedido.includes("Mismo cliente, mismos productos, cantidades, descuentos y forma de pago")) {
    errores.push("pedidos debe advertir antes de crear duplicados exactos del mismo dia");
  }

  if (!pedido.includes("function escaparTextoPedido") ||
      !pedido.includes("function obtenerHistorialAuditoriaPedido") ||
      !pedido.includes("function auditoriaCorrespondeAPedido") ||
      !pedido.includes("Historial de cambios") ||
      !pedido.includes("escaparTextoPedido(clientePedidoTexto)") ||
      !pedido.includes("escaparTextoPedido(item.producto.nombre)") ||
      !pedido.includes("escaparTextoPedido(registroAuditoria.detalle") ||
      !pedido.includes("observacionesSeguras")) {
    errores.push("pedidos debe escapar textos cargados por usuarios y mostrar historial visible desde auditoria");
  }

  if (!pedido.includes("function advertirSalidaConPedidoSinGuardar") ||
      !pedido.includes("event.returnValue") ||
      !app.includes('"beforeunload"') ||
      !app.includes("advertirSalidaConPedidoSinGuardar")) {
    errores.push("pedidos debe advertir antes de cerrar con un pedido sin guardar");
  }

  if (!pedido.includes("function hayCambiosPendientesAntesDeSalir") ||
      !pedido.includes("haySincronizacionPendiente") ||
      !pedido.includes("guardandoPedidoEnCurso") ||
      !pedido.includes("pedidosOperacionEnCurso.size > 0")) {
    errores.push("pedidos debe advertir tambien por sincronizacion u operaciones en curso");
  }

  if (!pedido.includes("const CLAVE_PEDIDO_ACTUAL_LOCAL") ||
      !pedido.includes("pedidoActualLocalInicializado") ||
      !pedido.includes("function guardarPedidoActualLocal") ||
      !pedido.includes("function restaurarPedidoActualLocalSiCorresponde") ||
      !pedido.includes("pedidoActualLocalEstaVencido") ||
      !pedido.includes("localStorage.setItem(") ||
      !pedido.includes("guardarPedidoActualLocal();") ||
      !app.includes("restaurarPedidoActualLocalSiCorresponde") ||
      !app.includes("limpiarPedidoActualLocal();")) {
    errores.push("pedidos debe guardar/restaurar borradores locales y limpiarlos al restablecer datos");
  }

  if (!observaciones.includes("function escaparTextoObservacionPedido") ||
      !observaciones.includes("function guardarObservacionesPedidoActualLocalSiExiste") ||
      !observaciones.includes("guardarPedidoActualLocal") ||
      !observaciones.includes("escaparTextoObservacionPedido(observacion)")) {
    errores.push("observaciones de pedidos deben escapar texto y activar autosave local");
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

  if (!productos.includes("function obtenerStockReservadoProducto(producto, pedidoIgnoradoId)") ||
      !productos.includes('pedido.estado !== "PENDIENTE"') ||
      !productos.includes("function obtenerStockDisponibleProducto(producto, pedidoIgnoradoId)") ||
      !cuerpoStockVendible.includes("return obtenerStockDisponibleProducto(producto, pedidoIgnoradoId);")) {
    errores.push("stock debe descontar pedidos pendientes para evitar sobreventa simultanea");
  }

  if (!pedido.includes("obtenerStockDisponibleProducto(producto, pedidoEditando ? pedidoEditando.id : null)") ||
      !pedido.includes("obtenerStockDisponibleProducto(producto, pedido.id)")) {
    errores.push("pedidos debe validar stock disponible reservado antes de agregar o atender");
  }

  if (!productos.includes("function registrarMovimientoStockProducto(producto, datosMovimiento)") ||
      !productos.includes("usuarioCodigo: usuarioMovimiento.codigo") ||
      !productos.includes("stockAnterior: stockAnterior") ||
      !productos.includes("stockFinal: stockFinal") ||
      !productos.includes("fechaIso: datos.fechaIso || ahora.toISOString()")) {
    errores.push("movimientos de stock deben guardar trazabilidad con usuario, fecha y stock anterior/final");
  }

  [pedido, productos, productosAdmin, compras].forEach(function (contenido, indiceArchivo) {
    if (!contenido.includes("registrarMovimientoStockProducto(producto")) {
      errores.push("archivo de stock " + indiceArchivo + " debe registrar movimientos con el helper central");
    }
  });

  if (errores.length > 0) {
    throw new Error("Pedidos operativos incompletos: " + errores.join(" | "));
  }
}

function validarCuentaCorriente(raizProyecto) {
  const indexPath =
    path.join(raizProyecto, "index.html");
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const pedidoPath =
    path.join(raizProyecto, "js", "pedido.js");
  const html =
    fs.readFileSync(indexPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const pedido =
    fs.readFileSync(pedidoPath, "utf8");
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

  if (!clientes.includes("escaparTextoHtml(textoProducto)")) {
    errores.push("notas de credito deben escapar el producto antes de renderizar");
  }

  if (!clientes.includes("const operacionesCuentaCorrienteEnCurso = new Set()") ||
      !clientes.includes("function iniciarOperacionCuentaCorriente") ||
      !clientes.includes('"pago:" + cliente.codigo') ||
      !clientes.includes('"notaCredito:" + cliente.codigo')) {
    errores.push("cuenta corriente debe bloquear pagos y notas de credito duplicadas en curso");
  }

  if (!clientes.includes("function importacionClienteTieneDato") ||
      !clientes.includes("if (saldoImportadoInformado) {") ||
      !clientes.includes("clienteExistente.saldo = saldoInicial") ||
      !clientes.includes("historial: saldoImportadoInformado ? crearHistorialSaldoInicialCliente(saldoInicial) : []")) {
    errores.push("importacion de clientes no debe pisar saldos si el CSV no trae saldo informado");
  }

  if (!clientes.includes("function crearMovimientoCuentaCliente") ||
      !clientes.includes("usuarioCodigo: usuarioMovimiento.codigo") ||
      !clientes.includes("saldoAnterior: saldoAnterior") ||
      !clientes.includes("saldoPosterior: saldoPosterior") ||
      !clientes.includes("fechaIso: datos.fechaIso || ahora.toISOString()")) {
    errores.push("movimientos de cuenta corriente deben guardar usuario, fecha y saldo anterior/posterior");
  }

  if (!pedido.includes("crearMovimientoCuentaCliente({") ||
      !pedido.includes("motivo: \"Pedido pasado a cuenta corriente\"") ||
      !pedido.includes("motivo: \"Saldo pendiente de pedido entregado\"")) {
    errores.push("pedidos debe registrar deudas en cuenta corriente con movimiento trazable");
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
    "descuentoTexto",
    "pedidoParaImprimir.cliente.nombre",
    "pedidoParaImprimir.cliente.direccion",
    "pedidoParaImprimir.vendedor || \"Sin vendedor\"",
    "pedidoParaImprimir.estadoCobro || \"-\"",
    "pieComprobante",
    "textoQrPago",
    "urlCatalogoPublico"
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

  if (!impresion.includes("function obtenerUrlCatalogoPublico") ||
      !impresion.includes("function obtenerQrCatalogoPublicoHtml") ||
      !impresion.includes('new URL("/catalogo", origen)') ||
      !impresion.includes("obtenerQrCatalogoPublicoHtml()") ||
      !impresion.includes("pedidoParaImprimir.vendedor") ||
      !impresion.includes("pedidoParaImprimir.estadoCobro") ||
      impresion.includes('searchParams.set("cliente"')) {
    errores.push("impresion de pedidos debe incluir vendedor, estado de cobro y QR generico de catalogo sin exponer codigo de cliente");
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
  const clientesPath =
    path.join(raizProyecto, "js", "clientes.js");
  const pedidoPath =
    path.join(raizProyecto, "js", "pedido.js");
  const productosAdminPath =
    path.join(raizProyecto, "js", "productos-admin.js");
  const informesPath =
    path.join(raizProyecto, "js", "informes.js");
  const auditoria =
    fs.readFileSync(auditoriaPath, "utf8");
  const clientes =
    fs.readFileSync(clientesPath, "utf8");
  const pedido =
    fs.readFileSync(pedidoPath, "utf8");
  const productosAdmin =
    fs.readFileSync(productosAdminPath, "utf8");
  const informes =
    fs.readFileSync(informesPath, "utf8");
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

  if (!cuerpoLimpiar.includes('registrarAuditoria(') ||
      !cuerpoLimpiar.includes('"Limpio registro"')) {
    errores.push("limpiarAuditoria debe dejar registro nuevo despues de limpiar");
  }

  [
    [auditoria, "Exporto auditoria CSV"],
    [clientes, "Exporto clientes CSV"],
    [clientes, "Exporto saldos CSV"],
    [pedido, "Exporto pedidos CSV"],
    [productosAdmin, "Exporto lista precios CSV"],
    [informes, "Exporto informe CSV"]
  ].forEach(function (regla) {
    if (!regla[0].includes(regla[1])) {
      errores.push("exportacion sensible sin auditoria: " + regla[1]);
    }
  });

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

function validarProteccionContraPerdidaDatos(raizProyecto) {
  const repositorioPath =
    path.join(raizProyecto, "js", "database", "supabase-repository.js");
  const mappersPath =
    path.join(raizProyecto, "js", "database", "supabase-mappers.js");
  const appPath =
    path.join(raizProyecto, "js", "app.js");
  const respaldoPath =
    path.join(raizProyecto, "js", "respaldo.js");
  const limpiarUsuariosPath =
    path.join(raizProyecto, "supabase", "sql", "limpiar-usuarios-duplicados.sql");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const mappers =
    fs.readFileSync(mappersPath, "utf8");
  const app =
    fs.readFileSync(appPath, "utf8");
  const respaldo =
    fs.readFileSync(respaldoPath, "utf8");
  const limpiarUsuarios =
    fs.readFileSync(limpiarUsuariosPath, "utf8");
  const errores = [];

  if (!repositorio.includes("function obtenerIdsItemsPedidoSupabase")) {
    errores.push("pedido_items debe leer ids viejos antes de reemplazar items");
  }

  if (repositorio.includes('.from("pedido_items")\n      .delete()\n      .eq("pedido_id", pedidoIdSupabase)')) {
    errores.push("pedido_items no debe borrar todos los items antes de insertar los nuevos");
  }

  const posicionInsertarItems =
    repositorio.indexOf('.from("pedido_items")\n      .insert(itemsSupabase)');
  const posicionBorrarItemsViejos =
    repositorio.lastIndexOf("await borrarItemsPedidoPorIdsSupabase(idsItemsViejos);");

  if (posicionInsertarItems < 0 || posicionBorrarItemsViejos < posicionInsertarItems) {
    errores.push("pedido_items debe insertar nuevos items antes de borrar los viejos");
  }

  if (!app.includes("exportarRespaldoSistema();")) {
    errores.push("restablecimiento local debe generar respaldo antes de borrar");
  }

  if (!respaldo.includes('if (typeof exportarRespaldoSistema === "function")') ||
      !respaldo.includes("exportarRespaldoSistema();\n    }\n\n    aplicarDatosRespaldoSistema(respaldo);")) {
    errores.push("restauracion de respaldo debe exportar el estado actual antes de reemplazar");
  }

  if (!limpiarUsuarios.includes("usuarios_duplicados_respaldo") ||
      !limpiarUsuarios.includes("returning usuario_original_id")) {
    errores.push("limpieza de usuarios duplicados debe respaldar antes de borrar");
  }

  if (errores.length > 0) {
    throw new Error("Proteccion contra perdida de datos incompleta: " + errores.join(" | "));
  }
}

function validarAccesosPublicosYMoviles(raizProyecto) {
  const catalogoPath =
    path.join(raizProyecto, "js", "public", "catalogo-whatsapp.js");
  const repositorioPath =
    path.join(raizProyecto, "js", "database", "supabase-repository.js");
  const mappersPath =
    path.join(raizProyecto, "js", "database", "supabase-mappers.js");
  const sqlCatalogoPath =
    path.join(raizProyecto, "supabase", "sql", "catalogo-publico.sql");
  const vendedoresPath =
    path.join(raizProyecto, "js", "mobile", "vendedores-mobile.js");
  const catalogo =
    fs.readFileSync(catalogoPath, "utf8");
  const repositorio =
    fs.readFileSync(repositorioPath, "utf8");
  const mappers =
    fs.readFileSync(mappersPath, "utf8");
  const sqlCatalogo =
    fs.readFileSync(sqlCatalogoPath, "utf8");
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

  if (!catalogo.includes("guardarPedidoCatalogoEnAdmin") ||
      !catalogo.includes("crearPedidoCatalogoPublicoSupabase") ||
      !repositorio.includes("crear_pedido_catalogo_publico") ||
      !sqlCatalogo.includes("function public.crear_pedido_catalogo_publico") ||
      !sqlCatalogo.includes("grant execute on function public.crear_pedido_catalogo_publico(jsonb) to anon") ||
      !sqlCatalogo.includes("insert into pedidos") ||
      !sqlCatalogo.includes("insert into pedido_items")) {
    errores.push("catalogo publico debe guardar pedidos pendientes en Supabase para que aparezcan en admin");
  }

  if (!catalogo.includes("CLAVE_PEDIDOS_PENDIENTES_CATALOGO") ||
      !catalogo.includes("function guardarPedidoPendienteCatalogoLocal") ||
      !catalogo.includes("function sincronizarPedidosPendientesCatalogo") ||
      !catalogo.includes("await sincronizarPedidosPendientesCatalogo();") ||
      catalogo.includes("Queres abrir WhatsApp igual?")) {
    errores.push("catalogo publico debe dejar pedido pendiente local si Supabase falla y sincronizarlo luego");
  }

  if (!catalogo.includes("let firmaUltimoPedidoCatalogoGuardado") ||
      !catalogo.includes("firmaUltimoPedidoCatalogoGuardado = firma") ||
      !catalogo.includes("firmaPedidoActual === firmaUltimoPedidoCatalogoGuardado") ||
      !catalogo.includes("Este pedido ya estaba guardado. Abriendo WhatsApp")) {
    errores.push("catalogo publico debe evitar doble envio exacto del mismo pedido");
  }

  if (!catalogo.includes("establecerCantidadCarrito") ||
      !catalogo.includes("normalizarCantidadCatalogo") ||
      !catalogo.includes("formatearCantidadCatalogo")) {
    errores.push("catalogo-whatsapp.js debe permitir cantidades editables y seguras");
  }

  if (!catalogo.includes("function catalogoTienePedidoSinEnviar") ||
      !catalogo.includes("pedidoCatalogoConfirmado") ||
      !catalogo.includes('window.addEventListener("beforeunload", advertirSalidaCatalogoConPedido)')) {
    errores.push("catalogo debe advertir antes de cerrar con carrito pendiente");
  }

  if (!catalogo.includes("function actualizarCatalogoAlVolver") ||
      !catalogo.includes("function puedeActualizarCatalogoAlVolver") ||
      !catalogo.includes("catalogoTienePedidoSinEnviar()") ||
      !catalogo.includes('document.addEventListener("visibilitychange", actualizarCatalogoAlVolver)') ||
      !catalogo.includes('window.addEventListener("focus", actualizarCatalogoAlVolver)')) {
    errores.push("catalogo debe refrescar productos online al volver sin pisar carritos abiertos");
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

  if (!vendedores.includes("let pedidoVendedorEnCurso = false") ||
      !vendedores.includes("let cobranzaVendedorEnCurso = false") ||
      !vendedores.includes("pedidoVendedorEnCurso = true") ||
      !vendedores.includes("cobranzaVendedorEnCurso = true")) {
    errores.push("vendedores-mobile.js debe bloquear doble envio de pedido y cobranza");
  }

  if (!vendedores.includes("function vendedorTieneTrabajoSinCerrar") ||
      !vendedores.includes('window.addEventListener("beforeunload", advertirSalidaVendedorConTrabajo)')) {
    errores.push("vendedores debe advertir antes de cerrar con trabajo pendiente");
  }

  if (!vendedores.includes("function actualizarDatosVendedorAlVolver") ||
      !vendedores.includes("function puedeActualizarVendedorAlVolver") ||
      !vendedores.includes("vendedorTieneTrabajoSinCerrar()") ||
      !vendedores.includes('document.addEventListener("visibilitychange", actualizarDatosVendedorAlVolver)') ||
      !vendedores.includes('window.addEventListener("focus", actualizarDatosVendedorAlVolver)')) {
    errores.push("vendedores debe refrescar datos online al volver sin pisar pedidos o cobranzas en curso");
  }

  if (!vendedores.includes("function obtenerMensajeLoginVendedor") ||
      !vendedores.includes("Usuario o clave incorrectos. Pedi al admin que actualice tu clave.")) {
    errores.push("vendedores-mobile.js debe mostrar mensajes claros de login");
  }

  if (!vendedores.includes("CLAVE_BORRADOR_PEDIDO_VENDEDOR") ||
      !vendedores.includes("function guardarBorradorPedidoVendedor") ||
      !vendedores.includes("function restaurarBorradorPedidoVendedor") ||
      !vendedores.includes("limpiarBorradorPedidoVendedor();") ||
      !vendedores.includes('vendedorDom.formaPago.addEventListener("change", guardarBorradorPedidoVendedor)')) {
    errores.push("vendedores-mobile.js debe proteger pedidos en curso con borrador local");
  }

  if (!vendedores.includes("CLAVE_BORRADOR_CLIENTE_VENDEDOR") ||
      !vendedores.includes("function guardarBorradorClienteVendedor") ||
      !vendedores.includes("function restaurarBorradorClienteVendedor") ||
      !vendedores.includes("function limpiarBorradorClienteVendedor")) {
    errores.push("vendedores-mobile.js debe proteger altas rapidas de cliente con borrador local");
  }

  if (!vendedores.includes("function buscarClienteSimilarNuevoClienteVendedor") ||
      !vendedores.includes("confirmarAltaClienteSimilarVendedor(clienteSimilar)")) {
    errores.push("vendedores-mobile.js debe evitar altas duplicadas de clientes desde celular");
  }

  if (errores.length > 0) {
    throw new Error("Accesos publicos/moviles incompletos: " + errores.join(" | "));
  }
}

function validarVariablesEntornoEjemplo(raizProyecto) {
  const envPath =
    path.join(raizProyecto, ".env.example");
  const errores = [];

  if (!fs.existsSync(envPath)) {
    throw new Error("Falta app/.env.example con variables necesarias sin claves reales");
  }

  const env =
    fs.readFileSync(envPath, "utf8");

  [
    "SUPABASE_URL=",
    "SUPABASE_ANON_KEY=",
    "SUPABASE_SERVICE_ROLE_KEY="
  ].forEach(function (variable) {
    if (!env.includes(variable)) {
      errores.push(".env.example debe incluir " + variable.replace("=", ""));
    }
  });

  [
    "aofoacncvivxxwnusboi",
    "sb_publishable_UiKyYc21zsktfi6Mc2t9Sg_2FUQU8_4",
    "sb_secret_"
  ].forEach(function (valorReal) {
    if (env.includes(valorReal)) {
      errores.push(".env.example no debe contener claves reales ni datos del proyecto productivo");
    }
  });

  if (!env.includes("Nunca pegues SUPABASE_SERVICE_ROLE_KEY en archivos frontend")) {
    errores.push(".env.example debe advertir que service_role no va en frontend");
  }

  if (errores.length > 0) {
    throw new Error("Variables de entorno incompletas: " + errores.join(" | "));
  }
}
const archivosJavascript = listarJavascript(jsPath);
const archivosHtml = listarHtml(raiz);

validarVariablesEntornoEjemplo(raiz);
validarSintaxisJavascript(archivosJavascript);

archivosHtml.forEach(function (archivoHtml) {
  const html =
    fs.readFileSync(archivoHtml, "utf8");
  const resumen =
    crearResumenReferencias(html, archivosJavascript);

  fallarSiHayErrores(resumen);
});

validarGuardasDePermisos(raiz);
validarLoginConUsuarioOEmail(raiz);
validarAccesosSupabaseConfirmados(raiz);
validarColumnasSupabase(raiz);
validarDatosIniciales(raiz);
validarPoliticasRlsProduccion(raiz);
validarRetornosCriticos(raiz);
validarEstilosSeparados(raiz);
validarSincronizacionMultiEquipo(raiz);
validarCatalogoPublicoProduccion(raiz);
validarVendedoresMobileProduccion(raiz);
validarRolesYPermisosAdministracion(raiz);
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
validarProteccionContraPerdidaDatos(raiz);
validarAccesosPublicosYMoviles(raiz);

console.log("Sistema verificado OK");
console.log("HTML revisados: " + archivosHtml.length);
console.log("JS revisados: " + archivosJavascript.length);
