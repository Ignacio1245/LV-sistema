let sincronizacionAutomaticaHabilitada = false;
let sincronizacionAutomaticaPausada = false;
const temporizadoresSincronizacion = {};
let tiposSincronizacionPendientes = {};

function cargarSincronizacionPendienteGuardada() {
  const pendientesGuardados =
    dataStore.leerLista("sincronizacionPendiente");

  tiposSincronizacionPendientes =
    pendientesGuardados &&
      typeof pendientesGuardados === "object" &&
      !Array.isArray(pendientesGuardados)
      ? pendientesGuardados
      : {};
}

function guardarSincronizacionPendiente() {
  dataStore.guardarLista(
    "sincronizacionPendiente",
    tiposSincronizacionPendientes
  );
}

function obtenerNombreTipoSincronizacion(tipo) {
  const nombresPorTipo = {
    datosBase: "datos base",
    clientes: "clientes y cuenta corriente",
    productos: "productos",
    pedidos: "pedidos",
    administracion: "usuarios y configuracion"
  };

  return nombresPorTipo[tipo] || tipo;
}

function obtenerTiposSincronizacionPendientes() {
  return Object.keys(tiposSincronizacionPendientes);
}

function obtenerCantidadTiposSincronizacionPendientes() {
  return obtenerTiposSincronizacionPendientes().length;
}

function haySincronizacionPendiente() {
  return obtenerCantidadTiposSincronizacionPendientes() > 0;
}

function obtenerTextoTiposSincronizacionPendientes() {
  return obtenerTiposSincronizacionPendientes()
    .map(obtenerNombreTipoSincronizacion)
    .join(", ");
}

function sincronizacionCompletaEsRiesgosaPorGuardadoLocal(tipo, opciones) {
  const tiposConGuardadoPuntual =
    ["clientes", "productos", "pedidos"];

  return opciones &&
    opciones.origen === "guardadoLocal" &&
    tiposConGuardadoPuntual.includes(tipo);
}

function actualizarBotonPendientesSiExiste() {
  if (typeof actualizarVistaBotonSincronizacionPendiente === "function") {
    actualizarVistaBotonSincronizacionPendiente();
  }
}

function actualizarAvisoSincronizacionPendiente() {
  actualizarBotonPendientesSiExiste();

  if (!haySincronizacionPendiente()) {
    return;
  }

  informarOperacionSupabase(
    "Cambios pendientes de subir: " + obtenerTextoTiposSincronizacionPendientes() + ".",
    "sync-working"
  );
}

function marcarSincronizacionPendiente(tipo) {
  if (!tipo) {
    return;
  }

  tiposSincronizacionPendientes[tipo] = {
    tipo: tipo,
    nombre: obtenerNombreTipoSincronizacion(tipo),
    fechaIso: new Date().toISOString()
  };

  guardarSincronizacionPendiente();
  actualizarAvisoSincronizacionPendiente();
}

function limpiarSincronizacionPendiente(tipo) {
  if (!tipo || !tiposSincronizacionPendientes[tipo]) {
    actualizarBotonPendientesSiExiste();
    return;
  }

  delete tiposSincronizacionPendientes[tipo];
  guardarSincronizacionPendiente();
  actualizarBotonPendientesSiExiste();

  if (haySincronizacionPendiente()) {
    actualizarAvisoSincronizacionPendiente();
    return;
  }

  informarOperacionSupabase(
    "Todos los cambios estan sincronizados con Supabase.",
    "sync-ok"
  );
}

cargarSincronizacionPendienteGuardada();

function crearResultadoCargaSupabase(nombre, cantidad, error) {
  return {
    nombre: nombre,
    cantidad: cantidad,
    error: error ? (error.message || "error desconocido") : ""
  };
}

function obtenerErroresResultadoSupabase(resultado) {
  if (!resultado) {
    return [];
  }

  if (Array.isArray(resultado.errores)) {
    return resultado.errores;
  }

  if (resultado.error) {
    return [resultado.nombre + ": " + resultado.error];
  }

  return [];
}

function haySesionSupabaseParaSincronizar() {
  if (typeof usuarioSupabaseAutenticado !== "function") {
    return true;
  }

  return usuarioSupabaseAutenticado();
}

function pausarSincronizacionAutomatica(accion) {
  sincronizacionAutomaticaPausada = true;

  return Promise.resolve()
    .then(accion)
    .finally(function () {
      sincronizacionAutomaticaPausada = false;
    });
}

