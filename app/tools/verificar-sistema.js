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

  if (errores.length > 0) {
    throw new Error("Importaciones poco robustas: " + errores.join(" | "));
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
validarCatalogoPublicoProduccion(raiz);
validarVendedoresMobileProduccion(raiz);
validarImportacionesRobustas(raiz);

console.log("Sistema verificado OK");
console.log("HTML revisados: " + archivosHtml.length);
console.log("JS revisados: " + archivosJavascript.length);