function programarSincronizacionAutomatica(tipo, opciones) {
  if (
    !sincronizacionAutomaticaHabilitada ||
    sincronizacionAutomaticaPausada ||
    !haySesionSupabaseParaSincronizar()
  ) {
    return;
  }

  if (sincronizacionCompletaEsRiesgosaPorGuardadoLocal(tipo, opciones)) {
    return;
  }

  clearTimeout(temporizadoresSincronizacion[tipo]);
  marcarSincronizacionPendiente(tipo);

  temporizadoresSincronizacion[tipo] = setTimeout(function () {
    ejecutarSincronizacionAutomatica(tipo);
  }, 700);
}

async function sincronizarTipoLocalConSupabase(tipo) {
  if (tipo === "datosBase") {
    await sincronizarDatosBaseLocalesConSupabase();
  }

  if (tipo === "clientes") {
    await sincronizarClientesLocalesConSupabase();
    await sincronizarCuentaCorrienteLocalConSupabase();
  }

  if (tipo === "productos") {
    await sincronizarProductosLocalesConSupabase();
  }

  if (tipo === "pedidos") {
    await sincronizarPedidosLocalesConSupabase();
  }

  if (tipo === "administracion") {
    await sincronizarAdministracionLocalConSupabase();
  }
}

async function ejecutarSincronizacionAutomatica(tipo) {
  if (!haySesionSupabaseParaSincronizar()) {
    return;
  }

  try {
    await pausarSincronizacionAutomatica(async function () {
      await sincronizarTipoLocalConSupabase(tipo);
    });
    limpiarSincronizacionPendiente(tipo);
  } catch (error) {
    console.warn("No se pudo sincronizar automaticamente " + tipo + ":", error);
    actualizarAvisoSincronizacionPendiente();
  }
}

async function sincronizarCambiosPendientesSupabase() {
  if (!haySesionSupabaseParaSincronizar()) {
    throw new Error("Inicia sesion Supabase para subir pendientes.");
  }

  const tiposPendientes =
    obtenerTiposSincronizacionPendientes();

  if (tiposPendientes.length === 0) {
    return {
      mensaje: "No hay cambios pendientes."
    };
  }

  const tiposSincronizados = [];
  const errores = [];

  await pausarSincronizacionAutomatica(async function () {
    for (const tipo of tiposPendientes) {
      try {
        await sincronizarTipoLocalConSupabase(tipo);
        limpiarSincronizacionPendiente(tipo);
        tiposSincronizados.push(obtenerNombreTipoSincronizacion(tipo));
      } catch (error) {
        errores.push(
          obtenerNombreTipoSincronizacion(tipo) + ": " + (error.message || "error")
        );
      }
    }
  });

  if (errores.length > 0) {
    actualizarAvisoSincronizacionPendiente();
    throw new Error("No se pudieron subir todos los pendientes. " + errores.join(" | "));
  }

  return {
    sincronizados: tiposSincronizados
  };
}

function activarSincronizacionAutomaticaSupabase() {
  if (!haySesionSupabaseParaSincronizar()) {
    sincronizacionAutomaticaHabilitada = false;
    return;
  }

  sincronizacionAutomaticaHabilitada = true;
  actualizarAvisoSincronizacionPendiente();
}

function desactivarSincronizacionAutomaticaSupabase() {
  sincronizacionAutomaticaHabilitada = false;

  Object.keys(temporizadoresSincronizacion).forEach(function (tipo) {
    clearTimeout(temporizadoresSincronizacion[tipo]);
  });
}

function puedeGuardarOperacionEnSupabase() {
  return haySesionSupabaseParaSincronizar();
}

function informarOperacionSupabase(mensaje, tipo) {
  if (typeof actualizarEstadoSincronizacionSupabase === "function") {
    actualizarEstadoSincronizacionSupabase(mensaje, tipo);
  }
}

async function guardarClienteOperacionSupabase(cliente) {
  if (!puedeGuardarOperacionEnSupabase() || !cliente) {
    return null;
  }

  try {
    const clienteGuardado =
      await guardarClienteSupabase(cliente);

    if (clienteGuardado && clienteGuardado.idSupabase) {
      cliente.idSupabase =
        clienteGuardado.idSupabase;
      ejecutarSinProgramarSincronizacion(function () {
        guardarClientes();
      });
    }

    informarOperacionSupabase(
      "Cliente guardado en Supabase: " + cliente.codigo + " - " + cliente.nombre,
      "sync-ok"
    );

    return clienteGuardado;
  } catch (error) {
    console.error("No se pudo guardar cliente en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar cliente en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function eliminarClienteOperacionSupabase(cliente) {
  if (!puedeGuardarOperacionEnSupabase() || !cliente) {
    return false;
  }

  try {
    await eliminarClienteSupabase(cliente);
    informarOperacionSupabase(
      "Cliente eliminado en Supabase: " + cliente.codigo + " - " + cliente.nombre,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar cliente en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar cliente en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function guardarProductoOperacionSupabase(producto) {
  if (!puedeGuardarOperacionEnSupabase() || !producto) {
    return null;
  }

  try {
    const productoGuardado =
      await guardarProductoSupabase(producto);

    if (productoGuardado && productoGuardado.idSupabase) {
      producto.idSupabase =
        productoGuardado.idSupabase;
      ejecutarSinProgramarSincronizacion(function () {
        guardarProductos();
      });
    }

    informarOperacionSupabase(
      "Producto guardado en Supabase: " + producto.codigo + " - " + producto.nombre,
      "sync-ok"
    );

    return productoGuardado;
  } catch (error) {
    console.error("No se pudo guardar producto en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar producto en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function asegurarClientePedidoEnSupabase(pedido) {
  if (!pedido || !pedido.cliente) {
    return null;
  }

  const clienteLocal =
    clientes.find(function (cliente) {
      return cliente.codigo === pedido.cliente.codigo;
    }) || pedido.cliente;

  if (!clienteLocal.idSupabase) {
    await guardarClienteOperacionSupabase(clienteLocal);
  }

  pedido.cliente = {
    ...pedido.cliente,
    idSupabase: clienteLocal.idSupabase
  };

  return clienteLocal;
}

async function asegurarProductosPedidoEnSupabase(pedido) {
  if (!pedido || !Array.isArray(pedido.items)) {
    return;
  }

  for (const item of pedido.items) {
    if (!item.producto) {
      continue;
    }

    const productoLocal =
      productos.find(function (producto) {
        return producto.codigo === item.producto.codigo;
      }) || item.producto;

    if (!productoLocal.idSupabase) {
      await guardarProductoOperacionSupabase(productoLocal);
    }

    item.producto = {
      ...item.producto,
      idSupabase: productoLocal.idSupabase
    };
  }
}

function esErrorNumeroPedidoDuplicado(error) {
  const mensaje =
    String(error && error.message ? error.message : "");

  return error &&
    (error.code === "23505" ||
      mensaje.includes("pedidos_numero") ||
      mensaje.includes("duplicate key"));
}

async function asegurarNumeroPedidoNuevoSupabase(pedido, numeroMinimo) {
  if (!pedido || pedido.idSupabase) {
    return;
  }

  const mayorNumeroOnline =
    await obtenerMayorNumeroPedidoSupabase();
  const numeroActual =
    Number(pedido.numero) || 0;

  pedido.numero =
    Math.max(
      numeroActual,
      Number(numeroMinimo) || 0,
      mayorNumeroOnline + 1
    );
}

async function guardarPedidoSupabaseConReintento(pedido) {
  const maximosIntentos =
    pedido.idSupabase ? 1 : 4;

  for (let intento = 1; intento <= maximosIntentos; intento += 1) {
    try {
      if (!pedido.idSupabase) {
        await asegurarNumeroPedidoNuevoSupabase(pedido, pedido.numero);
        ejecutarSinProgramarSincronizacion(function () {
          guardarPedidos();
        });
      }

      return await guardarPedidoSupabase(pedido);
    } catch (error) {
      if (!esErrorNumeroPedidoDuplicado(error) || pedido.idSupabase || intento === maximosIntentos) {
        throw error;
      }

      pedido.numero =
        (Number(pedido.numero) || 0) + 1;
      ejecutarSinProgramarSincronizacion(function () {
        guardarPedidos();
      });
    }
  }

  return null;
}

async function guardarPedidoOperacionSupabase(pedido) {
  if (!puedeGuardarOperacionEnSupabase() || !pedido) {
    return null;
  }

  try {
    await asegurarClientePedidoEnSupabase(pedido);
    await asegurarProductosPedidoEnSupabase(pedido);

    const pedidoGuardado =
      await guardarPedidoSupabaseConReintento(pedido);

    if (pedidoGuardado && pedidoGuardado.idSupabase) {
      pedido.idSupabase =
        pedidoGuardado.idSupabase;
      pedido.numero =
        pedidoGuardado.numero || pedido.numero;
      ejecutarSinProgramarSincronizacion(function () {
        guardarPedidos();
      });
      renderizarPedidos();
      actualizarMenuPedidos();
      actualizarDashboard();
    }

    informarOperacionSupabase(
      "Pedido guardado en Supabase: #" + (pedido.numero || pedido.id),
      "sync-ok"
    );

    return pedidoGuardado;
  } catch (error) {
    console.error("No se pudo guardar pedido en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar pedido en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function guardarProductosPedidoOperacionSupabase(pedido) {
  if (!puedeGuardarOperacionEnSupabase() || !pedido || !Array.isArray(pedido.items)) {
    return true;
  }

  let productosGuardados =
    true;

  for (const item of pedido.items) {
    if (!item.producto) {
      continue;
    }

    const productoLocal =
      productos.find(function (producto) {
        return producto.codigo === item.producto.codigo;
      });

    if (productoLocal) {
      const productoGuardado =
        await guardarProductoOperacionSupabase(productoLocal);

      if (!productoGuardado) {
        productosGuardados = false;
      }
    }
  }

  return productosGuardados;
}

async function guardarMovimientoCuentaOperacionSupabase(cliente, movimiento) {
  if (!puedeGuardarOperacionEnSupabase() || !cliente || !movimiento) {
    return null;
  }

  try {
    if (!cliente.idSupabase) {
      await guardarClienteOperacionSupabase(cliente);
    }

    if (!cliente.idSupabase) {
      return null;
    }

    const movimientoGuardado =
      await guardarMovimientoCuentaSupabase(cliente, movimiento);

    informarOperacionSupabase(
      "Cuenta corriente guardada en Supabase: " + cliente.codigo + " - " + cliente.nombre,
      "sync-ok"
    );

    return movimientoGuardado;
  } catch (error) {
    console.error("No se pudo guardar cuenta corriente en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar cuenta corriente en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function guardarProveedorPagoOperacionSupabase(pago) {
  if (!puedeGuardarOperacionEnSupabase() || !pago) {
    return null;
  }

  try {
    const pagoGuardado =
      await guardarProveedorPagoSupabase(pago);

    informarOperacionSupabase(
      "Pago de proveedor guardado en Supabase: " + pago.proveedor + " | " + formatearDinero(pago.importe),
      "sync-ok"
    );

    return pagoGuardado;
  } catch (error) {
    console.error("No se pudo guardar pago de proveedor en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar pago de proveedor en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function guardarProveedorOperacionSupabase(proveedor) {
  if (!puedeGuardarOperacionEnSupabase() || !proveedor) {
    return null;
  }

  try {
    const proveedorGuardado =
      await guardarProveedorSupabase(proveedor);

    if (proveedorGuardado && proveedorGuardado.idSupabase) {
      proveedor.idSupabase =
        proveedorGuardado.idSupabase;
      guardarProveedores();
    }

    informarOperacionSupabase(
      "Proveedor guardado en Supabase: " + proveedor.codigo + " - " + proveedor.nombre,
      "sync-ok"
    );

    return proveedorGuardado;
  } catch (error) {
    console.error("No se pudo guardar proveedor en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar proveedor en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function guardarRubroOperacionSupabase(rubro) {
  if (!puedeGuardarOperacionEnSupabase() || !rubro) {
    return null;
  }

  try {
    const rubroGuardado =
      await guardarRubroSupabase(rubro);

    if (rubroGuardado && rubroGuardado.idSupabase) {
      rubro.idSupabase =
        rubroGuardado.idSupabase;
      guardarRubros();
    }

    informarOperacionSupabase(
      "Rubro guardado en Supabase: " + rubro.codigo + " - " + rubro.nombre,
      "sync-ok"
    );

    return rubroGuardado;
  } catch (error) {
    console.error("No se pudo guardar rubro en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar rubro en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function guardarZonaOperacionSupabase(zona) {
  if (!puedeGuardarOperacionEnSupabase() || !zona) {
    return null;
  }

  try {
    const zonaGuardada =
      await guardarZonaSupabase(zona);

    if (zonaGuardada && zonaGuardada.idSupabase) {
      zona.idSupabase =
        zonaGuardada.idSupabase;
      guardarZonas();
    }

    informarOperacionSupabase(
      "Zona guardada en Supabase: " + zona.codigo + " - " + zona.nombre,
      "sync-ok"
    );

    return zonaGuardada;
  } catch (error) {
    console.error("No se pudo guardar zona en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar zona en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function eliminarRubroOperacionSupabase(rubro) {
  if (!puedeGuardarOperacionEnSupabase() || !rubro) {
    return false;
  }

  try {
    await eliminarRubroSupabase(rubro);
    informarOperacionSupabase(
      "Rubro eliminado en Supabase: " + rubro.codigo + " - " + rubro.nombre,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar rubro en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar rubro en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function eliminarZonaOperacionSupabase(zona) {
  if (!puedeGuardarOperacionEnSupabase() || !zona) {
    return false;
  }

  try {
    await eliminarZonaSupabase(zona);
    informarOperacionSupabase(
      "Zona eliminada en Supabase: " + zona.codigo + " - " + zona.nombre,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar zona en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar zona en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function eliminarProveedorOperacionSupabase(proveedor) {
  if (!puedeGuardarOperacionEnSupabase() || !proveedor) {
    return false;
  }

  try {
    await eliminarProveedorSupabase(proveedor);
    informarOperacionSupabase(
      "Proveedor eliminado en Supabase: " + proveedor.codigo + " - " + proveedor.nombre,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar proveedor en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar proveedor en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function guardarAuditoriaOperacionSupabase(registro) {
  if (!puedeGuardarOperacionEnSupabase() || !registro) {
    return null;
  }

  try {
    return await guardarAuditoriaSupabase(registro);
  } catch (error) {
    console.warn("No se pudo guardar auditoria en Supabase:", error);
    return null;
  }
}

async function guardarRolOperacionSupabase(nombreRol) {
  if (!puedeGuardarOperacionEnSupabase() || !nombreRol || !ROLES[nombreRol]) {
    return null;
  }

  try {
    const rolGuardado =
      await guardarRolSupabase(nombreRol, ROLES[nombreRol]);

    informarOperacionSupabase(
      "Rol guardado en Supabase: " + nombreRol,
      "sync-ok"
    );

    return rolGuardado;
  } catch (error) {
    console.error("No se pudo guardar rol en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar rol en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function eliminarRolOperacionSupabase(nombreRol) {
  if (!puedeGuardarOperacionEnSupabase() || !nombreRol) {
    return false;
  }

  try {
    await eliminarRolSupabase(nombreRol);
    informarOperacionSupabase(
      "Rol eliminado en Supabase: " + nombreRol,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar rol en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar rol en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function guardarUsuarioOperacionSupabase(usuario) {
  if (!puedeGuardarOperacionEnSupabase() || !usuario) {
    return null;
  }

  try {
    await guardarRolOperacionSupabase(usuario.rol);

    const usuarioGuardado =
      await guardarUsuarioSupabase(usuario);

    usuario.idSupabase =
      usuarioGuardado.idSupabase;
    usuario.rolIdSupabase =
      usuarioGuardado.rolIdSupabase;
    guardarUsuariosSistema();
    informarOperacionSupabase(
      "Usuario guardado en Supabase: " + usuario.codigo + " - " + usuario.nombre,
      "sync-ok"
    );

    return usuarioGuardado;
  } catch (error) {
    console.error("No se pudo guardar usuario en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar usuario en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function eliminarUsuarioOperacionSupabase(usuario) {
  if (!puedeGuardarOperacionEnSupabase() || !usuario) {
    return false;
  }

  try {
    await eliminarUsuarioSupabase(usuario);
    informarOperacionSupabase(
      "Usuario eliminado en Supabase: " + usuario.codigo + " - " + usuario.nombre,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar usuario en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar usuario en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function guardarVendedorOperacionSupabase(vendedor) {
  if (!puedeGuardarOperacionEnSupabase() || !vendedor) {
    return null;
  }

  try {
    const vendedorGuardado =
      await guardarVendedorSupabase(vendedor);

    if (vendedorGuardado && vendedorGuardado.idSupabase) {
      vendedor.idSupabase =
        vendedorGuardado.idSupabase;
      guardarVendedoresSistema();
    }

    informarOperacionSupabase(
      "Vendedor guardado en Supabase: " + vendedor.codigo + " - " + vendedor.nombre,
      "sync-ok"
    );

    return vendedorGuardado;
  } catch (error) {
    console.error("No se pudo guardar vendedor en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo guardar vendedor en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return null;
  }
}

async function eliminarVendedorOperacionSupabase(vendedor) {
  if (!puedeGuardarOperacionEnSupabase() || !vendedor) {
    return false;
  }

  try {
    await eliminarVendedorSupabase(vendedor);
    informarOperacionSupabase(
      "Vendedor eliminado en Supabase: " + vendedor.codigo + " - " + vendedor.nombre,
      "sync-ok"
    );
    return true;
  } catch (error) {
    console.error("No se pudo eliminar vendedor en Supabase:", error);
    informarOperacionSupabase(
      "No se pudo eliminar vendedor en Supabase: " + (error.message || "error"),
      "sync-error"
    );
    return false;
  }
}

async function cargarTodoDesdeSupabaseAutomatico() {
  if (!haySesionSupabaseParaSincronizar()) {
    return {
      mensaje: "Sin sesion Supabase"
    };
  }

  return pausarSincronizacionAutomatica(async function () {
    const resultado = {
      datosBase: await cargarDatosBaseDesdeSupabase(),
      administracion: await cargarAdministracionDesdeSupabase(),
      clientes: await cargarClientesDesdeSupabase(),
      productos: await cargarProductosDesdeSupabase(),
      pedidos: await cargarPedidosDesdeSupabase(),
      auditoria: await cargarAuditoriaDesdeSupabase()
    };

    resultado.errores = []
      .concat(obtenerErroresResultadoSupabase(resultado.datosBase))
      .concat(obtenerErroresResultadoSupabase(resultado.administracion))
      .concat(obtenerErroresResultadoSupabase(resultado.clientes))
      .concat(obtenerErroresResultadoSupabase(resultado.productos))
      .concat(obtenerErroresResultadoSupabase(resultado.pedidos))
      .concat(obtenerErroresResultadoSupabase(resultado.auditoria));

    return resultado;
  });
}

async function cargarAuditoriaDesdeSupabase() {
  try {
    const auditoriaSupabase =
      await obtenerAuditoriaSupabase();

    auditoria = auditoriaSupabase;
    guardarAuditoria();
    renderizarAuditoria();
    actualizarDashboard();

    return crearResultadoCargaSupabase("auditoria", auditoria.length);
  } catch (error) {
    console.error("Error cargando auditoria desde Supabase:", error);
    return crearResultadoCargaSupabase("auditoria", 0, error);
  }
}

async function cargarProductosDesdeSupabase() {
  try {
    const productosSupabase =
      await obtenerProductosSupabase();

    productos = productosSupabase;
    guardarProductos();
  } catch (error) {
    console.error("Error cargando productos desde Supabase:", error);
    return crearResultadoCargaSupabase("productos", 0, error);
  }

  renderizarProductos();
  renderizarCatalogoProductosPedido();
  actualizarDashboard();
  actualizarStockTotal();
  return crearResultadoCargaSupabase("productos", productos.length);
}

async function cargarClientesDesdeSupabase() {
  try {
    const clientesSupabase =
      await obtenerClientesSupabase();

    clientes = clientesSupabase;

    try {
      const pagosSupabase =
        await cargarPagosClienteDesdeSupabase();

      const pagosPorCliente =
        {};

      pagosSupabase.forEach(function (pago) {
        if (!pago || !pago.clienteIdSupabase) {
          return;
        }

        const observacionPago =
          String(pago.observacion || "");

        if (
          observacionPago.includes("PENDIENTE_COBRANZA_VENDEDOR") ||
          observacionPago.includes("RECHAZADA_COBRANZA_VENDEDOR")
        ) {
          return;
        }

        if (!pagosPorCliente[pago.clienteIdSupabase]) {
          pagosPorCliente[pago.clienteIdSupabase] = [];
        }

        pagosPorCliente[pago.clienteIdSupabase].push({
          codigoPago: pago.codigoPago || null,
          fecha: pago.fecha,
          tipo: pago.observacion || pago.medioPago || "Movimiento de cuenta",
          importe: pago.medioPago === "PAGO_CLIENTE" || pago.medioPago === "NOTA_CREDITO"
            ? -Math.abs(Number(pago.importe) || 0)
            : Math.abs(Number(pago.importe) || 0),
          pedidoIdSupabase: pago.pedidoIdSupabase || null
        });
      });

      clientes.forEach(function (cliente) {
        cliente.historial =
          pagosPorCliente[cliente.idSupabase] || [];
      });
    } catch (errorPagos) {
      console.warn("No se pudo cargar historial de cuenta corriente:", errorPagos);
    }
  } catch (error) {
    console.error("Error cargando clientes desde Supabase:", error);
    return crearResultadoCargaSupabase("clientes", 0, error);
  }

  renderizarClientes();
  renderizarClientesConDeuda();
  guardarClientes();
  actualizarDashboard();
  return crearResultadoCargaSupabase("clientes", clientes.length);
}

async function sincronizarProductosLocalesConSupabase() {
  const productosSincronizados = [];

  for (const producto of productos) {
    const productoGuardado =
      await guardarProductoSupabase(producto);

    productosSincronizados.push({
      ...producto,
      idSupabase: productoGuardado.idSupabase
    });
  }

  productos = productosSincronizados;
  guardarProductos();
  renderizarProductos();
  renderizarCatalogoProductosPedido();
  actualizarDashboard();
  actualizarStockTotal();

  return productos.length;
}

async function sincronizarClientesLocalesConSupabase() {
  const clientesSincronizados = [];

  for (const cliente of clientes) {
    const clienteGuardado =
      await guardarClienteSupabase(cliente);

    clientesSincronizados.push({
      ...cliente,
      idSupabase: clienteGuardado.idSupabase
    });
  }

  clientes = clientesSincronizados;
  guardarClientes();
  renderizarClientes();
  renderizarClientesConDeuda();
  actualizarDashboard();

  return clientes.length;
}

async function cargarPedidosDesdeSupabase() {
  try {
    const pedidosSupabase =
      await obtenerPedidosSupabase();

    pedidos = pedidosSupabase;
  } catch (error) {
    console.error("Error cargando pedidos desde Supabase:", error);
    return crearResultadoCargaSupabase("pedidos", 0, error);
  }

  guardarPedidos();
  renderizarPedidos();
  actualizarMenuPedidos();
  actualizarDashboard();
  return crearResultadoCargaSupabase("pedidos", pedidos.length);
}

async function sincronizarPedidosLocalesConSupabase() {
  const pedidosSincronizados = [];

  for (const pedido of pedidos) {
    const pedidoGuardado =
      await guardarPedidoOperacionSupabase(pedido);

    pedidosSincronizados.push({
      ...pedido,
      idSupabase: pedidoGuardado && pedidoGuardado.idSupabase
        ? pedidoGuardado.idSupabase
        : pedido.idSupabase
    });
  }

  pedidos = pedidosSincronizados;
  guardarPedidos();
  renderizarPedidos();
  actualizarMenuPedidos();
  actualizarDashboard();

  return pedidos.length;
}

async function sincronizarCuentaCorrienteLocalConSupabase() {
  let movimientosSincronizados = 0;

  for (const cliente of clientes) {
    if (!cliente.idSupabase) {
      continue;
    }

    const historial =
      Array.isArray(cliente.historial) ? cliente.historial : [];

    for (const movimiento of historial) {
      await guardarMovimientoCuentaSupabase(cliente, movimiento);
      movimientosSincronizados += 1;
    }
  }

  return movimientosSincronizados;
}

async function cargarPagosClienteDesdeSupabase() {
  try {
    return await obtenerPagosClienteSupabase();
  } catch (error) {
    console.error("Error cargando pagos desde Supabase:", error);
    return [];
  }
}

async function cargarAdministracionDesdeSupabase() {
  const errores = [];

  const leerAdministracion = async function (nombre, accion) {
    try {
      return await accion();
    } catch (error) {
      errores.push(nombre + ": " + (error.message || "error desconocido"));
      console.error("Error cargando " + nombre + " desde Supabase:", error);
      return null;
    }
  };

  const rolesSupabase =
    await leerAdministracion("roles", obtenerRolesSupabase);
  const usuariosSupabase =
    await leerAdministracion("usuarios", obtenerUsuariosSupabase);
  const configuracionSupabase =
    await leerAdministracion("configuracion", obtenerConfiguracionEmpresaSupabase);

  if (Array.isArray(rolesSupabase)) {
    rolesSupabase.forEach(function (rol) {
      ROLES[rol.nombre] =
        typeof obtenerPermisosRolSistema === "function"
          ? obtenerPermisosRolSistema(rol.nombre, rol.permisos)
          : rol.permisos || {};
    });

    if (typeof asegurarPermisosRolesBaseSistema === "function") {
      asegurarPermisosRolesBaseSistema();
    }
  }

  if (Array.isArray(usuariosSupabase)) {
    if (usuariosSupabase.length > 0) {
      usuariosSistema = usuariosSupabase;
    }
  }

  if (configuracionSupabase) {
    Object.assign(CONFIG, configuracionSupabase);
  }

  renderizarConfiguracion();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  aplicarPermisosDeUsuario();

  if (errores.length > 0 && typeof actualizarEstadoSincronizacionSupabase === "function") {
    actualizarEstadoSincronizacionSupabase(
      "Administracion parcialmente cargada. " + errores.join(" | "),
      "sync-error"
    );
  }

  return {
    roles: Array.isArray(rolesSupabase) ? rolesSupabase.length : null,
    usuarios: Array.isArray(usuariosSupabase) ? usuariosSupabase.length : null,
    configuracion: Boolean(configuracionSupabase),
    errores: errores
  };
}

async function sincronizarAdministracionLocalConSupabase() {
  for (const nombreRol of Object.keys(ROLES)) {
    await guardarRolSupabase(nombreRol, ROLES[nombreRol]);
  }

  const usuariosSincronizados = [];

  for (const usuario of usuariosSistema) {
    const usuarioGuardado =
      await guardarUsuarioSupabase(usuario);

    usuariosSincronizados.push(usuarioGuardado);
  }

  const configuracionGuardada =
    await guardarConfiguracionEmpresaSupabase(CONFIG);

  usuariosSistema = usuariosSincronizados;
  Object.assign(CONFIG, configuracionGuardada);

  guardarUsuariosSistema();
  guardarConfiguracion();
  renderizarUsuarioActual();
  renderizarUsuariosSistema();
  renderizarConfiguracion();

  return {
    roles: Object.keys(ROLES).length,
    usuarios: usuariosSistema.length,
    configuracion: true
  };
}

async function cargarDatosBaseDesdeSupabase() {
  try {
    const [
      zonasSupabase,
      rubrosSupabase,
      proveedoresSupabase,
      vendedoresSupabase,
      listasSupabase,
      proveedorPagosSupabase,
      comprasSupabase
    ] = await Promise.all([
      obtenerZonasSupabase(),
      obtenerRubrosSupabase(),
      obtenerProveedoresSupabase(),
      obtenerVendedoresSupabase(),
      obtenerListasPreciosSupabase(),
      obtenerProveedorPagosSupabase(),
      obtenerComprasSupabase()
    ]);

    zonas = zonasSupabase;
    rubros = rubrosSupabase;
    proveedores = proveedoresSupabase;
    vendedoresSistema = vendedoresSupabase;
    listasPrecios = listasSupabase;
    proveedorPagos = proveedorPagosSupabase;
    compras = comprasSupabase;

    guardarZonas();
    guardarRubros();
    guardarProveedores();
    guardarVendedoresSistema();
    guardarListasPrecios();
    guardarProveedorPagos();
    guardarCompras();
    renderizarZonas();
    renderizarRubros();
    renderizarProveedores();
    renderizarVendedores();
    renderizarListasPrecios();
    renderizarPagosProveedores();
    renderizarCompras();
    return {
      zonas: zonasSupabase.length,
      rubros: rubrosSupabase.length,
      proveedores: proveedoresSupabase.length,
      vendedores: vendedoresSupabase.length,
      listasPrecios: listasSupabase.length,
      proveedorPagos: proveedorPagosSupabase.length,
      compras: comprasSupabase.length
    };
  } catch (error) {
    console.error("Error cargando datos base desde Supabase:", error);
    return crearResultadoCargaSupabase("datos base", 0, error);
  }
}

async function sincronizarDatosBaseLocalesConSupabase() {
  const zonasSincronizadas = [];
  const rubrosSincronizados = [];
  const proveedoresSincronizados = [];
  const vendedoresSincronizados = [];
  const listasSincronizadas = [];
  const proveedorPagosSincronizados = [];
  const comprasSincronizadas = [];

  for (const zona of zonas) {
    zonasSincronizadas.push(await guardarZonaSupabase(zona));
  }

  for (const rubro of rubros) {
    rubrosSincronizados.push(await guardarRubroSupabase(rubro));
  }

  for (const proveedor of proveedores) {
    proveedoresSincronizados.push(await guardarProveedorSupabase(proveedor));
  }

  for (const vendedor of vendedoresSistema) {
    vendedoresSincronizados.push(await guardarVendedorSupabase(vendedor));
  }

  for (const lista of listasPrecios) {
    listasSincronizadas.push(await guardarListaPrecioSupabase(lista));
  }

  for (const pago of proveedorPagos) {
    proveedorPagosSincronizados.push(await guardarProveedorPagoSupabase(pago));
  }

  for (const compra of compras) {
    comprasSincronizadas.push(await guardarCompraSupabase(compra));
  }

  zonas = zonasSincronizadas;
  rubros = rubrosSincronizados;
  proveedores = proveedoresSincronizados;
  vendedoresSistema = vendedoresSincronizados;
  listasPrecios = listasSincronizadas;
  proveedorPagos = proveedorPagosSincronizados;
  compras = comprasSincronizadas;

  guardarZonas();
  guardarRubros();
  guardarProveedores();
  guardarVendedoresSistema();
  guardarListasPrecios();
  guardarProveedorPagos();
  guardarCompras();
  renderizarZonas();
  renderizarRubros();
  renderizarProveedores();
  renderizarVendedores();
  renderizarListasPrecios();
  renderizarPagosProveedores();
  renderizarCompras();

  return {
    zonas: zonas.length,
    rubros: rubros.length,
    proveedores: proveedores.length,
    vendedores: vendedoresSistema.length,
    listasPrecios: listasPrecios.length,
    proveedorPagos: proveedorPagos.length,
    compras: compras.length
  };
}
